import { t, stageLabel } from "@/i18n";
import React, { useRef, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import {
  getGetBasketQualificationProposalQueryKey,
  getGetBasketRouteStatusQueryOptions,
  getGetBasketRouteStatusQueryKey,
  getGetTournamentStageReadinessQueryOptions,
  getGetTournamentStageReadinessQueryKey,
  getGetTournamentStageBasketsQueryKey,
  useGetBasketQualificationProposal,
  useGenerateBasketQualificationProposal,
  useApproveBasketQualificationProposal,
  useExecuteBasketRoute,
  type StageBasketConfiguration,
  type StageParticipant,
  type QualificationProposal,
  type BasketRouteStatus,
  type TournamentStage,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { invalidateTournamentDependentQueries } from "@/lib/tournament-query-invalidation";
import { stageLifecycleError, stageReadinessMessages } from "@/lib/stage-lifecycle-feedback";

interface Props {
  tournamentId: number;
  stage: TournamentStage;
  stages: TournamentStage[];
  configuration: StageBasketConfiguration;
  participants: StageParticipant[];
  onPendingChange: (pending: boolean) => void;
  onSelectStage: (stageId: number) => void;
}

export function StageQualificationRouting(props: Props) {
  const outputs = props.configuration.baskets.filter(basket => basket.stageId === props.stage.id && basket.type === "output" && basket.qualifierCount !== null);
  if (props.configuration.flowAuthority !== "basket_v1" || props.stage.status !== "completed" || outputs.length === 0) return <p className="text-sm">{t("stageQualificationRouting.etap_zakonczony")}</p>;
  return <QualificationRouting key={props.stage.id} {...props} />;
}

function isMissingProposal(error: unknown) {
  const response = error as { status?: number; data?: { code?: string } } | null;
  return response?.status === 404 && response.data?.code === "STAGE_BASKET_QUALIFICATION_PROPOSAL_NOT_FOUND";
}

function QualificationRouting({ tournamentId, stage, stages, configuration, participants, onPendingChange, onSelectStage }: Props) {
  const client = useQueryClient();
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(t("stageQualificationRouting.zapisywanie_i_odswiezanie_stanu"));
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [confirmation, setConfirmation] = useState<string>();
  const proposalKey = getGetBasketQualificationProposalQueryKey(tournamentId, stage.id);
  const proposal = useGetBasketQualificationProposal(tournamentId, stage.id, {
    query: { queryKey: proposalKey, retry: false, refetchInterval: pending ? false : 5000 },
  });
  const routes = configuration.routes.filter(route => configuration.baskets.some(basket => basket.id === route.sourceBasketId && basket.stageId === stage.id));
  const routeOptions = routes.map(route => getGetBasketRouteStatusQueryOptions(tournamentId, stage.id, route.sourceBasketId, {
    query: { queryKey: getGetBasketRouteStatusQueryKey(tournamentId, stage.id, route.sourceBasketId), retry: false, refetchInterval: pending ? false : 5000 },
  }));
  const routeQueries = useQueries({ queries: routeOptions });
  const targetIds = [...new Set(routes.flatMap(route => {
    const target = configuration.baskets.find(basket => basket.id === route.targetBasketId);
    return target ? [target.stageId] : [];
  }))];
  const readinessOptions = targetIds.map(id => getGetTournamentStageReadinessQueryOptions(tournamentId, id, {
    query: { queryKey: getGetTournamentStageReadinessQueryKey(tournamentId, id), retry: false, refetchInterval: pending ? false : 5000 },
  }));
  const readinessQueries = useQueries({ queries: readinessOptions });
  const generate = useGenerateBasketQualificationProposal();
  const approve = useApproveBasketQualificationProposal();
  const execute = useExecuteBasketRoute();
  const missing = isMissingProposal(proposal.error);
  const revision = proposal.data ? `${proposal.data.proposalId}:${proposal.data.revision}:${proposal.data.rankingFingerprint}` : undefined;
  const canApprove = !pending && !proposal.isFetching && !proposal.isError && proposal.data?.status === "pending";

  async function refresh() {
    await Promise.all([
      invalidateTournamentDependentQueries(client, tournamentId),
      client.invalidateQueries({ queryKey: getGetTournamentStageBasketsQueryKey(tournamentId) }),
    ]);
  }

  async function run(operation: (() => Promise<unknown>) | null, message: string, confirmed?: () => boolean, progress = t("stageQualificationRouting.zapisywanie_i_odswiezanie_stanu")) {
    if (lock.current) return;
    lock.current = true;
    setPendingMessage(progress);
    setPending(true); onPendingChange(true); setError(undefined); setSuccess(undefined);
    let saved = false;
    try {
      if (operation) { await operation(); saved = true; }
      await refresh();
      const keys = [proposalKey, ...routeOptions.map(option => option.queryKey), ...readinessOptions.map(option => option.queryKey)];
      // Invalidation waits for reads but does not throw their errors by default.
      // A successful write alone cannot confirm the next lifecycle state.
      const refreshFailed = keys.some(key => {
        const state = client.getQueryState(key);
        return state?.status === "error" && !(operation === null && key === proposalKey && isMissingProposal(state.error));
      });
      if (refreshFailed || confirmed?.() === false) {
        setError(saved ? t("stageQualificationRouting.operacja_zostala_przyjeta_ale_nie") : t("stageQualificationRouting.nie_udalo_sie_odswiezyc_pelnego"));
      } else {
        setSuccess(message);
      }
    } catch (cause) {
      setError(saved ? t("stageQualificationRouting.operacja_zostala_przyjeta_ale_odswiezeni") : stageLifecycleError(cause));
      if (!saved) await refresh().catch(() => {});
    } finally {
      setConfirmation(undefined);
      setPending(false); onPendingChange(false); lock.current = false;
    }
  }

  function basketName(id: string) {
    const basket = configuration.baskets.find(entry => entry.id === id);
    return basket ? t("stageQualificationRouting.koszyk_v0_ordinal", { v0: basket.type === "output" ? t("stageQualificationRouting.wyjsciowy") : t("stageQualificationRouting.wejsciowy"), ordinal: basket.ordinal }) : id;
  }
  const stageName = (id: number) => stageLabel(stages.find(entry => entry.id === id)?.name) ?? t("stageQualificationRouting.etap_id", { id: id });

  return <section className="organizer-qualification space-y-4" aria-label={t("stageQualificationRouting.kwalifikacja_i_routing")}>
    <h4 className="font-semibold">{t("stageQualificationRouting.kwalifikacja_i_przekazanie_uczestnikow")}</h4>
    <p className="text-sm">{t("stageQualificationRouting.stan_kwalifikacji")}{routes.length > 0 && t("stageQualificationRouting.i_routingu")} {t("stageQualificationRouting.wedlug_serwera")}</p>
    {error && <p role="alert" className="organizer-notice organizer-notice--error rounded-md border text-sm text-destructive">{error}</p>}
    {success && <p role="status" className="organizer-notice organizer-notice--success rounded-md border text-sm">{success}</p>}
    {pending && <p role="status" className="organizer-notice organizer-notice--pending text-sm">{pendingMessage}</p>}
    {proposal.isPending ? <p>{t("stageQualificationRouting.sprawdzanie_propozycji_kwalifikacji")}</p> : missing ? <>
      <p>{t("stageQualificationRouting.nie_przygotowano_jeszcze_propozycji_kwal")}</p>
      <Button disabled={pending || proposal.isFetching} onClick={() => void run(() => generate.mutateAsync({ id: tournamentId, stageId: stage.id }), t("stageQualificationRouting.propozycja_kwalifikacji_przygotowana_spr"))}>{t("stageQualificationRouting.przygotuj_propozycje_kwalifikacji")}</Button>
    </> : proposal.isError ? <p role="alert">{t("stageQualificationRouting.nie_udalo_sie_sprawdzic_propozycji")}{" "}{stageLifecycleError(proposal.error)}</p> : proposal.data && <>
      <p>{proposal.data.status === "approved" ? t("stageQualificationRouting.kwalifikacja_zatwierdzona") : t("stageQualificationRouting.propozycja_kwalifikacji_oczekuje_na_zatw")}</p>
      <p className="text-sm text-muted-foreground">{t("stageQualificationRouting.wersja_propozycji")}{" "}{proposal.data.revision}{t("stageQualificationRouting.sklad_i_kolejnosc_wyznaczone_przez")}</p>
      <div className="overflow-x-auto"><table className="w-full text-sm">
        <caption className="sr-only">{t("stageQualificationRouting.propozycja_kwalifikacji")}</caption>
        <thead><tr><th className="text-left">{t("stageQualificationRouting.uczestnik")}</th><th>{t("stageQualificationRouting.miejsce_w_etapie")}</th><th>{t("stageQualificationRouting.koszyk")}</th><th>{t("stageQualificationRouting.pozycja_w_koszyku")}</th></tr></thead>
        <tbody>{proposal.data.entries.map(entry => <tr key={`${entry.basketId}:${entry.playerId}`}>
          <td>{participants.find(player => player.playerId === entry.playerId)?.playerName ?? t("stageQualificationRouting.gracz_playerid", { playerId: entry.playerId })}</td>
          <td className="text-center">{entry.placementRank}</td><td className="text-center">{basketName(entry.basketId)}</td><td className="text-center">{entry.basketPosition}</td>
        </tr>)}</tbody>
      </table></div>
      {proposal.data.status === "pending" && <div className="flex flex-wrap gap-2">
        <Button disabled={!canApprove} onClick={() => setConfirmation(revision)}>{t("stageQualificationRouting.zatwierdz_kwalifikacje")}</Button>
        <Button variant="outline" disabled={!canApprove} onClick={() => void run(() => generate.mutateAsync({ id: tournamentId, stageId: stage.id }), t("stageQualificationRouting.propozycja_kwalifikacji_odswiezona_spraw"))}>{t("stageQualificationRouting.odswiez_propozycje_z_wynikow")}</Button>
      </div>}
    </>}
    {routes.map((route, index) => {
      const query = routeQueries[index];
      const target = configuration.baskets.find(basket => basket.id === route.targetBasketId);
      return <div key={route.id} className="organizer-route rounded-md border p-3 space-y-2" aria-label={t("stageQualificationRouting.routing_id", { id: route.id })}>
        <p className="text-sm">{stageLabel(stage.name)}: {basketName(route.sourceBasketId)} → {target ? stageName(target.stageId) : t("stageQualificationRouting.etap_docelowy")}: {basketName(route.targetBasketId)}</p>
        {query.isPending ? <p>{t("stageQualificationRouting.sprawdzanie_routingu")}</p> : query.isError ? <p role="alert">{t("stageQualificationRouting.nie_udalo_sie_sprawdzic_routingu")}{" "}{stageLifecycleError(query.error)}</p> : query.data?.materialized ? <p>{t("stageQualificationRouting.routing_wykonany_przekazano_uczestnikow")}{" "}{query.data.routedPlayerCount}.</p> : query.data?.sourceOutputApproved ? <>
          <p>{t("stageQualificationRouting.kwalifikacja_zatwierdzona_nastepny_krok_")}</p>
          <Button disabled={pending || query.isFetching} onClick={() => void run(() => execute.mutateAsync({ id: tournamentId, stageId: stage.id, basketId: route.sourceBasketId }), t("stageQualificationRouting.routing_wykonany_gotowosc_etapu_docelowe"), () => client.getQueryData<BasketRouteStatus>(routeOptions[index].queryKey)?.materialized === true, t("stageQualificationRouting.przekazywanie_uczestnikow_i_odswiezanie_"))}>{t("stageQualificationRouting.wykonaj_routing")}{" "}{basketName(route.sourceBasketId)}</Button>
        </> : <p>{t("stageQualificationRouting.routing_oczekuje_na_zatwierdzenie_kwalif")}</p>}
      </div>;
    })}
    {targetIds.map((id, index) => {
      const query = readinessQueries[index];
      return <div key={id} className="text-sm space-y-2" aria-label={t("stageQualificationRouting.gotowosc_v0", { v0: stageName(id) })}>
        <p className="font-semibold">{stageName(id)}</p>
        {query.isPending ? <p>{t("stageQualificationRouting.sprawdzanie_gotowosci")}</p> : query.isError ? <p role="alert">{t("stageQualificationRouting.nie_udalo_sie_sprawdzic_gotowosci")}</p> : query.data?.ready ? <p>{t("stageQualificationRouting.etap_gotowy_do_startu")}</p> : query.data && stageReadinessMessages(query.data, { stages, stageId: id, baskets: configuration.baskets, routes: configuration.routes }).map(message => <p key={message}>{message}</p>)}
        <Button variant="outline" disabled={pending} onClick={() => onSelectStage(id)}>{t("stageQualificationRouting.przejdz_do_etapu")}{" "}{stageName(id)}</Button>
      </div>;
    })}
    <Button variant="outline" disabled={pending} onClick={() => void run(null, t("stageQualificationRouting.stan_kwalifikacji_i_routingu_odswiezony"))}>{t("stageQualificationRouting.ponow_sprawdzenie_stanu")}</Button>
    <Dialog open={confirmation !== undefined} onOpenChange={open => { if (!pending && !open) setConfirmation(undefined); }}>
      <DialogContent className="organizer-dialog">
        <DialogHeader><DialogTitle>{t("stageQualificationRouting.zatwierdzic_kwalifikacje")}</DialogTitle><DialogDescription>{t("stageQualificationRouting.zatwierdzenie_utrwali_pokazany_sklad_kos")}{stageLabel(stage.name)}{t("stageQualificationRouting.zatwierdzonej_propozycji_nie_mozna_ponow")}{" "}{routes.length > 0 && t("stageQualificationRouting.routing_wykonuje_sie_osobno_po")}</DialogDescription></DialogHeader>
        {confirmation !== revision && <p role="alert">{t("stageQualificationRouting.propozycja_zmienila_sie_zamknij_potwierd")}</p>}
        <DialogFooter><Button variant="outline" disabled={pending} onClick={() => setConfirmation(undefined)}>{t("stageQualificationRouting.anuluj")}</Button>
          <Button disabled={!canApprove || confirmation !== revision} onClick={() => {
            if (!canApprove || confirmation !== revision) return;
            void run(() => approve.mutateAsync({ id: tournamentId, stageId: stage.id }), t("stageQualificationRouting.kwalifikacja_zatwierdzona"), () => client.getQueryData<QualificationProposal>(proposalKey)?.status === "approved", t("stageQualificationRouting.zatwierdzanie_zakwalifikowanych_i_odswie"));
          }}>{pending ? t("stageQualificationRouting.zatwierdzanie_i_odswiezanie") : t("stageQualificationRouting.potwierdz_kwalifikacje")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>;
}
