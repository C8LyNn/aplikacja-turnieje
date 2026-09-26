import { useQueries } from "@tanstack/react-query";
import {
  useGetTournamentStageBaskets, getGetTournamentStageBasketsQueryKey,
  getGetBasketQualificationProposalQueryOptions, getGetBasketRouteStatusQueryOptions,
  getGetBasketQualificationProposalQueryKey, getGetBasketRouteStatusQueryKey,
  useGetTournamentStageReadiness, getGetTournamentStageReadinessQueryKey,
  type Match, type Tournament, type TournamentStage,
} from "@workspace/api-client-react";
import { deriveOrganizerNextStep, type OrganizerNextStepModel, type OrganizerSurface } from "@/lib/organizer-next-step";
import type { OrganizerCapabilities } from "@/lib/organizer-capabilities";
import { operationalStage, organizerStageSummary } from "@/lib/organizer-stage-summary";

export function useOrganizerOperation({ tournament, stages, matches, capabilities, surface, enabled }: {
  tournament?: Tournament; stages?: TournamentStage[]; matches?: Match[];
  capabilities: OrganizerCapabilities; surface: OrganizerSurface; enabled: boolean;
}) {
  const id = tournament?.id ?? 0;
  const ordered = [...(stages ?? [])].sort((a, b) => a.position - b.position);
  const active = ordered.find(s => s.status === "active");
  const planned = ordered.find(s => s.status === "planned");
  const configuration = useGetTournamentStageBaskets(id, { query: {
    queryKey: getGetTournamentStageBasketsQueryKey(id), enabled: enabled && !!id,
    retry: false, refetchInterval: 5000,
  } });
  const config = configuration.data;
  const sources = !active && config?.flowAuthority === "basket_v1" ? ordered.filter(s => s.status === "completed"
    && config.baskets.some(b => b.stageId === s.id && b.type === "output" && b.qualifierCount !== null)) : [];
  const proposals = useQueries({ queries: sources.map(s => getGetBasketQualificationProposalQueryOptions(id, s.id,
    { query: { queryKey: getGetBasketQualificationProposalQueryKey(id, s.id), enabled, retry: false, refetchInterval: 5000 } })) });
  const routes = config?.flowAuthority === "basket_v1" ? config.routes.filter(r => sources.some(s => config.baskets.some(b => b.stageId === s.id && b.id === r.sourceBasketId))) : [];
  const routeQueries = useQueries({ queries: routes.map(r => getGetBasketRouteStatusQueryOptions(id,
    config!.baskets.find(b => b.id === r.sourceBasketId)!.stageId, r.sourceBasketId,
    { query: { queryKey: getGetBasketRouteStatusQueryKey(id, config!.baskets.find(b => b.id === r.sourceBasketId)!.stageId, r.sourceBasketId), enabled, retry: false, refetchInterval: 5000 } })) });
  const readiness = useGetTournamentStageReadiness(id, planned?.id ?? 0, { query: {
    queryKey: getGetTournamentStageReadinessQueryKey(id, planned?.id ?? 0),
    enabled: enabled && !!planned, retry: false, refetchInterval: 5000,
  } });
  const stepFor = (title: string, description: string, stageId?: number, actionLabel = title): OrganizerNextStepModel => ({
    kind: "stage_preparation", title, description, stageId,
    actionLabel: capabilities.canManageLifecycle ? actionLabel : undefined,
    actionHref: capabilities.canManageLifecycle ? `/tournaments/${id}?tab=stages${stageId ? `&stage=${stageId}` : ""}` : undefined,
  });
  let transitionStep: OrganizerNextStepModel | undefined;
  if (!active && enabled && (configuration.isPending || configuration.isError)) {
    transitionStep = stepFor("Sprawdź stan etapów", "Nie potwierdzono jeszcze konfiguracji kwalifikacji i routingu.");
  }
  if (!transitionStep && planned && readiness.isError) {
    transitionStep = stepFor(
      "Nie udało się sprawdzić gotowości etapu",
      "Serwer nie potwierdził aktualnego składu ani konfiguracji. Otwórz Etapy i spróbuj ponownie przed startem.",
      planned.id,
      "Sprawdź gotowość etapu",
    );
  }
  for (let i = 0; i < sources.length && !transitionStep; i++) {
    const source = sources[i];
    const proposal = proposals[i];
    const error = proposal.error as { status?: number; data?: { code?: string } } | null;
    if (error?.status === 404 && error.data?.code === "STAGE_BASKET_QUALIFICATION_PROPOSAL_NOT_FOUND") {
      transitionStep = stepFor("Przygotuj propozycję kwalifikacji", `Etap „${source.name}” zakończony. Przygotuj propozycję z wyników.`, source.id);
    } else if (proposal.isPending || proposal.isError) {
      transitionStep = stepFor("Sprawdź kwalifikację", `Nie potwierdzono stanu kwalifikacji etapu „${source.name}”.`, source.id);
    } else if (proposal.data?.status !== "approved") {
      transitionStep = stepFor("Zatwierdź kwalifikację", `Etap „${source.name}”: sprawdź propozycję kwalifikacji przed zatwierdzeniem.`, source.id);
    } else {
      const pendingRoute = routes.findIndex((r, index) => config!.baskets.find(b => b.id === r.sourceBasketId)?.stageId === source.id
        && (routeQueries[index].isError || !routeQueries[index].data?.materialized));
      if (pendingRoute >= 0) {
        const query = routeQueries[pendingRoute];
        transitionStep = stepFor(query.isPending || query.isError ? "Sprawdź routing" : "Wykonaj routing",
          `Etap „${source.name}”: kwalifikacja zatwierdzona. Przekazanie uczestników wymaga potwierdzenia routingu.`, source.id);
      }
    }
  }
  const stage = operationalStage(ordered);
  return {
    stage, readiness, summary: organizerStageSummary(stage, matches),
    nextStep: enabled && tournament && stages ? deriveOrganizerNextStep({ tournament, stages, matches,
      capabilities, surface, transitionStep,
      plannedStageReadiness: readiness.isError || readiness.isPending ? undefined : readiness.data,
    }) : null,
  };
}
