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

type SmokeStep = { route: string; status: "pass" | "skipped" };
const steps: SmokeStep[] = [];

async function main(): Promise<void> {
  // No source/production DATABASE_URL is ever accepted or modified.
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

  // Dynamic imports are mandatory: @workspace/db initializes its pool
  // from DATABASE_URL during module evaluation.
  const { pool } = await import("@workspace/db");
  try {
    const transactionMode = await pool.query<{ default_transaction_read_only: string }>(
      "SHOW default_transaction_read_only",
    );
    if (transactionMode.rows[0]?.default_transaction_read_only !== "on") {
      throw new Error("Database is not in read-only mode. No API calls executed.");
    }
    const before = await pool.query<{
      tournaments: string; matches: string; players: string;
    }>("SELECT " +
      "(SELECT count(*)::text FROM public.tournaments) AS tournaments, " +
      "(SELECT count(*)::text FROM public.matches) AS matches, " +
      "(SELECT count(*)::text FROM public.players) AS players");

    const { createApp } = await import("../app");
    const request = (await import("supertest")).default;
    const app = createApp();

    async function get(route: string): Promise<import("supertest").Response> {
      const response = await request(app).get(route).timeout({
        response: 15000, deadline: 20000,
      });
      if (response.status !== 200) {
        throw new Error("Staging GET smoke failed; route=" + route +
          ", HTTP status=" + response.status);
      }
      steps.push({ route: route.replace(/\/\d+(?=\/|$)/g, "/:id"), status: "pass" });
      return response;
    }

    const health = await get("/api/healthz");
    if (health.body?.status !== "ok" || health.body?.database !== "ok") {
      throw new Error("Unexpected database health response.");
    }
    const tournaments = await get("/api/tournaments");
    if (!Array.isArray(tournaments.body)) {
      throw new Error("Tournament listing has unexpected response shape.");
    }
    const firstPublic = tournaments.body.find((item: unknown) => {
      const row = item as { id?: unknown; visibility?: unknown };
      return Number.isSafeInteger(row?.id) && Number(row.id) > 0 &&
        row.visibility === "public_online";
    }) as { id: number } | undefined;

    if (firstPublic) {
      for (const route of [
        "/api/tournaments/:id",
        "/api/tournaments/:id/stages",
        "/api/tournaments/:id/matches",
        "/api/tournaments/:id/players",
        "/api/tournaments/:id/standings",
        "/api/tournaments/:id/bracket",
      ]) {
        await get(route.replace(":id", String(firstPublic.id)));
      }
    } else {
      steps.push({ route: "/api/tournaments/:id/*", status: "skipped" });
    }

    const after = await pool.query<{
      tournaments: string; matches: string; players: string;
    }>("SELECT " +
      "(SELECT count(*)::text FROM public.tournaments) AS tournaments, " +
      "(SELECT count(*)::text FROM public.matches) AS matches, " +
      "(SELECT count(*)::text FROM public.players) AS players");
    if (JSON.stringify(before.rows) !== JSON.stringify(after.rows)) {
      throw new Error("Unexpected row-count drift during read-only smoke.");
    }

    // No IDs, names, source data, tokens, response bodies or connection URIs
    // should enter CI logs.
    process.stdout.write(JSON.stringify({
      result: "pass",
      readOnly: true,
      checkedRoutes: steps.filter(item => item.status === "pass").length,
      skippedRouteGroups: steps.filter(item => item.status === "skipped").length,
      rowCountsUnchanged: true,
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
