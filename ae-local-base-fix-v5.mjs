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

const backupRoot = path.join(root, ".ae-pack-backup", `local-base-fix-v5-${stamp}`);

function backup(filePath, rel) {
  if (!fs.existsSync(filePath)) return;
  const dest = path.join(backupRoot, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(filePath, dest);
}

backup(
  stagePath,
  path.join("artifacts", "tournament-manager", "scripts", "stage-animated-effects.mjs"),
);
backup(
  viteConfigPath,
  path.join("artifacts", "animated-effects", "vite.config.ts"),
);

let stage = fs.readFileSync(stagePath, "utf8");

if (!stage.includes("ANIMATED_EFFECTS_BASE_PATH")) {
  if (stage.includes('ANIMATED_EFFECTS_EMBEDDED: "1"')) {
    console.log("Stage script already uses the embedded-build flag.");
  } else {
    console.error("ERROR: Expected ANIMATED_EFFECTS_BASE_PATH in stage script.");
    console.error("No changes made.");
    process.exit(1);
  }
} else {
  stage = stage.replace(
    'ANIMATED_EFFECTS_BASE_PATH: "/dev/animated-effects/",',
    'ANIMATED_EFFECTS_EMBEDDED: "1",',
  );
  fs.writeFileSync(stagePath, stage, "utf8");
}

const viteConfig = `import { defineConfig } from "vite";

export default defineConfig({
  // Do not pass the URL-like base through the Windows shell/MSYS layer.
  // A simple boolean flag selects the embedded path instead, so "/dev/..."
  // is created inside Node/Vite and cannot be rewritten to Program Files/Git.
  base:
    process.env.ANIMATED_EFFECTS_EMBEDDED === "1"
      ? "/dev/animated-effects/"
      : "/",
});
`;

fs.writeFileSync(viteConfigPath, viteConfig, "utf8");

console.log("Animated Effects local base-path fix v5 installed.");
console.log(`Backup: ${path.relative(root, backupRoot)}`);
console.log("");
console.log("Next:");
console.log("  1. Stop the current dev server.");
console.log("  2. Run:");
console.log('       $env:PORT="5173"');
console.log('       $env:BASE_PATH="/"');
console.log('       pnpm --filter "@workspace/tournament-manager" run dev');
console.log("  3. Open:");
console.log("       http://localhost:5173/dev/animated-effects/");
