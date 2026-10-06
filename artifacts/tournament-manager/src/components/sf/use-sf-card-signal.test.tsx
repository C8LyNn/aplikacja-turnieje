import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, test } from "node:test";
import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { SF_GLYPHS } from "./use-sf-signal";
import {
  makeCardGlitchVars,
  SF_CARD_CYCLE_MS,
  SF_CARD_FADE_MS,
  SF_CARD_FRAME_COUNT,
  SF_CARD_FRAME_MS,
  SF_CARD_GLITCH_MS,
  useSfCardSignal,
  type SfCardSignal,
} from "./use-sf-card-signal";

afterEach(cleanup);

function Harness() {
  const signal = useSfCardSignal();
  return <output data-testid="card-state">{JSON.stringify(signal)}</output>;
}

function state(): SfCardSignal {
  return JSON.parse(screen.getByTestId("card-state").textContent!);
}

function checkFields(signal: SfCardSignal) {
  assert.equal(signal.glyph.length, 1);
  assert.equal(signal.signal.length, 18);
  assert.equal(signal.footer.length, 8);
  for (const glyph of signal.glyph + signal.signal + signal.footer) {
    assert.ok(SF_GLYPHS.includes(glyph));
  }
}

test("SF card initializes random 1/18/8 fields at render and stays idle before 10s", (t) => {
  t.mock.timers.enable({ apis: ["setInterval", "setTimeout"] });
  const random = t.mock.method(Math, "random", () => 0);
  render(<Harness />);
  checkFields(state());
  assert.equal(random.mock.callCount(), 27);
  assert.equal(state().glitching, false);
  const initial = state();
  act(() => t.mock.timers.tick(9999));
  assert.deepEqual(state(), initial);
  act(() => t.mock.timers.tick(1));
  assert.equal(state().cycle, 1);
  assert.equal(state().glitching, true);
  assert.equal(state().frame, 0);
  assert.equal(random.mock.callCount(), 55); // One cycle seed plus all 27 characters.
});

test("SF card rerolls all fields in 18 frames of 65ms, fades 220ms, then finally rerolls", (t) => {
  t.mock.timers.enable({ apis: ["setInterval", "setTimeout"] });
  let index = 0;
  const random = t.mock.method(Math, "random", () => ((index++ * 17) % 997) / 997);
  render(<Harness />);
  const initial = state();
  act(() => t.mock.timers.tick(SF_CARD_CYCLE_MS));
  const seed = state().seed;
  assert.notEqual(state().signal, initial.signal);
  for (let frame = 0; frame < SF_CARD_FRAME_COUNT; frame += 1) {
    if (frame > 0) {
      const calls = random.mock.callCount();
      act(() => t.mock.timers.tick(SF_CARD_FRAME_MS));
      assert.equal(random.mock.callCount() - calls, 27);
    }
    checkFields(state());
    assert.equal(state().frame, frame);
    assert.equal(state().seed, seed);
    assert.equal(state().glitching, true);
    assert.equal(state().settling, false);
    assert.deepEqual(state().vars, makeCardGlitchVars(seed, frame));
  }
  const lastFrame = state();
  const calls = random.mock.callCount();
  act(() => t.mock.timers.tick(SF_CARD_FRAME_MS - 1));
  assert.deepEqual(state(), lastFrame);
  act(() => t.mock.timers.tick(1));
  assert.equal(state().settling, true);
  assert.equal(random.mock.callCount(), calls);
  act(() => t.mock.timers.tick(SF_CARD_FADE_MS - 1));
  assert.equal(state().glitching, true);
  act(() => t.mock.timers.tick(1));
  assert.equal(state().glitching, false);
  assert.equal(state().settling, false);
  assert.equal(state().frame, 18);
  assert.equal(random.mock.callCount() - calls, 27);
  assert.notEqual(state().signal, lastFrame.signal);
  assert.notEqual(state().footer, lastFrame.footer);
  assert.equal(SF_CARD_GLITCH_MS, 1390);
  checkFields(state());
  // The next cycle is measured from mount, not from the end of the last glitch.
  act(() => t.mock.timers.tick(SF_CARD_CYCLE_MS - SF_CARD_GLITCH_MS - 1));
  assert.equal(state().cycle, 1);
  act(() => t.mock.timers.tick(1));
  assert.equal(state().cycle, 2);
  assert.equal(state().frame, 0);
  assert.equal(state().glitching, true);
  assert.notEqual(state().seed, seed);
});

test("SF card ghost and overlay geometry is deterministic per seed and frame", () => {
  const original = makeCardGlitchVars(123456, 0);
  assert.deepEqual(original, makeCardGlitchVars(123456, 0));
  assert.notDeepEqual(original, makeCardGlitchVars(123456, 1));
  assert.notDeepEqual(original, makeCardGlitchVars(654321, 0));
  for (const seed of [0, 1, 123456, 654321, 0xffffffff]) {
    for (let frame = 0; frame < 18; frame += 1) {
      const vars = makeCardGlitchVars(seed, frame);
      assert.deepEqual(vars, {
        "--sf-card-ghost-x": `${1 + ((seed + frame) % 2)}px`,
        "--sf-card-scan-a": `${18 + ((seed + frame * 17) % 68)}%`,
        "--sf-card-scan-b": `${25 + ((seed + frame * 23) % 58)}%`,
        "--sf-card-wash-x": `${((seed + frame * 29) % 11) - 5}px`,
        "--sf-card-slice-y": `${12 + ((seed + frame * 31) % 76)}%`,
        "--sf-card-slice-shift": `${((seed + frame * 19) % 9) - 4}px`,
        "--sf-card-icon-x": `${((seed + frame * 3) % 3) - 1}px`,
        "--sf-card-icon-skew": `${(((seed + frame * 5) % 5) - 2) * 1.2}deg`,
        "--sf-card-desc-c-top": `${(seed + frame * 9) % 55}%`,
        "--sf-card-desc-c-bottom": `${(seed + frame * 5) % 35}%`,
        "--sf-card-desc-m-top": `${(seed + frame * 5) % 35}%`,
        "--sf-card-desc-m-bottom": `${(seed + frame * 11) % 45}%`,
      });
      assert.ok(!Object.keys(vars).some((key) => key.includes("ghost-y")));
    }
  }
});

test("SF card CSS uses horizontal-only transforms, exact scanline/slice heights and description clips", () => {
  const css = readFileSync(new URL("./sf-card-glitch.css", import.meta.url), "utf8");
  const rule = (selector: string) => {
    const start = css.indexOf(`\n${selector} {`);
    assert.ok(start >= 0, `Missing selector: ${selector}`);
    return css.slice(start, css.indexOf("}", start));
  };
  assert.doesNotMatch(css, /translateY|translate3d|translate\(|skewY|ghost-y/);
  assert.match(rule(".sf-card__scanline"), /height: 1px;/);
  assert.match(rule(".sf-card__scanline--fuchsia"), /height: 2px;/);
  const slice = rule(".sf-card__slice");
  assert.match(slice, /height: 7px;/);
  assert.doesNotMatch(slice, /255,\s*47,\s*184/);
  const wash = rule(".sf-card__wash");
  assert.match(wash, /rgba\(34, 229, 238, \.035\)/);
  assert.doesNotMatch(wash, /rgba\(255,\s*47,\s*184/);
  assert.match(wash, /translateX\(var\(--sf-card-wash-x\)\)/);
  assert.match(rule('.sf-card[data-state="glitch"] .sf-card__glyph'),
    /translateX\(var\(--sf-card-icon-x\)\) skewX\(var\(--sf-card-icon-skew\)\)/);
  assert.match(rule(".sf-card .sf-card__signal .sf-fx__ghost--c"),
    /inset\(var\(--sf-card-desc-c-top\) 0 var\(--sf-card-desc-c-bottom\) 0\)/);
  assert.match(rule(".sf-card .sf-card__signal .sf-fx__ghost--m"),
    /inset\(var\(--sf-card-desc-m-top\) 0 var\(--sf-card-desc-m-bottom\) 0\)/);
});

test("SF card keeps literal SF, a single shadowed icon and only the fuchsia footer ghost", () => {
  const source = readFileSync(new URL("./sf-views.tsx", import.meta.url), "utf8");
  const card = source.split("export function SfCard")[1].split("/** /sf page panel. */")[0];
  assert.match(card, /<SfGlitchText text="SF" className="sf-card__title"/);
  assert.match(card, /sf-card__glyph inline-block[^>]*>\{s\.glyph\}<\/span>/);
  assert.match(card, /items-start text-left/);
  assert.equal((card.match(/className="sf-card__scanline /g) ?? []).length, 2);
  const footer = card.slice(card.indexOf('className="sf-fx sf-card__footer"'));
  assert.match(footer, /data-testid="text-sf-footer"/);
  assert.equal((footer.match(/sf-fx__ghost--m/g) ?? []).length, 1);
  assert.doesNotMatch(footer, /sf-fx__ghost--c/);
});

for (const phase of ["frames", "settling"] as const) {
  test(`SF card clears every timer when unmounted during ${phase}`, (t) => {
    t.mock.timers.enable({ apis: ["setInterval", "setTimeout"] });
    const random = t.mock.method(Math, "random");
    const view = render(<Harness />);
    act(() => t.mock.timers.tick(10000));
    if (phase === "settling") {
      for (let frame = 0; frame < 18; frame += 1) {
        act(() => t.mock.timers.tick(65));
      }
      assert.equal(state().settling, true);
    }
    const calls = random.mock.callCount();
    view.unmount();
    act(() => t.mock.timers.tick(50000));
    assert.equal(random.mock.callCount(), calls);
  });
}
