import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_RESEARCH_PROJECT } from "./model";
import { parseResearchProject, serializeResearchProject } from "./project-transfer";
import { PILOT_CODEBOOK, PILOT_PROPOSITIONS } from "./pilot-codebook";

test("research project JSON round-trips schema v6 data", () => {
  const project = {
    ...EMPTY_RESEARCH_PROJECT,
    codebooks: [PILOT_CODEBOOK],
    propositions: PILOT_PROPOSITIONS,
  };
  const parsed = parseResearchProject(serializeResearchProject(project));

  assert.equal(parsed.schemaVersion, 6);
  assert.equal(parsed.codebooks[0]?.id, PILOT_CODEBOOK.id);
  assert.equal(parsed.propositions.length, 5);
  assert.deepEqual(parsed.assessments, []);
  assert.deepEqual(parsed.dimensionModels, []);
  assert.deepEqual(parsed.dimensions, []);
  assert.deepEqual(parsed.dimensionLinks, []);
  assert.deepEqual(parsed.samplingPlans, []);
  assert.deepEqual(parsed.discussions, []);
  assert.deepEqual(parsed.discussionLinks, []);
});

test("project import migrates schema v2 data to v6", () => {
  const legacy = {
    schemaVersion: 2,
    people: [],
    sources: [],
    arguments: [],
    excerpts: [],
    codebooks: [],
    propositions: [],
    coders: [],
    codings: [],
  };
  const parsed = parseResearchProject(JSON.stringify(legacy));

  assert.equal(parsed.schemaVersion, 6);
  assert.deepEqual(parsed.assessments, []);
  assert.deepEqual(parsed.dimensionModels, []);
  assert.deepEqual(parsed.samplingPlans, []);
  assert.deepEqual(parsed.discussions, []);
});

test("project import migrates schema v3 data to v6", () => {
  const legacy = {
    schemaVersion: 3,
    people: [],
    sources: [],
    arguments: [],
    excerpts: [],
    codebooks: [],
    propositions: [],
    coders: [],
    codings: [],
    assessments: [],
  };
  const parsed = parseResearchProject(JSON.stringify(legacy));

  assert.equal(parsed.schemaVersion, 6);
  assert.deepEqual(parsed.dimensionModels, []);
  assert.deepEqual(parsed.dimensions, []);
  assert.deepEqual(parsed.dimensionLinks, []);
  assert.deepEqual(parsed.samplingPlans, []);
  assert.deepEqual(parsed.discussions, []);
});

test("project import migrates schema v4 data to v6", () => {
  const legacy = {
    schemaVersion: 4,
    people: [],
    sources: [],
    arguments: [],
    excerpts: [],
    codebooks: [],
    propositions: [],
    coders: [],
    codings: [],
    assessments: [],
    dimensionModels: [],
    dimensions: [],
    dimensionLinks: [],
  };
  const parsed = parseResearchProject(JSON.stringify(legacy));

  assert.equal(parsed.schemaVersion, 6);
  assert.deepEqual(parsed.samplingPlans, []);
  assert.deepEqual(parsed.discussions, []);
});

test("project import migrates schema v5 data to v6", () => {
  const legacy = {
    schemaVersion: 5,
    people: [],
    sources: [],
    arguments: [],
    excerpts: [],
    codebooks: [],
    propositions: [],
    coders: [],
    codings: [],
    assessments: [],
    dimensionModels: [],
    dimensions: [],
    dimensionLinks: [],
    samplingPlans: [],
  };
  const parsed = parseResearchProject(JSON.stringify(legacy));

  assert.equal(parsed.schemaVersion, 6);
  assert.deepEqual(parsed.discussions, []);
  assert.deepEqual(parsed.discussionLinks, []);
});

test("project import rejects unsupported schema versions", () => {
  const raw = JSON.stringify({ ...EMPTY_RESEARCH_PROJECT, schemaVersion: 1 });
  assert.throws(
    () => parseResearchProject(raw),
    /schemaVersion=2, schemaVersion=3, schemaVersion=4, schemaVersion=5 i schemaVersion=6/,
  );
});

test("pilot proposition identities are tied to the current codebook version", () => {
  assert.equal(PILOT_CODEBOOK.version, "0.2.0");
  assert.match(PILOT_CODEBOOK.id, /0\.2\.0$/);
  for (const proposition of PILOT_PROPOSITIONS) {
    assert.equal(proposition.codebookId, PILOT_CODEBOOK.id);
    assert.match(proposition.id, /@0\.2\.0$/);
  }
});
