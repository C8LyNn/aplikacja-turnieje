// QW-09 · the pure settings-copy builder: what it refuses and what it never carries over.
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSettingsCopy, SettingsCopyError } from "../src/domain/tournament/settings-copy";

const tournament = {
  id: 5, name: "Puchar", description: null, format: "single_elimination", status: "completed", maxPlayers: 8, swissRounds: null,
  defaultBestOf: 1, basketFlowAuthorityVersion: 0, visibility: "public_online", participantType: "players", teamRosterMin: null,
  teamRosterMax: null, participantFields: null, registrationSettings: { version: 1, enabled: true, open: true, approval: "auto", capacity: 8, note: null },
  presentationSettings: null, organizerPasswordHash: "hash", supportPasswordHash: "hash", viewerPasswordHash: null, winnerId: 3,
} as never;
const stage = {
  id: 9, tournamentId: 5, stageKey: "puchar", position: 1, name: "Puchar", format: "single_elimination", status: "completed",
  participantCount: 8, bestOf: 1, plannedRounds: null, roundRobinLegs: 1, leagueRules: null, matchRules: null, scheduleTimeZone: null,
  schedulePlan: null, qualificationMode: "none", advancingCount: null, groupCount: null, participantsPerGroup: null, qualifiersPerGroup: null,
  seedingPolicy: "standard_bracket", entrySeedingPolicy: "registration_order", resultSeedingPolicy: "standings_order", randomSeed: null,
  randomRevealOrder: "instant", winnerId: 3,
} as never;

const code = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SettingsCopyError ? error.code : String(error); } return "ok"; };

test("QW-09 builder: refuses custom advancement baskets and bad sizes; copies no secrets or results", () => {
  assert.equal(code(() => buildSettingsCopy(tournament, [stage], null, { hasCustomBaskets: true })), "SETTINGS_COPY_UNSUPPORTED");
  assert.equal(code(() => buildSettingsCopy({ ...(tournament as object), basketFlowAuthorityVersion: 1 } as never, [stage], null)), "SETTINGS_COPY_UNSUPPORTED");
  assert.equal(code(() => buildSettingsCopy(tournament, [], null)), "SETTINGS_COPY_UNSUPPORTED");
  for (const participantCount of [1, 1025, 2.5]) {
    assert.equal(code(() => buildSettingsCopy(tournament, [stage], null, { participantCount })), "INVALID_SETTINGS_COPY");
  }
  const copy = buildSettingsCopy(tournament, [stage], null, { participantCount: 6 });
  const text = JSON.stringify(copy);
  assert.doesNotMatch(text, /hash|winner|"status"/i, "no passwords, winners or states");
  assert.equal((copy.body.stagePlan as { initialParticipantCount: number }).initialParticipantCount, 6);
  assert.deepEqual(copy.columns.registrationSettings, { version: 1, enabled: true, open: false, approval: "auto", capacity: 8, note: null });
  assert.equal(copy.summary.signups, "closed");
  assert.equal(copy.summary.mode, "plan");
});

test("QW-09 builder: a random draw always gets a new key; a fixed draw stays without one", () => {
  const random = { ...(stage as object), seedingPolicy: "random_bracket", randomSeed: "stary-klucz" } as never;
  const copy = buildSettingsCopy(tournament, [random], null, { drawKey: () => "nowy-klucz" });
  const [planned] = (copy.body.stagePlan as { stages: Array<Record<string, unknown>> }).stages;
  assert.equal(planned.randomSeed, "nowy-klucz");
  assert.equal(planned.placementMethod, "random");
  const [fixed] = (buildSettingsCopy(tournament, [stage], null).body.stagePlan as { stages: Array<Record<string, unknown>> }).stages;
  assert.equal("randomSeed" in fixed, false);
});
