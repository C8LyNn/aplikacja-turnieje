import type { Match, TournamentStage } from "@workspace/api-client-react";

export function operationalStage(stages: readonly TournamentStage[]) {
  const ordered = [...stages].sort((a, b) => a.position - b.position);
  return ordered.find(s => s.status === "active") ?? ordered.find(s => s.status === "planned")
    ?? ordered.filter(s => s.status === "completed").at(-1);
}

/** Presentation of existing matches only; never determines readiness or generates rounds. */
export function organizerStageSummary(stage: TournamentStage | undefined, matches: readonly Match[] | undefined) {
  const own = matches?.filter(m => m.stageId === stage?.id);
  const completed = own?.filter(m => m.status === "completed").length ?? 0;
  const unfinished = own?.filter(m => m.status !== "completed") ?? [];
  const rounds = own?.map(m => m.round).filter(r => r > 0) ?? [];
  // DE has independent Upper/Lower/GF rounds, groups have independent schedules.
  const classic = stage && ["round_robin", "single_elimination", "swiss"].includes(stage.format);
  const live = unfinished.filter(m => m.status === "in_progress");
  const candidates = (live.length ? live : unfinished).map(m => m.round).filter(r => r > 0);
  const round = classic && stage.status !== "planned" && rounds.length
    ? (stage.status === "completed" || !candidates.length ? Math.max(...rounds) : Math.min(...candidates)) : undefined;
  const total = stage?.totalRounds ?? stage?.plannedRounds ?? (rounds.length ? Math.max(...rounds) : undefined);
  const roundLabel = !stage ? "Sprawdzanie etapu" : stage.status === "planned" ? "Etap planowany"
    : !classic ? (stage.status === "completed" ? "Etap zakończony" : stage.format === "double_elimination" ? "Rundy osobno w drabinkach" : "Rundy osobno w grupach")
    : round === undefined ? "Sprawdzanie rundy" : `${stage.status === "completed" ? "Ostatnia runda" : "Runda"} ${round}${total ? `/${total}` : ""}`;
  return { round, roundLabel, completed, totalMatches: own?.length, remaining: unfinished.length };
}
