import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { after, before, describe, test } from "node:test";
import { asc, eq } from "drizzle-orm";
import {
  compileTournamentBlueprintV2,
  compileV1StagePlanToRoutingV2,
  serializeCompiledTournamentRoutingPlanV2,
  type CompiledTournamentRoutingPlanV2,
  type StageFormatEngineV2,
  type TournamentBlueprintV2,
} from "../src/domain/tournament/v2";
import {
  gslFixtureEngine,
  minimalBlueprint,
  partialDoubleEliminationFixtureEngine,
  requireCompiled,
} from "./tournament-routing-test-helpers";
import {
  dropTestSchema,
  getSafeTestDatabaseConfig,
  resetTestSchema,
  type TestDatabaseConfig,
  type TestPool,
} from "./test-database";

interface DatabaseModule {
  db: typeof import("@workspace/db").db;
  pool: typeof import("@workspace/db").pool;
  tournamentsTable: typeof import("@workspace/db").tournamentsTable;
  tournamentStagesTable: typeof import("@workspace/db").tournamentStagesTable;
  matchesTable: typeof import("@workspace/db").matchesTable;
  tournamentRoutingPlansTable:
    typeof import("@workspace/db").tournamentRoutingPlansTable;
  tournamentRoutingRouteSourcesTable:
    typeof import("@workspace/db").tournamentRoutingRouteSourcesTable;
  tournamentRoutingDependenciesTable:
    typeof import("@workspace/db").tournamentRoutingDependenciesTable;
}

type PersistenceModule =
  typeof import("../src/application/routing/routing-plan-persistence");
type PersistenceErrors =
  typeof import("../src/application/routing/routing-plan-errors");

let database: DatabaseModule;
let persistence: PersistenceModule;
let errors: PersistenceErrors;
let testConfig: TestDatabaseConfig;
let schemaInitialized = false;

function requireV1Compiled(input: unknown): CompiledTournamentRoutingPlanV2 {
  const result = compileV1StagePlanToRoutingV2(input);
  assert.equal(
    result.valid,
    true,
    result.valid ? undefined : JSON.stringify(result.problems),
  );
  if (!result.valid) throw new Error("V1 fixture compilation failed.");
  return result.value;
}

const oneStagePlan = () =>
  requireV1Compiled({
    initialParticipantCount: 8,
    stages: [
      {
        key: "playoff",
        position: 1,
        name: "Play-off",
        format: "single_elimination",
        participantCount: 8,
        bestOf: 3,
      },
    ],
  });

const swissPlan = () =>
  requireV1Compiled({
    initialParticipantCount: 16,
    stages: [
      {
        key: "swiss",
        position: 1,
        name: "Swiss",
        format: "swiss",
        participantCount: 16,
        bestOf: 1,
        rounds: 5,
        advancingCount: 8,
      },
      {
        key: "playoff",
        position: 2,
        name: "Play-off",
        format: "single_elimination",
        participantCount: 8,
        bestOf: 3,
      },
    ],
  });

const groupPlan = () =>
  requireV1Compiled({
    initialParticipantCount: 8,
    stages: [
      {
        key: "groups",
        position: 1,
        name: "Groups",
        format: "group_stage",
        participantCount: 8,
        bestOf: 3,
        groupCount: 2,
        participantsPerGroup: 4,
        qualifiersPerGroup: 2,
        seedingMethod: "snake",
      },
      {
        key: "playoff",
        position: 2,
        name: "Play-off",
        format: "single_elimination",
        participantCount: 4,
        bestOf: 5,
      },
    ],
  });

const threeStagePlan = () =>
  requireV1Compiled({
    initialParticipantCount: 16,
    stages: [
      {
        key: "swiss",
        position: 1,
        name: "Swiss",
        format: "swiss",
        participantCount: 16,
        bestOf: 1,
        rounds: 5,
        advancingCount: 8,
      },
      {
        key: "groups",
        position: 2,
        name: "Groups",
        format: "group_stage",
        participantCount: 8,
        bestOf: 3,
        groupCount: 2,
        participantsPerGroup: 4,
        qualifiersPerGroup: 2,
        seedingMethod: "snake",
      },
      {
        key: "playoff",
        position: 3,
        name: "Play-off",
        format: "single_elimination",
        participantCount: 4,
        bestOf: 5,
      },
    ],
  });

function gslPlan(): CompiledTournamentRoutingPlanV2 {
  return requireCompiled(
    compileTournamentBlueprintV2(
      minimalBlueprint("gsl_groups", 4),
      [gslFixtureEngine],
    ),
  );
}

const namedOutputFixtureEngine: StageFormatEngineV2 = {
  formatId: "custom:named-output",
  rulesVersion: 1,
  compile({ stageKey, keys }) {
    const matchKey = keys.logicalMatch("qualification");
    const outputKey = keys.output("qualified");
    return {
      logicalMatches: [
        { stageKey, matchKey, order: 0, slots: [1, 2] },
      ],
      outputs: [
        { stageKey, outputKey, exactCapacity: 2, priority: 0 },
      ],
      routes: [
        {
          routeKey: keys.route("entry-1"),
          source: {
            type: "stage_entry",
            stageKey,
            entryKey: keys.entryPoint("default"),
            position: 1,
          },
          target: { type: "match_slot", stageKey, matchKey, slot: 1 },
          reservedSlots: 1,
          priority: 0,
          order: 0,
          condition: { type: "always" },
        },
        {
          routeKey: keys.route("entry-2"),
          source: {
            type: "stage_entry",
            stageKey,
            entryKey: keys.entryPoint("default"),
            position: 2,
          },
          target: { type: "match_slot", stageKey, matchKey, slot: 2 },
          reservedSlots: 1,
          priority: 0,
          order: 1,
          condition: { type: "always" },
        },
        {
          routeKey: keys.route("winner"),
          source: {
            type: "match_outcome",
            stageKey,
            matchKey,
            outcome: "winner",
          },
          target: { type: "stage_output", stageKey, outputKey },
          reservedSlots: 1,
          priority: 0,
          order: 2,
          condition: { type: "always" },
        },
        {
          routeKey: keys.route("loser"),
          source: {
            type: "match_outcome",
            stageKey,
            matchKey,
            outcome: "loser",
          },
          target: { type: "stage_output", stageKey, outputKey },
          reservedSlots: 1,
          priority: 0,
          order: 3,
          condition: { type: "always" },
        },
      ],
    };
  },
};

function namedOutputPersistencePlan(): CompiledTournamentRoutingPlanV2 {
  const baseBlueprint = minimalBlueprint("custom:named-output", 2);
  const blueprint: TournamentBlueprintV2 = {
    ...baseBlueprint,
    stages: [
      {
        ...baseBlueprint.stages[0],
        key: "source",
        name: "Source",
      },
      {
        key: "target",
        name: "Target",
        displayOrder: 2,
        capacity: { type: "exact", count: 2 },
        format: { id: "single_elimination", rulesVersion: 1, settings: {} },
        matchRules: { bestOf: 1 },
        classification: { type: "format_default", policyId: "target" },
      },
    ],
    transitions: [
      {
        ...baseBlueprint.transitions[0],
        target: { stageKey: "source" },
      },
      {
        key: "qualified-to-target",
        source: { type: "stage_result", stageKey: "source" },
        target: { stageKey: "target" },
        selection: { type: "named_output", outputKey: "qualified" },
        seedAssignment: { type: "preserve" },
        placement: { type: "format_default" },
        reservedSlots: 2,
        priority: 0,
      },
    ],
  };
  const plan = requireCompiled(
    compileTournamentBlueprintV2(blueprint, [namedOutputFixtureEngine]),
  );
  return {
    ...plan,
    stages: plan.stages.map((stage) =>
      stage.stageKey === "source"
        ? {
            ...stage,
            // The persistence service currently maps only V1 runtime formats.
            formatId: "round_robin" as const,
          }
        : stage,
    ),
  };
}

function doubleEliminationPlan(): CompiledTournamentRoutingPlanV2 {
  return requireCompiled(
    compileTournamentBlueprintV2(
      minimalBlueprint("double_elimination", 4),
      [partialDoubleEliminationFixtureEngine],
    ),
  );
}

async function createTournamentForPlan(
  plan: CompiledTournamentRoutingPlanV2,
  capacities = plan.stages.map((stage) => stage.exactParticipantCapacity),
): Promise<{
  tournamentId: number;
  stageIdsByKey: ReadonlyMap<string, number>;
}> {
  return database.db.transaction(async (tx) => {
    const [tournament] = await tx
      .insert(database.tournamentsTable)
      .values({
        name: `Routing persistence ${randomUUID()}`,
        format: "round_robin",
        status: "draft",
        visibility: "public_online",
        defaultBestOf: 1,
        maxPlayers: capacities[0],
      })
      .returning();
    const [generated] = await tx
      .select()
      .from(database.tournamentStagesTable)
      .where(
        eq(database.tournamentStagesTable.tournamentId, tournament.id),
      )
      .for("update");
    const persisted: Array<
      typeof database.tournamentStagesTable.$inferSelect
    > = [];
    for (const [index, stage] of plan.stages.entries()) {
      const terminal = index === plan.stages.length - 1;
      const runtimeFormat =
        stage.formatId === "swiss" ||
        stage.formatId === "round_robin" ||
        stage.formatId === "group_stage" ||
        stage.formatId === "single_elimination"
          ? stage.formatId
          : ("single_elimination" as const);
      const groupCapability =
        runtimeFormat === "group_stage" &&
        stage.selectionCapabilities.type === "groups"
          ? stage.selectionCapabilities
          : undefined;
      const groupCount = groupCapability?.exactGroupCount ?? null;
      const participantsPerGroup = groupCapability
        ? Math.max(...groupCapability.exactGroupSizes)
        : null;
      const qualifiersPerGroup = groupCapability
        ? terminal
          ? 1
          : capacities[index + 1] / groupCapability.exactGroupCount
        : null;
      const values = {
        tournamentId: tournament.id,
        stageKey: stage.stageKey,
        position: index + 1,
        name: stage.name,
        format: runtimeFormat,
        status: "planned" as const,
        participantCount: capacities[index],
        bestOf: 1,
        plannedRounds: runtimeFormat === "swiss" ? 1 : null,
        rankingPolicy:
          runtimeFormat === "single_elimination"
            ? ("elimination_bracket_v1" as const)
            : runtimeFormat === "swiss"
              ? ("swiss_v1" as const)
              : runtimeFormat === "group_stage"
                ? ("group_v1" as const)
                : ("round_robin_v1" as const),
        qualificationMode: terminal
          ? ("none" as const)
          : runtimeFormat === "group_stage"
            ? ("top_n_per_group" as const)
            : ("top_n" as const),
        advancingCount:
          terminal || runtimeFormat === "group_stage"
            ? null
            : capacities[index + 1],
        seedingPolicy:
          runtimeFormat === "single_elimination"
            ? ("standard_bracket" as const)
            : runtimeFormat === "group_stage"
              ? ("snake_groups" as const)
              : ("standings_order" as const),
        resultSeedingPolicy:
          runtimeFormat === "group_stage"
            ? ("rank_bands" as const)
            : ("standings_order" as const),
        groupCount,
        participantsPerGroup,
        qualifiersPerGroup,
      };
      if (index === 0) {
        const [row] = await tx
          .update(database.tournamentStagesTable)
          .set(values)
          .where(eq(database.tournamentStagesTable.id, generated.id))
          .returning();
        persisted.push(row);
      } else {
        const [row] = await tx
          .insert(database.tournamentStagesTable)
          .values(values)
          .returning();
        persisted.push(row);
      }
    }
    return {
      tournamentId: tournament.id,
      stageIdsByKey: new Map(
        plan.stages.map((stage, index) => [
          stage.stageKey,
          persisted[index].id,
        ]),
      ),
    };
  });
}

async function expectPersistenceError(
  action: () => Promise<unknown>,
  code: InstanceType<
    PersistenceErrors["RoutingPlanPersistenceError"]
  >["code"],
): Promise<void> {
  await assert.rejects(action, (error: unknown) => {
    assert.ok(error instanceof errors.RoutingPlanPersistenceError);
    assert.equal(error.code, code);
    return true;
  });
}

before(async () => {
  testConfig = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = testConfig.connectionString;
  database = await import("@workspace/db") as DatabaseModule;
  await resetTestSchema(
    database.pool as unknown as TestPool,
    testConfig.schema,
  );
  schemaInitialized = true;
  persistence = await import(
    "../src/application/routing/routing-plan-persistence"
  );
  errors = await import(
    "../src/application/routing/routing-plan-errors"
  );
});

after(async () => {
  if (!database || !testConfig) return;
  if (schemaInitialized) {
    await dropTestSchema(
      database.pool as unknown as TestPool,
      testConfig.schema,
    );
  }
  await database.pool.end();
});

describe("Tournament routing persistence migration", () => {
  test("creates the relational catalog with semantic unique constraints and foreign keys", async () => {
    const catalog = await database.pool.query(
      `SELECT count(*)::int AS table_count
       FROM information_schema.tables
       WHERE table_schema = current_schema()
         AND table_name LIKE 'tournament_routing_%'`,
    );
    assert.equal(catalog.rows[0].table_count, 15);
    const constraints = await database.pool.query(
      `SELECT conname, contype, convalidated
       FROM pg_constraint
       WHERE connamespace = current_schema()::regnamespace
         AND conname IN (
           'tournament_routing_plans_tournament_revision_unique',
           'tournament_routing_stages_plan_tournament_fk',
         'tournament_routing_stages_stage_tournament_fk',
         'tournament_routing_routes_plan_key_unique',
         'tournament_routing_route_sources_route_fk',
           'tournament_routing_route_sources_shape',
           'tournament_routing_route_targets_route_fk',
           'tournament_routing_route_targets_match_slot_unique',
           'tournament_routing_route_targets_shape',
           'tournament_routing_selections_route_cardinality_fk',
           'tournament_routing_selections_shape'
         )
       ORDER BY conname`,
    );
    assert.equal(constraints.rowCount, 11);
    assert.ok(
      constraints.rows.every(
        (row: { contype: string; convalidated: boolean }) =>
          ["u", "f", "c"].includes(row.contype) && row.convalidated,
      ),
    );
  });

  test("rejects invalid discriminant shapes, cardinalities and cross-stage match targets in PostgreSQL", async () => {
    const plan = namedOutputPersistencePlan();
    const fixture = await createTournamentForPlan(plan);
    const saved = await persistence.saveCompiledRoutingPlanV2({
      ...fixture,
      plan,
    });
    const source = await database.pool.query(
      `SELECT route_id
       FROM tournament_routing_route_sources
       WHERE plan_id = $1 AND source_type = 'registration_bucket'
       LIMIT 1`,
      [saved.planId],
    );
    await assert.rejects(
      database.pool.query(
        `UPDATE tournament_routing_route_sources
         SET source_type = 'match_outcome'
         WHERE route_id = $1`,
        [source.rows[0].route_id],
      ),
      /tournament_routing_route_sources_shape/,
    );

    const selection = await database.pool.query(
      `SELECT route_id
       FROM tournament_routing_selections
       WHERE plan_id = $1
       LIMIT 1`,
      [saved.planId],
    );
    await assert.rejects(
      database.pool.query(
        `UPDATE tournament_routing_selections
         SET exact_cardinality = 0
         WHERE route_id = $1`,
        [selection.rows[0].route_id],
      ),
      /tournament_routing_selections_cardinality_positive/,
    );
    await assert.rejects(
      database.pool.query(
        `UPDATE tournament_routing_selections
         SET exact_cardinality = exact_cardinality + 1
         WHERE route_id = $1`,
        [selection.rows[0].route_id],
      ),
      /tournament_routing_selections_route_cardinality_fk|tournament_routing_selections_shape/,
    );

    await database.pool.query(
      "ALTER TABLE tournament_stages DISABLE TRIGGER USER",
    );
    let extraStage: { id: number } | undefined;
    try {
      [extraStage] = await database.db
        .insert(database.tournamentStagesTable)
        .values({
          tournamentId: fixture.tournamentId,
          stageKey: "foreign-routing-stage",
          position: 3,
          name: "Foreign routing stage",
          format: "single_elimination",
          participantCount: 4,
          bestOf: 3,
          rankingPolicy: "elimination_bracket_v1",
          seedingPolicy: "standard_bracket",
        })
        .returning({ id: database.tournamentStagesTable.id });
    } finally {
      await database.pool.query(
        "ALTER TABLE tournament_stages ENABLE TRIGGER USER",
      );
    }
    assert.ok(extraStage);
    await database.pool.query(
      `INSERT INTO tournament_routing_stages (
         plan_id, tournament_id, stage_id, ordinal, stage_key, name,
         display_order, exact_participant_capacity, selection_capability_type,
         exact_group_count, maximum_qualifiers_per_group, format_id,
         format_rules_version
       )
       VALUES ($1, $2, $3, 99, 'foreign-routing-stage', 'Foreign routing stage',
               99, 4, 'none', NULL, NULL, 'single_elimination', 1)`,
      [saved.planId, fixture.tournamentId, extraStage.id],
    );
    const target = await database.pool.query(
      `SELECT target.route_id, target.plan_id, target.routing_stage_id,
              target.logical_match_id, target.match_slot,
              other.id AS other_stage_id
       FROM tournament_routing_route_targets target
       JOIN tournament_routing_stages own_stage
         ON own_stage.id = target.routing_stage_id
       JOIN tournament_routing_stages other
         ON other.plan_id = target.plan_id
        AND other.stage_key = 'foreign-routing-stage'
       WHERE target.plan_id = $1
         AND target.target_type = 'match_slot'
       LIMIT 1`,
      [saved.planId],
    );
    assert.equal(target.rowCount, 1);
    await assert.rejects(
      database.pool.query(
        `UPDATE tournament_routing_route_targets
         SET routing_stage_id = $1
         WHERE route_id = $2`,
        [target.rows[0].other_stage_id, target.rows[0].route_id],
      ),
      /tournament_routing_route_targets_stage_match_fk/,
    );
    await assert.rejects(
      database.pool.query(
        `UPDATE tournament_routing_route_targets
         SET match_slot = 3
         WHERE route_id = $1`,
        [target.rows[0].route_id],
      ),
      /tournament_routing_route_targets_shape/,
    );

    await assert.rejects(
      database.pool.query(
        `DELETE FROM tournament_routing_logical_match_slots
         WHERE plan_id = $1
           AND routing_stage_id = $2
           AND logical_match_id = $3
           AND slot = $4`,
        [
          target.rows[0].plan_id,
          target.rows[0].routing_stage_id,
          target.rows[0].logical_match_id,
          target.rows[0].match_slot,
        ],
      ),
      /tournament_routing_route_targets_match_slot_fk/,
    );

    const artificialMatch = await database.pool.query(
      `INSERT INTO tournament_routing_logical_matches (
         plan_id, routing_stage_id, ordinal, match_key, name, match_order
       )
       VALUES ($1, $2, 999, 'slot-integrity-match', NULL, 999)
       RETURNING id`,
      [target.rows[0].plan_id, target.rows[0].routing_stage_id],
    );
    await database.pool.query(
      `INSERT INTO tournament_routing_logical_match_slots (
         plan_id, routing_stage_id, logical_match_id, slot
       )
       VALUES ($1, $2, $3, 2)`,
      [
        target.rows[0].plan_id,
        target.rows[0].routing_stage_id,
        artificialMatch.rows[0].id,
      ],
    );
    await assert.rejects(
      database.pool.query(
        `UPDATE tournament_routing_route_targets
         SET logical_match_id = $1, match_slot = 1
         WHERE route_id = $2`,
        [artificialMatch.rows[0].id, target.rows[0].route_id],
      ),
      /tournament_routing_route_targets_match_slot_fk/,
    );
  });
});

describe("Tournament routing plan save/load", () => {
  test("round-trips minimal, V1, Swiss, groups, three-stage and named-output plans byte-for-byte", async () => {
    const fixtures = [
      requireCompiled(compileTournamentBlueprintV2(minimalBlueprint())),
      oneStagePlan(),
      swissPlan(),
      groupPlan(),
      threeStagePlan(),
      namedOutputPersistencePlan(),
    ];
    for (const plan of fixtures) {
      const fixture = await createTournamentForPlan(plan);
      const saved = await persistence.saveCompiledRoutingPlanV2({
        ...fixture,
        plan,
      });
      const loaded = await persistence.loadCompiledRoutingPlanV2({
        planId: saved.planId,
      });
      assert.equal(saved.applied, true);
      assert.equal(
        serializeCompiledTournamentRoutingPlanV2(loaded.plan),
        serializeCompiledTournamentRoutingPlanV2(plan),
      );
      assert.equal(loaded.canonicalPayload, saved.canonicalPayload);
    }
  });

  test("persists deterministic ordinals and all relational route components", async () => {
    const plan = namedOutputPersistencePlan();
    const fixture = await createTournamentForPlan(plan);
    const saved = await persistence.saveCompiledRoutingPlanV2({
      ...fixture,
      plan,
    });
    const rows = await database.pool.query(
      `SELECT route.ordinal, route.route_key,
              source.source_type, target.target_type,
              condition.condition_type,
              dependency.source_node_key, dependency.target_node_key
       FROM tournament_routing_routes route
       JOIN tournament_routing_route_sources source
         ON source.route_id = route.id
       JOIN tournament_routing_route_targets target
         ON target.route_id = route.id
       JOIN tournament_routing_route_conditions condition
         ON condition.route_id = route.id
       JOIN tournament_routing_dependencies dependency
         ON dependency.route_id = route.id
       WHERE route.plan_id = $1
       ORDER BY route.ordinal`,
      [saved.planId],
    );
    assert.equal(rows.rowCount, plan.routes.length);
    assert.deepEqual(
      rows.rows.map((row: { ordinal: number }) => row.ordinal),
      plan.routes.map((_, index) => index),
    );
  });

  test("is idempotent for an identical tournament revision", async () => {
    const plan = oneStagePlan();
    const fixture = await createTournamentForPlan(plan);
    const first = await persistence.saveCompiledRoutingPlanV2({
      ...fixture,
      plan,
      revision: 1,
    });
    const second = await persistence.saveCompiledRoutingPlanV2({
      ...fixture,
      plan,
      revision: 1,
    });
    assert.equal(first.applied, true);
    assert.equal(second.applied, false);
    assert.equal(second.planId, first.planId);
  });

  test("serializes concurrent identical saves without duplicate graph rows", async () => {
    const plan = groupPlan();
    const fixture = await createTournamentForPlan(plan);
    const [first, second] = await Promise.all([
      persistence.saveCompiledRoutingPlanV2({ ...fixture, plan }),
      persistence.saveCompiledRoutingPlanV2({ ...fixture, plan }),
    ]);
    assert.equal(first.planId, second.planId);
    assert.deepEqual(
      [first.applied, second.applied].sort(),
      [false, true],
    );
    const rootCount = await database.pool.query(
      "SELECT count(*)::int AS count FROM tournament_routing_plans WHERE tournament_id = $1",
      [fixture.tournamentId],
    );
    assert.equal(rootCount.rows[0].count, 1);
  });

  test("rejects different content for the same tournament revision", async () => {
    const plan = oneStagePlan();
    const fixture = await createTournamentForPlan(plan);
    await persistence.saveCompiledRoutingPlanV2({ ...fixture, plan });
    const changed = structuredClone(plan);
    changed.stages[0].name = "Changed display name";
    await expectPersistenceError(
      () =>
        persistence.saveCompiledRoutingPlanV2({
          ...fixture,
          plan: changed,
        }),
      "ROUTING_PLAN_VERSION_CONFLICT",
    );
  });

  test("loads a requested revision and the latest tournament revision deterministically", async () => {
    const plan = oneStagePlan();
    const fixture = await createTournamentForPlan(plan);
    const first = await persistence.saveCompiledRoutingPlanV2({
      ...fixture,
      plan,
      revision: 1,
    });
    const second = await persistence.saveCompiledRoutingPlanV2({
      ...fixture,
      plan,
      revision: 2,
    });
    const explicit = await persistence.loadCompiledRoutingPlanV2({
      tournamentId: fixture.tournamentId,
      revision: 1,
    });
    const latest = await persistence.loadCompiledRoutingPlanV2({
      tournamentId: fixture.tournamentId,
    });
    assert.equal(explicit.planId, first.planId);
    assert.equal(latest.planId, second.planId);
  });

  test("returns a stable not-found error", async () => {
    await expectPersistenceError(
      () => persistence.loadCompiledRoutingPlanV2({ planId: 2_000_000_000 }),
      "ROUTING_PLAN_NOT_FOUND",
    );
  });

  test("stores a stable checksum and explicit source kind", async () => {
    const plan = oneStagePlan();
    const fixture = await createTournamentForPlan(plan);
    const saved = await persistence.saveCompiledRoutingPlanV2({
      ...fixture,
      plan,
      sourceKind: "v1_adapter",
    });
    assert.equal(saved.sourceKind, "v1_adapter");
    assert.equal(
      saved.checksum,
      createHash("sha256")
        .update(serializeCompiledTournamentRoutingPlanV2(plan), "utf8")
        .digest("hex"),
    );
  });

  test("deleting a sealed plan cascades through the routing graph only", async () => {
    const plan = namedOutputPersistencePlan();
    const fixture = await createTournamentForPlan(plan);
    const saved = await persistence.saveCompiledRoutingPlanV2({
      ...fixture,
      plan,
    });
    await database.pool.query(
      "DELETE FROM tournament_routing_plans WHERE id = $1",
      [saved.planId],
    );
    const remaining = await database.pool.query(
      `SELECT
         (SELECT count(*) FROM tournament_routing_plans WHERE id = $1)
       + (SELECT count(*) FROM tournament_routing_buckets WHERE plan_id = $1)
       + (SELECT count(*) FROM tournament_routing_stages WHERE plan_id = $1)
       + (SELECT count(*) FROM tournament_routing_stage_group_sizes WHERE plan_id = $1)
       + (SELECT count(*) FROM tournament_routing_entry_points WHERE plan_id = $1)
       + (SELECT count(*) FROM tournament_routing_logical_matches WHERE plan_id = $1)
       + (SELECT count(*) FROM tournament_routing_logical_match_slots WHERE plan_id = $1)
       + (SELECT count(*) FROM tournament_routing_outputs WHERE plan_id = $1)
       + (SELECT count(*) FROM tournament_routing_routes WHERE plan_id = $1)
       + (SELECT count(*) FROM tournament_routing_selections WHERE plan_id = $1)
       + (SELECT count(*) FROM tournament_routing_selection_group_sizes WHERE plan_id = $1)
       + (SELECT count(*) FROM tournament_routing_route_sources WHERE plan_id = $1)
       + (SELECT count(*) FROM tournament_routing_route_targets WHERE plan_id = $1)
       + (SELECT count(*) FROM tournament_routing_route_conditions WHERE plan_id = $1)
       + (SELECT count(*) FROM tournament_routing_dependencies WHERE plan_id = $1)
         AS count`,
      [saved.planId],
    );
    assert.equal(Number(remaining.rows[0].count), 0);
    const tournament = await database.pool.query(
      "SELECT id FROM tournaments WHERE id = $1",
      [fixture.tournamentId],
    );
    assert.equal(tournament.rowCount, 1);
  });

  test("rejects incomplete and extra stage mappings", async () => {
    const plan = swissPlan();
    const fixture = await createTournamentForPlan(plan);
    const incomplete = new Map(fixture.stageIdsByKey);
    incomplete.delete(plan.stages[1].stageKey);
    await expectPersistenceError(
      () =>
        persistence.saveCompiledRoutingPlanV2({
          ...fixture,
          plan,
          stageIdsByKey: incomplete,
        }),
      "INCOMPLETE_STAGE_MAPPING",
    );
    const extra = new Map(fixture.stageIdsByKey);
    extra.set("unrelated", [...fixture.stageIdsByKey.values()][0]);
    await expectPersistenceError(
      () =>
        persistence.saveCompiledRoutingPlanV2({
          ...fixture,
          plan,
          stageIdsByKey: extra,
        }),
      "INCOMPLETE_STAGE_MAPPING",
    );
  });

  test("rejects a stage owned by another tournament", async () => {
    const plan = oneStagePlan();
    const fixture = await createTournamentForPlan(plan);
    const foreign = await createTournamentForPlan(plan);
    await expectPersistenceError(
      () =>
        persistence.saveCompiledRoutingPlanV2({
          ...fixture,
          plan,
          stageIdsByKey: foreign.stageIdsByKey,
        }),
      "FOREIGN_STAGE_MAPPING",
    );
  });

  test("rejects a persisted stage capacity mismatch", async () => {
    const plan = oneStagePlan();
    const fixture = await createTournamentForPlan(plan, [16]);
    await expectPersistenceError(
      () => persistence.saveCompiledRoutingPlanV2({ ...fixture, plan }),
      "STAGE_CAPACITY_MISMATCH",
    );
  });

  test("rejects active tournaments and active stages", async () => {
    const plan = oneStagePlan();
    const fixture = await createTournamentForPlan(plan);
    const stageId = [...fixture.stageIdsByKey.values()][0];
    await database.db.transaction(async (tx) => {
      await tx
        .update(database.tournamentStagesTable)
        .set({ status: "active", startedAt: new Date() })
        .where(eq(database.tournamentStagesTable.id, stageId));
      await tx
        .update(database.tournamentsTable)
        .set({ status: "active", activeStageId: stageId })
        .where(eq(database.tournamentsTable.id, fixture.tournamentId));
    });
    await expectPersistenceError(
      () => persistence.saveCompiledRoutingPlanV2({ ...fixture, plan }),
      "ROUTING_PLAN_PERSISTENCE_NOT_ALLOWED",
    );
  });

  test("rejects tournaments that already contain runtime matches or results", async () => {
    const plan = oneStagePlan();
    const fixture = await createTournamentForPlan(plan);
    const stageId = [...fixture.stageIdsByKey.values()][0];
    await database.db.insert(database.matchesTable).values({
      tournamentId: fixture.tournamentId,
      stageId,
      round: 1,
      matchNumber: 1,
      bestOf: 1,
      status: "pending",
    });
    await expectPersistenceError(
      () => persistence.saveCompiledRoutingPlanV2({ ...fixture, plan }),
      "ROUTING_PLAN_PERSISTENCE_NOT_ALLOWED",
    );
  });

  test("rolls back every table when a fault occurs after the parent insert", async () => {
    const plan = oneStagePlan();
    const fixture = await createTournamentForPlan(plan);
    await assert.rejects(
      () =>
        persistence.saveCompiledRoutingPlanV2({
          ...fixture,
          plan,
          testHooks: {
            afterPlanWritten() {
              throw new Error("after-parent-fault");
            },
          },
        }),
      /after-parent-fault/,
    );
    const count = await database.pool.query(
      "SELECT count(*)::int AS count FROM tournament_routing_plans WHERE tournament_id = $1",
      [fixture.tournamentId],
    );
    assert.equal(count.rows[0].count, 0);
  });

  test("rolls back the complete graph when a fault occurs after the last graph insert", async () => {
    const plan = namedOutputPersistencePlan();
    const fixture = await createTournamentForPlan(plan);
    await assert.rejects(
      () =>
        persistence.saveCompiledRoutingPlanV2({
          ...fixture,
          plan,
          testHooks: {
            afterGraphWritten() {
              throw new Error("after-graph-fault");
            },
          },
        }),
      /after-graph-fault/,
    );
    const count = await database.pool.query(
      "SELECT count(*)::int AS count FROM tournament_routing_plans WHERE tournament_id = $1",
      [fixture.tournamentId],
    );
    assert.equal(count.rows[0].count, 0);
  });

  test("rejects invalid compiled plans and duplicate route or slot targets before opening a transaction", async () => {
    const plan = namedOutputPersistencePlan();
    const fixture = await createTournamentForPlan(plan);
    const invalid = structuredClone(plan);
    invalid.routes[1].routeKey = invalid.routes[0].routeKey;
    await expectPersistenceError(
      () =>
        persistence.saveCompiledRoutingPlanV2({
          ...fixture,
          plan: invalid,
        }),
      "DUPLICATE_ROUTE_OR_SLOT_TARGET",
    );
  });

  test("rejects duplicate stage mapping values before writing a parent row", async () => {
    const plan = swissPlan();
    const fixture = await createTournamentForPlan(plan);
    const sharedStageId = fixture.stageIdsByKey.get(plan.stages[0].stageKey);
    assert.ok(sharedStageId);
    await expectPersistenceError(
      () =>
        persistence.saveCompiledRoutingPlanV2({
          tournamentId: fixture.tournamentId,
          plan,
          stageIdsByKey: new Map(
            plan.stages.map((stage) => [stage.stageKey, sharedStageId]),
          ),
        }),
      "ROUTING_PLAN_DUPLICATE_STAGE_MAPPING",
    );
    const count = await database.pool.query(
      `SELECT count(*)::integer AS count
       FROM tournament_routing_plans
       WHERE tournament_id = $1`,
      [fixture.tournamentId],
    );
    assert.equal(count.rows[0].count, 0);
  });

  test("requires exact runtime format mapping and rejects V2-only formats", async () => {
    const swiss = swissPlan();
    const swissFixture = await createTournamentForPlan(swiss);
    const swissStageId = swissFixture.stageIdsByKey.get(
      swiss.stages[0].stageKey,
    );
    assert.ok(swissStageId);
    await database.pool.query(
      `UPDATE tournament_stages
       SET format = 'round_robin',
           planned_rounds = NULL,
           ranking_policy = 'round_robin_v1'
       WHERE id = $1`,
      [swissStageId],
    );
    await expectPersistenceError(
      () =>
        persistence.saveCompiledRoutingPlanV2({
          ...swissFixture,
          plan: swiss,
        }),
      "ROUTING_PLAN_STAGE_FORMAT_MISMATCH",
    );

    const groups = groupPlan();
    const groupFixture = await createTournamentForPlan(groups);
    const groupStageId = groupFixture.stageIdsByKey.get(
      groups.stages[0].stageKey,
    );
    assert.ok(groupStageId);
    await database.pool.query(
      `UPDATE tournament_stages
       SET format = 'swiss',
           planned_rounds = 1,
           ranking_policy = 'swiss_v1',
           qualification_mode = 'top_n',
           advancing_count = $2,
           seeding_policy = 'standings_order',
           result_seeding_policy = 'standings_order',
           group_count = NULL,
           participants_per_group = NULL,
           qualifiers_per_group = NULL
       WHERE id = $1`,
      [groupStageId, groups.stages[1].exactParticipantCapacity],
    );
    await expectPersistenceError(
      () =>
        persistence.saveCompiledRoutingPlanV2({
          ...groupFixture,
          plan: groups,
        }),
      "ROUTING_PLAN_STAGE_FORMAT_MISMATCH",
    );

    const v2Only = doubleEliminationPlan();
    const v2OnlyFixture = await createTournamentForPlan(v2Only);
    await expectPersistenceError(
      () =>
        persistence.saveCompiledRoutingPlanV2({
          ...v2OnlyFixture,
          plan: v2Only,
        }),
      "ROUTING_PLAN_STAGE_FORMAT_MISMATCH",
    );
  });

  test("allows only one of two concurrent conflicting writes for the same revision", async () => {
    const plan = oneStagePlan();
    const changed = structuredClone(plan);
    changed.stages[0].name = "Conflicting plan";
    const fixture = await createTournamentForPlan(plan);
    const settled = await Promise.allSettled([
      persistence.saveCompiledRoutingPlanV2({ ...fixture, plan }),
      persistence.saveCompiledRoutingPlanV2({
        ...fixture,
        plan: changed,
      }),
    ]);
    assert.equal(
      settled.filter((result) => result.status === "fulfilled").length,
      1,
    );
    const rejected = settled.find(
      (result): result is PromiseRejectedResult =>
        result.status === "rejected",
    );
    assert.ok(rejected);
    assert.ok(
      rejected.reason instanceof errors.RoutingPlanPersistenceError,
    );
    assert.equal(
      rejected.reason.code,
      "ROUTING_PLAN_VERSION_CONFLICT",
    );
  });

  test("does not introduce execution assignments or routing history tables", async () => {
    const forbidden = await database.pool.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = current_schema()
         AND (
           table_name LIKE 'tournament_routing%assignment%'
           OR table_name LIKE 'tournament_routing%history%'
           OR table_name LIKE 'tournament_routing%execution%'
         )`,
    );
    assert.equal(forbidden.rowCount, 0);
  });

  test("is not imported by V1 runtime, routes, Backup or deployment task entrypoints", async () => {
    const files = [
      "../src/application/stages/stage-lifecycle.ts",
      "../src/application/matches/complete-match.ts",
      "../src/application/matches/revert-match.ts",
      "../src/routes/tournaments.ts",
      "../src/application/backups/backup-v2.ts",
      "../src/application/backups/backup-v3.ts",
      "../src/deployment-task.ts",
    ];
    const contents = await Promise.all(
      files.map((path) => readFile(new URL(path, import.meta.url), "utf8")),
    );
    assert.ok(
      contents.every(
        (content) =>
          !content.includes("routing-plan-persistence") &&
          !content.includes("tournamentRoutingPlansTable"),
      ),
    );
  });
});

describe("Tournament routing persisted corruption detection", () => {
  test("detects a checksum mismatch", async () => {
    const plan = oneStagePlan();
    const fixture = await createTournamentForPlan(plan);
    const saved = await persistence.saveCompiledRoutingPlanV2({
      ...fixture,
      plan,
    });
    await database.db
      .update(database.tournamentRoutingPlansTable)
      .set({ checksum: "0".repeat(64) })
      .where(eq(database.tournamentRoutingPlansTable.id, saved.planId));
    await expectPersistenceError(
      () => persistence.loadCompiledRoutingPlanV2({ planId: saved.planId }),
      "ROUTING_PLAN_CHECKSUM_MISMATCH",
    );
  });

  test("detects canonical payload drift even when its checksum is updated", async () => {
    const plan = oneStagePlan();
    const fixture = await createTournamentForPlan(plan);
    const saved = await persistence.saveCompiledRoutingPlanV2({
      ...fixture,
      plan,
    });
    const changed = structuredClone(plan);
    changed.stages[0].name = "Payload drift";
    const canonicalPayload =
      serializeCompiledTournamentRoutingPlanV2(changed);
    const checksum = createHash("sha256")
      .update(canonicalPayload, "utf8")
      .digest("hex");
    await database.db
      .update(database.tournamentRoutingPlansTable)
      .set({ canonicalPayload, checksum })
      .where(eq(database.tournamentRoutingPlansTable.id, saved.planId));
    await expectPersistenceError(
      () => persistence.loadCompiledRoutingPlanV2({ planId: saved.planId }),
      "ROUTING_PLAN_PAYLOAD_MISMATCH",
    );
  });

  test("detects a missing relational dependency as a corrupted graph", async () => {
    const plan = oneStagePlan();
    const fixture = await createTournamentForPlan(plan);
    const saved = await persistence.saveCompiledRoutingPlanV2({
      ...fixture,
      plan,
    });
    const [dependency] = await database.db
      .select()
      .from(database.tournamentRoutingDependenciesTable)
      .where(
        eq(database.tournamentRoutingDependenciesTable.planId, saved.planId),
      )
      .orderBy(asc(database.tournamentRoutingDependenciesTable.ordinal));
    await database.db
      .delete(database.tournamentRoutingDependenciesTable)
      .where(
        eq(
          database.tournamentRoutingDependenciesTable.routeId,
          dependency.routeId,
        ),
      );
    await expectPersistenceError(
      () => persistence.loadCompiledRoutingPlanV2({ planId: saved.planId }),
      "CORRUPTED_ROUTING_GRAPH",
    );
  });

  test("rejects non-contiguous top-level and dependency ordinals", async () => {
    const plan = swissPlan();
    const fixture = await createTournamentForPlan(plan);
    const saved = await persistence.saveCompiledRoutingPlanV2({
      ...fixture,
      plan,
    });
    await database.pool.query(
      `UPDATE tournament_routing_stages
       SET ordinal = ordinal + 5
       WHERE plan_id = $1`,
      [saved.planId],
    );
    await expectPersistenceError(
      () => persistence.loadCompiledRoutingPlanV2({ planId: saved.planId }),
      "CORRUPTED_ROUTING_ORDINAL_SEQUENCE",
    );
    await database.pool.query(
      `UPDATE tournament_routing_stages
       SET ordinal = ordinal - 5
       WHERE plan_id = $1`,
      [saved.planId],
    );
    await database.pool.query(
      `UPDATE tournament_routing_stages
       SET ordinal = 2
       WHERE plan_id = $1 AND ordinal = 1`,
      [saved.planId],
    );
    await expectPersistenceError(
      () => persistence.loadCompiledRoutingPlanV2({ planId: saved.planId }),
      "CORRUPTED_ROUTING_ORDINAL_SEQUENCE",
    );
    await database.pool.query(
      `UPDATE tournament_routing_stages
       SET ordinal = 1
       WHERE plan_id = $1 AND ordinal = 2`,
      [saved.planId],
    );

    await database.pool.query(
      `UPDATE tournament_routing_dependencies
       SET ordinal = ordinal + 4
       WHERE plan_id = $1`,
      [saved.planId],
    );
    await expectPersistenceError(
      () => persistence.loadCompiledRoutingPlanV2({ planId: saved.planId }),
      "CORRUPTED_ROUTING_ORDINAL_SEQUENCE",
    );
  });

  test("rejects child rows that do not belong to their discriminant", async () => {
    const simple = oneStagePlan();
    const simpleFixture = await createTournamentForPlan(simple);
    const simpleSaved = await persistence.saveCompiledRoutingPlanV2({
      ...simpleFixture,
      plan: simple,
    });
    const stage = await database.pool.query(
      `SELECT id FROM tournament_routing_stages
       WHERE plan_id = $1 LIMIT 1`,
      [simpleSaved.planId],
    );
    await database.pool.query(
      `INSERT INTO tournament_routing_stage_group_sizes(
         plan_id, routing_stage_id, position, exact_group_size
       ) VALUES ($1, $2, 0, 1)`,
      [simpleSaved.planId, stage.rows[0].id],
    );
    await expectPersistenceError(
      () =>
        persistence.loadCompiledRoutingPlanV2({ planId: simpleSaved.planId }),
      "UNEXPECTED_ROUTING_CHILD_ROW",
    );

    const swiss = swissPlan();
    const swissFixture = await createTournamentForPlan(swiss);
    const swissSaved = await persistence.saveCompiledRoutingPlanV2({
      ...swissFixture,
      plan: swiss,
    });
    const topN = await database.pool.query(
      `SELECT selection.plan_id, selection.route_id
       FROM tournament_routing_selections selection
       WHERE selection.plan_id = $1
         AND selection.selection_type = 'top_n'
       LIMIT 1`,
      [swissSaved.planId],
    );
    assert.equal(topN.rowCount, 1);
    await database.pool.query(
      `INSERT INTO tournament_routing_selection_group_sizes(
         plan_id, route_id, position, exact_group_size
       ) VALUES ($1, $2, 0, 1)`,
      [topN.rows[0].plan_id, topN.rows[0].route_id],
    );
    await expectPersistenceError(
      () =>
        persistence.loadCompiledRoutingPlanV2({ planId: swissSaved.planId }),
      "UNEXPECTED_ROUTING_CHILD_ROW",
    );

    const routed = namedOutputPersistencePlan();
    for (const sourceType of ["match_outcome", "stage_entry"]) {
      const routedFixture = await createTournamentForPlan(routed);
      const routedSaved = await persistence.saveCompiledRoutingPlanV2({
        ...routedFixture,
        plan: routed,
      });
      const source = await database.pool.query(
        `SELECT source.plan_id, source.route_id, route.reserved_slots
         FROM tournament_routing_route_sources source
         JOIN tournament_routing_routes route ON route.id = source.route_id
         WHERE source.plan_id = $1 AND source.source_type = $2
         LIMIT 1`,
        [routedSaved.planId, sourceType],
      );
      assert.equal(source.rowCount, 1);
      await database.pool.query(
        `INSERT INTO tournament_routing_selections(
           route_id, plan_id, routing_stage_id, selection_type,
           exact_cardinality
         ) VALUES ($1, $2, NULL, 'all', $3)`,
        [
          source.rows[0].route_id,
          source.rows[0].plan_id,
          source.rows[0].reserved_slots,
        ],
      );
      await expectPersistenceError(
        () =>
          persistence.loadCompiledRoutingPlanV2({
            planId: routedSaved.planId,
          }),
        "UNEXPECTED_ROUTING_CHILD_ROW",
      );
    }
  });

  test("rejects missing or duplicate mandatory route children", async () => {
    const missingPlan = oneStagePlan();
    const missingFixture = await createTournamentForPlan(missingPlan);
    const missingSaved = await persistence.saveCompiledRoutingPlanV2({
      ...missingFixture,
      plan: missingPlan,
    });
    await database.pool.query(
      `DELETE FROM tournament_routing_route_sources
       WHERE route_id = (
         SELECT route_id FROM tournament_routing_route_sources
         WHERE plan_id = $1 LIMIT 1
       )`,
      [missingSaved.planId],
    );
    await expectPersistenceError(
      () =>
        persistence.loadCompiledRoutingPlanV2({ planId: missingSaved.planId }),
      "CORRUPTED_ROUTING_GRAPH",
    );

    const duplicatePlan = namedOutputPersistencePlan();
    const duplicateFixture = await createTournamentForPlan(duplicatePlan);
    const duplicateSaved = await persistence.saveCompiledRoutingPlanV2({
      ...duplicateFixture,
      plan: duplicatePlan,
    });
    const target = await database.pool.query(
      `SELECT * FROM tournament_routing_route_targets
       WHERE plan_id = $1 AND target_type <> 'match_slot' LIMIT 1`,
      [duplicateSaved.planId],
    );
    assert.equal(target.rowCount, 1);
    await database.pool.query(
      "ALTER TABLE tournament_routing_route_targets DROP CONSTRAINT tournament_routing_route_targets_pkey",
    );
    try {
      const row = target.rows[0];
      await database.pool.query(
        `INSERT INTO tournament_routing_route_targets(
           route_id, plan_id, target_type, routing_stage_id,
           entry_point_id, logical_match_id, output_id, match_slot
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          row.route_id,
          row.plan_id,
          row.target_type,
          row.routing_stage_id,
          row.entry_point_id,
          row.logical_match_id,
          row.output_id,
          row.match_slot,
        ],
      );
      await expectPersistenceError(
        () =>
          persistence.loadCompiledRoutingPlanV2({
            planId: duplicateSaved.planId,
          }),
        "UNEXPECTED_ROUTING_CHILD_ROW",
      );
    } finally {
      const row = target.rows[0];
      await database.pool.query(
        "DELETE FROM tournament_routing_route_targets WHERE route_id = $1",
        [row.route_id],
      );
      await database.pool.query(
        `INSERT INTO tournament_routing_route_targets(
           route_id, plan_id, target_type, routing_stage_id,
           entry_point_id, logical_match_id, output_id, match_slot
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          row.route_id,
          row.plan_id,
          row.target_type,
          row.routing_stage_id,
          row.entry_point_id,
          row.logical_match_id,
          row.output_id,
          row.match_slot,
        ],
      );
      await database.pool.query(
        "ALTER TABLE tournament_routing_route_targets ADD CONSTRAINT tournament_routing_route_targets_pkey PRIMARY KEY(route_id)",
      );
    }
  });

  test("rejects an additional condition and an additional logical match slot", async () => {
    const plan = namedOutputPersistencePlan();
    const fixture = await createTournamentForPlan(plan);
    const saved = await persistence.saveCompiledRoutingPlanV2({
      ...fixture,
      plan,
    });
    const condition = await database.pool.query(
      `SELECT * FROM tournament_routing_route_conditions
       WHERE plan_id = $1 LIMIT 1`,
      [saved.planId],
    );
    assert.equal(condition.rowCount, 1);
    await database.pool.query(
      "ALTER TABLE tournament_routing_route_conditions DROP CONSTRAINT tournament_routing_route_conditions_pkey",
    );
    try {
      const row = condition.rows[0];
      await database.pool.query(
        `INSERT INTO tournament_routing_route_conditions(
           route_id, plan_id, condition_type, lineage_type,
           lineage_entry_point_id, lineage_route_id, logical_match_id
         ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          row.route_id,
          row.plan_id,
          row.condition_type,
          row.lineage_type,
          row.lineage_entry_point_id,
          row.lineage_route_id,
          row.logical_match_id,
        ],
      );
      await expectPersistenceError(
        () => persistence.loadCompiledRoutingPlanV2({ planId: saved.planId }),
        "UNEXPECTED_ROUTING_CHILD_ROW",
      );
    } finally {
      const row = condition.rows[0];
      await database.pool.query(
        "DELETE FROM tournament_routing_route_conditions WHERE route_id = $1",
        [row.route_id],
      );
      await database.pool.query(
        `INSERT INTO tournament_routing_route_conditions(
           route_id, plan_id, condition_type, lineage_type,
           lineage_entry_point_id, lineage_route_id, logical_match_id
         ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          row.route_id,
          row.plan_id,
          row.condition_type,
          row.lineage_type,
          row.lineage_entry_point_id,
          row.lineage_route_id,
          row.logical_match_id,
        ],
      );
      await database.pool.query(
        "ALTER TABLE tournament_routing_route_conditions ADD CONSTRAINT tournament_routing_route_conditions_pkey PRIMARY KEY(route_id)",
      );
    }

    const match = await database.pool.query(
      `SELECT plan_id, routing_stage_id, logical_match_id
       FROM tournament_routing_logical_match_slots
       WHERE plan_id = $1 LIMIT 1`,
      [saved.planId],
    );
    assert.equal(match.rowCount, 1);
    await database.pool.query(
      `ALTER TABLE tournament_routing_logical_match_slots
       DROP CONSTRAINT tournament_routing_logical_match_slots_supported`,
    );
    try {
      await database.pool.query(
        `INSERT INTO tournament_routing_logical_match_slots(
           plan_id, routing_stage_id, logical_match_id, slot
         ) VALUES ($1,$2,$3,3)`,
        [
          match.rows[0].plan_id,
          match.rows[0].routing_stage_id,
          match.rows[0].logical_match_id,
        ],
      );
      await expectPersistenceError(
        () => persistence.loadCompiledRoutingPlanV2({ planId: saved.planId }),
        "MISSING_LOGICAL_MATCH_SLOT",
      );
    } finally {
      await database.pool.query(
        `DELETE FROM tournament_routing_logical_match_slots
         WHERE plan_id = $1 AND logical_match_id = $2 AND slot = 3`,
        [match.rows[0].plan_id, match.rows[0].logical_match_id],
      );
      await database.pool.query(
        `ALTER TABLE tournament_routing_logical_match_slots
         ADD CONSTRAINT tournament_routing_logical_match_slots_supported
         CHECK (slot IN (1, 2))`,
      );
    }
  });

  test("binds named_output selection to the route source stage in DB and reader", async () => {
    const plan = namedOutputPersistencePlan();
    const fixture = await createTournamentForPlan(plan);
    const saved = await persistence.saveCompiledRoutingPlanV2({
      ...fixture,
      plan,
    });
    const selection = await database.pool.query(
      `SELECT selection.route_id, selection.plan_id,
              selection.routing_stage_id, selection.named_output_id,
              output.output_key
       FROM tournament_routing_selections selection
       JOIN tournament_routing_outputs output
         ON output.id = selection.named_output_id
       WHERE selection.plan_id = $1
         AND selection.selection_type = 'named_output'
       LIMIT 1`,
      [saved.planId],
    );
    assert.equal(selection.rowCount, 1);
    await database.pool.query(
      "ALTER TABLE tournament_stages DISABLE TRIGGER USER",
    );
    let foreignStageId: number;
    try {
      const inserted = await database.pool.query(
        `INSERT INTO tournament_stages(
           tournament_id, stage_key, position, name, format, status,
           participant_count, best_of, ranking_policy, qualification_mode,
           seeding_policy
         ) VALUES ($1, 'named-output-foreign', 3, 'Foreign', 'round_robin',
                   'planned', 4, 1, 'round_robin_v1', 'none',
                   'standings_order')
         RETURNING id`,
        [fixture.tournamentId],
      );
      foreignStageId = inserted.rows[0].id;
    } finally {
      await database.pool.query(
        "ALTER TABLE tournament_stages ENABLE TRIGGER USER",
      );
    }
    const routingStage = await database.pool.query(
      `INSERT INTO tournament_routing_stages(
         plan_id, tournament_id, stage_id, ordinal, stage_key, name,
         display_order, exact_participant_capacity,
         selection_capability_type, format_id, format_rules_version
       ) VALUES (
         $1,$2,$3,
         (SELECT count(*) FROM tournament_routing_stages WHERE plan_id = $1),
         'named-output-foreign','Foreign',3,4,'none','round_robin',1
       )
       RETURNING id`,
      [saved.planId, fixture.tournamentId, foreignStageId!],
    );
    const foreignOutput = await database.pool.query(
      `INSERT INTO tournament_routing_outputs(
         plan_id, routing_stage_id, ordinal, output_key, name,
         exact_capacity, priority
       ) VALUES (
         $1,$2,
         (SELECT count(*) FROM tournament_routing_outputs WHERE plan_id = $1),
         $3,NULL,1,99
       )
       RETURNING id`,
      [
        saved.planId,
        routingStage.rows[0].id,
        selection.rows[0].output_key,
      ],
    );
    await assert.rejects(
      database.pool.query(
        `UPDATE tournament_routing_selections
         SET named_output_id = $1 WHERE route_id = $2`,
        [foreignOutput.rows[0].id, selection.rows[0].route_id],
      ),
      /tournament_routing_selections_output_fk/,
    );

    await database.pool.query(
      "ALTER TABLE tournament_routing_selections DROP CONSTRAINT tournament_routing_selections_output_fk",
    );
    try {
      await database.pool.query(
        `UPDATE tournament_routing_selections
         SET named_output_id = $1 WHERE route_id = $2`,
        [foreignOutput.rows[0].id, selection.rows[0].route_id],
      );
      await expectPersistenceError(
        () => persistence.loadCompiledRoutingPlanV2({ planId: saved.planId }),
        "NAMED_OUTPUT_STAGE_MISMATCH",
      );
    } finally {
      await database.pool.query(
        `UPDATE tournament_routing_selections
         SET named_output_id = $1 WHERE route_id = $2`,
        [selection.rows[0].named_output_id, selection.rows[0].route_id],
      );
      await database.pool.query(
        `ALTER TABLE tournament_routing_selections
         ADD CONSTRAINT tournament_routing_selections_output_fk
         FOREIGN KEY(plan_id, routing_stage_id, named_output_id)
         REFERENCES tournament_routing_outputs(plan_id, routing_stage_id, id)`,
      );
    }
  });

  test("rejects an unknown persisted discriminant", async () => {
    const plan = oneStagePlan();
    const fixture = await createTournamentForPlan(plan);
    const saved = await persistence.saveCompiledRoutingPlanV2({
      ...fixture,
      plan,
    });
    const [source] = await database.db
      .select()
      .from(database.tournamentRoutingRouteSourcesTable)
      .where(
        eq(database.tournamentRoutingRouteSourcesTable.planId, saved.planId),
      );
    await database.pool.query(
      `ALTER TABLE tournament_routing_route_sources
       DROP CONSTRAINT tournament_routing_route_sources_shape`,
    );
    try {
      await database.db
        .update(database.tournamentRoutingRouteSourcesTable)
        .set({ sourceType: "future_source" })
        .where(
          eq(
            database.tournamentRoutingRouteSourcesTable.routeId,
            source.routeId,
          ),
        );
      await expectPersistenceError(
        () => persistence.loadCompiledRoutingPlanV2({ planId: saved.planId }),
        "UNKNOWN_PERSISTED_DISCRIMINANT",
      );
    } finally {
      await database.db
        .update(database.tournamentRoutingRouteSourcesTable)
        .set({ sourceType: source.sourceType })
        .where(
          eq(
            database.tournamentRoutingRouteSourcesTable.routeId,
            source.routeId,
          ),
        );
      await database.pool.query(
        `ALTER TABLE tournament_routing_route_sources
         ADD CONSTRAINT tournament_routing_route_sources_shape
         CHECK (
           (
             source_type = 'registration_bucket'
             AND bucket_id IS NOT NULL
             AND routing_stage_id IS NULL
             AND entry_point_id IS NULL
             AND logical_match_id IS NULL
             AND entry_position IS NULL
             AND match_outcome IS NULL
           ) OR (
             source_type = 'stage_result'
             AND bucket_id IS NULL
             AND routing_stage_id IS NOT NULL
             AND entry_point_id IS NULL
             AND logical_match_id IS NULL
             AND entry_position IS NULL
             AND match_outcome IS NULL
           ) OR (
             source_type = 'stage_entry'
             AND bucket_id IS NULL
             AND routing_stage_id IS NOT NULL
             AND entry_point_id IS NOT NULL
             AND logical_match_id IS NULL
             AND entry_position > 0
             AND match_outcome IS NULL
           ) OR (
             source_type = 'match_outcome'
             AND bucket_id IS NULL
             AND routing_stage_id IS NOT NULL
             AND entry_point_id IS NULL
             AND logical_match_id IS NOT NULL
             AND entry_position IS NULL
             AND match_outcome IN ('winner', 'loser')
           )
         )`,
      );
    }
  });

  test("rejects an unsupported persisted model version", async () => {
    const plan = oneStagePlan();
    const fixture = await createTournamentForPlan(plan);
    const saved = await persistence.saveCompiledRoutingPlanV2({
      ...fixture,
      plan,
    });
    await database.db
      .update(database.tournamentRoutingPlansTable)
      .set({ compiledPlanVersion: 99 })
      .where(eq(database.tournamentRoutingPlansTable.id, saved.planId));
    await expectPersistenceError(
      () => persistence.loadCompiledRoutingPlanV2({ planId: saved.planId }),
      "UNSUPPORTED_ROUTING_MODEL_VERSION",
    );
  });
});
