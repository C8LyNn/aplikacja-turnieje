import { spawn } from "node:child_process";

export const SERIES_V1_PREFLIGHT_TASK = "series_v1_preflight";
export const SERIES_V1_RESET_TASK = "series_v1_reset";
export const TOURNAMENT_STAGES_V1_PREFLIGHT_TASK =
  "tournament_stages_v1_preflight";
export const TOURNAMENT_STAGES_V1_MIGRATE_TASK = "tournament_stages_v1_migrate";
export const TOURNAMENT_STAGES_V1_DEVELOPMENT_PREFLIGHT_TASK =
  "tournament_stages_v1_development_preflight";
export const TOURNAMENT_STAGES_V1_DEVELOPMENT_MIGRATE_TASK =
  "tournament_stages_v1_development_migrate";

export const SERIES_V1_PREFLIGHT_SCRIPT = "reset:series-v1:preflight";
export const SERIES_V1_RESET_SCRIPT = "reset:series-v1:destructive";
export const TOURNAMENT_STAGES_V1_PREFLIGHT_SCRIPT =
  "migrate:tournament-stages:preflight";
export const TOURNAMENT_STAGES_V1_MIGRATE_SCRIPT = "migrate:tournament-stages";
export const TOURNAMENT_STAGES_V1_DEVELOPMENT_PREFLIGHT_SCRIPT =
  "migrate:tournament-stages:development:preflight";
export const TOURNAMENT_STAGES_V1_DEVELOPMENT_MIGRATE_SCRIPT =
  "migrate:tournament-stages:development";

type DeploymentEnvironment = Readonly<Record<string, string | undefined>>;
type DatabaseScript =
  | typeof SERIES_V1_PREFLIGHT_SCRIPT
  | typeof SERIES_V1_RESET_SCRIPT
  | typeof TOURNAMENT_STAGES_V1_PREFLIGHT_SCRIPT
  | typeof TOURNAMENT_STAGES_V1_MIGRATE_SCRIPT
  | typeof TOURNAMENT_STAGES_V1_DEVELOPMENT_PREFLIGHT_SCRIPT
  | typeof TOURNAMENT_STAGES_V1_DEVELOPMENT_MIGRATE_SCRIPT;

export interface DeploymentTaskDependencies {
  runDatabaseScript: (script: DatabaseScript) => Promise<number>;
  startApi: () => void | Promise<void>;
}

export interface DeploymentTaskResult {
  mode:
    | "normal"
    | "preflight"
    | "reset"
    | "tournament_stages_preflight"
    | "tournament_stages_migrate"
    | "tournament_stages_development_preflight"
    | "tournament_stages_development_migrate";
  apiStarted: boolean;
  exitCode: number;
}

export class DeploymentTaskError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = "DeploymentTaskError";
    this.exitCode = exitCode;
  }
}

export function runPnpmDatabaseScript(script: DatabaseScript): Promise<number> {
  const executable = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

  return new Promise((resolve, reject) => {
    const child = spawn(executable, ["--filter", "@workspace/db", script], {
      env: process.env,
      stdio: "inherit",
    });

    child.once("error", () => {
      reject(
        new DeploymentTaskError(
          `Unable to start the ${script} deployment task.`,
        ),
      );
    });
    child.once("exit", (code, signal) => {
      if (signal) {
        reject(
          new DeploymentTaskError(
            `The ${script} deployment task was terminated by signal ${signal}.`,
          ),
        );
        return;
      }
      resolve(code ?? 1);
    });
  });
}

export async function runDeploymentStartup(
  env: DeploymentEnvironment,
  dependencies: DeploymentTaskDependencies,
): Promise<DeploymentTaskResult> {
  const task = env.DEPLOYMENT_TASK?.trim();

  if (!task) {
    await dependencies.startApi();
    return { mode: "normal", apiStarted: true, exitCode: 0 };
  }

  if (task === SERIES_V1_PREFLIGHT_TASK) {
    const exitCode = await dependencies.runDatabaseScript(
      SERIES_V1_PREFLIGHT_SCRIPT,
    );
    return { mode: "preflight", apiStarted: false, exitCode };
  }

  if (task === SERIES_V1_RESET_TASK) {
    const exitCode = await dependencies.runDatabaseScript(
      SERIES_V1_RESET_SCRIPT,
    );
    if (exitCode !== 0) {
      throw new DeploymentTaskError(
        `The ${SERIES_V1_RESET_SCRIPT} deployment task failed with exit code ${exitCode}.`,
        exitCode,
      );
    }

    await dependencies.startApi();
    return { mode: "reset", apiStarted: true, exitCode: 0 };
  }

  if (task === TOURNAMENT_STAGES_V1_PREFLIGHT_TASK) {
    const exitCode = await dependencies.runDatabaseScript(
      TOURNAMENT_STAGES_V1_PREFLIGHT_SCRIPT,
    );
    return {
      mode: "tournament_stages_preflight",
      apiStarted: false,
      exitCode,
    };
  }

  if (task === TOURNAMENT_STAGES_V1_MIGRATE_TASK) {
    const exitCode = await dependencies.runDatabaseScript(
      TOURNAMENT_STAGES_V1_MIGRATE_SCRIPT,
    );
    if (exitCode !== 0) {
      throw new DeploymentTaskError(
        `The ${TOURNAMENT_STAGES_V1_MIGRATE_SCRIPT} deployment task failed with exit code ${exitCode}.`,
        exitCode,
      );
    }

    await dependencies.startApi();
    return {
      mode: "tournament_stages_migrate",
      apiStarted: true,
      exitCode: 0,
    };
  }

  if (task === TOURNAMENT_STAGES_V1_DEVELOPMENT_PREFLIGHT_TASK) {
    const exitCode = await dependencies.runDatabaseScript(
      TOURNAMENT_STAGES_V1_DEVELOPMENT_PREFLIGHT_SCRIPT,
    );
    return {
      mode: "tournament_stages_development_preflight",
      apiStarted: false,
      exitCode,
    };
  }

  if (task === TOURNAMENT_STAGES_V1_DEVELOPMENT_MIGRATE_TASK) {
    const exitCode = await dependencies.runDatabaseScript(
      TOURNAMENT_STAGES_V1_DEVELOPMENT_MIGRATE_SCRIPT,
    );
    if (exitCode !== 0) {
      throw new DeploymentTaskError(
        `The ${TOURNAMENT_STAGES_V1_DEVELOPMENT_MIGRATE_SCRIPT} deployment task failed with exit code ${exitCode}.`,
        exitCode,
      );
    }

    await dependencies.startApi();
    return {
      mode: "tournament_stages_development_migrate",
      apiStarted: true,
      exitCode: 0,
    };
  }

  throw new DeploymentTaskError("Unsupported DEPLOYMENT_TASK value.");
}
