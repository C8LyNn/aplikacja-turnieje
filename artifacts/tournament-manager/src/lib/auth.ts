import { serverError, t } from "@/i18n";
import {
  getOrganizerCredentialState,
  upgradeLegacyOrganizer,
  type OrganizerCredentialState,
} from "@workspace/api-client-react";

export type Role = "organizer" | "support" | "fan";

const ROLE_KEY = "tm_role";
const ORG_TOKEN_KEY = (id: number) => `tm_org_${id}`;
const SUP_TOKEN_KEY = (id: number) => `tm_sup_${id}`;
const SUP_NICK_KEY = (id: number) => `tm_sup_nick_${id}`;
// Lightweight cross-tab flag: "this browser has organizer or support access for this tournament".
// Stored in localStorage so new tabs can also show the back-to-organizer link.
// The flag does NOT store credentials — the panel itself is still auth-protected.
const MGMT_FLAG_KEY = (id: number) => `tm_mgmt_${id}`;

export function getMgmtFlag(tournamentId: number): boolean {
  try { return !!localStorage.getItem(MGMT_FLAG_KEY(tournamentId)); } catch { return false; }
}
function setMgmtFlag(tournamentId: number): void {
  try { localStorage.setItem(MGMT_FLAG_KEY(tournamentId), "1"); } catch {}
}
function clearMgmtFlag(tournamentId: number): void {
  try { localStorage.removeItem(MGMT_FLAG_KEY(tournamentId)); } catch {}
}

export function getStoredRole(): Role | null {
  try {
    const value = localStorage.getItem(ROLE_KEY);
    return value === "organizer" || value === "support" || value === "fan"
      ? value
      : null;
  } catch {
    return null;
  }
}

export function setStoredRole(role: Role): void {
  try {
    localStorage.setItem(ROLE_KEY, role);
  } catch {}
}

export function clearStoredRole(): void {
  try {
    localStorage.removeItem(ROLE_KEY);
  } catch {}
}

export function getOrganizerToken(tournamentId: number): string | null {
  try {
    return sessionStorage.getItem(ORG_TOKEN_KEY(tournamentId));
  } catch {
    return null;
  }
}

export function setOrganizerToken(tournamentId: number, token: string): void {
  try {
    sessionStorage.setItem(ORG_TOKEN_KEY(tournamentId), token);
    setMgmtFlag(tournamentId);
  } catch {}
}

export function clearOrganizerToken(tournamentId: number): void {
  try {
    sessionStorage.removeItem(ORG_TOKEN_KEY(tournamentId));
    clearMgmtFlag(tournamentId);
  } catch {}
}

export function getSupportSession(tournamentId: number): { token: string; nick: string } | null {
  try {
    const token = sessionStorage.getItem(SUP_TOKEN_KEY(tournamentId));
    const nick = sessionStorage.getItem(SUP_NICK_KEY(tournamentId));
    if (!token || !nick) return null;
    return { token, nick };
  } catch {
    return null;
  }
}

export function setSupportSession(tournamentId: number, token: string, nick: string): void {
  try {
    sessionStorage.setItem(SUP_TOKEN_KEY(tournamentId), token);
    sessionStorage.setItem(SUP_NICK_KEY(tournamentId), nick);
    setMgmtFlag(tournamentId);
  } catch {}
}

export function clearSupportSession(tournamentId: number): void {
  try {
    sessionStorage.removeItem(SUP_TOKEN_KEY(tournamentId));
    sessionStorage.removeItem(SUP_NICK_KEY(tournamentId));
    // Clear the flag only if there's also no organizer token remaining.
    if (!getOrganizerToken(tournamentId)) clearMgmtFlag(tournamentId);
  } catch {}
}

const VIEWER_TOKEN_KEY = (id: number) => `tm_viewer_${id}`;

export function getViewerToken(tournamentId: number): string | null {
  try {
    return sessionStorage.getItem(VIEWER_TOKEN_KEY(tournamentId));
  } catch {
    return null;
  }
}

export function setViewerToken(tournamentId: number, token: string): void {
  try {
    sessionStorage.setItem(VIEWER_TOKEN_KEY(tournamentId), token);
  } catch {}
}

export function clearViewerToken(tournamentId: number): void {
  try {
    sessionStorage.removeItem(VIEWER_TOKEN_KEY(tournamentId));
  } catch {}
}

const BASE = (import.meta.env?.BASE_URL ?? "/").replace(/\/$/, "");

export async function apiOrganizerCredentialState(
  tournamentId: number,
): Promise<OrganizerCredentialState> {
  return getOrganizerCredentialState(tournamentId);
}

export async function apiOrganizerLogin(tournamentId: number, password: string): Promise<string> {
  const res = await fetch(`${BASE}/api/tournaments/${tournamentId}/auth/organizer-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(serverError(err) || t("auth.blad_logowania"));
  }
  const data = await res.json();
  return data.token as string;
}

export async function apiUpgradeLegacyOrganizer(
  tournamentId: number,
  hostCode: string,
  organizerPassword: string,
): Promise<string> {
  const result = await upgradeLegacyOrganizer(tournamentId, {
    hostCode,
    organizerPassword,
  });
  return result.token;
}

export async function apiSetInitialOrganizerPassword(
  tournamentId: number,
  organizerToken: string,
  newPassword: string,
): Promise<string> {
  const res = await fetch(`${BASE}/api/tournaments/${tournamentId}/auth/set-organizer-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Organizer-Token": organizerToken,
    },
    body: JSON.stringify({ newPassword }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string; code?: string };
    const error = new Error(serverError(body) || t("auth.blad_ustawiania_hasla_organizatora")) as Error & {
      code?: string;
      status?: number;
    };
    error.code = body.code;
    error.status = res.status;
    throw error;
  }
  const body = await res.json() as { token: string };
  return body.token;
}

export async function apiSupportLogin(tournamentId: number, password: string, nick: string): Promise<{ sessionToken: string; nick: string; memberId?: number | null }> {
  const res = await fetch(`${BASE}/api/tournaments/${tournamentId}/auth/support-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, nick }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(serverError(err) || t("auth.blad_logowania"));
  }
  return res.json();
}

export interface VerifiedSupportSession {
  nick?: string;
  /** #331: the personal-code member, or null for the shared support password. */
  memberId?: number | null;
  /** #331: what this session may do right now (read fresh by the server). */
  permissions?: string[];
}

export async function apiVerifySupportSession(tournamentId: number, token: string): Promise<VerifiedSupportSession> {
  const res = await fetch(`${BASE}/api/tournaments/${tournamentId}/auth/support-session`, {
    headers: { "X-Support-Token": token },
  });
  if (!res.ok) {
    const error = new Error(t("auth.sesja_wsparcia_jest_niewazna")) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }
  return await res.json().catch(() => ({})) as VerifiedSupportSession;
}

/** Read-only organizer check via an existing organizer-only GET; throws with the HTTP status. */
export async function apiVerifyOrganizerToken(tournamentId: number, token: string): Promise<void> {
  const res = await fetch(`${BASE}/api/tournaments/${tournamentId}/auth/support-sessions`, {
    headers: { "X-Organizer-Token": token },
  });
  if (!res.ok) {
    const error = new Error(t("auth.sesja_organizatora_jest_niewazna")) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }
}

export async function apiGetSupportSessions(tournamentId: number, token: string) {
  const res = await fetch(`${BASE}/api/tournaments/${tournamentId}/auth/support-sessions`, {
    headers: { "X-Organizer-Token": token },
  });
  if (!res.ok) throw new Error(t("auth.blad_pobierania_sesji"));
  return res.json();
}

export async function apiChangeSupportPassword(tournamentId: number, token: string, newPassword: string) {
  const res = await fetch(`${BASE}/api/tournaments/${tournamentId}/auth/change-support-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Organizer-Token": token },
    body: JSON.stringify({ newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(serverError(err) || t("auth.blad_zmiany_hasla"));
  }
  return res.json();
}

export async function apiViewerLogin(tournamentId: number, password: string): Promise<string> {
  const res = await fetch(`${BASE}/api/tournaments/${tournamentId}/auth/viewer-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(serverError(err) || t("auth.blad_logowania_widza"));
  }
  const data = await res.json();
  return data.token as string;
}

export async function apiChangeViewerPassword(tournamentId: number, orgToken: string, newPassword: string) {
  const res = await fetch(`${BASE}/api/tournaments/${tournamentId}/auth/change-viewer-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Organizer-Token": orgToken },
    body: JSON.stringify({ newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(serverError(err) || t("auth.blad_zmiany_hasla_widza"));
  }
  return res.json();
}

export async function apiChangeVisibility(
  tournamentId: number,
  orgToken: string,
  visibility: "public_online" | "private_online" | "private_offline",
  viewerPassword?: string,
) {
  const res = await fetch(`${BASE}/api/tournaments/${tournamentId}/auth/change-visibility`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Organizer-Token": orgToken },
    body: JSON.stringify({ visibility, viewerPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(serverError(err) || t("auth.blad_zmiany_widocznosci"));
  }
  return res.json();
}

/** #330/#331: publish or hide as the organizer, or as a support person holding "visibility.publish". */
export async function apiChangeVisibilityAs(
  tournamentId: number,
  credential: { orgToken?: string | null; supportToken?: string | null },
  visibility: "public_online" | "private_offline",
) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (credential.orgToken) headers["X-Organizer-Token"] = credential.orgToken;
  else if (credential.supportToken) headers["X-Support-Token"] = credential.supportToken;
  const res = await fetch(`${BASE}/api/tournaments/${tournamentId}/auth/change-visibility`, {
    method: "POST",
    headers,
    body: JSON.stringify({ visibility }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(serverError(err) || t("auth.blad_zmiany_widocznosci"));
  }
  return res.json();
}

// ── #331 · support people (organizer only) ───────────────────────────────────
export interface SupportMember {
  id: number;
  name: string;
  permissions: string[];
  permissionsVersion: number;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
  activeSessions: number;
}
export interface SupportMembersResponse {
  members: SupportMember[];
  catalog: { key: string; label: string }[];
  presets: { key: string; label: string; permissions: string[] }[];
}

async function supportMembersRequest<T>(url: string, orgToken: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}/api${url}`, {
    ...init,
    headers: { "Content-Type": "application/json", "X-Organizer-Token": orgToken, ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(serverError(err) || t("auth.nie_udalo_sie_zapisac_zmian"));
  }
  return res.json() as Promise<T>;
}

export function apiListSupportMembers(tournamentId: number, orgToken: string) {
  return supportMembersRequest<SupportMembersResponse>(`/tournaments/${tournamentId}/support-members`, orgToken);
}
export function apiCreateSupportMember(tournamentId: number, orgToken: string, body: { name: string; permissions: string[] }) {
  return supportMembersRequest<{ member: SupportMember; accessCode: string }>(
    `/tournaments/${tournamentId}/support-members`, orgToken, { method: "POST", body: JSON.stringify(body) });
}
export function apiUpdateSupportMember(tournamentId: number, orgToken: string, memberId: number, body: { name?: string; permissions?: string[] }) {
  return supportMembersRequest<{ member: SupportMember }>(
    `/tournaments/${tournamentId}/support-members/${memberId}`, orgToken, { method: "PATCH", body: JSON.stringify(body) });
}
export function apiRevokeSupportMember(tournamentId: number, orgToken: string, memberId: number) {
  return supportMembersRequest<{ member: SupportMember }>(
    `/tournaments/${tournamentId}/support-members/${memberId}/revoke`, orgToken, { method: "POST" });
}

export async function apiGetAuditLog(tournamentId: number, token: string) {
  const res = await fetch(`${BASE}/api/tournaments/${tournamentId}/audit-log`, {
    headers: { "X-Organizer-Token": token },
  });
  if (!res.ok) throw new Error(t("auth.blad_pobierania_logow"));
  return res.json();
}
