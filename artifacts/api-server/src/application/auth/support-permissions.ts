/**
 * #331 · what the organizer can delegate to a support person. Each permission maps to concrete server
 * operations (see the routes using `requireTournamentPermission`); nothing is granted that is not listed.
 * Never delegable: stage lifecycle (start/complete stage), security and credentials, sharing settings, backups,
 * tournament settings, managing support people — those stay with the owner.
 */
export const SUPPORT_PERMISSIONS = [
  "matches.run",
  "results.write",
  "results.correct",
  "participants.manage",
  "stages.rounds",
  "presentation.featured",
  "presentation.settings",
  "visibility.publish",
] as const;

export type SupportPermission = (typeof SUPPORT_PERMISSIONS)[number];

export const SUPPORT_PERMISSION_LABELS: Record<SupportPermission, string> = {
  "matches.run": "Prowadzenie meczów (rozpoczęcie, przełożenie, termin, długość)",
  "results.write": "Wpisywanie wyników",
  "results.correct": "Poprawa i cofanie wyników, anulowanie, zamiana zawodników",
  "participants.manage": "Uczestnicy i składy (dodawanie, edycja, usuwanie, import)",
  "stages.rounds": "Start turnieju i kolejne rundy (bez zamykania etapów)",
  "presentation.featured": "Mecz na ekranie (stream)",
  "presentation.settings": "Wygląd transmisji i scoreboardu",
  "visibility.publish": "Publikowanie i ukrywanie turnieju (przed startem)",
};

/** Exactly what a shared-support-password session could do before #331 — kept for backward compatibility. */
export const LEGACY_SUPPORT_PERMISSIONS: readonly SupportPermission[] = Object.freeze([
  "matches.run", "results.write", "results.correct", "participants.manage", "stages.rounds", "presentation.featured",
]);

export const SUPPORT_PRESETS: Readonly<Record<string, { label: string; permissions: readonly SupportPermission[] }>> = Object.freeze({
  view: { label: "Tylko podgląd", permissions: [] },
  results: { label: "Obsługa wyników", permissions: ["matches.run", "results.write"] },
  moderator: { label: "Moderator", permissions: ["matches.run", "results.write", "results.correct", "presentation.featured"] },
  participants: { label: "Zapisy i uczestnicy", permissions: ["participants.manage"] },
  stream: { label: "Realizacja streamu", permissions: ["presentation.featured", "presentation.settings"] },
  full: { label: "Pełne wsparcie", permissions: [...SUPPORT_PERMISSIONS] },
});

export function isSupportPermission(value: unknown): value is SupportPermission {
  return typeof value === "string" && (SUPPORT_PERMISSIONS as readonly string[]).includes(value);
}

/** Validated, de-duplicated, catalog-ordered permission list; throws on anything unknown. */
export function normalizeSupportPermissions(input: unknown): SupportPermission[] {
  if (!Array.isArray(input)) throw new SupportPermissionInputError("permissions musi być listą uprawnień.");
  const unknown = input.filter((value) => !isSupportPermission(value));
  if (unknown.length) throw new SupportPermissionInputError(`Nieznane uprawnienia: ${unknown.map(String).join(", ")}.`);
  const set = new Set(input as SupportPermission[]);
  return SUPPORT_PERMISSIONS.filter((permission) => set.has(permission));
}

export class SupportPermissionInputError extends Error {
  readonly code = "INVALID_SUPPORT_PERMISSIONS";
}
