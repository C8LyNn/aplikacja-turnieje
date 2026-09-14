import assert from "node:assert/strict";
import { test } from "node:test";
import { stageLifecycleError } from "./stage-lifecycle-feedback";

test("maps qualification and routing source-stage conflicts to operator actions", () => {
  const qualification = stageLifecycleError({
    status: 409,
    data: { code: "STAGE_BASKET_QUALIFICATION_STAGE_INCOMPLETE" },
  });
  const routing = stageLifecycleError({
    status: 409,
    data: { code: "STAGE_BASKET_ROUTE_SOURCE_STAGE_NOT_COMPLETED" },
  });
  const staleRanking = stageLifecycleError({
    status: 409,
    data: { code: "RANKING_INCONSISTENT" },
  });

  assert.match(qualification, /zakończ etap źródłowy/);
  assert.match(qualification, /zatwierdź kwalifikację/);
  assert.match(routing, /zakończ etap źródłowy/);
  assert.match(routing, /wykonaj routing/);
  assert.match(staleRanking, /rankingu etapu/);
});
