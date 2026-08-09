import { pathToFileURL } from "node:url";
import { runFlexibleGroupStagesPreflightWithConfig } from "./preflight-flexible-group-stages-v2.mjs";
import { loadFlexibleGroupStagesDevelopmentDeploymentConfig } from "./flexible-group-stages-v2-deployment.mjs";

export async function runFlexibleGroupStagesDevelopmentPreflight(env = process.env) {
  return runFlexibleGroupStagesPreflightWithConfig(
    loadFlexibleGroupStagesDevelopmentDeploymentConfig(env),
  );
}

async function main() {
  const report = await runFlexibleGroupStagesDevelopmentPreflight();
  process.stdout.write(
    `${JSON.stringify({ phase: "development-preflight", report }, null, 2)}\n`,
  );
  if (!report.safe) process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
