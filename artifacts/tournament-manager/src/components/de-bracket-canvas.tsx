/**
 * DEBracketCanvas — visual layout for a Double Elimination bracket.
 *
 * Renders Upper Bracket, Lower Bracket and Grand Final sections with
 * SVG connector lines based on actual match dependency data (data-driven)
 * and structural fallback for pending matches.
 *
 * Slot highlighting: LB slots that received a loser from UB are marked
 * with a distinct left-border colour so viewers can distinguish
 * "dropped from Upper" from "won in Lower".
 */

import { useMemo } from "react";
import { Trophy, ArrowDownRight } from "lucide-react";
import type {
  DoubleEliminationMatch,
  DoubleEliminationParticipant,
} from "@workspace/api-client-react";

// ─── Layout constants ────────────────────────────────────────────────────────

const CARD_W = 220;
const CARD_H = 76;   // header(16) + two player rows(30×2)
const SMALL_GAP = 8; // gap between adjacent R1 cards
const UNIT = CARD_H + SMALL_GAP; // 84 — vertical rhythm unit
const COL_GAP = 56;  // horizontal gap between round columns
const SECTION_LABEL_H = 28; // section header height
const SECTION_GAP = 32; // vertical gap between UB and LB sections

// ─── Position helpers ────────────────────────────────────────────────────────

/** Top-Y for a match at round-index ri (0-based) and order i (0-based, within that round). */
function ubMatchTopY(ri: number, i: number): number {
  return ((2 ** ri) - 1) * UNIT / 2 + i * (2 ** ri) * UNIT;
}

/**
 * Top-Y for a match in the Lower Bracket.
 * k = ceil((lbRi+1)/2) encodes whether it is a minor or major round.
 * Minor rounds (lbRi=0,2,4…) receive UB losers; major rounds (lbRi=1,3,5…) receive 1 UB loser + 1 LB winner.
 */
function lbMatchTopY(lbRi: number, i: number): number {
  const k = Math.ceil((lbRi + 1) / 2);
  const paddingTop = ((2 ** k) - 1) * UNIT / 2;
  const spacing = (2 ** k) * UNIT;
  return paddingTop + i * spacing;
}

function matchLeftX(ri: number): number {
  return ri * (CARD_W + COL_GAP);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DEBracketCanvasProps {
  matches: DoubleEliminationMatch[];
  participants: ReadonlyMap<string, DoubleEliminationParticipant>;
  finalsPosition?: "upper" | "between";
  /** Compact mode reduces card heights for OBS */
  compact?: boolean;
  /** Colour of connector lines (CSS value) */
  connectorColor?: string;
  connectorWidth?: number;
  /** Hide match names/numbers */
  hideMatchNames?: boolean;
  /** Hide empty/TBD matches */
  hideEmpty?: boolean;
}

// ─── Derived data ─────────────────────────────────────────────────────────────

interface MatchPos {
  match: DoubleEliminationMatch;
  x: number;
  y: number;
  ri: number; // round index (0-based within its bracket)
  i: number;  // order index (0-based within its round)
}

interface ConnectorLine {
  x1: number; y1: number;
  x2: number; y2: number;
  midX: number;
  /** For pair connectors, the second source y */
  y2b?: number;
  type: "winner" | "loser-drop";
}

function useDELayout(
  matches: DoubleEliminationMatch[],
  participants: ReadonlyMap<string, DoubleEliminationParticipant>,
  finalsPosition: "upper" | "between",
): {
  ubPositions: MatchPos[];
  lbPositions: MatchPos[];
  gfPositions: MatchPos[];
  gfrPositions: MatchPos[];
  ubWidth: number;
  lbWidth: number;
  gfWidth: number;
  ubHeight: number;
  lbHeight: number;
  ubConnectors: ConnectorLine[];
  lbConnectors: ConnectorLine[];
  /** Set of matchKey+slot combinations that are UB-drop slots in LB */
  ubDropSlots: Set<string>;
} {
  return useMemo(() => {
    const ubMatches = matches.filter(m => m.bracket === "upper").sort((a, b) => a.round - b.round || a.order - b.order);
    const lbMatches = matches.filter(m => m.bracket === "lower").sort((a, b) => a.round - b.round || a.order - b.order);
    const gfMatches = matches.filter(m => m.bracket === "grand_final");
    const gfrMatches = matches.filter(m => m.bracket === "grand_final_reset");

    // Sorted unique round numbers
    const ubRoundNums = [...new Set(ubMatches.map(m => m.round))].sort((a, b) => a - b);
    const lbRoundNums = [...new Set(lbMatches.map(m => m.round))].sort((a, b) => a - b);

    // Maps for quick lookup
    const ubByRoundOrder = new Map<string, DoubleEliminationMatch>();
    const lbByRoundOrder = new Map<string, DoubleEliminationMatch>();
    for (const m of ubMatches) ubByRoundOrder.set(`${m.round}-${m.order}`, m);
    for (const m of lbMatches) lbByRoundOrder.set(`${m.round}-${m.order}`, m);

    // Participant → source match (winner/loser)
    const winnerOf = new Map<string, DoubleEliminationMatch>();
    const loserOf = new Map<string, DoubleEliminationMatch>();
    for (const m of matches) {
      if (m.winnerParticipantKey) winnerOf.set(m.winnerParticipantKey, m);
      if (m.loserParticipantKey) loserOf.set(m.loserParticipantKey, m);
    }

    // UB match positions
    const ubPositions: MatchPos[] = ubMatches.map(m => {
      const ri = ubRoundNums.indexOf(m.round);
      const i = m.order;
      return { match: m, x: matchLeftX(ri), y: ubMatchTopY(ri, i), ri, i };
    });

    // LB match positions
    const lbPositions: MatchPos[] = lbMatches.map(m => {
      const lbRi = lbRoundNums.indexOf(m.round);
      const i = m.order;
      return { match: m, x: matchLeftX(lbRi), y: lbMatchTopY(lbRi, i), ri: lbRi, i };
    });

    // GF positions
    const gfX = finalsPosition === "upper"
      ? matchLeftX(ubRoundNums.length) // after last UB column
      : 0;
    const gfY = 0;
    const gfPositions: MatchPos[] = gfMatches.map((m, idx) => ({
      match: m, x: gfX + idx * (CARD_W + COL_GAP), y: gfY, ri: idx, i: 0,
    }));
    const gfrPositions: MatchPos[] = gfrMatches.map((m, idx) => ({
      match: m, x: gfX + (gfMatches.length + idx) * (CARD_W + COL_GAP), y: gfY, ri: idx, i: 0,
    }));

    // Dimensions
    const ubRounds = ubRoundNums.length;
    const lbRounds = lbRoundNums.length;
    const gfRounds = gfMatches.length + gfrMatches.length;

    // UB R1 count for height calculation
    const ubR1Count = ubMatches.filter(m => m.round === ubRoundNums[0]).length;
    const lbR1Count = lbMatches.filter(m => m.round === lbRoundNums[0]).length;
    const lbLastRoundIdx = lbRoundNums.length - 1;
    const lbK = Math.ceil((lbLastRoundIdx + 1) / 2);
    const lbLastPaddingTop = lbLastRoundIdx >= 0 ? ((2 ** lbK) - 1) * UNIT / 2 : 0;

    const ubWidth = ubRounds * CARD_W + Math.max(0, ubRounds - 1) * COL_GAP
      + (finalsPosition === "upper" && gfRounds > 0 ? COL_GAP + gfRounds * (CARD_W + COL_GAP) : 0);
    const lbWidth = lbRounds * CARD_W + Math.max(0, lbRounds - 1) * COL_GAP;
    const gfWidth = gfRounds * CARD_W + Math.max(0, gfRounds - 1) * COL_GAP;
    const ubHeight = ubR1Count > 0 ? ubR1Count * UNIT - SMALL_GAP : CARD_H;
    const lbHeight = lbR1Count > 0 ? Math.max(lbLastPaddingTop + CARD_H, lbR1Count * 2 * UNIT - SMALL_GAP) : CARD_H;

    // ── UB structural connectors ─────────────────────────────────────────────
    const ubConnectors: ConnectorLine[] = [];
    const ubPosByKey = new Map<string, MatchPos>(ubPositions.map(p => [p.match.matchKey, p]));
    const lbPosByKey = new Map<string, MatchPos>(lbPositions.map(p => [p.match.matchKey, p]));

    for (let ri = 0; ri < ubRoundNums.length - 1; ri++) {
      const roundMatches = ubPositions.filter(p => p.ri === ri).sort((a, b) => a.i - b.i);
      for (let j = 0; j < roundMatches.length; j += 2) {
        const src1 = roundMatches[j];
        const src2 = roundMatches[j + 1];
        const nextOrder = Math.floor(j / 2);
        const tgtMatch = ubByRoundOrder.get(`${ubRoundNums[ri + 1]}-${nextOrder}`);
        const tgt = tgtMatch ? ubPosByKey.get(tgtMatch.matchKey) : undefined;
        if (!tgt) continue;

        const x1 = src1.x + CARD_W;
        const y1 = src1.y + CARD_H / 2;
        const midX = src1.x + CARD_W + COL_GAP / 2;

        if (src2) {
          ubConnectors.push({ x1, y1, x2: tgt.x, y2: tgt.y + CARD_H / 2, midX, y2b: src2.y + CARD_H / 2, type: "winner" });
        } else {
          ubConnectors.push({ x1, y1, x2: tgt.x, y2: tgt.y + CARD_H / 2, midX, type: "winner" });
        }
      }
    }

    // UB last round → GF (winner path)
    if (finalsPosition === "upper" && ubRoundNums.length > 0 && gfPositions.length > 0) {
      const lastUbRound = ubPositions.filter(p => p.ri === ubRoundNums.length - 1)[0];
      const gfFirst = gfPositions[0];
      if (lastUbRound && gfFirst) {
        ubConnectors.push({
          x1: lastUbRound.x + CARD_W,
          y1: lastUbRound.y + CARD_H / 2,
          x2: gfFirst.x,
          y2: gfFirst.y + CARD_H / 2,
          midX: lastUbRound.x + CARD_W + COL_GAP / 2,
          type: "winner",
        });
      }
    }

    // ── LB structural connectors ─────────────────────────────────────────────
    const lbConnectors: ConnectorLine[] = [];

    for (let lbRi = 0; lbRi < lbRoundNums.length - 1; lbRi++) {
      const roundMatches = lbPositions.filter(p => p.ri === lbRi).sort((a, b) => a.i - b.i);
      const nextRoundMatches = lbPositions.filter(p => p.ri === lbRi + 1).sort((a, b) => a.i - b.i);
      const isMinorRound = lbRi % 2 === 0; // even index = minor → goes 1:1 to next major

      if (isMinorRound) {
        // Minor → Major: 1:1 connections (match i winner → match i in next round)
        for (let j = 0; j < roundMatches.length; j++) {
          const src = roundMatches[j];
          const tgt = nextRoundMatches[j];
          if (!src || !tgt) continue;
          lbConnectors.push({
            x1: src.x + CARD_W,
            y1: src.y + CARD_H / 2,
            x2: tgt.x,
            y2: tgt.y + CARD_H / 2,
            midX: src.x + CARD_W + COL_GAP / 2,
            type: "winner",
          });
        }
      } else {
        // Major → Minor: pair connections (matches 2i, 2i+1 → match i in next round)
        for (let j = 0; j < roundMatches.length; j += 2) {
          const src1 = roundMatches[j];
          const src2 = roundMatches[j + 1];
          const tgt = nextRoundMatches[Math.floor(j / 2)];
          if (!src1 || !tgt) continue;
          lbConnectors.push({
            x1: src1.x + CARD_W,
            y1: src1.y + CARD_H / 2,
            x2: tgt.x,
            y2: tgt.y + CARD_H / 2,
            midX: src1.x + CARD_W + COL_GAP / 2,
            y2b: src2 ? src2.y + CARD_H / 2 : undefined,
            type: "winner",
          });
        }
      }
    }

    // LB last round → GF (winner path, when GF is "between")
    if (finalsPosition === "between" && lbRoundNums.length > 0 && gfPositions.length > 0) {
      const lastLbRound = lbPositions.filter(p => p.ri === lbRoundNums.length - 1)[0];
      if (lastLbRound && gfPositions[0]) {
        lbConnectors.push({
          x1: lastLbRound.x + CARD_W,
          y1: lastLbRound.y + CARD_H / 2,
          x2: lbWidth + COL_GAP,
          y2: lastLbRound.y + CARD_H / 2,
          midX: lastLbRound.x + CARD_W + COL_GAP / 2,
          type: "winner",
        });
      }
    }

    // ── Detect UB-drop slots ─────────────────────────────────────────────────
    // A slot in an LB match is a "UB drop" if the participant there came from a
    // loserOf relationship (i.e. they lost in UB and dropped down).
    const ubDropSlots = new Set<string>();
    for (const m of lbMatches) {
      for (const [slotIdx, participantKey] of m.slots.entries()) {
        if (!participantKey) continue;
        const src = loserOf.get(participantKey);
        if (src && src.bracket === "upper") {
          ubDropSlots.add(`${m.matchKey}-${slotIdx}`);
        }
      }
    }
    // Also mark LB R1 slots structurally (all slots from UB R1 losers = LB minor R1)
    if (lbRoundNums.length > 0) {
      for (const m of lbMatches.filter(m => m.round === lbRoundNums[0])) {
        for (let s = 0; s < 2; s++) {
          ubDropSlots.add(`${m.matchKey}-${s}`);
        }
      }
    }

    return {
      ubPositions, lbPositions, gfPositions, gfrPositions,
      ubWidth, lbWidth, gfWidth, ubHeight, lbHeight,
      ubConnectors, lbConnectors, ubDropSlots,
    };
  }, [matches, participants, finalsPosition]);
}

// ─── Match card ───────────────────────────────────────────────────────────────

function DEMatchCard({
  match,
  participants,
  ubDropSlots,
  hideMatchName,
  compact,
}: {
  match: DoubleEliminationMatch;
  participants: ReadonlyMap<string, DoubleEliminationParticipant>;
  ubDropSlots: Set<string>;
  hideMatchName?: boolean;
  compact?: boolean;
}) {
  const cardH = compact ? 64 : CARD_H;
  const headerH = 16;
  const rowH = (cardH - headerH) / 2;

  const isDone = match.status === "completed";
  const isBye = match.status === "bye" || match.status === "skipped";
  const isReady = match.status === "ready"; // both players known, waiting for result

  const borderClass = isDone
    ? "border-border/50 opacity-85"
    : isReady
    ? "border-primary/30 bg-primary/3"
    : "border-border bg-card";

  return (
    <div
      className={`border rounded-md overflow-hidden flex flex-col w-full h-full transition-colors select-none ${borderClass}`}
      style={{ width: CARD_W, height: cardH }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between bg-muted/30 border-b border-border/40 px-2 shrink-0"
        style={{ height: headerH }}
      >
        {!hideMatchName && (
          <span className="text-[9px] font-mono text-muted-foreground leading-none truncate">
            {match.name}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1 shrink-0">
          {isReady && <span className="text-[8px] text-primary/60 font-bold">●</span>}
          {isDone && <span className="text-[8px] text-green-400">✓</span>}
        </div>
      </div>

      {/* Slots */}
      {match.slots.map((participantKey, slotIdx) => {
        const participant = participantKey ? participants.get(participantKey) : undefined;
        const isWinner = participantKey != null && match.winnerParticipantKey === participantKey;
        const isUbDrop = match.bracket === "lower" && ubDropSlots.has(`${match.matchKey}-${slotIdx}`);
        const score = slotIdx === 0 ? match.score1 : match.score2;
        const isPending = !participantKey;

        return (
          <div
            key={slotIdx}
            className={`flex items-center px-2 flex-1 min-h-0 gap-1 relative ${
              isWinner ? "bg-primary/10" : ""
            }`}
            style={{ borderLeft: isUbDrop ? "2px solid hsl(var(--warning, 38 92% 50%))" : "2px solid transparent" }}
          >
            {isUbDrop && !isWinner && (
              <ArrowDownRight className="w-3 h-3 text-amber-400/70 shrink-0" aria-label="Spada z Upper Bracket" />
            )}
            <span
              className={`text-[11px] leading-tight truncate flex-1 min-w-0 ${
                isPending
                  ? "text-muted-foreground/50 italic"
                  : isWinner
                  ? "font-bold text-primary"
                  : "text-foreground"
              }`}
            >
              {isPending ? "TBD" : participant ? `#${participant.seed} ${participant.name}` : "?"}
            </span>
            {isDone && score != null && (
              <span
                className={`text-[11px] font-mono font-bold w-5 text-right shrink-0 ${
                  isWinner ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {score}
              </span>
            )}
            {isWinner && <Trophy className="w-3 h-3 text-primary shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Connector SVG ────────────────────────────────────────────────────────────

function ConnectorSVG({
  width,
  height,
  connectors,
  connectorColor,
  connectorWidth: lineWidth = 1,
}: {
  width: number;
  height: number;
  connectors: ConnectorLine[];
  connectorColor?: string;
  connectorWidth?: number;
}) {
  const stroke = connectorColor ?? "hsl(var(--border))";
  const dropStroke = connectorColor ?? "hsl(var(--warning, 38 92% 50%) / 0.5)";

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      style={{ overflow: "visible" }}
      aria-hidden="true"
    >
      {connectors.map((c, idx) => {
        const isDrop = c.type === "loser-drop";
        const s = isDrop ? dropStroke : stroke;
        const sw = lineWidth;
        const dash = isDrop ? "4 3" : undefined;

        if (c.y2b !== undefined) {
          // Pair connector: two sources → one target via midpoint
          return (
            <g key={idx} stroke={s} strokeWidth={sw} fill="none" strokeDasharray={dash}>
              <line x1={c.x1} y1={c.y1} x2={c.midX} y2={c.y1} />
              <line x1={c.x1} y1={c.y2b} x2={c.midX} y2={c.y2b} />
              <line x1={c.midX} y1={c.y1} x2={c.midX} y2={c.y2b} />
              <line x1={c.midX} y1={c.y2} x2={c.x2} y2={c.y2} />
            </g>
          );
        } else {
          // Simple 1:1 connector
          return (
            <g key={idx} stroke={s} strokeWidth={sw} fill="none" strokeDasharray={dash}>
              <line x1={c.x1} y1={c.y1} x2={c.midX} y2={c.y1} />
              {c.y1 !== c.y2 && <line x1={c.midX} y1={c.y1} x2={c.midX} y2={c.y2} />}
              <line x1={c.midX} y1={c.y2} x2={c.x2} y2={c.y2} />
            </g>
          );
        }
      })}
    </svg>
  );
}

// ─── Section renderer ─────────────────────────────────────────────────────────

function BracketSection({
  label,
  positions,
  totalWidth,
  totalHeight,
  connectors,
  participants,
  ubDropSlots,
  connectorColor,
  connectorWidth,
  compact,
  hideMatchNames,
}: {
  label: string;
  positions: MatchPos[];
  totalWidth: number;
  totalHeight: number;
  connectors: ConnectorLine[];
  participants: ReadonlyMap<string, DoubleEliminationParticipant>;
  ubDropSlots: Set<string>;
  connectorColor?: string;
  connectorWidth?: number;
  compact?: boolean;
  hideMatchNames?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <div
        className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 pb-2"
        style={{ height: SECTION_LABEL_H, lineHeight: `${SECTION_LABEL_H}px` }}
      >
        {label}
      </div>
      <div
        className="relative shrink-0"
        style={{ width: Math.max(totalWidth, CARD_W), height: Math.max(totalHeight, CARD_H) }}
      >
        <ConnectorSVG
          width={Math.max(totalWidth, CARD_W)}
          height={Math.max(totalHeight, CARD_H)}
          connectors={connectors}
          connectorColor={connectorColor}
          connectorWidth={connectorWidth}
        />
        {positions.map(({ match, x, y }) => (
          <div
            key={match.matchKey}
            className="absolute"
            style={{ left: x, top: y, width: CARD_W, height: compact ? 64 : CARD_H }}
          >
            <DEMatchCard
              match={match}
              participants={participants}
              ubDropSlots={ubDropSlots}
              hideMatchName={hideMatchNames}
              compact={compact}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Grand Final section ──────────────────────────────────────────────────────

function GrandFinalSection({
  gfPositions,
  gfrPositions,
  participants,
  ubDropSlots,
  compact,
  hideMatchNames,
}: {
  gfPositions: MatchPos[];
  gfrPositions: MatchPos[];
  participants: ReadonlyMap<string, DoubleEliminationParticipant>;
  ubDropSlots: Set<string>;
  compact?: boolean;
  hideMatchNames?: boolean;
}) {
  const allGf = [...gfPositions, ...gfrPositions];
  if (allGf.length === 0) return null;

  const skippedReset = gfrPositions.every(p => p.match.status === "skipped");

  return (
    <div className="flex flex-col">
      <div
        className="text-[10px] font-bold uppercase tracking-widest text-primary/70 pb-2"
        style={{ height: SECTION_LABEL_H, lineHeight: `${SECTION_LABEL_H}px` }}
      >
        Grand Final
      </div>
      <div className="flex items-start gap-4">
        {gfPositions.map(({ match }) => (
          <div key={match.matchKey} style={{ width: CARD_W, height: compact ? 64 : CARD_H }}>
            <DEMatchCard
              match={match}
              participants={participants}
              ubDropSlots={ubDropSlots}
              hideMatchName={hideMatchNames}
              compact={compact}
            />
          </div>
        ))}
        {gfrPositions.map(({ match }) => (
          skippedReset ? (
            <div
              key={match.matchKey}
              className="border border-dashed border-border/30 rounded-md flex items-center justify-center text-[11px] text-muted-foreground/40"
              style={{ width: CARD_W, height: compact ? 64 : CARD_H }}
            >
              Reset nie jest wymagany
            </div>
          ) : (
            <div key={match.matchKey} style={{ width: CARD_W, height: compact ? 64 : CARD_H }}>
              <DEMatchCard
                match={match}
                participants={participants}
                ubDropSlots={ubDropSlots}
                hideMatchName={hideMatchNames}
                compact={compact}
              />
            </div>
          )
        ))}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function DEBracketCanvas({
  matches,
  participants,
  finalsPosition = "upper",
  compact,
  connectorColor,
  connectorWidth,
  hideMatchNames,
}: DEBracketCanvasProps) {
  const {
    ubPositions,
    lbPositions,
    gfPositions,
    gfrPositions,
    ubWidth,
    lbWidth,
    ubHeight,
    lbHeight,
    ubConnectors,
    lbConnectors,
    ubDropSlots,
  } = useDELayout(matches, participants, finalsPosition);

  if (matches.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground border border-dashed border-border rounded-lg">
        Brak meczów do wyświetlenia.
      </div>
    );
  }

  // When finalsPosition === "upper", extend the UB section width to include GF columns
  const ubSectionWidth = finalsPosition === "upper"
    ? ubWidth
    : ubWidth;

  // Width of the whole canvas
  const canvasWidth = Math.max(ubSectionWidth, lbWidth);

  return (
    <div
      className="overflow-auto select-none"
      style={{ minWidth: "max-content" }}
      aria-label="Drabinka podwójnej eliminacji"
    >
      <div style={{ minWidth: canvasWidth }}>
        {/* ── Upper Bracket ── */}
        {ubPositions.length > 0 && (
          <BracketSection
            label="Upper Bracket"
            positions={ubPositions}
            totalWidth={ubSectionWidth}
            totalHeight={ubHeight}
            connectors={ubConnectors}
            participants={participants}
            ubDropSlots={ubDropSlots}
            connectorColor={connectorColor}
            connectorWidth={connectorWidth}
            compact={compact}
            hideMatchNames={hideMatchNames}
          />
        )}

        {/* ── Grand Final (between) ── */}
        {finalsPosition === "between" && (gfPositions.length > 0 || gfrPositions.length > 0) && (
          <div style={{ marginTop: SECTION_GAP }}>
            <GrandFinalSection
              gfPositions={gfPositions}
              gfrPositions={gfrPositions}
              participants={participants}
              ubDropSlots={ubDropSlots}
              compact={compact}
              hideMatchNames={hideMatchNames}
            />
          </div>
        )}

        {/* ── Lower Bracket ── */}
        {lbPositions.length > 0 && (
          <div style={{ marginTop: SECTION_GAP }}>
            <BracketSection
              label="Lower Bracket"
              positions={lbPositions}
              totalWidth={lbWidth}
              totalHeight={lbHeight}
              connectors={lbConnectors}
              participants={participants}
              ubDropSlots={ubDropSlots}
              connectorColor={connectorColor}
              connectorWidth={connectorWidth}
              compact={compact}
              hideMatchNames={hideMatchNames}
            />
          </div>
        )}

        {/* ── Grand Final (upper — appended to UB section) ── */}
        {finalsPosition === "upper" && (gfPositions.length > 0 || gfrPositions.length > 0) && (
          <div style={{ marginTop: SECTION_GAP }}>
            <GrandFinalSection
              gfPositions={gfPositions}
              gfrPositions={gfrPositions}
              participants={participants}
              ubDropSlots={ubDropSlots}
              compact={compact}
              hideMatchNames={hideMatchNames}
            />
          </div>
        )}
      </div>
    </div>
  );
}
