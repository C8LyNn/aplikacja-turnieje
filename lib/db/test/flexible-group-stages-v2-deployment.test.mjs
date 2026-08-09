import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  FLEXIBLE_GROUP_STAGES_MIGRATION_KEY,
  TOURNAMENT_STAGES_PREREQUISITE_KEY,
  classifyFlexibleGroupStagesMigrationState,
} from "../scripts/flexible-group-stages-v2-deployment.mjs";

const config = Object.freeze({
  expectedSchema: "public",
  expectedDatabaseName: "neondb",
  deploymentEnvironment: "production",
  appCommit: "0123456789abcdef0123456789abcdef01234567",
});

const prerequisiteMarker = Object.freeze({
  migrationKey: TOURNAMENT_STAGES_PREREQUISITE_KEY,
  targetSchema: "public",
  deploymentEnvironment: "production",
  appCommit: "older-tournament-stage-artifact",
});

const targetMarker = Object.freeze({
  migrationKey: FLEXIBLE_GROUP_STAGES_MIGRATION_KEY,
  targetSchema: "public",
  deploymentEnvironment: "production",
  appCommit: config.appCommit,
});

function schemaState(overrides = {}) {
  return {
    hasTournamentStages: true,
    hasStageGroups: true,
    hasMarkerTable: true,
    markerTableValid: true,
    legacy: true,
    flexible: false,
    details: {},
    ...overrides,
  };
}

describe("Flexible Group Stages v2 deployment classification", () => {
  test("classifies the guarded legacy Tournament Stages schema as needed", () => {
    assert.deepEqual(
      classifyFlexibleGroupStagesMigrationState({
        databaseMatches: true,
        targetSchemaExists: true,
        prerequisiteMarker,
        targetMarker: null,
        schemaState: schemaState(),
        config,
      }),
      { safe: true, status: "needed", reasons: [] },
    );
  });

  test("classifies a matching marker and flexible schema as applied", () => {
    assert.deepEqual(
      classifyFlexibleGroupStagesMigrationState({
        databaseMatches: true,
        targetSchemaExists: true,
        prerequisiteMarker,
        targetMarker,
        schemaState: schemaState({ legacy: false, flexible: true }),
        config,
      }),
      { safe: true, status: "applied", reasons: [] },
    );
  });

  test("rejects flexible schema without its migration marker", () => {
    const result = classifyFlexibleGroupStagesMigrationState({
      databaseMatches: true,
      targetSchemaExists: true,
      prerequisiteMarker,
      targetMarker: null,
      schemaState: schemaState({ legacy: false, flexible: true }),
      config,
    });
    assert.equal(result.safe, false);
    assert.equal(result.status, "inconsistent");
    assert.match(result.reasons.join(" "), /without a migration marker/i);
  });

  test("rejects execution without the Tournament Stages prerequisite marker", () => {
    const result = classifyFlexibleGroupStagesMigrationState({
      databaseMatches: true,
      targetSchemaExists: true,
      prerequisiteMarker: null,
      targetMarker: null,
      schemaState: schemaState(),
      config,
    });
    assert.equal(result.safe, false);
    assert.equal(result.status, "inconsistent");
    assert.match(result.reasons.join(" "), /prerequisite marker/i);
  });

  test("rejects a marker created by another application artifact", () => {
    const result = classifyFlexibleGroupStagesMigrationState({
      databaseMatches: true,
      targetSchemaExists: true,
      prerequisiteMarker,
      targetMarker: { ...targetMarker, appCommit: "f".repeat(40) },
      schemaState: schemaState({ legacy: false, flexible: true }),
      config,
    });
    assert.equal(result.safe, false);
    assert.match(result.reasons.join(" "), /deployment guards/i);
  });
});
