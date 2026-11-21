import { logger } from "./lib/logger";
import {
  DeploymentTaskError,
  runDeploymentStartup,
  runPnpmDatabaseScript,
} from "./deployment-task";

async function startApi(): Promise<void> {
  // V5.1: refuse to serve on a schema without the migrations this build reads.
  const { pool } = await import("@workspace/db");
  const { assertSchemaCompatible } = await import("./lib/schema-guard");
  const schemaReport = await assertSchemaCompatible(pool);
  logger.info({ schema: schemaReport.schema, migrations: schemaReport.migrations.map((m) => m.migration) }, "Database schema compatible");
  const { default: app } = await import("./app");
  const rawPort = process.env["PORT"];

  if (!rawPort) {
    throw new Error(
      "PORT environment variable is required but was not provided.",
    );
  }

  const port = Number(rawPort);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
    // #324-L05: the Discord notifier does nothing until an organizer connects a webhook; DISCORD_NOTIFIER_ENABLED=false stops it.
    void import("./application/integrations/discord-notifier")
      .then(({ startDiscordWorker }) => startDiscordWorker())
      .catch((error) => logger.error({ error: error instanceof Error ? error.name : "Error" }, "Discord notifier failed to start"));
    if (process.env.STEAM_CATALOG_IMPORT_WORKER_ENABLED === "true") {
      void import("./application/catalog/steam-catalog-import-jobs")
        .then(({ startCatalogImportWorker }) => startCatalogImportWorker())
        .catch((error) => logger.error({ error }, "Catalog import worker failed to start"));
    }
  });
}

async function main(): Promise<void> {
  const result = await runDeploymentStartup(process.env, {
    runDatabaseScript: runPnpmDatabaseScript,
    startApi,
  });

  if (!result.apiStarted) {
    logger.info(
      { deploymentTask: result.mode, exitCode: result.exitCode },
      "Deployment task completed; API will not start",
    );
    process.exitCode = result.exitCode;
  }
}

void main().catch((error: unknown) => {
  const safeError =
    error instanceof Error
      ? { name: error.name, message: error.message }
      : { name: "Error", message: "Unknown deployment startup error." };
  logger.error({ error: safeError }, "Deployment startup failed");
  process.exitCode =
    error instanceof DeploymentTaskError ? error.exitCode : 1;
});
