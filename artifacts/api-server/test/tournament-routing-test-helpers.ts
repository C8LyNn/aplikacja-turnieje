import assert from "node:assert/strict";
import {
  TOURNAMENT_ENGINE_MODEL_VERSION,
  compileTournamentBlueprintV2,
  entryPointKeyV2,
  validateCompiledTournamentRoutingPlanV2,
  type CompiledParticipantRouteV2,
  type CompiledRoutingConditionV2,
  type CompiledRoutingProblemCodeV2,
  type CompiledTournamentRoutingPlanV2,
  type StageFormatEngineV2,
  type TournamentBlueprintV2,
} from "../src/domain/tournament/v2/index";

export function minimalBlueprint(
  formatId: TournamentBlueprintV2["stages"][number]["format"]["id"] =
    "single_elimination",
  participantCount = 4,
): TournamentBlueprintV2 {
  return {
    modelVersion: TOURNAMENT_ENGINE_MODEL_VERSION,
    initialParticipantCount: participantCount,
    buckets: [
      {
        key: "default",
        name: "All participants",
        exactCapacity: participantCount,
        priority: 0,
      },
    ],
    stages: [
      {
        key: "playoff",
        name: "Play-off",
        displayOrder: 1,
        capacity: { type: "exact", count: participantCount },
        format: { id: formatId, rulesVersion: 1, settings: {} },
        matchRules: { bestOf: 3 },
        classification: { type: "format_default", policyId: "test" },
      },
    ],
    transitions: [
      {
        key: "registration-to-playoff",
        source: { type: "registration", bucketKey: "default" },
        target: { stageKey: "playoff" },
        selection: { type: "all" },
        seedAssignment: { type: "preserve" },
        placement: { type: "format_default" },
        reservedSlots: participantCount,
        priority: 0,
      },
    ],
  };
}

export function directAndQualifiedBlueprint(): TournamentBlueprintV2 {
  return {
    modelVersion: TOURNAMENT_ENGINE_MODEL_VERSION,
    initialParticipantCount: 12,
    buckets: [
      {
        key: "open",
        name: "Open qualifier",
        exactCapacity: 8,
        priority: 1,
      },
      {
        key: "direct",
        name: "Direct invitations",
        exactCapacity: 4,
        priority: 0,
      },
    ],
    stages: [
      {
        key: "qualifier",
        name: "Qualifier",
        displayOrder: 1,
        capacity: { type: "exact", count: 8 },
        format: {
          id: "single_elimination",
          rulesVersion: 1,
          settings: {},
        },
        matchRules: { bestOf: 1 },
        classification: {
          type: "format_default",
          policyId: "elimination",
        },
      },
      {
        key: "main",
        name: "Main event",
        displayOrder: 2,
        capacity: { type: "exact", count: 12 },
        entryPoints: [
          {
            key: "qualified",
            name: "Qualified",
            capacity: { type: "exact", count: 8 },
            priority: 1,
            completeness: { type: "exact" },
          },
          {
            key: "direct",
            name: "Direct",
            capacity: { type: "exact", count: 4 },
            priority: 0,
            completeness: { type: "exact" },
          },
        ],
        format: {
          id: "single_elimination",
          rulesVersion: 1,
          settings: {},
        },
        matchRules: { bestOf: 3 },
        classification: {
          type: "format_default",
          policyId: "elimination",
        },
      },
    ],
    transitions: [
      {
        key: "open-to-qualifier",
        source: { type: "registration", bucketKey: "open" },
        target: { stageKey: "qualifier" },
        selection: { type: "all" },
        seedAssignment: { type: "preserve" },
        placement: { type: "format_default" },
        reservedSlots: 8,
        priority: 0,
      },
      {
        key: "qualified-to-main",
        source: { type: "stage_result", stageKey: "qualifier" },
        target: { stageKey: "main", entryPoint: "qualified" },
        selection: { type: "top_n", count: 8 },
        seedAssignment: { type: "preserve" },
        placement: { type: "format_default" },
        reservedSlots: 8,
        priority: 1,
      },
      {
        key: "direct-to-main",
        source: { type: "registration", bucketKey: "direct" },
        target: { stageKey: "main", entryPoint: "direct" },
        selection: { type: "all" },
        seedAssignment: { type: "fixed_range", firstSeed: 1 },
        placement: { type: "format_default" },
        reservedSlots: 4,
        priority: 0,
      },
    ],
  };
}

export function requireCompiled(
  result: ReturnType<typeof compileTournamentBlueprintV2>,
): CompiledTournamentRoutingPlanV2 {
  assert.equal(
    result.valid,
    true,
    result.valid ? undefined : JSON.stringify(result.problems, null, 2),
  );
  if (!result.valid) throw new Error("Compilation unexpectedly failed.");
  return result.value;
}

export function compilationCauseCodes(
  result: ReturnType<typeof compileTournamentBlueprintV2>,
): string[] {
  assert.equal(result.valid, false);
  return result.valid
    ? []
    : result.problems.map((problem) => problem.causeCode ?? problem.code);
}

export function validationCodes(
  plan: unknown,
): CompiledRoutingProblemCodeV2[] {
  const result = validateCompiledTournamentRoutingPlanV2(plan);
  assert.equal(result.valid, false);
  return result.valid ? [] : result.problems.map((problem) => problem.code);
}

export const simpleFormatEngine: StageFormatEngineV2 = {
  formatId: "custom:test",
  rulesVersion: 1,
  compile({ stageKey, keys }) {
    const opening = keys.logicalMatch("opening");
    const final = keys.logicalMatch("final");
    const eliminated = keys.output("eliminated");
    const champion = keys.output("champion");
    return {
      logicalMatches: [
        { matchKey: opening, stageKey, name: "Opening", order: 0, slots: [1, 2] },
        { matchKey: final, stageKey, name: "Final", order: 1, slots: [1, 2] },
      ],
      outputs: [
        {
          stageKey,
          outputKey: champion,
          name: "Champion",
          exactCapacity: 1,
          priority: 0,
        },
        {
          stageKey,
          outputKey: eliminated,
          name: "Eliminated",
          exactCapacity: 1,
          priority: 1,
        },
      ],
      routes: [
        {
          routeKey: keys.route("entry-1-to-opening-1"),
          source: {
            type: "stage_entry",
            stageKey,
            entryKey: keys.entryPoint("default"),
            position: 1,
          },
          target: { type: "match_slot", stageKey, matchKey: opening, slot: 1 },
          reservedSlots: 1,
          priority: 0,
          order: 0,
          condition: { type: "always" },
        },
        {
          routeKey: keys.route("entry-2-to-opening-2"),
          source: {
            type: "stage_entry",
            stageKey,
            entryKey: keys.entryPoint("default"),
            position: 2,
          },
          target: { type: "match_slot", stageKey, matchKey: opening, slot: 2 },
          reservedSlots: 1,
          priority: 0,
          order: 1,
          condition: { type: "always" },
        },
        {
          routeKey: keys.route("entry-3-to-final-2"),
          source: {
            type: "stage_entry",
            stageKey,
            entryKey: keys.entryPoint("default"),
            position: 3,
          },
          target: { type: "match_slot", stageKey, matchKey: final, slot: 2 },
          reservedSlots: 1,
          priority: 0,
          order: 2,
          condition: { type: "always" },
        },
        {
          routeKey: keys.route("opening-winner-to-final"),
          source: {
            type: "match_outcome",
            stageKey,
            matchKey: opening,
            outcome: "winner",
          },
          target: { type: "match_slot", stageKey, matchKey: final, slot: 1 },
          reservedSlots: 1,
          priority: 0,
          order: 3,
          condition: { type: "always" },
        },
        {
          routeKey: keys.route("opening-loser-to-output"),
          source: {
            type: "match_outcome",
            stageKey,
            matchKey: opening,
            outcome: "loser",
          },
          target: { type: "stage_output", stageKey, outputKey: eliminated },
          reservedSlots: 1,
          priority: 0,
          order: 4,
          condition: { type: "always" },
        },
        {
          routeKey: keys.route("final-winner-to-output"),
          source: {
            type: "match_outcome",
            stageKey,
            matchKey: final,
            outcome: "winner",
          },
          target: { type: "stage_output", stageKey, outputKey: champion },
          reservedSlots: 1,
          priority: 0,
          order: 5,
          condition: { type: "always" },
        },
      ],
    };
  },
};

export const gslFixtureEngine: StageFormatEngineV2 = {
  formatId: "gsl_groups",
  rulesVersion: 1,
  compile({ stageKey, keys }) {
    const opening1 = keys.logicalMatch("opening-1");
    const opening2 = keys.logicalMatch("opening-2");
    const winners = keys.logicalMatch("winners");
    const elimination = keys.logicalMatch("elimination");
    const decider = keys.logicalMatch("decider");
    const qualified1 = keys.output("qualified-1");
    const qualified2 = keys.output("qualified-2");
    const routes: CompiledParticipantRouteV2[] = [];
    const always = { type: "always" as const };
    const addEntry = (
      position: number,
      matchKey: typeof opening1,
      slot: 1 | 2,
    ): void => {
      routes.push({
        routeKey: keys.route(`entry-${position}`),
        source: {
          type: "stage_entry",
          stageKey,
          entryKey: keys.entryPoint("default"),
          position,
        },
        target: { type: "match_slot", stageKey, matchKey, slot },
        reservedSlots: 1,
        priority: 0,
        order: routes.length,
        condition: always,
      });
    };
    const addOutcome = (
      localKey: string,
      matchKey: typeof opening1,
      outcome: "winner" | "loser",
      target:
        | { type: "match_slot"; matchKey: typeof opening1; slot: 1 | 2 }
        | { type: "stage_output"; outputKey: typeof qualified1 },
    ): void => {
      routes.push({
        routeKey: keys.route(localKey),
        source: { type: "match_outcome", stageKey, matchKey, outcome },
        target:
          target.type === "match_slot"
            ? { type: "match_slot", stageKey, matchKey: target.matchKey, slot: target.slot }
            : { type: "stage_output", stageKey, outputKey: target.outputKey },
        reservedSlots: 1,
        priority: 0,
        order: routes.length,
        condition: always,
      });
    };

    addEntry(1, opening1, 1);
    addEntry(4, opening1, 2);
    addEntry(2, opening2, 1);
    addEntry(3, opening2, 2);
    addOutcome("opening-1-winner", opening1, "winner", {
      type: "match_slot", matchKey: winners, slot: 1,
    });
    addOutcome("opening-2-winner", opening2, "winner", {
      type: "match_slot", matchKey: winners, slot: 2,
    });
    addOutcome("opening-1-loser", opening1, "loser", {
      type: "match_slot", matchKey: elimination, slot: 1,
    });
    addOutcome("opening-2-loser", opening2, "loser", {
      type: "match_slot", matchKey: elimination, slot: 2,
    });
    addOutcome("winners-loser", winners, "loser", {
      type: "match_slot", matchKey: decider, slot: 1,
    });
    addOutcome("elimination-winner", elimination, "winner", {
      type: "match_slot", matchKey: decider, slot: 2,
    });
    addOutcome("winners-winner", winners, "winner", {
      type: "stage_output", outputKey: qualified1,
    });
    addOutcome("decider-winner", decider, "winner", {
      type: "stage_output", outputKey: qualified2,
    });

    return {
      logicalMatches: [
        { matchKey: opening1, stageKey, order: 0, slots: [1, 2] },
        { matchKey: opening2, stageKey, order: 1, slots: [1, 2] },
        { matchKey: winners, stageKey, order: 2, slots: [1, 2] },
        { matchKey: elimination, stageKey, order: 3, slots: [1, 2] },
        { matchKey: decider, stageKey, order: 4, slots: [1, 2] },
      ],
      outputs: [
        { stageKey, outputKey: qualified1, exactCapacity: 1, priority: 0 },
        { stageKey, outputKey: qualified2, exactCapacity: 1, priority: 1 },
      ],
      routes,
    };
  },
};

/**
 * Representative fixture only: it proves internal upper/lower routing and
 * grand-final branching. It is not a production double-elimination generator.
 */
export const partialDoubleEliminationFixtureEngine: StageFormatEngineV2 = {
  formatId: "double_elimination",
  rulesVersion: 1,
  compile({ stageKey, keys }) {
    const upper1 = keys.logicalMatch("upper-1");
    const upper2 = keys.logicalMatch("upper-2");
    const upperFinal = keys.logicalMatch("upper-final");
    const lower1 = keys.logicalMatch("lower-1");
    const lowerFinal = keys.logicalMatch("lower-final");
    const grandFinal = keys.logicalMatch("grand-final");
    const finalResolution = keys.logicalMatch("final-resolution");
    const champion = keys.output("champion");
    const upperToGrand = keys.route("upper-final-winner-to-grand");
    const lowerToGrand = keys.route("lower-final-winner-to-grand");
    const always = { type: "always" as const };
    const lowerWinsCondition: CompiledRoutingConditionV2 = {
      type: "match_winner_lineage",
      matchKey: grandFinal,
      lineage: { type: "route", routeKey: lowerToGrand },
    };
    const routes: CompiledParticipantRouteV2[] = [];
    const add = (
      route: Omit<CompiledParticipantRouteV2, "order" | "priority">,
    ): void => {
      routes.push({ ...route, priority: 0, order: routes.length });
    };
    const entry = (
      position: number,
      matchKey: typeof upper1,
      slot: 1 | 2,
    ): void => add({
      routeKey: keys.route(`entry-${position}`),
      source: {
        type: "stage_entry",
        stageKey,
        entryKey: entryPointKeyV2("default"),
        position,
      },
      target: { type: "match_slot", stageKey, matchKey, slot },
      reservedSlots: 1,
      condition: always,
    });
    const outcome = (
      key: string,
      sourceMatch: typeof upper1,
      result: "winner" | "loser",
      targetMatch: typeof upper1,
      slot: 1 | 2,
      routeKey = keys.route(key),
    ): void => add({
      routeKey,
      source: {
        type: "match_outcome",
        stageKey,
        matchKey: sourceMatch,
        outcome: result,
      },
      target: { type: "match_slot", stageKey, matchKey: targetMatch, slot },
      reservedSlots: 1,
      condition: always,
    });

    entry(1, upper1, 1);
    entry(4, upper1, 2);
    entry(2, upper2, 1);
    entry(3, upper2, 2);
    outcome("upper-1-winner", upper1, "winner", upperFinal, 1);
    outcome("upper-2-winner", upper2, "winner", upperFinal, 2);
    outcome("upper-1-loser", upper1, "loser", lower1, 1);
    outcome("upper-2-loser", upper2, "loser", lower1, 2);
    outcome("lower-1-winner", lower1, "winner", lowerFinal, 1);
    outcome("upper-final-loser", upperFinal, "loser", lowerFinal, 2);
    outcome(
      "upper-final-winner-to-grand",
      upperFinal,
      "winner",
      grandFinal,
      1,
      upperToGrand,
    );
    outcome(
      "lower-final-winner-to-grand",
      lowerFinal,
      "winner",
      grandFinal,
      2,
      lowerToGrand,
    );

    add({
      routeKey: keys.route("grand-winner-to-final-resolution"),
      source: {
        type: "match_outcome",
        stageKey,
        matchKey: grandFinal,
        outcome: "winner",
      },
      target: {
        type: "match_slot",
        stageKey,
        matchKey: finalResolution,
        slot: 1,
      },
      reservedSlots: 1,
      condition: always,
    });
    add({
      routeKey: keys.route("grand-loser-to-final-resolution-if-reset"),
      source: {
        type: "match_outcome",
        stageKey,
        matchKey: grandFinal,
        outcome: "loser",
      },
      target: {
        type: "match_slot",
        stageKey,
        matchKey: finalResolution,
        slot: 2,
      },
      reservedSlots: 1,
      condition: lowerWinsCondition,
    });
    add({
      routeKey: keys.route("final-resolution-winner-to-champion"),
      source: {
        type: "match_outcome",
        stageKey,
        matchKey: finalResolution,
        outcome: "winner",
      },
      target: { type: "stage_output", stageKey, outputKey: champion },
      reservedSlots: 1,
      condition: always,
    });

    return {
      logicalMatches: [
        { matchKey: upper1, stageKey, order: 0, slots: [1, 2] },
        { matchKey: upper2, stageKey, order: 1, slots: [1, 2] },
        { matchKey: upperFinal, stageKey, order: 2, slots: [1, 2] },
        { matchKey: lower1, stageKey, order: 3, slots: [1, 2] },
        { matchKey: lowerFinal, stageKey, order: 4, slots: [1, 2] },
        { matchKey: grandFinal, stageKey, order: 5, slots: [1, 2] },
        { matchKey: finalResolution, stageKey, order: 6, slots: [1, 2] },
      ],
      outputs: [
        { stageKey, outputKey: champion, exactCapacity: 1, priority: 0 },
      ],
      routes,
    };
  },
};
