/** Pack 21: actionable, reproducible and ALWAYS read-only SE correction diagnostics.
 * An assessment ID is a SHA-256 correlation identifier, NOT an authorization token,
 * a signature, a guarantee of freshness or permission to execute a mutation.
 */
import { createHash } from "node:crypto";
import type { SeReadinessIssue, SeReadinessResult } from "./se-correction-readiness";
import type { SeCorrectionActionPlan } from "./se-correction-action-plan";

export type SeDiagnosticCategory =
  | "integrity" | "progression" | "history" | "bracket" | "lifecycle"
  | "staleness" | "score" | "manual";
export type SeDiagnosticResolution =
  | "refresh_snapshot" | "adjust_score" | "inspect_audit"
  | "review_bracket" | "review_progression" | "manual_review";

export interface SeDiagnosticBlocker {
  code: string;
  category: SeDiagnosticCategory;
  title: string;
  detail: string;
  recommendation: string;
  resolution: SeDiagnosticResolution;
}

type Reason = { category: SeDiagnosticCategory; title: string; detail: string;
  recommendation: string; resolution: SeDiagnosticResolution };
const REFRESH = "Odśwież mecze i wykonaj wszystkie etapy podglądu od początku.";
const REVIEW = "Zweryfikuj przypadek z organizatorem przed jakąkolwiek zmianą wyników.";
const AUDIT = "Sprawdź historię wyników i wpisy audytu na serwerze; nie omijaj tej blokady.";
const BRACKET = "Sprawdź numerację, obsadę i stan powiązanych meczów w drabince.";
const PROGRESS = "Zweryfikuj rozpoczęte fazy, awanse i powiązane wyniki przed korektą.";

/** Closed catalogue: additions to the domain issue union must be explained here. */
const CAUSES: Record<SeReadinessIssue | "ACTION_PLAN_NOT_ELIGIBLE" |
  "ACTION_PLAN_INCONSISTENT" | "UNSAFE_ADVISORY_FLAGS", Reason> = {
  NOT_SINGLE_ELIMINATION: {category:"lifecycle",title:"Nieobsługiwany format",detail:"Ten podgląd dotyczy wyłącznie Single Elimination.",recommendation:REVIEW,resolution:"manual_review"},
  TOURNAMENT_NOT_ACTIVE: {category:"lifecycle",title:"Turniej nieaktywny",detail:"Turniej nie jest w stanie aktywnym.",recommendation:REVIEW,resolution:"manual_review"},
  STAGE_NOT_ACTIVE: {category:"lifecycle",title:"Etap nieaktywny",detail:"Etap nie pozwala na bezpośrednią korektę.",recommendation:REVIEW,resolution:"manual_review"},
  MATCH_NOT_COMPLETED: {category:"lifecycle",title:"Mecz bez wyniku rozegranego",detail:"Mecz nie ma zakończonego wyniku typu played.",recommendation:REFRESH,resolution:"refresh_snapshot"},
  MATCH_RESULT_INCONSISTENT: {category:"integrity",title:"Niespójny wynik",detail:"Zapisany rezultat lub zwycięzca nie zgadza się z zasadami serii BO.",recommendation:AUDIT,resolution:"inspect_audit"},
  INVALID_PROPOSED_SCORE: {category:"score",title:"Nieprawidłowy nowy wynik",detail:"Proponowany wynik nie spełnia zasad BO meczu.",recommendation:"Wpisz wynik spełniający próg zwycięstw dla BO meczu.",resolution:"adjust_score"},
  NO_CHANGE: {category:"score",title:"Brak zmiany",detail:"Proponowane wartości są takie same jak zapisany wynik.",recommendation:"Wprowadź inny wynik lub zakończ analizę.",resolution:"adjust_score"},
  DUPLICATE_MATCH_COORDINATES: {category:"integrity",title:"Powtórzone pozycje w drabince",detail:"Dwa mecze mają identyczną parę runda/numer.",recommendation:BRACKET,resolution:"review_bracket"},
  ROUND_ALREADY_ADVANCED: {category:"progression",title:"Runda już przesunięta",detail:"Etap przeszedł poza analizowaną pierwszą rundę.",recommendation:PROGRESS,resolution:"review_progression"},
  FINAL_ROUND_REQUIRES_REVIEW: {category:"progression",title:"Mecz finałowy",detail:"Wynik może zmienić zwycięzcę etapu lub turnieju.",recommendation:PROGRESS,resolution:"review_progression"},
  NEXT_MATCH_MISSING: {category:"bracket",title:"Brak następnego meczu",detail:"Nie znaleziono jednoznacznego meczu zależnego.",recommendation:BRACKET,resolution:"review_bracket"},
  NEXT_MATCH_NOT_PRISTINE: {category:"bracket",title:"Następny mecz jest używany",detail:"Mecz zależny nie ma czystego, oczekującego stanu.",recommendation:BRACKET,resolution:"review_bracket"},
  DOWNSTREAM_SLOT_MISMATCH: {category:"integrity",title:"Nieoczekiwana obsada",detail:"Zapisane miejsce zwycięzcy w następnym meczu nie zgadza się z wynikiem.",recommendation:BRACKET,resolution:"review_bracket"},
  STAGE_ADVANCED: {category:"progression",title:"Uruchomiono późniejszy etap",detail:"Następne etapy nie pozostają w stanie planned.",recommendation:PROGRESS,resolution:"review_progression"},
  QUALIFICATION_ALREADY_COMMITTED: {category:"progression",title:"Zatwierdzono awanse",detail:"Dalsza kwalifikacja została już zatwierdzona.",recommendation:PROGRESS,resolution:"review_progression"},
  ROUTING_ALREADY_COMMITTED: {category:"progression",title:"Wykonano routing",detail:"Uczestników przekazano już do kolejnego etapu.",recommendation:PROGRESS,resolution:"review_progression"},
  HISTORY_NOT_VERIFIED: {category:"history",title:"Historia niezgodna",detail:"Ostatni zapis historii nie odpowiada aktualnemu wynikowi.",recommendation:AUDIT,resolution:"inspect_audit"},
  COMPLETION_ACTION_AMBIGUOUS: {category:"history",title:"Niejednoznaczny audyt",detail:"Nie znaleziono dokładnie jednego poprawnego aktywnego potwierdzenia meczu.",recommendation:AUDIT,resolution:"inspect_audit"},
  MATCH_STAGE_INCONSISTENT: {category:"integrity",title:"Niespójny etap",detail:"Odczyt meczu nie odpowiada jego stanowi w zbiorze meczów etapu.",recommendation:AUDIT,resolution:"inspect_audit"},
  LATER_RESULTS_EXIST: {category:"progression",title:"Istnieją późniejsze wyniki",detail:"Zależne rundy mają już mecze poza stanem pending.",recommendation:PROGRESS,resolution:"review_progression"},
  EXPECTED_MATCH_REVISION_STALE: {category:"staleness",title:"Zmieniła się rewizja meczu",detail:"Mecz uległ zmianie od poprzedniego podglądu.",recommendation:REFRESH,resolution:"refresh_snapshot"},
  EXPECTED_STAGE_VERSION_STALE: {category:"staleness",title:"Zmieniły się mecze etapu",detail:"Wektor wersji etapu różni się od oczekiwanego.",recommendation:REFRESH,resolution:"refresh_snapshot"},
  CONFIRMATION_ACTION_MISMATCH: {category:"staleness",title:"Zmieniono potwierdzenie wyniku",detail:"Aktywny wpis audytu nie odpowiada podanemu identyfikatorowi.",recommendation:REFRESH,resolution:"refresh_snapshot"},
  MISSING_DOWNSTREAM_MATCH: {category:"bracket",title:"Nieznany mecz zależny",detail:"Nie można jednoznacznie wyznaczyć następnego miejsca zwycięzcy.",recommendation:BRACKET,resolution:"review_bracket"},
  EXTERNAL_EXECUTION_DISABLED: {category:"manual",title:"Wykonywanie SE wyłączone",detail:"Serwer nie umożliwia automatycznej korekty SE.",recommendation:REVIEW,resolution:"manual_review"},
  ACTION_PLAN_NOT_ELIGIBLE: {category:"manual",title:"Plan niegotowy",detail:"Plan hipotetyczny nie spełnił wymaganych warunków.",recommendation:REVIEW,resolution:"manual_review"},
  ACTION_PLAN_INCONSISTENT: {category:"integrity",title:"Niespójny plan i podgląd",detail:"Plan nie odnosi się dokładnie do tego samego meczu, rewizji albo wektora stanu.",recommendation:REFRESH,resolution:"refresh_snapshot"},
  UNSAFE_ADVISORY_FLAGS: {category:"integrity",title:"Niepoprawny kontrakt bezpieczeństwa",detail:"Podgląd nie deklaruje wyłącznie trybu odczytu albo deklaruje możliwość zapisu.",recommendation:AUDIT,resolution:"inspect_audit"},
};
const PRIORITY: Record<SeDiagnosticCategory, number> = {
  integrity:0,history:1,progression:2,bracket:3,lifecycle:4,staleness:5,score:6,manual:7,
};

export interface SeCorrectionDiagnostic {
  version: 1;
  kind: "se_correction_diagnostic";
  advisoryOnly: true;
  executionEnabled: false;
  writePerformed: false;
  status: "candidate" | "blocked";
  assessmentId: string;
  validity: "snapshot_only";
  matchId: number;
  expectedMatchRevision: number;
  issueCount: number;
  priorityCategory: SeDiagnosticCategory | null;
  blockers: readonly SeDiagnosticBlocker[];
  recommendedNextActions: readonly string[];
  note: string;
}

export function deriveSeCorrectionDiagnostic(input: {
  readiness: SeReadinessResult;
  plan: SeCorrectionActionPlan;
  expectedCompletionActionId: number;
}): SeCorrectionDiagnostic {
  const {readiness:r, plan:p} = input;
  const codes = new Set<string>([...r.issues, ...p.blockerCodes]);
  if (r.matchId !== p.matchId || r.expectedMatchRevision !== p.evidence.expectedMatchRevision ||
      r.stageVersionVector !== p.evidence.stageVersionVector ||
      (r.status === "blocked" && p.state === "candidate")) codes.add("ACTION_PLAN_INCONSISTENT");
  if (r.advisoryOnly !== true || r.executionEnabled !== false || r.writePerformed !== false ||
      p.advisoryOnly !== true || p.executionEnabled !== false || p.writePerformed !== false)
    codes.add("UNSAFE_ADVISORY_FLAGS");
  if (p.state !== "candidate" && codes.size === 0) codes.add("ACTION_PLAN_NOT_ELIGIBLE");
  const blockers = [...codes].map((code): SeDiagnosticBlocker => {
    const meta: Reason = CAUSES[code as keyof typeof CAUSES] ?? {
      category:"manual", title:"Nieznana blokada",detail:"Serwer zgłosił kod niewystępujący w katalogu diagnostycznym.",
      recommendation:REVIEW,resolution:"manual_review",
    };
    return {code,...meta};
  }).sort((a,b) => PRIORITY[a.category]-PRIORITY[b.category] || a.code.localeCompare(b.code));
  const candidate = blockers.length===0 && r.status==="candidate" && p.state==="candidate";
  const nextActions = [...new Set(blockers.map(item=>item.recommendation))];
  if (candidate) nextActions.push("Warunki snapshotu spełnione. Wykonanie SE pozostaje wyłączone; nie traktuj podglądu jako zgody na zapis.");
  const canonical = [1,r.matchId,r.expectedMatchRevision,r.stageVersionVector,
    input.expectedCompletionActionId,p.score.current,p.score.proposed,
    p.winner.currentId,p.winner.hypotheticalId,p.successor?.matchId ?? null,
    p.successor?.slot ?? null,p.state,r.status,blockers.map(x=>x.code)];
  const assessmentId=createHash("sha256").update(JSON.stringify(canonical),"utf8").digest("hex");
  return {
    version:1,kind:"se_correction_diagnostic",advisoryOnly:true,executionEnabled:false,writePerformed:false,
    status:candidate?"candidate":"blocked",assessmentId,validity:"snapshot_only",
    matchId:r.matchId,expectedMatchRevision:r.expectedMatchRevision,
    issueCount:blockers.length,priorityCategory:blockers[0]?.category ?? null,
    blockers,recommendedNextActions:nextActions,
    note:"Identyfikator służy wyłącznie do porównywania analiz. Nie jest podpisem, gwarancją aktualności ani uprawnieniem do wykonania korekty.",
  };
}
