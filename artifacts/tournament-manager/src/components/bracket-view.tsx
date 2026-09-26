import { Bracket, Match } from "@workspace/api-client-react";
import { Trophy } from "lucide-react";
import { getDeadlockHero, type DeadlockHeroId } from "@workspace/game-catalog";
import { DeadlockHeroIcon } from "@/components/deadlock-game-config";
import { PickIcon } from "@/components/deadlock-bans-display";

// Layout constants — card heights must match actual rendered sizes
const CARD_W = 200;
const CARD_H = 64; // header + two compact player rows, including borders
const R1_GAP = 8;
const UNIT = CARD_H + R1_GAP;
const COL_GAP = 48; // matches gap-12 between round columns
const HEADER_H = 24; // fixed header above each round column

const PADDING = 16;

export function bracketNaturalSize(totalRounds: number, r1Matches: number, hasWinner = false) {
  const columns = totalRounds + Number(hasWinner);
  return {
    width: columns * CARD_W + Math.max(0, columns - 1) * COL_GAP + PADDING * 2,
    height: HEADER_H + r1Matches * CARD_H + Math.max(0, r1Matches - 1) * R1_GAP + PADDING * 2,
  };
}

/** Presentation only: retain server order and center each target on its sources. */
export function layoutBracket(bracket: Bracket) {
  type PositionedMatch = { match: Match; x: number; y: number };
  const columns: PositionedMatch[][] = [];
  const connections: { source: PositionedMatch; target: PositionedMatch }[] = [];
  for (const [ri, round] of bracket.rounds.entries()) {
    const previous = columns[ri - 1] ?? [];
    const column: PositionedMatch[] = [];
    for (const [mi, match] of round.matches.entries()) {
      const linked = previous.filter(source => source.match.nextMatchId === match.id);
      // Older read models omit links; keep their existing adjacent-pair layout.
      const sources = linked.length ? linked : previous.slice(mi * 2, mi * 2 + 2)
        .filter(source => source.match.nextMatchId == null);
      const center = sources.length
        ? sources.reduce((sum, source) => sum + source.y + CARD_H / 2, 0) / sources.length
        : PADDING + HEADER_H + mi * UNIT + CARD_H / 2;
      const y = Math.max(center - CARD_H / 2, column.length ? column[column.length - 1].y + UNIT : PADDING + HEADER_H);
      const target = { match, x: PADDING + ri * (CARD_W + COL_GAP), y };
      column.push(target);
      for (const source of sources) connections.push({ source, target });
    }
    columns.push(column);
  }
  const size = bracketNaturalSize(bracket.rounds.length, 0, !!bracket.winner);
  const final = columns.at(-1)?.[0];
  return {
    columns, connections,
    width: size.width,
    height: Math.max(PADDING + HEADER_H, ...columns.flat().map(node => node.y + CARD_H)) + PADDING,
    winner: bracket.winner && final ? { x: PADDING + columns.length * (CARD_W + COL_GAP), y: final.y } : undefined,
  };
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
  /** Explicit public-view zoom. Its scroll footprint follows the rendered size. */
  scale?: number;
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

export function BracketView({ bracket, format, forcedHeroId, matchPicksMap, scale = 1 }: BracketViewProps) {
  if (!bracket || !bracket.rounds || bracket.rounds.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground border border-dashed border-border rounded-lg bg-background/50">
        Brak drabinki. Wystartuj turniej, żeby zobaczyć drabinkę.
      </div>
    );
  }

  const totalRounds = bracket.rounds.length;
  const layout = layoutBracket(bracket);

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain select-none" aria-label="Drabinka eliminacyjna" tabIndex={0}>
      <div className="relative overflow-hidden" style={{ width: layout.width * scale, height: layout.height * scale }}>
        <div className="absolute left-0 top-0" style={{ width: layout.width, height: layout.height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <svg aria-hidden="true" className="absolute inset-0 pointer-events-none" width={layout.width} height={layout.height}>
            {layout.connections.map(({ source, target }) => <path key={source.match.id}
              data-source-match={source.match.id} data-target-match={target.match.id}
              d={`M ${source.x + CARD_W} ${source.y + CARD_H / 2} H ${source.x + CARD_W + COL_GAP / 2} V ${target.y + CARD_H / 2} H ${target.x}`}
              fill="none" stroke="hsl(var(--border))" strokeWidth={1} />)}
            {layout.winner && <path d={`M ${layout.winner.x - COL_GAP} ${layout.winner.y + CARD_H / 2} H ${layout.winner.x}`}
              fill="none" stroke="hsl(var(--border))" strokeWidth={1} />}
          </svg>
          {bracket.rounds.map((round, ri) => <div key={round.round}>
            <div className="absolute text-center font-bold text-[10px] text-muted-foreground uppercase tracking-wider"
              style={{ left: PADDING + ri * (CARD_W + COL_GAP), top: PADDING, width: CARD_W, height: HEADER_H, lineHeight: `${HEADER_H}px` }}>
              {roundLabel(round.round, totalRounds, format)}
            </div>
            {layout.columns[ri].map(({ match, x, y }) => <div key={match.id} data-match-id={match.id} className="absolute" style={{ left: x, top: y, width: CARD_W, height: CARD_H }}>
              <MatchBox match={match} forcedHeroId={forcedHeroId} matchPicksMap={matchPicksMap} />
            </div>)}
          </div>)}
          {bracket.winner && layout.winner && <>
            <div className="absolute text-center font-bold text-[10px] text-primary uppercase tracking-wider"
              style={{ left: layout.winner.x, top: PADDING, width: CARD_W, height: HEADER_H, lineHeight: `${HEADER_H}px` }}>Zwycięzca</div>
            <div aria-label="Zwycięzca drabinki" style={{ left: layout.winner.x, top: layout.winner.y, width: CARD_W, height: CARD_H }}
              className="absolute border-2 border-primary rounded-lg bg-primary/10 shadow-[0_0_20px_rgba(0,200,255,0.15)] flex flex-col items-center justify-center gap-1 px-2">
              <Trophy className="w-4 h-4 text-primary shrink-0" />
              <span title={bracket.winner.name} className="max-w-full line-clamp-2 font-bold text-xs text-primary text-center leading-tight break-all">{bracket.winner.name}</span>
            </div>
          </>}
        </div>
      </div>
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
