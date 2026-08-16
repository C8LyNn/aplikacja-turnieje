/**
 * Phase 2 – Qualification Proposal domain logic.
 *
 * Contains pure functions for:
 *   - computing a deterministic fingerprint of ranking inputs
 *   - detecting a tie at an output basket boundary (per stage format)
 *   - building proposal entries from a ranked list and basket specs
 *
 * No I/O — the application layer orchestrates DB access and calls these.
 */

import { createHash } from "node:crypto";

// ─── Supported formats ───────────────────────────────────────────────────────

/**
 * Stage formats for which Phase 2 can generate qualification proposals.
 *
 * Not supported:
 *   - double_elimination: calculateRanking throws STAGE_FORMAT_NOT_SUPPORTED
 *   - group_stage:        only per-group ranks exist; no global cross-group order
 */
export const PROPOSAL_SUPPORTED_FORMATS = new Set<string>([
  "swiss",
  "round_robin",
  "single_elimination",
]);

// ─── Fingerprint ─────────────────────────────────────────────────────────────

/**
 * Computes a deterministic SHA-256 fingerprint of the ranking inputs for a
 * stage (match results + participant list + basket configuration).
 *
 * Any change to these inputs after proposal generation causes a subsequent
 * approval attempt to be rejected with STAGE_BASKET_QUALIFICATION_PROPOSAL_STALE.
 *
 * Basket config is included so that changing qualifierCount or basket display
 * order after generate is detected as stale at approval time.
 */
export function computeRankingFingerprint(params: {
  stageId: number;
  stageFormat: string;
  rankingPolicy: string;
  outputBaskets: ReadonlyArray<{
    id: string;
    order: number;
    qualifierCount: number;
  }>;
  memberships: ReadonlyArray<{
    playerId: number;
    stageSeed: number;
    status: string;
  }>;
  matches: ReadonlyArray<{
    id: number;
    status: string;
    resultType: string | null;
    winnerId: number | null;
    score1: number | null;
    score2: number | null;
    player1Id: number | null;
    player2Id: number | null;
  }>;
}): string {
  const canonical = {
    stageId: params.stageId,
    stageFormat: params.stageFormat,
    rankingPolicy: params.rankingPolicy,
    // Sort baskets by id for a stable order independent of DB fetch order.
    outputBaskets: [...params.outputBaskets]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((b) => `${b.id}:${b.order}:${b.qualifierCount}`),
    participants: [...params.memberships]
      .sort((a, b) => a.playerId - b.playerId)
      .map((m) => `${m.playerId}:${m.stageSeed}:${m.status}`),
    matches: [...params.matches]
      .sort((a, b) => a.id - b.id)
      .map(
        (m) =>
          `${m.id}:${m.status}:${m.resultType ?? ""}:${m.winnerId ?? ""}:${m.score1 ?? ""}:${m.score2 ?? ""}:${m.player1Id ?? ""}:${m.player2Id ?? ""}`,
      ),
  };
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

// ─── Tie detection ────────────────────────────────────────────────────────────

/**
 * Minimal stats needed for boundary-tie detection.
 * Mirrors the fields carried by RankedParticipant from stage-lifecycle.ts.
 */
export interface ScoredParticipant {
  playerId: number;
  rank: number;
  stageSeed: number;
  matchWins: number;
  gameWins: number;
  gameDiff: number;
  buchholz: number | null;
}

export type RawMatchForTie = {
  player1Id: number | null;
  player2Id: number | null;
  status: string;
  resultType: string | null;
  winnerId: number | null;
};

/**
 * Returns the winner of a decisive head-to-head match between playerA and
 * playerB, or null when:
 *   - no match between them exists
 *   - the match is not completed
 *   - the result type is 'bye' or 'draw' (no decisive winner)
 *   - there are multiple matches between them (ambiguous — treat as indecisive)
 */
function decisiveH2H(
  matches: readonly RawMatchForTie[],
  playerA: number,
  playerB: number,
): number | null {
  const decisive = matches.filter(
    (m) =>
      ((m.player1Id === playerA && m.player2Id === playerB) ||
        (m.player1Id === playerB && m.player2Id === playerA)) &&
      m.status === "completed" &&
      (m.resultType === "played" || m.resultType === "walkover") &&
      m.winnerId != null &&
      (m.winnerId === playerA || m.winnerId === playerB),
  );
  return decisive.length === 1 ? decisive[0].winnerId! : null;
}

/**
 * Returns true when the players at `ranked[boundaryAfterIndex]` and
 * `ranked[boundaryAfterIndex + 1]` are separated ONLY by stageSeed —
 * i.e. no sporting criterion distinguishes them.
 *
 * A true result means a tie-break round is required before this boundary
 * can be resolved; the proposal must be blocked with
 * STAGE_BASKET_TIE_BREAK_REQUIRED.
 *
 * Format-specific logic:
 *   swiss            — matchWins / buchholz / gameDiff / gameWins must all differ
 *   round_robin      — matchWins / (H2H for 2-way ties) / gameDiff / gameWins
 *   single_elimination — lossRound (both still alive = tie; same round = tie)
 *
 * For single_elimination, `lossRoundByPlayerId` must be provided; the
 * function returns false conservatively if it is absent.
 */
export function hasTieAtBoundary(params: {
  format: string;
  ranked: readonly ScoredParticipant[];
  boundaryAfterIndex: number;
  rawMatches: readonly RawMatchForTie[];
  lossRoundByPlayerId?: ReadonlyMap<number, number>;
}): boolean {
  const {
    format,
    ranked,
    boundaryAfterIndex,
    rawMatches,
    lossRoundByPlayerId,
  } = params;

  if (boundaryAfterIndex < 0 || boundaryAfterIndex >= ranked.length - 1) {
    return false; // no player beyond the boundary to compare against
  }

  const a = ranked[boundaryAfterIndex];
  const b = ranked[boundaryAfterIndex + 1];

  // ── Swiss ─────────────────────────────────────────────────────────────────
  // Rank key: matchWins → buchholz → gameDiff → gameWins → stageSeed (technical).
  // Tie = all four sporting criteria equal; stageSeed is the only separator.
  if (format === "swiss") {
    return (
      a.matchWins === b.matchWins &&
      (a.buchholz ?? 0) === (b.buchholz ?? 0) &&
      a.gameDiff === b.gameDiff &&
      a.gameWins === b.gameWins
    );
  }

  // ── Round Robin ───────────────────────────────────────────────────────────
  // Rank key: matchWins → H2H (2-way only) → gameDiff → gameWins → stageSeed.
  // Tie = matchWins equal AND H2H not decisive (when applicable) AND
  //       gameDiff equal AND gameWins equal.
  if (format === "round_robin") {
    if (a.matchWins !== b.matchWins) return false;
    // H2H is used only when exactly two participants share the same matchWins count.
    const sameWinsCount = ranked.filter(
      (r) => r.matchWins === a.matchWins,
    ).length;
    if (sameWinsCount === 2) {
      const winner = decisiveH2H(rawMatches, a.playerId, b.playerId);
      if (winner != null) return false; // H2H is a valid sporting separator
    }
    return a.gameDiff === b.gameDiff && a.gameWins === b.gameWins;
  }

  // ── Single Elimination ────────────────────────────────────────────────────
  // Rank key: survivor (no loss) before loser; losers: lossRound desc → stageSeed asc.
  // Tie scenarios where stageSeed is the only separator:
  //   • Both players still alive (no lossRound entry) — tournament ongoing.
  //   • Both players eliminated in the same round.
  if (format === "single_elimination") {
    if (!lossRoundByPlayerId) return false; // conservative: cannot determine without the map
    const aRound = lossRoundByPlayerId.get(a.playerId);
    const bRound = lossRoundByPlayerId.get(b.playerId);
    // Both survivors → only stageSeed distinguishes them.
    if (aRound == null && bRound == null) return true;
    // Both eliminated in the same round → only stageSeed distinguishes them.
    return aRound != null && bRound != null && aRound === bRound;
  }

  // Any other format falls through as non-tie (unsupported formats are
  // rejected earlier by STAGE_BASKET_QUALIFICATION_FORMAT_NOT_SUPPORTED).
  return false;
}

// ─── Proposal builder ─────────────────────────────────────────────────────────

export interface OutputBasketSpec {
  id: string;
  order: number;
  qualifierCount: number; // must be a positive integer
}

export interface ProposalEntry {
  basketId: string;
  playerId: number;
  placementRank: number; // global 1-based rank
  basketPosition: number; // 1-based position within the target basket
}

export type ProposalBuildResult =
  | { ok: true; entries: ProposalEntry[] }
  | {
      ok: false;
      code: "STAGE_BASKET_TIE_BREAK_REQUIRED";
      basketId: string;
      boundaryRank: number;
    };

/**
 * Assigns ranked participants to output baskets in ascending `order`, filling
 * each basket with `qualifierCount` consecutive participants.
 *
 * Before filling a basket, the lower boundary is checked: if the last
 * participant assigned to this basket and the first participant NOT assigned
 * are only separated by stageSeed, the build fails with
 * `{ ok: false, code: "STAGE_BASKET_TIE_BREAK_REQUIRED" }`.
 *
 * If the total quota exceeds the number of ranked participants, excess slots
 * are silently skipped (no error — partial assignment is valid).
 */
export function buildQualificationProposal(params: {
  format: string;
  ranked: readonly ScoredParticipant[];
  outputBaskets: readonly OutputBasketSpec[];
  rawMatches: readonly RawMatchForTie[];
  lossRoundByPlayerId?: ReadonlyMap<number, number>;
}): ProposalBuildResult {
  const { format, ranked, rawMatches, lossRoundByPlayerId } = params;

  // Sort baskets by order ascending (defensive — callers should already sort).
  const sortedBaskets = [...params.outputBaskets].sort(
    (a, b) => a.order - b.order,
  );

  const entries: ProposalEntry[] = [];
  let cursor = 0; // next ranked[] index to assign

  for (const basket of sortedBaskets) {
    if (cursor >= ranked.length) break; // all participants already assigned

    const endCursor = cursor + basket.qualifierCount; // exclusive upper bound

    // Tie-boundary check: only needed when there are participants beyond this
    // basket (endCursor < ranked.length). If the basket absorbs everyone
    // remaining, no boundary exists.
    if (endCursor < ranked.length) {
      const boundaryAfterIndex = endCursor - 1; // last index entering this basket
      const isTie = hasTieAtBoundary({
        format,
        ranked,
        boundaryAfterIndex,
        rawMatches,
        lossRoundByPlayerId,
      });
      if (isTie) {
        return {
          ok: false,
          code: "STAGE_BASKET_TIE_BREAK_REQUIRED",
          basketId: basket.id,
          boundaryRank: ranked[boundaryAfterIndex].rank,
        };
      }
    }

    // Fill the basket (stop at ranked.length if quota exceeds participants).
    for (let i = cursor; i < endCursor && i < ranked.length; i++) {
      entries.push({
        basketId: basket.id,
        playerId: ranked[i].playerId,
        placementRank: ranked[i].rank,
        basketPosition: i - cursor + 1,
      });
    }

    cursor = endCursor;
  }

  return { ok: true, entries };
}
