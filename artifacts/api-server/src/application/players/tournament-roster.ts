import { and, asc, count, eq, ne } from "drizzle-orm";
import {
  actionLogTable,
  db,
  playersTable,
  tournamentsTable,
} from "@workspace/db";
import {
  revalidateTournamentMutationActor,
  type TournamentMutationActor,
} from "../../access-policy";
import { addPlayerWithStagePlanCompatibilityInTransaction } from "../stages/create-tournament-with-plan";

export type TournamentRosterErrorCode =
  | "TOURNAMENT_NOT_FOUND"
  | "PLAYER_NOT_FOUND"
  | "ROSTER_LOCKED"
  | "ROSTER_UNDO_UNAVAILABLE"
  | "DUPLICATE_PLAYER_NAME"
  | "PLAYER_LIMIT_REACHED"
  | "CSV_INVALID_HEADER"
  | "CSV_NO_VALID_PLAYERS"
  | "CSV_DUPLICATE_PLAYERS"
  | "CSV_PLAYER_LIMIT_EXCEEDED";

const ERROR_MESSAGES: Record<TournamentRosterErrorCode, string> = {
  TOURNAMENT_NOT_FOUND: "Turniej nie istnieje.",
  PLAYER_NOT_FOUND: "Gracz nie istnieje.",
  ROSTER_LOCKED: "Składu nie można zmieniać po rozpoczęciu turnieju.",
  ROSTER_UNDO_UNAVAILABLE: "Ta operacja składu nie może już zostać cofnięta.",
  DUPLICATE_PLAYER_NAME: "Gracz o tej nazwie już istnieje w turnieju.",
  PLAYER_LIMIT_REACHED: "Osiągnięto limit graczy turnieju.",
  CSV_INVALID_HEADER:
    "Plik CSV musi zawierać kolumnę 'name' albo 'nick'. Skład nie został zmieniony.",
  CSV_NO_VALID_PLAYERS:
    "Plik CSV nie zawiera żadnego poprawnego uczestnika. Skład nie został zmieniony.",
  CSV_DUPLICATE_PLAYERS:
    "Plik CSV zawiera zduplikowanych uczestników. Tryb replace nie zmienił składu.",
  CSV_PLAYER_LIMIT_EXCEEDED:
    "Liczba poprawnych uczestników przekracza limit turnieju. Tryb replace nie zmienił składu.",
};

export class TournamentRosterError extends Error {
  constructor(public readonly code: TournamentRosterErrorCode) {
    super(ERROR_MESSAGES[code]);
    this.name = "TournamentRosterError";
  }
}

type PlayerInsert = Omit<typeof playersTable.$inferInsert, "tournamentId">;
type PlayerUpdate = Partial<
  Pick<
    typeof playersTable.$inferInsert,
    "name" | "rank" | "country" | "teamName" | "seed" | "status"
  >
>;

async function lockDraftTournament(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tournamentId: number,
  actor?: TournamentMutationActor,
) {
  const [tournament] = await tx
    .select()
    .from(tournamentsTable)
    .where(eq(tournamentsTable.id, tournamentId))
    .for("update");
  if (!tournament) throw new TournamentRosterError("TOURNAMENT_NOT_FOUND");
  await revalidateTournamentMutationActor(tx, tournament, actor);
  if (tournament.status !== "draft")
    throw new TournamentRosterError("ROSTER_LOCKED");
  return tournament;
}

async function assertUniqueName(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tournamentId: number,
  name: string,
  exceptPlayerId?: number,
): Promise<void> {
  const rows = await tx
    .select({ id: playersTable.id, name: playersTable.name })
    .from(playersTable)
    .where(
      exceptPlayerId == null
        ? eq(playersTable.tournamentId, tournamentId)
        : and(
            eq(playersTable.tournamentId, tournamentId),
            ne(playersTable.id, exceptPlayerId),
          ),
    );
  const normalized = name.trim().toLocaleLowerCase("pl");
  if (rows.some((row) => row.name.trim().toLocaleLowerCase("pl") === normalized))
    throw new TournamentRosterError("DUPLICATE_PLAYER_NAME");
}

export async function addTournamentPlayer(input: {
  tournamentId: number;
  player: PlayerInsert;
  actor?: TournamentMutationActor;
}) {
  return db.transaction(async (tx) => {
    const tournament = await lockDraftTournament(tx, input.tournamentId, input.actor);
    const name = String(input.player.name).trim();
    await assertUniqueName(tx, input.tournamentId, name);
    const [{ playerCount }] = await tx
      .select({ playerCount: count() })
      .from(playersTable)
      .where(eq(playersTable.tournamentId, input.tournamentId));
    if (playerCount >= (tournament.maxPlayers ?? 256))
      throw new TournamentRosterError("PLAYER_LIMIT_REACHED");

    const player = await addPlayerWithStagePlanCompatibilityInTransaction(tx, {
      ...input.player,
      tournamentId: input.tournamentId,
      name,
    });
    await tx.insert(actionLogTable).values({
      tournamentId: input.tournamentId,
      actionType: "player_added",
      description: `Dodano gracza: ${player.name}${player.seed ? ` (seed ${player.seed})` : ""}`,
      undoPayload: JSON.stringify({ type: "delete_player", playerId: player.id }),
      isUndone: false,
    });
    return player;
  });
}

export async function updateTournamentPlayer(input: {
  tournamentId: number;
  playerId: number;
  changes: PlayerUpdate;
  actor?: TournamentMutationActor;
}) {
  return db.transaction(async (tx) => {
    await lockDraftTournament(tx, input.tournamentId, input.actor);
    const [existing] = await tx
      .select()
      .from(playersTable)
      .where(
        and(
          eq(playersTable.id, input.playerId),
          eq(playersTable.tournamentId, input.tournamentId),
        ),
      )
      .for("update");
    if (!existing) throw new TournamentRosterError("PLAYER_NOT_FOUND");
    const changes = { ...input.changes };
    if (changes.name != null) {
      changes.name = String(changes.name).trim();
      await assertUniqueName(tx, input.tournamentId, changes.name, input.playerId);
    }
    const [player] = await tx
      .update(playersTable)
      .set(changes)
      .where(eq(playersTable.id, input.playerId))
      .returning();
    await tx.insert(actionLogTable).values({
      tournamentId: input.tournamentId,
      actionType: "player_edited",
      description: `Edytowano gracza: ${existing.name} → ${player.name}`,
      undoPayload: JSON.stringify({
        type: "restore_player",
        playerId: player.id,
        prevData: {
          name: existing.name,
          seed: existing.seed,
          rank: existing.rank,
          country: existing.country,
          teamName: existing.teamName,
        },
      }),
      isUndone: false,
    });
    return player;
  });
}

export async function deleteTournamentPlayer(input: {
  tournamentId: number;
  playerId: number;
  actor?: TournamentMutationActor;
}) {
  return db.transaction(async (tx) => {
    await lockDraftTournament(tx, input.tournamentId, input.actor);
    const [player] = await tx
      .select()
      .from(playersTable)
      .where(
        and(
          eq(playersTable.id, input.playerId),
          eq(playersTable.tournamentId, input.tournamentId),
        ),
      )
      .for("update");
    if (!player) throw new TournamentRosterError("PLAYER_NOT_FOUND");
    await tx.delete(playersTable).where(eq(playersTable.id, input.playerId));
    await tx.insert(actionLogTable).values({
      tournamentId: input.tournamentId,
      actionType: "player_removed",
      description: `Usunięto gracza: ${player.name}`,
      isUndone: false,
    });
    return player;
  });
}

export async function undoTournamentRosterAction(input: {
  tournamentId: number;
  actionId: number;
  actor?: TournamentMutationActor;
}) {
  return db.transaction(async (tx) => {
    await lockDraftTournament(tx, input.tournamentId, input.actor);
    const [action] = await tx
      .select()
      .from(actionLogTable)
      .where(
        and(
          eq(actionLogTable.id, input.actionId),
          eq(actionLogTable.tournamentId, input.tournamentId),
          eq(actionLogTable.isUndone, false),
        ),
      )
      .for("update");
    if (!action?.undoPayload)
      throw new TournamentRosterError("ROSTER_UNDO_UNAVAILABLE");

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(action.undoPayload) as Record<string, unknown>;
    } catch {
      throw new TournamentRosterError("ROSTER_UNDO_UNAVAILABLE");
    }

    if (payload.type === "delete_player") {
      const playerId = Number(payload.playerId);
      const [player] = await tx
        .select()
        .from(playersTable)
        .where(
          and(
            eq(playersTable.id, playerId),
            eq(playersTable.tournamentId, input.tournamentId),
          ),
        )
        .for("update");
      if (!player) throw new TournamentRosterError("PLAYER_NOT_FOUND");
      await tx.delete(playersTable).where(eq(playersTable.id, playerId));
      await tx.insert(actionLogTable).values({
        tournamentId: input.tournamentId,
        actionType: "player_removed",
        description: `Cofnięto dodanie gracza (usunięto ID ${playerId})`,
        isUndone: false,
      });
    } else if (payload.type === "restore_player") {
      const playerId = Number(payload.playerId);
      const prevData = payload.prevData;
      if (!prevData || typeof prevData !== "object" || Array.isArray(prevData))
        throw new TournamentRosterError("ROSTER_UNDO_UNAVAILABLE");
      const [player] = await tx
        .select()
        .from(playersTable)
        .where(
          and(
            eq(playersTable.id, playerId),
            eq(playersTable.tournamentId, input.tournamentId),
          ),
        )
        .for("update");
      if (!player) throw new TournamentRosterError("PLAYER_NOT_FOUND");
      const changes = prevData as PlayerUpdate;
      if (changes.name != null) {
        changes.name = String(changes.name).trim();
        await assertUniqueName(tx, input.tournamentId, changes.name, playerId);
      }
      await tx.update(playersTable).set(changes).where(eq(playersTable.id, playerId));
      await tx.insert(actionLogTable).values({
        tournamentId: input.tournamentId,
        actionType: "player_edited",
        description: "Cofnięto edycję gracza — przywrócono poprzednie dane",
        isUndone: false,
      });
    } else {
      throw new TournamentRosterError("ROSTER_UNDO_UNAVAILABLE");
    }

    const [updatedAction] = await tx
      .update(actionLogTable)
      .set({ isUndone: true })
      .where(eq(actionLogTable.id, action.id))
      .returning();
    return updatedAction;
  });
}

export interface CsvRowError {
  line: number;
  content: string;
  reason: string;
}

interface ParsedCsvRow {
  lineNum: number;
  name: string;
  rank?: string;
  seed?: number;
  teamName?: string;
  country?: string;
}

function parseCsvRows(csv: string): {
  rawDataRows: number;
  rows: ParsedCsvRow[];
  errors: CsvRowError[];
  hasValidHeader: boolean;
} {
  const rawLines = csv.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const separator = rawLines[0]?.includes(";") ? ";" : ",";
  const headers = rawLines[0]?.split(separator).map((value) => value.trim().toLowerCase()) ?? [];
  const nameIndex = headers.includes("name") ? headers.indexOf("name") : headers.indexOf("nick");
  const rows: ParsedCsvRow[] = [];
  const errors: CsvRowError[] = [];
  const seenNames = new Set<string>();

  for (let index = 1; index < rawLines.length; index += 1) {
    const raw = rawLines[index];
    if (!raw.trim()) continue;
    const line = index + 1;
    const values = raw.split(separator).map((value) => value.trim());
    const get = (...keys: string[]) => {
      const column = keys.map((key) => headers.indexOf(key)).find((item) => item >= 0) ?? -1;
      return column >= 0 && column < values.length ? values[column] : "";
    };
    const name = nameIndex >= 0 ? values[nameIndex]?.trim() ?? "" : "";
    if (!name) {
      errors.push({ line, content: raw, reason: "Brak nazwy zawodnika (kolumna 'name' lub 'nick' jest wymagana)" });
      continue;
    }
    if (name.length > 100) {
      errors.push({ line, content: raw, reason: `Nazwa jest za długa (${name.length} znaków, max 100)` });
      continue;
    }
    const normalized = name.toLocaleLowerCase("pl");
    if (seenNames.has(normalized)) {
      errors.push({ line, content: raw, reason: `Duplikat w pliku CSV: "${name}"` });
      continue;
    }
    seenNames.add(normalized);
    const seedText = get("seed");
    let seed: number | undefined;
    if (seedText) {
      seed = Number(seedText);
      if (!Number.isInteger(seed) || seed < 1 || seed > 999) {
        errors.push({ line, content: raw, reason: `Nieprawidłowe rozstawienie (seed): "${seedText}"` });
        continue;
      }
    }
    rows.push({
      lineNum: line,
      name,
      rank: get("rank", "ranga") || undefined,
      seed,
      teamName: get("team", "druzyna") || undefined,
      country: get("country", "kraj") || undefined,
    });
  }
  return {
    rawDataRows: Math.max(0, rawLines.filter((line) => line.trim()).length - 1),
    rows,
    errors,
    hasValidHeader: nameIndex >= 0,
  };
}

export interface ImportTournamentPlayersTestHooks {
  /** Test-only seam; never exposed through HTTP, headers or environment variables. */
  afterExistingPlayersDeleted?: () => void | Promise<void>;
}

export async function importTournamentPlayers(input: {
  tournamentId: number;
  csv: string;
  mode: "append" | "replace";
  actor?: TournamentMutationActor;
  testHooks?: ImportTournamentPlayersTestHooks;
}) {
  return db.transaction(async (tx) => {
    const tournament = await lockDraftTournament(tx, input.tournamentId, input.actor);
    const existing = await tx
      .select()
      .from(playersTable)
      .where(eq(playersTable.tournamentId, input.tournamentId))
      .orderBy(asc(playersTable.createdAt));
    const parsed = parseCsvRows(input.csv);
    if (!parsed.hasValidHeader)
      throw new TournamentRosterError("CSV_INVALID_HEADER");
    const existingNames = new Set(
      existing.map((player) => player.name.trim().toLocaleLowerCase("pl")),
    );
    const errors = [...parsed.errors];
    const containsCsvDuplicates = parsed.errors.some((error) =>
      error.reason.startsWith("Duplikat w pliku CSV:"),
    );
    const accepted = parsed.rows.filter((row) => {
      if (input.mode === "append" && existingNames.has(row.name.toLocaleLowerCase("pl"))) {
        errors.push({
          line: row.lineNum,
          content: row.name,
          reason: `Zawodnik "${row.name}" jest już na liście turnieju`,
        });
        return false;
      }
      return true;
    });
    const currentCount = input.mode === "replace" ? 0 : existing.length;
    const limit = tournament.maxPlayers ?? 256;
    const available = Math.max(0, limit - currentCount);

    if (input.mode === "replace" && containsCsvDuplicates)
      throw new TournamentRosterError("CSV_DUPLICATE_PLAYERS");
    if (input.mode === "replace" && accepted.length > available)
      throw new TournamentRosterError("CSV_PLAYER_LIMIT_EXCEEDED");

    const rowsToInsert = accepted.slice(0, available);
    for (const row of accepted.slice(available)) {
      errors.push({
        line: row.lineNum,
        content: row.name,
        reason: `Limit graczy turnieju (${limit}) został osiągnięty — gracz pominięty`,
      });
    }

    if (rowsToInsert.length === 0)
      throw new TournamentRosterError("CSV_NO_VALID_PLAYERS");

    if (input.mode === "replace" && existing.length > 0) {
      await tx.delete(playersTable).where(eq(playersTable.tournamentId, input.tournamentId));
      await input.testHooks?.afterExistingPlayersDeleted?.();
    }
    const inserted = rowsToInsert.length === 0
      ? []
      : await tx
          .insert(playersTable)
          .values(rowsToInsert.map((row) => ({
            tournamentId: input.tournamentId,
            name: row.name,
            rank: row.rank ?? null,
            seed: row.seed ?? null,
            teamName: row.teamName ?? null,
            country: row.country ?? null,
          })))
          .returning();

    await tx.insert(actionLogTable).values({
      tournamentId: input.tournamentId,
      actionType: "players_imported",
      description: `Zaimportowano ${inserted.length} graczy (${input.mode === "replace" ? "replace" : "append"})`,
      isUndone: false,
    });

    return {
      imported: inserted.length,
      skipped: errors.length,
      replacedCount: input.mode === "replace" ? existing.length : undefined,
      limitExceeded: accepted.length > available,
      players: inserted,
      errors,
      totalCsvDataRows: parsed.rawDataRows,
      writePerformed: true,
    };
  });
}
