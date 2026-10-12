import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_RESEARCH_PROJECT, type CodingAdjudication, type ResearchProjectData } from "./model";
import {
  adjudicationIssue,
  canonicalCodingPair,
  latestCodingAdjudication,
  snapshotCoding,
  snapshotExcerpt,
  validateAdjudicationInput,
} from "./adjudication-protocol";
import { checkResearchProjectIntegrity } from "./integrity";

const coding = (id: string, coderId: string, direction: -2 | -1 | 0 | 1 | 2 | null) => ({
  id, coderId, direction,
  excerptId: "e", propositionId: "q", codebookId: "b",
  explicitness: 2 as const, evidenceLevel: "direct" as const, confidence: "high" as const,
});
const fixture = (): ResearchProjectData => ({
  ...EMPTY_RESEARCH_PROJECT,
  people: [{ id: "p", displayName: "P" }],
  sources: [{ id: "s", personId: "p", title: "S", url: "https://example.org", sourceType: "article" }],
  excerpts: [{ id: "e", sourceId: "s", text: "quote", verificationStatus: "verified" }],
  codebooks: [{ id: "b", name: "B", version: "1", status: "pilot" }],
  propositions: [{ id: "q", codebookId: "b", code: "Q", label: "Q", definition: "D" }],
  coders: [
    { id: "a", displayName: "A", type: "human" },
    { id: "b", displayName: "B", type: "ai" },
    { id: "reviewer", displayName: "R", type: "human" },
  ],
  codings: [coding("ca", "a", -1), coding("cb", "b", 1)],
});
const input = () => ({
  codingAId: "ca",
  codingBId: "cb",
  reviewerId: "reviewer",
  decision: "resolved" as const,
  direction: 0 as const,
  rationale: "Inspected full primary source and context",
});
const event = (overrides: Partial<CodingAdjudication> = {}): CodingAdjudication => ({
  ...input(), id: "review1", codebookId: "b", excerptId: "e", propositionId: "q",
  codingASnapshot: snapshotCoding(coding("ca", "a", -1)),
  codingBSnapshot: snapshotCoding(coding("cb", "b", 1)),
  excerptSnapshot: snapshotExcerpt(fixture().excerpts[0]!),
  createdAt: "2026-10-12T14:00:00Z", ...overrides,
});

test("a human third-party reviewer may resolve disagreement without mutating codings", () => {
  const data = fixture();
  const baseline = JSON.stringify(data.codings);
  assert.equal(validateAdjudicationInput(data, input()), null);
  data.adjudications.push(event());
  assert.equal(adjudicationIssue(data, event()), null);
  assert.equal(checkResearchProjectIntegrity(data).length, 0);
  assert.equal(JSON.stringify(data.codings), baseline);
});

test("both N/A and a scored direction are distinct and can resolve to N/A", () => {
  const data = fixture();
  data.codings[0]!.direction = null;
  assert.equal(validateAdjudicationInput(data, { ...input(), direction: null }), null);
});

test("cannot adjudicate without a verified excerpt or an independent human reviewer", () => {
  const data = fixture();
  data.excerpts[0]!.verificationStatus = "checked";
  assert.match(validateAdjudicationInput(data, input()) ?? "", /zweryfikuj/);
  data.excerpts[0]!.verificationStatus = "verified";
  assert.match(validateAdjudicationInput(data, { ...input(), reviewerId: "a" }) ?? "", /trzecim/);
  assert.match(validateAdjudicationInput(data, { ...input(), reviewerId: "b" }) ?? "", /trzecim/);
  assert.match(validateAdjudicationInput(data, { ...input(), rationale: "" }) ?? "", /uzasadnienie/);
});

test("cannot adjudicate ambiguous duplicate codings or unrelated units", () => {
  const data = fixture();
  data.codings.push(coding("ca2", "a", 2));
  assert.match(validateAdjudicationInput(data, input()) ?? "", /Powielone/);
  data.codings.pop();
  data.codings[1]!.propositionId = "other";
  assert.match(validateAdjudicationInput(data, input()) ?? "", /tej samej jednostki/);
});

test("a deferral must not contain an adjudicated ordinal direction", () => {
  const data = fixture();
  assert.match(validateAdjudicationInput(data, {
    ...input(), decision: "deferred", direction: 1,
  }) ?? "", /Odroczenie/);
  assert.equal(validateAdjudicationInput(data, {
    ...input(), decision: "deferred", direction: null,
  }), null);
});

test("multiple decisions form append-only history; latest resolves regardless of pair order", () => {
  const data = fixture();
  data.adjudications = [
    event({ id: "one", decision: "deferred", direction: null }),
    event({ id: "two", decision: "resolved", direction: -1 }),
  ];
  assert.equal(canonicalCodingPair("ca", "cb"), canonicalCodingPair("cb", "ca"));
  assert.equal(latestCodingAdjudication(data, "cb", "ca")?.id, "two");
  assert.equal(data.adjudications.length, 2);
});

test("deleted original observations do not silently erase stale audit decisions", () => {
  const data = fixture();
  data.adjudications = [event()];
  data.codings = data.codings.filter((item) => item.id !== "ca");
  assert.match(adjudicationIssue(data, data.adjudications[0]!) ?? "", /usuniętego/);
  assert.ok(checkResearchProjectIntegrity(data).some((item) => item.code === "invalid_adjudication"));
});

test("normalizing an underlying disagreement flags old adjudication as invalid", () => {
  const data = fixture();
  data.adjudications = [event()];
  data.codings[1]!.direction = -1;
  assert.match(adjudicationIssue(data, data.adjudications[0]!) ?? "", /nie ma obecnie/);
});

test("review flags changed coder direction even while coders continue to disagree", () => {
  const data = fixture();
  data.adjudications = [event()];
  data.codings[1]!.direction = 2;
  assert.match(adjudicationIssue(data, data.adjudications[0]!) ?? "", /zmienione/);
});

test("changing original excerpt text marks adjudication stale", () => {
  const data = fixture();
  data.adjudications = [event()];
  data.excerpts[0]!.text = "modified original text";
  assert.match(adjudicationIssue(data, data.adjudications[0]!) ?? "", /Fragment/);
});

test("downgrading verification invalidates a previously admissible review", () => {
  const data = fixture();
  data.adjudications = [event()];
  data.excerpts[0]!.verificationStatus = "checked";
  assert.ok(adjudicationIssue(data, data.adjudications[0]!));
});
