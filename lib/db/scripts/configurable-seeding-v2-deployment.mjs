import {
  loadFlexibleGroupStagesDeploymentConfig,
  loadFlexibleGroupStagesDevelopmentDeploymentConfig,
} from "./flexible-group-stages-v2-deployment.mjs";

export const CONFIGURABLE_SEEDING_MIGRATION_KEY = "configurable_seeding_v2";
export const CONFIGURABLE_SEEDING_PREREQUISITE_KEY = "flexible_group_stages_v2";

const REQUIRED_COLUMNS = Object.freeze([
  "entry_seeding_policy",
  "result_seeding_policy",
  "random_seed",
  "random_reveal_order",
  "seeding_audit",
]);
const REQUIRED_CONSTRAINTS = Object.freeze([
  "tournament_stages_seeding_configuration",
  "tournament_stages_result_seeding_configuration",
  "tournament_stages_random_seed_configuration",
  "tournament_stages_seeding_audit_shape",
]);
const REQUIRED_PLACEMENT_VALUES = Object.freeze([
  "standings_order",
  "snake_groups",
  "cross_group",
  "random_groups",
  "standard_bracket",
  "random_bracket",
]);
const REQUIRED_ENTRY_VALUES = Object.freeze([
  "preserve",
  "registration_order",
  "alphabetical",
  "random",
  "manual",
]);
const REQUIRED_RESULT_VALUES = Object.freeze([
  "standings_order",
  "rank_bands",
  "global_ranking",
]);
const REQUIRED_REVEAL_VALUES = Object.freeze(["instant", "sequential"]);

function sameValues(actual, expected) {
  return actual.length === expected.length &&
    actual.every((value, index) => value === expected[index]);
}

function markerMatchesEnvironment(marker, config) {
  return Boolean(
    marker &&
      marker.targetSchema === config.expectedSchema &&
      marker.deploymentEnvironment === config.deploymentEnvironment,
  );
}
function targetMarkerMatches(marker, config) {
  return Boolean(markerMatchesEnvironment(marker, config) && marker.appCommit === config.appCommit);
}

export function loadConfigurableSeedingDeploymentConfig(env = process.env) {
  return loadFlexibleGroupStagesDeploymentConfig(env);
}
export function loadConfigurableSeedingDevelopmentDeploymentConfig(env = process.env) {
  return loadFlexibleGroupStagesDevelopmentDeploymentConfig(env);
}

export async function inspectConfigurableSeedingSchema(client, schema) {
  const relation = await client.query(
    `SELECT
       to_regclass($1) IS NOT NULL AS "hasTournamentStages",
       to_regclass($2) IS NOT NULL AS "hasMarkerTable"`,
    [`${schema}.tournament_stages`, `${schema}.app_schema_migrations`],
  );
  const state = relation.rows[0];
  if (!state) throw new Error("Unable to inspect configurable seeding relations.");

  const columnsResult = state.hasTournamentStages
    ? await client.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_schema = $1 AND table_name = 'tournament_stages'`,
        [schema],
      )
    : { rows: [] };
  const columns = new Set(columnsResult.rows.map((row) => row.column_name));

  const constraintsResult = state.hasTournamentStages
    ? await client.query(
        `SELECT constraint_row.conname AS name
         FROM pg_constraint constraint_row
         JOIN pg_class table_row ON table_row.oid = constraint_row.conrelid
         JOIN pg_namespace namespace_row ON namespace_row.oid = table_row.relnamespace
         WHERE namespace_row.nspname = $1 AND table_row.relname = 'tournament_stages'`,
        [schema],
      )
    : { rows: [] };
  const constraints = new Set(constraintsResult.rows.map((row) => row.name));

  const enumResult = await client.query(
    `SELECT type_row.typname AS name, enum_row.enumlabel AS value
     FROM pg_type type_row
     JOIN pg_namespace namespace_row ON namespace_row.oid = type_row.typnamespace
     JOIN pg_enum enum_row ON enum_row.enumtypid = type_row.oid
     WHERE namespace_row.nspname = $1
       AND type_row.typname IN (
         'stage_seeding_policy',
         'stage_entry_seeding_policy',
         'stage_result_seeding_policy',
         'stage_random_reveal_order'
       )
     ORDER BY type_row.typname, enum_row.enumsortorder`,
    [schema],
  );
  const enums = new Map();
  for (const row of enumResult.rows) {
    const values = enums.get(row.name) ?? [];
    values.push(row.value);
    enums.set(row.name, values);
  }

  const requiredColumnsPresent = REQUIRED_COLUMNS.every((column) => columns.has(column));
  const legacyColumnsAbsent = REQUIRED_COLUMNS.every((column) => !columns.has(column));
  const requiredConstraintsPresent = REQUIRED_CONSTRAINTS.every((name) => constraints.has(name));
  const placementValues = enums.get("stage_seeding_policy") ?? [];
  const configuredEnums =
    sameValues(placementValues, REQUIRED_PLACEMENT_VALUES) &&
    sameValues(enums.get("stage_entry_seeding_policy") ?? [], REQUIRED_ENTRY_VALUES) &&
    sameValues(enums.get("stage_result_seeding_policy") ?? [], REQUIRED_RESULT_VALUES) &&
    sameValues(enums.get("stage_random_reveal_order") ?? [], REQUIRED_REVEAL_VALUES);
  const legacyPlacementEnum = sameValues(
    placementValues,
    ["standings_order", "snake_groups", "cross_group"],
  );

  return {
    hasTournamentStages: state.hasTournamentStages === true,
    hasMarkerTable: state.hasMarkerTable === true,
    legacy: Boolean(state.hasTournamentStages && legacyColumnsAbsent && legacyPlacementEnum),
    configured: Boolean(
      state.hasTournamentStages &&
        requiredColumnsPresent &&
        requiredConstraintsPresent &&
        configuredEnums,
    ),
    details: {
      requiredColumnsPresent,
      legacyColumnsAbsent,
      requiredConstraintsPresent,
      configuredEnums,
      placementValues,
    },
  };
}

export function classifyConfigurableSeedingMigrationState({
  databaseMatches,
  targetSchemaExists,
  prerequisiteMarker,
  targetMarker,
  schemaState,
  config,
}) {
  const reasons = [];
  if (!databaseMatches) reasons.push("current_database() does not match EXPECTED_DATABASE_NAME.");
  if (!targetSchemaExists) reasons.push(`Target schema ${config.expectedSchema} does not exist.`);
  if (!schemaState.hasMarkerTable) reasons.push("The app_schema_migrations table is missing.");
  if (!markerMatchesEnvironment(prerequisiteMarker, config)) {
    reasons.push("The flexible_group_stages_v2 prerequisite marker is missing or inconsistent.");
  }

  let status = "inconsistent";
  if (!targetMarker && schemaState.legacy) status = "needed";
  else if (targetMarkerMatches(targetMarker, config) && schemaState.configured) status = "applied";
  else if (targetMarker && !schemaState.configured) reasons.push("The configurable seeding marker exists but the schema is incomplete.");
  else if (!targetMarker && schemaState.configured) reasons.push("Configurable seeding schema exists without a migration marker.");
  else if (targetMarker && !targetMarkerMatches(targetMarker, config)) reasons.push("The configurable seeding marker metadata does not match the deployment guards.");
  else if (!schemaState.legacy && !schemaState.configured) reasons.push("The seeding schema is neither the expected prerequisite nor configured shape.");

  if (reasons.length > 0) status = "inconsistent";
  return { safe: status !== "inconsistent", status, reasons };
}

export async function collectConfigurableSeedingPreflight(client, config) {
  const metadataResult = await client.query(
    `SELECT current_database() AS database,
            current_schema() AS "currentSchema",
            current_setting('search_path') AS "searchPath",
            EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = $1) AS "targetSchemaExists"`,
    [config.expectedSchema],
  );
  const metadata = metadataResult.rows[0];
  if (!metadata) throw new Error("Unable to inspect the target database.");
  const schemaState = await inspectConfigurableSeedingSchema(client, config.expectedSchema);
  let prerequisiteMarker = null;
  let targetMarker = null;
  if (schemaState.hasMarkerTable) {
    const markers = await client.query(
      `SELECT migration_key AS "migrationKey",
              applied_at AS "appliedAt",
              app_commit AS "appCommit",
              target_schema AS "targetSchema",
              deployment_environment AS "deploymentEnvironment"
       FROM "${config.expectedSchema}".app_schema_migrations
       WHERE migration_key = ANY($1::text[])`,
      [[CONFIGURABLE_SEEDING_PREREQUISITE_KEY, CONFIGURABLE_SEEDING_MIGRATION_KEY]],
    );
    prerequisiteMarker = markers.rows.find((row) => row.migrationKey === CONFIGURABLE_SEEDING_PREREQUISITE_KEY) ?? null;
    targetMarker = markers.rows.find((row) => row.migrationKey === CONFIGURABLE_SEEDING_MIGRATION_KEY) ?? null;
  }
  const classification = classifyConfigurableSeedingMigrationState({
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
    prerequisite: { key: CONFIGURABLE_SEEDING_PREREQUISITE_KEY, marker: prerequisiteMarker },
    migration: {
      key: CONFIGURABLE_SEEDING_MIGRATION_KEY,
      status: classification.status,
      marker: targetMarker,
      schemaState,
    },
  };
}

export async function runConfigurableSeedingReadOnlyPreflight(client, config) {
  await client.query("BEGIN READ ONLY");
  try {
    const report = await collectConfigurableSeedingPreflight(client, config);
    await client.query("ROLLBACK");
    return report;
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch { /* preserve original */ }
    throw error;
  }
}
