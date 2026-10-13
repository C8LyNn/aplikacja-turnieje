import assert from "node:assert/strict";
import { test } from "node:test";
import { computeCoderAgreementPairs } from "./coder-agreement";
import type { Coder, CodingRecord } from "./model";

const coders: Coder[] = [
  { id: "a", displayName: "A", type: "human" },
  { id: "b", displayName: "B", type: "human" },
];

const coding = (
  id: string,
  coderId: string,
  excerptId: string,
  propositionId: string,
  direction: CodingRecord["direction"],
  codebookId = "book",
): CodingRecord => ({
  id,
  coderId,
  excerptId,
  propositionId,
  codebookId,
  direction,
  explicitness: 2,
  evidenceLevel: "argumentative",
  confidence: "medium",
});

test("agreement compares only the same excerpt and proposition", () => {
  const result = computeCoderAgreementPairs([
    coding("1", "a", "e1", "q1", 1),
    coding("2", "b", "e1", "q1", 1),
    coding("3", "a", "e2", "q1", -1),
    coding("4", "b", "e2", "q1", 1),
    coding("5", "b", "e3", "q1", 1),
  ], coders, "book");

  assert.equal(result.length, 1);
  assert.equal(result[0]?.overlap, 2);
  assert.equal(result[0]?.exactDirectionMatches, 1);
  assert.equal(result[0]?.exactDirectionAgreement, 0.5);
});

test("agreement remains null when coders have no overlapping units", () => {
  const result = computeCoderAgreementPairs([
    coding("1", "a", "e1", "q1", 1),
    coding("2", "b", "e2", "q1", 1),
  ], coders, "book");

  assert.equal(result[0]?.overlap, 0);
  assert.equal(result[0]?.exactDirectionAgreement, null);
});

test("agreement is scoped to a codebook version", () => {
  const result = computeCoderAgreementPairs([
    coding("1", "a", "e1", "q1", 1, "old"),
    coding("2", "b", "e1", "q1", 1, "old"),
    coding("3", "a", "e1", "q1", -1, "book"),
    coding("4", "b", "e1", "q1", 1, "book"),
  ], coders, "book");

  assert.equal(result[0]?.overlap, 1);
  assert.equal(result[0]?.exactDirectionAgreement, 0);
});


test("weighted kappa is one for perfect ordinal agreement with variation", () => {
  const result = computeCoderAgreementPairs([
    coding("1", "a", "e1", "q1", -2),
    coding("2", "b", "e1", "q1", -2),
    coding("3", "a", "e2", "q1", 2),
    coding("4", "b", "e2", "q1", 2),
  ], coders, "book");
  assert.equal(result[0]?.ratedOverlap, 2);
  assert.equal(result[0]?.ratedExactAgreement, 1);
  assert.equal(result[0]?.linearWeightedKappa, 1);
});

test("weighted kappa captures complete ordinal inversion", () => {
  const result = computeCoderAgreementPairs([
    coding("1", "a", "e1", "q1", -2),
    coding("2", "b", "e1", "q1", 2),
    coding("3", "a", "e2", "q1", 2),
    coding("4", "b", "e2", "q1", -2),
  ], coders, "book");
  assert.equal(result[0]?.linearWeightedKappa, -1);
  assert.equal(result[0]?.disagreements.length, 2);
});

test("N/A is not confused with neutral zero in ordinal reliability", () => {
  const result = computeCoderAgreementPairs([
    coding("1", "a", "e1", "q1", null),
    coding("2", "b", "e1", "q1", null),
    coding("3", "a", "e2", "q1", null),
    coding("4", "b", "e2", "q1", 0),
    coding("5", "a", "e3", "q1", 0),
    coding("6", "b", "e3", "q1", 0),
    coding("7", "a", "e4", "q1", -2),
    coding("8", "b", "e4", "q1", 2),
  ], coders, "book");
  const pair = result[0];
  assert.equal(pair?.overlap, 4);
  assert.equal(pair?.exactDirectionAgreement, 0.5);
  assert.equal(pair?.bothNotApplicable, 1);
  assert.equal(pair?.missingVsScored, 1);
  assert.equal(pair?.ratedOverlap, 2);
  assert.equal(pair?.ratedExactAgreement, 0.5);
  assert.deepEqual(pair?.disagreements.map((entry) => entry.kind), ["missing_vs_scored", "direction"]);
});

test("undefined kappa is not reported as perfect with no ordinal variance", () => {
  const result = computeCoderAgreementPairs([
    coding("1", "a", "e1", "q1", 0),
    coding("2", "b", "e1", "q1", 0),
    coding("3", "a", "e2", "q1", 0),
    coding("4", "b", "e2", "q1", 0),
  ], coders, "book");
  assert.equal(result[0]?.linearWeightedKappa, null);
  assert.equal(result[0]?.ratedExactAgreement, 1);
});

test("ambiguous duplicate coder records are excluded rather than overwritten", () => {
  const result = computeCoderAgreementPairs([
    coding("1", "a", "e1", "q1", 1),
    coding("2", "a", "e1", "q1", -1),
    coding("3", "b", "e1", "q1", 1),
  ], coders, "book");
  assert.equal(result[0]?.overlap, 0);
  assert.equal(result[0]?.duplicateUnitsExcluded, 1);
  assert.equal(result[0]?.exactDirectionAgreement, null);
  assert.equal(result[0]?.coderAUnits, 1);
});

test("structured unit keys do not collide when identifiers contain separators", () => {
  const result = computeCoderAgreementPairs([
    coding("1", "a", "e::q", "p", 1),
    coding("2", "b", "e", "q::p", 1),
  ], coders, "book");
  assert.equal(result[0]?.overlap, 0);
});
