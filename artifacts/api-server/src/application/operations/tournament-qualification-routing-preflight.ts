/**
 * Pack 07: read-only qualification + basket-routing state reconciliation.
 * This code never writes or grants permission to execute an operation.
 * Proposals, basket graph and route execution records are authoritative inputs.
 * The mutation endpoints always revalidate their own invariants and authorization.
 */

export type TransitionState =
  | "not_applicable" | "needs_attention" | "waiting_for_matches"
  | "prepare_qualification" | "review_qualification" | "route_qualifiers"
  | "review_next_stage" | "complete";
export type TransitionIssueSeverity = "block" | "attention";
export type RouteAdvisoryState = "materialized" | "ready_for_review" | "waiting" | "blocked";

export interface StageOverview {
  id: number;
  name: string;
  position: number;
  status: "planned" | "active" | "completed";
}
export interface BasketOverview {
  id: string;
  stageId: number;
  type: "input" | "output";
  qualifierCount: number | null;
}
export interface RouteOverview {
  id: string;
  sourceBasketId: string;
  targetBasketId: string;
}
export interface ProposalOverview {
  stageId: number;
  status: string;
  revision: number;
  entries: ReadonlyArray<{ basketId: string; playerId: number }>;
}
export interface RouteExecutionOverview {
  routeId: string;
  sourceBasketId: string;
  targetBasketId: string;
  targetStageId?: number;
  sourceOutputApproved: boolean;
  materialized: boolean;
  routedPlayerCount: number;
}
export interface QualificationRoutingInput {
  tournamentId: number;
  flowAuthority: "legacy" | "basket_v1";
  validConfiguration: boolean;
  configurationProblems: ReadonlyArray<{ code: string; message: string }>;
  stages: readonly StageOverview[];
  baskets: readonly BasketOverview[];
  routes: readonly RouteOverview[];
  proposals: readonly ProposalOverview[];
  routeStatuses: readonly RouteExecutionOverview[];
}
export interface TransitionIssue {
  code: string;
  message: string;
  severity: TransitionIssueSeverity;
  stageId: number | null;
  routeId: string | null;
}
export interface RouteTransitionPreview {
  routeId: string;
  sourceBasketId: string;
  targetBasketId: string;
  sourceStageId: number;
  targetStageId: number | null;
  targetStageName: string | null;
  qualifierQuota: number | null;
  allocatedInProposal: number;
  proposalRevision: number | null;
  materialized: boolean;
  routedPlayerCount: number;
  state: RouteAdvisoryState;
  reason: string;
}
export interface StageQualificationPreview {
  stageId: number;
  stageName: string;
  stageStatus: StageOverview["status"];
  proposalStatus: "missing" | "pending" | "approved" | "unknown";
  proposalRevision: number | null;
  qualifierQuota: number;
  proposalEntries: number;
  routeCount: number;
  routeDone: number;
  nextAction: "wait" | "prepare_proposal" | "review_proposal" | "review_routes" | "review_next_stage";
  routes: RouteTransitionPreview[];
}
export interface QualificationRoutingPreview {
  version: 1;
  advisory: true;
  executionMustRevalidate: true;
  noMutationsPerformed: true;
  tournamentId: number;
  flowAuthority: "legacy" | "basket_v1";
  state: TransitionState;
  title: string;
  description: string;
  qualificationStages: StageQualificationPreview[];
  issues: TransitionIssue[];
  summary: {
    sourceStages: number;
    proposalsPending: number;
    proposalsApproved: number;
    routesTotal: number;
    routesMaterialized: number;
  };
  /** Historical proposal revision is descriptive, NOT a freshness check or execution permit. */
  proposalFingerprintRevalidated: false;
}

export function deriveQualificationRoutingPreview(input: QualificationRoutingInput): QualificationRoutingPreview {
  const issues: TransitionIssue[] = [];
  const stageById = new Map(input.stages.map(stage => [stage.id, stage]));
  const basketById = new Map(input.baskets.map(basket => [basket.id, basket]));
  const proposalByStage = new Map(input.proposals.map(p => [p.stageId, p]));
  const routeStatusById = new Map(input.routeStatuses.map(s => [s.routeId, s]));
  const issue = (code: string, message: string, severity: TransitionIssueSeverity, stageId: number | null = null, routeId: string | null = null) => {
    issues.push({ code, message, severity, stageId, routeId });
  };
  const summary = { sourceStages: 0, proposalsPending: 0, proposalsApproved: 0, routesTotal: 0, routesMaterialized: 0 };
  const output: QualificationRoutingPreview = {
    version: 1, advisory: true, executionMustRevalidate: true,
    noMutationsPerformed: true, tournamentId: input.tournamentId,
    flowAuthority: input.flowAuthority, state: "not_applicable", title: "Przejścia między etapami",
    description: "Podgląd nie modyfikuje turnieju.", qualificationStages: [], issues, summary,
    proposalFingerprintRevalidated: false,
  };
  if (input.flowAuthority !== "basket_v1") {
    output.description = "Turniej korzysta z historycznego przepływu uczestników. Podgląd koszyków Pack 07 nie zastępuje tego mechanizmu.";
    return output;
  }
  if (!input.validConfiguration) {
    for (const problem of input.configurationProblems) {
      issue(problem.code, problem.message, "block");
    }
    if (issues.length === 0) issue("BASKET_GRAPH_INVALID", "Konfiguracja koszyków jest nieprawidłowa.", "block");
    output.state = "needs_attention";
    output.title = "Napraw konfigurację koszyków";
    output.description = "Nie można bezpiecznie przygotować przejść etapów, dopóki graf koszyków nie jest poprawny.";
    return output;
  }
  const outputBaskets = input.baskets.filter(b => b.type === "output" && (b.qualifierCount ?? 0) > 0);
  const sources = [...new Set(outputBaskets.map(b => b.stageId))]
    .map(id => stageById.get(id))
    .filter((stage): stage is StageOverview => stage !== undefined)
    .sort((a, b) => a.position - b.position);
  for (const stage of sources) {
    const baskets = outputBaskets.filter(b => b.stageId === stage.id);
    const stageRoutes = input.routes.filter(route => baskets.some(b => b.id === route.sourceBasketId));
    const proposal = proposalByStage.get(stage.id);
    const proposalStatus: StageQualificationPreview["proposalStatus"] =
      !proposal ? "missing" : proposal.status === "pending" || proposal.status === "approved" ? proposal.status : "unknown";
    if (proposalStatus === "pending") summary.proposalsPending++;
    if (proposalStatus === "approved") summary.proposalsApproved++;
    let nextAction: StageQualificationPreview["nextAction"] = "wait";
    if (stage.status === "completed") {
      if (proposalStatus === "missing") nextAction = "prepare_proposal";
      else if (proposalStatus === "pending") nextAction = "review_proposal";
      else if (proposalStatus === "approved") nextAction = "review_routes";
    }
    if (proposalStatus === "unknown") issue("UNKNOWN_PROPOSAL_STATUS", `Nieznany status propozycji w etapie „${stage.name}”.`, "block", stage.id);
    const quota = baskets.reduce((sum, b) => sum + (b.qualifierCount ?? 0), 0);
    const entries = proposal?.entries.length ?? 0;
    if (proposal && entries !== quota) {
      issue("PROPOSAL_QUOTA_MISMATCH", `Etap „${stage.name}”: propozycja zawiera ${entries} wpisów, oczekiwano ${quota}.`, "block", stage.id);
    }
    for (const basket of baskets) {
      if (!stageRoutes.some(r => r.sourceBasketId === basket.id)) {
        issue("OUTPUT_ROUTE_MISSING", `Koszyk wyjściowy „${basket.id}” nie ma trasy do kolejnego etapu.`, "block", stage.id);
      }
    }
    const routePreviews: RouteTransitionPreview[] = [];
    for (const route of stageRoutes) {
      const sourceBasket = basketById.get(route.sourceBasketId);
      const targetBasket = basketById.get(route.targetBasketId);
      const target = targetBasket ? stageById.get(targetBasket.stageId) : undefined;
      const status = routeStatusById.get(route.id);
      const allocatedInProposal = proposal?.entries.filter(entry => entry.basketId === route.sourceBasketId).length ?? 0;
      const qualifierQuota = sourceBasket?.qualifierCount ?? null;
      if (proposal && qualifierQuota !== allocatedInProposal) {
        issue("OUTPUT_ALLOCATION_MISMATCH", `Koszyk „${route.sourceBasketId}”: wpisów ${allocatedInProposal}, wymagano ${qualifierQuota ?? "?"}.`, "block", stage.id, route.id);
      }
      let state: RouteAdvisoryState = "waiting";
      let reason = "Czeka na zakończenie etapu źródłowego i zatwierdzenie kwalifikacji.";
      const materialized = status?.materialized === true;
      if (!sourceBasket || !targetBasket || !target || sourceBasket.type !== "output" || targetBasket.type !== "input") {
        state = "blocked"; reason = "Nieprawidłowe przypisanie koszyków lub etapu docelowego.";
        issue("INVALID_ROUTE_BINDING", `Trasa „${route.id}” ma nieprawidłowe powiązania.`, "block", stage.id, route.id);
      } else if (!status || status.sourceBasketId !== route.sourceBasketId || status.targetBasketId !== route.targetBasketId || (status.targetStageId !== undefined && target?.id !== status.targetStageId)) {
        state = "blocked"; reason = "Stan wykonania trasy nie został wiarygodnie odczytany.";
        issue("ROUTE_STATUS_MISSING", `Brakuje potwierdzonego statusu trasy „${route.id}”.`, "block", stage.id, route.id);
      } else if (materialized) {
        if (qualifierQuota !== status.routedPlayerCount || proposalStatus !== "approved" || stage.status !== "completed" || !status.sourceOutputApproved) {
          state = "blocked"; reason = "Zapisane wykonanie wymaga kontroli zgodności liczby uczestników lub zatwierdzenia.";
          issue("ROUTE_EXECUTION_INCONSISTENT", `Trasa „${route.id}” ma niespójny stan wykonania.`, "block", stage.id, route.id);
        } else {
          state = "materialized"; reason = "Trasa została wykonana; ponowne wykonanie nie jest wymagane.";
        }
      } else if (target.status !== "planned") {
        state = "blocked"; reason = "Etap docelowy został już rozpoczęty albo zakończony.";
        issue("TARGET_STAGE_ALREADY_STARTED", `Trasa „${route.id}” prowadzi do nieplanowanego już etapu.`, "block", stage.id, route.id);
      } else if (stage.status === "completed" && proposalStatus === "approved" && status.sourceOutputApproved && qualifierQuota === allocatedInProposal) {
        state = "ready_for_review";
        reason = "Można zweryfikować i zatwierdzić osobną operację wykonania routingu.";
      } else if (stage.status === "completed" && proposalStatus === "approved" && !status.sourceOutputApproved) {
        state = "blocked"; reason = "Status trasy nie potwierdza zatwierdzenia koszyka wyjściowego.";
        issue("SOURCE_OUTPUT_NOT_APPROVED", `Trasa „${route.id}” nie potwierdza zatwierdzonego źródła.`, "block", stage.id, route.id);
      }
      routePreviews.push({
        routeId: route.id, sourceBasketId: route.sourceBasketId,
        targetBasketId: route.targetBasketId, sourceStageId: stage.id,
        targetStageId: target?.id ?? null, targetStageName: target?.name ?? null,
        qualifierQuota, allocatedInProposal, proposalRevision: proposal?.revision ?? null,
        materialized, routedPlayerCount: status?.routedPlayerCount ?? 0,
        state, reason,
      });
    }
    summary.routesTotal += routePreviews.length;
    summary.routesMaterialized += routePreviews.filter(route => route.state === "materialized").length;
    if (stage.status === "completed" && proposalStatus === "approved" && routePreviews.length > 0
      && routePreviews.every(route => route.state === "materialized")) nextAction = "review_next_stage";
    output.qualificationStages.push({
      stageId: stage.id, stageName: stage.name, stageStatus: stage.status,
      proposalStatus, proposalRevision: proposal?.revision ?? null,
      qualifierQuota: quota, proposalEntries: entries,
      routeCount: routePreviews.length, routeDone: routePreviews.filter(r => r.state === "materialized").length,
      nextAction, routes: routePreviews,
    });
  }
  summary.sourceStages = sources.length;
  if (issues.some(item => item.severity === "block")) {
    output.state = "needs_attention"; output.title = "Sprawdź blokady kwalifikacji i routingu";
    output.description = "Wykryto niezgodność wymagającą weryfikacji konfiguracji lub danych zapisanych w bazie.";
  } else if (!sources.length) {
    output.state = "not_applicable"; output.description = "Nie skonfigurowano koszyków kwalifikacyjnych wymagających routingu.";
  } else if (output.qualificationStages.some(stage => stage.stageStatus !== "completed")) {
    output.state = "waiting_for_matches"; output.title = "Dokończ etapy źródłowe";
    output.description = "Kwalifikacje i routing zostaną przygotowane po zamknięciu odpowiednich etapów.";
  } else if (output.qualificationStages.some(stage => stage.nextAction === "prepare_proposal")) {
    output.state = "prepare_qualification"; output.title = "Przygotuj propozycję kwalifikacji";
    output.description = "Etap jest zamknięty, ale nie utworzono jeszcze propozycji awansujących.";
  } else if (output.qualificationStages.some(stage => stage.nextAction === "review_proposal")) {
    output.state = "review_qualification"; output.title = "Sprawdź i zatwierdź kwalifikację";
    output.description = "Zatwierdzenie propozycji musi być osobną operacją organizatora.";
  } else if (output.qualificationStages.some(stage => stage.routes.some(route => route.state === "ready_for_review"))) {
    output.state = "route_qualifiers"; output.title = "Przekaż zakwalifikowanych do następnego etapu";
    output.description = "Wykonaj routing po ponownym sprawdzeniu stanu przez transakcyjny backend.";
  } else if (output.qualificationStages.every(stage => stage.nextAction === "review_next_stage")) {
    output.state = "complete"; output.title = "Kwalifikacje i routing zapisane";
    output.description = "Sprawdź aktualną gotowość kolejnego etapu przed jego rozpoczęciem.";
  } else {
    output.state = "review_next_stage"; output.title = "Zweryfikuj przejście między etapami";
    output.description = "Sprawdź stan koszyków, kwalifikacji i gotowość kolejnego etapu.";
  }
  return output;
}
