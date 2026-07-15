import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";

export const DATABASE_HEALTH_TIMEOUT_MS = 1_000;

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
  databaseCheck = async () => {
    const { pool } = await import("@workspace/db");
    // pg 8.20 supports query_timeout at runtime, while the bundled @types/pg
    // QueryConfig omits it. Keep the compatibility cast local to this query.
    const timedQuery = pool.query.bind(pool) as unknown as (
      config: RuntimeTimedQueryConfig,
    ) => Promise<unknown>;
    return timedQuery({ text: "SELECT 1", query_timeout: DATABASE_HEALTH_TIMEOUT_MS });
  },
  timeoutMs = DATABASE_HEALTH_TIMEOUT_MS,
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
