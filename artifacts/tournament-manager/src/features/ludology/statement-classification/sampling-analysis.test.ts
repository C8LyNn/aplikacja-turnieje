import assert from "node:assert/strict";
import { test } from "node:test";
import {
  evaluateSamplingPlan,
  personSamplingProfile,
} from "./sampling-analysis";
import type { ResearchProjectData, SamplingPlan } from "./model";

const project = (): ResearchProjectData => ({
  schemaVersion: 6,
  people: [{ id: "p1", displayName: "P" }],
  sources: [
    {
      id: "s1",
      personId: "p1",
      title: "A",
      url: "https://a",
      sourceType: "video",
      purpose: "review",
      preparedness: "prepared",
      scope: "specific_game",
      publishedAt: "2022-01-01",
    },
    {
      id: "s2",
      personId: "p1",
      title: "B",
      url: "https://b",
      sourceType: "video",
      purpose: "essay",
      preparedness: "semi_prepared",
      scope: "games_general",
      publishedAt: "2025-01-01",
    },
    {
      id: "s3",
      personId: "p1",
      title: "C",
      url: "https://c",
      sourceType: "article",
      purpose: "essay",
      preparedness: "prepared",
      scope: "games_general",
    },
  ],
  arguments: [],
  excerpts: [
    { id: "e1", sourceId: "s1", text: "1" },
    { id: "e2", sourceId: "s1", text: "2" },
    { id: "e3", sourceId: "s1", text: "3" },
    { id: "e4", sourceId: "s2", text: "4" },
  ],
  codebooks: [],
  propositions: [],
  coders: [],
  codings: [],
  assessments: [],
  dimensionModels: [],
  dimensions: [],
  dimensionLinks: [],
  samplingPlans: [],
  discussions: [],
  discussionLinks: [],
});

const plan: SamplingPlan = {
  id: "plan",
  name: "Pilot",
  version: "0.1",
  status: "draft",
  minimumSourcesPerPerson: 4,
  minimumSourceTypesPerPerson: 3,
  minimumPurposesPerPerson: 2,
  minimumPreparednessModesPerPerson: 2,
  minimumScopesPerPerson: 2,
  minimumDatedSourceShare: 0.75,
  maximumSingleSourceTypeShare: 0.6,
  minimumTemporalSpanYears: 2,
};

test("sampling profile counts sources instead of excerpts as corpus breadth", () => {
  const profile = personSamplingProfile(project(), "p1");
  assert.equal(profile.sourceCount, 3);
  assert.equal(profile.excerptCount, 4);
  assert.equal(profile.sourceTypeCount, 2);
  assert.equal(profile.purposeCount, 2);
  assert.equal(profile.datedSourceCount, 2);
  assert.equal(profile.largestSourceExcerptShare, 0.75);
});

test("sampling profile preserves temporal coverage and dominant source type share", () => {
  const profile = personSamplingProfile(project(), "p1");
  assert.equal(profile.dominantSourceType, "video");
  assert.ok(profile.dominantSourceTypeShare !== null);
  assert.ok(Math.abs(profile.dominantSourceTypeShare - 2 / 3) < 0.0001);
  assert.ok(profile.temporalSpanYears !== null && profile.temporalSpanYears > 2.9);
});

test("sampling plan reports explicit target gaps without creating a validity score", () => {
  const evaluation = evaluateSamplingPlan(project(), plan, "p1");
  assert.equal(evaluation.meetsPlan, false);
  assert.deepEqual(
    evaluation.gaps.map((gap) => gap.code).sort(),
    ["dated_share", "source_type_concentration", "source_types", "sources"].sort(),
  );
});
