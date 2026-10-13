import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_RESEARCH_PROJECT, type ResearchProjectData } from "./model";
import { buildResearchAuditReport, serializeResearchAuditReport } from "./research-audit-report";
import {
  compareResearchAudits,
  parseResearchAuditSnapshot,
  renderAuditComparisonMarkdown,
} from "./research-audit-comparison";

function project(): ResearchProjectData {
  return {
    ...EMPTY_RESEARCH_PROJECT,
    people: [{ id: "person", displayName: "A|B" }],
    sources: [{ id: "src", personId: "person", title: "Talk", url: "https://example.org", sourceType: "video" }],
    excerpts: [{ id: "e", sourceId: "src", text: "Sample", verificationStatus: "verified" }],
    codebooks: [
      { id: "book", version: "0.2", name: "Book", status: "pilot" },
      { id: "other", version: "0.1", name: "Other", status: "draft" },
    ],
    propositions: [{ id: "p", codebookId: "book", code: "P", label: "L", definition: "D" }],
    coders: [],
  };
}
function audit(data: ResearchProjectData, generatedAt: string, codebookId = "book", samplingPlanId: string | null = null) {
  return buildResearchAuditReport(data, { codebookId, samplingPlanId, generatedAt });
}
const first = "2026-10-12T10:00:00.000Z";
const second = "2026-10-12T11:00:00.000Z";

test("audit parser accepts exact versioned export and compares snapshots", () => {
  const before = audit(project(), first);
  const data = project();
  data.sources.push({ id: "next", personId: "person", title: "Next", url: "https://example.com", sourceType: "article" });
  data.people.push({ id: "second-person", displayName: "New" });
  const after = audit(data, second);
  const parsed = parseResearchAuditSnapshot(serializeResearchAuditReport(before));
  assert.deepEqual(parsed, before);
  const comparison = compareResearchAudits(parsed, after);
  assert.equal(comparison.compatible, true);
  assert.equal(comparison.metrics.find(metric => metric.key === "sources")?.delta, 1);
  assert.equal(comparison.metrics.find(metric => metric.key === "people")?.delta, 1);
  assert.equal(comparison.people.find(person => person.personId === "second-person")?.kind, "added");
  assert.equal(comparison.people.find(person => person.personId === "person")?.kind, "changed");
  assert.match(renderAuditComparisonMarkdown(comparison), /A\\\|B/);
});

test("same IDs with changed codebook version are not comparable", () => {
  const data = project();
  const old = audit(data, first);
  data.codebooks[0]!.version = "0.3";
  const newer = audit(data, second);
  const comparison = compareResearchAudits(old, newer);
  assert.equal(comparison.compatible, false);
  assert.equal(comparison.metrics.length, 0);
  assert.equal(comparison.people.length, 0);
  assert.match(renderAuditComparisonMarkdown(comparison), /Nieporównywalne/);
  assert.match(comparison.blockingReasons.join(" "), /codebooka/);
});

test("switching sampling plan, including from none to one, blocks numerical deltas", () => {
  const data = project();
  data.samplingPlans = [{
    id: "plan", name: "Sampling", version: "1", status: "draft",
    minimumSourcesPerPerson: 1, minimumSourceTypesPerPerson: 1,
    minimumPurposesPerPerson: 0, minimumPreparednessModesPerPerson: 0,
    minimumScopesPerPerson: 0, minimumDatedSourceShare: null,
    maximumSingleSourceTypeShare: null, minimumTemporalSpanYears: null,
  }];
  const before = audit(data, first);
  const after = audit(data, second, "book", "plan");
  assert.equal(compareResearchAudits(before, after).compatible, false);
  const equal = audit(data, first, "book", "plan");
  assert.equal(compareResearchAudits(equal, after).compatible, true);
});

test("future baseline is rejected regardless of matching codebook", () => {
  const a = audit(project(), second);
  const b = audit(project(), first);
  const comparison = compareResearchAudits(a, b);
  assert.equal(comparison.compatible, false);
  assert.ok(comparison.blockingReasons.some(reason => /późniejszy/.test(reason)));
});

test("unassessed sampling gaps produce undefined delta, not zero", () => {
  const before = audit(project(), first);
  const after = audit(project(), second);
  const cmp = compareResearchAudits(before, after);
  const sampling = cmp.metrics.find(metric => metric.key === "samplingGaps");
  assert.equal(sampling?.before, null);
  assert.equal(sampling?.after, null);
  assert.equal(sampling?.delta, null);
  assert.match(renderAuditComparisonMarkdown(cmp), /nie oceniano/);
});

test("flags introduced and removed are independent of person names and preserved by identity", () => {
  const before = audit(project(), first);
  const data = project();
  data.sources = [];
  data.people[0]!.displayName = "Updated";
  const after = audit(data, second);
  const cmp = compareResearchAudits(before, after);
  const person = cmp.people[0]!;
  assert.equal(person.personId, "person");
  assert.equal(person.kind, "changed");
  assert.equal(person.currentName, "Updated");
  assert.ok(person.flagsRemoved.length + person.flagsAdded.length > 0);
});

test("reject unsupported, malformed and misleading baseline reports", () => {
  const valid = audit(project(), first);
  assert.throws(() => parseResearchAuditSnapshot("not-json"), /JSON/);
  assert.throws(() => parseResearchAuditSnapshot(JSON.stringify({ ...valid, formatVersion: 2 })), /formatVersion/);
  assert.throws(() => parseResearchAuditSnapshot(JSON.stringify({ ...valid, codebook: null })), /codebooka/);
  assert.throws(() => parseResearchAuditSnapshot(JSON.stringify({
    ...valid, counts: { ...valid.counts, codingRecords: "2" },
  })), /liczniki/);
  assert.throws(() => parseResearchAuditSnapshot(JSON.stringify({
    ...valid, health: { ...valid.health, samplingGaps: -1 },
  })), /liczniki/);
  assert.throws(() => parseResearchAuditSnapshot(JSON.stringify({
    ...valid, people: [valid.people[0], valid.people[0]],
  })), /powielone/);
  assert.throws(() => parseResearchAuditSnapshot(JSON.stringify({
    ...valid, people: [],
  })), /Niespójna/);
  assert.throws(() => parseResearchAuditSnapshot(JSON.stringify({
    ...valid, counts: { ...valid.counts, verifiedExcerpts: valid.counts.excerpts + 1 },
  })), /niespójne/);
  assert.throws(() => parseResearchAuditSnapshot(JSON.stringify({
    ...valid, review: { ...valid.review, total: valid.review.total + 1 },
  })), /niespójne/);
  assert.throws(() => parseResearchAuditSnapshot(JSON.stringify({
    ...valid, counts: { ...valid.counts, integrityIssues: valid.counts.integrityIssues + 1 },
  })), /niespójne/);
});

test("changing project schema yields explicit caution, not automatic equivalence guarantee", () => {
  const before = audit(project(), first);
  const after = { ...audit(project(), second), projectSchemaVersion: 9 };
  const cmp = compareResearchAudits(before, after);
  assert.equal(cmp.compatible, true);
  assert.ok(cmp.notes.some(note => /schematu/.test(note)));
});

test("current research data and original exports remain unchanged after comparison", () => {
  const data = project();
  const original = JSON.stringify(data);
  const before = audit(data, first);
  const oldJSON = JSON.stringify(before);
  compareResearchAudits(before, audit(data, second));
  assert.equal(JSON.stringify(before), oldJSON);
  assert.equal(JSON.stringify(data), original);
});

test("editing proposition definition without version bump blocks comparison", () => {
  const data = project();
  const before = audit(data, first);
  data.propositions[0]!.definition = "A substantively different coding rule";
  const after = audit(data, second);
  const comparison = compareResearchAudits(before, after);
  assert.equal(comparison.compatible, false);
  assert.equal(comparison.metrics.length, 0);
  assert.match(comparison.blockingReasons.join(" "), /Treść codebooka/);
  assert.deepEqual(comparison.instrumentChanges.map(({instrument,entityId,field}) => [instrument,entityId,field]),
    [["proposition", "p", "definition"]]);
  assert.match(renderAuditComparisonMarkdown(comparison), /Zmiany definicji narzędzi/);
  assert.match(renderAuditComparisonMarkdown(comparison), /A substantively different coding rule/);
});

test("changing a sampling threshold without version bump blocks comparison", () => {
  const data = project();
  data.samplingPlans = [{
    id: "plan", name: "Sampling", version: "1", status: "active",
    minimumSourcesPerPerson: 1, minimumSourceTypesPerPerson: 1,
    minimumPurposesPerPerson: 0, minimumPreparednessModesPerPerson: 0,
    minimumScopesPerPerson: 0, minimumDatedSourceShare: null,
    maximumSingleSourceTypeShare: null, minimumTemporalSpanYears: null,
  }];
  const before = audit(data, first, "book", "plan");
  data.samplingPlans[0]!.minimumSourcesPerPerson = 4;
  const after = audit(data, second, "book", "plan");
  const comparison = compareResearchAudits(before, after);
  assert.equal(comparison.compatible, false);
  assert.match(comparison.blockingReasons.join(" "), /Treść planu/);
  assert.ok(comparison.instrumentChanges.some(change =>
    change.instrument === "sampling_plan" && change.field === "minimumSourcesPerPerson" &&
    change.before === "1" && change.after === "4"));
});

test("legacy v1 snapshots import, but cannot silently pass methodological comparability gate", () => {
  const original = audit(project(), first);
  const { instrumentSnapshots: _snapshots, ...legacy } = original;
  const parsed = parseResearchAuditSnapshot(JSON.stringify(legacy));
  assert.equal(parsed.instrumentSnapshots, undefined);
  const comparison = compareResearchAudits(parsed, audit(project(), second));
  assert.equal(comparison.compatible, false);
  assert.equal(comparison.metrics.length, 0);
  assert.match(comparison.blockingReasons.join(" "), /migawki definicji/);
  assert.deepEqual(comparison.instrumentChanges, []);
});

test("parser rejects malformed or inconsistent instrument snapshots", () => {
  const valid = audit(project(), first);
  assert.throws(() => parseResearchAuditSnapshot(JSON.stringify({
    ...valid, instrumentSnapshots: { codebook: null, samplingPlan: null },
  })), /migawka/);
  assert.throws(() => parseResearchAuditSnapshot(JSON.stringify({
    ...valid, instrumentSnapshots: { codebook: "something", samplingPlan: "plan although none exists" },
  })), /migawka/);
});

test("import rejects an instrument snapshot that disagrees with declared book identity", () => {
  const valid = audit(project(), first);
  assert.throws(() => parseResearchAuditSnapshot(JSON.stringify({
    ...valid,
    codebook: { ...valid.codebook, id: "different" },
  })), /niezgodna/);
  assert.throws(() => parseResearchAuditSnapshot(JSON.stringify({
    ...valid,
    instrumentSnapshots: { codebook: "not JSON", samplingPlan: null },
  })), /odczytać/);
});

test("comparison includes no fake method deltas for unchanged snapshots", () => {
  const before = audit(project(), first);
  const after = audit(project(), second);
  const result = compareResearchAudits(before, after);
  assert.equal(result.compatible, true);
  assert.deepEqual(result.instrumentChanges, []);
});
