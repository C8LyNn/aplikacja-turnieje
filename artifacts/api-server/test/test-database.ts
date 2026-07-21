import { readFile } from "node:fs/promises";

const RESET_CONFIRMATION = "DROP_TM_TEST_SCHEMA";
const SAFE_SCHEMA_PATTERN = /^tm_test_[a-z0-9_]+$/;
const SERIES_V1_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0001_series_v1_clean_cutover.sql",
  import.meta.url,
);
const TOURNAMENT_STAGES_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0002_tournament_stages_v1.sql",
  import.meta.url,
);
const FLEXIBLE_GROUP_STAGES_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0003_flexible_group_stages_v2.sql",
  import.meta.url,
);
const CONFIGURABLE_SEEDING_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0004_configurable_seeding_v2.sql",
  import.meta.url,
);
const STAGE_PARTICIPANT_FLOW_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0005_stage_participant_flow.sql",
  import.meta.url,
);
const MULTISTAGE_PARTICIPANT_COMPAT_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0006_fix_multistage_participant_compat.sql",
  import.meta.url,
);
const MIGRATION_RUNNER_TRANSACTION_BLOCK =
  /^-- migration-runner-strip-begin\r?\n[\s\S]*?^-- migration-runner-strip-end\r?\n?/gm;

function assertSafeTestSchema(schema: string): void {
  if (!SAFE_SCHEMA_PATTERN.test(schema)) {
    throw new Error("Refusing to modify an unsafe test schema name.");
  }
}

export interface TestDatabaseConfig {
  connectionString: string;
  schema: string;
}

export interface TestPool {
  query: (text: string, values?: unknown[]) => Promise<{ rows: unknown[]; rowCount: number | null }>;
  end: () => Promise<void>;
}

export function renderSeriesV1MigrationForTestSchema(sql: string, schema: string): string {
  assertSafeTestSchema(schema);
  return sql.replaceAll("public.", `"${schema}".`);
}

export function getSafeTestDatabaseConfig(env: NodeJS.ProcessEnv = process.env): TestDatabaseConfig {
  if (!env.NODE_TEST_CONTEXT) {
    throw new Error("Integration database setup may run only under the Node test runner.");
  }

  const rawUrl = env.TEST_DATABASE_URL;
  if (!rawUrl) {
    throw new Error(
      "TEST_DATABASE_URL is required. It must point to a dedicated PostgreSQL database whose name contains 'test'.",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("TEST_DATABASE_URL must be a valid PostgreSQL connection URL.");
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error("TEST_DATABASE_URL must use the postgres:// or postgresql:// protocol.");
  }

  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  const targetFingerprint = `${parsed.hostname}/${databaseName}`.toLowerCase();
  if (!databaseName.toLowerCase().includes("test") || targetFingerprint.includes("prod")) {
    throw new Error(
      "Refusing integration tests: the PostgreSQL database name must contain 'test' and the target must not contain 'prod'.",
    );
  }

  const schema = env.TEST_DATABASE_SCHEMA ?? "tm_test_access";
  if (!SAFE_SCHEMA_PATTERN.test(schema)) {
    throw new Error("TEST_DATABASE_SCHEMA must match ^tm_test_[a-z0-9_]+$ and cannot be public.");
  }

  if (env.TEST_DATABASE_RESET !== RESET_CONFIRMATION) {
    throw new Error(`TEST_DATABASE_RESET must equal ${RESET_CONFIRMATION}.`);
  }

  parsed.searchParams.set("options", `-c search_path=${schema}`);
  return { connectionString: parsed.toString(), schema };
}

export async function resetTestSchema(pool: TestPool, schema: string): Promise<void> {
  assertSafeTestSchema(schema);
  let schemaCreated = false;
  try {
    await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await pool.query(`CREATE SCHEMA "${schema}"`);
    schemaCreated = true;
    await pool.query(`SET search_path TO "${schema}"`);
    const migrationSql = renderSeriesV1MigrationForTestSchema(
      await readFile(SERIES_V1_MIGRATION_URL, "utf8"),
      schema,
    );
    const stagesMigrationSql = renderSeriesV1MigrationForTestSchema(
      await readFile(TOURNAMENT_STAGES_MIGRATION_URL, "utf8"),
      schema,
    ).replace(MIGRATION_RUNNER_TRANSACTION_BLOCK, "");
    const flexibleGroupsMigrationSql = renderSeriesV1MigrationForTestSchema(
      await readFile(FLEXIBLE_GROUP_STAGES_MIGRATION_URL, "utf8"),
      schema,
    );
    const configurableSeedingMigrationSql = renderSeriesV1MigrationForTestSchema(
      await readFile(CONFIGURABLE_SEEDING_MIGRATION_URL, "utf8"),
      schema,
    );
    const stageParticipantFlowMigrationSql = renderSeriesV1MigrationForTestSchema(
      await readFile(STAGE_PARTICIPANT_FLOW_MIGRATION_URL, "utf8"),
      schema,
    );
    const multistageParticipantCompatMigrationSql = renderSeriesV1MigrationForTestSchema(
      await readFile(MULTISTAGE_PARTICIPANT_COMPAT_MIGRATION_URL, "utf8"),
      schema,
    );
    await pool.query("BEGIN");
    try {
      await pool.query(migrationSql);
      await pool.query(stagesMigrationSql);
      await pool.query(flexibleGroupsMigrationSql);
      await pool.query(configurableSeedingMigrationSql);
      await pool.query(stageParticipantFlowMigrationSql);
      await pool.query(multistageParticipantCompatMigrationSql);
      // Every isolated integration schema proves that the forward-only compatibility
      // fix is safe to replay after the participant-flow migration.
      await pool.query(multistageParticipantCompatMigrationSql);
      await pool.query("COMMIT");
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    if (schemaCreated) {
      try {
        await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      } catch {
        // Preserve the original setup error; cleanup will be retried on the next run.
      }
    }
    throw error;
  }
}

export async function dropTestSchema(pool: TestPool, schema: string): Promise<void> {
  assertSafeTestSchema(schema);
  await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
}
