import { pathToFileURL } from "node:url";
import { runConfigurableSeedingMigrationWithConfig } from "./migrate-configurable-seeding-v2.mjs";
import { loadConfigurableSeedingDevelopmentDeploymentConfig } from "./configurable-seeding-v2-deployment.mjs";
export async function runConfigurableSeedingDevelopmentMigration(env = process.env) {
  return runConfigurableSeedingMigrationWithConfig(loadConfigurableSeedingDevelopmentDeploymentConfig(env));
}
async function main() {
  const result = await runConfigurableSeedingDevelopmentMigration();
  process.stdout.write(`${JSON.stringify({ phase: "development-migrate", ...result })}\n`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1; });
}
