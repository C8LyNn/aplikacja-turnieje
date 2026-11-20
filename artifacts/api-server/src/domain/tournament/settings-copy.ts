/**
 * QW-09 · "Nowy turniej z tymi ustawieniami": turns a stored tournament into an ordinary create request for the next
 * event. It copies only settings — format and stage plan, match/league/set rules, game settings, team rules,
 * participant fields, presentation and the sign-up form (closed). It never copies participants, matches, results,
 * history, passwords, support people or schedule dates. The new tournament is created by the same create path as
 * any other, so the engine's own validation stays the single source of truth.
 */
import { randomBytes } from "node:crypto";
import type { tournamentStagesTable, tournamentsTable } from "@workspace/db";
import type { SupportedTournamentGameConfig } from "@workspace/game-catalog";
import { registrationSettingsFromStorage } from "./registration";

export type TournamentRow = typeof tournamentsTable.$inferSelect;
type StageRow = typeof tournamentStagesTable.$inferSelect;
type GameConfig = SupportedTournamentGameConfig | null;

export const SETTINGS_COPY_PARTICIPANTS = Object.freeze({ min: 2, max: 1024 });

/** What the copy does not take over, in the words the organizer sees. */
export const SETTINGS_COPY_NOT_COPIED = Object.freeze([
  "uczestnicy i drużyny",
  "mecze, wyniki i tabele",
  "historia zmian",
  "hasła",
  "osoby wspierające",
  "terminy meczów",
]);

export class SettingsCopyError extends Error {
  constructor(readonly code: "SETTINGS_COPY_UNSUPPORTED" | "INVALID_SETTINGS_COPY", message: string) { super(message); }
}

export interface SettingsCopyOptions {
  /** Single-stage tournaments only: participant count for the next event (default: as before). */
  participantCount?: number;
  /** Fresh key for random draws, so the next event does not repeat the previous draw. */
  drawKey?: () => string;
}

export interface SettingsCopy {
  /** Create request without name and passwords (the organizer gives those in the dialog). */
  body: Record<string, unknown>;
  /** Stored tournament columns copied as they are (already validated when they were saved). */
  columns: { participantFields: unknown; registrationSettings: unknown; presentationSettings: unknown };
  summary: {
    sourceId: number;
    sourceName: string;
    mode: "flexible" | "plan";
    participantCount: number | null;
    resizable: boolean;
    stages: { name: string; format: StageRow["format"] }[];
    participantType: "players" | "teams";
    visibility: string;
    participantFieldCount: number;
    signups: "off" | "closed";
    gameId: string | null;
    notCopied: readonly string[];
  };
}

const freshDrawKey = () => `copy-${randomBytes(9).toString("base64url")}`;

function isFlexible(tournament: TournamentRow, stages: readonly StageRow[], gameConfig: GameConfig): boolean {
  // A tournament created without a stage plan: one stage, no participant limit, no routing plan (DE) and no groups.
  const [only] = stages;
  return stages.length === 1
    && tournament.maxPlayers == null
    && only.format !== "double_elimination"
    && only.format !== "group_stage"
    && only.roundRobinLegs === 1
    && gameConfig?.gameId !== "marvel";
}

function planStage(stage: StageRow, participantCount: number, drawKey: () => string): Record<string, unknown> {
  const knockout = stage.format === "single_elimination" || stage.format === "double_elimination";
  const randomPlacement = stage.seedingPolicy === "random_groups" || stage.seedingPolicy === "random_bracket";
  const random = stage.entrySeedingPolicy === "random" || randomPlacement || stage.randomSeed != null;
  return {
    key: stage.stageKey,
    position: stage.position,
    name: stage.name,
    format: stage.format,
    participantCount,
    bestOf: stage.bestOf,
    ...(stage.format === "swiss" && stage.plannedRounds != null ? { rounds: stage.plannedRounds } : {}),
    ...(stage.format === "round_robin" ? { legs: stage.roundRobinLegs === 2 ? 2 : 1 } : {}),
    ...(stage.leagueRules != null ? { leagueRules: stage.leagueRules } : {}),
    ...(stage.matchRules != null ? { matchRules: stage.matchRules } : {}),
    ...((stage.format === "swiss" || stage.format === "round_robin" || stage.format === "single_elimination")
      && stage.qualificationMode === "top_n" && stage.advancingCount != null
      ? { advancingCount: stage.advancingCount }
      : {}),
    ...(stage.format === "group_stage"
      ? {
          groupCount: stage.groupCount,
          participantsPerGroup: stage.participantsPerGroup,
          qualifiersPerGroup: stage.qualifiersPerGroup,
          placementMethod: stage.seedingPolicy === "random_groups" ? "random" : "snake",
          resultSeedingMethod: stage.resultSeedingPolicy === "global_ranking" ? "global_ranking" : "rank_bands",
        }
      : {}),
    ...(knockout ? { placementMethod: stage.seedingPolicy === "random_bracket" ? "random" : "standard" } : {}),
    entrySeedingMethod: stage.entrySeedingPolicy,
    ...(random ? { randomSeed: drawKey() } : {}),
    randomRevealOrder: stage.randomRevealOrder,
  };
}

/** Pure: builds the copy from stored rows. Throws SettingsCopyError for tournaments it cannot copy faithfully. */
export function buildSettingsCopy(
  tournament: TournamentRow,
  stages: readonly StageRow[],
  gameConfig: GameConfig,
  options: SettingsCopyOptions & { hasCustomBaskets?: boolean } = {},
): SettingsCopy {
  if (stages.length === 0) throw new SettingsCopyError("SETTINGS_COPY_UNSUPPORTED", "Ten turniej nie ma etapów do skopiowania.");
  if (tournament.basketFlowAuthorityVersion > 0 || options.hasCustomBaskets) {
    throw new SettingsCopyError(
      "SETTINGS_COPY_UNSUPPORTED",
      "Turniej z własnymi koszykami awansu nie może jeszcze zostać skopiowany. Utwórz nowy turniej w kreatorze.",
    );
  }
  const ordered = [...stages].sort((a, b) => a.position - b.position);
  const drawKey = options.drawKey ?? freshDrawKey;
  const flexible = isFlexible(tournament, ordered, gameConfig);
  const resizable = ordered.length === 1 && ordered[0].format !== "group_stage";
  if (options.participantCount !== undefined) {
    const value = options.participantCount;
    if (!resizable) {
      throw new SettingsCopyError("INVALID_SETTINGS_COPY", "Liczbę uczestników można zmienić tylko w turnieju jednoetapowym (bez grup).");
    }
    if (!Number.isInteger(value) || value < SETTINGS_COPY_PARTICIPANTS.min || value > SETTINGS_COPY_PARTICIPANTS.max) {
      throw new SettingsCopyError("INVALID_SETTINGS_COPY", `Liczba uczestników: ${SETTINGS_COPY_PARTICIPANTS.min}–${SETTINGS_COPY_PARTICIPANTS.max}.`);
    }
  }
  const [first] = ordered;
  const teams = tournament.participantType === "teams";
  const common: Record<string, unknown> = {
    ...(tournament.description ? { description: tournament.description } : {}),
    visibility: tournament.visibility,
    ...(teams ? { participantType: "teams" } : {}),
    ...(teams && tournament.teamRosterMin != null ? { teamRosterMin: tournament.teamRosterMin } : {}),
    ...(teams && tournament.teamRosterMax != null ? { teamRosterMax: tournament.teamRosterMax } : {}),
    ...(gameConfig ? { gameConfig: { gameId: gameConfig.gameId, configVersion: gameConfig.configVersion, config: gameConfig.config } } : {}),
  };

  let body: Record<string, unknown>;
  let participantCount: number | null;
  if (flexible) {
    participantCount = null;
    body = {
      ...common,
      format: first.format,
      defaultBestOf: first.bestOf,
      ...(first.format === "swiss" && first.plannedRounds != null ? { swissRounds: first.plannedRounds } : {}),
      ...(first.leagueRules != null && first.format === "round_robin" ? { leagueRules: first.leagueRules } : {}),
      ...(first.matchRules != null ? { matchRules: first.matchRules } : {}),
    };
  } else {
    // Single stage: the participant count follows the players of the last event unless the organizer sets one.
    const previous = ordered.length === 1
      ? Math.max(SETTINGS_COPY_PARTICIPANTS.min, tournament.maxPlayers ?? first.participantCount)
      : first.participantCount;
    participantCount = options.participantCount ?? previous;
    body = {
      ...common,
      format: first.format,
      stagePlan: {
        initialParticipantCount: participantCount,
        stages: ordered.map((stage, index) =>
          planStage(stage, index === 0 ? participantCount! : stage.participantCount, drawKey)),
      },
    };
  }

  const registration = registrationSettingsFromStorage(tournament.registrationSettings);
  const fields = (tournament.participantFields as { fields?: unknown[] } | null)?.fields;
  return {
    body,
    columns: {
      participantFields: tournament.participantFields ?? null,
      // The sign-up form is kept but closed: the organizer opens it when the next event is ready.
      registrationSettings: tournament.registrationSettings == null ? null : { ...registration, open: false },
      presentationSettings: tournament.presentationSettings ?? null,
    },
    summary: {
      sourceId: tournament.id,
      sourceName: tournament.name,
      mode: flexible ? "flexible" : "plan",
      participantCount,
      resizable,
      stages: ordered.map((stage) => ({ name: stage.name, format: stage.format })),
      participantType: teams ? "teams" : "players",
      visibility: tournament.visibility,
      participantFieldCount: Array.isArray(fields) ? fields.length : 0,
      signups: registration.enabled ? "closed" : "off",
      gameId: gameConfig?.gameId ?? null,
      notCopied: SETTINGS_COPY_NOT_COPIED,
    },
  };
}

