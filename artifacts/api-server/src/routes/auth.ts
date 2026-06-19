import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, tournamentsTable, supportSessionsTable, authAuditLogTable } from "@workspace/db";
import { hashPassword, verifyPassword, signOrganizerToken, verifyOrganizerToken, generateSessionToken } from "../auth";

const router: IRouter = Router();

function parseId(raw: unknown): number {
  const val = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(val as string, 10);
}

function extractOrganizerToken(req: Request): string {
  return (req.headers["x-organizer-token"] as string) ?? "";
}

function extractSupportToken(req: Request): string {
  return (req.headers["x-support-token"] as string) ?? "";
}

async function requireOrganizer(req: Request, res: Response, tournamentId: number): Promise<{ nick: string } | null> {
  const token = extractOrganizerToken(req);
  if (!token || !verifyOrganizerToken(token, tournamentId)) {
    res.status(403).json({ error: "Wymagane uwierzytelnienie organizatora" });
    return null;
  }
  return { nick: "Organizator" };
}

async function requireSupportOrOrganizer(
  req: Request,
  res: Response,
  tournamentId: number,
): Promise<{ actorType: "organizer" | "support"; actorNick: string } | null> {
  const orgToken = extractOrganizerToken(req);
  if (orgToken && verifyOrganizerToken(orgToken, tournamentId)) {
    return { actorType: "organizer", actorNick: "Organizator" };
  }

  const supToken = extractSupportToken(req);
  if (!supToken) {
    res.status(403).json({ error: "Wymagane uwierzytelnienie" });
    return null;
  }

  const [t] = await db
    .select({ supportPasswordVersion: tournamentsTable.supportPasswordVersion })
    .from(tournamentsTable)
    .where(eq(tournamentsTable.id, tournamentId));
  if (!t) { res.status(404).json({ error: "Turniej nie istnieje" }); return null; }

  const [session] = await db
    .select()
    .from(supportSessionsTable)
    .where(
      and(
        eq(supportSessionsTable.tournamentId, tournamentId),
        eq(supportSessionsTable.sessionToken, supToken),
        eq(supportSessionsTable.passwordVersion, t.supportPasswordVersion),
      ),
    );

  if (!session) {
    res.status(403).json({ error: "Sesja wsparcia wygasła lub nieważna" });
    return null;
  }

  await db
    .update(supportSessionsTable)
    .set({ lastActiveAt: new Date() })
    .where(eq(supportSessionsTable.id, session.id));

  return { actorType: "support", actorNick: session.nick };
}

export { requireSupportOrOrganizer, extractOrganizerToken, extractSupportToken, verifyOrganizerToken };

export async function logAuditAction(tournamentId: number, actorType: "organizer" | "support", actorNick: string, action: string) {
  await db.insert(authAuditLogTable).values({ tournamentId, actorType, actorNick, action });
}

router.post("/tournaments/:id/auth/organizer-login", async (req, res) => {
  const id = parseId(req.params.id);
  const { password } = req.body as { password?: string };
  if (!password) { res.status(400).json({ error: "Hasło jest wymagane" }); return; }

  const [t] = await db
    .select({ organizerPasswordHash: tournamentsTable.organizerPasswordHash })
    .from(tournamentsTable)
    .where(eq(tournamentsTable.id, id));

  if (!t) { res.status(404).json({ error: "Turniej nie istnieje" }); return; }
  if (!t.organizerPasswordHash) { res.status(400).json({ error: "Ten turniej nie ma hasła organizatora" }); return; }

  const valid = await verifyPassword(password, t.organizerPasswordHash);
  if (!valid) { res.status(403).json({ error: "Nieprawidłowe hasło" }); return; }

  const token = signOrganizerToken(id);
  await logAuditAction(id, "organizer", "Organizator", "Zalogował się jako organizator");
  res.json({ token });
});

router.post("/tournaments/:id/auth/support-login", async (req, res) => {
  const id = parseId(req.params.id);
  const { password, nick } = req.body as { password?: string; nick?: string };
  if (!password || !nick?.trim()) { res.status(400).json({ error: "Hasło i nick są wymagane" }); return; }

  const [t] = await db
    .select({ supportPasswordHash: tournamentsTable.supportPasswordHash, supportPasswordVersion: tournamentsTable.supportPasswordVersion })
    .from(tournamentsTable)
    .where(eq(tournamentsTable.id, id));

  if (!t) { res.status(404).json({ error: "Turniej nie istnieje" }); return; }
  if (!t.supportPasswordHash) { res.status(400).json({ error: "Ten turniej nie ma hasła wsparcia" }); return; }

  const valid = await verifyPassword(password, t.supportPasswordHash);
  if (!valid) { res.status(403).json({ error: "Nieprawidłowe hasło wsparcia" }); return; }

  const sessionToken = generateSessionToken();
  await db.insert(supportSessionsTable).values({
    tournamentId: id,
    nick: nick.trim(),
    sessionToken,
    passwordVersion: t.supportPasswordVersion,
    lastActiveAt: new Date(),
    createdAt: new Date(),
  });

  await logAuditAction(id, "support", nick.trim(), "Zalogował się jako wsparcie");
  res.json({ sessionToken, nick: nick.trim() });
});

router.get("/tournaments/:id/auth/support-sessions", async (req, res) => {
  const id = parseId(req.params.id);
  const actor = await requireOrganizer(req, res, id);
  if (!actor) return;

  const [t] = await db
    .select({ supportPasswordVersion: tournamentsTable.supportPasswordVersion })
    .from(tournamentsTable)
    .where(eq(tournamentsTable.id, id));
  if (!t) { res.status(404).json({ error: "Turniej nie istnieje" }); return; }

  const sessions = await db
    .select({
      id: supportSessionsTable.id,
      nick: supportSessionsTable.nick,
      lastActiveAt: supportSessionsTable.lastActiveAt,
      createdAt: supportSessionsTable.createdAt,
    })
    .from(supportSessionsTable)
    .where(
      and(
        eq(supportSessionsTable.tournamentId, id),
        eq(supportSessionsTable.passwordVersion, t.supportPasswordVersion),
      ),
    )
    .orderBy(desc(supportSessionsTable.lastActiveAt));

  res.json(sessions.map((s) => ({
    ...s,
    lastActiveAt: s.lastActiveAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
  })));
});

router.post("/tournaments/:id/auth/change-support-password", async (req, res) => {
  const id = parseId(req.params.id);
  const actor = await requireOrganizer(req, res, id);
  if (!actor) return;

  const { newPassword } = req.body as { newPassword?: string };
  if (!newPassword || newPassword.length < 4) { res.status(400).json({ error: "Nowe hasło musi mieć co najmniej 4 znaki" }); return; }

  const [t] = await db
    .select({ supportPasswordVersion: tournamentsTable.supportPasswordVersion })
    .from(tournamentsTable)
    .where(eq(tournamentsTable.id, id));
  if (!t) { res.status(404).json({ error: "Turniej nie istnieje" }); return; }

  const newHash = await hashPassword(newPassword);
  const newVersion = (t.supportPasswordVersion ?? 1) + 1;

  await db
    .update(tournamentsTable)
    .set({ supportPasswordHash: newHash, supportPasswordVersion: newVersion })
    .where(eq(tournamentsTable.id, id));

  await logAuditAction(id, "organizer", "Organizator", "Zmienił hasło wsparcia — poprzednie sesje wsparcia zostały unieważnione");
  res.json({ ok: true, invalidatedSessions: true });
});

router.get("/tournaments/:id/audit-log", async (req, res) => {
  const id = parseId(req.params.id);
  const actor = await requireOrganizer(req, res, id);
  if (!actor) return;

  const logs = await db
    .select()
    .from(authAuditLogTable)
    .where(eq(authAuditLogTable.tournamentId, id))
    .orderBy(desc(authAuditLogTable.createdAt))
    .limit(200);

  res.json(logs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })));
});

export default router;
