import { t } from "@/i18n";
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

import { useId, useMemo } from "react";
import { Trophy, ArrowDownRight } from "lucide-react";
import { useLocation } from "wouter";
import { isExperimentalTournamentPath } from "@/features/experimental-tournaments/experimental-tournament-routing";

/**
 * V5.8 · Experimental speaks Polish in the double-elimination view; the engine's match names ("Upper R1 M1",
 * "Grand Final") are only translated for display. Stable keeps the original labels.
 */
export function deDisplayName(name: string, experimental: boolean): string {
  if (!experimental) return name;
  if (name === "Grand Final Reset") return t("deBracketCanvas.rewanz_w_wielkim_finale");
  if (name === "Grand Final") return t("deBracketCanvas.wielki_final");
  return name.replace(/^Upper R(\d+)/, (_, n: string) => t("deBracketCanvas.wygrani_r_n", { n })).replace(/^Lower R(\d+)/, (_, n: string) => t("deBracketCanvas.przegrani_r_n", { n }));
}
const DE_SECTION_LABELS = {
  stable: { upper: "Upper Bracket", lower: "Lower Bracket", final: "Grand Final", get drop() { return t("deBracketCanvas.spada_z_upper_bracket"); } },
  experimental: { get upper() { return t("deBracketCanvas.drabinka_wygranych"); }, get lower() { return t("deBracketCanvas.drabinka_przegranych"); }, get final() { return t("deBracketCanvas.wielki_final"); }, get drop() { return t("deBracketCanvas.spada_z_drabinki_wygranych"); } },
} as const;
function useDeLabels() {
  const [location] = useLocation();
  const experimental = isExperimentalTournamentPath(location);
  return { experimental, labels: DE_SECTION_LABELS[experimental ? "experimental" : "stable"] };
}
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
const SECTION_GAP = 96; // vertical gap between UB area bottom and LB label
// The whole LB section sits half a column to the right of the UB section, so the
// dashed loser-drop lines run in their own lanes instead of stacking on one vertical.
const LB_SHIFT_X = COL_STEP / 2; // 138
const DROP_LANE_GAP = 24; // max horizontal distance between neighbouring drop lanes
const LANE_PAD = 12; // keep drop lanes this far inside the card column they run behind
const CHANNEL_TOP = 20; // first horizontal drop channel below the Upper section
const CHANNEL_GAP = 10; // distance between horizontal drop channels
const CHANNEL_BOTTOM = 30; // space between the last channel and the Lower label
const CARD_HEADER_H = 16; // must match DEMatchCard's header
const STRIP_LANE = 10; // lane spacing in the drop strip left of an Upper column
const STRIP_PAD = 8; // strip padding on each side
const EXIT_DROP = 8; // a drop leaves the card bottom, goes this far down, then turns into its strip lane

/** Y of a slot row's centre inside a card of height `h` (slot 0 = first participant row). */
export function slotRowY(h: number, slot: 0 | 1): number {
  const rowH = (h - CARD_HEADER_H) / 2;
  return CARD_HEADER_H + rowH * slot + rowH / 2;
}

/** SVG path through orthogonal points with rounded corners. */
export function roundedPath(points: Array<[number, number]>, radius = 6): string {
  const pts = points.filter((pt, i) => i === 0 || pt[0] !== points[i - 1][0] || pt[1] !== points[i - 1][1]);
  if (pts.length === 0) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1], [cx, cy] = pts[i], [nx, ny] = pts[i + 1];
    const r = Math.min(radius, Math.hypot(cx - px, cy - py) / 2, Math.hypot(nx - cx, ny - cy) / 2);
    const ax = cx - Math.sign(cx - px) * r, ay = cy - Math.sign(cy - py) * r;
    const bx = cx + Math.sign(nx - cx) * r, by = cy + Math.sign(ny - cy) * r;
    d += ` L ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L ${last[0]} ${last[1]}`;
}
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
  /** When false, hides the dashed UB→LB loser-drop connector lines. Default: true. */
  showDropLines?: boolean;
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

/**
 * A loser-drop connector (Upper loser → Lower slot), routed orthogonally:
 * bottom edge of the Upper card at `exitX` → (optional horizontal channel in the gap between the
 * sections) → vertical lane `laneX` → left edge of the Lower card at the row the loser fills.
 * Y values that depend on the rendered card height are finished in the renderer.
 */
export interface LoserDropLine {
  key: string;
  exitX: number; srcY: number;
  /** Lane in the strip left of the Upper column (later rounds); null = falls straight down (round 1). */
  stripX: number | null;
  channelY: number | null;
  laneX: number;
  tgtX: number; tgtY: number; slot: 0 | 1;
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
  return useMemo(() => computeDELayout(matches), [matches]);
}

/** Card geometry of the canvas, for tests and callers that need the same numbers. */
export const DE_CARD = { width: CARD_W, height: CARD_H } as const;

/** Orthogonal points of a drop line for cards of height `cardH` (shared by the renderer and the tests). */
export function dropLinePoints(c: LoserDropLine, cardH: number): Array<[number, number]> {
  const startY = c.srcY + cardH;
  const entryY = c.tgtY + slotRowY(cardH, c.slot);
  if (c.channelY == null) return [[c.exitX, startY], [c.laneX, entryY], [c.tgtX - 2, entryY]];
  if (c.stripX == null) {
    return [[c.exitX, startY], [c.exitX, c.channelY], [c.laneX, c.channelY], [c.laneX, entryY], [c.tgtX - 2, entryY]];
  }
  return [[c.exitX, startY], [c.exitX, startY + EXIT_DROP], [c.stripX, startY + EXIT_DROP], [c.stripX, c.channelY],
    [c.laneX, c.channelY], [c.laneX, entryY], [c.tgtX - 2, entryY]];
}

/** Pure layout of a double-elimination canvas (positions, winner connectors, loser-drop routes). */
export function computeDELayout(matches: DoubleEliminationMatch[]) {
  {
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

    const lbX = (ri: number) => LB_SHIFT_X + ri * COL_STEP;
    const ubCountAt = (ri: number) => ubByRound.get(ubRoundNums[ri])?.length ?? 0;
    const lbCountAt = (ri: number) => lbByRound.get(lbRoundNums[ri])?.length ?? 0;

    // ── Loser-drop plan (decides how tall the gap between the sections is) ───
    // Engine routing (double-elimination-format-engine.ts): Upper R1 matches 2m−1, 2m → Lower R1
    // match m (slots 1, 2); Upper round k ≥ 2 → Lower round 2k−2 (index 2·ubRi − 1), slot 2, in
    // reverse order. Those later drops leave the bottom of the Upper card, run right in their own
    // channel between the sections, and come down in the gap just before the target column — never
    // behind another card, so a line can only be read as reaching the card its arrow points at.
    interface DropRound { ubRi: number; lbRi: number; n: number }
    const dropRounds: DropRound[] = [];
    for (let ubRi = 1; ubRi < ubRoundNums.length; ubRi++) {
      const lbRi = 2 * ubRi - 1;
      if (lbRi >= lbRoundNums.length) continue;
      const n = ubCountAt(ubRi);
      if (n === 0 || lbCountAt(lbRi) !== n) continue; // unknown shape: no line rather than a wrong one
      dropRounds.push({ ubRi, lbRi, n });
    }
    // Each Upper column that drops losers (round ≥ 2) gets a narrow strip on its left for the drop lanes,
    // so a line never runs down behind the cards of its own column.
    const stripW = ubRoundNums.map((_, ri) => {
      const r = dropRounds.find(d => d.ubRi === ri);
      return r ? 2 * STRIP_PAD + (r.n - 1) * STRIP_LANE : 0;
    });
    const ubX = (ri: number) => ri * COL_STEP + stripW.slice(0, ri + 1).reduce((a, b) => a + b, 0);
    const channelCount = dropRounds.reduce((sum, r) => sum + r.n, 0);
    const sectionGap = Math.max(SECTION_GAP, CHANNEL_TOP + Math.max(0, channelCount - 1) * CHANNEL_GAP + CHANNEL_BOTTOM);

    // ── Section Y offsets (absolute canvas coords) ────────────────────────────
    const UB_LABEL_Y = 0;
    const UB_Y = SECTION_LABEL_H;
    const ubHeight = ubR1Count * UNIT - SMALL_GAP;

    const LB_LABEL_Y = UB_Y + ubHeight + sectionGap;
    const LB_Y = LB_LABEL_Y + SECTION_LABEL_H;
    const lbHeight = lbR1Count > 0 ? lbR1Count * UNIT - SMALL_GAP : CARD_H;
    const totalHeight = lbRoundNums.length > 0 ? LB_Y + lbHeight : UB_Y + ubHeight;

    // ── UB card positions ─────────────────────────────────────────────────────
    const ubPositions: MatchPos[] = [];
    for (const [ri, roundNum] of ubRoundNums.entries()) {
      const roundMatches = ubByRound.get(roundNum)!;
      const N = roundMatches.length;
      for (const [localIdx, m] of roundMatches.entries()) {
        ubPositions.push({ match: m, x: ubX(ri), y: UB_Y + cardY(localIdx, N, ubR1Count), ri, i: localIdx });
      }
    }

    // ── LB card positions ─────────────────────────────────────────────────────
    const lbPositions: MatchPos[] = [];
    for (const [lbRi, roundNum] of lbRoundNums.entries()) {
      const roundMatches = lbByRound.get(roundNum)!;
      const N = roundMatches.length;
      for (const [localIdx, m] of roundMatches.entries()) {
        lbPositions.push({ match: m, x: lbX(lbRi), y: LB_Y + cardY(localIdx, N, lbR1Count), ri: lbRi, i: localIdx });
      }
    }

    // ── Grand Final — own column right of both brackets, halfway between the two finals ──
    // The Upper final feeds its first row and the Lower final its second, so each path ends at the
    // row its winner takes. The reset (if any) sits next to it on the same line.
    const gfBaseX = Math.max(
      ubRoundNums.length > 0 ? ubX(ubRoundNums.length - 1) + COL_STEP : 0,
      lbRoundNums.length > 0 ? LB_SHIFT_X + lbRoundNums.length * COL_STEP : 0,
    );
    const ubFinalPos = ubPositions.filter(p => p.ri === ubRoundNums.length - 1)[0];
    const lbFinalPos = lbPositions.filter(p => p.ri === lbRoundNums.length - 1)[0];
    const gfY = ubFinalPos && lbFinalPos
      ? (ubFinalPos.y + lbFinalPos.y) / 2
      : ubFinalPos?.y ?? UB_Y + (ubHeight - CARD_H) / 2;

    const gfPositions: MatchPos[] = gfMatches.map((m, idx) => ({
      match: m,
      x: gfBaseX + idx * COL_STEP,
      y: gfY,
      ri: idx,
      i: 0,
    }));
    const gfrPositions: MatchPos[] = gfrMatches.map((m, idx) => ({
      match: m,
      x: gfBaseX + (gfMatches.length + idx) * COL_STEP,
      y: gfY,
      ri: idx,
      i: 0,
    }));

    // ── Canvas total width ────────────────────────────────────────────────────
    const gfRoundsCount = gfMatches.length + gfrMatches.length;
    const rightEdge = gfRoundsCount > 0
      ? gfBaseX + (gfRoundsCount - 1) * COL_STEP + CARD_W
      : Math.max(
          ubRoundNums.length > 0 ? ubX(ubRoundNums.length - 1) + CARD_W : 0,
          lbRoundNums.length > 0 ? LB_SHIFT_X + (lbRoundNums.length - 1) * COL_STEP + CARD_W : 0,
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

    // UB Final → GF (first row); the vertical runs just left of the GF column
    const ubFinal = ubFinalPos;
    if (ubFinal && gfPositions[0]) {
      winnerLines.push({
        x1: ubFinal.x + CARD_W, y1: ubFinal.y + CARD_H / 2,
        x2: gfPositions[0].x,  y2: gfPositions[0].y + slotRowY(CARD_H, 0),
        midX: gfPositions[0].x - COL_GAP / 2,
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

    // LB Final → GF (second row)
    const lbFinal = lbFinalPos;
    if (lbFinal && gfPositions[0]) {
      winnerLines.push({
        x1: lbFinal.x + CARD_W, y1: lbFinal.y + CARD_H / 2,
        x2: gfPositions[0].x,   y2: gfPositions[0].y + slotRowY(CARD_H, 1),
        midX: gfPositions[0].x - COL_GAP / 2,
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

    // ── Loser-drop connectors ─────────────────────────────────────────────────
    // No two drop lines share a segment or cross: within a round the line to the topmost target takes
    // the rightmost lane (it turns first), and channels are stacked so later rounds run above earlier
    // ones. Lines pass *behind* cards (masked in the renderer). A BYE has no loser, so no line.
    const loserDropLines: LoserDropLine[] = [];
    const isByeMatch = (m: DoubleEliminationMatch) => m.status === "bye";
    const ubR1 = ubPositions.filter(p => p.ri === 0).sort((a, b) => a.i - b.i);
    const lbR1 = lbPositions.filter(p => p.ri === 0).sort((a, b) => a.i - b.i);
    if (ubR1.length > 1 && lbR1.length > 0) {
      const laneGap = Math.min(DROP_LANE_GAP, (LB_SHIFT_X - 10) / ubR1.length);
      for (const [j, src] of ubR1.entries()) {
        const tgt = lbR1[Math.floor(j / 2)];
        if (!tgt || isByeMatch(src.match)) continue;
        const laneX = LB_SHIFT_X - 10 - j * laneGap;
        loserDropLines.push({
          key: `${src.match.matchKey}>${tgt.match.matchKey}`,
          exitX: laneX, srcY: src.y, stripX: null, channelY: null, laneX,
          tgtX: tgt.x, tgtY: tgt.y, slot: (j % 2) as 0 | 1,
        });
      }
    }
    let channelIdx = 0;
    const channelY0 = UB_Y + ubHeight + CHANNEL_TOP;
    // Ordering that keeps the orange lines free of crossings:
    //   • within a round the topmost target gets the rightmost lane (it turns off first), the highest
    //     channel and the rightmost exit;
    //   • later rounds take higher channels, so their verticals never cut an earlier round's channel.
    // A drop still crosses the solid winner lines in that gap (unavoidable: they sit between the
    // channel and the target row); the renderer draws those crossings as a bridge.
    for (const round of [...dropRounds].sort((a, b) => b.ubRi - a.ubRi)) {
      const srcs = ubPositions.filter(p => p.ri === round.ubRi).sort((a, b) => a.i - b.i);
      const tgts = lbPositions.filter(p => p.ri === round.lbRi).sort((a, b) => a.i - b.i);
      const tX = lbX(round.lbRi);
      const laneGap = round.n > 1 ? Math.min(DROP_LANE_GAP, (COL_GAP - 20) / (round.n - 1)) : 0;
      const stripLeft = ubX(round.ubRi) - stripW[round.ubRi];
      for (let k = 0; k < round.n; k++) { // k = target index, top to bottom
        const tgt = tgts[k];
        const j = round.n - 1 - k; // source index (reverse order in the engine)
        const src = srcs[j];
        if (!src || !tgt) continue;
        const channelY = channelY0 + channelIdx++ * CHANNEL_GAP;
        if (isByeMatch(src.match)) continue;
        loserDropLines.push({
          key: `${src.match.matchKey}>${tgt.match.matchKey}`,
          exitX: src.x + LANE_PAD, srcY: src.y,
          stripX: stripLeft + STRIP_PAD + j * STRIP_LANE, // top source = leftmost lane (outermost)
          channelY,
          laneX: tX - 10 - k * laneGap,
          tgtX: tgt.x, tgtY: tgt.y, slot: 1,
        });
      }
    }

    // ── UB-drop slot detection (for amber left-border in LB cards) ───────────
    // Only the slots the engine routes Upper losers into are marked. (Earlier a data rule also marked any
    // player who had once lost in the Upper bracket, so a Lower-round winner advancing to the next Lower
    // round showed a drop arrow it did not take.)
    const ubDropSlots = new Set<string>();
    // Structural: all LB R1 slots (both players are UB losers, or a UB loser + bye)
    if (lbRoundNums.length > 0) {
      for (const m of lbMatches.filter(m => m.round === lbRoundNums[0])) {
        ubDropSlots.add(`${m.matchKey}-0`);
        ubDropSlots.add(`${m.matchKey}-1`);
      }
    }
    // Structural: the second slot of LB rounds 2, 4, 6… (index 1, 3, 5…) receives the UB drop
    for (let ubRi = 1; ubRi < ubRoundNums.length; ubRi++) {
      const targetLbRi = 2 * ubRi - 1;
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
  }
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
  const de = useDeLabels();
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
            {deDisplayName(match.name, de.experimental)}
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
        const score = slotIdx === 0 ? match.score1 : match.score2;
        const isPending = !participantKey;
        // An empty slot of a decided match (BYE, skipped, or completed without an opponent) will never be
        // filled: say "wolny los" instead of "TBD" and do not mark it as an incoming Upper drop.
        const isEmptyBye = isPending && (isBye || isDone);
        const isUbDrop = !isEmptyBye && match.bracket === "lower" && ubDropSlots.has(`${match.matchKey}-${slotIdx}`);

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
                aria-label={de.labels.drop}
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
              {isEmptyBye ? t("deBracketCanvas.wolny_los") : isPending ? t("deBracketCanvas.tbd") : participant ? `#${participant.seed} ${participant.name}` : "?"}
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
  showDropLines = true,
}: DEBracketCanvasProps) {
  const de = useDeLabels();
  const domId = useId().replace(/:/g, "");
  const dropMaskId = `de-drop-mask-${domId}`;
  const dropArrowId = `de-drop-arrow-${domId}`;
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
      <div className="flex items-center justify-center py-20 text-muted-foreground border border-dashed border-border rounded-lg">{t("deBracketCanvas.brak_meczow_do_wyswietlenia")}</div>
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
      aria-label={t("deBracketCanvas.drabinka_podwojnej_eliminacji")}
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

          {/* Loser-drop connectors (UB→LB dashed lines). Masked out under every card and the Lower
              label, so a line that passes a card looks like it runs behind it instead of across its text. */}
          {showDropLines && loserDropLines.length > 0 && (
            <>
              <defs>
                <marker id={dropArrowId} viewBox="0 0 6 6" refX="6" refY="3" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M0,0 L6,3 L0,6 z" fill={dropStroke} />
                </marker>
              </defs>
              <mask id={dropMaskId} maskUnits="userSpaceOnUse" x={-20} y={-20} width={totalWidth + 40} height={totalHeight + 40}>
                <rect x={-20} y={-20} width={totalWidth + 40} height={totalHeight + 40} fill="white" />
                {[...ubPositions, ...lbPositions, ...gfPositions, ...gfrPositions].map(p => (
                  <rect key={`m-${p.match.matchKey}`} x={p.x - 1} y={p.y - 1} width={CARD_W + 2} height={cardH + 2} rx={6} fill="black" />
                ))}
                {lbPositions.length > 0 && <rect x={LB_SHIFT_X - 2} y={LB_LABEL_Y} width={CARD_W + 4} height={SECTION_LABEL_H} fill="black" />}
              </mask>
              <g mask={`url(#${dropMaskId})`} fill="none" data-de-drop-lines="">
                {loserDropLines.map((c) => {
                  const d = roundedPath(dropLinePoints(c, cardH));
                  return (
                    <g key={`ld-${c.key}`} data-drop={c.key}>
                      {/* halo: where a drop passes a solid winner line, the winner line visibly breaks (a bridge) */}
                      <path d={d} stroke="hsl(var(--card))" strokeWidth={lineW + 5} />
                      <path d={d} stroke={dropStroke} strokeWidth={lineW} strokeDasharray="5 3" markerEnd={`url(#${dropArrowId})`} />
                    </g>
                  );
                })}
              </g>
              {loserDropLines.map((c) => (
                <circle key={`ldo-${c.key}`} cx={c.exitX} cy={c.srcY + cardH + 2.5} r={2.5} fill={dropStroke} />
              ))}
            </>
          )}
        </svg>

        {/* ── Section labels ─────────────────────────────────────────────── */}
        {ubPositions.length > 0 && (
          <div
            className="absolute text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"
            style={{ top: UB_LABEL_Y, left: 0, height: SECTION_LABEL_H, lineHeight: `${SECTION_LABEL_H}px` }}
          >
            {de.labels.upper}
          </div>
        )}
        {lbPositions.length > 0 && (
          <div
            className="absolute text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60"
            style={{ top: LB_LABEL_Y, left: LB_SHIFT_X, height: SECTION_LABEL_H, lineHeight: `${SECTION_LABEL_H}px` }}
          >
            {de.labels.lower}
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
            {de.labels.final}
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
            >{t("deBracketCanvas.reset_nie_jest_wymagany")}</div>
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
