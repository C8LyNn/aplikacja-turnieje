import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetDoubleEliminationStageQueryKey,
  type DoubleEliminationMatch,
  type DoubleEliminationParticipant,
  type DoubleEliminationStageState,
  useCompleteMatch,
  useResetDoubleEliminationStage,
  useRevertMatch,
} from "@workspace/api-client-react";
import { RotateCcw, Shield, Trophy, LayoutTemplate } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
}: {
  match: DoubleEliminationMatch;
  pending: boolean;
  scores: readonly [number, number];
  onScores: (s: [number, number]) => void;
  onComplete: () => void;
  onRevert: () => void;
  playerNames: string;
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
            type="number"
            min={0}
            max={winsRequired}
            value={scores[0]}
            disabled={pending}
            onChange={e => onScores([Number(e.target.value), scores[1]])}
          />
          <Input
            aria-label={`Wynik 2 — ${match.name}`}
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
  const [scores, setScores] = useState<Record<string, [number, number]>>({});
  const [finalsPos, setFinalsPos] = useState<"upper" | "between">(finalsPositionProp ?? "upper");

  const feedback = {
    onMutate: () => { setError(undefined); setSuccess(undefined); },
    onSuccess: () => refresh(),
    onError: async (reason: unknown) => {
      const failure = matchOperationError(reason);
      setError(`${failure.message}${failure.code ? ` Kod diagnostyczny: ${failure.code}` : ""}`);
      if (failure.conflict) await refresh();
    },
  };
  const complete = useCompleteMatch({ mutation: feedback });
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
    if (match.matchId == null || pending) return;
    const [score1, score2] = scores[match.matchKey] ?? [0, 0];
    setError(undefined);
    complete.mutate(
      { id: match.matchId, data: { resultType: "played", score1, score2 } },
      {
        onSuccess: () => {
          setScores(cur => { const n = { ...cur }; delete n[match.matchKey]; return n; });
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
          setScores(current => { const next = { ...current }; delete next[match.matchKey]; return next; });
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
        onSuccess: () => { setScores({}); setSuccess("Stan drabinki został odświeżony."); },
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
            {actionableMatches.map(match => (
              <ScoreForm
                key={match.matchKey}
                match={match}
                playerNames={match.slots.map(key => key ? participants.get(key)?.name ?? key : "Oczekuje na gracza").join(" – ")}
                pending={pending}
                scores={scores[match.matchKey] ?? [0, 0]}
                onScores={s => setScores(cur => ({ ...cur, [match.matchKey]: s }))}
                onComplete={() => completeCanonicalMatch(match)}
                onRevert={() => revertCanonicalMatch(match)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
