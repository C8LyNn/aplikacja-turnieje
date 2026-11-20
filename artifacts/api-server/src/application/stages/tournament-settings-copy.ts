// QW-09 · loads the stored rows for the settings copy; the pure builder lives in domain/tournament/settings-copy.ts.
import { asc, count, eq } from "drizzle-orm";
import { db, stageBasketsTable, tournamentStagesTable } from "@workspace/db";
import { loadTournamentGameConfig } from "../games/tournament-game-config";
import { buildSettingsCopy, type SettingsCopy, type SettingsCopyOptions, type TournamentRow } from "../../domain/tournament/settings-copy";

export { buildSettingsCopy, SettingsCopyError, SETTINGS_COPY_NOT_COPIED } from "../../domain/tournament/settings-copy";

/** Loads the stored rows and builds the copy. */
export async function loadSettingsCopy(tournament: TournamentRow, options: SettingsCopyOptions = {}): Promise<SettingsCopy> {
  const [stages, gameConfig, [baskets]] = await Promise.all([
    db.select().from(tournamentStagesTable).where(eq(tournamentStagesTable.tournamentId, tournament.id)).orderBy(asc(tournamentStagesTable.position)),
    loadTournamentGameConfig(tournament.id),
    db.select({ value: count() }).from(stageBasketsTable).where(eq(stageBasketsTable.tournamentId, tournament.id)),
  ]);
  return buildSettingsCopy(tournament, stages, gameConfig, { ...options, hasCustomBaskets: (baskets?.value ?? 0) > 0 });
}
