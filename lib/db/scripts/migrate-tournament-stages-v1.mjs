import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import pg from "pg";

const { Pool } = pg;
const MIGRATION_KEY = "tournament_stages_v1";
const ADVISORY_LOCK_KEY = 841_730_021;
const SAFE_SCHEMA = /^[a-z_][a-z0-9_]*$/;
const MIGRATION_URL = new URL("../migrations/0002_tournament_stages_v1.sql", import.meta.url);

function quoteIdentifier(identifier) {
  if (!SAFE_SCHEMA.test(identifier)) throw new Error("DATABASE_SCHEMA must be a simple PostgreSQL identifier.");
  return `"${identifier}"`;
}

export function renderTournamentStagesMigration(sql, schema) {
  const quoted = quoteIdentifier(schema);
  return sql.replaceAll("public.", `${quoted}.`);
}

async function assertTournamentStagesSchema(client, schema) {
  const result = await client.query(
    `SELECT
       to_regclass($1) IS NOT NULL AS has_stages,
       to_regclass($2) IS NOT NULL AS has_participants,
       to_regclass($3) IS NOT NULL AS has_groups,
       EXISTS (
         SELECT 1 FROM pg_attribute
         WHERE attrelid = to_regclass($4)
           AND attname = 'stage_id' AND attnotnull AND NOT attisdropped
       ) AS match_stage_required,
       EXISTS (
         SELECT 1 FROM pg_attribute
         WHERE attrelid = to_regclass($5)
           AND attname = 'stage_id' AND attnotnull AND NOT attisdropped
       ) AS history_stage_required,
       EXISTS (
         SELECT 1 FROM pg_attribute
         WHERE attrelid = to_regclass($6)
           AND attname = 'active_stage_id' AND NOT attisdropped
       ) AS has_active_stage_pointer`,
    [
      `${schema}.tournament_stages`,
      `${schema}.stage_participants`,
      `${schema}.stage_groups`,
      `${schema}.matches`,
      `${schema}.result_history`,
      `${schema}.tournaments`,
    ],
  );
  const state = result.rows[0];
  if (!state || Object.values(state).some((value) => value !== true)) {
    throw new Error(
      `Migration marker ${MIGRATION_KEY} does not match the schema state in ${schema}.`,
    );
  }
}

export async function applyTournamentStagesMigration({ connectionString, schema }) {
  if (!connectionString) throw new Error("DATABASE_URL is required for migrations.");
  if (!schema) throw new Error("DATABASE_SCHEMA is required for migrations.");
  const quotedSchema = quoteIdentifier(schema);
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [ADVISORY_LOCK_KEY]);
    await client.query(`SET LOCAL search_path TO ${quotedSchema}`);
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
      [MIGRATION_KEY],
    );
    if (marker.rowCount > 0) {
      await assertTournamentStagesSchema(client, schema);
      await client.query("COMMIT");
      return { applied: false, migrationKey: MIGRATION_KEY };
    }

    const migrationSql = renderTournamentStagesMigration(
      await readFile(MIGRATION_URL, "utf8"),
      schema,
    );
    await client.query(migrationSql);
    await assertTournamentStagesSchema(client, schema);
    await client.query("COMMIT");
    return { applied: true, migrationKey: MIGRATION_KEY };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  const result = await applyTournamentStagesMigration({
    connectionString: process.env.DATABASE_URL,
    schema: process.env.DATABASE_SCHEMA,
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
