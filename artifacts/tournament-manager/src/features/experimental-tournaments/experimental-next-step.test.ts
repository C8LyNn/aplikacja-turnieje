import assert from "node:assert/strict";
import { test } from "node:test";
import { experimentalNextStep } from "./experimental-next-step";

test("next step titles name the action, other fields are kept", () => {
  assert.equal(experimentalNextStep({ kind: "active_matches", title: "Etap 1", stageId: 3 }).title, "Rozegraj mecze · Etap 1");
  assert.equal(experimentalNextStep({ kind: "active_matches", title: "Etap 1", stageId: 3 }).stageId, 3);
  assert.equal(experimentalNextStep({ kind: "planned_stage", title: "Play-off" }).title, "Rozpocznij etap · Play-off");
  assert.equal(experimentalNextStep({ kind: "next_stage", title: "Finał" }).title, "Rozpocznij kolejny etap · Finał");
  assert.equal(experimentalNextStep({ kind: "completed", title: "Turniej zakończony" }).title, "Turniej zakończony");
  assert.equal(experimentalNextStep(undefined), undefined);
});
