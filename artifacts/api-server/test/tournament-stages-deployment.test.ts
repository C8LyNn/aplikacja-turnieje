import assert from "node:assert/strict";
import { describe, test } from "node:test";
// @ts-expect-error Deployment scripts intentionally stay plain ESM for direct Node execution.
import * as tournamentStagesDeployment from "../../../lib/db/scripts/tournament-stages-v1-deployment.mjs";
// @ts-expect-error Deployment scripts intentionally stay plain ESM for direct Node execution.
import * as tournamentStagesMigration from "../../../lib/db/scripts/migrate-tournament-stages-v1.mjs";

const {
  classifyTournamentStagesMigrationState,
  loadTournamentStagesDevelopmentDeploymentConfig,
  loadTournamentStagesDeploymentConfig,
  runTournamentStagesReadOnlyPreflight,
} = tournamentStagesDeployment;
const { resolveTournamentStagesMigrationPreflight } = tournamentStagesMigration;

const DEPLOYED_APP_COMMIT = "0123456789abcdef0123456789abcdef01234567";

const guardedEnvironment = {
  DATABASE_URL:
    "postgresql://deployment-user:private-value@database.example/neondb",
  EXPECTED_DATABASE_NAME: "neondb",
  EXPECTED_DATABASE_SCHEMA: "public",
  EXPECTED_DEPLOYMENT_ENVIRONMENT: "production",
  DEPLOYMENT_ENVIRONMENT: "production",
  APP_COMMIT: DEPLOYED_APP_COMMIT,
};

const guardedDevelopmentEnvironment = {
  DEVELOPMENT_DATABASE_URL:
    "postgresql://development-user:test-value@development.example/heliumdb",
  DATABASE_URL:
    "postgresql://production-user:test-value@production.example/neondb",
  EXPECTED_DATABASE_NAME: "heliumdb",
  EXPECTED_DATABASE_SCHEMA: "public",
  EXPECTED_DEPLOYMENT_ENVIRONMENT: "development",
  DEPLOYMENT_ENVIRONMENT: "development",
  APP_COMMIT: DEPLOYED_APP_COMMIT,
};

const config = {
  expectedDatabaseName: "neondb",
  expectedSchema: "public",
  deploymentEnvironment: "production",
  appCommit: DEPLOYED_APP_COMMIT,
};

const developmentConfig = {
  expectedDatabaseName: "heliumdb",
  expectedSchema: "public",
  deploymentEnvironment: "development",
  appCommit: DEPLOYED_APP_COMMIT,
};

const absentStageSchema = {
  hasStages: false,
  hasParticipants: false,
  hasGroups: false,
  hasStageTypes: false,
  hasStageSequences: false,
  hasActiveStageIndex: false,
  matchStageRequired: false,
  hasMatchStageGroup: false,
  historyStageRequired: false,
  hasActionLogStage: false,
  hasActiveStagePointer: false,
  hasCriticalConstraints: false,
  hasMatchNextStageIntegrity: false,
  hasCompatibilityFunctions: false,
  hasCompatibilityTriggers: false,
};

const completeStageSchema = Object.fromEntries(
  Object.keys(absentStageSchema).map((name) => [name, true]),
);

const seriesMarker = {
  migrationKey: "series_v1_clean_cutover",
  appCommit: "series-v1-cutover-commit",
  targetSchema: "public",
  deploymentEnvironment: "production",
};

const stagesMarker = {
  migrationKey: "tournament_stages_v1",
  appCommit: DEPLOYED_APP_COMMIT,
  targetSchema: "public",
  deploymentEnvironment: "production",
};

const developmentSeriesMarker = {
  ...seriesMarker,
  deploymentEnvironment: "development",
};

const developmentStagesMarker = {
  ...stagesMarker,
  deploymentEnvironment: "development",
};

function classify(overrides: Record<string, unknown> = {}) {
  return classifyTournamentStagesMigrationState({
    databaseMatches: true,
    targetSchemaExists: true,
    seriesV1State: "series_v1",
    markerTableValid: true,
    seriesV1Marker: seriesMarker,
    stagesMarker: null,
    stageSchemaChecks: absentStageSchema,
    config,
    ...overrides,
  });
}

describe("Tournament Stages v1 deployment safety", () => {
  test("requires every deployment guard and the full deployed artifact commit", () => {
    const loaded = loadTournamentStagesDeploymentConfig(guardedEnvironment);
    assert.equal(loaded.expectedDatabaseName, "neondb");
    assert.equal(loaded.expectedSchema, "public");
    assert.equal(loaded.deploymentEnvironment, "production");
    assert.equal(loaded.appCommit, DEPLOYED_APP_COMMIT);

    assert.throws(
      () =>
        loadTournamentStagesDeploymentConfig({
          ...guardedEnvironment,
          APP_COMMIT: "30cc019",
        }),
      /full 40-character Git commit hash/,
    );
    assert.throws(
      () =>
        loadTournamentStagesDeploymentConfig({
          ...guardedEnvironment,
          EXPECTED_DATABASE_SCHEMA: "tenant_schema",
        }),
      /must equal public/,
    );
    assert.throws(
      () =>
        loadTournamentStagesDeploymentConfig({
          ...guardedEnvironment,
          DEPLOYMENT_ENVIRONMENT: "development",
        }),
      /does not match/,
    );
    assert.throws(
      () =>
        loadTournamentStagesDeploymentConfig({
          ...guardedEnvironment,
          EXPECTED_DEPLOYMENT_ENVIRONMENT: "development",
          DEPLOYMENT_ENVIRONMENT: "development",
        }),
      /must equal production/,
    );
  });

  test("loads Development guards from a separate Development database URL", () => {
    const loaded = loadTournamentStagesDevelopmentDeploymentConfig(
      guardedDevelopmentEnvironment,
    );

    assert.equal(loaded.expectedDatabaseName, "heliumdb");
    assert.equal(loaded.expectedSchema, "public");
    assert.equal(loaded.deploymentEnvironment, "development");
    assert.equal(
      loaded.databaseUrl,
      guardedDevelopmentEnvironment.DEVELOPMENT_DATABASE_URL,
    );
    assert.notEqual(
      loaded.databaseUrl,
      guardedDevelopmentEnvironment.DATABASE_URL,
    );
  });

  test("rejects Production and neondb in the Development path before connecting", () => {
    assert.throws(
      () =>
        loadTournamentStagesDevelopmentDeploymentConfig({
          ...guardedDevelopmentEnvironment,
          EXPECTED_DEPLOYMENT_ENVIRONMENT: "production",
          DEPLOYMENT_ENVIRONMENT: "production",
        }),
      /must equal development/,
    );
    assert.throws(
      () =>
        loadTournamentStagesDevelopmentDeploymentConfig({
          ...guardedDevelopmentEnvironment,
          DEVELOPMENT_DATABASE_URL:
            "postgresql://development-user:test-value@development.example/neondb",
          EXPECTED_DATABASE_NAME: "neondb",
        }),
      /must not target the Production database neondb/,
    );
    assert.throws(
      () =>
        loadTournamentStagesDevelopmentDeploymentConfig({
          ...guardedDevelopmentEnvironment,
          DEVELOPMENT_DATABASE_URL:
            "postgresql://development-user:test-value@development.example/neondb",
        }),
      /identifies database neondb, expected heliumdb/,
    );
    assert.throws(
      () =>
        loadTournamentStagesDevelopmentDeploymentConfig({
          ...guardedDevelopmentEnvironment,
          APP_COMMIT: "9420ef9",
        }),
      /full 40-character Git commit hash/,
    );
  });

  test("classifies an untouched series_v1 schema as needing migration 0002", () => {
    assert.deepEqual(classify(), {
      safe: true,
      status: "needed",
      reasons: [],
    });
  });

  test("classifies a matching marker and complete stage schema as applied", () => {
    assert.deepEqual(
      classify({
        stagesMarker,
        stageSchemaChecks: completeStageSchema,
      }),
      {
        safe: true,
        status: "applied",
        reasons: [],
      },
    );
  });

  test("rejects partial schema, marker drift, and a non-series_v1 base", () => {
    const partial = classify({
      stageSchemaChecks: { ...absentStageSchema, hasStages: true },
    });
    assert.equal(partial.safe, false);
    assert.equal(partial.status, "inconsistent");

    const markerDrift = classify({
      stagesMarker: { ...stagesMarker, appCommit: "different-commit" },
      stageSchemaChecks: completeStageSchema,
    });
    assert.equal(markerDrift.safe, false);
    assert.match(markerDrift.reasons.join(" "), /marker metadata/);

    const legacy = classify({ seriesV1State: "legacy" });
    assert.equal(legacy.safe, false);
    assert.match(legacy.reasons.join(" "), /expected series_v1/);
  });

  test("runs the Development preflight to completion without issuing writes", async () => {
    const statements: string[] = [];
    const client = {
      async query(sql: string) {
        statements.push(sql);
        if (sql === "BEGIN READ ONLY" || sql === "ROLLBACK") {
          return { rows: [] };
        }
        if (sql.includes("current_database()")) {
          return {
            rows: [
              {
                database: "heliumdb",
                currentSchema: "public",
                searchPath: "public",
                targetSchemaExists: true,
              },
            ],
          };
        }
        if (sql.includes("class.relname AS name")) {
          return {
            rows: [
              "auth_audit_log",
              "support_sessions",
              "action_log",
              "result_history",
              "matches",
              "players",
              "tournaments",
            ].map((name) => ({ name })),
          };
        }
        if (sql.includes("type.typname AS name")) {
          return {
            rows: [
              "match_result_type",
              "match_status",
              "player_status",
              "ranking_policy",
              "result_model_version",
              "tournament_status",
              "tournament_format",
            ].map((name) => ({ name })),
          };
        }
        if (
          sql.includes("information_schema.columns") &&
          sql.includes("table_name = ANY")
        ) {
          return {
            rows: [
              ["tournaments", "result_model_version"],
              ["tournaments", "ranking_policy"],
              ["tournaments", "default_best_of"],
              ["matches", "best_of"],
              ["matches", "result_type"],
              ["matches", "result_reason"],
            ].map(([table, column]) => ({ table, column })),
          };
        }
        if (sql.includes("to_regclass($1) IS NOT NULL AS exists")) {
          return { rows: [{ exists: true }] };
        }
        if (
          sql.includes("information_schema.columns") &&
          sql.includes("app_schema_migrations")
        ) {
          return {
            rows: [
              "migration_key",
              "applied_at",
              "app_commit",
              "target_schema",
              "deployment_environment",
            ].map((column_name) => ({ column_name })),
          };
        }
        if (sql.includes('FROM "public".app_schema_migrations')) {
          return { rows: [developmentSeriesMarker] };
        }
        if (sql.includes('AS "hasStages"')) {
          return { rows: [absentStageSchema] };
        }
        throw new Error(`Unexpected preflight query: ${sql}`);
      },
    };

    const report = await runTournamentStagesReadOnlyPreflight(
      client,
      developmentConfig,
    );
    assert.equal(report.safe, true);
    assert.equal(report.migration.status, "needed");
    assert.equal(statements[0], "BEGIN READ ONLY");
    assert.equal(statements.at(-1), "ROLLBACK");
    assert.equal(
      statements.some((sql) =>
        /^\s*(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|MERGE|CALL|DO)\b/i.test(
          sql,
        ),
      ),
      false,
    );
  });

  test("treats a second matching Development migration as idempotently applied", () => {
    const classification = classifyTournamentStagesMigrationState({
      databaseMatches: true,
      targetSchemaExists: true,
      seriesV1State: "series_v1",
      markerTableValid: true,
      seriesV1Marker: developmentSeriesMarker,
      stagesMarker: developmentStagesMarker,
      stageSchemaChecks: completeStageSchema,
      config: developmentConfig,
    });

    assert.deepEqual(classification, {
      safe: true,
      status: "applied",
      reasons: [],
    });
    assert.deepEqual(
      resolveTournamentStagesMigrationPreflight({
        safe: classification.safe,
        reasons: classification.reasons,
        migration: { status: classification.status },
      }),
      {
        applied: false,
        migrationKey: "tournament_stages_v1",
      },
    );
  });
});
