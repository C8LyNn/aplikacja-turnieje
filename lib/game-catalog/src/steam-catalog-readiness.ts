/** Shared Steam catalog editorial readiness rules. Apply them only to "ready" records. */
export type SteamCatalogAssignment = { facet: string; role: string };

export const STEAM_CATALOG_READINESS_REQUIREMENTS = [
  { key: "genre", label: "Gatunek główny", check: (terms: readonly SteamCatalogAssignment[]) =>
    terms.filter((term) => term.facet === "genre").length === 1 },
  { key: "mechanic", label: "Główna mechanika", check: (terms: readonly SteamCatalogAssignment[]) =>
    terms.some((term) => term.facet === "mechanic" && term.role === "main") },
  { key: "mode", label: "Tryb", check: (terms: readonly SteamCatalogAssignment[]) =>
    terms.some((term) => term.facet === "mode") },
  { key: "structure", label: "Struktura", check: (terms: readonly SteamCatalogAssignment[]) =>
    terms.some((term) => term.facet === "structure") },
  { key: "world", label: "Świat lub konwencja", check: (terms: readonly SteamCatalogAssignment[]) =>
    terms.some((term) => term.facet === "world") },
  { key: "visual", label: "Oprawa wizualna", check: (terms: readonly SteamCatalogAssignment[]) =>
    terms.some((term) => term.facet === "visual") },
] as const;

/** A record may be stored as unclassified/review with gaps; "ready" requires all checks. */
export function steamCatalogReadiness(assignments: readonly SteamCatalogAssignment[]) {
  const checks = STEAM_CATALOG_READINESS_REQUIREMENTS.map((requirement) => ({
    key: requirement.key,
    label: requirement.label,
    complete: requirement.check(assignments),
  }));
  return {
    checks,
    complete: checks.every((check) => check.complete),
    missing: checks.filter((check) => !check.complete).map((check) => check.label),
  };
}
