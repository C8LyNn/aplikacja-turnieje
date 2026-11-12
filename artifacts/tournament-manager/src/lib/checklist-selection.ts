/** Only current checklist IDs may be reused after text or security requirements change. */
export function normalizeChecklistSelection(
  raw: string | null,
  validIds: readonly string[],
): Set<string> {
  if (!raw) return new Set<string>();
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return new Set<string>();
    const saved = new Set(value.filter((item): item is string => typeof item === "string"));
    return new Set(validIds.filter((id) => saved.has(id)));
  } catch {
    return new Set<string>();
  }
}
