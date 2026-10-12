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
