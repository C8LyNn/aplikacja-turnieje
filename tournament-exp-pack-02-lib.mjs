import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const PACK = "tournament-exp-pack-02-expanded-audited-v5-win-eol-runtimefix";
export const BACKUP = ".tournament-exp-pack-02-expanded-audited-v5-win-eol-runtimefix-backup";
export const BASE_COMMIT = "39e6aefef759cb80d5ecc3f01a1db606a929e308";

const P = {
  app: "artifacts/tournament-manager/src/App.tsx",
  indexCss: "artifacts/tournament-manager/src/index.css",

  layout: "artifacts/tournament-manager/src/components/layout.tsx",
  appNavigation: "artifacts/tournament-manager/src/components/app-navigation.tsx",
  organizerNavigation: "artifacts/tournament-manager/src/components/tournament-organizer-navigation.tsx",
  organizerNextStep: "artifacts/tournament-manager/src/components/organizer-next-step.tsx",
  organizerRecovery: "artifacts/tournament-manager/src/components/organizer-recovery-notice.tsx",
  backupRestore: "artifacts/tournament-manager/src/components/backup-restore-dialog.tsx",
  sharingPanel: "artifacts/tournament-manager/src/components/sharing-panel.tsx",
  stagesPanel: "artifacts/tournament-manager/src/components/tournament-stages-panel.tsx",
  basketsPanel: "artifacts/tournament-manager/src/components/stage-baskets-panel.tsx",
  readQueryState: "artifacts/tournament-manager/src/components/read-query-state.tsx",

  tournamentsHome: "artifacts/tournament-manager/src/pages/tournaments-home.tsx",
  dashboard: "artifacts/tournament-manager/src/pages/dashboard.tsx",
  supportEntry: "artifacts/tournament-manager/src/pages/support-entry.tsx",
  fanView: "artifacts/tournament-manager/src/pages/fan-view.tsx",
  detail: "artifacts/tournament-manager/src/pages/tournament-detail.tsx",
  host: "artifacts/tournament-manager/src/pages/tournament-host.tsx",
  audience: "artifacts/tournament-manager/src/pages/tournament-audience.tsx",
  bracket: "artifacts/tournament-manager/src/pages/tournament-bracket.tsx",
  projector: "artifacts/tournament-manager/src/pages/tournament-projector.tsx",

  create: "artifacts/tournament-manager/src/pages/experimental/tournaments/create-tournament-experimental.tsx",
  createTest: "artifacts/tournament-manager/src/pages/experimental/tournaments/create-tournament-experimental.test.tsx",
  choice: "artifacts/tournament-manager/src/pages/tournament-create-choice.tsx",
  stableCreate: "artifacts/tournament-manager/src/pages/create-tournament.tsx",

  expShell: "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-tournament-shell.tsx",
  expGuard: "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-organizer-guard.tsx",
  routing: "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-tournament-routing.ts",
  routingTest: "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-tournament-routing.test.ts",
  containmentTest: "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-route-containment.test.ts",
  expUi: "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-ui.tsx",
  dashboardToolbar: "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-dashboard-toolbar.tsx",
  dashboardDialogs: "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-dashboard-dialogs.tsx",
  density: "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-density-control.tsx",
  expChecklist: "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-tournament-checklist.tsx",
  contextBar: "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-tournament-context-bar.tsx",
  hostCenter: "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-host-command-center.tsx",
  hostFocus: "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-host-focus-toggle.tsx",
  playerToolbar: "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-player-toolbar.tsx",
  overview: "artifacts/tournament-manager/src/features/experimental-tournaments/experimental-tournament-overview.tsx",
  css: "artifacts/tournament-manager/src/experimental-tournaments.css",
};

const root = () => process.cwd();
const abs = (rel) => path.join(root(), rel);
const scriptDir = () => path.dirname(fileURLToPath(import.meta.url));
const templateDir = () => path.join(scriptDir(), "tournament-exp-pack-02-templates");
const fail = (message) => { throw new Error(message); };
const read = (rel) => fs.readFileSync(abs(rel), "utf8");
const write = (rel, content) => {
  fs.mkdirSync(path.dirname(abs(rel)), { recursive: true });
  fs.writeFileSync(abs(rel), content, "utf8");
};
const tpl = (name) => fs.readFileSync(path.join(templateDir(), name), "utf8");

function replaceOnce(content, from, to, label) {
  if (content.includes(to)) return content;
  const index = content.indexOf(from);
  if (index < 0) fail(`Nie znaleziono markera: ${label}`);
  return content.slice(0, index) + to + content.slice(index + from.length);
}

function replaceEvery(content, from, to, label) {
  if (!content.includes(from)) {
    if (content.includes(to)) return content;
    fail(`Nie znaleziono markera: ${label}`);
  }
  return content.split(from).join(to);
}

function patch(rel, fn) {
  const before = read(rel);
  const usesCrlf = before.includes("\r\n");
  const normalizedBefore = before.replace(/\r\n/g, "\n");
  const normalizedAfter = fn(normalizedBefore);

  if (normalizedAfter !== normalizedBefore) {
    const after = usesCrlf
      ? normalizedAfter.replace(/\n/g, "\r\n")
      : normalizedAfter;
    write(rel, after);
  }
}

function git(args, { capture = false } = {}) {
  const env = { ...process.env };
  let result;
  if (process.platform === "win32") {
    const comspec =
      process.env.ComSpec ||
      process.env.COMSPEC ||
      "C:\\Windows\\System32\\cmd.exe";
    const line = ["git", ...args]
      .map((part) =>
        /[\s"&|<>^]/.test(part)
          ? `"${String(part).replaceAll('"', '""')}"`
          : String(part),
      )
      .join(" ");
    result = spawnSync(comspec, ["/d", "/s", "/c", line], {
      cwd: root(),
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
      shell: false,
      encoding: capture ? "utf8" : undefined,
      env,
    });
  } else {
    result = spawnSync("git", args, {
      cwd: root(),
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
      shell: false,
      encoding: capture ? "utf8" : undefined,
      env,
    });
  }

  if (result.error) fail(`Nie można uruchomić git: ${result.error.message}`);
  if (result.status !== 0) {
    const details = capture
      ? `\n${String(result.stderr ?? "").trim()}`
      : "";
    fail(`git ${args.join(" ")} zakończył się kodem ${result.status}.${details}`);
  }
  return capture ? String(result.stdout ?? "").trim() : "";
}

const trackedTargets = () =>
  Object.values(P).filter(
    (rel) =>
      fs.existsSync(abs(rel)) &&
      ![
        P.routing,
        P.routingTest,
        P.containmentTest,
        P.expUi,
        P.dashboardToolbar,
        P.dashboardDialogs,
        P.density,
        P.expChecklist,
        P.hostFocus,
        P.playerToolbar,
        P.overview,
        P.css,
      ].includes(rel),
  );

export function state() {
  for (const rel of [
    "pnpm-workspace.yaml",
    P.app,
    P.indexCss,
    P.layout,
    P.appNavigation,
    P.organizerNavigation,
    P.stagesPanel,
    P.basketsPanel,
    P.readQueryState,
    P.dashboard,
    P.tournamentsHome,
    P.supportEntry,
    P.fanView,
    P.detail,
    P.host,
    P.audience,
    P.bracket,
    P.projector,
    P.create,
    P.choice,
    P.stableCreate,
  ]) {
    if (!fs.existsSync(abs(rel))) fail(`Brak ${rel}.`);
  }

  const app = read(P.app);
  const create = read(P.create);
  const choice = read(P.choice);

  return {
    installed:
      fs.existsSync(abs(P.routing)) &&
      fs.existsSync(abs(P.expUi)) &&
      fs.existsSync(abs(P.dashboardToolbar)) &&
      fs.existsSync(abs(P.dashboardDialogs)) &&
      fs.existsSync(abs(P.density)) &&
      fs.existsSync(abs(P.expChecklist)) &&
      fs.existsSync(abs(P.contextBar)) &&
      fs.existsSync(abs(P.hostCenter)) &&
      fs.existsSync(abs(P.hostFocus)) &&
      fs.existsSync(abs(P.playerToolbar)) &&
      fs.existsSync(abs(P.overview)) &&
      fs.existsSync(abs(P.containmentTest)) &&
      fs.existsSync(abs(P.css)) &&
      app.includes('/experimental/tournaments/support') &&
      app.includes('/experimental/tournaments/fan') &&
      app.includes('/experimental/tournaments/:id/host') &&
      create.includes('navigate(`/experimental/tournaments/${id}`)') &&
      choice.includes("experimental · Pack 02 audited"),
    compatible:
      app.includes('<Route path="/tournaments/:id/host" component={TournamentHost} />') &&
      create.includes('fetch("/api/healthz"') &&
      create.includes("buildSingleStageSeedingPlan") &&
      read(P.detail).includes('useRoute("/tournaments/:id")') &&
      read(P.host).includes('useRoute("/tournaments/:id/host")') &&
      read(P.audience).includes('useRoute("/tournaments/:id/audience")') &&
      read(P.bracket).includes('useRoute("/tournaments/:id/bracket")'),
  };
}

export function assertReady() {
  const current = state();
  if (current.installed) return { alreadyInstalled: true };

  if (!current.compatible) {
    fail(
      "Nie rozpoznaję bazowego checkpointu 39e6aef / Pack 01. " +
      "Nie wykonuję częściowej instalacji.",
    );
  }

  const head = git(["rev-parse", "HEAD"], { capture: true });
  if (head !== BASE_COMMIT) {
    console.warn(
      `[Pack 02] UWAGA: HEAD to ${head.slice(0, 12)}, oczekiwano ${BASE_COMMIT.slice(0, 12)}. ` +
      "Kontynuuję tylko dlatego, że markery kodu są zgodne.",
    );
  }

  const changed = git(
    ["diff", "--name-only", "HEAD", "--", ...trackedTargets()],
    { capture: true },
  )
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (changed.length > 0) {
    fail(
      "Masz lokalne niezacommitowane zmiany w plikach, które Pack 02 chce modyfikować:\n" +
      changed.map((item) => `- ${item}`).join("\n") +
      "\nZacommituj je albo świadomie odłóż przed instalacją.",
    );
  }

  return { alreadyInstalled: false };
}

export function backup() {
  const dir = abs(BACKUP);
  if (fs.existsSync(dir)) fail(`Backup ${BACKUP} już istnieje.`);

  const existing = Object.values(P).filter((rel) => fs.existsSync(abs(rel)));
  const created = [
    P.routing,
    P.routingTest,
    P.containmentTest,
    P.expUi,
    P.dashboardToolbar,
    P.dashboardDialogs,
    P.density,
    P.expChecklist,
    P.contextBar,
    P.hostCenter,
    P.hostFocus,
    P.playerToolbar,
    P.overview,
    P.css,
  ].filter((rel) => !fs.existsSync(abs(rel)));

  fs.mkdirSync(dir, { recursive: true });

  for (const rel of existing) {
    const dst = path.join(dir, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(abs(rel), dst);
  }

  fs.writeFileSync(
    path.join(dir, "manifest.json"),
    JSON.stringify({ pack: PACK, existing, created }, null, 2),
  );
}

function installTemplates() {
  write(P.create, tpl("create-tournament-experimental.tsx"));
  write(P.choice, tpl("tournament-create-choice.tsx"));
  write(P.expShell, tpl("experimental-tournament-shell.tsx"));
  write(P.expGuard, tpl("experimental-organizer-guard.tsx"));
  if (fs.existsSync(abs(P.createTest))) {
    write(P.createTest, tpl("create-tournament-experimental.test.tsx"));
  }
  write(P.routing, tpl("experimental-tournament-routing.ts"));
  write(P.routingTest, tpl("experimental-tournament-routing.test.ts"));
  write(P.containmentTest, tpl("experimental-route-containment.test.ts"));
  write(P.expUi, tpl("experimental-ui.tsx"));
  write(P.dashboardToolbar, tpl("experimental-dashboard-toolbar.tsx"));
  write(P.dashboardDialogs, tpl("experimental-dashboard-dialogs.tsx"));
  write(P.density, tpl("experimental-density-control.tsx"));
  write(P.expChecklist, tpl("experimental-tournament-checklist.tsx"));
  write(P.contextBar, tpl("experimental-tournament-context-bar.tsx"));
  write(P.hostCenter, tpl("experimental-host-command-center.tsx"));
  write(P.hostFocus, tpl("experimental-host-focus-toggle.tsx"));
  write(P.playerToolbar, tpl("experimental-player-toolbar.tsx"));
  write(P.overview, tpl("experimental-tournament-overview.tsx"));
  write(P.css, tpl("experimental-tournaments.css"));
}

function patchApp() {
  patch(P.app, (s) =>
    replaceOnce(
      s,
      '      <Route path="/experimental/tournaments/new" component={CreateTournamentExperimental} />',
      `      <Route path="/experimental/tournaments/create" component={CreateTournamentExperimental} />
      <Route path="/experimental/tournaments/new" component={CreateTournamentExperimental} />
      <Route path="/experimental/tournaments/dashboard" component={Dashboard} />
      <Route path="/experimental/tournaments/support" component={SupportEntry} />
      <Route path="/experimental/tournaments/fan" component={FanView} />
      <Route path="/experimental/tournaments/:id/bracket" component={TournamentBracket} />
      <Route path="/experimental/tournaments/:id/host" component={TournamentHost} />
      <Route path="/experimental/tournaments/:id/audience" component={TournamentAudience} />
      <Route path="/experimental/tournaments/:id/projector" component={TournamentProjector} />
      <Route path="/experimental/tournaments/:id" component={TournamentDetail} />
      <Route path="/experimental/tournaments" component={TournamentsHome} />`,
      "App.tsx: komplet tras Experimental",
    ),
  );
}

function patchIndexCss() {
  patch(P.indexCss, (s) =>
    replaceOnce(
      s,
      '@import "./organizer.css";',
      '@import "./organizer.css";\n@import "./experimental-tournaments.css";',
      "index.css: import experimental CSS",
    ),
  );
}

function patchLayout() {
  patch(P.layout, (s0) => {
    let s = s0;

    s = replaceOnce(
      s,
      'import { PlusCircle, HelpCircle } from "lucide-react";',
      'import { PlusCircle, HelpCircle, FlaskConical } from "lucide-react";',
      "layout: icon import",
    );

    s = replaceOnce(
      s,
      'import { AppLogoLink, getRoleHomePath, RoleHomeLink, RoleSelectionLink } from "@/components/app-navigation";',
      'import { AppLogoLink, getRoleHomePath, RoleHomeLink, RoleSelectionLink } from "@/components/app-navigation";\nimport { isExperimentalTournamentPath } from "@/features/experimental-tournaments/experimental-tournament-routing";\nimport { ExperimentalDensityControl } from "@/features/experimental-tournaments/experimental-density-control";',
      "layout: Experimental imports",
    );

    s = replaceOnce(
      s,
      `  const isTournamentView = /^\\/tournaments\\/\\d+(?:\\/|$)/.test(location);
  const fallbackHref = isTournamentView ? "/fan" : "/";
  const fallbackLabel = isTournamentView ? "Wróć do turniejów" : "Wróć do strony głównej";
  const roleHome = getRoleHomePath(role, fallbackHref);`,
      `  const isExperimentalTournamentView = isExperimentalTournamentPath(location);
  const isTournamentView = /^\\/(?:experimental\\/)?tournaments\\/\\d+(?:\\/|$)/.test(location);
  const fallbackHref = isExperimentalTournamentView
    ? "/experimental/tournaments"
    : isTournamentView
      ? "/fan"
      : "/";
  const fallbackLabel =
    isExperimentalTournamentView || isTournamentView
      ? "Wróć do turniejów"
      : "Wróć do strony głównej";
  const roleHome = getRoleHomePath(role, fallbackHref, isExperimentalTournamentView);`,
      "layout: route mode",
    );

    s = replaceOnce(
      s,
      '      className="min-h-screen flex flex-col bg-background text-foreground dark transition-colors duration-200"',
      '      className={`min-h-screen flex flex-col bg-background text-foreground dark transition-colors duration-200 ${isExperimentalTournamentView ? "experimental-tournament-shell" : ""}`}',
      "layout: experimental shell class",
    );

    s = replaceOnce(
      s,
      `    >
      <header className="border-b border-border bg-card sticky top-0 z-10">`,
      `    >
      {isExperimentalTournamentView && (
        <a href="#experimental-main" className="experimental-skip-link">
          Przejdź do głównej treści
        </a>
      )}
      <header className="border-b border-border bg-card sticky top-0 z-10">`,
      "layout: skip link",
    );

    s = replaceOnce(
      s,
      '            <AppLogoLink fallbackHref={fallbackHref} className="text-xl" />',
      `            <AppLogoLink fallbackHref={fallbackHref} className="text-xl" />
            {isExperimentalTournamentView && (
              <span className="experimental-mode-badge">
                <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
                Experimental
              </span>
            )}`,
      "layout: experimental badge",
    );

    s = replaceOnce(
      s,
      '<nav className="flex items-center gap-3 text-sm font-medium text-muted-foreground">',
      '<nav className="flex items-center gap-3 text-sm font-medium text-muted-foreground">{isExperimentalTournamentView && <ExperimentalDensityControl />}',
      "layout: density control",
    );

    s = replaceOnce(
      s,
      '<Link href="/dashboard" className={`px-3 py-1.5 rounded hover:text-foreground hover:bg-muted/40 transition-colors ${location === "/dashboard" ? "text-foreground bg-muted/30" : ""}`}>',
      '<Link href={isExperimentalTournamentView ? "/experimental/tournaments/dashboard" : "/dashboard"} aria-current={location === "/dashboard" || location === "/experimental/tournaments/dashboard" ? "page" : undefined} className={`px-3 py-1.5 rounded hover:text-foreground hover:bg-muted/40 transition-colors ${location === "/dashboard" || location === "/experimental/tournaments/dashboard" ? "text-foreground bg-muted/30" : ""}`}>',
      "layout: dashboard link",
    );

    s = replaceOnce(
      s,
      '<Link href="/tournaments/create" className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:text-foreground hover:bg-muted/40 transition-colors">',
      '<Link href={isExperimentalTournamentView ? "/experimental/tournaments/new" : "/tournaments/create"} className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:text-foreground hover:bg-muted/40 transition-colors">',
      "layout: create link",
    );

    s = replaceOnce(
      s,
      `              title="Instrukcja obsługi"
            >`,
      `              title="Instrukcja obsługi"
              aria-current={location === "/help" ? "page" : undefined}
            >`,
      "layout: help aria-current",
    );

    s = replaceOnce(
      s,
      '      <main className="flex-1 container mx-auto px-4 md:px-8 py-8">',
      '      <main id={isExperimentalTournamentView ? "experimental-main" : undefined} className="flex-1 container mx-auto px-4 md:px-8 py-8">',
      "layout: main landmark target",
    );

    return s;
  });
}

function patchAppNavigation() {
  patch(P.appNavigation, (s0) => {
    let s = s0;

    s = replaceOnce(
      s,
      'import { Link } from "wouter";',
      'import { Link, useLocation } from "wouter";',
      "app-navigation: wouter import",
    );

    s = replaceOnce(
      s,
      'import type { Role } from "@/lib/auth";',
      'import type { Role } from "@/lib/auth";\nimport { isExperimentalTournamentPath, tournamentRoleHomeHref } from "@/features/experimental-tournaments/experimental-tournament-routing";',
      "app-navigation: routing import",
    );

    s = replaceOnce(
      s,
      `export function getRoleHomePath(role: Role | null, fallbackHref = "/"): string {
  return role ? ROLE_HOME[role].href : fallbackHref;
}`,
      `export function getRoleHomePath(
  role: Role | null,
  fallbackHref = "/",
  experimental = false,
): string {
  return role
    ? experimental
      ? tournamentRoleHomeHref(role, true)
      : ROLE_HOME[role].href
    : fallbackHref;
}`,
      "app-navigation: getRoleHomePath",
    );

    s = replaceOnce(
      s,
      `  const { role } = useAuth();

  return (
    <Link
      href={getRoleHomePath(role, fallbackHref)}`,
      `  const { role } = useAuth();
  const [location] = useLocation();
  const experimental = isExperimentalTournamentPath(location);

  return (
    <Link
      href={getRoleHomePath(role, fallbackHref, experimental)}`,
      "app-navigation: logo mode",
    );

    s = replaceOnce(
      s,
      `  const { role } = useAuth();
  const destination = role ? ROLE_HOME[role] : { href: fallbackHref, label: fallbackLabel };`,
      `  const { role } = useAuth();
  const [location] = useLocation();
  const experimental = isExperimentalTournamentPath(location);
  const destination = role
    ? {
        ...ROLE_HOME[role],
        href: getRoleHomePath(role, fallbackHref, experimental),
      }
    : { href: fallbackHref, label: fallbackLabel };`,
      "app-navigation: role home mode",
    );

    s = replaceOnce(
      s,
      `export function RoleSelectionLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/tournaments"`,
      `export function RoleSelectionLink({ className = "" }: { className?: string }) {
  const [location] = useLocation();
  const experimental = isExperimentalTournamentPath(location);

  return (
    <Link
      href={experimental ? "/experimental/tournaments" : "/tournaments"}`,
      "app-navigation: role selection mode",
    );

    return s;
  });
}

function patchTournamentsHome() {
  patch(P.tournamentsHome, (s0) => {
    let s = s0;

    s = replaceOnce(
      s,
      'import { ArrowLeft, Eye, UserCog, Users } from "lucide-react";',
      'import { ArrowLeft, Eye, FlaskConical, UserCog, Users } from "lucide-react";',
      "tournaments-home: icon",
    );

    s = replaceOnce(
      s,
      'import type { Role } from "@/lib/auth";',
      'import type { Role } from "@/lib/auth";\nimport { isExperimentalTournamentPath, tournamentRoleHomeHref } from "@/features/experimental-tournaments/experimental-tournament-routing";',
      "tournaments-home: routing import",
    );

    s = replaceOnce(
      s,
      `  const { role, setRole } = useAuth();
  const [, navigate] = useLocation();

  function selectRole(item: (typeof TOURNAMENT_ROLES)[number]) {
    setRole(item.id);
    navigate(item.href);
  }`,
      `  const { role, setRole } = useAuth();
  const [location, navigate] = useLocation();
  const isExperimental = isExperimentalTournamentPath(location);

  function selectRole(item: (typeof TOURNAMENT_ROLES)[number]) {
    setRole(item.id);
    navigate(
      isExperimental
        ? tournamentRoleHomeHref(item.id, true)
        : item.href,
    );
  }`,
      "tournaments-home: mode",
    );

    s = replaceOnce(
      s,
      '<div className="min-h-screen bg-background px-4 py-12 text-foreground dark">',
      '<div className={`min-h-screen bg-background px-4 py-12 text-foreground dark ${isExperimental ? "experimental-tournament-entry" : ""}`}>',
      "tournaments-home: class",
    );

    s = replaceOnce(
      s,
      '<div className="mx-auto max-w-4xl">',
      '<div className={`mx-auto max-w-4xl ${isExperimental ? "experimental-entry-inner" : ""}`}>',
      "tournaments-home: inner",
    );

    s = replaceOnce(
      s,
      `<div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-primary">Turnieje</h1>
          <p className="mt-3 text-base text-muted-foreground">
            Wybierz sposób wejścia do modułu turniejowego.
          </p>
        </div>`,
      `<div className={\`mb-10 text-center \${isExperimental ? "experimental-entry-hero p-6 sm:p-8" : ""}\`}>
          {isExperimental && (
            <div className="mb-3 flex justify-center">
              <span className="experimental-mode-badge">
                <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
                Experimental
              </span>
            </div>
          )}
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            {isExperimental ? "Turnieje — nowy interfejs" : "Turnieje"}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {isExperimental
              ? "Wybierz rolę. Cała dalsza ścieżka pozostanie w równoległym interfejsie Experimental."
              : "Wybierz sposób wejścia do modułu turniejowego."}
          </p>
        </div>`,
      "tournaments-home: hero",
    );

    s = replaceOnce(
      s,
      'className={`group relative min-h-56 rounded-xl border border-border bg-card p-6 text-left transition-all duration-200 ${item.cardHover} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}',
      'className={`group relative min-h-56 rounded-xl border border-border bg-card p-6 text-left transition-all duration-200 ${item.cardHover} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isExperimental ? "experimental-entry-card" : ""}`}',
      "tournaments-home: cards",
    );

    return s;
  });
}

function patchDashboard() {
  patch(P.dashboard, (s0) => {
    let s = s0;

    s = replaceOnce(
      s,
      'import { useState } from "react";',
      'import { useMemo, useState } from "react";',
      "dashboard: React hooks",
    );

    s = replaceOnce(
      s,
      'import { BackupRestoreDialog } from "@/components/backup-restore-dialog";',
      'import { BackupRestoreDialog } from "@/components/backup-restore-dialog";\nimport { isExperimentalTournamentPath, tournamentHref } from "@/features/experimental-tournaments/experimental-tournament-routing";\nimport { ExperimentalDashboardToolbar, type ExperimentalTournamentStatusFilter } from "@/features/experimental-tournaments/experimental-dashboard-toolbar";\nimport { ExperimentalDeleteTournamentDialog, ExperimentalTestDataDialog } from "@/features/experimental-tournaments/experimental-dashboard-dialogs";\nimport { ExperimentalStatePanel } from "@/features/experimental-tournaments/experimental-ui";',
      "dashboard: Experimental imports",
    );

    s = replaceOnce(
      s,
      '  const [, navigate] = useLocation();',
      `  const [location, navigate] = useLocation();
  const isExperimental = isExperimentalTournamentPath(location);
  const [tournamentSearch, setTournamentSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExperimentalTournamentStatusFilter>("all");

  const tournamentCounts = useMemo(() => {
    const list = tournaments ?? [];
    return {
      all: list.length,
      draft: list.filter((item) => item.status === "draft").length,
      active: list.filter((item) => item.status === "active").length,
      completed: list.filter((item) => item.status === "completed").length,
    };
  }, [tournaments]);

  const filteredTournaments = useMemo(() => {
    const list = tournaments ?? [];
    if (!isExperimental) return list;

    const needle = tournamentSearch.trim().toLocaleLowerCase("pl-PL");
    return list.filter((item) => {
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;
      const haystack = \`\${item.name} \${item.description ?? ""}\`.toLocaleLowerCase("pl-PL");
      const matchesSearch = !needle || haystack.includes(needle);
      return matchesStatus && matchesSearch;
    });
  }, [isExperimental, statusFilter, tournamentSearch, tournaments]);`,
      "dashboard: mode and filters",
    );

    s = replaceEvery(
      s,
      'navigate(`/tournaments/${tournament.id}`)',
      'navigate(tournamentHref(tournament.id, isExperimental))',
      "dashboard: navigate tournament",
    );

    s = replaceEvery(
      s,
      'href="/tournaments/create"',
      'href={isExperimental ? "/experimental/tournaments/new" : "/tournaments/create"}',
      "dashboard: create href",
    );

    s = replaceOnce(
      s,
      '<h1 className="text-3xl font-bold tracking-tight text-primary">Turnieje</h1>\n            <p className="text-muted-foreground">Zarządzaj rozgrywkami, drabinkami i wynikami.</p>',
      '<h1 className="text-3xl font-bold tracking-tight text-primary">{isExperimental ? "Centrum turniejów" : "Turnieje"}</h1>\n            <p className="text-muted-foreground">{isExperimental ? "Nowy interfejs zarządzania rozgrywkami, etapami i wynikami." : "Zarządzaj rozgrywkami, drabinkami i wynikami."}</p>',
      "dashboard: title",
    );

    s = replaceOnce(
      s,
      'className="hover:border-primary/50 transition-colors cursor-pointer h-full flex flex-col group"',
      'className={`hover:border-primary/50 transition-colors cursor-pointer h-full flex flex-col group ${isExperimental ? "experimental-dashboard-card" : ""}`}',
      "dashboard: card class",
    );

    s = replaceOnce(
      s,
      `<CardTitle className="line-clamp-1 group-hover:text-primary transition-colors flex-1 min-w-0">
                      {tournament.name}
                    </CardTitle>`,
      `<CardTitle className="line-clamp-1 group-hover:text-primary transition-colors flex-1 min-w-0">
                      {isExperimental ? (
                        <Link
                          href={tournamentHref(tournament.id, true)}
                          className="experimental-dashboard-card-link"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {tournament.name}
                        </Link>
                      ) : (
                        tournament.name
                      )}
                    </CardTitle>`,
      "dashboard: keyboard link",
    );

    s = replaceEvery(
      s,
      'className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-primary/15 text-muted-foreground hover:text-primary"',
      'className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-primary/15 text-muted-foreground hover:text-primary ${isExperimental ? "group-focus-within:opacity-100 focus:opacity-100" : ""}`}',
      "dashboard: backup action focus",
    );

    s = replaceEvery(
      s,
      'className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive"',
      'className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive ${isExperimental ? "group-focus-within:opacity-100 focus:opacity-100" : ""}`}',
      "dashboard: delete action focus",
    );

    s = replaceOnce(
      s,
      '        {/* Test data modal */}\n        {showTestDataModal && (',
      `        {isExperimental && (
          <>
            <ExperimentalTestDataDialog
              open={showTestDataModal}
              onOpenChange={(open) => { if (!open && !testDataLoading) setShowTestDataModal(false); }}
              sizes={TEST_SIZES}
              selectedSize={testDataSize}
              onSelectedSizeChange={(size) => setTestDataSize(size as TestSize)}
              organizerPassword={testDataOrganizerPassword}
              onOrganizerPasswordChange={setTestDataOrganizerPassword}
              loading={testDataLoading}
              onCreate={() => void handleCreateTestData()}
            />
            <ExperimentalDeleteTournamentDialog
              open={!!confirmDeleteId && !!confirmTarget}
              onOpenChange={(open) => { if (!open) closeDeleteModal(); }}
              tournamentName={confirmTarget?.name}
              hasOrganizerPassword={confirmTarget?.hasOrganizerPassword}
              hasHostCode={confirmTarget?.hasHostCode}
              password={deletePassword}
              onPasswordChange={(value) => { setDeletePassword(value); setDeletePasswordError(null); }}
              passwordError={deletePasswordError}
              loading={deleteLoading}
              onDelete={() => void handleDelete()}
            />
          </>
        )}

        {/* Stable keeps the existing custom modal presentation. */}
        {!isExperimental && showTestDataModal && (`,
      "dashboard: accessible Experimental test dialog",
    );

    s = replaceOnce(
      s,
      '        {/* Delete confirmation overlay */}\n        {confirmDeleteId && confirmTarget && (',
      '        {/* Delete confirmation overlay — Stable only. */}\n        {!isExperimental && confirmDeleteId && confirmTarget && (',
      "dashboard: accessible Experimental delete dialog",
    );

    return s;
  });
}

function patchSupportEntry() {
  patch(P.supportEntry, (s0) => {
    let s = s0;

    s = replaceOnce(
      s,
      'import { Users, Lock, User, Trophy } from "lucide-react";',
      'import { FlaskConical, Users, Lock, User, Trophy } from "lucide-react";',
      "support: icon",
    );

    s = replaceOnce(
      s,
      'import { AppLogoLink, RoleSelectionLink } from "@/components/app-navigation";',
      'import { AppLogoLink, RoleSelectionLink } from "@/components/app-navigation";\nimport { isExperimentalTournamentPath, tournamentHref } from "@/features/experimental-tournaments/experimental-tournament-routing";',
      "support: routing import",
    );

    s = replaceOnce(
      s,
      '  const [, navigate] = useLocation();',
      '  const [location, navigate] = useLocation();\n  const isExperimental = isExperimentalTournamentPath(location);',
      "support: mode",
    );

    s = replaceOnce(
      s,
      '      navigate(`/tournaments/${selectedId}/host`);',
      '      navigate(tournamentHref(selectedId, isExperimental, "/host"));',
      "support: host navigation",
    );

    s = replaceOnce(
      s,
      '<div className="min-h-screen bg-background text-foreground dark flex flex-col">',
      '<div className={`min-h-screen bg-background text-foreground dark flex flex-col ${isExperimental ? "experimental-tournament-entry" : ""}`}>',
      "support: class",
    );

    s = replaceOnce(
      s,
      '<AppLogoLink fallbackHref="/support" className="text-xl" />',
      `<div className="flex items-center gap-3">
            <AppLogoLink fallbackHref={isExperimental ? "/experimental/tournaments/support" : "/support"} className="text-xl" />
            {isExperimental && (
              <span className="experimental-mode-badge">
                <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
                Experimental
              </span>
            )}
          </div>`,
      "support: badge",
    );

    s = replaceOnce(
      s,
      '<main className="flex-1 container mx-auto px-4 py-8 max-w-lg">',
      '<main id={isExperimental ? "experimental-main" : undefined} className="flex-1 container mx-auto px-4 py-8 max-w-lg">',
      "support: main id",
    );

    return s;
  });
}

function patchFanView() {
  patch(P.fanView, (s0) => {
    let s = s0;

    s = replaceOnce(
      s,
      'import { Link } from "wouter";',
      'import { Link, useLocation } from "wouter";',
      "fan: wouter",
    );

    s = replaceOnce(
      s,
      'import { Trophy, Eye, Calendar, Users } from "lucide-react";',
      'import { Trophy, Eye, Calendar, FlaskConical, Users } from "lucide-react";',
      "fan: icon",
    );

    s = replaceOnce(
      s,
      'import { AppLogoLink, RoleSelectionLink } from "@/components/app-navigation";',
      'import { AppLogoLink, RoleSelectionLink } from "@/components/app-navigation";\nimport { isExperimentalTournamentPath, tournamentHref } from "@/features/experimental-tournaments/experimental-tournament-routing";',
      "fan: routing import",
    );

    s = replaceOnce(
      s,
      `export default function FanView() {
  const { data: tournaments, isLoading } = useListTournaments();`,
      `export default function FanView() {
  const [location] = useLocation();
  const isExperimental = isExperimentalTournamentPath(location);
  const { data: tournaments, isLoading } = useListTournaments();`,
      "fan: mode",
    );

    s = replaceOnce(
      s,
      '<div className="min-h-screen bg-background text-foreground dark flex flex-col">',
      '<div className={`min-h-screen bg-background text-foreground dark flex flex-col ${isExperimental ? "experimental-tournament-entry" : ""}`}>',
      "fan: class",
    );

    s = replaceOnce(
      s,
      '<AppLogoLink fallbackHref="/fan" className="text-xl" />',
      `<div className="flex items-center gap-3">
            <AppLogoLink fallbackHref={isExperimental ? "/experimental/tournaments/fan" : "/fan"} className="text-xl" />
            {isExperimental && (
              <span className="experimental-mode-badge">
                <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
                Experimental
              </span>
            )}
          </div>`,
      "fan: badge",
    );

    s = replaceOnce(
      s,
      '<main className="flex-1 container mx-auto px-4 py-8">',
      '<main id={isExperimental ? "experimental-main" : undefined} className="flex-1 container mx-auto px-4 py-8">',
      "fan: main id",
    );

    s = replaceEvery(
      s,
      'href={`/tournaments/${t.id}/audience`}',
      'href={tournamentHref(t.id, isExperimental, "/audience")}',
      "fan: audience href",
    );

    return s;
  });
}

function patchOrganizerNavigation() {
  patch(P.organizerNavigation, (s0) => {
    let s = s0;

    s = replaceOnce(
      s,
      'import type { OrganizerCapabilities } from "@/lib/organizer-capabilities";',
      'import type { OrganizerCapabilities } from "@/lib/organizer-capabilities";\nimport { isExperimentalTournamentPath, tournamentModeHref } from "@/features/experimental-tournaments/experimental-tournament-routing";',
      "organizer nav: routing import",
    );

    s = replaceOnce(
      s,
      `  const [, navigate] = useLocation();
  useEffect(() => {
    const target = legacyMatchesRedirectTarget(tournamentId, search, capabilities);
    if (target) navigate(target, { replace: true });
  }, [capabilities, navigate, search, tournamentId]);`,
      `  const [location, navigate] = useLocation();
  useEffect(() => {
    const target = legacyMatchesRedirectTarget(tournamentId, search, capabilities);
    if (target) {
      navigate(
        tournamentModeHref(
          target,
          isExperimentalTournamentPath(location),
        ),
        { replace: true },
      );
    }
  }, [capabilities, location, navigate, search, tournamentId]);`,
      "organizer nav: legacy redirect",
    );

    s = replaceOnce(
      s,
      '  const mainActiveRef = useRef<HTMLAnchorElement>(null);',
      '  const [location] = useLocation();\n  const isExperimental = isExperimentalTournamentPath(location);\n  const mainActiveRef = useRef<HTMLAnchorElement>(null);',
      "organizer nav: mode",
    );

    s = replaceOnce(
      s,
      `  const main = organizerNavigationItems(tournamentId);
  const more = organizerMoreItems(tournamentId, capabilities);`,
      `  const main = organizerNavigationItems(tournamentId).map((item) => ({
    ...item,
    href: tournamentModeHref(item.href, isExperimental),
  }));
  const more = organizerMoreItems(tournamentId, capabilities).map((item) => ({
    ...item,
    href: tournamentModeHref(item.href, isExperimental),
  }));`,
      "organizer nav: links",
    );

    return s;
  });
}

function patchOrganizerNextStep() {
  patch(P.organizerNextStep, (s0) => {
    let s = s0;

    s = replaceOnce(
      s,
      'import { Link } from "wouter";',
      'import { Link, useLocation } from "wouter";',
      "next step: wouter",
    );

    s = replaceOnce(
      s,
      'import type { OrganizerNextStepModel } from "@/lib/organizer-next-step";',
      'import type { OrganizerNextStepModel } from "@/lib/organizer-next-step";\nimport { isExperimentalTournamentPath, tournamentModeHref } from "@/features/experimental-tournaments/experimental-tournament-routing";',
      "next step: routing import",
    );

    s = replaceOnce(
      s,
      `}) {
  const action = step.actionLabel && (onAction || step.actionHref);
  return (`,
      `}) {
  const [location] = useLocation();
  const experimental = isExperimentalTournamentPath(location);
  const actionHref = step.actionHref
    ? tournamentModeHref(step.actionHref, experimental)
    : undefined;
  const action = step.actionLabel && (onAction || actionHref);
  return (`,
      "next step: mode",
    );

    s = replaceOnce(
      s,
      '{action && step.actionHref && !onAction && (',
      '{action && actionHref && !onAction && (',
      "next step: condition",
    );

    s = replaceOnce(
      s,
      '<Link href={step.actionHref}>{step.actionLabel}<ArrowRight className="ml-2 h-4 w-4" /></Link>',
      '<Link href={actionHref}>{step.actionLabel}<ArrowRight className="ml-2 h-4 w-4" /></Link>',
      "next step: href",
    );

    return s;
  });
}

function patchOrganizerRecovery() {
  patch(P.organizerRecovery, (s0) => {
    let s = s0;

    s = replaceOnce(
      s,
      'import { Button } from "@/components/ui/button";',
      'import { Button } from "@/components/ui/button";\nimport { tournamentHref, useExperimentalTournamentMode } from "@/features/experimental-tournaments/experimental-tournament-routing";',
      "recovery: routing import",
    );

    s = replaceOnce(
      s,
      `export function OrganizerRecoveryNotice({ tournamentId }: { tournamentId: number }) {
  return (`,
      `export function OrganizerRecoveryNotice({ tournamentId }: { tournamentId: number }) {
  const experimental = useExperimentalTournamentMode();
  return (`,
      "recovery: mode",
    );

    s = replaceOnce(
      s,
      '<Button asChild size="sm"><Link href={`/tournaments/${tournamentId}?tab=security`}>Ustaw hasło organizatora</Link></Button>',
      '<Button asChild size="sm"><Link href={tournamentHref(tournamentId, experimental, "?tab=security")}>Ustaw hasło organizatora</Link></Button>',
      "recovery: href",
    );

    return s;
  });
}

function patchBackupRestore() {
  patch(P.backupRestore, (s0) => {
    let s = s0;

    s = replaceOnce(
      s,
      'import { useToast } from "@/hooks/use-toast";',
      'import { useToast } from "@/hooks/use-toast";\nimport { isExperimentalTournamentPath, tournamentHref } from "@/features/experimental-tournaments/experimental-tournament-routing";',
      "restore: routing import",
    );

    s = replaceOnce(
      s,
      '  const [, navigate] = useLocation();',
      '  const [location, navigate] = useLocation();\n  const experimental = isExperimentalTournamentPath(location);',
      "restore: mode",
    );

    s = replaceOnce(
      s,
      '          navigate(`/tournaments/${result.tournament.id}`);',
      '          navigate(tournamentHref(result.tournament.id, experimental));',
      "restore: navigation",
    );

    return s;
  });
}

function patchSharingPanel() {
  patch(P.sharingPanel, (s0) => {
    let s = s0;

    s = replaceOnce(
      s,
      'import { getGetTournamentQueryKey } from "@workspace/api-client-react";',
      'import { getGetTournamentQueryKey } from "@workspace/api-client-react";\nimport { useExperimentalTournamentMode } from "@/features/experimental-tournaments/experimental-tournament-routing";',
      "sharing: routing import",
    );

    s = replaceOnce(
      s,
      `export function SharingPanel({ tournament, orgToken }: Props) {
  const queryClient = useQueryClient();`,
      `export function SharingPanel({ tournament, orgToken }: Props) {
  const queryClient = useQueryClient();
  const experimental = useExperimentalTournamentMode();
  const tournamentRoot = experimental
    ? "/experimental/tournaments"
    : "/tournaments";`,
      "sharing: mode",
    );

    s = replaceOnce(
      s,
      '    return `${base}/tournaments/${tid}/projector${qs ? `?${qs}` : ""}`;',
      '    return `${base}${tournamentRoot}/${tid}/projector${qs ? `?${qs}` : ""}`;',
      "sharing: projector link",
    );

    s = replaceOnce(
      s,
      `  const links = {
    viewer: \`\${base}/tournaments/\${tid}\`,
    organizer: \`\${base}/tournaments/\${tid}?login=organizer\`,
    support: \`\${base}/tournaments/\${tid}?login=support\`,
    projector: buildObsUrl(),
  };`,
      `  const links = {
    viewer: \`\${base}\${tournamentRoot}/\${tid}\`,
    organizer: \`\${base}\${tournamentRoot}/\${tid}?login=organizer\`,
    support: \`\${base}\${tournamentRoot}/\${tid}?login=support\`,
    projector: buildObsUrl(),
  };`,
      "sharing: direct links",
    );

    return s;
  });
}

function patchStagesPanel() {
  patch(P.stagesPanel, (s0) => {
    let s = s0;

    s = replaceOnce(
      s,
      'import { deriveStageBasketFlowCounts } from "@workspace/stage-basket-flow";',
      'import { deriveStageBasketFlowCounts } from "@workspace/stage-basket-flow";\nimport { isExperimentalTournamentPath, tournamentHref } from "@/features/experimental-tournaments/experimental-tournament-routing";',
      "stages: routing import",
    );

    s = replaceOnce(
      s,
      '  const [location, navigate] = useLocation();',
      '  const [location, navigate] = useLocation();\n  const isExperimental = isExperimentalTournamentPath(location);',
      "stages: mode",
    );

    s = replaceOnce(
      s,
      '`/tournaments/${tournamentId}?tab=players`',
      'tournamentHref(tournamentId, isExperimental, "?tab=players")',
      "stages: players href",
    );

    s = replaceOnce(
      s,
      '<Link href={`/tournaments/${tournamentId}?tab=baskets`}>',
      '<Link href={tournamentHref(tournamentId, isExperimental, "?tab=baskets")}>',
      "stages: baskets href",
    );

    s = replaceEvery(s, 'className="flex items-center justify-center gap-2 rounded-lg border p-10 text-sm text-muted-foreground"', 'className="read-query-state read-query-state--loading flex items-center justify-center gap-2 rounded-lg border p-10 text-sm text-muted-foreground"', "stages: loading states");
    s = replaceEvery(s, 'className="rounded-lg border border-destructive/40 bg-destructive/5 p-5 text-sm text-destructive"', 'className="read-query-state read-query-state--error rounded-lg border border-destructive/40 bg-destructive/5 p-5 text-sm text-destructive"', "stages: error states");
    s = replaceOnce(s, 'className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground"', 'className="organizer-empty-state rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground"', "stages: empty state");

    return s;
  });
}

function patchReadQueryState() {
  patch(P.readQueryState, (s0) => {
    let s = s0;
    s = replaceOnce(s, 'className="w-full rounded-lg border border-destructive/40 bg-card p-4 text-foreground space-y-3"', 'className="read-query-state read-query-state--error w-full rounded-lg border border-destructive/40 bg-card p-4 text-foreground space-y-3"', "read query: error class");
    s = replaceOnce(s, 'className="flex items-center gap-2 p-4 text-sm text-muted-foreground"', 'className="read-query-state read-query-state--loading flex items-center gap-2 p-4 text-sm text-muted-foreground"', "read query: loading class");
    s = replaceOnce(s, 'className="text-xs text-muted-foreground">Odświeżanie danych…', 'className="read-query-state read-query-state--refreshing text-xs text-muted-foreground">Odświeżanie danych…', "read query: refreshing class");
    return s;
  });
}

function patchBasketsPanel() {
  patch(P.basketsPanel, (s0) => {
    let s = s0;
    s = replaceOnce(s, 'className="flex items-center justify-center py-12 text-muted-foreground text-sm"', 'className="organizer-empty-state flex items-center justify-center border border-dashed py-12 text-muted-foreground text-sm"', "baskets: empty state");
    return s;
  });
}

function patchDetail() {
  patch(P.detail, (s0) => {
    let s = s0;

    s = replaceOnce(
      s,
      'import { useRoute, useSearch, Link } from "wouter";',
      'import { useSearch, Link } from "wouter";',
      "detail: wouter",
    );

    s = replaceOnce(
      s,
      'import { PLAYER_STATUS_LABELS, TOURNAMENT_STATUS_LABELS } from "@/lib/tournament-stages-ui";',
      'import { PLAYER_STATUS_LABELS, TOURNAMENT_STATUS_LABELS } from "@/lib/tournament-stages-ui";\nimport { tournamentHref, useTournamentRoute } from "@/features/experimental-tournaments/experimental-tournament-routing";\nimport { ExperimentalTournamentContextBar } from "@/features/experimental-tournaments/experimental-tournament-context-bar";\nimport { ExperimentalTournamentChecklist } from "@/features/experimental-tournaments/experimental-tournament-checklist";\nimport { ExperimentalPlayerToolbar, type ExperimentalPlayerSort, type ExperimentalPlayerStatusFilter } from "@/features/experimental-tournaments/experimental-player-toolbar";\nimport { ExperimentalTournamentOverview } from "@/features/experimental-tournaments/experimental-tournament-overview";',
      "detail: Experimental imports",
    );

    s = replaceOnce(
      s,
      `  const [showViewerModal, setShowViewerModal] = useState(false);
  const [preparedAuthId, setPreparedAuthId] = useState<number | null>(null);`,
      `  const [showViewerModal, setShowViewerModal] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const [playerStatusFilter, setPlayerStatusFilter] = useState<ExperimentalPlayerStatusFilter>("all");
  const [playerSort, setPlayerSort] = useState<ExperimentalPlayerSort>("seed");
  const [preparedAuthId, setPreparedAuthId] = useState<number | null>(null);`,
      "detail: player filter state",
    );

    s = replaceOnce(
      s,
      `  const [, params] = useRoute("/tournaments/:id");
  const search = useSearch();
  const id = params?.id ? parseInt(params.id, 10) : 0;`,
      `  const { id, isExperimental } = useTournamentRoute("detail");
  const search = useSearch();`,
      "detail: route",
    );

    s = replaceOnce(
      s,
      '  const { data: players } = playersQuery;',
      `  const { data: players } = playersQuery;
  const displayedPlayers = useMemo(() => {
    const list = [...(players ?? [])];
    if (!isExperimental) return list;
    const needle = playerSearch.trim().toLocaleLowerCase("pl-PL");
    const filtered = list.filter((player) => {
      const matchesStatus = playerStatusFilter === "all" || player.status === playerStatusFilter;
      const haystack = [player.name, player.teamName, player.rank, player.country].filter(Boolean).join(" ").toLocaleLowerCase("pl-PL");
      return matchesStatus && (!needle || haystack.includes(needle));
    });
    filtered.sort((a, b) => {
      if (playerSort === "name") return a.name.localeCompare(b.name, "pl");
      if (playerSort === "status") return String(a.status ?? "").localeCompare(String(b.status ?? ""), "pl") || a.name.localeCompare(b.name, "pl");
      return (a.seed ?? Number.MAX_SAFE_INTEGER) - (b.seed ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name, "pl");
    });
    return filtered;
  }, [isExperimental, playerSearch, playerSort, playerStatusFilter, players]);`,
      "detail: displayed players",
    );

    s = replaceEvery(
      s,
      'href={`/tournaments/${id}/host`}',
      'href={tournamentHref(id, isExperimental, "/host")}',
      "detail: host links",
    );

    s = replaceEvery(
      s,
      'href={`/tournaments/${id}/audience`}',
      'href={tournamentHref(id, isExperimental, "/audience")}',
      "detail: audience links",
    );

    s = replaceEvery(
      s,
      'href={`/tournaments/${id}/bracket`}',
      'href={tournamentHref(id, isExperimental, "/bracket")}',
      "detail: bracket links",
    );

    s = replaceOnce(
      s,
      '        window.location.href = `/tournaments/${result.tournament.id}`;',
      '        window.location.href = tournamentHref(result.tournament.id, isExperimental);',
      "detail: restored tournament navigation",
    );

    s = replaceOnce(
      s,
      `        <TournamentChecklist
          open={showChecklist && !!id}`,
      `        {isExperimental && (
          <ExperimentalTournamentContextBar
            tournamentId={id}
            tournamentName={tournament.name}
            currentLabel="Panel turnieju"
          />
        )}

        {isExperimental ? (
          <ExperimentalTournamentChecklist
            open={showChecklist && !!id}
            onClose={() => setShowChecklist(false)}
            tournamentId={id ?? 0}
            tournamentName={tournament?.name}
          />
        ) : (
          <TournamentChecklist
            open={showChecklist && !!id}`,
      "detail: Experimental context bar",
    );

    s = replaceOnce(
      s,
      `          tournamentName={tournament?.name}
        />`,
      `          tournamentName={tournament?.name}
          />
        )}`,
      "detail: close Experimental checklist conditional",
    );

    s = replaceOnce(
      s,
      '          <TabsContent value="overview" className="pt-6">',
      `          <TabsContent value="overview" className="pt-6">
            {isExperimental ? (
              <ExperimentalTournamentOverview
                tournamentId={id}
                status={tournament.status}
                formatLabel={FORMAT_LABELS[tournament.format] ?? tournament.format}
                maxPlayers={tournament.maxPlayers}
                stageName={operation.stage?.name}
                roundLabel={operation.summary.roundLabel}
                bestOf={operation.stage?.bestOf ?? tournament.defaultBestOf}
                stats={stats}
                statsLoading={statsQuery.isLoading}
                statsError={statsQuery.isError}
                onRetryStats={() => void statsQuery.refetch()}
                nextStep={nextStep}
              />
            ) : (
              <>`,
      "detail: Experimental overview start",
    );

    s = replaceOnce(
      s,
      `          </TabsContent>

          <TabsContent value="stages" className="pt-2">`,
      `              </>
            )}
          </TabsContent>

          <TabsContent value="stages" className="pt-2">`,
      "detail: Experimental overview end",
    );

    s = replaceOnce(s, '<TabsContent value="stages" className="pt-2">', '<TabsContent value="stages" className={isExperimental ? "pt-2 experimental-stages-surface" : "pt-2"}>', "detail: stages surface");
    s = replaceOnce(s, '<TabsContent value="baskets" className="pt-2">', '<TabsContent value="baskets" className={isExperimental ? "pt-2 experimental-baskets-surface" : "pt-2"}>', "detail: baskets surface");
    s = replaceOnce(s, '<TabsContent value="players" className="pt-6">', '<TabsContent value="players" className={isExperimental ? "pt-6 experimental-players-surface" : "pt-6"}>', "detail: players surface");
    s = replaceOnce(
      s,
      `<TabsContent value="players" className={isExperimental ? "pt-6 experimental-players-surface" : "pt-6"}>
            <div className="grid md:grid-cols-3 gap-6">`,
      `<TabsContent value="players" className={isExperimental ? "pt-6 experimental-players-surface" : "pt-6"}>
            {isExperimental && <ExperimentalPlayerToolbar query={playerSearch} onQueryChange={setPlayerSearch} status={playerStatusFilter} onStatusChange={setPlayerStatusFilter} sort={playerSort} onSortChange={setPlayerSort} total={players?.length ?? 0} visible={displayedPlayers.length} />}
            <div className={\`grid md:grid-cols-3 gap-6 \${isExperimental ? "mt-4" : ""}\`}>`,
      "detail: player toolbar",
    );
    s = replaceOnce(
      s,
      `{players?.length ? (
                      <div className="space-y-2">
                        {players.map((p) => (`,
      `{players?.length ? (
                      <div className={isExperimental ? "experimental-player-list space-y-2" : "space-y-2"}>
                        {isExperimental && displayedPlayers.length === 0 && <div className="organizer-empty-state border border-dashed p-6 text-center text-sm text-muted-foreground">Brak graczy pasujących do wyszukiwania lub filtra.</div>}
                        {(isExperimental ? displayedPlayers : players).map((p) => (`,
      "detail: filtered player rendering",
    );
    s = replaceOnce(s, '<div key={p.id} className="flex flex-col border rounded bg-background">', '<div key={p.id} className={\`flex flex-col border rounded bg-background ${isExperimental ? "experimental-player-row" : ""}\`}>', "detail: player row");
    s = replaceOnce(s, '<div className="text-center py-8 text-muted-foreground">', '<div className={isExperimental ? "organizer-empty-state border border-dashed text-center py-8 text-muted-foreground" : "text-center py-8 text-muted-foreground"}>', "detail: player empty");

    return s;
  });
}

function patchHost() {
  patch(P.host, (s0) => {
    let s = s0;

    s = replaceOnce(
      s,
      'import { useRoute, useSearch, useLocation, Link } from "wouter";',
      'import { useSearch, useLocation, Link } from "wouter";',
      "host: wouter",
    );

    s = replaceOnce(
      s,
      'import { matchOperationError, MATCH_STATUS_LABELS } from "@/lib/match-operation-feedback";',
      'import { matchOperationError, MATCH_STATUS_LABELS } from "@/lib/match-operation-feedback";\nimport { tournamentHref, useTournamentRoute } from "@/features/experimental-tournaments/experimental-tournament-routing";\nimport { ExperimentalTournamentContextBar } from "@/features/experimental-tournaments/experimental-tournament-context-bar";\nimport { ExperimentalHostCommandCenter } from "@/features/experimental-tournaments/experimental-host-command-center";\nimport { ExperimentalHostFocusToggle } from "@/features/experimental-tournaments/experimental-host-focus-toggle";',
      "host: Experimental imports",
    );

    s = replaceOnce(
      s,
      `  const [, params] = useRoute("/tournaments/:id/host");
  const search = useSearch();
  const [, navigate] = useLocation();
  const id = params?.id ? parseInt(params.id, 10) : 0;`,
      `  const { id, isExperimental } = useTournamentRoute("host");
  const search = useSearch();
  const [, navigate] = useLocation();`,
      "host: route",
    );

    s = replaceEvery(
      s,
      'navigate(`/tournaments/${id}/host`)',
      'navigate(tournamentHref(id, isExperimental, "/host"))',
      "host: self navigate",
    );

    s = replaceEvery(
      s,
      '<Link href={`/tournaments/${id}`}',
      '<Link href={tournamentHref(id, isExperimental)}',
      "host: back links",
    );

    s = replaceEvery(
      s,
      'href={`/tournaments/${id}/audience`}',
      'href={tournamentHref(id, isExperimental, "/audience")}',
      "host: audience links",
    );

    s = replaceEvery(
      s,
      'href={`/tournaments/${id}/host?tab=wyniki`}',
      'href={tournamentHref(id, isExperimental, "/host?tab=wyniki")}',
      "host: results links",
    );

    s = replaceEvery(
      s,
      'href={`/tournaments/${id}?tab=stages`}',
      'href={tournamentHref(id, isExperimental, "?tab=stages")}',
      "host: stages links",
    );

    s = replaceEvery(
      s,
      '`${window.location.origin}/tournaments/${id}/host`',
      '`${window.location.origin}${tournamentHref(id, isExperimental, "/host")}`',
      "host: host share URL",
    );

    s = replaceOnce(
      s,
      `        {managementRole && (
          <TournamentOrganizerNavigation`,
      `        {isExperimental && (
          <ExperimentalTournamentContextBar
            tournamentId={id}
            tournamentName={tournament.name}
            currentLabel="Prowadzenie"
          />
        )}

        {managementRole && (
          <TournamentOrganizerNavigation`,
      "host: Experimental context bar",
    );

    s = replaceEvery(
      s,
      '`${window.location.origin}/tournaments/${id}`',
      '`${window.location.origin}${tournamentHref(id, isExperimental)}`',
      "host: viewer share URL",
    );

    s = replaceOnce(
      s,
      '        {tournamentCompleted ? <section aria-label="Podsumowanie turnieju" className="organizer-stage-detail rounded-xl border border-primary/30 bg-card p-4">',
      `        {isExperimental ? (
          <ExperimentalHostCommandCenter
            tournamentId={id}
            stageName={activeStage?.name ?? plannedStage?.name ?? tournament.name}
            formatLabel={activeStage ? STAGE_FORMAT_LABELS[activeStage.format] : undefined}
            roundLabel={operation.summary.roundLabel}
            liveCount={operationalMatches?.filter((match) => match.status === "in_progress").length ?? 0}
            readyCount={pendingQueue.length}
            completedCount={completedMatches.length}
            otherCount={Math.max(0, (operationalMatches?.length ?? 0) - queueMatches.length - completedMatches.length)}
            totalCount={operationalMatches?.length ?? 0}
            nextStepTitle={nextStep?.title}
            championName={championName}
            isCompleted={tournamentCompleted}
            dataLoading={dataLoading}
            dataError={dataError}
          />
        ) : tournamentCompleted ? <section aria-label="Podsumowanie turnieju" className="organizer-stage-detail rounded-xl border border-primary/30 bg-card p-4">`,
      "host: Experimental command center",
    );

    s = replaceOnce(s, '          {capabilities.canManageSharing && <Button variant="outline" size="sm" className="shrink-0" onClick={() => setShowShareDialog(true)}>', '          {isExperimental && <ExperimentalHostFocusToggle />}\n          {capabilities.canManageSharing && <Button variant="outline" size="sm" className="shrink-0" onClick={() => setShowShareDialog(true)}>', "host: Focus toggle");
    s = replaceOnce(s, 'className={`rounded-xl border-2 overflow-hidden transition-colors ${', 'className={`${isExperimental ? "experimental-host-primary" : ""} rounded-xl border-2 overflow-hidden transition-colors ${', "host: primary match class");
    s = replaceOnce(s, 'className={`grid min-w-0 grid-cols-1 items-start gap-4 ${showResultsSidebar ? "xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" : ""}`}', 'className={`${isExperimental ? "experimental-host-secondary" : ""} grid min-w-0 grid-cols-1 items-start gap-4 ${showResultsSidebar ? "xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" : ""}`}', "host: secondary queue class");

    return s;
  });
}

function patchAudience() {
  patch(P.audience, (s0) => {
    let s = s0;

    s = replaceOnce(
      s,
      'import { useRoute, Link, useSearchParams } from "wouter";',
      'import { Link, useSearchParams } from "wouter";',
      "audience: wouter",
    );

    s = replaceOnce(
      s,
      '} from "@/lib/presentation-theme";',
      '} from "@/lib/presentation-theme";\nimport { tournamentHref, useTournamentRoute } from "@/features/experimental-tournaments/experimental-tournament-routing";',
      "audience: routing import",
    );

    s = replaceOnce(
      s,
      `  const [, params] = useRoute("/tournaments/:id/audience");
  const [searchParams] = useSearchParams();`,
      `  const { id, isExperimental } = useTournamentRoute("audience");
  const [searchParams] = useSearchParams();`,
      "audience: route",
    );

    s = replaceOnce(
      s,
      '  const id = params?.id ? parseInt(params.id, 10) : 0;\n',
      '',
      "audience: old id",
    );

    s = replaceEvery(
      s,
      'href={`/tournaments/${id}`}',
      'href={tournamentHref(id, isExperimental)}',
      "audience: management link",
    );

    s = replaceOnce(
      s,
      `            const href = section.id === "live"
              ? \`/tournaments/\${id}/audience\`
              : \`/tournaments/\${id}/audience?section=\${section.id}\`;`,
      `            const href = section.id === "live"
              ? tournamentHref(id, isExperimental, "/audience")
              : tournamentHref(id, isExperimental, \`/audience?section=\${section.id}\`);`,
      "audience: section links",
    );

    s = replaceOnce(
      s,
      'className="min-h-screen bg-background text-white flex flex-col select-none overflow-x-hidden"',
      'className={`min-h-screen bg-background text-white flex flex-col select-none overflow-x-hidden ${isExperimental ? "experimental-tournament-public" : ""}`}',
      "audience: class",
    );

    s = replaceOnce(
      s,
      'className="min-w-0 flex-1 font-bold text-sm sm:text-base truncate"',
      'className={isExperimental ? "min-w-0 flex-1 break-words font-bold text-sm sm:text-base" : "min-w-0 flex-1 font-bold text-sm sm:text-base truncate"}',
      "audience: readable tournament name",
    );

    return s;
  });
}

function patchBracket() {
  patch(P.bracket, (s0) => {
    let s = s0;

    s = replaceOnce(
      s,
      'import { useRoute } from "wouter";\n',
      '',
      "bracket: wouter",
    );

    s = replaceOnce(
      s,
      'import { selectPublicStage, publicStageBracket, publicStageLabel } from "@/lib/public-stage";',
      'import { selectPublicStage, publicStageBracket, publicStageLabel } from "@/lib/public-stage";\nimport { tournamentHref, useTournamentRoute } from "@/features/experimental-tournaments/experimental-tournament-routing";',
      "bracket: routing import",
    );

    s = replaceOnce(
      s,
      `  const [, params] = useRoute("/tournaments/:id/bracket");
  const id = params?.id ? parseInt(params.id, 10) : 0;`,
      '  const { id, isExperimental } = useTournamentRoute("bracket");',
      "bracket: route",
    );

    s = replaceOnce(
      s,
      'className={`${isSingleElimination ? "h-dvh" : "min-h-screen"} min-w-0 max-w-full bg-background text-foreground flex flex-col overflow-hidden`}',
      'className={`${isSingleElimination ? "h-dvh" : "min-h-screen"} min-w-0 max-w-full bg-background text-foreground flex flex-col overflow-hidden ${isExperimental ? "experimental-tournament-stage-view" : ""}`}',
      "bracket: class",
    );

    s = replaceEvery(
      s,
      'href={`/tournaments/${id}`}',
      'href={tournamentHref(id, isExperimental)}',
      "bracket: back link",
    );

    return s;
  });
}

function patchProjector() {
  patch(P.projector, (s0) => {
    let s = s0;

    s = replaceOnce(
      s,
      'import { useRoute, useSearch } from "wouter";',
      'import { useSearch } from "wouter";',
      "projector: wouter",
    );

    s = replaceOnce(
      s,
      'import { selectPublicStage, publicStageBracket, publicStageLabel } from "@/lib/public-stage";',
      'import { selectPublicStage, publicStageBracket, publicStageLabel } from "@/lib/public-stage";\nimport { useTournamentRoute } from "@/features/experimental-tournaments/experimental-tournament-routing";',
      "projector: routing import",
    );

    s = replaceOnce(
      s,
      `  const [, params] = useRoute("/tournaments/:id/projector");
  const search = useSearch();
  const id = params?.id ? parseInt(params.id, 10) : 0;`,
      `  const { id } = useTournamentRoute("projector");
  const search = useSearch();`,
      "projector: route",
    );

    return s;
  });
}

export function install() {
  installTemplates();
  patchApp();
  patchIndexCss();
  patchLayout();
  patchAppNavigation();
  patchTournamentsHome();
  patchDashboard();
  patchSupportEntry();
  patchFanView();
  patchOrganizerNavigation();
  patchOrganizerNextStep();
  patchOrganizerRecovery();
  patchBackupRestore();
  patchSharingPanel();
  patchReadQueryState();
  patchStagesPanel();
  patchBasketsPanel();
  patchDetail();
  patchHost();
  patchAudience();
  patchBracket();
  patchProjector();
}

export function assertInstalled() {
  const current = state();
  if (!current.installed) {
    fail("Nie wykryto kompletnej instalacji Pack 02 po audycie repo.");
  }

  const checks = [
    [P.layout, ["experimental-tournament-shell", "experimental-skip-link"]],
    [P.appNavigation, ["tournamentRoleHomeHref", "isExperimentalTournamentPath"]],
    [P.tournamentsHome, ["experimental-entry-hero", "tournamentRoleHomeHref"]],
    [P.dashboard, ["experimental-dashboard-card", "ExperimentalDashboardToolbar", "ExperimentalTestDataDialog", "ExperimentalDeleteTournamentDialog", "filteredTournaments"]],
    [P.supportEntry, ["tournamentHref(selectedId, isExperimental", "experimental-tournament-entry"]],
    [P.fanView, ['tournamentHref(t.id, isExperimental, "/audience")']],
    [P.organizerNavigation, ["tournamentModeHref", "isExperimentalTournamentPath"]],
    [P.organizerNextStep, ["tournamentModeHref", "actionHref"]],
    [P.organizerRecovery, ['tournamentHref(tournamentId, experimental, "?tab=security")']],
    [P.backupRestore, ["tournamentHref(result.tournament.id, experimental)"]],
    [P.sharingPanel, ['"/experimental/tournaments"', "tournamentRoot"]],
    [P.stagesPanel, ['tournamentHref(tournamentId, isExperimental, "?tab=players")', "organizer-empty-state", "read-query-state--loading"]],
    [P.basketsPanel, ["organizer-empty-state"]],
    [P.readQueryState, ["read-query-state--error", "read-query-state--loading", "read-query-state--refreshing"]],
    [P.detail, ['useTournamentRoute("detail")', "ExperimentalTournamentOverview", "ExperimentalTournamentContextBar", "ExperimentalTournamentChecklist", "ExperimentalPlayerToolbar", "displayedPlayers", "experimental-stages-surface", "experimental-baskets-surface", "experimental-players-surface", "statsQuery"]],
    [P.host, ['useTournamentRoute("host")', "ExperimentalHostCommandCenter", "ExperimentalTournamentContextBar", "ExperimentalHostFocusToggle", "experimental-host-primary", "experimental-host-secondary"]],
    [P.audience, ['useTournamentRoute("audience")', "experimental-tournament-public"]],
    [P.bracket, ['useTournamentRoute("bracket")', "experimental-tournament-stage-view"]],
    [P.projector, ['useTournamentRoute("projector")']],
    [P.expUi, ["ExperimentalMetricCard", "ExperimentalStatePanel", "ExperimentalQuickLink"]],
    [P.dashboardToolbar, ["ExperimentalDashboardToolbar"]],
    [P.dashboardDialogs, ["ExperimentalTestDataDialog", "ExperimentalDeleteTournamentDialog"]],
    [P.density, ["ExperimentalDensityControl", "experimental-density-compact"]],
    [P.expChecklist, ["ExperimentalTournamentChecklist", "tm_exp_checklist_"]],
    [P.contextBar, ["ExperimentalTournamentContextBar", "experimental-context-bar"]],
    [P.hostCenter, ["ExperimentalHostCommandCenter", "experimental-host-command-center"]],
    [P.hostFocus, ["ExperimentalHostFocusToggle", "tm_exp_host_focus_v1"]],
    [P.playerToolbar, ["ExperimentalPlayerToolbar", "ExperimentalPlayerStatusFilter"]],
    [P.overview, ["ExperimentalTournamentOverview", "setupSteps", "Przebieg konfiguracji", "tournamentHref"]],
    [P.containmentTest, ["experimental route surface is registered"]],
  ];

  for (const [rel, markers] of checks) {
    const content = read(rel);
    for (const marker of markers) {
      if (!content.includes(marker)) {
        fail(`Brak markera ${marker} w ${rel}.`);
      }
    }
  }

  // Guard against the most important route leaks found in the repo audit.
  const leakChecks = [
    [P.organizerNextStep, /<Link href=\{step\.actionHref\}/],
    [P.organizerRecovery, /href=\{`\/tournaments\/\$\{tournamentId\}/],
    [P.stagesPanel, /`\/tournaments\/\$\{tournamentId\}\?tab=(?:players|baskets)/],
    [P.backupRestore, /navigate\(`\/tournaments\/\$\{result\.tournament\.id\}`\)/],
    [P.fanView, /href=\{`\/tournaments\/\$\{t\.id\}\/audience`\}/],
    [P.supportEntry, /navigate\(`\/tournaments\/\$\{selectedId\}\/host`\)/],
    [P.detail, /window\.location\.href = `\/tournaments\/\$\{result\.tournament\.id\}`/],
  ];

  for (const [rel, pattern] of leakChecks) {
    if (pattern.test(read(rel))) {
      fail(`Pozostał route leak Stable w ${rel}: ${pattern}`);
    }
  }
}

export function rollback() {
  const dir = abs(BACKUP);
  const manifestFile = path.join(dir, "manifest.json");
  if (!fs.existsSync(manifestFile)) fail(`Brak backupu ${BACKUP}.`);

  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  if (manifest.pack !== PACK) {
    fail("Backup nie należy do tej wersji Pack 02.");
  }

  for (const rel of manifest.existing) {
    const source = path.join(dir, rel);
    if (!fs.existsSync(source)) continue;
    fs.mkdirSync(path.dirname(abs(rel)), { recursive: true });
    fs.copyFileSync(source, abs(rel));
  }

  for (const rel of manifest.created) {
    fs.rmSync(abs(rel), { force: true });
  }

  fs.rmSync(dir, { recursive: true, force: true });
}

export function runPnpm(args) {
  const env = {
    ...process.env,
    TSX_TSCONFIG_PATH: path.resolve(
      root(),
      "artifacts/tournament-manager/test/tsconfig.json",
    ),
  };

  let result;
  if (process.platform === "win32") {
    const comspec =
      process.env.ComSpec ||
      process.env.COMSPEC ||
      "C:\\Windows\\System32\\cmd.exe";
    const line = ["pnpm", ...args]
      .map((part) =>
        /[\s"&|<>^]/.test(part)
          ? `"${String(part).replaceAll('"', '""')}"`
          : String(part),
      )
      .join(" ");

    result = spawnSync(comspec, ["/d", "/s", "/c", line], {
      cwd: root(),
      stdio: "inherit",
      shell: false,
      env,
    });
  } else {
    result = spawnSync("pnpm", args, {
      cwd: root(),
      stdio: "inherit",
      shell: false,
      env,
    });
  }

  if (result.error) {
    fail(`Nie można uruchomić pnpm: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`pnpm zakończył się kodem ${result.status}.`);
  }
}
