import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildComparisonRows,
  compareDirections,
  comparisonSummary,
} from "./comparison-analysis";
import { evidenceSignature } from "./evidence-analysis";
import type { ResearchProjectData } from "./model";

function data(): ResearchProjectData {
  return {
    schemaVersion: 7,
    people: [
      { id: "p1", displayName: "A" },
      { id: "p2", displayName: "B" },
    ],
    sources: [
      { id: "s1", personId: "p1", title: "A1", url: "https://a", sourceType: "video" },
      { id: "s2", personId: "p2", title: "B1", url: "https://b", sourceType: "article" },
    ],
    arguments: [
      { id: "a1", sourceId: "s1", title: "A argument" },
      { id: "a2", sourceId: "s2", title: "B argument" },
    ],
    excerpts: [
      { id: "e1", sourceId: "s1", argumentId: "a1", text: "A", verificationStatus: "verified" },
      { id: "e2", sourceId: "s2", argumentId: "a2", text: "B", verificationStatus: "verified" },
    ],
    codebooks: [{ id: "book", name: "Book", version: "1", status: "pilot" }],
    propositions: [
      { id: "q1", codebookId: "book", code: "Q01", label: "Q1", definition: "D1" },
      { id: "q2", codebookId: "book", code: "Q02", label: "Q2", definition: "D2" },
    ],
    coders: [{ id: "c", displayName: "C", type: "human" }],
    codings: [
      {
        id: "c1",
        excerptId: "e1",
        propositionId: "q1",
        coderId: "c",
        codebookId: "book",
        direction: 2,
        explicitness: 3,
        evidenceLevel: "direct",
        confidence: "high",
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
  };
}

test("comparison marks opposite reviewed directions without collapsing to a score", () => {
  const project = data();
  const c1 = project.codings.filter((coding) => coding.id === "c1");
  const c2 = project.codings.filter((coding) => coding.id === "c2");

  project.assessments = [
    {
      id: "r1",
      personId: "p1",
      propositionId: "q1",
      codebookId: "book",
      reviewerId: "c",
      status: "stable",
      direction: 2,
      confidence: "high",
      evidenceSignature: evidenceSignature(c1),
      updatedAt: "2026-10-12T00:00:00.000Z",
    },
    {
      id: "r2",
      personId: "p2",
      propositionId: "q1",
      codebookId: "book",
      reviewerId: "c",
      status: "stable",
      direction: -1,
      confidence: "medium",
      evidenceSignature: evidenceSignature(c2),
      updatedAt: "2026-10-12T00:00:00.000Z",
    },
  ];

  const rows = buildComparisonRows(project, "book", ["p1", "p2"]);
  assert.equal(rows[0]?.relation, "opposed_direction");
  assert.equal(rows[0]?.cells[0]?.evidence.units, 1);
  assert.equal(rows[0]?.cells[1]?.evidence.sources, 1);
  assert.equal(rows[1]?.relation, "insufficient");
  assert.equal("score" in comparisonSummary(rows), false);
});

test("stale reconstruction makes proposition insufficient for comparison", () => {
  const project = data();
  project.assessments = [
    {
      id: "r1",
      personId: "p1",
      propositionId: "q1",
      codebookId: "book",
      reviewerId: "c",
      status: "stable",
      direction: 1,
      confidence: "medium",
      evidenceSignature: "old-signature",
      updatedAt: "2026-10-12T00:00:00.000Z",
    },
    {
      id: "r2",
      personId: "p2",
      propositionId: "q1",
      codebookId: "book",
      reviewerId: "c",
      status: "stable",
      direction: 1,
      confidence: "medium",
      evidenceSignature: evidenceSignature(project.codings.filter((coding) => coding.id === "c2")),
      updatedAt: "2026-10-12T00:00:00.000Z",
    },
  ];

  const row = buildComparisonRows(project, "book", ["p1", "p2"])[0];
  assert.equal(row?.cells[0]?.stale, true);
  assert.equal(row?.relation, "insufficient");
});

test("same sign with different strength stays distinct from exact agreement", () => {
  const cell = (direction: -2 | -1 | 0 | 1 | 2) => ({
    personId: String(direction),
    assessment: {
      id: String(direction),
      personId: String(direction),
      propositionId: "q",
      codebookId: "book",
      status: "stable" as const,
      direction,
      confidence: "medium" as const,
      evidenceSignature: "",
      updatedAt: "",
    },
    stale: false,
    evidence: { units: 1, codings: 1, sources: 1, contradiction: false },
  });

  assert.equal(compareDirections([cell(1), cell(2)]), "different_strength");
  assert.equal(compareDirections([cell(-2), cell(-2)]), "same_direction");
  assert.equal(compareDirections([cell(0), cell(1)]), "mixed_or_neutral");
});
