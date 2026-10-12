/**
 * In-process, non-public, GET-only API smoke test against an isolated
 * Neon QA child branch. This does NOT start the production server.
 *
 * Requires NEON_STAGING_DATABASE_URL set privately in a dedicated staging
 * execution environment, never the deployed Replit production process.
 *
 * Invoke with: pnpm --filter @workspace/api-server exec tsx src/scripts/neon-staging-api-smoke.ts
 */
import { stagingReadOnlyDatabaseUrl } from "./neon-staging-target";

import { runReadOnlyApiSmoke } from "./neon-readonly-api-probe";

async function main(): Promise<void> {
  const incoming = process.env.NEON_STAGING_DATABASE_URL;
  const readOnlyUrl = stagingReadOnlyDatabaseUrl(incoming);
  if (process.env.DATABASE_URL && process.env.DATABASE_URL !== incoming) {
    throw new Error("A different DATABASE_URL is already configured; staging smoke refused.");
  }
  if (process.env.DEPLOYMENT_TASK) {
    throw new Error("DEPLOYMENT_TASK is set; staging smoke refused.");
  }
  process.env.DATABASE_URL = readOnlyUrl;
  process.env.DB_HEALTH_TIMEOUT_MS = "10000";

  // Dynamic import: @workspace/db reads DATABASE_URL on initialization.
  const { pool } = await import("@workspace/db");
  try {
    const result = await runReadOnlyApiSmoke({ pool, requirePublicTournament: true });
    process.stdout.write(JSON.stringify({
      result: "pass", readOnly: true, ...result,
    }) + "\n");
  } finally {
    await pool.end();
  }
}

main().catch(() => {
  // Avoid dumping errors thrown by a PostgreSQL client: exceptions can
  // contain connection-string fields, query values or table data.
  process.stderr.write("Staging API smoke FAILED. See approved private diagnostics; no production action taken.\n");
  process.exitCode = 1;
});
