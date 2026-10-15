import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { PlanTemplateError, previewTournamentTemplate } from "../src/domain/tournament/tournament-plan-templates";
import { validateTournamentStagePlan } from "../src/domain/tournament/tournament-stage-plan";

const preview = (templateId: string, participantCount: number, bestOf: number = 3) =>
  previewTournamentTemplate({templateId, participantCount, bestOf});
const errorCode = (fn: () => unknown) => {
  try { fn(); assert.fail("Expected template error"); }
  catch (e) {
    if (!(e instanceof PlanTemplateError)) throw e;
    return e.code;
  }
};

describe("PACK 05 / planner templates are pure and authority-validated", () => {
  for (const [type, counts] of [
    ["quick_elimination", [2, 3, 4, 8, 16, 32, 64, 128]],
    ["double_chance", [4, 8, 16, 32, 64]],
    ["everyone_plays", [2, 3, 4, 12, 32]],
    ["swiss", [2, 3, 5, 8, 16, 33, 128]],
    ["groups_to_playoffs", [8, 12, 16, 24, 32, 64]],
    ["swiss_to_playoffs", [8, 16, 32, 64]],
  ] as const) {
    for (const count of counts) {
      test(`${type}: ${count} participants produce a valid stage plan`, () => {
        const result = preview(type, count);
        assert.equal(result.stagePlan.initialParticipantCount, count);
        assert.equal(result.advisory, true);
        assert.equal(result.requiresConfirmation, true);
        assert.equal(result.stages.length, result.stagePlan.stages.length);
        assert.ok(result.estimatedTotalMatches > 0);
        assert.ok(result.estimatedMatchesMaximum >= result.estimatedTotalMatches);
        assert.equal(validateTournamentStagePlan(result.stagePlan).valid, true);
      });
    }
  }
  test("group stage qualifies exactly two teams per group", () => {
    const x = preview("groups_to_playoffs", 16);
    assert.equal(x.stagePlan.stages[0].format, "group_stage");
    assert.equal(x.stagePlan.stages[1].participantCount, 8);
    assert.equal(x.estimatedTotalMatches, 31); // 4*6 + 7
  });
  test("12-team groups warn about play-off BYEs", () => {
    const x = preview("groups_to_playoffs", 12);
    assert.equal(x.stagePlan.stages[1].participantCount, 6);
    assert.ok(x.warnings.some(w => w.includes("BYE")));
  });
  test("DE includes possible final reset in maximum", () => {
    const x = preview("double_chance", 8);
    assert.equal(x.estimatedTotalMatches, 14);
    assert.equal(x.estimatedMatchesMaximum, 15);
  });
  test("planning is deterministic and does not mutate source options", () => {
    const input = Object.freeze({templateId:"groups_to_playoffs", participantCount:16, bestOf:3});
    assert.deepEqual(previewTournamentTemplate(input), previewTournamentTemplate(input));
  });
  for (const [options, expected] of [
    [{templateId:"groups_to_playoffs",participantCount:14,bestOf:3},"GROUP_TEMPLATE_REQUIRES_FOURS"],
    [{templateId:"double_chance",participantCount:12,bestOf:3},"DOUBLE_ELIMINATION_REQUIRES_POWER_OF_TWO"],
    [{templateId:"swiss_to_playoffs",participantCount:10,bestOf:3},"SWISS_PLAYOFFS_REQUIRES_POWER_OF_TWO"],
    [{templateId:"everyone_plays",participantCount:64,bestOf:3},"ROUND_ROBIN_TOO_LARGE"],
    [{templateId:"quick_elimination",participantCount:129,bestOf:3},"INVALID_PARTICIPANT_COUNT"],
    [{templateId:"quick_elimination",participantCount:8.5,bestOf:3},"INVALID_PARTICIPANT_COUNT"],
    [{templateId:"quick_elimination",participantCount:8,bestOf:2},"INVALID_BEST_OF"],
    [{templateId:"unknown",participantCount:8,bestOf:3},"UNKNOWN_TEMPLATE"],
    [{templateId:"quick_elimination",participantCount:8,bestOf:3,unexpected:true},"INVALID_TEMPLATE_REQUEST"],
    [null,"INVALID_TEMPLATE_REQUEST"],
  ] as const) {
    test(`rejects ${JSON.stringify(options)}`, () => {
      assert.equal(errorCode(() => previewTournamentTemplate(options)), expected);
    });
  }
  test("does not disclose sensitive or mutation parameters in the plan", () => {
    const result = preview("quick_elimination", 8);
    assert.equal(JSON.stringify(result).includes("Password"), false);
    assert.equal(JSON.stringify(result).includes("token"), false);
  });
});
