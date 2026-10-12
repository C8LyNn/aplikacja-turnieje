import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_RESEARCH_PROJECT, type ResearchProjectData } from "./model";
import { snapshotAuditInstruments } from "./audit-instrument-snapshot";

function fixture(): ResearchProjectData {
  return {
    ...EMPTY_RESEARCH_PROJECT,
    codebooks: [{ id: "book", name: "Book", version: "1", status: "pilot" }],
    propositions: [
      { id: "p2", codebookId: "book", code: "P2", label: "Second", definition: "D2" },
      { id: "p1", codebookId: "book", code: "P1", label: "First", definition: "D1", includeRules: ["A"] },
    ],
    samplingPlans: [{
      id: "plan", name: "P", version: "1", status: "active",
      minimumSourcesPerPerson: 2, minimumSourceTypesPerPerson: 1,
      minimumPurposesPerPerson: 0, minimumPreparednessModesPerPerson: 0,
      minimumScopesPerPerson: 0, minimumDatedSourceShare: null,
      maximumSingleSourceTypeShare: null, minimumTemporalSpanYears: null,
    }],
  };
}

test("instrument snapshots ignore insertion order of propositions and object keys", () => {
  const a = fixture();
  const b = fixture();
  b.propositions.reverse();
  b.propositions[0] = {
    definition: "D1", label: "First", code: "P1", codebookId: "book", id: "p1", includeRules: ["A"],
  };
  assert.deepEqual(snapshotAuditInstruments(a, "book", "plan"), snapshotAuditInstruments(b, "book", "plan"));
});

test("snapshot captures unversioned definition, inclusion and sampling changes", () => {
  const a = fixture();
  const previous = snapshotAuditInstruments(a, "book", "plan");
  a.propositions[1]!.definition = "new definition";
  assert.notEqual(snapshotAuditInstruments(a, "book", "plan").codebook, previous.codebook);
  a.propositions[1]!.definition = "D1";
  a.propositions[1]!.includeRules = ["B"];
  assert.notEqual(snapshotAuditInstruments(a, "book", "plan").codebook, previous.codebook);
  a.propositions[1]!.includeRules = ["A"];
  a.samplingPlans[0]!.minimumSourcesPerPerson += 1;
  assert.notEqual(snapshotAuditInstruments(a, "book", "plan").samplingPlan, previous.samplingPlan);
});

test("unrelated source edits do not change instrument snapshots", () => {
  const a = fixture();
  const previous = snapshotAuditInstruments(a, "book", "plan");
  a.people.push({ id: "p", displayName: "Other" });
  a.sources.push({ id: "s", personId: "p", title: "S", url: "https://example.org", sourceType: "post" });
  assert.deepEqual(snapshotAuditInstruments(a, "book", "plan"), previous);
});

test("snapshot without plan is null; invalid instrument references are rejected", () => {
  const a = fixture();
  assert.equal(snapshotAuditInstruments(a, "book", null).samplingPlan, null);
  assert.throws(() => snapshotAuditInstruments(a, "nonexistent", null), /codebook/);
  assert.throws(() => snapshotAuditInstruments(a, "book", "nonexistent"), /plan próbkowania/);
});
