import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ExternalLink,
  FlaskConical,
  Gamepad2,
  Globe2,
  Lightbulb,
  List,
  Network,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Search,
  Users,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { steamCatalogReadiness } from "@workspace/game-catalog";
import { filterTaxonomyTerms } from "./game-catalog-workflow";
import {
  ModuleHeader,
  ModuleShell,
  ProjectCard,
  SectionHeader,
} from "@/components/portfolio-ui";
import {
  ToolButton,
  ToolDisclosure,
  ToolEmptyState,
  ToolInput,
  ToolNotice,
  ToolPanel,
  ToolSection,
  ToolSegmented,
  ToolSelect,
  ToolToolbar,
} from "@/components/tool-ui";

type Facet =
  | "genre"
  | "subgenre"
  | "mechanic"
  | "mode"
  | "structure"
  | "world"
  | "visual"
  | "detail";

type Perspective = "gameplay" | "mode" | "structure" | "world" | "visual";
type Screen =
  | "home"
  | "search"
  | "games"
  | "gameplay"
  | "mode"
  | "structure"
  | "world"
  | "visual"
  | "methodology"
  | "why"
  | "game";

type Term = {
  id: number;
  facet: Facet;
  slug: string;
  label: string;
  active: boolean;
};

type Assignment = {
  termId: number;
  facet: Facet;
  slug: string;
  label: string;
  role: "default" | "main" | "secondary";
  position: number;
};

type Game = {
  id: number;
  steamAppId: number;
  name: string;
  steamUrl: string;
  headerImageUrl: string | null;
  developer: string | null;
  publisher: string | null;
  releaseDate: string | null;
  shortDescription: string | null;
  status: "unclassified" | "review" | "ready";
  classificationRevision: number;
  updatedAt: string;
  assignments: Assignment[];
};

type GameSummary = Omit<Game, "assignments">;

type GameListResponse = {
  games: GameSummary[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number; nextCursor?: string | null };
  counts: { all: number; unclassified: number; review: number; ready: number };
};
type QueueResponse = { pendingCount: number; nextId: number | null };
type SteamDiscoveryGame = { appId: number; name: string };
type SteamDiscoveryProgress = { cursor: number; candidates: SteamDiscoveryGame[]; hasMore: boolean };
type SteamDiscoveryResponse = { candidates: SteamDiscoveryGame[]; nextCursor: number; hasMore: boolean; scanned: number; alreadyInCatalog: number };
type SteamBatchImportResponse = {
  requested: number; processed: number; inserted: number; existing: number;
  ignored: number; failed: number; aborted: boolean; rateLimited: boolean;
  results: Array<{ appId: number; status: string }>;
};
const STEAM_DISCOVERY_STORAGE = "steam-catalog-discovery-progress-v1";
const EMPTY_STEAM_DISCOVERY: SteamDiscoveryProgress = { cursor: 0, candidates: [], hasMore: true };

const BASE = "/ludology/game-classification";
const PAGE_SIZE = 25;
const ADMIN_KEY_STORAGE = "tm_steam_catalog_admin_token";

const FACET_LABELS: Record<Facet, string> = {
  genre: "Gatunek",
  subgenre: "Podgatunki",
  mechanic: "Elementy rozgrywki",
  mode: "Tryb",
  structure: "Struktura",
  world: "Świat",
  visual: "Oprawa",
  detail: "Pozostałe tagi",
};

const STATUS_LABELS: Record<Game["status"], string> = {
  unclassified: "Nieopisane",
  review: "Do sprawdzenia",
  ready: "Gotowe",
};

const PERSPECTIVES = [
  { value: "gameplay", label: "Rozgrywka" },
  { value: "mode", label: "Tryb" },
  { value: "structure", label: "Struktura" },
  { value: "world", label: "Świat" },
  { value: "visual", label: "Oprawa" },
] as const;

const PERSPECTIVE_COPY: Record<
  Perspective,
  { code: string; title: string; question: string; description: string; details: string[] }
> = {
  gameplay: {
    code: "01",
    title: "Rozgrywka",
    question: "Co robię?",
    description:
      "Perspektywa opisująca podstawowy charakter rozgrywki: gatunek, podgatunki oraz główne i poboczne elementy doświadczenia.",
    details: [
      "Gatunek główny — najważniejsza rama opisująca grę.",
      "Podgatunki — dodatkowe ramy realnie współtworzące doświadczenie.",
      "Główne elementy — czynności i systemy regularnie definiujące grę.",
      "Poboczne elementy — obecne i istotne, ale niecentralne.",
    ],
  },
  mode: {
    code: "02",
    title: "Tryb",
    question: "Z kim i przeciw komu gram?",
    description:
      "Oddziela relacje między graczami i przeciwnikami od gatunku. Jedna gra może jednocześnie obsługiwać kilka trybów.",
    details: ["Singleplayer", "Co-op", "PvE", "PvP", "PvPvE", "MMO i warianty lokalne/online"],
  },
  structure: {
    code: "03",
    title: "Struktura",
    question: "Jak zorganizowana jest gra?",
    description:
      "Opisuje sposób organizacji przestrzeni i przebiegu gry, niezależnie od jej gatunku czy świata.",
    details: ["Open world", "Linear", "Mission-based", "Hub-based", "Run-based", "Match-based", "Persistent world"],
  },
  world: {
    code: "04",
    title: "Świat",
    question: "Gdzie i w jakiej konwencji?",
    description:
      "Opisuje setting oraz konwencję świata bez mieszania ich z mechaniką i sposobem prezentacji.",
    details: ["Fantasy", "Dark fantasy", "Science fiction", "Cyberpunk", "Steampunk", "Historyczne", "Współczesne"],
  },
  visual: {
    code: "05",
    title: "Oprawa",
    question: "Jak gra wygląda?",
    description:
      "Opisuje sposób wizualnego przedstawienia gry. Nie jest tym samym co świat ani perspektywa kamery.",
    details: ["Realistic", "Stylized", "Anime / manga", "Cartoon", "Pixel art", "Cel-shaded", "Low-poly"],
  },
};

class CatalogApiError extends Error {
  constructor(message: string, readonly code: string | null, readonly status: number) {
    super(message);
    this.name = "CatalogApiError";
  }
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  // Public reads carry no credential. Keep the editing key in this tab only.
  const key = method === "GET" ? null : window.sessionStorage.getItem(ADMIN_KEY_STORAGE);
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(key ? { "x-steam-catalog-admin-token": key } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new CatalogApiError(body?.error ?? `HTTP ${response.status}`, body?.code ?? null, response.status);
  return body as T;
}

function getScreen(rawPath: string): { screen: Screen; gameId: number | null } {
  const path = rawPath.replace(/\/+$/, "");
  const gameMatch = path.match(/\/ludology\/game-classification\/games\/(\d+)$/);
  if (gameMatch) return { screen: "game", gameId: Number(gameMatch[1]) };

  const parts = path.split("/").filter(Boolean);
  const segment = parts[parts.length - 1] ?? "game-classification";
  const valid: Screen[] = [
    "search",
    "games",
    "gameplay",
    "mode",
    "structure",
    "world",
    "visual",
    "methodology",
    "why",
  ];
  return {
    screen: valid.includes(segment as Screen) ? (segment as Screen) : "home",
    gameId: null,
  };
}

function Chip({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
        active
          ? "border-amber-400/60 bg-amber-400/15 text-amber-200"
          : "border-border bg-background/55 text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ProjectHome() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <ProjectCard code="SZUKAJ" title="Szukaj gry" description="Znajdź konkretną grę w katalogu lub dodaj ją ze Steam." href={`${BASE}/search`} icon={Search} accent="amber" />
      <ProjectCard code="KATALOG" title="Wszystkie gry" description="Pełna lista wszystkich skatalogowanych rekordów." href={`${BASE}/games`} icon={List} accent="amber" />
      <ProjectCard code="01" title="Rozgrywka" description="Co robię? Gatunek, podgatunki i elementy rozgrywki." href={`${BASE}/gameplay`} icon={Gamepad2} accent="amber" />
      <ProjectCard code="02" title="Tryb" description="Z kim i przeciw komu gram?" href={`${BASE}/mode`} icon={Users} accent="amber" />
      <ProjectCard code="03" title="Struktura" description="Jak zorganizowana jest gra?" href={`${BASE}/structure`} icon={Network} accent="amber" />
      <ProjectCard code="04" title="Świat" description="Gdzie i w jakiej konwencji osadzona jest gra?" href={`${BASE}/world`} icon={Globe2} accent="amber" />
      <ProjectCard code="05" title="Oprawa" description="Jak gra wygląda i w jaki sposób jest przedstawiona?" href={`${BASE}/visual`} icon={Palette} accent="amber" />
      <ProjectCard code="METODA" title="Metodologia" description="Jak zbierane, porządkowane i sprawdzane są dane." href={`${BASE}/methodology`} icon={FlaskConical} accent="amber" />
      <ProjectCard code="DLACZEGO" title="Dlaczego powstał projekt" description="Problemy obecnych klasyfikacji i cel nowego spojrzenia." href={`${BASE}/why`} icon={Lightbulb} accent="amber" />
    </div>
  );
}

export default function GameCatalogAdminPage() {
  const [location, navigate] = useLocation();
  const { screen, gameId } = getScreen(location);
  const [games, setGames] = useState<GameSummary[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [queue, setQueue] = useState<QueueResponse | null>(null);
  const [pagination, setPagination] = useState<GameListResponse["pagination"]>({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
  const [counts, setCounts] = useState<GameListResponse["counts"]>({ all: 0, unclassified: 0, review: 0, ready: 0 });
  const [page, setPage] = useState(1);
  const [pageCursors, setPageCursors] = useState<Record<number, string>>({});
  const [terms, setTerms] = useState<Term[]>([]);
  const [draft, setDraft] = useState<Assignment[]>([]);
  const [status, setStatus] = useState<Game["status"]>("unclassified");
  const [statusFilter, setStatusFilter] = useState<"all" | Game["status"]>("all");
  const [listLoading, setListLoading] = useState(false);
  const [gameLoading, setGameLoading] = useState(false);
  const [importValue, setImportValue] = useState("");
  const [discovery, setDiscovery] = useState<SteamDiscoveryProgress>(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STEAM_DISCOVERY_STORAGE) ?? "null") as Partial<SteamDiscoveryProgress> | null;
      if (saved && Number.isSafeInteger(saved.cursor) && (saved.cursor ?? 0) >= 0 &&
          Array.isArray(saved.candidates) && typeof saved.hasMore === "boolean") {
        const candidates = saved.candidates.filter((item): item is SteamDiscoveryGame =>
          typeof item?.name === "string" && Number.isSafeInteger(item.appId) && item.appId > 0).slice(0, 200);
        return { cursor: saved.cursor!, candidates, hasMore: saved.hasMore };
      }
    } catch { /* Corrupt local progress should never block the editor. */ }
    return EMPTY_STEAM_DISCOVERY;
  });
  const [growthMessage, setGrowthMessage] = useState<string | null>(null);
  const [bulkPaste, setBulkPaste] = useState("");
  const [adminKey, setAdminKey] = useState(() => window.sessionStorage.getItem(ADMIN_KEY_STORAGE) ?? "");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classificationConflict, setClassificationConflict] = useState(false);
  const [newFacet, setNewFacet] = useState<Facet>("mechanic");
  const [newLabel, setNewLabel] = useState("");
  const [termQuery, setTermQuery] = useState("");
  const [perspective, setPerspective] = useState<Perspective>("gameplay");

  useEffect(() => {
    window.localStorage.setItem(STEAM_DISCOVERY_STORAGE, JSON.stringify(discovery));
  }, [discovery]);

  function updateAdminKey(value: string) {
    setAdminKey(value);
    if (value) window.sessionStorage.setItem(ADMIN_KEY_STORAGE, value);
    else window.sessionStorage.removeItem(ADMIN_KEY_STORAGE);
  }

  const selected = gameId !== null && selectedGame?.id === gameId ? selectedGame : null;
  const nextPendingId = selected ? queue?.nextId ?? null : null;

  const termsByFacet = useMemo(() => {
    const map = new Map<Facet, Term[]>();
    const assigned = new Set(draft.map((term) => term.termId));
    for (const term of terms.filter((term) => term.active)) {
      const current = map.get(term.facet) ?? [];
      current.push(term);
      map.set(term.facet, current);
    }
    for (const [facet, values] of map) {
      map.set(facet, filterTaxonomyTerms(values, termQuery, assigned));
    }
    return map;
  }, [terms, draft, termQuery]);

  const readiness = steamCatalogReadiness(draft);

  const visibleListGames = games; // Already filtered and sorted on the server.

  const hasUnsavedChanges = Boolean(selected && (
    status !== selected.status ||
    JSON.stringify(draft.map((item) => [item.termId, item.role]).sort((a, b) => Number(a[0]) - Number(b[0]))) !==
    JSON.stringify(selected.assignments.map((item) => [item.termId, item.role]).sort((a, b) => Number(a[0]) - Number(b[0])))
  ));

  async function loadTaxonomy() {
    const body = await api<{ terms: Term[] }>("/api/steam-catalog/taxonomy");
    setTerms(body.terms);
  }

  function hydrateEditor(game: Game) {
    // Keep the persisted record and editable draft in one React commit.
    // Delayed effects used to overwrite fast edits made just after navigation.
    setSelectedGame(game);
    setClassificationConflict(false);
    setDraft(game.assignments);
    setStatus(game.status);
    setPerspective("gameplay");
    setTermQuery("");
  }

  async function loadDetail(id: number) {
    const body = await api<{ game: Game }>(`/api/steam-catalog/games/${id}`);
    hydrateEditor(body.game);
    return body.game;
  }

  async function loadQueue(id: number) {
    const body = await api<QueueResponse>(`/api/steam-catalog/queue?currentId=${id}`);
    setQueue(body);
    return body;
  }

  useEffect(() => {
    loadTaxonomy().catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)));
  }, []);

  useEffect(() => {
    // A cursor only belongs to one listing/filter context.
    setPage(1);
    setPageCursors({});
  }, [screen]);

  useEffect(() => {
    if (screen !== "games" && screen !== "search") return;
    // The search-only screen shows an input prompt when blank. Avoid fetching
    // the entire catalog (and potentially issuing a broad, costly request)
    // until the user actually enters a search term.
    if (screen === "search" && !query.trim()) {
      setGames([]);
      setPagination({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1, nextCursor: null });
      setListLoading(false);
      return;
    }
    const controller = new AbortController();
    setListLoading(true);
    setGames([]);
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), query });
      if (screen === "games") params.set("status", statusFilter);
      if (page > 1 && pageCursors[page]) params.set("cursor", pageCursors[page]);
      api<GameListResponse>(`/api/steam-catalog/games?${params}`, { signal: controller.signal })
        .then((body) => {
          if (controller.signal.aborted) return;
          setGames(body.games);
          setPagination(body.pagination);
          setCounts(body.counts);
          if (body.pagination.page !== page) setPage(body.pagination.page);
        })
        .catch((cause) => {
          if (controller.signal.aborted) return;
          if (cause instanceof CatalogApiError && cause.code === "CATALOG_CURSOR_STALE") {
            setPageCursors({});
            setPage(1);
          } else {
            setError(cause instanceof Error ? cause.message : String(cause));
          }
        })
        .finally(() => { if (!controller.signal.aborted) setListLoading(false); });
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [screen, query, statusFilter, page]);

  useEffect(() => {
    if (screen !== "game" || gameId === null) return;
    let active = true;
    setGameLoading(true);
    setQueue(null);
    Promise.all([
      api<{ game: Game }>(`/api/steam-catalog/games/${gameId}`),
      api<QueueResponse>(`/api/steam-catalog/queue?currentId=${gameId}`),
    ]).then(([record, next]) => {
      if (!active) return;
      hydrateEditor(record.game);
      setQueue(next);
    }).catch((cause) => {
      if (!active) return;
      setSelectedGame(null);
      setError(cause instanceof Error ? cause.message : String(cause));
    }).finally(() => { if (active) setGameLoading(false); });
    return () => { active = false; };
  }, [screen, gameId]);

  // Install the navigation guard before the browser can dispatch a second click
  // after React commits an edited draft (a passive effect can be too late).
  useLayoutEffect(() => {
    if (!hasUnsavedChanges) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    // Wouter navigation does not trigger beforeunload, so protect in-app links too.
    const guardUnsavedLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest("a[href]");
      if (!link || link.getAttribute("target") === "_blank") return;
      const destination = new URL((link as HTMLAnchorElement).href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === location) return;
      if (!window.confirm("Masz niezapisane zmiany. Opuścić edytor bez zapisywania?")) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    document.addEventListener("click", guardUnsavedLink, true);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
      document.removeEventListener("click", guardUnsavedLink, true);
    };
  }, [hasUnsavedChanges, location]);

  function assignmentFor(termId: number) {
    return draft.find((item) => item.termId === termId);
  }

  function toggleSimple(term: Term) {
    const existing = assignmentFor(term.id);
    if (existing) {
      setDraft((current) => current.filter((item) => item.termId !== term.id));
      return;
    }
    setDraft((current) => {
      const withoutGenre = term.facet === "genre" ? current.filter((item) => item.facet !== "genre") : current;
      return [
        ...withoutGenre,
        { termId: term.id, facet: term.facet, slug: term.slug, label: term.label, role: "default", position: withoutGenre.length },
      ];
    });
  }

  function setMechanic(term: Term, role: "main" | "secondary") {
    const existing = assignmentFor(term.id);
    if (existing?.role === role) {
      setDraft((current) => current.filter((item) => item.termId !== term.id));
      return;
    }
    setDraft((current) => [
      ...current.filter((item) => item.termId !== term.id),
      { termId: term.id, facet: "mechanic", slug: term.slug, label: term.label, role, position: current.length },
    ]);
  }

  function queuePastedSteamGames() {
    const tokens = bulkPaste.trim().split(/[\s,;]+/).filter(Boolean);
    if (!tokens.length || tokens.length > 200) {
      setError("Wklej od 1 do 200 Steam AppID lub adresów gier.");
      return;
    }
    const ids = tokens.map((token) => {
      const match = token.match(/^(?:https?:\/\/store\.steampowered\.com\/app\/)?([1-9]\d*)(?:\/[^\s]*)?$/i);
      const value = match ? Number(match[1]) : NaN;
      return Number.isSafeInteger(value) && value <= 2_147_483_647 ? value : null;
    });
    if (ids.some((item) => item === null)) {
      setError("Lista zawiera niepoprawny AppID lub adres Steam.");
      return;
    }
    const pending = new Set(discovery.candidates.map((item) => item.appId));
    for (const id of ids as number[]) pending.add(id);
    if (pending.size > 200) {
      setError("Kolejka mieści maksymalnie 200 gier. Zaimportuj część oczekujących AppID.");
      return;
    }
    setDiscovery((current) => {
      const combined = new Map(current.candidates.map((item) => [item.appId, item]));
      for (const id of ids as number[]) {
        if (!combined.has(id)) combined.set(id, { appId: id, name: `Steam AppID ${id}` });
      }
      return { ...current, candidates: [...combined.values()] };
    });
    setGrowthMessage(`Dodano do kolejki ${new Set(ids).size} AppID. Importuj po 10 zweryfikowanych gier.`);
    setError(null);
    setBulkPaste("");
  }

  async function discoverSteamGames() {
    if (!discovery.hasMore || discovery.candidates.length >= 200 || busy) return;
    setBusy(true);
    setError(null);
    setGrowthMessage(null);
    try {
      const page = await api<SteamDiscoveryResponse>("/api/steam-catalog/discover", {
        method: "POST", body: JSON.stringify({ cursor: discovery.cursor, pageSize: 50 }),
      });
      setDiscovery((current) => {
        const combined = new Map(current.candidates.map((item) => [item.appId, item]));
        for (const item of page.candidates) combined.set(item.appId, item);
        return { cursor: page.nextCursor, hasMore: page.hasMore, candidates: [...combined.values()].slice(0, 200) };
      });
      setGrowthMessage(`Sprawdzono ${page.scanned} gier Steam, pominięto ${page.alreadyInCatalog} już zapisanych.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function importDiscoveredGames() {
    if (!discovery.candidates.length || busy) return;
    setBusy(true);
    setError(null);
    setGrowthMessage(null);
    try {
      const appIds = discovery.candidates.slice(0, 10).map((game) => game.appId);
      const batch = await api<SteamBatchImportResponse>("/api/steam-catalog/import-batch", {
        method: "POST", body: JSON.stringify({ appIds }),
      });
      const finished = new Set(batch.results.filter((item) => item.status !== "upstream_error").map((item) => item.appId));
      setDiscovery((current) => ({
        ...current, candidates: current.candidates.filter((item) => !finished.has(item.appId)),
      }));
      setGrowthMessage(`Dodano: ${batch.inserted}. Już istniały: ${batch.existing}. Odrzucono: ${batch.ignored}.` +
        (batch.aborted ? " Steam przerwał import — pozostałe gry zachowano do ponowienia." : ""));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function importGame() {
    if (!importValue.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const body = await api<{ game: Omit<Game, "assignments"> & { assignments?: Assignment[] } }>("/api/steam-catalog/import", {
        method: "POST",
        body: JSON.stringify({ url: importValue.trim() }),
      });
      hydrateEditor({ ...body.game, assignments: body.game.assignments ?? [] });
      setImportValue("");
      navigate(`${BASE}/games/${body.game.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  function resetListPosition() {
    setPage(1);
    setPageCursors({});
  }

  function advanceListPage() {
    if (listLoading || page >= pagination.totalPages) return;
    if (pagination.nextCursor) {
      setPageCursors((current) => ({ ...current, [page + 1]: pagination.nextCursor! }));
    }
    setPage((current) => current + 1);
  }

  function goToNextPending() {
    if (nextPendingId === null) return;
    if (hasUnsavedChanges && !window.confirm("Pominąć tę grę i utracić niezapisane zmiany?")) return;
    navigate(`${BASE}/games/${nextPendingId}`);
  }

  async function save(openNext = false) {
    if (!selected) return;
    if (status === "ready" && !readiness.complete) {
      setError(`Brakuje wymaganych elementów: ${readiness.missing.join(", ")}. Zapisz jako „Do sprawdzenia” lub uzupełnij klasyfikację.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api(`/api/steam-catalog/games/${selected.id}/classification`, {
        method: "PUT",
        body: JSON.stringify({
          status,
          expectedRevision: selected.classificationRevision,
          assignments: draft.map((item, index) => ({ termId: item.termId, role: item.role, position: index })),
        }),
      });
      await loadDetail(selected.id);
      const refreshed = await loadQueue(selected.id);
      if (openNext && refreshed.nextId !== null) navigate(`${BASE}/games/${refreshed.nextId}`);
    } catch (cause) {
      if (cause instanceof CatalogApiError && cause.code === "CLASSIFICATION_CONFLICT") {
        // Keep the user's edits intact. Do not overwrite until they explicitly
        // consent to reloading the newer persisted classification.
        setClassificationConflict(true);
      }
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function refreshConflictedGame() {
    if (!selected || busy || !window.confirm("Wczytać nowszą klasyfikację? Twoje niezapisane zmiany zostaną utracone.")) return;
    setBusy(true);
    try {
      await loadDetail(selected.id);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function addTerm() {
    if (!newLabel.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/steam-catalog/taxonomy", {
        method: "POST",
        body: JSON.stringify({ facet: newFacet, label: newLabel.trim() }),
      });
      setNewLabel("");
      await loadTaxonomy();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  function renderFacet(facet: Exclude<Facet, "mechanic">) {
    const facetTerms = termsByFacet.get(facet) ?? [];
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {facetTerms.length ? facetTerms.slice(0, 80).map((term) => (
            <Chip key={term.id} active={Boolean(assignmentFor(term.id))} onClick={() => toggleSimple(term)}>{term.label}</Chip>
          )) : <span className="text-sm text-muted-foreground">Brak pasujących wartości. Spróbuj innej frazy lub dodaj nowe pojęcie w słowniku.</span>}
        </div>
        {facetTerms.length > 80 && <p className="text-xs text-muted-foreground">Wyświetlono 80 z {facetTerms.length} pojęć. Wpisz fragment nazwy, aby znaleźć pozostałe.</p>}
      </div>
    );
  }

  function renderPerspectiveEditor() {
    if (perspective === "gameplay") {
      return (
        <div className="space-y-6">
          <ToolSection title="Gatunek" description="Jedna główna rama opisująca grę.">{renderFacet("genre")}</ToolSection>
          <ToolSection title="Podgatunki" description="Dodatkowe ramy, które realnie współtworzą doświadczenie.">{renderFacet("subgenre")}</ToolSection>
          <ToolSection title="Główne elementy rozgrywki" description="To, co gracz robi regularnie i co definiuje doświadczenie.">
            <div className="flex flex-wrap gap-2">{(termsByFacet.get("mechanic") ?? []).slice(0, 80).map((term) => <Chip key={`main-${term.id}`} active={assignmentFor(term.id)?.role === "main"} onClick={() => setMechanic(term, "main")}>{term.label}</Chip>)}</div>
          </ToolSection>
          <ToolSection title="Poboczne elementy rozgrywki" description="Istotne, ale nie centralne dla większości doświadczenia.">
            <div className="flex flex-wrap gap-2">{(termsByFacet.get("mechanic") ?? []).slice(0, 80).map((term) => <Chip key={`secondary-${term.id}`} active={assignmentFor(term.id)?.role === "secondary"} onClick={() => setMechanic(term, "secondary")}>{term.label}</Chip>)}</div>
          </ToolSection>
        </div>
      );
    }
    const facet: Exclude<Facet, "genre" | "subgenre" | "mechanic" | "detail"> = perspective;
    return <ToolSection title={FACET_LABELS[facet]} description="Wybierz wszystkie wartości, które faktycznie opisują grę.">{renderFacet(facet)}</ToolSection>;
  }

  const mainMechanics = draft.filter((item) => item.facet === "mechanic" && item.role === "main");
  const secondaryMechanics = draft.filter((item) => item.facet === "mechanic" && item.role === "secondary");
  const previewRows = [
    ["Rozgrywka", [...draft.filter((x) => x.facet === "genre"), ...draft.filter((x) => x.facet === "subgenre")]],
    ["Tryb", draft.filter((x) => x.facet === "mode")],
    ["Struktura", draft.filter((x) => x.facet === "structure")],
    ["Świat", draft.filter((x) => x.facet === "world")],
    ["Oprawa", draft.filter((x) => x.facet === "visual")],
  ] as const;

  const backToProject = screen === "home" ? "/ludology" : BASE;
  const backLabel = screen === "home" ? "Ludologia" : "Kategoryzacja gier";

  return (
    <ModuleShell wide={screen === "game" || screen === "games"}>
      <ModuleHeader
        code="LUDO 01"
        title={screen === "home" ? "Kategoryzacja gier" : screen === "game" && selected ? selected.name : "Kategoryzacja gier"}
        description={screen === "home" ? "Nowe spojrzenie na opis gier przez pięć niezależnych perspektyw." : "Projekt klasyfikacji gier i jego narzędzia."}
        accent="amber"
        backHref={backToProject}
        backLabel={backLabel}
        status={screen === "home" ? "projekt" : undefined}
      />

      <div className="mb-4">
        <ToolDisclosure title="Uprawnienia do edycji" description={adminKey ? "Klucz tej sesji został wprowadzony" : "Import i edycja wymagają klucza administratora katalogu"}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <ToolInput
              type="password"
              value={adminKey}
              onChange={(event) => updateAdminKey(event.target.value)}
              autoComplete="off"
              aria-label="Klucz administratora katalogu"
              placeholder="Klucz administratora katalogu"
            />
            <ToolButton type="button" onClick={() => updateAdminKey("")} disabled={!adminKey}>Wyczyść klucz</ToolButton>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Klucz jest przechowywany wyłącznie w pamięci tej karty przeglądarki. Odczyt katalogu nie wymaga klucza. Administrator musi skonfigurować STEAM_CATALOG_ADMIN_TOKEN po stronie serwera.</p>
        </ToolDisclosure>
      </div>
      {error && <div className="mb-4"><ToolNotice tone="danger">{error}</ToolNotice></div>}
      {classificationConflict && selected && screen === "game" && (
        <div role="alert" className="mb-4 space-y-3 rounded-xl border border-amber-400/60 bg-background/60 p-4">
          <p className="text-sm font-semibold text-amber-200">Konflikt edycji: zapisano nowszą wersję klasyfikacji.</p>
          <p className="text-sm text-muted-foreground">Twoje niezapisane zmiany pozostały w formularzu. Aby uniknąć nadpisania zmian drugiego redaktora, odśwież rekord i ponownie wprowadź poprawki.</p>
          <ToolButton type="button" disabled={busy} onClick={refreshConflictedGame}><RefreshCw className="h-4 w-4" /> Wczytaj aktualną wersję</ToolButton>
        </div>
      )}

      {screen === "home" && <ProjectHome />}

      {screen === "search" && (
        <div className="space-y-5">
          <SectionHeader eyebrow="Wyszukiwanie" title="Szukaj gry" description="Przeszukaj katalog. Jeśli gry jeszcze nie ma, możesz ją zaimportować ze Steam." accent="amber" />
          <ToolPanel title="Wyszukiwanie katalogu">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background/60 px-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input value={query} onChange={(event) => { setQuery(event.target.value); resetListPosition(); }} placeholder="Nazwa, studio, AppID..." className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" autoFocus />
              </div>
            </div>
            <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
              {query.trim() && visibleListGames.length ? visibleListGames.map((game) => (
                <Link key={game.id} href={`${BASE}/games/${game.id}`} className="flex items-center gap-4 bg-card/40 px-4 py-3 transition hover:bg-muted/60">
                  {game.headerImageUrl ? <img src={game.headerImageUrl} alt="" className="h-12 w-24 rounded-md object-cover" /> : <div className="h-12 w-24 rounded-md bg-muted" />}
                  <div className="min-w-0 flex-1"><div className="truncate font-semibold">{game.name}</div><div className="mt-0.5 truncate text-xs text-muted-foreground">{game.developer || `Steam AppID ${game.steamAppId}`}</div></div>
                  <span className="text-xs text-muted-foreground">{STATUS_LABELS[game.status]}</span>
                </Link>
              )) : <div className="p-6 text-sm text-muted-foreground">{listLoading ? "Wyszukiwanie..." : query.trim() ? "Brak wyników w katalogu." : "Wpisz nazwę gry lub AppID."}</div>}
            </div>
          </ToolPanel>
          {query.trim() && <div className="flex flex-wrap items-center gap-3 text-sm">
            <span>{pagination.total} wyników · Strona {pagination.page} z {pagination.totalPages}</span>
            <ToolButton type="button" disabled={listLoading || page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Poprzednia</ToolButton>
            <ToolButton type="button" disabled={listLoading || page >= pagination.totalPages} onClick={advanceListPage}>Następna</ToolButton>
          </div>}
          <ToolPanel title="Rozbuduj katalog ze Steam" description="Odkrywaj kolejne prawdziwe gry ze Steam, a następnie importuj po 10. Postęp zostaje zapisany w tej przeglądarce. Wymaga uprawnień administratora i STEAM_WEB_API_KEY na serwerze.">
            <div className="flex flex-wrap items-center gap-2">
              <ToolButton type="button" variant="primary" disabled={busy || !discovery.hasMore || discovery.candidates.length >= 200} onClick={discoverSteamGames}>
                <Search className="h-4 w-4" /> Pobierz propozycje ze Steam
              </ToolButton>
              <ToolButton type="button" disabled={busy || !discovery.candidates.length} onClick={importDiscoveredGames}>
                <Plus className="h-4 w-4" /> Importuj 10 kolejnych
              </ToolButton>
              <ToolButton type="button" variant="ghost" disabled={busy} onClick={() => { setDiscovery(EMPTY_STEAM_DISCOVERY); setGrowthMessage(null); }}>
                Od początku
              </ToolButton>
            </div>
            <div className="mt-4">
              <label htmlFor="steam-bulk-appids" className="mb-2 block text-sm font-medium">
                Masz listę AppID? Wklej do 200 numerów lub adresów Steam, oddzielonych spacjami, przecinkami lub nowymi liniami.
              </label>
              <textarea id="steam-bulk-appids" value={bulkPaste} onChange={(event) => setBulkPaste(event.target.value)}
                placeholder="570, 730, https://store.steampowered.com/app/620/"
                className="min-h-20 w-full rounded-lg border border-border bg-background/60 p-3 text-sm outline-none focus:border-primary" />
              <ToolButton type="button" disabled={busy || !bulkPaste.trim()} onClick={queuePastedSteamGames}>
                Dodaj AppID do kolejki
              </ToolButton>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              Oczekujące gry: <strong>{discovery.candidates.length}</strong> · Ostatni Steam AppID: {discovery.cursor}
              {!discovery.hasMore ? " · Koniec listy Steam." : ""}
              {discovery.candidates.length >= 200 ? " · Zaimportuj oczekujące gry przed pobraniem następnej strony." : ""}
            </div>
            {growthMessage && <p role="status" className="mt-2 text-sm text-foreground">{growthMessage}</p>}
            {discovery.candidates.length > 0 && (
              <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-border rounded-lg border border-border">
                {discovery.candidates.map((item) => (
                  <div key={item.appId} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate">{item.name}</span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">{item.appId}</span>
                  </div>
                ))}
              </div>
            )}
          </ToolPanel>
          <ToolPanel title="Dodaj ze Steam" description="Importuj grę, której nie ma jeszcze w katalogu.">
            <div className="flex flex-col gap-2 sm:flex-row">
              <ToolInput value={importValue} onChange={(event) => setImportValue(event.target.value)} onKeyDown={(event) => event.key === "Enter" && importGame()} placeholder="Steam URL lub AppID" />
              <ToolButton type="button" variant="primary" onClick={importGame} disabled={busy}><Plus className="h-4 w-4" /> Importuj</ToolButton>
            </div>
          </ToolPanel>
        </div>
      )}

      {screen === "games" && (
        <div className="space-y-5">
          <SectionHeader eyebrow="Katalog" title="Wszystkie gry" description={`${pagination.total} pasujących z ${counts.all} skatalogowanych rekordów.`} accent="amber" />
          <ToolPanel title="Filtry katalogu" description="Szukaj po nazwie, studiu lub AppID i filtruj według stanu klasyfikacji.">
            <ToolInput value={query} onChange={(event) => { setQuery(event.target.value); resetListPosition(); }} placeholder="Szukaj w katalogu..." />
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip active={statusFilter === "all"} onClick={() => { setStatusFilter("all"); resetListPosition(); }}>Wszystkie ({counts.all})</Chip>
              {(Object.keys(STATUS_LABELS) as Game["status"][]).map((value) => (
                <Chip key={value} active={statusFilter === value} onClick={() => { setStatusFilter(value); resetListPosition(); }}>
                  {STATUS_LABELS[value]} ({counts[value]})
                </Chip>
              ))}
            </div>
          </ToolPanel>
          {visibleListGames.length ? (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card/50">
              <div className="grid min-w-[620px] grid-cols-[minmax(0,1fr)_150px_140px] gap-3 border-b border-border bg-background/40 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                <span>Gra</span><span>Status</span><span>Steam AppID</span>
              </div>
              <div className="divide-y divide-border">
                {visibleListGames.map((game) => (
                  <Link key={game.id} href={`${BASE}/games/${game.id}`} className="grid min-w-[620px] grid-cols-[minmax(0,1fr)_150px_140px] gap-3 px-4 py-3 text-sm transition hover:bg-muted/50">
                    <span className="truncate font-semibold">{game.name}</span><span className="text-muted-foreground">{STATUS_LABELS[game.status]}</span><span className="font-mono text-xs text-muted-foreground">{game.steamAppId}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : listLoading
            ? <ToolEmptyState title="Wczytywanie katalogu" description="Trwa pobieranie danych." />
            : counts.all
              ? <ToolEmptyState title="Brak wyników" description="Zmień frazę wyszukiwania lub status klasyfikacji." />
              : <ToolEmptyState title="Brak gier" description="Zaimportuj pierwszą grę w sekcji Szukaj gry." />}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>Strona {pagination.page} z {pagination.totalPages} · {pagination.total} wyników</span>
            <ToolButton type="button" disabled={listLoading || page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Poprzednia</ToolButton>
            <ToolButton type="button" disabled={listLoading || page >= pagination.totalPages} onClick={advanceListPage}>Następna</ToolButton>
          </div>
        </div>
      )}

      {(["gameplay", "mode", "structure", "world", "visual"] as Screen[]).includes(screen) && (() => {
        const item = PERSPECTIVE_COPY[screen as Perspective];
        return (
          <div className="space-y-5">
            <SectionHeader eyebrow={`Perspektywa ${item.code}`} title={item.title} description={item.question} accent="amber" />
            <ToolPanel title={item.description}>
              <div className="grid gap-3 md:grid-cols-2">{item.details.map((detail) => <div key={detail} className="rounded-xl border border-border bg-background/40 p-4 text-sm leading-6 text-muted-foreground">{detail}</div>)}</div>
            </ToolPanel>
          </div>
        );
      })()}

      {screen === "methodology" && (
        <div className="space-y-5">
          <SectionHeader eyebrow="Metodologia" title="Jak powstaje klasyfikacja" description="Rozdzielenie faktów źródłowych od interpretacji i kontrola jakości." accent="amber" />
          <div className="grid gap-4 md:grid-cols-2">
            <ToolPanel title="1. Dane źródłowe"><p className="text-sm leading-6 text-muted-foreground">Automatycznie pobierane są dane faktograficzne ze Steam: AppID, opis, informacje wydawcy, kategorie i dostępne tagi. Dane źródłowe są przechowywane osobno od własnej klasyfikacji.</p></ToolPanel>
            <ToolPanel title="2. Pięć perspektyw"><p className="text-sm leading-6 text-muted-foreground">Gra jest opisywana na niezależnych osiach: Rozgrywka, Tryb, Struktura, Świat i Oprawa. Dzięki temu jedna etykieta nie musi łączyć kilku różnych cech.</p></ToolPanel>
            <ToolPanel title="3. Centralność"><p className="text-sm leading-6 text-muted-foreground">Sama obecność elementu nie oznacza, że definiuje grę. Szczególnie w Rozgrywce rozróżniane są elementy główne i poboczne.</p></ToolPanel>
            <ToolPanel title="4. Kontrola jakości"><p className="text-sm leading-6 text-muted-foreground">Niepewne rekordy mogą trafiać do weryfikacji. Docelowo klasyfikator automatyczny powinien być sprawdzany na ręcznie przygotowanym zbiorze wzorcowym.</p></ToolPanel>
          </div>
        </div>
      )}

      {screen === "why" && (
        <div className="space-y-5">
          <SectionHeader eyebrow="Założenia" title="Dlaczego powstał ten projekt" description="Próba uporządkowania problemów obecnych sposobów opisywania gier." accent="amber" />
          <ToolPanel title="Problem">
            <div className="space-y-4 text-sm leading-7 text-muted-foreground">
              <p>Popularne systemy kategorii i tagów często mieszają różne poziomy opisu: gatunek, sposób rozgrywki, tryb wieloosobowy, strukturę świata, setting i styl wizualny.</p>
              <p>Tag mówi zwykle, że jakiś element istnieje, ale nie mówi, jak ważny jest dla doświadczenia. Gra może zawierać łowienie ryb, crafting albo PvP, choć nie są one tym, co najlepiej ją definiuje.</p>
              <p>Projekt jest próbą spojrzenia na grę z kilku niezależnych stron zamiast wciskania jej w jedną hierarchię gatunkową. Pięć perspektyw ma być czytelne dla użytkownika, a szczegółowa baza może pozostać znacznie bogatsza pod spodem.</p>
            </div>
          </ToolPanel>
        </div>
      )}

      {screen === "game" && !selected && (
        gameLoading
          ? <ToolEmptyState title="Wczytywanie gry" description="Trwa pobieranie rekordu." />
          : <ToolEmptyState title="Nie znaleziono gry" description="Rekord nie istnieje w katalogu." />
      )}

      {screen === "game" && selected && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card/50 px-4 py-3 text-sm text-muted-foreground">
            Do opracowania: <strong className="text-foreground">{queue?.pendingCount ?? "…"}</strong> gier.
            {nextPendingId === null && <span className="ml-2">Brak kolejnej gry w kolejce.</span>}
          </div>
          <ToolToolbar>
            <Link href={`${BASE}/games`} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm font-semibold hover:bg-muted"><ArrowLeft className="h-4 w-4" /> Wszystkie gry</Link>
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{selected.name}</div><div className="mt-0.5 truncate text-xs text-muted-foreground">{[selected.developer, selected.releaseDate].filter(Boolean).join(" · ") || `Steam AppID ${selected.steamAppId}`}</div></div>
            <a href={selected.steamUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted">Steam <ExternalLink className="h-3.5 w-3.5" /></a>
            <ToolSelect aria-label="Status klasyfikacji" value={status} onChange={(event) => setStatus(event.target.value as Game["status"])} className="w-auto min-w-36">{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</ToolSelect>
            {hasUnsavedChanges && <span role="status" className="text-xs font-semibold text-amber-300">Niezapisane zmiany</span>}
            <ToolButton type="button" variant="ghost" onClick={() => { setDraft(selected.assignments); setStatus(selected.status); }} disabled={busy || !hasUnsavedChanges}>Przywróć</ToolButton>
            <ToolButton type="button" variant="ghost" onClick={goToNextPending} disabled={busy || nextPendingId === null}>Następna do opracowania</ToolButton>
            <ToolButton type="button" variant="primary" onClick={() => save()} disabled={busy || classificationConflict || !hasUnsavedChanges}><Save className="h-4 w-4" /> Zapisz</ToolButton>
            <ToolButton type="button" variant="primary" onClick={() => save(true)} disabled={busy || classificationConflict || !hasUnsavedChanges || nextPendingId === null}><Save className="h-4 w-4" /> Zapisz i dalej</ToolButton>
          </ToolToolbar>

          <ToolPanel title="Kontrola kompletności" description="Wymagania do uzyskania statusu Gotowe. Niepełny rekord można zapisać jako roboczy lub Do sprawdzenia.">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {readiness.checks.map((check) => (
                <div key={check.key} className={`rounded-lg border px-3 py-2 text-sm ${check.complete ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-200" : "border-border bg-background/50 text-muted-foreground"}`}>
                  <span aria-hidden="true">{check.complete ? "✓" : "○"}</span> {check.label}
                </div>
              ))}
            </div>
            {status === "ready" && !readiness.complete && (
              <p role="alert" className="mt-3 text-sm text-amber-300">Status Gotowe wymaga uzupełnienia brakujących elementów. Możesz zapisać rekord jako Do sprawdzenia.</p>
            )}
          </ToolPanel>
          <ToolPanel title="Pięć perspektyw" description="Pracuj nad jedną perspektywą naraz.">
            <ToolInput value={termQuery} onChange={(event) => setTermQuery(event.target.value)} placeholder="Szukaj pojęć w słowniku..." aria-label="Szukaj pojęć w słowniku" />
            <p className="mt-2 mb-4 text-xs text-muted-foreground">Wyszukiwanie obejmuje nazwy i identyfikatory pojęć. Zaznaczone wartości są wyświetlane jako pierwsze; listy ograniczono do 80 pozycji dla płynności.</p>
            <ToolSegmented value={perspective} options={PERSPECTIVES} onChange={(value) => setPerspective(value)} />
            <div className="mt-6">{renderPerspectiveEditor()}</div>
          </ToolPanel>
          <ToolDisclosure title="Pozostałe tagi" description="Szczegóły używane głównie do filtrowania.">{renderFacet("detail")}</ToolDisclosure>
          <ToolDisclosure title="Podgląd rekordu" description="To, co później zobaczy użytkownik katalogu.">
            <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div>{selected.headerImageUrl && <img src={selected.headerImageUrl} alt="" className="w-full rounded-xl object-cover" />}<h3 className="mt-3 text-lg font-bold">{selected.name}</h3><p className="mt-1 text-xs text-muted-foreground">Steam AppID {selected.steamAppId}</p></div>
              <div className="grid gap-4 sm:grid-cols-2">{previewRows.map(([label, items]) => <div key={label}><div className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">{label}</div><div className="mt-1.5 text-sm">{items.length ? items.map((item) => item.label).join(" · ") : "—"}</div></div>)}<div><div className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Główne elementy</div><div className="mt-1.5 text-sm">{mainMechanics.length ? mainMechanics.map((item) => item.label).join(" · ") : "—"}</div></div><div><div className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Poboczne elementy</div><div className="mt-1.5 text-sm">{secondaryMechanics.length ? secondaryMechanics.map((item) => item.label).join(" · ") : "—"}</div></div></div>
            </div>
          </ToolDisclosure>
          <ToolDisclosure title="Słownik" description="Dodawaj nowe wartości dopiero, gdy brakuje ich w systemie.">
            <div className="grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)_auto_auto]"><ToolSelect value={newFacet} onChange={(event) => setNewFacet(event.target.value as Facet)}>{Object.entries(FACET_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</ToolSelect><ToolInput value={newLabel} onChange={(event) => setNewLabel(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addTerm()} placeholder="Nowa wartość" /><ToolButton type="button" onClick={addTerm} disabled={busy}><Plus className="h-4 w-4" /> Dodaj</ToolButton><ToolButton type="button" variant="ghost" disabled={busy || hasUnsavedChanges} onClick={() => loadTaxonomy().catch((cause) => setError(String(cause)))}><RefreshCw className="h-4 w-4" /> Odśwież</ToolButton></div>
          </ToolDisclosure>
        </div>
      )}
    </ModuleShell>
  );
}
