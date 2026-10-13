import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const PACK = "tournament-exp-pack-01-expanded";
export const BACKUP_DIR = ".tournament-exp-pack-01-expanded-backup";

export const FILES = [
  "artifacts/tournament-manager/src/pages/experimental/tournaments/create-tournament-experimental.tsx",
  "artifacts/tournament-manager/src/pages/experimental/tournaments/create-tournament-experimental.test.tsx",
  "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-tournament-shell.tsx",
  "artifacts/tournament-manager/src/pages/tournament-create-choice.tsx",
];

export const STABLE = "artifacts/tournament-manager/src/pages/create-tournament.tsx";
export const APP = "artifacts/tournament-manager/src/App.tsx";
export const STABLE_INDEX_SHA = "38af06766fbdade76d0bc551e545538c39c1f2de";

export function root() { return process.cwd(); }
export function abs(rel) { return path.join(root(), rel); }
export function scriptDir() { return path.dirname(fileURLToPath(import.meta.url)); }
export function templateDir() {
  return path.join(scriptDir(), "tournament-exp-pack-01-expanded-templates");
}
export function fail(message) { throw new Error(message); }
export function read(rel) { return fs.readFileSync(abs(rel), "utf8"); }

export function git(args) {
  const result = spawnSync("git", args, { cwd: root(), encoding: "utf8", shell: false });
  if (result.error) fail(`Nie można uruchomić Git: ${result.error.message}`);
  if (result.status !== 0) fail(`Git ${args.join(" ")} nie powiódł się:\n${result.stderr || result.stdout}`);
  return result;
}

export function runPnpm(args) {
  const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const result = spawnSync(command, args, { cwd: root(), stdio: "inherit", shell: false });
  if (result.error) fail(`Nie można uruchomić pnpm: ${result.error.message}`);
  if (result.status !== 0) fail(`pnpm zakończył się kodem ${result.status}`);
}

function indexSha(rel) {
  const line = git(["ls-files", "-s", "--", rel]).stdout.trim();
  return line ? line.split(/\s+/)[1] : null;
}

export function assertBasePack() {
  for (const rel of ["pnpm-workspace.yaml", APP, STABLE, ...FILES]) {
    if (!fs.existsSync(abs(rel))) {
      fail(`Brak ${rel}. Najpierw musi być zainstalowana podstawowa Tournament Experimental Pack 01.`);
    }
  }

  if (indexSha(STABLE) !== STABLE_INDEX_SHA) {
    fail("Stabilny create-tournament.tsx różni się od bazowej wersji. Ta aktualizacja go nie nadpisze.");
  }

  const app = read(APP);
  if (!app.includes('<Route path="/tournaments/create" component={TournamentCreateChoice} />')) {
    fail("Nie wykryto /tournaments/create z podstawowej Pack 01.");
  }
  if (!app.includes('<Route path="/experimental/tournaments/new" component={CreateTournamentExperimental} />')) {
    fail("Nie wykryto Experimental route z podstawowej Pack 01.");
  }
}

export function installState() {
  assertBasePack();
  const page = read(FILES[0]);
  const expanded =
    page.includes("buildSingleStageSeedingPlan") &&
    page.includes('const DRAFT_KEY = "tm_exp_create_draft_v1"') &&
    page.includes("Wyczyść") &&
    page.includes("createTournament.mutate(");

  const recognizedOlder =
    page.includes("Pack 01 nie wysyła jeszcze tego formularza do API") ||
    page.includes("Utwórz — w przygotowaniu") ||
    page.includes("useCreateTournament");

  return { expanded, recognizedOlder };
}

export function assertReady() {
  const s = installState();
  if (s.expanded) return { alreadyInstalled: true };
  if (!s.recognizedOlder) {
    fail("Experimental frontend ma nieoczekiwaną wersję. Nie nadpiszę go automatycznie.");
  }

  const names = [
    "create-tournament-experimental.tsx",
    "create-tournament-experimental.test.tsx",
    "experimental-tournament-shell.tsx",
    "tournament-create-choice.tsx",
  ];
  for (const name of names) {
    if (!fs.existsSync(path.join(templateDir(), name))) fail(`Brak pliku paczki: ${name}`);
  }
  return { alreadyInstalled: false };
}

export function backup() {
  const dir = abs(BACKUP_DIR);
  if (fs.existsSync(dir)) fail(`Backup ${BACKUP_DIR} już istnieje.`);
  fs.mkdirSync(dir, { recursive: true });

  for (const rel of FILES) {
    const dst = path.join(dir, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(abs(rel), dst);
  }

  fs.writeFileSync(
    path.join(dir, "manifest.json"),
    JSON.stringify({ pack: PACK, files: FILES }, null, 2),
    "utf8",
  );
}

const TEMPLATE_MAP = {
  "create-tournament-experimental.tsx": FILES[0],
  "create-tournament-experimental.test.tsx": FILES[1],
  "experimental-tournament-shell.tsx": FILES[2],
  "tournament-create-choice.tsx": FILES[3],
};

export function installTemplates() {
  for (const [name, rel] of Object.entries(TEMPLATE_MAP)) {
    fs.copyFileSync(path.join(templateDir(), name), abs(rel));
  }
}

export function assertInstalled() {
  const s = installState();
  if (!s.expanded) fail("Nie wykryto rozszerzonej wersji Pack 01.");
  const page = read(FILES[0]);

  for (const marker of [
    "buildSingleStageSeedingPlan",
    "createTournament.mutate(",
    "setActiveOrganizerToken(organizerToken)",
    "SINGLE_STAGE_SEEDING_LABELS",
    "Wyczyść",
  ]) {
    if (!page.includes(marker)) fail(`Brak oczekiwanego elementu: ${marker}`);
  }

  if (page.includes("Utwórz — w przygotowaniu")) fail("Pozostał stary placeholder tworzenia.");
  if (page.includes("Pack 01 nie wysyła jeszcze tego formularza do API")) {
    fail("Pozostał stary techniczny komunikat w UI.");
  }
}

export function rollback() {
  const dir = abs(BACKUP_DIR);
  const manifestPath = path.join(dir, "manifest.json");
  if (!fs.existsSync(manifestPath)) fail(`Brak backupu ${BACKUP_DIR}.`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest.pack !== PACK) fail("Backup nie należy do tej aktualizacji.");

  for (const rel of manifest.files) {
    const src = path.join(dir, rel);
    if (!fs.existsSync(src)) fail(`Backup nie zawiera ${rel}`);
    fs.copyFileSync(src, abs(rel));
  }
  fs.rmSync(dir, { recursive: true, force: true });
}
