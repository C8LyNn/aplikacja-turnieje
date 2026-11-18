import assert from "node:assert/strict";
import test from "node:test";
import { countWorkStates, formatLocalSlot, matchWorkState } from "./match-work-state";

const now = new Date("2026-12-10T12:00:00Z"); // 13:00 in Warsaw
const pair = { player1Id: 1, player2Id: 2 };

test("a start that passed today means 'start minął' with a start action — not 'enter result'", () => {
  const info = matchWorkState({ ...pair, status: "pending", scheduledAt: "2026-12-10T09:00:00Z" }, { now });
  assert.equal(info.state, "due");
  assert.equal(info.action.kind, "start");
  assert.match(info.reason, /Planowany start 10:00 minął/);
  assert.doesNotMatch(info.reason, /wynik/i);
});

test("a result is expected only after the planned day is over, or once the match is under way", () => {
  const dayOver = matchWorkState({ ...pair, status: "pending", scheduledAt: "2026-12-09T17:00:00Z" }, { now });
  assert.equal(dayOver.state, "needs_result");
  assert.equal(dayOver.action.kind, "enter_result");
  assert.match(dayOver.reason, /Dzień meczu \(śr 9 gru, 18:00\) minął/);
  const live = matchWorkState({ ...pair, status: "in_progress", scheduledAt: "2026-12-10T09:00:00Z" }, { now });
  assert.equal(live.state, "in_progress");
  assert.equal(live.action.label, "Wpisz wynik");
  const stuck = matchWorkState({ ...pair, status: "in_progress", scheduledAt: "2026-12-08T17:00:00Z" }, { now });
  assert.equal(stuck.state, "needs_result");
});

test("the day is judged in the league's time zone, like the API", () => {
  const afterMidnightWarsaw = new Date("2026-12-09T23:10:00Z");
  const match = { ...pair, status: "pending", scheduledAt: "2026-12-09T22:30:00Z" };
  assert.equal(matchWorkState(match, { now: afterMidnightWarsaw, timeZone: "Europe/Warsaw" }).state, "needs_result");
  assert.equal(matchWorkState(match, { now: afterMidnightWarsaw, timeZone: "UTC" }).state, "due");
});

test("ready, waiting, postponed, completed and cancelled each give a reason and one action", () => {
  assert.equal(matchWorkState({ ...pair, status: "pending", scheduledAt: null }, { now }).reason, "Bez terminu — można rozegrać w dowolnej chwili.");
  assert.equal(matchWorkState({ ...pair, status: "pending", scheduledAt: "2026-12-12T17:00:00Z" }, { now }).reason, "Start: sb 12 gru, 18:00.");
  assert.equal(matchWorkState({ ...pair, status: "pending" }, { now, canStart: false }).action.kind, "enter_result");
  assert.equal(matchWorkState({ player1Id: 1, player2Id: null, status: "pending" }, { now }).state, "waiting");
  assert.equal(matchWorkState({ ...pair, status: "postponed" }, { now }).action.label, "Przywróć do kolejki");
  assert.equal(matchWorkState({ ...pair, status: "completed", resultType: "played" }, { now }).action.kind, "correct");
  assert.equal(matchWorkState({ ...pair, status: "completed", resultType: "bye" }, { now }).action.kind, "none");
  assert.equal(matchWorkState({ ...pair, status: "cancelled" }, { now }).state, "cancelled");
});

test("counts and slot formatting", () => {
  const infos = [
    matchWorkState({ ...pair, status: "in_progress" }, { now }),
    matchWorkState({ ...pair, status: "pending" }, { now }),
    matchWorkState({ ...pair, status: "pending" }, { now }),
  ];
  const counts = countWorkStates(infos);
  assert.equal(counts.in_progress, 1);
  assert.equal(counts.ready, 2);
  assert.equal(counts.needs_result, 0);
  assert.equal(formatLocalSlot(null), "bez terminu");
  assert.equal(formatLocalSlot("2026-12-05", "18:00"), "sb 5 gru, 18:00");
});
