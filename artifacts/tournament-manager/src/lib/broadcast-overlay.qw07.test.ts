import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OVERLAY_DEFAULTS, matchOverlayModel, overlayUrl, parseOverlayParams, pickCurrentMatch, pickOverlayMatch, toPublicMatch,
  type PublicMatch, type PublicStage, type PublicTournament,
} from "./broadcast-overlay";

// QW-07 · "aktualny mecz" for the existing score overlay: no second overlay, one more way to choose the match.

const stage = (over: Partial<PublicStage> = {}): PublicStage =>
  ({ id: 1, name: "Play-off", position: 1, format: "single_elimination", status: "active", bestOf: 3, matchRules: null, allowDraws: false, scheduleTimeZone: null, ...over });
const match = (over: Partial<PublicMatch> = {}): PublicMatch => ({
  id: 10, stageId: 1, stageGroupId: null, round: 1, matchNumber: 1, sortOrder: null, player1Name: "Ada", player2Name: "Bartek",
  player1Id: 1, player2Id: 2, score1: null, score2: null, winnerId: null, resultType: null, bestOf: 3, status: "pending", sets: null, scheduledAt: null, ...over,
});
const tournament = (over: Partial<PublicTournament> = {}): PublicTournament =>
  ({ id: 7, name: "Puchar", status: "in_progress", featuredMatchId: null, activeStageId: 1, participantType: "players", winnerId: null, ...over });
const picked = (t: PublicTournament, matches: PublicMatch[]) => { const r = pickCurrentMatch(t, matches); return r.match ? r.match.id : r.reason; };

test("QW-07 address: mecz=auto round-trips; old addresses keep meaning exactly what they meant", () => {
  const config = { ...OVERLAY_DEFAULTS, tournamentId: 7, match: "auto" as const };
  const url = overlayUrl("http://127.0.0.1:15188", "/", config);
  assert.equal(url, "http://127.0.0.1:15188/overlay.html?t=7&mecz=auto");
  assert.deepEqual(parseOverlayParams(new URL(url).search), config);
  // V5.9 / V5.9.1 addresses already pasted into OBS
  assert.equal(parseOverlayParams("?t=7").match, "ekran");
  assert.equal(parseOverlayParams("?t=7&mecz=42").match, 42);
  assert.equal(overlayUrl("https://x.test", "/", { ...OVERLAY_DEFAULTS, tournamentId: 3 }), "https://x.test/overlay.html?t=3");
  // anything else is not a mode
  for (const bad of ["AUTO", "auto ", "ekran", "live", "-1", "1e9", "auto&token=x"]) assert.notEqual(parseOverlayParams(`?t=7&mecz=${bad}`).match === "auto" && bad !== "auto&token=x", true, bad);
  assert.equal(parseOverlayParams("?t=7&mecz=AUTO").match, "ekran");
  assert.ok(!("token" in parseOverlayParams("?t=7&mecz=auto&token=abc")));
  // the structure view has no match, so the mode is not written there
  assert.equal(overlayUrl("https://x.test", "/", { ...OVERLAY_DEFAULTS, tournamentId: 3, kind: "struktura", match: "auto" }), "https://x.test/overlay.html?t=3&widok=struktura");
});

test("QW-07 current match: on screen, then live, then next ready, then the latest result", () => {
  const done = match({ id: 1, status: "completed", score1: 2, score2: 0, winnerId: 1, completedAt: "2026-11-20T10:00:00Z" });
  const doneLater = match({ id: 2, matchNumber: 2, status: "completed", score1: 1, score2: 2, winnerId: 2, completedAt: "2026-11-20T11:00:00Z" });
  const live = match({ id: 3, matchNumber: 3, status: "in_progress" });
  const ready = match({ id: 4, matchNumber: 4 });
  const waiting = match({ id: 5, round: 2, matchNumber: 1, player2Id: null, player2Name: null });
  const all = [done, doneLater, live, ready, waiting];
  assert.equal(picked(tournament({ featuredMatchId: 1 }), all), 1, "the organizer's choice wins even over a live match");
  assert.equal(picked(tournament(), all), 3, "live");
  assert.equal(picked(tournament(), [done, doneLater, ready, waiting]), 4, "next ready");
  assert.equal(picked(tournament(), [done, doneLater, waiting]), 2, "latest saved result, by its real time");
  assert.equal(picked(tournament(), [waiting]), "Na razie żaden mecz nie jest gotowy do rozegrania.");
  assert.equal(picked(tournament({ status: "draft" }), []), "Turniej jeszcze się nie rozpoczął.");
  // a featured id that is not in this tournament is ignored, not shown as an error
  assert.equal(picked(tournament({ featuredMatchId: 999 }), all), 3);
});

test("QW-07 current match: order inside each step follows the engine, schedules and stages; byes are never shown", () => {
  const a = match({ id: 11, round: 1, matchNumber: 2 });
  const b = match({ id: 12, round: 1, matchNumber: 1 });
  assert.equal(picked(tournament(), [a, b]), 12, "engine order");
  const scheduledLate = match({ id: 13, matchNumber: 1, scheduledAt: "2026-11-20T18:00:00Z" });
  const scheduledEarly = match({ id: 14, matchNumber: 5, scheduledAt: "2026-11-20T16:00:00Z" });
  assert.equal(picked(tournament(), [a, scheduledLate, scheduledEarly]), 14, "scheduled matches first, by their real time");
  const otherStage = match({ id: 15, stageId: 2, matchNumber: 1 });
  assert.equal(picked(tournament({ activeStageId: 1 }), [otherStage, a]), 11, "the current stage first");
  assert.equal(picked(tournament({ activeStageId: 1 }), [otherStage]), 15, "another stage only when the current one has nothing ready");
  const twoLive = [match({ id: 21, matchNumber: 2, status: "in_progress" }), match({ id: 22, matchNumber: 1, status: "in_progress" })];
  assert.equal(picked(tournament(), twoLive), 22);
  const bye = match({ id: 31, status: "completed", resultType: "bye", player2Id: null, player2Name: null, completedAt: "2026-11-20T12:00:00Z" });
  const real = match({ id: 32, matchNumber: 2, status: "completed", score1: 2, score2: 1, completedAt: "2026-11-20T09:00:00Z" });
  assert.equal(picked(tournament(), [bye, real]), 32, "a bye is not a result");
  assert.equal(picked(tournament(), [bye]), "Na razie żaden mecz nie jest gotowy do rozegrania.");
  // results without a saved time fall back to the engine order (latest round last)
  const r1 = match({ id: 41, round: 1, status: "completed" }), r2 = match({ id: 42, round: 2, status: "completed" });
  assert.equal(picked(tournament(), [r1, r2]), 42);
  // a finished tournament shows its last result, never "next"
  assert.equal(picked(tournament({ status: "completed" }), [match({ id: 51 }), r1]), 41);
  // postponed and cancelled matches are not "next"
  assert.equal(picked(tournament(), [match({ id: 61, status: "postponed" }), match({ id: 62, status: "cancelled" })]), "Na razie żaden mecz nie jest gotowy do rozegrania.");
});

test("QW-07 model: auto shows A vs B, the score and the round through the unchanged card; other modes are untouched", () => {
  const stages = [stage()];
  const semi = match({ id: 1, round: 1, matchNumber: 1, status: "completed", score1: 2, score2: 1, winnerId: 1, completedAt: "2026-11-20T10:00:00Z" });
  const final = match({ id: 2, round: 2, matchNumber: 1, player1Name: "Ada", player2Name: "Cezary", player1Id: 1, player2Id: 3 });
  const auto = matchOverlayModel({ match: "auto", kind: "wynik", showQueue: false }, tournament(), [semi, final], stages);
  assert.ok(auto.card);
  assert.equal(auto.title, "Puchar");
  assert.equal(auto.reason, null);
  const pinned = matchOverlayModel({ match: 2, kind: "wynik", showQueue: false }, tournament(), [semi, final], stages);
  assert.deepEqual(auto, pinned, "auto picks the final and renders it exactly like a pinned match");
  const afterResult = matchOverlayModel({ match: "auto", kind: "wynik", showQueue: false }, tournament(), [semi, { ...final, status: "completed", score1: 0, score2: 2, winnerId: 3, completedAt: "2026-11-20T12:00:00Z" }], stages);
  assert.notDeepEqual(afterResult, auto, "a saved result changes what is shown");
  // "ekran" and pinned behave as in V5.9.1
  assert.deepEqual(pickOverlayMatch({ match: "ekran" }, tournament(), [semi, final]), { match: null, reason: "Żaden mecz nie jest teraz „Na ekranie”." });
  assert.deepEqual(pickOverlayMatch({ match: 99 }, tournament(), [semi, final]), { match: null, reason: "Wybranego meczu nie ma w tym turnieju." });
  assert.equal((pickOverlayMatch({ match: "ekran" }, tournament({ featuredMatchId: 1 }), [semi, final]) as { match: PublicMatch }).match.id, 1);
  const empty = matchOverlayModel({ match: "auto", kind: "wynik", showQueue: false }, tournament({ status: "draft" }), [], stages);
  assert.equal(empty.card, null);
  assert.equal(empty.reason, "Turniej jeszcze się nie rozpoczął.");
});

test("QW-07 fix: an address without ruch= uses the default gentle animation (it was read as 'no animation')", () => {
  assert.equal(parseOverlayParams("?t=7").motion, OVERLAY_DEFAULTS.motion);
  assert.equal(parseOverlayParams("?t=7").motion, 1);
  assert.equal(parseOverlayParams("?t=7&ruch=0").motion, 0, "an explicit 'Bez ruchu' is kept");
  assert.equal(parseOverlayParams("?t=7&ruch=2").motion, 2);
  for (const bad of ["", "7", "-1", "abc", "1.5", "00"]) assert.equal(parseOverlayParams(`?t=7&ruch=${bad}`).motion, 1, bad);
  // every default configuration survives a round trip unchanged (what the organizer panel stores and reads back)
  const defaults = { ...OVERLAY_DEFAULTS, tournamentId: 7 };
  assert.deepEqual(parseOverlayParams(new URL(overlayUrl("https://x.test", "/", defaults)).search), defaults);
  const still = { ...defaults, motion: 0 as const };
  assert.equal(overlayUrl("https://x.test", "/", still), "https://x.test/overlay.html?t=7&ruch=0");
  assert.deepEqual(parseOverlayParams(new URL(overlayUrl("https://x.test", "/", still)).search), still);
});

test("QW-07 public mapping: only the completion time is added; private fields still never reach the overlay", () => {
  const mapped = toPublicMatch({ id: 1, stageId: 1, round: 1, matchNumber: 1, status: "completed", completedAt: "2026-11-20T10:00:00Z",
    note: "prywatna", resultReason: "kontuzja", customFields: { phone: "1" }, organizerToken: "secret" }) as unknown as Record<string, unknown>;
  assert.equal(mapped.completedAt, "2026-11-20T10:00:00Z");
  for (const key of ["note", "resultReason", "customFields", "organizerToken"]) assert.ok(!(key in mapped), key);
  assert.equal((toPublicMatch({ id: 1, completedAt: 5 }) as unknown as Record<string, unknown>).completedAt, null, "a non-text time is dropped");
});
