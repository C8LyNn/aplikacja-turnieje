import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  CONFIGURABLE_SEEDING_MIGRATION_KEY,
  CONFIGURABLE_SEEDING_PREREQUISITE_KEY,
  classifyConfigurableSeedingMigrationState,
  inspectConfigurableSeedingSchema,
} from "../scripts/configurable-seeding-v2-deployment.mjs";

const config = Object.freeze({
  expectedSchema: "public",
  expectedDatabaseName: "neondb",
  deploymentEnvironment: "production",
  appCommit: "0123456789abcdef0123456789abcdef01234567",
});
const prerequisiteMarker = Object.freeze({
  migrationKey: CONFIGURABLE_SEEDING_PREREQUISITE_KEY,
  targetSchema: "public",
  deploymentEnvironment: "production",
  appCommit: "patch-02",
});
const targetMarker = Object.freeze({
  migrationKey: CONFIGURABLE_SEEDING_MIGRATION_KEY,
  targetSchema: "public",
  deploymentEnvironment: "production",
  appCommit: config.appCommit,
});
function schemaState(overrides = {}) {
  return {
    hasTournamentStages: true,
    hasMarkerTable: true,
    legacy: true,
    configured: false,
    details: {},
    ...overrides,
  };
}

describe("Configurable Seeding v2 deployment classification", () => {
  test("classifies the Patch 02 schema as needed", () => {
    assert.deepEqual(classifyConfigurableSeedingMigrationState({
      databaseMatches: true,
      targetSchemaExists: true,
      prerequisiteMarker,
      targetMarker: null,
      schemaState: schemaState(),
      config,
    }), { safe: true, status: "needed", reasons: [] });
  });

  test("rejects an enum with the right size but a wrong value", async () => {
    const requiredColumns = [
      "entry_seeding_policy",
      "result_seeding_policy",
      "random_seed",
      "random_reveal_order",
      "seeding_audit",
    ];
    const requiredConstraints = [
      "tournament_stages_seeding_configuration",
      "tournament_stages_result_seeding_configuration",
      "tournament_stages_random_seed_configuration",
      "tournament_stages_seeding_audit_shape",
    ];
    const enums = {
      stage_seeding_policy: [
        "standings_order", "snake_groups", "cross_group", "random_groups",
        "standard_bracket", "random_bracket",
      ],
      stage_entry_seeding_policy: [
        "preserve", "registration_order", "alphabetical", "random", "wrong_manual",
      ],
      stage_result_seeding_policy: ["standings_order", "rank_bands", "global_ranking"],
      stage_random_reveal_order: ["instant", "sequential"],
    };
    const client = {
      async query(sql) {
        if (sql.includes("to_regclass")) {
          return { rows: [{ hasTournamentStages: true, hasMarkerTable: true }] };
        }
        if (sql.includes("information_schema.columns")) {
          return { rows: requiredColumns.map((column_name) => ({ column_name })) };
        }
        if (sql.includes("pg_constraint")) {
          return { rows: requiredConstraints.map((name) => ({ name })) };
        }
        if (sql.includes("pg_enum")) {
          return {
            rows: Object.entries(enums).flatMap(([name, values]) =>
              values.map((value) => ({ name, value }))),
          };
        }
        throw new Error(`Unexpected query: ${sql}`);
      },
    };

    const result = await inspectConfigurableSeedingSchema(client, "public");
    assert.equal(result.configured, false);
    assert.equal(result.details.configuredEnums, false);
  });

  test("classifies a matching marker and configured schema as applied", () => {
    assert.deepEqual(classifyConfigurableSeedingMigrationState({
      databaseMatches: true,
      targetSchemaExists: true,
      prerequisiteMarker,
      targetMarker,
      schemaState: schemaState({ legacy: false, configured: true }),
      config,
    }), { safe: true, status: "applied", reasons: [] });
  });

  test("rejects configured schema without its marker", () => {
    const result = classifyConfigurableSeedingMigrationState({
      databaseMatches: true,
      targetSchemaExists: true,
      prerequisiteMarker,
      targetMarker: null,
      schemaState: schemaState({ legacy: false, configured: true }),
      config,
    });
    assert.equal(result.safe, false);
    assert.match(result.reasons.join(" "), /without a migration marker/i);
  });

  test("requires the Flexible Group Stages prerequisite marker", () => {
    const result = classifyConfigurableSeedingMigrationState({
      databaseMatches: true,
      targetSchemaExists: true,
      prerequisiteMarker: null,
      targetMarker: null,
      schemaState: schemaState(),
      config,
    });
    assert.equal(result.safe, false);
    assert.match(result.reasons.join(" "), /prerequisite marker/i);
  });
});
