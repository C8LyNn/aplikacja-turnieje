import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import pg from "pg";
import {
  TOURNAMENT_STAGES_MIGRATION_KEY,
  collectTournamentStagesPreflight,
  inspectTournamentStagesSchema,
  loadTournamentStagesDeploymentConfig,
} from "./tournament-stages-v1-deployment.mjs";

const { Pool } = pg;
const ADVISORY_LOCK_KEY = 841_730_021;
const SAFE_SCHEMA = /^[a-z_][a-z0-9_]*$/;
const MIGRATION_URL = new URL(
  "../migrations/0002_tournament_stages_v1.sql",
  import.meta.url,
);

function quoteIdentifier(identifier) {
  if (!SAFE_SCHEMA.test(identifier))
    throw new Error("DATABASE_SCHEMA must be a simple PostgreSQL identifier.");
  return `"${identifier}"`;
}

export function renderTournamentStagesMigration(sql, schema) {
  const quoted = quoteIdentifier(schema);
  return sql.replaceAll("public.", `${quoted}.`);
}

async function assertTournamentStagesSchema(client, schema) {
  const state = await inspectTournamentStagesSchema(client, schema);
  if (!state || Object.values(state).some((value) => value !== true)) {
    throw new Error(
      `Migration marker ${TOURNAMENT_STAGES_MIGRATION_KEY} does not match the schema state in ${schema}.`,
    );
  }
}

export async function applyTournamentStagesMigration({
  connectionString,
  schema,
  deploymentConfig,
}) {
  if (!connectionString)
    throw new Error("DATABASE_URL is required for migrations.");
  if (!schema) throw new Error("DATABASE_SCHEMA is required for migrations.");
  if (
    deploymentConfig &&
    (deploymentConfig.databaseUrl !== connectionString ||
      deploymentConfig.expectedSchema !== schema)
  ) {
    throw new Error(
      "Deployment migration arguments do not match the validated guards.",
    );
  }
  const quotedSchema = quoteIdentifier(schema);
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [ADVISORY_LOCK_KEY]);
    await client.query(`SET LOCAL search_path TO ${quotedSchema}`);
    if (deploymentConfig) {
      const preflight = await collectTournamentStagesPreflight(
        client,
        deploymentConfig,
      );
      if (!preflight.safe) {
        throw new Error(
          `Tournament Stages v1 migration preflight is inconsistent: ${preflight.reasons.join(" ")}`,
        );
      }
      if (preflight.migration.status === "applied") {
        await client.query("COMMIT");
        return {
          applied: false,
          migrationKey: TOURNAMENT_STAGES_MIGRATION_KEY,
        };
      }
      if (preflight.migration.status !== "needed") {
        throw new Error(
          `Tournament Stages v1 migration cannot run from status ${preflight.migration.status}.`,
        );
      }
    }
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${quotedSchema}.app_schema_migrations (
        migration_key TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        app_commit TEXT NOT NULL,
        target_schema TEXT NOT NULL,
        deployment_environment TEXT NOT NULL
      )
    `);
    const marker = await client.query(
      `SELECT migration_key FROM ${quotedSchema}.app_schema_migrations WHERE migration_key = $1`,
      [TOURNAMENT_STAGES_MIGRATION_KEY],
    );
    if (marker.rowCount > 0) {
      await assertTournamentStagesSchema(client, schema);
      await client.query("COMMIT");
      return {
        applied: false,
        migrationKey: TOURNAMENT_STAGES_MIGRATION_KEY,
      };
    }

    const migrationSql = renderTournamentStagesMigration(
      await readFile(MIGRATION_URL, "utf8"),
      schema,
    );
    await client.query(migrationSql);
    if (deploymentConfig) {
      const markerUpdate = await client.query(
        `UPDATE ${quotedSchema}.app_schema_migrations
         SET app_commit = $2, target_schema = $3, deployment_environment = $4
         WHERE migration_key = $1`,
        [
          TOURNAMENT_STAGES_MIGRATION_KEY,
          deploymentConfig.appCommit,
          deploymentConfig.expectedSchema,
          deploymentConfig.deploymentEnvironment,
        ],
      );
      if (markerUpdate.rowCount !== 1) {
        throw new Error(
          "Tournament Stages v1 migration marker was not written exactly once.",
        );
      }
      const verification = await collectTournamentStagesPreflight(
        client,
        deploymentConfig,
      );
      if (!verification.safe || verification.migration.status !== "applied") {
        throw new Error(
          `Tournament Stages v1 post-migration verification failed: ${verification.reasons.join(" ")}`,
        );
      }
    } else {
      await assertTournamentStagesSchema(client, schema);
    }
    await client.query("COMMIT");
    return { applied: true, migrationKey: TOURNAMENT_STAGES_MIGRATION_KEY };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  const deploymentConfig = loadTournamentStagesDeploymentConfig();
  const result = await applyTournamentStagesMigration({
    connectionString: deploymentConfig.databaseUrl,
    schema: deploymentConfig.expectedSchema,
    deploymentConfig,
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
