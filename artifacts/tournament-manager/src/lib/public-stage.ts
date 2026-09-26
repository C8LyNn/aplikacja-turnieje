import type { Bracket, TournamentStage } from "@workspace/api-client-react";

/** Public views follow lifecycle status, never the response's incidental order. */
export function selectPublicStage(stages: TournamentStage[] | undefined, activeStageId?: number | null) {
  const ordered = [...(stages ?? [])].sort((a, b) => b.position - a.position || b.id - a.id);
  return ordered.find(stage => stage.id === activeStageId && stage.status === "active")
    ?? ordered.find(stage => stage.status === "active")
    ?? ordered.find(stage => stage.status === "completed");
}

export function publicStageBracket(bracket: Bracket | undefined, stage: TournamentStage | undefined): Bracket | undefined {
  if (!bracket || !stage) return undefined;
  const rounds = bracket.rounds.map(round => ({ ...round, matches: round.matches.filter(match => match.stageId === stage.id) }))
    .filter(round => round.matches.length > 0);
  // The winner ID comes from the backend stage, not from a tournament-wide ranking.
  const players = rounds.flatMap(round => round.matches.flatMap(match => [
    { id: match.player1Id, name: match.player1Name }, { id: match.player2Id, name: match.player2Name },
  ]));
  const winner = stage.winnerId ? players.find(player => player.id === stage.winnerId && player.name) : undefined;
  return { ...bracket, rounds, winner: winner ? { id: winner.id!, name: winner.name! } : undefined };
}

export function publicStageLabel(stage: TournamentStage | undefined) {
  return stage ? `${stage.name} — Etap ${stage.position}` : "Brak rozpoczętego etapu.";
}
