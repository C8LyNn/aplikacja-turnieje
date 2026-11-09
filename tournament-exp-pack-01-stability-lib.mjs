import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const PACK = "tournament-exp-pack-01-stability";
export const BACKUP_DIR = ".tournament-exp-pack-01-stability-backup";
export const PAGE = "artifacts/tournament-manager/src/pages/experimental/tournaments/create-tournament-experimental.tsx";
export const TEST = "artifacts/tournament-manager/src/pages/experimental/tournaments/create-tournament-experimental.test.tsx";
export const STABLE = "artifacts/tournament-manager/src/pages/create-tournament.tsx";
export const STABLE_INDEX_SHA = "38af06766fbdade76d0bc551e545538c39c1f2de";

export function root() { return process.cwd(); }
export function abs(rel) { return path.join(root(), rel); }
export function scriptDir() { return path.dirname(fileURLToPath(import.meta.url)); }
export function templateDir() {
  return path.join(scriptDir(), "tournament-exp-pack-01-stability-templates");
}
export function fail(message) { throw new Error(message); }
export function read(rel) { return fs.readFileSync(abs(rel), "utf8"); }

export function git(args) {
  const result = spawnSync("git", args, { cwd: root(), encoding: "utf8", shell: false });
  if (result.error) fail(`Nie można uruchomić Git: ${result.error.message}`);
  if (result.status !== 0) fail(`Git ${args.join(" ")} nie powiódł się:\n${result.stderr || result.stdout}`);
  return result;
}

function indexSha(rel) {
  const line = git(["ls-files", "-s", "--", rel]).stdout.trim();
  return line ? line.split(/\s+/)[1] : null;
}

export function runPnpm(args) {
  let result;
  if (process.platform === "win32") {
    const comspec = process.env.ComSpec || process.env.COMSPEC || "C:\\Windows\\System32\\cmd.exe";
    const commandLine = ["pnpm", ...args].map((part) =>
      /[\s"&|<>^]/.test(part) ? `"${part.replaceAll('"', '""')}"` : part
    ).join(" ");
    result = spawnSync(comspec, ["/d", "/s", "/c", commandLine], {
      cwd: root(),
      stdio: "inherit",
      shell: false,
    });
  } else {
    result = spawnSync("pnpm", args, {
      cwd: root(),
      stdio: "inherit",
      shell: false,
    });
  }

  if (result.error) fail(`Nie można uruchomić pnpm: ${result.error.message}`);
  if (result.status !== 0) fail(`pnpm zakończył się kodem ${result.status}`);
}

export function assertBase() {
  for (const rel of ["pnpm-workspace.yaml", PAGE, TEST, STABLE]) {
    if (!fs.existsSync(abs(rel))) fail(`Brak ${rel}.`);
  }
  if (indexSha(STABLE) !== STABLE_INDEX_SHA) {
    fail("Stabilny create-tournament.tsx został zmieniony. Ta aktualizacja go nie nadpisze.");
  }
}

export function state() {
  assertBase();
  const page = read(PAGE);
  return {
    installed:
      page.includes('fetch("/api/healthz"') &&
      page.includes('apiStatus') &&
      page.includes('supportPasswordError') &&
      page.includes('Serwer niedostępny'),
    recognized:
      page.includes("buildSingleStageSeedingPlan") &&
      page.includes("createTournament.mutate("),
  };
}

export function assertReady() {
  const s = state();
  if (s.installed) return { alreadyInstalled: true };
  if (!s.recognized) fail("Nie rozpoznaję aktualnej wersji Experimental. Nie nadpiszę jej.");

  for (const name of [
    "create-tournament-experimental.tsx",
    "create-tournament-experimental.test.tsx",
  ]) {
    if (!fs.existsSync(path.join(templateDir(), name))) fail(`Brak szablonu ${name}.`);
  }
  return { alreadyInstalled: false };
}

export function backup() {
  const dir = abs(BACKUP_DIR);
  if (fs.existsSync(dir)) fail(`Backup ${BACKUP_DIR} już istnieje.`);
  fs.mkdirSync(dir, { recursive: true });
  for (const rel of [PAGE, TEST]) {
    const dst = path.join(dir, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(abs(rel), dst);
  }
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({ pack: PACK, files: [PAGE, TEST] }, null, 2));
}

export function installTemplates() {
  fs.copyFileSync(path.join(templateDir(), "create-tournament-experimental.tsx"), abs(PAGE));
  fs.copyFileSync(path.join(templateDir(), "create-tournament-experimental.test.tsx"), abs(TEST));
}

export function assertInstalled() {
  const s = state();
  if (!s.installed) fail("Nie wykryto Stability Update.");
}

export function rollback() {
  const dir = abs(BACKUP_DIR);
  const manifestFile = path.join(dir, "manifest.json");
  if (!fs.existsSync(manifestFile)) fail(`Brak ${BACKUP_DIR}.`);
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  if (manifest.pack !== PACK) fail("Nieprawidłowy backup.");
  for (const rel of manifest.files) {
    fs.copyFileSync(path.join(dir, rel), abs(rel));
  }
  fs.rmSync(dir, { recursive: true, force: true });
}
