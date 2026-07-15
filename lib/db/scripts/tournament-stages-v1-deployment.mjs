import {
  loadDevelopmentDeploymentPreflightConfig,
  loadPreflightConfig,
} from "./series-v1-reset-runtime.mjs";
import {
  DOMAIN_TABLES,
  DOMAIN_TYPES,
  EXPECTED_MARKER_COLUMNS,
  LEGACY_COLUMN_SIGNATURE,
  MIGRATION_KEY as SERIES_V1_MIGRATION_KEY,
  SERIES_V1_COLUMN_SIGNATURE,
  TARGET_SCHEMA,
} from "./series-v1-reset-plan.mjs";

export const TOURNAMENT_STAGES_MIGRATION_KEY = "tournament_stages_v1";
const FULL_GIT_COMMIT = /^[0-9a-f]{40}$/i;

const STAGE_SCHEMA_CHECKS = Object.freeze([
  "hasStages",
  "hasParticipants",
  "hasGroups",
  "hasStageTypes",
  "hasStageSequences",
  "hasActiveStageIndex",
  "matchStageRequired",
  "hasMatchStageGroup",
  "historyStageRequired",
  "hasActionLogStage",
  "hasActiveStagePointer",
  "hasCriticalConstraints",
  "hasCompatibilityFunctions",
  "hasCompatibilityTriggers",
]);

const STAGE_TYPES = Object.freeze([
  "tournament_stage_format",
  "tournament_stage_status",
  "stage_ranking_policy",
  "stage_qualification_mode",
  "stage_seeding_policy",
  "stage_participant_status",
  "stage_qualification_source",
]);

const STAGE_SEQUENCES = Object.freeze([
  "tournament_stages_id_seq",
  "stage_groups_id_seq",
  "stage_participants_id_seq",
]);

const CRITICAL_CONSTRAINTS = Object.freeze([
  "tournaments_active_stage_same_tournament_fk",
  "tournament_stages_winner_same_stage_fk",
  "matches_stage_same_tournament_fk",
  "matches_group_same_stage_fk",
  "matches_player1_same_stage_fk",
  "matches_player2_same_stage_fk",
  "matches_winner_same_stage_fk",
  "matches_next_match_same_stage_fk",
  "result_history_match_same_stage_fk",
  "result_history_match_same_tournament_stage_fk",
  "action_log_stage_same_tournament_fk",
  "action_log_match_same_tournament_stage_fk",
]);

const COMPATIBILITY_FUNCTIONS = Object.freeze([
  "compat_create_single_stage",
  "compat_sync_single_stage_from_tournament",
  "validate_single_stage_lifecycle_alignment",
  "compat_sync_active_stage_pointer",
  "validate_active_stage_pointer",
  "validate_stage_group_configuration",
  "prevent_last_tournament_stage_delete",
  "compat_prepare_single_stage_player_seed",
  "compat_resequence_single_stage_participants",
  "compat_sync_single_stage_participant",
  "compat_count_single_stage_participants_after_delete",
  "compat_assign_single_stage_match",
  "compat_assign_result_history_stage",
  "compat_assign_action_log_stage",
]);

const COMPATIBILITY_TRIGGERS = Object.freeze([
  "tournaments_create_single_stage",
  "tournaments_sync_single_stage",
  "tournaments_validate_single_stage_lifecycle",
  "tournament_stages_sync_active_pointer",
  "tournaments_validate_active_stage_pointer",
  "stage_groups_validate_configuration",
  "tournament_stages_require_at_least_one",
  "players_prepare_single_stage_seed",
  "players_sync_single_stage_participant",
  "players_count_single_stage_after_delete",
  "matches_assign_single_stage",
  "result_history_assign_stage",
  "action_log_assign_stage",
]);

function requireValue(env, name) {
  const value = env[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} is required and cannot be empty.`);
  }
  return value.trim();
}

function hasEveryColumn(columnSet, table, columns) {
  return columns.every((column) => columnSet.has(`${table}.${column}`));
}

function markerMatches(marker, config, expectedAppCommit) {
  return Boolean(
    marker &&
    marker.targetSchema === config.expectedSchema &&
    marker.deploymentEnvironment === config.deploymentEnvironment &&
    (!expectedAppCommit || marker.appCommit === expectedAppCommit),
  );
}

function withValidatedAppCommit(config, env) {
  const appCommit = requireValue(env, "APP_COMMIT");
  if (!FULL_GIT_COMMIT.test(appCommit)) {
    throw new Error(
      "APP_COMMIT must be the full 40-character Git commit hash of the deployed application artifact.",
    );
  }
  return { ...config, appCommit };
}

export function loadTournamentStagesDeploymentConfig(env = process.env) {
  return withValidatedAppCommit(loadPreflightConfig(env), env);
}

export function loadTournamentStagesDevelopmentDeploymentConfig(
  env = process.env,
) {
  const config = loadDevelopmentDeploymentPreflightConfig(env);
  if (config.expectedDatabaseName.toLowerCase() === "neondb") {
    throw new Error(
      "Development Tournament Stages migration must not target the Production database neondb.",
    );
  }
  return withValidatedAppCommit(config, env);
}

export async function inspectTournamentStagesSchema(client, schema) {
  const result = await client.query(
    `SELECT
       to_regclass($1) IS NOT NULL AS "hasStages",
       to_regclass($2) IS NOT NULL AS "hasParticipants",
       to_regclass($3) IS NOT NULL AS "hasGroups",
       (SELECT count(DISTINCT type.typname) = cardinality($7::text[])
          FROM pg_type type
          JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
         WHERE namespace.nspname = $13 AND type.typname = ANY($7::text[]))
         AS "hasStageTypes",
       (SELECT count(DISTINCT class.relname) = cardinality($8::text[])
          FROM pg_class class
          JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
         WHERE namespace.nspname = $13 AND class.relkind = 'S'
           AND class.relname = ANY($8::text[])) AS "hasStageSequences",
       to_regclass($9) IS NOT NULL AS "hasActiveStageIndex",
       EXISTS (
         SELECT 1 FROM pg_attribute
         WHERE attrelid = to_regclass($4)
           AND attname = 'stage_id' AND attnotnull AND NOT attisdropped
       ) AS "matchStageRequired",
       EXISTS (
         SELECT 1 FROM pg_attribute
         WHERE attrelid = to_regclass($4)
           AND attname = 'stage_group_id' AND NOT attisdropped
       ) AS "hasMatchStageGroup",
       EXISTS (
         SELECT 1 FROM pg_attribute
         WHERE attrelid = to_regclass($5)
           AND attname = 'stage_id' AND attnotnull AND NOT attisdropped
       ) AS "historyStageRequired",
       EXISTS (
         SELECT 1 FROM pg_attribute
         WHERE attrelid = to_regclass($14)
           AND attname = 'stage_id' AND NOT attisdropped
       ) AS "hasActionLogStage",
       EXISTS (
         SELECT 1 FROM pg_attribute
         WHERE attrelid = to_regclass($6)
           AND attname = 'active_stage_id' AND NOT attisdropped
       ) AS "hasActiveStagePointer",
       (SELECT count(DISTINCT con.conname) = cardinality($10::text[])
          FROM pg_constraint con
          JOIN pg_class class ON class.oid = con.conrelid
          JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
         WHERE namespace.nspname = $13
           AND con.conname = ANY($10::text[])) AS "hasCriticalConstraints",
       (SELECT count(DISTINCT proc.proname) = cardinality($11::text[])
          FROM pg_proc proc
          JOIN pg_namespace namespace ON namespace.oid = proc.pronamespace
         WHERE namespace.nspname = $13
           AND proc.proname = ANY($11::text[])) AS "hasCompatibilityFunctions",
       (SELECT count(DISTINCT trg.tgname) = cardinality($12::text[])
          FROM pg_trigger trg
          JOIN pg_class class ON class.oid = trg.tgrelid
          JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
         WHERE namespace.nspname = $13 AND NOT trg.tgisinternal
           AND trg.tgname = ANY($12::text[])) AS "hasCompatibilityTriggers"`,
    [
      `${schema}.tournament_stages`,
      `${schema}.stage_participants`,
      `${schema}.stage_groups`,
      `${schema}.matches`,
      `${schema}.result_history`,
      `${schema}.tournaments`,
      STAGE_TYPES,
      STAGE_SEQUENCES,
      `${schema}.tournament_stages_one_active_per_tournament`,
      CRITICAL_CONSTRAINTS,
      COMPATIBILITY_FUNCTIONS,
      COMPATIBILITY_TRIGGERS,
      schema,
      `${schema}.action_log`,
    ],
  );
  const checks = result.rows[0];
  if (!checks)
    throw new Error("Unable to inspect the Tournament Stages schema state.");
  return checks;
}

export function classifyTournamentStagesMigrationState({
  databaseMatches,
  targetSchemaExists,
  seriesV1State,
  markerTableValid,
  seriesV1Marker,
  stagesMarker,
  stageSchemaChecks,
  config,
}) {
  const reasons = [];
  const stageCheckValues = STAGE_SCHEMA_CHECKS.map(
    (name) => stageSchemaChecks[name],
  );
  const stageSchemaAbsent = stageCheckValues.every((value) => value === false);
  const stageSchemaApplied = stageCheckValues.every((value) => value === true);

  if (!databaseMatches) {
    reasons.push("current_database() does not match EXPECTED_DATABASE_NAME.");
  }
  if (!targetSchemaExists) {
    reasons.push(`Target schema ${config.expectedSchema} does not exist.`);
  }
  if (seriesV1State !== "series_v1") {
    reasons.push(
      `Tournament result model state is ${seriesV1State}, expected series_v1.`,
    );
  }
  if (!markerTableValid) {
    reasons.push(
      "The app_schema_migrations table is missing or has an unexpected shape.",
    );
  }
  if (!markerMatches(seriesV1Marker, config)) {
    reasons.push(
      "The series_v1 clean-cutover marker is missing or inconsistent.",
    );
  }

  let status;
  if (!stagesMarker && stageSchemaAbsent) {
    status = "needed";
  } else if (
    stageSchemaApplied &&
    markerMatches(stagesMarker, config, config.appCommit)
  ) {
    status = "applied";
  } else {
    status = "inconsistent";
    if (stagesMarker && !stageSchemaApplied) {
      reasons.push(
        "The Tournament Stages marker exists but the required schema is incomplete.",
      );
    } else if (!stagesMarker && !stageSchemaAbsent) {
      reasons.push(
        "Tournament Stages schema objects exist without a migration marker.",
      );
    } else if (
      stagesMarker &&
      !markerMatches(stagesMarker, config, config.appCommit)
    ) {
      reasons.push(
        "The Tournament Stages marker metadata does not match the deployment guards.",
      );
    }
  }

  if (reasons.length > 0) status = "inconsistent";
  return { safe: status !== "inconsistent", status, reasons };
}

export async function collectTournamentStagesPreflight(client, config) {
  const metadataResult = await client.query(
    `SELECT current_database() AS database,
            current_schema() AS "currentSchema",
            current_setting('search_path') AS "searchPath",
            EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = $1) AS "targetSchemaExists"`,
    [config.expectedSchema],
  );
  const metadata = metadataResult.rows[0];
  if (!metadata) throw new Error("Unable to inspect the target database.");

  const tablesResult = await client.query(
    `SELECT class.relname AS name
     FROM pg_class class
     JOIN pg_namespace namespace ON namespace.oid = class.relnamespace
     WHERE namespace.nspname = $1
       AND class.relname = ANY($2::text[])
       AND class.relkind IN ('r', 'p')`,
    [config.expectedSchema, DOMAIN_TABLES],
  );
  const typesResult = await client.query(
    `SELECT type.typname AS name
     FROM pg_type type
     JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
     WHERE namespace.nspname = $1
       AND type.typname = ANY($2::text[])`,
    [config.expectedSchema, DOMAIN_TYPES],
  );
  const columnsResult = await client.query(
    `SELECT table_name AS "table", column_name AS "column"
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = ANY($2::text[])`,
    [config.expectedSchema, DOMAIN_TABLES],
  );

  const tables = new Set(tablesResult.rows.map((row) => row.name));
  const types = new Set(typesResult.rows.map((row) => row.name));
  const columns = new Set(
    columnsResult.rows.map((row) => `${row.table}.${row.column}`),
  );
  const hasAllTables = DOMAIN_TABLES.every((name) => tables.has(name));
  const hasAllTypes = DOMAIN_TYPES.every((name) => types.has(name));
  const hasLegacySignature = Object.entries(LEGACY_COLUMN_SIGNATURE).every(
    ([table, names]) => hasEveryColumn(columns, table, names),
  );
  const hasSeriesSignature = Object.entries(SERIES_V1_COLUMN_SIGNATURE).every(
    ([table, names]) => hasEveryColumn(columns, table, names),
  );

  let seriesV1State;
  if (tables.size === 0 && types.size === 0) {
    seriesV1State = "fresh";
  } else if (hasAllTables && hasLegacySignature && !hasSeriesSignature) {
    seriesV1State = "legacy";
  } else if (
    hasAllTables &&
    hasAllTypes &&
    hasSeriesSignature &&
    !hasLegacySignature
  ) {
    seriesV1State = "series_v1";
  } else {
    seriesV1State = "inconsistent";
  }

  const markerTableResult = await client.query(
    "SELECT to_regclass($1) IS NOT NULL AS exists",
    [`${config.expectedSchema}.app_schema_migrations`],
  );
  const markerTableExists = markerTableResult.rows[0]?.exists === true;
  let markerTableValid = false;
  let seriesV1Marker = null;
  let stagesMarker = null;
  if (markerTableExists) {
    const markerColumnsResult = await client.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = 'app_schema_migrations'`,
      [config.expectedSchema],
    );
    const markerColumns = new Set(
      markerColumnsResult.rows.map((row) => row.column_name),
    );
    markerTableValid = EXPECTED_MARKER_COLUMNS.every((name) =>
      markerColumns.has(name),
    );
    if (markerTableValid) {
      const markersResult = await client.query(
        `SELECT migration_key AS "migrationKey",
                applied_at AS "appliedAt",
                app_commit AS "appCommit",
                target_schema AS "targetSchema",
                deployment_environment AS "deploymentEnvironment"
         FROM "${TARGET_SCHEMA}".app_schema_migrations
         WHERE migration_key = ANY($1::text[])`,
        [[SERIES_V1_MIGRATION_KEY, TOURNAMENT_STAGES_MIGRATION_KEY]],
      );
      seriesV1Marker =
        markersResult.rows.find(
          (row) => row.migrationKey === SERIES_V1_MIGRATION_KEY,
        ) ?? null;
      stagesMarker =
        markersResult.rows.find(
          (row) => row.migrationKey === TOURNAMENT_STAGES_MIGRATION_KEY,
        ) ?? null;
    }
  }

  const stageSchemaChecks = await inspectTournamentStagesSchema(
    client,
    config.expectedSchema,
  );
  const classification = classifyTournamentStagesMigrationState({
    databaseMatches: metadata.database === config.expectedDatabaseName,
    targetSchemaExists: metadata.targetSchemaExists,
    seriesV1State,
    markerTableValid,
    seriesV1Marker,
    stagesMarker,
    stageSchemaChecks,
    config,
  });

  return {
    ...classification,
    target: {
      host: config.safeHost,
      database: metadata.database,
      targetSchema: config.expectedSchema,
      currentSchema: metadata.currentSchema,
      searchPath: metadata.searchPath,
      environment: config.deploymentEnvironment,
    },
    seriesV1: {
      state: seriesV1State,
      marker: seriesV1Marker,
    },
    migration: {
      key: TOURNAMENT_STAGES_MIGRATION_KEY,
      status: classification.status,
      marker: stagesMarker,
      schemaChecks: stageSchemaChecks,
    },
  };
}

export async function runTournamentStagesReadOnlyPreflight(client, config) {
  await client.query("BEGIN READ ONLY");
  try {
    const report = await collectTournamentStagesPreflight(client, config);
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
