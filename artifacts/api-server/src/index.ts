import { logger } from "./lib/logger";
import { startCatalogImportWorker } from "./application/catalog/steam-catalog-import-jobs";
import {
  DeploymentTaskError,
  runDeploymentStartup,
  runPnpmDatabaseScript,
} from "./deployment-task";

async function startApi(): Promise<void> {
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
    startCatalogImportWorker();
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
