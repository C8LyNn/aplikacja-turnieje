import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addLocalDays,
  generateRoundDates,
  instantToLocal,
  isValidTimeZone,
  localDateTimeToInstant,
  restingParticipantsByRound,
  roundRobinFacts,
  scheduleStateOf,
} from "../src/domain/tournament/league-schedule";
import { generateRoundRobinSchedule } from "../src/domain/tournament/round-robin";

test("time zones are validated against the runtime's IANA database", () => {
  assert.equal(isValidTimeZone("Europe/Warsaw"), true);
  assert.equal(isValidTimeZone("America/Argentina/Buenos_Aires"), true);
  assert.equal(isValidTimeZone("UTC"), true);
  assert.equal(isValidTimeZone("Mars/Olympus"), false);
  assert.equal(isValidTimeZone("Europe/Warsaw; DROP"), false);
  assert.equal(isValidTimeZone(""), false);
  assert.equal(isValidTimeZone(42), false);
});

test("local time converts to the exact UTC instant in winter and summer (no implicit shift)", () => {
  const winter = localDateTimeToInstant("2026-12-01", "18:00", "Europe/Warsaw");
  assert.ok(winter.ok);
  assert.equal(winter.instant.toISOString(), "2026-12-01T17:00:00.000Z");
  const summer = localDateTimeToInstant("2026-07-01", "18:00", "Europe/Warsaw");
  assert.ok(summer.ok);
  assert.equal(summer.instant.toISOString(), "2026-07-01T16:00:00.000Z");
  const utc = localDateTimeToInstant("2026-07-01", "18:00", "UTC");
  assert.ok(utc.ok);
  assert.equal(utc.instant.toISOString(), "2026-07-01T18:00:00.000Z");
  // Round trip back to the league's local time.
  assert.deepEqual(instantToLocal(winter.instant, "Europe/Warsaw"), { date: "2026-12-01", time: "18:00", timeZone: "Europe/Warsaw" });
  assert.deepEqual(instantToLocal(summer.instant, "Europe/Warsaw"), { date: "2026-07-01", time: "18:00", timeZone: "Europe/Warsaw" });
  // The same instant shown in another zone is a different wall-clock time, never a different instant.
  assert.deepEqual(instantToLocal(summer.instant, "America/New_York"), { date: "2026-07-01", time: "12:00", timeZone: "America/New_York" });
});

test("DST gap and overlap are rejected instead of being moved", () => {
  const gap = localDateTimeToInstant("2026-03-29", "02:30", "Europe/Warsaw");
  assert.equal(gap.ok, false);
  assert.equal(!gap.ok && gap.code, "LOCAL_TIME_DOES_NOT_EXIST");
  const overlap = localDateTimeToInstant("2026-10-25", "02:30", "Europe/Warsaw");
  assert.equal(overlap.ok, false);
  assert.equal(!overlap.ok && overlap.code, "LOCAL_TIME_AMBIGUOUS");
  const around = localDateTimeToInstant("2026-03-29", "03:00", "Europe/Warsaw");
  assert.ok(around.ok);
  assert.equal(around.instant.toISOString(), "2026-03-29T01:00:00.000Z");
});

test("input format errors are explicit", () => {
  const codes = [
    localDateTimeToInstant("2026-02-30", "18:00", "Europe/Warsaw"),
    localDateTimeToInstant("01.12.2026", "18:00", "Europe/Warsaw"),
    localDateTimeToInstant("2026-12-01", "24:00", "Europe/Warsaw"),
    localDateTimeToInstant("2026-12-01", "18:00", "Nowhere/City"),
  ].map((result) => (result.ok ? "ok" : result.code));
  assert.deepEqual(codes, ["INVALID_LOCAL_DATE", "INVALID_LOCAL_DATE", "INVALID_LOCAL_TIME", "INVALID_TIME_ZONE"]);
});

test("round dates keep the local hour across a DST change (weekly league over the October switch)", () => {
  const result = generateRoundDates({ startDate: "2026-10-18", intervalDays: 7, defaultTime: "18:00", timeZone: "Europe/Warsaw" }, 3);
  assert.ok(result.ok);
  assert.deepEqual(result.rounds.map((round) => [round.round, round.date, round.time]), [
    [1, "2026-10-18", "18:00"],
    [2, "2026-10-25", "18:00"],
    [3, "2026-11-01", "18:00"],
  ]);
  assert.deepEqual(result.rounds.map((round) => round.scheduledAt.toISOString()), [
    "2026-10-18T16:00:00.000Z",
    "2026-10-25T17:00:00.000Z",
    "2026-11-01T17:00:00.000Z",
  ]);
  assert.equal(addLocalDays("2026-12-28", 7), "2027-01-04");
});

test("generator refuses an impossible slot and names the round", () => {
  const result = generateRoundDates({ startDate: "2026-03-22", intervalDays: 7, defaultTime: "02:30", timeZone: "Europe/Warsaw" }, 3);
  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.round, 2);
  assert.equal(!result.ok && result.code, "LOCAL_TIME_DOES_NOT_EXIST");
  const interval = generateRoundDates({ startDate: "2026-03-22", intervalDays: 0, defaultTime: "18:00", timeZone: "Europe/Warsaw" }, 3);
  assert.equal(!interval.ok && interval.code, "INVALID_INTERVAL");
  assert.equal((generateRoundDates({ startDate: "2026-03-22", intervalDays: 7, defaultTime: "18:00", timeZone: "UTC" }, 0) as { code: string }).code, "NO_ROUNDS");
});

test("schedule states distinguish scheduled, awaiting result, played and postponed", () => {
  const now = new Date("2026-12-10T12:00:00Z");
  assert.equal(scheduleStateOf({ status: "pending", scheduledAt: null }, now), "unscheduled");
  assert.equal(scheduleStateOf({ status: "pending", scheduledAt: new Date("2026-12-11T18:00:00Z") }, now), "scheduled");
  assert.equal(scheduleStateOf({ status: "pending", scheduledAt: new Date("2026-12-09T18:00:00Z") }, now), "awaiting_result");
  // V5.6: a start that passed today means "should be under way", not "result missing".
  assert.equal(scheduleStateOf({ status: "pending", scheduledAt: new Date("2026-12-10T09:00:00Z") }, now), "due");
  assert.equal(scheduleStateOf({ status: "in_progress", scheduledAt: new Date("2026-12-09T18:00:00Z") }, now), "awaiting_result");
  assert.equal(scheduleStateOf({ status: "in_progress", scheduledAt: new Date("2026-12-10T09:00:00Z") }, now), "in_progress");
  assert.equal(scheduleStateOf({ status: "in_progress", scheduledAt: null }, now), "in_progress");
  // The match day is judged on the league's calendar: a 23:30 Warsaw match is a past day at 00:10 Warsaw time,
  // while the same two instants fall on one UTC day.
  const justAfterMidnight = new Date("2026-12-09T23:10:00Z");
  assert.equal(scheduleStateOf({ status: "pending", scheduledAt: new Date("2026-12-09T22:30:00Z") }, justAfterMidnight, "Europe/Warsaw"), "awaiting_result");
  assert.equal(scheduleStateOf({ status: "pending", scheduledAt: new Date("2026-12-09T22:30:00Z") }, justAfterMidnight, "UTC"), "due");
  assert.equal(scheduleStateOf({ status: "completed", scheduledAt: new Date("2026-12-09T18:00:00Z") }, now), "completed");
  assert.equal(scheduleStateOf({ status: "postponed", scheduledAt: new Date("2026-12-09T18:00:00Z") }, now), "postponed");
});

test("odd league: every round has exactly one resting participant and everyone rests once per leg", () => {
  const ids = [1, 2, 3, 4, 5, 6, 7];
  const pairings = generateRoundRobinSchedule(ids.map((id) => ({ id, seed: id })), 1);
  const resting = restingParticipantsByRound(ids, pairings);
  assert.equal(resting.size, 7);
  for (const [, idle] of resting) assert.equal(idle.length, 1);
  assert.deepEqual([...resting.values()].flat().sort(), ids);
  assert.deepEqual(roundRobinFacts(7, 1), { matches: 21, rounds: 7, matchesPerRound: 3, restingPerRound: 1, matchesPerParticipant: 6 });
  assert.equal(pairings.length, 21);
});

test("league size facts match the generator (8 single, 8 home-and-away, 12 home-and-away)", () => {
  for (const [count, legs] of [[8, 1], [8, 2], [12, 2], [7, 2]] as const) {
    const pairings = generateRoundRobinSchedule(Array.from({ length: count }, (_, index) => ({ id: index + 1, seed: index + 1 })), legs);
    const facts = roundRobinFacts(count, legs);
    assert.equal(pairings.length, facts.matches, `${count}/${legs} matches`);
    assert.equal(Math.max(...pairings.map((pairing) => pairing.round)), facts.rounds, `${count}/${legs} rounds`);
  }
  assert.deepEqual(roundRobinFacts(12, 2), { matches: 132, rounds: 22, matchesPerRound: 6, restingPerRound: 0, matchesPerParticipant: 22 });
});
