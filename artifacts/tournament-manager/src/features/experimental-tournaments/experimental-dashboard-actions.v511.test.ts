import { test } from "node:test";
import assert from "node:assert/strict";
import { tournamentAction } from "./experimental-v4-model";
import { tournamentFormatText, tournamentProgress } from "./experimental-tournament-list";

const base = { playerCount: 0, readyMatchCount: 0, liveMatchCount: 0 };
const stage = (over: Record<string, unknown> = {}) => ({ id: 7, name: "Etap 1", format: "single_elimination", status: "active", position: 1, matchesCompleted: 0, matchesTotal: 0, currentRound: null, plannedRounds: null, ...over });

test("V5.11 drafts: the engine's start readiness decides the group, not only the head count", () => {
  const short = tournamentAction({ id: 8, status: "draft", activity: { ...base, playerCount: 5, startReadiness: { ready: false, reasonCode: "STAGE_PARTICIPANTS_INCONSISTENT", participantCount: 5, requiredParticipantCount: 16 } } });
  assert.equal(short?.group, "roster");
  assert.equal(short?.hint, "Dodaj jeszcze 11 · na liście 5 z 16");
  assert.equal(short?.href, "/experimental/tournaments/8?tab=players");
  const ready = tournamentAction({ id: 8, status: "draft", activity: { ...base, playerCount: 16, startReadiness: { ready: true, reasonCode: "READY", participantCount: 16, requiredParticipantCount: 16 } } });
  assert.equal(ready?.group, "start");
  assert.equal(ready?.label, "Uruchom turniej");
  const baskets = tournamentAction({ id: 8, status: "draft", activity: { ...base, playerCount: 16, startReadiness: { ready: false, reasonCode: "STAGE_BASKET_CONFIGURATION_INVALID", participantCount: 16, requiredParticipantCount: 16 } } });
  assert.equal(baskets?.group, "prepare");
  assert.equal(baskets?.href, "/experimental/tournaments/8?tab=stages");
});

test("V5.11 drafts with fewer than 2 participants always ask for participants (readiness 0 of 0 is not 'preparation')", () => {
  const empty = tournamentAction({ id: 3, status: "draft", activity: { ...base, startReadiness: { ready: false, reasonCode: "STAGE_PARTICIPANTS_INCONSISTENT", participantCount: 0, requiredParticipantCount: 0 } } });
  assert.equal(empty?.group, "roster");
  assert.equal(empty?.hint, "Brak uczestników");
  const one = tournamentAction({ id: 3, status: "draft", activity: { ...base, playerCount: 1, startReadiness: { ready: false, reasonCode: "STAGE_PARTICIPANTS_INCONSISTENT", participantCount: 1, requiredParticipantCount: 1 } } });
  assert.equal(one?.group, "roster");
});

test("V5.11 active tournaments without playable matches get the concrete engine step", () => {
  const swiss = tournamentAction({ id: 4, status: "active", activity: { ...base, currentStage: stage({ format: "swiss", matchesCompleted: 4, matchesTotal: 4, currentRound: 1, plannedRounds: 4 }) } });
  assert.equal(swiss?.label, "Generuj rundę 2");
  assert.equal(swiss?.hint, "Runda 1 z 4 zakończona");
  const lastSwiss = tournamentAction({ id: 4, status: "active", activity: { ...base, currentStage: stage({ format: "swiss", matchesCompleted: 16, matchesTotal: 16, currentRound: 4, plannedRounds: 4 }) } });
  assert.equal(lastSwiss?.label, "Zakończ etap");
  assert.equal(lastSwiss?.href, "/experimental/tournaments/4?tab=stages&stage=7&action=complete");
  const unknownSwiss = tournamentAction({ id: 4, status: "active", activity: { ...base, currentStage: stage({ format: "swiss", matchesCompleted: 4, matchesTotal: 4, currentRound: 1 }) } });
  assert.equal(unknownSwiss?.label, "Następny krok", "no guess without the planned number of rounds");
  const next = tournamentAction({ id: 4, status: "active", activity: { ...base, currentStage: stage({ status: "planned", name: "Play-off" }) } });
  assert.equal(next?.label, "Rozpocznij etap");
  assert.equal(next?.href, "/experimental/tournaments/4?tab=stages&stage=7&action=start");
  assert.equal(tournamentAction({ id: 4, status: "active", activity: base })?.label, "Następny krok", "older servers keep the V4 wording");
});

test("V5.11 cards: format from the stage plan and progress from the current stage's matches", () => {
  const labels = { round_robin: "Każdy z każdym", single_elimination: "Drabinka eliminacyjna" };
  assert.equal(tournamentFormatText({ format: "round_robin", activity: { ...base, stageFormats: ["group_stage", "single_elimination"] } }, labels), "Faza grupowa → Play-off");
  assert.equal(tournamentFormatText({ format: "single_elimination", activity: { ...base, stageFormats: ["single_elimination"] } }, labels), "Drabinka eliminacyjna");
  assert.equal(tournamentFormatText({ format: "round_robin", activity: null }, labels), "Każdy z każdym");
  assert.deepEqual(tournamentProgress({ status: "active", activity: { ...base, stageFormats: ["group_stage", "single_elimination"], currentStage: stage({ name: "Faza grupowa", format: "group_stage", matchesCompleted: 10, matchesTotal: 18 }) } }), { label: "Faza grupowa · 10/18 meczów", percent: 56 });
  assert.deepEqual(tournamentProgress({ status: "active", currentRound: 2, totalRounds: 3, activity: base }), { label: "Runda 2 z 3", percent: 67 });
  assert.equal(tournamentProgress({ status: "draft", activity: base }), null);
});
