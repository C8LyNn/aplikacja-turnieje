import { pathToFileURL } from "node:url";
import { runTournamentStagesPreflightWithConfig } from "./preflight-tournament-stages-v1.mjs";
import { loadTournamentStagesDevelopmentDeploymentConfig } from "./tournament-stages-v1-deployment.mjs";

export async function runTournamentStagesDevelopmentPreflight(
  env = process.env,
) {
  return runTournamentStagesPreflightWithConfig(
    loadTournamentStagesDevelopmentDeploymentConfig(env),
  );
}

async function main() {
  const report = await runTournamentStagesDevelopmentPreflight();
  process.stdout.write(
    `${JSON.stringify({ phase: "development-preflight", report }, null, 2)}\n`,
  );
  if (!report.safe) process.exitCode = 2;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
