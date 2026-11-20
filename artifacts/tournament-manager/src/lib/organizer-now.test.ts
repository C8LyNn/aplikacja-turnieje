import test from "node:test";
import assert from "node:assert/strict";
import { deriveOrganizerNow, viewerShareFor } from "./organizer-now";

const m = (id: number, status = "pending", over: Record<string, unknown> = {}) => ({
  id, status, round: 1, matchNumber: id, player1Id: id * 10, player2Id: id * 10 + 1, player1Name: `A${id}`, player2Name: `B${id}`, ...over,
}) as never;
const active = { kind: "active_matches", title: "Etap 1", description: "1 z 4 meczów zakończonych, pozostało 3." } as never;

test("QW-04: while matches are played the main action opens the result of the most urgent match", () => {
  const withLive = deriveOrganizerNow({ step: active, queue: [m(1), m(2, "in_progress"), m(3)], canWriteResults: true })!;
  assert.equal(withLive.primary?.type, "result");
  assert.equal(withLive.primary?.type === "result" && withLive.primary.match.id, 2, "a match in progress first");
  assert.equal(withLive.primary?.type === "result" && withLive.primary.label, "Wpisz wynik: A2 – B2");
  assert.equal(withLive.title, "Wpisz wynik meczu w toku");
  assert.deepEqual(withLive.live.map((x: { id: number }) => x.id), [2]);
  assert.deepEqual(withLive.ready.map((x: { id: number }) => x.id), [1, 3], "every ready match stays one tap away — no forced order");
  const noLive = deriveOrganizerNow({ step: active, queue: [m(4), m(5)], canWriteResults: true })!;
  assert.equal(noLive.primary?.type === "result" && noLive.primary.match.id, 4, "otherwise the first ready match in queue order");
  assert.deepEqual(noLive.ready.map((x: { id: number }) => x.id), [5], "the target is not listed twice");
  assert.equal(noLive.title, "Rozegraj następny mecz");
});

test("QW-04: no invented work — a match without both participants is never offered; no writer, no result action", () => {
  const waiting = deriveOrganizerNow({ step: active, queue: [m(1, "pending", { player2Id: null })], canWriteResults: true })!;
  assert.equal(waiting.primary, null);
  assert.equal(waiting.title, "Etap 1");
  assert.deepEqual(waiting.ready, []);
  const readOnly = deriveOrganizerNow({ step: active, queue: [m(1, "in_progress")], canWriteResults: false })!;
  assert.equal(readOnly.primary, null, "without result rights there is no 'Wpisz wynik'");
  assert.equal(readOnly.live.length, 1, "the live match is still shown");
  assert.equal(deriveOrganizerNow({ step: null, queue: [], canWriteResults: true }), null);
});

test("QW-04: lifecycle steps keep the model's own action (capability-gated there); Swiss rounds run in place", () => {
  const complete = deriveOrganizerNow({ step: { kind: "complete_stage", title: "Sprawdź zakończenie etapu", description: "x", actionLabel: "Zakończ etap", actionHref: "/tournaments/1?tab=stages&stage=2&action=complete&return=host" } as never, queue: [], canWriteResults: true })!;
  assert.deepEqual(complete.primary, { type: "step", label: "Zakończ etap", href: "/tournaments/1?tab=stages&stage=2&action=complete&return=host", onAction: false });
  const supportView = deriveOrganizerNow({ step: { kind: "complete_stage", title: "Sprawdź zakończenie etapu", description: "x" } as never, queue: [], canWriteResults: true })!;
  assert.equal(supportView.primary, null, "the model gives support no lifecycle action, so neither does the panel");
  const swiss = deriveOrganizerNow({ step: { kind: "swiss_round", title: "Runda 1 zakończona", description: "x", actionLabel: "Wygeneruj rundę 2", actionHref: "/tournaments/1/host?tab=prowadzenie" } as never, queue: [], canWriteResults: true, stepRunsInPlace: true })!;
  assert.deepEqual(swiss.primary, { type: "step", label: "Wygeneruj rundę 2", href: undefined, onAction: true });
});

test("QW-04: the viewers' link follows the tournament's visibility", () => {
  assert.equal(viewerShareFor("public_online").kind, "public");
  assert.equal(viewerShareFor(undefined).kind, "public");
  assert.equal(viewerShareFor("private_online").kind, "password");
  assert.match(viewerShareFor("private_online").note, /hasła widza/);
  assert.equal(viewerShareFor("private_offline").kind, "closed");
  assert.match(viewerShareFor("private_offline").note, /nie mają dostępu/);
});

test("QW-04: a draft without enough participants asks for participants in both views (not stage diagnostics)", async () => {
  const { draftEntrantsStep, experimentalDraftNextStep } = await import("@/features/experimental-tournaments/experimental-next-step");
  const diag = { kind: "stage_preparation", title: "Etap wymaga przygotowania", description: "Skład lub seedy etapu są niespójne." };
  const stable = draftEntrantsStep(diag, { tournamentStatus: "draft", participantCount: 0, tournamentId: 7 }) as { title: string; actionHref?: string };
  assert.equal(stable.title, "Dodaj uczestników");
  assert.equal(stable.actionHref, "/tournaments/7?tab=players");
  assert.equal(draftEntrantsStep(diag, { tournamentStatus: "draft", participantCount: 4, tournamentId: 7 }), diag, "enough participants: the model's own step");
  assert.equal(draftEntrantsStep(diag, { tournamentStatus: "active", participantCount: 0, tournamentId: 7 }), diag);
  // Experimental keeps its wording and the same rule
  assert.equal((experimentalDraftNextStep(diag, { tournamentStatus: "draft", participantCount: 1, tournamentId: 7 }) as { title: string }).title, "Dodaj uczestników");
  assert.equal((experimentalDraftNextStep({ kind: "active_matches", title: "Etap 1" }, { tournamentStatus: "active", participantCount: 4, tournamentId: 7 }) as { title: string }).title, "Rozegraj mecze · Etap 1");
});
