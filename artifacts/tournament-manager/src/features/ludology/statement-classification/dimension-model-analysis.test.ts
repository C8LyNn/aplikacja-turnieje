import assert from "node:assert/strict";
import { test } from "node:test";
import {
  modelReadinessMatrix,
  orientedAssessmentDirection,
  personDimensionReadiness,
} from "./dimension-model-analysis";
import type { ResearchProjectData } from "./model";

const data = (): ResearchProjectData => ({
  schemaVersion: 4,
  people: [{ id: "p1", displayName: "P" }],
  sources: [{ id: "s1", personId: "p1", title: "S", url: "https://s", sourceType: "video" }],
  arguments: [],
  excerpts: [{ id: "e1", sourceId: "s1", text: "x", verificationStatus: "verified" }],
  codebooks: [{ id: "book", name: "Book", version: "1", status: "pilot" }],
  propositions: [
    { id: "q1", codebookId: "book", code: "Q1", label: "Q1", definition: "D1" },
    { id: "q2", codebookId: "book", code: "Q2", label: "Q2", definition: "D2" },
  ],
  coders: [{ id: "c", displayName: "C", type: "human" }],
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
  ],
  assessments: [
    {
      id: "a1",
      personId: "p1",
      propositionId: "q1",
      codebookId: "book",
      reviewerId: "c",
      status: "stable",
      direction: 1,
      confidence: "medium",
      evidenceSignature: "c1:1:2:argumentative:medium",
      updatedAt: "2026-10-11T00:00:00.000Z",
    },
  ],
  dimensionModels: [
    { id: "m1", name: "Model", version: "0.1", codebookId: "book", status: "draft" },
  ],
  dimensions: [
    { id: "d1", dimensionModelId: "m1", code: "D1", label: "Dim", negativePoleLabel: "A", positivePoleLabel: "B" },
  ],
  dimensionLinks: [
    { id: "l1", dimensionModelId: "m1", dimensionId: "d1", propositionId: "q1", orientation: "positive", relevance: "core" },
    { id: "l2", dimensionModelId: "m1", dimensionId: "d1", propositionId: "q2", orientation: "negative", relevance: "supporting" },
  ],
});

test("orientation flips reconstructed direction without changing the assessment", () => {
  assert.equal(orientedAssessmentDirection({ direction: 2 }, { orientation: "positive" }), 2);
  assert.equal(orientedAssessmentDirection({ direction: 2 }, { orientation: "negative" }), -2);
  assert.equal(orientedAssessmentDirection({ direction: null }, { orientation: "negative" }), null);
});

test("readiness counts linked propositions without producing an aggregate coordinate", () => {
  const readiness = personDimensionReadiness(data(), "m1", "p1");
  assert.equal(readiness.totalLinks, 2);
  assert.equal(readiness.reviewedLinks, 1);
  assert.equal(readiness.directionalLinks, 1);
  assert.equal(readiness.dimensions[0]?.totalLinks, 2);
});

test("model readiness matrix preserves one row per person", () => {
  const project = data();
  project.people.push({ id: "p2", displayName: "P2" });
  const matrix = modelReadinessMatrix(project, "m1");
  assert.deepEqual(matrix.map((row) => row.personId), ["p1", "p2"]);
});
