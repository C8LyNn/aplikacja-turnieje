import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  loadDestructiveResetConfig,
  performDestructiveSeriesV1Reset,
} from "./series-v1-reset-runtime.mjs";

const config = loadDestructiveResetConfig();

const migrationPath = fileURLToPath(
  new URL("../migrations/0001_series_v1_clean_cutover.sql", import.meta.url),
);
const migrationSql = await readFile(migrationPath, "utf8");
const client = new pg.Client({ connectionString: config.databaseUrl });

await client.connect();
try {
  await performDestructiveSeriesV1Reset({
    client,
    config,
    migrationSql,
    onEvent(event) {
      console.log(JSON.stringify(event, null, 2));
    },
  });
} finally {
  await client.end();
}
