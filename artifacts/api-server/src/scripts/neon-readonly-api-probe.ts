/**
 * Shared read-only HTTP smoke. No public listener, no body/ID/secret logging.
 * PostgreSQL must be configured to enforce default_transaction_read_only=on
 * for every connection before this is called.
 */
export async function runReadOnlyApiSmoke(options: {
  pool: typeof import("@workspace/db").pool;
  requirePublicTournament?: boolean;
}): Promise<{ checkedRoutes: number; skippedRouteGroups: number; rowCountsUnchanged: true }> {
  const { pool } = options;

  const check = await pool.query<{ default_transaction_read_only: string }>(
    "SHOW default_transaction_read_only",
  );
  if (check.rows[0]?.default_transaction_read_only !== "on") {
    throw new Error("Read-only session was not configured; HTTP smoke refused.");
  }

  const snapshot = () => pool.query<{
    tournaments: string; matches: string; players: string;
  }>(
    "SELECT " +
    "(SELECT count(*)::text FROM tournaments) AS tournaments, " +
    "(SELECT count(*)::text FROM matches) AS matches, " +
    "(SELECT count(*)::text FROM players) AS players",
  );
  const before = await snapshot();

  const { createApp } = await import("../app");
  const request = (await import("supertest")).default;
  const app = createApp();
  let checkedRoutes = 0;
  let skippedRouteGroups = 0;

  async function get(path: string): Promise<import("supertest").Response> {
    const response = await request(app).get(path).timeout({
      response: 15_000, deadline: 20_000,
    });
    if (response.status !== 200) {
      // Do not include a body, row data, response headers, or credentials.
      throw new Error("HTTP staging smoke failed at a GET route (HTTP " + response.status + ")");
    }
    checkedRoutes += 1;
    return response;
  }

  const health = await get("/api/healthz");
  if (health.body?.status !== "ok" || health.body?.database !== "ok") {
    throw new Error("Healthcheck returned an unexpected payload.");
  }
  const tournaments = await get("/api/tournaments");
  if (!Array.isArray(tournaments.body)) {
    throw new Error("Tournament listing returned an unexpected payload.");
  }

  const publicTournament = tournaments.body.find((item: unknown) => {
    const record = item as { id?: unknown; visibility?: unknown };
    return Number.isSafeInteger(record?.id) &&
      Number(record.id) > 0 && record.visibility === "public_online";
  }) as { id: number } | undefined;

  if (!publicTournament) {
    if (options.requirePublicTournament) {
      throw new Error("Required public fixture is missing; HTTP smoke cannot pass.");
    }
    skippedRouteGroups += 1;
  } else {
    for (const path of [
      "/api/tournaments/:id",
      "/api/tournaments/:id/stages",
      "/api/tournaments/:id/matches",
      "/api/tournaments/:id/players",
      "/api/tournaments/:id/standings",
      "/api/tournaments/:id/bracket",
    ]) {
      await get(path.replace(":id", String(publicTournament.id)));
    }
  }

  const after = await snapshot();
  if (JSON.stringify(before.rows) !== JSON.stringify(after.rows)) {
    throw new Error("Staging HTTP smoke unexpectedly changed data counts.");
  }
  return { checkedRoutes, skippedRouteGroups, rowCountsUnchanged: true };
}
