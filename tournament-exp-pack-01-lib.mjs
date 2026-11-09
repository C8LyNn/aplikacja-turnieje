import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const PACK_ID = "tournament-exp-pack-01";
export const BASELINE_COMMIT = "b0c1042";

export const PATHS = {
  app: "artifacts/tournament-manager/src/App.tsx",
  layout: "artifacts/tournament-manager/src/components/layout.tsx",
  dashboard: "artifacts/tournament-manager/src/pages/dashboard.tsx",
  stableCreate: "artifacts/tournament-manager/src/pages/create-tournament.tsx",
};

export const BASELINE_INDEX_SHAS = {
  [PATHS.app]: "d611f1541e71af77aeccabb8322ea8821ceaab06",
  [PATHS.layout]: "1a3d873a324661c4e6006e7c460c4c9695ebc2c4",
  [PATHS.dashboard]: "a90360f7616a0fea7501c03c741081dc3e3565eb",
  [PATHS.stableCreate]: "38af06766fbdade76d0bc551e545538c39c1f2de",
};

export const NEW_FILES = [
  "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-organizer-guard.tsx",
  "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-tournament-shell.tsx",
  "artifacts/tournament-manager/src/pages/tournament-create-choice.tsx",
  "artifacts/tournament-manager/src/pages/tournament-create-choice.test.tsx",
  "artifacts/tournament-manager/src/pages/experimental/tournaments/create-tournament-experimental.tsx",
  "artifacts/tournament-manager/src/pages/experimental/tournaments/create-tournament-experimental.test.tsx",
];

export const TEMPLATE_MAP = {
  "experimental-organizer-guard.tsx":
    "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-organizer-guard.tsx",
  "experimental-tournament-shell.tsx":
    "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-tournament-shell.tsx",
  "tournament-create-choice.tsx":
    "artifacts/tournament-manager/src/pages/tournament-create-choice.tsx",
  "tournament-create-choice.test.tsx":
    "artifacts/tournament-manager/src/pages/tournament-create-choice.test.tsx",
  "create-tournament-experimental.tsx":
    "artifacts/tournament-manager/src/pages/experimental/tournaments/create-tournament-experimental.tsx",
  "create-tournament-experimental.test.tsx":
    "artifacts/tournament-manager/src/pages/experimental/tournaments/create-tournament-experimental.test.tsx",
};

export const MODIFIED_FILES = [PATHS.app, PATHS.layout, PATHS.dashboard];
export const BACKUP_DIR = ".tournament-exp-pack-01-backup";

export function repoRoot() {
  return process.cwd();
}

export function scriptDir() {
  return path.dirname(fileURLToPath(import.meta.url));
}

export function templateDir() {
  return path.join(scriptDir(), "tournament-exp-pack-01-templates");
}

export function abs(rel) {
  return path.join(repoRoot(), rel);
}

export function fail(message) {
  const error = new Error(message);
  error.packFailure = true;
  throw error;
}

export function count(text, needle) {
  return text.split(needle).length - 1;
}

export function read(rel) {
  return fs.readFileSync(abs(rel), "utf8");
}

export function write(rel, content) {
  const target = abs(rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
}

export function git(args, { allowFailure = false } = {}) {
  const result = spawnSync("git", args, {
    cwd: repoRoot(),
    encoding: "utf8",
    shell: false,
  });
  if (result.error) {
    if (allowFailure) return { status: 1, stdout: "", stderr: String(result.error) };
    fail(`Nie można uruchomić Git: ${result.error.message}`);
  }
  if (result.status !== 0 && !allowFailure) {
    fail(`Git ${args.join(" ")} nie powiódł się:\n${result.stderr || result.stdout}`);
  }
  return result;
}

export function getIndexSha(rel) {
  const result = git(["ls-files", "-s", "--", rel]);
  const line = result.stdout.trim();
  if (!line) return null;
  return line.split(/\s+/)[1] ?? null;
}

export function trackedDirty(rel) {
  const result = git(["status", "--porcelain", "--untracked-files=no", "--", rel]);
  return result.stdout.trim() !== "";
}

export function assertRepoShape() {
  const required = [
    "pnpm-workspace.yaml",
    "artifacts/tournament-manager/package.json",
    PATHS.app,
    PATHS.layout,
    PATHS.dashboard,
    PATHS.stableCreate,
  ];
  for (const rel of required) {
    if (!fs.existsSync(abs(rel))) {
      fail(`Brak wymaganego pliku/katalogu: ${rel}\nUruchom skrypt z głównego katalogu repozytorium.`);
    }
  }
}

export function assertTemplatesPresent() {
  for (const name of Object.keys(TEMPLATE_MAP)) {
    const target = path.join(templateDir(), name);
    if (!fs.existsSync(target)) {
      fail(`Brak pliku paczki: tournament-exp-pack-01-templates/${name}`);
    }
  }
}

export function inspectInstallState() {
  const appExists = fs.existsSync(abs(PATHS.app));
  if (!appExists) return { installed: false, partial: false };

  const app = read(PATHS.app);
  const layout = fs.existsSync(abs(PATHS.layout)) ? read(PATHS.layout) : "";
  const dashboard = fs.existsSync(abs(PATHS.dashboard)) ? read(PATHS.dashboard) : "";

  const markers = [
    app.includes('import TournamentCreateChoice from "@/pages/tournament-create-choice";'),
    app.includes('import CreateTournamentExperimental from "@/pages/experimental/tournaments/create-tournament-experimental";'),
    app.includes('<Route path="/tournaments/create" component={TournamentCreateChoice} />'),
    app.includes('<Route path="/experimental/tournaments/new" component={CreateTournamentExperimental} />'),
    layout.includes('href="/tournaments/create"'),
    dashboard.includes('href="/tournaments/create"'),
    ...NEW_FILES.map((rel) => fs.existsSync(abs(rel))),
  ];

  const installed = markers.every(Boolean);
  const partial = !installed && markers.some(Boolean);
  return { installed, partial };
}

export function assertBaseline() {
  assertRepoShape();
  assertTemplatesPresent();

  const state = inspectInstallState();
  if (state.installed) return { alreadyInstalled: true };
  if (state.partial) {
    fail(
      "Wykryto częściowo zainstalowany Pack 01. Nie będę zgadywać stanu repo.\n" +
      "Uruchom rollback, jeśli istnieje backup, albo sprawdź zmiany ręcznie."
    );
  }

  for (const rel of [...MODIFIED_FILES, PATHS.stableCreate]) {
    if (trackedDirty(rel)) {
      fail(`Plik ma lokalne śledzone zmiany i Pack 01 go nie nadpisze: ${rel}`);
    }
    const expected = BASELINE_INDEX_SHAS[rel];
    const actual = getIndexSha(rel);
    if (actual !== expected) {
      fail(
        `Nieoczekiwana wersja pliku ${rel}\n` +
        `oczekiwany index SHA: ${expected}\n` +
        `aktualny index SHA:    ${actual ?? "(brak)"}\n` +
        `Pack 01 jest przygotowany dla bazowego stanu ${BASELINE_COMMIT}.`
      );
    }
  }

  for (const rel of NEW_FILES) {
    if (fs.existsSync(abs(rel))) {
      fail(`Docelowy nowy plik już istnieje: ${rel}`);
    }
  }

  const app = read(PATHS.app);
  const layout = read(PATHS.layout);
  const dashboard = read(PATHS.dashboard);

  const appImport = 'import CreateTournament from "@/pages/create-tournament";';
  const appRoute = '<Route path="/tournaments/new" component={CreateTournament} />';

  if (count(app, appImport) !== 1) {
    fail(`Nie znaleziono dokładnie jednego markera importu CreateTournament w ${PATHS.app}`);
  }
  if (count(app, appRoute) !== 1) {
    fail(`Nie znaleziono dokładnie jednej stabilnej trasy /tournaments/new w ${PATHS.app}`);
  }
  if (count(layout, 'href="/tournaments/new"') !== 1) {
    fail(`Oczekiwano dokładnie jednego linku /tournaments/new w ${PATHS.layout}`);
  }
  if (count(dashboard, 'href="/tournaments/new"') !== 2) {
    fail(`Oczekiwano dokładnie dwóch linków /tournaments/new w ${PATHS.dashboard}`);
  }

  return { alreadyInstalled: false };
}

export function assertInstalledStructure() {
  assertRepoShape();

  const state = inspectInstallState();
  if (!state.installed) {
    fail("Pack 01 nie wygląda na kompletnie zainstalowany.");
  }

  const app = read(PATHS.app);
  const layout = read(PATHS.layout);
  const dashboard = read(PATHS.dashboard);

  const stableRoute = '<Route path="/tournaments/new" component={CreateTournament} />';
  const choiceRoute = '<Route path="/tournaments/create" component={TournamentCreateChoice} />';
  const experimentalRoute =
    '<Route path="/experimental/tournaments/new" component={CreateTournamentExperimental} />';
  const dynamicRoute = '<Route path="/tournaments/:id" component={TournamentDetail} />';

  for (const [label, marker] of [
    ["stable route", stableRoute],
    ["choice route", choiceRoute],
    ["experimental route", experimentalRoute],
    ["dynamic tournament route", dynamicRoute],
  ]) {
    if (count(app, marker) !== 1) fail(`Nieprawidłowa liczba wystąpień: ${label}`);
  }

  if (app.indexOf(choiceRoute) > app.indexOf(dynamicRoute)) {
    fail("/tournaments/create znajduje się po /tournaments/:id — routing może połknąć literalną trasę.");
  }

  if (count(layout, 'href="/tournaments/create"') !== 1) {
    fail("Layout nie ma dokładnie jednego linku Nowy turniej -> /tournaments/create.");
  }
  if (count(dashboard, 'href="/tournaments/create"') !== 2) {
    fail("Dashboard nie ma dokładnie dwóch wejść Utwórz turniej -> /tournaments/create.");
  }

  if (layout.includes('href="/tournaments/new"')) {
    fail("Layout nadal zawiera stare bezpośrednie wejście /tournaments/new.");
  }
  if (dashboard.includes('href="/tournaments/new"')) {
    fail("Dashboard nadal zawiera stare bezpośrednie wejście /tournaments/new.");
  }

  const stableSha = getIndexSha(PATHS.stableCreate);
  if (stableSha !== BASELINE_INDEX_SHAS[PATHS.stableCreate]) {
    fail("Stabilny create-tournament.tsx nie odpowiada bazowej wersji — Pack 01 nie powinien go zmieniać.");
  }

  return true;
}

export function copyTemplatesIntoRepo() {
  for (const [name, rel] of Object.entries(TEMPLATE_MAP)) {
    const source = path.join(templateDir(), name);
    const target = abs(rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
}

export function patchExistingFiles() {
  let app = read(PATHS.app);
  const eol = app.includes("\r\n") ? "\r\n" : "\n";
  const appImport = 'import CreateTournament from "@/pages/create-tournament";';
  const newImports = [
    appImport,
    'import TournamentCreateChoice from "@/pages/tournament-create-choice";',
    'import CreateTournamentExperimental from "@/pages/experimental/tournaments/create-tournament-experimental";',
  ].join(eol);
  app = app.replace(appImport, newImports);

  const stableRoute = '<Route path="/tournaments/new" component={CreateTournament} />';
  const newRoutes = [
    '<Route path="/tournaments/create" component={TournamentCreateChoice} />',
    '      <Route path="/experimental/tournaments/new" component={CreateTournamentExperimental} />',
    `      ${stableRoute}`,
  ].join(eol);
  app = app.replace(stableRoute, newRoutes);
  write(PATHS.app, app);

  let layout = read(PATHS.layout);
  layout = layout.replace('href="/tournaments/new"', 'href="/tournaments/create"');
  write(PATHS.layout, layout);

  let dashboard = read(PATHS.dashboard);
  dashboard = dashboard.replaceAll('href="/tournaments/new"', 'href="/tournaments/create"');
  write(PATHS.dashboard, dashboard);
}

export function makeBackup() {
  const backup = abs(BACKUP_DIR);
  if (fs.existsSync(backup)) {
    fail(`Backup ${BACKUP_DIR} już istnieje. Nie nadpiszę go.`);
  }
  fs.mkdirSync(backup, { recursive: true });

  for (const rel of MODIFIED_FILES) {
    const dst = path.join(backup, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(abs(rel), dst);
  }

  const manifest = {
    pack: PACK_ID,
    createdAt: new Date().toISOString(),
    modifiedFiles: MODIFIED_FILES,
    createdFiles: NEW_FILES,
    baselineCommit: BASELINE_COMMIT,
  };
  fs.writeFileSync(path.join(backup, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
}

export function rollbackFromBackup({ removeBackup = true } = {}) {
  const backup = abs(BACKUP_DIR);
  const manifestPath = path.join(backup, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    fail(`Brak poprawnego backupu ${BACKUP_DIR}/manifest.json`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest.pack !== PACK_ID) {
    fail("Backup nie należy do Tournament Experimental Pack 01.");
  }

  for (const rel of manifest.modifiedFiles ?? []) {
    const source = path.join(backup, rel);
    if (!fs.existsSync(source)) fail(`Backup nie zawiera: ${rel}`);
    fs.mkdirSync(path.dirname(abs(rel)), { recursive: true });
    fs.copyFileSync(source, abs(rel));
  }

  for (const rel of manifest.createdFiles ?? []) {
    if (fs.existsSync(abs(rel))) fs.rmSync(abs(rel), { force: true });
  }

  for (const rel of [
    "artifacts/tournament-manager/src/pages/experimental/tournaments",
    "artifacts/tournament-manager/src/features/experimental-tournaments",
  ]) {
    const target = abs(rel);
    if (fs.existsSync(target) && fs.readdirSync(target).length === 0) {
      fs.rmdirSync(target);
    }
  }

  if (removeBackup) fs.rmSync(backup, { recursive: true, force: true });
}

export function runPnpm(args) {
  const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const result = spawnSync(command, args, {
    cwd: repoRoot(),
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.error) fail(`Nie udało się uruchomić pnpm: ${result.error.message}`);
  if (result.status !== 0) fail(`Polecenie pnpm zakończyło się kodem ${result.status}.`);
}

export function sourceStatusLines() {
  const result = git(["status", "--porcelain", "--untracked-files=all"]);
  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .filter((line) => {
      const rel = line.slice(3).replaceAll("\\", "/");
      return rel.startsWith("artifacts/tournament-manager/src/");
    });
}

export function assertSourceWhitelist() {
  const allowed = new Set([...MODIFIED_FILES, ...NEW_FILES].map((p) => p.replaceAll("\\", "/")));
  const bad = [];

  for (const line of sourceStatusLines()) {
    const raw = line.slice(3);
    const paths = raw.includes(" -> ") ? raw.split(" -> ") : [raw];
    const rel = paths.at(-1).replaceAll("\\", "/");
    if (!allowed.has(rel)) bad.push(`${line}`);
  }

  if (bad.length) {
    fail(
      "Wykryto nieoczekiwane zmiany w src poza whitelistą Pack 01:\n" +
      bad.map((x) => `  ${x}`).join("\n")
    );
  }
}
