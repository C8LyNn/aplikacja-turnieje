import test from "node:test";
import assert from "node:assert/strict";
import {
  formValuesToPayload,
  formatFieldValue,
  keyForLabel,
  missingRequired,
  parseFieldSetFile,
  readSavedSets,
  writeSavedSet,
  deleteSavedSet,
  type FieldDef,
} from "./participant-fields-model";

const field = (extra: Partial<FieldDef>): FieldDef => ({ key: "f", label: "Pole", type: "short_text", category: "other", kind: "profile", required: false, visibility: "organizer", ...extra }) as FieldDef;

test("keys: Polish labels become unique, non-reserved slugs", () => {
  assert.equal(keyForLabel("Ulubione zwierzę", []), "ulubione_zwierze");
  assert.equal(keyForLabel("Łódź", []), "lodz");
  assert.equal(keyForLabel("Ulubione zwierzę", ["ulubione_zwierze"]), "ulubione_zwierze_2");
  assert.equal(keyForLabel("Seed", []), "seed_2", "reserved engine keys are never produced");
  assert.equal(keyForLabel("123", []), "pole_123");
  assert.equal(keyForLabel("!!!", []), "pole");
});

test("form values: numbers parsed, empty strings clear, required detected (defaults count)", () => {
  const fields = [field({ key: "mmr", type: "number", required: true }), field({ key: "status", type: "select", options: ["A"], required: true, defaultValue: "A" })];
  assert.deepEqual(formValuesToPayload(fields, { mmr: "12,5" }), { mmr: 12.5 });
  assert.deepEqual(formValuesToPayload(fields, { mmr: "" }), { mmr: "" });
  assert.deepEqual(missingRequired(fields, {}).map((item) => item.key), ["mmr"]);
  assert.deepEqual(missingRequired(fields, { mmr: 3 }), []);
});

test("display: booleans, lists and dates in Polish", () => {
  assert.equal(formatFieldValue(field({ type: "boolean" }), true), "Tak");
  assert.equal(formatFieldValue(field({ type: "multi_select" }), ["A", "B"]), "A, B");
  assert.equal(formatFieldValue(field({ type: "date" }), "2026-03-01"), "1.03.2026");
  assert.equal(formatFieldValue(field({}), null), "—");
});

test("saved sets live in this browser only and tolerate broken storage", () => {
  const store = new Map<string, string>();
  const storage = { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => void store.set(key, value) };
  assert.deepEqual(readSavedSets(storage), []);
  writeSavedSet(storage, { name: "Liga", savedAt: "2026-11-18T00:00:00Z", fields: [field({ key: "a" })] });
  writeSavedSet(storage, { name: "Liga", savedAt: "2026-11-18T01:00:00Z", fields: [field({ key: "b" })] });
  assert.equal(readSavedSets(storage).length, 1, "same name replaces");
  assert.equal(readSavedSets(storage)[0].fields[0].key, "b");
  assert.deepEqual(deleteSavedSet(storage, "Liga"), []);
  store.set("tm_participant_field_sets_v1", "{not json");
  assert.deepEqual(readSavedSets(storage), []);
  assert.deepEqual(readSavedSets(null), []);
});

test("set files: versioned object or plain list; anything else is refused", () => {
  assert.equal(parseFieldSetFile(JSON.stringify({ version: 1, fields: [field({ key: "a" })] }))?.length, 1);
  assert.equal(parseFieldSetFile(JSON.stringify([field({ key: "a" }), { nope: 1 }]))?.length, 1);
  assert.equal(parseFieldSetFile("<script>"), null);
  assert.equal(parseFieldSetFile(JSON.stringify({ fields: Array.from({ length: 41 }, (_, i) => field({ key: `f${i}` })) })), null);
});
