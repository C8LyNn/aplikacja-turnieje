import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { DoubleEliminationMatch } from "@workspace/api-client-react";
import { computeDELayout, dropLinePoints, DE_CARD } from "./de-bracket-canvas";

/**
 * Builds the match list the API returns for an S-slot double elimination (same structure as
 * double-elimination-format-engine.ts after the Lower-count fix): S−1 Upper, S−2 Lower in pairs of
 * equal rounds, Grand Final and reset. `byes` marks the given Upper R1 matches as BYEs.
 */
function deMatches(size: number, byes: number[] = []): DoubleEliminationMatch[] {
  const out: DoubleEliminationMatch[] = [];
  let order = 0;
  const add = (bracket: DoubleEliminationMatch["bracket"], round: number, matchNumber: number, name: string, status: DoubleEliminationMatch["status"] = "pending") => {
    out.push({
      matchKey: `${bracket}-r${round}-m${matchNumber}`, matchId: order + 1, name, bracket, round, matchNumber, order: order++,
      slots: [null, null], status, bestOf: 3, score1: null, score2: null, downstreamResultCount: 0,
      winnerParticipantKey: null, loserParticipantKey: null,
    } as DoubleEliminationMatch);
  };
  const upperRounds = Math.log2(size);
  for (let r = 1; r <= upperRounds; r++) {
    for (let m = 1; m <= size / 2 ** r; m++) add("upper", r, m, `Upper R${r} M${m}`, r === 1 && byes.includes(m) ? "bye" : "pending");
  }
  for (let r = 1; r <= 2 * upperRounds - 2; r++) {
    for (let m = 1; m <= size / 2 ** (Math.floor((r + 1) / 2) + 1); m++) add("lower", r, m, `Lower R${r} M${m}`);
  }
  add("grand_final", 1, 1, "Grand Final");
  add("grand_final_reset", 1, 1, "Grand Final Reset");
  return out;
}

type Seg = { x1: number; y1: number; x2: number; y2: number };
function segments(points: Array<[number, number]>): Seg[] {
  const segs: Seg[] = [];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i - 1], [x2, y2] = points[i];
    if (x1 !== x2 || y1 !== y2) segs.push({ x1: Math.min(x1, x2), y1: Math.min(y1, y2), x2: Math.max(x1, x2), y2: Math.max(y1, y2) });
  }
  return segs;
}
const isH = (s: Seg) => s.y1 === s.y2;
/** True when two axis-aligned segments cross or overlap (touching only at a shared endpoint is allowed). */
function conflict(a: Seg, b: Seg): boolean {
  if (isH(a) && isH(b)) return a.y1 === b.y1 && Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1) > 0;
  if (!isH(a) && !isH(b)) return a.x1 === b.x1 && Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1) > 0;
  const [h, v] = isH(a) ? [a, b] : [b, a];
  return v.x1 > h.x1 && v.x1 < h.x2 && h.y1 > v.y1 && h.y1 < v.y2;
}
/** True when a segment runs through the inside of a card (edges excluded). */
function throughCard(s: Seg, card: { x: number; y: number }): boolean {
  const L = card.x + 1, R = card.x + DE_CARD.width - 1, T = card.y + 1, B = card.y + DE_CARD.height - 1;
  return s.x2 > L && s.x1 < R && s.y2 > T && s.y1 < B;
}

describe("DEBracketCanvas layout", () => {
  for (const size of [4, 8, 16, 32]) {
    test(`${size} entrants: one drop line per Upper match, to the slot the engine routes the loser to`, () => {
      const layout = computeDELayout(deMatches(size));
      assert.equal(layout.loserDropLines.length, size - 1);
      const keys = new Set(layout.loserDropLines.map((l) => l.key));
      for (let j = 1; j <= size / 2; j++) assert.ok(keys.has(`upper-r1-m${j}>lower-r1-m${Math.ceil(j / 2)}`), `Upper R1 M${j}`);
      for (let k = 2; k <= Math.log2(size); k++) {
        const n = size / 2 ** k;
        for (let j = 1; j <= n; j++) {
          assert.ok(keys.has(`upper-r${k}-m${j}>lower-r${2 * k - 2}-m${n - j + 1}`), `Upper R${k} M${j} → Lower R${2 * k - 2} M${n - j + 1}`);
        }
      }
      const r1Slots = layout.loserDropLines.filter((l) => l.key.startsWith("upper-r1-")).map((l) => l.slot);
      assert.deepEqual(r1Slots, r1Slots.map((_, i) => i % 2));
      assert.ok(layout.loserDropLines.filter((l) => !l.key.startsWith("upper-r1-")).every((l) => l.slot === 1));
    });

    test(`${size} entrants: orange drop lines never cross or overlap each other`, () => {
      const lines = computeDELayout(deMatches(size)).loserDropLines.map((l) => ({ key: l.key, segs: segments(dropLinePoints(l, DE_CARD.height)) }));
      for (let a = 0; a < lines.length; a++) {
        for (let b = a + 1; b < lines.length; b++) {
          for (const sa of lines[a].segs) for (const sb of lines[b].segs) {
            assert.ok(!conflict(sa, sb), `${lines[a].key} crosses ${lines[b].key} at ${JSON.stringify(sa)} / ${JSON.stringify(sb)}`);
          }
        }
      }
    });

    test(`${size} entrants: drop lines do not run through cards (round-1 lanes may pass behind their own column)`, () => {
      const layout = computeDELayout(deMatches(size));
      const cards = [...layout.ubPositions, ...layout.lbPositions, ...layout.gfPositions, ...layout.gfrPositions];
      for (const line of layout.loserDropLines) {
        const fromRound1 = line.key.startsWith("upper-r1-");
        for (const seg of segments(dropLinePoints(line, DE_CARD.height))) {
          for (const card of cards) {
            if (fromRound1 && card.match.bracket === "upper" && card.match.round === 1) continue;
            assert.ok(!throughCard(seg, card), `${line.key} runs through ${card.match.name}`);
          }
        }
      }
    });

    test(`${size} entrants: Lower bracket sits lower and to the right; the Grand Final is linked from both finals`, () => {
      const layout = computeDELayout(deMatches(size));
      const ubBottom = Math.max(...layout.ubPositions.map((p) => p.y + DE_CARD.height));
      assert.ok(Math.min(...layout.lbPositions.map((p) => p.y)) >= ubBottom + 96);
      assert.ok(Math.min(...layout.lbPositions.map((p) => p.x)) >= 138);
      const gf = layout.gfPositions[0];
      const rightOfBrackets = Math.max(...[...layout.ubPositions, ...layout.lbPositions].map((p) => p.x + DE_CARD.width));
      assert.ok(gf.x > rightOfBrackets, "Grand Final has its own column");
      const ubFinal = layout.ubPositions.filter((p) => p.match.round === Math.log2(size))[0];
      const lbFinal = layout.lbPositions.filter((p) => p.match.round === 2 * Math.log2(size) - 2)[0];
      assert.ok(gf.y >= ubFinal.y && gf.y <= lbFinal.y, "Grand Final between the two finals");
      const intoGf = layout.winnerLines.filter((w) => w.x2 === gf.x);
      assert.equal(intoGf.length, 2);
      assert.equal(new Set(intoGf.map((w) => w.y2)).size, 2, "Upper and Lower finals enter different rows");
      assert.ok(layout.gfrPositions[0].x > gf.x && layout.gfrPositions[0].y === gf.y);
    });
  }

  test("BYE in Upper round 1: no drop line from it, the rest still routed", () => {
    const layout = computeDELayout(deMatches(8, [1, 3]));
    assert.equal(layout.loserDropLines.length, 5);
    assert.ok(!layout.loserDropLines.some((l) => l.key.startsWith("upper-r1-m1>") || l.key.startsWith("upper-r1-m3>")));
  });

  test("two entrants (no Lower bracket): no drop lines, Grand Final level with the Upper final", () => {
    const layout = computeDELayout(deMatches(2));
    assert.equal(layout.loserDropLines.length, 0);
    assert.equal(layout.lbPositions.length, 0);
    assert.equal(layout.gfPositions[0].y, layout.ubPositions[0].y);
  });
});

test("drop markers: Lower R1 both slots, later injection rounds only the second slot, consolidation rounds none", () => {
  const layout = computeDELayout(deMatches(8));
  const marked = [...layout.ubDropSlots].sort();
  assert.deepEqual(marked, [
    "lower-r1-m1-0", "lower-r1-m1-1", "lower-r1-m2-0", "lower-r1-m2-1",
    "lower-r2-m1-1", "lower-r2-m2-1",
    "lower-r4-m1-1",
  ]);
});
