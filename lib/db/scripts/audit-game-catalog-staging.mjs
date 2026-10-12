// Read-only evidence gate for an isolated game-catalog staging branch.
// Unlike a DB migration or an import worker, this script never changes data.
import { pathToFileURL } from "node:url";
import pg from "pg";
import { loadCatalogPreflightConfig } from "./preflight-game-catalog.mjs";

const { Client } = pg;

export function loadCatalogStagingAuditConfig(env = process.env) {
  const base = loadCatalogPreflightConfig(env);
  if (base.environment !== "staging") {
    throw new Error("The catalog data audit is staging-only.");
  }
  const rawIds = env.CATALOG_AUDIT_EXPECTED_APPIDS?.trim() ?? "";
  if (!/^[1-9]\d*(?:,[1-9]\d*){0,19}$/.test(rawIds)) {
    throw new Error("CATALOG_AUDIT_EXPECTED_APPIDS must contain 1-20 comma-separated positive AppIDs.");
  }
  const expectedIds = rawIds.split(",").map(Number);
  if (expectedIds.some((id) => !Number.isSafeInteger(id) || id > 2_147_483_647) ||
      new Set(expectedIds).size !== expectedIds.length) {
    throw new Error("CATALOG_AUDIT_EXPECTED_APPIDS must contain unique valid Steam AppIDs.");
  }
  const expectedStatus = env.CATALOG_AUDIT_EXPECTED_STATUS ?? "review";
  if (!["unclassified", "review", "ready"].includes(expectedStatus)) {
    throw new Error("Invalid CATALOG_AUDIT_EXPECTED_STATUS.");
  }
  const rawTerms = env.CATALOG_AUDIT_MIN_TERMS ?? "109";
  const rawAssignments = env.CATALOG_AUDIT_MIN_ASSIGNMENTS_PER_GAME ?? "6";
  if (!/^\d+$/.test(rawTerms) || !/^\d+$/.test(rawAssignments)) {
    throw new Error("Invalid catalog audit minimum.");
  }
  const minTerms = Number(rawTerms);
  const minAssignments = Number(rawAssignments);
  if (!Number.isSafeInteger(minTerms) || minTerms < 1 || minTerms > 100_000 ||
      !Number.isSafeInteger(minAssignments) || minAssignments < 0 || minAssignments > 100) {
    throw new Error("Catalog audit minimum is outside allowed bounds.");
  }
  return { ...base, expectedIds, expectedStatus, minTerms, minAssignments };
}

export async function inspectCatalogStagingData(client, config) {
  if (config.environment !== "staging" ||
      !/^[a-z_][a-z0-9_]*$/.test(config.schema) ||
      !Array.isArray(config.expectedIds) || !config.expectedIds.length) {
    throw new Error("Invalid staging-only catalog audit target.");
  }
  const schema = '"' + config.schema + '"';
  const checks = [];
  function check(name, passed, reason) {
    checks.push({ name, passed: Boolean(passed), ...(passed ? {} : { reason }) });
  }
  let started = false;
  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    started = true;
    const name = (await client.query("SELECT current_database() AS name")).rows[0]?.name;
    check("database_identity", name === config.expectedDatabase,
      "Database identity does not match configured staging target.");
    if (name !== config.expectedDatabase) {
      return { passed: false, checks, totals: null, games: [] };
    }
    const totals = (await client.query(
      `SELECT (SELECT count(*)::integer FROM ${schema}.steam_catalog_games) AS games,
              (SELECT count(*)::integer FROM ${schema}.steam_catalog_terms) AS terms,
              (SELECT count(*)::integer FROM ${schema}.steam_catalog_game_terms) AS assignments,
              (SELECT unclassified::integer FROM ${schema}.steam_catalog_status_counts WHERE id=1) AS unclassified,
              (SELECT review::integer FROM ${schema}.steam_catalog_status_counts WHERE id=1) AS review,
              (SELECT ready::integer FROM ${schema}.steam_catalog_status_counts WHERE id=1) AS ready`,
    )).rows[0];
    check("expected_game_count", totals?.games === config.expectedIds.length,
      "Staging game count differs from expected cohort.");
    check("taxonomy_size", Number.isSafeInteger(totals?.terms) && totals.terms >= config.minTerms,
      "Staging taxonomy is missing terms.");
    check("exact_status_counts", Number.isSafeInteger(totals?.games) &&
      Number.isSafeInteger(totals?.unclassified) &&
      Number.isSafeInteger(totals?.review) &&
      Number.isSafeInteger(totals?.ready) &&
      totals.unclassified + totals.review + totals.ready === totals.games,
      "Status counters differ from actual game total.");
    check("expected_status_count", totals?.[config.expectedStatus] === config.expectedIds.length,
      "Not every staging game has the requested editorial status.");

    const games = (await client.query(
      `SELECT g.steam_app_id AS "appId", g.name, g.status,
              g.classification_revision AS "revision",
              count(gt.term_id)::integer AS "assignments",
              count(DISTINCT t.facet)::integer AS "facets"
       FROM ${schema}.steam_catalog_games g
       LEFT JOIN ${schema}.steam_catalog_game_terms gt ON gt.game_id=g.id
       LEFT JOIN ${schema}.steam_catalog_terms t ON t.id=gt.term_id
       WHERE g.steam_app_id = ANY($1::integer[])
       GROUP BY g.id ORDER BY g.steam_app_id`,
      [config.expectedIds],
    )).rows;
    const matches = new Map(games.map((g) => [g.appId, g]));
    for (const appId of config.expectedIds) {
      const game = matches.get(appId);
      check("game:" + appId + ":exists", !!game && typeof game.name === "string" && game.name.length > 0,
        "An expected game is missing or unnamed.");
      check("game:" + appId + ":status", game?.status === config.expectedStatus,
        "Editorial state differs from expected.");
      check("game:" + appId + ":assignments",
        !!game && game.assignments >= config.minAssignments,
        "Game is missing proposed taxonomy assignments.");
      check("game:" + appId + ":facets",
        !!game && game.facets >= Math.min(5, config.minAssignments),
        "Taxonomy does not cover enough distinct perspectives.");
    }
    return { passed: checks.every((item) => item.passed), checks, totals,
      games: games.map(({ appId, name, status, revision, assignments, facets }) =>
        ({ appId, name, status, revision, assignments, facets })) };
  } finally {
    if (started) await client.query("ROLLBACK");
  }
}

export async function runCatalogStagingAudit(env = process.env) {
  const config = loadCatalogStagingAuditConfig(env);
  const client = new Client({ connectionString: config.connectionString, connectionTimeoutMillis: 8000 });
  try {
    await client.connect();
    return await inspectCatalogStagingData(client, config);
  } finally {
    await client.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const report = await runCatalogStagingAudit();
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    process.exitCode = report.passed ? 0 : 2;
  } catch (error) {
    // Refuse to write URLs or PostgreSQL driver messages to stdout/stderr.
    const allowed = error instanceof Error &&
      /^(Missing required setting:|CATALOG_|Invalid catalog audit|Invalid CATALOG_|The catalog data audit|Catalog audit minimum|Database name|Host does not match|Preflight requires|Remove search_path)/.test(error.message);
    process.stderr.write("CATALOG_STAGING_AUDIT_FAILED: " +
      (allowed ? error.message : "Unable to inspect staging catalog safely.") + "\n");
    process.exitCode = 1;
  }
}
