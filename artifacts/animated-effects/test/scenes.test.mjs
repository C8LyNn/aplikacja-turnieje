import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Exercise the real scene serializer/parser, without mounting a browser UI.
const source = readFileSync(new URL("../src/scenes/scenes.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  fileName: "scenes.ts",
}).outputText;
const defaultSettings = {
  opacity: 90, scale: 100, x: 0, y: 0, rotation: 0,
  blur: 0, brightness: 100, hue: 0, color: "#aabbcc", colorize: false,
  density: 45, blendMode: "normal", area: "full", zIndex: 0,
  speed: 100, intensity: 50, custom: { burst: 3 },
};
const definition = {
  id: "test-effect",
  defaultSettings,
  customControls: [
    { key: "burst", label: "Burst", min: 0, max: 10, defaultValue: 3 },
    { key: "glow", label: "Glow", min: 0, max: 1, defaultValue: 0.25 },
  ],
};
const timelineSource = readFileSync(new URL("../src/animation/timeline.ts", import.meta.url), "utf8");
const timelineCompiled = ts.transpileModule(timelineSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  fileName: "timeline.ts",
}).outputText;
const timelineExports = {};
runInNewContext(timelineCompiled, { exports: timelineExports });
const motionSource = readFileSync(new URL("../src/animation/motion.ts", import.meta.url), "utf8");
const motionCompiled = ts.transpileModule(motionSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  fileName: "motion.ts",
}).outputText;
const motionExports = {};
runInNewContext(motionCompiled, {
  exports: motionExports,
  require(id) {
    if (id === "./timeline") return timelineExports;
    throw new Error("Unexpected motion dependency: " + id);
  },
});
const triggerSource = readFileSync(new URL("../src/animation/triggers.ts", import.meta.url), "utf8");
const triggerCompiled = ts.transpileModule(triggerSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  fileName: "triggers.ts",
}).outputText;
const triggerExports = {};
runInNewContext(triggerCompiled, {
  exports: triggerExports,
  require(id) {
    if (id === "./motion") return motionExports;
    throw new Error("Unexpected trigger dependency: " + id);
  },
});
const exports = {};
runInNewContext(compiled, {
  exports,
  require(id) {
    if (id === "../effects/registry") {
      return { getEffectDefinition: (effectId) => effectId === definition.id ? definition : undefined };
    }
    if (id === "../animation/motion") return motionExports;
    if (id === "../animation/triggers") return triggerExports;
    throw new Error("Unexpected dependency: " + id);
  },
  structuredClone,
  crypto: globalThis.crypto,
});
const { serializeScene, parseScene } = exports;

function sceneState() {
  return {
    resolution: { width: 1920, height: 1080 },
    backgroundOnly: true,
    palette: {
      accent1: "#ffffff", accent2: "#eeeeee", accent3: "#dddddd",
      background1: "#111111", background2: "#222222",
    },
    background: {
      mode: "gradient", angle: 145, lightX: 50, lightY: 40, hue: 0,
      saturation: 1, brightness: 1, contrast: 1, noise: 0, vignette: 0.2,
    },
    focusZone: "right", safeZone: "left",
    effects: [{
      instanceId: "effect-1", effectId: "test-effect", seed: 43, enabled: false,
      settings: { ...structuredClone(defaultSettings), density: 350, custom: { burst: 7, glow: 0.8 } },
      label: "My Overlay", locked: true, groupId: "group-1",
      timeline: { mode: "loop", delayMs: 2000, durationMs: 4500, fadeInMs: 600, fadeOutMs: 450, keyframes: [{ timeMs: 0, x: 0, y: 0, scale: 100, rotation: 0, opacity: 100 }, { timeMs: 4500, x: 45, y: -12, scale: 125, rotation: 90, opacity: 50 }] },
      trigger: { source: "event", event: "tip-latest", cooldownMs: 4000, minAmount: 25 },
    }],
    selectedEffectInstanceId: "effect-1", activePresetId: null,
  };
}

test("round-trips advanced controls, zone settings, disabled layers and metadata", () => {
  const state = sceneState();
  const restored = parseScene(serializeScene(state), { ...state, focusZone: "none", safeZone: "off" });
  assert.equal(restored.warnings.length, 0);
  assert.equal(restored.state.focusZone, "right");
  assert.equal(restored.state.safeZone, "left");
  assert.equal(restored.state.effects.length, 1);
  const layer = restored.state.effects[0];
  assert.equal(layer.settings.density, 350);
  assert.equal(layer.settings.custom.burst, 7);
  assert.equal(layer.settings.custom.glow, 0.8);
  assert.equal(layer.enabled, false);
  assert.equal(layer.locked, true);
  assert.equal(layer.label, "My Overlay");
  assert.equal(layer.groupId, "group-1");
  assert.equal(layer.timeline.mode, "loop");
  assert.equal(layer.timeline.delayMs, 2000);
  assert.equal(layer.timeline.fadeOutMs, 450);
  assert.equal(layer.trigger.event, "tip-latest");
  assert.equal(layer.trigger.cooldownMs, 4000);
  assert.equal(layer.trigger.minAmount, 25);
  assert.deepEqual(
    JSON.parse(JSON.stringify(layer.timeline.keyframes)),
    [
      { timeMs: 0, x: 0, y: 0, scale: 100, rotation: 0, opacity: 100 },
      { timeMs: 4500, x: 45, y: -12, scale: 125, rotation: 90, opacity: 50 },
    ],
  );
});

test("clamps custom values and rejects non-declared control keys", () => {
  const state = sceneState();
  const document = JSON.parse(serializeScene(state));
  document.effects[0].settings.custom = { burst: 99999, glow: "not-a-number", unknown: 123 };
  const result = parseScene(JSON.stringify(document), state);
  assert.equal(result.state.effects[0].settings.custom.burst, 10);
  assert.equal(result.state.effects[0].settings.custom.glow, 0.25);
  assert.equal(result.state.effects[0].settings.custom.unknown, undefined);
});

test("rejects null and non-scene data without throwing an unhelpful type error", () => {
  assert.throws(() => parseScene("null", sceneState()), /Nieprawidłowy format sceny/);
  assert.throws(() => parseScene("{}", sceneState()), /To nie jest plik Animated Effects Scene/);
});

test("skips unknown effects and retains the remaining valid layers", () => {
  const state = sceneState();
  const document = JSON.parse(serializeScene(state));
  document.effects.push({ ...document.effects[0], instanceId: "effect-2", effectId: "missing-effect" });
  const result = parseScene(JSON.stringify(document), state);
  assert.equal(result.state.effects.length, 1);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /nieznany efekt/);
});
