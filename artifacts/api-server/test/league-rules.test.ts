import assert from "node:assert/strict";
import { test } from "node:test";
import {
  classicLeagueRules,
  describeLeagueRules,
  isLeagueDraw,
  parseLeagueRules,
  validateLeagueRulesForStage,
  validateLeagueScore,
  type LeagueRules,
} from "../src/domain/tournament/league-rules";
import {
  calculateMatchRecordStandings,
  type StandingsMatch,
  type StandingsPlayer,
} from "../src/domain/tournament/standings";

const players = (count: number): StandingsPlayer[] =>
  Array.from({ length: count }, (_, index) => ({ id: index + 1, name: `P${index + 1}`, seed: index + 1, status: "active" }));

const played = (player1Id: number, player2Id: number, score1: number, score2: number): StandingsMatch => ({
  status: "completed",
  resultType: "played",
  player1Id,
  player2Id,
  score1,
  score2,
  winnerId: score1 === score2 ? null : score1 > score2 ? player1Id : player2Id,
});

const order = (rows: ReturnType<typeof calculateMatchRecordStandings>) => rows.map((row) => row.playerId);

test("parseLeagueRules: null keeps legacy behaviour; defaults are explicit", () => {
  assert.deepEqual(parseLeagueRules(undefined), { ok: true, value: null });
  assert.deepEqual(parseLeagueRules(null), { ok: true, value: null });
  const parsed = parseLeagueRules({ points: { win: 3, draw: 1, loss: 0 } });
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.value, {
    version: 1,
    allowDraws: false,
    points: { win: 3, draw: 1, loss: 0 },
    tieBreakers: ["head_to_head", "score_difference", "scored", "wins"],
  });
  assert.deepEqual(parseLeagueRules(classicLeagueRules()), { ok: true, value: classicLeagueRules() });
});

test("parseLeagueRules rejects ambiguous or unsafe rules with precise codes", () => {
  const codes = (value: unknown) => {
    const parsed = parseLeagueRules(value);
    return parsed.ok ? [] : parsed.problems.map((problem) => problem.code);
  };
  assert.deepEqual(codes("3-1-0"), ["LEAGUE_RULES_NOT_OBJECT"]);
  assert.deepEqual(codes({}), ["LEAGUE_POINTS_INVALID"]);
  assert.deepEqual(codes({ points: { win: 1, draw: 1, loss: 1 } }), ["LEAGUE_POINTS_ORDER_INVALID"]);
  assert.deepEqual(codes({ points: { win: 3, draw: 4, loss: 0 } }), ["LEAGUE_POINTS_ORDER_INVALID"]);
  assert.deepEqual(codes({ points: { win: 3, draw: 1, loss: -1 } }), ["LEAGUE_POINTS_INVALID"]);
  assert.deepEqual(codes({ points: { win: 2.5, draw: 1, loss: 0 } }), ["LEAGUE_POINTS_INVALID"]);
  assert.deepEqual(codes({ points: { win: 3, draw: 1, loss: 0, bonus: 1 } }), ["LEAGUE_RULES_UNKNOWN_FIELD"]);
  assert.deepEqual(codes({ points: { win: 3, draw: 1, loss: 0 }, tieBreakers: ["coin_flip"] }), ["LEAGUE_TIE_BREAKER_UNKNOWN"]);
  assert.deepEqual(codes({ points: { win: 3, draw: 1, loss: 0 }, tieBreakers: ["wins", "wins"] }), ["LEAGUE_TIE_BREAKER_DUPLICATE"]);
  assert.deepEqual(codes({ points: { win: 3, draw: 1, loss: 0 }, version: 2 }), ["LEAGUE_RULES_VERSION_UNSUPPORTED"]);
  assert.deepEqual(codes({ points: { win: 3, draw: 1, loss: 0 }, allowDraws: "yes" }), ["LEAGUE_RULES_ALLOW_DRAWS_INVALID"]);
  assert.deepEqual(codes({ points: { win: 3, draw: 1, loss: 0 }, scoring: {} }), ["LEAGUE_RULES_UNKNOWN_FIELD"]);
});

test("rules fit only league formats; draws need a single-game match", () => {
  const rules = classicLeagueRules();
  assert.deepEqual(validateLeagueRulesForStage(rules, { format: "round_robin", bestOf: 1 }), []);
  assert.deepEqual(validateLeagueRulesForStage(rules, { format: "group_stage", bestOf: 1 }), []);
  assert.deepEqual(
    validateLeagueRulesForStage(rules, { format: "single_elimination", bestOf: 1 }).map((problem) => problem.code),
    ["LEAGUE_RULES_FORMAT_UNSUPPORTED"],
  );
  assert.deepEqual(
    validateLeagueRulesForStage(rules, { format: "round_robin", bestOf: 3 }).map((problem) => problem.code),
    ["LEAGUE_DRAWS_REQUIRE_SINGLE_GAME"],
  );
  assert.deepEqual(validateLeagueRulesForStage({ ...rules, allowDraws: false }, { format: "round_robin", bestOf: 3 }), []);
  assert.deepEqual(validateLeagueRulesForStage(null, { format: "single_elimination", bestOf: 3 }), []);
});

test("validateLeagueScore: free score, equal is a draw, bounds enforced", () => {
  assert.deepEqual(validateLeagueScore(2, 2), { ok: true, outcome: "draw" });
  assert.deepEqual(validateLeagueScore(0, 0), { ok: true, outcome: "draw" });
  assert.deepEqual(validateLeagueScore(5, 3), { ok: true, outcome: "player1" });
  assert.deepEqual(validateLeagueScore(0, 1), { ok: true, outcome: "player2" });
  assert.deepEqual(validateLeagueScore(-1, 0), { ok: false, code: "SCORE_NEGATIVE" });
  assert.deepEqual(validateLeagueScore(1.5, 0), { ok: false, code: "SCORE_NOT_INTEGER" });
  assert.deepEqual(validateLeagueScore(1000, 0), { ok: false, code: "SCORE_TOO_HIGH" });
  assert.equal(isLeagueDraw({ resultType: "played", winnerId: null, score1: 1, score2: 1 }), true);
  assert.equal(isLeagueDraw({ resultType: "played", winnerId: 1, score1: 2, score2: 1 }), false);
  assert.equal(isLeagueDraw({ resultType: "no_contest", winnerId: null, score1: null, score2: null }), false);
});

test("classic 3/1/0 table: draws, points and score difference are consistent", () => {
  const rules = classicLeagueRules();
  const matches = [played(1, 2, 2, 2), played(3, 4, 1, 0), played(1, 3, 3, 0), played(2, 4, 1, 1), played(1, 4, 0, 1), played(2, 3, 2, 0)];
  const table = calculateMatchRecordStandings(players(4), matches, "round_robin", rules);
  const byId = new Map(table.map((row) => [row.playerId, row]));
  // P1: D, W, L = 4 pts (+2); P2: D, D, W = 5 pts; P3: W, L, L = 3 pts; P4: L, D, W = 4 pts (0)
  assert.deepEqual(order(table), [2, 4, 1, 3]);
  assert.deepEqual(
    table.map((row) => [row.playerId, row.points, row.matchWins, row.matchDraws, row.matchLosses, row.matchesPlayed]),
    [[2, 5, 1, 2, 0, 3], [4, 4, 1, 1, 1, 3], [1, 4, 1, 1, 1, 3], [3, 3, 1, 0, 2, 3]],
  );
  // P1 and P4 are level on 4 points; P4 beat P1 head-to-head, so P4 is above despite the worse difference.
  assert.equal(byId.get(4)!.decidedBy, "points");
  assert.equal(byId.get(1)!.decidedBy, "head_to_head");
  const totalPoints = table.reduce((sum, row) => sum + (row.points ?? 0), 0);
  // 4 decisive matches * 3 + 2 draws * 2 = 16
  assert.equal(totalPoints, 16);
  assert.equal(table.reduce((sum, row) => sum + row.gameDiff, 0), 0, "score difference sums to zero");
});

test("head-to-head decides two teams level on points; order in the configured list matters", () => {
  const base = classicLeagueRules();
  // P1 and P2 both 4 pts. P2 beat P1 1:0, but P1 has the better score difference (+4 vs +1).
  const matches = [played(1, 2, 0, 1), played(1, 3, 5, 0), played(1, 4, 0, 0), played(2, 3, 0, 0)];
  const h2hFirst = calculateMatchRecordStandings(players(4), matches, "round_robin", base);
  assert.deepEqual(h2hFirst.slice(0, 2).map((row) => row.points), [4, 4]);
  assert.deepEqual(order(h2hFirst).slice(0, 2), [2, 1]);
  assert.equal(h2hFirst[1]!.decidedBy, "head_to_head");
  const diffFirst = calculateMatchRecordStandings(players(4), matches, "round_robin", {
    ...base,
    tieBreakers: ["score_difference", "head_to_head"],
  });
  assert.deepEqual(order(diffFirst).slice(0, 2), [1, 2]);
  assert.equal(diffFirst[1]!.decidedBy, "score_difference");

  // Three-way tie on 3 points where the mini table is level: score difference decides.
  const threeWay = calculateMatchRecordStandings(players(3), [played(1, 2, 0, 1), played(1, 3, 5, 0), played(2, 3, 0, 1)], "round_robin", base);
  assert.deepEqual(threeWay.map((row) => row.points), [3, 3, 3]);
  assert.deepEqual(order(threeWay), [1, 2, 3]);
  assert.deepEqual(threeWay.map((row) => row.decidedBy), [null, "score_difference", "score_difference"]);
});

test("three-way tie: head-to-head mini table splits the group, remaining criteria apply to sub-groups", () => {
  const rules: LeagueRules = { ...classicLeagueRules(), tieBreakers: ["head_to_head", "score_difference"] };
  // P1, P2, P3 all win against P4; among themselves P1 beat P2, P2 beat P3, P3 beat P1 -> mini table level.
  const matches = [
    played(1, 4, 1, 0), played(2, 4, 3, 0), played(3, 4, 2, 0),
    played(1, 2, 1, 0), played(2, 3, 1, 0), played(3, 1, 1, 0),
  ];
  const table = calculateMatchRecordStandings(players(4), matches, "round_robin", rules);
  assert.deepEqual(table.map((row) => row.points), [6, 6, 6, 0]);
  // score difference: P2 +3, P3 +2, P1 +1
  assert.deepEqual(order(table), [2, 3, 1, 4]);
  assert.deepEqual(table.map((row) => row.decidedBy), [null, "score_difference", "score_difference", "points"]);
  assert.equal(table.some((row) => row.tiedAfterAllRules), false);
});

test("level after every criterion: seed decides deterministically and the rows say so", () => {
  const rules = classicLeagueRules();
  const matches = [played(1, 2, 1, 1), played(3, 4, 1, 1), played(1, 3, 0, 0), played(2, 4, 0, 0), played(1, 4, 2, 2), played(2, 3, 2, 2)];
  const table = calculateMatchRecordStandings(players(4), matches, "round_robin", rules);
  assert.deepEqual(order(table), [1, 2, 3, 4]);
  assert.deepEqual(table.map((row) => row.points), [3, 3, 3, 3]);
  assert.ok(table.every((row) => row.tiedAfterAllRules));
  assert.deepEqual(table.map((row) => row.decidedBy), [null, "seed", "seed", "seed"]);
  // Same input in a different order gives the same table.
  const shuffled = calculateMatchRecordStandings([...players(4)].reverse(), [...matches].reverse(), "round_robin", rules);
  assert.deepEqual(order(shuffled), order(table));
});

test("walkover gives win/loss points without score; no contest is ignored", () => {
  const rules = classicLeagueRules();
  const matches: StandingsMatch[] = [
    { status: "completed", resultType: "walkover", player1Id: 1, player2Id: 2, winnerId: 2, score1: null, score2: null },
    { status: "completed", resultType: "no_contest", player1Id: 1, player2Id: 3, winnerId: null, score1: null, score2: null },
    { status: "pending", resultType: null, player1Id: 2, player2Id: 3, winnerId: null, score1: null, score2: null },
  ];
  const table = calculateMatchRecordStandings(players(3), matches, "round_robin", rules);
  const byId = new Map(table.map((row) => [row.playerId, row]));
  assert.equal(byId.get(2)!.points, 3);
  assert.equal(byId.get(1)!.points, 0);
  assert.equal(byId.get(1)!.matchesPlayed, 1);
  assert.equal(byId.get(3)!.matchesPlayed, 0);
  assert.equal(byId.get(2)!.gameWins, 0);
});

test("custom points change the table (2/1/0 vs 3/1/0)", () => {
  // P1: W, L, L = 1 win; P2: D, D, D-like via three draws
  const matches = [
    played(1, 3, 1, 0), played(1, 2, 0, 1), played(1, 4, 0, 2),
    played(2, 3, 1, 1), played(2, 4, 0, 0), played(3, 4, 2, 2),
  ];
  const classic = calculateMatchRecordStandings(players(4), matches, "round_robin", classicLeagueRules());
  const twoPoint = calculateMatchRecordStandings(players(4), matches, "round_robin", {
    ...classicLeagueRules(),
    points: { win: 2, draw: 1, loss: 0 },
  });
  const pointsOf = (rows: typeof classic, id: number) => rows.find((row) => row.playerId === id)!.points;
  assert.equal(pointsOf(classic, 2), 5);
  assert.equal(pointsOf(twoPoint, 2), 4);
  assert.equal(pointsOf(classic, 1), 3);
  assert.equal(pointsOf(twoPoint, 1), 2);
});

test("without rules the pre-V5.3 table is unchanged and draws are not counted", () => {
  const matches = [played(1, 2, 1, 0), played(3, 4, 1, 0), played(1, 3, 1, 0), played(2, 4, 1, 0)];
  const legacy = calculateMatchRecordStandings(players(4), matches, "round_robin");
  assert.deepEqual(order(legacy), [1, 2, 3, 4]);
  assert.ok(legacy.every((row) => !("points" in row) && !("matchDraws" in row) && !("decidedBy" in row)), "pre-V5.3 response shape");
  const withDraw = calculateMatchRecordStandings(players(2), [played(1, 2, 1, 1)], "round_robin");
  assert.deepEqual(withDraw.map((row) => row.matchesPlayed), [0, 0]);
  // Rules are ignored for formats that are not league tables.
  const swiss = calculateMatchRecordStandings(players(4), matches, "swiss", classicLeagueRules());
  assert.ok(swiss.every((row) => !("points" in row)));
});

test("describeLeagueRules explains the rules in plain Polish", () => {
  assert.equal(
    describeLeagueRules(classicLeagueRules()),
    "Punktacja: zwycięstwo 3 pkt, remis 1 pkt, porażka 0 pkt. Remisy dozwolone. Przy równej liczbie punktów decydują kolejno: mecze bezpośrednie, różnica wyników, zdobyte (gole/punkty), liczba zwycięstw; na końcu rozstawienie.",
  );
  assert.match(
    describeLeagueRules({ ...classicLeagueRules(), allowDraws: false, tieBreakers: [] }),
    /Bez remisów.*decyduje rozstawienie/,
  );
});
