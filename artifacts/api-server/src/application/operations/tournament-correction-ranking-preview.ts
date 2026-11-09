/**
 * Pack 09: read-only hypothetical rank comparison based on the authoritative
 * ranking functions. Not a bracket rewrite or authorization to correct a match.
 */
import { eq, inArray } from "drizzle-orm";
import {
  db, playersTable, stageGroupsTable, stageParticipantsTable,
  matchesTable, tournamentStagesTable,
} from "@workspace/db";
import { calculateRanking } from "../stages/stage-lifecycle";
import { calculateMatchRecordStandings } from "../../domain/tournament/standings";
import { rankRoundRobinOrGroup } from "../../domain/tournament/stage-ranking";
import { deriveTournamentRankingImpact, type RankingSnapshotRow, type RankingImpactDiff } from "./tournament-ranking-impact";
import type { CorrectionPreview } from "./tournament-result-correction-preflight";

export type CorrectionStandingComparison =
  | { status: "unavailable"; reasonCode: string; message: string }
  | {
      status: "available";
      stageId: number;
      stageName: string;
      stageFormat: "swiss" | "round_robin" | "group_stage";
      scope: "stage" | "group";
      scopeLabel: string;
      provisional: true;
      note: string;
      diff: RankingImpactDiff;
    };

const unavailable = (reasonCode: string, message: string): CorrectionStandingComparison => ({ status: "unavailable", reasonCode, message });

type MatchRow = typeof matchesTable.$inferSelect;
type StageRow = typeof tournamentStagesTable.$inferSelect;
type MemberRow = typeof stageParticipantsTable.$inferSelect;
type PlayerRow = typeof playersTable.$inferSelect;
type GroupRow = typeof stageGroupsTable.$inferSelect;

function groupRanking(group: GroupRow, memberships: MemberRow[], players: PlayerRow[], matches: MatchRow[]): RankingSnapshotRow[] {
  const members = memberships.filter(m => m.groupId === group.id)
    .sort((a,b)=>a.stageSeed-b.stageSeed);
  if (members.length !== group.participantCount) throw new Error("GROUP_MEMBERSHIP_MISMATCH");
  const playerMap = new Map(players.map(p=>[p.id,p]));
  const groupPlayers = members.map(m=>{
    const p=playerMap.get(m.playerId);
    if(!p) throw new Error("PLAYER_MISSING");
    return {...p, seed:m.stageSeed, status:"active" as const};
  });
  const groupMatches = matches.filter(m=>m.stageGroupId === group.id);
  const projections = calculateMatchRecordStandings(groupPlayers,groupMatches,"round_robin");
  const values = rankRoundRobinOrGroup(projections.map(row=>({
    participantKey:String(row.playerId),matchWins:row.matchWins,
    gameDiff:row.gameDiff,gameWins:row.gameWins,
    stageSeed:members.find(m=>m.playerId===row.playerId)?.stageSeed,
  })),groupMatches.map(m=>({
    participant1Key:String(m.player1Id),participant2Key:String(m.player2Id),
    status:m.status,resultType:m.resultType === "bye" ? null : m.resultType,
    winnerKey:m.winnerId==null?null:String(m.winnerId),
  })));
  if(!values.valid) throw new Error("GROUP_RANKING_INCONSISTENT");
  const rowMap = new Map(projections.map(row=>[row.playerId,row]));
  return values.standings.map(row=>{
    const p=rowMap.get(Number(row.participantKey));
    if(!p) throw new Error("GROUP_RANKING_INCONSISTENT");
    return {
      playerId:p.playerId,playerName:p.playerName,rank:row.rank,
      matchWins:p.matchWins,matchLosses:p.matchLosses,
      gameWins:p.gameWins,gameLosses:p.gameLosses,gameDiff:p.gameDiff,buchholz:null,
    };
  });
}

/**
 * This projection intentionally reports only stage/group standings. It never
 * estimates a modified SE/DE bracket because current downstream participants
 * remain unchanged in memory. Qualification projections are *not* approvals.
 */
export async function getResultCorrectionStandingsComparison(input: {
  tournamentId: number;
  stage: StageRow | undefined;
  match: MatchRow;
  stageMatches: MatchRow[];
  nextStageExists: boolean;
  preflight: CorrectionPreview;
}): Promise<CorrectionStandingComparison> {
  const { stage, match, stageMatches, preflight, nextStageExists } = input;
  if (!stage) return unavailable("STAGE_NOT_FOUND", "Etap meczu nie istnieje.");
  if (stage.format === "double_elimination" || stage.format === "single_elimination")
    return unavailable("BRACKET_REQUIRES_ROUTING_SIMULATION", "Pełny hipotetyczny ranking drabinki SE/DE wymaga osobnej symulacji awansów. Wynik meczu i blokady widoczne są powyżej.");
  if (stage.format !== "swiss" && stage.format !== "round_robin" && stage.format !== "group_stage")
    return unavailable("UNSUPPORTED_FORMAT", "Ranking tego formatu nie jest obsługiwany w podglądzie.");
  if (preflight.issues.some(i=>["INVALID_PROPOSED_RESULT","MATCH_NOT_COMPLETED","RESULT_INCONSISTENT","STALE_MATCH_REVISION","PARTICIPANTS_INVALID","STAGE_NOT_FOUND"].includes(i.code)))
    return unavailable("INVALID_PREVIEW_STATE", "Najpierw popraw wynik lub odśwież mecz. Porównanie nie jest wiarygodne przy tych blokadach.");
  if(match.resultType!=="played" || preflight.proposedResult.winnerId==null)
    return unavailable("RESULT_NOT_COMPARABLE", "Podgląd klasyfikacji obsługuje wyłącznie kompletny wynik punktowy.");
  const [members,groups] = await Promise.all([
    db.select().from(stageParticipantsTable).where(eq(stageParticipantsTable.stageId,stage.id)),
    stage.format==="group_stage" ? db.select().from(stageGroupsTable).where(eq(stageGroupsTable.stageId,stage.id)) : Promise.resolve([] as GroupRow[]),
  ]);
  if(members.length !== stage.participantCount)
    return unavailable("MEMBERSHIP_INCONSISTENT", "Liczba uczestników etapu nie zgadza się z konfiguracją.");
  const players = members.length ? await db.select().from(playersTable)
    .where(inArray(playersTable.id,members.map(m=>m.playerId))) : [];
  if(players.length !== members.length)
    return unavailable("PLAYERS_INCONSISTENT", "Nie znaleziono wszystkich uczestników etapu.");
  // In-memory only; persisted match records are never modified.
  const afterMatches = stageMatches.map(m=>m.id===match.id ? {
    ...m, status:"completed" as const, resultType:"played" as const,
    score1:preflight.proposedResult.score1, score2:preflight.proposedResult.score2,
    winnerId:preflight.proposedResult.winnerId,
  } : m);
  try {
    let before: RankingSnapshotRow[];
    let after: RankingSnapshotRow[];
    let cutoff: number | null = null;
    let scope: "stage" | "group"="stage";
    let scopeLabel=stage.name;
    if(stage.format==="group_stage") {
      const group=groups.find(g=>g.id===match.stageGroupId);
      if(!group) return unavailable("GROUP_NOT_FOUND", "Nie znaleziono grupy dla tego meczu.");
      before=groupRanking(group,members,players,stageMatches);
      after=groupRanking(group,members,players,afterMatches);
      scope="group";scopeLabel=group.groupKey;
      if(nextStageExists && stage.qualificationMode==="top_n_per_group") cutoff=group.qualifiersCount;
    } else {
      before=calculateRanking(stage,members,players,stageMatches);
      after=calculateRanking(stage,members,players,afterMatches);
      if(nextStageExists && stage.qualificationMode==="top_n") cutoff=stage.advancingCount;
    }
    const diff=deriveTournamentRankingImpact({before,after,qualifierCutoff:cutoff});
    return {
      status:"available",stageId:stage.id,stageName:stage.name,stageFormat:stage.format,
      scope,scopeLabel,provisional:true,
      note:"Scenariusz hipotetyczny na podstawie obecnych wyników i istniejących reguł rankingu. Nie przelicza późniejszych parowań, nie zatwierdza awansów ani nie gwarantuje możliwości korekty. Stan może zmienić się po odczycie.",
      diff,
    };
  } catch {
    // A malformed ranking must be reported as unavailable, not replaced by a guessed order.
    return unavailable("RANKING_NOT_REPRODUCIBLE", "Nie udało się odtworzyć pełnego rankingu przy obecnych danych. Sprawdź integralność etapu i historię wyników.");
  }
}
