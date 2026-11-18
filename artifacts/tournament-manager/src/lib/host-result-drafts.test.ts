import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { DRAFT_MAX_AGE_MS, readHostResultDrafts, sameSavedResult, saveFailureKind, writeHostResultDrafts } from "./host-result-drafts";

afterEach(() => window.sessionStorage.clear());

test("drafts are kept per tournament in this tab and cleared when empty", () => {
  writeHostResultDrafts(7, { 11: { s1: 2, s2: 1, baseline: "[1,2]", at: Date.now() } });
  assert.deepEqual(Object.keys(readHostResultDrafts(7)), ["11"]);
  assert.deepEqual(readHostResultDrafts(8), {});
  writeHostResultDrafts(7, {});
  assert.equal(window.sessionStorage.getItem("tm_host_score_drafts_v1:7"), null);
});

test("damaged, impossible or old drafts are not restored", () => {
  const now = Date.now();
  window.sessionStorage.setItem("tm_host_score_drafts_v1:7", JSON.stringify({
    1: { s1: 1, s2: 0, at: now },
    2: { s1: -1, s2: 0 },
    3: { s1: "2", s2: 0 },
    4: { s1: 1, s2: 1, at: now - DRAFT_MAX_AGE_MS - 1 },
    x: { s1: 1, s2: 1 },
  }));
  assert.deepEqual(Object.keys(readHostResultDrafts(7, now)), ["1"]);
  window.sessionStorage.setItem("tm_host_score_drafts_v1:7", "{not json");
  assert.deepEqual(readHostResultDrafts(7), {});
});

test("a retry is recognised only when exactly that result is stored", () => {
  const stored = { status: "completed", resultType: "played", score1: 2, score2: 0, winnerId: 5 };
  assert.equal(sameSavedResult(stored, { resultType: "played", score1: 2, score2: 0 }), true);
  assert.equal(sameSavedResult(stored, { resultType: "played", score1: 2, score2: 1 }), false);
  assert.equal(sameSavedResult({ ...stored, status: "pending" }, { resultType: "played", score1: 2, score2: 0 }), false);
  assert.equal(sameSavedResult({ ...stored, resultType: "walkover" }, { resultType: "walkover", winnerId: 5 }), true);
  assert.equal(sameSavedResult({ ...stored, resultType: "walkover" }, { resultType: "walkover", winnerId: 6 }), false);
});

test("save failures are classified for the message", () => {
  assert.equal(saveFailureKind({ status: 401 }), "session");
  assert.equal(saveFailureKind({ status: 403 }), "session");
  assert.equal(saveFailureKind({ status: 409 }), "conflict");
  assert.equal(saveFailureKind({ status: 422 }), "rejected");
  assert.equal(saveFailureKind({ status: 502 }), "network");
  assert.equal(saveFailureKind(new TypeError("fetch failed")), "network");
});
