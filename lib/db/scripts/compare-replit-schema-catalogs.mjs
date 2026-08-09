import { pathToFileURL } from "node:url";
import pg from "pg";

const { Client } = pg;

export const REQUIRED_UNIQUE_CONSTRAINTS = Object.freeze([
  {
    name: "tournament_stages_tournament_id_id_unique",
    table: "tournament_stages",
    columns: ["tournament_id", "id"],
    deferrable: false,
    initiallyDeferred: false,
  },
  {
    name: "stage_groups_stage_id_id_unique",
    table: "stage_groups",
    columns: ["stage_id", "id"],
    deferrable: false,
    initiallyDeferred: false,
  },
  {
    name: "stage_participants_tournament_id_id_unique",
    table: "stage_participants",
    columns: ["tournament_id", "id"],
    deferrable: false,
    initiallyDeferred: false,
  },
  {
    name: "matches_tournament_stage_id_id_unique",
    table: "matches",
    columns: ["tournament_id", "stage_id", "id"],
    deferrable: false,
    initiallyDeferred: false,
  },
  {
    name: "stage_participants_stage_seed_unique",
    table: "stage_participants",
    columns: ["stage_id", "stage_seed"],
    deferrable: true,
    initiallyDeferred: true,
  },
  {
    name: "matches_stage_round_number_unique",
    table: "matches",
    columns: ["stage_id", "round", "match_number"],
    deferrable: false,
    initiallyDeferred: false,
  },
  {
    name: "matches_id_stage_id_unique",
    table: "matches",
    columns: ["id", "stage_id"],
    deferrable: false,
    initiallyDeferred: false,
  },
]);

export const REQUIRED_RATE_LIMIT_INDEXES = Object.freeze([
  {
    name: "auth_credential_rate_limits_cleanup_idx",
    columns: ["last_updated_at"],
  },
  {
    name: "auth_credential_rate_limits_blocked_idx",
    columns: ["blocked_until"],
  },
]);

export const REQUIRED_RATE_LIMIT_COLUMNS = Object.freeze([
  { name: "scope_type", type: "text", nullable: false },
  { name: "tournament_id", type: "integer", nullable: false },
  { name: "credential_type", type: "text", nullable: false },
  { name: "source_fingerprint", type: "text", nullable: false },
  {
    name: "window_started_at",
    type: "timestamp with time zone",
    nullable: false,
  },
  { name: "failure_count", type: "integer", nullable: false },
  {
    name: "blocked_until",
    type: "timestamp with time zone",
    nullable: true,
  },
  {
    name: "last_updated_at",
    type: "timestamp with time zone",
    nullable: false,
  },
]);

export const REQUIRED_RATE_LIMIT_CHECKS = Object.freeze([
  {
    name: "auth_credential_rate_limits_scope_type_check",
    definition: "CHECK (scope_type = ANY (ARRAY['tournament'::text, 'source'::text]))",
  },
  {
    name: "auth_credential_rate_limits_credential_type_check",
    definition: "CHECK (credential_type = ANY (ARRAY['organizer'::text, 'viewer'::text, 'support'::text, 'legacy_upgrade'::text]))",
  },
  {
    name: "auth_credential_rate_limits_tournament_id_check",
    definition: "CHECK (tournament_id > 0)",
  },
  {
    name: "auth_credential_rate_limits_failure_count_check",
    definition: "CHECK (failure_count >= 0)",
  },
  {
    name: "auth_credential_rate_limits_source_fingerprint_check",
    definition: "CHECK (length(source_fingerprint) >= 1 AND length(source_fingerprint) <= 128)",
  },
]);

export const REQUIRED_COMPOSITE_FOREIGN_KEYS = Object.freeze([
  { table: "stage_participants", name: "stage_participants_stage_same_tournament_fk", columns: ["tournament_id", "stage_id"], foreignTable: "tournament_stages", foreignColumns: ["tournament_id", "id"], deleteAction: "c" },
  { table: "stage_participants", name: "stage_participants_player_same_tournament_fk", columns: ["tournament_id", "player_id"], foreignTable: "players", foreignColumns: ["tournament_id", "id"], deleteAction: "c" },
  { table: "stage_participants", name: "stage_participants_group_same_stage_fk", columns: ["stage_id", "group_id"], foreignTable: "stage_groups", foreignColumns: ["stage_id", "id"], deleteAction: "a" },
  { table: "stage_participants", name: "stage_participants_source_same_tournament_fk", columns: ["tournament_id", "source_stage_participant_id"], foreignTable: "stage_participants", foreignColumns: ["tournament_id", "id"], deleteAction: "r" },
  { table: "tournaments", name: "tournaments_active_stage_same_tournament_fk", columns: ["id", "active_stage_id"], foreignTable: "tournament_stages", foreignColumns: ["tournament_id", "id"], deleteAction: "a", deferrable: true, initiallyDeferred: true },
  { table: "tournament_stages", name: "tournament_stages_winner_same_tournament_fk", columns: ["tournament_id", "winner_id"], foreignTable: "players", foreignColumns: ["tournament_id", "id"], deleteAction: "a" },
  { table: "tournament_stages", name: "tournament_stages_winner_same_stage_fk", columns: ["id", "winner_id"], foreignTable: "stage_participants", foreignColumns: ["stage_id", "player_id"], deleteAction: "a", deferrable: true, initiallyDeferred: true },
  { table: "matches", name: "matches_stage_same_tournament_fk", columns: ["tournament_id", "stage_id"], foreignTable: "tournament_stages", foreignColumns: ["tournament_id", "id"], deleteAction: "a" },
  { table: "matches", name: "matches_group_same_stage_fk", columns: ["stage_id", "stage_group_id"], foreignTable: "stage_groups", foreignColumns: ["stage_id", "id"], deleteAction: "a" },
  { table: "matches", name: "matches_player1_same_stage_fk", columns: ["stage_id", "player1_id"], foreignTable: "stage_participants", foreignColumns: ["stage_id", "player_id"], deleteAction: "a" },
  { table: "matches", name: "matches_player2_same_stage_fk", columns: ["stage_id", "player2_id"], foreignTable: "stage_participants", foreignColumns: ["stage_id", "player_id"], deleteAction: "a" },
  { table: "matches", name: "matches_winner_same_stage_fk", columns: ["stage_id", "winner_id"], foreignTable: "stage_participants", foreignColumns: ["stage_id", "player_id"], deleteAction: "a" },
  { table: "matches", name: "matches_player1_same_tournament_fk", columns: ["tournament_id", "player1_id"], foreignTable: "players", foreignColumns: ["tournament_id", "id"], deleteAction: "a" },
  { table: "matches", name: "matches_player2_same_tournament_fk", columns: ["tournament_id", "player2_id"], foreignTable: "players", foreignColumns: ["tournament_id", "id"], deleteAction: "a" },
  { table: "matches", name: "matches_winner_same_tournament_fk", columns: ["tournament_id", "winner_id"], foreignTable: "players", foreignColumns: ["tournament_id", "id"], deleteAction: "a" },
  { table: "matches", name: "matches_next_match_same_stage_fk", columns: ["next_match_id", "stage_id"], foreignTable: "matches", foreignColumns: ["id", "stage_id"], deleteAction: "a" },
  { table: "action_log", name: "action_log_stage_same_tournament_fk", columns: ["tournament_id", "stage_id"], foreignTable: "tournament_stages", foreignColumns: ["tournament_id", "id"], deleteAction: "n", setNullColumns: ["stage_id"] },
  { table: "action_log", name: "action_log_match_same_tournament_stage_fk", columns: ["tournament_id", "stage_id", "match_id"], foreignTable: "matches", foreignColumns: ["tournament_id", "stage_id", "id"], deleteAction: "n", setNullColumns: ["stage_id", "match_id"] },
  { table: "result_history", name: "result_history_match_same_stage_fk", columns: ["match_id", "stage_id"], foreignTable: "matches", foreignColumns: ["id", "stage_id"], deleteAction: "a" },
  { table: "result_history", name: "result_history_match_same_tournament_stage_fk", columns: ["tournament_id", "stage_id", "match_id"], foreignTable: "matches", foreignColumns: ["tournament_id", "stage_id", "id"], deleteAction: "c" },
]);

function required(env, name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function parseDatabaseUrl(rawValue, variableName) {
  let parsed;
  try {
    parsed = new URL(rawValue);
  } catch {
    throw new Error(`${variableName} must be a valid PostgreSQL URL.`);
  }
  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new Error(`${variableName} must use postgres:// or postgresql://.`);
  }
  if (!parsed.pathname || parsed.pathname === "/") {
    throw new Error(`${variableName} must include a database name.`);
  }
  return parsed;
}

function targetFingerprint(url) {
  return `${url.hostname.toLowerCase()}:${url.port || "5432"}${url.pathname}`;
}

export function loadSchemaCatalogComparisonConfig(env = process.env) {
  const developmentDatabaseUrl = required(
    env,
    "SCHEMA_COMPARE_DEVELOPMENT_DATABASE_URL",
  );
  const productionDatabaseUrl = required(
    env,
    "SCHEMA_COMPARE_PRODUCTION_DATABASE_URL",
  );
  const expectedDevelopmentDatabase = required(
    env,
    "SCHEMA_COMPARE_EXPECTED_DEVELOPMENT_DATABASE_NAME",
  );
  const expectedProductionDatabase = required(
    env,
    "SCHEMA_COMPARE_EXPECTED_PRODUCTION_DATABASE_NAME",
  );
  const expectedSchema = required(
    env,
    "SCHEMA_COMPARE_EXPECTED_SCHEMA",
  );

  if (expectedSchema !== "public") {
    throw new Error("SCHEMA_COMPARE_EXPECTED_SCHEMA must equal public.");
  }
  if (expectedDevelopmentDatabase === expectedProductionDatabase) {
    throw new Error("Development and Production database names must differ.");
  }

  const developmentUrl = parseDatabaseUrl(
    developmentDatabaseUrl,
    "SCHEMA_COMPARE_DEVELOPMENT_DATABASE_URL",
  );
  const productionUrl = parseDatabaseUrl(
    productionDatabaseUrl,
    "SCHEMA_COMPARE_PRODUCTION_DATABASE_URL",
  );
  if (targetFingerprint(developmentUrl) === targetFingerprint(productionUrl)) {
    throw new Error("Development and Production URLs must target different databases.");
  }

  return {
    development: {
      label: "development",
      databaseUrl: developmentDatabaseUrl,
      expectedDatabase: expectedDevelopmentDatabase,
    },
    production: {
      label: "production",
      databaseUrl: productionDatabaseUrl,
      expectedDatabase: expectedProductionDatabase,
    },
    expectedSchema,
  };
}

function sameArray(actual, expected) {
  return actual.length === expected.length &&
    actual.every((value, index) => value === expected[index]);
}

function normalizedCatalog(catalog) {
  return {
    uniqueConstraints: catalog.uniqueConstraints,
    rateLimitTable: catalog.rateLimitTable,
    rateLimitColumns: catalog.rateLimitColumns,
    rateLimitPrimaryKey: catalog.rateLimitPrimaryKey,
    rateLimitChecks: catalog.rateLimitChecks,
    rateLimitIndexes: catalog.rateLimitIndexes,
    compositeForeignKeys: catalog.compositeForeignKeys,
    redundantMatchesUniquePresent: catalog.redundantMatchesUniquePresent,
  };
}

export async function inspectSchemaCatalog(
  client,
  target,
  expectedSchema,
  { manageTransaction = true } = {},
) {
  if (manageTransaction) {
    await client.query(
      "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY",
    );
  }
  try {
    await client.query("SET LOCAL statement_timeout = '15s'");
    const metadataResult = await client.query(
      `SELECT current_database() AS database,
              current_setting('transaction_read_only') AS "transactionReadOnly",
              EXISTS (
                SELECT 1 FROM pg_namespace WHERE nspname = $1
              ) AS "schemaExists"`,
      [expectedSchema],
    );
    const metadata = metadataResult.rows[0];
    if (!metadata) throw new Error(`Unable to inspect ${target.label}.`);

    const uniqueResult = await client.query(
      `SELECT
         constraint_row.conname AS name,
         table_row.relname AS table,
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
         constraint_row.condeferred AS "initiallyDeferred",
         constraint_row.convalidated AS validated,
         index_row.indisunique AS "indexUnique",
         index_row.indisvalid AS "indexValid",
         index_row.indisready AS "indexReady"
       FROM pg_constraint constraint_row
       JOIN pg_class table_row ON table_row.oid = constraint_row.conrelid
       JOIN pg_namespace namespace_row
         ON namespace_row.oid = table_row.relnamespace
       JOIN pg_index index_row
         ON index_row.indexrelid = constraint_row.conindid
       WHERE namespace_row.nspname = $1
         AND constraint_row.contype = 'u'
         AND constraint_row.conname = ANY($2::text[])
       ORDER BY constraint_row.conname`,
      [
        expectedSchema,
        REQUIRED_UNIQUE_CONSTRAINTS.map((requirement) => requirement.name),
      ],
    );

    const rateLimitResult = await client.query(
      `SELECT to_regclass(format('%I.auth_credential_rate_limits', $1::text)) IS NOT NULL
         AS present`,
      [expectedSchema],
    );
    const rateLimitPrimaryKeyResult = await client.query(
      `SELECT
         constraint_row.conname AS name,
         ARRAY(
           SELECT attribute_row.attname::text
           FROM unnest(constraint_row.conkey) WITH ORDINALITY
             AS key_column(attribute_number, position)
           JOIN pg_attribute attribute_row
             ON attribute_row.attrelid = constraint_row.conrelid
            AND attribute_row.attnum = key_column.attribute_number
           ORDER BY key_column.position
         ) AS columns,
         constraint_row.convalidated AS validated
       FROM pg_constraint constraint_row
       JOIN pg_class table_row ON table_row.oid = constraint_row.conrelid
       JOIN pg_namespace namespace_row
         ON namespace_row.oid = table_row.relnamespace
       WHERE namespace_row.nspname = $1
         AND table_row.relname = 'auth_credential_rate_limits'
         AND constraint_row.conname = 'auth_credential_rate_limits_scope_pk'
         AND constraint_row.contype = 'p'`,
      [expectedSchema],
    );
    const rateLimitColumnsResult = await client.query(
      `SELECT
         attribute_row.attname AS name,
         format_type(attribute_row.atttypid, attribute_row.atttypmod) AS type,
         NOT attribute_row.attnotnull AS nullable
       FROM pg_attribute attribute_row
       JOIN pg_class table_row ON table_row.oid = attribute_row.attrelid
       JOIN pg_namespace namespace_row
         ON namespace_row.oid = table_row.relnamespace
       WHERE namespace_row.nspname = $1
         AND table_row.relname = 'auth_credential_rate_limits'
         AND attribute_row.attnum > 0
         AND NOT attribute_row.attisdropped
       ORDER BY attribute_row.attnum`,
      [expectedSchema],
    );
    const rateLimitChecksResult = await client.query(
      `SELECT constraint_row.conname AS name,
              constraint_row.convalidated AS validated,
              pg_get_constraintdef(constraint_row.oid, true) AS definition
       FROM pg_constraint constraint_row
       JOIN pg_class table_row ON table_row.oid = constraint_row.conrelid
       JOIN pg_namespace namespace_row
         ON namespace_row.oid = table_row.relnamespace
       WHERE namespace_row.nspname = $1
         AND table_row.relname = 'auth_credential_rate_limits'
         AND constraint_row.contype = 'c'
         AND constraint_row.conname = ANY($2::text[])
       ORDER BY constraint_row.conname`,
      [expectedSchema, REQUIRED_RATE_LIMIT_CHECKS.map(({ name }) => name)],
    );
    const rateLimitIndexesResult = await client.query(
      `SELECT
         index_class.relname AS name,
         ARRAY(
           SELECT attribute_row.attname::text
           FROM unnest(index_row.indkey::smallint[]) WITH ORDINALITY
             AS index_column(attribute_number, position)
           JOIN pg_attribute attribute_row
             ON attribute_row.attrelid = index_row.indrelid
            AND attribute_row.attnum = index_column.attribute_number
           WHERE index_column.position <= index_row.indnkeyatts
           ORDER BY index_column.position
         ) AS columns,
         index_row.indisunique AS unique,
         index_row.indisvalid AS valid,
         index_row.indisready AS ready,
         index_row.indpred IS NOT NULL AS partial,
         index_row.indexprs IS NOT NULL AS expressions
       FROM pg_class index_class
       JOIN pg_namespace namespace_row
         ON namespace_row.oid = index_class.relnamespace
       JOIN pg_index index_row ON index_row.indexrelid = index_class.oid
       JOIN pg_class table_row ON table_row.oid = index_row.indrelid
       WHERE namespace_row.nspname = $1
         AND table_row.relname = 'auth_credential_rate_limits'
         AND index_class.relname = ANY($2::text[])
       ORDER BY index_class.relname`,
      [
        expectedSchema,
        REQUIRED_RATE_LIMIT_INDEXES.map((requirement) => requirement.name),
      ],
    );
    const foreignKeysResult = await client.query(
      `SELECT constraint_row.conname AS name,
              table_row.relname AS table,
              ARRAY(
                SELECT attribute_row.attname::text
                FROM unnest(constraint_row.conkey) WITH ORDINALITY
                  AS key_column(attribute_number, position)
                JOIN pg_attribute attribute_row
                  ON attribute_row.attrelid = constraint_row.conrelid
                 AND attribute_row.attnum = key_column.attribute_number
                ORDER BY key_column.position
              ) AS columns,
              foreign_table_row.relname AS "foreignTable",
              ARRAY(
                SELECT attribute_row.attname::text
                FROM unnest(constraint_row.confkey) WITH ORDINALITY
                  AS key_column(attribute_number, position)
                JOIN pg_attribute attribute_row
                  ON attribute_row.attrelid = constraint_row.confrelid
                 AND attribute_row.attnum = key_column.attribute_number
                ORDER BY key_column.position
              ) AS "foreignColumns",
              constraint_row.confdeltype AS "deleteAction",
              constraint_row.confupdtype AS "updateAction",
              constraint_row.condeferrable AS deferrable,
              constraint_row.condeferred AS "initiallyDeferred",
              ARRAY(
                SELECT attribute_row.attname::text
                FROM unnest(constraint_row.confdelsetcols) WITH ORDINALITY
                  AS key_column(attribute_number, position)
                JOIN pg_attribute attribute_row
                  ON attribute_row.attrelid = constraint_row.conrelid
                 AND attribute_row.attnum = key_column.attribute_number
                ORDER BY key_column.position
              ) AS "setNullColumns",
              support_index.indisunique AS "supportUnique",
              support_index.indisvalid AS "supportValid",
              support_index.indisready AS "supportReady",
              pg_get_constraintdef(constraint_row.oid, true) AS definition,
              constraint_row.convalidated AS validated
       FROM pg_constraint constraint_row
       JOIN pg_class table_row ON table_row.oid = constraint_row.conrelid
       JOIN pg_class foreign_table_row ON foreign_table_row.oid = constraint_row.confrelid
       JOIN pg_namespace namespace_row
         ON namespace_row.oid = table_row.relnamespace
       LEFT JOIN pg_index support_index ON support_index.indexrelid = constraint_row.conindid
       WHERE namespace_row.nspname = $1
         AND constraint_row.contype = 'f'
         AND constraint_row.conname = ANY($2::text[])
       ORDER BY constraint_row.conname`,
      [expectedSchema, REQUIRED_COMPOSITE_FOREIGN_KEYS.map(({ name }) => name)],
    );
    const redundantResult = await client.query(
      `SELECT
         to_regclass(format('%I.matches_stage_id_id_unique', $1::text)) IS NOT NULL
           AS present`,
      [expectedSchema],
    );

    const uniqueConstraints = uniqueResult.rows.map((row) => ({
      name: row.name,
      table: row.table,
      columns: row.columns,
      deferrable: row.deferrable,
      initiallyDeferred: row.initiallyDeferred,
      validated: row.validated,
      indexUnique: row.indexUnique,
      indexValid: row.indexValid,
      indexReady: row.indexReady,
    }));
    const rateLimitPrimaryKey = rateLimitPrimaryKeyResult.rows[0] ?? null;
    const rateLimitColumns = rateLimitColumnsResult.rows;
    const rateLimitChecks = rateLimitChecksResult.rows;
    const rateLimitIndexes = rateLimitIndexesResult.rows;
    const compositeForeignKeys = foreignKeysResult.rows;
    const problems = [];

    if (metadata.database !== target.expectedDatabase) {
      problems.push(
        `${target.label}: current_database() does not match the expected database.`,
      );
    }
    if (metadata.transactionReadOnly !== "on") {
      problems.push(`${target.label}: catalog transaction is not read-only.`);
    }
    if (metadata.schemaExists !== true) {
      problems.push(`${target.label}: schema ${expectedSchema} is missing.`);
    }

    for (const requirement of REQUIRED_UNIQUE_CONSTRAINTS) {
      const actual = uniqueConstraints.find(
        (constraint) => constraint.name === requirement.name,
      );
      if (
        !actual ||
        actual.table !== requirement.table ||
        !sameArray(actual.columns, requirement.columns) ||
        actual.deferrable !== requirement.deferrable ||
        actual.initiallyDeferred !== requirement.initiallyDeferred ||
        actual.validated !== true ||
        actual.indexUnique !== true ||
        actual.indexValid !== true ||
        actual.indexReady !== true
      ) {
        problems.push(
          `${target.label}: UNIQUE constraint ${requirement.name} is missing or incompatible.`,
        );
      }
    }

    if (rateLimitResult.rows[0]?.present !== true) {
      problems.push(
        `${target.label}: auth_credential_rate_limits is missing.`,
      );
    }
    if (
      JSON.stringify(rateLimitColumns) !==
      JSON.stringify(REQUIRED_RATE_LIMIT_COLUMNS)
    ) {
      problems.push(
        `${target.label}: auth_credential_rate_limits columns are incompatible.`,
      );
    }
    if (
      !rateLimitPrimaryKey ||
      !sameArray(rateLimitPrimaryKey.columns, [
        "scope_type",
        "tournament_id",
        "credential_type",
        "source_fingerprint",
      ]) ||
      rateLimitPrimaryKey.validated !== true
    ) {
      problems.push(
        `${target.label}: auth_credential_rate_limits_scope_pk is missing or incompatible.`,
      );
    }
    for (const requirement of REQUIRED_RATE_LIMIT_INDEXES) {
      const actual = rateLimitIndexes.find(
        (index) => index.name === requirement.name,
      );
      if (
        !actual ||
        !sameArray(actual.columns, requirement.columns) ||
        actual.unique !== false ||
        actual.valid !== true ||
        actual.ready !== true ||
        actual.partial !== false ||
        actual.expressions !== false
      ) {
        problems.push(
          `${target.label}: index ${requirement.name} is missing or incompatible.`,
        );
      }
    }
    const rateLimitCheckMap = new Map(
      rateLimitChecks.map((constraint) => [constraint.name, constraint]),
    );
    for (const requirement of REQUIRED_RATE_LIMIT_CHECKS) {
      const actual = rateLimitCheckMap.get(requirement.name);
      if (
        actual?.validated !== true ||
        actual?.definition !== requirement.definition
      ) {
        problems.push(
          `${target.label}: check constraint ${requirement.name} is missing or incompatible.`,
        );
      }
    }

    const foreignKeyMap = new Map(
      compositeForeignKeys.map((foreignKey) => [foreignKey.name, foreignKey]),
    );
    for (const requirement of REQUIRED_COMPOSITE_FOREIGN_KEYS) {
      const actual = foreignKeyMap.get(requirement.name);
      if (
        !actual ||
        actual.table !== requirement.table ||
        !sameArray(actual.columns, requirement.columns) ||
        actual.foreignTable !== requirement.foreignTable ||
        !sameArray(actual.foreignColumns, requirement.foreignColumns) ||
        actual.deleteAction !== requirement.deleteAction ||
        actual.updateAction !== "a" ||
        actual.deferrable !== (requirement.deferrable === true) ||
        actual.initiallyDeferred !== (requirement.initiallyDeferred === true) ||
        !sameArray(actual.setNullColumns ?? [], requirement.setNullColumns ?? []) ||
        actual.validated !== true ||
        actual.supportUnique !== true ||
        actual.supportValid !== true ||
        actual.supportReady !== true
      ) {
        problems.push(
          `${target.label}: composite FK ${requirement.name} is missing or incompatible.`,
        );
      }
    }
    if (redundantResult.rows[0]?.present === true) {
      problems.push(
        `${target.label}: redundant matches_stage_id_id_unique remains.`,
      );
    }

    const catalog = {
      uniqueConstraints,
      rateLimitTable: rateLimitResult.rows[0]?.present === true,
      rateLimitColumns,
      rateLimitPrimaryKey,
      rateLimitChecks,
      rateLimitIndexes,
      compositeForeignKeys,
      redundantMatchesUniquePresent:
        redundantResult.rows[0]?.present === true,
    };
    return {
      target: {
        label: target.label,
        database: metadata.database,
        schema: expectedSchema,
        transactionReadOnly: metadata.transactionReadOnly,
      },
      safe: problems.length === 0,
      problems,
      catalog: normalizedCatalog(catalog),
    };
  } finally {
    if (manageTransaction) await client.query("ROLLBACK");
  }
}

export async function compareReplitSchemaCatalogs(config) {
  const developmentClient = new Client({
    connectionString: config.development.databaseUrl,
  });
  const productionClient = new Client({
    connectionString: config.production.databaseUrl,
  });
  await developmentClient.connect();
  await productionClient.connect();
  try {
    const development = await inspectSchemaCatalog(
      developmentClient,
      config.development,
      config.expectedSchema,
    );
    const production = await inspectSchemaCatalog(
      productionClient,
      config.production,
      config.expectedSchema,
    );
    const equivalent =
      JSON.stringify(development.catalog) ===
      JSON.stringify(production.catalog);
    return {
      safe: development.safe && production.safe && equivalent,
      equivalent,
      development,
      production,
    };
  } finally {
    await Promise.allSettled([
      developmentClient.end(),
      productionClient.end(),
    ]);
  }
}

async function main() {
  const report = await compareReplitSchemaCatalogs(
    loadSchemaCatalogComparisonConfig(),
  );
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.safe) process.exitCode = 2;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
