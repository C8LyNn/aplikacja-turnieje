import pg from "pg";
import {
  loadPreflightConfig,
  runReadOnlyPreflight,
} from "./series-v1-reset-runtime.mjs";

const config = loadPreflightConfig();
const client = new pg.Client({ connectionString: config.databaseUrl });

await client.connect();
try {
  const report = await runReadOnlyPreflight(client, config);
  console.log(JSON.stringify({ phase: "preflight", report }, null, 2));
  if (!report.safe) process.exitCode = 2;
} finally {
  await client.end();
}
