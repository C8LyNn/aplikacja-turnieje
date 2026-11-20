// #323-C · the layout sketch is drawn only from the server preview's numbers and always fits its drawing area.
import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { cleanup, render, screen, within } from "@testing-library/react";
import { previewPreset, PRESET_DEFINITIONS, PRESET_IDS } from "../../../api-server/src/domain/tournament/tournament-presets";
import { approxTextWidth, knockoutRoundName, SKETCH_FONT, sketchStage, sketchStages, spreadIndices, type SketchStage } from "./format-sketch";
import { FormatSketch } from "@/components/format-sketch";
import { PreviewPanel } from "@/features/experimental-tournaments/experimental-create-wizard";
import type { PresetPreview } from "@/features/experimental-tournaments/experimental-create-wizard-model";

afterEach(() => cleanup());

const preview = (presetId: string, participantCount: number, params: Record<string, number> = {}) =>
  previewPreset({ presetId: presetId as never, params: { participantCount, bestOf: 1, ...params }, priority: "short" } as never) as unknown as PresetPreview;
const count = (sketch: SketchStage, kind: string) => sketch.boxes.filter((box) => box.kind === kind).length;

function assertInside(sketch: SketchStage, label: string) {
  for (const box of sketch.boxes) {
    assert.ok(box.x >= -0.01 && box.y >= -0.01, `${label}: box starts inside (${box.x},${box.y})`);
    assert.ok(box.x + box.w <= sketch.width + 0.01 && box.y + box.h <= sketch.height + 0.01, `${label}: box ends inside`);
    assert.ok(box.w > 0 && box.h > 0, `${label}: box has a size`);
  }
  const spans = sketch.texts.map((text) => {
    const width = approxTextWidth(text.text);
    const left = text.anchor === "start" ? text.x : text.anchor === "end" ? text.x - width : text.x - width / 2;
    return { text, left, right: left + width };
  });
  for (const span of spans) {
    assert.ok(span.left >= -0.5 && span.right <= sketch.width + 0.5 && span.text.y > 0 && span.text.y < sketch.height, `${label}: text "${span.text.text}" inside`);
  }
  for (const [i, a] of spans.entries()) for (const b of spans.slice(i + 1)) {
    if (Math.abs(a.text.y - b.text.y) < SKETCH_FONT.header) assert.ok(a.right <= b.left + 0.5 || b.right <= a.left + 0.5, `${label}: "${a.text.text}" and "${b.text.text}" do not overlap`);
  }
  for (const box of sketch.boxes) if (box.label) assert.ok(approxTextWidth(box.label, SKETCH_FONT.label) <= box.w, `${label}: label "${box.label}" fits its box`);
  for (const d of sketch.paths) for (const n of d.match(/-?\d+(\.\d+)?/g)!.map(Number)) assert.ok(n >= -0.01 && n <= Math.max(sketch.width, sketch.height) + 0.01, `${label}: path inside`);
}

test("#323-C: every preset at every supported size gets a sketch for each stage, inside its drawing area", () => {
  let checked = 0;
  for (const presetId of PRESET_IDS) {
    const [min, max] = PRESET_DEFINITIONS[presetId].participantRange;
    for (const n of [2, 3, 5, 8, 12, 16, 20, 24, 32, 48, 64, 100, 128]) {
      if (n < min || n > max) continue;
      let p: PresetPreview;
      try { p = preview(presetId, n); } catch { continue; } // the server refuses some sizes; the wizard shows why
      const sketches = sketchStages(p.stages);
      assert.equal(sketches.length, p.stages.length, `${presetId}/${n}: one sketch per stage`);
      sketches.forEach((sketch) => assertInside(sketch, `${presetId}/${n}/${sketch.format}`));
      checked += 1;
    }
  }
  assert.ok(checked >= 50, `checked ${checked} layouts`);
});

test("#323-C: a cup for 12 draws 8 → 4 → 2 → 1 with 4 byes spread over the first round", () => {
  const stage = preview("single_elimination", 12).stages[0];
  const sketch = sketchStage(stage)!;
  assert.equal(count(sketch, "match") + count(sketch, "bye") + count(sketch, "final"), 8 + 4 + 2 + 1);
  assert.equal(count(sketch, "bye"), stage.byes);
  assert.equal(count(sketch, "final"), 1);
  assert.deepEqual(sketch.texts.map((t) => t.text), ["1/8", "Ćwierćfinał", "Półfinał", "Finał"]);
  assert.match(sketch.summary, /12 uczestników, 4 rundy, 11 meczów, 4 wolne losy w 1\. rundzie/);
  assert.equal(sketch.note, null);
});

test("#323-C: a large cup shows the last rounds and says what is left out", () => {
  const sketch = sketchStage(preview("single_elimination", 100).stages[0])!;
  assert.deepEqual(sketch.texts.map((t) => t.text), ["1/8", "Ćwierćfinał", "Półfinał", "Finał"]);
  assert.equal(count(sketch, "bye"), 0, "byes are in the hidden first round");
  assert.match(sketch.note!, /wcześniej 3 rundy eliminacji/);
});

test("#323-C: double elimination has an upper and a lower bracket and one grand final", () => {
  const sketch = sketchStage(preview("double_elimination", 8).stages[0])!;
  assert.equal(count(sketch, "final"), 1);
  assert.equal(count(sketch, "match"), 7 + 6, "upper 4+2+1, lower 2+2+1+1");
  assert.ok(sketch.texts.some((t) => t.text === "Dolna drabinka — druga szansa"));
  assert.ok(sketch.texts.some((t) => t.text === "Wielki finał"));
});

test("#323-C: groups show every participant and mark the qualifiers", () => {
  const p = preview("groups_playoff", 16);
  const [groups, playoff] = sketchStages(p.stages);
  const g = p.stages[0];
  assert.equal(count(groups, "group"), g.groupSizes!.length);
  assert.equal(count(groups, "seat") + count(groups, "qualifier"), 16);
  assert.equal(count(groups, "qualifier"), g.advancingCount);
  assert.equal(playoff.format, "single_elimination");
  assert.equal(count(playoff, "final"), 1);
});

test("#323-C: round robin draws the table (10 rows max), Swiss the record groups per round", () => {
  const rr = sketchStage(preview("round_robin", 6).stages[0])!;
  assert.equal(count(rr, "cell"), 30);
  assert.equal(count(rr, "self"), 6);
  const big = sketchStage(preview("round_robin", 16).stages[0])!;
  assert.equal(count(big, "cell") + count(big, "self"), 100);
  assert.match(big.note!, /10 z 16/);
  const legs = sketchStage(preview("round_robin", 6, { legs: 2 }).stages[0])!;
  assert.ok(legs.texts[0].text.includes("rewanż"));
  const sw = preview("swiss", 16);
  const swiss = sketchStage(sw.stages[0])!;
  const rounds = sw.stages[0].rounds.max;
  assert.equal(count(swiss, "bucket"), (rounds * (rounds + 1)) / 2);
  assert.deepEqual(swiss.boxes.filter((b) => b.kind === "bucket").slice(0, 3).map((b) => b.label), ["0–0", "1–0", "0–1"]);
});

test("#323-C: helpers", () => {
  assert.equal(knockoutRoundName(16), "1/16");
  assert.deepEqual([...spreadIndices(4, 8)], [0, 2, 4, 6]);
  assert.equal(spreadIndices(0, 8).size, 0);
  assert.equal(sketchStage({ key: "x", name: "x", format: "unknown", formatLabel: "", participantCount: 4, groupSizes: null, advancingCount: null, matches: { min: 1, max: 1 }, rounds: { min: 1, max: 1 }, byes: 0 }), null);
});

test("#323-C: the component labels each drawing and connects the stages", () => {
  const p = preview("groups_playoff", 16);
  render(<FormatSketch stages={p.stages} accent="red" />);
  const figure = screen.getByTestId("format-sketch");
  const images = within(figure).getAllByRole("img");
  assert.equal(images.length, 2);
  assert.match(images[0].getAttribute("aria-label")!, /^Faza grupowa: 4 grupy/);
  assert.ok(figure.textContent!.includes(`↓ ${p.stages[0].advancementText}`));
  assert.equal(within(figure).getAllByTestId("format-sketch-caption").length, 2);
});

test("#323-C: the Modern preview panel shows the sketch; compact mode drops the captions", () => {
  const p = preview("double_elimination", 12);
  const { unmount } = render(<PreviewPanel preview={p} noun={() => "uczestników"} loading={false} stale={false} />);
  assert.ok(screen.getByTestId("format-sketch").querySelector('[data-format="double_elimination"]'));
  assert.equal(screen.getAllByTestId("format-sketch-caption").length, 1);
  unmount();
  render(<PreviewPanel preview={p} noun={() => "uczestników"} loading={false} stale={false} compact />);
  assert.ok(screen.getByTestId("format-sketch"));
  assert.equal(screen.queryAllByTestId("format-sketch-caption").length, 0);
});
