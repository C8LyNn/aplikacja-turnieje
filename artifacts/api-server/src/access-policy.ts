import type { Request, Response } from "express";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { db, supportSessionsTable, tournamentSupportMembersTable, tournamentsTable } from "@workspace/db";
import { hashSessionToken, organizerCredentialFingerprint, verifyOrganizerToken, verifyViewerToken } from "./auth";
import { logger } from "./lib/logger";
import { isSupportPermission, LEGACY_SUPPORT_PERMISSIONS, SUPPORT_PERMISSION_LABELS, type SupportPermission } from "./application/auth/support-permissions";

export type TournamentActor =
  | { type: "anonymous" }
  | { type: "viewer" }
  | {
    type: "support";
    nick: string;
    sessionId: number;
    /** #331: the personal-code member, or null for a shared-support-password session. */
    memberId: number | null;
    /** #331: what this session may do right now (read fresh from the database on every request). */
    permissions: readonly SupportPermission[];
    /** #331: set by requireTournamentPermission; re-checked inside the mutation lock. */
    requiredPermissions?: readonly SupportPermission[];
  }
  | { type: "organizer"; credentialFingerprint: string };

export interface TournamentAccess {
  actor: TournamentActor;
  tournament: typeof tournamentsTable.$inferSelect;
}

type ResolvedTournamentActor = TournamentActor;

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type TournamentMutationActor =
  | Extract<TournamentActor, { type: "organizer" }>
  | Extract<TournamentActor, { type: "support" }>;

export class TournamentMutationAuthorizationError extends Error {
  readonly code = "SUPPORT_SESSION_EXPIRED";

  constructor() {
    super("Sesja wsparcia wygasła. Zaloguj się ponownie.");
    this.name = "TournamentMutationAuthorizationError";
  }
}

export function getTournamentMutationActor(
  access: TournamentAccess,
): TournamentMutationActor {
  if (access.actor.type !== "organizer" && access.actor.type !== "support") {
    throw new TournamentMutationAuthorizationError();
  }
  return access.actor;
}

export async function revalidateTournamentMutationActor(
  tx: DbTransaction,
  tournament: typeof tournamentsTable.$inferSelect,
  actor?: TournamentMutationActor,
): Promise<void> {
  if (!actor) return;
  if (actor.type === "organizer") {
    // The actor contains only the credential version verified before waiting.
    // Compare against the fresh row while the caller holds its mutation lock.
    if (
      actor.credentialFingerprint !== organizerCredentialFingerprint(
        tournament.id,
        tournament.organizerPasswordHash,
      )
    ) {
      throw new TournamentMutationAuthorizationError();
    }
    return;
  }
  const [session] = await tx
    .select({
      passwordVersion: supportSessionsTable.passwordVersion,
      memberId: supportSessionsTable.memberId,
    })
    .from(supportSessionsTable)
    .where(
      and(
        eq(supportSessionsTable.id, actor.sessionId),
        eq(supportSessionsTable.tournamentId, tournament.id),
      ),
    )
    .for("update");
  if (!session) throw new TournamentMutationAuthorizationError();
  if (session.memberId == null) {
    if (session.passwordVersion !== tournament.supportPasswordVersion) throw new TournamentMutationAuthorizationError();
    return;
  }
  // #331: a revoked person or a permission taken away while the request waited stops the mutation here.
  const [member] = await tx
    .select({ permissions: tournamentSupportMembersTable.permissions, revokedAt: tournamentSupportMembersTable.revokedAt })
    .from(tournamentSupportMembersTable)
    .where(and(eq(tournamentSupportMembersTable.id, session.memberId), eq(tournamentSupportMembersTable.tournamentId, tournament.id)))
    .for("update");
  if (!member || member.revokedAt) throw new TournamentMutationAuthorizationError();
  if ((actor.requiredPermissions ?? []).some((permission) => !member.permissions.includes(permission))) {
    throw new TournamentMutationAuthorizationError();
  }
}

export async function withTournamentMutationLock<T>(
  tournamentId: number,
  actor: TournamentMutationActor,
  operation: (
    tx: DbTransaction,
    tournament: typeof tournamentsTable.$inferSelect,
  ) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    const [tournament] = await tx
      .select()
      .from(tournamentsTable)
      .where(eq(tournamentsTable.id, tournamentId))
      .for("update");
    if (!tournament) {
      throw new TournamentMutationAuthorizationError();
    }
    await revalidateTournamentMutationActor(tx, tournament, actor);
    return operation(tx, tournament);
  });
}

function header(req: Request, name: string): string {
  const value = req.headers[name];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function hasValidOrganizerToken(
  token: string,
  tournament: typeof tournamentsTable.$inferSelect,
): boolean {
  if (!token) return false;
  try {
    return verifyOrganizerToken(
      token,
      tournament.id,
      tournament.organizerPasswordHash,
    );
  } catch {
    return false;
  }
}

async function touchSupportSession(
  sessionId: number,
): Promise<void> {
  try {
    await db
      .update(supportSessionsTable)
      .set({ lastActiveAt: new Date() })
      .where(
        and(
          eq(supportSessionsTable.id, sessionId),
          sql`${supportSessionsTable.lastActiveAt} < CURRENT_TIMESTAMP - INTERVAL '60 seconds'`,
        ),
      );
  } catch (error) {
    logger.warn({ err: error, supportSessionId: sessionId }, "Could not update support session activity");
  }
}

/** RC-4: replaces a legacy clear token (written by an older API) with its hash. Never logs the token. */
async function convertLegacySupportSession(sessionId: number, tokenHash: string): Promise<void> {
  try {
    await db
      .update(supportSessionsTable)
      .set({ sessionTokenHash: tokenHash, sessionToken: null })
      .where(and(eq(supportSessionsTable.id, sessionId), isNull(supportSessionsTable.sessionTokenHash)));
  } catch (error) {
    logger.warn({ supportSessionId: sessionId, code: (error as { code?: string }).code }, "Could not convert a legacy support session token");
  }
}

async function resolveActor(
  req: Request,
  tournament: typeof tournamentsTable.$inferSelect,
): Promise<ResolvedTournamentActor> {
  const organizerToken = header(req, "x-organizer-token");
  if (hasValidOrganizerToken(organizerToken, tournament)) {
    return {
      type: "organizer",
      credentialFingerprint: organizerCredentialFingerprint(
        tournament.id,
        tournament.organizerPasswordHash,
      ),
    };
  }

  const supportToken = header(req, "x-support-token");
  if (supportToken) {
    // RC-4: sessions are found by the SHA-256 of the token; the token itself is not in the database. A row with a
    // clear token can only come from an older API (rollback) and is accepted once, then converted to a hash.
    const tokenHash = hashSessionToken(supportToken);
    const [session] = await db
      .select({
        id: supportSessionsTable.id,
        nick: supportSessionsTable.nick,
        passwordVersion: supportSessionsTable.passwordVersion,
        memberId: supportSessionsTable.memberId,
        storedHash: supportSessionsTable.sessionTokenHash,
        memberName: tournamentSupportMembersTable.name,
        memberPermissions: tournamentSupportMembersTable.permissions,
        memberRevokedAt: tournamentSupportMembersTable.revokedAt,
      })
      .from(supportSessionsTable)
      .leftJoin(tournamentSupportMembersTable, and(
        eq(tournamentSupportMembersTable.id, supportSessionsTable.memberId),
        eq(tournamentSupportMembersTable.tournamentId, tournament.id),
      ))
      .where(
        and(
          eq(supportSessionsTable.tournamentId, tournament.id),
          or(
            eq(supportSessionsTable.sessionTokenHash, tokenHash),
            and(isNull(supportSessionsTable.sessionTokenHash), eq(supportSessionsTable.sessionToken, supportToken)),
          ),
        ),
      )
      .limit(1);
    if (session && session.storedHash == null) await convertLegacySupportSession(session.id, tokenHash);

    if (session && session.memberId == null && session.passwordVersion === tournament.supportPasswordVersion) {
      return { type: "support", nick: session.nick, sessionId: session.id, memberId: null, permissions: LEGACY_SUPPORT_PERMISSIONS };
    }
    // #331: a personal-code session lives exactly as long as its person is not revoked; its permissions are
    // the person's current ones, so a change by the organizer applies to the next request.
    if (session && session.memberId != null && session.memberName != null && !session.memberRevokedAt) {
      return {
        type: "support",
        nick: session.memberName,
        sessionId: session.id,
        memberId: session.memberId,
        permissions: (session.memberPermissions ?? []).filter(isSupportPermission),
      };
    }
  }

  const viewerToken = header(req, "x-viewer-token");
  if (
    viewerToken &&
    verifyViewerToken(
      viewerToken,
      tournament.id,
      tournament.viewerPasswordVersion,
    )
  ) {
    return { type: "viewer" };
  }

  return { type: "anonymous" };
}

async function authorizeResolvedActor(
  actor: ResolvedTournamentActor,
): Promise<TournamentActor> {
  if (actor.type !== "support") return actor;
  await touchSupportSession(actor.sessionId);
  return actor;
}

async function loadTournament(
  res: Response,
  tournamentId: number,
): Promise<typeof tournamentsTable.$inferSelect | null> {
  const [tournament] = await db
    .select()
    .from(tournamentsTable)
    .where(eq(tournamentsTable.id, tournamentId));

  if (!tournament) {
    res.status(404).json({ error: "Turniej nie istnieje" });
    return null;
  }

  return tournament;
}

export async function requireTournamentRead(
  req: Request,
  res: Response,
  tournamentId: number,
): Promise<TournamentAccess | null> {
  const tournament = await loadTournament(res, tournamentId);
  if (!tournament) return null;

  const actor = await resolveActor(req, tournament);
  const visibility = tournament.visibility ?? "public_online";

  if (visibility === "public_online") {
    return { actor: await authorizeResolvedActor(actor), tournament };
  }

  if (actor.type === "organizer" || actor.type === "support") {
    return { actor: await authorizeResolvedActor(actor), tournament };
  }

  if (visibility === "private_online" && actor.type === "viewer") {
    return { actor: await authorizeResolvedActor(actor), tournament };
  }

  if (visibility === "private_offline") {
    res.status(403).json({
      error: "Ten turniej jest prywatny. Wymagane logowanie jako organizator lub wsparcie.",
      code: "PRIVATE_OFFLINE",
    });
    return null;
  }

  res.status(403).json({
    error: "Ten turniej wymaga hasła widza.",
    code: "VIEWER_PASSWORD_REQUIRED",
  });
  return null;
}

export async function requireTournamentWrite(
  req: Request,
  res: Response,
  tournamentId: number,
): Promise<TournamentAccess | null> {
  const tournament = await loadTournament(res, tournamentId);
  if (!tournament) return null;

  const actor = await resolveActor(req, tournament);
  if (actor.type === "organizer" || actor.type === "support") {
    return { actor: await authorizeResolvedActor(actor), tournament };
  }

  res.status(403).json({ error: "Wymagany token organizatora lub wsparcia" });
  return null;
}

/**
 * #331 · an operation the organizer may delegate: the organizer always passes, a support session only with every
 * listed permission (read fresh on this request), everyone else is refused.
 */
export async function requireTournamentPermission(
  req: Request,
  res: Response,
  tournamentId: number,
  required: SupportPermission | readonly SupportPermission[],
): Promise<TournamentAccess | null> {
  const tournament = await loadTournament(res, tournamentId);
  if (!tournament) return null;
  const permissions = (Array.isArray(required) ? required : [required]) as readonly SupportPermission[];
  const actor = await resolveActor(req, tournament);
  if (actor.type === "organizer") return { actor: await authorizeResolvedActor(actor), tournament };
  if (actor.type === "support") {
    const missing = permissions.filter((permission) => !actor.permissions.includes(permission));
    if (missing.length === 0) {
      return { actor: await authorizeResolvedActor({ ...actor, requiredPermissions: permissions }), tournament };
    }
    res.status(403).json({
      error: `Brak uprawnienia: ${missing.map((permission) => SUPPORT_PERMISSION_LABELS[permission]).join(", ")}. Poproś organizatora o jego nadanie.`,
      code: "SUPPORT_PERMISSION_REQUIRED",
      permissions: missing,
    });
    return null;
  }
  res.status(403).json({ error: "Wymagany token organizatora lub wsparcia" });
  return null;
}

export async function requireOrganizer(
  req: Request,
  res: Response,
  tournamentId: number,
): Promise<TournamentAccess | null> {
  const tournament = await loadTournament(res, tournamentId);
  if (!tournament) return null;

  const actor = await resolveActor(req, tournament);
  if (actor.type === "organizer") {
    return { actor: await authorizeResolvedActor(actor), tournament };
  }

  res.status(403).json({ error: "Wymagane uwierzytelnienie organizatora" });
  return null;
}
