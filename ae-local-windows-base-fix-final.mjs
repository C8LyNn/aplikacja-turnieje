import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function fail(message) {
  console.error("\nERROR:", message);
  process.exit(1);
}

if (!fs.existsSync(path.join(root, "pnpm-workspace.yaml"))) {
  fail("Uruchom z głównego katalogu aplikacja-turnieje-live.");
}

const tournamentVite = path.join(
  root,
  "artifacts/tournament-manager/vite.config.ts",
);

const animatedVite = path.join(
  root,
  "artifacts/animated-effects/vite.config.ts",
);

for (const file of [tournamentVite, animatedVite]) {
  if (!fs.existsSync(file)) {
    fail(`Brak pliku: ${path.relative(root, file)}`);
  }
}

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace("T", "_")
  .replace("Z", "");

const backupRoot = path.join(
  root,
  ".ae-pack-backup",
  `windows-base-final-${stamp}`,
);

for (const file of [tournamentVite, animatedVite]) {
  const relative = path.relative(root, file);
  const backup = path.join(backupRoot, relative);

  fs.mkdirSync(
    path.dirname(backup),
    { recursive: true },
  );

  fs.copyFileSync(file, backup);
}

const helper = `
function normalizeBasePath(
  rawValue: string | undefined,
  fallback = "/",
): string {
  let value =
    rawValue?.trim() ||
    fallback;

  value =
    value.replace(
      /\\\\/g,
      "/",
    );

  // Git for Windows / MSYS can rewrite "/foo/" into
  // "C:/Program Files/Git/foo/". Recover the intended URL path.
  value =
    value.replace(
      /^[A-Za-z]:\\/Program Files\\/Git(?=\\/|$)/i,
      "",
    );

  if (!value) {
    value = "/";
  }

  if (!value.startsWith("/")) {
    value = "/" + value;
  }

  if (!value.endsWith("/")) {
    value += "/";
  }

  return value;
}
`.trim();

let tournament =
  fs.readFileSync(
    tournamentVite,
    "utf8",
  );

if (!tournament.includes("function normalizeBasePath(")) {
  const anchor =
    'const rawPort = process.env.PORT;';

  if (!tournament.includes(anchor)) {
    fail("Nie znaleziono rawPort w tournament-manager/vite.config.ts.");
  }

  tournament =
    tournament.replace(
      anchor,
      `${helper}\n\n${anchor}`,
    );
}

const baseLinePattern =
  /const basePath\s*=\s*process\.env\.BASE_PATH\s*\?\?\s*\(isBuildCommand\s*\?\s*"\/"\s*:\s*undefined\)\s*;/;

if (baseLinePattern.test(tournament)) {
  tournament =
    tournament.replace(
      baseLinePattern,
      'const basePath = normalizeBasePath(process.env.BASE_PATH, "/");',
    );
} else if (
  !tournament.includes(
    'const basePath = normalizeBasePath(process.env.BASE_PATH, "/");',
  )
) {
  fail("Nie znaleziono oczekiwanej definicji basePath w tournament-manager/vite.config.ts.");
}

tournament =
  tournament.replace(
    /\nif\s*\(!basePath\)\s*\{\s*throw new Error\([\s\S]*?"BASE_PATH environment variable is required but was not provided\."[\s\S]*?\);\s*\}\s*/m,
    "\n",
  );

fs.writeFileSync(
  tournamentVite,
  tournament,
  "utf8",
);

let animated =
  fs.readFileSync(
    animatedVite,
    "utf8",
  );

if (!animated.includes("function normalizeBasePath(")) {
  const importAnchor =
    'import { defineConfig } from "vite";';

  if (!animated.includes(importAnchor)) {
    fail("Nie znaleziono importu defineConfig w animated-effects/vite.config.ts.");
  }

  animated =
    animated.replace(
      importAnchor,
      `${importAnchor}\n\n${helper}`,
    );
}

animated =
  animated.replace(
    /base:\s*process\.env\.ANIMATED_EFFECTS_BASE_PATH\s*\?\?\s*"\/"\s*,?/,
    'base: normalizeBasePath(process.env.ANIMATED_EFFECTS_BASE_PATH, "/"),',
  );

if (
  !animated.includes(
    'base: normalizeBasePath(process.env.ANIMATED_EFFECTS_BASE_PATH, "/"),',
  )
) {
  fail("Nie udało się przepiąć base w animated-effects/vite.config.ts.");
}

fs.writeFileSync(
  animatedVite,
  animated,
  "utf8",
);

console.log("");
console.log("==============================================");
console.log(" Windows/MSYS base-path FIX INSTALLED");
console.log("==============================================");
console.log("");
console.log("Naprawiono:");
console.log(" - tournament-manager: lokalny dev domyślnie używa /");
console.log(" - animated-effects: odzyskuje /dev/animated-effects/ po konwersji MSYS");
console.log(" - nie trzeba już ustawiać BASE_PATH ani MSYS2_ENV_CONV_EXCL lokalnie");
console.log("");
console.log("Backup:", path.relative(root, backupRoot));
console.log("");
console.log("Uruchom teraz:");
console.log('  $env:PORT="5173"');
console.log('  Remove-Item Env:BASE_PATH -ErrorAction SilentlyContinue');
console.log('  Remove-Item Env:MSYS2_ENV_CONV_EXCL -ErrorAction SilentlyContinue');
console.log('  pnpm --filter "@workspace/tournament-manager" run dev');
