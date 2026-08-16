/**
 * Phase 2 – Qualification Proposal application layer.
 *
 * Orchestrates DB access, ranking computation, and tie detection to implement:
 *   generateQualificationProposal  — create or refresh a pending proposal
 *   getQualificationProposal       — read current proposal (pending or approved)
 *   approveQualificationProposal   — lock proposal and materialise output basket players
 *   getQualificationOutput         — read materialised output basket contents
 */

import { and, asc, eq } from "drizzle-orm";
import {
  db,
  matchesTable,
  playersTable,
  qualificationProposalEntriesTable,
  qualificationProposalsTable,
  stageBasketsOutputPlayersTable,
  stageBasketsTable,
  stageParticipantsTable,
  tournamentStagesTable,
  tournamentsTable,
} from "@workspace/db";
import type { TournamentMutationActor } from "../../access-policy";
import { revalidateTournamentMutationActor } from "../../access-policy";
import {
  buildQualificationProposal,
  computeRankingFingerprint,
  PROPOSAL_SUPPORTED_FORMATS,
} from "../../domain/tournament/stage-basket-qualification";
import { calculateRanking } from "./stage-lifecycle";
import { StageLifecycleError } from "./stage-lifecycle-error";

// ─── Error types ─────────────────────────────────────────────────────────────

export type QualificationProposalErrorCode =
  | "TOURNAMENT_NOT_FOUND"
  | "STAGE_NOT_FOUND"
  | "STAGE_BASKET_CONFIGURATION_NOT_EXPLICIT"
  | "STAGE_BASKET_QUALIFICATION_FORMAT_NOT_SUPPORTED"
  | "STAGE_BASKET_QUALIFICATION_ALREADY_APPROVED"
  | "STAGE_BASKET_QUALIFICATION_PROPOSAL_NOT_FOUND"
  | "STAGE_BASKET_QUALIFICATION_PROPOSAL_STALE"
  | "STAGE_BASKET_TIE_BREAK_REQUIRED"
  | "RANKING_INCONSISTENT";

export class QualificationProposalError extends Error {
  constructor(
    public readonly code: QualificationProposalErrorCode,
    public readonly details?: {
      basketId?: string;
      boundaryRank?: number;
    },
  ) {
    super(code);
    this.name = "QualificationProposalError";
  }
}

// ─── Return types ─────────────────────────────────────────────────────────────

export interface QualificationProposalResult {
  proposalId: number;
  tournamentId: number;
  stageId: number;
  revision: number;
  status: string;
  rankingFingerprint: string;
  createdAt: Date;
  approvedAt: Date | null;
  approvedByActorType: string | null;
  approvedByActorNick: string | null;
  entries: Array<{
    basketId: string;
    playerId: number;
    placementRank: number;
    basketPosition: number;
  }>;
}

export interface QualificationOutputEntry {
  basketId: string;
  playerId: number;
  finalRank: number;
  materializedAt: Date;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Computes the lossRound for each player from completed single-elimination
 * matches. Matches the algorithm used inside calculateRanking() so the tie
 * detection uses the same data that produced the ranked order.
 */
function buildSeLossRoundMap(
  matches: Array<typeof matchesTable.$inferSelect>,
): Map<number, number> {
  const lossRoundByPlayerId = new Map<number, number>();
  for (const match of matches) {
    if (match.winnerId == null) continue;
    if (match.player1Id != null && match.player1Id !== match.winnerId) {
      lossRoundByPlayerId.set(match.player1Id, match.round);
    }
    if (match.player2Id != null && match.player2Id !== match.winnerId) {
      lossRoundByPlayerId.set(match.player2Id, match.round);
    }
  }
  return lossRoundByPlayerId;
}

function actorNick(actor: TournamentMutationActor): string {
  return actor.type === "support" ? actor.nick : "organizer";
}

// ─── Load current state for fingerprinting ────────────────────────────────────

/**
 * Output basket spec used for fingerprinting — contains only the fields that
 * affect allocation (id, display order, qualifierCount).
 */
interface OutputBasketFingerprintSpec {
  id: string;
  order: number;
  qualifierCount: number;
}

/**
 * Loads all inputs required to compute a stable ranking fingerprint for a
 * stage.  Includes the stage row (for format + rankingPolicy), output baskets
 * with a positive qualifierCount, participants, and matches.
 *
 * `stage` is null when the stage does not exist; callers that need to guard
 * against this should check independently.
 */
async function loadStageInputsForFingerprint(
  tournamentId: number,
  stageId: number,
): Promise<{
  stage: (typeof tournamentStagesTable.$inferSelect) | undefined;
  outputBaskets: OutputBasketFingerprintSpec[];
  memberships: Array<typeof stageParticipantsTable.$inferSelect>;
  matches: Array<typeof matchesTable.$inferSelect>;
}> {
  const [stageRows, basketRows, memberships, matches] = await Promise.all([
    db
      .select()
      .from(tournamentStagesTable)
      .where(
        and(
          eq(tournamentStagesTable.tournamentId, tournamentId),
          eq(tournamentStagesTable.id, stageId),
        ),
      ),
    db
      .select()
      .from(stageBasketsTable)
      .where(
        and(
          eq(stageBasketsTable.tournamentId, tournamentId),
          eq(stageBasketsTable.stageId, stageId),
          eq(stageBasketsTable.basketType, "output"),
        ),
      ),
    db
      .select()
      .from(stageParticipantsTable)
      .where(
        and(
          eq(stageParticipantsTable.tournamentId, tournamentId),
          eq(stageParticipantsTable.stageId, stageId),
        ),
      )
      .orderBy(asc(stageParticipantsTable.stageSeed)),
    db
      .select()
      .from(matchesTable)
      .where(
        and(
          eq(matchesTable.tournamentId, tournamentId),
          eq(matchesTable.stageId, stageId),
        ),
      )
      .orderBy(asc(matchesTable.id)),
  ]);
  return {
    stage: stageRows[0],
    outputBaskets: basketRows
      .filter((b) => b.qualifierCount != null && b.qualifierCount > 0)
      .map((b) => ({
        id: b.id,
        order: b.displayOrder,
        qualifierCount: b.qualifierCount!,
      })),
    memberships,
    matches,
  };
}

// ─── generateQualificationProposal ───────────────────────────────────────────

/**
 * Generates or refreshes a pending qualification proposal for a stage.
 *
 * Preconditions (throws QualificationProposalError on failure):
 *   - Tournament and stage must exist.
 *   - Stage format must be in PROPOSAL_SUPPORTED_FORMATS.
 *   - The basket configuration must be explicit (legacyDefaulted = false).
 *   - No approved proposal may exist for this stage.
 *   - No tie at any output basket boundary.
 *
 * If a pending proposal already exists it is superseded (revision incremented,
 * entries replaced). The operation is idempotent on the pending state.
 */
export async function generateQualificationProposal(
  tournamentId: number,
  stageId: number,
  actor: TournamentMutationActor,
): Promise<QualificationProposalResult> {
  // ── 1. Load tournament, stage, baskets ────────────────────────────────────
  const [tournament] = await db
    .select()
    .from(tournamentsTable)
    .where(eq(tournamentsTable.id, tournamentId));
  if (!tournament) {
    throw new QualificationProposalError("TOURNAMENT_NOT_FOUND");
  }

  const [stage] = await db
    .select()
    .from(tournamentStagesTable)
    .where(
      and(
        eq(tournamentStagesTable.tournamentId, tournamentId),
        eq(tournamentStagesTable.id, stageId),
      ),
    );
  if (!stage) {
    throw new QualificationProposalError("STAGE_NOT_FOUND");
  }

  // ── 2. Format check ────────────────────────────────────────────────────────
  if (!PROPOSAL_SUPPORTED_FORMATS.has(stage.format)) {
    throw new QualificationProposalError(
      "STAGE_BASKET_QUALIFICATION_FORMAT_NOT_SUPPORTED",
    );
  }

  // ── 3. Basket configuration check ─────────────────────────────────────────
  // legacyDefaulted = no baskets persisted for this tournament at all.
  const allTournamentBaskets = await db
    .select()
    .from(stageBasketsTable)
    .where(eq(stageBasketsTable.tournamentId, tournamentId))
    .orderBy(
      asc(stageBasketsTable.stageId),
      asc(stageBasketsTable.basketType),
      asc(stageBasketsTable.displayOrder),
    );

  if (allTournamentBaskets.length === 0) {
    throw new QualificationProposalError(
      "STAGE_BASKET_CONFIGURATION_NOT_EXPLICIT",
    );
  }

  // Get output baskets for this stage that have a positive qualifierCount.
  const outputBaskets = allTournamentBaskets
    .filter(
      (b) =>
        b.stageId === stageId &&
        b.basketType === "output" &&
        b.qualifierCount != null &&
        b.qualifierCount > 0,
    )
    .map((b) => ({
      id: b.id,
      order: b.displayOrder,
      qualifierCount: b.qualifierCount!,
    }))
    .sort((a, b) => a.order - b.order);

  // ── 4. Load ranking inputs ─────────────────────────────────────────────────
  const [players, { memberships, matches }] = await Promise.all([
    db
      .select()
      .from(playersTable)
      .where(eq(playersTable.tournamentId, tournamentId)),
    loadStageInputsForFingerprint(tournamentId, stageId),
  ]);

  // ── 5. Compute fingerprint (includes basket config so that stale-check
  //       catches changes to qualifierCount or basket order after generate) ──
  const fingerprint = computeRankingFingerprint({
    stageId,
    stageFormat: stage.format,
    rankingPolicy: stage.rankingPolicy,
    outputBaskets,
    memberships: memberships.map((m) => ({
      playerId: m.playerId,
      stageSeed: m.stageSeed,
      status: m.status,
    })),
    matches: matches.map((m) => ({
      id: m.id,
      status: m.status,
      resultType: m.resultType,
      winnerId: m.winnerId,
      score1: m.score1,
      score2: m.score2,
      player1Id: m.player1Id,
      player2Id: m.player2Id,
    })),
  });

  // ── 6. Compute ranking ────────────────────────────────────────────────────
  let ranked;
  try {
    ranked = calculateRanking(stage, memberships, players, matches);
  } catch (error) {
    if (error instanceof StageLifecycleError) {
      throw new QualificationProposalError("RANKING_INCONSISTENT");
    }
    throw error;
  }

  // ── 7. Build proposal entries (with tie detection) ─────────────────────────
  const lossRoundByPlayerId =
    stage.format === "single_elimination"
      ? buildSeLossRoundMap(matches)
      : undefined;

  const buildResult = buildQualificationProposal({
    format: stage.format,
    ranked: ranked.map((r) => ({
      playerId: r.playerId,
      rank: r.rank,
      stageSeed: r.stageSeed,
      matchWins: r.matchWins,
      gameWins: r.gameWins,
      gameDiff: r.gameDiff,
      buchholz: r.buchholz,
    })),
    outputBaskets,
    rawMatches: matches.map((m) => ({
      player1Id: m.player1Id,
      player2Id: m.player2Id,
      status: m.status,
      resultType: m.resultType,
      winnerId: m.winnerId,
    })),
    lossRoundByPlayerId,
  });

  if (!buildResult.ok) {
    throw new QualificationProposalError("STAGE_BASKET_TIE_BREAK_REQUIRED", {
      basketId: buildResult.basketId,
      boundaryRank: buildResult.boundaryRank,
    });
  }

  const proposalEntries = buildResult.entries;

  // ── 8. Persist proposal in a transaction ─────────────────────────────────
  return db.transaction(async (tx) => {
    // Revalidate support session if applicable.
    await revalidateTournamentMutationActor(tx, tournament, actor);

    // Lock existing proposal for this stage (if any).
    const [existing] = await tx
      .select()
      .from(qualificationProposalsTable)
      .where(
        and(
          eq(qualificationProposalsTable.tournamentId, tournamentId),
          eq(qualificationProposalsTable.stageId, stageId),
        ),
      )
      .for("update");

    if (existing?.status === "approved") {
      throw new QualificationProposalError(
        "STAGE_BASKET_QUALIFICATION_ALREADY_APPROVED",
      );
    }

    let proposalId: number;
    let revision: number;
    let createdAt: Date;

    if (existing) {
      // Supersede the existing pending proposal.
      revision = existing.revision + 1;
      createdAt = new Date();
      await tx
        .update(qualificationProposalsTable)
        .set({
          revision,
          rankingFingerprint: fingerprint,
          createdAt,
        })
        .where(eq(qualificationProposalsTable.id, existing.id));
      proposalId = existing.id;

      // Remove old entries.
      await tx
        .delete(qualificationProposalEntriesTable)
        .where(
          eq(qualificationProposalEntriesTable.proposalId, proposalId),
        );
    } else {
      // Insert a new proposal.
      revision = 1;
      createdAt = new Date();
      const [inserted] = await tx
        .insert(qualificationProposalsTable)
        .values({
          tournamentId,
          stageId,
          revision: 1,
          status: "pending",
          rankingFingerprint: fingerprint,
          createdAt,
        })
        .returning({ id: qualificationProposalsTable.id });
      proposalId = inserted.id;
    }

    // Insert new entries (skip if no output baskets produced assignments).
    if (proposalEntries.length > 0) {
      await tx.insert(qualificationProposalEntriesTable).values(
        proposalEntries.map((entry) => ({
          proposalId,
          tournamentId,
          stageId,
          basketId: entry.basketId,
          playerId: entry.playerId,
          placementRank: entry.placementRank,
          basketPosition: entry.basketPosition,
        })),
      );
    }

    return {
      proposalId,
      tournamentId,
      stageId,
      revision,
      status: "pending",
      rankingFingerprint: fingerprint,
      createdAt,
      approvedAt: null,
      approvedByActorType: null,
      approvedByActorNick: null,
      entries: proposalEntries.map((e) => ({
        basketId: e.basketId,
        playerId: e.playerId,
        placementRank: e.placementRank,
        basketPosition: e.basketPosition,
      })),
    };
  });
}

// ─── getQualificationProposal ─────────────────────────────────────────────────

/**
 * Returns the current proposal (pending or approved) for a stage, or null if
 * no proposal has been generated yet.
 */
export async function getQualificationProposal(
  tournamentId: number,
  stageId: number,
): Promise<QualificationProposalResult | null> {
  const [proposal] = await db
    .select()
    .from(qualificationProposalsTable)
    .where(
      and(
        eq(qualificationProposalsTable.tournamentId, tournamentId),
        eq(qualificationProposalsTable.stageId, stageId),
      ),
    );

  if (!proposal) return null;

  const entries = await db
    .select()
    .from(qualificationProposalEntriesTable)
    .where(
      eq(qualificationProposalEntriesTable.proposalId, proposal.id),
    )
    .orderBy(
      asc(qualificationProposalEntriesTable.placementRank),
      asc(qualificationProposalEntriesTable.basketPosition),
    );

  return {
    proposalId: proposal.id,
    tournamentId: proposal.tournamentId,
    stageId: proposal.stageId,
    revision: proposal.revision,
    status: proposal.status,
    rankingFingerprint: proposal.rankingFingerprint,
    createdAt: proposal.createdAt,
    approvedAt: proposal.approvedAt,
    approvedByActorType: proposal.approvedByActorType,
    approvedByActorNick: proposal.approvedByActorNick,
    entries: entries.map((e) => ({
      basketId: e.basketId,
      playerId: e.playerId,
      placementRank: e.placementRank,
      basketPosition: e.basketPosition,
    })),
  };
}

// ─── approveQualificationProposal ─────────────────────────────────────────────

/**
 * Approves the pending proposal for a stage, materialising output basket players.
 *
 * Idempotent: if the proposal is already approved, returns without error.
 *
 * Preconditions:
 *   - A proposal must exist.
 *   - The proposal must be pending (or already approved for idempotency).
 *   - The current ranking fingerprint must match the proposal's fingerprint
 *     (STAGE_BASKET_QUALIFICATION_PROPOSAL_STALE if not).
 */
export async function approveQualificationProposal(
  tournamentId: number,
  stageId: number,
  actor: TournamentMutationActor,
): Promise<QualificationProposalResult> {
  // Compute current fingerprint before the transaction so we can do a quick
  // pre-flight check without holding locks unnecessarily long.
  // This now includes basket config (qualifierCount, display order) so that
  // any post-generate change to baskets is detected as stale.
  const { stage: stageForFp, outputBaskets: outputBasketsForFp, memberships, matches } =
    await loadStageInputsForFingerprint(tournamentId, stageId);

  // Stage must exist (or the transaction will catch this via TOURNAMENT_NOT_FOUND,
  // but we guard here to avoid passing undefined to fingerprint).
  if (!stageForFp) {
    throw new QualificationProposalError("STAGE_NOT_FOUND");
  }

  const currentFingerprint = computeRankingFingerprint({
    stageId,
    stageFormat: stageForFp.format,
    rankingPolicy: stageForFp.rankingPolicy,
    outputBaskets: outputBasketsForFp,
    memberships: memberships.map((m) => ({
      playerId: m.playerId,
      stageSeed: m.stageSeed,
      status: m.status,
    })),
    matches: matches.map((m) => ({
      id: m.id,
      status: m.status,
      resultType: m.resultType,
      winnerId: m.winnerId,
      score1: m.score1,
      score2: m.score2,
      player1Id: m.player1Id,
      player2Id: m.player2Id,
    })),
  });

  return db.transaction(async (tx) => {
    const [tournament] = await tx
      .select()
      .from(tournamentsTable)
      .where(eq(tournamentsTable.id, tournamentId));
    if (!tournament) {
      throw new QualificationProposalError("TOURNAMENT_NOT_FOUND");
    }

    await revalidateTournamentMutationActor(tx, tournament, actor);

    // Lock the proposal row.
    const [proposal] = await tx
      .select()
      .from(qualificationProposalsTable)
      .where(
        and(
          eq(qualificationProposalsTable.tournamentId, tournamentId),
          eq(qualificationProposalsTable.stageId, stageId),
        ),
      )
      .for("update");

    if (!proposal) {
      throw new QualificationProposalError(
        "STAGE_BASKET_QUALIFICATION_PROPOSAL_NOT_FOUND",
      );
    }

    // Idempotent: already approved — return current state.
    if (proposal.status === "approved") {
      const entries = await tx
        .select()
        .from(qualificationProposalEntriesTable)
        .where(
          eq(qualificationProposalEntriesTable.proposalId, proposal.id),
        )
        .orderBy(
          asc(qualificationProposalEntriesTable.placementRank),
          asc(qualificationProposalEntriesTable.basketPosition),
        );
      return {
        proposalId: proposal.id,
        tournamentId: proposal.tournamentId,
        stageId: proposal.stageId,
        revision: proposal.revision,
        status: proposal.status,
        rankingFingerprint: proposal.rankingFingerprint,
        createdAt: proposal.createdAt,
        approvedAt: proposal.approvedAt,
        approvedByActorType: proposal.approvedByActorType,
        approvedByActorNick: proposal.approvedByActorNick,
        entries: entries.map((e) => ({
          basketId: e.basketId,
          playerId: e.playerId,
          placementRank: e.placementRank,
          basketPosition: e.basketPosition,
        })),
      };
    }

    // Stale check: fingerprint must match the state at generation time.
    if (proposal.rankingFingerprint !== currentFingerprint) {
      throw new QualificationProposalError(
        "STAGE_BASKET_QUALIFICATION_PROPOSAL_STALE",
      );
    }

    const now = new Date();
    const approvedByActorType = actor.type;
    const approvedByActorNick = actorNick(actor);

    // Mark the proposal as approved.
    await tx
      .update(qualificationProposalsTable)
      .set({
        status: "approved",
        approvedAt: now,
        approvedByActorType,
        approvedByActorNick,
      })
      .where(eq(qualificationProposalsTable.id, proposal.id));

    // Load entries to materialise.
    const entries = await tx
      .select()
      .from(qualificationProposalEntriesTable)
      .where(
        eq(qualificationProposalEntriesTable.proposalId, proposal.id),
      )
      .orderBy(
        asc(qualificationProposalEntriesTable.placementRank),
        asc(qualificationProposalEntriesTable.basketPosition),
      );

    // Delete any existing output players for this stage (safety: idempotent re-approval).
    await tx
      .delete(stageBasketsOutputPlayersTable)
      .where(
        and(
          eq(stageBasketsOutputPlayersTable.tournamentId, tournamentId),
          eq(stageBasketsOutputPlayersTable.stageId, stageId),
        ),
      );

    // Materialise output basket players.
    if (entries.length > 0) {
      await tx.insert(stageBasketsOutputPlayersTable).values(
        entries.map((entry) => ({
          tournamentId,
          stageId,
          basketId: entry.basketId,
          playerId: entry.playerId,
          proposalId: proposal.id,
          finalRank: entry.placementRank,
          materializedAt: now,
        })),
      );
    }

    return {
      proposalId: proposal.id,
      tournamentId: proposal.tournamentId,
      stageId: proposal.stageId,
      revision: proposal.revision,
      status: "approved",
      rankingFingerprint: proposal.rankingFingerprint,
      createdAt: proposal.createdAt,
      approvedAt: now,
      approvedByActorType,
      approvedByActorNick,
      entries: entries.map((e) => ({
        basketId: e.basketId,
        playerId: e.playerId,
        placementRank: e.placementRank,
        basketPosition: e.basketPosition,
      })),
    };
  });
}

// ─── getQualificationOutput ───────────────────────────────────────────────────

/**
 * Returns the materialised output basket players for a stage, grouped by basket.
 * Returns an empty array if no output has been materialised yet.
 */
export async function getQualificationOutput(
  tournamentId: number,
  stageId: number,
): Promise<QualificationOutputEntry[]> {
  const rows = await db
    .select()
    .from(stageBasketsOutputPlayersTable)
    .where(
      and(
        eq(stageBasketsOutputPlayersTable.tournamentId, tournamentId),
        eq(stageBasketsOutputPlayersTable.stageId, stageId),
      ),
    )
    .orderBy(
      asc(stageBasketsOutputPlayersTable.basketId),
      asc(stageBasketsOutputPlayersTable.finalRank),
    );

  return rows.map((r) => ({
    basketId: r.basketId,
    playerId: r.playerId,
    finalRank: r.finalRank,
    materializedAt: r.materializedAt,
  }));
}
