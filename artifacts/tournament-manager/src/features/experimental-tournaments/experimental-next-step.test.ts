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

test("V5.8: one draft rule for the tournament page and the host — fewer than 2 participants asks for participants", async () => {
  const { experimentalDraftNextStep } = await import("./experimental-next-step");
  const diagnostics = { kind: "stage_preparation", title: "Etap wymaga przygotowania" };
  assert.equal(experimentalDraftNextStep(diagnostics, { tournamentStatus: "draft", participantCount: 0, tournamentId: 5 })?.title, "Dodaj uczestników");
  assert.match(String((experimentalDraftNextStep(diagnostics, { tournamentStatus: "draft", participantCount: 1, tournamentId: 5 }) as { description?: string })?.description), /Masz 1 uczestnika/);
  assert.equal((experimentalDraftNextStep(diagnostics, { tournamentStatus: "draft", participantCount: 0, tournamentId: 5 }) as { actionHref?: string })?.actionHref, "/tournaments/5?tab=players");
  assert.equal(experimentalDraftNextStep(diagnostics, { tournamentStatus: "draft", participantCount: 4, tournamentId: 5 })?.title, "Etap wymaga przygotowania", "enough participants: the engine's step stays");
  assert.equal(experimentalDraftNextStep(diagnostics, { tournamentStatus: "draft", participantCount: undefined, tournamentId: 5 })?.title, "Etap wymaga przygotowania", "unknown count: no guess");
  assert.equal(experimentalDraftNextStep({ kind: "active_matches", title: "Liga" }, { tournamentStatus: "active", participantCount: 0, tournamentId: 5 })?.title, "Rozegraj mecze · Liga");
});
