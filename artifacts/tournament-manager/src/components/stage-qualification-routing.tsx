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
  if (props.configuration.flowAuthority !== "basket_v1" || props.stage.status !== "completed" || outputs.length === 0) return <p className="text-sm">Etap zakończony.</p>;
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

  async function run(operation: (() => Promise<unknown>) | null, message: string, confirmed?: () => boolean) {
    if (lock.current) return;
    lock.current = true;
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
        setError(saved ? "Operacja została przyjęta, ale nie udało się odświeżyć pełnego stanu. Ponów sprawdzenie przed kolejnym krokiem." : "Nie udało się odświeżyć pełnego stanu. Ponów sprawdzenie.");
      } else {
        setSuccess(message);
      }
    } catch (cause) {
      setError(saved ? "Operacja została przyjęta, ale odświeżenie stanu nie powiodło się. Ponów sprawdzenie." : stageLifecycleError(cause));
      if (!saved) await refresh().catch(() => {});
    } finally {
      setConfirmation(undefined);
      setPending(false); onPendingChange(false); lock.current = false;
    }
  }

  function basketName(id: string) {
    const basket = configuration.baskets.find(entry => entry.id === id);
    return basket ? `koszyk ${basket.type === "output" ? "wyjściowy" : "wejściowy"} ${basket.ordinal}` : id;
  }
  const stageName = (id: number) => stages.find(entry => entry.id === id)?.name ?? `Etap #${id}`;

  return <section className="space-y-4" aria-label="Kwalifikacja i routing">
    <h4 className="font-semibold">Kwalifikacja i przekazanie uczestników</h4>
    <p className="text-sm">Stan kwalifikacji{routes.length > 0 && " i routingu"} według serwera.</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {success && <p role="status" className="text-sm">{success}</p>}
    {pending && <p role="status" className="text-sm">Trwa operacja i odświeżanie stanu…</p>}
    {proposal.isPending ? <p>Sprawdzanie propozycji kwalifikacji…</p> : missing ? <>
      <p>Nie przygotowano jeszcze propozycji kwalifikacji.</p>
      <Button disabled={pending || proposal.isFetching} onClick={() => void run(() => generate.mutateAsync({ id: tournamentId, stageId: stage.id }), "Propozycja kwalifikacji przygotowana. Sprawdź uczestników przed zatwierdzeniem.")}>Przygotuj propozycję kwalifikacji</Button>
    </> : proposal.isError ? <p role="alert">Nie udało się sprawdzić propozycji kwalifikacji. {stageLifecycleError(proposal.error)}</p> : proposal.data && <>
      <p>{proposal.data.status === "approved" ? "Kwalifikacja zatwierdzona." : "Propozycja kwalifikacji oczekuje na zatwierdzenie."}</p>
      <p className="text-sm text-muted-foreground">Wersja propozycji: {proposal.data.revision}. Skład i kolejność wyznaczone przez serwer.</p>
      <div className="overflow-x-auto"><table className="w-full text-sm">
        <caption className="sr-only">Propozycja kwalifikacji</caption>
        <thead><tr><th className="text-left">Uczestnik</th><th>Miejsce w etapie</th><th>Koszyk</th><th>Pozycja w koszyku</th></tr></thead>
        <tbody>{proposal.data.entries.map(entry => <tr key={`${entry.basketId}:${entry.playerId}`}>
          <td>{participants.find(player => player.playerId === entry.playerId)?.playerName ?? `Gracz #${entry.playerId}`}</td>
          <td className="text-center">{entry.placementRank}</td><td className="text-center">{basketName(entry.basketId)}</td><td className="text-center">{entry.basketPosition}</td>
        </tr>)}</tbody>
      </table></div>
      {proposal.data.status === "pending" && <div className="flex flex-wrap gap-2">
        <Button disabled={!canApprove} onClick={() => setConfirmation(revision)}>Zatwierdź kwalifikację</Button>
        <Button variant="outline" disabled={!canApprove} onClick={() => void run(() => generate.mutateAsync({ id: tournamentId, stageId: stage.id }), "Propozycja kwalifikacji odświeżona. Sprawdź aktualny skład.")}>Odśwież propozycję z wyników</Button>
      </div>}
    </>}
    {routes.map((route, index) => {
      const query = routeQueries[index];
      const target = configuration.baskets.find(basket => basket.id === route.targetBasketId);
      return <div key={route.id} className="rounded-md border p-3 space-y-2" aria-label={`Routing ${route.id}`}>
        <p className="text-sm">{stage.name}: {basketName(route.sourceBasketId)} → {target ? stageName(target.stageId) : "Etap docelowy"}: {basketName(route.targetBasketId)}</p>
        {query.isPending ? <p>Sprawdzanie routingu…</p> : query.isError ? <p role="alert">Nie udało się sprawdzić routingu. {stageLifecycleError(query.error)}</p> : query.data?.materialized ? <p>Routing wykonany. Przekazano uczestników: {query.data.routedPlayerCount}.</p> : query.data?.sourceOutputApproved ? <>
          <p>Kwalifikacja zatwierdzona. Następny krok: wykonaj routing.</p>
          <Button disabled={pending || query.isFetching} onClick={() => void run(() => execute.mutateAsync({ id: tournamentId, stageId: stage.id, basketId: route.sourceBasketId }), "Routing wykonany. Gotowość etapu docelowego została sprawdzona.", () => client.getQueryData<BasketRouteStatus>(routeOptions[index].queryKey)?.materialized === true)}>Wykonaj routing: {basketName(route.sourceBasketId)}</Button>
        </> : <p>Routing oczekuje na zatwierdzenie kwalifikacji.</p>}
      </div>;
    })}
    {targetIds.map((id, index) => {
      const query = readinessQueries[index];
      return <div key={id} className="text-sm space-y-2" aria-label={`Gotowość: ${stageName(id)}`}>
        <p className="font-semibold">{stageName(id)}</p>
        {query.isPending ? <p>Sprawdzanie gotowości…</p> : query.isError ? <p role="alert">Nie udało się sprawdzić gotowości etapu.</p> : query.data?.ready ? <p>Etap gotowy do startu.</p> : query.data && stageReadinessMessages(query.data).map(message => <p key={message}>{message}</p>)}
        <Button variant="outline" disabled={pending} onClick={() => onSelectStage(id)}>Przejdź do etapu: {stageName(id)}</Button>
      </div>;
    })}
    <Button variant="outline" disabled={pending} onClick={() => void run(null, "Stan kwalifikacji i routingu odświeżony.")}>Ponów sprawdzenie stanu</Button>
    <Dialog open={confirmation !== undefined} onOpenChange={open => { if (!pending && !open) setConfirmation(undefined); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Zatwierdzić kwalifikację?</DialogTitle><DialogDescription>Zatwierdzenie utrwali pokazany skład koszyków wyjściowych etapu „{stage.name}”. Zatwierdzonej propozycji nie można ponownie wygenerować. {routes.length > 0 && "Routing wykonuje się osobno, po zatwierdzeniu."}</DialogDescription></DialogHeader>
        {confirmation !== revision && <p role="alert">Propozycja zmieniła się. Zamknij potwierdzenie i sprawdź aktualny skład.</p>}
        <DialogFooter><Button variant="outline" disabled={pending} onClick={() => setConfirmation(undefined)}>Anuluj</Button>
          <Button disabled={!canApprove || confirmation !== revision} onClick={() => {
            if (!canApprove || confirmation !== revision) return;
            void run(() => approve.mutateAsync({ id: tournamentId, stageId: stage.id }), "Kwalifikacja zatwierdzona.", () => client.getQueryData<QualificationProposal>(proposalKey)?.status === "approved");
          }}>{pending ? "Zatwierdzanie i odświeżanie…" : "Potwierdź kwalifikację"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>;
}
