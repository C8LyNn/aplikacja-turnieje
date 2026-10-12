import assert from "node:assert/strict";
import { test } from "node:test";
import { discussionGraphSummary, discussionSummary, discussionTimeline } from "./discussion-analysis";
import type { ResearchProjectData } from "./model";

function data(): ResearchProjectData {
  return {
    schemaVersion: 6,
    people: [
      { id: "p1", displayName: "A" },
      { id: "p2", displayName: "B" },
    ],
    sources: [
      { id: "s1", personId: "p1", title: "Old", url: "https://old", sourceType: "video", publishedAt: "2022-01-01" },
      { id: "s2", personId: "p2", title: "New", url: "https://new", sourceType: "article", publishedAt: "2024-01-01" },
      { id: "s3", personId: "p1", title: "Undated", url: "https://undated", sourceType: "post" },
    ],
    arguments: [
      { id: "a1", sourceId: "s1", title: "Opening", timestampStart: 30 },
      { id: "a2", sourceId: "s2", title: "Response" },
      { id: "a3", sourceId: "s3", title: "Later note" },
    ],
    excerpts: [],
    codebooks: [],
    propositions: [],
    coders: [],
    codings: [],
    assessments: [],
    dimensionModels: [],
    dimensions: [],
    dimensionLinks: [],
    samplingPlans: [],
    discussions: [
      { id: "d1", title: "Debate", question: "Question?", status: "active" },
    ],
    discussionLinks: [
      { id: "l3", discussionId: "d1", argumentId: "a3", role: "follow_up" },
      { id: "l2", discussionId: "d1", argumentId: "a2", role: "response" },
      { id: "l1", discussionId: "d1", argumentId: "a1", role: "primary" },
    ],
    argumentRelations: [
      { id: "r1", discussionId: "d1", fromArgumentId: "a2", toArgumentId: "a1", relation: "challenges" },
      { id: "r2", discussionId: "d1", fromArgumentId: "a3", toArgumentId: "a2", relation: "clarifies" },
    ],
  };
}

test("discussion timeline sorts dated arguments before undated material", () => {
  const timeline = discussionTimeline(data(), "d1");
  assert.deepEqual(timeline.map((item) => item.argument.id), ["a1", "a2", "a3"]);
});

test("discussion summary counts distinct people and sources", () => {
  const summary = discussionSummary(data(), "d1");
  assert.ok(summary);
  assert.equal(summary?.arguments, 3);
  assert.equal(summary?.sources, 3);
  assert.equal(summary?.people, 2);
  assert.equal(summary?.firstPublishedAt, "2022-01-01");
  assert.equal(summary?.lastPublishedAt, "2024-01-01");
  assert.equal(summary?.undatedArguments, 1);
});

test("missing discussion returns no summary", () => {
  assert.equal(discussionSummary(data(), "missing"), null);
});


test("discussion graph summary reports connectivity without judging argument quality", () => {
  const summary = discussionGraphSummary(data(), "d1");
  assert.equal(summary.nodes, 3);
  assert.equal(summary.edges, 2);
  assert.equal(summary.connectedNodes, 3);
  assert.equal(summary.isolatedNodes, 0);
  assert.equal(summary.relationCounts.challenges, 1);
  assert.equal(summary.relationCounts.clarifies, 1);
  assert.equal(summary.relationCounts.supports, 0);
});
