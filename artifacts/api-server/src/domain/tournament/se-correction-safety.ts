/** Pack 18: deliberately read-only Single Elimination correction safety analysis.
 * It is NOT permission to execute an atomic correction. Existing revert/complete
 * transactions remain the only writers and are not modified by Pack 18.
 */
import { validatePlayedSeriesResult } from "../match/series-result";

export interface SeMatchSafetyRow {
  id: number;
  revision?: number;
  stageId: number;
  round: number;
  matchNumber: number;
  status: string;
  resultType: string | null;
  bestOf: number;
  score1: number | null;
  score2: number | null;
  winnerId: number | null;
  player1Id: number | null;
  player2Id: number | null;
  completedAt: Date | string | null;
}
export interface SeStageSafetyRow {
  id: number;
  position: number;
  format: string;
  status: string;
  currentRound: number | null;
  totalRounds: number | null;
}
export type SeCorrectionIssue =
  | "NOT_SINGLE_ELIMINATION" | "TOURNAMENT_NOT_ACTIVE" | "STAGE_NOT_ACTIVE"
  | "MATCH_NOT_COMPLETED" | "MATCH_RESULT_INCONSISTENT"
  | "INVALID_PROPOSED_SCORE" | "NO_CHANGE" | "DUPLICATE_MATCH_COORDINATES"
  | "ROUND_ALREADY_ADVANCED" | "FINAL_ROUND_REQUIRES_REVIEW"
  | "NEXT_MATCH_MISSING" | "NEXT_MATCH_NOT_PRISTINE"
  | "DOWNSTREAM_SLOT_MISMATCH" | "STAGE_ADVANCED"
  | "QUALIFICATION_ALREADY_COMMITTED" | "ROUTING_ALREADY_COMMITTED"
  | "HISTORY_NOT_VERIFIED" | "COMPLETION_ACTION_AMBIGUOUS"
  | "MATCH_STAGE_INCONSISTENT" | "LATER_RESULTS_EXIST";
export interface SeCorrectionSafetyInput {
  tournamentStatus: string;
  stage: SeStageSafetyRow;
  stages: readonly SeStageSafetyRow[];
  match: SeMatchSafetyRow;
  stageMatches: readonly SeMatchSafetyRow[];
  score1: number;
  score2: number;
  qualificationCommitted: boolean;
  routingCommitted: boolean;
  historyVerified: boolean;
  completionActionUnambiguous: boolean;
}
export interface SeCorrectionSafetyResult {
  version: 1;
  status: "structurally_safe" | "blocked";
  advisoryOnly: true;
  matchId: number;
  priorWinnerId: number | null;
  proposedWinnerId: number | null;
  winnerChanges: boolean;
  dependentMatch: { id: number; round: number; matchNumber: number; slot: "player1" | "player2" } | null;
  issues: SeCorrectionIssue[];
}

/** Fail closed if the graph is incomplete, already advanced, or ambiguous. */
export function evaluateSeCorrectionSafety(input: SeCorrectionSafetyInput): SeCorrectionSafetyResult {
  const issues: SeCorrectionIssue[] = [];
  const add = (issue: SeCorrectionIssue) => { if (!issues.includes(issue)) issues.push(issue); };
  const { stage, match, stageMatches } = input;
  if (stage.format !== "single_elimination") add("NOT_SINGLE_ELIMINATION");
  if (input.tournamentStatus !== "active") add("TOURNAMENT_NOT_ACTIVE");
  if (stage.status !== "active") add("STAGE_NOT_ACTIVE");
  const persisted = stageMatches.find(item => item.id === match.id);
  if (stage.id !== match.stageId || !persisted ||
      (persisted.revision != null && match.revision != null && persisted.revision !== match.revision) ||
      (persisted && (persisted.status !== match.status || persisted.resultType !== match.resultType ||
        persisted.round !== match.round || persisted.matchNumber !== match.matchNumber ||
        persisted.score1 !== match.score1 || persisted.score2 !== match.score2 ||
        persisted.winnerId !== match.winnerId || persisted.player1Id !== match.player1Id ||
        persisted.player2Id !== match.player2Id || persisted.bestOf !== match.bestOf ||
        (persisted.completedAt == null ? null : new Date(persisted.completedAt).getTime()) !==
        (match.completedAt == null ? null : new Date(match.completedAt).getTime())))) add("MATCH_STAGE_INCONSISTENT");
  if (match.status !== "completed" || match.resultType !== "played") add("MATCH_NOT_COMPLETED");
  if (!input.historyVerified) add("HISTORY_NOT_VERIFIED");
  if (!input.completionActionUnambiguous) add("COMPLETION_ACTION_AMBIGUOUS");
  if (input.qualificationCommitted) add("QUALIFICATION_ALREADY_COMMITTED");
  if (input.routingCommitted) add("ROUTING_ALREADY_COMMITTED");
  if (input.stages.some(other => other.position > stage.position && other.status !== "planned")) add("STAGE_ADVANCED");

  const coordinates = new Set<string>();
  for (const item of stageMatches) {
    if (item.stageId !== stage.id) { add("MATCH_STAGE_INCONSISTENT"); continue; }
    const key = `${item.round}:${item.matchNumber}`;
    if (coordinates.has(key)) add("DUPLICATE_MATCH_COORDINATES");
    coordinates.add(key);
  }
  const old = validatePlayedSeriesResult({bestOf: match.bestOf,
    score1:match.score1 ?? -1, score2:match.score2 ?? -1});
  if (match.player1Id == null || match.player2Id == null || match.player1Id === match.player2Id ||
      !old.ok || match.winnerId !== (old.ok ? (old.value.winnerSide === "player1" ? match.player1Id : match.player2Id) : null) ||
      match.completedAt == null) add("MATCH_RESULT_INCONSISTENT");
  const proposed = validatePlayedSeriesResult({bestOf:match.bestOf,
    score1:input.score1, score2:input.score2});
  if (!proposed.ok) add("INVALID_PROPOSED_SCORE");
  if (match.score1 === input.score1 && match.score2 === input.score2) add("NO_CHANGE");
  const nextWinnerId = proposed.ok && match.player1Id != null && match.player2Id != null
    ? (proposed.value.winnerSide === "player1" ? match.player1Id : match.player2Id) : null;

  // Only allow structural guidance for unfinished first-round progress.
  // Finished rounds and finals can affect stage/tournament winner state.
  if (stage.currentRound !== match.round || match.round !== 1) add("ROUND_ALREADY_ADVANCED");
  if (stage.totalRounds == null || match.round >= stage.totalRounds) add("FINAL_ROUND_REQUIRES_REVIEW");
  if (stageMatches.some(item => item.round > match.round && item.status !== "pending")) add("LATER_RESULTS_EXIST");

  const nextRound = stageMatches.filter(item => item.round === match.round + 1)
    .sort((left,right) => left.matchNumber - right.matchNumber);
  const expectedNumber = Math.floor((match.matchNumber - 1) / 2) + 1;
  const next = nextRound.find(item => item.matchNumber === expectedNumber);
  let dependentMatch: SeCorrectionSafetyResult["dependentMatch"] = null;
  if (!next || match.matchNumber < 1 || nextRound.some(item => item.matchNumber < 1)) add("NEXT_MATCH_MISSING");
  else {
    const slot: "player1" | "player2" = match.matchNumber % 2 === 1 ? "player1" : "player2";
    dependentMatch = {id:next.id,round:next.round,matchNumber:next.matchNumber,slot};
    if (next.status !== "pending" || next.resultType != null || next.score1 != null ||
        next.score2 != null || next.winnerId != null || next.completedAt != null) add("NEXT_MATCH_NOT_PRISTINE");
    const occupied = slot === "player1" ? next.player1Id : next.player2Id;
    const other = slot === "player1" ? next.player2Id : next.player1Id;
    if (occupied !== match.winnerId || other === match.winnerId) add("DOWNSTREAM_SLOT_MISMATCH");
  }
  return {
    version:1,status:issues.length ? "blocked" : "structurally_safe", advisoryOnly:true,
    matchId:match.id,priorWinnerId:match.winnerId,proposedWinnerId:nextWinnerId,
    winnerChanges:nextWinnerId != null && match.winnerId !== nextWinnerId,
    dependentMatch,issues,
  };
}
