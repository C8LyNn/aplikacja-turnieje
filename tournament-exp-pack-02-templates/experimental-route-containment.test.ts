import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, "..", "..");

function read(relative: string): string {
  return readFileSync(path.join(src, relative), "utf8");
}

test("experimental route surface is registered", () => {
  const app = read("App.tsx");
  for (const route of [
    "/experimental/tournaments",
    "/experimental/tournaments/dashboard",
    "/experimental/tournaments/support",
    "/experimental/tournaments/fan",
    "/experimental/tournaments/new",
    "/experimental/tournaments/:id",
    "/experimental/tournaments/:id/host",
    "/experimental/tournaments/:id/audience",
    "/experimental/tournaments/:id/bracket",
    "/experimental/tournaments/:id/projector",
  ]) {
    assert.ok(app.includes(route), `missing route ${route}`);
  }
});

test("known navigation leaks stay route-aware", () => {
  const expectations: Array<[string, string]> = [
    ["components/organizer-next-step.tsx", "tournamentModeHref"],
    ["components/organizer-recovery-notice.tsx", "tournamentHref"],
    ["components/backup-restore-dialog.tsx", "tournamentHref"],
    ["components/sharing-panel.tsx", "tournamentRoot"],
    ["components/tournament-stages-panel.tsx", "tournamentHref"],
    ["pages/support-entry.tsx", "tournamentHref"],
    ["pages/fan-view.tsx", "tournamentHref"],
    ["pages/tournament-detail.tsx", "useTournamentRoute"],
    ["pages/tournament-host.tsx", "useTournamentRoute"],
    ["pages/tournament-audience.tsx", "useTournamentRoute"],
    ["pages/tournament-bracket.tsx", "useTournamentRoute"],
    ["pages/tournament-projector.tsx", "useTournamentRoute"],
  ];

  for (const [file, marker] of expectations) {
    assert.ok(read(file).includes(marker), `${file} lost ${marker}`);
  }
});

test("detail restore does not force a Stable tournament URL", () => {
  const detail = read("pages/tournament-detail.tsx");
  assert.equal(
    detail.includes("window.location.href = `/tournaments/${result.tournament.id}`"),
    false,
  );
  assert.ok(
    detail.includes("window.location.href = tournamentHref(result.tournament.id, isExperimental)"),
  );
});

test("experimental overview and dashboard filters are wired", () => {
  const detail = read("pages/tournament-detail.tsx");
  const dashboard = read("pages/dashboard.tsx");
  assert.ok(detail.includes("<ExperimentalTournamentOverview"));
  assert.ok(dashboard.includes("<ExperimentalDashboardToolbar"));
  assert.ok(dashboard.includes("filteredTournaments"));
});


test("experimental density control remains presentation-only", () => {
  const layout = read("components/layout.tsx");
  const density = read("features/experimental-tournaments/experimental-density-control.tsx");
  assert.ok(layout.includes("<ExperimentalDensityControl"));
  assert.ok(density.includes("tm_exp_density_v1"));
  assert.equal(density.includes("@workspace/api-client-react"), false);
});

test("experimental overview lifecycle is descriptive, not a second readiness engine", () => {
  const overview = read("features/experimental-tournaments/experimental-tournament-overview.tsx");
  assert.ok(overview.includes("Przebieg konfiguracji"));
  assert.ok(overview.includes("nie drugi system readiness"));
  assert.equal(overview.includes("buildSingleStageSeedingPlan"), false);
});


test("organizer Experimental surfaces expose shared context and Host command center", () => {
  const detail = read("pages/tournament-detail.tsx");
  const host = read("pages/tournament-host.tsx");
  assert.ok(detail.includes("<ExperimentalTournamentContextBar"));
  assert.ok(host.includes("<ExperimentalTournamentContextBar"));
  assert.ok(host.includes("<ExperimentalHostCommandCenter"));
});

test("Experimental Host command center is presentation-only", () => {
  const center = read("features/experimental-tournaments/experimental-host-command-center.tsx");
  assert.ok(center.includes("ExperimentalMetricCard"));
  assert.ok(center.includes("tournamentHref"));
  assert.equal(center.includes("@workspace/api-client-react"), false);
  assert.equal(center.includes("fetch("), false);
});


test("Experimental dashboard uses Radix-backed dialogs instead of legacy overlays", () => {
  const dashboard = read("pages/dashboard.tsx");
  const dialogs = read("features/experimental-tournaments/experimental-dashboard-dialogs.tsx");
  assert.ok(dashboard.includes("<ExperimentalTestDataDialog"));
  assert.ok(dashboard.includes("<ExperimentalDeleteTournamentDialog"));
  assert.ok(dialogs.includes("<Dialog open={open}"));
  assert.ok(dialogs.includes("<DialogContent"));
});

test("Experimental checklist uses current organizer-password model", () => {
  const checklist = read("features/experimental-tournaments/experimental-tournament-checklist.tsx");
  assert.ok(checklist.includes("Dostęp organizatora i wsparcia sprawdzony"));
  assert.equal(checklist.includes("Kod prowadzącego ustawiony"), false);
  assert.ok(checklist.includes("nie źródło reguł turnieju"));
});


test("Experimental player workspace stays frontend-only", () => {
  const detail = read("pages/tournament-detail.tsx");
  const toolbar = read("features/experimental-tournaments/experimental-player-toolbar.tsx");
  assert.ok(detail.includes("<ExperimentalPlayerToolbar"));
  assert.ok(detail.includes("displayedPlayers"));
  assert.ok(detail.includes("experimental-players-surface"));
  assert.equal(toolbar.includes("@workspace/api-client-react"), false);
});

test("Experimental Stage and Basket surfaces are presentation wrappers", () => {
  const detail = read("pages/tournament-detail.tsx");
  assert.ok(detail.includes("experimental-stages-surface"));
  assert.ok(detail.includes("experimental-baskets-surface"));
});

test("Host Focus mode has a safe keyboard escape and no API dependency", () => {
  const host = read("pages/tournament-host.tsx");
  const focus = read("features/experimental-tournaments/experimental-host-focus-toggle.tsx");
  assert.ok(host.includes("<ExperimentalHostFocusToggle"));
  assert.ok(host.includes("experimental-host-primary"));
  assert.ok(host.includes("experimental-host-secondary"));
  assert.ok(focus.includes('event.key === "Escape"'));
  assert.ok(focus.includes('event.key.toLowerCase() === "f"'));
  assert.equal(focus.includes("@workspace/api-client-react"), false);
});

test("shared query states expose semantic styling hooks", () => {
  const state = read("components/read-query-state.tsx");
  assert.ok(state.includes("read-query-state--error"));
  assert.ok(state.includes("read-query-state--loading"));
  assert.ok(state.includes("read-query-state--refreshing"));
});
