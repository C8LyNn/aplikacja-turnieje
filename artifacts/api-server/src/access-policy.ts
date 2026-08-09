import type { Request, Response } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, supportSessionsTable, tournamentsTable } from "@workspace/db";
import { verifyOrganizerToken, verifyViewerToken } from "./auth";
import { logger } from "./lib/logger";

export type TournamentActor =
  | { type: "anonymous" }
  | { type: "viewer" }
  | { type: "support"; nick: string; sessionId: number }
  | { type: "organizer" };

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
  if (!actor || actor.type === "organizer") return;
  const [session] = await tx
    .select({
      passwordVersion: supportSessionsTable.passwordVersion,
    })
    .from(supportSessionsTable)
    .where(
      and(
        eq(supportSessionsTable.id, actor.sessionId),
        eq(supportSessionsTable.tournamentId, tournament.id),
      ),
    )
    .for("update");
  if (
    !session ||
    session.passwordVersion !== tournament.supportPasswordVersion
  ) {
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

async function resolveActor(
  req: Request,
  tournament: typeof tournamentsTable.$inferSelect,
): Promise<ResolvedTournamentActor> {
  const organizerToken = header(req, "x-organizer-token");
  if (hasValidOrganizerToken(organizerToken, tournament)) {
    return { type: "organizer" };
  }

  const supportToken = header(req, "x-support-token");
  if (supportToken) {
    const [session] = await db
      .select({
        id: supportSessionsTable.id,
        nick: supportSessionsTable.nick,
        passwordVersion: supportSessionsTable.passwordVersion,
      })
      .from(supportSessionsTable)
      .where(
        and(
          eq(supportSessionsTable.tournamentId, tournament.id),
          eq(supportSessionsTable.sessionToken, supportToken),
        ),
      );

    if (session && session.passwordVersion === tournament.supportPasswordVersion) {
      return {
        type: "support",
        nick: session.nick,
        sessionId: session.id,
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
