import {
  loadTournamentStagesDeploymentConfig,
  loadTournamentStagesDevelopmentDeploymentConfig,
} from "./tournament-stages-v1-deployment.mjs";

export const FLEXIBLE_GROUP_STAGES_MIGRATION_KEY = "flexible_group_stages_v2";
export const TOURNAMENT_STAGES_PREREQUISITE_KEY = "tournament_stages_v1";

const REQUIRED_MARKER_COLUMNS = Object.freeze([
  "migration_key",
  "applied_at",
  "app_commit",
  "target_schema",
  "deployment_environment",
]);
const LEGACY_GROUP_CONSTRAINTS = Object.freeze([
  "stage_groups_key_supported",
  "stage_groups_position_range",
  "stage_groups_participant_count_range",
  "stage_groups_qualifiers_count_supported",
]);
const FLEXIBLE_GROUP_CONSTRAINTS = Object.freeze([
  "stage_groups_key_nonempty",
  "stage_groups_position_positive",
  "stage_groups_participant_count_minimum",
  "stage_groups_qualifiers_count_range",
]);

function markerMatchesEnvironment(marker, config) {
  return Boolean(
    marker &&
      marker.targetSchema === config.expectedSchema &&
      marker.deploymentEnvironment === config.deploymentEnvironment,
  );
}

function targetMarkerMatches(marker, config) {
  return Boolean(
    markerMatchesEnvironment(marker, config) &&
      marker.appCommit === config.appCommit,
  );
}

export function loadFlexibleGroupStagesDeploymentConfig(env = process.env) {
  return loadTournamentStagesDeploymentConfig(env);
}

export function loadFlexibleGroupStagesDevelopmentDeploymentConfig(
  env = process.env,
) {
  return loadTournamentStagesDevelopmentDeploymentConfig(env);
}

function normalizeDefinition(value) {
  return typeof value === "string"
    ? value.toLowerCase().replace(/\s+/g, " ").trim()
    : "";
}

export async function inspectFlexibleGroupStagesSchema(client, schema) {
  const relations = await client.query(
    `SELECT
       to_regclass($1) IS NOT NULL AS "hasTournamentStages",
       to_regclass($2) IS NOT NULL AS "hasStageGroups",
       to_regclass($3) IS NOT NULL AS "hasMarkerTable"`,
    [
      `${schema}.tournament_stages`,
      `${schema}.stage_groups`,
      `${schema}.app_schema_migrations`,
    ],
  );
  const relationState = relations.rows[0];
  if (!relationState) throw new Error("Unable to inspect flexible group stage relations.");

  const markerColumnsResult = relationState.hasMarkerTable
    ? await client.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_schema = $1 AND table_name = 'app_schema_migrations'`,
        [schema],
      )
    : { rows: [] };
  const markerColumns = new Set(markerColumnsResult.rows.map((row) => row.column_name));
  const markerTableValid = REQUIRED_MARKER_COLUMNS.every((column) =>
    markerColumns.has(column),
  );

  const constraintsResult = relationState.hasTournamentStages && relationState.hasStageGroups
    ? await client.query(
        `SELECT constraint_row.conname AS name,
                pg_get_constraintdef(constraint_row.oid, true) AS definition
         FROM pg_constraint constraint_row
         JOIN pg_class table_row ON table_row.oid = constraint_row.conrelid
         JOIN pg_namespace namespace_row ON namespace_row.oid = table_row.relnamespace
         WHERE namespace_row.nspname = $1
           AND table_row.relname IN ('tournament_stages', 'stage_groups')`,
        [schema],
      )
    : { rows: [] };
  const constraints = new Map(
    constraintsResult.rows.map((row) => [row.name, normalizeDefinition(row.definition)]),
  );
  const stageConfiguration = constraints.get("tournament_stages_format_configuration") ?? "";

  const functionResult = relationState.hasStageGroups
    ? await client.query(
        `SELECT pg_get_functiondef(proc.oid) AS definition
         FROM pg_proc proc
         JOIN pg_namespace namespace_row ON namespace_row.oid = proc.pronamespace
         WHERE namespace_row.nspname = $1
           AND proc.proname = 'validate_stage_group_configuration'
         ORDER BY proc.oid
         LIMIT 1`,
        [schema],
      )
    : { rows: [] };
  const functionDefinition = normalizeDefinition(functionResult.rows[0]?.definition);

  const hasEveryLegacyConstraint = LEGACY_GROUP_CONSTRAINTS.every((name) =>
    constraints.has(name),
  );
  const hasAnyLegacyConstraint = LEGACY_GROUP_CONSTRAINTS.some((name) =>
    constraints.has(name),
  );
  const hasEveryFlexibleConstraint = FLEXIBLE_GROUP_CONSTRAINTS.every((name) =>
    constraints.has(name),
  );
  const hasAnyFlexibleConstraint = FLEXIBLE_GROUP_CONSTRAINTS.some((name) =>
    constraints.has(name),
  );

  const hasLegacyStageConfiguration =
    stageConfiguration.includes("group_count") &&
    (stageConfiguration.includes("array[2, 4]") ||
      stageConfiguration.includes("group_count in (2, 4)"));
  const hasFlexibleStageConfiguration =
    stageConfiguration.includes("group_count") &&
    stageConfiguration.includes("participant_count") &&
    /group_count\)?\s*\*\s*2\)?\s*<=\s*participant_count/.test(stageConfiguration) &&
    stageConfiguration.includes("qualifiers_per_group") &&
    stageConfiguration.includes("participants_per_group - 1");
  const hasFlexibleValidationFunction =
    functionDefinition.includes("larger_group_count") &&
    functionDefinition.includes("expected_participant_count") &&
    functionDefinition.includes("least(");

  const legacy = Boolean(
    relationState.hasTournamentStages &&
      relationState.hasStageGroups &&
      hasLegacyStageConfiguration &&
      hasEveryLegacyConstraint &&
      !hasAnyFlexibleConstraint &&
      !hasFlexibleValidationFunction,
  );
  const flexible = Boolean(
    relationState.hasTournamentStages &&
      relationState.hasStageGroups &&
      hasFlexibleStageConfiguration &&
      hasEveryFlexibleConstraint &&
      !hasAnyLegacyConstraint &&
      hasFlexibleValidationFunction,
  );

  return {
    hasTournamentStages: relationState.hasTournamentStages === true,
    hasStageGroups: relationState.hasStageGroups === true,
    hasMarkerTable: relationState.hasMarkerTable === true,
    markerTableValid,
    legacy,
    flexible,
    details: {
      hasLegacyStageConfiguration,
      hasFlexibleStageConfiguration,
      hasEveryLegacyConstraint,
      hasAnyLegacyConstraint,
      hasEveryFlexibleConstraint,
      hasAnyFlexibleConstraint,
      hasFlexibleValidationFunction,
    },
  };
}

export function classifyFlexibleGroupStagesMigrationState({
  databaseMatches,
  targetSchemaExists,
  prerequisiteMarker,
  targetMarker,
  schemaState,
  config,
}) {
  const reasons = [];
  if (!databaseMatches) {
    reasons.push("current_database() does not match EXPECTED_DATABASE_NAME.");
  }
  if (!targetSchemaExists) {
    reasons.push(`Target schema ${config.expectedSchema} does not exist.`);
  }
  if (!schemaState.hasMarkerTable || !schemaState.markerTableValid) {
    reasons.push("The app_schema_migrations table is missing or has an unexpected shape.");
  }
  if (!markerMatchesEnvironment(prerequisiteMarker, config)) {
    reasons.push("The tournament_stages_v1 prerequisite marker is missing or inconsistent.");
  }

  let status = "inconsistent";
  if (!targetMarker && schemaState.legacy) {
    status = "needed";
  } else if (targetMarkerMatches(targetMarker, config) && schemaState.flexible) {
    status = "applied";
  } else {
    if (targetMarker && !schemaState.flexible) {
      reasons.push("The flexible group stage marker exists but the schema is incomplete.");
    } else if (!targetMarker && schemaState.flexible) {
      reasons.push("Flexible group stage schema exists without a migration marker.");
    } else if (targetMarker && !targetMarkerMatches(targetMarker, config)) {
      reasons.push("The flexible group stage marker metadata does not match the deployment guards.");
    } else if (!schemaState.legacy && !schemaState.flexible) {
      reasons.push("The group stage schema is neither the expected legacy nor flexible shape.");
    }
  }

  if (reasons.length > 0) status = "inconsistent";
  return { safe: status !== "inconsistent", status, reasons };
}

export async function collectFlexibleGroupStagesPreflight(client, config) {
  const metadataResult = await client.query(
    `SELECT current_database() AS database,
            current_schema() AS "currentSchema",
            current_setting('search_path') AS "searchPath",
            EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = $1) AS "targetSchemaExists"`,
    [config.expectedSchema],
  );
  const metadata = metadataResult.rows[0];
  if (!metadata) throw new Error("Unable to inspect the target database.");

  const schemaState = await inspectFlexibleGroupStagesSchema(
    client,
    config.expectedSchema,
  );
  let prerequisiteMarker = null;
  let targetMarker = null;
  if (schemaState.markerTableValid) {
    const markers = await client.query(
      `SELECT migration_key AS "migrationKey",
              applied_at AS "appliedAt",
              app_commit AS "appCommit",
              target_schema AS "targetSchema",
              deployment_environment AS "deploymentEnvironment"
       FROM "${config.expectedSchema}".app_schema_migrations
       WHERE migration_key = ANY($1::text[])`,
      [[TOURNAMENT_STAGES_PREREQUISITE_KEY, FLEXIBLE_GROUP_STAGES_MIGRATION_KEY]],
    );
    prerequisiteMarker = markers.rows.find(
      (row) => row.migrationKey === TOURNAMENT_STAGES_PREREQUISITE_KEY,
    ) ?? null;
    targetMarker = markers.rows.find(
      (row) => row.migrationKey === FLEXIBLE_GROUP_STAGES_MIGRATION_KEY,
    ) ?? null;
  }

  const classification = classifyFlexibleGroupStagesMigrationState({
    databaseMatches: metadata.database === config.expectedDatabaseName,
    targetSchemaExists: metadata.targetSchemaExists === true,
    prerequisiteMarker,
    targetMarker,
    schemaState,
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
    prerequisite: {
      key: TOURNAMENT_STAGES_PREREQUISITE_KEY,
      marker: prerequisiteMarker,
    },
    migration: {
      key: FLEXIBLE_GROUP_STAGES_MIGRATION_KEY,
      status: classification.status,
      marker: targetMarker,
      schemaState,
    },
  };
}

export async function runFlexibleGroupStagesReadOnlyPreflight(client, config) {
  await client.query("BEGIN READ ONLY");
  try {
    const report = await collectFlexibleGroupStagesPreflight(client, config);
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
