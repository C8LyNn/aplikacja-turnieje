import {
  ADVISORY_LOCK_KEYS,
  DELETE_CONFIRMATION,
  DEVELOPMENT_DELETE_CONFIRMATION,
  DEVELOPMENT_ENVIRONMENT,
  DOMAIN_INDEXES,
  DOMAIN_SEQUENCES,
  DOMAIN_TABLES,
  DOMAIN_TYPES,
  EXPECTED_MARKER_COLUMNS,
  LEGACY_COLUMN_SIGNATURE,
  MARKER_TABLE,
  MIGRATION_KEY,
  PRODUCTION_ENVIRONMENT,
  RESET_OBJECTS,
  SERIES_V1_COLUMN_SIGNATURE,
  TARGET_SCHEMA,
  assertMigrationMatchesResetPlan,
  displayName,
  qualify,
} from "./series-v1-reset-plan.mjs";

export class UnsafeSeriesV1ResetError extends Error {
  constructor(message, report) {
    super(message);
    this.name = "UnsafeSeriesV1ResetError";
    this.report = report;
  }
}

function requireValue(env, name) {
  const value = env[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} is required and cannot be empty.`);
  }
  return value.trim();
}

function loadTargetConfig(env, names, requiredEnvironment) {
  const expectedDatabaseName = requireValue(env, names.expectedDatabaseName);
  const expectedSchema = requireValue(env, names.expectedSchema);
  const expectedEnvironment = requireValue(env, names.expectedEnvironment);
  const deploymentEnvironment = requireValue(env, names.deploymentEnvironment);
  const databaseUrl = requireValue(env, names.databaseUrl);

  if (expectedSchema !== TARGET_SCHEMA) {
    throw new Error(
      `${names.expectedSchema} must equal ${TARGET_SCHEMA} for this cutover.`,
    );
  }
  if (expectedEnvironment !== requiredEnvironment) {
    throw new Error(
      `${names.expectedEnvironment} must equal ${requiredEnvironment}.`,
    );
  }
  if (deploymentEnvironment !== expectedEnvironment) {
    throw new Error(
      "DEPLOYMENT_ENVIRONMENT does not match EXPECTED_DEPLOYMENT_ENVIRONMENT.",
    );
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }
  if (parsedUrl.protocol !== "postgres:" && parsedUrl.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must use the postgres or postgresql protocol.");
  }
  const urlDatabaseName = decodeURIComponent(parsedUrl.pathname.replace(/^\//, ""));
  if (!urlDatabaseName) {
    throw new Error("DATABASE_URL must identify a database.");
  }
  if (urlDatabaseName !== expectedDatabaseName) {
    throw new Error(
      `${names.databaseUrl} identifies database ${urlDatabaseName}, expected ${expectedDatabaseName}.`,
    );
  }

  return {
    databaseUrl,
    safeHost: parsedUrl.hostname,
    urlDatabaseName,
    expectedDatabaseName,
    expectedSchema,
    expectedEnvironment,
    deploymentEnvironment,
  };
}

export function loadPreflightConfig(env = process.env) {
  return loadTargetConfig(env, {
    expectedDatabaseName: "EXPECTED_DATABASE_NAME",
    expectedSchema: "EXPECTED_DATABASE_SCHEMA",
    expectedEnvironment: "EXPECTED_DEPLOYMENT_ENVIRONMENT",
    deploymentEnvironment: "DEPLOYMENT_ENVIRONMENT",
    databaseUrl: "DATABASE_URL",
  }, PRODUCTION_ENVIRONMENT);
}

export function loadDevelopmentDeploymentPreflightConfig(env = process.env) {
  return loadTargetConfig(env, {
    expectedDatabaseName: "EXPECTED_DATABASE_NAME",
    expectedSchema: "EXPECTED_DATABASE_SCHEMA",
    expectedEnvironment: "EXPECTED_DEPLOYMENT_ENVIRONMENT",
    deploymentEnvironment: "DEPLOYMENT_ENVIRONMENT",
    databaseUrl: "DEVELOPMENT_DATABASE_URL",
  }, DEVELOPMENT_ENVIRONMENT);
}

export function loadDestructiveResetConfig(env = process.env) {
  // Keep all operator confirmations ahead of URL parsing and any connection.
  if (env.ALLOW_DESTRUCTIVE_TOURNAMENT_RESET !== "true") {
    throw new Error(
      "Refusing destructive tournament reset. Set ALLOW_DESTRUCTIVE_TOURNAMENT_RESET=true explicitly.",
    );
  }
  if (env.CONFIRM_TOURNAMENT_DATA_DELETION !== DELETE_CONFIRMATION) {
    throw new Error(
      `CONFIRM_TOURNAMENT_DATA_DELETION must equal ${DELETE_CONFIRMATION}.`,
    );
  }

  const config = loadPreflightConfig(env);
  const appCommit = requireValue(env, "APP_COMMIT");
  if (!/^[A-Za-z0-9._-]{7,128}$/.test(appCommit)) {
    throw new Error("APP_COMMIT has an invalid format.");
  }
  return { ...config, appCommit };
}

export function loadDevelopmentPreflightConfig(env = process.env) {
  return loadTargetConfig(env, {
    expectedDatabaseName: "EXPECTED_DEVELOPMENT_DATABASE_NAME",
    expectedSchema: "EXPECTED_DEVELOPMENT_DATABASE_SCHEMA",
    expectedEnvironment: "EXPECTED_DEVELOPMENT_ENVIRONMENT",
    deploymentEnvironment: "DEVELOPMENT_ENVIRONMENT",
    databaseUrl: "DEVELOPMENT_DATABASE_URL",
  }, DEVELOPMENT_ENVIRONMENT);
}

export function loadDevelopmentDestructiveResetConfig(env = process.env) {
  if (env.ALLOW_DESTRUCTIVE_DEVELOPMENT_TOURNAMENT_RESET !== "true") {
    throw new Error(
      "Refusing destructive Development tournament reset. Set ALLOW_DESTRUCTIVE_DEVELOPMENT_TOURNAMENT_RESET=true explicitly.",
    );
  }
  if (
    env.CONFIRM_DEVELOPMENT_TOURNAMENT_DATA_DELETION
    !== DEVELOPMENT_DELETE_CONFIRMATION
  ) {
    throw new Error(
      `CONFIRM_DEVELOPMENT_TOURNAMENT_DATA_DELETION must equal ${DEVELOPMENT_DELETE_CONFIRMATION}.`,
    );
  }

  const config = loadDevelopmentPreflightConfig(env);
  const appCommit = requireValue(env, "DEVELOPMENT_APP_COMMIT");
  if (!/^[A-Za-z0-9._-]{7,128}$/.test(appCommit)) {
    throw new Error("DEVELOPMENT_APP_COMMIT has an invalid format.");
  }
  return { ...config, appCommit };
}

function hasEveryColumn(columnSet, table, requiredColumns) {
  return requiredColumns.every((column) => columnSet.has(`${table}.${column}`));
}

function uniqueDependencies(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = `${row.dependentType}|${row.dependentObject}|${row.targetObject}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function collectExternalDependencies(client) {
  const params = [TARGET_SCHEMA, DOMAIN_TABLES, DOMAIN_TYPES];

  const foreignKeys = await client.query(
    `SELECT
       'foreign_key' AS "dependentType",
       format('%I.%I constraint %I', dependent_ns.nspname, dependent.relname, con.conname)
         AS "dependentObject",
       format('%I.%I', target_ns.nspname, target.relname) AS "targetObject"
     FROM pg_constraint con
     JOIN pg_class target ON target.oid = con.confrelid
     JOIN pg_namespace target_ns ON target_ns.oid = target.relnamespace
     JOIN pg_class dependent ON dependent.oid = con.conrelid
     JOIN pg_namespace dependent_ns ON dependent_ns.oid = dependent.relnamespace
     WHERE con.contype = 'f'
       AND target_ns.nspname = $1
       AND target.relname = ANY($2::text[])
       AND NOT (
         dependent_ns.nspname = $1
         AND dependent.relname = ANY($2::text[])
       )`,
    params.slice(0, 2),
  );

  const views = await client.query(
    `SELECT DISTINCT
       CASE view_class.relkind WHEN 'm' THEN 'materialized_view' ELSE 'view' END
         AS "dependentType",
       format('%I.%I', view_ns.nspname, view_class.relname) AS "dependentObject",
       format('%I.%I', target_ns.nspname, target.relname) AS "targetObject"
     FROM pg_depend dep
     JOIN pg_rewrite rewrite ON dep.classid = 'pg_rewrite'::regclass
       AND dep.objid = rewrite.oid
     JOIN pg_class view_class ON view_class.oid = rewrite.ev_class
     JOIN pg_namespace view_ns ON view_ns.oid = view_class.relnamespace
     JOIN pg_class target ON dep.refclassid = 'pg_class'::regclass
       AND dep.refobjid = target.oid
     JOIN pg_namespace target_ns ON target_ns.oid = target.relnamespace
     WHERE target_ns.nspname = $1
       AND target.relname = ANY($2::text[])
       AND view_class.relkind IN ('v', 'm')
       AND NOT (
         view_ns.nspname = $1
         AND view_class.relname = ANY($2::text[])
       )`,
    params.slice(0, 2),
  );

  const functions = await client.query(
    `SELECT DISTINCT
       'function' AS "dependentType",
       format('%I.%I(%s)', proc_ns.nspname, proc.proname,
         pg_get_function_identity_arguments(proc.oid)) AS "dependentObject",
       format('%I.%I', type_ns.nspname, target_type.typname) AS "targetObject"
     FROM pg_depend dep
     JOIN pg_proc proc ON dep.classid = 'pg_proc'::regclass
       AND dep.objid = proc.oid
     JOIN pg_namespace proc_ns ON proc_ns.oid = proc.pronamespace
     JOIN pg_type target_type ON dep.refclassid = 'pg_type'::regclass
       AND dep.refobjid = target_type.oid
     JOIN pg_namespace type_ns ON type_ns.oid = target_type.typnamespace
      WHERE type_ns.nspname = $1
        AND target_type.typname = ANY($2::text[])`,
    [params[0], params[2]],
  );

  const enumColumns = await client.query(
    `SELECT DISTINCT
       'table_column' AS "dependentType",
       format('%I.%I.%I', dependent_ns.nspname, dependent.relname, attr.attname)
         AS "dependentObject",
       format('%I.%I', type_ns.nspname, target_type.typname) AS "targetObject"
     FROM pg_depend dep
     JOIN pg_class dependent ON dep.classid = 'pg_class'::regclass
       AND dep.objid = dependent.oid
     JOIN pg_namespace dependent_ns ON dependent_ns.oid = dependent.relnamespace
     JOIN pg_attribute attr ON attr.attrelid = dependent.oid
       AND attr.attnum = dep.objsubid
     JOIN pg_type target_type ON dep.refclassid = 'pg_type'::regclass
       AND dep.refobjid = target_type.oid
     JOIN pg_namespace type_ns ON type_ns.oid = target_type.typnamespace
     WHERE type_ns.nspname = $1
       AND target_type.typname = ANY($3::text[])
       AND dep.objsubid > 0
       AND NOT (
         dependent_ns.nspname = $1
         AND dependent.relname = ANY($2::text[])
       )`,
    params,
  );

  return uniqueDependencies([
    ...foreignKeys.rows,
    ...views.rows,
    ...functions.rows,
    ...enumColumns.rows,
  ]);
}

async function collectDerivedObjects(client) {
  const indexes = await client.query(
    `SELECT format('%I.%I', index_ns.nspname, index_class.relname) AS name
     FROM pg_index idx
     JOIN pg_class table_class ON table_class.oid = idx.indrelid
     JOIN pg_namespace table_ns ON table_ns.oid = table_class.relnamespace
     JOIN pg_class index_class ON index_class.oid = idx.indexrelid
     JOIN pg_namespace index_ns ON index_ns.oid = index_class.relnamespace
     WHERE table_ns.nspname = $1
       AND table_class.relname = ANY($2::text[])
     ORDER BY name`,
    [TARGET_SCHEMA, DOMAIN_TABLES],
  );
  const constraints = await client.query(
    `SELECT format('%I.%I constraint %I', table_ns.nspname, table_class.relname, con.conname)
       AS name
     FROM pg_constraint con
     JOIN pg_class table_class ON table_class.oid = con.conrelid
     JOIN pg_namespace table_ns ON table_ns.oid = table_class.relnamespace
     WHERE table_ns.nspname = $1
       AND table_class.relname = ANY($2::text[])
     ORDER BY name`,
    [TARGET_SCHEMA, DOMAIN_TABLES],
  );
  const sequences = await client.query(
    `SELECT format('%I.%I', sequence_ns.nspname, sequence_class.relname) AS name
     FROM pg_class sequence_class
     JOIN pg_namespace sequence_ns ON sequence_ns.oid = sequence_class.relnamespace
     JOIN pg_depend owned ON owned.classid = 'pg_class'::regclass
       AND owned.objid = sequence_class.oid
       AND owned.refclassid = 'pg_class'::regclass
       AND owned.deptype = 'a'
     JOIN pg_class table_class ON table_class.oid = owned.refobjid
     JOIN pg_namespace table_ns ON table_ns.oid = table_class.relnamespace
     WHERE sequence_class.relkind = 'S'
       AND table_ns.nspname = $1
       AND table_class.relname = ANY($2::text[])
     ORDER BY name`,
    [TARGET_SCHEMA, DOMAIN_TABLES],
  );
  return {
    indexes: indexes.rows.map((row) => row.name),
    constraints: constraints.rows.map((row) => row.name),
    sequences: sequences.rows.map((row) => row.name),
  };
}

export async function collectSeriesV1Preflight(client, config) {
  const metadataResult = await client.query(
    `SELECT current_database() AS database,
            current_schema() AS "currentSchema",
            current_setting('search_path') AS "searchPath",
            EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = $1) AS "targetSchemaExists"`,
    [TARGET_SCHEMA],
  );
  const metadata = metadataResult.rows[0];

  const tableResult = await client.query(
    `SELECT class.relname AS name
     FROM pg_class class
     JOIN pg_namespace ns ON ns.oid = class.relnamespace
     WHERE ns.nspname = $1
       AND class.relname = ANY($2::text[])
       AND class.relkind IN ('r', 'p')
     ORDER BY class.relname`,
    [TARGET_SCHEMA, DOMAIN_TABLES],
  );
  const typeResult = await client.query(
    `SELECT type.typname AS name
     FROM pg_type type
     JOIN pg_namespace ns ON ns.oid = type.typnamespace
     WHERE ns.nspname = $1
       AND type.typname = ANY($2::text[])
     ORDER BY type.typname`,
    [TARGET_SCHEMA, DOMAIN_TYPES],
  );
  const reservedRelationsResult = await client.query(
    `SELECT class.relname AS name, class.relkind AS kind
     FROM pg_class class
     JOIN pg_namespace ns ON ns.oid = class.relnamespace
     WHERE ns.nspname = $1
       AND (
         class.relname = ANY($2::text[])
         OR class.relname = ANY($3::text[])
       )
     ORDER BY class.relname`,
    [TARGET_SCHEMA, DOMAIN_SEQUENCES, DOMAIN_INDEXES],
  );
  const columnResult = await client.query(
    `SELECT table_name AS table, column_name AS column
     FROM information_schema.columns
     WHERE table_schema = $1
       AND table_name = ANY($2::text[])`,
    [TARGET_SCHEMA, DOMAIN_TABLES],
  );

  const existingTables = tableResult.rows.map((row) => row.name);
  const existingTypes = typeResult.rows.map((row) => row.name);
  const columnSet = new Set(
    columnResult.rows.map((row) => `${row.table}.${row.column}`),
  );
  const counts = {};
  for (const table of existingTables) {
    const result = await client.query(
      `SELECT count(*)::text AS count FROM ${qualify(table)}`,
    );
    counts[displayName(table)] = result.rows[0].count;
  }

  const markerRegclass = await client.query(
    "SELECT to_regclass($1) IS NOT NULL AS exists",
    [displayName(MARKER_TABLE)],
  );
  const markerTableExists = markerRegclass.rows[0].exists;
  let markerTableValid = true;
  let marker = null;
  if (markerTableExists) {
    const markerColumns = await client.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = $2`,
      [TARGET_SCHEMA, MARKER_TABLE],
    );
    const names = new Set(markerColumns.rows.map((row) => row.column_name));
    markerTableValid = EXPECTED_MARKER_COLUMNS.every((name) => names.has(name));
    if (markerTableValid) {
      const markerResult = await client.query(
        `SELECT migration_key AS "migrationKey",
                applied_at AS "appliedAt",
                app_commit AS "appCommit",
                target_schema AS "targetSchema",
                deployment_environment AS "deploymentEnvironment"
         FROM ${qualify(MARKER_TABLE)}
         WHERE migration_key = $1`,
        [MIGRATION_KEY],
      );
      marker = markerResult.rows[0] ?? null;
    }
  }

  const hasLegacySignature = Object.entries(LEGACY_COLUMN_SIGNATURE).every(
    ([table, columns]) => hasEveryColumn(columnSet, table, columns),
  );
  const hasSeriesSignature = Object.entries(SERIES_V1_COLUMN_SIGNATURE).every(
    ([table, columns]) => hasEveryColumn(columnSet, table, columns),
  );
  const allDomainTablesExist = DOMAIN_TABLES.every((name) => existingTables.includes(name));
  const reservedObjects = reservedRelationsResult.rows.map((row) => ({
    name: displayName(row.name),
    kind: row.kind,
  }));

  let databaseState;
  if (
    existingTables.length === 0
    && existingTypes.length === 0
    && reservedObjects.length === 0
  ) {
    databaseState = "fresh";
  } else if (allDomainTablesExist && hasLegacySignature && !hasSeriesSignature) {
    databaseState = "legacy";
  } else if (allDomainTablesExist && hasSeriesSignature && !hasLegacySignature) {
    databaseState = "series_v1";
  } else {
    databaseState = "inconsistent";
  }

  const externalDependencies = await collectExternalDependencies(client);
  const derivedObjects = await collectDerivedObjects(client);
  const reasons = [];
  if (metadata.database !== config.expectedDatabaseName) {
    reasons.push(
      `current_database() is ${metadata.database}, expected ${config.expectedDatabaseName}.`,
    );
  }
  if (!metadata.targetSchemaExists) {
    reasons.push(`Target schema ${TARGET_SCHEMA} does not exist.`);
  }
  if (!markerTableValid) {
    reasons.push(`Marker table ${displayName(MARKER_TABLE)} has an unexpected shape.`);
  }
  if (marker) {
    reasons.push(`Migration marker ${MIGRATION_KEY} already exists.`);
  }
  if (databaseState === "series_v1" && !marker) {
    reasons.push("The database is already series_v1 but the migration marker is missing.");
  } else if (databaseState === "inconsistent") {
    reasons.push("The tournament domain is neither a supported legacy schema nor a fresh database.");
  }
  if (externalDependencies.length > 0) {
    reasons.push("Unexpected objects depend on tournament-domain tables or enum types.");
  }

  return {
    safe: reasons.length === 0,
    reasons,
    target: {
      host: config.safeHost,
      database: metadata.database,
      targetSchema: TARGET_SCHEMA,
      currentSchema: metadata.currentSchema,
      searchPath: metadata.searchPath,
      environment: config.deploymentEnvironment,
    },
    databaseState,
    counts,
    marker: {
      table: displayName(MARKER_TABLE),
      tableExists: markerTableExists,
      tableValid: markerTableValid,
      applied: marker,
    },
    externalDependencies,
    existing: {
      tables: existingTables.map((name) => displayName(name)),
      types: existingTypes.map((name) => displayName(name)),
      ...derivedObjects,
    },
    plannedReset: RESET_OBJECTS,
  };
}

export async function runReadOnlyPreflight(client, config) {
  await client.query("BEGIN READ ONLY");
  try {
    const report = await collectSeriesV1Preflight(client, config);
    await client.query("ROLLBACK");
    return report;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserve the original read-only preflight failure.
    }
    throw error;
  }
}

const CREATE_MARKER_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ${qualify(MARKER_TABLE)} (
    migration_key TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    app_commit TEXT NOT NULL,
    target_schema TEXT NOT NULL,
    deployment_environment TEXT NOT NULL
  )
`;

async function verifyCutover(client) {
  const tables = await client.query(
    `SELECT table_name AS name
     FROM information_schema.tables
     WHERE table_schema = $1 AND table_name = ANY($2::text[])
     ORDER BY table_name`,
    [TARGET_SCHEMA, DOMAIN_TABLES],
  );
  const types = await client.query(
    `SELECT type.typname AS name
     FROM pg_type type
     JOIN pg_namespace ns ON ns.oid = type.typnamespace
     WHERE ns.nspname = $1 AND type.typname = ANY($2::text[])
     ORDER BY type.typname`,
    [TARGET_SCHEMA, DOMAIN_TYPES],
  );
  const legacyColumns = await client.query(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = $1
       AND (
         (table_name = 'tournaments' AND column_name = 'allow_draws')
         OR (table_name = 'players' AND column_name = ANY($2::text[]))
       )`,
    [TARGET_SCHEMA, LEGACY_COLUMN_SIGNATURE.players],
  );
  const marker = await client.query(
    `SELECT migration_key AS "migrationKey",
            applied_at AS "appliedAt",
            app_commit AS "appCommit",
            target_schema AS "targetSchema",
            deployment_environment AS "deploymentEnvironment"
     FROM ${qualify(MARKER_TABLE)} WHERE migration_key = $1`,
    [MIGRATION_KEY],
  );

  if (tables.rowCount !== DOMAIN_TABLES.length) {
    throw new Error("Post-reset verification found missing series_v1 tables.");
  }
  if (types.rowCount !== DOMAIN_TYPES.length) {
    throw new Error("Post-reset verification found missing series_v1 enum types.");
  }
  if (legacyColumns.rowCount !== 0) {
    throw new Error("Post-reset verification found legacy scoring columns.");
  }
  if (marker.rowCount !== 1) {
    throw new Error("Post-reset verification did not find exactly one cutover marker.");
  }

  return {
    marker: marker.rows[0],
    tables: tables.rows.map((row) => displayName(row.name)),
    types: types.rows.map((row) => displayName(row.name)),
    legacyColumns: [],
  };
}

export async function performDestructiveSeriesV1Reset({
  client,
  config,
  migrationSql,
  onEvent = () => {},
}) {
  assertMigrationMatchesResetPlan(migrationSql);
  const startedAt = Date.now();
  await client.query("BEGIN");
  try {
    const lockResult = await client.query(
      "SELECT pg_try_advisory_xact_lock($1, $2) AS acquired",
      ADVISORY_LOCK_KEYS,
    );
    if (!lockResult.rows[0].acquired) {
      throw new UnsafeSeriesV1ResetError(
        "Another series_v1 cutover currently holds the advisory lock.",
        null,
      );
    }

    const report = await collectSeriesV1Preflight(client, config);
    const reportWithLock = { ...report, advisoryLock: { acquired: true, keys: ADVISORY_LOCK_KEYS } };
    onEvent({ phase: "preflight", report: reportWithLock });
    if (!report.safe) {
      throw new UnsafeSeriesV1ResetError(
        `Refusing destructive reset: ${report.reasons.join(" ")}`,
        reportWithLock,
      );
    }

    await client.query(CREATE_MARKER_TABLE_SQL);
    await client.query(`LOCK TABLE ${qualify(MARKER_TABLE)} IN EXCLUSIVE MODE`);
    const markerCheck = await client.query(
      `SELECT 1 FROM ${qualify(MARKER_TABLE)} WHERE migration_key = $1`,
      [MIGRATION_KEY],
    );
    if (markerCheck.rowCount !== 0) {
      throw new UnsafeSeriesV1ResetError(
        `Migration marker ${MIGRATION_KEY} already exists.`,
        reportWithLock,
      );
    }

    await client.query(migrationSql);
    await client.query(
      `INSERT INTO ${qualify(MARKER_TABLE)}
        (migration_key, app_commit, target_schema, deployment_environment)
       VALUES ($1, $2, $3, $4)`,
      [MIGRATION_KEY, config.appCommit, TARGET_SCHEMA, config.deploymentEnvironment],
    );

    const verification = await verifyCutover(client);
    onEvent({
      phase: "ready_to_commit",
      target: report.target,
      countsBeforeReset: report.counts,
      externalDependencies: report.externalDependencies,
      advisoryLock: reportWithLock.advisoryLock,
      verification,
      appCommit: config.appCommit,
    });
    await client.query("COMMIT");

    const result = {
      ...verification,
      target: report.target,
      durationMs: Date.now() - startedAt,
      appCommit: config.appCommit,
    };
    onEvent({ phase: "complete", result });
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserve the original reset failure.
    }
    throw error;
  }
}
