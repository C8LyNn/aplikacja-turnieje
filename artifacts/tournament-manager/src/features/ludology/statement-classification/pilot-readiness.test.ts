import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_RESEARCH_PROJECT, type ResearchProjectData } from "./model";
import { pilotReadiness } from "./pilot-readiness";

test("empty project identifies unmet R1 workload", () => {
  const result = pilotReadiness(EMPTY_RESEARCH_PROJECT, "missing");
  assert.equal(result.observed.pairedUnits, 0);
  assert.equal(result.targets.pairedUnits, 120);
  assert.ok(result.warnings.length > 0);
});

test("counts unique pairs of distinct human coders and verified fragments only", () => {
  const data: ResearchProjectData = {
    ...EMPTY_RESEARCH_PROJECT,
    people: [{ id: "p", displayName: "Person" }],
    sources: [{ id: "s", personId: "p", title: "Source", url: "https://example.org", sourceType: "article" }],
    excerpts: [{ id: "e", sourceId: "s", text: "Evidence", verificationStatus: "verified" }],
    codebooks: [{ id: "b", name: "Pilot", version: "1", status: "pilot" }],
    propositions: [{ id: "q", codebookId: "b", code: "Q", label: "Test", definition: "Definition" }],
    coders: [{ id: "a", displayName: "A", type: "human" }, { id: "b", displayName: "B", type: "human" }],
  };
  const record = (id: string, coderId: string) => ({
    id, coderId, excerptId: "e", propositionId: "q", codebookId: "b",
    direction: 0 as const, explicitness: 2 as const,
    evidenceLevel: "direct" as const, confidence: "medium" as const,
  });
  data.codings = [record("1", "a"), record("2", "a")];
  assert.equal(pilotReadiness(data, "b").observed.pairedUnits, 0);
  data.codings.push(record("3", "b"));
  assert.equal(pilotReadiness(data, "b").observed.pairedUnits, 1);
  data.excerpts[0]!.verificationStatus = "checked";
  assert.equal(pilotReadiness(data, "b").observed.pairedUnits, 0);
});
