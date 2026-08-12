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
import { RotateCcw, Shield, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/tournament-stages-ui";

const BRACKET_LABELS = {
  upper: "Upper Bracket",
  lower: "Lower Bracket",
  grand_final: "Grand Final",
  grand_final_reset: "Grand Final Reset",
} as const;

interface DoubleEliminationBracketProps {
  tournamentId: number;
  stageId: number;
  state: DoubleEliminationStageState;
  canManage?: boolean;
  canReset?: boolean;
  onChanged?: () => void;
}

function MatchCard({
  match,
  participants,
  canManage,
  pending,
  scores,
  onScores,
  onComplete,
  onRevert,
}: {
  match: DoubleEliminationMatch;
  participants: ReadonlyMap<string, DoubleEliminationParticipant>;
  canManage: boolean;
  pending: boolean;
  scores: readonly [number, number];
  onScores: (scores: [number, number]) => void;
  onComplete: () => void;
  onRevert: () => void;
}) {
  const winsRequired = Math.floor((match.bestOf ?? 1) / 2) + 1;

  return (
    <div className="min-w-64 rounded-lg border bg-card p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{match.name}</span>
        <Badge variant="secondary">{match.status}</Badge>
      </div>
      <div className="space-y-2">
        {match.slots.map((participantKey, slotIndex) => {
          const participant = participantKey ? participants.get(participantKey) : undefined;
          const winner = participantKey != null && match.winnerParticipantKey === participantKey;
          return (
            <div
              key={`${match.matchKey}-${slotIndex}`}
              className={`flex min-h-10 items-center justify-between gap-2 rounded-md border px-3 py-2 ${winner ? "border-primary bg-primary/10" : "bg-background"}`}
            >
              <span className={winner ? "font-semibold" : ""}>
                {participant ? `#${participant.seed} ${participant.name}` : "TBD"}
              </span>
              <span className="flex items-center gap-2">
                {match.status === "completed" && (
                  <span className="font-mono text-sm">{slotIndex === 0 ? match.score1 : match.score2}</span>
                )}
                {winner && <Trophy className="h-4 w-4 text-primary" />}
              </span>
            </div>
          );
        })}
      </div>
      {canManage && match.status === "ready" && match.matchId != null && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            BO{match.bestOf ?? 1}: do {winsRequired} wygranych gier/map
          </p>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <Input
              aria-label={`Wynik pierwszej strony ${match.name}`}
              type="number"
              min={0}
              max={winsRequired}
              value={scores[0]}
              onChange={(event) => onScores([Number(event.target.value), scores[1]])}
            />
            <Input
              aria-label={`Wynik drugiej strony ${match.name}`}
              type="number"
              min={0}
              max={winsRequired}
              value={scores[1]}
              onChange={(event) => onScores([scores[0], Number(event.target.value)])}
            />
            <Button type="button" size="sm" disabled={pending} onClick={onComplete}>
              Zapisz
            </Button>
          </div>
        </div>
      )}
      {canManage && match.status === "completed" && match.matchId != null && (
        <Button className="mt-3 w-full" type="button" size="sm" variant="outline" disabled={pending} onClick={onRevert}>
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
}: DoubleEliminationBracketProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>();
  const [scores, setScores] = useState<Record<string, [number, number]>>({});
  const complete = useCompleteMatch();
  const revert = useRevertMatch();
  const reset = useResetDoubleEliminationStage();
  const participants = useMemo(
    () => new Map(state.participants.map((participant) => [participant.participantKey, participant])),
    [state.participants],
  );
  const pending = complete.isPending || revert.isPending || reset.isPending;

  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: getGetDoubleEliminationStageQueryKey(tournamentId, stageId),
    });
    onChanged?.();
  };

  const completeCanonicalMatch = (match: DoubleEliminationMatch) => {
    if (match.matchId == null) return;
    const [score1, score2] = scores[match.matchKey] ?? [0, 0];
    setError(undefined);
    complete.mutate(
      { id: match.matchId, data: { resultType: "played", score1, score2 } },
      {
        onSuccess: () => {
          setScores((current) => {
            const next = { ...current };
            delete next[match.matchKey];
            return next;
          });
          void refresh();
        },
        onError: (reason) => setError(getApiErrorMessage(reason)),
      },
    );
  };

  const revertCanonicalMatch = (match: DoubleEliminationMatch) => {
    if (match.matchId == null) return;
    if (match.downstreamResultCount > 0 && !window.confirm(
      `Cofnięcie zmieni dalszą drabinkę i unieważni ${match.downstreamResultCount} późniejszych wyników. ` +
      "Wyniki i game-picki tych meczów zostaną cofnięte. Kontynuować?",
    )) return;
    setError(undefined);
    revert.mutate(
      { id: match.matchId },
      {
        onSuccess: () => void refresh(),
        onError: (reason) => setError(getApiErrorMessage(reason)),
      },
    );
  };

  const resetStage = () => {
    const completed = state.matches.filter((match) => match.status === "completed").length;
    if (!window.confirm(
      `Reset usunie ${completed} zapisanych wyników, powiązane game-picki i odtworzy drabinkę od początku. ` +
      "Konfiguracja etapu pozostanie bez zmian. Kontynuować?",
    )) return;
    setError(undefined);
    reset.mutate(
      { id: tournamentId, stageId, data: { expectedRevision: state.revision } },
      {
        onSuccess: () => void refresh(),
        onError: (reason) => setError(getApiErrorMessage(reason)),
      },
    );
  };

  const champion = state.championParticipantKey
    ? participants.get(state.championParticipantKey)
    : undefined;

  return (
    <div className="space-y-4" aria-label="Drabinka podwójnej eliminacji">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Uczestnik odpada po drugiej porażce.</span>
          <Badge variant="outline">Rewizja {state.revision}</Badge>
        </div>
        {canReset && (
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={resetStage}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Resetuj etap
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

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

      {(Object.keys(BRACKET_LABELS) as Array<keyof typeof BRACKET_LABELS>).map((bracket) => {
        const bracketMatches = state.matches.filter((match) => match.bracket === bracket);
        if (bracketMatches.length === 0) return null;
        if (bracket === "grand_final_reset" && bracketMatches.every((match) => match.status === "skipped")) {
          return (
            <Card key={bracket}>
              <CardContent className="p-4 text-sm text-muted-foreground">
                Reset finału nie jest wymagany.
              </CardContent>
            </Card>
          );
        }
        const rounds = [...new Set(bracketMatches.map((match) => match.round))].sort((a, b) => a - b);
        return (
          <Card key={bracket}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{BRACKET_LABELS[bracket]}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto pb-5">
              <div className="flex min-w-max items-start gap-6">
                {rounds.map((round) => (
                  <section key={round} className="space-y-3" aria-label={`${BRACKET_LABELS[bracket]}, runda ${round}`}>
                    <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Runda {round}</p>
                    {bracketMatches
                      .filter((match) => match.round === round)
                      .sort((left, right) => left.order - right.order)
                      .map((match) => (
                        <MatchCard
                          key={match.matchKey}
                          match={match}
                          participants={participants}
                          canManage={canManage}
                          pending={pending}
                          scores={scores[match.matchKey] ?? [0, 0]}
                          onScores={(next) => setScores((current) => ({ ...current, [match.matchKey]: next }))}
                          onComplete={() => completeCanonicalMatch(match)}
                          onRevert={() => revertCanonicalMatch(match)}
                        />
                      ))}
                  </section>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
