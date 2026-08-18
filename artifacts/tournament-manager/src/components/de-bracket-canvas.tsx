/**
 * DEBracketCanvas — professional double-elimination bracket layout.
 *
 * One horizontally-scrollable canvas:
 *   • UB section (top):  columns R1 → R2 → … → UB Final
 *   • LB section (below): columns LB R1 → … → LB Final
 *   • Grand Final: rightmost column, to the right of both sections
 *
 * All cards are absolutely positioned in a single div; one SVG layer
 * renders all connectors (UB winner path, LB winner path, UB→LB
 * loser-drop diagonal lines).
 *
 * Root cause of previous "giant empty areas" bug:
 *   m.order is a global sequential number across all rounds, not a
 *   round-local index. The fix: group by round, sort within each
 *   round, and use a local 0-based index for Y positioning.
 */

import { useMemo } from "react";
import { Trophy, ArrowDownRight } from "lucide-react";
import type {
  DoubleEliminationMatch,
  DoubleEliminationParticipant,
} from "@workspace/api-client-react";

// ─── Layout constants ────────────────────────────────────────────────────────

const CARD_W = 220;
const CARD_H = 76;
const SMALL_GAP = 8;
const UNIT = CARD_H + SMALL_GAP; // 84 — base vertical rhythm
const COL_GAP = 56;
const COL_STEP = CARD_W + COL_GAP; // 276 — column stride
const SECTION_LABEL_H = 24;
const SECTION_GAP = 48; // vertical gap between UB area bottom and LB label
const GF_LABEL_H = 20;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DEBracketCanvasProps {
  matches: DoubleEliminationMatch[];
  participants: ReadonlyMap<string, DoubleEliminationParticipant>;
  finalsPosition?: "upper" | "between";
  compact?: boolean;
  connectorColor?: string;
  connectorWidth?: number;
  hideMatchNames?: boolean;
  hideEmpty?: boolean;
}

interface MatchPos {
  match: DoubleEliminationMatch;
  x: number;  // absolute canvas x
  y: number;  // absolute canvas y (top of card)
  ri: number; // round index 0-based within its bracket
  i: number;  // local match index 0-based within the round
}

interface WinnerLine {
  x1: number; y1: number;
  x2: number; y2: number;
  midX: number;
  y2b?: number; // second source y for pair connector
}

interface LoserDropLine {
  x1: number; y1: number; // bottom-center of source UB card
  x2: number; y2: number; // top-center of target LB card
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Group matches by round number, sort each group by global order. */
function groupAndSortByRound(
  matches: DoubleEliminationMatch[],
): Map<number, DoubleEliminationMatch[]> {
  const map = new Map<number, DoubleEliminationMatch[]>();
  for (const m of matches) {
    if (!map.has(m.round)) map.set(m.round, []);
    map.get(m.round)!.push(m);
  }
  for (const ms of map.values()) ms.sort((a, b) => a.order - b.order);
  return map;
}

/**
 * Y offset (relative to section origin) for match at local index `localIdx`
 * in a round containing `N` matches, given that the first round of this
 * bracket has `r1Count` matches.
 *
 * spacing = r1Count * UNIT / N  (doubles each time N halves)
 * paddingTop = (spacing - UNIT) / 2  (centers the card within its slot)
 */
function cardY(localIdx: number, N: number, r1Count: number): number {
  const spacing = (r1Count * UNIT) / N;
  const paddingTop = (spacing - UNIT) / 2;
  return paddingTop + localIdx * spacing;
}

// ─── Layout hook ─────────────────────────────────────────────────────────────

function useDELayout(
  matches: DoubleEliminationMatch[],
  _participants: ReadonlyMap<string, DoubleEliminationParticipant>,
  _finalsPosition: "upper" | "between",
) {
  return useMemo(() => {
    const ubMatches = matches.filter(m => m.bracket === "upper");
    const lbMatches = matches.filter(m => m.bracket === "lower");
    const gfMatches = matches.filter(m => m.bracket === "grand_final");
    const gfrMatches = matches.filter(m => m.bracket === "grand_final_reset");

    const ubByRound = groupAndSortByRound(ubMatches);
    const lbByRound = groupAndSortByRound(lbMatches);

    const ubRoundNums = [...ubByRound.keys()].sort((a, b) => a - b);
    const lbRoundNums = [...lbByRound.keys()].sort((a, b) => a - b);

    const ubR1Count = ubByRound.get(ubRoundNums[0])?.length ?? 1;
    const lbR1Count = lbByRound.get(lbRoundNums[0])?.length ?? 1;

    // ── Section Y offsets (absolute canvas coords) ────────────────────────────
    const UB_LABEL_Y = 0;
    const UB_Y = SECTION_LABEL_H;
    const ubHeight = ubR1Count * UNIT - SMALL_GAP;

    const LB_LABEL_Y = UB_Y + ubHeight + SECTION_GAP;
    const LB_Y = LB_LABEL_Y + SECTION_LABEL_H;
    const lbHeight = lbR1Count > 0 ? lbR1Count * UNIT - SMALL_GAP : CARD_H;
    const totalHeight = LB_Y + lbHeight;

    // ── UB card positions ─────────────────────────────────────────────────────
    const ubPositions: MatchPos[] = [];
    for (const [ri, roundNum] of ubRoundNums.entries()) {
      const roundMatches = ubByRound.get(roundNum)!;
      const N = roundMatches.length;
      for (const [localIdx, m] of roundMatches.entries()) {
        ubPositions.push({
          match: m,
          x: ri * COL_STEP,
          y: UB_Y + cardY(localIdx, N, ubR1Count),
          ri,
          i: localIdx,
        });
      }
    }

    // ── LB card positions ─────────────────────────────────────────────────────
    const lbPositions: MatchPos[] = [];
    for (const [lbRi, roundNum] of lbRoundNums.entries()) {
      const roundMatches = lbByRound.get(roundNum)!;
      const N = roundMatches.length;
      for (const [localIdx, m] of roundMatches.entries()) {
        lbPositions.push({
          match: m,
          x: lbRi * COL_STEP,
          y: LB_Y + cardY(localIdx, N, lbR1Count),
          ri: lbRi,
          i: localIdx,
        });
      }
    }

    // ── GF positions — rightmost column of the whole canvas ──────────────────
    // Place GF to the right of whichever bracket is wider so both UB Final
    // and LB Final connectors travel left-to-right.
    const gfBaseX = Math.max(ubRoundNums.length, lbRoundNums.length) * COL_STEP;
    const gfCenterY = UB_Y + (ubHeight - CARD_H) / 2; // vertically centred in UB area

    const gfPositions: MatchPos[] = gfMatches.map((m, idx) => ({
      match: m,
      x: gfBaseX + idx * COL_STEP,
      y: gfCenterY,
      ri: idx,
      i: 0,
    }));
    const gfrPositions: MatchPos[] = gfrMatches.map((m, idx) => ({
      match: m,
      x: gfBaseX + (gfMatches.length + idx) * COL_STEP,
      y: gfCenterY,
      ri: idx,
      i: 0,
    }));

    // ── Canvas total width ────────────────────────────────────────────────────
    const gfRoundsCount = gfMatches.length + gfrMatches.length;
    const rightEdge = gfRoundsCount > 0
      ? gfBaseX + (gfRoundsCount - 1) * COL_STEP + CARD_W
      : Math.max(
          ubRoundNums.length > 0 ? (ubRoundNums.length - 1) * COL_STEP + CARD_W : 0,
          lbRoundNums.length > 0 ? (lbRoundNums.length - 1) * COL_STEP + CARD_W : 0,
        );
    const totalWidth = rightEdge + 2; // +2 for sub-pixel border safety

    // ── Winner connectors ─────────────────────────────────────────────────────
    const winnerLines: WinnerLine[] = [];

    // UB internal: pair every two consecutive-round matches (2:1 always for UB)
    for (let ri = 0; ri < ubRoundNums.length - 1; ri++) {
      const cur = ubPositions.filter(p => p.ri === ri).sort((a, b) => a.i - b.i);
      const nxt = ubPositions.filter(p => p.ri === ri + 1).sort((a, b) => a.i - b.i);
      for (let j = 0; j < cur.length; j += 2) {
        const src1 = cur[j];
        const src2 = cur[j + 1];
        const tgt = nxt[Math.floor(j / 2)];
        if (!src1 || !tgt) continue;
        winnerLines.push({
          x1: src1.x + CARD_W, y1: src1.y + CARD_H / 2,
          x2: tgt.x,           y2: tgt.y + CARD_H / 2,
          midX: src1.x + CARD_W + COL_GAP / 2,
          y2b: src2 ? src2.y + CARD_H / 2 : undefined,
        });
      }
    }

    // UB Final → GF
    const ubFinal = ubPositions.filter(p => p.ri === ubRoundNums.length - 1)[0];
    if (ubFinal && gfPositions[0]) {
      winnerLines.push({
        x1: ubFinal.x + CARD_W, y1: ubFinal.y + CARD_H / 2,
        x2: gfPositions[0].x,  y2: gfPositions[0].y + CARD_H / 2,
        midX: ubFinal.x + CARD_W + (gfPositions[0].x - ubFinal.x - CARD_W) / 2,
      });
    }

    // LB internal: 1:1 when count stays the same, 2:1 (pair) when it halves
    for (let lbRi = 0; lbRi < lbRoundNums.length - 1; lbRi++) {
      const cur = lbPositions.filter(p => p.ri === lbRi).sort((a, b) => a.i - b.i);
      const nxt = lbPositions.filter(p => p.ri === lbRi + 1).sort((a, b) => a.i - b.i);
      const isPair = cur.length > nxt.length;

      if (isPair) {
        // 2:1: pairs of current-round winners feed one next-round match
        for (let j = 0; j < cur.length; j += 2) {
          const src1 = cur[j], src2 = cur[j + 1];
          const tgt = nxt[Math.floor(j / 2)];
          if (!src1 || !tgt) continue;
          winnerLines.push({
            x1: src1.x + CARD_W, y1: src1.y + CARD_H / 2,
            x2: tgt.x,           y2: tgt.y + CARD_H / 2,
            midX: src1.x + CARD_W + COL_GAP / 2,
            y2b: src2 ? src2.y + CARD_H / 2 : undefined,
          });
        }
      } else {
        // 1:1: each winner advances (other slot is filled by UB drop)
        for (let j = 0; j < cur.length; j++) {
          const src = cur[j], tgt = nxt[j];
          if (!src || !tgt) continue;
          winnerLines.push({
            x1: src.x + CARD_W, y1: src.y + CARD_H / 2,
            x2: tgt.x,          y2: tgt.y + CARD_H / 2,
            midX: src.x + CARD_W + COL_GAP / 2,
          });
        }
      }
    }

    // LB Final → GF
    const lbFinal = lbPositions.filter(p => p.ri === lbRoundNums.length - 1)[0];
    if (lbFinal && gfPositions[0]) {
      // GF is to the right of LB, so connector goes right then up
      const midX = lbFinal.x + CARD_W + (gfPositions[0].x - lbFinal.x - CARD_W) / 2;
      winnerLines.push({
        x1: lbFinal.x + CARD_W, y1: lbFinal.y + CARD_H / 2,
        x2: gfPositions[0].x,   y2: gfPositions[0].y + CARD_H / 2,
        midX,
      });
    }

    // GF → GFR
    if (gfPositions[0] && gfrPositions[0]) {
      winnerLines.push({
        x1: gfPositions[0].x + CARD_W, y1: gfPositions[0].y + CARD_H / 2,
        x2: gfrPositions[0].x,         y2: gfrPositions[0].y + CARD_H / 2,
        midX: gfPositions[0].x + CARD_W + COL_GAP / 2,
      });
    }

    // ── Loser-drop connectors (structural, UB→LB diagonal lines) ─────────────
    //
    // Mapping: UB ubRi=k drops losers into LB lbRi=2k (the "minor" LB rounds
    // that do NOT receive winners from the previous LB round — confirmed by
    // checking match counts: LB lbRi=0,2,4,6 each have the same count as the
    // corresponding UB round, and the other slot is the UB drop).
    //
    // Lines go from bottom-centre of UB card to top-centre of LB card,
    // passing through the SECTION_GAP. For the same column (ubRi=0→lbRi=0)
    // they are vertical; for later rounds they are diagonals from left to right
    // (UB cols 0-4 dropping into LB cols 0,2,4,6 which are further right).
    const loserDropLines: LoserDropLine[] = [];
    for (let ubRi = 0; ubRi < ubRoundNums.length - 1; ubRi++) {
      const targetLbRi = 2 * ubRi;
      if (targetLbRi >= lbRoundNums.length) continue;
      const ubRound = ubPositions.filter(p => p.ri === ubRi).sort((a, b) => a.i - b.i);
      const lbRound = lbPositions.filter(p => p.ri === targetLbRi).sort((a, b) => a.i - b.i);
      const count = Math.min(ubRound.length, lbRound.length);
      for (let j = 0; j < count; j++) {
        const src = ubRound[j];
        const tgt = lbRound[j];
        loserDropLines.push({
          x1: src.x + CARD_W / 2, y1: src.y + CARD_H,
          x2: tgt.x + CARD_W / 2, y2: tgt.y,
        });
      }
    }

    // ── UB-drop slot detection (for amber left-border in LB cards) ───────────
    const loserOf = new Map<string, DoubleEliminationMatch>();
    for (const m of ubMatches) {
      if (m.loserParticipantKey) loserOf.set(m.loserParticipantKey, m);
    }
    const ubDropSlots = new Set<string>();
    // Data-driven: participant confirmed to have come from UB loss
    for (const m of lbMatches) {
      for (const [slotIdx, pk] of m.slots.entries()) {
        if (pk && loserOf.has(pk)) ubDropSlots.add(`${m.matchKey}-${slotIdx}`);
      }
    }
    // Structural: all LB R1 slots (both players are UB losers, or a UB loser + bye)
    if (lbRoundNums.length > 0) {
      for (const m of lbMatches.filter(m => m.round === lbRoundNums[0])) {
        ubDropSlots.add(`${m.matchKey}-0`);
        ubDropSlots.add(`${m.matchKey}-1`);
      }
    }
    // Structural: second slot of 1:1 LB rounds (lbRi=2,4,6…) receives UB drop
    for (let ubRi = 1; ubRi < ubRoundNums.length - 1; ubRi++) {
      const targetLbRi = 2 * ubRi;
      if (targetLbRi >= lbRoundNums.length) continue;
      for (const m of lbMatches.filter(m => m.round === lbRoundNums[targetLbRi])) {
        ubDropSlots.add(`${m.matchKey}-1`);
      }
    }

    return {
      ubPositions, lbPositions, gfPositions, gfrPositions,
      UB_LABEL_Y, UB_Y, LB_LABEL_Y, LB_Y,
      ubHeight, lbHeight, totalWidth, totalHeight,
      winnerLines, loserDropLines,
      ubDropSlots,
    };
  }, [matches]);
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
  const isReady = match.status === "ready";

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

      {/* Player slots */}
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
            style={{
              borderLeft: isUbDrop
                ? "2px solid hsl(38 92% 50% / 0.6)"
                : "2px solid transparent",
              height: rowH,
            }}
          >
            {isUbDrop && !isWinner && (
              <ArrowDownRight
                className="w-3 h-3 text-amber-400/70 shrink-0"
                aria-label="Spada z Upper Bracket"
              />
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
    UB_LABEL_Y,
    UB_Y,
    LB_LABEL_Y,
    totalWidth,
    totalHeight,
    winnerLines,
    loserDropLines,
    ubDropSlots,
  } = useDELayout(matches, participants, finalsPosition);

  if (matches.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground border border-dashed border-border rounded-lg">
        Brak meczów do wyświetlenia.
      </div>
    );
  }

  const stroke = connectorColor ?? "hsl(var(--border))";
  const dropStroke = connectorColor ?? "hsl(38 92% 50% / 0.55)";
  const lineW = connectorWidth ?? 1;

  const cardH = compact ? 64 : CARD_H;

  const skippedReset =
    gfrPositions.length > 0 &&
    gfrPositions.every(p => p.match.status === "skipped");

  const allGfPos = [...gfPositions, ...gfrPositions];

  return (
    <div
      className="overflow-x-auto overflow-y-auto select-none"
      style={{ minWidth: 0 }}
      aria-label="Drabinka podwójnej eliminacji"
    >
      {/* Single absolute container — all sections live here */}
      <div
        className="relative shrink-0"
        style={{ width: totalWidth, height: totalHeight }}
      >
        {/* ── Connector SVG (drawn first, behind cards) ───────────────────── */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={totalWidth}
          height={totalHeight}
          style={{ overflow: "visible" }}
          aria-hidden="true"
        >
          {/* Winner connectors (UB + LB + GF paths) */}
          {winnerLines.map((c, idx) => {
            if (c.y2b !== undefined) {
              // Pair connector: two sources converge at midX, then join target
              return (
                <g key={`w${idx}`} stroke={stroke} strokeWidth={lineW} fill="none">
                  <line x1={c.x1} y1={c.y1} x2={c.midX} y2={c.y1} />
                  <line x1={c.x1} y1={c.y2b} x2={c.midX} y2={c.y2b} />
                  <line x1={c.midX} y1={c.y1} x2={c.midX} y2={c.y2b} />
                  <line x1={c.midX} y1={c.y2} x2={c.x2} y2={c.y2} />
                </g>
              );
            }
            // Simple connector: right → vertical → right
            return (
              <g key={`w${idx}`} stroke={stroke} strokeWidth={lineW} fill="none">
                <line x1={c.x1} y1={c.y1} x2={c.midX} y2={c.y1} />
                {Math.abs(c.y1 - c.y2) > 0.5 && (
                  <line x1={c.midX} y1={c.y1} x2={c.midX} y2={c.y2} />
                )}
                <line x1={c.midX} y1={c.y2} x2={c.x2} y2={c.y2} />
              </g>
            );
          })}

          {/* Loser-drop connectors (UB→LB diagonal bezier lines) */}
          {loserDropLines.map((c, idx) => {
            // Cubic bezier: departs downward from UB card bottom,
            // arrives upward at LB card top. The horizontal shift
            // (x2-x1) is handled by the control-point spread.
            const dy = c.y2 - c.y1;
            const ctrlOffset = Math.min(60, dy * 0.45);
            return (
              <path
                key={`ld${idx}`}
                d={`M ${c.x1} ${c.y1}
                    C ${c.x1} ${c.y1 + ctrlOffset},
                      ${c.x2} ${c.y2 - ctrlOffset},
                      ${c.x2} ${c.y2}`}
                stroke={dropStroke}
                strokeWidth={lineW}
                strokeDasharray="5 3"
                fill="none"
              />
            );
          })}
        </svg>

        {/* ── Section labels ─────────────────────────────────────────────── */}
        {ubPositions.length > 0 && (
          <div
            className="absolute text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"
            style={{ top: UB_LABEL_Y, left: 0, height: SECTION_LABEL_H, lineHeight: `${SECTION_LABEL_H}px` }}
          >
            Upper Bracket
          </div>
        )}
        {lbPositions.length > 0 && (
          <div
            className="absolute text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"
            style={{ top: LB_LABEL_Y, left: 0, height: SECTION_LABEL_H, lineHeight: `${SECTION_LABEL_H}px` }}
          >
            Lower Bracket
          </div>
        )}
        {allGfPos.length > 0 && (
          <div
            className="absolute text-[10px] font-bold uppercase tracking-widest text-primary/70"
            style={{
              top: allGfPos[0].y - GF_LABEL_H - 4,
              left: allGfPos[0].x,
              height: GF_LABEL_H,
              lineHeight: `${GF_LABEL_H}px`,
            }}
          >
            Grand Final
          </div>
        )}

        {/* ── UB cards ────────────────────────────────────────────────────── */}
        {ubPositions.map(({ match, x, y }) => (
          <div
            key={match.matchKey}
            className="absolute"
            style={{ left: x, top: y, width: CARD_W, height: cardH }}
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

        {/* ── LB cards ────────────────────────────────────────────────────── */}
        {lbPositions.map(({ match, x, y }) => (
          <div
            key={match.matchKey}
            className="absolute"
            style={{ left: x, top: y, width: CARD_W, height: cardH }}
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

        {/* ── Grand Final cards ────────────────────────────────────────────── */}
        {gfPositions.map(({ match, x, y }) => (
          <div
            key={match.matchKey}
            className="absolute"
            style={{ left: x, top: y, width: CARD_W, height: cardH }}
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

        {/* Grand Final Reset cards (or placeholder if skipped) */}
        {gfrPositions.map(({ match, x, y }) =>
          skippedReset ? (
            <div
              key={match.matchKey}
              className="absolute border border-dashed border-border/30 rounded-md flex items-center justify-center text-[10px] text-muted-foreground/40"
              style={{ left: x, top: y, width: CARD_W, height: cardH }}
            >
              Reset nie jest wymagany
            </div>
          ) : (
            <div
              key={match.matchKey}
              className="absolute"
              style={{ left: x, top: y, width: CARD_W, height: cardH }}
            >
              <DEMatchCard
                match={match}
                participants={participants}
                ubDropSlots={ubDropSlots}
                hideMatchName={hideMatchNames}
                compact={compact}
              />
            </div>
          ),
        )}
      </div>
    </div>
  );
}
