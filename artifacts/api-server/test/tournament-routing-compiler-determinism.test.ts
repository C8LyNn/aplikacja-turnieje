import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  COMPILED_ROUTING_PLAN_VERSION_V2,
  canonicalStringifyV2,
  compileTournamentBlueprintV2,
  serializeCompiledTournamentRoutingPlanV2,
  type StageFormatEngineV2,
} from "../src/domain/tournament/v2/index";
import {
  directAndQualifiedBlueprint,
  minimalBlueprint,
  requireCompiled,
  simpleFormatEngine,
} from "./tournament-routing-test-helpers";

describe("deterministic tournament routing compiler v2", () => {
  test("returns byte-identical plans without mutating input", () => {
    const blueprint = minimalBlueprint("custom:test");
    const snapshot = structuredClone(blueprint);
    const first = requireCompiled(
      compileTournamentBlueprintV2(blueprint, [simpleFormatEngine]),
    );
    const second = requireCompiled(
      compileTournamentBlueprintV2(blueprint, [simpleFormatEngine]),
    );

    assert.deepEqual(blueprint, snapshot);
    assert.deepEqual(first, second);
    assert.equal(first.compiledPlanVersion, COMPILED_ROUTING_PLAN_VERSION_V2);
    assert.equal(
      serializeCompiledTournamentRoutingPlanV2(first),
      serializeCompiledTournamentRoutingPlanV2(second),
    );
    assert.ok(first.routes.every((route) => route.routeKey.includes("/")));
    assert.ok(
      first.logicalMatches.every((match) =>
        match.matchKey.startsWith("playoff/match/"),
      ),
    );
  });

  test("canonicalizes set-like engine arrays before comparison", () => {
    let invocation = 0;
    const engine: StageFormatEngineV2 = {
      ...simpleFormatEngine,
      compile(context) {
        invocation += 1;
        const value = simpleFormatEngine.compile(context);
        if (invocation % 2 === 1) return value;
        return {
          logicalMatches: [...value.logicalMatches].reverse(),
          outputs: [...value.outputs].reverse(),
          routes: [...value.routes].reverse(),
        };
      },
    };
    const result = compileTournamentBlueprintV2(
      minimalBlueprint("custom:test"),
      [engine],
    );
    assert.equal(result.valid, true);
  });

  test("canonical JSON sorts object keys recursively but preserves array order", () => {
    assert.equal(
      canonicalStringifyV2({
        z: { second: 2, first: 1 },
        a: [{ z: 2, a: 1 }, "second"],
      }),
      '{"a":[{"a":1,"z":2},"second"],"z":{"first":1,"second":2}}',
    );
    assert.notEqual(
      canonicalStringifyV2({ values: ["first", "second"] }),
      canonicalStringifyV2({ values: ["second", "first"] }),
    );
  });

  test("canonicalizes independent authoring collection order", () => {
    const firstBlueprint = directAndQualifiedBlueprint();
    const secondBlueprint = structuredClone(firstBlueprint);
    secondBlueprint.buckets = [...secondBlueprint.buckets].reverse();
    secondBlueprint.stages = [...secondBlueprint.stages].reverse();
    secondBlueprint.transitions = [...secondBlueprint.transitions].reverse();
    const first = requireCompiled(
      compileTournamentBlueprintV2(firstBlueprint),
    );
    const second = requireCompiled(
      compileTournamentBlueprintV2(secondBlueprint),
    );
    assert.equal(
      serializeCompiledTournamentRoutingPlanV2(first),
      serializeCompiledTournamentRoutingPlanV2(second),
    );
  });

  test("still detects a real target difference", () => {
    let invocation = 0;
    const engine: StageFormatEngineV2 = {
      ...simpleFormatEngine,
      compile(context) {
        invocation += 1;
        const value = simpleFormatEngine.compile(context);
        if (invocation % 2 === 1) return value;
        const routes = value.routes.map((route, index) =>
          index === 0 && route.target.type === "match_slot"
            ? { ...route, target: { ...route.target, slot: 2 as const } }
            : route,
        );
        return { ...value, routes };
      },
    };
    const result = compileTournamentBlueprintV2(
      minimalBlueprint("custom:test"),
      [engine],
    );
    assert.equal(result.valid, false);
    assert.ok(
      !result.valid &&
        result.problems.some(
          (problem) => problem.code === "NONDETERMINISTIC_FORMAT_ENGINE",
        ),
    );
  });

  test("snapshots the first result before an engine mutates shared arrays", () => {
    let invocation = 0;
    let sharedRoutes:
      | Array<ReturnType<typeof simpleFormatEngine.compile>["routes"][number]>
      | undefined;
    const engine: StageFormatEngineV2 = {
      ...simpleFormatEngine,
      compile(context) {
        invocation += 1;
        const value = simpleFormatEngine.compile(context);
        if (sharedRoutes == null) {
          sharedRoutes = [...value.routes];
        } else {
          const firstRoute = sharedRoutes[0];
          if (firstRoute?.target.type === "match_slot") {
            sharedRoutes[0] = {
              ...firstRoute,
              target: { ...firstRoute.target, slot: 2 },
            };
          }
        }
        return { ...value, routes: sharedRoutes };
      },
    };
    const result = compileTournamentBlueprintV2(
      minimalBlueprint("custom:test"),
      [engine],
    );
    assert.equal(result.valid, false);
    assert.ok(
      !result.valid &&
        result.problems.some(
          (problem) => problem.code === "NONDETERMINISTIC_FORMAT_ENGINE",
        ),
    );
  });

  test("still detects a real output-capacity difference", () => {
    let invocation = 0;
    const engine: StageFormatEngineV2 = {
      ...simpleFormatEngine,
      compile(context) {
        invocation += 1;
        const value = simpleFormatEngine.compile(context);
        return invocation % 2 === 1
          ? value
          : {
              ...value,
              outputs: value.outputs.map((output, index) =>
                index === 0
                  ? { ...output, exactCapacity: output.exactCapacity + 1 }
                  : output,
              ),
            };
      },
    };
    const result = compileTournamentBlueprintV2(
      minimalBlueprint("custom:test"),
      [engine],
    );
    assert.equal(result.valid, false);
    assert.ok(
      !result.valid &&
        result.problems.some(
          (problem) => problem.code === "NONDETERMINISTIC_FORMAT_ENGINE",
        ),
    );
  });

  test("preserves semantically meaningful nested array order", () => {
    let invocation = 0;
    const engine: StageFormatEngineV2 = {
      ...simpleFormatEngine,
      compile(context) {
        invocation += 1;
        const value = simpleFormatEngine.compile(context);
        if (invocation % 2 === 1) return value;
        return {
          ...value,
          logicalMatches: value.logicalMatches.map((match, index) =>
            index === 0
              ? {
                  ...match,
                  slots: [2, 1] as unknown as readonly [1, 2],
                }
              : match,
          ),
        };
      },
    };
    const result = compileTournamentBlueprintV2(
      minimalBlueprint("custom:test"),
      [engine],
    );
    assert.equal(result.valid, false);
    assert.ok(
      !result.valid &&
        result.problems.some(
          (problem) => problem.code === "NONDETERMINISTIC_FORMAT_ENGINE",
        ),
    );
  });

  test("rejects non-serializable authoring settings", () => {
    const blueprint = minimalBlueprint();
    blueprint.stages[0].format.settings = {
      callback: () => "not serializable",
    } as unknown as Readonly<Record<string, unknown>>;
    const result = compileTournamentBlueprintV2(blueprint);
    assert.equal(result.valid, false);
    assert.ok(
      !result.valid &&
        result.problems.some(
          (problem) => problem.code === "NON_SERIALIZABLE_CONFIGURATION",
        ),
    );
  });
});
