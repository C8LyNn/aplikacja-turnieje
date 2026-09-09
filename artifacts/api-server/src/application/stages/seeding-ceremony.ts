import { createHash } from "node:crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import {
  actionLogTable,
  matchesTable,
  playersTable,
  stageGroupsTable,
  stageParticipantsTable,
  tournamentStagesTable,
  tournamentsTable,
} from "@workspace/db/schema";
import type { db } from "@workspace/db";
import type { TournamentMutationActor } from "../../access-policy";
import {
  calculateBalancedGroupSizes,
  groupKeyFromIndex,
} from "../../domain/tournament/group-stage";
import {
  buildRandomBracket,
  buildRandomGroupPlacements,
  buildSnakeGroupPlacements,
  buildStandardSeededBracket,
} from "../../domain/tournament/stage-placement";
import { assignSeeds, type SeedingPolicy } from "../../domain/tournament/seeding";

export type SeedingCeremonyStatus = "prepared" | "in_progress" | "completed" | "applied";
export type SeedingCeremonyDrawMode = "seed" | "placement";

export type SeedingCeremonyPlacement =
  | {
      kind: "group";
      label: string;
      groupIndex: number;
      groupKey: string;
      groupPosition: number;
    }
  | {
      kind: "bracket";
      label: string;
      bracketSlot: number;
      matchNumber: number;
      side: "player1" | "player2";
      bye: boolean;
    }
  | {
      kind: "standings";
      label: string;
      position: number;
    };

export interface SeedingCeremonyDraw {
  drawNumber: number;
  participantKey: string;
  playerId: number;
  playerName: string;
  seed: number;
  placement: SeedingCeremonyPlacement;
}

export interface SeedingCeremonyState {
  kind: "seeding_ceremony_v1";
  version: 1;
  stageId: number;
  status: SeedingCeremonyStatus;
  drawMode: SeedingCeremonyDrawMode;
  entrySeedingPolicy: string;
  placementPolicy: string;
  resultSeedingPolicy: string;
  revealOrder: "instant" | "sequential";
  randomSeed: string;
  placementRandomSeed: string | null;
  participantSignature: string;
  configurationSignature: string;
  participantOrder: string[];
  draws: SeedingCeremonyDraw[];
  revealedCount: number;
  preparedAt: string;
  updatedAt: string;
  completedAt: string | null;
  appliedAt: string | null;
}

export type SeedingCeremonyErrorCode =
  | "TOURNAMENT_NOT_FOUND"
  | "STAGE_NOT_FOUND"
  | "STAGE_NOT_PLANNED"
  | "SEEDING_CEREMONY_NOT_AVAILABLE"
  | "SEEDING_CEREMONY_NOT_PREPARED"
  | "SEEDING_CEREMONY_ALREADY_COMPLETE"
  | "SEEDING_CEREMONY_STALE"
  | "STAGE_PARTICIPANTS_INCONSISTENT"
  | "MATCHES_ALREADY_EXIST"
  | "GROUPS_ALREADY_EXIST";

const CEREMONY_ERROR_MESSAGES: Record<SeedingCeremonyErrorCode, string> = {
  TOURNAMENT_NOT_FOUND: "Turniej nie istnieje.",
  STAGE_NOT_FOUND: "Etap nie istnieje.",
  STAGE_NOT_PLANNED: "Ceremonię można prowadzić wyłącznie przed uruchomieniem etapu.",
  SEEDING_CEREMONY_NOT_AVAILABLE: "Ten etap nie korzysta z losowego seedowania ani rozmieszczenia.",
  SEEDING_CEREMONY_NOT_PREPARED: "Losowanie nie zostało jeszcze przygotowane.",
  SEEDING_CEREMONY_ALREADY_COMPLETE: "Wszystkie wyniki losowania zostały już ujawnione.",
  SEEDING_CEREMONY_STALE: "Przygotowane losowanie nie odpowiada już aktualnym uczestnikom lub ustawieniom etapu.",
  STAGE_PARTICIPANTS_INCONSISTENT: "Uczestnicy etapu są niespójni.",
  MATCHES_ALREADY_EXIST: "Etap zawiera już mecze.",
  GROUPS_ALREADY_EXIST: "Etap zawiera już grupy.",
};

export class SeedingCeremonyError extends Error {
  constructor(public readonly code: SeedingCeremonyErrorCode) {
    super(CEREMONY_ERROR_MESSAGES[code]);
    this.name = "SeedingCeremonyError";
  }
}

type StageRow = typeof tournamentStagesTable.$inferSelect;
type MembershipRow = typeof stageParticipantsTable.$inferSelect;
type PlayerRow = typeof playersTable.$inferSelect;
type DatabaseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function integer(value: unknown): value is number {
  return Number.isInteger(value);
}

function positiveInteger(value: unknown): value is number {
  return integer(value) && value > 0;
}

function nonnegativeInteger(value: unknown): value is number {
  return integer(value) && value >= 0;
}

function sha256(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function stageUsesRandomCeremony(
  stage: Pick<StageRow, "entrySeedingPolicy" | "seedingPolicy">,
): boolean {
  return stage.entrySeedingPolicy === "random" ||
    stage.seedingPolicy === "random_groups" ||
    stage.seedingPolicy === "random_bracket";
}

export function ceremonyParticipantSignature(
  memberships: readonly Pick<MembershipRow, "id" | "playerId" | "stageSeed">[],
  players: readonly Pick<PlayerRow, "id" | "name" | "seed">[],
): string {
  const playerById = new Map(players.map((player) => [player.id, player]));
  return sha256(
    [...memberships]
      .sort((left, right) => left.stageSeed - right.stageSeed)
      .map((membership) => {
        const player = playerById.get(membership.playerId);
        return {
          membershipId: membership.id,
          playerId: membership.playerId,
          playerName: player?.name ?? null,
          manualSeed: player?.seed ?? null,
          stageSeed: membership.stageSeed,
        };
      }),
  );
}

export function ceremonyConfigurationSignature(
  stage: Pick<
    StageRow,
    | "id"
    | "format"
    | "participantCount"
    | "groupCount"
    | "entrySeedingPolicy"
    | "seedingPolicy"
    | "resultSeedingPolicy"
    | "randomSeed"
    | "randomRevealOrder"
  >,
): string {
  return sha256({
    stageId: stage.id,
    format: stage.format,
    participantCount: stage.participantCount,
    groupCount: stage.groupCount,
    entrySeedingPolicy: stage.entrySeedingPolicy,
    placementPolicy: stage.seedingPolicy,
    resultSeedingPolicy: stage.resultSeedingPolicy,
    randomSeed: stage.randomSeed,
    revealOrder: stage.randomRevealOrder,
  });
}

function isPlacement(value: unknown): value is SeedingCeremonyPlacement {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (!nonEmptyString(record.label) || !nonEmptyString(record.kind)) return false;
  if (record.kind === "group") {
    return nonnegativeInteger(record.groupIndex) && nonEmptyString(record.groupKey) && positiveInteger(record.groupPosition);
  }
  if (record.kind === "bracket") {
    return positiveInteger(record.bracketSlot) && positiveInteger(record.matchNumber) &&
      (record.side === "player1" || record.side === "player2") && typeof record.bye === "boolean";
  }
  return record.kind === "standings" && positiveInteger(record.position);
}

export function parseSeedingCeremonyState(value: unknown): SeedingCeremonyState | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (record.kind !== "seeding_ceremony_v1" || record.version !== 1) return null;
  if (!positiveInteger(record.stageId) || !nonEmptyString(record.status) ||
      !["prepared", "in_progress", "completed", "applied"].includes(record.status)) return null;
  if (record.drawMode !== "seed" && record.drawMode !== "placement") return null;
  if (!nonEmptyString(record.entrySeedingPolicy) || !nonEmptyString(record.placementPolicy) ||
      !nonEmptyString(record.resultSeedingPolicy) ||
      (record.revealOrder !== "instant" && record.revealOrder !== "sequential") ||
      !nonEmptyString(record.randomSeed) ||
      !(record.placementRandomSeed == null || nonEmptyString(record.placementRandomSeed)) ||
      !nonEmptyString(record.participantSignature) || !nonEmptyString(record.configurationSignature) ||
      !Array.isArray(record.participantOrder) || !record.participantOrder.every(nonEmptyString) ||
      !Array.isArray(record.draws) || !nonnegativeInteger(record.revealedCount) ||
      !nonEmptyString(record.preparedAt) || !nonEmptyString(record.updatedAt) ||
      !(record.completedAt == null || nonEmptyString(record.completedAt)) ||
      !(record.appliedAt == null || nonEmptyString(record.appliedAt))) return null;

  const draws: SeedingCeremonyDraw[] = [];
  for (const rawDraw of record.draws) {
    if (!rawDraw || typeof rawDraw !== "object") return null;
    const draw = rawDraw as Record<string, unknown>;
    if (!positiveInteger(draw.drawNumber) || !nonEmptyString(draw.participantKey) ||
        !positiveInteger(draw.playerId) || !nonEmptyString(draw.playerName) ||
        !positiveInteger(draw.seed) || !isPlacement(draw.placement)) return null;
    draws.push(draw as unknown as SeedingCeremonyDraw);
  }
  if ((record.revealedCount as number) < 0 || (record.revealedCount as number) > draws.length) return null;
  const seedSet = new Set(draws.map((draw) => draw.seed));
  const playerSet = new Set(draws.map((draw) => draw.playerId));
  const keySet = new Set(draws.map((draw) => draw.participantKey));
  const drawNumberSet = new Set(draws.map((draw) => draw.drawNumber));
  const expected = new Set(Array.from({ length: draws.length }, (_, index) => index + 1));
  if (seedSet.size !== draws.length || playerSet.size !== draws.length ||
      keySet.size !== draws.length || drawNumberSet.size !== draws.length ||
      [...seedSet].some((seed) => !expected.has(seed)) ||
      [...drawNumberSet].some((drawNumber) => !expected.has(drawNumber)) ||
      record.participantOrder.length !== draws.length ||
      record.participantOrder.some((key, index) => key !== draws[index]?.participantKey)) return null;
  const revealedCount = record.revealedCount as number;
  if ((record.status === "prepared" && revealedCount !== 0) ||
      (record.status === "in_progress" && (revealedCount <= 0 || revealedCount >= draws.length)) ||
      ((record.status === "completed" || record.status === "applied") && revealedCount !== draws.length) ||
      (record.status === "completed" && record.completedAt == null) ||
      (record.status === "applied" && record.appliedAt == null)) return null;

  return {
    ...(record as unknown as SeedingCeremonyState),
    draws,
  };
}

function entryPolicyForStage(stage: StageRow): SeedingPolicy {
  switch (stage.entrySeedingPolicy) {
    case "registration_order": return { type: "registration_order" };
    case "alphabetical": return { type: "alphabetical", locale: "pl" };
    case "random": return {
      type: "random",
      randomSeed: stage.randomSeed ?? "",
      revealOrder: "participant_order",
    };
    case "manual": return { type: "manual" };
    case "preserve": return { type: "preserve" };
    default: throw new SeedingCeremonyError("SEEDING_CEREMONY_STALE");
  }
}

function placementByParticipant(
  stage: StageRow,
  seeded: Array<{ participantKey: string; seed: number }>,
): Map<string, SeedingCeremonyPlacement> {
  const placements = new Map<string, SeedingCeremonyPlacement>();
  if (stage.format === "group_stage") {
    if (stage.groupCount == null) throw new SeedingCeremonyError("STAGE_PARTICIPANTS_INCONSISTENT");
    const groupSizes = calculateBalancedGroupSizes(seeded.length, stage.groupCount);
    const groupPlacements = stage.seedingPolicy === "random_groups"
      ? buildRandomGroupPlacements(seeded, groupSizes, `${stage.randomSeed ?? ""}:placement`)
      : buildSnakeGroupPlacements(seeded, groupSizes);
    for (const placement of groupPlacements) {
      const groupKey = groupKeyFromIndex(placement.groupIndex);
      placements.set(placement.participant.participantKey, {
        kind: "group",
        label: `Grupa ${groupKey} · miejsce ${placement.groupPosition}`,
        groupIndex: placement.groupIndex,
        groupKey,
        groupPosition: placement.groupPosition,
      });
    }
    return placements;
  }
  if (stage.format === "single_elimination") {
    const bracket = stage.seedingPolicy === "random_bracket"
      ? buildRandomBracket(seeded, `${stage.randomSeed ?? ""}:placement`)
      : buildStandardSeededBracket(seeded);
    for (const match of bracket.firstRound) {
      for (const [side, slot] of [["player1", match.player1], ["player2", match.player2]] as const) {
        if (!slot.participant) continue;
        placements.set(slot.participant.participantKey, {
          kind: "bracket",
          label: `Mecz ${match.matchNumber} · ${side === "player1" ? "górny" : "dolny"} slot${match.byeWinner?.participantKey === slot.participant.participantKey ? " · BYE" : ""}`,
          bracketSlot: slot.slot,
          matchNumber: match.matchNumber,
          side,
          bye: match.byeWinner?.participantKey === slot.participant.participantKey,
        });
      }
    }
    return placements;
  }
  for (const entry of seeded) {
    placements.set(entry.participantKey, {
      kind: "standings",
      label: `Pozycja ${entry.seed}`,
      position: entry.seed,
    });
  }
  return placements;
}

/** Use attendance for DE ceremony signatures before and after start recompiles capacity. */
function effectiveCeremonyStage(stage: StageRow, participantCount: number): StageRow {
  return stage.format === "double_elimination" &&
    participantCount >= 2 && participantCount < stage.participantCount
    ? { ...stage, participantCount }
    : stage;
}

export function buildSeedingCeremonyState(input: {
  stage: StageRow;
  memberships: readonly MembershipRow[];
  players: readonly PlayerRow[];
  now?: Date;
}): SeedingCeremonyState {
  const { memberships, players } = input;
  const stage = effectiveCeremonyStage(input.stage, memberships.length);
  if (!stageUsesRandomCeremony(stage)) {
    throw new SeedingCeremonyError("SEEDING_CEREMONY_NOT_AVAILABLE");
  }
  if (!nonEmptyString(stage.randomSeed)) {
    throw new SeedingCeremonyError("SEEDING_CEREMONY_STALE");
  }
  if (memberships.length !== stage.participantCount || memberships.length < 2) {
    throw new SeedingCeremonyError("STAGE_PARTICIPANTS_INCONSISTENT");
  }
  const playerById = new Map(players.map((player) => [player.id, player]));
  if (players.length !== memberships.length || memberships.some((membership) => !playerById.has(membership.playerId))) {
    throw new SeedingCeremonyError("STAGE_PARTICIPANTS_INCONSISTENT");
  }
  const result = assignSeeds(
    memberships.map((membership) => {
      const player = playerById.get(membership.playerId)!;
      return {
        participantKey: String(membership.playerId),
        displayName: player.name,
        registrationOrder: player.id,
        previousSeed: membership.stageSeed,
        manualSeed: player.seed,
      };
    }),
    entryPolicyForStage(stage),
  );
  if (!result.ok) throw new SeedingCeremonyError("SEEDING_CEREMONY_STALE");
  const placementMap = placementByParticipant(
    stage,
    result.seeded.map(({ entry, seed }) => ({ participantKey: entry.participantKey, seed })),
  );
  const seedByKey = new Map(result.seeded.map(({ entry, seed }) => [entry.participantKey, seed]));
  const participantOrder = stage.entrySeedingPolicy === "random"
    ? result.audit.draws.map((draw) => draw.participantKey)
    : [...memberships].sort((left, right) => left.stageSeed - right.stageSeed).map((membership) => String(membership.playerId));
  const draws = participantOrder.map((participantKey, index) => {
    const playerId = Number(participantKey);
    const player = playerById.get(playerId);
    const seed = seedByKey.get(participantKey);
    const placement = placementMap.get(participantKey);
    if (!player || seed == null || !placement) throw new SeedingCeremonyError("SEEDING_CEREMONY_STALE");
    return {
      drawNumber: index + 1,
      participantKey,
      playerId,
      playerName: player.name,
      seed,
      placement,
    } satisfies SeedingCeremonyDraw;
  });
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const revealedCount = stage.randomRevealOrder === "instant" ? draws.length : 0;
  return {
    kind: "seeding_ceremony_v1",
    version: 1,
    stageId: stage.id,
    status: revealedCount === draws.length ? "completed" : "prepared",
    drawMode: stage.entrySeedingPolicy === "random" ? "seed" : "placement",
    entrySeedingPolicy: stage.entrySeedingPolicy,
    placementPolicy: stage.seedingPolicy,
    resultSeedingPolicy: stage.resultSeedingPolicy,
    revealOrder: stage.randomRevealOrder,
    randomSeed: stage.randomSeed!,
    placementRandomSeed: ["random_groups", "random_bracket"].includes(stage.seedingPolicy)
      ? `${stage.randomSeed}:placement`
      : null,
    participantSignature: ceremonyParticipantSignature(memberships, players),
    configurationSignature: ceremonyConfigurationSignature(stage),
    participantOrder,
    draws,
    revealedCount,
    preparedAt: timestamp,
    updatedAt: timestamp,
    completedAt: revealedCount === draws.length ? timestamp : null,
    appliedAt: null,
  };
}

export function isCeremonyCurrent(input: {
  ceremony: SeedingCeremonyState;
  stage: StageRow;
  memberships: readonly MembershipRow[];
  players: readonly PlayerRow[];
}): boolean {
  return input.ceremony.stageId === input.stage.id &&
    input.ceremony.participantSignature === ceremonyParticipantSignature(input.memberships, input.players) &&
    input.ceremony.configurationSignature === ceremonyConfigurationSignature(
      effectiveCeremonyStage(input.stage, input.memberships.length),
    );
}

export function markCeremonyApplied(ceremony: SeedingCeremonyState, now = new Date()): SeedingCeremonyState {
  const timestamp = now.toISOString();
  return {
    ...ceremony,
    status: "applied",
    revealedCount: ceremony.draws.length,
    updatedAt: timestamp,
    completedAt: ceremony.completedAt ?? timestamp,
    appliedAt: timestamp,
  };
}

async function loadPlannedStageForCeremony(
  tx: DatabaseTransaction,
  input: { tournamentId: number; stageId: number; actor?: TournamentMutationActor },
) {
  const { revalidateTournamentMutationActor } = await import("../../access-policy");
  const [tournament] = await tx.select().from(tournamentsTable)
    .where(eq(tournamentsTable.id, input.tournamentId)).for("update");
  if (!tournament) throw new SeedingCeremonyError("TOURNAMENT_NOT_FOUND");
  await revalidateTournamentMutationActor(tx, tournament, input.actor);
  const [stage] = await tx.select().from(tournamentStagesTable)
    .where(and(eq(tournamentStagesTable.id, input.stageId), eq(tournamentStagesTable.tournamentId, input.tournamentId)))
    .for("update");
  if (!stage) throw new SeedingCeremonyError("STAGE_NOT_FOUND");
  if (stage.status !== "planned") throw new SeedingCeremonyError("STAGE_NOT_PLANNED");
  if (!stageUsesRandomCeremony(stage)) throw new SeedingCeremonyError("SEEDING_CEREMONY_NOT_AVAILABLE");
  const matches = await tx.select({ id: matchesTable.id }).from(matchesTable)
    .where(eq(matchesTable.stageId, stage.id)).for("update");
  if (matches.length > 0) throw new SeedingCeremonyError("MATCHES_ALREADY_EXIST");
  const groups = await tx.select({ id: stageGroupsTable.id }).from(stageGroupsTable)
    .where(eq(stageGroupsTable.stageId, stage.id)).for("update");
  if (groups.length > 0) throw new SeedingCeremonyError("GROUPS_ALREADY_EXIST");
  const memberships = await tx.select().from(stageParticipantsTable)
    .where(eq(stageParticipantsTable.stageId, stage.id))
    .orderBy(asc(stageParticipantsTable.stageSeed)).for("update");
  const players = memberships.length === 0 ? [] : await tx.select().from(playersTable)
    .where(inArray(playersTable.id, memberships.map((membership) => membership.playerId))).for("update");
  const effectiveStage = effectiveCeremonyStage(stage, memberships.length);
  if (memberships.length !== effectiveStage.participantCount || memberships.length < 2 || players.length !== memberships.length) {
    throw new SeedingCeremonyError("STAGE_PARTICIPANTS_INCONSISTENT");
  }
  return { tournament, stage: effectiveStage, memberships, players };
}

export async function getSeedingCeremony(input: { tournamentId: number; stageId: number }): Promise<SeedingCeremonyState | null> {
  const { db } = await import("@workspace/db");
  const [stage] = await db.select().from(tournamentStagesTable)
    .where(and(eq(tournamentStagesTable.id, input.stageId), eq(tournamentStagesTable.tournamentId, input.tournamentId)));
  if (!stage) throw new SeedingCeremonyError("STAGE_NOT_FOUND");
  const ceremony = parseSeedingCeremonyState(stage.seedingAudit);
  if (!ceremony || stage.status !== "planned") return ceremony;
  const memberships = await db.select().from(stageParticipantsTable)
    .where(eq(stageParticipantsTable.stageId, stage.id))
    .orderBy(asc(stageParticipantsTable.stageSeed));
  const players = memberships.length === 0 ? [] : await db.select().from(playersTable)
    .where(inArray(playersTable.id, memberships.map((membership) => membership.playerId)));
  return isCeremonyCurrent({ ceremony, stage, memberships, players }) ? ceremony : null;
}

export async function prepareSeedingCeremony(input: { tournamentId: number; stageId: number; actor?: TournamentMutationActor }): Promise<SeedingCeremonyState> {
  const { db } = await import("@workspace/db");
  return db.transaction(async (tx) => {
    const loaded = await loadPlannedStageForCeremony(tx, input);
    const existing = parseSeedingCeremonyState(loaded.stage.seedingAudit);
    if (existing && isCeremonyCurrent({
      ceremony: existing,
      stage: loaded.stage,
      memberships: loaded.memberships,
      players: loaded.players,
    })) return existing;
    const ceremony = buildSeedingCeremonyState(loaded);
    await tx.update(tournamentStagesTable).set({
      seedingAudit: ceremony,
      version: loaded.stage.version + 1,
    }).where(eq(tournamentStagesTable.id, loaded.stage.id));
    await tx.insert(actionLogTable).values({
      tournamentId: loaded.tournament.id,
      stageId: loaded.stage.id,
      actionType: "seeding_ceremony_prepared",
      description: `Przygotowano deterministyczne losowanie dla etapu ${loaded.stage.name}; uczestnicy=${ceremony.draws.length}`,
      matchId: null,
      undoPayload: null,
      isUndone: false,
    });
    return ceremony;
  });
}

function nextCeremonyState(
  ceremony: SeedingCeremonyState,
  revealAll: boolean,
  now = new Date(),
): SeedingCeremonyState {
  if (ceremony.revealedCount >= ceremony.draws.length) {
    throw new SeedingCeremonyError("SEEDING_CEREMONY_ALREADY_COMPLETE");
  }
  const revealedCount = revealAll ? ceremony.draws.length : ceremony.revealedCount + 1;
  const timestamp = now.toISOString();
  return {
    ...ceremony,
    status: revealedCount === ceremony.draws.length ? "completed" : "in_progress",
    revealedCount,
    updatedAt: timestamp,
    completedAt: revealedCount === ceremony.draws.length ? timestamp : null,
  };
}

async function revealCeremony(
  input: { tournamentId: number; stageId: number; actor?: TournamentMutationActor },
  revealAll: boolean,
): Promise<SeedingCeremonyState> {
  const { db } = await import("@workspace/db");
  return db.transaction(async (tx) => {
    const loaded = await loadPlannedStageForCeremony(tx, input);
    const current = parseSeedingCeremonyState(loaded.stage.seedingAudit);
    if (!current) throw new SeedingCeremonyError("SEEDING_CEREMONY_NOT_PREPARED");
    if (!isCeremonyCurrent({ ceremony: current, ...loaded })) {
      throw new SeedingCeremonyError("SEEDING_CEREMONY_STALE");
    }
    const next = nextCeremonyState(current, revealAll);
    await tx.update(tournamentStagesTable).set({
      seedingAudit: next,
      version: loaded.stage.version + 1,
    }).where(eq(tournamentStagesTable.id, loaded.stage.id));
    if (next.status === "completed") {
      await tx.insert(actionLogTable).values({
        tournamentId: loaded.tournament.id,
        stageId: loaded.stage.id,
        actionType: "seeding_ceremony_completed",
        description: `Ujawniono komplet wyników losowania etapu ${loaded.stage.name}.`,
        matchId: null,
        undoPayload: null,
        isUndone: false,
      });
    }
    return next;
  });
}

export async function revealNextSeedingDraw(input: { tournamentId: number; stageId: number; actor?: TournamentMutationActor }): Promise<SeedingCeremonyState> {
  return revealCeremony(input, false);
}

export async function revealAllSeedingDraws(input: { tournamentId: number; stageId: number; actor?: TournamentMutationActor }): Promise<SeedingCeremonyState> {
  return revealCeremony(input, true);
}

export async function resetSeedingCeremony(input: { tournamentId: number; stageId: number; actor?: TournamentMutationActor }): Promise<void> {
  const { db } = await import("@workspace/db");
  await db.transaction(async (tx) => {
    const loaded = await loadPlannedStageForCeremony(tx, input);
    const current = parseSeedingCeremonyState(loaded.stage.seedingAudit);
    if (!current) return;
    await tx.update(tournamentStagesTable).set({
      seedingAudit: null,
      version: loaded.stage.version + 1,
    }).where(eq(tournamentStagesTable.id, loaded.stage.id));
    await tx.insert(actionLogTable).values({
      tournamentId: loaded.tournament.id,
      stageId: loaded.stage.id,
      actionType: "seeding_ceremony_reset",
      description: `Zresetowano przygotowane losowanie etapu ${loaded.stage.name}.`,
      matchId: null,
      undoPayload: null,
      isUndone: false,
    });
  });
}
