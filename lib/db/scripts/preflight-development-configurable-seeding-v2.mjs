import { pathToFileURL } from "node:url";
import { runConfigurableSeedingPreflightWithConfig } from "./preflight-configurable-seeding-v2.mjs";
import { loadConfigurableSeedingDevelopmentDeploymentConfig } from "./configurable-seeding-v2-deployment.mjs";
export async function runConfigurableSeedingDevelopmentPreflight(env = process.env) {
  return runConfigurableSeedingPreflightWithConfig(loadConfigurableSeedingDevelopmentDeploymentConfig(env));
}
async function main() {
  const report = await runConfigurableSeedingDevelopmentPreflight();
  process.stdout.write(`${JSON.stringify({ phase: "development-preflight", report }, null, 2)}\n`);
  if (!report.safe) process.exitCode = 2;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1; });
}
