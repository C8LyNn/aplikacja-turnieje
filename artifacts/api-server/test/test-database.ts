import { readFile } from "node:fs/promises";
import { requireSafetyContext, resetRunSchema, dropRunSchema } from "./pg16-test-ownership";

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
const DOUBLE_ELIMINATION_ENGINE_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0017_double_elimination_engine_v2.sql",
  import.meta.url,
);
const TOURNAMENT_FORMAT_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0018_tournament_format_add_group_stage_and_de.sql",
  import.meta.url,
);
const DOUBLE_ELIMINATION_TRIGGER_FIX_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0019_fix_de_single_stage_trigger.sql",
  import.meta.url,
);
const STAGE_PARTICIPANT_BASKETS_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0020_stage_participant_baskets.sql",
  import.meta.url,
);
const STAGE_BASKET_QUALIFIER_COUNT_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0021_stage_basket_qualifier_count.sql",
  import.meta.url,
);
const QUALIFICATION_PROPOSAL_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0022_qualification_proposal.sql",
  import.meta.url,
);
const BASKET_ROUTE_EXECUTION_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0023_basket_route_execution.sql",
  import.meta.url,
);
const BASKET_FLOW_AUTHORITY_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0024_basket_flow_authority.sql",
  import.meta.url,
);
const MARVEL_ELIMINATION_GROUPS_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0025_marvel_elimination_groups.sql",
  import.meta.url,
);
const BASKET_AUTHORITY_TRIGGER_BYPASS_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0026_basket_authority_trigger_bypass.sql",
  import.meta.url,
);
const PRESERVE_STARTED_MEMBERSHIPS_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0027_preserve_started_stage_memberships.sql",
  import.meta.url,
);
const MATCH_REVISION_MIGRATION_URL = new URL(
  "../../../lib/db/migrations/0028_match_revision.sql", import.meta.url,
);
const MIGRATION_RUNNER_TRANSACTION_BLOCK =
  /^-- migration-runner-strip-begin\r?\n[\s\S]*?^-- migration-runner-strip-end\r?\n?/gm;
const STANDALONE_TRANSACTION_BOUNDARY = /^(?:BEGIN|COMMIT);\r?\n?/gm;

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

  const context = requireSafetyContext(env);
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  // The old substring 'test' / no-'prod' guard was never a physical target
  // identity check. Fail before opening ANY test DB connection.
  if (parsed.hostname !== "127.0.0.1" ||
      parsed.port !== "55432" ||
      parsed.username !== encodeURIComponent(context.roleName) &&
        decodeURIComponent(parsed.username) !== context.roleName ||
      databaseName !== context.baseDatabase ||
      parsed.hash !== "" || parsed.search !== "" ||
      !parsed.password || parsed.protocol !== "postgresql:") {
    throw new Error("WEB005_CLEANUP_HOLD:S1_SIGNED_BASE_DSN_MISMATCH");
  }
  if (env.DATABASE_URL) {
    let alias: URL;
    try { alias = new URL(env.DATABASE_URL); }
    catch { throw new Error("WEB005_CLEANUP_HOLD:S1_ALIAS_NOT_A_URL"); }
    // Application imports may add the sealed search_path option. No other
    // alias target/credential/parameter differences are authorized.
    const aliasOptions = alias.searchParams.get("options");
    if (aliasOptions !== null &&
        aliasOptions !== `-c search_path=tm_test_${context.runId}`) {
      throw new Error("WEB005_CLEANUP_HOLD:S1_ALIAS_OPTIONS_MISMATCH");
    }
    alias.searchParams.delete("options");
    if (alias.toString() !== parsed.toString()) {
      throw new Error("WEB005_CLEANUP_HOLD:S1_DATABASE_URL_ALIAS_MISMATCH");
    }
  }
  const schema = env.TEST_DATABASE_SCHEMA;
  if (schema !== `tm_test_${context.runId}`) {
    throw new Error("WEB005_CLEANUP_HOLD:S1 schema must be bound to the sealed run.");
  }
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
    await resetRunSchema(pool, schema);
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
    const doubleEliminationEngineMigrationSql =
      renderSeriesV1MigrationForTestSchema(
        await readFile(DOUBLE_ELIMINATION_ENGINE_MIGRATION_URL, "utf8"),
        schema,
      ).replace(MIGRATION_RUNNER_TRANSACTION_BLOCK, "");
    const tournamentFormatMigrationSql = renderSeriesV1MigrationForTestSchema(
      await readFile(TOURNAMENT_FORMAT_MIGRATION_URL, "utf8"),
      schema,
    ).replace(STANDALONE_TRANSACTION_BOUNDARY, "");
    const doubleEliminationTriggerFixMigrationSql =
      renderSeriesV1MigrationForTestSchema(
        await readFile(DOUBLE_ELIMINATION_TRIGGER_FIX_MIGRATION_URL, "utf8"),
        schema,
      ).replace(STANDALONE_TRANSACTION_BOUNDARY, "");
    const stageParticipantBasketsMigrationSql =
      renderSeriesV1MigrationForTestSchema(
        await readFile(STAGE_PARTICIPANT_BASKETS_MIGRATION_URL, "utf8"),
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
      await pool.query(doubleEliminationEngineMigrationSql);
      // The execution table and format reconciliation are idempotent.
      await pool.query(doubleEliminationEngineMigrationSql);
      await pool.query(tournamentFormatMigrationSql);
      // PostgreSQL requires newly added enum values to be committed before
      // the trigger definitions in the following migration can use them.
      await pool.query("COMMIT");
      await pool.query("BEGIN");
      await pool.query(doubleEliminationTriggerFixMigrationSql);
      await pool.query(stageParticipantBasketsMigrationSql);
      // The basket catalog is forward-only and safe to replay.
      await pool.query(stageParticipantBasketsMigrationSql);
      const stageBasketQualifierCountMigrationSql =
        renderSeriesV1MigrationForTestSchema(
          await readFile(STAGE_BASKET_QUALIFIER_COUNT_MIGRATION_URL, "utf8"),
          schema,
        )
          .replace(MIGRATION_RUNNER_TRANSACTION_BLOCK, "")
          // The postcondition DO block references information_schema.columns with
          // table_schema = 'public'; replace with the isolated test schema name.
          .replaceAll("table_schema = 'public'", `table_schema = '${schema}'`);
      await pool.query(stageBasketQualifierCountMigrationSql);
      // ADD COLUMN IF NOT EXISTS and DROP/ADD CONSTRAINT are idempotent — safe to replay.
      await pool.query(stageBasketQualifierCountMigrationSql);
      const qualificationProposalMigrationSql =
        renderSeriesV1MigrationForTestSchema(
          await readFile(QUALIFICATION_PROPOSAL_MIGRATION_URL, "utf8"),
          schema,
        )
          .replace(MIGRATION_RUNNER_TRANSACTION_BLOCK, "")
          // The postcondition DO block references information_schema with table_schema = 'public'.
          .replaceAll("table_schema = 'public'", `table_schema = '${schema}'`);
      await pool.query(qualificationProposalMigrationSql);
      // CREATE TABLE IF NOT EXISTS — safe to replay.
      await pool.query(qualificationProposalMigrationSql);
      const basketRouteExecutionMigrationSql =
        renderSeriesV1MigrationForTestSchema(
          await readFile(BASKET_ROUTE_EXECUTION_MIGRATION_URL, "utf8"),
          schema,
        )
          .replace(MIGRATION_RUNNER_TRANSACTION_BLOCK, "")
          .replaceAll("table_schema = 'public'", `table_schema = '${schema}'`);
      await pool.query(basketRouteExecutionMigrationSql);
      // CREATE TABLE IF NOT EXISTS — safe to replay.
      await pool.query(basketRouteExecutionMigrationSql);
      const basketFlowAuthorityMigrationSql =
        renderSeriesV1MigrationForTestSchema(
          await readFile(BASKET_FLOW_AUTHORITY_MIGRATION_URL, "utf8"),
          schema,
        )
          .replace(MIGRATION_RUNNER_TRANSACTION_BLOCK, "")
          .replaceAll(
            "table_schema = 'public'",
            `table_schema = '${schema}'`,
          );
      await pool.query(basketFlowAuthorityMigrationSql);
      // ADD COLUMN IF NOT EXISTS and DROP/ADD CONSTRAINT remain replay-safe.
      await pool.query(basketFlowAuthorityMigrationSql);
      const marvelEliminationGroupsMigrationSql =
        renderSeriesV1MigrationForTestSchema(
          await readFile(MARVEL_ELIMINATION_GROUPS_MIGRATION_URL, "utf8"),
          schema,
        ).replace(MIGRATION_RUNNER_TRANSACTION_BLOCK, "");
      await pool.query(marvelEliminationGroupsMigrationSql);
      const basketAuthorityTriggerBypassMigrationSql =
        renderSeriesV1MigrationForTestSchema(
          await readFile(BASKET_AUTHORITY_TRIGGER_BYPASS_MIGRATION_URL, "utf8"),
          schema,
        ).replace(MIGRATION_RUNNER_TRANSACTION_BLOCK, "");
      await pool.query(basketAuthorityTriggerBypassMigrationSql);
      // CREATE OR REPLACE FUNCTION is idempotent — safe to replay.
      await pool.query(basketAuthorityTriggerBypassMigrationSql);
      const preserveStartedMembershipsSql = renderSeriesV1MigrationForTestSchema(
        await readFile(PRESERVE_STARTED_MEMBERSHIPS_MIGRATION_URL, "utf8"), schema,
      );
      await pool.query(preserveStartedMembershipsSql);
      await pool.query(preserveStartedMembershipsSql);
      const matchRevisionSql = renderSeriesV1MigrationForTestSchema(
        await readFile(MATCH_REVISION_MIGRATION_URL, "utf8"), schema,
      );
      await pool.query(matchRevisionSql);
      await pool.query(matchRevisionSql);
      await pool.query("COMMIT");
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    // Preserve partial migration and catalog state after failed setup.
    // No destructive best-effort cleanup, retries or silent suppression.
    console.error("[WEB005_SAFETY] S1_SETUP_FAILED_CLEANUP_HOLD", schema, schemaCreated);
    throw error;
  }
}

export async function dropTestSchema(pool: TestPool, schema: string): Promise<void> {
  assertSafeTestSchema(schema);
  await dropRunSchema(pool, schema);
}
