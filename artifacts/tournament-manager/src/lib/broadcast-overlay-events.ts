import { t, stageLabel } from "@/i18n";
/**
 * #324-L03b · on-air alerts from real data only. The overlay compares two consecutive public answers of the API and
 * announces what changed between them: a match ended, a player moved into the next round, a new stage started, the
 * tournament has a winner, a result was corrected. Nothing is invented: the backend records no point-by-point events,
 * so there are none here. The first answer after a load and the first answer after a connection problem only set the
 * baseline, so a reload or a reconnect never replays old alerts.
 */
import { eliminationRoundName, type PublicMatch, type PublicStage, type PublicTournament } from "./broadcast-overlay";

export interface SnapshotMatch {
  id: number;
  stageId: number;
  round: number;
  status: string;
  resultType: string | null;
  score1: number | null;
  score2: number | null;
  winnerId: number | null;
  p1: number | null;
  p2: number | null;
  n1: string | null;
  n2: string | null;
}

export interface OverlaySnapshot {
  status: string;
  winnerId: number | null;
  activeStageId: number | null;
  stages: { id: number; name: string; position: number; format: string }[];
  matches: SnapshotMatch[];
}

export type OverlayEvent =
  | { kind: "match_end"; matchId: number; winner: string | null; loser: string | null; score: string; draw: boolean }
  | { kind: "advance"; matchId: number; fromMatchId: number; name: string; where: string }
  | { kind: "stage"; stageId: number; name: string }
  | { kind: "champion"; name: string }
  | { kind: "corrected"; matchId: number; side1: string; side2: string; score: string }
  | { kind: "reverted"; matchId: number };

export function overlaySnapshot(tournament: PublicTournament, matches: readonly PublicMatch[], stages: readonly PublicStage[]): OverlaySnapshot {
  return {
    status: tournament.status,
    winnerId: tournament.winnerId,
    activeStageId: tournament.activeStageId,
    stages: stages.map((s) => ({ id: s.id, name: s.name, position: s.position, format: s.format })),
    matches: matches.map((m) => ({
      id: m.id, stageId: m.stageId, round: m.round, status: m.status, resultType: m.resultType,
      score1: m.score1, score2: m.score2, winnerId: m.winnerId, p1: m.player1Id, p2: m.player2Id, n1: m.player1Name, n2: m.player2Name,
    })),
  };
}

const scoreText = (m: SnapshotMatch) => (m.resultType === "walkover" ? "W.O." : `${m.score1 ?? 0}:${m.score2 ?? 0}`);
const nameOf = (m: SnapshotMatch, id: number | null) => (id == null ? null : id === m.p1 ? m.n1 : id === m.p2 ? m.n2 : null);
const sameResult = (a: SnapshotMatch, b: SnapshotMatch) =>
  a.score1 === b.score1 && a.score2 === b.score2 && a.winnerId === b.winnerId && a.resultType === b.resultType;

function roundLabel(snapshot: OverlaySnapshot, match: SnapshotMatch): string {
  const stage = snapshot.stages.find((s) => s.id === match.stageId);
  if (stage?.format === "single_elimination") {
    const total = Math.max(...snapshot.matches.filter((m) => m.stageId === match.stageId).map((m) => m.round));
    return eliminationRoundName(match.round, total);
  }
  return t("broadcastOverlayEvents.v0_runda_round", { v0: stage?.name ? `${stageLabel(stage.name)} · ` : "", round: match.round });
}

/** What happened between two answers. `prev` null (first answer) gives nothing. */
export function overlayEvents(prev: OverlaySnapshot | null, next: OverlaySnapshot): OverlayEvent[] {
  if (!prev) return [];
  const before = new Map(prev.matches.map((m) => [m.id, m]));
  const ended: OverlayEvent[] = [];
  const corrections: OverlayEvent[] = [];
  const winnersNow = new Map<number, number>();
  for (const m of next.matches) {
    const old = before.get(m.id);
    if (!old || m.resultType === "bye") continue;
    const wasDone = old.status === "completed";
    const isDone = m.status === "completed";
    if (!wasDone && isDone) {
      if (m.resultType === "no_contest") continue; // no winner and no score worth announcing
      const draw = m.winnerId == null && m.resultType === "played" && m.score1 != null && m.score1 === m.score2;
      const winner = nameOf(m, m.winnerId);
      const loser = m.winnerId == null ? null : nameOf(m, m.winnerId === m.p1 ? m.p2 : m.p1);
      if (!draw && !winner) continue;
      ended.push({ kind: "match_end", matchId: m.id, winner, loser, score: scoreText(m), draw });
      if (m.winnerId != null) winnersNow.set(m.winnerId, m.id);
    } else if (wasDone && isDone && !sameResult(old, m)) {
      corrections.push({ kind: "corrected", matchId: m.id, side1: m.n1 ?? "?", side2: m.n2 ?? "?", score: scoreText(m) });
    } else if (wasDone && !isDone) {
      corrections.push({ kind: "reverted", matchId: m.id });
    }
  }
  // A winner who just appeared in a later match of the same stage has advanced (the engine filled the slot).
  const advances: OverlayEvent[] = [];
  for (const m of next.matches) {
    const old = before.get(m.id);
    if (!old || m.status === "completed") continue;
    for (const [id, name, oldId] of [[m.p1, m.n1, old.p1], [m.p2, m.n2, old.p2]] as const) {
      if (id == null || oldId === id || !name) continue;
      const from = winnersNow.get(id);
      const source = from == null ? undefined : next.matches.find((x) => x.id === from);
      if (source && source.stageId === m.stageId && m.round > source.round) {
        advances.push({ kind: "advance", matchId: m.id, fromMatchId: from!, name, where: roundLabel(next, m) });
      }
    }
  }
  const events: OverlayEvent[] = [...ended, ...advances];
  if (next.activeStageId != null && next.activeStageId !== prev.activeStageId) {
    const stage = next.stages.find((s) => s.id === next.activeStageId);
    const previous = prev.stages.find((s) => s.id === prev.activeStageId);
    if (stage && (!previous || stage.position > previous.position)) events.push({ kind: "stage", stageId: stage.id, name: stageLabel(stage.name) });
  }
  if (prev.status !== "completed" && next.status === "completed" && next.winnerId != null) {
    const name = next.matches.map((m) => nameOf(m, next.winnerId)).find(Boolean);
    if (name) events.push({ kind: "champion", name });
  }
  return [...events, ...corrections];
}

/** One line for the banner. */
export function eventText(event: Exclude<OverlayEvent, { kind: "reverted" }>): { label: string; text: string } {
  switch (event.kind) {
    case "match_end":
      return event.draw
        ? { label: t("broadcastOverlayEvents.koniec_meczu"), text: t("broadcastOverlayEvents.remis_score", { score: event.score }) }
        : { label: t("broadcastOverlayEvents.koniec_meczu"), text: t("broadcastOverlayEvents.wygrywa_winner_v1", { winner: event.winner, v1: event.loser ? ` · ${event.score} ${t("i18n.word.against")} ${event.loser}` : ` · ${event.score}` }) };
    case "advance":
      return { label: t("broadcastOverlayEvents.awans"), text: `${event.name} → ${event.where}` };
    case "stage":
      return { label: t("broadcastOverlayEvents.nowy_etap"), text: event.name };
    case "champion":
      return { label: t("broadcastOverlayEvents.zwyciezca_turnieju"), text: event.name };
    case "corrected":
      return { label: t("broadcastOverlayEvents.wynik_poprawiony"), text: `${event.side1} ${event.score} ${event.side2}` };
  }
}

export interface AlertItem { id: number; event: Exclude<OverlayEvent, { kind: "reverted" }> }

/**
 * The banner queue after new events: a correction or an undo removes every waiting or shown alert about that match
 * (and the advance it caused), so viewers never see a celebration that is no longer true. At most `limit` wait.
 */
export function nextAlertQueue(queue: readonly AlertItem[], events: readonly OverlayEvent[], nextId: () => number, limit = 3): AlertItem[] {
  let items = [...queue];
  for (const event of events) {
    if (event.kind === "reverted" || event.kind === "corrected") {
      items = items.filter(({ event: e }) => !(("matchId" in e && e.matchId === event.matchId) || (e.kind === "advance" && e.fromMatchId === event.matchId)));
    }
    if (event.kind === "reverted") {
      // an undo can change who won the tournament: a waiting champion alert is dropped until the engine says again
      items = items.filter(({ event: e }) => e.kind !== "champion");
    }
    if (event.kind === "champion") {
      // a correction can change the winner later; only the latest champion is announced
      items = items.filter(({ event: e }) => e.kind !== "champion");
    }
    if (event.kind !== "reverted") items.push({ id: nextId(), event });
  }
  return items.slice(-limit);
}
