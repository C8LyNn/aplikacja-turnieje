/**
 * #331 · the organizer's support people: personal access codes and per-action permissions. Owner-only — a support
 * person can never list, create, change or revoke support access (no self-escalation, no delegation of this).
 */
import { randomInt } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { and, asc, count, eq, isNull } from "drizzle-orm";
import { db, supportSessionsTable, tournamentSupportMembersTable } from "@workspace/db";
import { requireOrganizer } from "../access-policy";
import { hashPassword } from "../auth";
import {
  normalizeSupportPermissions,
  SUPPORT_PERMISSION_LABELS,
  SUPPORT_PERMISSIONS,
  SUPPORT_PRESETS,
  SupportPermissionInputError,
} from "../application/auth/support-permissions";
import { logAuditAction } from "./auth";

const router: IRouter = Router();
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I

/** 12 random characters (≈60 bits), shown once as XXXX-XXXX-XXXX. */
function newAccessCode(): string {
  const chars = Array.from({ length: 12 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars.slice(8).join("")}`;
}

function ids(req: Request): { tournamentId: number; memberId: number | null } | null {
  const tournamentId = Number(req.params.id);
  const memberId = req.params.memberId === undefined ? null : Number(req.params.memberId);
  if (!Number.isSafeInteger(tournamentId) || tournamentId <= 0) return null;
  if (memberId !== null && (!Number.isSafeInteger(memberId) || memberId <= 0)) return null;
  return { tournamentId, memberId };
}

function cleanName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  return name.length >= 1 && name.length <= 60 ? name : null;
}

function permissionsFrom(body: Record<string, unknown>) {
  if (typeof body.preset === "string" && body.permissions === undefined) {
    const preset = SUPPORT_PRESETS[body.preset];
    if (!preset) throw new SupportPermissionInputError("Nieznany zestaw uprawnień.");
    return [...preset.permissions];
  }
  return normalizeSupportPermissions(body.permissions);
}

type MemberRow = typeof tournamentSupportMembersTable.$inferSelect;
function view(member: MemberRow, activeSessions = 0) {
  return {
    id: member.id,
    name: member.name,
    permissions: member.permissions,
    permissionsVersion: member.permissionsVersion,
    revokedAt: member.revokedAt,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
    activeSessions,
  };
}

function sendInputError(res: Response, error: unknown): boolean {
  if (error instanceof SupportPermissionInputError) {
    res.status(422).json({ error: error.message, code: error.code });
    return true;
  }
  return false;
}

router.get("/tournaments/:id/support-members", async (req, res): Promise<void> => {
  const parsed = ids(req);
  if (!parsed) { res.status(400).json({ error: "Nieprawidłowy turniej." }); return; }
  if (!await requireOrganizer(req, res, parsed.tournamentId)) return;
  res.setHeader("Cache-Control", "no-store");
  const members = await db.select().from(tournamentSupportMembersTable)
    .where(eq(tournamentSupportMembersTable.tournamentId, parsed.tournamentId))
    .orderBy(asc(tournamentSupportMembersTable.createdAt), asc(tournamentSupportMembersTable.id));
  const sessions = await db.select({ memberId: supportSessionsTable.memberId, n: count() }).from(supportSessionsTable)
    .where(eq(supportSessionsTable.tournamentId, parsed.tournamentId))
    .groupBy(supportSessionsTable.memberId);
  const byMember = new Map(sessions.filter((row) => row.memberId != null).map((row) => [row.memberId!, Number(row.n)]));
  res.json({
    members: members.map((member) => view(member, member.revokedAt ? 0 : byMember.get(member.id) ?? 0)),
    catalog: SUPPORT_PERMISSIONS.map((key) => ({ key, label: SUPPORT_PERMISSION_LABELS[key] })),
    presets: Object.entries(SUPPORT_PRESETS).map(([key, preset]) => ({ key, label: preset.label, permissions: preset.permissions })),
  });
});

router.post("/tournaments/:id/support-members", async (req, res): Promise<void> => {
  const parsed = ids(req);
  if (!parsed) { res.status(400).json({ error: "Nieprawidłowy turniej." }); return; }
  if (!await requireOrganizer(req, res, parsed.tournamentId)) return;
  const body = (req.body ?? {}) as Record<string, unknown>;
  const name = cleanName(body.name);
  if (!name) { res.status(422).json({ error: "Podaj imię lub nick osoby (1–60 znaków).", code: "SUPPORT_MEMBER_NAME_INVALID" }); return; }
  let permissions;
  try { permissions = permissionsFrom(body); } catch (error) { if (sendInputError(res, error)) return; throw error; }
  const accessCode = newAccessCode();
  const [member] = await db.insert(tournamentSupportMembersTable).values({
    tournamentId: parsed.tournamentId,
    name,
    accessCodeHash: await hashPassword(accessCode),
    permissions,
  }).returning();
  await logAuditAction(parsed.tournamentId, "organizer", "Organizator", `Dodał osobę wspierającą „${name}” (${permissions.length} uprawnień)`);
  res.setHeader("Cache-Control", "no-store");
  // The code is returned exactly once; only its hash is stored.
  res.status(201).json({ member: view(member), accessCode });
});

router.patch("/tournaments/:id/support-members/:memberId", async (req, res): Promise<void> => {
  const parsed = ids(req);
  if (!parsed?.memberId) { res.status(400).json({ error: "Nieprawidłowa osoba wspierająca." }); return; }
  if (!await requireOrganizer(req, res, parsed.tournamentId)) return;
  const body = (req.body ?? {}) as Record<string, unknown>;
  const patch: Partial<MemberRow> = {};
  if (body.name !== undefined) {
    const name = cleanName(body.name);
    if (!name) { res.status(422).json({ error: "Podaj imię lub nick osoby (1–60 znaków).", code: "SUPPORT_MEMBER_NAME_INVALID" }); return; }
    patch.name = name;
  }
  if (body.permissions !== undefined || body.preset !== undefined) {
    try { patch.permissions = permissionsFrom(body); } catch (error) { if (sendInputError(res, error)) return; throw error; }
  }
  if (!Object.keys(patch).length) { res.status(422).json({ error: "Brak zmian.", code: "SUPPORT_MEMBER_NO_CHANGES" }); return; }
  const updated = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(tournamentSupportMembersTable)
      .where(and(eq(tournamentSupportMembersTable.id, parsed.memberId!), eq(tournamentSupportMembersTable.tournamentId, parsed.tournamentId)))
      .for("update");
    if (!current) return { status: 404 as const };
    if (current.revokedAt) return { status: 409 as const };
    const [row] = await tx.update(tournamentSupportMembersTable)
      .set({ ...patch, permissionsVersion: current.permissionsVersion + 1, updatedAt: new Date() })
      .where(eq(tournamentSupportMembersTable.id, current.id))
      .returning();
    return { status: 200 as const, row, before: current };
  });
  if (updated.status === 404) { res.status(404).json({ error: "Nie ma takiej osoby wspierającej w tym turnieju.", code: "SUPPORT_MEMBER_NOT_FOUND" }); return; }
  if (updated.status === 409) { res.status(409).json({ error: "Dostęp tej osoby został odebrany. Dodaj ją ponownie.", code: "SUPPORT_MEMBER_REVOKED" }); return; }
  const added = updated.row.permissions.filter((p) => !updated.before.permissions.includes(p));
  const removed = updated.before.permissions.filter((p) => !updated.row.permissions.includes(p));
  await logAuditAction(parsed.tournamentId, "organizer", "Organizator",
    `Zmienił uprawnienia „${updated.row.name}”${added.length ? ` · nadał: ${added.join(", ")}` : ""}${removed.length ? ` · odebrał: ${removed.join(", ")}` : ""}`);
  res.json({ member: view(updated.row) });
});

router.post("/tournaments/:id/support-members/:memberId/revoke", async (req, res): Promise<void> => {
  const parsed = ids(req);
  if (!parsed?.memberId) { res.status(400).json({ error: "Nieprawidłowa osoba wspierająca." }); return; }
  if (!await requireOrganizer(req, res, parsed.tournamentId)) return;
  const result = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(tournamentSupportMembersTable)
      .where(and(eq(tournamentSupportMembersTable.id, parsed.memberId!), eq(tournamentSupportMembersTable.tournamentId, parsed.tournamentId)))
      .for("update");
    if (!current) return null;
    if (current.revokedAt) return current;
    const [row] = await tx.update(tournamentSupportMembersTable)
      .set({ revokedAt: new Date(), updatedAt: new Date(), permissionsVersion: current.permissionsVersion + 1 })
      .where(and(eq(tournamentSupportMembersTable.id, current.id), isNull(tournamentSupportMembersTable.revokedAt)))
      .returning();
    // Open sessions end now; the next request of that person is anonymous.
    await tx.delete(supportSessionsTable).where(eq(supportSessionsTable.memberId, current.id));
    return row ?? current;
  });
  if (!result) { res.status(404).json({ error: "Nie ma takiej osoby wspierającej w tym turnieju.", code: "SUPPORT_MEMBER_NOT_FOUND" }); return; }
  await logAuditAction(parsed.tournamentId, "organizer", "Organizator", `Odebrał dostęp osobie wspierającej „${result.name}”`);
  res.json({ member: view(result) });
});

export default router;
