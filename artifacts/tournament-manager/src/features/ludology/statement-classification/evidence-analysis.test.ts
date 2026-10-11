import assert from "node:assert/strict";
import { test } from "node:test";
import {
  countEvidenceDirections,
  evidenceSignature,
  evidenceUnitKey,
  groupEvidenceByYear,
  isAssessmentStale,
} from "./evidence-analysis";
import type { CodingRecord, ResearchExcerpt, ResearchSource } from "./model";

const excerpts: ResearchExcerpt[] = [
  { id: "e1", sourceId: "s1", argumentId: "a1", text: "one" },
  { id: "e2", sourceId: "s1", argumentId: "a1", text: "two" },
  { id: "e3", sourceId: "s2", argumentId: "a2", text: "three" },
  { id: "e4", sourceId: "s3", text: "four" },
];

const coding = (
  id: string,
  excerptId: string,
  direction: CodingRecord["direction"],
): CodingRecord => ({
  id,
  excerptId,
  propositionId: "q01",
  coderId: "coder",
  codebookId: "book",
  direction,
  explicitness: 2,
  evidenceLevel: "argumentative",
  confidence: "medium",
});

test("multiple excerpts from one argument count as one evidence unit", () => {
  const codings = [
    coding("c1", "e1", 1),
    coding("c2", "e2", 2),
    coding("c3", "e3", -1),
  ];

  const counts = countEvidenceDirections(codings, excerpts);
  assert.equal(counts.positive, 1);
  assert.equal(counts.negative, 1);
  assert.equal(counts.units, 2);
  assert.equal(counts.codings, 3);
  assert.equal(counts.contradiction, true);
});

test("excerpt without an argument remains its own evidence unit", () => {
  assert.equal(evidenceUnitKey(coding("c4", "e4", 0), excerpts), "excerpt:e4");
});

test("timeline groups dated evidence without inventing dates", () => {
  const sources: ResearchSource[] = [
    { id: "s1", personId: "p1", title: "A", url: "https://a", sourceType: "video", publishedAt: "2024-02-01" },
    { id: "s2", personId: "p1", title: "B", url: "https://b", sourceType: "article", publishedAt: "2025-03-01" },
    { id: "s3", personId: "p1", title: "C", url: "https://c", sourceType: "post" },
  ];
  const result = groupEvidenceByYear(
    [coding("c1", "e1", 1), coding("c2", "e2", 1), coding("c3", "e3", -1), coding("c4", "e4", 0)],
    excerpts,
    sources,
  );

  assert.deepEqual(result.years.map((bucket) => bucket.year), ["2024", "2025"]);
  assert.equal(result.years[0]?.units, 1);
  assert.equal(result.years[0]?.codings, 2);
  assert.equal(result.undatedCodings, 1);
});


test("evidence signature is stable by coding identity and changes with coding semantics", () => {
  const first = coding("c1", "e1", 1);
  const second = coding("c2", "e3", -1);
  assert.equal(
    evidenceSignature([first, second]),
    evidenceSignature([second, first]),
  );
  assert.notEqual(
    evidenceSignature([first]),
    evidenceSignature([{ ...first, direction: 2 }]),
  );
});


test("assessment becomes stale when its evidence set changes", () => {
  const source = { id: "s1", personId: "p1", title: "S", url: "https://s", sourceType: "video" as const };
  const project = {
    schemaVersion: 5 as const,
    people: [{ id: "p1", displayName: "P" }],
    sources: [source],
    arguments: [],
    excerpts: [excerpts[0]!],
    codebooks: [{ id: "book", name: "B", version: "1", status: "pilot" as const }],
    propositions: [{ id: "q01", codebookId: "book", code: "Q01", label: "Q", definition: "D" }],
    coders: [{ id: "coder", displayName: "C", type: "human" as const }],
    codings: [coding("c1", "e1", 1)],
    assessments: [],
    dimensionModels: [],
    dimensions: [],
    dimensionLinks: [],
    samplingPlans: [],
  };
  const assessment = {
    id: "a1",
    personId: "p1",
    propositionId: "q01",
    codebookId: "book",
    status: "stable" as const,
    direction: 1 as const,
    confidence: "medium" as const,
    evidenceSignature: evidenceSignature(project.codings),
    updatedAt: "2026-10-11T00:00:00.000Z",
  };

  assert.equal(isAssessmentStale(project, assessment), false);
  const changed = { ...project, codings: [...project.codings, coding("c2", "e1", 2)] };
  assert.equal(isAssessmentStale(changed, assessment), true);
});
