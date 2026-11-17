import test from "node:test";
import assert from "node:assert/strict";
import {
  audienceSectionsFor,
  chooseViewStage,
  primarySectionFor,
  resolveAudienceSection,
  roundHeading,
} from "./audience-views";

const stage = (id: number, position: number, format: string, status: string) => ({ id, position, format, status, name: `Etap ${position}` }) as never;

test("group stage: groups and their matches, never a bracket", () => {
  const ids = audienceSectionsFor({ format: "group_stage" } as never).map((section) => section.id);
  assert.deepEqual(ids, ["live", "table", "matches", "players", "stats"]);
  assert.equal(audienceSectionsFor({ format: "group_stage" } as never)[1].label, "Grupy");
  assert.equal(resolveAudienceSection("bracket", { format: "group_stage" } as never, false), "table", "old bracket links land on the groups");
});

test("league, Swiss, brackets get their own primary view and labels", () => {
  assert.deepEqual(audienceSectionsFor({ format: "round_robin" } as never).map((s) => s.label), ["Na żywo", "Tabela", "Terminarz", "Uczestnicy", "Statystyki"]);
  assert.deepEqual(audienceSectionsFor({ format: "swiss" } as never).map((s) => s.label), ["Na żywo", "Ranking", "Rundy", "Uczestnicy", "Statystyki"]);
  assert.deepEqual(audienceSectionsFor({ format: "double_elimination" } as never).map((s) => s.id), ["live", "bracket", "matches", "players", "stats"]);
  assert.equal(primarySectionFor({ format: "round_robin" } as never, false), "table");
  assert.equal(primarySectionFor({ format: "single_elimination" } as never, false), "bracket");
  assert.equal(primarySectionFor({ format: "single_elimination" } as never, true), "live", "a live match wins");
});

test("legacy section names keep working", () => {
  assert.equal(resolveAudienceSection("standings", { format: "swiss" } as never, false), "stats");
  assert.equal(resolveAudienceSection("stages", { format: "swiss" } as never, false), "stages");
  assert.equal(resolveAudienceSection("table", { format: "single_elimination" } as never, false), "bracket", "a bracket has no table");
  assert.equal(resolveAudienceSection(null, undefined, false), "live");
});

test("shown stage: URL, then active, then last finished, then the first planned", () => {
  const stages = [stage(1, 1, "group_stage", "completed"), stage(2, 2, "single_elimination", "active"), stage(3, 3, "single_elimination", "planned")];
  assert.equal(chooseViewStage(stages, null, 2)?.id, 2);
  assert.equal(chooseViewStage(stages, 1, 2)?.id, 1, "history stays reachable");
  assert.equal(chooseViewStage(stages, 3, 2)?.id, 3, "a planned stage can be previewed");
  const finished = [stage(1, 1, "group_stage", "completed"), stage(2, 2, "single_elimination", "completed")];
  assert.equal(chooseViewStage(finished, null, null)?.id, 2);
  assert.equal(chooseViewStage([stage(1, 1, "swiss", "planned")], null, null)?.id, 1);
  assert.equal(chooseViewStage([], null, null), undefined);
});

test("round headings: league rounds are matchdays", () => {
  assert.equal(roundHeading("round_robin", 3), "Kolejka 3");
  assert.equal(roundHeading("swiss", 3), "Runda 3");
});
