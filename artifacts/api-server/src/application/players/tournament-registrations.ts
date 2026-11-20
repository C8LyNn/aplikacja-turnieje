/**
 * #329 · public sign-ups → the existing participant list.
 *
 * Every write locks the tournament row first (`FOR UPDATE`), so two people taking the last place, a resent form or an
 * approval racing a start are serialised. A sign-up is idempotent per client token. Approval goes through
 * `insertRosterPlayerInTransaction` — the same checks and undo entry as a manual add — so `players` stays the only list
 * the engine reads; nothing here touches stages, matches or results.
 */
import { and, asc, count, eq, inArray } from "drizzle-orm";
import { db, playersTable, tournamentRegistrationsTable, tournamentsTable, type TournamentRegistration } from "@workspace/db";
import { revalidateTournamentMutationActor, type TournamentMutationActor } from "../../access-policy";
import {
  participantFieldsFromStorage,
  validateFieldValues,
  visibleFieldValues,
  type ParticipantFieldAudience,
  type ParticipantFieldProblem,
} from "../../domain/tournament/participant-fields";
import {
  cleanRegistrationName,
  isValidClientToken,
  parseRegistrationSettings,
  publicSignupField,
  registrationPlaces,
  registrationSettingsFromStorage,
  signupFieldSet,
  type RegistrationSettings,
} from "../../domain/tournament/registration";
import { insertRosterPlayerInTransaction, lockDraftTournamentForRoster } from "./tournament-roster";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type TournamentRow = typeof tournamentsTable.$inferSelect;

export type RegistrationErrorCode =
  | "REGISTRATION_DISABLED"
  | "REGISTRATION_HIDDEN"
  | "REGISTRATION_CLOSED"
  | "REGISTRATION_STARTED"
  | "REGISTRATION_FULL"
  | "REGISTRATION_NAME_INVALID"
  | "REGISTRATION_TOKEN_INVALID"
  | "REGISTRATION_DUPLICATE_NAME"
  | "REGISTRATION_NOT_FOUND"
  | "REGISTRATION_ALREADY_DECIDED"
  | "INVALID_FIELD_VALUES";

const STATUS: Record<RegistrationErrorCode, number> = {
  REGISTRATION_DISABLED: 404,
  REGISTRATION_HIDDEN: 403,
  REGISTRATION_CLOSED: 409,
  REGISTRATION_STARTED: 409,
  REGISTRATION_FULL: 409,
  REGISTRATION_NAME_INVALID: 422,
  REGISTRATION_TOKEN_INVALID: 422,
  REGISTRATION_DUPLICATE_NAME: 409,
  REGISTRATION_NOT_FOUND: 404,
  REGISTRATION_ALREADY_DECIDED: 409,
  INVALID_FIELD_VALUES: 422,
};

const MESSAGES: Record<RegistrationErrorCode, string> = {
  REGISTRATION_DISABLED: "Zapisy do tego turnieju są wyłączone.",
  REGISTRATION_HIDDEN: "Turniej jest ukryty — zapisy nie są dostępne.",
  REGISTRATION_CLOSED: "Zapisy są zamknięte.",
  REGISTRATION_STARTED: "Turniej już wystartował — zapisy są zamknięte.",
  REGISTRATION_FULL: "Lista jest pełna — brak wolnych miejsc.",
  REGISTRATION_NAME_INVALID: "Podaj nick: 1–60 znaków w jednej linii.",
  REGISTRATION_TOKEN_INVALID: "Odśwież stronę i wyślij formularz ponownie.",
  REGISTRATION_DUPLICATE_NAME: "Ten nick jest już na liście albo czeka na akceptację. Wybierz inny.",
  REGISTRATION_NOT_FOUND: "Nie ma takiego zgłoszenia w tym turnieju.",
  REGISTRATION_ALREADY_DECIDED: "To zgłoszenie zostało już rozpatrzone.",
  INVALID_FIELD_VALUES: "Sprawdź odpowiedzi w formularzu.",
};

export class RegistrationError extends Error {
  readonly status: number;
  constructor(readonly code: RegistrationErrorCode, readonly problems?: ParticipantFieldProblem[]) {
    super(MESSAGES[code]);
    this.status = STATUS[code];
  }
}

const sameName = (a: string, b: string) => a.trim().toLocaleLowerCase("pl") === b.trim().toLocaleLowerCase("pl");

async function lockTournament(tx: Tx, tournamentId: number): Promise<TournamentRow> {
  const [tournament] = await tx.select().from(tournamentsTable).where(eq(tournamentsTable.id, tournamentId)).for("update");
  if (!tournament) throw new RegistrationError("REGISTRATION_NOT_FOUND");
  return tournament;
}

async function counts(tx: Tx | typeof db, tournamentId: number) {
  const [{ players }] = await tx.select({ players: count() }).from(playersTable).where(eq(playersTable.tournamentId, tournamentId));
  const [{ pending }] = await tx.select({ pending: count() }).from(tournamentRegistrationsTable)
    .where(and(eq(tournamentRegistrationsTable.tournamentId, tournamentId), eq(tournamentRegistrationsTable.status, "pending")));
  return { players: Number(players), pending: Number(pending) };
}

/** Public state of the sign-up page, as the backend will actually treat a new sign-up. */
export function registrationState(tournament: TournamentRow, settings: RegistrationSettings): "disabled" | "hidden" | "started" | "closed" | "open" {
  if (!settings.enabled) return "disabled";
  if ((tournament.visibility ?? "public_online") === "private_offline") return "hidden";
  if (tournament.status !== "draft") return "started";
  return settings.open ? "open" : "closed";
}

/** What the public page shows: tournament basics, status, free places and the organizer's questions. */
export async function getPublicRegistration(tournament: TournamentRow) {
  const settings = registrationSettingsFromStorage(tournament.registrationSettings);
  const state = registrationState(tournament, settings);
  const fieldSet = signupFieldSet(participantFieldsFromStorage(tournament.participantFields));
  const places = registrationPlaces(settings, tournament.maxPlayers, await counts(db, tournament.id));
  return {
    tournament: { id: tournament.id, name: tournament.name, format: tournament.format, status: tournament.status },
    registration: {
      state: state === "open" && places.remaining === 0 ? "full" as const : state,
      approval: settings.approval,
      note: state === "disabled" ? null : settings.note,
      limit: Number.isFinite(places.limit) ? places.limit : null,
      remaining: Number.isFinite(places.limit) ? places.remaining : null,
    },
    fields: state === "disabled" ? [] : (fieldSet?.fields ?? []).map(publicSignupField),
  };
}

export interface SubmitRegistrationResult {
  registration: { id: number; name: string; status: "pending" | "approved" };
  /** true when the same form was already received (resent after a network error). */
  repeated: boolean;
}

export async function submitRegistration(input: {
  tournamentId: number;
  name: unknown;
  customFields: unknown;
  clientToken: unknown;
}): Promise<SubmitRegistrationResult> {
  if (!isValidClientToken(input.clientToken)) throw new RegistrationError("REGISTRATION_TOKEN_INVALID");
  const name = cleanRegistrationName(input.name);
  if (!name) throw new RegistrationError("REGISTRATION_NAME_INVALID");
  const clientToken = input.clientToken;
  return db.transaction(async (tx) => {
    const tournament = await lockTournament(tx, input.tournamentId);
    // A resent form gets the original answer, whatever happened since.
    const [existing] = await tx.select().from(tournamentRegistrationsTable).where(and(
      eq(tournamentRegistrationsTable.tournamentId, tournament.id),
      eq(tournamentRegistrationsTable.clientToken, clientToken),
    ));
    if (existing) {
      return { registration: { id: existing.id, name: existing.name, status: existing.status === "approved" ? "approved" : "pending" }, repeated: true };
    }
    const settings = registrationSettingsFromStorage(tournament.registrationSettings);
    const state = registrationState(tournament, settings);
    if (state === "disabled") throw new RegistrationError("REGISTRATION_DISABLED");
    if (state === "hidden") throw new RegistrationError("REGISTRATION_HIDDEN");
    if (state === "started") throw new RegistrationError("REGISTRATION_STARTED");
    if (state === "closed") throw new RegistrationError("REGISTRATION_CLOSED");

    const players = await tx.select({ name: playersTable.name }).from(playersTable).where(eq(playersTable.tournamentId, tournament.id));
    const waiting = await tx.select({ name: tournamentRegistrationsTable.name }).from(tournamentRegistrationsTable).where(and(
      eq(tournamentRegistrationsTable.tournamentId, tournament.id),
      eq(tournamentRegistrationsTable.status, "pending"),
    ));
    if ([...players, ...waiting].some((row) => sameName(row.name, name))) throw new RegistrationError("REGISTRATION_DUPLICATE_NAME");
    const places = registrationPlaces(settings, tournament.maxPlayers, { players: players.length, pending: waiting.length });
    if (places.remaining <= 0) throw new RegistrationError("REGISTRATION_FULL");

    const fullSet = participantFieldsFromStorage(tournament.participantFields);
    const asked = validateFieldValues(signupFieldSet(fullSet), input.customFields, { audience: "organizer", enforceRequired: true, applyDefaults: false });
    if (!asked.ok) throw new RegistrationError("INVALID_FIELD_VALUES", asked.problems);

    const [row] = await tx.insert(tournamentRegistrationsTable).values({
      tournamentId: tournament.id, name, customFields: asked.values, clientToken, status: "pending",
    }).returning();

    if (settings.approval === "auto") {
      // Straight onto the list — unless the organizer requires a field the form does not ask; then it waits.
      const complete = validateFieldValues(fullSet, asked.values ?? {}, { audience: "organizer", enforceRequired: true, applyDefaults: true });
      if (complete.ok) {
        const player = await insertRosterPlayerInTransaction(tx, tournament, { name }, complete.values, `Dodano gracza z zapisów: ${name}`);
        await tx.update(tournamentRegistrationsTable)
          .set({ status: "approved", playerId: player.id, decidedAt: new Date(), decidedBy: "Automatycznie", updatedAt: new Date() })
          .where(eq(tournamentRegistrationsTable.id, row.id));
        return { registration: { id: row.id, name, status: "approved" }, repeated: false };
      }
    }
    return { registration: { id: row.id, name, status: "pending" }, repeated: false };
  });
}

function view(row: TournamentRegistration, fieldSet: ReturnType<typeof participantFieldsFromStorage>, audience: ParticipantFieldAudience, playerIds: Set<number>) {
  const answers = visibleFieldValues(fieldSet, row.customFields, audience);
  const stored = (row.customFields ?? {}) as Record<string, unknown>;
  const missing = row.status === "pending"
    ? (fieldSet?.fields ?? []).filter((field) => field.required && (stored[field.key] === undefined || stored[field.key] === null) && field.defaultValue === undefined)
      .map((field) => ({ key: field.key, label: field.label }))
    : [];
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    answers,
    missing,
    playerId: row.playerId,
    onList: row.playerId != null && playerIds.has(row.playerId),
    decidedAt: row.decidedAt,
    decidedBy: row.decidedBy,
    createdAt: row.createdAt,
  };
}

/** The organizer's (or permitted support's) list: answers filtered by who is looking. */
export async function listRegistrations(tournament: TournamentRow, audience: ParticipantFieldAudience) {
  const settings = registrationSettingsFromStorage(tournament.registrationSettings);
  const fieldSet = participantFieldsFromStorage(tournament.participantFields);
  const rows = await db.select().from(tournamentRegistrationsTable)
    .where(eq(tournamentRegistrationsTable.tournamentId, tournament.id))
    .orderBy(asc(tournamentRegistrationsTable.createdAt), asc(tournamentRegistrationsTable.id));
  const linked = rows.map((row) => row.playerId).filter((id): id is number => id != null);
  const present = linked.length
    ? new Set((await db.select({ id: playersTable.id }).from(playersTable).where(inArray(playersTable.id, linked))).map((row) => row.id))
    : new Set<number>();
  const taken = await counts(db, tournament.id);
  const places = registrationPlaces(settings, tournament.maxPlayers, taken);
  return {
    settings,
    state: registrationState(tournament, settings),
    places: { limit: Number.isFinite(places.limit) ? places.limit : null, used: places.used, remaining: Number.isFinite(places.limit) ? places.remaining : null },
    counts: {
      pending: rows.filter((row) => row.status === "pending").length,
      approved: rows.filter((row) => row.status === "approved").length,
      rejected: rows.filter((row) => row.status === "rejected").length,
      players: taken.players,
    },
    questions: (signupFieldSet(fieldSet)?.fields ?? []).map((field) => ({ key: field.key, label: field.label, required: field.required })),
    registrations: rows.map((row) => view(row, fieldSet, audience, present)),
  };
}

export async function approveRegistration(input: {
  tournamentId: number;
  registrationId: number;
  /** Answers the organizer fills in (e.g. a required field added after the sign-up). */
  customFields?: unknown;
  audience: ParticipantFieldAudience;
  actor?: TournamentMutationActor;
  actorNick: string;
}) {
  return db.transaction(async (tx) => {
    const tournament = await lockDraftTournamentForRoster(tx, input.tournamentId, input.actor);
    const [row] = await tx.select().from(tournamentRegistrationsTable).where(and(
      eq(tournamentRegistrationsTable.id, input.registrationId),
      eq(tournamentRegistrationsTable.tournamentId, tournament.id),
    )).for("update");
    if (!row) throw new RegistrationError("REGISTRATION_NOT_FOUND");
    if (row.status !== "pending") throw new RegistrationError("REGISTRATION_ALREADY_DECIDED");
    const fieldSet = participantFieldsFromStorage(tournament.participantFields);
    const checked = validateFieldValues(fieldSet, input.customFields ?? {}, {
      stored: row.customFields, audience: input.audience, enforceRequired: true, applyDefaults: true,
    });
    if (!checked.ok) throw new RegistrationError("INVALID_FIELD_VALUES", checked.problems);
    const player = await insertRosterPlayerInTransaction(tx, tournament, { name: row.name }, checked.values, `Dodano gracza z zapisów: ${row.name}`);
    const [updated] = await tx.update(tournamentRegistrationsTable)
      .set({ status: "approved", playerId: player.id, customFields: checked.values, decidedAt: new Date(), decidedBy: input.actorNick, updatedAt: new Date() })
      .where(eq(tournamentRegistrationsTable.id, row.id))
      .returning();
    return { registration: updated, player };
  });
}

export async function rejectRegistration(input: { tournamentId: number; registrationId: number; actor?: TournamentMutationActor; actorNick: string }) {
  return db.transaction(async (tx) => {
    const tournament = await lockTournament(tx, input.tournamentId);
    await revalidateTournamentMutationActor(tx, tournament, input.actor);
    const [row] = await tx.select().from(tournamentRegistrationsTable).where(and(
      eq(tournamentRegistrationsTable.id, input.registrationId),
      eq(tournamentRegistrationsTable.tournamentId, tournament.id),
    )).for("update");
    if (!row) throw new RegistrationError("REGISTRATION_NOT_FOUND");
    if (row.status !== "pending") throw new RegistrationError("REGISTRATION_ALREADY_DECIDED");
    const [updated] = await tx.update(tournamentRegistrationsTable)
      .set({ status: "rejected", decidedAt: new Date(), decidedBy: input.actorNick, updatedAt: new Date() })
      .where(eq(tournamentRegistrationsTable.id, row.id))
      .returning();
    return updated;
  });
}

export async function saveRegistrationSettings(input: { tournamentId: number; settings: unknown; actor?: TournamentMutationActor }) {
  const next = parseRegistrationSettings(input.settings);
  return db.transaction(async (tx) => {
    const tournament = await lockTournament(tx, input.tournamentId);
    await revalidateTournamentMutationActor(tx, tournament, input.actor);
    const before = registrationSettingsFromStorage(tournament.registrationSettings);
    await tx.update(tournamentsTable).set({ registrationSettings: next }).where(eq(tournamentsTable.id, tournament.id));
    return { before, after: next };
  });
}

/** Plain-language audit lines for a settings change. */
export function describeSettingsChange(before: RegistrationSettings, after: RegistrationSettings): string[] {
  const lines: string[] = [];
  if (before.enabled !== after.enabled) lines.push(after.enabled ? "Włączył zapisy" : "Wyłączył zapisy");
  if (after.enabled && before.open !== after.open) lines.push(after.open ? "Otworzył zapisy" : "Zamknął zapisy");
  if (before.approval !== after.approval) lines.push(after.approval === "auto" ? "Zapisy: akceptacja automatyczna" : "Zapisy: akceptacja ręczna");
  if (before.capacity !== after.capacity) lines.push(after.capacity == null ? "Zapisy: bez limitu miejsc" : `Zapisy: limit ${after.capacity} miejsc`);
  if (before.note !== after.note) lines.push("Zapisy: zmienił notatkę");
  return lines;
}
