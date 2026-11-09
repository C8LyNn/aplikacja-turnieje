import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(
  root,
  "artifacts",
  "tournament-manager",
  "scripts",
  "stage-animated-effects.mjs",
);

if (!fs.existsSync(target)) {
  console.error("ERROR: Run this installer from the root of aplikacja-turnieje-live.");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

if (source.includes("AE_PNPM_NODE_LAUNCH_FIX")) {
  console.log("pnpm launch fix is already installed.");
  process.exit(0);
}

const start = source.indexOf("const build = spawnSync(");
if (start < 0) {
  console.error("ERROR: Could not find the Animated Effects spawnSync build block.");
  process.exit(1);
}

const tailMarker = "\nif (build.error)";
const end = source.indexOf(tailMarker, start);
if (end < 0) {
  console.error("ERROR: Could not find the end of the spawnSync build block.");
  process.exit(1);
}

const replacement = `// AE_PNPM_NODE_LAUNCH_FIX
// Avoid invoking the pnpm shell shim on Windows. Running the pnpm CLI through
// the current Node executable prevents Git/MSYS from rewriting URL/path args.
const pnpmExecPath = process.env.npm_execpath;

if (!pnpmExecPath) {
  throw new Error("npm_execpath is unavailable; cannot launch pnpm safely.");
}

const build = spawnSync(
  process.execPath,
  [
    pnpmExecPath,
    "--filter", "animated-effects", "run", "build",
    "--base", "/dev/animated-effects/",
    "--outDir", stagingDir, "--emptyOutDir",
  ],
  {
    cwd: workspaceDir,
    stdio: "inherit",
    env: process.env,
  },
);
`;

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace("T", "_")
  .replace("Z", "");

const backup = path.join(
  root,
  ".ae-pack-backup",
  `pnpm-launch-fix-${stamp}`,
  "artifacts",
  "tournament-manager",
  "scripts",
  "stage-animated-effects.mjs",
);

fs.mkdirSync(path.dirname(backup), { recursive: true });
fs.copyFileSync(target, backup);

source = source.slice(0, start) + replacement + source.slice(end);
fs.writeFileSync(target, source, "utf8");

console.log("pnpm launch fix installed.");
console.log("");
console.log("Now run:");
console.log('  pnpm --filter "@workspace/tournament-manager" run dev');
