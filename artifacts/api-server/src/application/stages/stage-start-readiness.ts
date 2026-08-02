import { buildGroupPlayoffSlots } from "../../domain/tournament/group-playoff";

export type StageLifecycleErrorCode =
  | "TOURNAMENT_NOT_FOUND"
  | "STAGE_NOT_FOUND"
  | "STAGE_NOT_ACTIVE"
  | "STAGE_NOT_NEXT_PLANNED"
  | "ACTIVE_STAGE_EXISTS"
  | "PREVIOUS_STAGE_NOT_COMPLETED"
  | "STAGE_INCOMPLETE"
  | "STAGE_PARTICIPANTS_INCONSISTENT"
  | "QUALIFICATION_CONFIGURATION_INVALID"
  | "STAGE_FORMAT_NOT_SUPPORTED"
  | "STAGE_ALREADY_COMPLETED"
  | "STAGE_ALREADY_STARTED"
  | "MATCHES_ALREADY_EXIST"
  | "GROUPS_ALREADY_EXIST"
  | "RANKING_INCONSISTENT";

const ERROR_MESSAGES: Record<StageLifecycleErrorCode, string> = {
  TOURNAMENT_NOT_FOUND: "Turniej nie istnieje.",
  STAGE_NOT_FOUND: "Etap nie istnieje.",
  STAGE_NOT_ACTIVE: "Zakończyć można wyłącznie aktywny etap.",
  STAGE_NOT_NEXT_PLANNED: "Uruchomić można wyłącznie najbliższy zaplanowany etap.",
  ACTIVE_STAGE_EXISTS: "Inny etap turnieju jest już aktywny.",
  PREVIOUS_STAGE_NOT_COMPLETED: "Poprzedni etap nie został zakończony.",
  STAGE_INCOMPLETE: "Nie wszystkie wymagane mecze i rundy etapu są zakończone.",
  STAGE_PARTICIPANTS_INCONSISTENT: "Uczestnicy etapu są niespójni.",
  QUALIFICATION_CONFIGURATION_INVALID: "Konfiguracja kwalifikacji między etapami jest niespójna.",
  STAGE_FORMAT_NOT_SUPPORTED: "Ten format etapu nie jest jeszcze obsługiwany przez lifecycle.",
  STAGE_ALREADY_COMPLETED: "Etap został już zakończony.",
  STAGE_ALREADY_STARTED: "Etap został już uruchomiony.",
  MATCHES_ALREADY_EXIST: "Planowany etap zawiera już mecze.",
  GROUPS_ALREADY_EXIST: "Planowany etap zawiera już grupy.",
  RANKING_INCONSISTENT: "Nie można wyliczyć jednoznacznego rankingu etapu.",
};

export class StageLifecycleError extends Error {
  constructor(public readonly code: StageLifecycleErrorCode) {
    super(ERROR_MESSAGES[code]);
    this.name = "StageLifecycleError";
  }
}

export type StageStartFormat = "swiss" | "round_robin" | "group_stage" | "single_elimination";

export interface StageStartTournament {
  id: number;
  activeStageId: number | null;
}

export interface StageStartStage {
  id: number;
  tournamentId: number;
  position: number;
  status: "planned" | "active" | "completed";
  participantCount: number;
  format: StageStartFormat;
  groupCount: number | null;
  participantsPerGroup: number | null;
  qualifiersPerGroup: number | null;
  qualificationMode: string;
  seedingPolicy: string;
}

export interface StageStartParticipant {
  id: number;
  playerId: number;
  stageSeed: number;
  status: string;
  nextStageSeed: number | null;
  qualificationSource: string;
  sourceStageParticipantId: number | null;
  groupId: number | null;
  groupRank: number | null;
}

export interface StageStartPlayer {
  id: number;
  tournamentId: number;
}

export interface StageStartGroup {
  id: number;
  groupKey: string;
}

export interface StageStartValidationSnapshot {
  tournament: StageStartTournament;
  stages: readonly StageStartStage[];
  stage: StageStartStage;
  existingMatchCount: number;
  existingGroupCount: number;
  memberships: readonly StageStartParticipant[];
  sourceMemberships: readonly StageStartParticipant[];
  sourceGroups: readonly StageStartGroup[];
  players: readonly StageStartPlayer[];
}

export interface StageStartReadiness {
  ready: boolean;
  reasonCode: "READY" | StageLifecycleErrorCode;
  message: string;
  participantCount: number;
  requiredParticipantCount: number;
  missingSeeds: number[];
  blockingMatches: number;
  blockingGroups: number;
  format: StageStartFormat;
}

function bracketPositions(size: number): number[] {
  if (size === 2) return [1, 2];
  const previous = bracketPositions(size / 2);
  return previous.flatMap((seed) => [seed, size + 1 - seed]);
}

function missingStageSeeds(
  memberships: readonly StageStartParticipant[],
  participantCount: number,
): number[] {
  const assigned = new Set(memberships.map((membership) => membership.stageSeed));
  return Array.from({ length: participantCount }, (_, index) => index + 1)
    .filter((seed) => !assigned.has(seed));
}

export function assertStageStartReady(snapshot: StageStartValidationSnapshot): void {
  const { tournament, stages, stage, memberships } = snapshot;
  if (stage.status === "active") throw new StageLifecycleError("STAGE_ALREADY_STARTED");
  if (stage.status === "completed") throw new StageLifecycleError("STAGE_ALREADY_COMPLETED");
  if (tournament.activeStageId != null || stages.some((candidate) => candidate.status === "active")) {
    throw new StageLifecycleError("ACTIVE_STAGE_EXISTS");
  }
  const nextPlanned = stages.find((candidate) => candidate.status === "planned");
  if (!nextPlanned || nextPlanned.id !== stage.id) {
    throw new StageLifecycleError("STAGE_NOT_NEXT_PLANNED");
  }
  const previous = stages.find((candidate) => candidate.position === stage.position - 1);
  if (previous && previous.status !== "completed") {
    throw new StageLifecycleError("PREVIOUS_STAGE_NOT_COMPLETED");
  }
  if (snapshot.existingMatchCount > 0) throw new StageLifecycleError("MATCHES_ALREADY_EXIST");
  if (snapshot.existingGroupCount > 0) throw new StageLifecycleError("GROUPS_ALREADY_EXIST");
  if (memberships.length !== stage.participantCount || memberships.length < 2) {
    throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
  }
  if (memberships.some((membership, index) => membership.stageSeed !== index + 1)) {
    throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
  }

  if (previous) {
    const sourceById = new Map(snapshot.sourceMemberships.map((membership) => [membership.id, membership]));
    if (memberships.some((membership) => {
      const source = membership.sourceStageParticipantId == null
        ? null
        : sourceById.get(membership.sourceStageParticipantId);
      return !source ||
        source.playerId !== membership.playerId ||
        source.status !== "qualified" ||
        source.nextStageSeed !== membership.stageSeed ||
        membership.qualificationSource === "registration";
    })) {
      throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
    }
    if (previous.format === "group_stage") {
      if (stage.format !== "single_elimination") {
        throw new StageLifecycleError("QUALIFICATION_CONFIGURATION_INVALID");
      }
      const groupById = new Map(snapshot.sourceGroups.map((group) => [group.id, group]));
      const playoff = buildGroupPlayoffSlots({
        groupCount: previous.groupCount ?? 0,
        qualifiersPerGroup: previous.qualifiersPerGroup ?? 0,
      });
      if (!playoff.ok) throw new StageLifecycleError("QUALIFICATION_CONFIGURATION_INVALID");
      const bracketSeeds = bracketPositions(playoff.slots.length);
      const expectedSeedBySource = new Map(playoff.slots.map((slot, index) => [
        `${slot.source.groupKey}:${slot.source.groupRank}`,
        bracketSeeds[index],
      ]));
      if (memberships.some((membership) => {
        const source = membership.sourceStageParticipantId == null
          ? null
          : sourceById.get(membership.sourceStageParticipantId);
        const group = source?.groupId == null ? null : groupById.get(source.groupId);
        const expectedSeed = group && source?.groupRank != null
          ? expectedSeedBySource.get(`${group.groupKey}:${source.groupRank}`)
          : null;
        return membership.qualificationSource !== "group_position" || expectedSeed !== membership.stageSeed;
      })) {
        throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
      }
    }
  } else if (memberships.some(
    (membership) => membership.sourceStageParticipantId != null || membership.qualificationSource !== "registration",
  )) {
    throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
  }

  if (
    snapshot.players.length !== memberships.length ||
    snapshot.players.some((player) => player.tournamentId !== tournament.id)
  ) {
    throw new StageLifecycleError("STAGE_PARTICIPANTS_INCONSISTENT");
  }

  if (stage.format === "group_stage") {
    const groupCount = stage.groupCount;
    const groupSize = stage.participantsPerGroup;
    const qualifiersPerGroup = stage.qualifiersPerGroup;
    if (
      (groupCount !== 2 && groupCount !== 4) ||
      groupSize == null ||
      groupSize < 3 ||
      groupSize > 8 ||
      (qualifiersPerGroup !== 1 && qualifiersPerGroup !== 2) ||
      qualifiersPerGroup >= groupSize ||
      memberships.length !== groupCount * groupSize ||
      stage.qualificationMode !== "top_n_per_group" ||
      stage.seedingPolicy !== "snake_groups"
    ) {
      throw new StageLifecycleError("QUALIFICATION_CONFIGURATION_INVALID");
    }
  } else if (
    stage.format !== "swiss" &&
    stage.format !== "round_robin" &&
    stage.format !== "single_elimination"
  ) {
    throw new StageLifecycleError("STAGE_FORMAT_NOT_SUPPORTED");
  }
}

export function evaluateStageStartReadiness(
  snapshot: StageStartValidationSnapshot,
): StageStartReadiness {
  const base = {
    participantCount: snapshot.memberships.length,
    requiredParticipantCount: snapshot.stage.participantCount,
    missingSeeds: missingStageSeeds(snapshot.memberships, snapshot.stage.participantCount),
    blockingMatches: snapshot.existingMatchCount,
    blockingGroups: snapshot.existingGroupCount,
    format: snapshot.stage.format,
  };
  try {
    assertStageStartReady(snapshot);
    return { ready: true, reasonCode: "READY", message: "Etap jest gotowy do uruchomienia.", ...base };
  } catch (error) {
    if (!(error instanceof StageLifecycleError)) throw error;
    return { ready: false, reasonCode: error.code, message: error.message, ...base };
  }
}
