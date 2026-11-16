/**
 * SWARM-006 UX v4 — pure view models for the Experimental screens.
 * No API calls and no writes: everything is derived from data the pages already load,
 * so Stable and the server contract are untouched.
 */
import type { Match, Player, Tournament, TournamentStage } from "@workspace/api-client-react";

/* ── Dashboard: "Wróć do pracy" ─────────────────────────────────────────── */

export type ResumeReason = "active" | "draft";
export interface ResumeTarget {
  tournament: Pick<Tournament, "id" | "name" | "status" | "currentRound" | "totalRounds" | "createdAt">;
  reason: ResumeReason;
  /** 0–100 when round data is known for an active tournament. */
  progress: number | null;
}

function newestFirst<T extends { createdAt: string; id: number }>(a: T, b: T): number {
  const byDate = Date.parse(b.createdAt) - Date.parse(a.createdAt);
  return Number.isFinite(byDate) && byDate !== 0 ? byDate : b.id - a.id;
}

export function pickResumeTournament(
  list: ReadonlyArray<Pick<Tournament, "id" | "name" | "status" | "currentRound" | "totalRounds" | "createdAt">> | null | undefined,
): ResumeTarget | null {
  if (!list?.length) return null;
  const active = list.filter((t) => t.status === "active").sort(newestFirst)[0];
  if (active) {
    const { currentRound, totalRounds } = active;
    const progress =
      typeof currentRound === "number" && typeof totalRounds === "number" && totalRounds > 0
        ? Math.round((Math.min(Math.max(currentRound - 1, 0), totalRounds) / totalRounds) * 100)
        : null;
    return { tournament: active, reason: "active", progress };
  }
  const draft = list.filter((t) => t.status === "draft").sort(newestFirst)[0];
  return draft ? { tournament: draft, reason: "draft", progress: null } : null;
}

/* ── Players: roster health ─────────────────────────────────────────────── */

export type HealthTone = "success" | "warning" | "danger" | "info";
export interface RosterIssue { key: string; tone: HealthTone; label: string }
export interface RosterHealth {
  count: number;
  max: number | null;
  freeSlots: number | null;
  ready: boolean;
  issues: RosterIssue[];
}

const nameKey = (name: string) => name.trim().toLocaleLowerCase("pl-PL");

export function rosterHealth(
  players: ReadonlyArray<Pick<Player, "name" | "seed">> | null | undefined,
  maxPlayers: number | null | undefined,
): RosterHealth {
  const list = players ?? [];
  const count = list.length;
  const max = typeof maxPlayers === "number" && maxPlayers > 0 ? maxPlayers : null;
  const freeSlots = max === null ? null : Math.max(0, max - count);
  const issues: RosterIssue[] = [];

  if (count < 2) {
    issues.push({ key: "min", tone: "warning", label: count === 0 ? "Brak uczestników — potrzeba co najmniej 2" : "Potrzeba jeszcze 1 uczestnika" });
  }
  if (max !== null && count > max) {
    issues.push({ key: "over", tone: "danger", label: `Przekroczony limit: ${count}/${max}` });
  }

  const names = new Map<string, number>();
  for (const p of list) names.set(nameKey(p.name), (names.get(nameKey(p.name)) ?? 0) + 1);
  const dupNames = [...names.values()].filter((n) => n > 1).length;
  if (dupNames > 0) {
    issues.push({ key: "dup-name", tone: "danger", label: dupNames === 1 ? "1 powtórzony nick" : `${dupNames} powtórzone nicki` });
  }

  const seeds = new Map<number, number>();
  let missing = 0;
  for (const p of list) {
    if (typeof p.seed === "number") seeds.set(p.seed, (seeds.get(p.seed) ?? 0) + 1);
    else missing += 1;
  }
  const dupSeeds = [...seeds.entries()].filter(([, n]) => n > 1).map(([s]) => s).sort((a, b) => a - b);
  if (dupSeeds.length > 0) {
    issues.push({ key: "dup-seed", tone: "danger", label: `Powtórzone rozstawienie: ${dupSeeds.join(", ")}` });
  }
  if (count > 0 && missing > 0) {
    issues.push({ key: "seed-missing", tone: "info", label: missing === count ? "Rozstawienie zostanie nadane automatycznie" : `${missing} bez rozstawienia (nadane automatycznie)` });
  }

  const ready = count >= 2 && !issues.some((i) => i.tone === "danger");
  return { count, max, freeSlots, ready, issues };
}

/* ── Stages: rail ───────────────────────────────────────────────────────── */

export interface StageRailItem {
  id: number;
  name: string;
  format: TournamentStage["format"];
  status: TournamentStage["status"];
  done: number;
  total: number;
  roundLabel: string | null;
  isCurrent: boolean;
}

export function stageRail(
  stages: ReadonlyArray<Pick<TournamentStage, "id" | "name" | "format" | "status" | "position" | "currentRound" | "totalRounds" | "plannedRounds">> | null | undefined,
  matches: ReadonlyArray<Pick<Match, "stageId" | "status">> | null | undefined,
  activeStageId?: number | null,
): StageRailItem[] {
  const sorted = [...(stages ?? [])].sort((a, b) => a.position - b.position || a.id - b.id);
  const counts = new Map<number, { done: number; total: number }>();
  for (const m of matches ?? []) {
    if (m.status === "cancelled") continue;
    const c = counts.get(m.stageId) ?? { done: 0, total: 0 };
    c.total += 1;
    if (m.status === "completed") c.done += 1;
    counts.set(m.stageId, c);
  }
  const currentId =
    activeStageId ?? sorted.find((s) => s.status === "active")?.id ?? sorted.find((s) => s.status === "planned")?.id ?? null;
  return sorted.map((s) => {
    const c = counts.get(s.id) ?? { done: 0, total: 0 };
    const rounds = s.totalRounds ?? s.plannedRounds ?? null;
    const roundLabel =
      s.status === "active" && typeof s.currentRound === "number"
        ? rounds ? `Runda ${s.currentRound}/${rounds}` : `Runda ${s.currentRound}`
        : null;
    return { id: s.id, name: s.name, format: s.format, status: s.status, done: c.done, total: c.total, roundLabel, isCurrent: s.id === currentId };
  });
}

/* ── Matches: flow (round progress + up next) ───────────────────────────── */

type FlowMatch = Pick<Match, "id" | "round" | "matchNumber" | "sortOrder" | "status" | "player1Id" | "player2Id" | "player1Name" | "player2Name">;
export interface MatchFlow<M extends FlowMatch = FlowMatch> {
  round: number | null;
  roundDone: number;
  roundTotal: number;
  upNext: M[];
}

const order = (a: FlowMatch, b: FlowMatch) =>
  a.round - b.round || (a.sortOrder ?? a.matchNumber) - (b.sortOrder ?? b.matchNumber) || a.id - b.id;
const playable = (m: FlowMatch) => m.status === "pending" && m.player1Id != null && m.player2Id != null;

export function matchFlow<M extends FlowMatch>(matches: ReadonlyArray<M> | null | undefined, focusedMatchId: number | null | undefined, limit = 3): MatchFlow<M> {
  const list = [...(matches ?? [])].filter((m) => m.status !== "cancelled").sort(order);
  const focused = list.find((m) => m.id === focusedMatchId);
  const firstOpen = list.find((m) => m.status !== "completed");
  const round = focused?.round ?? firstOpen?.round ?? list[list.length - 1]?.round ?? null;
  const inRound = round === null ? [] : list.filter((m) => m.round === round);
  return {
    round,
    roundDone: inRound.filter((m) => m.status === "completed").length,
    roundTotal: inRound.length,
    upNext: list.filter((m) => m.id !== focusedMatchId && playable(m)).slice(0, Math.max(0, limit)),
  };
}
