import { Router } from "express";
import { asc, eq, inArray } from "drizzle-orm";
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
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const match = trimmed.match(/store\.steampowered\.com\/app\/(\d+)/i);
  return match ? Number(match[1]) : null;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function loadGames() {
  const games = await db
    .select()
    .from(steamCatalogGames)
    .orderBy(asc(steamCatalogGames.name));

  if (games.length === 0) return [];

  const assignments = await db
    .select({
      gameId: steamCatalogGameTerms.gameId,
      termId: steamCatalogTerms.id,
      facet: steamCatalogTerms.facet,
      slug: steamCatalogTerms.slug,
      label: steamCatalogTerms.label,
      role: steamCatalogGameTerms.role,
      position: steamCatalogGameTerms.position,
    })
    .from(steamCatalogGameTerms)
    .innerJoin(
      steamCatalogTerms,
      eq(steamCatalogTerms.id, steamCatalogGameTerms.termId),
    )
    .where(
      inArray(
        steamCatalogGameTerms.gameId,
        games.map((game) => game.id),
      ),
    );

  const byGame = new Map<number, typeof assignments>();
  for (const assignment of assignments) {
    const list = byGame.get(assignment.gameId) ?? [];
    list.push(assignment);
    byGame.set(assignment.gameId, list);
  }

  return games.map((game) => ({
    ...game,
    assignments: (byGame.get(game.id) ?? []).sort(
      (a, b) => a.position - b.position || a.label.localeCompare(b.label),
    ),
  }));
}

router.get("/steam-catalog/games", async (_req, res, next) => {
  try {
    res.json({ games: await loadGames() });
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
