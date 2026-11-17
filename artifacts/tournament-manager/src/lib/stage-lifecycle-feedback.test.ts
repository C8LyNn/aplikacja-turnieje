import assert from "node:assert/strict";
import { test } from "node:test";
import type { StageStartReadiness } from "@workspace/api-client-react";
import { firstStageNeedsEntrants, stageLifecycleError, stageReadinessFeedback, stageReadinessMessages } from "./stage-lifecycle-feedback";

test("readiness presentation preserves unknown reasons and never turns equal counts into a shortage", () => {
  const readiness: StageStartReadiness = {
    ready: false, reasonCode: "STAGE_PARTICIPANTS_INCONSISTENT", message: "Niepoprawne źródło uczestnika.",
    participantCount: 16, requiredParticipantCount: 16, missingSeeds: [], blockingMatches: 0, blockingGroups: 0,
    format: "single_elimination", basketValidation: { valid: true, problems: [] },
  };
  assert.equal(stageReadinessFeedback(readiness, "Finał").summary, "Finał: Skład lub seedy etapu są niespójne.");
  assert.ok(stageReadinessMessages(readiness).includes(readiness.message));
  const unknown = { ...readiness, reasonCode: "NEW_READINESS_REASON", message: "Sprawdź nowe wymaganie serwera." };
  assert.equal(stageReadinessFeedback(unknown, "Finał").summary, `Finał: ${unknown.message}`);
});

test("diagnostics retain the raw basket explanation as well as formatted counts and stage", () => {
  const readiness: StageStartReadiness = {
    ready: false, reasonCode: "STAGE_BASKET_CONFIGURATION_INVALID", message: "Konfiguracja koszyków jest niespójna.",
    participantCount: 14, requiredParticipantCount: 16, missingSeeds: [], blockingMatches: 0, blockingGroups: 0,
    format: "single_elimination", basketValidation: { valid: false, problems: [{
      code: "STAGE_DERIVED_PARTICIPANT_COUNT_INVALID", message: "Źródło wskazuje niekompletny koszyk eliminacji.",
      context: { stageId: 2, expected: 16, actual: 14 },
    }] },
  };
  const details = stageReadinessMessages(readiness, { stages: [{ id: 2, name: "Finał" }] });
  assert.ok(details.includes(readiness.basketValidation.problems[0].message));
  assert.match(details.join(" "), /Finał:.*Oczekiwano: 16; otrzymano: 14/);
});

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

test("V5.2: an empty first stage asks for entrants instead of showing diagnostics", () => {
  const readiness: StageStartReadiness = {
    ready: false, reasonCode: "STAGE_PARTICIPANTS_INCONSISTENT", message: "Oczekiwana liczba uczestników: 16; dostępni uczestnicy: 0.",
    participantCount: 0, requiredParticipantCount: 16, missingSeeds: [1, 2, 3], blockingMatches: 0, blockingGroups: 0,
    format: "group_stage", basketValidation: { valid: true, problems: [] },
  };
  assert.equal(firstStageNeedsEntrants(readiness, true), true);
  const first = stageReadinessFeedback(readiness, "Faza grupowa", { firstStage: true });
  assert.equal(first.summary, "Faza grupowa: Brakuje uczestników: etap potrzebuje 16, na liście jest 0.");
  assert.equal(first.action, "Dodaj jeszcze 16 w zakładce Gracze.");
  // Later stages keep the routing diagnosis (their entrants come from qualification).
  assert.equal(firstStageNeedsEntrants(readiness, false), false);
  assert.equal(stageReadinessFeedback(readiness, "Finał").summary, "Finał: Liczba uczestników nie odpowiada wymaganiom etapu.");
});
