import assert from "node:assert/strict";
import { test } from "node:test";
import { matchWorkState } from "./match-work-state";

const now = new Date("2026-12-01T12:00:00.000Z");
const base = { player1Id: 1, player2Id: 2, resultType: null };

test("V5.10: a two-legged tie is worked leg by leg — never 'start', the next leg and its date, the running sum", () => {
  const fresh = matchWorkState({ ...base, status: "pending", legs: [{ leg: 1, status: "pending", scheduledAt: "2026-12-05T17:00:00.000Z" }, { leg: 2, status: "pending" }], tie: { state: "not_started", total1: 0, total2: 0 } }, { now });
  assert.equal(fresh.state, "ready");
  assert.equal(fresh.action.kind, "enter_result");
  assert.match(fresh.reason, /Następne: 1\. spotkanie — sb 5 gru, 18:00/);

  const between = matchWorkState({ ...base, status: "in_progress", legs: [{ leg: 1, status: "completed" }, { leg: 2, status: "pending" }], tie: { state: "first_leg_played", total1: 3, total2: 0 } }, { now });
  assert.equal(between.state, "in_progress");
  assert.match(between.reason, /Po 1\. spotkaniu suma 3:0\. Następne: 2\. spotkanie — bez terminu/);

  const overdue = matchWorkState({ ...base, status: "in_progress", legs: [{ leg: 1, status: "completed" }, { leg: 2, status: "pending", scheduledAt: "2026-11-28T17:00:00.000Z" }], tie: { state: "first_leg_played", total1: 1, total2: 1 } }, { now });
  assert.equal(overdue.state, "needs_result");
  assert.match(overdue.reason, /Dzień 2\. spotkania .* minął, a wyniku nie ma/);

  const level = matchWorkState({ ...base, status: "in_progress", legs: [{ leg: 1, status: "completed" }, { leg: 2, status: "completed" }], tie: { state: "awaiting_decision", total1: 2, total2: 2 } }, { now });
  assert.equal(level.state, "needs_result");
  assert.equal(level.action.label, "Rozstrzygnij awans");
  assert.match(level.reason, /wskaż, kto awansuje, i podaj powód/);

  const waiting = matchWorkState({ status: "pending", player1Id: 1, player2Id: null, legs: [{ leg: 1, status: "pending" }, { leg: 2, status: "pending" }], tie: { state: "not_started", total1: 0, total2: 0 } }, { now });
  assert.equal(waiting.state, "waiting");
});
