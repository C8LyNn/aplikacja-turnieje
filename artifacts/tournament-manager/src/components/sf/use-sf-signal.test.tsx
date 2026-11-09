import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import {
  SF_CYCLE_MS,
  SF_GLITCH_MS,
  SF_GLYPHS,
  makeGlitchVars,
  randomGlyphString,
  useSfSignal,
  type SfSignal,
} from "./use-sf-signal";

const originalMatchMedia = Object.getOwnPropertyDescriptor(window, "matchMedia");
afterEach(() => {
  cleanup();
  if (originalMatchMedia) Object.defineProperty(window, "matchMedia", originalMatchMedia);
  else delete (window as Partial<Window>).matchMedia;
});

function motionPreference(reduced: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({ matches: reduced }),
  });
}

function Harness() {
  const signal = useSfSignal();
  return <output data-testid="signal-state">{JSON.stringify(signal)}</output>;
}

function state(): SfSignal {
  return JSON.parse(screen.getByTestId("signal-state").textContent!);
}

test("SF uses single Matrix glyphs, fixed-length signals and varied glitch offsets", () => {
  assert.equal(SF_CYCLE_MS, 10000);
  assert.equal(SF_GLITCH_MS, 1400);
  assert.equal(Array.from(randomGlyphString(1)).length, 1);
  assert.equal(randomGlyphString(22, () => 0), SF_GLYPHS[0].repeat(22));
  assert.equal(randomGlyphString(14, () => 0.999), "9".repeat(14));
  for (const char of randomGlyphString(100)) assert.ok(SF_GLYPHS.includes(char));
  assert.notDeepEqual(makeGlitchVars(() => 0), makeGlitchVars(() => 0.9));
  assert.equal(makeGlitchVars()["--sf-dur"], "1.4s");
});

test("SF regenerates at exactly 10s and ends its glitch after 1.4s", (t) => {
  motionPreference(false);
  t.mock.timers.enable({ apis: ["setInterval", "setTimeout"] });
  let index = 0;
  t.mock.method(Math, "random", () => (index++ % SF_GLYPHS.length) / SF_GLYPHS.length);
  render(<Harness />);
  const initial = state();
  assert.equal(initial.glitching, false);
  act(() => t.mock.timers.tick(9999));
  assert.deepEqual(state(), initial);
  act(() => t.mock.timers.tick(1));
  const next = state();
  assert.equal(next.cycle, 1);
  assert.equal(next.glitching, true);
  assert.notEqual(next.signal, initial.signal);
  assert.notEqual(next.footer, initial.footer);
  assert.equal(next.glyph.length, 1);
  act(() => t.mock.timers.tick(1399));
  assert.equal(state().glitching, true);
  act(() => t.mock.timers.tick(1));
  assert.equal(state().glitching, false);
  act(() => t.mock.timers.tick(8600));
  assert.equal(state().cycle, 2);
  assert.equal(state().glitching, true);
});

test("SF refreshes its signal without glitches when reduced motion is preferred", (t) => {
  motionPreference(true);
  t.mock.timers.enable({ apis: ["setInterval", "setTimeout"] });
  render(<Harness />);
  act(() => t.mock.timers.tick(10000));
  assert.equal(state().cycle, 1);
  assert.equal(state().reducedMotion, true);
  assert.equal(state().glitching, false);
});

test("SF cancels its pending glitch and interval when unmounted", (t) => {
  motionPreference(false);
  t.mock.timers.enable({ apis: ["setInterval", "setTimeout"] });
  const random = t.mock.method(Math, "random");
  const view = render(<Harness />);
  act(() => t.mock.timers.tick(10000));
  assert.equal(state().glitching, true);
  const calls = random.mock.callCount();
  view.unmount();
  act(() => t.mock.timers.tick(50000));
  assert.equal(random.mock.callCount(), calls);
});
