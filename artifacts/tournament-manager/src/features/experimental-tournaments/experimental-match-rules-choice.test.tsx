import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { currentMatchRuleOption, MatchRulesChoice, matchRulesSentence, paramsForMatchRuleOption } from "./experimental-match-rules-choice";
import type { PresetParams, PresetPreview } from "./experimental-create-wizard-model";

afterEach(() => cleanup());

function preview(overrides: Partial<PresetPreview> = {}): PresetPreview {
  return {
    version: 1, presetId: "round_robin", label: "Każdy z każdym", family: "points",
    params: { participantCount: 6, bestOf: 1 },
    paramLimits: [
      { key: "bestOf", label: "Długość meczu", help: "", options: [1, 3, 5, 7], value: 1 },
      { key: "allowDraws", label: "Remisy", help: "", options: [0, 1], value: 0 },
      { key: "setsToWin", label: "Mecz na sety", help: "", options: [0, 1, 2, 3, 4], value: 0, optionLabels: ["Bez setów", "Jeden set", "Do 2 wygranych setów", "Do 3 wygranych setów", "Do 4 wygranych setów"] },
      { key: "setPoints", label: "Set do … punktów", help: "", options: [11, 15, 21, 25], value: 11 },
      { key: "setWinBy", label: "Przewaga w secie", help: "", options: [1, 2], value: 2, optionLabels: ["", "Bez przewagi", "Przewaga 2 punktów"] },
    ],
    participants: { mode: "up_to", count: 6, minimum: 2 },
    creation: { format: "round_robin", maxPlayers: 6, defaultBestOf: 1 },
    stagePlan: { initialParticipantCount: 6, stages: [] } as never,
    leagueRules: { version: 1, allowDraws: false, points: { win: 3, draw: 1, loss: 0 }, tieBreakers: [] } as never,
    matchRules: null,
    matchRulesSummary: "Mecz to jedna gra ze zwycięzcą.",
    stages: [{ position: 1, key: "league", name: "Liga", format: "round_robin", formatLabel: "Każdy z każdym", participantCount: 6, bestOf: 1, groupSizes: null, advancingCount: null, advancementText: "", matches: { min: 15, max: 15 }, rounds: { min: 5, max: 5 }, byes: 0 }],
    totals: { matches: { min: 15, max: 15 }, rounds: { min: 5, max: 5 }, matchesPerParticipant: { min: 5, max: 5 } },
    winnerRule: "", tieRules: [], requirements: [], warnings: [],
    ...overrides,
  } as PresetPreview;
}

test("picking a set preset replaces length and draws with set params, and back again", () => {
  const sets = paramsForMatchRuleOption("sets_2_11", { participantCount: 6, bestOf: 3, allowDraws: 1, legs: 2 }, true);
  assert.deepEqual(sets, { participantCount: 6, legs: 2, setsToWin: 2, setPoints: 11, setWinBy: 2, allowDraws: 0 });
  const series = paramsForMatchRuleOption("series_bo3", sets, true);
  assert.deepEqual(series, { participantCount: 6, legs: 2, bestOf: 3, allowDraws: 0 });
  assert.deepEqual(paramsForMatchRuleOption("single_game", { setsToWin: 3 }, false), { bestOf: 1 }, "no draws key without a league");
  assert.equal(currentMatchRuleOption(preview(), { setsToWin: 2, setPoints: 11, setWinBy: 2 }), "sets_2_11");
  assert.equal(currentMatchRuleOption(preview(), { setsToWin: 2, setPoints: 15, setWinBy: 2 }), "custom");
  assert.equal(currentMatchRuleOption(preview(), { allowDraws: 1 }), "score_draws");
});

test("the summary keeps match rules and table points apart in one plain sentence", () => {
  const withSets = preview({ matchRules: { version: 1, kind: "sets", setsToWin: 2, pointsPerSet: 11, winBy: 2 }, matchRulesSummary: "Mecz do dwóch wygranych setów. Każdy set do 11 punktów, z przewagą dwóch." });
  assert.equal(matchRulesSentence(withSets), "Mecz do dwóch wygranych setów. Każdy set do 11 punktów, z przewagą dwóch. Zwycięstwo daje 3 punkty w tabeli.");
  const cup = preview({ leagueRules: null, stages: [{ ...preview().stages[0]!, format: "single_elimination" }] });
  assert.match(matchRulesSentence(cup), /Zwycięzca meczu przechodzi dalej w drabince/);
});

test("the choice is a labelled radio group; details sit under 'Dostosuj zasady'", async () => {
  const user = userEvent.setup();
  let last: PresetParams | null = null;
  render(<MatchRulesChoice preview={preview()} params={{}} onParams={(next) => { last = next; }} />);
  const group = screen.getByRole("radiogroup", { name: "Jak rozstrzyga się mecz" });
  assert.ok(group);
  assert.equal(screen.getByRole("radio", { name: "Jedna gra ze zwycięzcą" }).getAttribute("aria-checked"), "true");
  await user.click(screen.getByRole("radio", { name: "Do 3 wygranych setów, set do 11, przewaga 2" }));
  assert.deepEqual(last, { setsToWin: 3, setPoints: 11, setWinBy: 2, allowDraws: 0 });
  assert.ok(screen.getByText("Dostosuj zasady"));
  assert.match(screen.getByRole("status").textContent ?? "", /Zwycięstwo daje 3 punkty w tabeli/);
});
