import { pathToFileURL } from "node:url";
import pg from "pg";
import {
  ROUTING_PERSISTENCE_TABLES,
  classifyRoutingPersistenceCatalog,
  inspectRoutingPersistenceCatalog,
} from "./tournament-routing-persistence-v2-catalog.mjs";

export { ROUTING_PERSISTENCE_TABLES };

export function loadRoutingPersistencePreflightConfig(env = process.env) {
  const databaseUrl = env.DATABASE_URL?.trim();
  const expectedDatabaseName = env.EXPECTED_DATABASE_NAME?.trim();
  const expectedSchema = env.EXPECTED_DATABASE_SCHEMA?.trim();
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  if (!expectedDatabaseName) {
    throw new Error("EXPECTED_DATABASE_NAME is required.");
  }
  if (!expectedSchema || !/^[a-z_][a-z0-9_]*$/i.test(expectedSchema)) {
    throw new Error("EXPECTED_DATABASE_SCHEMA must be a simple SQL identifier.");
  }
  return Object.freeze({ databaseUrl, expectedDatabaseName, expectedSchema });
}

export function classifyRoutingPersistenceSchema({
  databaseMatches,
  schemaMatches,
  catalog,
}) {
  const reasons = [];
  if (!databaseMatches) reasons.push("current_database() does not match the expected database.");
  if (!schemaMatches) reasons.push("current_schema() does not match the expected schema.");
  const classification = classifyRoutingPersistenceCatalog(catalog);
  return {
    ...classification,
    safe: reasons.length === 0 && classification.safe,
    reasons: [...reasons, ...classification.reasons],
  };
}

export async function collectRoutingPersistencePreflight(client, config) {
  const metadata = await client.query(
    `SELECT current_database() AS database,
            current_schema() AS schema`,
  );
  const current = metadata.rows[0];
  if (!current) throw new Error("Unable to inspect the target database.");

  const catalog = await inspectRoutingPersistenceCatalog(
    client,
    config.expectedSchema,
  );
  return {
    database: current.database,
    schema: current.schema,
    ...classifyRoutingPersistenceSchema({
      databaseMatches: current.database === config.expectedDatabaseName,
      schemaMatches: current.schema === config.expectedSchema,
      catalog,
    }),
  };
}

export async function runRoutingPersistencePreflight(
  env = process.env,
  logger = console,
) {
  const config = loadRoutingPersistencePreflightConfig(env);
  const client = new pg.Client({ connectionString: config.databaseUrl });
  await client.connect();
  try {
    await client.query("BEGIN READ ONLY");
    const report = await collectRoutingPersistencePreflight(client, config);
    await client.query("ROLLBACK");
    logger.log(JSON.stringify(report));
    return report;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runRoutingPersistencePreflight().then(
    (report) => {
      process.exitCode = report.safe ? 0 : 1;
    },
    (error) => {
      console.error(
        JSON.stringify({
          safe: false,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown preflight error.",
        }),
      );
      process.exitCode = 1;
    },
  );
}
