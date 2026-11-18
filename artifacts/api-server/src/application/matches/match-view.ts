import { setsFromStorage, type SetScore } from "@workspace/match-rules";
import type { MatchLegView, TieSummaryView } from "./two-leg-ties";

/**
 * V5.10 (P0): the match as the API returns it, built from an explicit list of fields — never by spreading the
 * database row, so a new column cannot reach viewers by accident.
 *
 * Audiences:
 * - "public"    — anyone who may read the tournament (anonymous viewers of a public tournament, access-code viewers).
 * - "organizer" — the organizer and support staff; they also get the organizer's free-text match note.
 *
 * Field review (kept for everyone): `revision` is the optimistic-concurrency counter clients send back on writes
 * (no content); `routingMatchKey` is the engine's position key in a routed bracket (structure, no personal data);
 * `resultReason` explains a walkover / no contest / bye and is shown to viewers by design; `sortOrder` is the public
 * order of play. Organizer only: `note` (free text set through the API by the organizer, e.g. when cancelling a
 * match — not meant for viewers).
 */
export type MatchAudience = "organizer" | "public";

export function matchAudienceOf(actor: { type: string } | null | undefined): MatchAudience {
  return actor?.type === "organizer" || actor?.type === "support" ? "organizer" : "public";
}

export type MatchRow = {
  id: number;
  revision: number;
  tournamentId: number;
  stageId: number;
  stageGroupId: number | null;
  round: number;
  matchNumber: number;
  player1Id: number | null;
  player2Id: number | null;
  score1: number | null;
  score2: number | null;
  winnerId: number | null;
  bestOf: number;
  resultType: string | null;
  resultReason: string | null;
  note: string | null;
  status: string;
  nextMatchId: number | null;
  sortOrder: number | null;
  scheduledAt: Date | null;
  completedAt: Date | null;
  routingMatchKey: string | null;
  setScores: unknown;
};

/** Every key a public match response may have (tests compare against this list). */
export const PUBLIC_MATCH_FIELDS = [
  "id", "revision", "tournamentId", "stageId", "stageGroupId", "round", "matchNumber",
  "player1Id", "player2Id", "player1Name", "player2Name", "score1", "score2", "winnerId", "bestOf",
  "resultType", "resultReason", "status", "nextMatchId", "sortOrder", "scheduledAt", "completedAt",
  "routingMatchKey", "sets", "legs", "tie",
] as const;

/** Extra keys the organizer and support staff get. */
export const ORGANIZER_ONLY_MATCH_FIELDS = ["note"] as const;

function iso(value: Date | null | undefined): string | null {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value.toISOString() : null;
}

export type PublicMatchView = {
  id: number; revision: number; tournamentId: number; stageId: number; stageGroupId: number | null;
  round: number; matchNumber: number; player1Id: number | null; player2Id: number | null;
  player1Name: string | null; player2Name: string | null; score1: number | null; score2: number | null;
  winnerId: number | null; bestOf: number; resultType: string | null; resultReason: string | null;
  status: string; nextMatchId: number | null; sortOrder: number | null; scheduledAt: string | null;
  completedAt: string | null; routingMatchKey: string | null; sets: SetScore[] | null;
  /** V5.10: both legs and the aggregate of a two-legged tie; null for every other match. */
  legs: MatchLegView[] | null; tie: TieSummaryView | null;
};
export type MatchView = PublicMatchView & { note?: string | null };

export function toMatchView(
  match: MatchRow,
  names: { player1Name?: string | null; player2Name?: string | null },
  audience: MatchAudience,
  twoLegs: { legs: MatchLegView[]; tie: TieSummaryView } | null = null,
): MatchView {
  const view: MatchView = {
    id: match.id,
    revision: match.revision,
    tournamentId: match.tournamentId,
    stageId: match.stageId,
    stageGroupId: match.stageGroupId ?? null,
    round: match.round,
    matchNumber: match.matchNumber,
    player1Id: match.player1Id ?? null,
    player2Id: match.player2Id ?? null,
    player1Name: names.player1Name ?? null,
    player2Name: names.player2Name ?? null,
    score1: match.score1 ?? null,
    score2: match.score2 ?? null,
    winnerId: match.winnerId ?? null,
    bestOf: match.bestOf,
    resultType: match.resultType ?? null,
    resultReason: match.resultReason ?? null,
    status: match.status,
    nextMatchId: match.nextMatchId ?? null,
    sortOrder: match.sortOrder ?? null,
    scheduledAt: iso(match.scheduledAt),
    completedAt: iso(match.completedAt),
    routingMatchKey: match.routingMatchKey ?? null,
    // V5.7: set scores are exposed as `sets` ({ score1, score2 } per set), never as the raw column.
    sets: setsFromStorage(match.setScores),
    legs: twoLegs?.legs ?? null,
    tie: twoLegs?.tie ?? null,
  };
  if (audience === "organizer") view.note = match.note ?? null;
  return view;
}
