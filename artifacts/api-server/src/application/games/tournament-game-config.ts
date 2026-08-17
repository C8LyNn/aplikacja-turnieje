import { eq, inArray } from "drizzle-orm";
import { db, tournamentGameConfigsTable, tournamentStagesTable } from "@workspace/db";
import {
  parseTournamentGameConfig,
  calculateMarvelRoundParticipantCounts,
  TournamentGameConfigError,
  type SupportedTournamentGameConfig,
} from "@workspace/game-catalog";

export type TournamentDatabaseTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export const GAME_CONFIG_IMMUTABLE_CODE = "GAME_CONFIG_IMMUTABLE" as const;

export class TournamentGameConfigImmutableError extends Error {
  readonly code = GAME_CONFIG_IMMUTABLE_CODE;

  constructor() {
    super("Game configuration cannot be changed after the tournament has started.");
    this.name = "TournamentGameConfigImmutableError";
  }
}

function fromRow(
  row: typeof tournamentGameConfigsTable.$inferSelect,
): SupportedTournamentGameConfig {
  return parseTournamentGameConfig({
    gameId: row.gameId,
    configVersion: row.configVersion,
    config: row.config,
  });
}

export async function loadTournamentGameConfig(
  tournamentId: number,
): Promise<SupportedTournamentGameConfig | null> {
  const [row] = await db
    .select()
    .from(tournamentGameConfigsTable)
    .where(eq(tournamentGameConfigsTable.tournamentId, tournamentId));
  return row ? fromRow(row) : null;
}

export async function loadTournamentGameConfigMap(
  tournamentIds: readonly number[],
): Promise<Map<number, SupportedTournamentGameConfig>> {
  if (tournamentIds.length === 0) return new Map();
  const rows = await db
    .select()
    .from(tournamentGameConfigsTable)
    .where(inArray(tournamentGameConfigsTable.tournamentId, [...tournamentIds]));
  return new Map(rows.map((row) => [row.tournamentId, fromRow(row)]));
}

export async function replaceTournamentGameConfig(
  tx: TournamentDatabaseTransaction,
  tournamentId: number,
  value: unknown | null | undefined,
): Promise<SupportedTournamentGameConfig | null> {
  const [existing] = await tx
    .select({ gameId: tournamentGameConfigsTable.gameId })
    .from(tournamentGameConfigsTable)
    .where(eq(tournamentGameConfigsTable.tournamentId, tournamentId));
  if (value == null) {
    if (existing?.gameId === "marvel") {
      throw new TournamentGameConfigError(
        "INVALID_GAME_CONFIG",
        "Marvel rules cannot be removed without replacing the stage plan.",
      );
    }
    await tx
      .delete(tournamentGameConfigsTable)
      .where(eq(tournamentGameConfigsTable.tournamentId, tournamentId));
    return null;
  }

  const parsed = parseTournamentGameConfig(value);
  if (existing?.gameId === "marvel" && parsed.gameId !== "marvel") {
    throw new TournamentGameConfigError(
      "INVALID_GAME_CONFIG",
      "Marvel rules cannot be replaced without replacing the stage plan.",
    );
  }
  if (
    parsed.gameId === "deadlock" &&
    (parsed.config.stageBans?.length ?? 0) > 0
  ) {
    const stages = await tx
      .select({ stageKey: tournamentStagesTable.stageKey })
      .from(tournamentStagesTable)
      .where(eq(tournamentStagesTable.tournamentId, tournamentId));
    const stageKeys = new Set(stages.map((stage) => stage.stageKey));
    const unknown = parsed.config.stageBans?.find((entry) => !stageKeys.has(entry.stageKey));
    if (unknown) {
      throw new TournamentGameConfigError(
        "INVALID_GAME_CONFIG",
        `Deadlock stage bans reference unknown stage: ${unknown.stageKey}.`,
      );
    }
  }
  if (parsed.gameId === "marvel") {
    const stages = await tx
      .select()
      .from(tournamentStagesTable)
      .where(eq(tournamentStagesTable.tournamentId, tournamentId));
    const stage = stages[0];
    if (
      stages.length !== 1 ||
      !stage ||
      stage.status !== "planned" ||
      stage.format !== "group_stage"
    ) {
      throw new TournamentGameConfigError(
        "INVALID_GAME_CONFIG",
        "Marvel rules require one planned elimination-group stage.",
      );
    }
    try {
      calculateMarvelRoundParticipantCounts(
        stage.participantCount,
        parsed.config.groupSize,
        parsed.config.advancingCount,
      );
    } catch (error) {
      throw new TournamentGameConfigError(
        "INVALID_GAME_CONFIG",
        error instanceof Error
          ? `Invalid Marvel participant flow: ${error.message}`
          : "Invalid Marvel participant flow.",
      );
    }
    const participantsPerGroup = Math.min(
      stage.participantCount,
      parsed.config.groupSize,
    );
    if (parsed.config.advancingCount > participantsPerGroup) {
      throw new TournamentGameConfigError(
        "INVALID_GAME_CONFIG",
        "Marvel advancingCount cannot exceed the actual group size.",
      );
    }
    await tx
      .update(tournamentStagesTable)
      .set({
        groupCount: Math.ceil(stage.participantCount / parsed.config.groupSize),
        participantsPerGroup,
        qualifiersPerGroup: parsed.config.advancingCount,
      })
      .where(eq(tournamentStagesTable.id, stage.id));
  }
  const persistedConfig: Record<string, unknown> = { ...parsed.config };
  await tx
    .insert(tournamentGameConfigsTable)
    .values({
      tournamentId,
      gameId: parsed.gameId,
      configVersion: parsed.configVersion,
      config: persistedConfig,
    })
    .onConflictDoUpdate({
      target: tournamentGameConfigsTable.tournamentId,
      set: {
        gameId: parsed.gameId,
        configVersion: parsed.configVersion,
        config: persistedConfig,
        updatedAt: new Date(),
      },
    });
  return parsed;
}
