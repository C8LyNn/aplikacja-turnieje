import test from "node:test";
import assert from "node:assert/strict";
import { audiencePollMs, buildAudienceNow, roundText, updatedAtText } from "./audience-now";

type M = Parameters<typeof buildAudienceNow>[0]["matches"] extends readonly (infer T)[] | undefined ? T : never;
const match = (id: number, over: Partial<M> = {}): M => ({
  id, stageId: 1, round: 1, matchNumber: id, status: "pending", player1Id: id * 10, player2Id: id * 10 + 1,
  resultType: undefined, scheduledAt: null, completedAt: null, sortOrder: null, ...over,
}) as M;
const stage = (id: number, position: number, status: string, name = `Etap ${position}`) => ({ id, position, status, name, format: "single_elimination" }) as never;
const active = { status: "active", currentRound: 1, totalRounds: 3 } as never;

test("QW-05 live: every match the organizer marked in progress, the featured one first, nothing else", () => {
  const now = buildAudienceNow({ tournament: active, stage: stage(1, 1, "active"), stages: [], featuredMatchId: 3,
    matches: [match(1, { status: "in_progress" }), match(2), match(3, { status: "in_progress" }), match(4, { status: "completed", resultType: "played" })] });
  assert.deepEqual(now.live.map((m) => m.id), [3, 1]);
});

test("QW-05 next: ready matches of the shown stage, scheduled first by real time, then engine order; no byes", () => {
  const now = buildAudienceNow({ tournament: active, stage: stage(1, 1, "active"), stages: [], matches: [
    match(1, { round: 2 }),
    match(2, { round: 1, matchNumber: 7 }),
    match(3, { player2Id: null }),                       // participant not known yet
    match(4, { resultType: "bye" }),                     // a bye is not a match to play
    match(5, { stageId: 2 }),                            // another stage
    match(6, { round: 3, scheduledAt: "2026-11-20T18:00:00Z" }),
    match(7, { round: 3, scheduledAt: "2026-11-20T17:00:00Z" }),
    match(8, { status: "postponed" }),
  ] });
  assert.deepEqual(now.next.map((m) => m.id), [7, 6, 2, 1]);
});

test("QW-05 recent: finished matches by their real completion time, newest first, byes left out", () => {
  const done = (id: number, at: string | null, resultType = "played") => match(id, { status: "completed", resultType: resultType as never, completedAt: at });
  const now = buildAudienceNow({ tournament: active, stage: stage(1, 1, "active"), stages: [], matches: [
    done(1, "2026-11-19T10:00:00Z"), done(2, "2026-11-19T12:00:00Z"), done(3, "2026-11-19T11:00:00Z", "bye"), done(4, null), done(5, "2026-11-19T11:30:00Z", "walkover"),
  ] });
  assert.deepEqual(now.recent.map((m) => m.id), [2, 5, 1, 4]);
});

test("QW-05 progress counts real matches of the stage (no byes, no cancelled) and is absent before the start", () => {
  const matches = [match(1, { status: "completed", resultType: "played" }), match(2), match(3, { status: "completed", resultType: "bye" }), match(4, { status: "cancelled" })];
  assert.deepEqual(buildAudienceNow({ tournament: active, stage: stage(1, 1, "active"), stages: [], matches }).progress, { done: 1, total: 2 });
  assert.equal(buildAudienceNow({ tournament: active, stage: stage(1, 1, "planned"), stages: [], matches }).progress, null);
});

test("QW-05 waiting states say only what is known", () => {
  const draft = buildAudienceNow({ tournament: { status: "draft" } as never, stage: stage(1, 1, "planned"), stages: [], matches: [match(1)] });
  assert.equal(draft.phase, "draft");
  assert.deepEqual(draft.next, [], "nothing is 'next' before the start");
  assert.match(draft.waiting!, /po starcie/);
  const idle = buildAudienceNow({ tournament: active, stage: stage(1, 1, "active"), stages: [], matches: [match(1, { player1Id: null })] });
  assert.equal(idle.waiting, "Na razie żaden mecz nie jest gotowy do rozegrania.");
  const between = buildAudienceNow({ tournament: active, stage: stage(1, 1, "active"), stages: [stage(1, 1, "active"), stage(2, 2, "planned", "Play-off")],
    matches: [match(1, { status: "completed", resultType: "played" })] });
  assert.equal(between.waiting, "Wszystkie mecze etapu są rozegrane. Następny etap: Play-off.");
  const unclosed = buildAudienceNow({ tournament: active, stage: stage(1, 1, "active"), stages: [stage(1, 1, "active")],
    matches: [match(1, { status: "completed", resultType: "played" })] });
  assert.match(unclosed.waiting!, /po zamknięciu etapu przez organizatora/, "a played-out DE waits for the organizer");
  assert.equal(buildAudienceNow({ tournament: active, stage: stage(1, 1, "active"), stages: [], matches: [match(1)] }).waiting, null);
  const finished = buildAudienceNow({ tournament: { status: "completed" } as never, stage: stage(1, 1, "completed"), stages: [], matches: [match(1, { status: "completed", resultType: "played" })] });
  assert.equal(finished.phase, "completed");
  assert.equal(finished.waiting, null);
});

test("QW-05 round counter only where it means something; slower polling when finished; honest update time", () => {
  assert.equal(roundText({ currentRound: 2, totalRounds: 3 } as never, "single_elimination"), "Runda 2 z 3");
  assert.equal(roundText({ currentRound: 2, totalRounds: 5 } as never, "swiss"), "Runda 2 z 5");
  for (const format of ["double_elimination", "round_robin", "group_stage", undefined]) {
    assert.equal(roundText({ currentRound: 1, totalRounds: 18 } as never, format), null, `${format}: internal or stale counter is hidden`);
  }
  assert.equal(roundText({ currentRound: null, totalRounds: 3 } as never, "single_elimination"), null);
  assert.equal(audiencePollMs(5000, "active"), 5000);
  assert.equal(audiencePollMs(5000, "completed"), 60000);
  assert.equal(updatedAtText(undefined), null);
  assert.match(updatedAtText(Date.UTC(2026, 10, 19, 12, 4, 31))!, /^\d{2}:\d{2}:\d{2}$/);
});

test("QW-05 match labels: double elimination by the engine's key, everything else by round and number", async () => {
  const { matchCode, matchTitle } = await import("./audience-now");
  assert.equal(matchCode({ round: 5, matchNumber: 1, routingMatchKey: "stage-1/match/upper-r2-m1" }), "W R2·1");
  assert.equal(matchCode({ round: 4, matchNumber: 1, routingMatchKey: "stage-1/match/lower-r1-m2" }), "P R1·2");
  assert.equal(matchCode({ round: 7, matchNumber: 1, routingMatchKey: "stage-1/match/grand-final" }), "Finał");
  assert.equal(matchCode({ round: 8, matchNumber: 1, routingMatchKey: "stage-1/match/grand-final-reset" }), "Rewanż");
  assert.equal(matchCode({ round: 2, matchNumber: 3, routingMatchKey: null }), "R2M3");
  assert.equal(matchTitle({ round: 5, matchNumber: 1, routingMatchKey: "stage-1/match/upper-r2-m1" }), "Drabinka wygranych · runda 2 · mecz 1");
  assert.equal(matchTitle({ round: 2, matchNumber: 3, routingMatchKey: "stage-2/match/r2-m3" }), "Runda 2 · Mecz 3");
});
