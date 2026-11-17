import test from "node:test";
import assert from "node:assert/strict";
import {
  PARTICIPANT_FIELD_LIBRARY,
  PARTICIPANT_FIELD_LIMITS,
  definitionChangeImpact,
  fieldForCsvHeader,
  normaliseFieldValue,
  parseParticipantFieldSet,
  pruneValues,
  validateFieldValues,
  visibleFieldSet,
  visibleFieldValues,
  type ParticipantFieldDefinition,
  type ParticipantFieldSet,
} from "../src/domain/tournament/participant-fields";

const set = (fields: unknown[]): ParticipantFieldSet => {
  const parsed = parseParticipantFieldSet({ version: 1, fields });
  assert.ok(parsed.ok, JSON.stringify(!parsed.ok && parsed.problems));
  return parsed.value;
};

test("library fields parse as definitions; private-looking data is not public by default", () => {
  const all = set(PARTICIPANT_FIELD_LIBRARY.map((entry) => ({ ...entry, required: false })));
  assert.equal(all.fields.length, PARTICIPANT_FIELD_LIBRARY.length);
  for (const key of ["first_name", "last_name", "email", "phone", "birth_date", "notes", "fee_paid"]) {
    assert.equal(all.fields.find((field) => field.key === key)?.visibility, "organizer", key);
  }
  assert.equal(all.fields.find((field) => field.key === "discord")?.visibility, "staff");
});

test("custom fields default to organiser-only and reject reserved, duplicate or malformed keys", () => {
  const custom = set([{ key: "ulubione_jedzenie", label: "Ulubione jedzenie", type: "short_text" }]);
  assert.equal(custom.fields[0].visibility, "organizer", "private by default");
  for (const key of ["seed", "token", "password", "__proto__", "constructor", "Name", "1abc", "a-b", "x".repeat(41)]) {
    const parsed = parseParticipantFieldSet({ fields: [{ key, label: "X", type: "short_text" }] });
    assert.equal(parsed.ok, false, key);
  }
  const duplicate = parseParticipantFieldSet({ fields: [{ key: "a", label: "A", type: "number" }, { key: "a", label: "B", type: "number" }] });
  assert.equal(duplicate.ok, false);
  const extra = parseParticipantFieldSet({ fields: [{ key: "a", label: "A", type: "number", script: "alert(1)" }] });
  assert.equal(extra.ok, false, "unknown properties (e.g. code) are refused");
  const tooMany = parseParticipantFieldSet({ fields: Array.from({ length: PARTICIPANT_FIELD_LIMITS.fields + 1 }, (_, index) => ({ key: `f${index}`, label: `F${index}`, type: "boolean" })) });
  assert.equal(tooMany.ok, false);
});

test("every type validates and normalises its values", () => {
  const field = (type: string, extra: Record<string, unknown> = {}) =>
    set([{ key: "f", label: "Pole", type, ...extra }]).fields[0] as ParticipantFieldDefinition;
  assert.deepEqual(normaliseFieldValue(field("short_text"), "  Ala  "), { ok: true, value: "Ala" });
  assert.equal(normaliseFieldValue(field("short_text"), "a\nb").ok, false, "one line");
  assert.equal(normaliseFieldValue(field("short_text"), "x".repeat(201)).ok, false);
  assert.equal(normaliseFieldValue(field("short_text"), "zły‮tekst").ok, false, "bidi override refused");
  assert.deepEqual(normaliseFieldValue(field("long_text"), "a\r\nb"), { ok: true, value: "a\nb" });
  assert.deepEqual(normaliseFieldValue(field("number", { min: 0, max: 10 }), "7,5"), { ok: true, value: 7.5 });
  assert.equal(normaliseFieldValue(field("number", { min: 0, max: 10 }), 11).ok, false);
  assert.equal(normaliseFieldValue(field("number"), "NaN").ok, false);
  assert.deepEqual(normaliseFieldValue(field("select", { options: ["A", "B"] }), "B"), { ok: true, value: "B" });
  assert.equal(normaliseFieldValue(field("select", { options: ["A", "B"] }), "C").ok, false);
  assert.deepEqual(normaliseFieldValue(field("multi_select", { options: ["A", "B"] }), "A; B; A"), { ok: true, value: ["A", "B"] });
  assert.deepEqual(normaliseFieldValue(field("boolean"), "tak"), { ok: true, value: true });
  assert.deepEqual(normaliseFieldValue(field("date"), "2026-02-28"), { ok: true, value: "2026-02-28" });
  assert.equal(normaliseFieldValue(field("date"), "2026-02-30").ok, false);
  assert.deepEqual(normaliseFieldValue(field("color"), "#A1B2C3"), { ok: true, value: "#a1b2c3" });
  assert.equal(normaliseFieldValue(field("color"), "red").ok, false);
  assert.equal(normaliseFieldValue(field("url"), "javascript:alert(1)").ok, false);
  assert.equal(normaliseFieldValue(field("url"), "https://user:pw@example.com").ok, false, "no credentials in URLs");
  assert.deepEqual(normaliseFieldValue(field("url"), "https://example.com/p"), { ok: true, value: "https://example.com/p" });
  assert.deepEqual(normaliseFieldValue(field("number"), ""), { ok: true, value: null }, "empty clears");
});

test("visibility: organiser sees all, helpers staff+public, viewers public only; unknown stored keys never leak", () => {
  const fields = set([
    { key: "nick_gry", label: "Nick", type: "short_text", visibility: "public" },
    { key: "discord_id", label: "Discord", type: "short_text", visibility: "staff" },
    { key: "telefon", label: "Telefon", type: "short_text", visibility: "organizer" },
  ]);
  const stored = { nick_gry: "Ala", discord_id: "ala#1", telefon: "123", removed_field: "stare" };
  assert.deepEqual(visibleFieldValues(fields, stored, "public"), { nick_gry: "Ala" });
  assert.deepEqual(visibleFieldValues(fields, stored, "staff"), { nick_gry: "Ala", discord_id: "ala#1" });
  assert.deepEqual(visibleFieldValues(fields, stored, "organizer"), { nick_gry: "Ala", discord_id: "ala#1", telefon: "123" });
  assert.deepEqual(visibleFieldSet(fields, "public")?.fields.map((field) => field.key), ["nick_gry"]);
});

test("values: required on create, defaults applied, helpers cannot write organiser-only fields, partial updates keep the rest", () => {
  const fields = set([
    { key: "status_zgloszenia", label: "Status", type: "select", options: ["Zgłoszony", "Potwierdzony"], defaultValue: "Zgłoszony", visibility: "staff" },
    { key: "mmr_value", label: "MMR", type: "number", required: true, visibility: "public" },
    { key: "uwagi", label: "Uwagi", type: "long_text" },
  ]);
  const missing = validateFieldValues(fields, {}, { audience: "organizer", enforceRequired: true, applyDefaults: true });
  assert.equal(missing.ok, false);
  const created = validateFieldValues(fields, { mmr_value: 1500 }, { audience: "organizer", enforceRequired: true, applyDefaults: true });
  assert.deepEqual(created.ok && created.values, { status_zgloszenia: "Zgłoszony", mmr_value: 1500 });
  const helper = validateFieldValues(fields, { uwagi: "x" }, { stored: { mmr_value: 1 }, audience: "staff", enforceRequired: false });
  assert.equal(helper.ok, false, "organiser-only field refused for a helper");
  const partial = validateFieldValues(fields, { status_zgloszenia: "Potwierdzony" }, { stored: { mmr_value: 1, uwagi: "tajne" }, audience: "staff", enforceRequired: false });
  assert.deepEqual(partial.ok && partial.values, { status_zgloszenia: "Potwierdzony", mmr_value: 1, uwagi: "tajne" }, "hidden values are kept, not dropped");
  const unknown = validateFieldValues(fields, { inne: 1 }, { audience: "organizer", enforceRequired: false });
  assert.equal(unknown.ok, false);
});

test("definition changes that would lose values are detected before saving", () => {
  const before = set([
    { key: "mmr_value", label: "MMR", type: "number" },
    { key: "kolor", label: "Kolor", type: "color" },
    { key: "rola", label: "Rola", type: "select", options: ["Atak", "Obrona"] },
  ]);
  const after = set([
    { key: "mmr_value", label: "MMR", type: "short_text" },
    { key: "rola", label: "Rola", type: "select", options: ["Atak"] },
  ]);
  const impact = definitionChangeImpact(before, after, [{ mmr_value: 1, kolor: "#000000", rola: "Obrona" }, { rola: "Atak" }, null]);
  assert.deepEqual(impact.removedWithValues.map((item) => [item.key, item.count]), [["kolor", 1]]);
  assert.deepEqual(impact.retypedWithValues.map((item) => [item.key, item.count]), [["mmr_value", 1]]);
  assert.deepEqual(impact.invalidAfterChange.map((item) => [item.key, item.count]), [["rola", 1]]);
  assert.deepEqual(pruneValues(after, { mmr_value: 1, kolor: "#000000", rola: "Obrona" }), null, "after confirmation nothing invalid survives");
  const unaffected = definitionChangeImpact(before, set([...before.fields, { key: "nowe", label: "Nowe", type: "boolean" }]), [{ mmr_value: 1 }]);
  assert.equal(unaffected.removedWithValues.length + unaffected.retypedWithValues.length + unaffected.invalidAfterChange.length, 0);
});

test("CSV headers map to fields by key or Polish label", () => {
  const fields = set([{ key: "ulubione_zwierze", label: "Ulubione zwierzę", type: "short_text" }, { key: "mmr_value", label: "MMR", type: "number" }]);
  assert.equal(fieldForCsvHeader(fields, "Ulubione zwierzę")?.key, "ulubione_zwierze");
  assert.equal(fieldForCsvHeader(fields, "ulubione_zwierze")?.key, "ulubione_zwierze");
  assert.equal(fieldForCsvHeader(fields, "mmr")?.key, "mmr_value");
  assert.equal(fieldForCsvHeader(fields, "nieznane"), null);
  assert.equal(fieldForCsvHeader(null, "mmr"), null);
});
