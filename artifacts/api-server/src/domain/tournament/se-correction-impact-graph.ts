/** Pack 25: bounded, non-authoritative forward-impact graph for Single Elimination corrections.
 * Pure function; NEVER writes, predicts future winners, or authorizes a correction.
 * The caller must supply rows from the SAME consistent read-only transaction.
 */
export interface ImpactMatchRow {
  id: number;
  stageId: number;
  round: number;
  matchNumber: number;
  status: string;
  resultType: string | null;
  score1: number | null;
  score2: number | null;
  winnerId: number | null;
  player1Id: number | null;
  player2Id: number | null;
  completedAt: Date | string | null;
}
export interface ImpactStageRow {
  id: number;
  position: number;
  format: string;
  status: string;
  totalRounds: number | null;
}
export interface ImpactActionPlan {
  kind: "se_correction_advisory_plan";
  advisoryOnly: true;
  executionEnabled: false;
  writePerformed: false;
  state: "candidate" | "blocked";
  changeType: "winner_change" | "score_only" | "unknown";
  matchId: number;
}
export interface ImpactGraphInput {
  matchId: number;
  stage: ImpactStageRow;
  stages: readonly ImpactStageRow[];
  stageMatches: readonly ImpactMatchRow[];
  actionPlan: ImpactActionPlan;
  qualificationCommitted: boolean;
  routingCommitted: boolean;
}
export interface ImpactNode {
  matchId: number;
  round: number;
  matchNumber: number;
  slot: "player1" | "player2";
  relationship: "direct_successor_slot" | "potential_later_path";
  alreadyStarted: boolean;
  label: string;
}
export interface ImpactStageSummary {
  stageId: number;
  position: number;
  status: string;
  relationship: "possible_reporting_or_routing_dependency";
}
export interface SeImpactGraph {
  version: 1;
  kind: "se_correction_impact_graph";
  advisoryOnly: true;
  executionEnabled: false;
  writePerformed: false;
  status: "outlined" | "review_required" | "incomplete";
  matchId: number;
  stageId: number | null;
  changeType: "winner_change" | "score_only" | "unknown";
  sourceRound: number | null;
  downstreamMatches: readonly ImpactNode[];
  laterStages: readonly ImpactStageSummary[];
  directSuccessorCount: number;
  potentialLaterMatchCount: number;
  startedDownstreamCount: number;
  warnings: readonly string[];
  note: string;
}
const FLAGS = { version: 1, kind: "se_correction_impact_graph", advisoryOnly: true,
  executionEnabled: false, writePerformed: false } as const;
const NOTE = "To hipotetyczna ścieżka możliwego wpływu, nie lista pewnych zmian: przyszłych zwycięzców nie można przewidzieć. " +
  "Późniejsze etapy to granica wymagająca odrębnej oceny routingu i kwalifikacji. " +
  "Korekta SE pozostaje wyłączona; przyszły zapis wymaga ponownej walidacji w osobnej transakcji.";
const positive = (x: unknown): x is number => Number.isSafeInteger(x) && typeof x === "number" && x > 0;
const nonnegative = (x: unknown): x is number => Number.isSafeInteger(x) && typeof x === "number" && x >= 0;
const validDate = (x: unknown) => x == null || ((typeof x === "string" || x instanceof Date) && Number.isFinite(new Date(x).getTime()));
const MAX_MATCHES = 2048;
const MAX_STAGES = 128;
const MAX_ROUNDS = 32;

function incomplete(input: ImpactGraphInput, reason: string): SeImpactGraph {
  return { ...FLAGS, status: "incomplete", matchId: positive(input?.matchId) ? input.matchId : 0,
    stageId: positive(input?.stage?.id) ? input.stage.id : null,
    changeType: "unknown", sourceRound: null, downstreamMatches: [], laterStages: [],
    directSuccessorCount: 0, potentialLaterMatchCount: 0, startedDownstreamCount: 0,
    warnings: [reason], note: NOTE };
}
/** Walks SE coordinates forward; later matches represent POSSIBLE influence, not certain winners. */
export function deriveSeCorrectionImpactGraph(input: ImpactGraphInput): SeImpactGraph {
  if (!input || !positive(input.matchId) || !input.stage || !Array.isArray(input.stages) ||
      !Array.isArray(input.stageMatches) || input.stages.length > MAX_STAGES ||
      input.stageMatches.length > MAX_MATCHES || !input.actionPlan) {
    return incomplete(input, "Niekompletne dane analizy lub przekroczony limit grafu.");
  }
  const { stage, stageMatches, stages, actionPlan } = input;
  if (!positive(stage.id) || !positive(stage.position) || stage.format !== "single_elimination" ||
      !positive(stage.totalRounds) || stage.totalRounds > MAX_ROUNDS ||
      !["planned", "active", "completed"].includes(stage.status) ||
      !stages.some(s => s.id === stage.id && s.position === stage.position &&
        s.format === stage.format && s.status === stage.status && s.totalRounds === stage.totalRounds) ||
      !stages.every(s => s && positive(s.id) && positive(s.position) && typeof s.format === "string" &&
        typeof s.status === "string") ||
      new Set(stages.map(s => s.id)).size !== stages.length ||
      new Set(stages.map(s => s.position)).size !== stages.length) {
    return incomplete(input, "Niejednoznaczna numeracja lub metadane etapów.");
  }
  if (actionPlan.kind !== "se_correction_advisory_plan" || actionPlan.advisoryOnly !== true ||
      actionPlan.executionEnabled !== false || actionPlan.writePerformed !== false ||
      actionPlan.matchId !== input.matchId || !["candidate", "blocked"].includes(actionPlan.state) ||
      !["winner_change", "score_only", "unknown"].includes(actionPlan.changeType) ||
      (actionPlan.state === "blocked" && actionPlan.changeType !== "unknown") ||
      (actionPlan.state === "candidate" && actionPlan.changeType === "unknown") ||
      typeof input.qualificationCommitted !== "boolean" || typeof input.routingCommitted !== "boolean") {
    return incomplete(input, "Plan korekty nie odpowiada odczytowi lub zawiera sprzeczne dane.");
  }
  const keys = new Set<string>(), ids = new Set<number>();
  for (const m of stageMatches) {
    if (!m || !positive(m.id) || ids.has(m.id) || m.stageId !== stage.id ||
        !positive(m.round) || m.round > stage.totalRounds || !positive(m.matchNumber) ||
        m.matchNumber > 2 ** (stage.totalRounds - m.round) ||
        typeof m.status !== "string" || (m.resultType != null && typeof m.resultType !== "string") ||
        (m.score1 != null && !nonnegative(m.score1)) || (m.score2 != null && !nonnegative(m.score2)) ||
        (m.player1Id != null && !positive(m.player1Id)) ||
        (m.player2Id != null && !positive(m.player2Id)) ||
        (m.winnerId != null && !positive(m.winnerId)) || !validDate(m.completedAt)) {
      return incomplete(input, "Nieprawidłowe lub powtórzone rekordy meczów etapu.");
    }
    ids.add(m.id);
    const key = `${m.round}:${m.matchNumber}`;
    if (keys.has(key)) return incomplete(input, "Powtórzona pozycja w drabince.");
    keys.add(key);
  }
  const source = stageMatches.find(m => m.id === input.matchId);
  if (!source) return incomplete(input, "Nie znaleziono korygowanego meczu w spójnym odczycie etapu.");
  const laterStages = stages.filter(s => s.position > stage.position)
    .sort((a, b) => a.position - b.position)
    .map(s => ({ stageId: s.id, position: s.position, status: s.status,
      relationship: "possible_reporting_or_routing_dependency" as const }));
  const warnings: string[] = [];
  if (actionPlan.state === "blocked") warnings.push("Analiza gotowości korekty jest zablokowana — widok wpływu nie usuwa blokad.");
  if (input.qualificationCommitted) warnings.push("Zatwierdzone kwalifikacje: potrzebna osobna kontrola wpływu na awanse.");
  if (input.routingCommitted) warnings.push("Wykonany routing: potrzebna osobna kontrola etapów zależnych.");
  if (laterStages.some(s => s.status !== "planned")) warnings.push("Późniejszy etap już rozpoczęty lub zakończony.");
  const descendants: ImpactNode[] = [];
  // Score-only changes have no inferred participant path, but may affect reports and approvals.
  if (actionPlan.changeType !== "score_only") {
    let round = source.round;
    let number = source.matchNumber;
    while (round < stage.totalRounds) {
      const nextRound = round + 1;
      const nextNumber = Math.floor((number - 1) / 2) + 1;
      const dependent = stageMatches.find(m => m.round === nextRound && m.matchNumber === nextNumber);
      if (!dependent) {
        return { ...incomplete(input, `Brak meczu w rundzie ${nextRound}, pozycji ${nextNumber}.`),
          sourceRound: source.round, laterStages, downstreamMatches: descendants,
          directSuccessorCount: descendants.filter(d => d.relationship === "direct_successor_slot").length,
          potentialLaterMatchCount: descendants.filter(d => d.relationship === "potential_later_path").length,
          startedDownstreamCount: descendants.filter(d => d.alreadyStarted).length,
          warnings: [...warnings, `Brak meczu w rundzie ${nextRound}, pozycji ${nextNumber}.`] };
      }
      const alreadyStarted = dependent.status !== "pending" || dependent.resultType !== null ||
        dependent.score1 !== null || dependent.score2 !== null || dependent.winnerId !== null ||
        dependent.completedAt !== null;
      const hop: ImpactNode = {
        matchId: dependent.id, round: dependent.round, matchNumber: dependent.matchNumber,
        slot: number % 2 === 1 ? "player1" : "player2",
        relationship: descendants.length === 0 ? "direct_successor_slot" : "potential_later_path",
        alreadyStarted,
        label: descendants.length === 0 ? "Bezpośredni slot zwycięzcy" : "Możliwa ścieżka w kolejnej rundzie",
      };
      descendants.push(hop);
      if (alreadyStarted) warnings.push(`Mecz zależny ${dependent.id} został rozpoczęty lub rozstrzygnięty.`);
      round = nextRound;
      number = nextNumber;
    }
  }
  if (actionPlan.changeType === "score_only") warnings.push("Zmiana samego wyniku: nie przewiduje się zmiany obsady, lecz raporty mogą wymagać aktualizacji.");
  if (actionPlan.changeType === "unknown") warnings.push("Rodzaj zmiany niepotwierdzony — ścieżka jest wyłącznie hipotetyczna.");
  return {
    ...FLAGS, status: warnings.some(w => !w.startsWith("Zmiana samego wyniku")) ? "review_required" : "outlined",
    matchId: source.id, stageId: stage.id, changeType: actionPlan.changeType, sourceRound: source.round,
    downstreamMatches: descendants, laterStages,
    directSuccessorCount: descendants.filter(d => d.relationship === "direct_successor_slot").length,
    potentialLaterMatchCount: descendants.filter(d => d.relationship === "potential_later_path").length,
    startedDownstreamCount: descendants.filter(d => d.alreadyStarted).length,
    warnings, note: NOTE,
  };
}
