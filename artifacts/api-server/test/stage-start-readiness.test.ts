import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateStageStartReadiness,
  type StageStartValidationSnapshot,
} from "../src/application/stages/stage-start-readiness";

function snapshot(): StageStartValidationSnapshot {
  return {
    tournament: { id: 1, activeStageId: null },
    stages: [{
      id: 11, tournamentId: 1, position: 1, status: "planned", participantCount: 2,
      format: "swiss", groupCount: null, participantsPerGroup: null, qualifiersPerGroup: null,
      qualificationMode: "top_n", seedingPolicy: "standings_order",
    }],
    stage: {
      id: 11, tournamentId: 1, position: 1, status: "planned", participantCount: 2,
      format: "swiss", groupCount: null, participantsPerGroup: null, qualifiersPerGroup: null,
      qualificationMode: "top_n", seedingPolicy: "standings_order",
    },
    existingMatchCount: 0,
    existingGroupCount: 0,
    memberships: [1, 2].map((seed) => ({
      id: 100 + seed,
      playerId: 200 + seed,
      stageSeed: seed,
      status: "active" as const,
      nextStageSeed: null,
      qualificationSource: "registration" as const,
      sourceStageParticipantId: null,
      groupId: null,
      groupRank: null,
    })),
    sourceMemberships: [],
    sourceGroups: [],
    players: [1, 2].map((seed) => ({ id: 200 + seed, tournamentId: 1 })),
  };
}

function changed(change: (value: StageStartValidationSnapshot) => void): StageStartValidationSnapshot {
  const value = structuredClone(snapshot());
  change(value);
  return value;
}

test("reports a valid planned stage as ready", () => {
  const result = evaluateStageStartReadiness(snapshot());
  assert.equal(result.ready, true);
  assert.equal(result.reasonCode, "READY");
  assert.deepEqual(result.missingSeeds, []);
  assert.deepEqual(result.basketValidation, { valid: true, problems: [] });
});

test("blocks start with the stable basket validation reason", () => {
  const result = evaluateStageStartReadiness(changed((value) => {
    value.basketValidation = {
      valid: false,
      problems: [{
        code: "STAGE_OUTPUT_BASKET_COUNT_INVALID",
        message: "Stage must have between 1 and 4 output baskets.",
        context: { stageId: 11 },
      }],
    };
  }));
  assert.equal(result.ready, false);
  assert.equal(result.reasonCode, "STAGE_BASKET_CONFIGURATION_INVALID");
  assert.equal(result.basketValidation.valid, false);
});

test("reports missing participants and seeds without changing the snapshot", () => {
  const value = changed((current) => {
    current.memberships = current.memberships.slice(0, 1);
    current.players = current.players.slice(0, 1);
  });
  const before = structuredClone(value);
  const result = evaluateStageStartReadiness(value);
  assert.equal(result.reasonCode, "STAGE_PARTICIPANTS_INCONSISTENT");
  assert.deepEqual(result.missingSeeds, [2]);
  assert.deepEqual(value, before);
});

test("reports a non-contiguous seed assignment", () => {
  const result = evaluateStageStartReadiness(changed((value) => {
    value.memberships[1].stageSeed = 3;
  }));
  assert.equal(result.reasonCode, "STAGE_PARTICIPANTS_INCONSISTENT");
  assert.deepEqual(result.missingSeeds, [2]);
});

test("reports existing matches and groups with stable reason codes", () => {
  assert.equal(evaluateStageStartReadiness(changed((value) => {
    value.existingMatchCount = 1;
  })).reasonCode, "MATCHES_ALREADY_EXIST");
  assert.equal(evaluateStageStartReadiness(changed((value) => {
    value.existingGroupCount = 1;
  })).reasonCode, "GROUPS_ALREADY_EXIST");
});

test("rejects a participant record owned by another tournament", () => {
  const result = evaluateStageStartReadiness(changed((value) => {
    value.players[1].tournamentId = 2;
  }));
  assert.equal(result.reasonCode, "STAGE_PARTICIPANTS_INCONSISTENT");
});

test("rejects inconsistent qualification provenance", () => {
  const result = evaluateStageStartReadiness(changed((value) => {
    value.stages = [{ ...value.stage, id: 10, position: 1, status: "completed" }, ...value.stages];
    value.stage.position = 2;
    value.stages[1].position = 2;
  }));
  assert.equal(result.reasonCode, "STAGE_PARTICIPANTS_INCONSISTENT");
});

test("rejects a group qualification that references a group outside the source stage", () => {
  const result = evaluateStageStartReadiness(changed((value) => {
    const previous = {
      ...value.stage,
      id: 10,
      position: 1,
      status: "completed" as const,
      participantCount: 4,
      format: "group_stage" as const,
      groupCount: 2,
      participantsPerGroup: 2,
      qualifiersPerGroup: 1,
      qualificationMode: "top_n_per_group" as const,
      seedingPolicy: "snake_groups" as const,
    };
    value.stage.position = 2;
    value.stage.format = "single_elimination";
    value.stage.qualificationMode = "none";
    value.stages = [previous, value.stage];
    value.sourceGroups = [{ id: 301, groupKey: "A" }, { id: 302, groupKey: "B" }];
    value.sourceMemberships = value.memberships.map((membership, index) => ({
      ...membership,
      id: 400 + index,
      status: "qualified" as const,
      nextStageSeed: index + 1,
      groupId: index === 0 ? 999 : 301,
      groupRank: 1,
    }));
    value.memberships = value.memberships.map((membership, index) => ({
      ...membership,
      sourceStageParticipantId: 400 + index,
      qualificationSource: "group_position" as const,
      stageSeed: index + 1,
    }));
  }));
  assert.equal(result.reasonCode, "STAGE_PARTICIPANTS_INCONSISTENT");
});

test("reports non-planned and non-next stages", () => {
  assert.equal(evaluateStageStartReadiness(changed((value) => {
    value.stage.status = "active";
    value.stages[0].status = "active";
  })).reasonCode, "STAGE_ALREADY_STARTED");
  assert.equal(evaluateStageStartReadiness(changed((value) => {
    value.stages = [{ ...value.stage, id: 10, position: 0 }, ...value.stages];
  })).reasonCode, "STAGE_NOT_NEXT_PLANNED");
});
