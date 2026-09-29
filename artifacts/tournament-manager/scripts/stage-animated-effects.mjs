import { spawnSync } from "node:child_process";
import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceDir = path.resolve(packageDir, "../..");
const stagingDir = path.join(workspaceDir, ".cache", "animated-effects-for-tournament");
const publicDir = path.join(packageDir, "public", "stream", "animated-effects");
const legacyPublicDir = path.join(packageDir, "public", "dev", "animated-effects");

await rm(stagingDir, { recursive: true, force: true });

const pnpmExecPath = process.env.npm_execpath;

if (!pnpmExecPath) {
  throw new Error("npm_execpath is unavailable; cannot launch pnpm safely.");
}

const build = spawnSync(
  process.execPath,
  [
    pnpmExecPath,
    "--filter",
    "animated-effects",
    "run",
    "build",
    "--outDir",
    stagingDir,
    "--emptyOutDir",
  ],
  {
    cwd: workspaceDir,
    stdio: "inherit",
    env: {
      ...process.env,
      ANIMATED_EFFECTS_EMBEDDED: "1",
    },
  },
);

if (build.error) throw build.error;

if (build.status !== 0) {
  throw new Error(
    `Animated Effects build failed (${build.status ?? build.signal}).`,
  );
}

await stat(path.join(stagingDir, "index.html"));
await rm(publicDir, { recursive: true, force: true });
await mkdir(path.dirname(publicDir), { recursive: true });
await cp(stagingDir, publicDir, { recursive: true });
