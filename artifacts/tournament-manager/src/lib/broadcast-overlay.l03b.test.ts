import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OVERLAY_DEFAULTS, overlayUrl, parseOverlayParams, pickOverlayMatch, winnerModel,
  type PublicMatch, type PublicStage, type PublicTournament,
} from "./broadcast-overlay";
import { eventText, nextAlertQueue, overlayEvents, overlaySnapshot, type AlertItem, type OverlayEvent } from "./broadcast-overlay-events";

// #324-L03b · next / last / winner presentations and on-air alerts derived only from real changes between two answers.

const stage = (over: Partial<PublicStage> = {}): PublicStage =>
  ({ id: 1, name: "Play-off", position: 1, format: "single_elimination", status: "active", bestOf: 3, matchRules: null, allowDraws: false, scheduleTimeZone: null, ...over });
const match = (over: Partial<PublicMatch> = {}): PublicMatch => ({
  id: 10, stageId: 1, stageGroupId: null, round: 1, matchNumber: 1, sortOrder: null, player1Name: "Ada", player2Name: "Bartek",
  player1Id: 1, player2Id: 2, score1: null, score2: null, winnerId: null, resultType: null, bestOf: 3, status: "pending", sets: null, scheduledAt: null, ...over,
});
const tournament = (over: Partial<PublicTournament> = {}): PublicTournament =>
  ({ id: 7, name: "Puchar", status: "in_progress", featuredMatchId: null, activeStageId: 1, participantType: "players", winnerId: null, ...over });

test("L03b address: next / last / winner / alerts round-trip; alerts are off unless asked for", () => {
  assert.equal(parseOverlayParams("?t=7").alerts, false, "alerts are never on by default");
  for (const word of ["nastepny", "ostatni"] as const) {
    const config = { ...OVERLAY_DEFAULTS, tournamentId: 7, match: word, alerts: true };
    const url = overlayUrl("https://x.test", "/", config);
    assert.equal(url, `https://x.test/overlay.html?t=7&mecz=${word}&alerty=1`);
    assert.deepEqual(parseOverlayParams(new URL(url).search), config);
  }
  const winner = { ...OVERLAY_DEFAULTS, tournamentId: 7, kind: "zwyciezca" as const };
  assert.equal(overlayUrl("https://x.test", "/", winner), "https://x.test/overlay.html?t=7&widok=zwyciezca");
  assert.equal(parseOverlayParams("?t=7&widok=zwyciezca").kind, "zwyciezca");
  assert.equal(overlayUrl("https://x.test", "/", { ...OVERLAY_DEFAULTS, tournamentId: 7, kind: "struktura", alerts: true }), "https://x.test/overlay.html?t=7&widok=struktura", "no alerts on the board");
  assert.equal(parseOverlayParams("?t=7&alerty=yes").alerts, false);
  assert.equal(parseOverlayParams("?t=7&mecz=NASTEPNY").match, "ekran");
});

test("L03b match choice: next never shows the match being played; last is the latest saved result", () => {
  const live = match({ id: 1, status: "in_progress" });
  const ready = match({ id: 2, matchNumber: 2, player1Id: 3, player2Id: 4, player1Name: "Cela", player2Name: "Daro" });
  const done = match({ id: 3, matchNumber: 3, status: "completed", score1: 2, score2: 1, winnerId: 1, completedAt: "2026-11-21T10:00:00Z" });
  const bye = match({ id: 4, matchNumber: 4, status: "completed", resultType: "bye", winnerId: 1, completedAt: "2026-11-21T11:00:00Z" });
  const pick = (m: "nastepny" | "ostatni", t = tournament(), list = [live, ready, done, bye]) => { const r = pickOverlayMatch({ match: m }, t, list); return r.match ? r.match.id : r.reason; };
  assert.equal(pick("nastepny"), 2);
  assert.equal(pick("ostatni"), 3, "a bye is never the latest result");
  assert.equal(pick("nastepny", tournament(), [live, done]), "Na razie żaden kolejny mecz nie jest gotowy.");
  assert.equal(pick("nastepny", tournament({ status: "completed" }), [done]), "Turniej jest zakończony.");
  assert.equal(pick("ostatni", tournament(), [live, ready]), "Nie ma jeszcze zapisanych wyników.");
});

test("L03b winner: the tournament winner only from the engine; before that the winner of the latest decided match", () => {
  const semi = match({ id: 1, status: "completed", score1: 2, score2: 0, winnerId: 1, completedAt: "2026-11-21T10:00:00Z" });
  const final = match({ id: 2, round: 2, player2Id: 3, player2Name: "Cela", status: "completed", score1: 1, score2: 2, winnerId: 3, completedAt: "2026-11-21T11:00:00Z" });
  assert.deepEqual(
    { ...winnerModel(tournament(), [semi], [stage()]), title: "" },
    { title: "", heading: "Zwycięzca meczu", name: "Ada", detail: "2:0 z Bartek · Play-off · Finał", champion: false, reason: null },
  );
  const champ = winnerModel(tournament({ status: "completed", winnerId: 3 }), [semi, final], [stage()]);
  assert.equal(champ.heading, "Zwycięzca turnieju");
  assert.equal(champ.name, "Cela");
  assert.equal(winnerModel(tournament({ status: "completed", winnerId: null }), [semi, final], [stage()]).heading, "Zwycięzca meczu", "no winner is guessed");
  assert.equal(winnerModel(tournament(), [match()], [stage()]).name, null);
});

const snap = (matches: PublicMatch[], over: Partial<PublicTournament> = {}, stages = [stage(), stage({ id: 2, name: "Finały", position: 2 })]) =>
  overlaySnapshot(tournament(over), matches, stages);

test("L03b alerts: nothing on the first answer; a finished match, an advance, a new stage and the champion when they happen", () => {
  const sf1 = match({ id: 1 });
  const sf2 = match({ id: 2, matchNumber: 2, player1Id: 3, player2Id: 4, player1Name: "Cela", player2Name: "Daro" });
  const final = match({ id: 3, round: 2, player1Id: null, player2Id: null, player1Name: null, player2Name: null });
  const start = snap([sf1, sf2, final]);
  assert.deepEqual(overlayEvents(null, start), [], "a reload never replays anything");
  assert.deepEqual(overlayEvents(start, start), []);
  const live = snap([{ ...sf1, status: "in_progress", score1: 1, score2: 0 }, sf2, final]);
  assert.deepEqual(overlayEvents(start, live), [], "a score change is not an alert (the score animates on its own)");
  const after = snap([{ ...sf1, status: "completed", score1: 2, score2: 0, winnerId: 1 }, sf2, { ...final, player1Id: 1, player1Name: "Ada" }]);
  assert.deepEqual(overlayEvents(live, after), [
    { kind: "match_end", matchId: 1, winner: "Ada", loser: "Bartek", score: "2:0", draw: false },
    { kind: "advance", matchId: 3, fromMatchId: 1, name: "Ada", where: "Finał" },
  ]);
  const stageTwo = snap([sf1, sf2, final], { activeStageId: 2 });
  assert.deepEqual(overlayEvents(start, stageTwo), [{ kind: "stage", stageId: 2, name: "Finały" }]);
  const done = snap([{ ...sf1, status: "completed", winnerId: 1, score1: 2, score2: 0 }], { status: "completed", winnerId: 1 });
  const before = snap([{ ...sf1, status: "completed", winnerId: 1, score1: 2, score2: 0 }]);
  assert.deepEqual(overlayEvents(before, done), [{ kind: "champion", name: "Ada" }]);
});

test("L03b alerts: corrections and undo are honest — no celebration that is no longer true", () => {
  const done = snap([match({ id: 1, status: "completed", score1: 2, score2: 1, winnerId: 1 })]);
  const corrected = snap([match({ id: 1, status: "completed", score1: 1, score2: 2, winnerId: 2 })]);
  const reverted = snap([match({ id: 1, status: "pending" })]);
  assert.deepEqual(overlayEvents(done, corrected), [{ kind: "corrected", matchId: 1, side1: "Ada", side2: "Bartek", score: "1:2" }]);
  assert.deepEqual(overlayEvents(done, reverted), [{ kind: "reverted", matchId: 1 }]);

  let id = 0;
  const end: OverlayEvent = { kind: "match_end", matchId: 1, winner: "Ada", loser: "Bartek", score: "2:1", draw: false };
  const advance: OverlayEvent = { kind: "advance", matchId: 5, fromMatchId: 1, name: "Ada", where: "Finał" };
  const champion: OverlayEvent = { kind: "champion", name: "Ada" };
  let queue: AlertItem[] = nextAlertQueue([], [end, advance, champion], () => ++id);
  assert.equal(queue.length, 3);
  queue = nextAlertQueue(queue, [{ kind: "reverted", matchId: 1 }], () => ++id);
  assert.deepEqual(queue, [], "undo removes the match end, the advance it caused and the champion");
  queue = nextAlertQueue([], [end, advance], () => ++id);
  queue = nextAlertQueue(queue, [{ kind: "corrected", matchId: 1, side1: "Ada", side2: "Bartek", score: "1:2" }], () => ++id);
  assert.deepEqual(queue.map((item) => item.event.kind), ["corrected"]);
  // at most three wait — a burst never builds a long backlog on air
  queue = nextAlertQueue([], Array.from({ length: 6 }, (_, i) => ({ ...end, matchId: i + 10 })), () => ++id);
  assert.equal(queue.length, 3);
});

test("L03b alerts: walkover, draw, no contest and byes are announced truthfully or not at all", () => {
  const before = snap([match({ id: 1 }), match({ id: 2, player1Id: 3, player2Id: 4, player1Name: "Cela", player2Name: "Daro" }), match({ id: 3 }), match({ id: 4 })]);
  const after = snap([
    match({ id: 1, status: "completed", resultType: "walkover", winnerId: 2 }),
    match({ id: 2, player1Id: 3, player2Id: 4, player1Name: "Cela", player2Name: "Daro", status: "completed", resultType: "played", score1: 1, score2: 1 }),
    match({ id: 3, status: "completed", resultType: "no_contest" }),
    match({ id: 4, status: "completed", resultType: "bye", winnerId: 1 }),
  ]);
  const events = overlayEvents(before, after);
  assert.deepEqual(events.map((e) => e.kind === "match_end" ? `${e.matchId}:${e.score}:${e.draw}` : e.kind), ["1:W.O.:false", "2:1:1:true"]);
  assert.deepEqual(eventText(events[0] as Exclude<OverlayEvent, { kind: "reverted" }>), { label: "Koniec meczu", text: "Wygrywa Bartek · W.O. z Ada" });
  assert.deepEqual(eventText(events[1] as Exclude<OverlayEvent, { kind: "reverted" }>), { label: "Koniec meczu", text: "Remis 1:1" });
});
