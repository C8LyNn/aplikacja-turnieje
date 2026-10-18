import {test} from "node:test";
import assert from "node:assert/strict";
import { firstFailureEvidence, redactEvidence } from "./failure-evidence.mjs";
test("extract first failing TAP even after many passing tests", () => {
  const output = "TAP version 13\nok 1 - good\nnot ok 2 - actual failing case\n# tests 2\n# pass 1\n# fail 1\n";
  assert.equal(firstFailureEvidence(output, "").firstFailingTap, "not ok 2 - actual failing case");
});
test("nested failing TAP", () => assert.equal(firstFailureEvidence("    not ok 6 - nested\n", "").firstFailingTap, "not ok 6 - nested"));
test("passing TAP is not invented as a failure", () => assert.equal(firstFailureEvidence("TAP version 13\nok 1 - passed\n# fail 0\n", "").firstFailingTap, null));
test("output without TAP stays unknown", () => assert.equal(firstFailureEvidence("partial TAP:", "").firstFailingTap, null));
test("redact URLs, bearer tokens and key values", () => {
  const value = redactEvidence("not ok 5 - postgresql://user:secret@prod/base Bearer abcdef TOKEN:banana");
  assert.ok(!value.includes("secret@"));
  assert.ok(!value.includes("abcdef"));
  assert.ok(!value.includes("banana"));
});
test("bound output", () => assert.equal(redactEvidence("x".repeat(1000)).length, 400));
test("counter preservation", () => assert.equal(firstFailureEvidence("# tests 3\n# pass 2\n# fail 1\n","").summary.fail, 1));
test("diagnostic extraction", () => assert.equal(firstFailureEvidence("not ok 1 - failed\n  error: assertion failed\n","").firstDiagnostic,"error: assertion failed"));
