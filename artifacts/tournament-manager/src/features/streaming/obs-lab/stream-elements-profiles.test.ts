import assert from "node:assert/strict";
import { test } from "node:test";
import type { EditorState } from "../../../../../animated-effects/src/core/types";
import { getEffectDefinition } from "../../../../../animated-effects/src/effects/registry";
import { getEditorState, replaceEditorState } from "../../../../../animated-effects/src/editor/state";
import { setupExportPanel } from "../../../../../animated-effects/src/editor/exportPanel";
import {
  MAX_PROFILE_BYTES,
  MAX_SAVED_PROFILES,
  PROFILE_STORAGE_KEY,
  createStreamElementsProfile,
  loadStreamElementsProfiles,
  parseStreamElementsProfile,
  saveStreamElementsProfiles,
} from "../../../../../animated-effects/src/export/streamElementsProfiles";

function exampleScene(): EditorState {
  const base = structuredClone(getEditorState());
  const rainfall = getEffectDefinition("rainfall");
  assert.ok(rainfall, "rainfall must be registered");
  return {
    ...base,
    effects: [
      { instanceId: "rain-layer", effectId: "rainfall", enabled: true, seed: 101, locked: false, groupId: null,
        label: "Deszcz", settings: structuredClone(rainfall.defaultSettings) },
      { instanceId: "snow-layer", effectId: "rainfall", enabled: true, seed: 102, locked: false, groupId: null,
        label: "Płynący deszcz", settings: structuredClone(rainfall.defaultSettings) },
    ],
    selectedEffectInstanceId: "rain-layer",
  };
}
const routes = [
  { id: "cmd-rain", mode: "chat-command" as const, chatCommand: "!rain",
    activeDurationMs: 3000, cooldownMs: 9000, effectInstanceIds: ["rain-layer"] },
  { id: "raid-rain", mode: "raid" as const,
    activeDurationMs: 5000, cooldownMs: 1000, effectInstanceIds: ["snow-layer"] },
];

test("portable profile roundtrip keeps exact layer IDs, effect settings, routes and durations", () => {
  const scene = exampleScene();
  const saved = createStreamElementsProfile(
    "Overlay: deszcz",
    scene,
    { mode: "chat-command", chatCommand: "!RAIN", activeDurationMs: 2500, cooldownMs: 8000 },
    routes,
  );
  const received = parseStreamElementsProfile(JSON.stringify(saved));
  assert.deepEqual(received, saved);
  assert.deepEqual(received.scene.effects, scene.effects);
  assert.deepEqual(received.routes, routes.map((rule) => ({
    ...rule,
    chatCommand: rule.chatCommand ?? "!hype",
  })));
  assert.equal(received.trigger.chatCommand, "!rain");
  assert.equal(received.routes?.[0]?.effectInstanceIds[0], "rain-layer");
});

test("single-trigger presets preserve always-on legacy mode and empty multiple routes", () => {
  const scene = exampleScene();
  const legacy = createStreamElementsProfile("Ciągły", scene, {}, undefined);
  assert.equal(legacy.routes, null);
  assert.equal(legacy.trigger.mode, "always");
  assert.equal(parseStreamElementsProfile(JSON.stringify(legacy)).routes, null);
  const multiEmpty = createStreamElementsProfile("Pusty routing", scene, {}, []);
  assert.deepEqual(multiEmpty.routes, []);
});

test("local profile storage saves, reloads, and rejects overflow without mutation", () => {
  const map = new Map<string, string>();
  const storage = {
    getItem(key: string) { return map.get(key) ?? null; },
    setItem(key: string, value: string) { map.set(key, value); },
  };
  const scene = exampleScene();
  const profile = createStreamElementsProfile("Zmiana sceny", scene, {}, routes);
  saveStreamElementsProfiles(storage, [profile]);
  assert.deepEqual(loadStreamElementsProfiles(storage), [profile]);
  assert.ok(map.has(PROFILE_STORAGE_KEY));
  assert.throws(
    () => saveStreamElementsProfiles(storage, Array.from({ length: MAX_SAVED_PROFILES + 1 }, () => profile)),
    /Limit/,
  );
  assert.deepEqual(loadStreamElementsProfiles(storage), [profile]);
  assert.throws(() => saveStreamElementsProfiles({ setItem() { throw new Error("denied"); } }, [profile]), /pamięci przeglądarki/);
  assert.throws(() => loadStreamElementsProfiles({ getItem() { throw new Error("denied"); } }), /Przeglądarka/);
});

test("import validation rejects incompatible, hostile or broken scene content", () => {
  const source = createStreamElementsProfile("Safe", exampleScene(), {}, routes);
  const corrupted = (change: (candidate: Record<string, any>) => void) => {
    const candidate = structuredClone(source) as unknown as Record<string, any>;
    change(candidate);
    return candidate;
  };
  assert.throws(() => parseStreamElementsProfile({}), /Nieobsługiwany/);
  assert.throws(() => parseStreamElementsProfile(corrupted((p) => { p.version = 999; })), /Nieobsługiwany/);
  assert.throws(() => parseStreamElementsProfile(corrupted((p) => { p.scene.effects[0].effectId = "__proto__"; })), /Nieznany efekt/);
  assert.throws(() => parseStreamElementsProfile(corrupted((p) => { p.scene.effects[0].settings.custom = { unsafe: Infinity }; })), /parametry własne/);
  assert.throws(() => parseStreamElementsProfile(corrupted((p) => { p.scene.palette.accent1 = "<script>alert(1)</script>"; })), /paleta/);
  assert.throws(() => parseStreamElementsProfile(corrupted((p) => { p.scene.effects[1].instanceId = "rain-layer"; })), /warstwę/);
  assert.throws(() => parseStreamElementsProfile(corrupted((p) => { p.scene.effects = Array.from({ length: 65 }, () => p.scene.effects[0]); })), /Zbyt wiele/);
  assert.ok(JSON.stringify(source).length < MAX_PROFILE_BYTES);
});

test("saving a profile and confirmed loading restores the scene and rule editor", () => {
  const original = structuredClone(getEditorState());
  const storage = window.localStorage;
  const previous = storage.getItem(PROFILE_STORAGE_KEY);
  const originalConfirm = window.confirm;
  const scene = exampleScene();
  const dialog = document.createElement("dialog");
  dialog.innerHTML = `
    <input data-profile-name value="Zestaw deszczu">
    <select data-profile-select></select>
    <button type="button" data-profile-save>Save</button>
    <button type="button" data-profile-load>Load</button>
    <button type="button" data-profile-export>Export</button>
    <button type="button" data-profile-delete>Delete</button>
    <button type="button" data-profile-import>Import</button>
    <input type="file" data-profile-file>
    <p data-profile-status></p>
    <div data-single-trigger>
      <select data-trigger-mode><option value="always">Always</option><option value="chat-command">Chat</option></select>
      <label data-trigger-command-field><input data-trigger-command value="!hype"></label>
      <label data-trigger-timing><input data-trigger-duration value="5"></label>
      <label data-trigger-timing><input data-trigger-cooldown value="10"></label>
      <p data-trigger-info></p>
    </div>
    <input type="checkbox" data-multi-routes>
    <div data-route-workspace><div data-route-list></div>
      <button type="button" data-add-route>add</button><p data-route-warning></p>
    </div>
    <span data-export-metrics></span>
    <textarea data-export="html"></textarea><textarea data-export="css"></textarea>
    <textarea data-export="javascript"></textarea>
  `;
  Object.defineProperty(dialog, "showModal", { value: () => { dialog.open = true; } });
  document.body.append(dialog);
  try {
    storage.removeItem(PROFILE_STORAGE_KEY);
    Object.defineProperty(window, "confirm", { configurable: true, value: () => true });
    replaceEditorState(scene);
    setupExportPanel(dialog);
    dialog.querySelector<HTMLInputElement>("[data-multi-routes]")!.checked = true;
    dialog.querySelector<HTMLInputElement>("[data-multi-routes]")!.dispatchEvent(new window.Event("change"));
    const card = dialog.querySelector<HTMLElement>("[data-route-id]")!;
    card.querySelector<HTMLInputElement>("[data-route-command]")!.value = "!rain";
    const boxes = card.querySelectorAll<HTMLInputElement>("[data-route-effects] input");
    boxes[0]!.checked = true;
    boxes[1]!.checked = false;
    dialog.querySelector<HTMLButtonElement>("[data-profile-save]")!.click();
    assert.equal(loadStreamElementsProfiles(storage).length, 1);
    assert.equal(loadStreamElementsProfiles(storage)[0]?.routes?.[0]?.chatCommand, "!rain");

    replaceEditorState({ ...scene, effects: [] }, "test clear");
    dialog.querySelector<HTMLButtonElement>("[data-profile-load]")!.click();
    assert.equal(getEditorState().effects.length, 2);
    assert.equal(getEditorState().effects[0]?.instanceId, "rain-layer");
    assert.equal(dialog.querySelector<HTMLInputElement>("[data-multi-routes]")!.checked, true);
    assert.equal(dialog.querySelector<HTMLInputElement>("[data-route-command]")!.value, "!rain");
    assert.equal(dialog.querySelectorAll<HTMLInputElement>("[data-route-effects] input:checked").length, 1);
    assert.match(dialog.querySelector<HTMLElement>("[data-profile-status]")!.textContent ?? "", /Wczytano/);
  } finally {
    dialog.remove();
    Object.defineProperty(window, "confirm", { configurable: true, value: originalConfirm });
    replaceEditorState(original);
    if (previous === null) storage.removeItem(PROFILE_STORAGE_KEY);
    else storage.setItem(PROFILE_STORAGE_KEY, previous);
  }
});
