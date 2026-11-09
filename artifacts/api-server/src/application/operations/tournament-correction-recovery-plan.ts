/**
 * Pack 12 — a PURE, advisory correction-recovery playbook.
 * No DB access, authorization, execution tokens or mutation endpoints.
 * The authoritative checks remain inside revertMatch() and completeMatch().
 */
import type { CorrectionPreview } from "./tournament-result-correction-preflight";
import type { EliminationBracketImpact } from "./tournament-elimination-bracket-impact";
import type { DoubleEliminationCorrectionImpact } from "./tournament-de-routing-impact";

type Format = "single_elimination" | "double_elimination" | "swiss" | "round_robin" | "group_stage";
type Status = "stale" | "blocked" | "no_change" | "manual_review";
type Risk = "none" | "moderate" | "high" | "critical";
type Phase = "inspect" | "authorize" | "manual" | "verify";

export interface CorrectionRecoveryStep {
  id: string;
  phase: Phase;
  title: string;
  instruction: string;
  /** These are DOCUMENTED operations, not executable commands. */
  requiresOrganizerApproval: boolean;
  mutation: boolean;
  automaticExecutionAllowed: false;
  dependsOn: string[];
}

export interface CorrectionRecoveryPlan {
  version: 1;
  kind: "correction_recovery_playbook";
  advisory: true;
  mutationPerformed: false;
  executable: false;
  permissionToExecute: false;
  /** No value of `status` ever authorizes execution. */
  status: Status;
  risk: Risk;
  matchId: number;
  expectedRevision: number;
  proposedScore: { score1: number; score2: number };
  evidence: {
    stageId: number;
    stageVersionVector: string | null;
    doubleEliminationPlanRevision: number | null;
    doubleEliminationExecutionRevision: number | null;
  };
  affected: {
    knownDownstreamMatchIds: number[];
    possibleAffectedLogicalMatches: number;
    potentiallyInvalidatedCompletedResults: number;
  };
  blockerCodes: string[];
  approvalQuestions: string[];
  steps: CorrectionRecoveryStep[];
  note: string;
}

export interface CorrectionRecoveryPlanInput {
  format: Format;
  preview: CorrectionPreview;
  guard: { status: "stable_on_recheck" | "changed_during_read"; stageId: number; stageVersionVector: string } | undefined;
  bracketImpact?: EliminationBracketImpact;
  doubleEliminationImpact?: DoubleEliminationCorrectionImpact;
}

function step(
  id: string, phase: Phase, title: string, instruction: string,
  dependsOn: string[] = [], mutation = false, approval = false,
): CorrectionRecoveryStep {
  return {
    id, phase, title, instruction, dependsOn, mutation,
    requiresOrganizerApproval: approval, automaticExecutionAllowed: false,
  };
}

export function deriveCorrectionRecoveryPlan(input: CorrectionRecoveryPlanInput): CorrectionRecoveryPlan {
  const { format, preview, guard, bracketImpact, doubleEliminationImpact: de } = input;
  const blockers = new Set(preview.issues.filter(i => i.severity === "block").map(i => i.code));
  const validGuard = guard?.status === "stable_on_recheck" &&
    guard.stageId > 0 && guard.stageVersionVector.length > 0;
  if (!validGuard) blockers.add("PREVIEW_NOT_CURRENT");
  const se = format === "single_elimination" ? bracketImpact : undefined;
  if (format === "single_elimination" && se?.status !== "available" && preview.proposedResult.winnerChanges) {
    blockers.add("SE_DEPENDENCY_UNVERIFIED");
  }
  if (se?.status === "available" && se.issues.length > 0 && preview.proposedResult.winnerChanges) {
    blockers.add("SE_BRACKET_INTEGRITY_REVIEW");
  }
  if (format === "double_elimination" && de?.status !== "available") {
    blockers.add("DE_ROUTING_UNVERIFIED");
  }
  const invalidatedCompleted = de?.status === "available"
    ? de.invalidatedDecisions.filter(d => d.canonicalMatchAlreadyCompleted && d.matchKey !== de.sourceMatchKey).length
    : 0;
  if (invalidatedCompleted > 0) blockers.add("DOWNSTREAM_RESULTS_WOULD_BE_INVALIDATED");
  if (de?.status === "available" && de.warningCodes.length > 0) blockers.add("DE_ROUTING_WARNINGS");

  // Same score means NO work: never suggest a meaningless revert/re-submit cycle.
  const unchanged = preview.existingResult.score1 === preview.proposedResult.score1 &&
    preview.existingResult.score2 === preview.proposedResult.score2;
  const status: Status = !validGuard ? "stale"
    : preview.state === "blocked" || blockers.size > 0 ? "blocked"
    : unchanged ? "no_change" : "manual_review";

  const affected = {
    knownDownstreamMatchIds: [...new Set(preview.downstreamMatchIds)].sort((a, b) => a - b),
    possibleAffectedLogicalMatches: de?.status === "available" ? de.affectedMatches.length
      : se?.status === "available" ? se.possibleDownstream.length : 0,
    potentiallyInvalidatedCompletedResults: invalidatedCompleted,
  };
  const risk: Risk = status === "no_change" ? "none"
    : invalidatedCompleted > 0 ? "critical"
    : format === "double_elimination" ||
      (preview.proposedResult.winnerChanges && (format === "single_elimination" || affected.knownDownstreamMatchIds.length > 0))
      ? "high" : "moderate";

  const approvalQuestions: string[] = [];
  if (preview.proposedResult.winnerChanges) approvalQuestions.push("Czy organizator potwierdził zmianę zwycięzcy na podstawie wyniku źródłowego?");
  if (affected.knownDownstreamMatchIds.length || affected.possibleAffectedLogicalMatches)
    approvalQuestions.push("Czy organizator przejrzał wszystkie wskazane mecze zależne i ich statusy?");
  if (invalidatedCompleted > 0)
    approvalQuestions.push(`Czy organizator świadomie zaakceptował ryzyko unieważnienia ${invalidatedCompleted} zakończonych wyników?`);
  if (format === "double_elimination") approvalQuestions.push("Czy sprawdzono aktualny stan i rewizję routingu DE?");
  approvalQuestions.push("Czy przed każdą mutacją zostanie ponownie sprawdzony aktualny stan turnieju?");

  const steps: CorrectionRecoveryStep[] = [];
  if (status === "stale") {
    steps.push(step("refresh", "inspect", "Odśwież stan meczów", "Ponownie pobierz mecz, etapy oraz podgląd korekty; dotychczasowy odczyt jest nieważny."));
  } else if (status === "blocked") {
    steps.push(step("inspect_blockers", "inspect", "Rozwiąż blokady", "Nie cofaj wyniku standardową ścieżką. Wyjaśnij wskazane blokady i wykonaj świeży podgląd."));
    if (invalidatedCompleted > 0) {
      steps.push(step("escalate_dependencies", "authorize", "Zaplanuj ręczne odzyskanie zależnych wyników",
        "Przejrzyj logi, powiązania DE i ustal procedurę dla już rozegranych meczów. Sam podgląd nie jest instrukcją ich usuwania.", ["inspect_blockers"], false, true));
    }
  } else if (status === "no_change") {
    steps.push(step("finish", "verify", "Nie wykonuj korekty", "Proponowany wynik jest identyczny z zapisanym. Brak potrzeby cofania meczu."));
  } else {
    steps.push(step("review_evidence", "inspect", "Sprawdź dowody i konsekwencje",
      "Zweryfikuj wynik źródłowy, klasyfikację, zależne mecze i niepewności symulacji."));
    steps.push(step("approve", "authorize", "Uzyskaj wyraźną zgodę organizatora",
      "Potwierdź proponowaną zmianę i jej skutki. Nie zapisuj zgody jako tokenu technicznego; ta lista jest wyłącznie informacyjna.", ["review_evidence"], false, true));
    steps.push(step("backup", "inspect", "Zabezpiecz stan turnieju",
      "Przed zmianą wyeksportuj kopię danych i zanotuj mecz oraz jego aktualną rewizję.", ["approve"]));
    steps.push(step("recheck", "inspect", "Odśwież stan bezpośrednio przed zapisem",
      "Sprawdź, czy wyniki, etap, kwalifikacje i routing są nadal aktualne; przy różnicy przerwij procedurę.", ["backup"]));
    steps.push(step("revert", "manual", "Cofnij wynik przez istniejącą operację",
      "W panelu korekt uruchom istniejące autoryzowane cofnięcie wyniku. Silnik musi ponownie sprawdzić blokady wewnątrz transakcji.", ["recheck"], true, true));
    steps.push(step("submit", "manual", "Zapisz zweryfikowany wynik",
      "Dopiero po poprawnym cofnięciu odczytaj NOWĄ rewizję meczu i zapisz poprawny wynik istniejącą operacją CompleteMatch. Każdą odmowę traktuj jako przerwanie procedury.", ["revert"], true, true));
    steps.push(step("verify", "verify", "Skontroluj historię, ranking i dalsze mecze",
      "Pobierz ponownie wyniki, historię i klasyfikację, a w SE/DE także drabinkę i routing. Nie uznawaj operacji za wykonaną na podstawie samego podglądu.", ["submit"]));
  }

  return {
    version: 1, kind: "correction_recovery_playbook", advisory: true,
    mutationPerformed: false, executable: false, permissionToExecute: false,
    status, risk, matchId: preview.matchId, expectedRevision: preview.expectedRevision,
    proposedScore: { score1: preview.proposedResult.score1, score2: preview.proposedResult.score2 },
    evidence: {
      stageId: guard?.stageId ?? 0, stageVersionVector: validGuard ? guard!.stageVersionVector : null,
      doubleEliminationPlanRevision: de?.status === "available" ? de.planRevision : null,
      doubleEliminationExecutionRevision: de?.status === "available" ? de.executionRevision : null,
    },
    affected, blockerCodes: [...blockers].sort(), approvalQuestions, steps,
    note: "Wstępny plan do rozpatrzenia przez organizatora, a nie zezwolenie na wykonanie. Między krokami stan może się zmienić. Nie wykonuje mutacji; decyzję egzekwuje wyłącznie istniejący backend transakcyjny.",
  };
}
