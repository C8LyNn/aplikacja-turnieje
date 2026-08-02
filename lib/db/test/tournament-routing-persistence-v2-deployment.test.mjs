import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, test } from "node:test";
import pg from "pg";
import {
  ROUTING_PERSISTENCE_TABLES,
  classifyRoutingPersistenceSchema,
  collectRoutingPersistencePreflight,
  loadRoutingPersistencePreflightConfig,
} from "../scripts/preflight-tournament-routing-persistence-v2.mjs";
import {
  ROUTING_PERSISTENCE_CATALOG_MANIFEST,
  classifyRoutingPersistenceCatalog,
  inspectRoutingPersistenceCatalog,
} from "../scripts/tournament-routing-persistence-v2-catalog.mjs";

function catalog(overrides = {}) {
  return {
    relations: [],
    factCount: 0,
    signature: null,
    forbiddenIndexes: [],
    foreignNamedObjects: [],
    externalDependencies: [],
    ...overrides,
  };
}

describe("Tournament routing persistence v2 preflight", () => {
  test("requires explicit database and schema guards", () => {
    assert.throws(
      () => loadRoutingPersistencePreflightConfig({ DATABASE_URL: "postgresql://local" }),
      /EXPECTED_DATABASE_NAME/,
    );
    assert.throws(
      () =>
        loadRoutingPersistencePreflightConfig({
          DATABASE_URL: "postgresql://local",
          EXPECTED_DATABASE_NAME: "routing_test",
          EXPECTED_DATABASE_SCHEMA: "public; drop schema public",
        }),
      /simple SQL identifier/,
    );
  });

  test("classifies an absent catalog as needed", () => {
    assert.deepEqual(
      classifyRoutingPersistenceSchema({
        databaseMatches: true,
        schemaMatches: true,
        catalog: catalog(),
      }),
      {
        safe: true,
        status: "needed",
        reasons: [],
        tableCount: 0,
        requiredTableCount: 15,
        factCount: 0,
        requiredFactCount: ROUTING_PERSISTENCE_CATALOG_MANIFEST.factCount,
        signature: null,
        expectedSignature: ROUTING_PERSISTENCE_CATALOG_MANIFEST.signature,
      },
    );
  });

  test("classifies exact, conflicting and unsafe catalogs distinctly", () => {
    const allRelations = ROUTING_PERSISTENCE_TABLES.map((name) => ({
      name,
      relkind: "r",
    }));
    assert.equal(
      classifyRoutingPersistenceSchema({
        databaseMatches: true,
        schemaMatches: true,
        catalog: catalog({
          relations: allRelations,
          factCount: ROUTING_PERSISTENCE_CATALOG_MANIFEST.factCount,
          signature: ROUTING_PERSISTENCE_CATALOG_MANIFEST.signature,
        }),
      }).status,
      "applied",
    );
    const conflict = classifyRoutingPersistenceSchema({
      databaseMatches: true,
      schemaMatches: true,
      catalog: catalog({
        relations: allRelations,
        factCount: ROUTING_PERSISTENCE_CATALOG_MANIFEST.factCount,
        signature: "wrong-definition",
      }),
    });
    assert.equal(conflict.safe, false);
    assert.equal(conflict.status, "conflict");

    const partial = classifyRoutingPersistenceSchema({
      databaseMatches: true,
      schemaMatches: true,
      catalog: catalog({ relations: allRelations.slice(0, -1) }),
    });
    assert.equal(partial.safe, false);
    assert.equal(partial.status, "unsafe");

    const forbidden = classifyRoutingPersistenceSchema({
      databaseMatches: true,
      schemaMatches: true,
      catalog: catalog({
        relations: allRelations,
        forbiddenIndexes: ["tournament_routing_outputs_stage_idx"],
      }),
    });
    assert.equal(forbidden.safe, false);
    assert.equal(forbidden.status, "unsafe");

    const wrongKind = classifyRoutingPersistenceSchema({
      databaseMatches: true,
      schemaMatches: true,
      catalog: catalog({
        relations: [
          { name: ROUTING_PERSISTENCE_TABLES[0], relkind: "v" },
        ],
      }),
    });
    assert.equal(wrongKind.safe, false);
    assert.equal(wrongKind.status, "conflict");
  });

  test("uses only read-only catalog queries", async () => {
    const statements = [];
    const client = {
      async query(sql) {
        statements.push(sql);
        if (sql.includes("current_database()")) {
          return { rows: [{ database: "routing_test", schema: "public" }] };
        }
        if (sql.includes("AS fact_count")) {
          return { rows: [{ fact_count: 0, signature: null }] };
        }
        return { rows: [] };
      },
    };
    const report = await collectRoutingPersistencePreflight(client, {
      expectedDatabaseName: "routing_test",
      expectedSchema: "public",
    });
    assert.equal(report.safe, true);
    assert.equal(report.status, "needed");
    assert.ok(
      statements.every(
        (statement) =>
          !/\b(insert|update|delete|alter|create|drop|truncate)\b/i.test(statement),
      ),
    );
  });
});

const catalogDatabaseUrl =
  process.env.ROUTING_PERSISTENCE_TEST_DATABASE_URL?.trim();
const catalogDatabaseEnabled =
  catalogDatabaseUrl &&
  process.env.ROUTING_PERSISTENCE_TEST_CONFIRM ===
    "USE_ISOLATED_ROUTING_PERSISTENCE_TEST_DATABASE";
const migrationUrl = new URL(
  "../migrations/0012_tournament_routing_persistence_v2.sql",
  import.meta.url,
);

async function resetCatalogDatabase(client) {
  await client.query("DROP SCHEMA IF EXISTS public CASCADE");
  await client.query("CREATE SCHEMA public");
  await client.query(`
    CREATE TABLE public.tournaments(id serial PRIMARY KEY);
    CREATE TABLE public.tournament_stages(
      id serial PRIMARY KEY,
      tournament_id integer NOT NULL
        REFERENCES public.tournaments(id) ON DELETE CASCADE,
      CONSTRAINT tournament_stages_tournament_id_id_unique
        UNIQUE(tournament_id, id)
    )`);
}

async function inspect(client) {
  return classifyRoutingPersistenceCatalog(
    await inspectRoutingPersistenceCatalog(client, "public"),
  );
}

describe("Tournament routing persistence v2 catalog deployment", () => {
  test(
    "classifies exact catalog variants and makes migration retries fail closed",
    { skip: !catalogDatabaseEnabled },
    async () => {
      assert.ok(catalogDatabaseUrl);
      const parsed = new URL(catalogDatabaseUrl);
      assert.match(
        decodeURIComponent(parsed.pathname),
        /test/i,
        "The dedicated catalog database name must contain test.",
      );
      assert.ok(!/prod/i.test(`${parsed.hostname}${parsed.pathname}`));
      const client = new pg.Client({ connectionString: catalogDatabaseUrl });
      const migrationSql = await readFile(migrationUrl, "utf8");
      await client.connect();
      try {
        await resetCatalogDatabase(client);
        assert.deepEqual(
          { status: (await inspect(client)).status, safe: (await inspect(client)).safe },
          { status: "needed", safe: true },
        );

        await client.query(migrationSql);
        let report = await inspect(client);
        assert.equal(report.status, "applied");
        assert.equal(report.safe, true);
        await client.query(migrationSql);
        report = await inspect(client);
        assert.equal(report.status, "applied");

        const conflictCases = [
          `ALTER TABLE public.tournament_routing_plans
             ADD COLUMN unexpected_column integer`,
          `ALTER TABLE public.tournament_routing_plans
             DROP CONSTRAINT tournament_routing_plans_revision_positive;
           ALTER TABLE public.tournament_routing_plans
             ADD CONSTRAINT tournament_routing_plans_revision_positive
             CHECK (revision >= 0)`,
          `ALTER TABLE public.tournament_routing_buckets
             DROP CONSTRAINT tournament_routing_buckets_plan_id_fkey;
           ALTER TABLE public.tournament_routing_buckets
             ADD CONSTRAINT tournament_routing_buckets_plan_id_fkey
             FOREIGN KEY (plan_id)
             REFERENCES public.tournament_routing_plans(id)
             ON DELETE SET NULL`,
          `DROP INDEX public.tournament_routing_logical_matches_stage_idx;
           CREATE INDEX tournament_routing_logical_matches_stage_idx
             ON public.tournament_routing_logical_matches(plan_id)`,
          `ALTER TABLE public.tournament_routing_route_targets
             DROP CONSTRAINT tournament_routing_route_targets_match_slot_fk;
           ALTER TABLE public.tournament_routing_logical_match_slots
             ADD CONSTRAINT routing_test_reversed_match_slot_uq
             UNIQUE(routing_stage_id, plan_id, logical_match_id, slot);
           ALTER TABLE public.tournament_routing_route_targets
             ADD CONSTRAINT tournament_routing_route_targets_match_slot_fk
             FOREIGN KEY (
               routing_stage_id, plan_id, logical_match_id, match_slot
             )
             REFERENCES public.tournament_routing_logical_match_slots(
               routing_stage_id, plan_id, logical_match_id, slot
             )`,
        ];
        for (const corruptSql of conflictCases) {
          await client.query("BEGIN");
          await client.query(corruptSql);
          report = await inspect(client);
          assert.equal(report.status, "conflict");
          await assert.rejects(
            client.query(
              migrationSql.replace(
                /^-- migration-runner-strip-begin\r?\n[\s\S]*?^-- migration-runner-strip-end\r?\n?/gm,
                "",
              ),
            ),
            /0012 catalog conflict/,
          );
          await client.query("ROLLBACK");
          assert.equal((await inspect(client)).status, "applied");
        }

        await client.query("BEGIN");
        await client.query(
          `CREATE INDEX tournament_routing_outputs_stage_idx
             ON public.tournament_routing_outputs(routing_stage_id)`,
        );
        report = await inspect(client);
        assert.equal(report.status, "unsafe");
        await client.query("ROLLBACK");

        await client.query("BEGIN");
        await client.query(
          `CREATE TABLE public.routing_external_dependency(
             id integer PRIMARY KEY,
             plan_id integer REFERENCES public.tournament_routing_plans(id)
           )`,
        );
        report = await inspect(client);
        assert.equal(report.status, "unsafe");
        await assert.rejects(
          client.query(
            migrationSql.replace(
              /^-- migration-runner-strip-begin\r?\n[\s\S]*?^-- migration-runner-strip-end\r?\n?/gm,
              "",
            ),
          ),
          /unsafe catalog/,
        );
        await client.query("ROLLBACK");

        await resetCatalogDatabase(client);
        await client.query(
          "CREATE TABLE public.tournament_routing_plans(id integer)",
        );
        report = await inspect(client);
        assert.equal(report.status, "unsafe");
        await assert.rejects(client.query(migrationSql), /unsafe partial catalog/);
        await client.query("ROLLBACK");
        assert.equal(
          (
            await client.query(
              `SELECT count(*)::integer AS count
               FROM information_schema.tables
               WHERE table_schema = 'public'
                 AND table_name LIKE 'tournament_routing_%'`,
            )
          ).rows[0].count,
          1,
        );

        await resetCatalogDatabase(client);
        await client.query(
          "CREATE VIEW public.tournament_routing_plans AS SELECT 1 AS id",
        );
        report = await inspect(client);
        assert.equal(report.status, "conflict");
        await assert.rejects(client.query(migrationSql), /catalog conflict/);
        await client.query("ROLLBACK");
      } finally {
        await resetCatalogDatabase(client).catch(() => undefined);
        await client.end();
      }
    },
  );
});
