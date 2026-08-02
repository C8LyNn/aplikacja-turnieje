import type { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { db, supportSessionsTable, tournamentsTable } from "@workspace/db";
import { verifyOrganizerToken, verifyViewerToken } from "./auth";

export type TournamentActor =
  | { type: "anonymous" }
  | { type: "viewer" }
  | { type: "support"; nick: string }
  | { type: "organizer" };

export interface TournamentAccess {
  actor: TournamentActor;
  tournament: typeof tournamentsTable.$inferSelect;
}

function header(req: Request, name: string): string {
  const value = req.headers[name];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function hasValidOrganizerToken(token: string, tournamentId: number): boolean {
  if (!token) return false;
  try {
    return verifyOrganizerToken(token, tournamentId);
  } catch {
    return false;
  }
}

async function resolveActor(
  req: Request,
  tournament: typeof tournamentsTable.$inferSelect,
): Promise<TournamentActor> {
  const organizerToken = header(req, "x-organizer-token");
  if (hasValidOrganizerToken(organizerToken, tournament.id)) {
    return { type: "organizer" };
  }

  const supportToken = header(req, "x-support-token");
  if (supportToken) {
    const [session] = await db
      .select({
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
      return { type: "support", nick: session.nick };
    }
  }

  const viewerToken = header(req, "x-viewer-token");
  if (viewerToken && verifyViewerToken(viewerToken, tournament.id)) {
    return { type: "viewer" };
  }

  return { type: "anonymous" };
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
    return { actor, tournament };
  }

  if (actor.type === "organizer" || actor.type === "support") {
    return { actor, tournament };
  }

  if (visibility === "private_online" && actor.type === "viewer") {
    return { actor, tournament };
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
    return { actor, tournament };
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
    return { actor, tournament };
  }

  res.status(403).json({ error: "Wymagane uwierzytelnienie organizatora" });
  return null;
}
