/**
 * Pack 09: pure, deterministic before/after rank diff.
 * Does not modify a match, assign participants, approve qualifications or calculate brackets.
 * The caller must supply rankings calculated by the SAME tournament ranking functions
 * that are used by stage-lifecycle, never a second independent tie-break algorithm.
 */
export interface RankingSnapshotRow {
  playerId: number;
  playerName: string;
  rank: number;
  matchWins: number;
  matchLosses: number;
  gameWins: number;
  gameLosses: number;
  gameDiff: number;
  buchholz: number | null;
}
export interface RankingImpactRow {
  playerId: number;
  playerName: string;
  beforeRank: number;
  afterRank: number;
  rankDelta: number; // positive = improved (moved upward)
  beforeMatchWins: number;
  afterMatchWins: number;
  beforeGameDiff: number;
  afterGameDiff: number;
  beforeBuchholz: number | null;
  afterBuchholz: number | null;
  changed: boolean;
}
export interface QualificationImpact {
  status: "projected" | "not_applicable";
  cutoff: number | null;
  beforePlayerIds: number[];
  afterPlayerIds: number[];
  gainingPlayerIds: number[];
  losingPlayerIds: number[];
}
export interface RankingImpactDiff {
  rows: RankingImpactRow[];
  changedRows: number;
  movedRows: number;
  qualifierImpact: QualificationImpact;
}
function assertValidRanking(rows: readonly RankingSnapshotRow[], name: string): void {
  if (rows.length === 0) throw new Error(`${name}: empty ranking`);
  const ids = new Set<number>();
  const ranks = new Set<number>();
  for (const row of rows) {
    if (!Number.isSafeInteger(row.playerId) || row.playerId <= 0 || ids.has(row.playerId))
      throw new Error(`${name}: duplicate or invalid player id`);
    if (!Number.isSafeInteger(row.rank) || row.rank < 1 || row.rank > rows.length || ranks.has(row.rank))
      throw new Error(`${name}: duplicate or invalid rank`);
    ids.add(row.playerId);
    ranks.add(row.rank);
  }
}
/** Ranks must be unique & contiguous, and participant membership must be identical. */
export function deriveTournamentRankingImpact(input: {
  before: readonly RankingSnapshotRow[];
  after: readonly RankingSnapshotRow[];
  qualifierCutoff: number | null;
}): RankingImpactDiff {
  const { before, after, qualifierCutoff } = input;
  assertValidRanking(before, "before");
  assertValidRanking(after, "after");
  if (before.length !== after.length) throw new Error("Ranking membership changed");
  const byId = new Map(before.map(row => [row.playerId, row]));
  if (after.some(row => !byId.has(row.playerId))) throw new Error("Ranking membership changed");
  if (qualifierCutoff != null && (!Number.isSafeInteger(qualifierCutoff)
    || qualifierCutoff < 1 || qualifierCutoff > before.length))
    throw new Error("Invalid qualification cutoff");

  const rows: RankingImpactRow[] = after.map(row => {
    const original = byId.get(row.playerId)!;
    const changed = original.rank !== row.rank || original.matchWins !== row.matchWins
      || original.matchLosses !== row.matchLosses || original.gameWins !== row.gameWins
      || original.gameLosses !== row.gameLosses || original.gameDiff !== row.gameDiff
      || original.buchholz !== row.buchholz;
    return {
      playerId: row.playerId, playerName: row.playerName,
      beforeRank: original.rank, afterRank: row.rank, rankDelta: original.rank - row.rank,
      beforeMatchWins: original.matchWins, afterMatchWins: row.matchWins,
      beforeGameDiff: original.gameDiff, afterGameDiff: row.gameDiff,
      beforeBuchholz: original.buchholz, afterBuchholz: row.buchholz, changed,
    };
  }).sort((a, b) => a.afterRank - b.afterRank);

  const beforeQualifiers = qualifierCutoff == null ? [] : before.filter(x => x.rank <= qualifierCutoff)
    .sort((a,b) => a.rank - b.rank).map(x => x.playerId);
  const afterQualifiers = qualifierCutoff == null ? [] : after.filter(x => x.rank <= qualifierCutoff)
    .sort((a,b) => a.rank - b.rank).map(x => x.playerId);
  const beforeSet = new Set(beforeQualifiers), afterSet = new Set(afterQualifiers);
  return {
    rows, changedRows: rows.filter(x => x.changed).length,
    movedRows: rows.filter(x => x.rankDelta !== 0).length,
    qualifierImpact: {
      status: qualifierCutoff == null ? "not_applicable" : "projected", cutoff: qualifierCutoff,
      beforePlayerIds: beforeQualifiers, afterPlayerIds: afterQualifiers,
      gainingPlayerIds: afterQualifiers.filter(id => !beforeSet.has(id)),
      losingPlayerIds: beforeQualifiers.filter(id => !afterSet.has(id)),
    },
  };
}
