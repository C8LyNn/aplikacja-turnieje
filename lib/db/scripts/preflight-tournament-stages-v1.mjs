import { pathToFileURL } from "node:url";
import pg from "pg";
import {
  loadTournamentStagesDeploymentConfig,
  runTournamentStagesReadOnlyPreflight,
} from "./tournament-stages-v1-deployment.mjs";

const { Client } = pg;

export async function runTournamentStagesPreflight(env = process.env) {
  const config = loadTournamentStagesDeploymentConfig(env);
  const client = new Client({ connectionString: config.databaseUrl });
  await client.connect();
  try {
    return await runTournamentStagesReadOnlyPreflight(client, config);
  } finally {
    await client.end();
  }
}

async function main() {
  const report = await runTournamentStagesPreflight();
  process.stdout.write(
    `${JSON.stringify({ phase: "preflight", report }, null, 2)}\n`,
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
