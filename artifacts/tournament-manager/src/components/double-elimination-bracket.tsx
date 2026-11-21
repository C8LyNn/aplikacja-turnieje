import { t } from "@/i18n";
import { useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { isExperimentalTournamentPath } from "@/features/experimental-tournaments/experimental-tournament-routing";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetDoubleEliminationStageQueryKey,
  type DoubleEliminationMatch,
  type DoubleEliminationParticipant,
  type DoubleEliminationStageState,
  useCompleteMatch,
  useListMatches,
  getListMatchesQueryKey,
  useResetDoubleEliminationStage,
  useRevertMatch,
} from "@workspace/api-client-react";
import { RotateCcw, Shield, Trophy, LayoutTemplate } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMatchResultDrafts } from "@/hooks/use-match-result-drafts";
import { matchOperationError } from "@/lib/match-operation-feedback";
import { invalidateTournamentDependentQueries } from "@/lib/tournament-query-invalidation";
import { DEBracketCanvas, deDisplayName } from "@/components/de-bracket-canvas";

interface DoubleEliminationBracketProps {
  tournamentId: number;
  stageId: number;
  state: DoubleEliminationStageState;
  canManage?: boolean;
  canReset?: boolean;
  onChanged?: () => void;
  /** Where Grand Final appears. Default: "upper" (appended to UB). */
  finalsPosition?: "upper" | "between";
  /** When false, hides UB→LB loser-drop connector lines. Default: true. */
  showDropLines?: boolean;
  /**
   * V5.6 · one match editor: when given, results are entered in the host's match editor (same rules, messages
   * and conflict handling as every other entry point) and this bracket only opens the match there.
   */
  onOpenMatch?: (matchId: number) => void;
  /** Same as `onOpenMatch`, as a link (outside the host page). */
  openMatchHref?: (matchId: number) => string;
  /** V5.7: a set stage says sets instead of BO. */
  matchRules?: { setsToWin: number } | null;
}

/** Inline score form rendered below the canvas for ready matches. */
function ScoreForm({
  match,
  pending,
  scores,
  onScores,
  onComplete,
  onRevert,
  playerNames,
  onBegin,
}: {
  match: DoubleEliminationMatch;
  pending: boolean;
  scores: readonly [number, number];
  onScores: (s: [number, number]) => void;
  onComplete: () => void;
  onRevert: () => void;
  playerNames: string;
  onBegin: () => void;
}) {
  const winsRequired = Math.floor((match.bestOf ?? 1) / 2) + 1;
  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <p className="text-sm font-semibold">{playerNames}</p>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="font-medium">{match.name}</span>
        {match.status === "completed" ? (
          <Badge variant="secondary">{t("doubleEliminationBracket.zakonczony")}</Badge>
        ) : (
          <Badge variant="outline">
            {t("doubleEliminationBracket.bo")}{match.bestOf ?? 1} {t("doubleEliminationBracket.do")}{" "}{winsRequired} {t("doubleEliminationBracket.wygranych")}</Badge>
        )}
      </div>
      {match.status === "ready" && match.matchId != null && (
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <Input
            aria-label={t("doubleEliminationBracket.wynik_1_name", { name: match.name })}
            onFocus={onBegin}
            type="number"
            min={0}
            max={winsRequired}
            value={scores[0]}
            disabled={pending}
            onChange={e => onScores([Number(e.target.value), scores[1]])}
          />
          <Input
            aria-label={t("doubleEliminationBracket.wynik_2_name", { name: match.name })}
            onFocus={onBegin}
            type="number"
            min={0}
            max={winsRequired}
            value={scores[1]}
            disabled={pending}
            onChange={e => onScores([scores[0], Number(e.target.value)])}
          />
          <Button type="button" size="sm" disabled={pending} onClick={onComplete}>
            {t("doubleEliminationBracket.zapisz_wynik")}</Button>
        </div>
      )}
      {match.status === "completed" && match.matchId != null && (
        <p className="text-sm font-mono">{t("doubleEliminationBracket.zapisany_wynik")}{" "}{match.score1}:{match.score2}</p>
      )}
      {match.status === "completed" && match.matchId != null && (
        <Button
          className="w-full"
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={onRevert}
        >
          {t("doubleEliminationBracket.cofnij_skoryguj_wynik")}</Button>
      )}
    </div>
  );
}

export function DoubleEliminationBracket({
  tournamentId,
  stageId,
  state,
  canManage = false,
  canReset = false,
  onChanged,
  finalsPosition: finalsPositionProp,
  showDropLines = true,
  onOpenMatch,
  openMatchHref,
  matchRules = null,
}: DoubleEliminationBracketProps) {
  const opensEditor = !!onOpenMatch || !!openMatchHref;
  const [bracketLocation] = useLocation();
  const experimentalView = isExperimentalTournamentPath(bracketLocation);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [scores, setScores] = useState<Record<number, [number, number]>>({});
  const [finalsPos, setFinalsPos] = useState<"upper" | "between">(finalsPositionProp ?? "upper");

  const canonical = useListMatches(tournamentId, { query: { queryKey: getListMatchesQueryKey(tournamentId), enabled: canManage, refetchInterval: 5000 } });
  const resultDrafts = useMatchResultDrafts();
  const completeLock = useRef(false);
  const feedback = {
    onMutate: () => { setError(undefined); setSuccess(undefined); },
    onSuccess: () => refresh(),
    onError: async (reason: unknown) => {
      const failure = matchOperationError(reason);
      setError(`${failure.message}${failure.code ? t("doubleEliminationBracket.kod_diagnostyczny_code", { code: failure.code }) : ""}`);
      if (failure.conflict) await refresh();
    },
  };
  const complete = useCompleteMatch({ mutation: {
    ...feedback, retry: false,
    onError: async (reason, variables) => {
      if (matchOperationError(reason).code === "CONCURRENT_MODIFICATION") resultDrafts.markConflict(variables.id);
      await feedback.onError(reason);
    },
    onSettled: () => { completeLock.current = false; },
  } });
  const revert = useRevertMatch({ mutation: feedback });
  const reset = useResetDoubleEliminationStage({ mutation: feedback });

  const participants = useMemo(
    () => new Map<string, DoubleEliminationParticipant>(
      state.participants.map(p => [p.participantKey, p])
    ),
    [state.participants],
  );
  const pending = complete.isPending || revert.isPending || reset.isPending;

  const refresh = async () => {
    await Promise.all([invalidateTournamentDependentQueries(queryClient, tournamentId), queryClient.invalidateQueries({
      queryKey: getGetDoubleEliminationStageQueryKey(tournamentId, stageId),
    }, { throwOnError: true })]);
    onChanged?.();
  };

  const completeCanonicalMatch = (match: DoubleEliminationMatch) => {
    if (match.matchId == null || pending || completeLock.current || canonical.isError) return;
    const current = canonical.data?.find(candidate => candidate.id === match.matchId);
    if (!current || resultDrafts.isStale(current)) return;
    const draft = resultDrafts.capture(current);
    completeLock.current = true;
    const [score1, score2] = scores[match.matchId!] ?? [draft.score1 ?? 0, draft.score2 ?? 0];
    setError(undefined);
    complete.mutate(
      { id: match.matchId, data: { resultType: "played", expectedRevision: draft.revision, score1, score2 } },
      {
        onSuccess: () => {
          resultDrafts.discard(match.matchId!);
          setScores(cur => { const n = { ...cur }; delete n[match.matchId!]; return n; });
          setSuccess(t("doubleEliminationBracket.wynik_zapisany_stan_drabinki_zostal"));
        },
      },
    );
  };

  const revertCanonicalMatch = (match: DoubleEliminationMatch) => {
    if (match.matchId == null || pending) return;
    if (
      !window.confirm(
        t("doubleEliminationBracket.cofnac_wynik_meczu_v0_score1", { v0: match.slots.map(key => key ? participants.get(key)?.name ?? key : t("doubleEliminationBracket.oczekuje_na_gracza")).join(" – "), score1: match.score1, score2: match.score2 }) +
        (match.downstreamResultCount > 0 ? t("doubleEliminationBracket.zostanie_uniewaznionych_downstreamresult", { downstreamResultCount: match.downstreamResultCount }) : t("doubleEliminationBracket.ranking_i_awans_zostana_przeliczone")) +
        t("doubleEliminationBracket.nastepnie_wpiszesz_i_zapiszesz_poprawny"),
      )
    ) return;
    setError(undefined);
    const current = canonical.data?.find(candidate => candidate.id === match.matchId);
    if (!current) return;
    revert.mutate(
      { id: match.matchId, data: { expectedRevision: current.revision } },
      {
        onSuccess: () => {
          resultDrafts.discard(match.matchId!);
          setScores(current => { const next = { ...current }; delete next[match.matchId!]; return next; });
          setSuccess(t("doubleEliminationBracket.wynik_cofniety_wpisz_poprawny_wynik"));
        },
      },
    );
  };

  const resetStage = () => {
    const completed = state.matches.filter(m => m.status === "completed").length;
    if (!window.confirm(
      t("doubleEliminationBracket.reset_usunie_completed_zapisanych_wyniko", { completed: completed }) +
      t("doubleEliminationBracket.konfiguracja_etapu_pozostanie_bez_zmian"),
    )) return;
    setError(undefined);
    reset.mutate(
      { id: tournamentId, stageId, data: { expectedRevision: state.revision } },
      {
        onSuccess: () => { Object.values(resultDrafts.drafts).forEach(match => resultDrafts.discard(match.id)); setScores({}); setSuccess(t("doubleEliminationBracket.stan_drabinki_zostal_odswiezony")); },
      },
    );
  };

  const champion = state.championParticipantKey
    ? participants.get(state.championParticipantKey)
    : undefined;

  // Matches eligible for management (ready or completed with matchId)
  const actionableMatches = canManage
    ? state.matches.filter(
        m => m.matchId != null && (m.status === "ready" || m.status === "completed"),
      )
    : [];

  return (
    <div className="space-y-4" aria-label={t("doubleEliminationBracket.drabinka_podwojnej_eliminacji")}>
      {/* Top bar */}
      {/* QW-01: both groups wrap, so the toolbar never widens the page on a phone (it pushed 360 px screens sideways). */}
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>{t("doubleEliminationBracket.uczestnik_odpada_po_drugiej_porazce")}</span>
          {/* V5.8: the state revision is an operator detail — Experimental viewers do not see it. */}
          {(!experimentalView || canManage) && <Badge variant="outline">{t("doubleEliminationBracket.rewizja")}{" "}{state.revision}</Badge>}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {/* Finals position toggle */}
          {!finalsPositionProp && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setFinalsPos(v => v === "upper" ? "between" : "upper")}
              title={experimentalView ? t("doubleEliminationBracket.zmien_pozycje_wielkiego_finalu") : t("doubleEliminationBracket.zmien_pozycje_grand_finalu")}
            >
              <LayoutTemplate className="h-3.5 w-3.5" />
              {t("doubleEliminationBracket.finaly")}{" "}{finalsPos === "upper" ? (experimentalView ? t("doubleEliminationBracket.przy_drabince_wygranych") : t("doubleEliminationBracket.przy_upper")) : t("doubleEliminationBracket.pomiedzy")}
            </Button>
          )}
          {canReset && (
            <Button type="button" variant="outline" size="sm" disabled={pending} onClick={resetStage}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("doubleEliminationBracket.resetuj_etap")}</Button>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {canManage && canonical.isError && <div role="alert">{t("doubleEliminationBracket.nie_udalo_sie_pobrac_aktualnych")}{" "}<Button onClick={() => void canonical.refetch()}>{t("doubleEliminationBracket.sprobuj_ponownie")}</Button></div>}
      {pending && <p role="status" className="text-sm">{t("doubleEliminationBracket.zapisywanie_i_odswiezanie_drabinki")}</p>}
      {success && <p role="status" className="text-sm text-primary">{success}</p>}

      {champion && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-4">
            <Trophy className="h-6 w-6 text-primary" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("doubleEliminationBracket.zwyciezca_etapu")}</p>
              <p className="font-bold">#{champion.seed} {champion.name}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visual bracket canvas */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card/50 p-4">
        <DEBracketCanvas
          matches={state.matches}
          participants={participants}
          finalsPosition={finalsPositionProp ?? finalsPos}
          showDropLines={showDropLines}
        />
      </div>

      {/* V5.6: the bracket opens the one match editor instead of keeping its own result form. */}
      {opensEditor && actionableMatches.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("doubleEliminationBracket.mecze_do_prowadzenia")}</p>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label={t("doubleEliminationBracket.mecze_drabinki_do_prowadzenia")}>
            {actionableMatches.map(match => {
              const current = canonical.data?.find(candidate => candidate.id === match.matchId);
              const names = current ? `${current.player1Name ?? "?"} – ${current.player2Name ?? "?"}`
                : match.slots.map(key => key ? participants.get(key)?.name ?? key : t("doubleEliminationBracket.oczekuje_na_gracza")).join(" – ");
              const done = (current?.status ?? match.status) === "completed";
              const label = done ? t("doubleEliminationBracket.popraw_w_edytorze_meczu") : t("doubleEliminationBracket.wpisz_wynik_w_edytorze_meczu");
              return <li key={match.matchKey} className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{names}</span>
                  <span className="block text-xs text-muted-foreground">{deDisplayName(match.name, experimentalView)} · {done ? t("doubleEliminationBracket.wynik_v0_v1", { v0: current?.score1 ?? match.score1, v1: current?.score2 ?? match.score2 }) : matchRules ? t("doubleEliminationBracket.sety_do_setstowin", { setsToWin: matchRules.setsToWin }) : t("doubleEliminationBracket.bo_v0", { v0: match.bestOf ?? 1 })}</span>
                </span>
                {onOpenMatch
                  ? <Button type="button" size="sm" variant={done ? "outline" : "default"} onClick={() => onOpenMatch(match.matchId!)}>{label}</Button>
                  : <Button type="button" size="sm" variant={done ? "outline" : "default"} asChild><Link href={openMatchHref!(match.matchId!)}>{label}</Link></Button>}
              </li>;
            })}
          </ul>
        </div>
      )}

      {/* Management: score forms for actionable matches (pages without the host match editor) */}
      {!opensEditor && actionableMatches.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("doubleEliminationBracket.zarzadzanie_wynikami")}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {actionableMatches.map(match => {
              const current = canonical.data?.find(candidate => candidate.id === match.matchId);
              const draft = current && resultDrafts.drafts[current.id];
              const stale = current && resultDrafts.isStale(current);
              // Canonical participants, scores and revision come from the same response.
              const editing = current ? { ...match, bestOf: current.bestOf, score1: current.score1 ?? null, score2: current.score2 ?? null,
                status: current.status === "completed" ? "completed" as const
                  : current.status === "pending" || current.status === "in_progress" ? "ready" as const : "blocked" as const,
              } : match;
              return <div key={match.matchKey}>
                <ScoreForm
                  match={editing}
                  playerNames={current ? `${current.player1Name} – ${current.player2Name}` : match.slots.map(key => key ? participants.get(key)?.name ?? key : t("doubleEliminationBracket.oczekuje_na_gracza")).join(" – ")}
                  pending={pending || !current || canonical.isError || !!stale}
                  scores={stale ? [current?.score1 ?? 0, current?.score2 ?? 0] : scores[match.matchId!] ?? [current?.score1 ?? 0, current?.score2 ?? 0]}
                  onBegin={() => { if (current) resultDrafts.capture(current); }}
                  onScores={s => { if (current && !stale) { resultDrafts.capture(current); setScores(cur => ({ ...cur, [current.id]: s })); } }}
                  onComplete={() => completeCanonicalMatch(match)}
                  onRevert={() => revertCanonicalMatch(match)}
                />
                {stale && <div role="status" className="text-sm">
                  <p>{t("doubleEliminationBracket.nieaktualny_wynik_roboczy")}{" "}{draft?.player1Name} – {draft?.player2Name}, {scores[match.matchId!]?.[0] ?? 0}:{scores[match.matchId!]?.[1] ?? 0}{t("doubleEliminationBracket.sprawdz_aktualny_mecz_przed_nowa")}</p>
                  <Button disabled={pending || canonical.isError} onClick={() => {
                    resultDrafts.discard(current.id);
                    setScores(previous => { const next = { ...previous }; delete next[match.matchId!]; return next; });
                  }}>{t("doubleEliminationBracket.odrzuc_wynik_roboczy")}</Button>
                </div>}
              </div>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
