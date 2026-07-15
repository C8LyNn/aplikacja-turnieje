import { spawn } from "node:child_process";

export const SERIES_V1_PREFLIGHT_TASK = "series_v1_preflight";
export const SERIES_V1_RESET_TASK = "series_v1_reset";

export const SERIES_V1_PREFLIGHT_SCRIPT = "reset:series-v1:preflight";
export const SERIES_V1_RESET_SCRIPT = "reset:series-v1:destructive";

type DeploymentEnvironment = Readonly<Record<string, string | undefined>>;
type DatabaseScript =
  | typeof SERIES_V1_PREFLIGHT_SCRIPT
  | typeof SERIES_V1_RESET_SCRIPT;

export interface DeploymentTaskDependencies {
  runDatabaseScript: (script: DatabaseScript) => Promise<number>;
  startApi: () => void | Promise<void>;
}

export interface DeploymentTaskResult {
  mode: "normal" | "preflight" | "reset";
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
    const child = spawn(
      executable,
      ["--filter", "@workspace/db", script],
      {
        env: process.env,
        stdio: "inherit",
      },
    );

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

  throw new DeploymentTaskError(
    "Unsupported DEPLOYMENT_TASK value.",
  );
}
