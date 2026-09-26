import { spawnSync } from "node:child_process";
import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceDir = path.resolve(packageDir, "../..");
const stagingDir = path.join(workspaceDir, ".cache", "animated-effects-for-tournament");
const publicDir = path.join(packageDir, "public", "dev", "animated-effects");

// Use a dedicated output directory so a workspace-wide build of Animated Effects
// cannot race with this build or change the files that the tournament app copies.
await rm(stagingDir, { recursive: true, force: true });
const build = spawnSync(
  "pnpm",
  [
    "--filter", "animated-effects", "run", "build",
    "--base", "/dev/animated-effects/",
    "--outDir", stagingDir, "--emptyOutDir",
  ],
  { cwd: workspaceDir, stdio: "inherit" },
);
if (build.error) throw build.error;
if (build.status !== 0) {
  throw new Error(`Animated Effects build failed (${build.status ?? build.signal}).`);
}
await stat(path.join(stagingDir, "index.html"));
await rm(publicDir, { recursive: true, force: true });
await mkdir(path.dirname(publicDir), { recursive: true });
await cp(stagingDir, publicDir, { recursive: true });