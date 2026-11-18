import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { previewPreset } from "../../../../api-server/src/domain/tournament/tournament-presets";
import { currentMatchRuleOption, MatchRulesChoice, matchRulesSentence, paramsForMatchRuleOption } from "./experimental-match-rules-choice";
import { stageDecisionText, type PresetParams, type PresetPreview } from "./experimental-create-wizard-model";

afterEach(() => cleanup());
const preview = (presetId: string, params: PresetParams) => previewPreset({ presetId: presetId as never, params: params as never }) as unknown as PresetPreview;

test("V5.10: the two-legged option appears only with a single-elimination bracket, with its own explanation", async () => {
  const user = userEvent.setup();
  const cup = preview("single_elimination", { participantCount: 8 });
  let next: PresetParams | null = null;
  render(<MatchRulesChoice preview={cup} params={{ participantCount: 8 }} onParams={(params) => { next = params; }} />);
  const option = screen.getByRole("radio", { name: "Dwumecz — suma dwóch spotkań" });
  assert.match(option.getAttribute("title") ?? "", /Dwa spotkania tej samej pary/);
  await user.click(option);
  assert.deepEqual(next, { participantCount: 8, twoLegs: 1 }, "no series length and no sets with a two-legged tie");
  cleanup();
  render(<MatchRulesChoice preview={preview("round_robin", { participantCount: 6 })} params={{}} onParams={() => {}} />);
  assert.equal(screen.queryByRole("radio", { name: "Dwumecz — suma dwóch spotkań" }), null, "a league never offers it");
  cleanup();
  render(<MatchRulesChoice preview={preview("double_elimination", { participantCount: 8 })} params={{}} onParams={() => {}} />);
  assert.equal(screen.queryByRole("radio", { name: "Dwumecz — suma dwóch spotkań" }), null, "nor the double-elimination bracket");
});

test("V5.10: format and decision are told apart — a knockout bracket where each pair plays two legs", () => {
  const cup = preview("single_elimination", { participantCount: 8, twoLegs: 1 });
  assert.equal(currentMatchRuleOption(cup, { twoLegs: 1 }), "two_legs");
  assert.equal(matchRulesSentence(cup), "Turniej eliminacyjny (drabinka), w którym każda para rozgrywa dwa spotkania. O awansie decyduje suma wyników; przy równej sumie rozstrzyga organizator.");
  render(<MatchRulesChoice preview={cup} params={{ participantCount: 8, twoLegs: 1 }} onParams={() => {}} />);
  assert.match(screen.getByTestId("match-rules-description").textContent ?? "", /Awansuje uczestnik z większą sumą/);
  assert.ok(screen.getByRole("button", { name: "Jeden mecz zamiast dwumeczu" }));
  const groups = preview("groups_playoff", { participantCount: 16, twoLegs: 1 });
  assert.match(matchRulesSentence(groups), /^W etapie „.+” \(drabinka\), w którym każda para rozgrywa dwa spotkania/);
  const playoffRules = groups.stagePlan?.stages.find((stage) => stage.format === "single_elimination")?.matchRules ?? null;
  assert.equal(stageDecisionText(playoffRules, 1), "dwumecz: dwa spotkania każdej pary, awansuje zwycięzca sumy");
  assert.equal(stageDecisionText(null, 1), "jedna gra na mecz", "the group stage keeps one game per match");
  // Going back to one match removes the two-legged param again.
  assert.deepEqual(paramsForMatchRuleOption("single_game", { participantCount: 8, twoLegs: 1 }, false), { participantCount: 8, bestOf: 1 });
});
