import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_RESEARCH_PROJECT, type ResearchProjectData } from "./model";
import { snapshotAuditInstruments } from "./audit-instrument-snapshot";
import { diffAuditInstruments, validateInstrumentSnapshot } from "./audit-instrument-diff";

function research(): ResearchProjectData {
  return {
    ...EMPTY_RESEARCH_PROJECT,
    codebooks: [{ id: "book", name: "Book", version: "1", status: "pilot" }],
    propositions: [
      { id: "p2", codebookId: "book", code: "P2", label: "Second", definition: "D2" },
      { id: "p1", codebookId: "book", code: "P1", label: "First", definition: "D1", includeRules: ["A"] },
    ],
    samplingPlans: [{
      id: "plan", name: "Plan", version: "1", status: "active",
      minimumSourcesPerPerson: 2, minimumSourceTypesPerPerson: 1,
      minimumPurposesPerPerson: 0, minimumPreparednessModesPerPerson: 0,
      minimumScopesPerPerson: 0, minimumDatedSourceShare: null,
      maximumSingleSourceTypeShare: null, minimumTemporalSpanYears: null,
    }],
  };
}

test("reports exact proposition field changes without altering research data", () => {
  const beforeProject = research();
  const before = snapshotAuditInstruments(beforeProject, "book", "plan");
  const afterProject = research();
  afterProject.propositions[1]!.definition = "Changed | definition";
  afterProject.samplingPlans[0]!.minimumSourcesPerPerson = 3;
  const after = snapshotAuditInstruments(afterProject, "book", "plan");
  const beforeSerialized = JSON.stringify(before);
  const changes = diffAuditInstruments(before, after);
  assert.deepEqual(changes.map(({instrument, entityId, field, kind})=>[instrument,entityId,field,kind]),
    [["proposition", "p1", "definition", "modified"], ["sampling_plan", "plan", "minimumSourcesPerPerson", "modified"]]);
  assert.equal(changes[0]?.before, JSON.stringify("D1"));
  assert.equal(changes[0]?.after, JSON.stringify("Changed | definition"));
  assert.equal(changes[1]?.before, "2");
  assert.equal(changes[1]?.after, "3");
  assert.equal(JSON.stringify(before), beforeSerialized);
});

test("added or removed propositions are distinguished field by field", () => {
  const a = research();
  const before = snapshotAuditInstruments(a, "book", null);
  a.propositions.shift();
  a.propositions.push({id:"p3",codebookId:"book",code:"P3",label:"New",definition:"New definition"});
  const changes = diffAuditInstruments(before, snapshotAuditInstruments(a,"book",null));
  assert.ok(changes.some((change) => change.instrument==="proposition" && change.entityId==="p2" && change.kind==="removed"));
  assert.ok(changes.some((change) => change.instrument==="proposition" && change.entityId==="p3" && change.kind==="added"));
});

test("source edits and reordering propositions cannot produce methodology false positives", () => {
  const a = research();
  const before = snapshotAuditInstruments(a,"book","plan");
  a.propositions.reverse();
  a.sources.push({id:"source",personId:"person",title:"Source",url:"https://example.org",sourceType:"article"});
  assert.deepEqual(diffAuditInstruments(before,snapshotAuditInstruments(a,"book","plan")),[]);
});

test("malformed or cross-referenced instruments are rejected", () => {
  const valid = snapshotAuditInstruments(research(),"book","plan");
  const expected = {codebookId:"book",codebookVersion:"1",planId:"plan",planVersion:"1"};
  assert.doesNotThrow(() => validateInstrumentSnapshot(valid,expected));
  assert.throws(() => validateInstrumentSnapshot({...valid,codebook:"invalid"},expected),/odczytać/);
  assert.throws(() => validateInstrumentSnapshot({...valid,codebook:JSON.stringify({book:{id:"book"},propositions:[]})},expected),/niezgodna/);
  assert.throws(() => validateInstrumentSnapshot(valid,{...expected,codebookId:"other"}),/niezgodna/);
  assert.throws(() => validateInstrumentSnapshot(valid,{...expected,planVersion:"2"}),/niezgodna/);
  const nested = JSON.parse(valid.codebook);
  nested.propositions[0] = JSON.stringify({id:"p",codebookId:"other"});
  assert.throws(() => validateInstrumentSnapshot({...valid,codebook:JSON.stringify(nested)},expected),/mikrostanowisko/);
  nested.propositions = [JSON.stringify({id:"dup",codebookId:"book"}),JSON.stringify({id:"dup",codebookId:"book"})];
  assert.throws(() => validateInstrumentSnapshot({...valid,codebook:JSON.stringify(nested)},expected),/mikrostanowisko/);
});
