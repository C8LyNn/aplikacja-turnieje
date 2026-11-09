/** Pack 20: advisory-only action/impact plan from a validated SE readiness snapshot.
 * NEVER authorizes or performs any mutation. A future writer must repeat all
 * preconditions under transaction locks; advisory output expires immediately.
 */
import type { SeReadinessResult } from "./se-correction-readiness";

export interface SeActionStep {
  code: "REVALIDATE_UNDER_LOCK" | "REVERT_PREVIOUS" | "RECORD_REPLACEMENT" |
    "PROPAGATE_WINNER" | "VERIFY_AUDIT";
  label: string;
  requiresTransaction: true;
}

export interface SeCorrectionActionPlan {
  version: 1;
  kind: "se_correction_advisory_plan";
  advisoryOnly: true;
  executionEnabled: false;
  writePerformed: false;
  state: "candidate" | "blocked";
  changeType: "winner_change" | "score_only" | "unknown";
  matchId: number;
  evidence: {
    expectedMatchRevision: number;
    stageVersionVector: string;
  };
  score: { current: [number | null, number | null]; proposed: [number, number] };
  winner: { currentId: number | null; hypotheticalId: number | null };
  successor: {
    matchId: number;
    round: number;
    matchNumber: number;
    slot: "player1" | "player2";
    previousPlayerId: number;
    hypotheticalPlayerId: number;
    changes: boolean;
  } | null;
  steps: readonly SeActionStep[];
  blockerCodes: readonly string[];
  note: string;
}

export function deriveSeCorrectionActionPlan(input: {
  readiness: SeReadinessResult;
  score1: number;
  score2: number;
  originalScore1: number | null;
  originalScore2: number | null;
}): SeCorrectionActionPlan {
  const r = input.readiness;
  // Never turn a blocked/advisory snapshot into permission to execute.
  const eligible = r.status === "candidate" && r.issues.length === 0 &&
    r.dependentMatch !== null && r.originalWinnerId !== null &&
    r.hypotheticalWinnerId !== null &&
    Number.isSafeInteger(input.score1) && Number.isSafeInteger(input.score2) &&
    input.score1 >= 0 && input.score2 >= 0 &&
    (input.originalScore1 !== input.score1 || input.originalScore2 !== input.score2);
  const changes = eligible && r.originalWinnerId !== r.hypotheticalWinnerId;
  const successor = eligible && r.dependentMatch && r.originalWinnerId !== null && r.hypotheticalWinnerId !== null
    ? {
        matchId: r.dependentMatch.id,
        round: r.dependentMatch.round,
        matchNumber: r.dependentMatch.matchNumber,
        slot: r.dependentMatch.slot,
        previousPlayerId: r.originalWinnerId,
        hypotheticalPlayerId: r.hypotheticalWinnerId,
        changes,
      }
    : null;
  const steps: SeActionStep[] = eligible ? [
    {code:"REVALIDATE_UNDER_LOCK",label:"Ponownie sprawdź rewizje, historię i zależny slot wewnątrz transakcji",requiresTransaction:true},
    {code:"REVERT_PREVIOUS",label:"Cofnij poprzedni wynik wraz z zależną obsadą",requiresTransaction:true},
    {code:"RECORD_REPLACEMENT",label:"Zapisz poprawny wynik i nowy wpis historii",requiresTransaction:true},
    ...(changes ? [{code:"PROPAGATE_WINNER" as const,label:"Zaktualizuj zwycięzcę w następnym meczu",requiresTransaction:true as const}] : []),
    {code:"VERIFY_AUDIT",label:"Potwierdź spójność audytu i rewizji przed zatwierdzeniem transakcji",requiresTransaction:true},
  ] : [];
  const blockers = [...new Set([...r.issues, ...(eligible ? [] : ["ACTION_PLAN_NOT_ELIGIBLE"])])];
  return {
    version:1,kind:"se_correction_advisory_plan",advisoryOnly:true,executionEnabled:false,writePerformed:false,
    state:eligible?"candidate":"blocked",
    changeType:eligible?(changes?"winner_change":"score_only"):"unknown",
    matchId:r.matchId,
    evidence:{expectedMatchRevision:r.expectedMatchRevision,stageVersionVector:r.stageVersionVector},
    score:{current:[input.originalScore1,input.originalScore2],proposed:[input.score1,input.score2]},
    winner:{currentId:r.originalWinnerId,hypotheticalId:r.hypotheticalWinnerId},
    successor,steps,blockerCodes:blockers,
    note:eligible
      ? "Wyłącznie plan hipotetyczny: nie zapisano zmian. Wykonanie SE jest wyłączone do czasu zaliczenia integracyjnych testów PostgreSQL."
      : "Plan wykonania niedostępny: wymagane rozwiązanie blokad i nowy spójny podgląd.",
  };
}
