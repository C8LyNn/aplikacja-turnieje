import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const stagePath = path.join(
  root,
  "artifacts",
  "tournament-manager",
  "scripts",
  "stage-animated-effects.mjs",
);
const viteConfigPath = path.join(
  root,
  "artifacts",
  "animated-effects",
  "vite.config.ts",
);

if (!fs.existsSync(path.join(root, "pnpm-workspace.yaml"))) {
  console.error("ERROR: Run this installer from the root of aplikacja-turnieje-live.");
  process.exit(1);
}

if (!fs.existsSync(stagePath)) {
  console.error("ERROR: Missing stage-animated-effects.mjs.");
  process.exit(1);
}

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace("T", "_")
  .replace("Z", "");

const backupRoot = path.join(root, ".ae-pack-backup", `local-base-fix-v4-${stamp}`);

function backupFile(filePath, relativePath) {
  if (!fs.existsSync(filePath)) return;
  const target = path.join(backupRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(filePath, target);
}

backupFile(
  stagePath,
  path.join("artifacts", "tournament-manager", "scripts", "stage-animated-effects.mjs"),
);
backupFile(
  viteConfigPath,
  path.join("artifacts", "animated-effects", "vite.config.ts"),
);

// Clean, cross-platform staging script.
// Important: the URL base is NOT passed as a CLI arg, because Git/MSYS on
// Windows rewrites leading-slash args like /dev/animated-effects/ into a
// filesystem path. Instead it is passed through an environment variable and
// read by Animated Effects' Vite config.
const stageSource = `import { spawnSync } from "node:child_process";
import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceDir = path.resolve(packageDir, "../..");
const stagingDir = path.join(workspaceDir, ".cache", "animated-effects-for-tournament");
const publicDir = path.join(packageDir, "public", "dev", "animated-effects");

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
      ANIMATED_EFFECTS_BASE_PATH: "/dev/animated-effects/",
    },
  },
);

if (build.error) throw build.error;

if (build.status !== 0) {
  throw new Error(
    \`Animated Effects build failed (\${build.status ?? build.signal}).\`,
  );
}

await stat(path.join(stagingDir, "index.html"));
await rm(publicDir, { recursive: true, force: true });
await mkdir(path.dirname(publicDir), { recursive: true });
await cp(stagingDir, publicDir, { recursive: true });
`;

const viteConfigSource = `import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.ANIMATED_EFFECTS_BASE_PATH ?? "/",
});
`;

fs.writeFileSync(stagePath, stageSource, "utf8");
fs.writeFileSync(viteConfigPath, viteConfigSource, "utf8");

console.log("Animated Effects local base-path fix v4 installed.");
console.log(`Backup: ${path.relative(root, backupRoot)}`);
console.log("");
console.log("This removes the leading-slash base URL from CLI arguments,");
console.log("so Git/MSYS cannot rewrite it into /Program Files/Git/...");
console.log("");
console.log("Next:");
console.log("  1. Stop the current dev server.");
console.log("  2. Run:");
console.log('       $env:PORT="5173"');
console.log('       $env:BASE_PATH="/"');
console.log('       pnpm --filter "@workspace/tournament-manager" run dev');
