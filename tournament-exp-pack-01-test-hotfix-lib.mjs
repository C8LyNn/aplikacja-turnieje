import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const PACK = "tournament-exp-pack-01-test-hotfix";
export const BACKUP = ".tournament-exp-pack-01-test-hotfix-backup";
export const PAGE = "artifacts/tournament-manager/src/pages/experimental/tournaments/create-tournament-experimental.tsx";
export const TEST = "artifacts/tournament-manager/src/pages/experimental/tournaments/create-tournament-experimental.test.tsx";

const root = () => process.cwd();
const abs = (rel) => path.join(root(), rel);
const scriptDir = () => path.dirname(fileURLToPath(import.meta.url));
const templateDir = () => path.join(scriptDir(), "tournament-exp-pack-01-test-hotfix-templates");

function fail(message) { throw new Error(message); }
function read(rel) { return fs.readFileSync(abs(rel), "utf8"); }

export function state() {
  for (const rel of ["pnpm-workspace.yaml", PAGE, TEST]) {
    if (!fs.existsSync(abs(rel))) fail(`Brak ${rel}.`);
  }

  const page = read(PAGE);
  const test = read(TEST);

  const installed =
    page.includes('Number.isInteger(parsedMaxPlayers) ? parsedMaxPlayers : "—"') &&
    test.includes("Always resolve the deliberately pending request") &&
    test.includes("await waitFor(() => assert.equal(requests, 1))");

  const recognized =
    page.includes('fetch("/api/healthz"') &&
    test.includes('test("double submit in the same frame sends only one request"');

  return { installed, recognized };
}

export function assertReady() {
  const s = state();
  if (s.installed) return { alreadyInstalled: true };
  if (!s.recognized) fail("Nie rozpoznaję Stability Update. Nie nadpiszę plików.");
  for (const name of [
    "create-tournament-experimental.tsx",
    "create-tournament-experimental.test.tsx",
  ]) {
    if (!fs.existsSync(path.join(templateDir(), name))) fail(`Brak szablonu ${name}.`);
  }
  return { alreadyInstalled: false };
}

export function backup() {
  const dir = abs(BACKUP);
  if (fs.existsSync(dir)) fail(`Backup ${BACKUP} już istnieje.`);
  fs.mkdirSync(dir, { recursive: true });
  for (const rel of [PAGE, TEST]) {
    const dst = path.join(dir, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(abs(rel), dst);
  }
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({ pack: PACK, files: [PAGE, TEST] }, null, 2));
}

export function install() {
  fs.copyFileSync(path.join(templateDir(), "create-tournament-experimental.tsx"), abs(PAGE));
  fs.copyFileSync(path.join(templateDir(), "create-tournament-experimental.test.tsx"), abs(TEST));
}

export function assertInstalled() {
  if (!state().installed) fail("Hotfix nie został poprawnie zainstalowany.");
}

export function rollback() {
  const dir = abs(BACKUP);
  const manifestPath = path.join(dir, "manifest.json");
  if (!fs.existsSync(manifestPath)) fail(`Brak ${BACKUP}.`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest.pack !== PACK) fail("Nieprawidłowy backup.");
  for (const rel of manifest.files) fs.copyFileSync(path.join(dir, rel), abs(rel));
  fs.rmSync(dir, { recursive: true, force: true });
}

export function runFocusedTest() {
  const env = {
    ...process.env,
    TSX_TSCONFIG_PATH: path.resolve(root(), "artifacts/tournament-manager/test/tsconfig.json"),
  };

  const args = [
    "--filter", "@workspace/tournament-manager",
    "exec", "node",
    "--import", "tsx",
    "--import", "./test/setup-dom.mjs",
    "--test",
    "./src/pages/experimental/tournaments/create-tournament-experimental.test.tsx",
  ];

  let result;
  if (process.platform === "win32") {
    const comspec = process.env.ComSpec || process.env.COMSPEC || "C:\\Windows\\System32\\cmd.exe";
    const line = ["pnpm", ...args].map((part) =>
      /[\s"&|<>^]/.test(part) ? `"${part.replaceAll('"', '""')}"` : part
    ).join(" ");
    result = spawnSync(comspec, ["/d", "/s", "/c", line], {
      cwd: root(),
      stdio: "inherit",
      env,
      shell: false,
    });
  } else {
    result = spawnSync("pnpm", args, {
      cwd: root(),
      stdio: "inherit",
      env,
      shell: false,
    });
  }

  if (result.error) fail(`Nie można uruchomić testu: ${result.error.message}`);
  if (result.status !== 0) fail(`Focused test zakończył się kodem ${result.status}.`);
}
