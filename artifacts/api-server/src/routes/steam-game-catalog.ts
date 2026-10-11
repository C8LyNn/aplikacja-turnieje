import { Router } from "express";
import { steamCatalogReadiness } from "@workspace/game-catalog";
import { and, asc, count, eq, gt, ilike, inArray, ne, or } from "drizzle-orm";
import {
  db,
  steamCatalogGames,
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

const PAGE_SIZE_DEFAULT = 25;
const PAGE_SIZE_MAX = 100;
const QUERY_LENGTH_MAX = 120;

function parsePositiveInt(value: unknown, fallback: number): number | null {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function parseListQuery(query: Record<string, unknown>) {
  const page = parsePositiveInt(query.page, 1);
  const pageSize = parsePositiveInt(query.pageSize, PAGE_SIZE_DEFAULT);
  const search = typeof query.query === "string" ? query.query.trim() : "";
  const status = query.status === undefined ? "all" : query.status;
  if (!page || !pageSize || pageSize > PAGE_SIZE_MAX || page > 1_000_000 ||
      typeof status !== "string" || (status !== "all" && !STATUSES.has(status)) ||
      search.length > QUERY_LENGTH_MAX || (query.query !== undefined && typeof query.query !== "string")) {
    return null;
  }
  return { page, pageSize, search, status };
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
    const gameId = Number(req.params.id);
    if (!Number.isSafeInteger(gameId) || gameId < 1) {
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
    const params = parseListQuery(req.query);
    if (!params) {
      res.status(400).json({ error: "Nieprawidłowe parametry wyszukiwania.", code: "INVALID_CATALOG_QUERY" });
      return;
    }
    const { page, pageSize, search, status } = params;
    const escaped = search.replace(/[\\%_]/g, "\\$&");
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
    const [matches] = await db.select({ total: count() }).from(steamCatalogGames).where(where);
    const total = Number(matches?.total ?? 0);
    const offset = (page - 1) * pageSize;
    const games = offset >= total ? [] : await db.select(gameListColumns).from(steamCatalogGames)
      .where(where)
      .orderBy(asc(steamCatalogGames.name), asc(steamCatalogGames.id))
      .limit(pageSize).offset(offset);
    const grouped = await db.select({ status: steamCatalogGames.status, total: count() })
      .from(steamCatalogGames).groupBy(steamCatalogGames.status);
    const counts = { all: 0, unclassified: 0, review: 0, ready: 0 };
    for (const item of grouped) {
      if (item.status in counts) counts[item.status as "unclassified" | "review" | "ready"] = Number(item.total);
    }
    counts.all = counts.unclassified + counts.review + counts.ready;
    res.json({
      games,
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
      counts,
    });
  } catch (error) {
    next(error);
  }
});

// A compact, indexed classification queue avoids transferring every game to the client.
router.get("/steam-catalog/queue", async (req, res, next) => {
  try {
    const currentId = req.query.currentId === undefined ? null : parsePositiveInt(req.query.currentId, 1);
    if (req.query.currentId !== undefined && (!currentId || currentId > 2_147_483_647)) {
      res.status(400).json({ error: "Nieprawidłowe ID gry.", code: "INVALID_GAME_ID" });
      return;
    }
    const pending = ne(steamCatalogGames.status, "ready");
    const [totalRow] = await db.select({ total: count() }).from(steamCatalogGames).where(pending);
    const pendingCount = Number(totalRow?.total ?? 0);
    let nextId: number | null = null;
    if (pendingCount) {
      const current = currentId === null ? null : (await db.select({
        id: steamCatalogGames.id, name: steamCatalogGames.name,
      }).from(steamCatalogGames).where(eq(steamCatalogGames.id, currentId)).limit(1))[0];
      const after = current ? or(
        gt(steamCatalogGames.name, current.name),
        and(eq(steamCatalogGames.name, current.name), gt(steamCatalogGames.id, current.id)),
      ) : undefined;
      const base = and(pending, currentId === null ? undefined : ne(steamCatalogGames.id, currentId));
      const queryFirst = (where: ReturnType<typeof and>) =>
        db.select({ id: steamCatalogGames.id }).from(steamCatalogGames)
          .where(where).orderBy(asc(steamCatalogGames.name), asc(steamCatalogGames.id)).limit(1);
      const [forward] = await queryFirst(and(base, after));
      if (forward) nextId = forward.id;
      else {
        const [wrapped] = await queryFirst(base);
        nextId = wrapped?.id ?? null;
      }
    }
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

router.post("/steam-catalog/taxonomy", async (req, res, next) => {
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

router.post("/steam-catalog/import", async (req, res, next) => {
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
  async (req, res, next) => {
    try {
      const gameId = Number(req.params.id);
      const assignments = Array.isArray(req.body?.assignments)
        ? (req.body.assignments as AssignmentInput[])
        : null;
      const status = String(req.body?.status ?? "review");

      if (!Number.isInteger(gameId) || gameId <= 0 || !assignments) {
        res.status(400).json({
          error: "Nieprawidłowa klasyfikacja.",
          code: "INVALID_CLASSIFICATION",
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

      await db.transaction(async (tx) => {
        await tx
          .delete(steamCatalogGameTerms)
          .where(eq(steamCatalogGameTerms.gameId, gameId));
        if (normalized.length > 0) {
          await tx.insert(steamCatalogGameTerms).values(normalized);
        }
        await tx
          .update(steamCatalogGames)
          .set({ status, updatedAt: new Date() })
          .where(eq(steamCatalogGames.id, gameId));
      });

      res.json({ ok: true });
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
