/**
 * V5.4-005 · saving participant field definitions and values.
 *
 * Definitions: organiser only. A change that would drop or reinterpret stored values is refused with
 * the list of affected fields until the organiser confirms; only then are the values pruned.
 * Values: organiser (all fields) or helper (non-private fields), in any tournament state — they never
 * feed the engine, so editing them after the start cannot change results.
 */
import { and, eq } from "drizzle-orm";
import { actionLogTable, db, playersTable, tournamentsTable } from "@workspace/db";
import { revalidateTournamentMutationActor, type TournamentMutationActor } from "../../access-policy";
import {
  definitionChangeImpact,
  parseParticipantFieldSet,
  participantFieldsFromStorage,
  pruneValues,
  validateFieldValues,
  type ParticipantFieldAudience,
  type ParticipantFieldProblem,
  type ParticipantFieldSet,
} from "../../domain/tournament/participant-fields";

export type ParticipantFieldsErrorCode =
  | "TOURNAMENT_NOT_FOUND"
  | "PLAYER_NOT_FOUND"
  | "INVALID_PARTICIPANT_FIELDS"
  | "INVALID_FIELD_VALUES"
  | "PARTICIPANT_FIELD_VALUES_AFFECTED";

const MESSAGES: Record<ParticipantFieldsErrorCode, string> = {
  TOURNAMENT_NOT_FOUND: "Turniej nie istnieje.",
  PLAYER_NOT_FOUND: "Uczestnik nie istnieje.",
  INVALID_PARTICIPANT_FIELDS: "Definicje pól są niepoprawne.",
  INVALID_FIELD_VALUES: "Wartości pól są niepoprawne.",
  PARTICIPANT_FIELD_VALUES_AFFECTED: "Ta zmiana usunie albo zmieni zapisane wartości. Potwierdź, aby kontynuować.",
};

export class ParticipantFieldsError extends Error {
  constructor(
    public readonly code: ParticipantFieldsErrorCode,
    public readonly details: { problems?: ParticipantFieldProblem[]; impact?: ReturnType<typeof definitionChangeImpact> } = {},
  ) {
    super(MESSAGES[code]);
    this.name = "ParticipantFieldsError";
  }
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function lockTournament(tx: Tx, tournamentId: number, actor?: TournamentMutationActor) {
  const [tournament] = await tx.select().from(tournamentsTable).where(eq(tournamentsTable.id, tournamentId)).for("update");
  if (!tournament) throw new ParticipantFieldsError("TOURNAMENT_NOT_FOUND");
  await revalidateTournamentMutationActor(tx, tournament, actor);
  return tournament;
}

export async function saveParticipantFields(input: {
  tournamentId: number;
  definitions: unknown;
  confirmDropValues: boolean;
  actor?: TournamentMutationActor;
}): Promise<{ fields: ParticipantFieldSet | null; prunedParticipants: number }> {
  const parsed = parseParticipantFieldSet(input.definitions);
  if (!parsed.ok) throw new ParticipantFieldsError("INVALID_PARTICIPANT_FIELDS", { problems: parsed.problems });
  const next = parsed.value;
  return db.transaction(async (tx) => {
    const tournament = await lockTournament(tx, input.tournamentId, input.actor);
    const previous = participantFieldsFromStorage(tournament.participantFields);
    const players = await tx.select({ id: playersTable.id, customFields: playersTable.customFields })
      .from(playersTable).where(eq(playersTable.tournamentId, input.tournamentId)).for("update");
    const impact = definitionChangeImpact(previous, next, players.map((player) => player.customFields));
    const affected = impact.removedWithValues.length + impact.retypedWithValues.length + impact.invalidAfterChange.length > 0;
    if (affected && !input.confirmDropValues) throw new ParticipantFieldsError("PARTICIPANT_FIELD_VALUES_AFFECTED", { impact });
    await tx.update(tournamentsTable)
      .set({ participantFields: next.fields.length ? next : null })
      .where(eq(tournamentsTable.id, input.tournamentId));
    let prunedParticipants = 0;
    if (affected) {
      for (const player of players) {
        const pruned = pruneValues(next.fields.length ? next : null, player.customFields);
        if (JSON.stringify(pruned) !== JSON.stringify(player.customFields ?? null)) {
          await tx.update(playersTable).set({ customFields: pruned }).where(eq(playersTable.id, player.id));
          prunedParticipants += 1;
        }
      }
    }
    await tx.insert(actionLogTable).values({
      tournamentId: input.tournamentId,
      actionType: "participant_fields_updated",
      description: `Pola uczestników: ${next.fields.length}${prunedParticipants ? ` (usunięto wartości u ${prunedParticipants} uczestników)` : ""}`,
      isUndone: false,
    });
    return { fields: next.fields.length ? next : null, prunedParticipants };
  });
}

export async function setParticipantFieldValues(input: {
  tournamentId: number;
  playerId: number;
  values: unknown;
  audience: ParticipantFieldAudience;
  actor?: TournamentMutationActor;
}) {
  return db.transaction(async (tx) => {
    const tournament = await lockTournament(tx, input.tournamentId, input.actor);
    const set = participantFieldsFromStorage(tournament.participantFields);
    const [player] = await tx.select().from(playersTable)
      .where(and(eq(playersTable.id, input.playerId), eq(playersTable.tournamentId, input.tournamentId))).for("update");
    if (!player) throw new ParticipantFieldsError("PLAYER_NOT_FOUND");
    const checked = validateFieldValues(set, input.values, { stored: player.customFields, audience: input.audience, enforceRequired: false });
    if (!checked.ok) throw new ParticipantFieldsError("INVALID_FIELD_VALUES", { problems: checked.problems });
    const [updated] = await tx.update(playersTable).set({ customFields: checked.values }).where(eq(playersTable.id, player.id)).returning();
    // Values may be personal data: the log records that they changed, never what they are.
    await tx.insert(actionLogTable).values({
      tournamentId: input.tournamentId,
      actionType: "participant_field_values_updated",
      description: `Zmieniono dane uczestnika: ${player.name}`,
      isUndone: false,
    });
    return { player: updated!, set };
  });
}
