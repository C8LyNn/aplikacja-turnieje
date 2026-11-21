import { t, stageLabel } from "@/i18n";
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
    transitionStep = stepFor(t("useOrganizerOperation.sprawdz_stan_etapow"), t("useOrganizerOperation.nie_potwierdzono_jeszcze_konfiguracji_kw"));
  }
  if (!transitionStep && planned && readiness.isError) {
    transitionStep = stepFor(
      t("useOrganizerOperation.nie_udalo_sie_sprawdzic_gotowosci"),
      t("useOrganizerOperation.serwer_nie_potwierdzil_aktualnego_skladu"),
      planned.id,
      t("useOrganizerOperation.sprawdz_gotowosc_etapu"),
    );
  }
  for (let i = 0; i < sources.length && !transitionStep; i++) {
    const source = sources[i];
    const proposal = proposals[i];
    const error = proposal.error as { status?: number; data?: { code?: string } } | null;
    if (error?.status === 404 && error.data?.code === "STAGE_BASKET_QUALIFICATION_PROPOSAL_NOT_FOUND") {
      transitionStep = stepFor(t("useOrganizerOperation.przygotuj_propozycje_kwalifikacji"), t("useOrganizerOperation.etap_name_zakonczony_przygotuj_propozycj", { name: stageLabel(source.name) }), source.id);
    } else if (proposal.isPending || proposal.isError) {
      transitionStep = stepFor(t("useOrganizerOperation.sprawdz_kwalifikacje"), t("useOrganizerOperation.nie_potwierdzono_stanu_kwalifikacji_etap", { name: stageLabel(source.name) }), source.id);
    } else if (proposal.data?.status !== "approved") {
      transitionStep = stepFor(t("useOrganizerOperation.zatwierdz_kwalifikacje"), t("useOrganizerOperation.etap_name_sprawdz_propozycje_kwalifikacj", { name: stageLabel(source.name) }), source.id);
    } else {
      const pendingRoute = routes.findIndex((r, index) => config!.baskets.find(b => b.id === r.sourceBasketId)?.stageId === source.id
        && (routeQueries[index].isError || !routeQueries[index].data?.materialized));
      if (pendingRoute >= 0) {
        const query = routeQueries[pendingRoute];
        transitionStep = stepFor(query.isPending || query.isError ? t("useOrganizerOperation.sprawdz_routing") : t("useOrganizerOperation.wykonaj_routing"),
          t("useOrganizerOperation.etap_name_kwalifikacja_zatwierdzona_prze", { name: stageLabel(source.name) }), source.id);
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
