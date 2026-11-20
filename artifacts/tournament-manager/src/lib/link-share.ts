/**
 * QW-06b · the system share sheet (phones, some desktops) next to the existing "Kopiuj link". It is offered only when
 * the browser has `navigator.share`; everywhere else the copy button (with its manual fallback) stays the way to share.
 * Only plain tournament addresses are shared: no tokens, passwords or codes, and the text never names a password.
 */
export type LinkShareResult = "shared" | "cancelled" | "unavailable" | "failed";

export interface ShareTarget {
  url: string;
  title: string;
  text?: string;
}

type ShareNavigator = Navigator & {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
};

/** Query keys that could carry access: never part of a shared link, whatever built the address. */
const SECRET_KEY = /token|pass|hasl|haslo|secret|code|kod|session|auth|key/i;

/** The link to share: same address without any parameter that could carry access, and without a fragment. */
export function shareableUrl(url: string): string {
  try {
    const parsed = new URL(url);
    for (const key of [...parsed.searchParams.keys()]) if (SECRET_KEY.test(key)) parsed.searchParams.delete(key);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url;
  }
}

function payload(target: ShareTarget): ShareData {
  return { title: target.title, url: shareableUrl(target.url), ...(target.text ? { text: target.text } : {}) };
}

export function canShareLink(target: ShareTarget): boolean {
  const nav = globalThis.navigator as ShareNavigator | undefined;
  if (!nav || typeof nav.share !== "function") return false;
  try {
    return typeof nav.canShare === "function" ? nav.canShare(payload(target)) : true;
  } catch {
    return false;
  }
}

/** A user-initiated share only. Closing the share sheet is not an error. */
export async function shareLink(target: ShareTarget): Promise<LinkShareResult> {
  if (!canShareLink(target)) return "unavailable";
  try {
    await (globalThis.navigator as ShareNavigator).share!(payload(target));
    return "shared";
  } catch (error) {
    return (error as { name?: string } | null)?.name === "AbortError" ? "cancelled" : "failed";
  }
}

/** What the message says, by link kind. A private tournament's message mentions the password, never its value. */
export function shareText(kind: "public" | "password" | "signup", tournamentName: string): string {
  const name = `„${tournamentName.trim().slice(0, 80) || "Turniej"}”`;
  if (kind === "signup") return `Zapisy do turnieju ${name}`;
  if (kind === "password") return `Turniej ${name} — do obejrzenia potrzebne jest hasło widza od organizatora.`;
  return `Śledź turniej ${name} na żywo.`;
}
