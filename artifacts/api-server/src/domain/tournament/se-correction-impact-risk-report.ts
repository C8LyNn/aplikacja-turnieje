/** Pack 26: conservative, read-only impact RISK report for advisory Single Elimination correction.
 * Consumes the Pack25 graph, never turns a preview into permission to execute.
 * Does not read, write or mutate the supplied graph or database.
 */
import type { SeImpactGraph } from "./se-correction-impact-graph";

type RiskSeverity = "critical" | "high" | "medium" | "low";
type RiskScope = "data" | "match" | "stage" | "reporting";
export type SeImpactRiskCode =
  | "graph_invalid" | "graph_incomplete" | "change_type_unknown"
  | "started_downstream" | "readiness_review" | "later_stage_advanced"
  | "cross_stage_boundary" | "possible_participant_path"
  | "score_reporting" | "limited_scope";
export interface SeImpactRiskItem {
  code: SeImpactRiskCode;
  severity: RiskSeverity;
  scope: RiskScope;
  evidence: "confirmed_in_snapshot" | "potential_impact" | "incomplete_information";
  message: string;
  recommendedCheck: string;
  affectedMatchIds: number[];
  affectedStageIds: number[];
}
export interface SeImpactRiskReport {
  version: 1;
  kind: "se_correction_impact_risk_report";
  advisoryOnly: true;
  executionEnabled: false;
  writePerformed: false;
  matchId: number;
  status: "incomplete" | "requires_review" | "observational";
  highestSeverity: RiskSeverity;
  items: SeImpactRiskItem[];
  note: string;
}
const flags = { version: 1, kind: "se_correction_impact_risk_report", advisoryOnly: true,
  executionEnabled: false, writePerformed: false } as const;
const note = "Raport ryzyka ma charakter doradczy. Nie dowodzi możliwości wykonania korekty SE, " +
  "nie przewiduje zwycięzców i nie zastępuje osobnej oceny awansów, routingu oraz audytu.";
const positive = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v > 0;
const nonnegative = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
const severities = { critical: 4, high: 3, medium: 2, low: 1 } as const;
const mk = (code: SeImpactRiskCode, severity: RiskSeverity, scope: RiskScope,
  evidence: SeImpactRiskItem["evidence"], message: string, recommendedCheck: string,
  affectedMatchIds: number[] = [], affectedStageIds: number[] = []): SeImpactRiskItem =>
  ({code,severity,scope,evidence,message,recommendedCheck,affectedMatchIds,affectedStageIds});
const invalid = (matchId: number, code: "graph_invalid" | "graph_incomplete", message: string): SeImpactRiskReport =>
  ({...flags,matchId,status:"incomplete",highestSeverity:"critical",items:[mk(code,"critical","data",
    "incomplete_information",message,"Odśwież analizę i sprawdź spójność danych meczu, etapu i drabinki.")],note});

/** Fail closed on malformed input; graph alone is NEVER an execution authorization. */
export function deriveSeCorrectionImpactRiskReport(graph: SeImpactGraph): SeImpactRiskReport {
  const g = graph as unknown as Record<string, unknown> | null;
  const matchId = positive(g?.matchId) ? g.matchId : 0;
  if (!g || g.version !== 1 || g.kind !== "se_correction_impact_graph" ||
      g.advisoryOnly !== true || g.executionEnabled !== false || g.writePerformed !== false ||
      !positive(g.matchId) || !["outlined","review_required","incomplete"].includes(String(g.status)) ||
      !["winner_change","score_only","unknown"].includes(String(g.changeType)) ||
      !Array.isArray(g.downstreamMatches) || g.downstreamMatches.length > 32 ||
      !Array.isArray(g.laterStages) || g.laterStages.length > 128 ||
      !Array.isArray(g.warnings) || g.warnings.length > 256 ||
      !g.warnings.every((w: unknown) => typeof w === "string" && w.length <= 1024) ||
      !nonnegative(g.directSuccessorCount) || !nonnegative(g.potentialLaterMatchCount) ||
      !nonnegative(g.startedDownstreamCount)) {
    return invalid(matchId,"graph_invalid","Niespójne metadane grafu wpływu — nie można ustalić zakresu ryzyka.");
  }
  if (g.status === "incomplete") return invalid(matchId,"graph_incomplete",
    "Graf wpływu jest niekompletny — brakujące zależności mogą ukrywać rzeczywiste skutki.");
  if (!positive(g.stageId) || !positive(g.sourceRound) ||
      (g.changeType === "unknown" && g.status !== "review_required")) {
    return invalid(matchId,"graph_invalid","Nieprawidłowy identyfikator etapu, rundy albo klasyfikacja zmiany.");
  }
  const paths = g.downstreamMatches as unknown[];
  const stages = g.laterStages as unknown[];
  const pathIds = new Set<number>();
  const stageIds = new Set<number>();
  const stagePositions = new Set<number>();
  let first = 0, further = 0, started = 0;
  const coordinates = new Set<string>();
  let previousRound = g.sourceRound as number;
  const startedIds: number[] = [];
  for (const item of paths) {
    const p = item as Record<string, unknown> | null;
    if (!p || !positive(p.matchId) || pathIds.has(p.matchId) || p.matchId === matchId ||
        !positive(p.round) || p.round <= g.sourceRound || !positive(p.matchNumber) ||
        !["player1","player2"].includes(String(p.slot)) ||
        !["direct_successor_slot","potential_later_path"].includes(String(p.relationship)) ||
        typeof p.alreadyStarted !== "boolean" || typeof p.label !== "string") {
      return invalid(matchId,"graph_invalid","Niespójne rekordy meczów zależnych.");
    }
    const coordinate = `${p.round}:${p.matchNumber}`;
    if (coordinates.has(coordinate) || p.round !== previousRound + 1 ||
        (paths.indexOf(item) === 0 && p.relationship !== "direct_successor_slot") ||
        (paths.indexOf(item) > 0 && p.relationship !== "potential_later_path")) {
      return invalid(matchId,"graph_invalid","Niespójna kolejność, powtórzone pozycje lub nieciągła ścieżka drabinki.");
    }
    coordinates.add(coordinate);
    previousRound = p.round as number;
    pathIds.add(p.matchId);
    if (p.relationship === "direct_successor_slot") first++; else further++;
    if (p.alreadyStarted) {started++;startedIds.push(p.matchId);}
  }
  for (const item of stages) {
    const s = item as Record<string, unknown> | null;
    if (!s || !positive(s.stageId) || s.stageId === g.stageId || stageIds.has(s.stageId) ||
        !positive(s.position) || stagePositions.has(s.position) || typeof s.status !== "string" ||
        s.relationship !== "possible_reporting_or_routing_dependency") {
      return invalid(matchId,"graph_invalid","Niespójne metadane późniejszych etapów.");
    }
    stageIds.add(s.stageId);
    stagePositions.add(s.position);
  }
  if (first > 1 || first !== g.directSuccessorCount || further !== g.potentialLaterMatchCount ||
      started !== g.startedDownstreamCount ||
      (g.changeType === "score_only" && paths.length > 0) ||
      (paths.length > 0 && first !== 1) ||
      (g.status === "outlined" && (started > 0 || g.changeType === "unknown"))) {
    return invalid(matchId,"graph_invalid","Sprzeczne liczniki lub relacje w grafie wpływu.");
  }
  const entries: SeImpactRiskItem[] = [];
  if (g.changeType === "unknown") entries.push(mk("change_type_unknown","critical","data",
    "incomplete_information","Nie ustalono, czy korekta zmieni zwycięzcę.",
    "Potwierdź wynik i identyfikator zwycięzcy w spójnym odczycie."));
  if (startedIds.length) entries.push(mk("started_downstream","critical","match",
    "confirmed_in_snapshot",`W ${startedIds.length} meczu/meczach na możliwej ścieżce rozpoczęto lub zakończono grę.`,
    "Sprawdź ręcznie wyniki i faktyczne zależności tych meczów; nie zmieniaj automatycznie obsady.",startedIds));
  if (g.status === "review_required") entries.push(mk("readiness_review","high","data",
    "confirmed_in_snapshot","Istnieją zastrzeżenia w analizie wpływu lub jej warunkach wstępnych.",
    "Wróć do szczegółowych ostrzeżeń i blokad gotowości; nie traktuj tego raportu jako zgody na korektę."));
  const advancedStages = (stages as Array<{stageId:number;status:string}>).filter(s => s.status !== "planned").map(s => s.stageId);
  if (advancedStages.length) entries.push(mk("later_stage_advanced","high","stage",
    "confirmed_in_snapshot",`Późniejsze etapy nie są już w stanie planowanym (${advancedStages.length}).`,
    "Zweryfikuj obsadę, zatwierdzone awanse i routing każdego wskazanego etapu.",[],advancedStages));
  if (stages.length) entries.push(mk("cross_stage_boundary","medium","stage",
    "potential_impact","Istnieją późniejsze etapy; ich powiązań nie można dowieść samym grafem SE.",
    "Osobno skontroluj reguły kwalifikacji oraz routing między etapami.",[],[...stageIds]));
  if (g.changeType === "winner_change" && paths.length) entries.push(mk("possible_participant_path","medium","match",
    "potential_impact",`Zmiana zwycięzcy może wpłynąć na ${paths.length} spotkań na dalszej ścieżce.`,
    "Sprawdź najpierw bezpośredni slot; dalsze mecze są tylko możliwymi zależnościami.",[...pathIds]));
  if (g.changeType === "score_only") entries.push(mk("score_reporting","medium","reporting",
    "potential_impact","Zmiana samych punktów może wpłynąć na raporty i zatwierdzenia.",
    "Sprawdź widoki wyników, historię i zatwierdzone kwalifikacje, bez zmiany uczestników."));
  if (!entries.length) entries.push(mk("limited_scope","low","reporting",
    "potential_impact","W ograniczonym grafie nie wykryto dalszej ścieżki ani aktywnych etapów.",
    "Nie zakładaj, że cała korekta jest bezpieczna: nadal obowiązują blokady głównej analizy."));
  entries.sort((a,b) => severities[b.severity]-severities[a.severity] || a.code.localeCompare(b.code));
  return {...flags,matchId,status:entries.some(e=>severities[e.severity]>=3)?"requires_review":"observational",
    highestSeverity:entries[0].severity,items:entries,note};
}
