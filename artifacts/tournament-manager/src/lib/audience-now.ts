import { t, stageLabel } from "@/i18n";
/**
 * QW-05 · what a viewer must understand at a glance — NOW → NEXT → RECENT — derived only from what the public API
 * already returns. Nothing here invents a status, an order, a time or a result:
 * - "live" means the organizer marked the match in progress (`status === "in_progress"`), nothing else;
 * - "next" are ready matches (both participants known, pending) of the shown stage, in the order the engine
 *   numbers them (scheduled ones first, by their real `scheduledAt`);
 * - "recent" are finished matches by their real `completedAt`; byes are not results and are left out.
 */
import type { Match, Tournament, TournamentStage } from "@workspace/api-client-react";

type MatchLike = Pick<Match, "id" | "stageId" | "round" | "matchNumber" | "status" | "player1Id" | "player2Id" | "resultType" | "scheduledAt" | "completedAt" | "sortOrder">;
type StageLike = Pick<TournamentStage, "id" | "name" | "status" | "position" | "format">;
type TournamentLike = Pick<Tournament, "status" | "currentRound" | "totalRounds">;

export type AudiencePhase = "draft" | "active" | "completed";

export interface AudienceNow<M extends MatchLike> {
  phase: AudiencePhase;
  /** Matches the organizer marked as being played now (the featured one first). */
  live: M[];
  next: M[];
  recent: M[];
  /** Finished vs all real matches of the shown stage (byes excluded on both sides). */
  progress: { done: number; total: number } | null;
  /** The planned stage that follows the shown one, if any. */
  nextStage: StageLike | null;
  /** Why nothing is ready to play, in plain words (null when there is something to show). */
  waiting: string | null;
}

const isBye = (m: MatchLike) => m.resultType === "bye";
const time = (value: string | null | undefined) => (value ? Date.parse(value) : Number.NaN);

function engineOrder(a: MatchLike, b: MatchLike): number {
  return a.round - b.round || (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.matchNumber - b.matchNumber || a.id - b.id;
}

export function buildAudienceNow<M extends MatchLike>(input: {
  tournament: TournamentLike;
  matches: readonly M[] | undefined;
  stage: StageLike | undefined;
  stages: readonly StageLike[] | undefined;
  featuredMatchId?: number | null;
  limit?: number;
}): AudienceNow<M> {
  const { tournament, stage, limit = 5 } = input;
  const all = input.matches ?? [];
  const phase: AudiencePhase = tournament.status === "completed" ? "completed" : tournament.status === "draft" ? "draft" : "active";
  const inStage = (m: M) => !stage || m.stageId === stage.id;

  const live = all
    .filter((m) => m.status === "in_progress")
    .sort((a, b) => Number(b.id === input.featuredMatchId) - Number(a.id === input.featuredMatchId) || engineOrder(a, b));

  const next = phase === "active"
    ? all
      .filter((m) => inStage(m) && m.status === "pending" && m.player1Id != null && m.player2Id != null && !isBye(m))
      .sort((a, b) => {
        const ta = time(a.scheduledAt), tb = time(b.scheduledAt);
        if (!Number.isNaN(ta) || !Number.isNaN(tb)) {
          if (Number.isNaN(ta)) return 1;
          if (Number.isNaN(tb)) return -1;
          if (ta !== tb) return ta - tb;
        }
        return engineOrder(a, b);
      })
      .slice(0, limit)
    : [];

  const recent = all
    .filter((m) => m.status === "completed" && !isBye(m))
    .sort((a, b) => {
      const ta = time(a.completedAt), tb = time(b.completedAt);
      if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) return tb - ta;
      if (Number.isNaN(ta) !== Number.isNaN(tb)) return Number.isNaN(ta) ? 1 : -1;
      return engineOrder(b, a);
    })
    .slice(0, limit);

  const stageMatches = stage ? all.filter((m) => m.stageId === stage.id && !isBye(m) && m.status !== "cancelled") : [];
  const progress = stage && stage.status !== "planned" && stageMatches.length > 0
    ? { done: stageMatches.filter((m) => m.status === "completed").length, total: stageMatches.length }
    : null;

  const ordered = [...(input.stages ?? [])].sort((a, b) => a.position - b.position);
  const nextStage = stage ? ordered.find((s) => s.position > stage.position && s.status === "planned") ?? null : null;

  let waiting: string | null = null;
  if (phase === "draft") waiting = t("audienceNow.mecze_pojawia_sie_tutaj_po");
  else if (phase === "active" && live.length === 0 && next.length === 0) {
    const allPlayed = !!progress && progress.done === progress.total;
    // All matches played but the stage still active: the engine waits for the organizer to close it (e.g. DE).
    waiting = allPlayed && nextStage
      ? t("audienceNow.wszystkie_mecze_etapu_sa_rozegrane", { name: stageLabel(nextStage.name) })
      : allPlayed
        ? t("audienceNow.wszystkie_mecze_sa_rozegrane_wynik")
        : t("audienceNow.na_razie_zaden_mecz_nie");
  }

  return { phase, live, next, recent, progress, nextStage, waiting };
}

/**
 * "Runda 2 z 3" only where the counter means what a viewer reads: a single-elimination bracket or Swiss rounds.
 * In a league or groups every matchday is open at once and in double elimination the counter covers internal
 * bracket rounds, so it is not shown there (the stage progress "X z Y meczów" is).
 */
export function roundText(counters: Pick<TournamentLike, "currentRound" | "totalRounds">, format: string | undefined): string | null {
  if (format !== "single_elimination" && format !== "swiss") return null;
  return counters.currentRound && counters.totalRounds ? t("audienceNow.runda_currentround_z_totalrounds", { currentRound: counters.currentRound, totalRounds: counters.totalRounds }) : null;
}

/** Local time of the last successful read, for "Zaktualizowano 12:04:31" (never a claim that data is live). */
export function updatedAtText(updatedAt: number | undefined): string | null {
  if (!updatedAt) return null;
  return new Date(updatedAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** Polling cadence: a finished tournament no longer changes by itself, so it is read rarely. */
export function audiencePollMs(base: number, phase: AudiencePhase | undefined): number {
  return phase === "completed" ? Math.max(base, 60_000) : base;
}

type LabelMatch = Pick<Match, "round" | "matchNumber" | "routingMatchKey">;
const DE_KEY = /\/(upper|lower)-r(\d+)-m(\d+)$|\/(grand-final-reset|grand-final)$/;

/**
 * Short label for a match row. Double-elimination matches carry internal routing rounds (R5 may be the second
 * round of the winners' bracket), so their label comes from the engine's own key: "W R2·1", "P R1·2", "Finał".
 */
export function matchCode(m: LabelMatch): string {
  const key = m.routingMatchKey?.match(DE_KEY);
  if (!key) return `R${m.round}M${m.matchNumber}`;
  if (key[4] === "grand-final") return t("audienceNow.final");
  if (key[4] === "grand-final-reset") return t("audienceNow.rewanz");
  return `${key[1] === "upper" ? "W" : "P"} R${key[2]}·${key[3]}`;
}

/** The same in words, for the hero card and tooltips. */
export function matchTitle(m: LabelMatch): string {
  const key = m.routingMatchKey?.match(DE_KEY);
  if (!key) return t("audienceNow.runda_round_mecz_matchnumber", { round: m.round, matchNumber: m.matchNumber });
  if (key[4] === "grand-final") return t("audienceNow.wielki_final");
  if (key[4] === "grand-final-reset") return t("audienceNow.wielki_final_rewanz");
  return t("audienceNow.v0_runda_v1_mecz_v2", { v0: key[1] === "upper" ? t("audienceNow.drabinka_wygranych") : t("audienceNow.drabinka_przegranych"), v1: key[2], v2: key[3] });
}
