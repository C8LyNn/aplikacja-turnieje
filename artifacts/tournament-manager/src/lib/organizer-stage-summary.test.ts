import assert from "node:assert/strict";
import { test } from "node:test";
import type { Match, TournamentStage } from "@workspace/api-client-react";
import { organizerStageSummary } from "./organizer-stage-summary";

const stage = (format: TournamentStage["format"], status: TournamentStage["status"] = "active") =>
  ({ id: 1, format, status, currentRound: 1, totalRounds: 3 } as TournamentStage);
const match = (round: number, status: Match["status"], stageId = 1) => ({ round, status, stageId } as Match);

test("classic formats advance from current-stage matches despite stale metadata", () => {
  for (const format of ["round_robin", "single_elimination", "swiss"] as const) {
    assert.equal(organizerStageSummary(stage(format), [match(1, "completed"), match(2, "pending"), match(3, "pending"), match(1, "in_progress", 99)]).roundLabel, "Runda 2/3");
    assert.equal(organizerStageSummary(stage(format), [match(2, "completed"), match(3, "in_progress")]).roundLabel, "Runda 3/3");
  }
});

test("planned and completed stages distinguish future play from the last played round", () => {
  assert.equal(organizerStageSummary(stage("round_robin", "planned"), [match(1, "pending")]).roundLabel, "Etap planowany");
  assert.equal(organizerStageSummary(stage("round_robin", "completed"), [match(3, "completed")]).roundLabel, "Ostatnia runda 3/3");
});

test("independent DE and group schedules do not invent a single current round", () => {
  assert.equal(organizerStageSummary(stage("double_elimination"), [match(2, "pending")]).roundLabel, "Rundy osobno w drabinkach");
  assert.equal(organizerStageSummary(stage("group_stage"), [match(2, "pending")]).roundLabel, "Rundy osobno w grupach");
});

test("missing round data does not expose a stale metadata round or infinity", () => {
  for (const matches of [undefined, [], [match(0, "completed")]]) {
    assert.equal(organizerStageSummary(stage("round_robin"), matches).roundLabel, "Sprawdzanie rundy");
  }
});
