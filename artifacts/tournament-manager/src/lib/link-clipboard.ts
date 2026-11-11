export type LinkCopyResult = "copied" | "unavailable" | "failed";

/** A user-initiated write only: never reads the clipboard or changes the link. */
export async function copyLinkText(text: string): Promise<LinkCopyResult> {
  try {
    const clipboard = globalThis.navigator?.clipboard;
    if (!clipboard || typeof clipboard.writeText !== "function") return "unavailable";
    await clipboard.writeText(text);
    return "copied";
  } catch {
    // Permission denial, platform errors and restricted API getters are recoverable.
    return "failed";
  }
}
