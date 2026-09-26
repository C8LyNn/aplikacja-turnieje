import { useMemo, useRef, useState } from "react";
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
import { DEBracketCanvas } from "@/components/de-bracket-canvas";

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
          <Badge variant="secondary">Zakończony</Badge>
        ) : (
          <Badge variant="outline">
            BO{match.bestOf ?? 1} — do {winsRequired} wygranych
          </Badge>
        )}
      </div>
      {match.status === "ready" && match.matchId != null && (
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <Input
            aria-label={`Wynik 1 — ${match.name}`}
            onFocus={onBegin}
            type="number"
            min={0}
            max={winsRequired}
            value={scores[0]}
            disabled={pending}
            onChange={e => onScores([Number(e.target.value), scores[1]])}
          />
          <Input
            aria-label={`Wynik 2 — ${match.name}`}
            onFocus={onBegin}
            type="number"
            min={0}
            max={winsRequired}
            value={scores[1]}
            disabled={pending}
            onChange={e => onScores([scores[0], Number(e.target.value)])}
          />
          <Button type="button" size="sm" disabled={pending} onClick={onComplete}>
            Zapisz wynik
          </Button>
        </div>
      )}
      {match.status === "completed" && match.matchId != null && (
        <p className="text-sm font-mono">Zapisany wynik: {match.score1}:{match.score2}</p>
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
          Cofnij / skoryguj wynik
        </Button>
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
}: DoubleEliminationBracketProps) {
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
      setError(`${failure.message}${failure.code ? ` Kod diagnostyczny: ${failure.code}` : ""}`);
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
          setSuccess("Wynik zapisany. Stan drabinki został odświeżony.");
        },
      },
    );
  };

  const revertCanonicalMatch = (match: DoubleEliminationMatch) => {
    if (match.matchId == null || pending) return;
    if (
      !window.confirm(
        `Cofnąć wynik meczu ${match.slots.map(key => key ? participants.get(key)?.name ?? key : "Oczekuje na gracza").join(" – ")} (${match.score1}:${match.score2})? ` +
        (match.downstreamResultCount > 0 ? `Zostanie unieważnionych ${match.downstreamResultCount} późniejszych wyników i powiązane wybory postaci. ` : "Ranking i awans zostaną przeliczone. ") +
        "Następnie wpiszesz i zapiszesz poprawny wynik.",
      )
    ) return;
    setError(undefined);
    revert.mutate(
      { id: match.matchId },
      {
        onSuccess: () => {
          resultDrafts.discard(match.matchId!);
          setScores(current => { const next = { ...current }; delete next[match.matchId!]; return next; });
          setSuccess("Wynik cofnięty. Wpisz poprawny wynik w formularzu tego meczu.");
        },
      },
    );
  };

  const resetStage = () => {
    const completed = state.matches.filter(m => m.status === "completed").length;
    if (!window.confirm(
      `Reset usunie ${completed} zapisanych wyników, powiązane game-picki i odtworzy drabinkę od początku. ` +
      "Konfiguracja etapu pozostanie bez zmian. Kontynuować?",
    )) return;
    setError(undefined);
    reset.mutate(
      { id: tournamentId, stageId, data: { expectedRevision: state.revision } },
      {
        onSuccess: () => { Object.values(resultDrafts.drafts).forEach(match => resultDrafts.discard(match.id)); setScores({}); setSuccess("Stan drabinki został odświeżony."); },
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
    <div className="space-y-4" aria-label="Drabinka podwójnej eliminacji">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Uczestnik odpada po drugiej porażce.</span>
          <Badge variant="outline">Rewizja {state.revision}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Finals position toggle */}
          {!finalsPositionProp && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setFinalsPos(v => v === "upper" ? "between" : "upper")}
              title="Zmień pozycję Grand Finału"
            >
              <LayoutTemplate className="h-3.5 w-3.5" />
              Finały: {finalsPos === "upper" ? "przy Upper" : "pomiędzy"}
            </Button>
          )}
          {canReset && (
            <Button type="button" variant="outline" size="sm" disabled={pending} onClick={resetStage}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Resetuj etap
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {canManage && canonical.isError && <div role="alert">Nie udało się pobrać aktualnych meczów. <Button onClick={() => void canonical.refetch()}>Spróbuj ponownie</Button></div>}
      {pending && <p role="status" className="text-sm">Zapisywanie i odświeżanie drabinki…</p>}
      {success && <p role="status" className="text-sm text-primary">{success}</p>}

      {champion && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-4">
            <Trophy className="h-6 w-6 text-primary" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Zwycięzca etapu</p>
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

      {/* Management: score forms for actionable matches */}
      {actionableMatches.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Zarządzanie wynikami
          </p>
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
                  playerNames={current ? `${current.player1Name} – ${current.player2Name}` : match.slots.map(key => key ? participants.get(key)?.name ?? key : "Oczekuje na gracza").join(" – ")}
                  pending={pending || !current || canonical.isError || !!stale}
                  scores={stale ? [current?.score1 ?? 0, current?.score2 ?? 0] : scores[match.matchId!] ?? [current?.score1 ?? 0, current?.score2 ?? 0]}
                  onBegin={() => { if (current) resultDrafts.capture(current); }}
                  onScores={s => { if (current && !stale) { resultDrafts.capture(current); setScores(cur => ({ ...cur, [current.id]: s })); } }}
                  onComplete={() => completeCanonicalMatch(match)}
                  onRevert={() => revertCanonicalMatch(match)}
                />
                {stale && <div role="status" className="text-sm">
                  <p>Nieaktualny draft: {draft?.player1Name} – {draft?.player2Name}, {scores[match.matchId!]?.[0] ?? 0}:{scores[match.matchId!]?.[1] ?? 0}. Sprawdź aktualny mecz przed nową edycją.</p>
                  <Button disabled={pending || canonical.isError} onClick={() => {
                    resultDrafts.discard(current.id);
                    setScores(previous => { const next = { ...previous }; delete next[match.matchId!]; return next; });
                  }}>Odrzuć wynik roboczy</Button>
                </div>}
              </div>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
