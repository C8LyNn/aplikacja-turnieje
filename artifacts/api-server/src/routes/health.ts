import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";

export const DATABASE_HEALTH_TIMEOUT_MS = 1_000;
export const MAX_DATABASE_HEALTH_TIMEOUT_MS = 15_000;

/**
 * Default behavior stays unchanged on existing Replit deployments.
 * For isolated Neon staging, DB_HEALTH_TIMEOUT_MS=10000 tolerates
 * autosuspended PostgreSQL cold starts without storing any credentials.
 */
export function resolveHealthTimeoutMs(raw: string | undefined): number {
  if (!raw || !/^[1-9]\d{0,4}$/.test(raw)) return DATABASE_HEALTH_TIMEOUT_MS;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) &&
    parsed >= DATABASE_HEALTH_TIMEOUT_MS &&
    parsed <= MAX_DATABASE_HEALTH_TIMEOUT_MS
    ? parsed
    : DATABASE_HEALTH_TIMEOUT_MS;
}

interface HealthLogger {
  warn: (bindings: Record<string, unknown>, message: string) => void;
}

interface HealthRouterOptions {
  databaseCheck?: () => Promise<unknown>;
  timeoutMs?: number;
  log?: HealthLogger;
}

interface RuntimeTimedQueryConfig {
  text: string;
  query_timeout: number;
}

class DatabaseHealthTimeoutError extends Error {
  constructor() {
    super("Database health check timed out.");
    this.name = "DatabaseHealthTimeoutError";
  }
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => reject(new DatabaseHealthTimeoutError()), timeoutMs);
  });
  try {
    return await Promise.race([operation, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export function createHealthRouter({
  timeoutMs = resolveHealthTimeoutMs(process.env.DB_HEALTH_TIMEOUT_MS),
  databaseCheck = async () => {
    const { pool } = await import("@workspace/db");
    // pg 8.20 supports query_timeout at runtime, while the bundled @types/pg
    // QueryConfig omits it. Keep the compatibility cast local to this query.
    const timedQuery = pool.query.bind(pool) as unknown as (
      config: RuntimeTimedQueryConfig,
    ) => Promise<unknown>;
    return timedQuery({ text: "SELECT 1", query_timeout: timeoutMs });
  },
  log = logger,
}: HealthRouterOptions = {}): IRouter {
  const router: IRouter = Router();

  router.get("/healthz", async (_req, res) => {
    try {
      await withTimeout(databaseCheck(), timeoutMs);
      const data = HealthCheckResponse.parse({ status: "ok", database: "ok" });
      res.json(data);
    } catch (error) {
      log.warn(
        {
          errorType:
            error instanceof DatabaseHealthTimeoutError ? "timeout" : "query_failed",
        },
        "Database health check failed",
      );
      const data = HealthCheckResponse.parse({
        status: "error",
        database: "unavailable",
      });
      res.status(503).json(data);
    }
  });

  return router;
}

export default createHealthRouter();
