import assert from "node:assert/strict";
import { test } from "node:test";
import { deDisplayName } from "./de-bracket-canvas";

test("V5.8: Experimental shows Polish double-elimination names; Stable keeps the engine's names", () => {
  assert.equal(deDisplayName("Upper R1 M2", true), "Wygrani R1 M2");
  assert.equal(deDisplayName("Lower R3 M1", true), "Przegrani R3 M1");
  assert.equal(deDisplayName("Grand Final", true), "Wielki finał");
  assert.equal(deDisplayName("Grand Final Reset", true), "Rewanż w wielkim finale");
  assert.equal(deDisplayName("Upper R1 M2", false), "Upper R1 M2");
  assert.equal(deDisplayName("Grand Final", false), "Grand Final");
});
