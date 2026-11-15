import assert from "node:assert/strict";
import { test } from "node:test";
import { configurationErrorFeedback, configurationProblemMessage } from "./stage-configuration-feedback.ts";

const problem = { code: "STAGE_BASKET_ROUTE_CYCLE", message: "Cykl między koszykami.", context: { stageId: 4 } };

test("L50: preserves valid structured problem and stage context", () => {
  const result = configurationErrorFeedback({ status: 422, data: { code: "STAGE_BASKET_CONFIGURATION_INVALID", problems: [problem] } });
  assert.deepEqual(result.problems, [problem]);
  assert.match(configurationProblemMessage(result.problems[0], { stages: [{ id: 4, name: "Finał" }] }), /Finał:.*Konfiguracja połączeń tworzy cykl/);
});

test("L50: rejects a string used as the problems list", () => {
  const result = configurationErrorFeedback({ status: 422, data: { code: "STAGE_BASKET_CONFIGURATION_INVALID", problems: "not-an-array" } });
  assert.deepEqual(result.problems, []);
  assert.equal(typeof result.message, "string");
});

test("L50: rejects an object used as the problems list, without throwing", () => {
  const result = configurationErrorFeedback({ status: 400, data: { problems: { 0: problem } } });
  assert.deepEqual(result.problems, []);
});

test("L50: rejects null, strings and incomplete records inside a problem list", () => {
  const result = configurationErrorFeedback({ status: 400, data: { problems: [null, "x", {}, { code: "X" }, { code: 4, message: "bad" }, problem] } });
  assert.deepEqual(result.problems, [problem]);
});

test("L50: falls back to valid detail list if the primary problems field is malformed", () => {
  const result = configurationErrorFeedback({ status: 400, data: { problems: 55, details: [problem] } });
  assert.deepEqual(result.problems, [problem]);
});

test("L50: handles nested details.problems arrays", () => {
  const result = configurationErrorFeedback({ status: 422, data: { details: { problems: [problem] } } });
  assert.deepEqual(result.problems, [problem]);
});

test("L50: a malformed nested list retains a simple diagnostic fallback", () => {
  const result = configurationErrorFeedback({ status: 400, data: { code: "CUSTOM_PROBLEM", details: { problems: { broken: true }, stageId: 3 } } });
  assert.equal(result.problems.length, 1);
  assert.equal(result.problems[0].code, "CUSTOM_PROBLEM");
});

test("L50: preserves useful details from the documented single-problem shape", () => {
  const result = configurationErrorFeedback({ status: 422, data: { code: "STAGE_PARTICIPANTS_INCONSISTENT", error: "Różnica liczby graczy", details: { stageId: 3, expected: 8, actual: 7 } } });
  assert.equal(result.message, "Różnica liczby graczy");
  assert.equal(result.problems[0].context?.stageId, 3);
  assert.match(configurationProblemMessage(result.problems[0]), /Oczekiwana liczba uczestników: 8/);
});

test("L50: unknown prototype property names never become messages or functions", () => {
  const top = configurationErrorFeedback({ status: 409, data: { code: "toString" } });
  assert.equal(top.message, "toString");
  assert.equal(typeof top.message, "string");
  assert.match(configurationProblemMessage({ code: "constructor", message: "Właściwa wiadomość" }), /Właściwa wiadomość/);
});

test("L50: malformed server error messages never escape as objects", () => {
  const result = configurationErrorFeedback({ status: 400, data: { code: "STAGE_BASKET_CONFIGURATION_INVALID", error: { detail: "x" }, message: ["x"] } });
  assert.equal(typeof result.message, "string");
  assert.equal(result.message, "Konfiguracja koszyków zawiera błędy. Sprawdź szczegóły poniżej.");
});

test("L50: preserves intentional empty problems list, rather than inventing details", () => {
  const result = configurationErrorFeedback({ status: 400, data: { problems: [], details: [problem] } });
  assert.deepEqual(result.problems, []);
});

test("L50: retains the existing network and 5xx fallback policy", () => {
  for (const value of [null, new Error("offline"), { status: 503, data: { error: "unsafe" } }]) {
    const result = configurationErrorFeedback(value);
    assert.deepEqual(result.problems, []);
    assert.match(result.message, /Nie udało się połączyć z serwerem/);
  }
});
