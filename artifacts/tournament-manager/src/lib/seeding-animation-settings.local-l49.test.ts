import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import { loadAnimSettings, saveAnimSettings, sampleDuration, sampleSpeed } from "./seeding-animation-settings";

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
const defaults = {
  durationMode: "random", durationMin: 4, durationMax: 6,
  durationLongEnabled: true, durationLongChance: 20, durationLongMin: 7, durationLongMax: 10,
  speedMode: "random", speedMin: 0.9, speedMax: 1.1,
  speedAltEnabled: true, speedAltChance: 20, speedAltMin: 1.1, speedAltMax: 1.4,
};
const key = "seeding-ceremony-anim-v1";

function stored(text: string | null) {
  const reads: string[] = [];
  const writes: Array<[string, string]> = [];
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem(name: string) { reads.push(name); return text; },
      setItem(name: string, value: string) { writes.push([name, value]); },
    },
  });
  return { reads, writes };
}

afterEach(() => {
  mock.restoreAll();
  if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
  else Reflect.deleteProperty(globalThis, "localStorage");
});

test("L49: missing preferences use the existing defaults and storage key", () => {
  const storage = stored(null);
  assert.deepEqual(loadAnimSettings(), defaults);
  assert.deepEqual(storage.reads, [key]);
});

test("L49: existing valid preferences survive normalization", () => {
  const valid = { ...defaults, durationMode: "fixed", durationMin: 5, durationMax: 5,
    durationLongEnabled: false, speedMode: "fixed", speedMin: 2, speedMax: 2, speedAltEnabled: false };
  stored(JSON.stringify(valid));
  assert.deepEqual(loadAnimSettings(), valid);
});

test("L49: strings, nulls and wrong enums cannot enter numeric or boolean settings", () => {
  stored(JSON.stringify({ durationMode: "invalid", speedMode: 3, durationMin: "4", durationMax: null,
    durationLongEnabled: "false", durationLongChance: "25", speedMin: [], speedAltEnabled: 0 }));
  assert.deepEqual(loadAnimSettings(), defaults);
});

test("L49: out-of-range numbers are clamped to the existing control limits", () => {
  stored(JSON.stringify({ durationMin: -100, durationMax: 200, durationLongMin: 100,
    durationLongMax: 1000, durationLongChance: 0, speedMin: -2, speedMax: 100,
    speedAltMin: -1, speedAltMax: 200, speedAltChance: 200 }));
  assert.deepEqual(loadAnimSettings(), { ...defaults, durationMin: 1, durationMax: 30,
    durationLongMin: 60, durationLongMax: 60, durationLongChance: 1,
    speedMin: 0.5, speedMax: 5, speedAltMin: 0.5, speedAltMax: 5, speedAltChance: 99 });
});

test("L49: reversed ranges and a short long-duration variant are repaired together", () => {
  stored(JSON.stringify({ durationMin: 20, durationMax: 2, durationLongMin: 1, durationLongMax: 3,
    speedMin: 4, speedMax: 1, speedAltMin: 5, speedAltMax: 0.5 }));
  assert.deepEqual(loadAnimSettings(), { ...defaults, durationMin: 20, durationMax: 20,
    durationLongMin: 20.5, durationLongMax: 20.5, speedMin: 4, speedMax: 4, speedAltMin: 5, speedAltMax: 5 });
});

for (const raw of ["null", "42", '"bad"', '[{"durationMin":1000}]']) {
  test(`L49: non-object JSON ${raw} falls back without extra fields`, () => {
    stored(raw);
    assert.deepEqual(loadAnimSettings(), defaults);
  });
}

test("L49: malformed JSON and overflowing JSON numbers remain safe", () => {
  stored('{"durationMin":');
  assert.deepEqual(loadAnimSettings(), defaults);
  stored('{"durationMin":1e999,"speedMin":-1e999}');
  assert.deepEqual(loadAnimSettings(), defaults);
});

test("L49: unrecognized stored properties are discarded", () => {
  stored(JSON.stringify({ ...defaults, unexpected: true, resultOverride: "not-used" }));
  assert.deepEqual(loadAnimSettings(), defaults);
});

test("L49: denied browser storage does not prevent opening or changing the settings", () => {
  Object.defineProperty(globalThis, "localStorage", { configurable: true, get() { throw new Error("denied"); } });
  assert.deepEqual(loadAnimSettings(), defaults);
  assert.doesNotThrow(() => saveAnimSettings(loadAnimSettings()));
});

test("L49: preferences remain usable when browser storage is unavailable", () => {
  Reflect.deleteProperty(globalThis, "localStorage");
  assert.deepEqual(loadAnimSettings(), defaults);
  assert.doesNotThrow(() => saveAnimSettings(loadAnimSettings()));
});

test("L49: writes normalize values and retain the existing key without mutating the input", () => {
  const storage = stored(null);
  const input = { ...loadAnimSettings(), durationMin: Number.NaN, speedMax: Number.POSITIVE_INFINITY,
    durationLongChance: 200, unexpected: "ignored" };
  const before = { ...input };
  saveAnimSettings(input);
  assert.equal(storage.writes.length, 1);
  assert.equal(storage.writes[0][0], key);
  assert.deepEqual(JSON.parse(storage.writes[0][1]), { ...defaults, durationLongChance: 99 });
  assert.deepEqual(input, before);
});

test("L49: string durations cannot cause toFixed to throw while drawing the wheel", () => {
  stored('{"durationMin":"4","durationMax":"6","durationLongEnabled":false}');
  mock.method(Math, "random", () => 0.5);
  const duration = sampleDuration(loadAnimSettings());
  assert.equal(typeof duration, "number");
  assert.equal(duration.toFixed(2), "5.00");
});

test("L49: fixed sampling retains the selected duration and speed", () => {
  stored(JSON.stringify({ ...defaults, durationMode: "fixed", durationMin: 3, durationMax: 5,
    durationLongEnabled: false, speedMode: "fixed", speedMin: 2.5, speedAltEnabled: false }));
  mock.method(Math, "random", () => 0.8);
  const settings = loadAnimSettings();
  assert.equal(sampleDuration(settings), 3);
  assert.equal(sampleSpeed(settings), 2.5);
});

test("L49: the longer and alternate animation branches still use their chosen intervals", () => {
  stored(JSON.stringify({ ...defaults, durationLongChance: 99, durationLongMin: 8, durationLongMax: 12,
    speedAltChance: 99, speedAltMin: 2, speedAltMax: 4 }));
  mock.method(Math, "random", () => 0.5);
  const settings = loadAnimSettings();
  assert.equal(sampleDuration(settings), 10);
  assert.equal(sampleSpeed(settings), 3);
});

test("L49: separate loads cannot mutate the defaults used by later openings", () => {
  stored(null);
  const first = loadAnimSettings();
  first.durationMin = 25;
  assert.deepEqual(loadAnimSettings(), defaults);
});
