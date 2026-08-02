import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type {
  Match,
  StageGroup,
  StageParticipant,
  TournamentInput,
  TournamentStage,
  TournamentStageDetails,
} from "@workspace/api-client-react";
import {
  PlannedStageParticipants,
  StageActionBar,
  StageGroupTables,
  StageNavigation,
} from "../components/tournament-stages-panel";
import {
  buildStagePlan,
  canShowStageActions,
  createStageDraft,
  filterMatchesForStage,
  validateStageDrafts,
  withOptionalStagePlan,
  type StageDraft,
} from "./tournament-stages-ui";

type MatchStageIdIsRequired = {} extends Pick<Match, "stageId">
  ? false
  : true;
const matchStageIdIsRequired: MatchStageIdIsRequired = true;
void matchStageIdIsRequired;

function stage(
  id: number,
  position: number,
  status: TournamentStage["status"],
  format: TournamentStage["format"] = "swiss",
): TournamentStage {
  return {
    id,
    tournamentId: 1,
    stageKey: `stage_${position}`,
    position,
    name: `Etap ${position}`,
    format,
    status,
    participantCount: 8,
    bestOf: 3,
    plannedRounds: format === "swiss" ? 3 : null,
    currentRound: null,
    totalRounds: null,
    rankingPolicy:
      format === "group_stage"
        ? "group_v1"
        : format === "single_elimination"
          ? "elimination_bracket_v1"
          : format === "round_robin"
            ? "round_robin_v1"
            : "swiss_v1",
    qualificationMode: status === "completed" ? "top_n" : "none",
    advancingCount: null,
    groupCount: format === "group_stage" ? 2 : null,
    participantsPerGroup: format === "group_stage" ? 4 : null,
    qualifiersPerGroup: format === "group_stage" ? 2 : null,
    seedingPolicy:
      format === "group_stage" ? "snake_groups" : "standings_order",
    winnerId: null,
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    startedAt: null,
    completedAt: null,
  };
}

function group(
  id: number,
  stageId: number,
  key: StageGroup["groupKey"],
  position: number,
): StageGroup {
  return {
    id,
    stageId,
    groupKey: key,
    position,
    participantCount: 4,
    qualifiersCount: 2,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function participant(
  id: number,
  stageId: number,
  groupId: number,
  groupKey: StageParticipant["groupKey"],
  groupRank: number,
): StageParticipant {
  return {
    id,
    tournamentId: 1,
    stageId,
    playerId: id,
    playerName: `Gracz ${id}`,
    stageSeed: id,
    groupId,
    groupKey,
    status: groupRank <= 2 ? "qualified" : "eliminated",
    qualificationSource: "registration",
    finalRank: null,
    groupRank,
    qualificationRank: groupRank <= 2 ? groupRank : null,
    nextStageSeed: groupRank <= 2 ? id : null,
    sourceStageParticipantId: null,
    qualifiedAt: groupRank <= 2 ? "2026-01-02T00:00:00.000Z" : null,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

test("buduje payload planu jednoetapowego", () => {
  const only = {
    ...createStageDraft(1, "single_elimination"),
    participantCount: 8,
    bestOf: 3 as const,
  };
  const plan = buildStagePlan([only]);
  assert.equal(plan.initialParticipantCount, 8);
  assert.deepEqual(
    plan.stages.map(({ position, format, bestOf }) => ({
      position,
      format,
      bestOf,
    })),
    [{ position: 1, format: "single_elimination", bestOf: 3 }],
  );
});

test("buduje payload planu trzech etapów", () => {
  const stages: StageDraft[] = [
    {
      ...createStageDraft(1, "swiss"),
      participantCount: 16,
      rounds: 4,
      advancingCount: 8,
    },
    {
      ...createStageDraft(2, "group_stage"),
      participantCount: 8,
      groupCount: 2,
      participantsPerGroup: 4,
      qualifiersPerGroup: 2,
      bestOf: 3,
    },
    {
      ...createStageDraft(3, "single_elimination"),
      participantCount: 4,
      bestOf: 5,
    },
  ];
  const plan = buildStagePlan(stages);
  assert.deepEqual(
    plan.stages.map((item) => item.format),
    ["swiss", "group_stage", "single_elimination"],
  );
  assert.equal(plan.stages[0].advancingCount, 8);
  assert.equal(plan.stages[1].qualifiersPerGroup, 2);
  assert.equal(plan.stages[2].participantCount, 4);
});

test("odrzuca Single Elimination przed ostatnim etapem", () => {
  const invalid = [
    { ...createStageDraft(1, "single_elimination"), participantCount: 8 },
    { ...createStageDraft(2, "round_robin"), participantCount: 4 },
  ];
  assert.ok(
    validateStageDrafts(invalid).some((error) =>
      error.message.includes("wyłącznie ostatnim"),
    ),
  );
});

test("renderuje listę etapów i statusy planned, active, completed", () => {
  const html = renderToStaticMarkup(
    <StageNavigation
      stages={[
        stage(1, 1, "completed"),
        stage(2, 2, "active", "group_stage"),
        stage(3, 3, "planned", "single_elimination"),
      ]}
      selectedStageId={2}
      onSelect={() => undefined}
    />,
  );
  assert.match(html, /Ukończony/);
  assert.match(html, /Aktywny/);
  assert.match(html, /Planowany/);
  assert.match(html, /Faza grupowa/);
});

test("opisuje uczestników planowanego pierwszego etapu zgodnie z listą graczy", () => {
  const empty = renderToStaticMarkup(
    <PlannedStageParticipants stagePosition={1} participants={[]} />,
  );
  assert.match(empty, /pochodzą z listy graczy turnieju/);
  assert.doesNotMatch(empty, /kwalifikacji z poprzedniego etapu/);

  const populated = renderToStaticMarkup(
    <PlannedStageParticipants
      stagePosition={1}
      participants={[participant(1, 10, 1, "A", 1)]}
    />,
  );
  assert.match(populated, /Gracz 1/);
  assert.doesNotMatch(populated, /Dodaj graczy/);
});

test("zachowuje komunikat kwalifikacyjny dla późniejszego planowanego etapu", () => {
  const html = renderToStaticMarkup(
    <PlannedStageParticipants stagePosition={2} participants={[]} />,
  );
  assert.match(html, /kwalifikacji z poprzedniego etapu/);
  assert.doesNotMatch(html, /listy graczy turnieju/);
});

test("filtruje mecze po wymaganym stageId bez lokalnego fallbacku", () => {
  const first: Match = {
    id: 1,
    tournamentId: 1,
    stageId: 10,
    round: 1,
    matchNumber: 1,
    bestOf: 1,
    status: "pending",
  };
  const second: Match = { ...first, id: 2, stageId: 20 };
  const grouped: Match = { ...first, id: 3, stageGroupId: 30 };
  assert.deepEqual(filterMatchesForStage([first, second, grouped], 10), [
    first,
    grouped,
  ]);
  assert.equal(first.stageGroupId, undefined);
  assert.equal(grouped.stageGroupId, 30);
});

for (const count of [2, 4] as const) {
  test(`renderuje widok ${count} grup`, () => {
    const stageId = 10;
    const keys = ["A", "B", "C", "D"] as const;
    const groups = keys
      .slice(0, count)
      .map((key, index) => group(index + 1, stageId, key, index + 1));
    const participants = groups.flatMap((entry) =>
      [1, 2, 3, 4].map((rank) =>
        participant(
          entry.id * 10 + rank,
          stageId,
          entry.id,
          entry.groupKey,
          rank,
        ),
      ),
    );
    const details: TournamentStageDetails = {
      stage: {
        ...stage(stageId, 1, "completed", "group_stage"),
        groupCount: count,
      },
      groups,
      participants,
      ranking: participants,
      qualifiers: participants.filter((entry) => entry.status === "qualified"),
    };
    const html = renderToStaticMarkup(
      <StageGroupTables details={details} matches={[]} />,
    );
    assert.match(html, new RegExp(`${count} grup etapu`));
    for (const entry of groups)
      assert.match(html, new RegExp(`Grupa ${entry.groupKey}`));
  });
}

test("pokazuje CompleteStage i StartStage tylko organizatorowi z tokenem", () => {
  assert.equal(canShowStageActions("organizer", true), true);
  assert.equal(canShowStageActions("viewer", false), false);
  assert.equal(canShowStageActions("support", false), false);
  const complete = renderToStaticMarkup(
    <StageActionBar
      canManage
      stage={stage(1, 1, "active")}
      mayStart={false}
      pending={false}
      onComplete={() => undefined}
      onStart={() => undefined}
    />,
  );
  const start = renderToStaticMarkup(
    <StageActionBar
      canManage
      stage={stage(2, 2, "planned")}
      mayStart
      pending={false}
      onComplete={() => undefined}
      onStart={() => undefined}
    />,
  );
  const readonly = renderToStaticMarkup(
    <StageActionBar
      canManage={false}
      stage={stage(1, 1, "active")}
      mayStart={false}
      pending={false}
      onComplete={() => undefined}
      onStart={() => undefined}
    />,
  );
  assert.match(complete, /Zakończ aktywny etap/);
  assert.match(start, /Uruchom ten etap/);
  assert.equal(readonly, "");
});

test("zachowuje payload historycznego kreatora jednoetapowego", () => {
  const legacy: TournamentInput = {
    name: "Legacy",
    format: "swiss",
    swissRounds: 3,
    defaultBestOf: 1,
  };
  const payload = withOptionalStagePlan(legacy, false, [
    createStageDraft(1, "swiss"),
  ]);
  assert.strictEqual(payload, legacy);
  assert.equal(payload.stagePlan, undefined);
});
