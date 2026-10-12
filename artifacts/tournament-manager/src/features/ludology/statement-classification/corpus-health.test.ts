import assert from "node:assert/strict";
import { test } from "node:test";
import {
  activeSamplingPlan,
  buildCorpusHealthMatrix,
  buildPersonCorpusHealth,
  corpusHealthTotals,
} from "./corpus-health";
import { evidenceSignature } from "./evidence-analysis";
import type { ResearchProjectData } from "./model";

function project(): ResearchProjectData {
  return {
    schemaVersion: 8,
    people: [{ id: "p1", displayName: "P1" }, { id: "p2", displayName: "P2" }],
    sources: [
      {
        id: "s1",
        personId: "p1",
        title: "One",
        url: "https://one",
        sourceType: "video",
        publishedAt: "2022-01-01",
        purpose: "review",
        preparedness: "prepared",
        scope: "specific_game",
        language: "pl",
      },
      {
        id: "s2",
        personId: "p1",
        title: "Two",
        url: "https://two",
        sourceType: "article",
        publishedAt: "2025-01-01",
        purpose: "essay",
        preparedness: "semi_prepared",
        scope: "games_general",
        language: "pl",
      },
    ],
    arguments: [{ id: "a1", sourceId: "s1", title: "Argument" }],
    excerpts: [
      { id: "e1", sourceId: "s1", argumentId: "a1", text: "yes", verificationStatus: "verified" },
      { id: "e2", sourceId: "s1", argumentId: "a1", text: "also yes", verificationStatus: "verified" },
      { id: "e3", sourceId: "s2", text: "no", verificationStatus: "checked" },
    ],
    codebooks: [{ id: "book", name: "B", version: "1", status: "pilot" }],
    propositions: [
      { id: "q1", codebookId: "book", code: "Q1", label: "Q1", definition: "D1" },
      { id: "q2", codebookId: "book", code: "Q2", label: "Q2", definition: "D2" },
      { id: "q3", codebookId: "book", code: "Q3", label: "Q3", definition: "D3" },
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
      {
        id: "c2",
        excerptId: "e2",
        propositionId: "q1",
        coderId: "c",
        codebookId: "book",
        direction: 2,
        explicitness: 3,
        evidenceLevel: "direct",
        confidence: "high",
      },
      {
        id: "c3",
        excerptId: "e3",
        propositionId: "q1",
        coderId: "c",
        codebookId: "book",
        direction: -1,
        explicitness: 2,
        evidenceLevel: "argumentative",
        confidence: "medium",
      },
    ],
    adjudications: [],
    assessments: [],
    dimensionModels: [],
    dimensions: [],
    dimensionLinks: [],
    samplingPlans: [
      {
        id: "plan",
        name: "Pilot",
        version: "1",
        status: "active",
        minimumSourcesPerPerson: 3,
        minimumSourceTypesPerPerson: 2,
        minimumPurposesPerPerson: 2,
        minimumPreparednessModesPerPerson: 2,
        minimumScopesPerPerson: 2,
        minimumDatedSourceShare: 0.75,
        maximumSingleSourceTypeShare: 0.75,
        minimumTemporalSpanYears: 2,
      },
    ],
    discussions: [],
    discussionLinks: [],
    argumentRelations: [],
  };
}

test("corpus health counts independent evidence units by argument instead of excerpt", () => {
  const data = project();
  const health = buildPersonCorpusHealth(data, "p1", "book", data.samplingPlans[0]);
  assert.equal(health.codingCount, 3);
  assert.equal(health.independentEvidenceUnitCount, 2);
  assert.equal(health.propositionCoverageCount, 1);
  assert.equal(health.contradictionCount, 1);
});

test("corpus health surfaces sampling and methodological gaps without one composite score", () => {
  const data = project();
  const health = buildPersonCorpusHealth(data, "p1", "book", data.samplingPlans[0]);

  assert.equal(health.sourceCount, 2);
  assert.equal(health.verificationShare, 2 / 3);
  assert.equal(health.argumentAssignmentShare, 2 / 3);
  assert.ok(health.samplingGaps.some((gap) => gap.code === "sources"));
  assert.ok(health.flags.some((flag) => flag.code === "low_codebook_coverage"));
  assert.ok(health.flags.some((flag) => flag.code === "contradictions"));
  assert.equal("score" in health, false);
});

test("stale assessments are blockers", () => {
  const data = project();
  const currentEvidence = data.codings.filter((coding) => coding.propositionId === "q1");
  data.assessments = [{
    id: "assessment",
    personId: "p1",
    propositionId: "q1",
    codebookId: "book",
    reviewerId: "c",
    status: "stable",
    direction: 1,
    confidence: "medium",
    evidenceSignature: evidenceSignature(currentEvidence.slice(0, 1)),
    updatedAt: "2026-10-12T00:00:00.000Z",
  }];

  const health = buildPersonCorpusHealth(data, "p1", "book", data.samplingPlans[0]);
  assert.equal(health.staleAssessmentCount, 1);
  assert.ok(health.flags.some((flag) => flag.code === "stale_assessments" && flag.severity === "blocker"));
});

test("matrix preserves one row per person and totals aggregate flags", () => {
  const data = project();
  const rows = buildCorpusHealthMatrix(data, "book", data.samplingPlans[0]);
  const totals = corpusHealthTotals(rows);

  assert.deepEqual(rows.map((row) => row.personId), ["p1", "p2"]);
  assert.equal(totals.people, 2);
  assert.ok(totals.blockerFlags > 0);
  assert.ok(totals.samplingGaps > 0);
});

test("active sampling plan wins over draft plans", () => {
  const data = project();
  data.samplingPlans.unshift({ ...data.samplingPlans[0]!, id: "draft", status: "draft" });
  assert.equal(activeSamplingPlan(data)?.id, "plan");
});
