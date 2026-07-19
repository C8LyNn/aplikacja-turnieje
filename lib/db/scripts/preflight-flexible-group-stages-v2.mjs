import { pathToFileURL } from "node:url";
import pg from "pg";
import {
  loadFlexibleGroupStagesDeploymentConfig,
  runFlexibleGroupStagesReadOnlyPreflight,
} from "./flexible-group-stages-v2-deployment.mjs";

const { Client } = pg;

export async function runFlexibleGroupStagesPreflightWithConfig(config) {
  const client = new Client({ connectionString: config.databaseUrl });
  await client.connect();
  try {
    return await runFlexibleGroupStagesReadOnlyPreflight(client, config);
  } finally {
    await client.end();
  }
}

export async function runFlexibleGroupStagesPreflight(env = process.env) {
  return runFlexibleGroupStagesPreflightWithConfig(
    loadFlexibleGroupStagesDeploymentConfig(env),
  );
}

async function main() {
  const report = await runFlexibleGroupStagesPreflight();
  process.stdout.write(
    `${JSON.stringify({ phase: "preflight", report }, null, 2)}\n`,
  );
  if (!report.safe) process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
