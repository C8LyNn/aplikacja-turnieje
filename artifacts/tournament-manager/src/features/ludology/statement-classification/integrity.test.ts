import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_RESEARCH_PROJECT } from "./model";
import { checkResearchProjectIntegrity } from "./integrity";

test("valid empty project has no integrity issues", () => {
  assert.deepEqual(checkResearchProjectIntegrity(EMPTY_RESEARCH_PROJECT), []);
});

test("integrity detects orphaned and mismatched research references", () => {
  const data = {
    ...EMPTY_RESEARCH_PROJECT,
    people: [{ id: "p1", displayName: "P" }],
    sources: [{ id: "s1", personId: "p1", title: "S", url: "https://s", sourceType: "video" as const }],
    arguments: [{ id: "a1", sourceId: "s1", title: "A" }],
    excerpts: [
      { id: "e1", sourceId: "missing", argumentId: "a1", text: "x", timestampStart: 5, timestampEnd: 2 },
    ],
    codebooks: [{ id: "book", name: "Book", version: "1", status: "pilot" as const }],
    propositions: [{ id: "q1", codebookId: "book", code: "Q1", label: "Q", definition: "D" }],
    coders: [{ id: "coder", displayName: "C", type: "human" as const }],
    codings: [{
      id: "c1",
      excerptId: "e1",
      propositionId: "q1",
      coderId: "coder",
      codebookId: "book",
      direction: 1 as const,
      explicitness: 2 as const,
      evidenceLevel: "argumentative" as const,
      confidence: "medium" as const,
    }],
  };

  const codes = checkResearchProjectIntegrity(data).map((issue) => issue.code);
  assert.ok(codes.includes("orphan_excerpt_source"));
  assert.ok(codes.includes("argument_source_mismatch"));
  assert.ok(codes.includes("invalid_timestamp_range"));
});

test("integrity detects duplicate coding units", () => {
  const baseCoding = {
    excerptId: "e1",
    propositionId: "q1",
    coderId: "coder",
    codebookId: "book",
    direction: 1 as const,
    explicitness: 2 as const,
    evidenceLevel: "argumentative" as const,
    confidence: "medium" as const,
  };
  const data = {
    ...EMPTY_RESEARCH_PROJECT,
    people: [{ id: "p1", displayName: "P" }],
    sources: [{ id: "s1", personId: "p1", title: "S", url: "https://s", sourceType: "video" as const }],
    excerpts: [{ id: "e1", sourceId: "s1", text: "x" }],
    codebooks: [{ id: "book", name: "Book", version: "1", status: "pilot" as const }],
    propositions: [{ id: "q1", codebookId: "book", code: "Q1", label: "Q", definition: "D" }],
    coders: [{ id: "coder", displayName: "C", type: "human" as const }],
    codings: [{ id: "c1", ...baseCoding }, { id: "c2", ...baseCoding }],
  };

  assert.ok(checkResearchProjectIntegrity(data).some((issue) => issue.code === "duplicate_coding"));
});
