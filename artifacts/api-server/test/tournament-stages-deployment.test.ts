import assert from "node:assert/strict";
import { describe, test } from "node:test";
// @ts-expect-error Deployment scripts intentionally stay plain ESM for direct Node execution.
import * as tournamentStagesDeployment from "../../../lib/db/scripts/tournament-stages-v1-deployment.mjs";

const {
  classifyTournamentStagesMigrationState,
  loadTournamentStagesDeploymentConfig,
} = tournamentStagesDeployment;

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

const config = {
  expectedDatabaseName: "neondb",
  expectedSchema: "public",
  deploymentEnvironment: "production",
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
});
