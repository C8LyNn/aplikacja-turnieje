import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { loadSchemaCatalogComparisonConfig } from "../scripts/compare-replit-schema-catalogs.mjs";

function validEnvironment() {
  return {
    SCHEMA_COMPARE_DEVELOPMENT_DATABASE_URL:
      "postgresql://localhost:55432/schema_compare_development_test",
    SCHEMA_COMPARE_PRODUCTION_DATABASE_URL:
      "postgresql://localhost:55433/schema_compare_production_test",
    SCHEMA_COMPARE_EXPECTED_DEVELOPMENT_DATABASE_NAME:
      "schema_compare_development_test",
    SCHEMA_COMPARE_EXPECTED_PRODUCTION_DATABASE_NAME:
      "schema_compare_production_test",
    SCHEMA_COMPARE_EXPECTED_SCHEMA: "public",
  };
}

describe("read-only Replit schema catalog comparison configuration", () => {
  test("uses dedicated Development and Production variables without fallback", () => {
    const config = loadSchemaCatalogComparisonConfig(validEnvironment());
    assert.equal(config.development.label, "development");
    assert.equal(config.production.label, "production");
    assert.equal(config.expectedSchema, "public");
  });

  test("rejects a missing dedicated URL even when generic URLs exist", () => {
    const environment = validEnvironment();
    delete environment.SCHEMA_COMPARE_DEVELOPMENT_DATABASE_URL;
    assert.throws(
      () =>
        loadSchemaCatalogComparisonConfig({
          ...environment,
          DEVELOPMENT_DATABASE_URL:
            "postgresql://localhost:55432/ignored_development_test",
          DATABASE_URL: "postgresql://localhost:55433/ignored_production_test",
        }),
      /SCHEMA_COMPARE_DEVELOPMENT_DATABASE_URL is required/,
    );
  });

  test("rejects the same target, database name, and any schema other than public", () => {
    const sameTarget = validEnvironment();
    sameTarget.SCHEMA_COMPARE_PRODUCTION_DATABASE_URL =
      sameTarget.SCHEMA_COMPARE_DEVELOPMENT_DATABASE_URL;
    assert.throws(
      () => loadSchemaCatalogComparisonConfig(sameTarget),
      /different databases/,
    );

    const sameName = validEnvironment();
    sameName.SCHEMA_COMPARE_EXPECTED_PRODUCTION_DATABASE_NAME =
      sameName.SCHEMA_COMPARE_EXPECTED_DEVELOPMENT_DATABASE_NAME;
    assert.throws(
      () => loadSchemaCatalogComparisonConfig(sameName),
      /database names must differ/,
    );

    const wrongSchema = validEnvironment();
    wrongSchema.SCHEMA_COMPARE_EXPECTED_SCHEMA = "custom";
    assert.throws(
      () => loadSchemaCatalogComparisonConfig(wrongSchema),
      /must equal public/,
    );
  });
});
