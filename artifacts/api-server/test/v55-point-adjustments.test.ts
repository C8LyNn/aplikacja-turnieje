import test from "node:test";
import assert from "node:assert/strict";
import { calculateMatchRecordStandings } from "../src/domain/tournament/standings";
import { classicLeagueRules } from "../src/domain/tournament/league-rules";
import {
  activePointTotals,
  parsePointAdjustments,
  pointAdjustmentsFromStorage,
  validateNewAdjustment,
  type PointAdjustment,
} from "../src/domain/tournament/point-adjustments";

const players = [1, 2, 3].map((id) => ({ id, name: `P${id}`, rank: null, teamName: null, country: null, seed: id, status: "active" as const }));
const played = (id: number, p1: number, p2: number, s1: number, s2: number) => ({
  id, player1Id: p1, player2Id: p2, status: "completed", resultType: "played", score1: s1, score2: s2,
  winnerId: s1 > s2 ? p1 : s2 > s1 ? p2 : null, bestOf: 1,
}) as never;
const rules = classicLeagueRules();
const matches = [played(1, 1, 2, 2, 0), played(2, 2, 3, 1, 0), played(3, 1, 3, 1, 1)];

test("adjustments change only points; tie-breakers still decide and score columns stay as played", () => {
  const plain = calculateMatchRecordStandings(players, matches, "round_robin", rules);
  assert.deepEqual(plain.map((row) => [row.playerId, row.points]), [[1, 4], [2, 3], [3, 1]]);
  const penalised = calculateMatchRecordStandings(players, matches, "round_robin", rules, new Map([[1, -1]]));
  // P1 3 pts (penalty) vs P2 3 pts: head-to-head P1 beat P2 → P1 stays ahead, decided by the tie-breaker.
  assert.deepEqual(penalised.map((row) => [row.playerId, row.points]), [[1, 3], [2, 3], [3, 1]]);
  assert.equal(penalised[1].decidedBy, "head_to_head");
  assert.equal(penalised[0].pointAdjustment, -1);
  assert.equal(penalised[0].gameWins, plain[0].gameWins, "scores untouched");
  const bonus = calculateMatchRecordStandings(players, matches, "round_robin", rules, new Map([[3, 5]]));
  assert.deepEqual(bonus.map((row) => row.playerId), [3, 1, 2]);
  assert.equal(bonus.find((row) => row.playerId === 2)?.pointAdjustment, undefined, "no key when zero");
});

test("tables without league rules ignore adjustments (ranked by wins, unchanged shape)", () => {
  const legacy = calculateMatchRecordStandings(players, matches.slice(0, 2), "round_robin", null, new Map([[3, 50]]));
  assert.equal(legacy[0].playerId !== 3, true);
  assert.equal("pointAdjustment" in legacy[0], false);
});

test("totals skip revoked entries; storage reads are tolerant, backup parsing strict", () => {
  const entries: PointAdjustment[] = [
    { id: "a", playerId: 1, points: -3, reason: "Spóźnienie", createdAt: "2026-11-18T10:00:00.000Z", revokedAt: null },
    { id: "b", playerId: 1, points: 3, reason: "Zwrot", createdAt: "2026-11-18T11:00:00.000Z", revokedAt: null },
    { id: "c", playerId: 2, points: 2, reason: "Fair play", createdAt: "2026-11-18T12:00:00.000Z", revokedAt: "2026-11-18T13:00:00.000Z" },
    { id: "d", playerId: 2, points: -1, reason: "Kara", createdAt: "2026-11-18T12:00:00.000Z", revokedAt: null },
  ];
  assert.deepEqual([...activePointTotals(entries)], [[2, -1]], "net zero and revoked entries drop out");
  assert.equal(pointAdjustmentsFromStorage([...entries, { id: "x" }, "junk"]).length, 4);
  assert.equal(pointAdjustmentsFromStorage(null).length, 0);
  assert.equal(parsePointAdjustments([...entries, { id: "x" }]).ok, false);
  assert.equal(parsePointAdjustments([entries[0], entries[0]]).ok, false, "duplicate ids");
  assert.equal(parsePointAdjustments([{ ...entries[0], points: 0 }]).ok, false);
  assert.equal(parsePointAdjustments([{ ...entries[0], points: 101 }]).ok, false);
});

test("new adjustments: participant of the stage, whole non-zero points within range, a one-line reason", () => {
  const context = { participantIds: new Set([1, 2]), existing: [] as PointAdjustment[] };
  assert.equal(validateNewAdjustment({ playerId: 1, points: -3, reason: " Walkower bez zgłoszenia " }, context).ok, true);
  for (const bad of [
    { playerId: 9, points: -3, reason: "x" },
    { playerId: 1, points: 0, reason: "x" },
    { playerId: 1, points: 1.5, reason: "x" },
    { playerId: 1, points: -101, reason: "x" },
    { playerId: 1, points: 2, reason: "" },
    { playerId: 1, points: 2, reason: "a\nb" },
    { playerId: 1, points: 2, reason: "y".repeat(201) },
  ]) assert.equal(validateNewAdjustment(bad, context).ok, false, JSON.stringify(bad).slice(0, 60));
  const full = { participantIds: new Set([1]), existing: Array.from({ length: 200 }, (_, index) => ({ id: `e${index}`, playerId: 1, points: 1, reason: "r", createdAt: "2026-11-18T10:00:00.000Z", revokedAt: null })) };
  assert.equal(validateNewAdjustment({ playerId: 1, points: 1, reason: "r" }, full).ok, false, "entry limit");
});
