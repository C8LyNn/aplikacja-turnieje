import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { after, before, test } from "node:test";
import { getSafeTestDatabaseConfig } from "./test-database";
import { createRunDatabase, dropRunDatabase, type CreatedDatabaseReceipt } from "./pg16-test-ownership";

interface QueryPool {
  query: (
    text: string,
    values?: unknown[],
  ) => Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
  end: () => Promise<void>;
}

interface PoolConstructor {
  new (options: { connectionString: string }): QueryPool;
}

const MIGRATION_RUNNER_TRANSACTION_BLOCK =
  /^-- migration-runner-strip-begin\r?\n[\s\S]*?^-- migration-runner-strip-end\r?\n?/gm;
const HISTORY_MIGRATIONS = [
  "0001_series_v1_clean_cutover.sql",
  "0002_tournament_stages_v1.sql",
  "0003_flexible_group_stages_v2.sql",
  "0004_configurable_seeding_v2.sql",
  "0005_stage_participant_flow.sql",
  "0006_fix_multistage_participant_compat.sql",
  "0007_reconcile_stage_schema.sql",
  "0008_restore_stage_procedural_objects.sql",
  "0009_reconcile_composite_foreign_keys.sql",
  "0010_auth_credential_rate_limits.sql",
] as const;
const RECONCILIATION_MIGRATION =
  "0011_reconcile_replit_schema_catalog.sql";
const PG_MODULE_URL = new URL(
  "../../../lib/db/node_modules/pg/lib/index.js",
  import.meta.url,
);
const MIGRATIONS_URL = new URL(
  "../../../lib/db/migrations/",
  import.meta.url,
);
const COMPARISON_SCRIPT_URL = new URL(
  "../../../lib/db/scripts/compare-replit-schema-catalogs.mjs",
  import.meta.url,
);
const execFileAsync = promisify(execFile);

const REFERENCE_UNIQUES = [
  {
    table: "tournament_stages",
    name: "tournament_stages_tournament_id_id_unique",
    columns: ["tournament_id", "id"],
  },
  {
    table: "stage_groups",
    name: "stage_groups_stage_id_id_unique",
    columns: ["stage_id", "id"],
  },
  {
    table: "stage_participants",
    name: "stage_participants_tournament_id_id_unique",
    columns: ["tournament_id", "id"],
  },
  {
    table: "matches",
    name: "matches_tournament_stage_id_id_unique",
    columns: ["tournament_id", "stage_id", "id"],
  },
] as const;

const DATABASE_NAME_PATTERN = /^tm_catalog_test_[a-f0-9]{16}_(dev|prod|fresh)$/;
let adminPool: QueryPool;
let pools: Record<"dev" | "prod" | "fresh", QueryPool>;
let urls: Record<"dev" | "prod" | "fresh", string>;
let databaseNames: Record<"dev" | "prod" | "fresh", string>;
const createdDatabaseReceipts: Partial<Record<"dev" | "prod" | "fresh", CreatedDatabaseReceipt>> = {};

function quoteIdentifier(identifier: string): string {
  if (
    !DATABASE_NAME_PATTERN.test(identifier) &&
    !/^[a-z_][a-z0-9_]*$/.test(identifier)
  ) {
    throw new Error(`Unsafe test identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

async function migrationSql(name: string): Promise<string> {
  return (
    await readFile(new URL(name, MIGRATIONS_URL), "utf8")
  ).replace(MIGRATION_RUNNER_TRANSACTION_BLOCK, "");
}

async function applyHistory(pool: QueryPool): Promise<void> {
  await pool.query("BEGIN");
  try {
    for (const migration of HISTORY_MIGRATIONS) {
      await pool.query(await migrationSql(migration));
    }
    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

async function addFixture(pool: QueryPool, label: string): Promise<void> {
  const tournament = await pool.query(
    `INSERT INTO public.tournaments (
       name, format, status, visibility, default_best_of, organizer_password_hash
     ) VALUES ($1, 'single_elimination', 'draft', 'public_online', 3, $2)
     RETURNING id`,
    [`Catalog ${label}`, `catalog-${label}-organizer-hash`],
  );
  const tournamentId = tournament.rows[0]?.id;
  assert.equal(typeof tournamentId, "number");
  for (let seed = 1; seed <= 2; seed += 1) {
    await pool.query(
      `INSERT INTO public.players (tournament_id, name, seed)
       VALUES ($1, $2, $3)`,
      [tournamentId, `${label} Player ${seed}`, seed],
    );
  }
  const stage = await pool.query(
    `SELECT id
     FROM public.tournament_stages
     WHERE tournament_id = $1 AND position = 1`,
    [tournamentId],
  );
  const participants = await pool.query(
    `SELECT player_id
     FROM public.stage_participants
     WHERE tournament_id = $1
     ORDER BY stage_seed`,
    [tournamentId],
  );
  assert.equal(participants.rows.length, 2);
  await pool.query(
    `INSERT INTO public.matches (
       tournament_id, stage_id, round, match_number,
       player1_id, player2_id, best_of, status
     ) VALUES ($1, $2, 1, 1, $3, $4, 3, 'pending')`,
    [
      tournamentId,
      stage.rows[0]?.id,
      participants.rows[0]?.player_id,
      participants.rows[1]?.player_id,
    ],
  );
  await pool.query(
    `INSERT INTO public.auth_credential_rate_limits (
       scope_type, tournament_id, credential_type, source_fingerprint,
       window_started_at, failure_count, last_updated_at
     ) VALUES ('source', $1, 'organizer', $2, now(), 1, now())`,
    [tournamentId, `fingerprint-${label}`],
  );
}

async function convertConstraintToStandaloneIndex(
  pool: QueryPool,
  spec: (typeof REFERENCE_UNIQUES)[number],
): Promise<void> {
  const dependents = await pool.query(
    `SELECT
       table_row.relname AS table_name,
       constraint_row.conname AS constraint_name,
       pg_get_constraintdef(constraint_row.oid, true) AS definition
     FROM pg_constraint constraint_row
     JOIN pg_class table_row ON table_row.oid = constraint_row.conrelid
     WHERE constraint_row.contype = 'f'
       AND constraint_row.conindid = (
         SELECT owner.conindid
         FROM pg_constraint owner
         WHERE owner.conrelid = $1::regclass
           AND owner.conname = $2
           AND owner.contype = 'u'
       )
     ORDER BY table_row.relname, constraint_row.conname`,
    [`public.${spec.table}`, spec.name],
  );

  for (const dependent of dependents.rows) {
    await pool.query(
      `ALTER TABLE public.${quoteIdentifier(String(dependent.table_name))}
       DROP CONSTRAINT ${quoteIdentifier(String(dependent.constraint_name))}`,
    );
  }
  await pool.query(
    `ALTER TABLE public.${quoteIdentifier(spec.table)}
     DROP CONSTRAINT ${quoteIdentifier(spec.name)}`,
  );
  await pool.query(
    `CREATE UNIQUE INDEX ${quoteIdentifier(spec.name)}
     ON public.${quoteIdentifier(spec.table)}
     (${spec.columns.map(quoteIdentifier).join(", ")})`,
  );
  for (const dependent of dependents.rows) {
    await pool.query(
      `ALTER TABLE public.${quoteIdentifier(String(dependent.table_name))}
       ADD CONSTRAINT ${quoteIdentifier(String(dependent.constraint_name))}
       ${String(dependent.definition)}`,
    );
  }
}

async function createDevelopmentDrift(pool: QueryPool): Promise<void> {
  await pool.query("BEGIN");
  try {
    await pool.query("DROP TABLE public.auth_credential_rate_limits");
    await pool.query(
      `ALTER TABLE public.result_history
         DROP CONSTRAINT result_history_match_same_stage_fk;
       ALTER TABLE public.matches
         DROP CONSTRAINT matches_next_match_same_stage_fk;
       ALTER TABLE public.matches
         DROP CONSTRAINT matches_id_stage_id_unique;
       ALTER TABLE public.matches
         ADD CONSTRAINT matches_stage_id_id_unique
         UNIQUE (stage_id, id);
       ALTER TABLE public.result_history
         ADD CONSTRAINT result_history_match_same_stage_fk
         FOREIGN KEY (stage_id, match_id)
         REFERENCES public.matches(stage_id, id)
         ON UPDATE NO ACTION
         ON DELETE NO ACTION
         NOT DEFERRABLE;
       ALTER TABLE public.matches
         ADD CONSTRAINT matches_id_stage_id_unique
         UNIQUE (id, stage_id);
       ALTER TABLE public.matches
         ADD CONSTRAINT matches_next_match_same_stage_fk
         FOREIGN KEY (next_match_id, stage_id)
         REFERENCES public.matches(id, stage_id)
         ON UPDATE NO ACTION
         ON DELETE NO ACTION
         NOT DEFERRABLE;`,
    );
    const dependency = await pool.query(
      `SELECT
         dependent_constraint.conindid =
           owner_constraint.conindid AS uses_redundant_unique
       FROM pg_constraint dependent_constraint
       JOIN pg_constraint owner_constraint
         ON owner_constraint.conrelid = 'public.matches'::regclass
        AND owner_constraint.conname = 'matches_stage_id_id_unique'
        AND owner_constraint.contype = 'u'
       WHERE dependent_constraint.conrelid =
           'public.result_history'::regclass
         AND dependent_constraint.conname =
           'result_history_match_same_stage_fk'
         AND dependent_constraint.contype = 'f'`,
    );
    assert.deepEqual(dependency.rows[0], {
      uses_redundant_unique: true,
    });
    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

async function createProductionDrift(pool: QueryPool): Promise<void> {
  await pool.query("BEGIN");
  try {
    for (const spec of REFERENCE_UNIQUES) {
      await convertConstraintToStandaloneIndex(pool, spec);
    }
    await pool.query(
      `ALTER TABLE public.stage_participants
         DROP CONSTRAINT stage_participants_stage_seed_unique;
       ALTER TABLE public.stage_participants
         ADD CONSTRAINT stage_participants_stage_seed_unique
         UNIQUE (stage_id, stage_seed);
       ALTER TABLE public.matches
         DROP CONSTRAINT matches_stage_round_number_unique;
       ALTER TABLE public.matches
         ADD CONSTRAINT matches_stage_round_number_unique
         UNIQUE (round, match_number, stage_id);
       ALTER TABLE public.matches
         ADD CONSTRAINT matches_stage_id_id_unique
         UNIQUE (id, stage_id);`,
    );
    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

async function rowCounts(pool: QueryPool): Promise<Record<string, number>> {
  const result = await pool.query(
    `SELECT
       (SELECT count(*)::int FROM public.tournaments) AS tournaments,
       (SELECT count(*)::int FROM public.tournament_stages) AS stages,
       (SELECT count(*)::int FROM public.players) AS players,
       (SELECT count(*)::int FROM public.stage_participants) AS participants,
       (SELECT count(*)::int FROM public.matches) AS matches`,
  );
  return result.rows[0] as Record<string, number>;
}

async function canonicalCatalog(pool: QueryPool) {
  const constraints = await pool.query(
    `SELECT
       constraint_row.conname AS name,
       table_row.relname AS table_name,
       ARRAY(
         SELECT attribute_row.attname::text
         FROM unnest(constraint_row.conkey) WITH ORDINALITY
           AS key_column(attribute_number, position)
         JOIN pg_attribute attribute_row
           ON attribute_row.attrelid = constraint_row.conrelid
          AND attribute_row.attnum = key_column.attribute_number
         ORDER BY key_column.position
       ) AS columns,
       constraint_row.condeferrable AS deferrable,
       constraint_row.condeferred AS initially_deferred,
       constraint_row.convalidated AS validated
     FROM pg_constraint constraint_row
     JOIN pg_class table_row ON table_row.oid = constraint_row.conrelid
     JOIN pg_namespace namespace_row ON namespace_row.oid = table_row.relnamespace
     WHERE namespace_row.nspname = 'public'
       AND constraint_row.conname = ANY($1::text[])
     ORDER BY constraint_row.conname`,
    [[
      ...REFERENCE_UNIQUES.map((spec) => spec.name),
      "stage_participants_stage_seed_unique",
      "matches_stage_round_number_unique",
      "matches_id_stage_id_unique",
    ]],
  );
  const relations = await pool.query(
    `SELECT
       to_regclass('public.auth_credential_rate_limits')::text AS rate_table,
       to_regclass('public.auth_credential_rate_limits_scope_pk')::text AS rate_pk,
       to_regclass('public.auth_credential_rate_limits_cleanup_idx')::text
         AS cleanup_index,
       to_regclass('public.auth_credential_rate_limits_blocked_idx')::text
         AS blocked_index,
       to_regclass('public.matches_stage_id_id_unique')::text
         AS redundant_matches_unique`,
  );
  const compositeForeignKeys = await pool.query(
    `SELECT
       constraint_row.conname AS name,
       table_row.relname AS table_name,
       ARRAY(
         SELECT attribute_row.attname::text
         FROM unnest(constraint_row.conkey) WITH ORDINALITY
           AS key_column(attribute_number, position)
         JOIN pg_attribute attribute_row
           ON attribute_row.attrelid = constraint_row.conrelid
          AND attribute_row.attnum = key_column.attribute_number
         ORDER BY key_column.position
       ) AS columns,
       foreign_table.relname AS foreign_table_name,
       ARRAY(
         SELECT attribute_row.attname::text
         FROM unnest(constraint_row.confkey) WITH ORDINALITY
           AS key_column(attribute_number, position)
         JOIN pg_attribute attribute_row
           ON attribute_row.attrelid = constraint_row.confrelid
          AND attribute_row.attnum = key_column.attribute_number
         ORDER BY key_column.position
       ) AS foreign_columns,
       constraint_row.confupdtype::text AS update_action,
       constraint_row.confdeltype::text AS delete_action,
       constraint_row.condeferrable AS deferrable,
       constraint_row.condeferred AS initially_deferred,
       constraint_row.convalidated AS validated,
       supporting_index.relname AS supporting_index
     FROM pg_constraint
       AS constraint_row
     JOIN pg_class table_row
       ON table_row.oid = constraint_row.conrelid
     JOIN pg_class foreign_table
       ON foreign_table.oid = constraint_row.confrelid
     JOIN pg_class supporting_index
       ON supporting_index.oid = constraint_row.conindid
     WHERE constraint_row.contype = 'f'
       AND constraint_row.conname = ANY($1::text[])
     ORDER BY constraint_row.conname`,
    [[
      "stage_participants_stage_same_tournament_fk",
      "stage_participants_player_same_tournament_fk",
      "stage_participants_group_same_stage_fk",
      "stage_participants_source_same_tournament_fk",
      "tournaments_active_stage_same_tournament_fk",
      "tournament_stages_winner_same_tournament_fk",
      "tournament_stages_winner_same_stage_fk",
      "matches_stage_same_tournament_fk",
      "matches_group_same_stage_fk",
      "matches_player1_same_stage_fk",
      "matches_player2_same_stage_fk",
      "matches_winner_same_stage_fk",
      "matches_player1_same_tournament_fk",
      "matches_player2_same_tournament_fk",
      "matches_winner_same_tournament_fk",
      "matches_next_match_same_stage_fk",
      "action_log_stage_same_tournament_fk",
      "action_log_match_same_tournament_stage_fk",
      "result_history_match_same_stage_fk",
      "result_history_match_same_tournament_stage_fk",
    ]],
  );
  return {
    constraints: constraints.rows,
    relations: relations.rows[0],
    compositeForeignKeys: compositeForeignKeys.rows,
  };
}

async function assertResultHistoryBehavior(pool: QueryPool): Promise<void> {
  await pool.query("BEGIN");
  try {
    const match = await pool.query(
      `SELECT
         match_row.id,
         match_row.tournament_id,
         match_row.stage_id,
         match_row.round,
         match_row.match_number,
         match_row.player1_id,
         match_row.player2_id
       FROM public.matches match_row
       ORDER BY match_row.id
       LIMIT 1`,
    );
    const row = match.rows[0];
    assert.ok(row);
    await pool.query(
      `INSERT INTO public.result_history (
         match_id, tournament_id, stage_id, revision, round, match_number,
         player1_id, player2_id, score1, score2, winner_id, best_of,
         result_type, result_reason, completed_at
       ) VALUES (
         $1, $2, $3, 1, $4, $5, $6, $7, 2, 0, $6, 3,
         'played', NULL, now()
       )`,
      [
        row.id,
        row.tournament_id,
        row.stage_id,
        row.round,
        row.match_number,
        row.player1_id,
        row.player2_id,
      ],
    );
    await pool.query(
      "DELETE FROM public.matches WHERE id = $1",
      [row.id],
    );
    const history = await pool.query(
      "SELECT count(*)::int AS count FROM public.result_history WHERE match_id = $1",
      [row.id],
    );
    assert.deepEqual(history.rows[0], { count: 0 });
  } finally {
    await pool.query("ROLLBACK");
  }
}

before(async () => {
  const config = getSafeTestDatabaseConfig();
  const baseUrl = new URL(config.connectionString);
  baseUrl.searchParams.delete("options");
  if (
    !["127.0.0.1", "localhost", "::1"].includes(baseUrl.hostname) ||
    (baseUrl.port || "5432") === "5432"
  ) {
    throw new Error(
      "Catalog reconciliation tests require isolated localhost PostgreSQL on a non-default port.",
    );
  }

  const pgModule = (await import(PG_MODULE_URL.href)) as {
    default: { Pool: PoolConstructor };
  };
  adminPool = new pgModule.default.Pool({
    connectionString: baseUrl.toString(),
  });
  const suffix = randomUUID().replaceAll("-", "").slice(0, 16);
  databaseNames = {
    dev: `tm_catalog_test_${suffix}_dev`,
    prod: `tm_catalog_test_${suffix}_prod`,
    fresh: `tm_catalog_test_${suffix}_fresh`,
  };
  urls = {} as typeof urls;
  pools = {} as typeof pools;

  for (const label of ["dev", "prod", "fresh"] as const) {
    createdDatabaseReceipts[label] = await createRunDatabase(
      adminPool, databaseNames[label], DATABASE_NAME_PATTERN,
    );
    const url = new URL(baseUrl);
    url.pathname = `/${databaseNames[label]}`;
    urls[label] = url.toString();
    pools[label] = new pgModule.default.Pool({
      connectionString: urls[label],
    });
    await applyHistory(pools[label]);
    await addFixture(pools[label], label);
  }
  await createDevelopmentDrift(pools.dev);
  await createProductionDrift(pools.prod);
});

after(async () => {
  if (pools) {
    await Promise.allSettled(Object.values(pools).map((pool) => pool.end()));
  }
  if (adminPool) {
    try {
      for (const label of ["dev", "prod", "fresh"] as const) {
        await dropRunDatabase(adminPool, createdDatabaseReceipts[label], DATABASE_NAME_PATTERN);
      }
    } finally {
      await adminPool.end();
    }
  }
});

test("unknown dependency aborts the whole Development reconciliation", async () => {
  const beforeCounts = await rowCounts(pools.dev);
  await pools.dev.query(
    `CREATE TABLE public.unexpected_match_reference (
       id integer PRIMARY KEY,
       stage_id integer NOT NULL,
       match_id integer NOT NULL,
       CONSTRAINT unexpected_match_reference_fk
         FOREIGN KEY (stage_id, match_id)
         REFERENCES public.matches(stage_id, id)
         ON UPDATE NO ACTION
         ON DELETE NO ACTION
         NOT DEFERRABLE
     )`,
  );
  const dependency = await pools.dev.query(
    `SELECT
       dependent_constraint.conindid =
         owner_constraint.conindid AS uses_redundant_unique
     FROM pg_constraint dependent_constraint
     JOIN pg_constraint owner_constraint
       ON owner_constraint.conrelid = 'public.matches'::regclass
      AND owner_constraint.conname = 'matches_stage_id_id_unique'
      AND owner_constraint.contype = 'u'
     WHERE dependent_constraint.conrelid =
         'public.unexpected_match_reference'::regclass
       AND dependent_constraint.conname =
         'unexpected_match_reference_fk'
       AND dependent_constraint.contype = 'f'`,
  );
  assert.deepEqual(dependency.rows[0], {
    uses_redundant_unique: true,
  });

  const reconciliationSql = await readFile(
    new URL(RECONCILIATION_MIGRATION, MIGRATIONS_URL),
    "utf8",
  );
  await assert.rejects(
    pools.dev.query(reconciliationSql),
    /unexpected FK public\.unexpected_match_reference\.unexpected_match_reference_fk depends on it/,
  );
  assert.deepEqual(await rowCounts(pools.dev), beforeCounts);
  const rolledBack = await pools.dev.query(
    `SELECT
       to_regclass('public.auth_credential_rate_limits')::text AS rate_table,
       to_regclass('public.matches_stage_id_id_unique')::text
         AS redundant_unique,
       EXISTS (
         SELECT 1
         FROM pg_constraint
         WHERE conrelid = 'public.result_history'::regclass
           AND conname = 'result_history_match_same_stage_fk'
           AND conkey = ARRAY[
             (
               SELECT attnum FROM pg_attribute
               WHERE attrelid = 'public.result_history'::regclass
                 AND attname = 'stage_id'
             ),
             (
               SELECT attnum FROM pg_attribute
               WHERE attrelid = 'public.result_history'::regclass
                 AND attname = 'match_id'
             )
           ]::smallint[]
       ) AS legacy_history_fk_remains`,
  );
  assert.deepEqual(rolledBack.rows[0], {
    rate_table: null,
    redundant_unique: "matches_stage_id_id_unique",
    legacy_history_fk_remains: true,
  });
  await pools.dev.query("DROP TABLE public.unexpected_match_reference");
});

test("reconciles Development, Production and fresh catalogs without data loss", async () => {
  const beforeCounts = {
    dev: await rowCounts(pools.dev),
    prod: await rowCounts(pools.prod),
    fresh: await rowCounts(pools.fresh),
  };
  const reconciliationSql = await readFile(
    new URL(RECONCILIATION_MIGRATION, MIGRATIONS_URL),
    "utf8",
  );

  for (const label of ["dev", "prod", "fresh"] as const) {
    await pools[label].query(reconciliationSql);
    const firstCatalog = await canonicalCatalog(pools[label]);
    await pools[label].query(reconciliationSql);
    assert.deepEqual(await canonicalCatalog(pools[label]), firstCatalog);
    assert.deepEqual(await rowCounts(pools[label]), beforeCounts[label]);
    assert.equal(firstCatalog.constraints.length, 7);
    assert.deepEqual(firstCatalog.relations, {
      rate_table: "auth_credential_rate_limits",
      rate_pk: "auth_credential_rate_limits_scope_pk",
      cleanup_index: "auth_credential_rate_limits_cleanup_idx",
      blocked_index: "auth_credential_rate_limits_blocked_idx",
      redundant_matches_unique: null,
    });
    assert.equal(firstCatalog.compositeForeignKeys.length, 20);
    assert.equal(
      firstCatalog.compositeForeignKeys.every(
        (foreignKey) => foreignKey.validated === true,
      ),
      true,
    );
    assert.deepEqual(
      firstCatalog.compositeForeignKeys.find(
        (foreignKey) =>
          foreignKey.name === "result_history_match_same_stage_fk",
      ),
      {
        name: "result_history_match_same_stage_fk",
        table_name: "result_history",
        columns: ["match_id", "stage_id"],
        foreign_table_name: "matches",
        foreign_columns: ["id", "stage_id"],
        update_action: "a",
        delete_action: "a",
        deferrable: false,
        initially_deferred: false,
        validated: true,
        supporting_index: "matches_id_stage_id_unique",
      },
    );
    assert.deepEqual(
      firstCatalog.compositeForeignKeys.find(
        (foreignKey) =>
          foreignKey.name ===
          "result_history_match_same_tournament_stage_fk",
      ),
      {
        name: "result_history_match_same_tournament_stage_fk",
        table_name: "result_history",
        columns: ["tournament_id", "stage_id", "match_id"],
        foreign_table_name: "matches",
        foreign_columns: ["tournament_id", "stage_id", "id"],
        update_action: "a",
        delete_action: "c",
        deferrable: false,
        initially_deferred: false,
        validated: true,
        supporting_index: "matches_tournament_stage_id_id_unique",
      },
    );
    await assertResultHistoryBehavior(pools[label]);
  }

  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [fileURLToPath(COMPARISON_SCRIPT_URL)],
    {
      env: {
        ...process.env,
        SCHEMA_COMPARE_DEVELOPMENT_DATABASE_URL: urls.dev,
        SCHEMA_COMPARE_PRODUCTION_DATABASE_URL: urls.prod,
        SCHEMA_COMPARE_EXPECTED_DEVELOPMENT_DATABASE_NAME: databaseNames.dev,
        SCHEMA_COMPARE_EXPECTED_PRODUCTION_DATABASE_NAME: databaseNames.prod,
        SCHEMA_COMPARE_EXPECTED_SCHEMA: "public",
      },
      windowsHide: true,
      timeout: 30_000,
      maxBuffer: 5 * 1024 * 1024,
    },
  );
  assert.equal(stderr, "");
  const report = JSON.parse(stdout) as {
    safe: boolean;
    equivalent: boolean;
    development: {
      safe: boolean;
      target: { transactionReadOnly: string };
    };
    production: {
      safe: boolean;
      target: { transactionReadOnly: string };
    };
  };
  assert.equal(report.safe, true);
  assert.equal(report.equivalent, true);
  assert.equal(report.development.safe, true);
  assert.equal(report.production.safe, true);
  assert.equal(report.development.target.transactionReadOnly, "on");
  assert.equal(report.production.target.transactionReadOnly, "on");
});
