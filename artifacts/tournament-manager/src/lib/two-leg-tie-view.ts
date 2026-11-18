/**
 * V5.10 · two-legged ties (dwumecz) for the screens: the same calculation as the API (`@workspace/match-rules`),
 * read out the way people say it — each leg home side first, then the aggregate and what it means.
 */
import { describeTie, legScoreHomeFirst, type LegScore, type SetMatchRules } from "@workspace/match-rules";

type MatchLike = {
  player1Name?: string | null;
  player2Name?: string | null;
  player1Id?: number | null;
  player2Id?: number | null;
  status?: string;
  winnerId?: number | null;
  legs?: Array<{ leg: number; status: string; score1: number | null; score2: number | null; scheduledAt?: string | null; completedAt?: string | null; revision: number }> | null;
  tie?: { state: string; total1: number; total2: number; completedLegs: number; decidedBy: string | null; decisionReason: string | null; decisionWinnerId: number | null } | null;
};

type RulesLike = { kind: string } | null | undefined;

/** Set rules only (other kinds — e.g. a two-legged tie — are not set matches). */
export function setRulesOf<T extends RulesLike>(rules: T): Extract<NonNullable<T>, { kind: "sets" }> | null {
  return rules?.kind === "sets" ? (rules as Extract<NonNullable<T>, { kind: "sets" }>) : null;
}

export function isSetRules(rules: RulesLike): rules is SetMatchRules {
  return rules?.kind === "sets";
}

export function isTwoLegTie(match: MatchLike | null | undefined): match is MatchLike & { legs: NonNullable<MatchLike["legs"]>; tie: NonNullable<MatchLike["tie"]> } {
  return !!match?.legs && match.legs.length === 2 && !!match.tie;
}

export const TIE_STATE_LABELS: Record<string, string> = {
  not_started: "Przed pierwszym spotkaniem",
  first_leg_played: "Po pierwszym spotkaniu",
  awaiting_decision: "Czeka na rozstrzygnięcie — awans wstrzymany",
  decided: "Rozstrzygnięty",
};

const names = (match: MatchLike) => ({ name1: match.player1Name ?? "Uczestnik 1", name2: match.player2Name ?? "Uczestnik 2" });

const legScores = (match: MatchLike): LegScore[] => (match.legs ?? []).map((leg) => ({
  leg: leg.leg as 1 | 2, status: leg.status === "completed" ? "completed" : "pending", score1: leg.score1, score2: leg.score2,
}));

export interface TieLegRow {
  leg: 1 | 2;
  label: string;
  homeName: string;
  awayName: string;
  homeScore: number | null;
  awayScore: number | null;
  played: boolean;
  scheduledAt: string | null;
  revision: number;
}

/** Both legs, each with its host first ("1. spotkanie: Wilki 2:1 Orły", "2. spotkanie: Orły 3:1 Wilki"). */
export function tieLegRows(match: MatchLike): TieLegRow[] {
  const people = names(match);
  return (match.legs ?? []).slice().sort((left, right) => left.leg - right.leg).map((leg) => {
    const homeFirst = legScoreHomeFirst({ leg: leg.leg as 1 | 2, status: leg.status === "completed" ? "completed" : "pending", score1: leg.score1, score2: leg.score2 });
    return {
      leg: leg.leg as 1 | 2,
      label: `${leg.leg}. spotkanie`,
      homeName: leg.leg === 1 ? people.name1 : people.name2,
      awayName: leg.leg === 1 ? people.name2 : people.name1,
      homeScore: homeFirst.home,
      awayScore: homeFirst.away,
      played: leg.status === "completed",
      scheduledAt: leg.scheduledAt ?? null,
      revision: leg.revision,
    };
  });
}

/** One sentence: "Łącznie 3:4 — awansuje Orły." / "… remis w sumie; czeka na rozstrzygnięcie organizatora …". */
export function tieSentence(match: MatchLike): string {
  if (!match.tie) return "";
  const decision = match.tie.decidedBy === "organizer" && match.tie.decisionWinnerId != null
    ? { winnerSide: (match.tie.decisionWinnerId === match.player1Id ? 1 : 2) as 1 | 2, reason: match.tie.decisionReason ?? "" }
    : null;
  return describeTie(legScores(match), names(match), decision);
}

/** "2·1" for participant 1 and "1·3" for participant 2 — their goals in leg 1 and leg 2 (bracket rows). */
export function tieRowLegs(match: MatchLike, side: 1 | 2): string {
  return (match.legs ?? []).slice().sort((left, right) => left.leg - right.leg)
    .map((leg) => (leg.status === "completed" ? String(side === 1 ? leg.score1 : leg.score2) : "–")).join("·");
}

/** Score text a list shows for a tie: the (running) aggregate, e.g. "3:4" — or null for any other match. */
export function tieScoreText(match: MatchLike): string | null {
  if (!isTwoLegTie(match)) return null;
  if (match.tie.completedLegs === 0) return null;
  return `${match.tie.total1}:${match.tie.total2}`;
}

export function formatLegDate(iso: string | null): string {
  if (!iso) return "bez terminu";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "bez terminu";
  return date.toLocaleString("pl-PL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
