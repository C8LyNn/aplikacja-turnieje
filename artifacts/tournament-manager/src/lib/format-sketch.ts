import { t } from "@/i18n";
/**
 * #323-C · a visual sketch of the tournament layout before it is created (pure geometry, testable).
 * Input: the stage summaries of the server's preset preview — the same numbers the preview lists as text.
 * The sketch only draws what those numbers say; it never invents pairings or decides anything.
 */
import { plural } from "@/features/experimental-tournaments/experimental-create-wizard-model";

export interface SketchStageInput {
  key: string;
  name: string;
  format: string;
  formatLabel: string;
  participantCount: number;
  groupSizes: number[] | null;
  advancingCount: number | null;
  matches: { min: number; max: number };
  rounds: { min: number; max: number };
  byes: number;
}

export type SketchBoxKind = "match" | "bye" | "final" | "group" | "bucket" | "cell" | "self" | "seat" | "qualifier";
export interface SketchBox { x: number; y: number; w: number; h: number; kind: SketchBoxKind; label?: string }
export interface SketchText { x: number; y: number; text: string; anchor: "start" | "middle" | "end" }

/** Rough rendered width of a header text (used to keep labels apart and inside the drawing). */
export function approxTextWidth(text: string, size: number = SKETCH_FONT.header): number {
  return text.length * size * 0.56;
}
export interface SketchStage {
  key: string;
  format: string;
  width: number;
  height: number;
  boxes: SketchBox[];
  paths: string[];
  texts: SketchText[];
  /** One plain sentence for screen readers and the caption under the drawing. */
  summary: string;
  /** Set when only part of a large layout is drawn. */
  note: string | null;
}

export const SKETCH_WIDTH = 280;
/** Font sizes in drawing units (the drawing scales with its container). */
export const SKETCH_FONT = { header: 10.5, label: 10 } as const;
const HEADER = 18;
const BOX_H = 14;
const SLOT = 22;
const MAX_FIRST_COLUMN = 8;

const nextPowerOfTwo = (n: number) => { let size = 1; while (size < n) size *= 2; return size; };
const range = (n: number) => Array.from({ length: Math.max(0, n) }, (_, i) => i);
const rangeText = (r: { min: number; max: number }) => (r.min === r.max ? String(r.min) : `${r.min}–${r.max}`);
const matchesText = (r: { min: number; max: number }) => `${rangeText(r)} ${plural(r.max, t("formatSketch.mecz"), t("formatSketch.mecze"), t("formatSketch.meczow"))}`;
const roundsText = (r: { min: number; max: number }) => `${rangeText(r)} ${plural(r.max, t("formatSketch.runda"), t("formatSketch.rundy"), t("formatSketch.rund"))}`;

/** "Finał", "Półfinał", "Ćwierćfinał", "1/8"… by the number of matches in the round. */
export function knockoutRoundName(matchesInRound: number): string {
  if (matchesInRound === 1) return t("formatSketch.final");
  if (matchesInRound === 2) return t("formatSketch.polfinal");
  if (matchesInRound === 4) return t("formatSketch.cwiercfinal");
  return `1/${matchesInRound}`;
}

/** Spread `count` marks over `slots` positions (bye matches are spread over the first round). */
export function spreadIndices(count: number, slots: number): Set<number> {
  const marked = new Set<number>();
  if (count <= 0 || slots <= 0) return marked;
  for (let j = 0; j < Math.min(count, slots); j++) marked.add(Math.min(slots - 1, Math.floor((j * slots) / Math.min(count, slots))));
  return marked;
}

/**
 * Knockout columns from `counts` (matches per round, left → right), drawn in [x0, x0 + width).
 * Returns boxes/paths and the vertical centre of the last box (to connect lanes).
 */
function knockoutColumns(
  counts: number[],
  x0: number,
  width: number,
  y0: number,
  laneHeight: number,
  options: { byes?: Set<number>; lastKind?: SketchBoxKind; headers?: boolean },
) {
  const boxes: SketchBox[] = [];
  const paths: string[] = [];
  const texts: SketchText[] = [];
  const colW = width / Math.max(1, counts.length);
  const boxW = Math.min(64, colW - 12);
  const centres: number[][] = [];
  counts.forEach((count, c) => {
    const x = x0 + c * colW + (colW - boxW) / 2;
    const step = laneHeight / count;
    const column: number[] = [];
    for (let i = 0; i < count; i++) {
      const cy = y0 + step * (i + 0.5);
      column.push(cy);
      const last = c === counts.length - 1;
      const kind: SketchBoxKind = c === 0 && options.byes?.has(i) ? "bye" : last && options.lastKind ? options.lastKind : "match";
      boxes.push({ x, y: cy - BOX_H / 2, w: boxW, h: BOX_H, kind });
      if (c > 0) {
        const prev = centres[c - 1];
        const px = x0 + (c - 1) * colW + (colW - boxW) / 2 + boxW;
        const midX = (px + x) / 2;
        const ratio = prev.length / count;
        for (let k = 0; k < ratio; k++) {
          const py = prev[i * ratio + k];
          if (py !== undefined) paths.push(`M${px.toFixed(1)} ${py.toFixed(1)}H${midX.toFixed(1)}V${cy.toFixed(1)}H${x.toFixed(1)}`);
        }
      }
    }
    centres.push(column);
    if (options.headers !== false) texts.push({ x: x + boxW / 2, y: y0 - 6, text: knockoutRoundName(count), anchor: "middle" });
  });
  const lastColumn = centres[centres.length - 1] ?? [y0 + laneHeight / 2];
  return { boxes, paths, texts, lastCentre: lastColumn[0], lastRight: x0 + (counts.length - 1) * colW + (colW - boxW) / 2 + boxW, colW, boxW };
}

function singleElimination(stage: SketchStageInput): SketchStage {
  const size = nextPowerOfTwo(Math.max(2, stage.participantCount));
  const all: number[] = [];
  for (let count = size / 2; count >= 1; count /= 2) all.push(count);
  const visible = all.filter((count) => count <= MAX_FIRST_COLUMN);
  const hidden = all.length - visible.length;
  const firstVisibleIsFirstRound = hidden === 0;
  const byes = firstVisibleIsFirstRound ? spreadIndices(stage.byes, visible[0]) : undefined;
  const laneHeight = visible[0] * SLOT;
  const lane = knockoutColumns(visible, 0, SKETCH_WIDTH, HEADER, laneHeight, { byes, lastKind: "final" });
  const byeText = stage.byes > 0 ? t("formatSketch.byes_v1_w_1_rundzie", { byes: stage.byes, v1: plural(stage.byes, t("formatSketch.wolny_los"), t("formatSketch.wolne_losy"), t("formatSketch.wolnych_losow")) }) : "";
  return {
    key: stage.key, format: stage.format, width: SKETCH_WIDTH, height: HEADER + laneHeight + 4,
    boxes: lane.boxes, paths: lane.paths, texts: lane.texts,
    summary: t("formatSketch.drabinka_pucharowa_participantcount_ucze", { participantCount: stage.participantCount, v1: roundsText(stage.rounds), v2: matchesText(stage.matches), byeText: byeText }),
    note: hidden > 0 ? t("formatSketch.pokazano_ostatnie_length_rundy_wczesniej", { length: visible.length, hidden: hidden, v2: plural(hidden, t("formatSketch.runda"), t("formatSketch.rundy"), t("formatSketch.rund")) }) : null,
  };
}

function doubleElimination(stage: SketchStageInput): SketchStage {
  const size = nextPowerOfTwo(Math.max(2, stage.participantCount));
  const upperAll: number[] = [];
  for (let count = size / 2; count >= 1; count /= 2) upperAll.push(count);
  const lowerAll: number[] = [];
  for (let count = size / 4; count >= 1; count /= 2) lowerAll.push(count, count);
  const upper = upperAll.filter((count) => count <= 4);
  const lower = lowerAll.slice(-4);
  const hidden = upperAll.length - upper.length + lowerAll.length - lower.length;
  const columns = Math.max(upper.length, lower.length, 1) + 1;
  const colW = SKETCH_WIDTH / columns;
  const upperH = Math.max(1, upper[0] ?? 1) * SLOT;
  const lowerH = Math.max(1, lower[0] ?? 1) * SLOT;
  const upperY = HEADER;
  const lowerY = HEADER + upperH + HEADER;
  const upperLane = knockoutColumns(upper, (columns - 1 - upper.length) * colW, upper.length * colW, upperY, upperH, {
    byes: upper.length === upperAll.length ? spreadIndices(stage.byes, upper[0]) : undefined,
    headers: false,
  });
  const boxes = [...upperLane.boxes];
  const paths = [...upperLane.paths];
  const texts: SketchText[] = [{ x: 0, y: upperY - 6, text: t("formatSketch.gorna_drabinka"), anchor: "start" }];
  let lowerCentre = lowerY + lowerH / 2;
  let lowerRight = 0;
  if (lower.length > 0) {
    const lowerLane = knockoutColumns(lower, (columns - 1 - lower.length) * colW, lower.length * colW, lowerY, lowerH, { headers: false });
    boxes.push(...lowerLane.boxes);
    paths.push(...lowerLane.paths);
    lowerCentre = lowerLane.lastCentre;
    lowerRight = lowerLane.lastRight;
    texts.push({ x: 0, y: lowerY - 6, text: t("formatSketch.dolna_drabinka_druga_szansa"), anchor: "start" });
  }
  const boxW = Math.min(64, colW - 12);
  const gx = (columns - 1) * colW + (colW - boxW) / 2;
  const gy = (upperLane.lastCentre + lowerCentre) / 2;
  boxes.push({ x: gx, y: gy - BOX_H / 2, w: boxW, h: BOX_H, kind: "final" });
  texts.push({ x: gx + boxW, y: gy - BOX_H / 2 - 5, text: t("formatSketch.wielki_final"), anchor: "end" });
  const midX = (upperLane.lastRight + gx) / 2;
  paths.push(`M${upperLane.lastRight.toFixed(1)} ${upperLane.lastCentre.toFixed(1)}H${midX.toFixed(1)}V${gy.toFixed(1)}H${gx.toFixed(1)}`);
  if (lower.length > 0) paths.push(`M${lowerRight.toFixed(1)} ${lowerCentre.toFixed(1)}H${midX.toFixed(1)}V${gy.toFixed(1)}`);
  return {
    key: stage.key, format: stage.format, width: SKETCH_WIDTH, height: lowerY + lowerH + 4,
    boxes, paths, texts,
    summary: t("formatSketch.podwojna_eliminacja_participantcount_ucz", { participantCount: stage.participantCount, v1: matchesText(stage.matches) }),
    note: hidden > 0 ? t("formatSketch.pokazano_koncowe_rundy_obu_drabinek") : null,
  };
}

function roundRobin(stage: SketchStageInput): SketchStage {
  const n = Math.max(2, stage.participantCount);
  const shown = Math.min(n, 10);
  const cell = Math.min(16, Math.floor((SKETCH_WIDTH - 24) / shown));
  const boxes: SketchBox[] = [];
  const left = (SKETCH_WIDTH - shown * cell) / 2;
  for (const row of range(shown)) {
    for (const col of range(shown)) {
      boxes.push({ x: left + col * cell + 1, y: HEADER + row * cell + 1, w: cell - 2, h: cell - 2, kind: row === col ? "self" : "cell" });
    }
  }
  const twice = /×2|rewanż/i.test(stage.formatLabel + stage.name);
  return {
    key: stage.key, format: stage.format, width: SKETCH_WIDTH, height: HEADER + shown * cell + 4,
    boxes, paths: [],
    texts: [{ x: SKETCH_WIDTH / 2, y: HEADER - 6, text: twice ? t("formatSketch.kazdy_z_kazdym_mecz_i") : t("formatSketch.kazdy_z_kazdym"), anchor: "middle" }],
    summary: t("formatSketch.tabela_kazdy_z_kazdym_n", { n: n, v1: matchesText(stage.matches), v2: rangeText(stage.rounds), v3: plural(stage.rounds.max, t("formatSketch.kolejce"), t("formatSketch.kolejkach"), t("formatSketch.kolejkach")), v4: twice ? t("formatSketch.mecz_i_rewanz") : "" }),
    note: shown < n ? t("formatSketch.pokazano_shown_z_n_wierszy", { shown: shown, n: n }) : null,
  };
}

function groupStage(stage: SketchStageInput): SketchStage {
  const sizes = stage.groupSizes && stage.groupSizes.length > 0 ? stage.groupSizes : [stage.participantCount];
  const shownGroups = sizes.slice(0, 8);
  const perRow = Math.min(4, shownGroups.length);
  const rows = Math.ceil(shownGroups.length / perRow);
  const gap = 8;
  const boxW = (SKETCH_WIDTH - gap * (perRow - 1)) / perRow;
  const maxSize = Math.max(...shownGroups);
  const seatRows = Math.ceil(maxSize / 4);
  const boxH = 18 + seatRows * 12 + 4;
  const qualifiers = stage.advancingCount != null && stage.advancingCount % sizes.length === 0 ? stage.advancingCount / sizes.length : null;
  const boxes: SketchBox[] = [];
  const texts: SketchText[] = [];
  shownGroups.forEach((size, index) => {
    const x = (index % perRow) * (boxW + gap);
    const y = 4 + Math.floor(index / perRow) * (boxH + gap);
    boxes.push({ x, y, w: boxW, h: boxH, kind: "group" });
    texts.push({ x: x + boxW / 2, y: y + 13, text: t("formatSketch.grupa_v0", { v0: String.fromCharCode(65 + index) }), anchor: "middle" });
    const seatW = Math.min(12, (boxW - 8) / 4);
    for (const seat of range(size)) {
      const sx = x + (boxW - seatW * Math.min(4, size)) / 2 + (seat % 4) * seatW;
      const sy = y + 18 + Math.floor(seat / 4) * 12;
      boxes.push({ x: sx + 1.5, y: sy + 1.5, w: seatW - 3, h: 9, kind: qualifiers != null && seat < qualifiers ? "qualifier" : "seat" });
    }
  });
  const groups = sizes.length;
  const advance = qualifiers != null
    ? t("formatSketch.z_kazdej_grupy_awansuje_qualifiers", { qualifiers: qualifiers })
    : stage.advancingCount != null ? t("formatSketch.awansuje_lacznie_advancingcount", { advancingCount: stage.advancingCount }) : "";
  return {
    key: stage.key, format: stage.format, width: SKETCH_WIDTH, height: 4 + rows * (boxH + gap),
    boxes, paths: [], texts,
    summary: t("formatSketch.faza_grupowa_groups_v1_v2", { groups: groups, v1: plural(groups, t("formatSketch.grupa"), t("formatSketch.grupy"), t("formatSketch.grup")), v2: matchesText(stage.matches), advance: advance }),
    note: shownGroups.length < sizes.length ? t("formatSketch.pokazano_length_z_length2_grup", { length: shownGroups.length, length2: sizes.length }) : null,
  };
}

function swiss(stage: SketchStageInput): SketchStage {
  const rounds = Math.max(1, stage.rounds.max);
  const shown = Math.min(rounds, 6);
  const colW = SKETCH_WIDTH / shown;
  const boxW = Math.min(46, colW - 8);
  const bucketH = 14;
  const boxes: SketchBox[] = [];
  const texts: SketchText[] = [];
  const paths: string[] = [];
  for (const r of range(shown)) {
    const x = r * colW + (colW - boxW) / 2;
    texts.push({ x: x + boxW / 2, y: HEADER - 6, text: shown > 4 ? `R${r + 1}` : t("formatSketch.runda_v0", { v0: r + 1 }), anchor: "middle" });
    // Before round r+1 everybody has played r games: r+1 groups by record (w wins, r-w losses).
    for (const wins of range(r + 1).reverse()) {
      const y = HEADER + (r - wins) * (bucketH + 4) + ((shown - 1 - r) * (bucketH + 4)) / 2;
      boxes.push({ x, y, w: boxW, h: bucketH, kind: "bucket", label: `${wins}–${r - wins}` });
    }
  }
  return {
    key: stage.key, format: stage.format, width: SKETCH_WIDTH, height: HEADER + shown * (bucketH + 4) + 2,
    boxes, paths, texts,
    summary: t("formatSketch.system_szwajcarski_participantcount_ucze", { participantCount: stage.participantCount, v1: roundsText(stage.rounds), v2: matchesText(stage.matches) }),
    note: shown < rounds ? t("formatSketch.pokazano_shown_z_rounds_rund", { shown: shown, rounds: rounds }) : null,
  };
}

export function sketchStage(stage: SketchStageInput): SketchStage | null {
  switch (stage.format) {
    case "single_elimination": return singleElimination(stage);
    case "double_elimination": return doubleElimination(stage);
    case "round_robin": return roundRobin(stage);
    case "group_stage": return groupStage(stage);
    case "swiss": return swiss(stage);
    default: return null;
  }
}

export function sketchStages(stages: readonly SketchStageInput[]): SketchStage[] {
  return stages.map(sketchStage).filter((stage): stage is SketchStage => stage !== null);
}
