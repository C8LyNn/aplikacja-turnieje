import { pathToFileURL } from "node:url";
import { runTournamentStagesMigrationWithConfig } from "./migrate-tournament-stages-v1.mjs";
import { loadTournamentStagesDevelopmentDeploymentConfig } from "./tournament-stages-v1-deployment.mjs";

export async function runTournamentStagesDevelopmentMigration(
  env = process.env,
) {
  return runTournamentStagesMigrationWithConfig(
    loadTournamentStagesDevelopmentDeploymentConfig(env),
  );
}

async function main() {
  const result = await runTournamentStagesDevelopmentMigration();
  process.stdout.write(
    `${JSON.stringify({ phase: "development-migrate", ...result })}\n`,
  );
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
