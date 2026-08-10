import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, test } from "node:test";
import pg from "pg";
import {
  classifyHistoricalMigrationInspection,
  loadTournamentEnginePreflightConfig,
  runTournamentEnginePreflight,
} from "../scripts/preflight-tournament-engine-v2.mjs";

const DATABASE_URL = process.env.TOURNAMENT_ENGINE_PREFLIGHT_TEST_DATABASE_URL?.trim();
const ENABLED = Boolean(
  DATABASE_URL &&
    process.env.TOURNAMENT_ENGINE_PREFLIGHT_TEST_CONFIRM ===
      "USE_ISOLATED_TOURNAMENT_ENGINE_PREFLIGHT_DATABASE",
);
const HISTORICAL_COMMIT = "1111111111111111111111111111111111111111";
const CURRENT_COMMIT = "2222222222222222222222222222222222222222";
const MIGRATION_TRANSACTION_BLOCK =
  /^-- migration-runner-strip-begin\r?\n[\s\S]*?^-- migration-runner-strip-end\r?\n?/gm;
const MIGRATIONS = Array.from({ length: 13 }, (_, index) => {
  const number = String(index + 1).padStart(4, "0");
  const names = [
    "series_v1_clean_cutover",
    "tournament_stages_v1",
    "flexible_group_stages_v2",
    "configurable_seeding_v2",
    "stage_participant_flow",
    "fix_multistage_participant_compat",
    "reconcile_stage_schema",
    "restore_stage_procedural_objects",
    "reconcile_composite_foreign_keys",
    "auth_credential_rate_limits",
    "reconcile_replit_schema_catalog",
    "tournament_routing_persistence_v2",
    "tournament_game_config",
  ];
  return new URL(`../migrations/${number}_${names[index]}.sql`, import.meta.url);
});

function expectedDatabaseName() {
  assert.ok(DATABASE_URL);
  const parsed = new URL(DATABASE_URL);
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  assert.match(databaseName, /test/i);
  assert.doesNotMatch(`${parsed.hostname}/${databaseName}`, /prod/i);
  assert.ok(new Set(["127.0.0.1", "localhost", "::1"]).has(parsed.hostname));
  assert.notEqual(parsed.port || "5432", "5432");
  return databaseName;
}

function environment() {
  return {
    DEVELOPMENT_DATABASE_URL: DATABASE_URL,
    EXPECTED_DATABASE_NAME: expectedDatabaseName(),
    EXPECTED_DATABASE_SCHEMA: "public",
    EXPECTED_DEPLOYMENT_ENVIRONMENT: "development",
    DEPLOYMENT_ENVIRONMENT: "development",
    APP_COMMIT: CURRENT_COMMIT,
  };
}

async function migrationSql(index) {
  const sql = await readFile(MIGRATIONS[index - 1], "utf8");
  return new Set([2, 7, 8, 9, 10, 11, 12, 13]).has(index)
    ? sql.replace(MIGRATION_TRANSACTION_BLOCK, "")
    : sql;
}

async function resetCanonicalDatabase(
  client,
  { routing = true, gameConfig = true } = {},
) {
  await client.query("DROP SCHEMA IF EXISTS public CASCADE");
  await client.query("CREATE SCHEMA public");
  for (let index = 1; index <= 11; index += 1) {
    await client.query(await migrationSql(index));
  }
  if (routing) await client.query(await migrationSql(12));
  if (gameConfig) await client.query(await migrationSql(13));
  await client.query(
    `INSERT INTO public.app_schema_migrations(
       migration_key, app_commit, target_schema, deployment_environment
     ) VALUES
       ('series_v1_clean_cutover', $1, 'public', 'development'),
       ('tournament_stages_v1', $1, 'public', 'development'),
       ('flexible_group_stages_v2', $1, 'public', 'development'),
       ('configurable_seeding_v2', $1, 'public', 'development')
     ON CONFLICT (migration_key) DO UPDATE SET
       app_commit = EXCLUDED.app_commit,
       target_schema = EXCLUDED.target_schema,
       deployment_environment = EXCLUDED.deployment_environment`,
    [HISTORICAL_COMMIT],
  );
}

async function report() {
  return runTournamentEnginePreflight(environment(), { log() {} });
}

async function expectStopped(problemPattern) {
  const result = await report();
  assert.equal(result.safe, false);
  assert.equal(result.status, "STOP");
  assert.match(result.problems.join("\n"), problemPattern);
}

describe("Tournament Engine V2 orchestrated read-only preflight", () => {
  test("requires explicit per-environment identity guards without URL fallback", () => {
    assert.throws(
      () => loadTournamentEnginePreflightConfig({
        DATABASE_URL: "postgresql://localhost/ignored_test",
        EXPECTED_DATABASE_NAME: "ignored_test",
        EXPECTED_DATABASE_SCHEMA: "public",
        EXPECTED_DEPLOYMENT_ENVIRONMENT: "development",
        DEPLOYMENT_ENVIRONMENT: "development",
      }),
      /DEVELOPMENT_DATABASE_URL is required/,
    );
    assert.throws(
      () => loadTournamentEnginePreflightConfig({
        DEVELOPMENT_DATABASE_URL: "postgresql://localhost/wrong_test",
        EXPECTED_DATABASE_NAME: "expected_test",
        EXPECTED_DATABASE_SCHEMA: "public",
        EXPECTED_DEPLOYMENT_ENVIRONMENT: "development",
        DEPLOYMENT_ENVIRONMENT: "production",
      }),
      /must exactly match/,
    );
  });

  test("classifies every historical marker/schema relationship without rewriting marker SHAs", () => {
    const config = {
      expectedSchema: "public",
      deploymentEnvironment: "development",
      appCommit: CURRENT_COMMIT,
    };
    const marker = {
      targetSchema: "public",
      deploymentEnvironment: "development",
      appCommit: CURRENT_COMMIT,
    };
    assert.equal(classifyHistoricalMigrationInspection({
      marker,
      schemaApplied: true,
      schemaNeeded: false,
      prerequisiteValid: true,
      config,
    }), "APPLIED");
    assert.equal(classifyHistoricalMigrationInspection({
      marker: null,
      schemaApplied: false,
      schemaNeeded: true,
      prerequisiteValid: true,
      config,
    }), "NEEDED");
    assert.equal(classifyHistoricalMigrationInspection({
      marker: { ...marker, appCommit: HISTORICAL_COMMIT },
      schemaApplied: true,
      schemaNeeded: false,
      prerequisiteValid: true,
      config,
    }), "MARKER_COMMIT_DIFFERENT_BUT_SCHEMA_VALID");
    assert.equal(classifyHistoricalMigrationInspection({
      marker,
      schemaApplied: false,
      schemaNeeded: false,
      prerequisiteValid: true,
      config,
    }), "INCONSISTENT");
  });

  test(
    "accepts the complete catalog, preserves historical marker SHAs and proves read-only execution",
    { skip: !ENABLED },
    async () => {
      assert.ok(DATABASE_URL);
      const client = new pg.Client({ connectionString: DATABASE_URL });
      await client.connect();
      try {
        await resetCanonicalDatabase(client);
        const markerBefore = await client.query(
          "SELECT migration_key, app_commit, applied_at FROM public.app_schema_migrations ORDER BY migration_key",
        );
        const result = await report();
        const markerAfter = await client.query(
          "SELECT migration_key, app_commit, applied_at FROM public.app_schema_migrations ORDER BY migration_key",
        );
        assert.equal(result.safe, true, result.problems.join("\n"));
        assert.equal(result.status, "SAFE_TO_PROCEED");
        assert.equal(result.transactionReadOnly, "on");
        assert.equal(result.transactionIsolation, "repeatable read");
        assert.equal(result.canonical.uniqueConstraints, 7);
        assert.equal(result.canonical.compositeForeignKeys, 20);
        assert.equal(result.canonical.functions, 15);
        assert.equal(result.canonical.triggers, 14);
        assert.equal(result.routingPersistence.status, "applied");
        assert.ok(result.historicalMigrations.every(
          (migration) =>
            migration.status === "MARKER_COMMIT_DIFFERENT_BUT_SCHEMA_VALID" &&
            migration.historicalCommit === HISTORICAL_COMMIT,
        ));
        assert.deepEqual(markerAfter.rows, markerBefore.rows);
      } finally {
        await client.end();
      }
    },
  );

  test(
    "stops without 0013, accepts its canonical catalog and rejects a damaged JSON constraint",
    { skip: !ENABLED },
    async () => {
      assert.ok(DATABASE_URL);
      const client = new pg.Client({ connectionString: DATABASE_URL });
      await client.connect();
      try {
        await resetCanonicalDatabase(client, { gameConfig: false });
        await expectStopped(/0013: table tournament_game_configs is missing/);

        await resetCanonicalDatabase(client);
        let result = await report();
        assert.equal(result.safe, true, result.problems.join("\n"));
        assert.equal(result.canonical.tournamentGameConfig, "applied");

        await client.query(
          `ALTER TABLE public.tournament_game_configs
             DROP CONSTRAINT tournament_game_configs_config_object;
           ALTER TABLE public.tournament_game_configs
             ADD CONSTRAINT tournament_game_configs_config_object CHECK (true)`,
        );
        await expectStopped(/0013: tournament_game_configs JSON object check/);
      } finally {
        await client.end();
      }
    },
  );

  test(
    "reports every required missing or incompatible 0005-0011 object",
    { skip: !ENABLED },
    async () => {
      assert.ok(DATABASE_URL);
      const client = new pg.Client({ connectionString: DATABASE_URL });
      await client.connect();
      try {
        const cases = [
          {
            sql: "ALTER TABLE public.tournament_stages DROP CONSTRAINT tournament_stages_elimination_advancing_boundary",
            problem: /tournament_stages_elimination_advancing_boundary/,
          },
          {
            sql: `ALTER TABLE public.tournament_stages
                    DROP CONSTRAINT tournament_stages_qualification_configuration;
                  ALTER TABLE public.tournament_stages
                    ADD CONSTRAINT tournament_stages_qualification_configuration
                    CHECK (
                      TRUE OR
                      qualification_mode = 'none'::public.stage_qualification_mode
                        AND advancing_count IS NULL OR
                      qualification_mode = 'top_n'::public.stage_qualification_mode
                        AND format IN (
                          'swiss'::public.tournament_stage_format,
                          'round_robin'::public.tournament_stage_format,
                          'single_elimination'::public.tournament_stage_format
                        )
                        AND advancing_count IS NOT NULL
                        AND advancing_count <= participant_count OR
                      qualification_mode = 'top_n_per_group'::public.stage_qualification_mode
                        AND format = 'group_stage'::public.tournament_stage_format
                    )`,
            problem: /tournament_stages_qualification_configuration/,
          },
          {
            sql: "ALTER TABLE public.matches DROP CONSTRAINT matches_stage_round_number_unique",
            problem: /matches_stage_round_number_unique/,
          },
          {
            sql: "DROP TRIGGER action_log_assign_stage ON public.action_log",
            problem: /trigger action_log_assign_stage/,
          },
          {
            sql: "ALTER TABLE public.action_log DISABLE TRIGGER action_log_assign_stage",
            problem: /trigger action_log_assign_stage/,
          },
          {
            sql: `CREATE OR REPLACE FUNCTION public.compat_assign_action_log_stage()
                  RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END; $$`,
            problem: /function compat_assign_action_log_stage/,
          },
          {
            sql: "ALTER FUNCTION public.compat_assign_action_log_stage() SECURITY DEFINER",
            problem: /function compat_assign_action_log_stage/,
          },
          {
            sql: "ALTER FUNCTION public.compat_assign_action_log_stage() SET search_path TO public",
            problem: /function compat_assign_action_log_stage/,
          },
          {
            sql: `CREATE FUNCTION public.compat_resequence_single_stage_participants(
                    target_tournament_id bigint,
                    target_stage_id bigint
                  ) RETURNS void LANGUAGE plpgsql AS $$ BEGIN RETURN; END; $$`,
            problem: /function compat_resequence_single_stage_participants/,
          },
          {
            sql: `ALTER FUNCTION public.compat_resequence_single_stage_participants(integer, integer)
                    RENAME TO compat_resequence_single_stage_participants_original;
                  CREATE FUNCTION public.compat_resequence_single_stage_participants(
                    target_tournament_id bigint,
                    target_stage_id integer
                  ) RETURNS void LANGUAGE plpgsql AS $$ BEGIN RETURN; END; $$`,
            problem: /function compat_resequence_single_stage_participants/,
          },
          {
            sql: `ALTER FUNCTION public.compat_resequence_single_stage_participants(integer, integer)
                    RENAME TO compat_resequence_single_stage_participants_original;
                  CREATE FUNCTION public.compat_resequence_single_stage_participants(
                    target_tournament_id integer,
                    target_stage_id integer
                  ) RETURNS integer LANGUAGE plpgsql AS $$ BEGIN RETURN 0; END; $$`,
            problem: /function compat_resequence_single_stage_participants/,
          },
          {
            sql: "ALTER TABLE public.matches DROP CONSTRAINT matches_player1_same_tournament_fk",
            problem: /matches_player1_same_tournament_fk/,
          },
          {
            sql: `ALTER TABLE public.matches
                    DROP CONSTRAINT matches_next_match_same_stage_fk;
                  ALTER TABLE public.result_history
                    DROP CONSTRAINT result_history_match_same_stage_fk;
                  ALTER TABLE public.matches
                    DROP CONSTRAINT matches_id_stage_id_unique`,
            problem: /matches_id_stage_id_unique/,
          },
          {
            sql: "ALTER TABLE public.matches ADD CONSTRAINT matches_stage_id_id_unique UNIQUE(stage_id, id)",
            problem: /redundant matches_stage_id_id_unique/,
          },
          {
            sql: "DROP TABLE public.auth_credential_rate_limits",
            problem: /auth_credential_rate_limits is missing/,
          },
          {
            sql: "DROP INDEX public.auth_credential_rate_limits_cleanup_idx",
            problem: /auth_credential_rate_limits_cleanup_idx/,
          },
        ];
        for (const fixture of cases) {
          await resetCanonicalDatabase(client);
          await client.query(fixture.sql);
          await expectStopped(fixture.problem);
        }
      } finally {
        await client.end();
      }
    },
  );

  test(
    "distinguishes needed, partial and complete 0012 catalogs without executing 0012",
    { skip: !ENABLED },
    async () => {
      assert.ok(DATABASE_URL);
      const client = new pg.Client({ connectionString: DATABASE_URL });
      await client.connect();
      try {
        await resetCanonicalDatabase(client, { routing: false });
        let result = await report();
        assert.equal(result.safe, true, result.problems.join("\n"));
        assert.equal(result.routingPersistence.status, "needed");
        await client.query(
          "CREATE TABLE public.tournament_routing_plans(id integer)",
        );
        result = await report();
        assert.equal(result.safe, false);
        assert.equal(result.status, "STOP");
        assert.ok(new Set(["unsafe", "conflict"]).has(result.routingPersistence.status));

        await resetCanonicalDatabase(client);
        result = await report();
        assert.equal(result.safe, true, result.problems.join("\n"));
        assert.equal(result.routingPersistence.status, "applied");
      } finally {
        await client.end();
      }
    },
  );
});
