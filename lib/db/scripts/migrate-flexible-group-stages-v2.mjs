import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import pg from "pg";
import {
  FLEXIBLE_GROUP_STAGES_MIGRATION_KEY,
  collectFlexibleGroupStagesPreflight,
  inspectFlexibleGroupStagesSchema,
  loadFlexibleGroupStagesDeploymentConfig,
} from "./flexible-group-stages-v2-deployment.mjs";

const { Pool } = pg;
const ADVISORY_LOCK_KEY = 841_730_022;
const SAFE_SCHEMA = /^[a-z_][a-z0-9_]*$/;
const MIGRATION_URL = new URL(
  "../migrations/0003_flexible_group_stages_v2.sql",
  import.meta.url,
);

function quoteIdentifier(identifier) {
  if (!SAFE_SCHEMA.test(identifier)) {
    throw new Error("DATABASE_SCHEMA must be a simple PostgreSQL identifier.");
  }
  return `"${identifier}"`;
}

export function renderFlexibleGroupStagesMigration(sql, schema) {
  const quoted = quoteIdentifier(schema);
  return sql.replaceAll("public.", `${quoted}.`);
}

export function resolveFlexibleGroupStagesMigrationPreflight(preflight) {
  if (!preflight.safe) {
    throw new Error(
      `Flexible Group Stages v2 migration preflight is inconsistent: ${preflight.reasons.join(" ")}`,
    );
  }
  if (preflight.migration.status === "applied") {
    return {
      applied: false,
      migrationKey: FLEXIBLE_GROUP_STAGES_MIGRATION_KEY,
    };
  }
  if (preflight.migration.status !== "needed") {
    throw new Error(
      `Flexible Group Stages v2 migration cannot run from status ${preflight.migration.status}.`,
    );
  }
  return null;
}

async function assertFlexibleGroupStagesSchema(client, schema) {
  const state = await inspectFlexibleGroupStagesSchema(client, schema);
  if (!state.flexible) {
    throw new Error(
      `Migration marker ${FLEXIBLE_GROUP_STAGES_MIGRATION_KEY} does not match the schema state in ${schema}.`,
    );
  }
}

export async function applyFlexibleGroupStagesMigration({
  connectionString,
  schema,
  deploymentConfig,
}) {
  if (!connectionString) throw new Error("DATABASE_URL is required for migrations.");
  if (!schema) throw new Error("DATABASE_SCHEMA is required for migrations.");
  if (
    deploymentConfig &&
    (deploymentConfig.databaseUrl !== connectionString ||
      deploymentConfig.expectedSchema !== schema)
  ) {
    throw new Error("Deployment migration arguments do not match the validated guards.");
  }

  const quotedSchema = quoteIdentifier(schema);
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [ADVISORY_LOCK_KEY]);
    await client.query(`SET LOCAL search_path TO ${quotedSchema}`);

    if (deploymentConfig) {
      const preflight = await collectFlexibleGroupStagesPreflight(
        client,
        deploymentConfig,
      );
      const completed = resolveFlexibleGroupStagesMigrationPreflight(preflight);
      if (completed) {
        await client.query("COMMIT");
        return completed;
      }
    }

    const migrationSql = renderFlexibleGroupStagesMigration(
      await readFile(MIGRATION_URL, "utf8"),
      schema,
    );
    await client.query(migrationSql);
    await assertFlexibleGroupStagesSchema(client, schema);

    if (deploymentConfig) {
      const insert = await client.query(
        `INSERT INTO ${quotedSchema}.app_schema_migrations (
           migration_key, app_commit, target_schema, deployment_environment
         ) VALUES ($1, $2, $3, $4)
         ON CONFLICT (migration_key) DO NOTHING`,
        [
          FLEXIBLE_GROUP_STAGES_MIGRATION_KEY,
          deploymentConfig.appCommit,
          deploymentConfig.expectedSchema,
          deploymentConfig.deploymentEnvironment,
        ],
      );
      if (insert.rowCount !== 1) {
        throw new Error("Flexible Group Stages v2 migration marker was not written exactly once.");
      }
      const verification = await collectFlexibleGroupStagesPreflight(
        client,
        deploymentConfig,
      );
      if (!verification.safe || verification.migration.status !== "applied") {
        throw new Error(
          `Flexible Group Stages v2 post-migration verification failed: ${verification.reasons.join(" ")}`,
        );
      }
    }

    await client.query("COMMIT");
    return { applied: true, migrationKey: FLEXIBLE_GROUP_STAGES_MIGRATION_KEY };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserve the original migration failure.
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

export async function runFlexibleGroupStagesMigrationWithConfig(deploymentConfig) {
  return applyFlexibleGroupStagesMigration({
    connectionString: deploymentConfig.databaseUrl,
    schema: deploymentConfig.expectedSchema,
    deploymentConfig,
  });
}

async function main() {
  const config = loadFlexibleGroupStagesDeploymentConfig();
  const result = await runFlexibleGroupStagesMigrationWithConfig(config);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
