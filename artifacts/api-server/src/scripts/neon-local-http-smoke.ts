/**
 * CI-only local PostgreSQL HTTP smoke. Never accepts remote or Neon hosts.
 * Used by test/neon-local-http.integration.test.ts after a disposable test
 * schema has been seeded with synthetic tournament fixtures.
 */
import { runReadOnlyApiSmoke } from "./neon-readonly-api-probe";

async function main(): Promise<void> {
  const raw = process.env.DATABASE_URL;
  if (!raw || process.env.NODE_ENV !== "test" ||
      process.env.NEON_LOCAL_HTTP_SMOKE !== "isolated-ci-fixture") {
    throw new Error("Local smoke requires the isolated test runner.");
  }
  const target = new URL(raw);
  const startup = target.searchParams.get("options") ?? "";
  if (target.hostname !== "127.0.0.1" ||
      target.pathname !== "/tournament_readiness_test" ||
      !/^-c search_path=tm_test_[a-z0-9_]+ -c default_transaction_read_only=on$/.test(startup) ||
      !["postgres:", "postgresql:"].includes(target.protocol)) {
    throw new Error("Only a localhost disposable read-only test database is permitted.");
  }
  process.env.DB_HEALTH_TIMEOUT_MS = "10000";
  const { pool } = await import("@workspace/db");
  try {
    const result = await runReadOnlyApiSmoke({
      pool, requirePublicTournament: true,
    });
    process.stdout.write(JSON.stringify({
      result: "pass", target: "isolated-localhost-test", ...result,
    }) + "\n");
  } finally {
    await pool.end();
  }
}

main().catch(() => {
  // Never emit pg error stacks or usernames/connection strings in CI logs.
  process.stderr.write("Isolated local HTTP smoke failed.\n");
  process.exitCode = 1;
});
