/**
 * #329 · optional public sign-ups.
 *   Public (whoever may read the tournament): GET  /tournaments/:id/registration, POST /tournaments/:id/registrations
 *   Organizer only:                            PUT  /tournaments/:id/registration-settings
 *   Organizer or support with "participants.manage":
 *                                              GET  /tournaments/:id/registrations
 *                                              POST /tournaments/:id/registrations/:registrationId/approve|reject
 * The public side can only add a sign-up to an open draft tournament; it can never change the roster, results or settings.
 */
import { Router, type IRouter, type Request, type Response } from "express";
import {
  getTournamentMutationActor,
  requireOrganizer,
  requireTournamentPermission,
  requireTournamentRead,
} from "../access-policy";
import { fingerprintCredentialSource } from "../application/auth/credential-rate-limit";
import { getRequestSource } from "../http/request-source";
import {
  approveRegistration,
  describeSettingsChange,
  getPublicRegistration,
  listRegistrations,
  RegistrationError,
  rejectRegistration,
  saveRegistrationSettings,
  submitRegistration,
} from "../application/players/tournament-registrations";
import { TournamentRosterError } from "../application/players/tournament-roster";
import { ParticipantFieldsError } from "../application/players/participant-fields-service";
import { RegistrationInputError } from "../domain/tournament/registration";
import { logAuditAction } from "./auth";

const router: IRouter = Router();

/** Sign-up attempts per source and per tournament in a sliding window (in-process; one API instance). */
export const REGISTRATION_RATE_LIMIT = Object.freeze({ windowMs: 10 * 60 * 1000, perSource: 6, perTournament: 120 });
const attempts = new Map<string, number[]>();
function rateLimited(key: string, limit: number, now: number): boolean {
  const recent = (attempts.get(key) ?? []).filter((time) => now - time < REGISTRATION_RATE_LIMIT.windowMs);
  if (recent.length >= limit) { attempts.set(key, recent); return true; }
  recent.push(now);
  attempts.set(key, recent);
  if (attempts.size > 10_000) {
    for (const [entry, times] of attempts) if (!times.some((time) => now - time < REGISTRATION_RATE_LIMIT.windowMs)) attempts.delete(entry);
  }
  return false;
}
/** Test hook: forget all counted attempts. */
export function resetRegistrationRateLimit() { attempts.clear(); }

function ids(req: Request): { tournamentId: number; registrationId: number | null } | null {
  const tournamentId = Number(req.params.id);
  const registrationId = req.params.registrationId === undefined ? null : Number(req.params.registrationId);
  if (!Number.isSafeInteger(tournamentId) || tournamentId <= 0) return null;
  if (registrationId !== null && (!Number.isSafeInteger(registrationId) || registrationId <= 0)) return null;
  return { tournamentId, registrationId };
}

function sendError(res: Response, error: unknown): boolean {
  if (error instanceof RegistrationError) {
    res.status(error.status).json({ error: error.message, code: error.code, ...(error.problems ? { problems: error.problems } : {}) });
    return true;
  }
  if (error instanceof RegistrationInputError) {
    res.status(422).json({ error: error.message, code: error.code });
    return true;
  }
  if (error instanceof TournamentRosterError) {
    const status = error.code === "TOURNAMENT_NOT_FOUND" || error.code === "PLAYER_NOT_FOUND" ? 404 : 409;
    res.status(status).json({ error: error.message, code: error.code });
    return true;
  }
  if (error instanceof ParticipantFieldsError) {
    res.status(422).json({ error: "Sprawdź odpowiedzi w formularzu.", code: error.code, ...(error.details ?? {}) });
    return true;
  }
  return false;
}

const actorNick = (actor: { type: string; nick?: string }) => actor.type === "support" ? actor.nick ?? "Wsparcie" : "Organizator";
const audienceOf = (actor: { type: string }) => actor.type === "organizer" ? "organizer" as const : actor.type === "support" ? "staff" as const : "public" as const;

router.get("/tournaments/:id/registration", async (req, res): Promise<void> => {
  const parsed = ids(req);
  if (!parsed) { res.status(400).json({ error: "Nieprawidłowy turniej." }); return; }
  const access = await requireTournamentRead(req, res, parsed.tournamentId);
  if (!access) return;
  res.setHeader("Cache-Control", "no-store");
  res.json(await getPublicRegistration(access.tournament));
});

router.post("/tournaments/:id/registrations", async (req, res): Promise<void> => {
  const parsed = ids(req);
  if (!parsed) { res.status(400).json({ error: "Nieprawidłowy turniej." }); return; }
  const access = await requireTournamentRead(req, res, parsed.tournamentId);
  if (!access) return;
  const now = Date.now();
  const source = fingerprintCredentialSource(getRequestSource(req));
  if (rateLimited(`s:${parsed.tournamentId}:${source}`, REGISTRATION_RATE_LIMIT.perSource, now)
    || rateLimited(`t:${parsed.tournamentId}`, REGISTRATION_RATE_LIMIT.perTournament, now)) {
    res.setHeader("Retry-After", String(Math.ceil(REGISTRATION_RATE_LIMIT.windowMs / 1000)));
    res.status(429).json({ error: "Za dużo zgłoszeń w krótkim czasie. Spróbuj ponownie za kilka minut.", code: "REGISTRATION_RATE_LIMITED" });
    return;
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  try {
    const result = await submitRegistration({
      tournamentId: parsed.tournamentId, name: body.name, customFields: body.customFields, clientToken: body.clientToken,
    });
    res.setHeader("Cache-Control", "no-store");
    res.status(result.repeated ? 200 : 201).json({
      ...result,
      message: result.registration.status === "approved"
        ? "Zapis przyjęty — jesteś na liście uczestników."
        : "Zgłoszenie wysłane — czeka na akceptację organizatora.",
    });
  } catch (error) {
    if (sendError(res, error)) return;
    throw error;
  }
});

router.put("/tournaments/:id/registration-settings", async (req, res): Promise<void> => {
  const parsed = ids(req);
  if (!parsed) { res.status(400).json({ error: "Nieprawidłowy turniej." }); return; }
  const access = await requireOrganizer(req, res, parsed.tournamentId);
  if (!access) return;
  try {
    const { before, after } = await saveRegistrationSettings({
      tournamentId: parsed.tournamentId, settings: req.body, actor: getTournamentMutationActor(access),
    });
    for (const line of describeSettingsChange(before, after)) await logAuditAction(parsed.tournamentId, "organizer", "Organizator", line);
    res.json({ settings: after });
  } catch (error) {
    if (sendError(res, error)) return;
    throw error;
  }
});

router.get("/tournaments/:id/registrations", async (req, res): Promise<void> => {
  const parsed = ids(req);
  if (!parsed) { res.status(400).json({ error: "Nieprawidłowy turniej." }); return; }
  const access = await requireTournamentPermission(req, res, parsed.tournamentId, "participants.manage");
  if (!access) return;
  res.setHeader("Cache-Control", "no-store");
  res.json(await listRegistrations(access.tournament, audienceOf(access.actor)));
});

router.post("/tournaments/:id/registrations/:registrationId/approve", async (req, res): Promise<void> => {
  const parsed = ids(req);
  if (!parsed?.registrationId) { res.status(400).json({ error: "Nieprawidłowe zgłoszenie." }); return; }
  const access = await requireTournamentPermission(req, res, parsed.tournamentId, "participants.manage");
  if (!access) return;
  const body = (req.body ?? {}) as Record<string, unknown>;
  try {
    const nick = actorNick(access.actor as { type: string; nick?: string });
    const result = await approveRegistration({
      tournamentId: parsed.tournamentId,
      registrationId: parsed.registrationId,
      customFields: body.customFields,
      audience: audienceOf(access.actor),
      actor: getTournamentMutationActor(access),
      actorNick: nick,
    });
    await logAuditAction(parsed.tournamentId, access.actor.type === "support" ? "support" : "organizer", nick, `Zatwierdził zgłoszenie „${result.registration.name}” — dodany do listy uczestników`);
    res.json({ registration: { id: result.registration.id, status: result.registration.status, playerId: result.player.id }, player: { id: result.player.id, name: result.player.name } });
  } catch (error) {
    if (sendError(res, error)) return;
    throw error;
  }
});

router.post("/tournaments/:id/registrations/:registrationId/reject", async (req, res): Promise<void> => {
  const parsed = ids(req);
  if (!parsed?.registrationId) { res.status(400).json({ error: "Nieprawidłowe zgłoszenie." }); return; }
  const access = await requireTournamentPermission(req, res, parsed.tournamentId, "participants.manage");
  if (!access) return;
  try {
    const nick = actorNick(access.actor as { type: string; nick?: string });
    const row = await rejectRegistration({
      tournamentId: parsed.tournamentId, registrationId: parsed.registrationId, actor: getTournamentMutationActor(access), actorNick: nick,
    });
    await logAuditAction(parsed.tournamentId, access.actor.type === "support" ? "support" : "organizer", nick, `Odrzucił zgłoszenie „${row.name}”`);
    res.json({ registration: { id: row.id, status: row.status } });
  } catch (error) {
    if (sendError(res, error)) return;
    throw error;
  }
});

export default router;
