import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CORRECTION_INTENT_LIFETIME_MS, correctionIntentFingerprint,
  correctionIntentReadStatus, correctionIntentReceipt, parseCorrectionIntentInput,
  type CorrectionIntentInput,
} from "../src/application/operations/tournament-correction-intent";

const valid = (): CorrectionIntentInput => ({
  operationId: "47e46cb7-8b35-4b13-bcf2-bfd204afe051",
  matchId: 100, expectedRevision: 5, expectedCompletionActionId: 40,
  expectedStageVersionVector: "a".repeat(64), proposedScore1: 1, proposedScore2: 2,
  approvedByOrganizer: true, understandsRequiresResubmission: true,
});
const approvedAt = new Date("2026-10-11T18:00:00.000Z");
const expiresAt = new Date(approvedAt.getTime() + CORRECTION_INTENT_LIFETIME_MS);
const approval = () => ({
  id: valid().operationId, matchId: 100,
  status: "approved" as const, expiresAt, approvedAt,
  completedAt: null, revertActionId: null, revertedMatchRevision: null,
});

test("parses a complete, explicitly approved request", () => assert.deepEqual(parseCorrectionIntentInput(valid()), valid()));
test("normalizes UUID to lowercase", () => {
  const request = { ...valid(), operationId: valid().operationId.toUpperCase() };
  assert.equal(parseCorrectionIntentInput(request)?.operationId, valid().operationId);
});
test("rejects unknown/non-object input", () => {
  for (const bad of [undefined, null, "x", 3, [], [valid()]]) assert.equal(parseCorrectionIntentInput(bad), null);
});
const invalid: Array<[string, Record<string, unknown>]> = [
  ["missing uuid", { operationId: undefined }],
  ["v1 uuid", { operationId: "47e46cb7-8b35-1b13-bcf2-bfd204afe051" }],
  ["unsafe uuid", { operationId: "../../etc/passwd" }],
  ["missing match", { matchId: null }],
  ["fractional match", { matchId: 1.5 }],
  ["negative match", { matchId: -1 }],
  ["zero revision", { expectedRevision: 0 }],
  ["nonpositive action", { expectedCompletionActionId: 0 }],
  ["missing stage fingerprint", { expectedStageVersionVector: "" }],
  ["too long stage fingerprint", { expectedStageVersionVector: "a".repeat(80001) }],
  ["negative result", { proposedScore2: -1 }],
  ["fractional score", { proposedScore1: 1.7 }],
  ["non numeric score", { proposedScore1: "1" }],
  ["missing approval", { approvedByOrganizer: false }],
  ["missing resubmission confirmation", { understandsRequiresResubmission: false }],
];
for (const [label, change] of invalid) {
  test(`rejects ${label}`, () => assert.equal(parseCorrectionIntentInput({ ...valid(), ...change }), null));
}
test("fingerprint stable for retries", () => assert.equal(correctionIntentFingerprint(1, valid()), correctionIntentFingerprint(1, valid())));
test("fingerprint isolates tournament", () => assert.notEqual(correctionIntentFingerprint(1, valid()), correctionIntentFingerprint(2, valid())));
test("fingerprint changes with different proposed result", () => assert.notEqual(correctionIntentFingerprint(1, valid()), correctionIntentFingerprint(1, { ...valid(), proposedScore1: 2 })));
test("fingerprint changes with expected action", () => assert.notEqual(correctionIntentFingerprint(1, valid()), correctionIntentFingerprint(1, { ...valid(), expectedCompletionActionId: 41 })));
test("fingerprint changes with match version", () => assert.notEqual(correctionIntentFingerprint(1, valid()), correctionIntentFingerprint(1, { ...valid(), expectedRevision: 6 })));
test("fingerprint changes with stage vector", () => assert.notEqual(correctionIntentFingerprint(1, valid()), correctionIntentFingerprint(1, { ...valid(), expectedStageVersionVector: "b".repeat(64) })));
test("fingerprint is SHA256", () => assert.match(correctionIntentFingerprint(1, valid()), /^[a-f0-9]{64}$/));
test("approval remains live before expiry", () => assert.equal(correctionIntentReadStatus("approved", expiresAt, new Date(expiresAt.getTime() - 1)), "approved"));
test("approval expires at exact boundary", () => assert.equal(correctionIntentReadStatus("approved", expiresAt, expiresAt), "expired"));
test("completed operation never expires", () => assert.equal(correctionIntentReadStatus("reverted_requires_resubmission", expiresAt, new Date(expiresAt.getTime() + 600000)), "reverted_requires_resubmission"));
test("fresh receipt has no mutation", () => {
  const receipt = correctionIntentReceipt(approval(), approvedAt);
  assert.equal(receipt.mutationPerformed, false);
  assert.equal(receipt.revertActionId, null);
  assert.equal(receipt.status, "approved");
});
test("expired receipt is still readable and remains non-mutating", () => {
  const receipt = correctionIntentReceipt(approval(), expiresAt);
  assert.equal(receipt.status, "expired");
  assert.equal(receipt.mutationPerformed, false);
});
test("completed receipt can be recovered after network loss", () => {
  const receipt = correctionIntentReceipt({ ...approval(), status: "reverted_requires_resubmission", revertActionId: 128,
    completedAt: new Date("2026-10-11T18:03:00.000Z"), revertedMatchRevision: 6 }, new Date("2026-10-12T18:00:00.000Z"));
  assert.equal(receipt.status, "reverted_requires_resubmission");
  assert.equal(receipt.mutationPerformed, true);
  assert.equal(receipt.revertActionId, 128);
  assert.equal(receipt.matchRevision, 6);
  assert.equal(receipt.completedAt, "2026-10-11T18:03:00.000Z");
});
