import assert from "node:assert/strict";
import { test } from "node:test";
import type { StageSchedule, StageScheduleMatch } from "@workspace/api-client-react";
import { formatSlot, leagueNextAction } from "./experimental-league-model";

const match = (id: number, round: number, state: StageScheduleMatch["scheduleState"], date: string | null = null): StageScheduleMatch => ({
  matchId: id, round, matchNumber: id, player1Id: 1, player2Id: 2, player1Name: `A${id}`, player2Name: `B${id}`,
  status: state === "completed" ? "completed" : state === "postponed" ? "postponed" : "pending",
  scheduleState: state, scheduledAt: date ? `${date}T17:00:00.000Z` : null, localDate: date, localTime: date ? "18:00" : null,
  score1: null, score2: null, winnerId: null, isDraw: false,
});

function schedule(matches: StageScheduleMatch[]): StageSchedule {
  const rounds = [...new Set(matches.map((entry) => entry.round))].map((round) => {
    const inRound = matches.filter((entry) => entry.round === round);
    return { round, matches: inRound, resting: [], completed: inRound.filter((entry) => entry.scheduleState === "completed").length, total: inRound.length, firstDate: inRound[0]?.localDate ?? null };
  });
  const count = (state: string) => matches.filter((entry) => entry.scheduleState === state).length;
  return {
    stageId: 1, stageName: "Liga", format: "round_robin", timeZone: "Europe/Warsaw", timeZoneSource: "stage", now: "2026-12-10T12:00:00Z",
    currentRound: rounds.find((round) => round.matches.some((entry) => entry.scheduleState !== "completed"))?.round ?? null,
    rounds,
    upcoming: matches.filter((entry) => entry.scheduleState === "scheduled"),
    overdue: matches.filter((entry) => entry.scheduleState === "awaiting_result"),
    counts: { scheduled: count("scheduled"), awaitingResult: count("awaiting_result"), completed: count("completed"), postponed: count("postponed"), unscheduled: count("unscheduled"), total: matches.length },
  };
}

test("overdue results come first, then postponed matches, then the current round", () => {
  const overdue = leagueNextAction(schedule([match(1, 1, "completed"), match(2, 1, "awaiting_result", "2026-12-05"), match(3, 2, "postponed")]));
  assert.equal(overdue.kind, "enter_overdue");
  assert.equal(overdue.matchId, 2);
  assert.match(overdue.title, /1 zaległy wynik/);
  const postponed = leagueNextAction(schedule([match(1, 1, "completed"), match(3, 2, "postponed")]));
  assert.equal(postponed.kind, "reschedule_postponed");
  assert.equal(postponed.matchId, 3);
  const play = leagueNextAction(schedule([match(1, 1, "completed"), match(2, 1, "scheduled", "2026-12-12")]));
  assert.equal(play.kind, "play_round");
  assert.match(play.title, /Kolejka 1: rozegrano 1 z 2/);
  assert.match(play.detail, /sb 12 gru, 18:00/);
});

test("a league without dates suggests (but does not require) a schedule; a finished league says so", () => {
  const plan = leagueNextAction(schedule([match(1, 1, "unscheduled"), match(2, 2, "unscheduled")]));
  assert.equal(plan.kind, "plan_schedule");
  assert.match(plan.detail, /dowolnej kolejności/);
  assert.equal(leagueNextAction(schedule([match(1, 1, "completed")])).kind, "finished");
});

test("dates are shown as stored in the league time zone", () => {
  assert.equal(formatSlot({ localDate: "2027-05-01", localTime: "18:00" }), "sb 1 maja, 18:00");
  assert.equal(formatSlot({ localDate: null, localTime: null }), "bez terminu");
});
