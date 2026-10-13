import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_RESEARCH_PROJECT, type CodingRecord, type ResearchProjectData } from "./model";
import { snapshotCoding, snapshotExcerpt } from "./adjudication-protocol";
import { buildAdjudicationQueue, exportAdjudicationQueueCsv, summarizeAdjudicationQueue } from "./adjudication-queue";

function coding(id: string, coderId: string, direction: CodingRecord["direction"], excerptId = "e"): CodingRecord {
  return {
    id, coderId, direction, excerptId, propositionId: "q", codebookId: "book",
    explicitness: 2, evidenceLevel: "direct", confidence: "high",
  };
}

function fixture(): ResearchProjectData {
  return {
    ...EMPTY_RESEARCH_PROJECT,
    people: [{ id: "person", displayName: "A" }],
    sources: [{ id: "src", personId: "person", title: "Video", url: "https://example.org", sourceType: "video" }],
    excerpts: [{ id: "e", sourceId: "src", text: "sample", verificationStatus: "verified" }],
    codebooks: [{ id: "book", name: "B", version: "1", status: "pilot" }],
    propositions: [{ id: "q", codebookId: "book", code: "P01", label: "P", definition: "D" }],
    coders: [
      { id: "a", displayName: "A", type: "human" },
      { id: "b", displayName: "B", type: "human" },
      { id: "c", displayName: "C", type: "human" },
    ],
    codings: [coding("ca", "a", -2), coding("cb", "b", 2)],
  };
}

function adjudication(data: ResearchProjectData, decision: "resolved" | "deferred") {
  const a = data.codings[0]!;
  const b = data.codings[1]!;
  const excerpt = data.excerpts[0]!;
  return {
    id: "review", codebookId: "book", excerptId: "e", propositionId: "q",
    codingAId: a.id, codingBId: b.id,
    codingASnapshot: snapshotCoding(a), codingBSnapshot: snapshotCoding(b),
    excerptSnapshot: snapshotExcerpt(excerpt), reviewerId: "c",
    decision, direction: decision === "deferred" ? null : 0 as const,
    rationale: "Read original context.", createdAt: "2026-10-12T12:00:00.000Z",
  };
}

test("queue identifies high-priority opposite directions and counts", () => {
  const data = fixture();
  const items = buildAdjudicationQueue(data, "book");
  assert.equal(items.length, 1);
  assert.equal(items[0]?.priority, "high");
  assert.equal(items[0]?.status, "pending");
  assert.deepEqual(summarizeAdjudicationQueue(items), {
    total: 1, pending: 1, blocked: 0, deferred: 0, resolved: 0, needs_review: 0,
  });
});

test("matching ratings are excluded; absence N/A differs from zero", () => {
  const data = fixture();
  data.codings[1]!.direction = -2;
  assert.deepEqual(buildAdjudicationQueue(data, "book"), []);
  data.codings[1]!.direction = null;
  assert.equal(buildAdjudicationQueue(data, "book")[0]?.priority, "medium");
  data.codings[0]!.direction = 0;
  assert.equal(buildAdjudicationQueue(data, "book")[0]?.status, "pending");
});

test("unverified excerpts and duplicate observations block review", () => {
  const data = fixture();
  data.excerpts[0]!.verificationStatus = "checked";
  assert.equal(buildAdjudicationQueue(data, "book")[0]?.status, "blocked");
  data.excerpts[0]!.verificationStatus = "verified";
  data.codings.push(coding("ca2", "a", -1));
  const item = buildAdjudicationQueue(data, "book")[0];
  assert.equal(item?.status, "blocked");
  assert.equal(item?.codingAId, null);
});

test("resolved, deferred and stale latest adjudications are distinguished", () => {
  const data = fixture();
  data.adjudications = [adjudication(data, "resolved")];
  assert.equal(buildAdjudicationQueue(data, "book")[0]?.status, "resolved");
  data.adjudications.push({ ...adjudication(data, "deferred"), id: "second" });
  assert.equal(buildAdjudicationQueue(data, "book")[0]?.status, "deferred");
  data.codings[1]!.confidence = "low";
  assert.equal(buildAdjudicationQueue(data, "book")[0]?.status, "needs_review");
});

test("three independent coders yield pairwise disagreements without duplicate pairs", () => {
  const data = fixture();
  data.codings.push(coding("cc", "c", 0));
  const items = buildAdjudicationQueue(data, "book");
  assert.equal(items.length, 3);
  assert.equal(new Set(items.map((item) => item.key)).size, 3);
});

test("queue does not cross codebook versions or excerpt/proposition units", () => {
  const data = fixture();
  data.codings.push({ ...coding("foreign", "c", 1), codebookId: "other" });
  data.codings.push(coding("another", "c", 0, "e2"));
  assert.equal(buildAdjudicationQueue(data, "book").length, 1);
});

test("CSV exports N/A, quotes metadata and guards spreadsheet formulas", () => {
  const data = fixture();
  data.sources[0]!.title = '=HYPERLINK("evil","x")';
  data.sources[0]!.url = "https://example.org/?q=hello,world";
  data.codings[0]!.direction = null;
  const csv = exportAdjudicationQueueCsv(data, buildAdjudicationQueue(data, "book"));
  assert.ok(csv.startsWith("\uFEFF"));
  assert.match(csv, /"'=HYPERLINK\(""evil"",""x""\)"/);
  assert.match(csv, /"N\/A"/);
  assert.match(csv, /"https:\/\/example.org\/\?q=hello,world"/);
  assert.equal(csv.trim().split("\r\n").length, 2);
});
