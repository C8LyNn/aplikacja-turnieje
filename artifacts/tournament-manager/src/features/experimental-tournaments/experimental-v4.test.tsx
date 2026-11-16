import test from "node:test";
import assert from "node:assert/strict";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Match, Player, Tournament, TournamentStage } from "@workspace/api-client-react";
import { matchFlow, pickResumeTournament, rosterHealth, stageRail } from "@/features/experimental-tournaments/experimental-v4-model";
import {
  ExperimentalMatchFlow,
  ExperimentalResumeCard,
  ExperimentalRosterHealth,
  ExperimentalStageRail,
} from "@/features/experimental-tournaments/experimental-v4-panels";

test.afterEach(() => cleanup());

const t = (id: number, status: Tournament["status"], createdAt: string, extra: Partial<Tournament> = {}) =>
  ({ id, name: `T${id}`, status, createdAt, currentRound: null, totalRounds: null, ...extra }) as Tournament;
const p = (name: string, seed?: number | null) => ({ id: Math.random(), name, seed: seed ?? null }) as unknown as Player;
const m = (id: number, round: number, status: Match["status"], extra: Partial<Match> = {}) =>
  ({ id, round, matchNumber: id, sortOrder: null, stageId: 1, status, player1Id: 1, player2Id: 2, player1Name: `A${id}`, player2Name: `B${id}`, ...extra }) as Match;
const s = (id: number, position: number, status: TournamentStage["status"], extra: Partial<TournamentStage> = {}) =>
  ({ id, position, status, name: `Etap ${position}`, format: "swiss", currentRound: null, totalRounds: null, plannedRounds: null, ...extra }) as TournamentStage;

/* model */

test("resume: newest active tournament wins over drafts, with round progress", () => {
  const r = pickResumeTournament([
    t(1, "draft", "2026-11-16T10:00:00Z"),
    t(2, "active", "2026-11-10T10:00:00Z", { currentRound: 3, totalRounds: 4 }),
    t(3, "active", "2026-11-01T10:00:00Z"),
    t(4, "completed", "2026-11-17T10:00:00Z"),
  ]);
  assert.equal(r?.tournament.id, 2);
  assert.equal(r?.reason, "active");
  assert.equal(r?.progress, 50);
});

test("resume: falls back to newest draft, null when only completed or empty", () => {
  assert.equal(pickResumeTournament([t(1, "draft", "2026-11-01T00:00:00Z"), t(2, "draft", "2026-11-02T00:00:00Z")])?.tournament.id, 2);
  assert.equal(pickResumeTournament([t(1, "completed", "2026-11-01T00:00:00Z")]), null);
  assert.equal(pickResumeTournament([]), null);
  assert.equal(pickResumeTournament(undefined), null);
});

test("roster: minimum, duplicate nicks (case-insensitive), duplicate and missing seeds", () => {
  const h = rosterHealth([p("Ala", 1), p("ala ", 1), p("Ola")], 8);
  assert.equal(h.count, 3);
  assert.equal(h.freeSlots, 5);
  assert.equal(h.ready, false);
  const keys = h.issues.map((i) => i.key);
  assert.deepEqual(keys, ["dup-name", "dup-seed", "seed-missing"]);
  assert.match(h.issues[1]!.label, /Powtórzone rozstawienie: 1/);
});

test("roster: empty list and over-limit are reported; clean list is ready", () => {
  assert.equal(rosterHealth([], null).issues[0]?.key, "min");
  const over = rosterHealth([p("A", 1), p("B", 2), p("C", 3)], 2);
  assert.ok(over.issues.some((i) => i.key === "over"));
  assert.equal(over.freeSlots, 0);
  const ok = rosterHealth([p("A", 1), p("B", 2)], 4);
  assert.equal(ok.ready, true);
  assert.deepEqual(ok.issues, []);
});

test("stage rail: ordered by position, counts ignore cancelled, active stage is current", () => {
  const items = stageRail(
    [s(20, 2, "active", { currentRound: 2, totalRounds: 5 }), s(10, 1, "completed"), s(30, 3, "planned")],
    [m(1, 1, "completed", { stageId: 10 }), m(2, 1, "completed", { stageId: 20 }), m(3, 2, "pending", { stageId: 20 }), m(4, 2, "cancelled", { stageId: 20 })],
  );
  assert.deepEqual(items.map((i) => i.id), [10, 20, 30]);
  assert.deepEqual(items.map((i) => i.isCurrent), [false, true, false]);
  assert.equal(items[1]!.roundLabel, "Runda 2/5");
  assert.deepEqual([items[1]!.done, items[1]!.total], [1, 2]);
  assert.equal(stageRail([s(1, 1, "completed"), s(2, 2, "planned")], [])[1]!.isCurrent, true);
});

test("match flow: round of focused match, up next skips focused, unpaired and non-pending", () => {
  const list = [
    m(1, 1, "completed"),
    m(2, 1, "in_progress"),
    m(3, 1, "pending"),
    m(4, 1, "pending", { player2Id: null }),
    m(5, 2, "pending"),
    m(6, 2, "pending"),
    m(7, 2, "pending"),
    m(8, 1, "cancelled"),
  ];
  const f = matchFlow(list, 3);
  assert.equal(f.round, 1);
  assert.deepEqual([f.roundDone, f.roundTotal], [1, 4]);
  assert.deepEqual(f.upNext.map((x) => x.id), [5, 6, 7]);
  assert.equal(matchFlow(list, null).round, 1);
  assert.equal(matchFlow([], null).round, null);
});

/* panels */

test("resume card links active tournaments to Experimental host", () => {
  render(<ExperimentalResumeCard tournaments={[t(7, "active", "2026-11-16T00:00:00Z", { currentRound: 2, totalRounds: 3 })]} />);
  const link = screen.getByRole("link", { name: /Prowadź mecze/ });
  assert.equal(link.getAttribute("href"), "/experimental/tournaments/7/host");
  assert.ok(screen.getByRole("progressbar", { name: "Postęp turnieju" }));
});

test("resume card sends drafts to the Experimental players tab and hides when nothing to resume", () => {
  const { unmount } = render(<ExperimentalResumeCard tournaments={[t(9, "draft", "2026-11-16T00:00:00Z")]} />);
  assert.equal(screen.getByRole("link", { name: /Dodaj uczestników/ }).getAttribute("href"), "/experimental/tournaments/9?tab=players");
  unmount();
  const { container } = render(<ExperimentalResumeCard tournaments={[t(1, "completed", "2026-11-16T00:00:00Z")]} />);
  assert.equal(container.innerHTML, "");
});

test("roster health shows count, capacity and issue chips as text", () => {
  render(<ExperimentalRosterHealth players={[p("A", 1), p("a", 2)]} maxPlayers={4} />);
  assert.ok(screen.getByText("wolne miejsca: 2"));
  assert.ok(screen.getByText("1 powtórzony nick"));
  assert.equal(screen.queryByText("Lista gotowa do startu"), null);
});

test("stage rail marks the current step and is hidden for a single stage", () => {
  render(<ExperimentalStageRail stages={[s(1, 1, "completed"), s(2, 2, "active")]} matches={[]} activeStageId={2} />);
  const items = screen.getAllByRole("listitem");
  assert.equal(items[1]!.getAttribute("aria-current"), "step");
  cleanup();
  const { container } = render(<ExperimentalStageRail stages={[s(1, 1, "active")]} matches={[]} />);
  assert.equal(container.innerHTML, "");
});

test("match flow selects the next match and respects the disabled state", () => {
  const picked: number[] = [];
  const list = [m(1, 1, "completed"), m(2, 1, "pending"), m(3, 1, "pending")];
  const { rerender } = render(<ExperimentalMatchFlow matches={list} focusedMatchId={2} onSelect={(id) => picked.push(id)} />);
  assert.ok(screen.getByText("rozegranych", { exact: false }));
  fireEvent.click(screen.getByRole("button", { name: /A3 kontra B3/ }));
  assert.deepEqual(picked, [3]);
  rerender(<ExperimentalMatchFlow matches={list} focusedMatchId={2} onSelect={(id) => picked.push(id)} disabled />);
  assert.equal((screen.getByRole("button", { name: /A3 kontra B3/ }) as HTMLButtonElement).disabled, true);
});
