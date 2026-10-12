import { Router } from "express";
import { requireSteamCatalogAdmin } from "../application/catalog/steam-catalog-access";
import { decodeSteamCatalogCursor, encodeSteamCatalogCursor } from "../application/catalog/steam-catalog-cursor";
import { coalesceCatalogRead } from "../application/catalog/steam-catalog-inflight";
import { parseSteamDetailedGame, parseSteamDiscoveryPage, parseSteamDiscoveryRequest, parseSteamImportBatch } from "../application/catalog/steam-catalog-growth";
import { escapeSteamCatalogLikeQuery, parseSteamCatalogListQuery, steamCatalogReadiness } from "@workspace/game-catalog";
import { and, asc, count, eq, gt, ilike, inArray, ne, or, sql } from "drizzle-orm";
import {
  db,
  pool,
  steamCatalogGames,
  steamCatalogStatusCounts,
  steamCatalogGameTerms,
  steamCatalogTerms,
} from "@workspace/db";

const router = Router();

const FACETS = new Set([
  "genre",
  "subgenre",
  "mechanic",
  "mode",
  "structure",
  "world",
  "visual",
  "detail",
]);
const STATUSES = new Set(["unclassified", "review", "ready"]);
const MECHANIC_ROLES = new Set(["main", "secondary"]);

type AssignmentInput = {
  termId: number;
  role?: string;
  position?: number;
};

function parseSteamAppId(value: unknown): number | null {
  const toAppId = (candidate: string | number): number | null => {
    const parsed = typeof candidate === "number" ? candidate : Number(candidate);
    return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= 2_147_483_647
      ? parsed
      : null;
  };
  if (typeof value === "number") return toAppId(value);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return toAppId(trimmed);
  const match = trimmed.match(/^https?:\/\/store\.steampowered\.com\/app\/(\d+)(?:[\/?#]|$)/i);
  return match ? toAppId(match[1]) : null;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[łŁ]/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseQueueId(value: unknown): number | null {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id <= 2_147_483_647 ? id : null;
}

const gameListColumns = {
  id: steamCatalogGames.id,
  steamAppId: steamCatalogGames.steamAppId,
  name: steamCatalogGames.name,
  steamUrl: steamCatalogGames.steamUrl,
  headerImageUrl: steamCatalogGames.headerImageUrl,
  developer: steamCatalogGames.developer,
  publisher: steamCatalogGames.publisher,
  releaseDate: steamCatalogGames.releaseDate,
  shortDescription: steamCatalogGames.shortDescription,
  status: steamCatalogGames.status,
  classificationRevision: steamCatalogGames.classificationRevision,
  updatedAt: steamCatalogGames.updatedAt,
};

async function loadAssignmentRows(gameIds: number[]) {
  if (!gameIds.length) return [];
  return db.select({
    gameId: steamCatalogGameTerms.gameId,
    termId: steamCatalogTerms.id,
    facet: steamCatalogTerms.facet,
    slug: steamCatalogTerms.slug,
    label: steamCatalogTerms.label,
    role: steamCatalogGameTerms.role,
    position: steamCatalogGameTerms.position,
  }).from(steamCatalogGameTerms)
    .innerJoin(steamCatalogTerms, eq(steamCatalogTerms.id, steamCatalogGameTerms.termId))
    .where(inArray(steamCatalogGameTerms.gameId, gameIds))
    .orderBy(asc(steamCatalogGameTerms.position), asc(steamCatalogTerms.label));
}

// Detail responses include assignments; list responses intentionally do not.
router.get("/steam-catalog/games/:id", async (req, res, next) => {
  try {
    const gameId = parseQueueId(req.params.id);
    if (gameId === null) {
      res.status(400).json({ error: "Nieprawidłowe ID gry.", code: "INVALID_GAME_ID" });
      return;
    }
    const [game] = await db.select(gameListColumns)
      .from(steamCatalogGames).where(eq(steamCatalogGames.id, gameId)).limit(1);
    if (!game) {
      res.status(404).json({ error: "Nie znaleziono gry.", code: "GAME_NOT_FOUND" });
      return;
    }
    const assignments = await loadAssignmentRows([gameId]);
    res.json({ game: { ...game, assignments } });
  } catch (error) {
    next(error);
  }
});

router.get("/steam-catalog/games", async (req, res, next) => {
  try {
    const params = parseSteamCatalogListQuery(req.query);
    if (!params) {
      res.status(400).json({ error: "Nieprawidłowe parametry wyszukiwania.", code: "INVALID_CATALOG_QUERY" });
      return;
    }
    const { page, pageSize, query: search, status } = params;
    // Opt-in test-only timings. Production never exposes query profiles.
    const measure = process.env.NODE_ENV === "test" && req.get("x-catalog-perf-probe") === "1";
    const timings: Record<string, number> = {};
    const recordMs = (name: string, start: number) => {
      if (measure) timings[name] = Math.round((performance.now() - start) * 100) / 100;
    };
    const hasCursor = req.query.cursor !== undefined;
    const cursor = hasCursor ? decodeSteamCatalogCursor(req.query.cursor, params) : null;
    if (hasCursor && !cursor) {
      res.status(400).json({
        error: "Nieprawidłowy albo nieaktualny kursor paginacji.",
        code: "INVALID_CATALOG_CURSOR",
      });
      return;
    }
    const escaped = escapeSteamCatalogLikeQuery(search);
    const searchCondition = search ? or(
      ilike(steamCatalogGames.name, "%" + escaped + "%"),
      ilike(steamCatalogGames.developer, "%" + escaped + "%"),
      ilike(steamCatalogGames.publisher, "%" + escaped + "%"),
      ...( /^\d+$/.test(search) && Number.isSafeInteger(Number(search)) && Number(search) <= 2_147_483_647
        ? [eq(steamCatalogGames.steamAppId, Number(search))] : []),
    ) : undefined;
    // The escape character for the LIKE expression is a literal backslash.
    const where = and(
      status !== "all" ? eq(steamCatalogGames.status, status) : undefined,
      searchCondition,
    );
    // Status counts are updated transactionally by statement-level PostgreSQL
    // triggers on every insert/delete/status change, including Steam imports.
    // No full catalog scan is required for badges or unsearched totals.
    const beginCounts = performance.now();
    const [statusTotals] = await db.select({
      unclassified: steamCatalogStatusCounts.unclassified,
      review: steamCatalogStatusCounts.review,
      ready: steamCatalogStatusCounts.ready,
    }).from(steamCatalogStatusCounts).where(eq(steamCatalogStatusCounts.id, 1));
    recordMs("global_counts", beginCounts);
    if (!statusTotals) throw new Error("STEAM_CATALOG_COUNTERS_MISSING: apply migration 0034");
    const counts = {
      all: statusTotals.unclassified + statusTotals.review + statusTotals.ready,
      unclassified: statusTotals.unclassified,
      review: statusTotals.review,
      ready: statusTotals.ready,
    };
    const matchQuery = db.select({ total: count() }).from(steamCatalogGames).where(where);
    const beginCount = performance.now();
    // Keep Drizzle's SQL builder and bound parameters, but avoid named
    // prepared-plan reuse for unpredictable substring search selectivity.
    // Unfiltered requests retain their indexed Drizzle path.
    const matching = search ? matchQuery.toSQL() : null;
    const total = matching
      ? Number((await coalesceCatalogRead(
          "count:" + JSON.stringify([matching.sql, matching.params]),
          () => pool.query(matching.sql, matching.params),
        )).rows[0]?.count ?? 0)
      : status === "all" ? counts.all : counts[status];
    recordMs("match_count", beginCount);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const resolvedPage = Math.min(page, totalPages);
    if (cursor && page !== resolvedPage) {
      res.status(409).json({
        error: "Lista gier zmieniła się od ostatniego odczytu. Zacznij od pierwszej strony.",
        code: "CATALOG_CURSOR_STALE",
      });
      return;
    }
    const after = cursor ? or(
      gt(steamCatalogGames.name, cursor.name),
      and(eq(steamCatalogGames.name, cursor.name), gt(steamCatalogGames.id, cursor.id)),
    ) : undefined;
    // Cursor-based requests never use OFFSET, even on deep pages. The legacy
    // page-number API remains available for direct jumps and older clients.
    const beginPage = performance.now();
    const pageQuery = db.select(gameListColumns).from(steamCatalogGames)
      .where(and(where, after))
      .orderBy(asc(steamCatalogGames.name), asc(steamCatalogGames.id))
      .limit(pageSize + 1)
      .offset(cursor ? 0 : (resolvedPage - 1) * pageSize);
    const pageRows = cursor || (resolvedPage - 1) * pageSize < total
      ? search
        ? await (async () => {
            let compiled = pageQuery.toSQL();
            if (total <= 2_000) {
              // Materialize a bounded projection of matching games before
              // sorting. This avoids scanning the global name-order index
              // for selective publisher/developer searches and avoids loading
              // large Steam JSON metadata into the CTE.
              const candidates = db.select(gameListColumns)
                .from(steamCatalogGames).where(where).toSQL();
              const ordered = db.select(gameListColumns).from(steamCatalogGames)
                .where(after)
                .orderBy(asc(steamCatalogGames.name), asc(steamCatalogGames.id))
                .limit(pageSize + 1)
                .offset(cursor ? 0 : (resolvedPage - 1) * pageSize)
                .toSQL();
              const tableRef = 'from "steam_catalog_games"';
              if (!ordered.sql.includes(tableRef)) throw new Error("Unexpected catalog SQL table reference");
              const joinedSql = ordered.sql.replace(
                tableRef, 'from catalog_hits AS "steam_catalog_games"',
              );
              // Parameter indices in two compiled, parameterized queries
              // both start at $1. Shift only the outer query's placeholders.
              const shiftedSql = joinedSql.replace(/\$(\d+)/g,
                (_match, n: string) => "$" + (Number(n) + candidates.params.length));
              compiled = {
                sql: `WITH catalog_hits AS MATERIALIZED (${candidates.sql}) ${shiftedSql}`,
                params: [...candidates.params, ...ordered.params],
              };
            }
            // Drizzle normally maps result columns by select order. Raw pg
            // returns SQL column names instead; read tuples to preserve the
            // stable public camelCase contract without fragile SQL aliases.
            const result = await coalesceCatalogRead(
              "page:" + JSON.stringify([compiled.sql, compiled.params]),
              () => pool.query({ text: compiled.sql, values: compiled.params, rowMode: "array" }),
            );
            const keys = Object.keys(gameListColumns);
            return result.rows.map((cells: unknown) => {
              if (!Array.isArray(cells) || cells.length !== keys.length) {
                throw new Error("Unexpected Steam catalog search projection");
              }
              return Object.fromEntries(keys.map((key, index) => [key, cells[index]]));
            }) as Awaited<ReturnType<typeof pageQuery.execute>>;
          })()
        : await pageQuery
      : [];
    recordMs("page_select", beginPage);
    const games = pageRows.slice(0, pageSize);
    const hasMore = pageRows.length > pageSize;
    const lastGame = games.at(-1);
    const nextCursor = hasMore && lastGame
      ? encodeSteamCatalogCursor(lastGame, { ...params, page: resolvedPage })
      : null;
    if (measure) {
      res.setHeader("Server-Timing",
        Object.entries(timings).map(([name, ms]) => `${name};dur=${ms}`).join(", "));
    }
    res.json({
      games,
      pagination: { page: resolvedPage, pageSize, total, totalPages, nextCursor },
      counts,
    });
  } catch (error) {
    next(error);
  }
});

// A compact, indexed classification queue avoids transferring every game to the client.
router.get("/steam-catalog/queue", async (req, res, next) => {
  try {
    const currentId = req.query.currentId === undefined ? null : parseQueueId(req.query.currentId);
    if (req.query.currentId !== undefined && (!currentId || currentId > 2_147_483_647)) {
      res.status(400).json({ error: "Nieprawidłowe ID gry.", code: "INVALID_GAME_ID" });
      return;
    }
    // A single query handles the exact pending count, current position,
    // forward scan and wrap-around. This avoids up to four serial database
    // round trips for every queue poll under concurrent browser traffic.
    const result = await pool.query<{
      pending_count: string;
      next_id: number | null;
    }>(`
      WITH current_game AS MATERIALIZED (
        SELECT id, name FROM steam_catalog_games WHERE id = $1::integer
      ),
      next_forward AS (
        SELECT g.id FROM steam_catalog_games AS g
        WHERE g.status <> 'ready'
          AND ($1::integer IS NULL OR g.id <> $1::integer)
          AND (
            NOT EXISTS (SELECT 1 FROM current_game)
            OR (g.name, g.id) > (SELECT name, id FROM current_game)
          )
        ORDER BY g.name, g.id
        LIMIT 1
      ),
      next_wrapped AS (
        SELECT g.id FROM steam_catalog_games AS g
        WHERE g.status <> 'ready'
          AND ($1::integer IS NULL OR g.id <> $1::integer)
        ORDER BY g.name, g.id
        LIMIT 1
      )
      SELECT (c.unclassified + c.review)::text AS pending_count,
        CASE WHEN c.unclassified + c.review = 0 THEN NULL
        ELSE COALESCE(
          (SELECT id FROM next_forward),
          (SELECT id FROM next_wrapped)
        ) END AS next_id
      FROM steam_catalog_status_counts AS c WHERE c.id = 1
    `, [currentId]);
    const snapshot = result.rows[0];
    if (!snapshot) throw new Error("STEAM_CATALOG_COUNTERS_MISSING: apply migration 0034");
    const pendingCount = Number(snapshot.pending_count);
    const nextId = snapshot.next_id;
    res.json({ pendingCount, nextId });
  } catch (error) {
    next(error);
  }
});

router.get("/steam-catalog/taxonomy", async (_req, res, next) => {
  try {
    const terms = await db
      .select()
      .from(steamCatalogTerms)
      .orderBy(asc(steamCatalogTerms.facet), asc(steamCatalogTerms.label));
    res.json({ terms });
  } catch (error) {
    next(error);
  }
});

router.post("/steam-catalog/taxonomy", requireSteamCatalogAdmin, async (req, res, next) => {
  try {
    const facet = String(req.body?.facet ?? "").trim();
    const label = String(req.body?.label ?? "").trim();
    const slug = slugify(String(req.body?.slug ?? label));

    if (!FACETS.has(facet) || !label || !slug) {
      res.status(400).json({
        error: "Nieprawidłowy facet, label lub slug.",
        code: "INVALID_TAXONOMY_TERM",
      });
      return;
    }

    const [term] = await db
      .insert(steamCatalogTerms)
      .values({ facet, label, slug })
      .onConflictDoUpdate({
        target: [steamCatalogTerms.facet, steamCatalogTerms.slug],
        set: { label, active: true },
      })
      .returning();

    res.status(201).json({ term });
  } catch (error) {
    next(error);
  }
});

// Steam IStoreService discovery is paginated by AppID and requests only games.
// A Steam Web API key is required, kept exclusively in server environment.
router.post("/steam-catalog/discover", requireSteamCatalogAdmin, async (req, res, next) => {
  try {
    const params = parseSteamDiscoveryRequest(req.body);
    if (!params) {
      res.status(400).json({ error: "Nieprawidłowe parametry odkrywania gier.", code: "INVALID_STEAM_DISCOVERY" });
      return;
    }
    const steamKey = process.env.STEAM_WEB_API_KEY?.trim();
    if (!steamKey || !/^[a-f0-9]{32}$/i.test(steamKey)) {
      res.status(503).json({
        error: "Skonfiguruj STEAM_WEB_API_KEY po stronie serwera, aby odkrywać gry.",
        code: "STEAM_DISCOVERY_NOT_CONFIGURED",
      });
      return;
    }
    const endpoint = new URL("https://api.steampowered.com/IStoreService/GetAppList/v1/");
    endpoint.searchParams.set("key", steamKey);
    endpoint.searchParams.set("last_appid", String(params.cursor));
    endpoint.searchParams.set("max_results", String(params.pageSize));
    endpoint.searchParams.set("include_games", "true");
    endpoint.searchParams.set("include_dlc", "false");
    endpoint.searchParams.set("include_software", "false");
    endpoint.searchParams.set("include_videos", "false");
    endpoint.searchParams.set("include_hardware", "false");
    const upstream = await fetch(endpoint, {
      headers: { "user-agent": "TournamentManagerGameCatalog/0.1" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!upstream.ok) {
      res.status(502).json({
        error: upstream.status === 429 ? "Steam ograniczył częstotliwość żądań. Spróbuj później." : "Steam nie udostępnił listy gier.",
        code: upstream.status === 429 ? "STEAM_DISCOVERY_RATE_LIMITED" : "STEAM_DISCOVERY_UPSTREAM_ERROR",
      });
      return;
    }
    const page = parseSteamDiscoveryPage(await upstream.json(), params.cursor);
    if (!page) {
      res.status(502).json({ error: "Steam zwrócił nieprawidłową stronę wyników.", code: "STEAM_DISCOVERY_BAD_RESPONSE" });
      return;
    }
    const appIds = page.games.map((item) => item.appId);
    const existing = appIds.length ? await db.select({ appId: steamCatalogGames.steamAppId })
      .from(steamCatalogGames).where(inArray(steamCatalogGames.steamAppId, appIds)) : [];
    const known = new Set(existing.map((item) => item.appId));
    res.json({
      candidates: page.games.filter((item) => !known.has(item.appId)),
      scanned: page.games.length,
      alreadyInCatalog: known.size,
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    });
  } catch (error) {
    next(error);
  }
});

// Import at most 10 real games per request, checking store type and existing
// IDs before every write. This deliberately does not bulk-insert unverified
// app-list entries, which could otherwise include DLC or unavailable items.
router.post("/steam-catalog/import-batch", requireSteamCatalogAdmin, async (req, res, next) => {
  try {
    const appIds = parseSteamImportBatch(req.body?.appIds);
    if (!appIds) {
      res.status(400).json({
        error: "Podaj od 1 do 10 prawidłowych Steam AppID.",
        code: "INVALID_STEAM_IMPORT_BATCH",
      });
      return;
    }
    const existing = await db.select({ appId: steamCatalogGames.steamAppId })
      .from(steamCatalogGames).where(inArray(steamCatalogGames.steamAppId, appIds));
    const known = new Set(existing.map((item) => item.appId));
    const results: Array<{ appId: number; status: "inserted" | "existing" | "not_game" | "missing" | "upstream_error" }> = [];
    let rateLimited = false;
    let aborted = false;
    for (const appId of appIds) {
      if (known.has(appId)) {
        results.push({ appId, status: "existing" });
        continue;
      }
      // Avoid flooding the Store API with concurrent appdetails requests.
      if (results.length) await new Promise((resolve) => setTimeout(resolve, 800));
      try {
        const endpoint = new URL("https://store.steampowered.com/api/appdetails");
        endpoint.searchParams.set("appids", String(appId));
        endpoint.searchParams.set("l", "english");
        const upstream = await fetch(endpoint, {
          headers: { "user-agent": "TournamentManagerGameCatalog/0.1" },
          signal: AbortSignal.timeout(12_000),
        });
        if (!upstream.ok) {
          results.push({ appId, status: "upstream_error" });
          if (upstream.status === 429 || upstream.status >= 500) {
            rateLimited = upstream.status === 429;
            aborted = true;
            break;
          }
          continue;
        }
        const payload = await upstream.json() as Record<string, { success?: boolean; data?: unknown }>;
        const entry = payload?.[String(appId)];
        if (!entry?.success || !entry.data) {
          results.push({ appId, status: "missing" });
          continue;
        }
        const parsed = parseSteamDetailedGame(appId, entry.data);
        if (!parsed) {
          results.push({ appId, status: "not_game" });
          continue;
        }
        const [created] = await db.insert(steamCatalogGames).values(parsed)
          .onConflictDoNothing({ target: steamCatalogGames.steamAppId })
          .returning({ id: steamCatalogGames.id });
        results.push({ appId, status: created ? "inserted" : "existing" });
      } catch {
        results.push({ appId, status: "upstream_error" });
        aborted = true;
        break;
      }
    }
    const totals = {
      inserted: results.filter((item) => item.status === "inserted").length,
      existing: results.filter((item) => item.status === "existing").length,
      ignored: results.filter((item) => item.status === "not_game" || item.status === "missing").length,
      failed: results.filter((item) => item.status === "upstream_error").length,
    };
    res.json({ requested: appIds.length, processed: results.length, ...totals, rateLimited, aborted, results });
  } catch (error) {
    next(error);
  }
});

router.post("/steam-catalog/import", requireSteamCatalogAdmin, async (req, res, next) => {
  try {
    const appId = parseSteamAppId(req.body?.appId ?? req.body?.url);
    if (!appId) {
      res.status(400).json({
        error: "Podaj prawidłowy Steam AppID albo URL gry.",
        code: "INVALID_STEAM_APP_ID",
      });
      return;
    }

    const endpoint = new URL("https://store.steampowered.com/api/appdetails");
    endpoint.searchParams.set("appids", String(appId));
    endpoint.searchParams.set("l", "english");

    const steamResponse = await fetch(endpoint, {
      headers: { "user-agent": "TournamentManagerGameCatalog/0.1" },
      signal: AbortSignal.timeout(12_000),
    });

    if (!steamResponse.ok) {
      res.status(502).json({
        error: `Steam odpowiedział kodem ${steamResponse.status}.`,
        code: "STEAM_UPSTREAM_ERROR",
      });
      return;
    }

    const payload = (await steamResponse.json()) as Record<
      string,
      { success?: boolean; data?: Record<string, unknown> }
    >;
    const entry = payload[String(appId)];
    if (!entry?.success || !entry.data) {
      res.status(404).json({
        error: "Steam nie zwrócił danych dla tego AppID.",
        code: "STEAM_APP_NOT_FOUND",
      });
      return;
    }

    const data = entry.data;
    const name = typeof data.name === "string" ? data.name : `Steam ${appId}`;
    const developers = Array.isArray(data.developers)
      ? data.developers.filter((v): v is string => typeof v === "string")
      : [];
    const publishers = Array.isArray(data.publishers)
      ? data.publishers.filter((v): v is string => typeof v === "string")
      : [];
    const releaseDate =
      data.release_date && typeof data.release_date === "object"
        ? String((data.release_date as { date?: unknown }).date ?? "") || null
        : null;

    const values = {
      steamAppId: appId,
      name,
      steamUrl: `https://store.steampowered.com/app/${appId}`,
      headerImageUrl:
        typeof data.header_image === "string" ? data.header_image : null,
      developer: developers.join(", ") || null,
      publisher: publishers.join(", ") || null,
      releaseDate,
      shortDescription:
        typeof data.short_description === "string"
          ? data.short_description
          : null,
      steamRawData: data,
      sourceUpdatedAt: new Date(),
      updatedAt: new Date(),
    };

    const [game] = await db
      .insert(steamCatalogGames)
      .values(values)
      .onConflictDoUpdate({
        target: steamCatalogGames.steamAppId,
        set: values,
      })
      .returning();

    res.status(201).json({ game });
  } catch (error) {
    next(error);
  }
});

router.put(
  "/steam-catalog/games/:id/classification",
  requireSteamCatalogAdmin,
  async (req, res, next) => {
    try {
      const gameId = parseQueueId(req.params.id);
      const expectedRevision = req.body?.expectedRevision;
      const assignments = Array.isArray(req.body?.assignments)
        ? (req.body.assignments as AssignmentInput[])
        : null;
      const status = String(req.body?.status ?? "review");

      if (gameId === null || !assignments) {
        res.status(400).json({
          error: "Nieprawidłowa klasyfikacja.",
          code: "INVALID_CLASSIFICATION",
        });
        return;
      }
      if (typeof expectedRevision !== "number" || !Number.isSafeInteger(expectedRevision) ||
          expectedRevision < 1 || expectedRevision > 2_147_483_647) {
        res.status(428).json({
          error: "Wymagana jest wersja klasyfikacji z ostatniego odczytu gry.",
          code: "CLASSIFICATION_REVISION_REQUIRED",
        });
        return;
      }
      if (!STATUSES.has(status)) {
        res.status(400).json({
          error: "Nieprawidłowy status.",
          code: "INVALID_STATUS",
        });
        return;
      }

      const [existingGame] = await db
        .select({ id: steamCatalogGames.id })
        .from(steamCatalogGames)
        .where(eq(steamCatalogGames.id, gameId))
        .limit(1);
      if (!existingGame) {
        res.status(404).json({
          error: "Nie znaleziono gry w katalogu.",
          code: "GAME_NOT_FOUND",
        });
        return;
      }

      const termIds = [
        ...new Set(
          assignments
            .map((assignment) => Number(assignment.termId))
            .filter((id) => Number.isInteger(id) && id > 0),
        ),
      ];

      if (termIds.length !== assignments.length) {
        res.status(400).json({
          error: "Terminy klasyfikacji muszą być unikalne i prawidłowe.",
          code: "INVALID_TERM_IDS",
        });
        return;
      }

      const terms =
        termIds.length > 0
          ? await db
              .select()
              .from(steamCatalogTerms)
              .where(inArray(steamCatalogTerms.id, termIds))
          : [];
      if (terms.length !== termIds.length) {
        res.status(400).json({
          error: "Co najmniej jeden termin nie istnieje.",
          code: "UNKNOWN_TERM",
        });
        return;
      }

      const termById = new Map(terms.map((term) => [term.id, term]));
      let genreCount = 0;
      const normalized = assignments.map((assignment, index) => {
        const term = termById.get(Number(assignment.termId))!;
        if (term.facet === "genre") genreCount += 1;
        let role = "default";
        if (term.facet === "mechanic") {
          role = String(assignment.role ?? "");
          if (!MECHANIC_ROLES.has(role)) {
            throw new Error("INVALID_MECHANIC_ROLE");
          }
        }
        return {
          gameId,
          termId: term.id,
          role,
          position: Number.isInteger(assignment.position)
            ? Number(assignment.position)
            : index,
        };
      });

      if (genreCount > 1) {
        res.status(400).json({
          error: "Gra może mieć tylko jeden gatunek główny.",
          code: "MULTIPLE_PRIMARY_GENRES",
        });
        return;
      }

      // Review/unclassified records can remain partial. Only ready records must
      // satisfy all five perspectives and a defining primary mechanic.
      if (status === "ready") {
        const readiness = steamCatalogReadiness(normalized.map((item) => ({
          facet: termById.get(item.termId)!.facet,
          role: item.role,
        })));
        if (!readiness.complete) {
          res.status(422).json({
            error: "Uzupełnij klasyfikację przed oznaczeniem gry jako gotowej.",
            code: "INCOMPLETE_CLASSIFICATION",
            missing: readiness.missing,
          });
          return;
        }
      }

      // Claim the record version under PostgreSQL row locking before changing
      // assignments. Concurrent writers with a stale version cannot delete
      // another editor's work: only one conditional UPDATE may succeed.
      const result = await db.transaction(async (tx) => {
        const [claimed] = await tx.update(steamCatalogGames)
          .set({
            status,
            updatedAt: new Date(),
            classificationRevision: sql`${steamCatalogGames.classificationRevision} + 1`,
          })
          .where(and(
            eq(steamCatalogGames.id, gameId),
            eq(steamCatalogGames.classificationRevision, expectedRevision),
          ))
          .returning({ revision: steamCatalogGames.classificationRevision });
        if (!claimed) return null;
        await tx.delete(steamCatalogGameTerms)
          .where(eq(steamCatalogGameTerms.gameId, gameId));
        if (normalized.length > 0) {
          await tx.insert(steamCatalogGameTerms).values(normalized);
        }
        return claimed.revision;
      });

      if (result === null) {
        res.status(409).json({
          error: "Inny redaktor zapisał nowszą klasyfikację tej gry. Zaktualizuj rekord przed ponowną próbą.",
          code: "CLASSIFICATION_CONFLICT",
        });
        return;
      }
      res.json({ ok: true, classificationRevision: result });
    } catch (error) {
      if (error instanceof Error && error.message === "INVALID_MECHANIC_ROLE") {
        res.status(400).json({
          error: "Mechanika musi mieć rolę main albo secondary.",
          code: "INVALID_MECHANIC_ROLE",
        });
        return;
      }
      next(error);
    }
  },
);

export default router;
