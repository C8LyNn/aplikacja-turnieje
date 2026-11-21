import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { resolveDatabaseConnectionString } from "./development-database-connection.mjs";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: resolveDatabaseConnectionString(process.env) });
// An idle connection the server closes (restart, failover, Neon suspending an idle compute — code 57P01) is reported
// on the pool. Without a listener Node treats it as an unhandled 'error' event and the whole API process exits; with
// one the pool drops that client and the next query opens a new connection. Only the code is logged, never the URL.
pool.on("error", (error: Error & { code?: string }) => {
  console.warn(JSON.stringify({ level: "warn", msg: "database idle connection closed", code: error.code ?? error.name }));
});
export const db = drizzle(pool, { schema });

export * from "./schema";
