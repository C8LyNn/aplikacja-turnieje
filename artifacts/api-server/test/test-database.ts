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
const STAGE_SCHEMA_RECONCILIATION_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0007_reconcile_stage_schema.sql",
  import.meta.url,
);
const STAGE_PROCEDURAL_OBJECTS_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0008_restore_stage_procedural_objects.sql",
  import.meta.url,
);
const COMPOSITE_FOREIGN_KEYS_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0009_reconcile_composite_foreign_keys.sql",
  import.meta.url,
);
const AUTH_CREDENTIAL_RATE_LIMITS_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0010_auth_credential_rate_limits.sql",
  import.meta.url,
);
const REPLIT_SCHEMA_CATALOG_RECONCILIATION_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0011_reconcile_replit_schema_catalog.sql",
  import.meta.url,
);
const TOURNAMENT_ROUTING_PERSISTENCE_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0012_tournament_routing_persistence_v2.sql",
  import.meta.url,
);
const TOURNAMENT_GAME_CONFIG_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0013_tournament_game_config.sql",
  import.meta.url,
);
const DEADLOCK_BANS_AND_PICKS_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0014_deadlock_bans_and_picks.sql",
  import.meta.url,
);
const DEADLOCK_GAME_SIDE_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0015_deadlock_game_side.sql",
  import.meta.url,
);
const TOURNAMENT_PRESENTATION_SETTINGS_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0016_tournament_presentation_settings.sql",
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
    const stageSchemaReconciliationMigrationSql = renderSeriesV1MigrationForTestSchema(
      await readFile(STAGE_SCHEMA_RECONCILIATION_MIGRATION_URL, "utf8"),
      schema,
    ).replace(MIGRATION_RUNNER_TRANSACTION_BLOCK, "");
    const stageProceduralObjectsMigrationSql = renderSeriesV1MigrationForTestSchema(
      await readFile(STAGE_PROCEDURAL_OBJECTS_MIGRATION_URL, "utf8"),
      schema,
    ).replace(MIGRATION_RUNNER_TRANSACTION_BLOCK, "");
    const compositeForeignKeysMigrationSql = renderSeriesV1MigrationForTestSchema(
      await readFile(COMPOSITE_FOREIGN_KEYS_MIGRATION_URL, "utf8"),
      schema,
    ).replace(MIGRATION_RUNNER_TRANSACTION_BLOCK, "");
    const authCredentialRateLimitsMigrationSql =
      renderSeriesV1MigrationForTestSchema(
        await readFile(AUTH_CREDENTIAL_RATE_LIMITS_MIGRATION_URL, "utf8"),
        schema,
      ).replace(MIGRATION_RUNNER_TRANSACTION_BLOCK, "");
    const replitSchemaCatalogReconciliationMigrationSql =
      renderSeriesV1MigrationForTestSchema(
        await readFile(
          REPLIT_SCHEMA_CATALOG_RECONCILIATION_MIGRATION_URL,
          "utf8",
        ),
        schema,
      ).replace(MIGRATION_RUNNER_TRANSACTION_BLOCK, "");
    const tournamentRoutingPersistenceMigrationSql =
      renderSeriesV1MigrationForTestSchema(
        await readFile(
          TOURNAMENT_ROUTING_PERSISTENCE_MIGRATION_URL,
          "utf8",
        ),
        schema,
      ).replace(MIGRATION_RUNNER_TRANSACTION_BLOCK, "");
    const tournamentGameConfigMigrationSql =
      renderSeriesV1MigrationForTestSchema(
        await readFile(TOURNAMENT_GAME_CONFIG_MIGRATION_URL, "utf8"),
        schema,
      ).replace(MIGRATION_RUNNER_TRANSACTION_BLOCK, "");
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
      await pool.query(stageSchemaReconciliationMigrationSql);
      // Replaying the reconciliation is part of every integration database setup.
      await pool.query(stageSchemaReconciliationMigrationSql);
      await pool.query(stageProceduralObjectsMigrationSql);
      await pool.query(compositeForeignKeysMigrationSql);
      await pool.query(authCredentialRateLimitsMigrationSql);
      // Every isolated schema proves that the forward-only limiter migration
      // remains safe to replay after an existing 0008/0009 state.
      await pool.query(authCredentialRateLimitsMigrationSql);
      await pool.query(replitSchemaCatalogReconciliationMigrationSql);
      // Every isolated schema also proves that catalog reconciliation is
      // idempotent after the complete 0001-0010 history.
      await pool.query(replitSchemaCatalogReconciliationMigrationSql);
      await pool.query(tournamentRoutingPersistenceMigrationSql);
      // Persistence DDL is replayed in every isolated integration schema to
      // prove that a deployment retry does not duplicate or weaken objects.
      await pool.query(tournamentRoutingPersistenceMigrationSql);
      await pool.query(tournamentGameConfigMigrationSql);
      // Optional game configuration remains safe to apply more than once.
      await pool.query(tournamentGameConfigMigrationSql);
      const deadlockBansAndPicksMigrationSql =
        renderSeriesV1MigrationForTestSchema(
          await readFile(DEADLOCK_BANS_AND_PICKS_MIGRATION_URL, "utf8"),
          schema,
        ).replace(MIGRATION_RUNNER_TRANSACTION_BLOCK, "");
      await pool.query(deadlockBansAndPicksMigrationSql);
      // Deadlock ban/picks schema is idempotent (IF NOT EXISTS).
      await pool.query(deadlockBansAndPicksMigrationSql);
      const deadlockGameSideMigrationSql =
        renderSeriesV1MigrationForTestSchema(
          await readFile(DEADLOCK_GAME_SIDE_MIGRATION_URL, "utf8"),
          schema,
        ).replace(MIGRATION_RUNNER_TRANSACTION_BLOCK, "");
      await pool.query(deadlockGameSideMigrationSql);
      // Side column uses IF NOT EXISTS — safe to replay.
      await pool.query(deadlockGameSideMigrationSql);
      const tournamentPresentationSettingsMigrationSql =
        renderSeriesV1MigrationForTestSchema(
          await readFile(TOURNAMENT_PRESENTATION_SETTINGS_MIGRATION_URL, "utf8"),
          schema,
        ).replace(MIGRATION_RUNNER_TRANSACTION_BLOCK, "");
      await pool.query(tournamentPresentationSettingsMigrationSql);
      // presentationSettings column uses IF NOT EXISTS — safe to replay.
      await pool.query(tournamentPresentationSettingsMigrationSql);
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
