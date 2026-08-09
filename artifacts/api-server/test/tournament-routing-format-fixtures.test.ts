import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  compileTournamentBlueprintV2,
  logicalMatchKeyV2,
  stageKeyV2,
  stageOutputKeyV2,
  type StageFormatEngineV2,
} from "../src/domain/tournament/v2/index";
import {
  compilationCauseCodes,
  directAndQualifiedBlueprint,
  gslFixtureEngine,
  minimalBlueprint,
  partialDoubleEliminationFixtureEngine,
  requireCompiled,
  simpleFormatEngine,
} from "./tournament-routing-test-helpers";

describe("stage format engine boundary", () => {
  function mismatchedEngine(
    kind: "match" | "output" | "route",
  ): StageFormatEngineV2 {
    return {
      formatId: "custom:boundary",
      rulesVersion: 1,
      compile({ stageKey, keys }) {
        const foreign = stageKeyV2("foreign");
        const localMatch = keys.logicalMatch("local");
        const foreignMatch = logicalMatchKeyV2(foreign, "foreign");
        const localOutput = keys.output("local");
        if (kind === "match") {
          return {
            logicalMatches: [
              {
                matchKey: foreignMatch,
                stageKey: foreign,
                order: 0,
                slots: [1, 2],
              },
            ],
            outputs: [],
            routes: [],
          };
        }
        if (kind === "output") {
          return {
            logicalMatches: [],
            outputs: [
              {
                stageKey: foreign,
                outputKey: stageOutputKeyV2("foreign"),
                exactCapacity: 1,
                priority: 0,
              },
            ],
            routes: [],
          };
        }
        return {
          logicalMatches: [
            { matchKey: localMatch, stageKey, order: 0, slots: [1, 2] },
          ],
          outputs: [
            {
              stageKey,
              outputKey: localOutput,
              exactCapacity: 1,
              priority: 0,
            },
          ],
          routes: [
            {
              routeKey: keys.route("foreign-target"),
              source: {
                type: "stage_entry",
                stageKey,
                entryKey: keys.entryPoint("default"),
                position: 1,
              },
              target: {
                type: "match_slot",
                stageKey: foreign,
                matchKey: foreignMatch,
                slot: 1,
              },
              reservedSlots: 1,
              priority: 0,
              order: 0,
              condition: { type: "always" },
            },
          ],
        };
      },
    };
  }

  test("rejects a match emitted for another stage", () => {
    const result = compileTournamentBlueprintV2(
      minimalBlueprint("custom:boundary"),
      [mismatchedEngine("match")],
    );
    assert.ok(
      compilationCauseCodes(result).includes("FORMAT_ENGINE_STAGE_MISMATCH"),
    );
  });

  test("rejects an output emitted for another stage", () => {
    const result = compileTournamentBlueprintV2(
      minimalBlueprint("custom:boundary"),
      [mismatchedEngine("output")],
    );
    assert.ok(
      compilationCauseCodes(result).includes("FORMAT_ENGINE_STAGE_MISMATCH"),
    );
  });

  test("rejects a route crossing the stage boundary", () => {
    const result = compileTournamentBlueprintV2(
      minimalBlueprint("custom:boundary"),
      [mismatchedEngine("route")],
    );
    assert.ok(
      compilationCauseCodes(result).includes(
        "FORMAT_ENGINE_CROSS_STAGE_ROUTE",
      ),
    );
  });

  test("rejects a condition crossing the stage boundary before merge", () => {
    const engine: StageFormatEngineV2 = {
      formatId: "custom:condition-boundary",
      rulesVersion: 1,
      compile({ stageKey, keys }) {
        const matchKey = keys.logicalMatch("local");
        return {
          logicalMatches: [
            { matchKey, stageKey, order: 0, slots: [1, 2] },
          ],
          outputs: [],
          routes: [
            {
              routeKey: keys.route("conditional-entry"),
              source: {
                type: "stage_entry",
                stageKey,
                entryKey: keys.entryPoint("default"),
                position: 1,
              },
              target: {
                type: "match_slot",
                stageKey,
                matchKey,
                slot: 1,
              },
              reservedSlots: 1,
              priority: 0,
              order: 0,
              condition: {
                type: "participant_lineage",
                lineage: {
                  type: "stage_entry",
                  stageKey: stageKeyV2("future"),
                  entryKey: keys.entryPoint("default"),
                },
              },
            },
          ],
        };
      },
    };
    const result = compileTournamentBlueprintV2(
      minimalBlueprint("custom:condition-boundary"),
      [engine],
    );
    assert.ok(
      compilationCauseCodes(result).includes(
        "FORMAT_ENGINE_CROSS_STAGE_CONDITION",
      ),
    );
  });

  test("continues to accept a purely local format fragment", () => {
    assert.equal(
      compileTournamentBlueprintV2(
        minimalBlueprint("custom:test"),
        [simpleFormatEngine],
      ).valid,
      true,
    );
  });
});

describe("representative format routing fixtures", () => {
  test("compiles registration, stage-result, entry, winner, loser and output routing", () => {
    const stagePlan = requireCompiled(
      compileTournamentBlueprintV2(directAndQualifiedBlueprint()),
    );
    assert.ok(
      stagePlan.routes.some(
        (route) =>
          route.source.type === "registration_bucket" &&
          route.target.type === "stage_entry",
      ),
    );
    assert.ok(
      stagePlan.routes.some(
        (route) =>
          route.source.type === "stage_result" &&
          route.target.type === "stage_entry",
      ),
    );

    const matchPlan = requireCompiled(
      compileTournamentBlueprintV2(
        minimalBlueprint("custom:test"),
        [simpleFormatEngine],
      ),
    );
    assert.ok(
      matchPlan.routes.some(
        (route) =>
          route.source.type === "stage_entry" &&
          route.target.type === "match_slot",
      ),
    );
    assert.ok(
      matchPlan.routes.some(
        (route) =>
          route.source.type === "match_outcome" &&
          route.source.outcome === "winner" &&
          route.target.type === "match_slot",
      ),
    );
    assert.ok(
      matchPlan.routes.some(
        (route) =>
          route.source.type === "match_outcome" &&
          route.source.outcome === "loser" &&
          route.target.type === "stage_output",
      ),
    );
  });

  test("represents the standard four-player, five-match GSL flow", () => {
    const plan = requireCompiled(
      compileTournamentBlueprintV2(
        minimalBlueprint("gsl_groups"),
        [gslFixtureEngine],
      ),
    );
    assert.equal(plan.logicalMatches.length, 5);
    assert.deepEqual(
      plan.logicalMatches.map((match) =>
        match.matchKey.slice(match.matchKey.lastIndexOf("/") + 1),
      ),
      ["opening-1", "opening-2", "winners", "elimination", "decider"],
    );
    assert.deepEqual(
      plan.outputs.map((output) => output.outputKey),
      ["qualified-1", "qualified-2"],
    );
    assert.equal(
      plan.routes.filter((route) => route.target.type === "stage_output")
        .length,
      2,
    );
    assert.ok(
      plan.routes
        .filter((route) => route.target.type === "stage_output")
        .every((route) => route.condition.type === "always"),
    );
  });

  test("converges partial double-elimination routing before one terminal output", () => {
    const plan = requireCompiled(
      compileTournamentBlueprintV2(
        minimalBlueprint("double_elimination"),
        [partialDoubleEliminationFixtureEngine],
      ),
    );
    assert.equal(plan.outputs.length, 1);
    assert.equal(plan.outputs[0].outputKey, "champion");
    const terminalRoutes = plan.routes.filter(
      (route) => route.target.type === "stage_output",
    );
    assert.equal(terminalRoutes.length, 1);
    assert.equal(terminalRoutes[0].condition.type, "always");
    assert.equal(terminalRoutes[0].reservedSlots, 1);
    assert.ok(terminalRoutes[0].source.type === "match_outcome");
    assert.ok(
      terminalRoutes[0].source.type === "match_outcome" &&
        terminalRoutes[0].source.matchKey.includes("final-resolution"),
    );
    assert.ok(
      plan.routes.some(
        (route) =>
          route.condition.type === "match_winner_lineage" &&
          route.target.type === "match_slot" &&
          route.target.matchKey.includes("final-resolution") &&
          route.target.slot === 2,
      ),
    );
    assert.ok(
      plan.routes.some(
        (route) =>
          route.condition.type === "always" &&
          route.target.type === "match_slot" &&
          route.target.matchKey.includes("final-resolution") &&
          route.target.slot === 1,
      ),
    );
  });

  test("compiles the partial double-elimination fixture in two consecutive stages", () => {
    const blueprint = minimalBlueprint("double_elimination");
    const first = {
      ...blueprint.stages[0],
      key: "de-1",
      name: "DE 1",
      displayOrder: 1,
    };
    const second = {
      ...blueprint.stages[0],
      key: "de-2",
      name: "DE 2",
      displayOrder: 2,
    };
    blueprint.stages = [first, second];
    blueprint.transitions = [
      {
        ...blueprint.transitions[0],
        target: { stageKey: "de-1" },
      },
      {
        key: "de-1-to-de-2",
        source: { type: "stage_result", stageKey: "de-1" },
        target: { stageKey: "de-2" },
        selection: { type: "top_n", count: 4 },
        seedAssignment: { type: "preserve" },
        placement: { type: "format_default" },
        reservedSlots: 4,
        priority: 0,
      },
    ];
    const result = compileTournamentBlueprintV2(blueprint, [
      partialDoubleEliminationFixtureEngine,
    ]);
    assert.equal(
      result.valid,
      true,
      result.valid ? undefined : JSON.stringify(result.problems),
    );
  });
});
