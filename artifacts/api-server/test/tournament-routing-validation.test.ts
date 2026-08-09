import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  entryPointKeyV2,
  formatRouteKeyV2,
  logicalMatchKeyV2,
  routeSourceNodeKeyV2,
  routeTargetNodeKeyV2,
  routingNodeKeyV2,
  stageKeyV2,
  validateCompiledTournamentRoutingPlanV2,
  type CompiledParticipantRouteV2,
  type CompiledTournamentRoutingPlanV2,
} from "../src/domain/tournament/v2/index";
import {
  directAndQualifiedBlueprint,
  minimalBlueprint,
  requireCompiled,
  simpleFormatEngine,
  validationCodes,
} from "./tournament-routing-test-helpers";
import { compileTournamentBlueprintV2 } from "../src/domain/tournament/v2/index";

function validPlan(): CompiledTournamentRoutingPlanV2 {
  return requireCompiled(
    compileTournamentBlueprintV2(
      minimalBlueprint("custom:test"),
      [simpleFormatEngine],
    ),
  );
}

describe("compiled routing structure and references", () => {
  test("detects duplicate route and logical match keys", () => {
    const plan = validPlan();
    assert.ok(
      validationCodes({
        ...plan,
        routes: [...plan.routes, plan.routes[0]],
      }).includes("DUPLICATE_ROUTE_KEY"),
    );
    assert.ok(
      validationCodes({
        ...plan,
        logicalMatches: [...plan.logicalMatches, plan.logicalMatches[0]],
      }).includes("DUPLICATE_LOGICAL_MATCH_KEY"),
    );
  });

  test("detects missing source and target references", () => {
    const plan = validPlan();
    const missingSource = {
      ...plan.routes[0],
      source: {
        type: "registration_bucket",
        bucketKey: "missing",
        selection: { type: "all", exactCardinality: 4 },
      },
    } as unknown as CompiledParticipantRouteV2;
    assert.ok(
      validationCodes({
        ...plan,
        routes: [missingSource, ...plan.routes.slice(1)],
      }).includes("UNKNOWN_REGISTRATION_BUCKET"),
    );

    const missingTarget = {
      ...plan.routes[0],
      target: {
        type: "stage_entry",
        stageKey: stageKeyV2("playoff"),
        entryKey: entryPointKeyV2("missing"),
      },
    } as CompiledParticipantRouteV2;
    assert.ok(
      validationCodes({
        ...plan,
        routes: [missingTarget, ...plan.routes.slice(1)],
      }).includes("UNKNOWN_TARGET_ENTRY_POINT"),
    );
  });

  test("detects occupied slots and match-outcome fan-out", () => {
    const plan = validPlan();
    const winnerRoute = plan.routes.find(
      (route) =>
        route.source.type === "match_outcome" &&
        route.source.outcome === "winner" &&
        route.target.type === "match_slot",
    );
    assert.ok(winnerRoute);
    const duplicateDelivery: CompiledParticipantRouteV2 = {
      ...winnerRoute,
      routeKey: formatRouteKeyV2(stageKeyV2("playoff"), "duplicate"),
    };
    const codes = validationCodes({
      ...plan,
      routes: [...plan.routes, duplicateDelivery],
    });
    assert.ok(codes.includes("TARGET_SLOT_CONFLICT"));
    assert.ok(codes.includes("MATCH_OUTCOME_FAN_OUT"));
  });

  test("validates all nested source, target and condition discriminants", () => {
    const plan = validPlan();
    const route = plan.routes[0];
    const mutations = [
      {
        value: { ...route, source: { type: "mystery_source" } },
        expected: "UNKNOWN_SOURCE_TYPE",
      },
      {
        value: { ...route, target: { type: "mystery_target" } },
        expected: "UNKNOWN_TARGET_TYPE",
      },
      {
        value: { ...route, condition: { type: "mystery_condition" } },
        expected: "UNKNOWN_CONDITION_TYPE",
      },
    ] as const;

    for (const mutation of mutations) {
      const result = validateCompiledTournamentRoutingPlanV2({
        ...plan,
        routes: [
          mutation.value,
          ...plan.routes.slice(1),
        ],
      } as unknown);
      assert.equal(result.valid, false);
      assert.ok(
        !result.valid &&
          result.problems.some((problem) => problem.code === mutation.expected),
      );
    }
  });

  test("rejects unknown match outcome after deserialization", () => {
    const plan = validPlan();
    const index = plan.routes.findIndex(
      (route) => route.source.type === "match_outcome",
    );
    assert.notEqual(index, -1);
    const mutated = structuredClone(plan) as unknown as {
      routes: Array<{ source: { outcome?: string } }>;
    };
    mutated.routes[index].source.outcome = "draw";
    const result = validateCompiledTournamentRoutingPlanV2(mutated);
    assert.equal(result.valid, false);
    assert.ok(
      !result.valid &&
        result.problems.some(
          (problem) => problem.code === "UNKNOWN_MATCH_OUTCOME",
        ),
    );
  });

  test("rejects malformed compiled selections instead of trusting TypeScript", () => {
    const base = requireCompiled(
      compileTournamentBlueprintV2(directAndQualifiedBlueprint()),
    );
    const routeIndex = base.routes.findIndex(
      (route) => route.source.type === "stage_result",
    );
    assert.notEqual(routeIndex, -1);

    const invalidSelections: ReadonlyArray<{
      selection: unknown;
      code: string;
    }> = [
      {
        selection: { type: "mystery_selection", exactCardinality: 8 },
        code: "UNKNOWN_SELECTION_TYPE",
      },
      { selection: { type: "top_n", count: 8 }, code: "INVALID_SELECTION" },
      {
        selection: {
          type: "top_n",
          count: 7,
          exactCardinality: 7,
        },
        code: "SELECTION_CARDINALITY_MISMATCH",
      },
      {
        selection: {
          type: "top_n",
          count: 8,
          exactCardinality: 8,
          outputKey: "contradictory",
        },
        code: "INVALID_SELECTION",
      },
    ];

    for (const invalid of invalidSelections) {
      const mutated = structuredClone(base) as unknown as {
        routes: Array<{ source: { selection?: unknown } }>;
      };
      mutated.routes[routeIndex].source.selection = invalid.selection;
      const result = validateCompiledTournamentRoutingPlanV2(mutated);
      assert.equal(result.valid, false);
      assert.ok(
        !result.valid &&
          result.problems.some((problem) => problem.code === invalid.code),
      );
    }
  });

  test("rejects a forged registration all cardinality", () => {
    const plan = validPlan();
    const mutated = structuredClone(plan) as CompiledTournamentRoutingPlanV2;
    const registration = mutated.routes.find(
      (route) => route.source.type === "registration_bucket",
    );
    assert.ok(registration?.source.type === "registration_bucket");
    registration.source.selection = { type: "all", exactCardinality: 2 };
    const codes = validationCodes(mutated);
    assert.ok(codes.includes("REGISTRATION_BUCKET_CAPACITY_MISMATCH"));
  });

  test("rejects the removed exclusiveGroup field in deserialized plans", () => {
    const plan = structuredClone(validPlan()) as unknown as {
      routes: Array<Record<string, unknown>>;
    };
    plan.routes[0].exclusiveGroup = {
      key: "legacy",
      variant: "a",
    };
    assert.ok(validationCodes(plan).includes("INVALID_STRUCTURE"));
  });

  test("rejects a conditional route directly into an exact entry", () => {
    const plan = requireCompiled(
      compileTournamentBlueprintV2(directAndQualifiedBlueprint()),
    );
    const route = plan.routes.find(
      (candidate) =>
        candidate.source.type === "stage_result" &&
        candidate.target.type === "stage_entry",
    );
    assert.ok(route?.source.type === "stage_result");
    const mutated = structuredClone(plan) as CompiledTournamentRoutingPlanV2;
    const target = mutated.routes.find(
      (candidate) => candidate.routeKey === route.routeKey,
    );
    assert.ok(target?.source.type === "stage_result");
    target.condition = {
      type: "participant_lineage",
      lineage: {
        type: "stage_entry",
        stageKey: target.source.stageKey,
        entryKey: entryPointKeyV2("default"),
      },
    };
    assert.ok(
      validationCodes(mutated).includes("CONDITIONAL_EXACT_ENTRY_ROUTE"),
    );
  });
});

describe("compiled routing graph semantics", () => {
  function conditionPlan(): CompiledTournamentRoutingPlanV2 {
    return structuredClone(validPlan());
  }

  test("rejects a condition referencing its own route", () => {
    const plan = conditionPlan();
    const route = plan.routes.find(
      (candidate) => candidate.target.type === "match_slot",
    );
    assert.ok(route);
    route.condition = {
      type: "participant_lineage",
      lineage: { type: "route", routeKey: route.routeKey },
    };
    assert.ok(validationCodes(plan).includes("CONDITION_SELF_REFERENCE"));
  });

  test("rejects a condition referencing a downstream route", () => {
    const plan = conditionPlan();
    const protectedRoute = plan.routes.find((route) =>
      route.routeKey.includes("opening-winner-to-final"),
    );
    const downstream = plan.routes.find((route) =>
      route.routeKey.includes("final-winner-to-output"),
    );
    assert.ok(protectedRoute);
    assert.ok(downstream);
    protectedRoute.condition = {
      type: "participant_lineage",
      lineage: { type: "route", routeKey: downstream.routeKey },
    };
    assert.ok(
      validationCodes(plan).includes("CONDITION_DEPENDENCY_CYCLE"),
    );
  });

  test("rejects a condition referencing an unrelated route", () => {
    const plan = conditionPlan();
    const protectedRoute = plan.routes.find((route) =>
      route.routeKey.includes("final-winner-to-output"),
    );
    assert.ok(protectedRoute);
    const isolatedMatch = logicalMatchKeyV2(
      stageKeyV2("playoff"),
      "isolated",
    );
    plan.logicalMatches = [
      ...plan.logicalMatches,
      {
        matchKey: isolatedMatch,
        stageKey: stageKeyV2("playoff"),
        order: 99,
        slots: [1, 2],
      },
    ];
    const unrelated: CompiledParticipantRouteV2 = {
      routeKey: formatRouteKeyV2(stageKeyV2("playoff"), "isolated-entry"),
      source: {
        type: "stage_entry",
        stageKey: stageKeyV2("playoff"),
        entryKey: entryPointKeyV2("default"),
        position: 4,
      },
      target: {
        type: "match_slot",
        stageKey: stageKeyV2("playoff"),
        matchKey: isolatedMatch,
        slot: 1,
      },
      reservedSlots: 1,
      priority: 0,
      order: 99,
      condition: { type: "always" },
    };
    plan.routes = [...plan.routes, unrelated];
    plan.dependencies = [
      ...plan.dependencies,
      {
        routeKey: unrelated.routeKey,
        sourceNodeKey: routeSourceNodeKeyV2(unrelated.source),
        targetNodeKey: routeTargetNodeKeyV2(unrelated.target),
      },
    ];
    protectedRoute.condition = {
      type: "participant_lineage",
      lineage: { type: "route", routeKey: unrelated.routeKey },
    };
    assert.ok(validationCodes(plan).includes("CONDITION_NOT_PREDECESSOR"));
  });

  test("rejects a condition referencing a future stage entry", () => {
    const plan = requireCompiled(
      compileTournamentBlueprintV2(directAndQualifiedBlueprint()),
    );
    const protectedRoute = plan.routes.find(
      (route) => route.source.type === "stage_result",
    );
    assert.ok(protectedRoute);
    protectedRoute.condition = {
      type: "participant_lineage",
      lineage: {
        type: "stage_entry",
        stageKey: stageKeyV2("main"),
        entryKey: entryPointKeyV2("qualified"),
      },
    };
    assert.ok(
      validationCodes(plan).includes("CONDITION_CROSS_STAGE_REFERENCE"),
    );
  });

  test("rejects a cycle formed only by condition route references", () => {
    const plan = conditionPlan();
    const [first, second] = plan.routes.filter(
      (route) => route.source.type === "stage_entry",
    );
    assert.ok(first);
    assert.ok(second);
    first.condition = {
      type: "participant_lineage",
      lineage: { type: "route", routeKey: second.routeKey },
    };
    second.condition = {
      type: "participant_lineage",
      lineage: { type: "route", routeKey: first.routeKey },
    };
    assert.ok(
      validationCodes(plan).includes("CONDITION_DEPENDENCY_CYCLE"),
    );
  });

  test("displayOrder remains presentation-only", () => {
    const sameOrder = directAndQualifiedBlueprint();
    sameOrder.stages[1].displayOrder = 1;
    assert.equal(compileTournamentBlueprintV2(sameOrder).valid, true);

    const visuallyInverted = directAndQualifiedBlueprint();
    visuallyInverted.stages[0].displayOrder = 20;
    visuallyInverted.stages[1].displayOrder = 5;
    assert.equal(compileTournamentBlueprintV2(visuallyInverted).valid, true);
  });

  test("rejects a real cyclic stage transition graph", () => {
    const blueprint = directAndQualifiedBlueprint();
    blueprint.stages[0].capacity = { type: "exact", count: 10 };
    blueprint.transitions = [
      ...blueprint.transitions,
      {
        key: "main-back-to-qualifier",
        source: { type: "stage_result", stageKey: "main" },
        target: { stageKey: "qualifier" },
        selection: { type: "top_n", count: 2 },
        seedAssignment: { type: "preserve" },
        placement: { type: "format_default" },
        reservedSlots: 2,
        priority: 2,
      },
    ];
    const result = compileTournamentBlueprintV2(blueprint);
    assert.equal(result.valid, false);
    assert.ok(
      !result.valid &&
        result.problems.some(
          (problem) => problem.causeCode === "CYCLIC_STAGE_GRAPH",
        ),
    );
  });

  test("rejects an actual cycle independently of displayOrder", () => {
    const plan = validPlan();
    const opening = plan.logicalMatches.find((match) =>
      match.matchKey.includes("opening"),
    );
    const final = plan.logicalMatches.find((match) =>
      match.matchKey.includes("final"),
    );
    assert.ok(opening);
    assert.ok(final);
    const cycleRoute: CompiledParticipantRouteV2 = {
      routeKey: formatRouteKeyV2(final.stageKey, "cycle"),
      source: {
        type: "match_outcome",
        stageKey: final.stageKey,
        matchKey: final.matchKey,
        outcome: "loser",
      },
      target: {
        type: "match_slot",
        stageKey: opening.stageKey,
        matchKey: opening.matchKey,
        slot: 1,
      },
      reservedSlots: 1,
      priority: 0,
      order: 99,
      condition: { type: "always" },
    };
    const cycleDependency = {
      routeKey: cycleRoute.routeKey,
      sourceNodeKey: routeSourceNodeKeyV2(cycleRoute.source),
      targetNodeKey: routeTargetNodeKeyV2(cycleRoute.target),
    };
    const codes = validationCodes({
      ...plan,
      routes: [...plan.routes, cycleRoute],
      dependencies: [...plan.dependencies, cycleDependency],
    });
    assert.ok(codes.includes("CYCLIC_ROUTING_GRAPH"));
  });

  test("rejects a forged dependency that points back to a predecessor", () => {
    const plan = validPlan();
    const dependency = plan.dependencies.find(
      (item) => item.sourceNodeKey !== item.targetNodeKey,
    );
    assert.ok(dependency);
    const reverse = {
      routeKey: formatRouteKeyV2(stageKeyV2("playoff"), "reverse-dependency"),
      sourceNodeKey: dependency.targetNodeKey,
      targetNodeKey: dependency.sourceNodeKey,
    };
    const result = validateCompiledTournamentRoutingPlanV2({
      ...plan,
      dependencies: [...plan.dependencies, reverse],
    });
    assert.equal(result.valid, false);
    assert.ok(
      !result.valid &&
        result.problems.some(
          (problem) => problem.code === "INVALID_DEPENDENCY",
        ),
      result.valid ? "unexpected valid plan" : JSON.stringify(result.problems),
    );
  });

  test("does not accept dependencies detached from their route", () => {
    const plan = validPlan();
    const result = validateCompiledTournamentRoutingPlanV2({
      ...plan,
      dependencies: [
        ...plan.dependencies,
        {
          routeKey: formatRouteKeyV2(stageKeyV2("playoff"), "missing-route"),
          sourceNodeKey: routingNodeKeyV2("a"),
          targetNodeKey: routingNodeKeyV2("b"),
        },
      ],
    });
    assert.equal(result.valid, false);
    assert.ok(
      !result.valid &&
        result.problems.some(
          (problem) => problem.code === "INVALID_DEPENDENCY",
        ),
    );
  });
});
