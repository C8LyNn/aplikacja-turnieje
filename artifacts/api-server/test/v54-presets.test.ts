/**
 * V5.4-004: seeding rules are preset parameters (rules, not ports). They change who meets whom,
 * never the number of matches or qualifiers.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  PRESET_PREVIEW_RANDOM_SEED,
  PRESET_TUNABLE_PARAMS,
  PresetError,
  previewPreset,
} from "../src/domain/tournament/tournament-presets";
import { validateTournamentStagePlan } from "../src/domain/tournament/tournament-stage-plan";

test("groups and play-off: defaults keep the V5.3 plan (snake, winners first, registration order)", () => {
  const preview = previewPreset({ presetId: "groups_playoff", params: { participantCount: 32, groupCount: 8, qualifiersPerGroup: 2 } });
  const [groups, playoff] = preview.creation.stagePlan!.stages;
  assert.equal(groups.format, "group_stage");
  assert.equal(groups.entrySeedingMethod, "registration_order");
  assert.equal(groups.format === "group_stage" && groups.placementMethod, "snake");
  assert.equal(groups.format === "group_stage" && groups.resultSeedingMethod, "rank_bands");
  assert.equal(groups.randomSeed, undefined);
  assert.equal(playoff.participantCount, 16);
  assert.equal(preview.params.entrySeeding, 0);
  assert.equal(preview.params.groupPlacement, 0);
  assert.equal(preview.params.qualifierSeeding, 0);
  assert.match(preview.stages[0].advancementText, /zwycięzcy grup przed drugimi/);
});

test("groups and play-off: random groups and overall ranking change seeding only", () => {
  const base = previewPreset({ presetId: "groups_playoff", params: { participantCount: 32, groupCount: 8, qualifiersPerGroup: 2 } });
  const tuned = previewPreset({
    presetId: "groups_playoff",
    params: { participantCount: 32, groupCount: 8, qualifiersPerGroup: 2, entrySeeding: 1, groupPlacement: 1, qualifierSeeding: 1 },
  });
  const [groups] = tuned.creation.stagePlan!.stages;
  assert.equal(groups.entrySeedingMethod, "random");
  assert.equal(groups.format === "group_stage" && groups.placementMethod, "random");
  assert.equal(groups.format === "group_stage" && groups.resultSeedingMethod, "global_ranking");
  assert.equal(groups.randomSeed, PRESET_PREVIEW_RANDOM_SEED);
  assert.deepEqual(tuned.totals, base.totals, "same number of matches and rounds");
  assert.equal(tuned.stages[1].participantCount, base.stages[1].participantCount, "same number of qualifiers");
  assert.match(tuned.stages[0].advancementText, /łącznego rankingu/);
  assert.ok(tuned.requirements.some((line) => /losowanie grup/.test(line)));
  assert.equal(validateTournamentStagePlan(tuned.creation.stagePlan!).valid, true);
});

test("enumerated params carry labels aligned with their options", () => {
  const preview = previewPreset({ presetId: "groups_playoff", params: { participantCount: 16 } });
  for (const key of ["entrySeeding", "groupPlacement", "qualifierSeeding"] as const) {
    const limit = preview.paramLimits.find((item) => item.key === key);
    assert.ok(limit, key);
    assert.equal(limit.optionLabels?.length, limit.options.length, key);
  }
  assert.equal(preview.paramLimits.find((item) => item.key === "bestOf")?.optionLabels, undefined);
});

test("manual entry seeding is offered for every preset and validated", () => {
  for (const presetId of Object.keys(PRESET_TUNABLE_PARAMS) as (keyof typeof PRESET_TUNABLE_PARAMS)[]) {
    assert.ok(PRESET_TUNABLE_PARAMS[presetId].includes("entrySeeding"), presetId);
  }
  const se = previewPreset({ presetId: "single_elimination", params: { participantCount: 8, entrySeeding: 2 } });
  assert.equal(se.creation.stagePlan?.stages[0].entrySeedingMethod, "manual", "the rule travels in a fixed stage plan");
  const flexible = previewPreset({ presetId: "single_elimination", params: { participantCount: 8 } });
  assert.equal(flexible.creation.stagePlan, undefined, "default seeding keeps the flexible V5.3 creation");
  assert.throws(
    () => previewPreset({ presetId: "single_elimination", params: { participantCount: 8, entrySeeding: 3 } }),
    (error: unknown) => error instanceof PresetError && error.param === "entrySeeding",
  );
  const swiss = previewPreset({ presetId: "swiss", params: { participantCount: 8, groupPlacement: 1 } });
  assert.equal(swiss.params.groupPlacement, undefined, "group placement does not apply to Swiss");
});
