import { Bracket, Match } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { getDeadlockHero, type DeadlockHeroId } from "@workspace/game-catalog";
import { DeadlockHeroIcon } from "@/components/deadlock-game-config";
import { PickIcon } from "@/components/deadlock-bans-display";

// Layout constants — card heights must match actual rendered sizes
const CARD_W = 200;
const CARD_H = 72; // header(18) + player×2(27×2)
const R1_GAP = 8;
const UNIT = CARD_H + R1_GAP; // 72 — base vertical rhythm
const COL_GAP = 48; // matches gap-12 between round columns
const HEADER_H = 24; // fixed header above each round column

/** Round column gap between consecutive matches at round index ri */
function matchGap(ri: number) {
  return Math.pow(2, ri) * UNIT - CARD_H;
}

/** Padding-top of the matches sub-div so first match aligns correctly */
function matchPaddingTop(ri: number) {
  return ((Math.pow(2, ri) - 1) * UNIT) / 2;
}

/** Distance from center of even match to center of odd match (for SVG span) */
function pairSpan(ri: number) {
  return Math.pow(2, ri) * UNIT;
}

export function bracketNaturalSize(totalRounds: number, r1Matches: number) {
  const width =
    totalRounds * CARD_W +
    (totalRounds - 1) * COL_GAP +
    COL_GAP +
    CARD_W + // winner column
    64; // px-4 on each side
  const height =
    HEADER_H +
    r1Matches * CARD_H +
    (r1Matches - 1) * R1_GAP +
    64; // pt/pb
  return { width, height };
}

function roundLabel(round: number, total: number, format?: string): string {
  if (format && format !== "single_elimination") return `Runda ${round}`;
  const remaining = total - round + 1;
  if (remaining === 1) return "Finał";
  if (remaining === 2) return "Półfinał";
  if (remaining === 3) return "Ćwierćfinał";
  return `Runda ${round}`;
}

/** Summary pick for a match: hero played in the last (decisive) game. */
export type MatchPickSummary = { p1HeroId?: string | null; p2HeroId?: string | null };

interface BracketViewProps {
  bracket: Bracket;
  format?: string;
  forcedHeroId?: DeadlockHeroId;
  /**
   * matchId → representative pick for each match (last game's hero).
   * When provided, the bracket shows a small pick icon per player instead of
   * displaying ban rows (which were removed to reduce visual clutter).
   */
  matchPicksMap?: Map<number, MatchPickSummary>;
  /**
   * @deprecated Bans are no longer rendered in the bracket tree (too cluttered).
   * Pass matchPicksMap instead to show the hero played per match.
   */
  playerBansMap?: Map<number, string[]>;
}

export function BracketView({ bracket, format, forcedHeroId, matchPicksMap }: BracketViewProps) {
  if (!bracket || !bracket.rounds || bracket.rounds.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground border border-dashed border-border rounded-lg bg-background/50">
        Brak drabinki. Wystartuj turniej, żeby zobaczyć drabinkę.
      </div>
    );
  }

  const totalRounds = bracket.rounds.length;

  return (
    <div
      className="flex pb-8 pt-4 px-4 select-none"
      style={{ alignItems: "flex-start", gap: COL_GAP }}
    >
      {bracket.rounds.map((round, ri) => {
        const gap = matchGap(ri);
        const pt = matchPaddingTop(ri);
        const ps = pairSpan(ri);

        return (
          <div key={round.round} className="flex flex-col shrink-0" style={{ width: CARD_W }}>
            {/* Round header */}
            <div
              className="text-center font-bold text-[10px] text-muted-foreground uppercase tracking-wider shrink-0"
              style={{ height: HEADER_H, lineHeight: `${HEADER_H}px` }}
            >
              {roundLabel(round.round, totalRounds, format)}
            </div>

            {/* Matches sub-column */}
            <div
              className="flex flex-col"
              style={{ paddingTop: pt, gap }}
            >
              {round.matches.map((match, mi) => (
                <div
                  key={match.id}
                  className="relative shrink-0"
                  style={{ height: CARD_H }}
                >
                  <MatchBox
                    match={match}
                    forcedHeroId={forcedHeroId}
                    matchPicksMap={matchPicksMap}
                  />

                  {/* Connector to next round — only from even-indexed matches */}
                  {ri < totalRounds - 1 && mi % 2 === 0 && (
                    <svg
                      className="absolute pointer-events-none"
                      style={{
                        left: CARD_W,
                        top: CARD_H / 2,
                        width: COL_GAP,
                        height: ps,
                        overflow: "visible",
                      }}
                    >
                      <line x1={0} y1={0} x2={COL_GAP / 2} y2={0}
                        stroke="hsl(var(--border))" strokeWidth={1} />
                      <line x1={COL_GAP / 2} y1={0} x2={COL_GAP / 2} y2={ps}
                        stroke="hsl(var(--border))" strokeWidth={1} />
                      <line x1={0} y1={ps} x2={COL_GAP / 2} y2={ps}
                        stroke="hsl(var(--border))" strokeWidth={1} />
                      <line x1={COL_GAP / 2} y1={ps / 2} x2={COL_GAP} y2={ps / 2}
                        stroke="hsl(var(--border))" strokeWidth={1} />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Winner column */}
      {bracket.winner && (
        <div className="flex flex-col shrink-0" style={{ width: CARD_W }}>
          <div
            className="text-center font-bold text-[10px] text-primary uppercase tracking-wider"
            style={{ height: HEADER_H, lineHeight: `${HEADER_H}px` }}
          >
            Zwycięzca
          </div>
          <div
            style={{
              marginTop: matchPaddingTop(totalRounds),
              height: CARD_H,
            }}
            className="border-2 border-primary rounded-lg bg-primary/10 shadow-[0_0_20px_rgba(0,200,255,0.15)] flex flex-col items-center justify-center gap-1 px-2"
          >
            <Trophy className="w-4 h-4 text-primary shrink-0" />
            <span className="font-bold text-xs text-primary text-center leading-tight break-all">
              {bracket.winner.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function MatchBox({
  match,
  forcedHeroId,
  matchPicksMap,
}: {
  match: Match;
  forcedHeroId?: DeadlockHeroId;
  matchPicksMap?: Map<number, MatchPickSummary>;
}) {
  const isDone = match.status === "completed";
  const isLive = match.status === "in_progress";
  const isBye = match.resultType === "bye";
  const forcedHero = getDeadlockHero(forcedHeroId);
  const picks = matchPicksMap?.get(match.id);

  const borderClass = isLive
    ? "border-yellow-500/60 bg-yellow-500/5 shadow-[0_0_8px_rgba(234,179,8,0.08)]"
    : isDone
    ? "border-border/60 opacity-80"
    : isBye
    ? "border-border/30 border-dashed opacity-40"
    : "border-border bg-card";

  return (
    <div
      className={`border rounded-md overflow-hidden flex flex-col w-full h-full transition-colors ${borderClass}`}
    >
      {/* Match header */}
      <div
        className="flex justify-between items-center bg-muted/30 px-1.5 border-b border-border/40 shrink-0"
        style={{ height: 16 }}
      >
        <span className="flex items-center gap-1 text-[9px] text-muted-foreground font-mono leading-none">
          {forcedHero && <DeadlockHeroIcon hero={forcedHero} className="h-6 w-6" />}
          M{match.matchNumber}
        </span>
        {isLive && (
          <span className="text-[8px] text-yellow-400 font-bold animate-pulse leading-none">
            LIVE
          </span>
        )}
        {isDone && (
          <span className="text-[8px] text-green-400 leading-none">
            {match.resultType === "walkover" ? "WO" : match.resultType === "no_contest" ? "NC" : "✓"}
          </span>
        )}
        {isBye && (
          <span className="text-[8px] text-muted-foreground leading-none">
            BYE
          </span>
        )}
      </div>

      {/* Players */}
      <PlayerRow
        name={match.player1Name}
        score={match.score1}
        isWinner={isDone && match.winnerId === match.player1Id}
        isPending={!match.player1Id && !isBye}
        pickHeroId={match.player1Id ? picks?.p1HeroId : undefined}
      />
      <div className="h-px bg-border/40 shrink-0" />
      <PlayerRow
        name={match.player2Name}
        score={match.score2}
        isWinner={isDone && match.winnerId === match.player2Id}
        isPending={!match.player2Id && !isBye}
        pickHeroId={match.player2Id ? picks?.p2HeroId : undefined}
      />
    </div>
  );
}

function PlayerRow({
  name,
  score,
  isWinner,
  isPending,
  pickHeroId,
}: {
  name?: string | null;
  score?: number | null;
  isWinner: boolean;
  isPending: boolean;
  /** Hero this player used in the match (shown as small pick icon). */
  pickHeroId?: string | null;
}) {
  const pickHero = pickHeroId ? getDeadlockHero(pickHeroId as never) : null;
  return (
    <div
      className={`flex justify-between items-center px-1.5 flex-1 min-h-0 gap-1 ${
        isWinner ? "bg-primary/10" : ""
      }`}
    >
      <span
        className={`text-[11px] leading-tight truncate flex-1 min-w-0 ${
          isPending
            ? "text-muted-foreground italic"
            : isWinner
            ? "font-bold text-primary"
            : "text-foreground"
        }`}
      >
        {isPending ? "TBD" : name || "?"}
      </span>
      {pickHero && (
        <PickIcon
          heroId={pickHeroId}
          size={18}
          title={`Grana postać: ${pickHero.displayName}`}
        />
      )}
      <span
        className={`text-[11px] font-mono font-bold w-5 text-right shrink-0 ${
          isWinner ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {score !== null && score !== undefined ? score : "–"}
      </span>
    </div>
  );
}
