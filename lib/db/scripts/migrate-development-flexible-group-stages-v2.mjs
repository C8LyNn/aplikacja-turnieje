import { pathToFileURL } from "node:url";
import { runFlexibleGroupStagesMigrationWithConfig } from "./migrate-flexible-group-stages-v2.mjs";
import { loadFlexibleGroupStagesDevelopmentDeploymentConfig } from "./flexible-group-stages-v2-deployment.mjs";

export async function runFlexibleGroupStagesDevelopmentMigration(env = process.env) {
  return runFlexibleGroupStagesMigrationWithConfig(
    loadFlexibleGroupStagesDevelopmentDeploymentConfig(env),
  );
}

async function main() {
  const result = await runFlexibleGroupStagesDevelopmentMigration();
  process.stdout.write(
    `${JSON.stringify({ phase: "development-migrate", ...result })}\n`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
