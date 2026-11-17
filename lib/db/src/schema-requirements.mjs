// Single source of truth for schema objects that the running API depends on but that
// arrive through additive migrations after the 0001–0040 baseline. Used by:
//   * the API startup guard (refuses to serve on an incompatible schema),
//   * lib/db/scripts/v5-schema-migrations.mjs (preflight, apply, post-verify),
//   * tests.
// Add a new entry here together with every future migration the API code reads.

/** @typedef {{ table: string, columns?: string[], constraints?: string[], indexes?: string[] }} RequiredObject */

export const SCHEMA_REQUIREMENTS = Object.freeze([
  Object.freeze({
    migration: "0041_round_robin_legs.sql",
    key: "v5_round_robin_legs_0041",
    feature: "Liga: mecz i rewanż",
    objects: Object.freeze([
      { table: "tournament_stages", columns: ["round_robin_legs"], constraints: ["tournament_stages_round_robin_legs_supported"] },
    ]),
  }),
  Object.freeze({
    migration: "0042_tournament_teams.sql",
    key: "v5_tournament_teams_0042",
    feature: "Drużyny i składy",
    objects: Object.freeze([
      {
        table: "tournaments",
        columns: ["participant_type", "team_roster_min", "team_roster_max"],
        constraints: ["tournaments_participant_type_supported", "tournaments_team_roster_limits"],
      },
      {
        table: "tournament_teams",
        columns: ["id", "tournament_id", "player_id", "short_code", "created_at"],
        constraints: ["tournament_teams_player_unique", "tournament_teams_entry_same_tournament_fk", "tournament_teams_short_code_format"],
      },
      {
        table: "team_members",
        columns: ["id", "team_id", "name", "role", "joined_at", "left_at", "left_reason"],
        constraints: ["team_members_name_length", "team_members_role_supported", "team_members_left_after_join", "team_members_left_reason_shape"],
        indexes: ["team_members_one_active_captain", "team_members_active_name_unique", "team_members_team_idx"],
      },
    ]),
  }),
]);

/** Tables every V5 migration builds on (from the 0001–0040 baseline). */
export const BASELINE_PREREQUISITES = Object.freeze(["tournaments", "tournament_stages", "players"]);

/**
 * Reads the catalog of one schema (default: the connection's current schema).
 * @param {{ query: (sql: string, values?: unknown[]) => Promise<{ rows: any[] }> }} client
 * @param {string | null} [schema]
 */
export async function inspectSchemaRequirements(client, schema = null) {
  const target = schema ?? (await client.query("SELECT current_schema() AS schema")).rows[0].schema;
  const tables = new Set((await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = $1", [target],
  )).rows.map((row) => row.table_name));
  const columns = new Set((await client.query(
    "SELECT table_name || '.' || column_name AS name FROM information_schema.columns WHERE table_schema = $1", [target],
  )).rows.map((row) => row.name));
  const constraints = new Set((await client.query(
    `SELECT rel.relname || '.' || con.conname AS name, con.convalidated FROM pg_constraint con
       JOIN pg_class rel ON rel.oid = con.conrelid JOIN pg_namespace ns ON ns.oid = rel.relnamespace
      WHERE ns.nspname = $1 AND con.convalidated`, [target],
  )).rows.map((row) => row.name));
  const indexes = new Set((await client.query(
    "SELECT tablename || '.' || indexname AS name FROM pg_indexes WHERE schemaname = $1", [target],
  )).rows.map((row) => row.name));

  const migrations = SCHEMA_REQUIREMENTS.map((requirement) => {
    const missing = [];
    let present = 0;
    for (const object of requirement.objects) {
      const check = (kind, name, has) => { if (has) present += 1; else missing.push(`${kind} ${name}`); };
      check("table", object.table, tables.has(object.table));
      for (const column of object.columns ?? []) check("column", `${object.table}.${column}`, columns.has(`${object.table}.${column}`));
      for (const constraint of object.constraints ?? []) check("constraint", `${object.table}.${constraint}`, constraints.has(`${object.table}.${constraint}`));
      for (const index of object.indexes ?? []) check("index", `${object.table}.${index}`, indexes.has(`${object.table}.${index}`));
    }
    // Pre-existing baseline tables (e.g. tournaments) do not count as evidence of this migration.
    const ownEvidence = present - requirement.objects.filter((object) => BASELINE_PREREQUISITES.includes(object.table) && tables.has(object.table)).length;
    const status = missing.length === 0 ? "applied" : ownEvidence === 0 ? "absent" : "partial";
    return { migration: requirement.migration, key: requirement.key, feature: requirement.feature, status, missing };
  });
  const missingPrerequisites = BASELINE_PREREQUISITES.filter((table) => !tables.has(table));
  return {
    schema: target,
    compatible: missingPrerequisites.length === 0 && migrations.every((migration) => migration.status === "applied"),
    missingPrerequisites,
    migrations,
  };
}

/** Short, credential-free description for logs and error messages. */
export function describeSchemaGaps(report) {
  const parts = [];
  if (report.missingPrerequisites.length) parts.push(`missing baseline tables: ${report.missingPrerequisites.join(", ")}`);
  for (const migration of report.migrations) {
    if (migration.status !== "applied") parts.push(`${migration.migration} ${migration.status} (${migration.missing.slice(0, 6).join("; ")}${migration.missing.length > 6 ? "; …" : ""})`);
  }
  return parts.join(" | ");
}
