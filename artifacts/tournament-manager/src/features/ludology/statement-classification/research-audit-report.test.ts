import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_RESEARCH_PROJECT, type ResearchProjectData, type CodingRecord } from "./model";
import {
  buildResearchAuditReport,
  renderResearchAuditMarkdown,
  serializeResearchAuditReport,
} from "./research-audit-report";

const coding = (id: string, coderId: string, direction: CodingRecord["direction"]): CodingRecord => ({
  id, coderId, direction, codebookId: "cb", excerptId: "e1", propositionId: "q1",
  explicitness: 2, confidence: "high", evidenceLevel: "direct",
});
function fixture(): ResearchProjectData {
  return {
    ...EMPTY_RESEARCH_PROJECT,
    people: [{ id: "p1", displayName: "Osoba | analizowana" }],
    sources: [{
      id: "s1", personId: "p1", title: "Referat", url: "https://example.org",
      sourceType: "article", publishedAt: "2025-10-01",
      purpose: "essay", preparedness: "prepared", scope: "games_general", language: "pl",
    }],
    arguments: [{ id: "a1", sourceId: "s1", title: "Argument" }],
    excerpts: [
      { id: "e1", sourceId: "s1", argumentId: "a1", text: "A", verificationStatus: "verified" },
      { id: "e2", sourceId: "s1", argumentId: "a1", text: "B", verificationStatus: "checked" },
    ],
    codebooks: [{ id: "cb", name: "Pilotaż", version: "0.3", status: "pilot" }],
    propositions: [{ id: "q1", codebookId: "cb", code: "L-1", label: "Teza", definition: "Opis" }],
    coders: [
      { id: "coder1", displayName: "C1", type: "human" },
      { id: "coder2", displayName: "C2", type: "human" },
    ],
    codings: [coding("c1", "coder1", 0), coding("c2", "coder2", null)],
    assessments: [{
      id: "ass1", personId: "p1", propositionId: "q1", codebookId: "cb",
      status: "insufficient_evidence", direction: null, confidence: "low",
      updatedAt: "2026-10-12T12:00:00.000Z",
    }],
  };
}
const context = { codebookId: "cb", samplingPlanId: null, generatedAt: "2026-10-12T17:00:00.000Z" };

test("report counts raw observations separately from unique excerpt/proposition units", () => {
  const data = fixture();
  const r = buildResearchAuditReport(data, context);
  assert.equal(r.formatVersion, 1);
  assert.equal(r.projectSchemaVersion, 8);
  assert.equal(r.counts.people, 1);
  assert.equal(r.counts.sources, 1);
  assert.equal(r.counts.excerpts, 2);
  assert.equal(r.counts.verifiedExcerpts, 1);
  assert.equal(r.counts.codingRecords, 2);
  assert.equal(r.counts.codedUnits, 1);
  assert.equal(r.review.pending, 1);
  assert.equal(r.review.total, 1);
  assert.equal(r.agreementPairs.length, 1);
  assert.equal(r.agreementPairs[0]?.overlap, 1);
  assert.equal(r.agreementPairs[0]?.ratedOverlap, 0);
  assert.equal(r.agreementPairs[0]?.linearWeightedKappa, null);
  assert.equal(r.agreementPairs[0]?.missingVsScored, 1);
});

test("report restricts coding statistics to chosen codebook and doesn't mutate project", () => {
  const data = fixture();
  data.codings.push({ ...coding("other", "coder1", -2), codebookId: "another" });
  const before = JSON.stringify(data);
  const report = buildResearchAuditReport(data, context);
  assert.equal(report.counts.codingRecords, 2);
  assert.equal(report.counts.codedUnits, 1);
  assert.equal(JSON.stringify(data), before);
});

test("selected sampling plan is explicit, never inferred from draft", () => {
  const data = fixture();
  data.samplingPlans = [{
    id: "plan", name: "Dobór", version: "1", status: "draft",
    minimumSourcesPerPerson: 3, minimumSourceTypesPerPerson: 2,
    minimumPurposesPerPerson: 2, minimumPreparednessModesPerPerson: 2,
    minimumScopesPerPerson: 2, minimumDatedSourceShare: null,
    maximumSingleSourceTypeShare: null, minimumTemporalSpanYears: null,
  }];
  const without = buildResearchAuditReport(data, context);
  assert.equal(without.samplingPlan, null);
  assert.equal(without.health.samplingGaps, 0);
  const withPlan = buildResearchAuditReport(data, { ...context, samplingPlanId: "plan" });
  assert.equal(withPlan.samplingPlan?.id, "plan");
  assert.ok(withPlan.health.samplingGaps > 0);
  assert.match(renderResearchAuditMarkdown(without), /nie oceniano/);
});

test("global integrity issues and person flags remain visible separately", () => {
  const data = fixture();
  data.sources[0]!.personId = "nonexistent";
  const report = buildResearchAuditReport(data, context);
  assert.ok(report.integrityIssues.some((i) => i.code === "orphan_source_person"));
  assert.ok(report.counts.integrityIssues > 0);
  assert.ok(report.people.length === 1);
});

test("Markdown is escaped, marks N/A distinct from neutral and JSON preserves full snapshot", () => {
  const report = buildResearchAuditReport(fixture(), context);
  const md = renderResearchAuditMarkdown(report);
  assert.ok(md.includes("Osoba " + String.fromCharCode(92) + "| analizowana"));
  assert.match(md, /N\/A/);
  assert.match(md, /brak flag|Flagi|Integralność/);
  assert.match(md, /2026-10-12T17:00:00.000Z/);
  const parsed = JSON.parse(serializeResearchAuditReport(report));
  assert.deepEqual(parsed, report);
});

test("rejects unknown codebook, unknown plan or invalid timestamp", () => {
  const data = fixture();
  assert.throws(() => buildResearchAuditReport(data, { ...context, codebookId: "missing" }), /codebooka/);
  assert.throws(() => buildResearchAuditReport(data, { ...context, samplingPlanId: "missing" }), /planu/);
  assert.throws(() => buildResearchAuditReport(data, { ...context, generatedAt: "invalid" }), /daty/);
});
