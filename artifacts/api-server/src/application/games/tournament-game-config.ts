import { eq, inArray } from "drizzle-orm";
import { db, tournamentGameConfigsTable, tournamentStagesTable } from "@workspace/db";
import {
  parseTournamentGameConfig,
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
  if (value == null) {
    await tx
      .delete(tournamentGameConfigsTable)
      .where(eq(tournamentGameConfigsTable.tournamentId, tournamentId));
    return null;
  }

  const parsed = parseTournamentGameConfig(value);
  if (parsed.gameId === "deadlock" && (parsed.config.stageBans?.length ?? 0) > 0) {
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
