import assert from "node:assert/strict";
import { describe, test } from "node:test";

const ceremonyModule = import("../src/application/stages/seeding-ceremony");


async function functions() {
  return ceremonyModule;
}

function fixture(count = 24) {
  const stage = {
    id: 10,
    tournamentId: 5,
    stageKey: "stage-1",
    position: 1,
    name: "Losowanie",
    format: "single_elimination",
    status: "planned",
    participantCount: count,
    bestOf: 1,
    plannedRounds: null,
    currentRound: null,
    totalRounds: null,
    rankingPolicy: "elimination_bracket_v1",
    qualificationMode: "none",
    advancingCount: null,
    groupCount: null,
    participantsPerGroup: null,
    qualifiersPerGroup: null,
    seedingPolicy: "standard_bracket",
    entrySeedingPolicy: "random",
    resultSeedingPolicy: "standings_order",
    randomSeed: "ceremony-test-seed",
    randomRevealOrder: "sequential",
    seedingAudit: null,
    winnerId: null,
    version: 1,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    startedAt: null,
    completedAt: null,
  } as any;
  const memberships = Array.from({ length: count }, (_, index) => ({
    id: index + 100,
    tournamentId: 5,
    stageId: 10,
    playerId: index + 1,
    stageSeed: index + 1,
    groupId: null,
    status: "active",
    qualificationSource: "registration",
    finalRank: null,
    groupRank: null,
    qualificationRank: null,
    nextStageSeed: null,
    sourceStageParticipantId: null,
    qualifiedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  })) as any[];
  const players = Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    tournamentId: 5,
    name: `Player ${index + 1}`,
    rank: null,
    country: null,
    teamName: null,
    seed: index + 1,
    status: "active",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  })) as any[];
  return { stage, memberships, players };
}

describe("seeding ceremony", () => {
  test("prepares 24 unique deterministic sequential draws without mutating participants", async () => {
    const { buildSeedingCeremonyState } = await functions();
    const input = fixture();
    const before = JSON.stringify(input.memberships);
    const first = buildSeedingCeremonyState({ ...input, now: new Date("2026-01-02T00:00:00.000Z") });
    const second = buildSeedingCeremonyState({ ...input, now: new Date("2026-01-02T00:00:00.000Z") });

    assert.equal(first.status, "prepared");
    assert.equal(first.revealedCount, 0);
    assert.equal(first.drawMode, "seed");
    assert.equal(first.draws.length, 24);
    assert.equal(new Set(first.draws.map((draw) => draw.seed)).size, 24);
    assert.equal(new Set(first.draws.map((draw) => draw.playerId)).size, 24);
    assert.deepEqual(first.draws, second.draws);
    assert.equal(JSON.stringify(input.memberships), before);
  });

  test("records bracket destinations and survives strict parsing", async () => {
    const { buildSeedingCeremonyState, parseSeedingCeremonyState } = await functions();
    const input = fixture(17);
    const state = buildSeedingCeremonyState(input);
    const parsed = parseSeedingCeremonyState(JSON.parse(JSON.stringify(state)));

    assert.deepEqual(parsed, state);
    assert.equal(state.draws.filter((draw) => draw.placement.kind === "bracket" && draw.placement.bye).length, 15);
    assert.equal(state.draws.filter((draw) => draw.placement.kind === "bracket" && !draw.placement.bye).length, 2);
  });

  test("detects participant and configuration changes", async () => {
    const { buildSeedingCeremonyState, ceremonyConfigurationSignature, ceremonyParticipantSignature, isCeremonyCurrent } = await functions();
    const input = fixture(8);
    const ceremony = buildSeedingCeremonyState(input);
    assert.equal(isCeremonyCurrent({ ceremony, ...input }), true);

    const changedPlayers = input.players.map((player) => ({ ...player }));
    changedPlayers[0].name = "Changed";
    assert.equal(isCeremonyCurrent({ ceremony, stage: input.stage, memberships: input.memberships, players: changedPlayers }), false);

    const changedStage = { ...input.stage, randomSeed: "different" };
    assert.notEqual(ceremonyConfigurationSignature(input.stage), ceremonyConfigurationSignature(changedStage));
    assert.equal(isCeremonyCurrent({ ceremony, stage: changedStage, memberships: input.memberships, players: input.players }), false);
    assert.equal(ceremonyParticipantSignature(input.memberships, input.players), ceremony.participantSignature);
  });

  test("marks the revealed result as immutable applied audit", async () => {
    const { buildSeedingCeremonyState, markCeremonyApplied } = await functions();
    const input = fixture(8);
    const ceremony = buildSeedingCeremonyState(input);
    const applied = markCeremonyApplied(ceremony, new Date("2026-01-03T00:00:00.000Z"));

    assert.equal(applied.status, "applied");
    assert.equal(applied.revealedCount, 8);
    assert.equal(applied.appliedAt, "2026-01-03T00:00:00.000Z");
    assert.ok(applied.completedAt);
  });
});
