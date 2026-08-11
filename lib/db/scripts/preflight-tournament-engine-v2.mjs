import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import pg from "pg";
import {
  inspectSchemaCatalog,
} from "./compare-replit-schema-catalogs.mjs";
import {
  collectTournamentStagesPreflight,
} from "./tournament-stages-v1-deployment.mjs";
import {
  collectFlexibleGroupStagesPreflight,
} from "./flexible-group-stages-v2-deployment.mjs";
import {
  collectConfigurableSeedingPreflight,
} from "./configurable-seeding-v2-deployment.mjs";
import {
  collectRoutingPersistencePreflight,
} from "./preflight-tournament-routing-persistence-v2.mjs";
import {
  REQUIRED_STAGE_CONSTRAINTS,
  REQUIRED_STAGE_FUNCTIONS,
  REQUIRED_STAGE_TRIGGERS,
} from "./tournament-engine-v2-preflight-catalog.mjs";

const { Client } = pg;
const FULL_SHA = /^[a-f0-9]{40}$/i;
const IDENTIFIER = /^[a-z_][a-z0-9_]*$/i;

export const HISTORICAL_MIGRATIONS = Object.freeze([
  "tournament_stages_v1",
  "flexible_group_stages_v2",
  "configurable_seeding_v2",
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
  if (!new Set(["postgres:", "postgresql:"]).has(parsed.protocol)) {
    throw new Error(`${variableName} must use postgres:// or postgresql://.`);
  }
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!databaseName || databaseName.includes("/")) {
    throw new Error(`${variableName} must identify exactly one database.`);
  }
  return { parsed, databaseName };
}

export function loadTournamentEnginePreflightConfig(env = process.env) {
  const expectedDatabaseName = required(env, "EXPECTED_DATABASE_NAME");
  const expectedSchema = required(env, "EXPECTED_DATABASE_SCHEMA");
  const expectedEnvironment = required(env, "EXPECTED_DEPLOYMENT_ENVIRONMENT");
  const deploymentEnvironment = required(env, "DEPLOYMENT_ENVIRONMENT");
  if (!IDENTIFIER.test(expectedDatabaseName)) {
    throw new Error("EXPECTED_DATABASE_NAME must be a simple SQL identifier.");
  }
  if (expectedSchema !== "public") {
    throw new Error("EXPECTED_DATABASE_SCHEMA must equal public.");
  }
  if (!new Set(["development", "production"]).has(expectedEnvironment)) {
    throw new Error(
      "EXPECTED_DEPLOYMENT_ENVIRONMENT must equal development or production.",
    );
  }
  if (deploymentEnvironment !== expectedEnvironment) {
    throw new Error(
      "DEPLOYMENT_ENVIRONMENT must exactly match EXPECTED_DEPLOYMENT_ENVIRONMENT.",
    );
  }

  const databaseVariable = deploymentEnvironment === "development"
    ? "DEVELOPMENT_DATABASE_URL"
    : "DATABASE_URL";
  const databaseUrl = required(env, databaseVariable);
  const { parsed, databaseName } = parseDatabaseUrl(databaseUrl, databaseVariable);
  if (databaseName !== expectedDatabaseName) {
    throw new Error(
      `${databaseVariable} database name must match EXPECTED_DATABASE_NAME.`,
    );
  }
  if (deploymentEnvironment === "development" && databaseName === "neondb") {
    throw new Error("Development preflight refuses the Production database neondb.");
  }

  const appCommit = env.APP_COMMIT?.trim() || null;
  if (appCommit !== null && !FULL_SHA.test(appCommit)) {
    throw new Error("APP_COMMIT, when provided, must be a full 40-character SHA.");
  }
  return Object.freeze({
    databaseUrl,
    expectedDatabaseName,
    expectedSchema,
    expectedEnvironment,
    deploymentEnvironment,
    appCommit,
    safeHost: parsed.hostname.toLowerCase(),
  });
}

function markerMetadataMatches(marker, config) {
  return Boolean(
    marker &&
      marker.targetSchema === config.expectedSchema &&
      marker.deploymentEnvironment === config.deploymentEnvironment,
  );
}

export function classifyHistoricalMigrationInspection({
  marker,
  schemaApplied,
  schemaNeeded,
  prerequisiteValid,
  config,
}) {
  if (marker && schemaApplied && prerequisiteValid && markerMetadataMatches(marker, config)) {
    if (config.appCommit && marker.appCommit !== config.appCommit) {
      return "MARKER_COMMIT_DIFFERENT_BUT_SCHEMA_VALID";
    }
    return "APPLIED";
  }
  if (!marker && schemaNeeded && prerequisiteValid) return "NEEDED";
  return "INCONSISTENT";
}

function historicalResult(key, report, status) {
  const problems = [];
  if (status === "INCONSISTENT") {
    problems.push(`${key}: marker and controlled schema fragment are inconsistent.`);
  }
  return {
    key,
    safe: status !== "INCONSISTENT",
    status,
    historicalCommit: report.migration.marker?.appCommit ?? null,
    marker: report.migration.marker ?? null,
    problems,
  };
}

export async function collectHistoricalMigrationInspection(client, config) {
  const collectorConfig = {
    expectedDatabaseName: config.expectedDatabaseName,
    expectedSchema: config.expectedSchema,
    deploymentEnvironment: config.deploymentEnvironment,
    appCommit: config.appCommit ?? "0000000000000000000000000000000000000000",
    safeHost: config.safeHost,
  };
  const stages = await collectTournamentStagesPreflight(client, collectorConfig);
  const stageChecks = Object.values(stages.migration.schemaChecks);
  const stagesStatus = classifyHistoricalMigrationInspection({
    marker: stages.migration.marker,
    schemaApplied: stageChecks.length > 0 && stageChecks.every((value) => value === true),
    schemaNeeded: stageChecks.length > 0 && stageChecks.every((value) => value === false),
    prerequisiteValid:
      stages.seriesV1.state === "series_v1" &&
      markerMetadataMatches(stages.seriesV1.marker, config),
    config,
  });

  const flexible = await collectFlexibleGroupStagesPreflight(client, collectorConfig);
  const flexibleStatus = classifyHistoricalMigrationInspection({
    marker: flexible.migration.marker,
    schemaApplied: flexible.migration.schemaState.flexible === true,
    schemaNeeded: flexible.migration.schemaState.legacy === true,
    prerequisiteValid: markerMetadataMatches(flexible.prerequisite.marker, config),
    config,
  });

  const configurable = await collectConfigurableSeedingPreflight(client, collectorConfig);
  const configurableStatus = classifyHistoricalMigrationInspection({
    marker: configurable.migration.marker,
    schemaApplied: configurable.migration.schemaState.configured === true,
    schemaNeeded: configurable.migration.schemaState.legacy === true,
    prerequisiteValid: markerMetadataMatches(configurable.prerequisite.marker, config),
    config,
  });

  const inspections = [
    historicalResult("tournament_stages_v1", stages, stagesStatus),
    historicalResult("flexible_group_stages_v2", flexible, flexibleStatus),
    historicalResult("configurable_seeding_v2", configurable, configurableStatus),
  ];
  return {
    safe: inspections.every((inspection) => inspection.safe),
    inspections,
    problems: inspections.flatMap((inspection) => inspection.problems),
  };
}

function normalizeCatalogText(value) {
  return value.replace(/\r\n?/g, "\n").trim();
}

function bodySha256(value) {
  return createHash("sha256")
    .update(normalizeCatalogText(value))
    .digest("hex");
}

function sameArray(actual, expected) {
  return actual.length === expected.length &&
    actual.every((value, index) => value === expected[index]);
}

export async function collectCanonicalTournamentEngineCatalog(client, config) {
  const base = await inspectSchemaCatalog(
    client,
    { label: config.deploymentEnvironment, expectedDatabase: config.expectedDatabaseName },
    config.expectedSchema,
    { manageTransaction: false },
  );
  const problems = [...base.problems];
  const gameConfigProblemStart = problems.length;

  const gameConfigTableResult = await client.query(
    `SELECT to_regclass($1) AS relation`,
    [`${config.expectedSchema}.tournament_game_configs`],
  );
  const gameConfigTableExists = gameConfigTableResult.rows[0]?.relation != null;
  if (!gameConfigTableExists) {
    problems.push("0013: table tournament_game_configs is missing.");
  } else {
    const columnsResult = await client.query(
      `SELECT column_name AS name, data_type AS type, is_nullable AS nullable
       FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = 'tournament_game_configs'
       ORDER BY ordinal_position`,
      [config.expectedSchema],
    );
    const expectedColumns = [
      ["tournament_id", "integer", "NO"],
      ["game_id", "text", "NO"],
      ["config_version", "integer", "NO"],
      ["config", "jsonb", "NO"],
      ["created_at", "timestamp with time zone", "NO"],
      ["updated_at", "timestamp with time zone", "NO"],
    ];
    const actualColumns = columnsResult.rows.map(({ name, type, nullable }) => [
      name,
      type,
      nullable,
    ]);
    if (
      actualColumns.length !== expectedColumns.length ||
      actualColumns.some((column, index) => !sameArray(column, expectedColumns[index]))
    ) {
      problems.push("0013: tournament_game_configs columns are missing or incompatible.");
    }

    const constraintsResult = await client.query(
      `SELECT conname AS name,
              contype AS type,
              convalidated AS validated,
              pg_get_constraintdef(oid, true) AS definition
       FROM pg_constraint
       WHERE conrelid = $1::regclass
         AND conname = ANY($2::text[])
       ORDER BY conname`,
      [
        `${config.expectedSchema}.tournament_game_configs`,
        [
          "tournament_game_configs_pkey",
          "tournament_game_configs_tournament_fk",
          "tournament_game_configs_game_id_present",
          "tournament_game_configs_version_positive",
          "tournament_game_configs_config_object",
        ],
      ],
    );
    const constraints = new Map(
      constraintsResult.rows.map((constraint) => [constraint.name, constraint]),
    );
    const primaryKey = constraints.get("tournament_game_configs_pkey");
    const foreignKey = constraints.get("tournament_game_configs_tournament_fk");
    const gameIdCheck = constraints.get("tournament_game_configs_game_id_present");
    const versionCheck = constraints.get("tournament_game_configs_version_positive");
    const objectCheck = constraints.get("tournament_game_configs_config_object");
    if (
      primaryKey?.type !== "p" || primaryKey.validated !== true ||
      normalizeCatalogText(primaryKey.definition) !== "PRIMARY KEY (tournament_id)"
    ) {
      problems.push("0013: tournament_game_configs primary key is missing or incompatible.");
    }
    if (
      foreignKey?.type !== "f" || foreignKey.validated !== true ||
      normalizeCatalogText(foreignKey.definition) !==
        "FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE"
    ) {
      problems.push("0013: tournament_game_configs foreign key is missing or incompatible.");
    }
    const validCheck = (constraint, fragments) =>
      constraint?.type === "c" && constraint.validated === true &&
      fragments.every((fragment) =>
        normalizeCatalogText(constraint.definition).includes(fragment)
      );
    if (!validCheck(gameIdCheck, ["length(btrim(game_id))", "> 0"])) {
      problems.push("0013: tournament_game_configs game_id check is missing or incompatible.");
    }
    if (!validCheck(versionCheck, ["config_version", "> 0"])) {
      problems.push("0013: tournament_game_configs version check is missing or incompatible.");
    }
    if (!validCheck(objectCheck, ["jsonb_typeof(config)", "'object'::text"])) {
      problems.push("0013: tournament_game_configs JSON object check is missing or incompatible.");
    }
  }

  const routingExecutionProblemStart = problems.length;
  const doubleEliminationEnumResult = await client.query(
    `SELECT enum_value.enumlabel AS value
     FROM pg_type type_row
     JOIN pg_namespace namespace_row ON namespace_row.oid = type_row.typnamespace
     JOIN pg_enum enum_value ON enum_value.enumtypid = type_row.oid
     WHERE namespace_row.nspname = $1
       AND type_row.typname = 'tournament_stage_format'
     ORDER BY enum_value.enumsortorder`,
    [config.expectedSchema],
  );
  if (!doubleEliminationEnumResult.rows.some((row) => row.value === "double_elimination")) {
    problems.push("0017: tournament_stage_format is missing double_elimination.");
  }
  const doubleEliminationConstraintsResult = await client.query(
    `SELECT constraint_row.conname AS name,
            constraint_row.convalidated AS validated,
            pg_get_constraintdef(constraint_row.oid, true) AS definition
     FROM pg_constraint constraint_row
     JOIN pg_class table_row ON table_row.oid = constraint_row.conrelid
     JOIN pg_namespace namespace_row ON namespace_row.oid = table_row.relnamespace
     WHERE namespace_row.nspname = $1
       AND table_row.relname = 'tournament_stages'
       AND constraint_row.conname = ANY($2::text[])`,
    [
      config.expectedSchema,
      [
        "tournament_stages_position_range",
        "tournament_stages_seeding_configuration",
        "tournament_stages_format_configuration",
      ],
    ],
  );
  const doubleEliminationConstraints = new Map(
    doubleEliminationConstraintsResult.rows.map((constraint) => [constraint.name, constraint]),
  );
  const positionRange = doubleEliminationConstraints.get("tournament_stages_position_range");
  const positionDefinition = normalizeCatalogText(positionRange?.definition ?? "");
  if (
    positionRange?.validated !== true ||
    !positionDefinition.includes('"position" >= 1') ||
    !positionDefinition.includes('"position" <= 10')
  ) {
    problems.push("0017: tournament stage position range 1..10 is missing or incompatible.");
  }
  const seedingConfiguration = doubleEliminationConstraints.get("tournament_stages_seeding_configuration");
  const seedingDefinition = normalizeCatalogText(seedingConfiguration?.definition ?? "");
  if (
    seedingConfiguration?.validated !== true ||
    !seedingDefinition.includes("double_elimination") ||
    !seedingDefinition.includes("standard_bracket") ||
    !seedingDefinition.includes("random_bracket")
  ) {
    problems.push("0017: Double Elimination seeding configuration is missing or incompatible.");
  }
  const formatConfiguration = doubleEliminationConstraints.get("tournament_stages_format_configuration");
  const formatDefinition = normalizeCatalogText(formatConfiguration?.definition ?? "");
  if (
    formatConfiguration?.validated !== true ||
    !formatDefinition.includes("double_elimination") ||
    !formatDefinition.includes("elimination_bracket_v1")
  ) {
    problems.push("0017: Double Elimination format configuration is missing or incompatible.");
  }
  const canonicalMatchMappingResult = await client.query(
    `SELECT column_row.data_type AS type,
            column_row.is_nullable AS nullable,
            constraint_row.contype AS constraint_type,
            constraint_row.convalidated AS validated,
            pg_get_constraintdef(constraint_row.oid, true) AS definition
     FROM information_schema.columns column_row
     LEFT JOIN pg_constraint constraint_row
       ON constraint_row.conrelid = format('%I.%I', column_row.table_schema, column_row.table_name)::regclass
      AND constraint_row.conname = 'matches_stage_routing_match_key_unique'
     WHERE column_row.table_schema = $1
       AND column_row.table_name = 'matches'
       AND column_row.column_name = 'routing_match_key'`,
    [config.expectedSchema],
  );
  const canonicalMatchMapping = canonicalMatchMappingResult.rows[0];
  if (
    canonicalMatchMapping?.type !== "text" ||
    canonicalMatchMapping?.nullable !== "YES" ||
    canonicalMatchMapping?.constraint_type !== "u" ||
    canonicalMatchMapping?.validated !== true ||
    normalizeCatalogText(canonicalMatchMapping?.definition ?? "") !==
      "UNIQUE (stage_id, routing_match_key)"
  ) {
    problems.push("0017: canonical Double Elimination match mapping is missing or incompatible.");
  }
  const routingExecutionTableResult = await client.query(
    `SELECT to_regclass($1) AS relation`,
    [`${config.expectedSchema}.tournament_routing_executions`],
  );
  const routingExecutionTableExists =
    routingExecutionTableResult.rows[0]?.relation != null;
  if (!routingExecutionTableExists) {
    problems.push("0017: table tournament_routing_executions is missing.");
  } else {
    const columnsResult = await client.query(
      `SELECT column_name AS name,
              data_type AS type,
              is_nullable AS nullable,
              column_default AS "default"
       FROM information_schema.columns
       WHERE table_schema = $1
         AND table_name = 'tournament_routing_executions'
       ORDER BY ordinal_position`,
      [config.expectedSchema],
    );
    const expectedColumns = [
      ["plan_id", "integer", "NO"],
      ["stage_key", "text", "NO"],
      ["revision", "integer", "NO"],
      ["state", "jsonb", "NO"],
      ["created_at", "timestamp with time zone", "NO"],
      ["updated_at", "timestamp with time zone", "NO"],
    ];
    const actualColumns = columnsResult.rows.map(({ name, type, nullable }) => [
      name,
      type,
      nullable,
    ]);
    const defaults = new Map(
      columnsResult.rows.map((column) => [column.name, column.default]),
    );
    if (
      actualColumns.length !== expectedColumns.length ||
      actualColumns.some((column, index) => !sameArray(column, expectedColumns[index])) ||
      normalizeCatalogText(defaults.get("revision") ?? "") !== "1" ||
      !normalizeCatalogText(defaults.get("created_at") ?? "").toLowerCase().includes("now()") ||
      !normalizeCatalogText(defaults.get("updated_at") ?? "").toLowerCase().includes("now()")
    ) {
      problems.push("0017: tournament_routing_executions columns are missing or incompatible.");
    }

    const constraintsResult = await client.query(
      `SELECT conname AS name,
              contype AS type,
              convalidated AS validated,
              pg_get_constraintdef(oid, true) AS definition
       FROM pg_constraint
       WHERE conrelid = $1::regclass
         AND conname = ANY($2::text[])
       ORDER BY conname`,
      [
        `${config.expectedSchema}.tournament_routing_executions`,
        [
          "tournament_routing_executions_pk",
          "tournament_routing_executions_stage_fk",
          "tournament_routing_executions_revision_positive",
          "tournament_routing_executions_state_object",
        ],
      ],
    );
    const constraints = new Map(
      constraintsResult.rows.map((constraint) => [constraint.name, constraint]),
    );
    const expectedConstraints = new Map([
      [
        "tournament_routing_executions_pk",
        { type: "p", definition: "PRIMARY KEY (plan_id, stage_key)" },
      ],
      [
        "tournament_routing_executions_stage_fk",
        {
          type: "f",
          definition:
            "FOREIGN KEY (plan_id, stage_key) REFERENCES tournament_routing_stages(plan_id, stage_key) ON DELETE CASCADE",
        },
      ],
    ]);
    for (const [name, expected] of expectedConstraints) {
      const actual = constraints.get(name);
      if (
        actual?.type !== expected.type ||
        actual.validated !== true ||
        normalizeCatalogText(actual.definition) !== expected.definition
      ) {
        problems.push(`0017: ${name} is missing or incompatible.`);
      }
    }
    const revisionCheck = constraints.get(
      "tournament_routing_executions_revision_positive",
    );
    if (
      revisionCheck?.type !== "c" ||
      revisionCheck.validated !== true ||
      !normalizeCatalogText(revisionCheck.definition).includes("revision > 0")
    ) {
      problems.push(
        "0017: tournament_routing_executions revision check is missing or incompatible.",
      );
    }
    const stateCheck = constraints.get(
      "tournament_routing_executions_state_object",
    );
    if (
      stateCheck?.type !== "c" ||
      stateCheck.validated !== true ||
      !normalizeCatalogText(stateCheck.definition).includes("jsonb_typeof(state)") ||
      !normalizeCatalogText(stateCheck.definition).includes("'object'::text")
    ) {
      problems.push(
        "0017: tournament_routing_executions state check is missing or incompatible.",
      );
    }
  }
  const routingExecutionApplied =
    routingExecutionTableExists && problems.length === routingExecutionProblemStart;

  const stageConstraintsResult = await client.query(
    `SELECT constraint_row.conname AS name,
            pg_get_constraintdef(constraint_row.oid, true) AS definition,
            constraint_row.convalidated AS validated
     FROM pg_constraint constraint_row
     JOIN pg_class table_row ON table_row.oid = constraint_row.conrelid
     JOIN pg_namespace namespace_row ON namespace_row.oid = table_row.relnamespace
     WHERE namespace_row.nspname = $1
       AND table_row.relname = 'tournament_stages'
       AND constraint_row.conname = ANY($2::text[])
     ORDER BY constraint_row.conname`,
    [config.expectedSchema, REQUIRED_STAGE_CONSTRAINTS.map(({ name }) => name)],
  );
  const stageConstraintMap = new Map(
    stageConstraintsResult.rows.map((constraint) => [constraint.name, constraint]),
  );
  for (const requirement of REQUIRED_STAGE_CONSTRAINTS) {
    const actual = stageConstraintMap.get(requirement.name);
    if (
      actual?.validated !== true ||
      normalizeCatalogText(actual?.definition ?? "") !== requirement.definition
    ) {
      problems.push(
        `canonical: constraint ${requirement.name} is missing or incompatible.`,
      );
    }
  }

  const functionsResult = await client.query(
    `SELECT namespace_row.nspname AS schema,
            procedure_row.proname AS name,
            procedure_row.prokind AS kind,
            pg_get_function_identity_arguments(procedure_row.oid) AS "identityArguments",
            pg_get_function_result(procedure_row.oid) AS result,
            procedure_row.prosrc AS body,
            language_row.lanname AS language,
            procedure_row.prosecdef AS "securityDefiner",
            procedure_row.proconfig AS config,
            procedure_row.provolatile AS volatility,
            procedure_row.proisstrict AS strict,
            procedure_row.proleakproof AS leakproof,
            procedure_row.proparallel AS parallel,
            procedure_row.proretset AS "returnsSet"
     FROM pg_proc procedure_row
     JOIN pg_namespace namespace_row ON namespace_row.oid = procedure_row.pronamespace
     JOIN pg_language language_row ON language_row.oid = procedure_row.prolang
     WHERE namespace_row.nspname = $1
       AND procedure_row.proname = ANY($2::text[])
      ORDER BY procedure_row.proname,
               pg_get_function_identity_arguments(procedure_row.oid)`,
    [config.expectedSchema, REQUIRED_STAGE_FUNCTIONS.map(({ name }) => name)],
  );
  const functionMap = new Map(
    REQUIRED_STAGE_FUNCTIONS.map(({ name }) => [
      name,
      functionsResult.rows.filter((row) => row.name === name),
    ]),
  );
  for (const requirement of REQUIRED_STAGE_FUNCTIONS) {
    const matches = functionMap.get(requirement.name) ?? [];
    const actual = matches.length === 1 ? matches[0] : null;
    if (
      !actual ||
      actual.schema !== requirement.schema ||
      actual.kind !== "f" ||
      actual.identityArguments !== requirement.identityArguments ||
      actual.result !== requirement.result ||
      actual.language !== requirement.language ||
      actual.securityDefiner !== requirement.securityDefiner ||
      !sameArray(actual.config ?? [], requirement.config) ||
      actual.volatility !== requirement.volatility ||
      actual.strict !== requirement.strict ||
      actual.leakproof !== requirement.leakproof ||
      actual.parallel !== requirement.parallel ||
      actual.returnsSet !== requirement.returnsSet ||
      bodySha256(actual.body) !== requirement.bodySha256
    ) {
      problems.push(
        `canonical: function ${requirement.name} is missing, overloaded or incompatible.`,
      );
    }
  }

  const triggersResult = await client.query(
    `SELECT namespace_row.nspname AS schema,
            trigger_row.tgname AS name,
            table_row.relname AS "table",
            trigger_row.tgenabled AS enabled,
            pg_get_triggerdef(trigger_row.oid, true) AS definition
     FROM pg_trigger trigger_row
     JOIN pg_class table_row ON table_row.oid = trigger_row.tgrelid
     JOIN pg_namespace namespace_row ON namespace_row.oid = table_row.relnamespace
     WHERE namespace_row.nspname = $1
       AND NOT trigger_row.tgisinternal
       AND trigger_row.tgname = ANY($2::text[])
     ORDER BY trigger_row.tgname`,
    [config.expectedSchema, REQUIRED_STAGE_TRIGGERS.map(({ name }) => name)],
  );
  const triggerMap = new Map(
    REQUIRED_STAGE_TRIGGERS.map(({ name }) => [
      name,
      triggersResult.rows.filter((row) => row.name === name),
    ]),
  );
  for (const requirement of REQUIRED_STAGE_TRIGGERS) {
    const matches = triggerMap.get(requirement.name) ?? [];
    const actual = matches.length === 1 ? matches[0] : null;
    if (
      !actual ||
      actual.schema !== requirement.schema ||
      actual.table !== requirement.table ||
      actual.enabled !== requirement.enabled ||
      normalizeCatalogText(actual.definition) !== requirement.definition
    ) {
      problems.push(
        `canonical: trigger ${requirement.name} is missing, duplicated or incompatible.`,
      );
    }
  }

  return {
    safe: problems.length === 0,
    status: problems.length === 0 ? "applied" : "inconsistent",
    uniqueConstraints: base.catalog.uniqueConstraints.length,
    compositeForeignKeys: base.catalog.compositeForeignKeys.length,
    functions: functionsResult.rows.length,
    triggers: triggersResult.rows.length,
    tournamentGameConfig: !gameConfigTableExists
      ? "missing"
      : problems.length === gameConfigProblemStart
        ? "applied"
        : "inconsistent",
    routingExecution: !routingExecutionTableExists
      ? "missing"
      : routingExecutionApplied
        ? "applied"
        : "inconsistent",
    problems,
  };
}

export async function collectTournamentEnginePreflight(client, config) {
  const metadataResult = await client.query(
    `SELECT current_database() AS database,
            current_schema() AS schema,
            current_setting('transaction_read_only') AS "transactionReadOnly",
            current_setting('transaction_isolation') AS "transactionIsolation"`,
  );
  const metadata = metadataResult.rows[0];
  const identityProblems = [];
  if (metadata?.database !== config.expectedDatabaseName) {
    identityProblems.push("identity: current_database() does not match EXPECTED_DATABASE_NAME.");
  }
  if (metadata?.schema !== config.expectedSchema) {
    identityProblems.push("identity: current_schema() does not match EXPECTED_DATABASE_SCHEMA.");
  }
  if (metadata?.transactionReadOnly !== "on") {
    identityProblems.push("identity: transaction_read_only is not on.");
  }
  if (metadata?.transactionIsolation !== "repeatable read") {
    identityProblems.push("identity: transaction isolation is not repeatable read.");
  }

  const historical = await collectHistoricalMigrationInspection(client, config);
  const canonical = await collectCanonicalTournamentEngineCatalog(client, config);
  const routing = await collectRoutingPersistencePreflight(client, {
    expectedDatabaseName: config.expectedDatabaseName,
    expectedSchema: config.expectedSchema,
  });
  const problems = [
    ...identityProblems,
    ...historical.problems,
    ...canonical.problems,
    ...routing.reasons.map((reason) => `0012: ${reason}`),
  ];
  const safe = problems.length === 0 && routing.safe;
  return {
    safe,
    status: safe ? "SAFE_TO_PROCEED" : "STOP",
    transactionReadOnly: metadata?.transactionReadOnly ?? null,
    transactionIsolation: metadata?.transactionIsolation ?? null,
    target: {
      database: metadata?.database ?? null,
      schema: metadata?.schema ?? null,
      environment: config.deploymentEnvironment,
    },
    historicalMigrations: historical.inspections,
    canonical,
    routingPersistence: {
      safe: routing.safe,
      status: routing.status,
      reasons: routing.reasons,
    },
    problems,
  };
}

export async function runTournamentEnginePreflight(
  env = process.env,
  logger = console,
) {
  const config = loadTournamentEnginePreflightConfig(env);
  const client = new Client({ connectionString: config.databaseUrl });
  await client.connect();
  try {
    await client.query(
      "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY",
    );
    await client.query("SET LOCAL statement_timeout = '30s'");
    const report = await collectTournamentEnginePreflight(client, config);
    await client.query("ROLLBACK");
    logger.log(JSON.stringify(report));
    return report;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runTournamentEnginePreflight().then(
    (report) => {
      process.exitCode = report.safe ? 0 : 1;
    },
    (error) => {
      console.error(JSON.stringify({
        safe: false,
        status: "STOP",
        error: error instanceof Error ? error.message : "Unknown preflight error.",
      }));
      process.exitCode = 1;
    },
  );
}
