/**
 * V5.6 · safe result entry: an unsaved score survives a page reload, a lost connection and an expired session.
 *
 * Drafts live in this browser tab only (sessionStorage) — never on the server and never shared between operators.
 * Each draft keeps the match baseline it was typed against, so a draft for a match that changed in the meantime
 * is shown as outdated instead of being saved over newer data.
 */
export interface StoredScoreDraft {
  s1: number;
  s2: number;
  /** JSON of the match fields the draft depends on (players, scores, length, open/closed). */
  baseline?: string;
  /** When the draft was last changed (ms). */
  at?: number;
}

const KEY = (tournamentId: number) => `tm_host_score_drafts_v1:${tournamentId}`;
/** Drafts older than this are not restored (a forgotten tab from another day). */
export const DRAFT_MAX_AGE_MS = 12 * 60 * 60 * 1000;

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export function readHostResultDrafts(tournamentId: number, now = Date.now()): Record<number, StoredScoreDraft> {
  const store = storage();
  if (!store || !tournamentId) return {};
  try {
    const raw = store.getItem(KEY(tournamentId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const result: Record<number, StoredScoreDraft> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      const id = Number(key);
      const entry = value as Partial<StoredScoreDraft> | null;
      if (!Number.isSafeInteger(id) || id <= 0 || !entry || typeof entry !== "object") continue;
      const { s1, s2, baseline, at } = entry;
      if (!Number.isInteger(s1) || !Number.isInteger(s2) || s1! < 0 || s2! < 0 || s1! > 999 || s2! > 999) continue;
      if (typeof at === "number" && now - at > DRAFT_MAX_AGE_MS) continue;
      result[id] = { s1: s1!, s2: s2!, ...(typeof baseline === "string" ? { baseline } : {}), ...(typeof at === "number" ? { at } : {}) };
    }
    return result;
  } catch {
    return {};
  }
}

export function writeHostResultDrafts(tournamentId: number, drafts: Record<number, StoredScoreDraft>): void {
  const store = storage();
  if (!store || !tournamentId) return;
  try {
    if (Object.keys(drafts).length === 0) store.removeItem(KEY(tournamentId));
    else store.setItem(KEY(tournamentId), JSON.stringify(drafts));
  } catch {
    // Storage full or blocked: the draft still lives in memory for this page.
  }
}

/** True when the stored result is exactly what the operator tried to save (a retry that already went through). */
export function sameSavedResult(
  current: { status: string; resultType?: string | null; score1?: number | null; score2?: number | null; winnerId?: number | null },
  attempted: { resultType: string; score1?: number | null; score2?: number | null; winnerId?: number | null },
): boolean {
  if (current.status !== "completed" || current.resultType !== attempted.resultType) return false;
  if (attempted.resultType === "played") return current.score1 === attempted.score1 && current.score2 === attempted.score2;
  if (attempted.resultType === "walkover") return current.winnerId === attempted.winnerId;
  return attempted.resultType === "no_contest";
}

export type SaveFailureKind = "network" | "session" | "conflict" | "rejected";

/** Plain classification of a failed save, so the editor can say what happened and what to do. */
export function saveFailureKind(error: unknown): SaveFailureKind {
  const status = (error as { status?: number } | null)?.status;
  if (status === 401 || status === 403) return "session";
  if (status === 409) return "conflict";
  if (typeof status === "number" && status >= 400 && status < 500) return "rejected";
  return "network";
}
