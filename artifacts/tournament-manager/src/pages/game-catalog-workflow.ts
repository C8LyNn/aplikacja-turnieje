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
