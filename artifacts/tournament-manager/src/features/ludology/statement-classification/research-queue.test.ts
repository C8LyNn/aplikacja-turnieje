import assert from "node:assert/strict";
import { test } from "node:test";
import { buildResearchQueue } from "./research-queue";
import type { ResearchProjectData } from "./model";

const base = (): ResearchProjectData => ({
  schemaVersion: 7,
  people: [{ id: "p1", displayName: "P" }],
  sources: [{ id: "s1", personId: "p1", title: "S", url: "https://s", sourceType: "video" }],
  arguments: [
    { id: "a1", sourceId: "s1", title: "A1" },
    { id: "a2", sourceId: "s1", title: "A2" },
  ],
  excerpts: [
    { id: "e1", sourceId: "s1", argumentId: "a1", text: "one", verificationStatus: "verified" },
    { id: "e2", sourceId: "s1", argumentId: "a2", text: "two", verificationStatus: "verified" },
    { id: "e3", sourceId: "s1", text: "three", verificationStatus: "checked" },
  ],
  codebooks: [{ id: "book", name: "Book", version: "1", status: "pilot" }],
  propositions: [{ id: "q1", codebookId: "book", code: "Q1", label: "Q", definition: "D" }],
  coders: [{ id: "c", displayName: "Coder", type: "human" }],
  codings: [
    {
      id: "c1",
      excerptId: "e1",
      propositionId: "q1",
      coderId: "c",
      codebookId: "book",
      direction: 1,
      explicitness: 2,
      evidenceLevel: "argumentative",
      confidence: "medium",
    },
    {
      id: "c2",
      excerptId: "e2",
      propositionId: "q1",
      coderId: "c",
      codebookId: "book",
      direction: -1,
      explicitness: 2,
      evidenceLevel: "argumentative",
      confidence: "medium",
    },
  ],
  assessments: [],
    dimensionModels: [],
    dimensions: [],
    dimensionLinks: [],
    samplingPlans: [],
    discussions: [],
    discussionLinks: [],
    argumentRelations: [],
});

test("research queue surfaces verification coding contradiction and review work", () => {
  const queue = buildResearchQueue(base(), "book");

  assert.deepEqual(queue.unverifiedExcerptIds, ["e3"]);
  assert.deepEqual(queue.verifiedUncodedExcerptIds, []);
  assert.equal(queue.contradictionCandidates.length, 1);
  assert.equal(queue.unreviewedPositions.length, 1);
  assert.deepEqual(queue.samplingGaps, []);
});

test("verified excerpts without current codebook coding enter the queue", () => {
  const data = base();
  data.codings = data.codings.filter((coding) => coding.excerptId !== "e2");
  const queue = buildResearchQueue(data, "book");

  assert.deepEqual(queue.verifiedUncodedExcerptIds, ["e2"]);
});


test("research queue surfaces active sampling plan gaps", () => {
  const data = base();
  data.samplingPlans = [{
    id: "plan",
    name: "Pilot",
    version: "1",
    status: "active",
    minimumSourcesPerPerson: 2,
    minimumSourceTypesPerPerson: 1,
    minimumPurposesPerPerson: 0,
    minimumPreparednessModesPerPerson: 0,
    minimumScopesPerPerson: 0,
    minimumDatedSourceShare: null,
    maximumSingleSourceTypeShare: null,
    minimumTemporalSpanYears: null,
  }];

  const queue = buildResearchQueue(data, "book");
  assert.equal(queue.samplingGaps.length, 1);
  assert.equal(queue.samplingGaps[0]?.personId, "p1");
  assert.ok(queue.samplingGaps[0]?.codes.includes("sources"));
});
