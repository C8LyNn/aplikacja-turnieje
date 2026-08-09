import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type {
  Match,
  StageStartReadiness,
  Tournament,
  TournamentStage,
} from "@workspace/api-client-react";
import { PasswordField } from "../components/password-field";
import { OrganizerNextStep } from "../components/organizer-next-step";
import {
  legacyMatchesRedirectTarget,
  organizerDetailTab,
  organizerHostTab,
  organizerMoreItems,
} from "../components/tournament-organizer-navigation";
import {
  focusInvalidCreateTournamentField,
  organizerPasswordError,
  organizerPasswordRemaining,
  tournamentNameError,
} from "./create-tournament-validation";
import {
  deriveOrganizerCapabilities,
  NO_ORGANIZER_CAPABILITIES,
  type OrganizerCapabilities,
} from "./organizer-capabilities";
import {
  availableStageStartReadiness,
  deriveOrganizerNextStep,
} from "./organizer-next-step";

const tournament = (status: Tournament["status"] = "active"): Tournament => ({
  id: 41,
  name: "Test",
  format: "swiss",
  status,
  resultModelVersion: "series_v1",
  rankingPolicy: "match_record_v1",
  defaultBestOf: 1,
  hasHostCode: false,
  hasOrganizerPassword: false,
  hasSupportPassword: false,
  activeStageId: status === "active" ? 11 : null,
  createdAt: "2026-01-01T00:00:00.000Z",
});

const stage = (overrides: Partial<TournamentStage> = {}): TournamentStage => ({
  id: 11,
  tournamentId: 41,
  stageKey: "stage-1",
  position: 1,
  name: "Etap 1",
  format: "swiss",
  status: "planned",
  participantCount: 8,
  bestOf: 1,
  plannedRounds: 3,
  currentRound: null,
  totalRounds: 3,
  rankingPolicy: "swiss_v1",
  qualificationMode: "top_n",
  advancingCount: 4,
  seedingPolicy: "standings_order",
  entrySeedingPolicy: "preserve",
  resultSeedingPolicy: "standings_order",
  randomRevealOrder: "sequential",
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const readiness = (ready: boolean, message = ready ? "Gotowy." : "Brak składu."): StageStartReadiness => ({
  ready,
  reasonCode: ready ? "READY" : "STAGE_PARTICIPANTS_INCONSISTENT",
  message,
  participantCount: ready ? 8 : 7,
  requiredParticipantCount: 8,
  missingSeeds: ready ? [] : [8],
  blockingMatches: 0,
  blockingGroups: 0,
  format: "swiss",
});

const match = (id: number, status: Match["status"], overrides: Partial<Match> = {}): Match => ({
  id,
  tournamentId: 41,
  stageId: 11,
  round: 1,
  matchNumber: id,
  bestOf: 1,
  status,
  ...overrides,
});

const organizerCapabilities = deriveOrganizerCapabilities({
  role: "organizer",
  tournament: tournament(),
  hasOrganizerToken: true,
  hasSupportSession: false,
});
const supportCapabilities = deriveOrganizerCapabilities({
  role: "support",
  tournament: tournament(),
  hasOrganizerToken: false,
  hasSupportSession: true,
});

function nextStep(input: {
  tournament?: Tournament;
  stages: TournamentStage[];
  matches?: Match[];
  capabilities?: OrganizerCapabilities;
  readiness?: StageStartReadiness;
  surface?: "details" | "conducting";
}) {
  return deriveOrganizerNextStep({
    tournament: input.tournament ?? tournament(),
    stages: input.stages,
    matches: input.matches,
    capabilities: input.capabilities ?? organizerCapabilities,
    plannedStageReadiness: input.readiness,
    surface: input.surface ?? "details",
  });
}

test("optional organizer password accepts 0 and >=8, and rejects 1-7", () => {
  for (const [length, accepted] of [[0, true], [1, false], [7, false], [8, true], [20, true]] as const) {
    const value = "x".repeat(length);
    assert.equal(organizerPasswordError(value) == null, accepted, `length ${length}`);
  }
  assert.equal(organizerPasswordRemaining("1234567"), 1);
});

test("invalid name and password focus the first actual invalid field", () => {
  let focused = "";
  assert.equal(tournamentNameError("   "), "Podaj nazwę turnieju.");
  assert.equal(focusInvalidCreateTournamentField({
    name: "",
    organizerPassword: "1234567",
    nameElement: { focus: () => { focused = "name"; } },
    organizerPasswordElement: { focus: () => { focused = "password"; } },
  }), "name");
  assert.equal(focused, "name");
});

test("minimum password guidance is linked to the input", () => {
  const html = renderToStaticMarkup(
    <PasswordField
      id="organizer-password"
      label="Hasło organizatora"
      value=""
      onChange={() => undefined}
      visible={false}
      onToggle={() => undefined}
      minLength={8}
      description="Minimum 8 znaków"
    />,
  );
  assert.match(html, /Minimum 8 znaków/);
  assert.match(html, /minLength="8"/);
  assert.match(html, /aria-describedby="organizer-password-help"/);
});

test("capabilities follow the manually recorded backend role matrix", () => {
  const legacy = deriveOrganizerCapabilities({
    role: "organizer",
    tournament: { ...tournament(), hasHostCode: true },
    hasOrganizerToken: false,
    hasSupportSession: false,
    hasVerifiedLegacyHost: true,
  });
  const invalidLegacy = deriveOrganizerCapabilities({
    role: "organizer",
    tournament: { ...tournament(), hasHostCode: true },
    hasOrganizerToken: false,
    hasSupportSession: false,
    hasVerifiedLegacyHost: false,
  });
  const viewer = deriveOrganizerCapabilities({
    role: "fan",
    tournament: tournament(),
    hasOrganizerToken: false,
    hasSupportSession: false,
  });

  const operations: Array<{
    name: string;
    capability: keyof OrganizerCapabilities;
    expected: [boolean, boolean, boolean, boolean, boolean];
  }> = [
    { name: "StartStage", capability: "canManageLifecycle", expected: [true, false, false, false, false] },
    { name: "CompleteStage", capability: "canManageLifecycle", expected: [true, false, false, false, false] },
    { name: "GenerateRound", capability: "canGenerateRound", expected: [true, true, false, false, false] },
    { name: "SaveResult", capability: "canWriteTournamentResults", expected: [true, true, false, false, false] },
    { name: "RevertResult", capability: "canWriteTournamentResults", expected: [true, true, false, false, false] },
    { name: "Undo", capability: "canUndo", expected: [true, true, false, false, false] },
    { name: "Participants/CSV", capability: "canManageParticipants", expected: [true, true, true, false, false] },
    { name: "swap/reorder/cancel", capability: "canUseLegacyMatchTools", expected: [true, true, true, false, false] },
    { name: "Backup", capability: "canManageBackup", expected: [true, false, false, false, false] },
    { name: "Security", capability: "canManageOrganizerSettings", expected: [true, false, false, false, false] },
    { name: "Sharing", capability: "canManageSharing", expected: [true, false, false, false, false] },
  ];
  const roles = [organizerCapabilities, supportCapabilities, legacy, invalidLegacy, viewer];
  for (const operation of operations) {
    assert.deepEqual(
      roles.map((capabilities) => capabilities[operation.capability]),
      operation.expected,
      operation.name,
    );
  }
  assert.deepEqual(invalidLegacy, NO_ORGANIZER_CAPABILITIES);
  assert.deepEqual(viewer, NO_ORGANIZER_CAPABILITIES);
});

test("direct organizer-only tabs fall back safely without capability", () => {
  assert.equal(organizerDetailTab("?tab=security", supportCapabilities), "stages");
  assert.equal(organizerDetailTab("?tab=backup", supportCapabilities), "stages");
  assert.equal(organizerDetailTab("?tab=security", NO_ORGANIZER_CAPABILITIES), "overview");
  assert.equal(organizerDetailTab("?tab=backup", organizerCapabilities), "backup");
  assert.equal(organizerHostTab("?tab=korekta", supportCapabilities), "korekta");
  assert.equal(organizerHostTab("?tab=korekta", NO_ORGANIZER_CAPABILITIES), "prowadzenie");
});

test("historical matches URL redirects only an authenticated match operator", () => {
  assert.equal(
    legacyMatchesRedirectTarget(41, "?tab=matches", organizerCapabilities),
    "/tournaments/41/host?tab=prowadzenie",
  );
  assert.equal(legacyMatchesRedirectTarget(41, "?tab=matches", NO_ORGANIZER_CAPABILITIES), null);
  assert.equal(organizerDetailTab("?tab=matches", NO_ORGANIZER_CAPABILITIES), "matches");
});

test("More exposes only areas backed by each credential", () => {
  assert.deepEqual(organizerMoreItems(41, organizerCapabilities).map((item) => item.label), [
    "Historia", "Korekta", "Udostępnianie", "Backup", "Bezpieczeństwo",
  ]);
  assert.deepEqual(organizerMoreItems(41, supportCapabilities).map((item) => item.label), ["Historia", "Korekta"]);
});

test("planned stage without proven readiness has no start CTA", () => {
  const model = nextStep({ stages: [stage()], matches: [], readiness: readiness(false) });
  assert.equal(model.kind, "stage_preparation");
  assert.equal(model.actionLabel, undefined);
});

test("planned stage with backend readiness gets one organizer start CTA", () => {
  const model = nextStep({ tournament: tournament("draft"), stages: [stage()], matches: [], readiness: readiness(true) });
  assert.equal(model.kind, "planned_stage");
  assert.equal(model.actionLabel, "Rozpocznij etap");
});

test("ready to roster mutation to pending refetch hides CTA until not-ready arrives", () => {
  const ready = readiness(true);
  assert.equal(nextStep({ stages: [stage()], matches: [], readiness: ready }).actionLabel, "Rozpocznij etap");
  assert.equal(
    nextStep({
      stages: [stage()],
      matches: [],
      readiness: availableStageStartReadiness(ready, true),
    }).actionLabel,
    undefined,
  );
  assert.equal(
    nextStep({
      stages: [stage()],
      matches: [],
      readiness: availableStageStartReadiness(readiness(false), false),
    }).actionLabel,
    undefined,
  );
});

test("support never receives a lifecycle CTA for a ready planned stage", () => {
  const model = nextStep({
    tournament: tournament("draft"),
    stages: [stage()],
    matches: [],
    readiness: readiness(true),
    capabilities: supportCapabilities,
  });
  assert.equal(model.actionLabel, "Rozpocznij etap");
  const later = nextStep({
    stages: [stage({ status: "completed" }), stage({ id: 12, position: 2, stageKey: "stage-2" })],
    matches: [],
    readiness: readiness(true),
    capabilities: supportCapabilities,
  });
  assert.equal(later.kind, "next_stage");
  assert.equal(later.actionLabel, undefined);
});

test("loading and an active stage without matches never imply completion", () => {
  const active = stage({ status: "active", currentRound: 1 });
  assert.equal(nextStep({ stages: [active] }).kind, "not_ready");
  const empty = nextStep({ stages: [active], matches: [] });
  assert.equal(empty.kind, "stage_not_materialized");
  assert.equal(empty.actionLabel, undefined);
});

test("a cancelled match is not completed under CompleteStage semantics", () => {
  const active = stage({ status: "active", currentRound: 3 });
  const model = nextStep({ stages: [active], matches: [match(1, "completed"), match(2, "cancelled")] });
  assert.equal(model.kind, "active_matches");
  assert.equal(model.description.includes("pozostało 1"), true);
});

test("all required round-robin matches completed enable CompleteStage only for organizer", () => {
  const active = stage({
    status: "active",
    format: "round_robin",
    participantCount: 2,
    plannedRounds: null,
    currentRound: 1,
    totalRounds: 1,
    rankingPolicy: "round_robin_v1",
    qualificationMode: "none",
    advancingCount: null,
  });
  const completed = [match(1, "completed")];
  const organizer = nextStep({ stages: [active], matches: completed });
  const support = nextStep({ stages: [active], matches: completed, capabilities: supportCapabilities });
  assert.equal(organizer.kind, "complete_stage");
  assert.equal(organizer.actionLabel, "Zakończ etap");
  assert.equal(support.kind, "complete_stage");
  assert.equal(support.actionLabel, undefined);
});

test("Swiss distinguishes a next round from the final round", () => {
  const swiss = stage({ status: "active", currentRound: 1, plannedRounds: 2, totalRounds: 2, participantCount: 2 });
  const nextRound = nextStep({ stages: [swiss], matches: [match(1, "completed")] });
  assert.equal(nextRound.kind, "swiss_round");
  assert.equal(nextRound.actionLabel, "Wygeneruj rundę 2");
  const final = stage({ ...swiss, currentRound: 2 });
  const finalStep = nextStep({
    stages: [final],
    matches: [match(1, "completed"), match(2, "completed", { round: 2 })],
  });
  assert.equal(finalStep.kind, "complete_stage");
});

test("no stages is neutral and completed tournament is explicitly completed", () => {
  const missing = nextStep({ stages: [], matches: [] });
  assert.equal(missing.kind, "no_stages");
  const completed = nextStep({ tournament: tournament("completed"), stages: [], matches: [] });
  assert.equal(completed.kind, "completed");
});

test("Next Step renders at most one primary CTA", () => {
  const model = nextStep({
    tournament: tournament("draft"),
    stages: [stage()],
    matches: [],
    readiness: readiness(true),
  });
  const html = renderToStaticMarkup(<OrganizerNextStep step={model} onAction={() => undefined} />);
  assert.equal((html.match(/<button/g) ?? []).length, 1);
});
