/** Pure helpers for the human classification workflow. */
export type CatalogWorkItem = {
  id: number;
  name: string;
  status: "unclassified" | "review" | "ready";
};

export function pendingCatalogGames<T extends CatalogWorkItem>(games: readonly T[]): T[] {
  return games
    .filter((game) => game.status !== "ready")
    .sort((a, b) => a.name.localeCompare(b.name, "pl") || a.id - b.id);
}

/** Returns the next distinct pending record, cycling back to the beginning. */
export function nextPendingGameId(games: readonly CatalogWorkItem[], currentId: number): number | null {
  const pending = pendingCatalogGames(games);
  if (pending.length === 0) return null;
  const index = pending.findIndex((game) => game.id === currentId);
  if (index < 0) return pending[0].id;
  for (let step = 1; step < pending.length; step++) {
    const candidate = pending[(index + step) % pending.length];
    if (candidate.id !== currentId) return candidate.id;
  }
  return null;
}


export type CatalogAssignment = { facet: string; role: string };

export const READINESS_REQUIREMENTS = [
  { key: "genre", label: "Gatunek główny", check: (terms: readonly CatalogAssignment[]) =>
    terms.filter((term) => term.facet === "genre").length === 1 },
  { key: "mechanic", label: "Główna mechanika", check: (terms: readonly CatalogAssignment[]) =>
    terms.some((term) => term.facet === "mechanic" && term.role === "main") },
  { key: "mode", label: "Tryb", check: (terms: readonly CatalogAssignment[]) =>
    terms.some((term) => term.facet === "mode") },
  { key: "structure", label: "Struktura", check: (terms: readonly CatalogAssignment[]) =>
    terms.some((term) => term.facet === "structure") },
  { key: "world", label: "Świat lub konwencja (także abstrakcyjna)", check: (terms: readonly CatalogAssignment[]) =>
    terms.some((term) => term.facet === "world") },
  { key: "visual", label: "Oprawa wizualna", check: (terms: readonly CatalogAssignment[]) =>
    terms.some((term) => term.facet === "visual") },
] as const;

export function classificationReadiness(assignments: readonly CatalogAssignment[]) {
  const checks = READINESS_REQUIREMENTS.map((requirement) => ({
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

/** Case- and accent-insensitive taxonomy search. Selected terms appear first. */
export function filterTaxonomyTerms<T extends { id: number; label: string; slug: string }>(
  terms: readonly T[],
  search: string,
  selectedTermIds: ReadonlySet<number>,
): T[] {
  const normalize = (value: string) =>
    value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pl");
  const query = normalize(search.trim());
  return terms
    .filter((term) => !query || normalize(term.label).includes(query) || normalize(term.slug).includes(query))
    .sort((a, b) => Number(selectedTermIds.has(b.id)) - Number(selectedTermIds.has(a.id))
      || a.label.localeCompare(b.label, "pl")
      || a.id - b.id);
}
