import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  DeploymentTaskError,
  CONFIGURABLE_SEEDING_V2_DEVELOPMENT_MIGRATE_SCRIPT,
  CONFIGURABLE_SEEDING_V2_DEVELOPMENT_MIGRATE_TASK,
  CONFIGURABLE_SEEDING_V2_DEVELOPMENT_PREFLIGHT_SCRIPT,
  CONFIGURABLE_SEEDING_V2_DEVELOPMENT_PREFLIGHT_TASK,
  CONFIGURABLE_SEEDING_V2_MIGRATE_SCRIPT,
  CONFIGURABLE_SEEDING_V2_MIGRATE_TASK,
  CONFIGURABLE_SEEDING_V2_PREFLIGHT_SCRIPT,
  CONFIGURABLE_SEEDING_V2_PREFLIGHT_TASK,
  FLEXIBLE_GROUP_STAGES_V2_DEVELOPMENT_MIGRATE_SCRIPT,
  FLEXIBLE_GROUP_STAGES_V2_DEVELOPMENT_MIGRATE_TASK,
  FLEXIBLE_GROUP_STAGES_V2_DEVELOPMENT_PREFLIGHT_SCRIPT,
  FLEXIBLE_GROUP_STAGES_V2_DEVELOPMENT_PREFLIGHT_TASK,
  FLEXIBLE_GROUP_STAGES_V2_MIGRATE_SCRIPT,
  FLEXIBLE_GROUP_STAGES_V2_MIGRATE_TASK,
  FLEXIBLE_GROUP_STAGES_V2_PREFLIGHT_SCRIPT,
  FLEXIBLE_GROUP_STAGES_V2_PREFLIGHT_TASK,
  SERIES_V1_PREFLIGHT_SCRIPT,
  SERIES_V1_PREFLIGHT_TASK,
  SERIES_V1_RESET_SCRIPT,
  SERIES_V1_RESET_TASK,
  TOURNAMENT_STAGES_V1_DEVELOPMENT_MIGRATE_SCRIPT,
  TOURNAMENT_STAGES_V1_DEVELOPMENT_MIGRATE_TASK,
  TOURNAMENT_STAGES_V1_DEVELOPMENT_PREFLIGHT_SCRIPT,
  TOURNAMENT_STAGES_V1_DEVELOPMENT_PREFLIGHT_TASK,
  TOURNAMENT_STAGES_V1_MIGRATE_SCRIPT,
  TOURNAMENT_STAGES_V1_MIGRATE_TASK,
  TOURNAMENT_STAGES_V1_PREFLIGHT_SCRIPT,
  TOURNAMENT_STAGES_V1_PREFLIGHT_TASK,
  TOURNAMENT_ENGINE_V2_PREFLIGHT_SCRIPT,
  TOURNAMENT_ENGINE_V2_PREFLIGHT_TASK,
  runDeploymentStartup,
} from "../src/deployment-task";

describe("Replit production deployment task runner", () => {
  test("starts the API normally when DEPLOYMENT_TASK is absent", async () => {
    const events: string[] = [];

    const result = await runDeploymentStartup(
      {},
      {
        runDatabaseScript: async (script) => {
          events.push(script);
          return 0;
        },
        startApi: () => {
          events.push("api");
        },
      },
    );

    assert.deepEqual(events, ["api"]);
    assert.deepEqual(result, {
      mode: "normal",
      apiStarted: true,
      exitCode: 0,
    });
  });

  test("runs the read-only preflight and exits without starting the API", async () => {
    const events: string[] = [];

    const result = await runDeploymentStartup(
      { DEPLOYMENT_TASK: SERIES_V1_PREFLIGHT_TASK },
      {
        runDatabaseScript: async (script) => {
          events.push(script);
          return 0;
        },
        startApi: () => {
          events.push("api");
        },
      },
    );

    assert.deepEqual(events, [SERIES_V1_PREFLIGHT_SCRIPT]);
    assert.deepEqual(result, {
      mode: "preflight",
      apiStarted: false,
      exitCode: 0,
    });
  });

  test("runs the guarded reset before starting the API", async () => {
    const events: string[] = [];

    const result = await runDeploymentStartup(
      { DEPLOYMENT_TASK: SERIES_V1_RESET_TASK },
      {
        runDatabaseScript: async (script) => {
          events.push(script);
          return 0;
        },
        startApi: () => {
          events.push("api");
        },
      },
    );

    assert.deepEqual(events, [SERIES_V1_RESET_SCRIPT, "api"]);
    assert.deepEqual(result, {
      mode: "reset",
      apiStarted: true,
      exitCode: 0,
    });
  });

  test("does not start the API when the guarded reset fails", async () => {
    let apiStarted = false;

    await assert.rejects(
      runDeploymentStartup(
        { DEPLOYMENT_TASK: SERIES_V1_RESET_TASK },
        {
          runDatabaseScript: async () => 23,
          startApi: () => {
            apiStarted = true;
          },
        },
      ),
      (error: unknown) =>
        error instanceof DeploymentTaskError && error.exitCode === 23,
    );
    assert.equal(apiStarted, false);
  });

  test("runs the read-only Tournament Stages preflight without starting the API", async () => {
    const events: string[] = [];

    const result = await runDeploymentStartup(
      { DEPLOYMENT_TASK: TOURNAMENT_STAGES_V1_PREFLIGHT_TASK },
      {
        runDatabaseScript: async (script) => {
          events.push(script);
          return 0;
        },
        startApi: () => {
          events.push("api");
        },
      },
    );

    assert.deepEqual(events, [TOURNAMENT_STAGES_V1_PREFLIGHT_SCRIPT]);
    assert.deepEqual(result, {
      mode: "tournament_stages_preflight",
      apiStarted: false,
      exitCode: 0,
    });
  });

  test("preserves a nonzero Tournament Stages preflight result and keeps the API stopped", async () => {
    let apiStarted = false;

    const result = await runDeploymentStartup(
      { DEPLOYMENT_TASK: TOURNAMENT_STAGES_V1_PREFLIGHT_TASK },
      {
        runDatabaseScript: async () => 2,
        startApi: () => {
          apiStarted = true;
        },
      },
    );

    assert.equal(apiStarted, false);
    assert.deepEqual(result, {
      mode: "tournament_stages_preflight",
      apiStarted: false,
      exitCode: 2,
    });
  });

  test("runs the guarded Tournament Stages migration before starting the API", async () => {
    const events: string[] = [];

    const result = await runDeploymentStartup(
      { DEPLOYMENT_TASK: TOURNAMENT_STAGES_V1_MIGRATE_TASK },
      {
        runDatabaseScript: async (script) => {
          events.push(script);
          return 0;
        },
        startApi: () => {
          events.push("api");
        },
      },
    );

    assert.deepEqual(events, [TOURNAMENT_STAGES_V1_MIGRATE_SCRIPT, "api"]);
    assert.deepEqual(result, {
      mode: "tournament_stages_migrate",
      apiStarted: true,
      exitCode: 0,
    });
  });

  test("does not start the API when the Tournament Stages migration fails", async () => {
    let apiStarted = false;

    await assert.rejects(
      runDeploymentStartup(
        { DEPLOYMENT_TASK: TOURNAMENT_STAGES_V1_MIGRATE_TASK },
        {
          runDatabaseScript: async () => 29,
          startApi: () => {
            apiStarted = true;
          },
        },
      ),
      (error: unknown) =>
        error instanceof DeploymentTaskError && error.exitCode === 29,
    );
    assert.equal(apiStarted, false);
  });

  test("runs the Development Tournament Stages preflight without starting the API", async () => {
    const events: string[] = [];

    const result = await runDeploymentStartup(
      { DEPLOYMENT_TASK: TOURNAMENT_STAGES_V1_DEVELOPMENT_PREFLIGHT_TASK },
      {
        runDatabaseScript: async (script) => {
          events.push(script);
          return 0;
        },
        startApi: () => {
          events.push("api");
        },
      },
    );

    assert.deepEqual(events, [
      TOURNAMENT_STAGES_V1_DEVELOPMENT_PREFLIGHT_SCRIPT,
    ]);
    assert.deepEqual(result, {
      mode: "tournament_stages_development_preflight",
      apiStarted: false,
      exitCode: 0,
    });
  });

  test("runs the guarded Development Tournament Stages migration before starting the API", async () => {
    const events: string[] = [];

    const result = await runDeploymentStartup(
      { DEPLOYMENT_TASK: TOURNAMENT_STAGES_V1_DEVELOPMENT_MIGRATE_TASK },
      {
        runDatabaseScript: async (script) => {
          events.push(script);
          return 0;
        },
        startApi: () => {
          events.push("api");
        },
      },
    );

    assert.deepEqual(events, [
      TOURNAMENT_STAGES_V1_DEVELOPMENT_MIGRATE_SCRIPT,
      "api",
    ]);
    assert.deepEqual(result, {
      mode: "tournament_stages_development_migrate",
      apiStarted: true,
      exitCode: 0,
    });
  });

  test("keeps the API stopped when the Development Tournament Stages migration fails", async () => {
    let apiStarted = false;

    await assert.rejects(
      runDeploymentStartup(
        { DEPLOYMENT_TASK: TOURNAMENT_STAGES_V1_DEVELOPMENT_MIGRATE_TASK },
        {
          runDatabaseScript: async () => 31,
          startApi: () => {
            apiStarted = true;
          },
        },
      ),
      (error: unknown) =>
        error instanceof DeploymentTaskError && error.exitCode === 31,
    );
    assert.equal(apiStarted, false);
  });


  test("runs the read-only Flexible Group Stages preflight without starting the API", async () => {
    const events: string[] = [];
    const result = await runDeploymentStartup(
      { DEPLOYMENT_TASK: FLEXIBLE_GROUP_STAGES_V2_PREFLIGHT_TASK },
      {
        runDatabaseScript: async (script) => { events.push(script); return 0; },
        startApi: () => { events.push("api"); },
      },
    );
    assert.deepEqual(events, [FLEXIBLE_GROUP_STAGES_V2_PREFLIGHT_SCRIPT]);
    assert.deepEqual(result, {
      mode: "flexible_group_stages_preflight",
      apiStarted: false,
      exitCode: 0,
    });
  });

  test("runs the guarded Flexible Group Stages migration before starting the API", async () => {
    const events: string[] = [];
    const result = await runDeploymentStartup(
      { DEPLOYMENT_TASK: FLEXIBLE_GROUP_STAGES_V2_MIGRATE_TASK },
      {
        runDatabaseScript: async (script) => { events.push(script); return 0; },
        startApi: () => { events.push("api"); },
      },
    );
    assert.deepEqual(events, [FLEXIBLE_GROUP_STAGES_V2_MIGRATE_SCRIPT, "api"]);
    assert.deepEqual(result, {
      mode: "flexible_group_stages_migrate",
      apiStarted: true,
      exitCode: 0,
    });
  });

  test("keeps the API stopped when the Flexible Group Stages migration fails", async () => {
    let apiStarted = false;
    await assert.rejects(
      runDeploymentStartup(
        { DEPLOYMENT_TASK: FLEXIBLE_GROUP_STAGES_V2_MIGRATE_TASK },
        {
          runDatabaseScript: async () => 37,
          startApi: () => { apiStarted = true; },
        },
      ),
      (error: unknown) => error instanceof DeploymentTaskError && error.exitCode === 37,
    );
    assert.equal(apiStarted, false);
  });

  test("runs the Development Flexible Group Stages preflight without starting the API", async () => {
    const events: string[] = [];
    const result = await runDeploymentStartup(
      { DEPLOYMENT_TASK: FLEXIBLE_GROUP_STAGES_V2_DEVELOPMENT_PREFLIGHT_TASK },
      {
        runDatabaseScript: async (script) => { events.push(script); return 0; },
        startApi: () => { events.push("api"); },
      },
    );
    assert.deepEqual(events, [FLEXIBLE_GROUP_STAGES_V2_DEVELOPMENT_PREFLIGHT_SCRIPT]);
    assert.deepEqual(result, {
      mode: "flexible_group_stages_development_preflight",
      apiStarted: false,
      exitCode: 0,
    });
  });

  test("runs the Development Flexible Group Stages migration before starting the API", async () => {
    const events: string[] = [];
    const result = await runDeploymentStartup(
      { DEPLOYMENT_TASK: FLEXIBLE_GROUP_STAGES_V2_DEVELOPMENT_MIGRATE_TASK },
      {
        runDatabaseScript: async (script) => { events.push(script); return 0; },
        startApi: () => { events.push("api"); },
      },
    );
    assert.deepEqual(events, [FLEXIBLE_GROUP_STAGES_V2_DEVELOPMENT_MIGRATE_SCRIPT, "api"]);
    assert.deepEqual(result, {
      mode: "flexible_group_stages_development_migrate",
      apiStarted: true,
      exitCode: 0,
    });
  });

  test("runs the read-only Configurable Seeding preflight without starting the API", async () => {
    const events: string[] = [];
    const result = await runDeploymentStartup(
      { DEPLOYMENT_TASK: CONFIGURABLE_SEEDING_V2_PREFLIGHT_TASK },
      {
        runDatabaseScript: async (script) => { events.push(script); return 0; },
        startApi: () => { events.push("api"); },
      },
    );
    assert.deepEqual(events, [CONFIGURABLE_SEEDING_V2_PREFLIGHT_SCRIPT]);
    assert.deepEqual(result, {
      mode: "configurable_seeding_preflight",
      apiStarted: false,
      exitCode: 0,
    });
  });

  test("runs the guarded Configurable Seeding migration before starting the API", async () => {
    const events: string[] = [];
    const result = await runDeploymentStartup(
      { DEPLOYMENT_TASK: CONFIGURABLE_SEEDING_V2_MIGRATE_TASK },
      {
        runDatabaseScript: async (script) => { events.push(script); return 0; },
        startApi: () => { events.push("api"); },
      },
    );
    assert.deepEqual(events, [CONFIGURABLE_SEEDING_V2_MIGRATE_SCRIPT, "api"]);
    assert.deepEqual(result, {
      mode: "configurable_seeding_migrate",
      apiStarted: true,
      exitCode: 0,
    });
  });

  test("keeps the API stopped when the Configurable Seeding migration fails", async () => {
    let apiStarted = false;
    await assert.rejects(
      runDeploymentStartup(
        { DEPLOYMENT_TASK: CONFIGURABLE_SEEDING_V2_MIGRATE_TASK },
        {
          runDatabaseScript: async () => 41,
          startApi: () => { apiStarted = true; },
        },
      ),
      (error: unknown) => error instanceof DeploymentTaskError && error.exitCode === 41,
    );
    assert.equal(apiStarted, false);
  });

  test("supports Development Configurable Seeding tasks", async () => {
    const preflightEvents: string[] = [];
    const preflight = await runDeploymentStartup(
      { DEPLOYMENT_TASK: CONFIGURABLE_SEEDING_V2_DEVELOPMENT_PREFLIGHT_TASK },
      {
        runDatabaseScript: async (script) => { preflightEvents.push(script); return 0; },
        startApi: () => { preflightEvents.push("api"); },
      },
    );
    assert.deepEqual(preflightEvents, [CONFIGURABLE_SEEDING_V2_DEVELOPMENT_PREFLIGHT_SCRIPT]);
    assert.equal(preflight.mode, "configurable_seeding_development_preflight");

    const migrationEvents: string[] = [];
    const migration = await runDeploymentStartup(
      { DEPLOYMENT_TASK: CONFIGURABLE_SEEDING_V2_DEVELOPMENT_MIGRATE_TASK },
      {
        runDatabaseScript: async (script) => { migrationEvents.push(script); return 0; },
        startApi: () => { migrationEvents.push("api"); },
      },
    );
    assert.deepEqual(migrationEvents, [CONFIGURABLE_SEEDING_V2_DEVELOPMENT_MIGRATE_SCRIPT, "api"]);
    assert.equal(migration.mode, "configurable_seeding_development_migrate");
  });

  test("runs the orchestrated Tournament Engine V2 preflight read-only and keeps the API stopped", async () => {
    const events: string[] = [];
    const result = await runDeploymentStartup(
      { DEPLOYMENT_TASK: TOURNAMENT_ENGINE_V2_PREFLIGHT_TASK },
      {
        runDatabaseScript: async (script) => {
          events.push(script);
          return 0;
        },
        startApi: () => {
          events.push("api");
        },
      },
    );

    assert.deepEqual(events, [TOURNAMENT_ENGINE_V2_PREFLIGHT_SCRIPT]);
    assert.deepEqual(result, {
      mode: "tournament_engine_v2_preflight",
      apiStarted: false,
      exitCode: 0,
    });
  });

  test("preserves a Tournament Engine V2 STOP result and keeps the API stopped", async () => {
    const events: string[] = [];
    const result = await runDeploymentStartup(
      { DEPLOYMENT_TASK: TOURNAMENT_ENGINE_V2_PREFLIGHT_TASK },
      {
        runDatabaseScript: async (script) => {
          events.push(script);
          return 43;
        },
        startApi: () => {
          events.push("api");
        },
      },
    );

    assert.deepEqual(events, [TOURNAMENT_ENGINE_V2_PREFLIGHT_SCRIPT]);
    assert.deepEqual(result, {
      mode: "tournament_engine_v2_preflight",
      apiStarted: false,
      exitCode: 43,
    });
  });

});
