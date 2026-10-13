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

if (source.includes('MSYS2_ARG_CONV_EXCL')) {
  console.log("Windows base-path fix is already installed.");
  process.exit(0);
}

const needle = '    shell: process.platform === "win32",\n';
if (!source.includes(needle)) {
  console.error("ERROR: Expected Windows spawn fix was not found in stage-animated-effects.mjs.");
  console.error("No changes were made.");
  process.exit(1);
}

const replacement = `    shell: process.platform === "win32",
    env:
      process.platform === "win32"
        ? {
            ...process.env,
            // Git Bash/MSYS must not rewrite Vite's URL-like CLI arguments
            // such as /dev/animated-effects/ into C:/Program Files/Git/...
            MSYS2_ARG_CONV_EXCL: "*",
            MSYS2_ENV_CONV_EXCL: "BASE_PATH",
          }
        : process.env,
`;

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace("T", "_")
  .replace("Z", "");

const backup = path.join(
  root,
  ".ae-pack-backup",
  `windows-base-fix-${stamp}`,
  "artifacts",
  "tournament-manager",
  "scripts",
  "stage-animated-effects.mjs",
);

fs.mkdirSync(path.dirname(backup), { recursive: true });
fs.copyFileSync(target, backup);

source = source.replace(needle, replacement);
fs.writeFileSync(target, source, "utf8");

console.log("Windows base-path fix installed.");
console.log("");
console.log("Next:");
console.log("  1. Stop the dev server if it is running.");
console.log('  2. In PowerShell set:');
console.log('       $env:MSYS2_ENV_CONV_EXCL="BASE_PATH"');
console.log('       $env:PORT="5173"');
console.log('       $env:BASE_PATH="/"');
console.log('  3. Run:');
console.log('       pnpm --filter "@workspace/tournament-manager" run dev');
