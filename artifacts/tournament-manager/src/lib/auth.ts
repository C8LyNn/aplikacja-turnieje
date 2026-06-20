export type Role = "developer" | "organizer" | "support" | "fan";

const ROLE_KEY = "tm_role";
const ORG_TOKEN_KEY = (id: number) => `tm_org_${id}`;
const SUP_TOKEN_KEY = (id: number) => `tm_sup_${id}`;
const SUP_NICK_KEY = (id: number) => `tm_sup_nick_${id}`;

export function getStoredRole(): Role | null {
  try {
    return (localStorage.getItem(ROLE_KEY) as Role) || null;
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
  } catch {}
}

export function clearOrganizerToken(tournamentId: number): void {
  try {
    sessionStorage.removeItem(ORG_TOKEN_KEY(tournamentId));
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
  } catch {}
}

export function clearSupportSession(tournamentId: number): void {
  try {
    sessionStorage.removeItem(SUP_TOKEN_KEY(tournamentId));
    sessionStorage.removeItem(SUP_NICK_KEY(tournamentId));
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

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export async function apiOrganizerLogin(tournamentId: number, password: string): Promise<string> {
  const res = await fetch(`${BASE}/api/tournaments/${tournamentId}/auth/organizer-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || "Błąd logowania");
  }
  const data = await res.json();
  return data.token as string;
}

export async function apiSupportLogin(tournamentId: number, password: string, nick: string): Promise<{ sessionToken: string; nick: string }> {
  const res = await fetch(`${BASE}/api/tournaments/${tournamentId}/auth/support-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, nick }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || "Błąd logowania");
  }
  return res.json();
}

export async function apiGetSupportSessions(tournamentId: number, token: string) {
  const res = await fetch(`${BASE}/api/tournaments/${tournamentId}/auth/support-sessions`, {
    headers: { "X-Organizer-Token": token },
  });
  if (!res.ok) throw new Error("Błąd pobierania sesji");
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
    throw new Error((err as any).error || "Błąd zmiany hasła");
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
    throw new Error((err as any).error || "Błąd logowania widza");
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
    throw new Error((err as any).error || "Błąd zmiany hasła widza");
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
    throw new Error((err as any).error || "Błąd zmiany widoczności");
  }
  return res.json();
}

export async function apiGetAuditLog(tournamentId: number, token: string) {
  const res = await fetch(`${BASE}/api/tournaments/${tournamentId}/audit-log`, {
    headers: { "X-Organizer-Token": token },
  });
  if (!res.ok) throw new Error("Błąd pobierania logów");
  return res.json();
}
