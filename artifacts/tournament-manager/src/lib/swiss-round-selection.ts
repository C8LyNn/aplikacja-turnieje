/** The Swiss picker may only display a round actually present in the current bracket. */
export function resolveSwissRound(
  available: readonly number[],
  selected: number | null | undefined,
  current: number | null | undefined,
): number | null {
  if (available.length === 0) return null;
  if (selected != null && available.includes(selected)) return selected;
  if (current != null && available.includes(current)) return current;
  return available[0];
}
