import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

if (process.env.ALLOW_DESTRUCTIVE_TOURNAMENT_RESET !== "true") {
  throw new Error(
    "Refusing destructive tournament reset. Set ALLOW_DESTRUCTIVE_TOURNAMENT_RESET=true explicitly.",
  );
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

const target = new URL(process.env.DATABASE_URL);
const databaseName = decodeURIComponent(target.pathname.replace(/^\//, ""));
if (!databaseName) {
  throw new Error("DATABASE_URL must identify a database.");
}

const migrationPath = fileURLToPath(
  new URL("../migrations/0001_series_v1_clean_cutover.sql", import.meta.url),
);
const migrationSql = await readFile(migrationPath, "utf8");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

console.log(
  `About to destructively reset Tournament Manager domain tables in ${target.hostname}/${databaseName}.`,
);
await client.connect();
try {
  await client.query(migrationSql);
  console.log("Tournament domain reset completed: series_v1 / match_record_v1.");
} finally {
  await client.end();
}
