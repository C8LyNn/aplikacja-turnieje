import { describeMatchRules, matchRulesFromStorage, type MatchRules } from "@workspace/match-rules";
import { setPointTotals, type SetPointTotal } from "../../domain/tournament/set-point-totals";
/**
 * V5.4-006 · live tables of one stage (groups, league, Swiss) for organisers and viewers.
 *
 * The order comes from the same ranking functions the server uses when the stage is completed
 * (`calculateRanking` / `calculateGroupRanking`), so a table on screen never disagrees with the
 * qualifiers the engine will take. A completed stage shows its stored places. "In the qualifying
 * zone" is a position, not a promise: it is labelled as such until the stage ends.
 */
import { stagePointTotals } from "../../domain/tournament/point-adjustments";
import { asc, eq } from "drizzle-orm";
import {
  db,
  matchesTable,
  playersTable,
  stageGroupsTable,
  stageParticipantsTable,
  tournamentStagesTable,
} from "@workspace/db";
import { calculateMatchRecordStandings, type StandingProjection } from "../../domain/tournament/standings";
import { describeLeagueRules, leagueRulesFromStorage, type LeagueRules } from "../../domain/tournament/league-rules";
import { calculateGroupRanking, calculateRanking, StageLifecycleError, type RankedParticipant } from "./stage-lifecycle";

export type LiveTableZone = "qualify" | "out";

export interface LiveTableRow {
  playerId: number;
  playerName: string;
  rank: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  /** null when the stage ranks by match wins (no league rules). */
  points: number | null;
  scoreFor: number;
  scoreAgainst: number;
  diff: number;
  buchholz: number | null;
  /** V5.3 tie-break note for points tables; null otherwise. */
  decidedBy: StandingProjection["decidedBy"] | null;
  /** V5.5: net bonus/penalty included in `points` (0 when none). */
  pointAdjustment: number;
  /** V5.7: points scored / conceded inside sets; null when the stage is not decided by sets. */
  setPointsFor: number | null;
  setPointsAgainst: number | null;
  /** Inside the advancing places (only when the stage feeds another stage). */
  zone: LiveTableZone | null;
}

export interface LiveTable {
  groupId: number | null;
  /** "Grupa A", or the stage name for a single table. */
  label: string;
  rows: LiveTableRow[];
  matchesPlayed: number;
  matchesTotal: number;
}

export interface LiveStageStandings {
  stageId: number;
  format: string;
  status: string;
  /** true when the places are final (stored at stage completion). */
  final: boolean;
  leagueRules: LeagueRules | null;
  rulesSummary: string | null;
  /** V5.7: what decides a match, and its plain summary. */
  matchRules: MatchRules | null;
  matchRulesSummary: string;
  /** Places per table that advance (groups: per group; league/Swiss: top N); null when nobody advances. */
  advancingPlaces: number | null;
  tables: LiveTable[];
}

type StageRow = typeof tournamentStagesTable.$inferSelect;
type GroupRow = typeof stageGroupsTable.$inferSelect;
type MembershipRow = typeof stageParticipantsTable.$inferSelect;
type PlayerRow = typeof playersTable.$inferSelect;
type MatchRow = typeof matchesTable.$inferSelect;

const TABLE_FORMATS = new Set(["group_stage", "round_robin", "swiss"]);

function row(
  ranked: RankedParticipant,
  projection: StandingProjection | undefined,
  rank: number,
  advancingPlaces: number | null,
  rules: LeagueRules | null,
  setPoints: Map<number, SetPointTotal> | null = null,
): LiveTableRow {
  return {
    playerId: ranked.playerId,
    playerName: ranked.playerName,
    rank,
    played: projection?.matchesPlayed ?? ranked.matchWins + ranked.matchLosses,
    wins: ranked.matchWins,
    draws: projection?.matchDraws ?? 0,
    losses: ranked.matchLosses,
    points: rules ? projection?.points ?? 0 : null,
    scoreFor: ranked.gameWins,
    scoreAgainst: ranked.gameLosses,
    diff: ranked.gameDiff,
    buchholz: ranked.buchholz,
    decidedBy: rules ? projection?.decidedBy ?? null : null,
    pointAdjustment: rules ? projection?.pointAdjustment ?? 0 : 0,
    setPointsFor: setPoints ? setPoints.get(ranked.playerId)?.for ?? 0 : null,
    setPointsAgainst: setPoints ? setPoints.get(ranked.playerId)?.against ?? 0 : null,
    zone: advancingPlaces == null ? null : rank <= advancingPlaces ? "qualify" : "out",
  };
}

/** Pure: builds the live tables from rows already loaded for one stage. */
export function buildLiveStageStandings(input: {
  stage: StageRow;
  groups: GroupRow[];
  memberships: MembershipRow[];
  players: PlayerRow[];
  matches: MatchRow[];
}): LiveStageStandings {
  const { stage, groups, memberships, players, matches } = input;
  const rules = leagueRulesFromStorage(stage.leagueRules);
  const matchRules = matchRulesFromStorage(stage.matchRules);
  const setPoints = (list: MatchRow[]) => (matchRules ? setPointTotals(list) : null);
  const final = stage.status === "completed";
  const counted = (list: MatchRow[]) => ({
    matchesPlayed: list.filter((match) => match.status === "completed" && match.resultType !== "bye").length,
    matchesTotal: list.filter((match) => match.resultType !== "bye" && match.status !== "cancelled").length,
  });
  const base = {
    stageId: stage.id,
    format: stage.format,
    status: stage.status,
    final,
    leagueRules: rules,
    rulesSummary: rules ? describeLeagueRules(rules, { sets: matchRules != null }) : null,
    matchRules,
    matchRulesSummary: describeMatchRules(matchRules, { bestOf: stage.bestOf, allowDraws: !!rules?.allowDraws }),
  };
  if (!TABLE_FORMATS.has(stage.format) || memberships.length === 0) {
    return { ...base, advancingPlaces: null, tables: [] };
  }
  const playerById = new Map(players.map((player) => [player.id, player]));
  const stagePlayers = (list: MembershipRow[]) =>
    list.flatMap((membership) => {
      const player = playerById.get(membership.playerId);
      return player ? [{ ...player, seed: membership.stageSeed, status: "active" as const }] : [];
    });

  if (stage.format === "group_stage") {
    const advancingPlaces = stage.qualifiersPerGroup ?? null;
    const ranking = calculateGroupRanking(stage, groups, memberships, players, matches);
    const tables = [...groups].sort((a, b) => a.position - b.position).map((group) => {
      const groupMemberships = memberships.filter((membership) => membership.groupId === group.id);
      const groupMatches = matches.filter((match) => match.stageGroupId === group.id);
      const projections = calculateMatchRecordStandings(stagePlayers(groupMemberships), groupMatches, "round_robin", rules, stagePointTotals(stage));
      const projectionById = new Map(projections.map((entry) => [entry.playerId, entry]));
      const storedRank = new Map(groupMemberships.map((membership) => [membership.playerId, membership.groupRank]));
      const ranked = ranking
        .filter((entry) => entry.groupId === group.id)
        .map((entry) => ({ entry, rank: final ? storedRank.get(entry.playerId) ?? entry.rank : entry.rank }))
        .sort((a, b) => a.rank - b.rank);
      return {
        groupId: group.id,
        label: `Grupa ${group.groupKey}`,
        rows: ranked.map(({ entry, rank }) => row(entry, projectionById.get(entry.playerId), rank, advancingPlaces, rules, setPoints(groupMatches))),
        ...counted(groupMatches),
      };
    });
    return { ...base, advancingPlaces, tables };
  }

  const format = stage.format === "swiss" ? "swiss" : "round_robin";
  const projections = calculateMatchRecordStandings(stagePlayers(memberships), matches, format, format === "round_robin" ? rules : null, stagePointTotals(stage));
  const projectionById = new Map(projections.map((entry) => [entry.playerId, entry]));
  const ranking = calculateRanking(stage, memberships, players, matches);
  const storedRank = new Map(memberships.map((membership) => [membership.playerId, membership.finalRank]));
  const advancingPlaces = stage.advancingCount ?? null;
  const rows = ranking
    .map((entry) => ({ entry, rank: final ? storedRank.get(entry.playerId) ?? entry.rank : entry.rank }))
    .sort((a, b) => a.rank - b.rank)
    .map(({ entry, rank }) => row(entry, projectionById.get(entry.playerId), rank, advancingPlaces, format === "round_robin" ? rules : null, setPoints(matches)));
  return { ...base, advancingPlaces, tables: [{ groupId: null, label: stage.name, rows, ...counted(matches) }] };
}

export async function getLiveStageStandings(input: { tournamentId: number; stageId: number }): Promise<LiveStageStandings> {
  const [stage] = await db.select().from(tournamentStagesTable).where(eq(tournamentStagesTable.id, input.stageId));
  if (!stage || stage.tournamentId !== input.tournamentId) throw new StageLifecycleError("STAGE_NOT_FOUND");
  if (stage.status === "planned") {
    const rules = leagueRulesFromStorage(stage.leagueRules);
    const matchRules = matchRulesFromStorage(stage.matchRules);
    return {
      stageId: stage.id, format: stage.format, status: stage.status, final: false,
      leagueRules: rules, rulesSummary: rules ? describeLeagueRules(rules, { sets: matchRules != null }) : null,
      matchRules, matchRulesSummary: describeMatchRules(matchRules, { bestOf: stage.bestOf, allowDraws: !!rules?.allowDraws }),
      advancingPlaces: stage.format === "group_stage" ? stage.qualifiersPerGroup ?? null : stage.advancingCount ?? null,
      tables: [],
    };
  }
  const [groups, memberships, matches] = await Promise.all([
    db.select().from(stageGroupsTable).where(eq(stageGroupsTable.stageId, stage.id)).orderBy(asc(stageGroupsTable.position)),
    db.select().from(stageParticipantsTable).where(eq(stageParticipantsTable.stageId, stage.id)).orderBy(asc(stageParticipantsTable.stageSeed)),
    db.select().from(matchesTable).where(eq(matchesTable.stageId, stage.id)),
  ]);
  const players = memberships.length === 0
    ? []
    : await db.select().from(playersTable).where(eq(playersTable.tournamentId, stage.tournamentId));
  return buildLiveStageStandings({ stage, groups, memberships, players, matches });
}
