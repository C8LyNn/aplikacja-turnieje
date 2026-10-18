import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { after, before, describe, test } from "node:test";
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
const STANDALONE_TRANSACTION_BOUNDARY = /^(?:BEGIN|COMMIT);\r?\n?/gm;
const MIGRATIONS = [
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
  "0011_reconcile_replit_schema_catalog.sql",
  "0012_tournament_routing_persistence_v2.sql",
  "0013_tournament_game_config.sql",
  "0014_deadlock_bans_and_picks.sql",
  "0015_deadlock_game_side.sql",
  "0016_tournament_presentation_settings.sql",
  "0017_double_elimination_engine_v2.sql",
  "0018_tournament_format_add_group_stage_and_de.sql",
  "0019_fix_de_single_stage_trigger.sql",
  "0020_stage_participant_baskets.sql",
] as const;
const REQUIRED_OBJECT_NAMES = [
  "tournament_stages_winner_same_stage_fk",
  "action_log_match_same_tournament_stage_fk",
  "action_log_stage_same_tournament_fk",
  "app_schema_migrations",
] as const;
const DATABASE_NAME_PATTERN = /^tm_drizzle_schema_test_[a-f0-9]{32}$/;
const PG_MODULE_URL = new URL(
  "../../../lib/db/node_modules/pg/lib/index.js",
  import.meta.url,
);
const DRIZZLE_KIT_URL = new URL(
  "../../../lib/db/node_modules/drizzle-kit/bin.cjs",
  import.meta.url,
);
const DB_WORKSPACE_URL = new URL("../../../lib/db/", import.meta.url);
const MIGRATIONS_URL = new URL("../../../lib/db/migrations/", import.meta.url);
const PRODUCTION_GUIDE_URL = new URL(
  "../../../docs/PRODUCTION_SCHEMA_DRIZZLE_RECONCILIATION.md",
  import.meta.url,
);
const execFileAsync = promisify(execFile);

let adminPool: QueryPool;
let testPool: QueryPool;
let databaseName: string;
let createdDatabaseReceipt: CreatedDatabaseReceipt | undefined;
let databaseCreateAttempted = false;
let testConnectionString: string;

function quotedIdentifier(identifier: string): string {
  if (!DATABASE_NAME_PATTERN.test(identifier)) {
    throw new Error("Refusing to use an unsafe schema-diff database name.");
  }
  return `"${identifier}"`;
}

async function migrationSql(name: (typeof MIGRATIONS)[number]): Promise<string> {
  const sql = await readFile(new URL(name, MIGRATIONS_URL), "utf8");
  return sql
    .replace(MIGRATION_RUNNER_TRANSACTION_BLOCK, "")
    .replace(STANDALONE_TRANSACTION_BOUNDARY, "");
}

async function exportCurrentDrizzleSchema(): Promise<string> {
  const { stdout } = await execFileAsync(
    process.execPath,
    [
      fileURLToPath(DRIZZLE_KIT_URL),
      "export",
      "--schema",
      "./src/schema/index.ts",
      "--dialect",
      "postgresql",
    ],
    {
      cwd: fileURLToPath(DB_WORKSPACE_URL),
      timeout: 60_000,
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024,
    },
  );
  return stdout;
}

async function requiredSchemaMetadata() {
  return testPool.query(
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
       foreign_table_row.relname AS foreign_table,
       ARRAY(
         SELECT attribute_row.attname::text
         FROM unnest(constraint_row.confkey) WITH ORDINALITY
           AS key_column(attribute_number, position)
         JOIN pg_attribute attribute_row
           ON attribute_row.attrelid = constraint_row.confrelid
          AND attribute_row.attnum = key_column.attribute_number
         ORDER BY key_column.position
       ) AS foreign_columns,
       ARRAY(
         SELECT attribute_row.attname::text
         FROM unnest(COALESCE(
           constraint_row.confdelsetcols,
           ARRAY[]::smallint[]
         )) WITH ORDINALITY AS key_column(attribute_number, position)
         JOIN pg_attribute attribute_row
           ON attribute_row.attrelid = constraint_row.conrelid
          AND attribute_row.attnum = key_column.attribute_number
         ORDER BY key_column.position
       ) AS set_null_columns,
       constraint_row.confdeltype::text AS delete_action,
       constraint_row.condeferrable AS is_deferrable,
       constraint_row.condeferred AS initially_deferred,
       constraint_row.convalidated AS is_validated
     FROM pg_constraint constraint_row
     JOIN pg_class table_row ON table_row.oid = constraint_row.conrelid
     JOIN pg_class foreign_table_row
       ON foreign_table_row.oid = constraint_row.confrelid
     JOIN pg_namespace namespace_row
       ON namespace_row.oid = table_row.relnamespace
     WHERE namespace_row.nspname = 'public'
       AND constraint_row.conname = ANY($1::text[])
     ORDER BY constraint_row.conname`,
    [[
      "tournament_stages_winner_same_stage_fk",
      "action_log_match_same_tournament_stage_fk",
      "action_log_stage_same_tournament_fk",
    ]],
  );
}

async function targetedSchemaDiff(): Promise<string[]> {
  const duplicate = await testPool.query(
    `SELECT to_regclass(
       'public.matches_stage_id_id_unique'
     )::text AS duplicate_index`,
  );
  return duplicate.rows[0]?.duplicate_index
    ? ['DROP INDEX "public"."matches_stage_id_id_unique";']
    : [];
}

async function applyReplitPushToDisposableDatabase(): Promise<string> {
  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [
      fileURLToPath(DRIZZLE_KIT_URL),
      "push",
      "--config",
      "./drizzle.config.ts",
      "--force",
      "--verbose",
    ],
    {
      cwd: fileURLToPath(DB_WORKSPACE_URL),
      env: {
        ...process.env,
        DATABASE_URL: testConnectionString,
      },
      timeout: 60_000,
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024,
    },
  );
  return `${stdout}\n${stderr}`;
}

async function documentedProductionCleanupSql(): Promise<string> {
  const guide = await readFile(PRODUCTION_GUIDE_URL, "utf8");
  const match = guide.match(/```sql\r?\n(BEGIN;[\s\S]*?COMMIT;)\r?\n```/);
  assert.ok(match, "missing guarded Production cleanup transaction");
  return match[1];
}

before(async () => {
  const config = getSafeTestDatabaseConfig();
  const baseUrl = new URL(config.connectionString);
  if (
    !["127.0.0.1", "localhost", "::1"].includes(
      baseUrl.hostname.toLowerCase(),
    ) ||
    (baseUrl.port || "5432") === "5432"
  ) {
    throw new Error(
      "The Drizzle schema-diff test requires isolated localhost PostgreSQL on a non-default port.",
    );
  }
  baseUrl.searchParams.delete("options");

  const pgModule = (await import(PG_MODULE_URL.href)) as {
    default: { Pool: PoolConstructor };
  };
  adminPool = new pgModule.default.Pool({
    connectionString: baseUrl.toString(),
  });
  databaseName = `tm_drizzle_schema_test_${randomUUID().replaceAll("-", "")}`;
  databaseCreateAttempted = true;
  createdDatabaseReceipt = await createRunDatabase(adminPool, databaseName, DATABASE_NAME_PATTERN);

  const testUrl = new URL(baseUrl);
  testUrl.pathname = `/${databaseName}`;
  testConnectionString = testUrl.toString();
  testPool = new pgModule.default.Pool({
    connectionString: testConnectionString,
  });

  // Recreate the complete forward-only history in a disposable database. The
  // Drizzle declaration is compared with the resulting 0001-0014 catalog; it
  // never initializes this fixture itself.
  await testPool.query("BEGIN");
  try {
    for (const migration of MIGRATIONS) {
      await testPool.query(await migrationSql(migration));
      if (migration === "0018_tournament_format_add_group_stage_and_de.sql") {
        // PostgreSQL requires new enum values to be committed before 0019 can
        // reference them in the single-stage compatibility trigger functions.
        await testPool.query("COMMIT");
        await testPool.query("BEGIN");
      }
    }
    await testPool.query(
      `INSERT INTO public.app_schema_migrations (
         migration_key, app_commit, target_schema, deployment_environment
       ) VALUES ('schema_authority_test', repeat('a', 40), 'public', 'test')`,
    );
    await testPool.query(
      "CREATE UNIQUE INDEX matches_stage_id_id_unique ON public.matches(stage_id, id)",
    );
    await testPool.query("COMMIT");
  } catch (error) {
    await testPool.query("ROLLBACK");
    throw error;
  }
});

after(async () => {
  if (testPool) {
    await testPool.end();
  }
  if (adminPool) {
    try {
      if (databaseCreateAttempted && !createdDatabaseReceipt) {
        throw new Error("WEB005_CLEANUP_HOLD:DRIZZLE_AMBIGUOUS_CREATE_NO_DROP");
      }
      if (createdDatabaseReceipt) {
        await dropRunDatabase(adminPool, createdDatabaseReceipt, DATABASE_NAME_PATTERN);
      }
    } finally {
      await adminPool.end();
    }
  }
});

describe("targeted schema authority diff for the Production state through migration 0014", () => {
  test("recognizes required Production objects and isolates the redundant index", async () => {
    const exportedSchema = await exportCurrentDrizzleSchema();
    for (const name of REQUIRED_OBJECT_NAMES) {
      assert.match(exportedSchema, new RegExp(name));
    }
    assert.match(
      exportedSchema,
      /ON DELETE set null \(stage_id, match_id\)/,
    );
    assert.match(exportedSchema, /ON DELETE set null \(stage_id\)/);
    assert.doesNotMatch(exportedSchema, /matches_stage_id_id_unique/);

    const requiredObjects = await testPool.query(
      `SELECT
         to_regclass('public.app_schema_migrations')::text AS migration_table,
         (
           SELECT count(*)::int
           FROM pg_constraint constraint_row
           JOIN pg_class table_row ON table_row.oid = constraint_row.conrelid
           JOIN pg_namespace namespace_row ON namespace_row.oid = table_row.relnamespace
           WHERE namespace_row.nspname = 'public'
             AND constraint_row.conname = ANY($1::text[])
         ) AS required_foreign_keys`,
      [[
        "tournament_stages_winner_same_stage_fk",
        "action_log_match_same_tournament_stage_fk",
        "action_log_stage_same_tournament_fk",
      ]],
    );
    assert.deepEqual(requiredObjects.rows[0], {
      migration_table: "app_schema_migrations",
      required_foreign_keys: 3,
    });

    const metadata = await requiredSchemaMetadata();
    assert.deepEqual(metadata.rows, [
      {
        name: "action_log_match_same_tournament_stage_fk",
        table_name: "action_log",
        columns: ["tournament_id", "stage_id", "match_id"],
        foreign_table: "matches",
        foreign_columns: ["tournament_id", "stage_id", "id"],
        set_null_columns: ["stage_id", "match_id"],
        delete_action: "n",
        is_deferrable: false,
        initially_deferred: false,
        is_validated: true,
      },
      {
        name: "action_log_stage_same_tournament_fk",
        table_name: "action_log",
        columns: ["tournament_id", "stage_id"],
        foreign_table: "tournament_stages",
        foreign_columns: ["tournament_id", "id"],
        set_null_columns: ["stage_id"],
        delete_action: "n",
        is_deferrable: false,
        initially_deferred: false,
        is_validated: true,
      },
      {
        name: "tournament_stages_winner_same_stage_fk",
        table_name: "tournament_stages",
        columns: ["id", "winner_id"],
        foreign_table: "stage_participants",
        foreign_columns: ["stage_id", "player_id"],
        set_null_columns: [],
        delete_action: "a",
        is_deferrable: true,
        initially_deferred: true,
        is_validated: true,
      },
    ]);

    assert.deepEqual(await targetedSchemaDiff(), [
      'DROP INDEX "public"."matches_stage_id_id_unique";',
    ]);
    const firstPush = await applyReplitPushToDisposableDatabase();
    assert.match(firstPush, /No changes detected/);
    assert.doesNotMatch(
      firstPush,
      /\b(?:CREATE|ALTER|DROP|TRUNCATE)\s+(?:SCHEMA|TABLE|TYPE|SEQUENCE|INDEX|CONSTRAINT)\b/i,
    );
    assert.deepEqual(await targetedSchemaDiff(), [
      'DROP INDEX "public"."matches_stage_id_id_unique";',
    ]);
    const cleanupSql = await documentedProductionCleanupSql();
    await testPool.query(cleanupSql);
    await testPool.query(cleanupSql);
    assert.deepEqual(await targetedSchemaDiff(), []);
    const secondPush = await applyReplitPushToDisposableDatabase();
    assert.match(secondPush, /No changes detected/);
    assert.deepEqual((await requiredSchemaMetadata()).rows, metadata.rows);
    const migrationMarker = await testPool.query(
      `SELECT count(*)::int AS count
       FROM public.app_schema_migrations
       WHERE migration_key = 'schema_authority_test'`,
    );
    assert.deepEqual(migrationMarker.rows[0], { count: 1 });
  });
});
