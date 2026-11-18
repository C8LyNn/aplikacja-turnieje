import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OVERLAY_DEFAULTS, bracketView, doubleView, eliminationRoundName, matchCard, matchOverlayModel, nameFit, overlayUrl, parseOverlayParams,
  pickOverlayMatch, pickStage, scheduleText, tablesView, toPublicMatch, toPublicStage, toPublicTournament, upcomingHeading, upcomingQueue,
  type PublicMatch, type PublicStage,
} from "./broadcast-overlay";
import { HIDDEN_POLL_MS, MAX_RETRY_MS, STALE_AFTER_MS, isStale, nextPollDelay } from "../overlay/overlay-data";

const stage = (over: Partial<PublicStage> = {}): PublicStage =>
  ({ id: 1, name: "Play-off", position: 1, format: "single_elimination", status: "active", bestOf: 3, matchRules: null, allowDraws: false, scheduleTimeZone: null, ...over });
const match = (over: Partial<PublicMatch> = {}): PublicMatch => ({
  id: 10, stageId: 1, stageGroupId: null, round: 1, matchNumber: 1, sortOrder: null, player1Name: "Ada", player2Name: "Bartek",
  player1Id: 1, player2Id: 2, score1: null, score2: null, winnerId: null, resultType: null, bestOf: 3, status: "pending", sets: null, scheduledAt: null, ...over,
});

test("overlay address: round trip, short links, and nothing outside the whitelist is accepted", () => {
  const config = { ...OVERLAY_DEFAULTS, tournamentId: 7, preset: "sport" as const, match: 42 as const, motion: 2 as const, textScale: 1.25 as const };
  const url = overlayUrl("http://127.0.0.1:15188", "/", config);
  assert.equal(url, "http://127.0.0.1:15188/overlay.html?t=7&mecz=42&styl=sport&ruch=2&tekst=1.25");
  assert.deepEqual(parseOverlayParams(new URL(url).search), config);
  assert.equal(overlayUrl("https://x.test", "/app", { ...OVERLAY_DEFAULTS, tournamentId: 3 }), "https://x.test/app/overlay.html?t=3", "defaults are not written");
  const hostile = parseOverlayParams("?t=-1&styl=<script>&widok=admin&mecz=1e9&tekst=9&ruch=7&grupa=" + "x".repeat(60) + "&token=abc");
  assert.equal(hostile.tournamentId, null);
  assert.equal(hostile.preset, "arena");
  assert.equal(hostile.kind, "wynik");
  assert.equal(hostile.match, "ekran");
  assert.equal(hostile.textScale, 1);
  assert.equal(hostile.motion, 1);
  assert.equal(hostile.group, null);
  assert.ok(!("token" in hostile), "no credential is ever read from the address");
});

test("public mapping copies only what an overlay shows (no notes, reasons, fields or access data)", () => {
  const raw = { id: 10, stageId: 1, round: 2, matchNumber: 1, player1Name: "Ada", player2Name: "Bartek", score1: 2, score2: 1, status: "completed",
    bestOf: 3, note: "prywatna notatka", resultReason: "kontuzja", customFields: { phone: "123" }, organizerToken: "secret", sets: [{ score1: 11, score2: 7 }, { score1: "x" }] };
  const mapped = toPublicMatch(raw) as unknown as Record<string, unknown>;
  for (const key of ["note", "resultReason", "customFields", "organizerToken"]) assert.ok(!(key in mapped), key);
  assert.deepEqual(mapped.sets, [{ score1: 11, score2: 7 }], "broken set entries are dropped, not invented");
  const t = toPublicTournament({ id: 1, name: "T", status: "in_progress", featuredMatchId: 5, hasOrganizerPassword: true, visibility: "public_online", hostCode: "x" }) as unknown as Record<string, unknown>;
  for (const key of ["hasOrganizerPassword", "visibility", "hostCode"]) assert.ok(!(key in t), key);
});

test("match card: series, sets (never shown as maps), draws, walkovers, live status and missing opponents", () => {
  const series = matchCard(match({ status: "completed", score1: 2, score2: 1, winnerId: 1, resultType: "played" }), stage(), [match()], false);
  assert.deepEqual([series.score1, series.score2, series.scoreUnit, series.winner, series.format, series.status], ["2", "1", null, 1, "Do 2 wygranych", "Zakończony"]);
  assert.equal(series.context, "Play-off · Finał");

  const setStage = stage({ format: "round_robin", name: "Liga", matchRules: { version: 1, kind: "sets", setsToWin: 2, pointsPerSet: 11, winBy: 2 } as PublicStage["matchRules"] });
  const sets = matchCard(match({ status: "completed", score1: 2, score2: 1, winnerId: 1, resultType: "played", sets: [{ score1: 11, score2: 8 }, { score1: 9, score2: 11 }, { score1: 12, score2: 10 }] }), setStage, [], false);
  assert.equal(sets.scoreUnit, "sety");
  assert.equal(sets.format, "Do 2 wygranych setów · set do 11");
  assert.deepEqual(sets.sets.map((s) => s.winner), [1, 2, 1]);
  assert.equal(sets.context, "Liga · Runda 1");

  const draw = matchCard(match({ status: "completed", score1: 1, score2: 1, resultType: "played", bestOf: 1 }), stage({ format: "round_robin", name: "Liga", allowDraws: true }), [], false);
  assert.equal(draw.resultNote, "Remis");
  assert.equal(draw.format, "Mecz ligowy · remis możliwy");
  assert.equal(matchCard(match({ status: "completed", resultType: "walkover", winnerId: 2 }), stage(), [], false).resultNote, "Walkower");

  const live = matchCard(match({ status: "in_progress", score1: 1, score2: 0 }), stage(), [], false);
  assert.deepEqual([live.live, live.status, live.score1], [true, "Na żywo", "1"]);
  const waiting = matchCard(match({ player2Name: null, player2Id: null }), stage(), [], true);
  assert.deepEqual([waiting.side2, waiting.score1, waiting.status], ["Drużyna do ustalenia", "–", "Przed meczem"], "no invented score before the match");
});

test("the overlay follows 'Na ekranie' or a pinned match, and says why it shows nothing", () => {
  const tournament = toPublicTournament({ id: 1, name: "T", featuredMatchId: 11 });
  const matches = [match({ id: 10 }), match({ id: 11 })];
  assert.equal((pickOverlayMatch({ match: "ekran" }, tournament, matches) as { match: PublicMatch }).match.id, 11);
  assert.equal((pickOverlayMatch({ match: 10 }, tournament, matches) as { match: PublicMatch }).match.id, 10);
  assert.match((pickOverlayMatch({ match: "ekran" }, { ...tournament, featuredMatchId: null }, matches) as { reason: string }).reason, /Na ekranie/);
  assert.match((pickOverlayMatch({ match: 99 }, tournament, matches) as { reason: string }).reason, /nie ma w tym turnieju/);
});

test("upcoming queue keeps the organizer's order and skips finished, postponed, cancelled or incomplete pairings", () => {
  const list = [match({ id: 1, status: "completed" }), match({ id: 2, round: 2 }), match({ id: 3, round: 1, sortOrder: 5 }), match({ id: 4, round: 1, player2Name: null }), match({ id: 5, round: 1 }), match({ id: 6, stageId: 2 }),
    match({ id: 7, round: 1, status: "postponed" }), match({ id: 8, round: 1, status: "cancelled" })];
  assert.deepEqual(upcomingQueue(list[0], list).map((m) => m.id), [3, 5, 2]);
  assert.equal(scheduleText(null, null), null);
  assert.match(scheduleText("2026-11-26T17:00:00.000Z", "Europe/Warsaw") ?? "", /26 lis.*18:00/);
});

test("structure: elimination round names, one round as a readable fragment, stage choice", () => {
  assert.deepEqual([4, 3, 2, 1].map((r) => eliminationRoundName(r, 4)), ["Finał", "Półfinał", "Ćwierćfinał", "1/8 finału"]);
  const cup = [1, 2, 3, 4].map((n) => match({ id: n, round: 1, matchNumber: n })).concat([match({ id: 5, round: 2, matchNumber: 1 }), match({ id: 6, round: 2, matchNumber: 2 }), match({ id: 7, round: 3 })]);
  const all = bracketView(stage(), cup, null, false);
  assert.equal(all.kind, "bracket");
  assert.deepEqual(all.kind === "bracket" && all.rounds.map((r) => [r.name, r.matches.length]), [["Ćwierćfinał", 4], ["Półfinał", 2], ["Finał", 1]]);
  const semi = bracketView(stage(), cup, 2, false);
  assert.deepEqual(semi.kind === "bracket" && [semi.fragment, semi.rounds.length], ["Półfinał", 1]);
  assert.equal(bracketView(stage(), cup, 9, false).kind, "empty");
  assert.equal(bracketView(stage(), [], null, false).kind, "empty");
  const stages = [stage({ id: 1, position: 1, status: "completed" }), stage({ id: 2, position: 2, status: "active" }), stage({ id: 3, position: 3, status: "planned" })];
  assert.equal(pickStage(stages, 3, 2)?.id, 3);
  assert.equal(pickStage(stages, null, 2)?.id, 2);
  assert.equal(pickStage(stages, null, null)?.id, 2, "without an active stage: the last one that started");
});

test("structure: group and league tables come from the engine's standings, one group can be chosen", () => {
  const standings = { tables: [
    { label: "Grupa A", rows: [{ rank: 1, playerName: "Ada", played: 3, wins: 3, draws: 0, losses: 0, points: 9, diff: 5, zone: "qualify" }, { rank: 2, playerName: "Bartek", played: 3, wins: 0, draws: 1, losses: 2, points: 1, diff: -5, zone: "out" }] },
    { label: "Grupa B", rows: [{ rank: 1, playerName: "Celina", played: 3, wins: 2, draws: 0, losses: 1, points: 6, diff: 2, zone: "qualify" }] },
  ] };
  const groups = tablesView(stage({ format: "group_stage", name: "Faza grupowa" }), standings, null);
  assert.equal(groups.kind, "tables");
  assert.deepEqual(groups.kind === "tables" && [groups.tables.length, groups.showDraws, groups.showPoints], [2, true, true]);
  const b = tablesView(stage({ format: "group_stage" }), standings, "Grupa B");
  assert.deepEqual(b.kind === "tables" && b.tables.map((t) => t.label), ["Grupa B"]);
  assert.equal(tablesView(stage({ format: "group_stage" }), standings, "Grupa Z").kind, "empty");
  assert.equal(tablesView(stage({ format: "round_robin" }), { tables: [] }, null).kind, "empty");
});

test("structure: double elimination is split into winners, losers and the grand final in Polish", () => {
  const state = {
    participants: [{ participantKey: "a", name: "Alfa" }, { participantKey: "b", name: "Beta" }],
    matches: [
      { name: "Upper R1 M1", bracket: "upper", round: 1, order: 0, slots: ["a", "b"], status: "completed", score1: 2, score2: 0, winnerParticipantKey: "a" },
      { name: "Lower R1 M1", bracket: "lower", round: 1, order: 1, slots: ["b", null], status: "blocked" },
      { name: "Grand Final", bracket: "grand_final", round: 1, order: 2, slots: [null, null], status: "blocked" },
      { name: "Grand Final Reset", bracket: "grand_final_reset", round: 1, order: 3, slots: [null, null], status: "blocked" },
    ],
  };
  const view = doubleView(stage({ format: "double_elimination", name: "Etap 1" }), state, null);
  assert.equal(view.kind, "double");
  if (view.kind !== "double") return;
  assert.deepEqual(view.sections.map((s) => s.label), ["Drabinka wygranych", "Drabinka przegranych", "Wielki finał"]);
  assert.deepEqual(view.sections[0].rounds[0].matches[0], { name: "Wygrani R1 M1", side1: "Alfa", side2: "Beta", score1: "2", score2: "0", winner: 1, live: false });
  assert.equal(view.sections[2].rounds.flatMap((r) => r.matches).length, 1, "an unplayed reset final is not shown");
  assert.equal(doubleView(stage(), { matches: [] }, null).kind, "empty");
});

test("stage mapping keeps set rules and draw rules only", () => {
  const s = toPublicStage({ id: 2, name: "Liga", position: 1, format: "round_robin", status: "active", bestOf: 1, leagueRules: { allowDraws: true, points: {} }, matchRules: { kind: "other" }, seedingAudit: { secret: 1 } });
  assert.deepEqual([s.allowDraws, s.matchRules], [true, null]);
  assert.ok(!("seedingAudit" in s));
});

// ─── V5.9.1 ────────────────────────────────────────────────────────────────

test("V5.9.1: long names are fitted (smaller, two lines), never cut; the score box says VS until a score is stored", () => {
  assert.deepEqual(["Ada", "Ośmiornice z Kołobrzegu", "Akademia E-sportu Politechniki Gdańskiej — Drużyna Alfa"].map(nameFit), ["normal", "long", "xlong"]);
  const live = matchCard(match({ status: "in_progress", player2Name: "Akademia E-sportu Politechniki Gdańskiej — Drużyna Alfa" }), stage(), [], true);
  assert.deepEqual([live.hasScore, live.state, live.fit1, live.fit2], [false, "live", "normal", "xlong"]);
  assert.equal(live.side2, "Akademia E-sportu Politechniki Gdańskiej — Drużyna Alfa", "the full name is kept");
  const done = matchCard(match({ status: "completed", score1: 3, score2: 2, winnerId: 1, resultType: "played", bestOf: 5 }), stage(), [], false);
  assert.deepEqual([done.hasScore, done.score1, done.score2, done.format], [true, "3", "2", "Do 3 wygranych"]);
  assert.equal(matchCard(match({ bestOf: 1 }), stage(), [], false).format, "Jedna gra");
});

test("V5.9.1: the upcoming heading follows the real state — a postponed or cancelled match is never 'Następny mecz'", () => {
  assert.deepEqual(["pending", "live", "completed", "postponed", "cancelled"].map((state) => upcomingHeading({ state: state as never })),
    ["Następny mecz", "Teraz gramy", "Wynik meczu", "Mecz przełożony", "Mecz odwołany"]);
  assert.equal(matchCard(match({ status: "postponed" }), stage(), [], false).state, "postponed");
});

test("V5.9.1: a big bracket shows the current part (at most three rounds), a round with many matches takes two columns", () => {
  const rounds = [16, 8, 4, 2, 1];
  let id = 0;
  const big = rounds.flatMap((count, i) => Array.from({ length: count }, (_, n) => match({ id: ++id, round: i + 1, matchNumber: n + 1, status: i === 0 && n < 10 ? "completed" : "pending" })));
  const view = bracketView(stage(), big, null, false);
  assert.equal(view.kind, "bracket");
  if (view.kind !== "bracket") return;
  assert.deepEqual(view.rounds.map((r) => [r.name, r.matches.length, r.columns]), [["1/16 finału", 16, 2], ["1/8 finału", 8, 1], ["Ćwierćfinał", 4, 1]]);
  const later = big.map((m) => (m.round === 1 || (m.round === 2 && m.matchNumber <= 8) ? { ...m, status: "completed" } : m));
  const next = bracketView(stage(), later, null, false);
  assert.deepEqual(next.kind === "bracket" && [next.fragment, next.rounds.map((r) => r.name)], ["od: Ćwierćfinał", ["Ćwierćfinał", "Półfinał", "Finał"]]);
  const small = bracketView(stage(), big.filter((m) => m.round >= 3), null, false);
  assert.deepEqual(small.kind === "bracket" && [small.fragment, small.rounds.length], [null, 3], "a small bracket is shown whole");
});

test("V5.9.1: the match overlay model holds only what is shown — another match changing does not change it", () => {
  const tournament = toPublicTournament({ id: 1, name: "Puchar", featuredMatchId: 10, participantType: "players" });
  const list = [match({ id: 10, status: "in_progress" }), match({ id: 11, matchNumber: 2 })];
  const a = matchOverlayModel({ match: "ekran", kind: "wynik", showQueue: false }, tournament, list, [stage()]);
  const b = matchOverlayModel({ match: "ekran", kind: "wynik", showQueue: false }, tournament, [list[0], { ...list[1], status: "completed", score1: 2, score2: 0 }], [stage()]);
  assert.equal(JSON.stringify(a), JSON.stringify(b), "unrelated result: same model, so the overlay does not re-render");
  const c = matchOverlayModel({ match: "ekran", kind: "wynik", showQueue: false }, tournament, [{ ...list[0], status: "completed", score1: 2, score2: 1, winnerId: 1, resultType: "played" }, list[1]], [stage()]);
  assert.notEqual(JSON.stringify(a), JSON.stringify(c));
  const none = matchOverlayModel({ match: "ekran", kind: "wynik", showQueue: false }, { ...tournament, featuredMatchId: null }, list, []);
  assert.deepEqual([none.card, none.reason], [null, "Żaden mecz nie jest teraz „Na ekranie”."]);
  const upcoming = matchOverlayModel({ match: 11, kind: "zapowiedz", showQueue: true }, tournament, [...list, match({ id: 12, matchNumber: 3 })], [stage()]);
  assert.deepEqual(upcoming.queue.map((q) => q.id), [12]);
});

test("V5.9.1: staleness is shown only after 15 s without a good answer; retries back off to 20 s; hidden or closed sources poll every 30 s", () => {
  assert.equal(isStale(null, 1e9), false);
  assert.equal(isStale(1000, 1000 + STALE_AFTER_MS - 1), false, "one failed request is not news for viewers");
  assert.equal(isStale(1000, 1000 + STALE_AFTER_MS), true);
  assert.deepEqual([0, 1, 2, 3, 6].map((failures) => nextPollDelay({ intervalMs: 5000, failures, hidden: false, problem: failures ? "offline" : null })), [5000, 10000, MAX_RETRY_MS, MAX_RETRY_MS, MAX_RETRY_MS]);
  assert.equal(nextPollDelay({ intervalMs: 5000, failures: 0, hidden: true, problem: null }), HIDDEN_POLL_MS);
  assert.equal(nextPollDelay({ intervalMs: 5000, failures: 1, hidden: false, problem: "private" }), HIDDEN_POLL_MS);
});
