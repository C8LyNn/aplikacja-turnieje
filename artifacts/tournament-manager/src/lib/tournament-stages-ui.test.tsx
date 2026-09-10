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
  balancedGroupSizes,
  buildStagePlan,
  canShowStageActions,
  copyStageDraftForNextStage,
  createStageDraft,
  filterMatchesForStage,
  groupAdvancingCount,
  groupLabelFromIndex,
  previewBracketPairs,
  previewGroupSeedPlacement,
  stageOutputParticipantCount,
  singleEliminationAdvancingOptions,
  singleEliminationStageMetrics,
  synchronizeStageParticipantFlow,
  validateStageDrafts,
  withOptionalStagePlan,
  type StageDraft,
} from "./tournament-stages-ui";
import {
  getDeadlockEffectiveStageBans,
  parseTournamentGameConfig,
} from "@workspace/game-catalog";
import { StagePlanEditor } from "../components/stage-plan-editor";
import { organizerCredentialScreen } from "./organizer-credential-screen";
import { getTournament } from "@workspace/api-client-react";
import {
  clearTournamentAuthHeaders,
  synchronizeTournamentAuthHeaders,
} from "./tournament-auth-hydration";

test("wybiera bezpieczny ekran logowania organizatora na podstawie neutralnego bootstrapu", () => {
  assert.equal(organizerCredentialScreen(null, true), "loading");
  assert.equal(organizerCredentialScreen(null, false), "not_found");
  assert.equal(
    organizerCredentialScreen(
      { exists: true, accessMode: "legacy_upgrade", private: true },
      false,
    ),
    "legacy_upgrade",
  );
  assert.equal(
    organizerCredentialScreen(
      { exists: true, accessMode: "organizer_login", private: true },
      false,
    ),
    "organizer_login",
  );
  assert.equal(
    organizerCredentialScreen(
      { exists: true, accessMode: "admin_recovery", private: true },
      false,
    ),
    "admin_recovery",
  );
  assert.equal(
    organizerCredentialScreen(
      { exists: false, accessMode: null, private: false },
      false,
    ),
    "not_found",
  );
});

test("supports ten stages, rejects eleven, and copies authoring configuration only", () => {
  const first = {
    ...createStageDraft(1, "round_robin"),
    participantCount: 2,
    advancingCount: 2,
    bestOf: 5 as const,
    entrySeedingMethod: "alphabetical" as const,
    additionalHeroBans: ["haze" as const],
  };
  const second = copyStageDraftForNextStage(first, 2);
  assert.equal(second.bestOf, 5);
  assert.equal(second.entrySeedingMethod, "alphabetical");
  assert.deepEqual(second.additionalHeroBans, []);
  assert.notEqual(second.clientId, first.clientId);

  const ten = Array.from({ length: 10 }, (_, index) => ({
    ...createStageDraft(index + 1, index === 9 ? "single_elimination" : "round_robin"),
    participantCount: 2,
    advancingCount: index === 9 ? undefined : 2,
  }));
  assert.equal(validateStageDrafts(ten).length, 0);
  assert.match(validateStageDrafts([...ten, createStageDraft(11)])[0].message, /1 do 10/);
});

test("derives cumulative stage bans without copying inherited bans", () => {
  const parsed = parseTournamentGameConfig({
    gameId: "deadlock",
    configVersion: 1,
    config: {
      stageBans: [
        { stageKey: "stage_1", bannedHeroIds: ["haze", "abrams"] },
        { stageKey: "stage_2", bannedHeroIds: ["wraith"] },
        { stageKey: "stage_3", bannedHeroIds: ["haze", "rem"] },
      ],
    },
  });
  assert.equal(parsed.gameId, "deadlock");
  assert.deepEqual(
    getDeadlockEffectiveStageBans(parsed.config, ["stage_1", "stage_2", "stage_3"], "stage_1"),
    ["haze", "abrams"],
  );
  assert.deepEqual(
    getDeadlockEffectiveStageBans(parsed.config, ["stage_1", "stage_2", "stage_3"], "stage_3"),
    ["haze", "abrams", "wraith", "rem"],
  );
});

test("etykietuje grupy także powyżej Z", () => {
  assert.equal(groupLabelFromIndex(0), "A");
  assert.equal(groupLabelFromIndex(25), "Z");
  assert.equal(groupLabelFromIndex(26), "AA");
});

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
      format === "group_stage"
        ? "snake_groups"
        : format === "single_elimination"
          ? "standard_bracket"
          : "standings_order",
    entrySeedingPolicy: "preserve",
    resultSeedingPolicy: format === "group_stage" ? "rank_bands" : "standings_order",
    randomSeed: null,
    randomRevealOrder: "instant",
    seedingAudit: null,
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

test("buduje elastyczną fazę grupową, w której wszyscy przechodzą dalej", () => {
  const stages: StageDraft[] = [
    {
      ...createStageDraft(1, "group_stage"),
      participantCount: 17,
      groupCount: 4,
      participantsPerGroup: 5,
      qualifiersPerGroup: 5,
    },
    {
      ...createStageDraft(2, "single_elimination"),
      participantCount: 17,
    },
  ];

  assert.deepEqual(balancedGroupSizes(17, 4), [5, 4, 4, 4]);
  assert.equal(groupAdvancingCount(stages[0]), 17);
  const plan = buildStagePlan(stages);
  assert.equal(plan.stages[0].groupCount, 4);
  assert.equal(plan.stages[0].participantsPerGroup, 5);
  assert.equal(plan.stages[0].qualifiersPerGroup, 5);
  assert.equal(plan.stages[1].participantCount, 17);
});

test("wylicza liczbę uczestników następnego etapu z bieżących zasad awansu", () => {
  const groupStage: StageDraft = {
    ...createStageDraft(1, "group_stage"),
    participantCount: 17,
    groupCount: 4,
    qualifiersPerGroup: 5,
  };
  const swissStage: StageDraft = {
    ...createStageDraft(1, "swiss"),
    participantCount: 17,
    advancingCount: 12,
  };

  assert.equal(stageOutputParticipantCount(groupStage), 17);
  assert.equal(stageOutputParticipantCount(swissStage), 12);
  assert.equal(
    stageOutputParticipantCount(createStageDraft(1, "single_elimination")),
    1,
  );
});

test("odrzuca liczbę grup, która utworzyłaby grupę jednoosobową", () => {
  const stages: StageDraft[] = [
    {
      ...createStageDraft(1, "group_stage"),
      participantCount: 17,
      groupCount: 9,
      participantsPerGroup: 2,
      qualifiersPerGroup: 1,
    },
    {
      ...createStageDraft(2, "single_elimination"),
      participantCount: 9,
    },
  ];
  assert.ok(
    validateStageDrafts(stages).some((error) =>
      error.message.includes("każda grupa miała co najmniej 2 osoby"),
    ),
  );
});

test("obsługuje pośrednią drabinkę wyłącznie na granicy pełnej rundy", () => {
  const valid = [
    { ...createStageDraft(1, "single_elimination"), participantCount: 16, advancingCount: 8 },
    { ...createStageDraft(2, "single_elimination"), participantCount: 8 },
  ];
  assert.equal(validateStageDrafts(valid).length, 0);
  for (const advancingCount of [7, 10]) {
    assert.ok(validateStageDrafts([
      { ...valid[0], advancingCount },
      { ...valid[1], participantCount: advancingCount },
    ]).some((error) => error.field === "advancingCount"));
  }
  assert.deepEqual(singleEliminationAdvancingOptions(17), [16, 8, 4, 2, 1]);
  assert.deepEqual(singleEliminationStageMetrics({ participantCount: 17, advancingCount: 16 }), {
    advancingCount: 16,
    rounds: 1,
    matchCount: 1,
    bracketSize: 32,
  });
});

test("przelicza wszystkie dalsze etapy i blokuje ich ręczną liczbę uczestników", () => {
  const stages = synchronizeStageParticipantFlow([
    {
      ...createStageDraft(1, "group_stage"), participantCount: 32,
      groupCount: 8, participantsPerGroup: 4, qualifiersPerGroup: 2,
    },
    { ...createStageDraft(2, "single_elimination"), participantCount: 99, advancingCount: 8 },
    { ...createStageDraft(3, "single_elimination"), participantCount: 99 },
  ]);
  assert.deepEqual(stages.map((stage) => stage.participantCount), [32, 16, 8]);

  const updated = synchronizeStageParticipantFlow([
    { ...stages[0], qualifiersPerGroup: 1 },
    ...stages.slice(1),
  ]);
  assert.deepEqual(updated.map((stage) => stage.participantCount), [32, 8, 4]);

  const html = renderToStaticMarkup(
    <StagePlanEditor stages={stages} errors={[]} onChange={() => undefined} />,
  );
  assert.match(html, /16 uczestników — awansujący z Etapu 1/);
  assert.match(html, /8 uczestników — awansujący z Etapu 2/);
  assert.match(html, /stage-1-participants[^>]*disabled/);
  assert.match(html, /stage-2-participants[^>]*disabled/);
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
        participantCounts={new Map([[2, 99], [3, 16]])}
    />,
  );
  assert.match(html, /Zakończony/);
  assert.match(html, /Aktywny/);
  assert.match(html, /Planowany/);
  assert.match(html, /Faza grupowa/);
  assert.match(html, /16 graczy/);
  assert.doesNotMatch(html, /99 graczy/);
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

for (const count of [2, 5] as const) {
  test(`renderuje widok ${count} grup`, () => {
    const stageId = 10;
    const keys = Array.from({ length: count }, (_, index) =>
      String.fromCharCode(65 + index),
    );
    const groups = keys
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
  assert.match(complete, /Zakończ etap/);
  assert.match(start, /Rozpocznij etap/);
  assert.equal(readonly, "");
});

test("zachowuje payload historycznego kreatora jednoetapowego", () => {
  const legacy: TournamentInput = {
    name: "Legacy",
    format: "swiss",
    swissRounds: 3,
    defaultBestOf: 1,
    organizerPassword: "organizer-pass",
  };
  const payload = withOptionalStagePlan(legacy, false, [
    createStageDraft(1, "swiss"),
  ]);
  assert.strictEqual(payload, legacy);
  assert.equal(payload.stagePlan, undefined);
});

test("rejects a group stage that would pass only one participant to another stage", () => {
  const stages: StageDraft[] = [
    {
      ...createStageDraft(1, "group_stage"),
      clientId: "groups", name: "Groups",
      participantCount: 4, bestOf: 1, groupCount: 1,
      participantsPerGroup: 4, qualifiersPerGroup: 1,
    },
    {
      ...createStageDraft(2, "single_elimination"),
      clientId: "playoff", name: "Playoff",
      participantCount: 2, bestOf: 1,
    },
  ];
  assert.ok(validateStageDrafts(stages).some(
    (error) => error.field === "qualifiersPerGroup" && /co najmniej 2/.test(error.message),
  ));
});


test("zapisuje konfigurowalne seedowanie i rozmieszczenie w payloadzie", () => {
  const stages: StageDraft[] = [
    {
      ...createStageDraft(1, "group_stage"),
      participantCount: 8,
      groupCount: 2,
      participantsPerGroup: 4,
      qualifiersPerGroup: 4,
      entrySeedingMethod: "alphabetical",
      placementMethod: "random",
      resultSeedingMethod: "global_ranking",
      randomSeed: "public-draw-2026",
      randomRevealOrder: "sequential",
    },
    {
      ...createStageDraft(2, "single_elimination"),
      participantCount: 8,
      placementMethod: "standard",
    },
  ];

  const plan = buildStagePlan(stages);
  assert.equal(plan.stages[0].entrySeedingMethod, "alphabetical");
  assert.equal(plan.stages[0].placementMethod, "random");
  assert.equal(plan.stages[0].resultSeedingMethod, "global_ranking");
  assert.equal(plan.stages[0].randomSeed, "public-draw-2026");
  assert.equal(plan.stages[0].randomRevealOrder, "sequential");
});

test("podgląd losowego rozmieszczenia jest deterministyczny", () => {
  const groups: StageDraft = {
    ...createStageDraft(1, "group_stage"),
    participantCount: 17,
    groupCount: 4,
    qualifiersPerGroup: 5,
    placementMethod: "random",
    randomSeed: "same-seed",
  };
  assert.deepEqual(previewGroupSeedPlacement(groups), previewGroupSeedPlacement(groups));

  const bracket: StageDraft = {
    ...createStageDraft(1, "single_elimination"),
    participantCount: 17,
    placementMethod: "random",
    randomSeed: "same-seed",
  };
  assert.deepEqual(previewBracketPairs(bracket), previewBracketPairs(bracket));
});

test("wymaga klucza dla losowego seedowania lub rozmieszczenia", () => {
  const stage = {
    ...createStageDraft(1, "single_elimination"),
    entrySeedingMethod: "random" as const,
    randomSeed: "",
  };
  assert.ok(validateStageDrafts([stage]).some((error) => error.field === "randomSeed"));
});

test("domyślnie zachowuje dotychczasowe seedy uczestników", () => {
  const firstStage = createStageDraft(1, "swiss");
  const laterStage = createStageDraft(2, "single_elimination");

  assert.equal(firstStage.entrySeedingMethod, "preserve");
  assert.equal(laterStage.entrySeedingMethod, "preserve");

  const plan = buildStagePlan([createStageDraft(1, "single_elimination")]);
  assert.equal(plan.stages[0]?.entrySeedingMethod, "preserve");
});

test("odĹ›wieĹĽenie hydratyzuje token organizatora przed pierwszym requestem i czyĹ›ci go po wylogowaniu", async () => {
  const storage = new Map<string, string>();
  const tournamentId = 42;
  const storageKey = `tm_org_${tournamentId}`;
  const token = "persisted-organizer-token";
  storage.set(storageKey, token);
  const capturedHeaders: Headers[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_input, init) => {
    capturedHeaders.push(new Headers(init?.headers));
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    synchronizeTournamentAuthHeaders(
      tournamentId,
      (id) => storage.get(`tm_org_${id}`) ?? null,
      () => null,
    );
    await getTournament(tournamentId);
    assert.equal(capturedHeaders.at(-1)?.get("x-organizer-token"), token);

    storage.delete(storageKey);
    synchronizeTournamentAuthHeaders(
      tournamentId,
      (id) => storage.get(`tm_org_${id}`) ?? null,
      () => null,
    );
    await getTournament(tournamentId);
    assert.equal(capturedHeaders.at(-1)?.has("x-organizer-token"), false);
  } finally {
    clearTournamentAuthHeaders();
    globalThis.fetch = originalFetch;
  }
});
