// Read-only PostgreSQL deployment gate for Steam Game Catalog migrations 0029–0038.
// Never execute migrations, acquire write locks, or return credentials.
import { pathToFileURL } from "node:url";
import pg from "pg";

const { Client } = pg;
const IDENTIFIER = /^[a-z_][a-z0-9_]*$/;
const REQUIRED_TABLES = Object.freeze([
  "steam_catalog_games",
  "steam_catalog_terms",
  "steam_catalog_game_terms",
  "steam_catalog_status_counts",
  "steam_catalog_import_jobs",
  "steam_catalog_source_poll_limiter",
]);
const REQUIRED_COLUMNS = Object.freeze({
  steam_catalog_games: ["steam_app_id", "name", "status", "classification_revision", "steam_raw_data"],
  steam_catalog_status_counts: ["id", "unclassified", "review", "ready"],
  steam_catalog_source_poll_limiter: ["source", "next_allowed_at", "updated_at"],
  steam_catalog_import_jobs: [
    "id", "source", "source_page", "steam_cursor", "pending", "has_more", "retry_count",
    "max_games", "processed", "inserted", "existing", "ignored", "failed",
    "scanned", "status", "lease_token", "lease_expires_at", "next_run_at",
  ],
});
const REQUIRED_INDEXES = Object.freeze([
  "steam_catalog_games_app_id_uidx",
  "steam_catalog_import_jobs_single_active_idx",
]);
const REQUIRED_TRIGGERS = Object.freeze([
  "steam_catalog_count_insert",
  "steam_catalog_count_update",
  "steam_catalog_count_delete",
]);

function requireString(env, key) {
  const value = env[key]?.trim();
  if (!value) throw new Error("Missing required setting: " + key);
  return value;
}

export function loadCatalogPreflightConfig(env = process.env) {
  const raw = requireString(env, "CATALOG_PREFLIGHT_DATABASE_URL");
  const expectedHost = requireString(env, "CATALOG_PREFLIGHT_EXPECTED_HOST").toLowerCase();
  const expectedDatabase = requireString(env, "CATALOG_PREFLIGHT_EXPECTED_DATABASE");
  const schema = requireString(env, "CATALOG_PREFLIGHT_EXPECTED_SCHEMA");
  const environment = requireString(env, "CATALOG_PREFLIGHT_ENVIRONMENT");
  if (!IDENTIFIER.test(schema)) throw new Error("Invalid expected schema identifier.");
  if (!["staging", "production"].includes(environment)) {
    throw new Error("CATALOG_PREFLIGHT_ENVIRONMENT must be staging or production.");
  }
  if (environment === "production" && env.CATALOG_PREFLIGHT_ALLOW_PRODUCTION !== "YES_READ_ONLY") {
    throw new Error("Production inspection requires CATALOG_PREFLIGHT_ALLOW_PRODUCTION=YES_READ_ONLY.");
  }
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid CATALOG_PREFLIGHT_DATABASE_URL.");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("Preflight requires a PostgreSQL connection URL.");
  }
  const database = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  if (!database || database.includes("/") || database !== expectedDatabase) {
    throw new Error("Database name does not match CATALOG_PREFLIGHT_EXPECTED_DATABASE.");
  }
  if (url.hostname.toLowerCase() !== expectedHost) {
    throw new Error("Host does not match CATALOG_PREFLIGHT_EXPECTED_HOST.");
  }
  if (url.searchParams.has("options") && /search_path/i.test(url.searchParams.get("options") ?? "")) {
    throw new Error("Remove search_path overrides from the database URL.");
  }
  return Object.freeze({
    connectionString: raw,
    expectedHost, expectedDatabase, schema, environment,
  });
}

/**
 * The caller controls the client lifetime. A REPEATABLE READ READ ONLY
 * transaction provides a consistent catalog-count snapshot and blocks writes.
 * The method uses only catalog metadata and counts, never full game records.
 */
export async function inspectCatalogPreflight(client, config) {
  if (!IDENTIFIER.test(config.schema)) throw new Error("Invalid inspection schema.");
  const checks = [];
  const check = (name, passed, reason) => checks.push({
    name, passed: Boolean(passed), ...(passed ? {} : { reason }),
  });
  const quoteSchema = '"' + config.schema + '"';
  let begun = false;
  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    begun = true;
    const identity = (await client.query("SELECT current_database() AS name")).rows[0]?.name;
    check("database_identity", identity === config.expectedDatabase,
      "Connected database name differs from the expected database.");

    const tableRows = (await client.query(
      "SELECT table_name FROM information_schema.tables " +
      "WHERE table_schema=$1 AND table_name = ANY($2::text[])",
      [config.schema, REQUIRED_TABLES],
    )).rows;
    const tables = new Set(tableRows.map((row) => row.table_name));
    for (const name of REQUIRED_TABLES) {
      check("table:" + name, tables.has(name), "Required migration table is missing.");
    }

    const columnRows = (await client.query(
      "SELECT table_name,column_name,data_type,is_nullable " +
      "FROM information_schema.columns WHERE table_schema=$1 " +
      "AND table_name = ANY($2::text[])",
      [config.schema, Object.keys(REQUIRED_COLUMNS)],
    )).rows;
    const columns = new Map(columnRows.map((row) => [
      row.table_name + "." + row.column_name, row,
    ]));
    for (const [table, names] of Object.entries(REQUIRED_COLUMNS)) {
      for (const column of names) {
        check("column:" + table + "." + column, columns.has(table + "." + column),
          "Required catalog column is missing.");
      }
    }
    const source = columns.get("steam_catalog_import_jobs.source");
    check("source_type", source?.data_type === "text" && source?.is_nullable === "NO",
      "Migration 0036 source must be NOT NULL text.");
    const sourcePage = columns.get("steam_catalog_import_jobs.source_page");
    check("source_page_type",
      sourcePage?.data_type === "integer" && sourcePage?.is_nullable === "NO",
      "Migration 0036 source_page must be NOT NULL integer.");

    const indexRows = (await client.query(
      "SELECT indexrel.relname AS name, idx.indisvalid AS valid, idx.indisunique AS unique " +
      "FROM pg_index idx JOIN pg_class indexrel ON indexrel.oid=idx.indexrelid " +
      "JOIN pg_class tablerel ON tablerel.oid=idx.indrelid " +
      "JOIN pg_namespace ns ON ns.oid=tablerel.relnamespace " +
      "WHERE ns.nspname=$1 AND indexrel.relname = ANY($2::text[])",
      [config.schema, REQUIRED_INDEXES],
    )).rows;
    const indexes = new Map(indexRows.map((row) => [row.name, row]));
    for (const name of REQUIRED_INDEXES) {
      const idx = indexes.get(name);
      check("unique_index:" + name, idx?.valid === true && idx?.unique === true,
        "Required unique index is missing or invalid.");
    }

    const triggerRows = (await client.query(
      "SELECT t.tgname AS name, t.tgenabled AS enabled " +
      "FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid " +
      "JOIN pg_namespace ns ON ns.oid=c.relnamespace " +
      "WHERE ns.nspname=$1 AND c.relname='steam_catalog_games' " +
      "AND NOT t.tgisinternal AND t.tgname = ANY($2::text[])",
      [config.schema, REQUIRED_TRIGGERS],
    )).rows;
    const triggers = new Map(triggerRows.map((row) => [row.name, row.enabled]));
    for (const name of REQUIRED_TRIGGERS) {
      check("trigger:" + name, ["O", "A"].includes(triggers.get(name)),
        "Exact status counter trigger is missing or disabled.");
    }

    let counts = null;
    if (tables.has("steam_catalog_games") && tables.has("steam_catalog_status_counts") &&
        ["status", "id", "unclassified", "review", "ready"].every((name) =>
          name === "status" ? columns.has("steam_catalog_games.status") :
            columns.has("steam_catalog_status_counts." + name))) {
      const result = await client.query(
        "SELECT " +
        "(SELECT count(*)::text FROM " + quoteSchema + ".steam_catalog_games) AS total, " +
        "(SELECT count(*)::integer FROM " + quoteSchema + ".steam_catalog_status_counts) AS counter_rows, " +
        "(SELECT (unclassified+review+ready)::text FROM " + quoteSchema + ".steam_catalog_status_counts " +
        "WHERE id=1) AS counted",
      );
      const row = result.rows[0];
      counts = { games: row?.total ?? null, counted: row?.counted ?? null };
      check("single_counter_row", row?.counter_rows === 1,
        "Status counters should contain exactly one row.");
      check("exact_counts", row?.total !== null && row?.total === row?.counted,
        "Stored status counters differ from actual game total.");
    } else {
      check("exact_counts", false, "Required count tables or columns missing.");
    }
    const passed = checks.every((item) => item.passed);
    return {
      passed, environment: config.environment, schema: config.schema,
      database: identity ?? null, counts, checks,
    };
  } finally {
    if (begun) await client.query("ROLLBACK");
  }
}

export async function runCatalogPreflight(env = process.env) {
  const config = loadCatalogPreflightConfig(env);
  const client = new Client({ connectionString: config.connectionString,
    connectionTimeoutMillis: 8000 });
  try {
    await client.connect();
    return await inspectCatalogPreflight(client, config);
  } finally {
    await client.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const report = await runCatalogPreflight();
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    process.exitCode = report.passed ? 0 : 2;
  } catch (error) {
    // Never echo connection strings or underlying driver errors.
    const allowed = error instanceof Error &&
      /^(Missing required setting:|CATALOG_PREFLIGHT_|Invalid expected|Invalid CATALOG_|Database name|Host does not match|Production inspection|Preflight requires|Remove search_path)/.test(error.message);
    process.stderr.write("CATALOG_PREFLIGHT_FAILED: " +
      (allowed ? error.message : "Database connection or inspection unsuccessful.") + "\n");
    process.exitCode = 1;
  }
}
