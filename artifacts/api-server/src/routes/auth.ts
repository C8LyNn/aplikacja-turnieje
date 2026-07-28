import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, tournamentsTable, supportSessionsTable, authAuditLogTable } from "@workspace/db";
import { hashPassword, verifyPassword, signVersionedOrganizerToken, verifyOrganizerToken, generateSessionToken, signViewerToken, verifyViewerToken } from "../auth";
import {
  requireOrganizer as requireOrganizerAccess,
  requireTournamentWrite,
} from "../access-policy";
import {
  AUTH_DUMMY_PASSWORD_HASH,
  CredentialRateLimitError,
  executeCredentialAttempt,
  fingerprintCredentialSource,
  InvalidCredentialError,
  NEW_CREDENTIAL_MIN_LENGTH,
} from "../application/auth/credential-rate-limit";
import { buildOrganizerCredentialBootstrapState } from "../application/auth/legacy-organizer-credential-state";
import { upgradeLegacyOrganizerCredentialsRateLimited } from "../application/auth/legacy-organizer-credentials";
import { logger } from "../lib/logger";
import { parsePositiveSafeIntegerRouteParam } from "../http/route-params";
import { getRequestSource } from "../http/request-source";

const router: IRouter = Router();

function parseId(req: Request, res: Response): number | null {
  const id = parsePositiveSafeIntegerRouteParam(req.params.id);
  if (id === null) {
    res.status(400).json({
      error: "Identyfikator turnieju musi być dodatnią liczbą całkowitą.",
      code: "INVALID_TOURNAMENT_ID",
    });
  }
  return id;
}

function credentialSourceFingerprint(req: Request): string {
  return fingerprintCredentialSource(getRequestSource(req));
}

function sendCredentialError(res: Response, error: unknown): boolean {
  if (error instanceof CredentialRateLimitError) {
    res
      .status(429)
      .set("Retry-After", String(error.retryAfterSeconds))
      .json({ error: error.message, code: error.code });
    return true;
  }
  if (error instanceof InvalidCredentialError) {
    res.status(403).json({ error: error.message, code: error.code });
    return true;
  }
  return false;
}

function extractOrganizerToken(req: Request): string {
  return (req.headers["x-organizer-token"] as string) ?? "";
}

function extractSupportToken(req: Request): string {
  return (req.headers["x-support-token"] as string) ?? "";
}

async function requireSupportOrOrganizer(
  req: Request,
  res: Response,
  tournamentId: number,
): Promise<{ actorType: "organizer" | "support"; actorNick: string } | null> {
  const access = await requireTournamentWrite(req, res, tournamentId);
  if (!access) return null;
  if (access.actor.type === "organizer") {
    return { actorType: "organizer", actorNick: "Organizator" };
  }
  return access.actor.type === "support"
    ? { actorType: "support", actorNick: access.actor.nick }
    : null;
}

export { requireSupportOrOrganizer, extractOrganizerToken, extractSupportToken, verifyOrganizerToken };

export async function logAuditAction(tournamentId: number, actorType: "organizer" | "support", actorNick: string, action: string) {
  try {
    await db.insert(authAuditLogTable).values({ tournamentId, actorType, actorNick, action });
    return true;
  } catch (error) {
    logger.warn(
      { err: error, tournamentId, actorType, action },
      "Could not persist authentication audit entry",
    );
    return false;
  }
}

router.get("/tournaments/:id/auth/credential-state", async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const [tournament] = await db
    .select({
      hostCode: tournamentsTable.hostCode,
      organizerPasswordHash: tournamentsTable.organizerPasswordHash,
      visibility: tournamentsTable.visibility,
    })
    .from(tournamentsTable)
    .where(eq(tournamentsTable.id, id));

  if (!tournament) {
    res.json({ exists: false, accessMode: null, private: false });
    return;
  }
  res.json(buildOrganizerCredentialBootstrapState(tournament));
});

router.post("/tournaments/:id/auth/organizer-login", async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const { password } = req.body as { password?: string };
  if (typeof password !== "string" || password.length === 0) {
    res.status(400).json({ error: "Hasło jest wymagane" });
    return;
  }

  try {
    const organizerPasswordHash = await executeCredentialAttempt<string>({
      tournamentId: id,
      credentialType: "organizer",
      sourceFingerprint: credentialSourceFingerprint(req),
      verify: async (tx) => {
        const [tournament] = await tx
          .select({
            organizerPasswordHash: tournamentsTable.organizerPasswordHash,
          })
          .from(tournamentsTable)
          .where(eq(tournamentsTable.id, id));
        const storedHash =
          tournament?.organizerPasswordHash ?? AUTH_DUMMY_PASSWORD_HASH;
        const valid = await verifyPassword(password, storedHash);
        return valid && tournament?.organizerPasswordHash
          ? ({ ok: true, value: tournament.organizerPasswordHash } as const)
          : ({ ok: false } as const);
      },
    });
    const token = signVersionedOrganizerToken(id, organizerPasswordHash);
    await logAuditAction(
      id,
      "organizer",
      "Organizator",
      "Zalogował się jako organizator",
    );
    res.json({ token });
  } catch (error) {
    if (sendCredentialError(res, error)) return;
    throw error;
  }
});

router.post("/tournaments/:id/auth/upgrade-legacy-organizer", async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const { hostCode, organizerPassword } = req.body as {
    hostCode?: string;
    organizerPassword?: string;
  };
  if (typeof hostCode !== "string" || hostCode.length === 0) {
    res.status(400).json({ error: "Kod prowadzącego jest wymagany" });
    return;
  }
  if (
    typeof organizerPassword !== "string" ||
    organizerPassword.length < NEW_CREDENTIAL_MIN_LENGTH
  ) {
    res.status(422).json({
      error: `Nowe hasło organizatora musi mieć co najmniej ${NEW_CREDENTIAL_MIN_LENGTH} znaków`,
      code: "ORGANIZER_PASSWORD_TOO_SHORT",
    });
    return;
  }
  try {
    const tournament = await upgradeLegacyOrganizerCredentialsRateLimited({
      tournamentId: id,
      hostCode,
      organizerPassword,
      requestSourceFingerprint: credentialSourceFingerprint(req),
    });
    if (!tournament.organizerPasswordHash) {
      throw new Error("Legacy organizer credential upgrade did not persist.");
    }
    const token = signVersionedOrganizerToken(
      tournament.id,
      tournament.organizerPasswordHash,
    );
    await logAuditAction(
      id,
      "organizer",
      "Organizator",
      "Zaktualizował historyczny kod prowadzącego do hasła organizatora",
    );
    res.json({ token });
  } catch (error) {
    if (sendCredentialError(res, error)) return;
    throw error;
  }
});

router.post("/tournaments/:id/auth/support-login", async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const { password, nick } = req.body as { password?: string; nick?: string };
  if (
    typeof password !== "string" ||
    password.length === 0 ||
    typeof nick !== "string" ||
    !nick.trim()
  ) {
    res.status(400).json({ error: "Hasło i nick są wymagane" });
    return;
  }

  try {
    const session = await executeCredentialAttempt<{
      sessionToken: string;
      nick: string;
    }>({
      tournamentId: id,
      credentialType: "support",
      sourceFingerprint: credentialSourceFingerprint(req),
      verify: async (tx) => {
        const [tournament] = await tx
          .select({
            supportPasswordHash: tournamentsTable.supportPasswordHash,
            supportPasswordVersion: tournamentsTable.supportPasswordVersion,
          })
          .from(tournamentsTable)
          .where(eq(tournamentsTable.id, id));
        const storedHash =
          tournament?.supportPasswordHash ?? AUTH_DUMMY_PASSWORD_HASH;
        if (!(await verifyPassword(password, storedHash)) || !tournament?.supportPasswordHash) {
          return { ok: false } as const;
        }
        const sessionToken = generateSessionToken();
        await tx.insert(supportSessionsTable).values({
          tournamentId: id,
          nick: nick.trim(),
          sessionToken,
          passwordVersion: tournament.supportPasswordVersion,
          lastActiveAt: new Date(),
          createdAt: new Date(),
        });
        return {
          ok: true,
          value: { sessionToken, nick: nick.trim() },
        } as const;
      },
    });
    await logAuditAction(
      id,
      "support",
      session.nick,
      "Zalogował się jako wsparcie",
    );
    res.json(session);
  } catch (error) {
    if (sendCredentialError(res, error)) return;
    throw error;
  }
});

router.get("/tournaments/:id/auth/support-sessions", async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const actor = await requireOrganizerAccess(req, res, id);
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
  const id = parseId(req, res);
  if (id === null) return;
  const actor = await requireOrganizerAccess(req, res, id);
  if (!actor) return;

  const { newPassword } = req.body as { newPassword?: string };
  if (
    typeof newPassword !== "string" ||
    newPassword.length < NEW_CREDENTIAL_MIN_LENGTH
  ) {
    res.status(400).json({
      error: `Nowe hasło musi mieć co najmniej ${NEW_CREDENTIAL_MIN_LENGTH} znaków`,
    });
    return;
  }

  const newHash = await hashPassword(newPassword);
  await db.transaction(async (tx) => {
    const [t] = await tx
      .select({ supportPasswordVersion: tournamentsTable.supportPasswordVersion })
      .from(tournamentsTable)
      .where(eq(tournamentsTable.id, id))
      .for("update");
    if (!t) throw new Error("Tournament disappeared during support password rotation");
    await tx
      .update(tournamentsTable)
      .set({
        supportPasswordHash: newHash,
        supportPasswordVersion: t.supportPasswordVersion + 1,
      })
      .where(eq(tournamentsTable.id, id));
  });

  await logAuditAction(id, "organizer", "Organizator", "Zmienił hasło wsparcia — poprzednie sesje wsparcia zostały unieważnione");
  res.json({ ok: true, invalidatedSessions: true });
});

router.post("/tournaments/:id/auth/viewer-login", async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const { password } = req.body as { password?: string };
  if (typeof password !== "string" || password.length === 0) {
    res.status(400).json({ error: "Hasło jest wymagane" });
    return;
  }
  try {
    const passwordVersion = await executeCredentialAttempt<number>({
      tournamentId: id,
      credentialType: "viewer",
      sourceFingerprint: credentialSourceFingerprint(req),
      verify: async (tx) => {
        const [tournament] = await tx
          .select({
            viewerPasswordHash: tournamentsTable.viewerPasswordHash,
            viewerPasswordVersion: tournamentsTable.viewerPasswordVersion,
            visibility: tournamentsTable.visibility,
          })
          .from(tournamentsTable)
          .where(eq(tournamentsTable.id, id));
        const storedHash =
          tournament?.viewerPasswordHash ?? AUTH_DUMMY_PASSWORD_HASH;
        const valid = await verifyPassword(password, storedHash);
        return valid &&
          tournament?.viewerPasswordHash &&
          tournament.visibility === "private_online"
          ? ({ ok: true, value: tournament.viewerPasswordVersion } as const)
          : ({ ok: false } as const);
      },
    });
    res.json({ token: signViewerToken(id, passwordVersion) });
  } catch (error) {
    if (sendCredentialError(res, error)) return;
    throw error;
  }
});

router.post("/tournaments/:id/auth/change-viewer-password", async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const actor = await requireOrganizerAccess(req, res, id);
  if (!actor) return;

  const { newPassword } = req.body as { newPassword?: string };
  if (
    typeof newPassword !== "string" ||
    newPassword.length < NEW_CREDENTIAL_MIN_LENGTH
  ) {
    res.status(400).json({
      error: `Nowe hasło musi mieć co najmniej ${NEW_CREDENTIAL_MIN_LENGTH} znaków`,
    });
    return;
  }

  const newHash = await hashPassword(newPassword);
  await db.transaction(async (tx) => {
    const [t] = await tx
      .select({ viewerPasswordVersion: tournamentsTable.viewerPasswordVersion })
      .from(tournamentsTable)
      .where(eq(tournamentsTable.id, id))
      .for("update");
    if (!t) throw new Error("Tournament disappeared during viewer password rotation");
    await tx
      .update(tournamentsTable)
      .set({
        viewerPasswordHash: newHash,
        viewerPasswordVersion: t.viewerPasswordVersion + 1,
      })
      .where(eq(tournamentsTable.id, id));
  });

  await logAuditAction(id, "organizer", "Organizator", "Zmienił hasło widza");
  res.json({ ok: true });
});

router.post("/tournaments/:id/auth/change-visibility", async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const actor = await requireOrganizerAccess(req, res, id);
  if (!actor) return;

  const { visibility, viewerPassword } = req.body as { visibility?: string; viewerPassword?: string };
  const allowed = ["public_online", "private_online", "private_offline"];
  if (!visibility || !allowed.includes(visibility)) {
    res.status(400).json({ error: "Nieprawidłowy tryb widoczności" }); return;
  }
  if (
    visibility === "private_online" &&
    (typeof viewerPassword !== "string" ||
      viewerPassword.length < NEW_CREDENTIAL_MIN_LENGTH)
  ) {
    res.status(422).json({
      error: `Hasło widza jest wymagane dla trybu prywatny online i musi mieć co najmniej ${NEW_CREDENTIAL_MIN_LENGTH} znaków`,
      code: "VIEWER_PASSWORD_REQUIRED",
    });
    return;
  }

  const updateValues: Record<string, unknown> = { visibility };
  if (viewerPassword) {
    updateValues.viewerPasswordHash = await hashPassword(viewerPassword);
  }
  if (visibility !== "private_online") {
    updateValues.viewerPasswordHash = null;
  }

  await db.transaction(async (tx) => {
    const [tournament] = await tx
      .select({ viewerPasswordVersion: tournamentsTable.viewerPasswordVersion })
      .from(tournamentsTable)
      .where(eq(tournamentsTable.id, id))
      .for("update");
    if (!tournament) throw new Error("Tournament disappeared during visibility change");
    await tx
      .update(tournamentsTable)
      .set({
        ...updateValues,
        viewerPasswordVersion: tournament.viewerPasswordVersion + 1,
      } as any)
      .where(eq(tournamentsTable.id, id));
  });
  await logAuditAction(id, "organizer", "Organizator", `Zmienił widoczność turnieju na: ${visibility}`);
  res.json({ ok: true });
});

router.delete("/tournaments/:id/auth/viewer-password", async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const actor = await requireOrganizerAccess(req, res, id);
  if (!actor) return;

  let privateOnline = false;
  await db.transaction(async (tx) => {
    const [tournament] = await tx
      .select({
        viewerPasswordVersion: tournamentsTable.viewerPasswordVersion,
        visibility: tournamentsTable.visibility,
      })
      .from(tournamentsTable)
      .where(eq(tournamentsTable.id, id))
      .for("update");
    if (!tournament) throw new Error("Tournament disappeared during viewer password removal");
    if (tournament.visibility === "private_online") {
      privateOnline = true;
      return;
    }
    await tx.update(tournamentsTable).set({
      viewerPasswordHash: null,
      viewerPasswordVersion: tournament.viewerPasswordVersion + 1,
    }).where(eq(tournamentsTable.id, id));
  });
  if (privateOnline) {
    res.status(409).json({
      error: "Najpierw zmień widoczność turnieju. Prywatny turniej online musi mieć hasło widza.",
      code: "VIEWER_PASSWORD_REQUIRED",
    });
    return;
  }
  await logAuditAction(id, "organizer", "Organizator", "Usunął hasło widza");
  res.json({ ok: true });
});

export { verifyViewerToken };

router.get("/tournaments/:id/audit-log", async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const actor = await requireOrganizerAccess(req, res, id);
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
