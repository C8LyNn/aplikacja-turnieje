import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_RESEARCH_PROJECT } from "./model";
import { checkResearchProjectIntegrity } from "./integrity";

test("valid empty project has no integrity issues", () => {
  assert.deepEqual(checkResearchProjectIntegrity(EMPTY_RESEARCH_PROJECT), []);
});

test("integrity detects orphaned and mismatched research references", () => {
  const data = {
    ...EMPTY_RESEARCH_PROJECT,
    people: [{ id: "p1", displayName: "P" }],
    sources: [{ id: "s1", personId: "p1", title: "S", url: "https://s", sourceType: "video" as const }],
    arguments: [{ id: "a1", sourceId: "s1", title: "A" }],
    excerpts: [
      { id: "e1", sourceId: "missing", argumentId: "a1", text: "x", timestampStart: 5, timestampEnd: 2 },
    ],
    codebooks: [{ id: "book", name: "Book", version: "1", status: "pilot" as const }],
    propositions: [{ id: "q1", codebookId: "book", code: "Q1", label: "Q", definition: "D" }],
    coders: [{ id: "coder", displayName: "C", type: "human" as const }],
    codings: [{
      id: "c1",
      excerptId: "e1",
      propositionId: "q1",
      coderId: "coder",
      codebookId: "book",
      direction: 1 as const,
      explicitness: 2 as const,
      evidenceLevel: "argumentative" as const,
      confidence: "medium" as const,
    }],
  };

  const codes = checkResearchProjectIntegrity(data).map((issue) => issue.code);
  assert.ok(codes.includes("orphan_excerpt_source"));
  assert.ok(codes.includes("argument_source_mismatch"));
  assert.ok(codes.includes("invalid_timestamp_range"));
});

test("integrity detects duplicate coding units", () => {
  const baseCoding = {
    excerptId: "e1",
    propositionId: "q1",
    coderId: "coder",
    codebookId: "book",
    direction: 1 as const,
    explicitness: 2 as const,
    evidenceLevel: "argumentative" as const,
    confidence: "medium" as const,
  };
  const data = {
    ...EMPTY_RESEARCH_PROJECT,
    people: [{ id: "p1", displayName: "P" }],
    sources: [{ id: "s1", personId: "p1", title: "S", url: "https://s", sourceType: "video" as const }],
    excerpts: [{ id: "e1", sourceId: "s1", text: "x" }],
    codebooks: [{ id: "book", name: "Book", version: "1", status: "pilot" as const }],
    propositions: [{ id: "q1", codebookId: "book", code: "Q1", label: "Q", definition: "D" }],
    coders: [{ id: "coder", displayName: "C", type: "human" as const }],
    codings: [{ id: "c1", ...baseCoding }, { id: "c2", ...baseCoding }],
  };

  assert.ok(checkResearchProjectIntegrity(data).some((issue) => issue.code === "duplicate_coding"));
});


test("integrity validates position assessment references and uniqueness", () => {
  const data = {
    ...EMPTY_RESEARCH_PROJECT,
    people: [{ id: "p1", displayName: "P" }],
    codebooks: [{ id: "book", name: "Book", version: "1", status: "pilot" as const }],
    propositions: [{ id: "q1", codebookId: "book", code: "Q1", label: "Q", definition: "D" }],
    coders: [{ id: "reviewer", displayName: "R", type: "human" as const }],
    assessments: [
      {
        id: "a1",
        personId: "p1",
        propositionId: "q1",
        codebookId: "book",
        reviewerId: "reviewer",
        status: "stable" as const,
        direction: 1 as const,
        confidence: "medium" as const,
        updatedAt: "2026-10-11T00:00:00.000Z",
      },
      {
        id: "a2",
        personId: "p1",
        propositionId: "q1",
        codebookId: "book",
        reviewerId: "reviewer",
        status: "contradictory" as const,
        direction: null,
        confidence: "low" as const,
        updatedAt: "2026-10-11T00:00:00.000Z",
      },
    ],
  };

  const issues = checkResearchProjectIntegrity(data);
  assert.ok(issues.some((issue) => issue.code === "duplicate_assessment"));
});


test("integrity validates dimension model mappings", () => {
  const data = {
    ...EMPTY_RESEARCH_PROJECT,
    codebooks: [{ id: "book", name: "Book", version: "1", status: "pilot" as const }],
    propositions: [{ id: "q1", codebookId: "book", code: "Q1", label: "Q", definition: "D" }],
    dimensionModels: [{ id: "m1", name: "M", version: "0.1", codebookId: "book", status: "draft" as const }],
    dimensions: [{ id: "d1", dimensionModelId: "m1", code: "D1", label: "Dim", negativePoleLabel: "A", positivePoleLabel: "B" }],
    dimensionLinks: [
      { id: "l1", dimensionModelId: "m1", dimensionId: "d1", propositionId: "q1", orientation: "positive" as const, relevance: "core" as const },
      { id: "l2", dimensionModelId: "m1", dimensionId: "d1", propositionId: "q1", orientation: "negative" as const, relevance: "supporting" as const },
    ],
  };

  const codes = checkResearchProjectIntegrity(data).map((issue) => issue.code);
  assert.ok(codes.includes("duplicate_dimension_link"));
});

test("integrity detects dimension links crossing codebook versions", () => {
  const data = {
    ...EMPTY_RESEARCH_PROJECT,
    codebooks: [
      { id: "book-a", name: "A", version: "1", status: "pilot" as const },
      { id: "book-b", name: "B", version: "1", status: "pilot" as const },
    ],
    propositions: [{ id: "q1", codebookId: "book-b", code: "Q1", label: "Q", definition: "D" }],
    dimensionModels: [{ id: "m1", name: "M", version: "0.1", codebookId: "book-a", status: "draft" as const }],
    dimensions: [{ id: "d1", dimensionModelId: "m1", code: "D1", label: "Dim", negativePoleLabel: "A", positivePoleLabel: "B" }],
    dimensionLinks: [
      { id: "l1", dimensionModelId: "m1", dimensionId: "d1", propositionId: "q1", orientation: "positive" as const, relevance: "core" as const },
    ],
  };

  assert.ok(checkResearchProjectIntegrity(data).some((issue) => issue.code === "dimension_link_codebook_mismatch"));
});


test("integrity rejects invalid sampling plan thresholds", () => {
  const data = {
    ...EMPTY_RESEARCH_PROJECT,
    samplingPlans: [{
      id: "plan",
      name: "Bad",
      version: "1",
      status: "draft" as const,
      minimumSourcesPerPerson: -1,
      minimumSourceTypesPerPerson: 2,
      minimumPurposesPerPerson: 2,
      minimumPreparednessModesPerPerson: 1,
      minimumScopesPerPerson: 1,
      minimumDatedSourceShare: 1.2,
      maximumSingleSourceTypeShare: 0.8,
      minimumTemporalSpanYears: 1,
    }],
  };

  assert.ok(checkResearchProjectIntegrity(data).some((issue) => issue.code === "invalid_sampling_plan"));
});


test("integrity validates debate links and duplicate mappings", () => {
  const data = {
    ...EMPTY_RESEARCH_PROJECT,
    people: [{ id: "p1", displayName: "P" }],
    sources: [{ id: "s1", personId: "p1", title: "S", url: "https://s", sourceType: "video" as const }],
    arguments: [{ id: "a1", sourceId: "s1", title: "A" }],
    discussions: [{ id: "d1", title: "D", status: "draft" as const }],
    discussionLinks: [
      { id: "l1", discussionId: "d1", argumentId: "a1", role: "primary" as const },
      { id: "l2", discussionId: "d1", argumentId: "a1", role: "response" as const },
    ],
  };

  const codes = checkResearchProjectIntegrity(data).map((issue) => issue.code);
  assert.ok(codes.includes("duplicate_discussion_link"));
});

test("integrity detects orphan debate references", () => {
  const data = {
    ...EMPTY_RESEARCH_PROJECT,
    discussions: [{ id: "d1", title: "D", status: "draft" as const }],
    discussionLinks: [
      { id: "l1", discussionId: "missing", argumentId: "missing", role: "primary" as const },
    ],
  };

  const codes = checkResearchProjectIntegrity(data).map((issue) => issue.code);
  assert.ok(codes.includes("orphan_discussion_link_discussion"));
  assert.ok(codes.includes("orphan_discussion_link_argument"));
});
