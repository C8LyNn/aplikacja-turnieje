// V5.1–V5.10, #331, #329 — guarded, all-or-nothing application of the V5 migrations (0041–0049).
//
//   Preflight (read-only):  node ./scripts/v5-schema-migrations.mjs preflight
//   Apply:                  V5_MIGRATION_CONFIRM=apply-0041-0049 node ./scripts/v5-schema-migrations.mjs apply
//
// Environment: DATABASE_URL (required), DATABASE_SCHEMA (default "public").
// Never run automatically by app startup, build or publishing. Take a snapshot first
// (pg_dump or CREATE DATABASE … TEMPLATE …); the recovery procedure is in INTEGRATION.md.
//
// Guarantees:
//   * One transaction for every pending migration plus its marker: either everything
//     is applied and verified, or nothing changes (ROLLBACK on any error).
//   * pg_advisory_xact_lock serialises concurrent runners; lock_timeout keeps it from
//     queueing behind live traffic for long.
//   * Pre-checks: baseline tables exist; no foreign object occupies a V5 name with a
//     different shape; existing rows already satisfy the new CHECK constraints.
//   * Post-checks: the catalog matches SCHEMA_REQUIREMENTS and every pre-existing row
//     count is unchanged (no data loss).
//   * Re-running is a verified no-op.
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { BASELINE_TABLES, describeSchemaGaps, inspectSchemaRequirements, SCHEMA_REQUIREMENTS } from "../src/schema-requirements.mjs";

const ADVISORY_LOCK_KEY = 841_730_541;
const SAFE_IDENTIFIER = /^[a-z_][a-z0-9_]*$/;
// Each V5 release renames the token so an operator who approved an earlier set cannot apply a newer
// migration by habit (V5.3: apply-0041-0043, V5.4: apply-0041-0044, V5.5: apply-0041-0045, V5.7: apply-0041-0046,
// V5.10: apply-0041-0047, #331: apply-0041-0048, #329: apply-0041-0049).
export const V5_MIGRATION_CONFIRMATION = "apply-0041-0049";

function quoteIdentifier(identifier) {
  if (!SAFE_IDENTIFIER.test(identifier)) throw new Error("DATABASE_SCHEMA must be a simple PostgreSQL identifier.");
  return `"${identifier}"`;
}

export function renderMigrationForSchema(sql, schema) {
  return schema === "public" ? sql : sql.replaceAll("public.", `${quoteIdentifier(schema)}.`);
}

async function countRows(client, schema) {
  const tables = (await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = $1 ORDER BY tablename", [schema],
  )).rows.map((row) => row.tablename);
  const counts = {};
  for (const table of tables) {
    if (!SAFE_IDENTIFIER.test(table)) continue;
    counts[table] = (await client.query(`SELECT count(*)::bigint AS n FROM ${quoteIdentifier(schema)}.${quoteIdentifier(table)}`)).rows[0].n;
  }
  return counts;
}

/** Read-only checks that decide whether apply may run. */
export async function collectV5Preflight(client, schema) {
  const report = await inspectSchemaRequirements(client, schema);
  const blockers = [];
  if (report.missingPrerequisites.length) blockers.push(`Baseline tables missing: ${report.missingPrerequisites.join(", ")} (apply 0001–0040 first).`);
  const q = quoteIdentifier(schema);
  const exists = async (table) => (await client.query("SELECT to_regclass($1) AS oid", [`${q}.${table}`])).rows[0].oid !== null;
  if (!report.missingPrerequisites.length) {
    // Composite FK target of tournament_teams.
    const playersKey = (await client.query(
      `SELECT 1 FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid JOIN pg_namespace ns ON ns.oid = rel.relnamespace
        WHERE ns.nspname = $1 AND rel.relname = 'players' AND con.contype IN ('u','p')
          AND (SELECT array_agg(att.attname::text ORDER BY att.attname) FROM unnest(con.conkey) k JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = k) = ARRAY['id','tournament_id']`,
      [schema],
    )).rowCount;
    if (!playersKey) blockers.push("players(tournament_id, id) has no unique key; 0042's same-tournament foreign key cannot be created.");
    // Existing rows must satisfy the new constraints (only possible if a column was added by hand).
    const legsColumn = (await client.query("SELECT 1 FROM information_schema.columns WHERE table_schema=$1 AND table_name='tournament_stages' AND column_name='round_robin_legs'", [schema])).rowCount;
    if (legsColumn) {
      const bad = (await client.query(`SELECT count(*)::int AS n FROM ${q}.tournament_stages WHERE NOT (round_robin_legs = 1 OR (round_robin_legs = 2 AND format = 'round_robin'))`)).rows[0].n;
      if (bad) blockers.push(`${bad} stage(s) violate the round_robin_legs rule.`);
    }
    const typeColumn = (await client.query("SELECT 1 FROM information_schema.columns WHERE table_schema=$1 AND table_name='tournaments' AND column_name='participant_type'", [schema])).rowCount;
    if (typeColumn) {
      const bad = (await client.query(`SELECT count(*)::int AS n FROM ${q}.tournaments WHERE participant_type NOT IN ('players','teams')`)).rows[0].n;
      if (bad) blockers.push(`${bad} tournament(s) have an unsupported participant_type.`);
    }
    const rulesColumn = (await client.query("SELECT 1 FROM information_schema.columns WHERE table_schema=$1 AND table_name='tournament_stages' AND column_name='league_rules'", [schema])).rowCount;
    if (rulesColumn) {
      const bad = (await client.query(`SELECT count(*)::int AS n FROM ${q}.tournament_stages WHERE league_rules IS NOT NULL AND NOT (jsonb_typeof(league_rules) = 'object' AND format IN ('round_robin','group_stage'))`)).rows[0].n;
      if (bad) blockers.push(`${bad} stage(s) violate the league_rules rule.`);
    }
    const zoneColumn = (await client.query("SELECT 1 FROM information_schema.columns WHERE table_schema=$1 AND table_name='tournament_stages' AND column_name='schedule_time_zone'", [schema])).rowCount;
    if (zoneColumn) {
      const bad = (await client.query(`SELECT count(*)::int AS n FROM ${q}.tournament_stages WHERE schedule_time_zone IS NOT NULL AND schedule_time_zone !~ '^[A-Za-z][A-Za-z0-9_+-]*(/[A-Za-z0-9_+-]+){0,2}$'`)).rows[0].n;
      if (bad) blockers.push(`${bad} stage(s) have a malformed schedule_time_zone.`);
    }
    const planColumn = (await client.query("SELECT 1 FROM information_schema.columns WHERE table_schema=$1 AND table_name='tournament_stages' AND column_name='schedule_plan'", [schema])).rowCount;
    if (planColumn && zoneColumn) {
      const bad = (await client.query(`SELECT count(*)::int AS n FROM ${q}.tournament_stages WHERE schedule_plan IS NOT NULL AND NOT (jsonb_typeof(schedule_plan) = 'object' AND schedule_time_zone IS NOT NULL AND format IN ('round_robin','group_stage'))`)).rows[0].n;
      if (bad) blockers.push(`${bad} stage(s) violate the schedule_plan rule.`);
    }
    // V5.4: hand-added participant field columns must already satisfy 0044's checks.
    const fieldsColumn = (await client.query("SELECT 1 FROM information_schema.columns WHERE table_schema=$1 AND table_name='tournaments' AND column_name='participant_fields'", [schema])).rowCount;
    if (fieldsColumn) {
      const bad = (await client.query(`SELECT count(*)::int AS n FROM ${q}.tournaments WHERE participant_fields IS NOT NULL AND NOT (jsonb_typeof(participant_fields) = 'object' AND pg_column_size(participant_fields) <= 65536)`)).rows[0].n;
      if (bad) blockers.push(`${bad} tournament(s) violate the participant_fields rule.`);
    }
    const valuesColumn = (await client.query("SELECT 1 FROM information_schema.columns WHERE table_schema=$1 AND table_name='players' AND column_name='custom_fields'", [schema])).rowCount;
    if (valuesColumn) {
      const bad = (await client.query(`SELECT count(*)::int AS n FROM ${q}.players WHERE custom_fields IS NOT NULL AND NOT (jsonb_typeof(custom_fields) = 'object' AND pg_column_size(custom_fields) <= 32768)`)).rows[0].n;
      if (bad) blockers.push(`${bad} player(s) violate the custom_fields rule.`);
    }
    // V5.5: hand-added point_adjustments must already satisfy 0045's check.
    const adjustmentsColumn = (await client.query("SELECT 1 FROM information_schema.columns WHERE table_schema=$1 AND table_name='tournament_stages' AND column_name='point_adjustments'", [schema])).rowCount;
    if (adjustmentsColumn && rulesColumn) {
      const bad = (await client.query(`SELECT count(*)::int AS n FROM ${q}.tournament_stages WHERE point_adjustments IS NOT NULL AND NOT (jsonb_typeof(point_adjustments) = 'array' AND league_rules IS NOT NULL AND format IN ('round_robin','group_stage') AND pg_column_size(point_adjustments) <= 65536)`)).rows[0].n;
      if (bad) blockers.push(`${bad} stage(s) violate the point_adjustments rule.`);
    }
    // V5.7: hand-added set columns must already satisfy 0046's checks.
    const matchRulesColumn = (await client.query("SELECT 1 FROM information_schema.columns WHERE table_schema=$1 AND table_name='tournament_stages' AND column_name='match_rules'", [schema])).rowCount;
    if (matchRulesColumn) {
      const bad = (await client.query(`SELECT count(*)::int AS n FROM ${q}.tournament_stages WHERE match_rules IS NOT NULL AND NOT (jsonb_typeof(match_rules) = 'object' AND match_rules->>'kind' IN ('sets', 'two_legs'))`)).rows[0].n;
      if (bad) blockers.push(`${bad} stage(s) violate the match_rules rule.`);
    }
    const setScoresColumn = (await client.query("SELECT 1 FROM information_schema.columns WHERE table_schema=$1 AND table_name='matches' AND column_name='set_scores'", [schema])).rowCount;
    if (setScoresColumn) {
      const bad = (await client.query(`SELECT count(*)::int AS n FROM ${q}.matches WHERE set_scores IS NOT NULL AND NOT (jsonb_typeof(set_scores) = 'array' AND status = 'completed' AND result_type = 'played')`)).rows[0].n;
      if (bad) blockers.push(`${bad} match(es) violate the set_scores rule.`);
    }
  }
  // A foreign object with a V5 name but a different shape would survive CREATE … IF NOT EXISTS.
  for (const requirement of SCHEMA_REQUIREMENTS) {
    for (const object of requirement.objects) {
      if (BASELINE_TABLES.includes(object.table)) continue;
      if (!(await exists(object.table))) continue;
      const columns = new Set((await client.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2", [schema, object.table],
      )).rows.map((row) => row.column_name));
      const missing = (object.columns ?? []).filter((column) => !columns.has(column));
      if (missing.length) blockers.push(`Table ${object.table} already exists with a different shape (missing ${missing.join(", ")}); refusing to guess.`);
    }
  }
  const markers = await exists("app_schema_migrations")
    ? new Set((await client.query(`SELECT migration_key FROM ${q}.app_schema_migrations`)).rows.map((row) => row.migration_key))
    : null;
  const pending = report.migrations.filter((migration) => migration.status !== "applied").map((migration) => migration.migration);
  return {
    schema,
    safe: blockers.length === 0,
    blockers,
    pending,
    status: report.compatible ? "applied" : blockers.length ? "blocked" : "needed",
    migrations: report.migrations.map((migration) => ({ ...migration, marker: markers ? markers.has(migration.key) : null })),
  };
}

export async function applyV5Migrations({ connectionString, schema = "public", appCommit = "unknown", environment = "unknown", confirmation }) {
  if (confirmation !== V5_MIGRATION_CONFIRMATION) throw new Error(`Set V5_MIGRATION_CONFIRM=${V5_MIGRATION_CONFIRMATION} to apply.`);
  if (!connectionString) throw new Error("DATABASE_URL is required.");
  const quoted = quoteIdentifier(schema);
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [ADVISORY_LOCK_KEY]);
    await client.query("SET LOCAL lock_timeout = '10s'");
    await client.query("SET LOCAL statement_timeout = '5min'");
    await client.query(`SET LOCAL search_path TO ${quoted}`);
    const before = await collectV5Preflight(client, schema);
    if (!before.safe) throw new Error(`V5 migration preflight refused: ${before.blockers.join(" ")}`);
    const countsBefore = await countRows(client, schema);
    const applied = [];
    for (const requirement of SCHEMA_REQUIREMENTS) {
      const status = before.migrations.find((migration) => migration.migration === requirement.migration);
      if (status.status === "applied") continue;
      const sql = await readFile(new URL(`../migrations/${requirement.migration}`, import.meta.url), "utf8");
      await client.query(renderMigrationForSchema(sql, schema));
      applied.push(requirement.migration);
    }
    const after = await inspectSchemaRequirements(client, schema);
    if (!after.compatible) throw new Error(`V5 post-migration verification failed: ${describeSchemaGaps(after)}`);
    const countsAfter = await countRows(client, schema);
    for (const [table, count] of Object.entries(countsBefore)) {
      if (countsAfter[table] !== count) throw new Error(`Row count of ${table} changed (${count} → ${countsAfter[table]}); rolling back.`);
    }
    if ((await client.query("SELECT to_regclass($1) AS oid", [`${quoted}.app_schema_migrations`])).rows[0].oid !== null) {
      for (const requirement of SCHEMA_REQUIREMENTS) {
        await client.query(
          `INSERT INTO ${quoted}.app_schema_migrations (migration_key, app_commit, target_schema, deployment_environment)
           VALUES ($1, $2, $3, $4) ON CONFLICT (migration_key) DO NOTHING`,
          [requirement.key, appCommit, schema, environment],
        );
      }
    }
    await client.query("COMMIT");
    return { applied, verified: true, schema, tablesChecked: Object.keys(countsBefore).length };
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch { /* keep the original error */ }
    throw error;
  } finally {
    await client.end();
  }
}

export async function preflightV5Migrations({ connectionString, schema = "public" }) {
  if (!connectionString) throw new Error("DATABASE_URL is required.");
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await client.query("BEGIN READ ONLY");
    const result = await collectV5Preflight(client, schema);
    await client.query("ROLLBACK");
    return result;
  } finally {
    await client.end();
  }
}

async function main() {
  const mode = process.argv[2];
  const options = { connectionString: process.env.DATABASE_URL, schema: process.env.DATABASE_SCHEMA || "public" };
  if (mode === "preflight") {
    const result = await preflightV5Migrations(options);
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.safe ? 0 : 2;
    return;
  }
  if (mode === "apply") {
    const result = await applyV5Migrations({
      ...options,
      appCommit: process.env.APP_COMMIT || "unknown",
      environment: process.env.DEPLOYMENT_ENVIRONMENT || "unknown",
      confirmation: process.env.V5_MIGRATION_CONFIRM,
    });
    console.log(JSON.stringify(result));
    return;
  }
  throw new Error("Usage: v5-schema-migrations.mjs preflight|apply");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    // Never print connection strings or driver error objects.
    console.error("V5_MIGRATION_FAILED: " + (error instanceof Error ? error.message : "unknown error"));
    process.exitCode = 1;
  });
}
