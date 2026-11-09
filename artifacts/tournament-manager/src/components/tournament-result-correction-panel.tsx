import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch, getListMatchesQueryKey, useListMatches, type Match } from "@workspace/api-client-react";
import { AlertTriangle, ArrowRight, FileSearch, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tournamentModeHref, isExperimentalTournamentPath } from "@/features/experimental-tournaments/experimental-tournament-routing";
import { previewStageMatchVersionVector } from "@/lib/tournament-preview-version-vector";
import { captureSeAssessment, compareSeAssessments, type SeAssessmentSnapshot } from "@/lib/se-diagnostic-comparison";
import { appendSeAssessmentHistory, emptySeAssessmentHistory, summarizeSeAssessmentHistory, type SeAssessmentHistory } from "@/lib/se-assessment-history";
import { deriveSeRemediationPriorityPlan } from "@/lib/se-remediation-priority";

type EliminationBracketImpact =
  | { status: "unavailable"; reasonCode: string; message: string }
  | {
      status: "available"; stageId: number; stageName: string;
      format: "single_elimination"; provisional: true; forecastScope: "structure_only";
      winnerChanges: boolean;
      sourceMatch: { matchId: number; round: number; matchNumber: number };
      directSlot: {
        matchId: number; round: number; slot: "player1" | "player2";
        currentPlayerId: number | null; hypotheticalPlayerId: number;
        matchingCurrentWinner: boolean; pristine: boolean;
      } | null;
      possibleDownstream: Array<{
        matchId: number; round: number; matchNumber: number; status: string;
        relation: "direct_slot" | "possible_later_match"; blocking: boolean;
      }>;
      issues: Array<{ code: string; message: string }>;
      chainComplete: boolean; finalRoundWinnerMayChange: boolean; note: string;
    };

type ResultCorrectionStandingsComparison =
  | { status: "unavailable"; reasonCode: string; message: string }
  | {
      status: "available"; stageId: number; stageName: string;
      stageFormat: "swiss" | "round_robin" | "group_stage";
      scope: "stage" | "group"; scopeLabel: string;
      provisional: true; note: string;
      diff: {
        changedRows: number; movedRows: number;
        rows: Array<{
          playerId: number; playerName: string; beforeRank: number; afterRank: number;
          rankDelta: number; beforeMatchWins: number; afterMatchWins: number;
          beforeGameDiff: number; afterGameDiff: number;
          beforeBuchholz: number | null; afterBuchholz: number | null; changed: boolean;
        }>;
        qualifierImpact: {
          status: "projected" | "not_applicable"; cutoff: number | null;
          beforePlayerIds: number[]; afterPlayerIds: number[];
          gainingPlayerIds: number[]; losingPlayerIds: number[];
        };
      };
    };

type DoubleEliminationImpact =
  | { status: "unavailable"; reasonCode: string; message: string }
  | {
      status: "available"; provisional: true; scope: "double_elimination_routing_v2";
      planRevision: number; executionRevision: number;
      stageId: number; sourceMatchKey: string;
      winnerChanges: boolean; currentWinnerId: number; proposedWinnerId: number;
      upstreamRoutes: Array<{routeKey: string; outcome: "winner" | "loser"; targetMatchKey: string; targetSlot: 1 | 2}>;
      affectedMatches: Array<{
        matchKey: string; label: string; currentStatus: string; hypotheticalStatus: string;
        currentSlots: [string | null, string | null]; hypotheticalSlots: [string | null, string | null];
        existingCanonicalMatchId: number | null; canonicalMatchAlreadyCompleted: boolean;
      }>;
      invalidatedDecisions: Array<{matchKey: string; canonicalMatchId: number | null; canonicalMatchAlreadyCompleted: boolean}>;
      currentChampionId: number | null; hypotheticalChampionId: number | null;
      warningCodes: string[]; note: string;
    };
type PreviewGuard = {
  status: "stable_on_recheck" | "changed_during_read";
  stageId: number; stageVersionVector: string;
};

type CorrectionRecoveryPlan = {
  version: 1;
  kind: "correction_recovery_playbook";
  advisory: true;
  mutationPerformed: false;
  executable: false;
  permissionToExecute: false;
  status: "stale" | "blocked" | "no_change" | "manual_review";
  risk: "none" | "moderate" | "high" | "critical";
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
  steps: Array<{
    id: string; phase: "inspect" | "authorize" | "manual" | "verify";
    title: string; instruction: string; requiresOrganizerApproval: boolean;
    mutation: boolean; automaticExecutionAllowed: false; dependsOn: string[];
  }>;
  note: string;
};

type CorrectionOperationReceipt = {
  version: 1; operationId: string; matchId: number;
  status: "approved" | "expired" | "reverted_requires_resubmission" | "corrected";
  mutationPerformed: boolean; expiresAt: string; approvedAt: string;
  completedAt: string | null; revertActionId: number | null;
  matchRevision: number | null; completionActionId?: number|null; correctedMatchRevision?: number|null; message: string;
};

type SeCorrectionSafety = {
  version: 1;
  status: "structurally_safe" | "blocked";
  advisoryOnly: true;
  executionEnabled: false;
  matchId: number;
  matchRevision: number;
  stageVersionVector: string;
  activeCompletionActionId: number | null;
  priorWinnerId: number | null;
  proposedWinnerId: number | null;
  winnerChanges: boolean;
  dependentMatch: { id: number; round: number; matchNumber: number; slot: "player1" | "player2" } | null;
  issues: string[];
  readVersion: string;
  message: string;
};

type SeActionPlan = {
  version:1;kind:"se_correction_advisory_plan";advisoryOnly:true;
  executionEnabled:false;writePerformed:false;state:"candidate"|"blocked";
  changeType:"winner_change"|"score_only"|"unknown";matchId:number;
  score:{current:[number|null,number|null];proposed:[number,number]};
  evidence:{expectedMatchRevision:number;stageVersionVector:string};
  winner:{currentId:number|null;hypotheticalId:number|null};
  successor:{matchId:number;round:number;matchNumber:number;slot:"player1"|"player2";
    previousPlayerId:number;hypotheticalPlayerId:number;changes:boolean}|null;
  steps:Array<{code:string;label:string;requiresTransaction:true}>;
  blockerCodes:string[];note:string;
};

type SeDiagnostic = {
  version: 1; kind: "se_correction_diagnostic"; advisoryOnly: true;
  executionEnabled: false; writePerformed: false;
  status: "candidate" | "blocked"; assessmentId: string;
  validity: "snapshot_only"; matchId: number; expectedMatchRevision: number;
  issueCount: number; priorityCategory: string | null;
  blockers: Array<{code: string; category: string; title: string; detail: string;
    recommendation: string; resolution: string}>;
  recommendedNextActions: string[]; note: string;
};

type SeImpactRiskReport = {
  version:1;kind:"se_correction_impact_risk_report";advisoryOnly:true;
  executionEnabled:false;writePerformed:false;matchId:number;
  status:"incomplete"|"requires_review"|"observational";
  highestSeverity:"critical"|"high"|"medium"|"low";
  items:Array<{code:string;severity:"critical"|"high"|"medium"|"low";
    scope:"data"|"match"|"stage"|"reporting";
    evidence:"confirmed_in_snapshot"|"potential_impact"|"incomplete_information";
    message:string;recommendedCheck:string;affectedMatchIds:number[];affectedStageIds:number[]}>;
  note:string;
};

type SeImpactGraph = {
  version:1; kind:"se_correction_impact_graph"; advisoryOnly:true;
  executionEnabled:false; writePerformed:false;
  status:"outlined"|"review_required"|"incomplete";
  matchId:number; stageId:number|null; changeType:"winner_change"|"score_only"|"unknown";
  sourceRound:number|null;
  downstreamMatches:Array<{matchId:number;round:number;matchNumber:number;
    slot:"player1"|"player2";relationship:"direct_successor_slot"|"potential_later_path";
    alreadyStarted:boolean;label:string}>;
  laterStages:Array<{stageId:number;position:number;status:string;
    relationship:"possible_reporting_or_routing_dependency"}>;
  directSuccessorCount:number;potentialLaterMatchCount:number;startedDownstreamCount:number;
  warnings:string[];note:string;
};

type SeReadiness = {
  version: 1; status: "candidate" | "blocked";
  advisoryOnly: true; executionEnabled: false; writePerformed: false;
  matchId: number; expectedMatchRevision: number; stageVersionVector: string;
  originalWinnerId: number | null; hypotheticalWinnerId: number | null;
  dependentMatch: {id:number;round:number;matchNumber:number;slot:"player1"|"player2"} | null;
  requiredChecks: string[]; issues: string[]; reason: string;
  actionPlan: SeActionPlan;
  diagnostic: SeDiagnostic;
  impactGraph: SeImpactGraph;
  impactRiskReport: SeImpactRiskReport;
};

type CorrectionPreview = {
  version: 1;
  advisory: true;
  mutationPerformed: false;
  previewIsAuthorization: false;
  requiresTransactionalRecheck: true;
  state: "blocked" | "requires_review";
  matchId: number;
  expectedRevision: number;
  stageName: string | null;
  existingResult: { score1: number | null; score2: number | null; winnerId: number | null };
  proposedResult: { score1: number; score2: number; winnerId: number | null; winnerChanges: boolean | null };
  issues: { code: string; severity: "block" | "review"; message: string }[];
  effects: { code: string; certainty: "confirmed" | "conditional"; message: string }[];
  downstreamMatchIds: number[];
  recommendedAction: string;
  standingsComparison?: ResultCorrectionStandingsComparison;
  bracketImpact?: EliminationBracketImpact;
  doubleEliminationImpact?: DoubleEliminationImpact;
  previewGuard?: PreviewGuard;
  recoveryPlan?: CorrectionRecoveryPlan;
  boundedRevertCandidate?: { supported: boolean; reasonCode: string; expectedCompletionActionId: number | null };
};

/** Pack 14: advisory preview plus explicitly approved, transactionally guarded Round Robin revert. */
export function TournamentResultCorrectionPanel({ tournamentId, enabled }: { tournamentId: number; enabled: boolean }) {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const [approveRevert, setApproveRevert] = useState(false);
  const [acceptResubmission, setAcceptResubmission] = useState(false);
  const [revertReceipt, setRevertReceipt] = useState<string | null>(null);
  const storageKey = `tournament-correction-operation-${tournamentId}`;
  const [pendingIntent, setPendingIntent] = useState<{operationId: string; matchId: number; confirmed: boolean} | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = window.sessionStorage.getItem(`tournament-correction-operation-${tournamentId}`);
      if (!stored) return null;
      const decoded: unknown = JSON.parse(stored);
      if (!decoded || typeof decoded !== "object") return null;
      const value = decoded as {operationId?: unknown; matchId?: unknown; confirmed?: unknown};
      return typeof value.operationId === "string" && typeof value.matchId === "number" && Number.isSafeInteger(value.matchId) && value.matchId > 0
        ? {operationId: value.operationId, matchId: value.matchId as number, confirmed: value.confirmed === true} : null;
    } catch { return null; }
  });
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const experimental = isExperimentalTournamentPath(location);
  const [selected, setSelected] = useState("");
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const [preview, setPreview] = useState<CorrectionPreview | null>(null);
  const [seSafety, setSeSafety] = useState<SeCorrectionSafety | null>(null);
  const [seReadiness, setSeReadiness] = useState<SeReadiness | null>(null);
  const [seAssessmentPair, setSeAssessmentPair] = useState<{
    previous: SeAssessmentSnapshot | null; current: SeAssessmentSnapshot;
  } | null>(null);
  const seAssessmentComparison = useMemo(() => seAssessmentPair
    ? compareSeAssessments(seAssessmentPair.previous, seAssessmentPair.current)
    : null, [seAssessmentPair]);
  const [seAssessmentHistory, setSeAssessmentHistory] = useState<SeAssessmentHistory>(emptySeAssessmentHistory);
  const seAssessmentHistorySummary = useMemo(() => summarizeSeAssessmentHistory(seAssessmentHistory), [seAssessmentHistory]);
  const seRemediationPriority = useMemo(() => {
    const latest = seAssessmentHistory.snapshots.at(-1);
    return latest ? deriveSeRemediationPriorityPlan(latest, seAssessmentHistory) : null;
  }, [seAssessmentHistory]);
  const matchesQuery = useListMatches(tournamentId, { query: {
    queryKey: getListMatchesQueryKey(tournamentId),
    enabled: enabled && tournamentId > 0, retry: false, refetchInterval: 5000,
  } });
  const matches = useMemo(() =>
    (matchesQuery.data ?? []).filter((item: Match) => item.status === "completed" && item.resultType === "played")
      .slice().sort((a: Match, b: Match) => b.round - a.round || b.matchNumber - a.matchNumber),
    [matchesQuery.data]);
  const chosen = matches.find((item: Match) => String(item.id) === selected);
  const proposedScore1 = score1.trim() === "" ? NaN : Number(score1);
  const proposedScore2 = score2.trim() === "" ? NaN : Number(score2);
  const shownPreview = preview && chosen?.id === preview.matchId && chosen.revision === preview.expectedRevision
    && preview.proposedResult.score1 === proposedScore1 && preview.proposedResult.score2 === proposedScore2
    && preview.previewGuard?.status === "stable_on_recheck"
    && preview.previewGuard.stageVersionVector === previewStageMatchVersionVector(matchesQuery.data ?? [], preview.previewGuard.stageId)
    ? preview : null;
  const canPreview = !!chosen && Number.isSafeInteger(proposedScore1) && Number.isSafeInteger(proposedScore2)
    && proposedScore1 >= 0 && proposedScore2 >= 0;
  const request = useMutation({
    mutationFn: async (values: { matchId: number; expectedRevision: number; proposedScore1: number; proposedScore2: number }) =>
      customFetch<CorrectionPreview>(`/api/tournaments/${tournamentId}/operations/result-correction-preview`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values),
      }),
    onSuccess: (result) => setPreview(result),
  });
  const safetyRequest = useMutation({
    mutationFn: async (values: { matchId: number; score1: number; score2: number }) =>
      customFetch<SeCorrectionSafety>(
        `/api/tournaments/${tournamentId}/matches/${values.matchId}/se-correction-preflight?score1=${values.score1}&score2=${values.score2}`,
        { method: "GET" },
      ),
    onSuccess: result => {setSeSafety(result);setSeReadiness(null);},
    onError: () => setSeSafety(null),
  });
  const readinessRequest = useMutation({
    mutationFn: async (values: {matchId:number;score1:number;score2:number;matchRevision:number;stageVersionVector:string;completionActionId:number}) =>
      customFetch<SeReadiness>(`/api/tournaments/${tournamentId}/matches/${values.matchId}/se-correction-readiness`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({score1:values.score1,score2:values.score2,
          expectedMatchRevision:values.matchRevision,expectedStageVersionVector:values.stageVersionVector,
          expectedCompletionActionId:values.completionActionId}),
      }),
    onSuccess: (result, variables) => {
      // Never attach a delayed response to a different match or score selection.
      if (selected !== String(variables.matchId) || proposedScore1 !== variables.score1 ||
          proposedScore2 !== variables.score2 ||
          result.matchId !== variables.matchId ||
          result.expectedMatchRevision !== variables.matchRevision ||
          result.stageVersionVector !== variables.stageVersionVector) {
        setSeReadiness(null);
        return;
      }
      setSeReadiness(result);
      const captured = captureSeAssessment({
        tournamentId, matchId: variables.matchId,
        proposedScore1: variables.score1, proposedScore2: variables.score2,
        stageVersionVector: variables.stageVersionVector,
        expectedCompletionActionId: variables.completionActionId,
        diagnostic: result.diagnostic,
      });
      setSeAssessmentPair(previous => captured
        ? { previous: previous?.current ?? null, current: captured } : null);
      setSeAssessmentHistory(previous => captured
        ? appendSeAssessmentHistory(previous, captured) : emptySeAssessmentHistory());
    },
    onError: () => setSeReadiness(null),
  });
  const finishCorrection = (receipt: CorrectionOperationReceipt) => {
    if (receipt.status !== "reverted_requires_resubmission" && receipt.status !== "corrected") return;
    setPendingIntent(null); setCandidateId(null);
    window.sessionStorage.removeItem(storageKey);
    setPreview(null);setApproveRevert(false);setAcceptResubmission(false);
    setOperationError(null);
    setRevertReceipt(receipt.status === "corrected"
      ? `Mecz #${receipt.matchId}: wynik poprawiono atomowo (cofnięcie #${receipt.revertActionId}, nowy zapis #${receipt.completionActionId}).`
      : `Mecz #${receipt.matchId}: wynik cofnięto (akcja #${receipt.revertActionId}). Zapisz nowy wynik osobno.`);
    void queryClient.invalidateQueries();
  };
  const prepare = useMutation({
    mutationFn: async (body: Record<string, unknown>) => customFetch<CorrectionOperationReceipt>(
      `/api/tournaments/${tournamentId}/operations/correction-intents`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    onSuccess: (receipt) => {
      setOperationError(null);
      if (receipt.status === "reverted_requires_resubmission" || receipt.status === "corrected") { finishCorrection(receipt); return; }
      if (receipt.status === "expired") { setOperationError(receipt.message); return; }
      const value = {operationId: receipt.operationId, matchId: receipt.matchId, confirmed: true};
      setPendingIntent(value);window.sessionStorage.setItem(storageKey,JSON.stringify(value));
    },
    onError: () => setOperationError("Nie udało się potwierdzić zapisu zgody. Ponów przygotowanie z tym samym identyfikatorem."),
  });
  const execute = useMutation({
    mutationFn: async (operationId: string) => customFetch<CorrectionOperationReceipt>(
      `/api/tournaments/${tournamentId}/operations/correction-intents/${encodeURIComponent(operationId)}/execute-atomic`,
      { method: "POST" }),
    onSuccess: (receipt) => finishCorrection(receipt),
    onError: () => { setOperationError("Nieznany wynik żądania. Najpierw sprawdź status — nie wysyłaj nowej korekty."); void queryClient.invalidateQueries(); },
  });
  const checkOperation = useMutation({
    mutationFn: async (operationId: string) => customFetch<CorrectionOperationReceipt>(
      `/api/tournaments/${tournamentId}/operations/correction-intents/${encodeURIComponent(operationId)}`),
    onSuccess: (receipt) => {
      if (receipt.status === "reverted_requires_resubmission" || receipt.status === "corrected") { finishCorrection(receipt); return; }
      if (receipt.status === "expired") {
        setPendingIntent(null);setCandidateId(null); window.sessionStorage.removeItem(storageKey);
        setOperationError(receipt.message);return;
      }
      const value = { operationId: receipt.operationId, matchId: receipt.matchId, confirmed: true };
      setPendingIntent(value);window.sessionStorage.setItem(storageKey,JSON.stringify(value));
      setOperationError(null);
    },
    onError: () => setOperationError("Nie udało się odczytać statusu; zachowano identyfikator operacji."),
  });
  if (!enabled) return null;
  function resetOnChange(preserveSeAssessment = false) { if (!preserveSeAssessment) { setSeAssessmentPair(null); setSeAssessmentHistory(emptySeAssessmentHistory()); } setPreview(null);setSeSafety(null);setSeReadiness(null);safetyRequest.reset();readinessRequest.reset(); request.reset();prepare.reset();execute.reset();setRevertReceipt(null);setApproveRevert(false);setAcceptResubmission(false); }
  return (
    <details className="mt-4 rounded-xl border border-border/80 bg-background/30 p-3 sm:p-4">
      <summary className="cursor-pointer text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        <span className="inline-flex items-center gap-2"><FileSearch className="h-4 w-4 text-primary" aria-hidden="true" /> Sprawdź skutki korekty wyniku</span>
      </summary>
      <p className="mt-2 text-xs text-muted-foreground">Podgląd pokazuje blokady i możliwe zależności. Nie cofa meczu i nie wpisuje nowego wyniku.</p>
      {matchesQuery.isError ? <p role="status" className="mt-3 text-xs text-destructive">Nie udało się wczytać meczów. Sprawdź uprawnienia.</p>
        : matches.length === 0 ? <p className="mt-3 text-xs text-muted-foreground">Brak zakończonych meczów z wynikiem punktowym.</p>
        : <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-medium sm:col-span-3">Zakończony mecz
            <select value={selected} className="mt-1 w-full rounded-md border border-input bg-background p-2 text-sm" onChange={event => {
              const id = event.target.value;
              const selectedMatch = matches.find((item: Match) => String(item.id) === id);
              setSelected(id); setScore1(selectedMatch?.score1 != null ? String(selectedMatch.score1) : "");
              setScore2(selectedMatch?.score2 != null ? String(selectedMatch.score2) : ""); resetOnChange();
            }}>
              <option value="">Wybierz mecz…</option>
              {matches.map((item: Match) => <option key={item.id} value={String(item.id)}>
                R{item.round} · M{item.matchNumber} · #{item.id} · {item.score1 ?? "?"}:{item.score2 ?? "?"}
              </option>)}
            </select>
          </label>
          <label className="text-xs font-medium">Nowy wynik strony 1
            <Input className="mt-1" type="number" min={0} value={score1} onChange={event => {setScore1(event.target.value); resetOnChange();}} />
          </label>
          <label className="text-xs font-medium">Nowy wynik strony 2
            <Input className="mt-1" type="number" min={0} value={score2} onChange={event => {setScore2(event.target.value); resetOnChange();}} />
          </label>
          <div className="flex items-end">
            <Button type="button" variant="outline" size="sm" disabled={!canPreview || request.isPending} onClick={() => {
              if (!chosen || !canPreview) return;
              resetOnChange(true); // Preserve a previous assessment ONLY while refreshing the same intended correction.
              request.mutate({matchId: chosen.id, expectedRevision: chosen.revision,
                proposedScore1, proposedScore2});
            }}>
              <FileSearch className="mr-1 h-4 w-4" /> {request.isPending ? "Sprawdzanie…" : "Pokaż skutki"}
            </Button>
          </div>
        </div>}
      {preview && !shownPreview && <p role="status" className="mt-3 text-xs text-amber-600 dark:text-amber-400">Wynik podglądu wygasł lub nie zgadza się z aktualnym stanem meczów. Pobierz aktualne dane i wykonaj analizę ponownie.</p>}
      {pendingIntent && <div className="mt-3 space-y-2 rounded-lg border border-amber-500/60 p-3 text-xs" role="status">
        <p className="font-semibold">{pendingIntent.confirmed ? "Pack 15: zatwierdzenie zapisane — oczekuje na atomową korektę" : "Pack 14: wynik zapisu zgody niepotwierdzony — sprawdź status"}</p>
        <p>Operacja {pendingIntent.operationId}. Dotyczy meczu #{pendingIntent.matchId}. Nie wysyłaj nowej operacji, zanim sprawdzisz status.</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="destructive" size="sm" disabled={!pendingIntent.confirmed || execute.isPending || checkOperation.isPending}
            onClick={() => execute.mutate(pendingIntent.operationId)}>
            {execute.isPending ? "Wykonywanie…" : "Krok 2: Popraw wynik atomowo"}
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={execute.isPending || checkOperation.isPending}
            onClick={() => checkOperation.mutate(pendingIntent.operationId)}>
            {checkOperation.isPending ? "Sprawdzanie…" : "Sprawdź status operacji"}
          </Button>
        </div>
        <p className="text-muted-foreground">Po błędzie sieciowym najpierw sprawdź status. Zatwierdzenie wygasa po 15 minutach; atomowy zapis nie pozostawia meczu bez wyniku.</p>
      </div>}
      {operationError && <p role="alert" className="mt-3 text-xs text-destructive">{operationError}</p>}
      {revertReceipt && <p role="status" className="mt-3 rounded-md border border-amber-500/50 p-3 text-xs font-medium">{revertReceipt} <Link className="underline" href={tournamentModeHref(`/tournaments/${tournamentId}/host?tab=korekta`, experimental)}>Przejdź do korekt</Link></p>}
      {request.isError && <p role="alert" className="mt-3 text-xs text-destructive">Podgląd nie powiódł się. Odśwież dane meczu i sprawdź sesję organizatora.</p>}
      {shownPreview?.bracketImpact?.status === "available" && (
        <section className="mt-3 rounded-lg border border-border/70 p-3 text-xs" aria-label="Bezpieczna ocena korekty Single Elimination">
          <p className="font-semibold">Single Elimination — kontrola zależnego miejsca w drabince</p>
          <p className="mt-1 text-muted-foreground">Ta analiza sprawdza historię, kolejny mecz i zatwierdzone awanse. Automatyczne wykonanie SE pozostaje wyłączone.</p>
          <Button type="button" size="sm" variant="outline" className="mt-2"
            disabled={!chosen || safetyRequest.isPending}
            onClick={() => {
              if (chosen) safetyRequest.mutate({ matchId: chosen.id, score1: shownPreview.proposedResult.score1, score2: shownPreview.proposedResult.score2 });
            }}>
            {safetyRequest.isPending ? "Sprawdzanie…" : "Oceń gotowość SE"}
          </Button>
          {safetyRequest.isError && <p role="alert" className="mt-2 text-destructive">Nie udało się sprawdzić aktualnej drabinki. Odśwież stan turnieju.</p>}
          {seSafety && seSafety.matchId === shownPreview.matchId && !safetyRequest.isPending && (
            <div className="mt-2 space-y-1" role="status">
              <p className="font-medium">{seSafety.status === "structurally_safe" ? "Struktura jest spójna (podgląd)" : "Korekta ma blokady"}</p>
              {seSafety.dependentMatch && <p>Powiązany mecz #{seSafety.dependentMatch.id}, runda {seSafety.dependentMatch.round}, miejsce {seSafety.dependentMatch.slot === "player1" ? "1" : "2"}.</p>}
              {seSafety.issues.length > 0 && <p>Blokady: {seSafety.issues.join(", ")}</p>}
              <p className="text-muted-foreground">{seSafety.message}</p>
              {seSafety.status === "structurally_safe" && seSafety.activeCompletionActionId != null && chosen && (
                <Button type="button" size="sm" variant="outline" className="mt-2"
                  disabled={readinessRequest.isPending}
                  onClick={() => readinessRequest.mutate({matchId:chosen.id,
                    score1:shownPreview.proposedResult.score1,score2:shownPreview.proposedResult.score2,
                    matchRevision:seSafety.matchRevision,stageVersionVector:seSafety.stageVersionVector,
                    completionActionId:seSafety.activeCompletionActionId!})}>
                  {readinessRequest.isPending ? "Weryfikowanie…" : "Sprawdź spójny snapshot SE"}
                </Button>
              )}
              {readinessRequest.isError && <p className="text-destructive">Nie udało się zweryfikować snapshotu. Odśwież dane.</p>}
              {seReadiness && seReadiness.matchId === chosen?.id && (
                <div className="mt-2 rounded-md border border-border p-2">
                  <p>{seReadiness.status === "candidate" ? "Warunki strukturalne są spełnione" : "Wykryto blokady transakcyjne"}</p>
                  {seReadiness.issues.length > 0 && <p>Blokady: {seReadiness.issues.join(", ")}</p>}
                  <p>{seReadiness.reason}</p>
                  {seReadiness.actionPlan &&
                    seReadiness.actionPlan.score.proposed[0] === shownPreview.proposedResult.score1 &&
                    seReadiness.actionPlan.score.proposed[1] === shownPreview.proposedResult.score2 &&
                    seReadiness.actionPlan.evidence.stageVersionVector === seSafety.stageVersionVector && (
                    <div className="mt-2 space-y-1 border-t border-border pt-2" aria-label="Hipotetyczny plan korekty SE">
                      <p className="font-medium">Plan operacji SE (tylko podgląd)</p>
                      <p>{seReadiness.actionPlan.changeType === "winner_change" ? "Zmiana zwycięzcy" :
                        seReadiness.actionPlan.changeType === "score_only" ? "Bez zmiany zwycięzcy" : "Plan zablokowany"}</p>
                      {seReadiness.actionPlan.successor && <p>Następny mecz #{seReadiness.actionPlan.successor.matchId},
                        miejsce {seReadiness.actionPlan.successor.slot === "player1" ? "1" : "2"}:
                        #{seReadiness.actionPlan.successor.previousPlayerId} → #{seReadiness.actionPlan.successor.hypotheticalPlayerId}</p>}
                      {seReadiness.actionPlan.steps.length > 0 && <ol className="ml-5 list-decimal space-y-1">
                        {seReadiness.actionPlan.steps.map(step => <li key={step.code}>{step.label}</li>)}
                      </ol>}
                      {seReadiness.actionPlan.blockerCodes.length > 0 &&
                        <p className="text-destructive">Blokady: {seReadiness.actionPlan.blockerCodes.join(", ")}</p>}
                      <p className="text-muted-foreground">{seReadiness.actionPlan.note}</p>
                      {seReadiness.diagnostic?.advisoryOnly === true &&
                       seReadiness.diagnostic.matchId === chosen?.id &&
                       seReadiness.diagnostic.expectedMatchRevision === chosen?.revision &&
                       seReadiness.diagnostic.validity === "snapshot_only" && (
                        <div className="mt-2 space-y-2 border-t border-border pt-2" aria-label="Diagnostyka korekty SE">
                          <p className="font-medium">Diagnostyka SE — Tylko podgląd</p>
                          <p className="text-muted-foreground">Identyfikator analizy: <code className="select-all break-all">{seReadiness.diagnostic.assessmentId.slice(0, 16)}</code></p>
                          <p>{seReadiness.diagnostic.issueCount === 0
                            ? "Nie wykryto blokad w tym odczycie. Wykonanie korekty SE pozostaje wyłączone."
                            : `Wykryte blokady: ${seReadiness.diagnostic.issueCount}`}</p>
                          {seReadiness.diagnostic.blockers.length > 0 && <ul className="space-y-2">
                            {seReadiness.diagnostic.blockers.map(blocker => <li key={blocker.code} className="rounded border border-border/80 p-2">
                              <p className="font-medium">{blocker.title} ({blocker.code})</p>
                              <p>{blocker.detail}</p>
                              <p className="text-muted-foreground">Co dalej: {blocker.recommendation}</p>
                            </li>)}
                          </ul>}
                          {seReadiness.diagnostic.recommendedNextActions.length > 0 &&
                            <p className="text-muted-foreground">Następny krok: {seReadiness.diagnostic.recommendedNextActions[0]}</p>}
                          <p className="text-muted-foreground">{seReadiness.diagnostic.note}</p>
                          {seReadiness.impactGraph?.kind === "se_correction_impact_graph" &&
                           seReadiness.impactGraph.advisoryOnly === true &&
                           seReadiness.impactGraph.executionEnabled === false &&
                           seReadiness.impactGraph.writePerformed === false &&
                           seReadiness.impactGraph.matchId === chosen?.id && (
                            <section aria-label="Wpływ korekty SE na dalsze rundy i etapy" className="mt-3 space-y-2 rounded border border-border p-3">
                              <p className="font-medium">Hipotetyczny wpływ na turniej — tylko podgląd</p>
                              <p>{seReadiness.impactGraph.status === "incomplete"
                                ? "Niekompletny graf: nie wolno zakładać braku skutków."
                                : `Bezpośredni następca: ${seReadiness.impactGraph.directSuccessorCount}, możliwe kolejne mecze: ${seReadiness.impactGraph.potentialLaterMatchCount}.`}</p>
                              <p>Rozpoczęte lub zakończone mecze na możliwej ścieżce: {seReadiness.impactGraph.startedDownstreamCount}</p>
                              {seReadiness.impactGraph.downstreamMatches.length > 0 && <ol className="space-y-1">
                                {seReadiness.impactGraph.downstreamMatches.map(item => (
                                  <li key={item.matchId}>Runda {item.round}, mecz #{item.matchNumber}: {item.relationship === "direct_successor_slot" ? "Bezpośrednio" : "Potencjalnie"}: {item.label} ({item.slot === "player1" ? "slot 1" : "slot 2"}){item.alreadyStarted ? " — rozpoczęty/zakończony" : ""}</li>
                                ))}
                              </ol>}
                              {seReadiness.impactGraph.laterStages.length > 0 && (
                                <p>Etapy wymagające osobnej oceny routingu/raportów: {seReadiness.impactGraph.laterStages.map(item => `${item.position} (${item.status})`).join(", ")}</p>
                              )}
                              {seReadiness.impactGraph.warnings.length > 0 && <ul className="space-y-1 text-amber-600">
                                {seReadiness.impactGraph.warnings.map((warning, i) => <li key={`${i}-${warning}`}>{warning}</li>)}
                              </ul>}
                              {seReadiness.impactRiskReport?.kind === "se_correction_impact_risk_report" &&
                               seReadiness.impactRiskReport.advisoryOnly === true &&
                               seReadiness.impactRiskReport.executionEnabled === false &&
                               seReadiness.impactRiskReport.writePerformed === false &&
                               seReadiness.impactRiskReport.matchId === seReadiness.impactGraph.matchId &&
                               seReadiness.impactGraph.matchId === chosen?.id && (
                                <section className="mt-3 space-y-2 border-t border-border pt-3" aria-label="Raport ryzyka hipotetycznej korekty SE">
                                  <p className="font-medium">Ryzyka i dalsze kontrole — tylko podgląd</p>
                                  <p>{seReadiness.impactRiskReport.status === "incomplete"
                                    ? "Brak pewności co do zasięgu skutków: odśwież analizę."
                                    : `Najwyższy poziom ryzyka: ${seReadiness.impactRiskReport.highestSeverity}.`}</p>
                                  <ul className="space-y-2">
                                    {seReadiness.impactRiskReport.items.map((risk,index) => (
                                      <li key={`${risk.code}-${index}`}>
                                        <strong>{risk.severity === "critical" ? "Krytyczne" : risk.severity === "high" ? "Wysokie" : risk.severity === "medium" ? "Średnie" : "Niskie"}: {risk.message}</strong>
                                        <p className="text-sm text-muted-foreground">{risk.recommendedCheck}</p>
                                        {risk.affectedMatchIds.length > 0 && <p className="text-xs">Mecze: {risk.affectedMatchIds.join(", ")}</p>}
                                        {risk.affectedStageIds.length > 0 && <p className="text-xs">Etapy: {risk.affectedStageIds.join(", ")}</p>}
                                        <p className="text-xs text-muted-foreground">{risk.evidence === "confirmed_in_snapshot" ? "Potwierdzone w odczycie" : risk.evidence === "potential_impact" ? "Możliwy wpływ" : "Niekompletne dane"}</p>
                                      </li>
                                    ))}
                                  </ul>
                                  <p className="text-xs text-muted-foreground">{seReadiness.impactRiskReport.note}</p>
                                </section>
                               )}
                              <p className="text-xs text-muted-foreground">{seReadiness.impactGraph.note}</p>
                            </section>
                           )}
                          {seAssessmentPair?.current.diagnostic.assessmentId === seReadiness.diagnostic.assessmentId &&
                           seAssessmentComparison && (
                            <div className="mt-2 space-y-2 rounded-md border border-border/80 bg-background/50 p-2" aria-label="Porównanie analiz SE">
                              <p className="font-medium">Zmiany od poprzedniej analizy SE</p>
                              {seAssessmentComparison.kind === "no_baseline" &&
                                <p className="text-muted-foreground">Pierwszy podgląd tej korekty. Uruchom analizę ponownie, aby porównać dwa odczyty.</p>}
                              {(seAssessmentComparison.kind === "different_scope" || seAssessmentComparison.kind === "inconsistent") &&
                                <p role="alert" className="text-amber-600 dark:text-amber-400">{seAssessmentComparison.message}</p>}
                              {seAssessmentComparison.kind === "identical" &&
                                <p>Obydwa odczyty mają ten sam identyfikator i zestaw blokad.</p>}
                              {seAssessmentComparison.kind === "changed" && <>
                                <p>Poprzednio: {seAssessmentComparison.previousStatus === "candidate" ? "kandydat" : "zablokowano"}; teraz: {seAssessmentComparison.currentStatus === "candidate" ? "kandydat" : "zablokowano"}.</p>
                                {seAssessmentComparison.revisionChanged && <p>Zmieniono rewizję meczu.</p>}
                                {seAssessmentComparison.stageVectorChanged && <p>Zmieniono stan meczów etapu.</p>}
                                {seAssessmentComparison.completionActionChanged && <p>Zmieniono aktywne potwierdzenie wyniku.</p>}
                                <p>Dodane blokady: {seAssessmentComparison.added.length ? seAssessmentComparison.added.map(b => b.title).join(", ") : "brak"}.</p>
                                <p>Usunięte z podglądu: {seAssessmentComparison.resolved.length ? seAssessmentComparison.resolved.map(b => b.title).join(", ") : "brak"}.</p>
                                <p>Nadal obecne: {seAssessmentComparison.continuing.length ? seAssessmentComparison.continuing.map(b => b.title).join(", ") : "brak"}.</p>
                              </>}
                              <p className="text-muted-foreground">Porównanie jest wyłącznie informacyjne. Nie jest to zgoda na zapis ani dowód, że problemy zostały trwale naprawione.</p>
                              {seAssessmentHistorySummary.currentAssessmentId === seReadiness.diagnostic.assessmentId && (
                                <section aria-label="Historia diagnostyki SE" className="mt-3 space-y-2 border-t border-border pt-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="font-medium">Historia tej korekty (bieżąca sesja)</p>
                                    <button type="button" className="rounded border border-border px-2 py-1 text-xs hover:bg-muted"
                                      onClick={() => { setSeAssessmentHistory(emptySeAssessmentHistory()); setSeAssessmentPair(null); }}>
                                      Wyczyść historię
                                    </button>
                                  </div>
                                  <p>Zachowano {seAssessmentHistorySummary.count} analiz (maks. 12); odrzucono najstarsze: {seAssessmentHistorySummary.evicted}.</p>
                                  <p>Zmiany rewizji meczu: {seAssessmentHistorySummary.revisionChanges}; stanu etapu: {seAssessmentHistorySummary.stageVectorChanges}; potwierdzenia wyniku: {seAssessmentHistorySummary.completionActionChanges}.</p>
                                  <p>Blokady obecne w każdej zachowanej analizie: {seAssessmentHistorySummary.persistentCodes.length ? seAssessmentHistorySummary.persistentCodes.join(", ") : "brak"}.</p>
                                  <p>Powracające blokady: {seAssessmentHistorySummary.reappeared.length}.</p>
                                  {seAssessmentHistorySummary.events.length > 0 && (
                                    <ul className="space-y-1 text-xs">
                                      {seAssessmentHistorySummary.events.slice(-6).map((event, index) => (
                                        <li key={`${event.assessmentId}-${event.code}-${event.type}-${index}`}>
                                          {event.type === "reappeared" ? "Ponownie wykryto" : event.type === "introduced" ? "Nowa blokada" : "Nieobecna w kolejnym odczycie"}: {event.title} ({event.code})
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                  <p className="text-xs text-muted-foreground">{seAssessmentHistorySummary.advisoryNote}</p>
                                  {seRemediationPriority && seAssessmentHistorySummary.currentAssessmentId === seReadiness.diagnostic.assessmentId && (
                                    <section aria-label="Priorytety naprawy SE" className="mt-3 space-y-2 border-t border-border pt-2">
                                      <p className="font-medium">Kolejność weryfikacji problemów</p>
                                      {seRemediationPriority.status === "inconsistent" ? (
                                        <p className="text-destructive">Niespójna historia analiz. Wyczyść historię i ponów ocenę.</p>
                                      ) : seRemediationPriority.status === "no_blockers" ? (
                                        <p>Brak blokad w bieżącym podglądzie. Wykonywanie korekt SE nadal jest wyłączone.</p>
                                      ) : (
                                        <ol className="space-y-2 text-xs">
                                          {seRemediationPriority.steps.map((step, index) => (
                                            <li key={step.id} className="rounded border border-border p-2">
                                              <p className="font-medium">{index + 1}. {step.title} — {step.priority === "critical" ? "krytyczny" : step.priority === "high" ? "wysoki" : step.priority === "medium" ? "średni" : "ocena ręczna"}</p>
                                              <p>{step.instruction}</p>
                                              <p>Blokady: {step.codes.join(", ")}</p>
                                              {step.dependsOn.length > 0 && <p>Najpierw: {step.dependsOn.join(", ")}</p>}
                                              {step.recurringCodes.length > 0 && <p className="text-amber-600">Powracające w historii: {step.recurringCodes.join(", ")}</p>}
                                              {step.persistentCodes.length > 0 && <p>Obecne w całej historii: {step.persistentCodes.join(", ")}</p>}
                                            </li>
                                          ))}
                                        </ol>
                                      )}
                                      <p className="text-xs text-muted-foreground">{seRemediationPriority.note}</p>
                                    </section>
                                  )}
                                </section>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}
      {shownPreview && shownPreview.version === 1 && shownPreview.advisory && shownPreview.mutationPerformed === false && (
        <section className="mt-4 rounded-lg border border-border bg-card/60 p-3" aria-label="Wynik analizy korekty">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {shownPreview.state === "blocked" ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <ShieldCheck className="h-4 w-4 text-amber-500" />}
            {shownPreview.state === "blocked" ? "Standardowa korekta jest zablokowana" : "Korekta wymaga osobnego zatwierdzenia"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Mecz #{shownPreview.matchId}: {shownPreview.existingResult.score1 ?? "?"}:{shownPreview.existingResult.score2 ?? "?"} → {shownPreview.proposedResult.score1}:{shownPreview.proposedResult.score2}
            {shownPreview.proposedResult.winnerChanges === true ? " · zmiana zwycięzcy" : shownPreview.proposedResult.winnerChanges === false ? " · ten sam zwycięzca" : ""}
          </p>
          {shownPreview.issues.length > 0 && <ul className="mt-3 space-y-1">
            {shownPreview.issues.map((issue, index) => <li key={`${issue.code}-${index}`} className={`text-xs ${issue.severity === "block" ? "text-destructive" : "text-muted-foreground"}`}>
              {issue.severity === "block" ? "Blokada" : "Wymaga kontroli"}: {issue.message}
            </li>)}
          </ul>}
          <ul className="mt-3 space-y-1" aria-label="Przewidywane skutki">
            {shownPreview.effects.map((effect, index) => <li className="text-xs text-muted-foreground" key={`${effect.code}-${index}`}>
              {effect.certainty === "conditional" ? "Możliwy skutek: " : "Potwierdzone: "}{effect.message}
            </li>)}
          </ul>
          {shownPreview.standingsComparison && (
            <details className="mt-3 rounded-md border border-border/80 p-3" open>
              <summary className="cursor-pointer text-xs font-semibold">Klasyfikacja: przed / po (symulacja)</summary>
              {shownPreview.standingsComparison.status === "unavailable" ? (
                <p className="mt-2 text-xs text-muted-foreground">{shownPreview.standingsComparison.message}</p>
              ) : (() => {
                const comparison = shownPreview?.standingsComparison as Extract<ResultCorrectionStandingsComparison, { status: "available" }>;
                const changedRows = comparison.diff.rows.filter(row => row.changed);
                const participantLabel = (id: number) => comparison.diff.rows.find(row => row.playerId === id)?.playerName ?? `#${id}`;
                return <div className="mt-2 space-y-2">
                  <p className="text-xs text-muted-foreground">Zakres: {comparison.scope === "group" ? `grupa ${comparison.scopeLabel}` : comparison.scopeLabel} · Zmiana pozycji: {comparison.diff.movedRows} · Zmiana statystyk: {comparison.diff.changedRows}</p>
                  {changedRows.length > 0 ? <div className="overflow-x-auto"><table className="w-full text-left text-xs">
                    <thead><tr className="border-b border-border/70">
                      <th scope="col" className="p-1.5">Uczestnik</th>
                      <th scope="col" className="p-1.5">Miejsce</th>
                      <th scope="col" className="p-1.5">Wygrane</th>
                      <th scope="col" className="p-1.5">Bilans map</th>
                    </tr></thead>
                    <tbody>{changedRows.slice(0, 12).map(row => <tr key={row.playerId} className="border-b border-border/40">
                      <th scope="row" className="p-1.5 font-medium">{row.playerName}</th>
                      <td className="p-1.5 tabular-nums">{row.beforeRank} → {row.afterRank}{row.rankDelta !== 0 ? ` (${row.rankDelta > 0 ? "+" : ""}${row.rankDelta})` : ""}</td>
                      <td className="p-1.5 tabular-nums">{row.beforeMatchWins} → {row.afterMatchWins}</td>
                      <td className="p-1.5 tabular-nums">{row.beforeGameDiff} → {row.afterGameDiff}</td>
                    </tr>)}</tbody>
                  </table></div> : <p className="text-xs text-muted-foreground">Brak zmian w rankingu i statystykach.</p>}
                  {changedRows.length > 12 && <p className="text-xs text-muted-foreground">Pokazano 12 z {changedRows.length} zmienionych pozycji.</p>}
                  {comparison.diff.qualifierImpact.status === "projected" && (
                    <div className="rounded-md border border-border/60 p-2 text-xs">
                      <p className="font-medium">Hipotetyczny awans — najlepszych {comparison.diff.qualifierImpact.cutoff}</p>
                      <p className="mt-1">Nowi w strefie awansu: {comparison.diff.qualifierImpact.gainingPlayerIds.length ? comparison.diff.qualifierImpact.gainingPlayerIds.map(participantLabel).join(", ") : "brak"}</p>
                      <p>Wypadają ze strefy awansu: {comparison.diff.qualifierImpact.losingPlayerIds.length ? comparison.diff.qualifierImpact.losingPlayerIds.map(participantLabel).join(", ") : "brak"}</p>
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground">{comparison.note}</p>
                </div>;
              })()}
            </details>
          )}
          {shownPreview.bracketImpact?.status === "available" && (
            <details className="mt-3 rounded-md border border-border/80 p-3" open>
              <summary className="cursor-pointer text-xs font-semibold">Drabinka SE: skutki zmiany zwycięzcy (hipotetyczne)</summary>
              {(() => {
                const impact = shownPreview.bracketImpact as Extract<EliminationBracketImpact, { status: "available" }>;
                return <div className="mt-2 space-y-2 text-xs">
                  <p className="text-muted-foreground">{impact.winnerChanges
                    ? "Zmiana zwycięzcy może wpłynąć na obsadę następnego meczu."
                    : "Zwycięzca się nie zmienia: obsada dalszych meczów nie zmienia się z powodu samego wyniku punktowego."}</p>
                  {impact.directSlot && <div className="rounded-md border border-border/60 p-2">
                    <p className="font-medium">Mecz #{impact.directSlot.matchId}, runda {impact.directSlot.round}, {impact.directSlot.slot === "player1" ? "pierwsze" : "drugie"} miejsce</p>
                    <p className="mt-1">Obecnie uczestnik #{impact.directSlot.currentPlayerId ?? "?"} → hipotetycznie #{impact.directSlot.hypotheticalPlayerId}</p>
                    <p className="mt-1 text-muted-foreground">{impact.directSlot.pristine
                      ? "Aktualny stan meczu nie wskazuje na jego rozpoczęcie; zatwierdzenie wymaga ponownej kontroli transakcyjnej."
                      : "Zależny mecz ma zmieniony stan lub niespójną obsadę — zwykła korekta może być zablokowana."}</p>
                  </div>}
                  {impact.finalRoundWinnerMayChange && <p className="font-medium text-amber-600 dark:text-amber-400">Zmiana zwycięzcy meczu finałowego może zmienić mistrza etapu.</p>}
                  {impact.possibleDownstream.length > 0 && <div>
                    <p className="font-medium">Kolejne powiązane mecze ({impact.possibleDownstream.length})</p>
                    <ul className="mt-1 space-y-1">{impact.possibleDownstream.map(item => <li key={item.matchId} className="text-muted-foreground">
                      R{item.round} · M{item.matchNumber} · #{item.matchId} — {item.relation === "direct_slot" ? "bezpośrednie miejsce zwycięzcy" : "możliwa dalsza zależność"}{item.blocking ? " · mecz już użyty lub niespójny" : ""}
                    </li>)}</ul>
                  </div>}
                  {!impact.chainComplete && <p className="font-medium text-amber-600 dark:text-amber-400">Łańcuch zależności jest niepełny — brak pewnego powiązania wszystkich rund.</p>}
                  {impact.issues.length > 0 && <ul className="space-y-1" aria-label="Niepewności analizy drabinki">
                    {impact.issues.map(item => <li key={item.code} className="text-amber-600 dark:text-amber-400">{item.message}</li>)}
                  </ul>}
                  <p className="text-[11px] text-muted-foreground">{impact.note}</p>
                </div>;
              })()}
            </details>
          )}
          {shownPreview.doubleEliminationImpact && (
            <details className="mt-3 rounded-md border border-border/80 p-3" open>
              <summary className="cursor-pointer text-xs font-semibold">Drabinka DE — symulacja routingu v2</summary>
              {shownPreview.doubleEliminationImpact.status === "unavailable" ? (
                <p className="mt-2 text-xs text-muted-foreground">{shownPreview.doubleEliminationImpact.message}</p>
              ) : (() => {
                const impact = shownPreview.doubleEliminationImpact as Extract<DoubleEliminationImpact, {status: "available"}>;
                return <div className="mt-2 space-y-2 text-xs">
                  <p className="text-muted-foreground">Plan v{impact.planRevision} · wykonanie v{impact.executionRevision} · zmienione mecze logiczne: {impact.affectedMatches.length}.</p>
                  <p>Hipotetyczny zwycięzca: #{impact.currentWinnerId} → #{impact.proposedWinnerId}. {impact.winnerChanges ? "Zmienia się zwycięzca." : "Obsada powinna pozostać bez zmian."}</p>
                  {impact.invalidatedDecisions.length > 0 && (
                    <p className="font-medium text-amber-600 dark:text-amber-400">Symulacja unieważnia {impact.invalidatedDecisions.length} wcześniej zapisanych decyzji, w tym {impact.invalidatedDecisions.filter(x=>x.canonicalMatchAlreadyCompleted).length} wyników zakończonych meczów.</p>
                  )}
                  <ul className="space-y-1" aria-label="Zmiany w meczach Double Elimination">
                    {impact.affectedMatches.slice(0, 15).map(item => <li key={item.matchKey} className="rounded border border-border/60 p-2">
                      <span className="font-semibold">{item.label}</span> · {item.currentStatus} → {item.hypotheticalStatus}
                      <span className="block text-muted-foreground">[{item.currentSlots.map(x=>x ?? "?").join(" / ")}] → [{item.hypotheticalSlots.map(x=>x ?? "?").join(" / ")}]</span>
                      {item.canonicalMatchAlreadyCompleted && item.matchKey !== impact.sourceMatchKey && <span className="block text-amber-600 dark:text-amber-400">Dotyczy już rozegranego meczu.</span>}
                    </li>)}
                  </ul>
                  {impact.affectedMatches.length > 15 && <p className="text-muted-foreground">Pokazano pierwszych 15 z {impact.affectedMatches.length} meczów.</p>}
                  {impact.warningCodes.length > 0 && <p className="text-amber-600 dark:text-amber-400">Ostrzeżenia: {impact.warningCodes.join(", ")}.</p>}
                  <p className="text-[11px] text-muted-foreground">{impact.note}</p>
                </div>;
              })()}
            </details>
          )}
          {shownPreview.bracketImpact?.status === "unavailable" && shownPreview.bracketImpact.reasonCode === "DE_RUNTIME_REQUIRED" && !shownPreview.doubleEliminationImpact && (
            <p className="mt-3 rounded-md border border-border/80 p-3 text-xs text-muted-foreground">Drabinka DE: {shownPreview.bracketImpact.message}</p>
          )}
          {shownPreview.downstreamMatchIds.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Wykryte zależne mecze: {shownPreview.downstreamMatchIds.join(", ")}</p>}
          {shownPreview.recoveryPlan && shownPreview.recoveryPlan.advisory && shownPreview.recoveryPlan.executable === false && (
            <details className="mt-3 rounded-md border border-border/80 p-3" open>
              <summary className="cursor-pointer text-xs font-semibold">Plan odzyskiwania — do zatwierdzenia przez organizatora</summary>
              <div className="mt-2 space-y-2 text-xs">
                <p className={shownPreview.recoveryPlan.status === "blocked" || shownPreview.recoveryPlan.status === "stale"
                  ? "font-semibold text-destructive" : "font-semibold"}>
                  Stan: {shownPreview.recoveryPlan.status === "stale" ? "Podgląd nieaktualny"
                    : shownPreview.recoveryPlan.status === "blocked" ? "Wstrzymany — wymagane rozwiązanie blokad"
                    : shownPreview.recoveryPlan.status === "no_change" ? "Brak zmiany wyniku"
                    : "Wymaga ręcznej kontroli i zatwierdzenia"}
                  {` · Ryzyko: ${shownPreview.recoveryPlan.risk}`}
                </p>
                {shownPreview.recoveryPlan.blockerCodes.length > 0 && (
                  <p className="text-destructive">Blokady: {shownPreview.recoveryPlan.blockerCodes.join(", ")}</p>
                )}
                <p className="text-muted-foreground">
                  Mecze zależne: {shownPreview.recoveryPlan.affected.knownDownstreamMatchIds.length}
                  {` · Powiązane logiczne: ${shownPreview.recoveryPlan.affected.possibleAffectedLogicalMatches}`}
                  {` · Potencjalnie unieważnione zakończone wyniki: ${shownPreview.recoveryPlan.affected.potentiallyInvalidatedCompletedResults}`}
                </p>
                {shownPreview.recoveryPlan.approvalQuestions.length > 0 && <ul className="space-y-1" aria-label="Pytania do zatwierdzenia">
                  {shownPreview.recoveryPlan.approvalQuestions.map((question, index) => <li key={index}>• {question}</li>)}
                </ul>}
                <ol className="list-decimal space-y-2 pl-4" aria-label="Etapy planu naprawy">
                  {shownPreview.recoveryPlan.steps.map(item => <li key={item.id}>
                    <span className="font-semibold">{item.title}</span>
                    {item.mutation && <span className="ml-1 text-amber-600 dark:text-amber-400">(wyłącznie ręcznie)</span>}
                    <p className="text-muted-foreground">{item.instruction}</p>
                  </li>)}
                </ol>
                <p className="text-[11px] text-muted-foreground">{shownPreview.recoveryPlan.note}</p>
              </div>
            </details>
          )}
          {shownPreview.boundedRevertCandidate?.supported &&
            shownPreview.recoveryPlan?.status === "manual_review" &&
            shownPreview.previewGuard?.status === "stable_on_recheck" &&
            shownPreview.recoveryPlan.evidence.stageVersionVector &&
            shownPreview.boundedRevertCandidate.expectedCompletionActionId != null && (
            <div className="mt-3 space-y-2 rounded-lg border border-amber-500/40 p-3 text-xs">
              <p className="font-semibold">Pack 15: dwa etapy — zapisz zgodę, następnie wykonaj atomową korektę Round Robin</p>
              <p className="text-muted-foreground">Ta operacja cofnie obecny wynik i zapisze nowy w JEDNEJ transakcji. Jeśli nowy zapis nie powiedzie się, poprzedni wynik pozostanie nienaruszony.</p>
              <label className="flex items-start gap-2"><input type="checkbox" checked={approveRevert} onChange={e=>setApproveRevert(e.target.checked)}/>
                <span>Potwierdzam, że zweryfikowałem wynik źródłowy i świadomie zgadzam się na cofnięcie.</span></label>
              <label className="flex items-start gap-2"><input type="checkbox" checked={acceptResubmission} onChange={e=>setAcceptResubmission(e.target.checked)}/>
                <span>Rozumiem, że wykonanie jest atomowe i może zostać odrzucone, jeśli dane zmieniły się od podglądu.</span></label>
              <Button type="button" variant="outline" size="sm" disabled={!approveRevert||!acceptResubmission||prepare.isPending||pendingIntent?.confirmed === true}
                onClick={()=>{if(!chosen||!shownPreview.boundedRevertCandidate?.expectedCompletionActionId||!shownPreview.recoveryPlan?.evidence.stageVersionVector) return;
                  const operationId = pendingIntent?.operationId ?? candidateId ?? crypto.randomUUID();setCandidateId(operationId);
                  const pending = {operationId, matchId: chosen.id, confirmed: false};
                  setPendingIntent(pending);window.sessionStorage.setItem(storageKey, JSON.stringify(pending));
                  prepare.mutate({operationId, matchId:chosen.id,expectedRevision:shownPreview.expectedRevision,
                    expectedCompletionActionId:shownPreview.boundedRevertCandidate.expectedCompletionActionId,
                    proposedScore1, proposedScore2,
                    expectedStageVersionVector:shownPreview.recoveryPlan.evidence.stageVersionVector,
                    approvedByOrganizer:true,understandsRequiresResubmission:true});}}>
                {prepare.isPending?"Zapisywanie zgody…":"Krok 1: Zapisz zatwierdzenie (bez zmiany wyniku)"}
              </Button>
            </div>
          )}
          <p className="mt-3 text-xs font-medium">{shownPreview.recommendedAction}</p>
          <Link className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            href={tournamentModeHref(`/tournaments/${tournamentId}/host?tab=korekta`, experimental)}>
            Otwórz istniejący panel korekt <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <p className="mt-2 text-[11px] text-muted-foreground">Podgląd nie stanowi autoryzacji. Między odczytem a wykonaniem dane mogą się zmienić. Backend ponownie sprawdzi je transakcyjnie.</p>
        </section>)}
    </details>
  );
}
