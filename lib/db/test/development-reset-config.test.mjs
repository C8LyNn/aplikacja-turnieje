import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  DEVELOPMENT_DELETE_CONFIRMATION,
} from "../scripts/series-v1-reset-plan.mjs";
import {
  loadDevelopmentDestructiveResetConfig,
  loadDevelopmentPreflightConfig,
} from "../scripts/series-v1-reset-runtime.mjs";

function developmentEnvironment(overrides = {}) {
  return {
    DEVELOPMENT_DATABASE_URL: "postgresql://development-user:secret@localhost:55432/heliumdb",
    EXPECTED_DEVELOPMENT_DATABASE_NAME: "heliumdb",
    EXPECTED_DEVELOPMENT_DATABASE_SCHEMA: "public",
    EXPECTED_DEVELOPMENT_ENVIRONMENT: "development",
    DEVELOPMENT_ENVIRONMENT: "development",
    ALLOW_DESTRUCTIVE_DEVELOPMENT_TOURNAMENT_RESET: "true",
    CONFIRM_DEVELOPMENT_TOURNAMENT_DATA_DELETION: DEVELOPMENT_DELETE_CONFIRMATION,
    DEVELOPMENT_APP_COMMIT: "test-development-commit",
    ...overrides,
  };
}

describe("Development series_v1 reset configuration", () => {
  test("uses separate Development-only variable names", () => {
    const config = loadDevelopmentDestructiveResetConfig(
      developmentEnvironment({
        DATABASE_URL: "postgresql://production-user:secret@prod.example/neondb",
      }),
    );

    assert.equal(config.expectedDatabaseName, "heliumdb");
    assert.equal(config.deploymentEnvironment, "development");
    assert.equal(config.urlDatabaseName, "heliumdb");
    assert.match(config.databaseUrl, /localhost:55432\/heliumdb$/);
  });

  test("rejects a Production environment", () => {
    assert.throws(
      () => loadDevelopmentPreflightConfig(developmentEnvironment({
        EXPECTED_DEVELOPMENT_ENVIRONMENT: "production",
        DEVELOPMENT_ENVIRONMENT: "production",
      })),
      /must equal development/,
    );
  });

  test("rejects a Development URL for the wrong database before connecting", () => {
    assert.throws(
      () => loadDevelopmentPreflightConfig(developmentEnvironment({
        DEVELOPMENT_DATABASE_URL: "postgresql://development-user:secret@localhost:55432/neondb",
      })),
      /identifies database neondb, expected heliumdb/,
    );
  });

  test("requires the Development-specific destructive confirmation", () => {
    assert.throws(
      () => loadDevelopmentDestructiveResetConfig(developmentEnvironment({
        CONFIRM_DEVELOPMENT_TOURNAMENT_DATA_DELETION: "DELETE_ALL_LEGACY_TOURNAMENT_DATA",
      })),
      /DELETE_ALL_DEVELOPMENT_TOURNAMENT_DATA/,
    );
  });
});
