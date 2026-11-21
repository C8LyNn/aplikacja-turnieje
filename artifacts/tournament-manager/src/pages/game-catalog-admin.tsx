import { t } from "@/i18n";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  EMPTY_STEAM_GROWTH, readSteamGrowthProgress, runSteamGrowthSession,
  type SteamGrowthProgress, type SteamDiscoveryPage, type SteamBatchResponse,
} from "./game-catalog-growth-runner";
import {
  mergeSteamSpyDiscoveryPage, runSteamSpyGrowthSession,
} from "./game-catalog-steamspy-growth-runner";
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
type ServerImportJob = {
  id: string; status: "running" | "paused" | "completed";
  source: "steam" | "steamspy"; sourcePage: number;
  cursor: number; pending: number; hasMore: boolean; maxGames: number;
  processed: number; inserted: number; existing: number;
  ignored: number; failed: number; scanned: number;
  pauseRequested: boolean; lastError: string | null;
  retryCount: number; nextRunAt: string;
};
type SteamDiscoveryProgress = SteamGrowthProgress;
type SteamDiscoveryResponse = SteamDiscoveryPage;
type SteamBatchImportResponse = SteamBatchResponse;
type SteamFeaturedResponse = Pick<SteamDiscoveryPage, "candidates" | "scanned" | "alreadyInCatalog">;
type SteamSpyProgress = { page: number; offset: number; hasMore: boolean };
type SteamSpyDiscoveryResponse = {
  candidates: SteamGrowthProgress["candidates"];
  nextPage: number;
  nextOffset: number;
  hasMore: boolean;
  scanned: number;
  alreadyInCatalog: number;
};
const STEAMSPY_STORAGE = "steam-catalog-steamspy-progress-v1";
const EMPTY_STEAMSPY_PROGRESS: SteamSpyProgress = { page: 0, offset: 0, hasMore: true };
function readSteamSpyProgress(raw: string | null): SteamSpyProgress {
  try {
    const value: unknown = raw ? JSON.parse(raw) : null;
    if (!value || typeof value !== "object" || Array.isArray(value)) return { ...EMPTY_STEAMSPY_PROGRESS };
    const item = value as Record<string, unknown>;
    if (!Number.isSafeInteger(item.page) || (item.page as number) < 0 || (item.page as number) > 300 ||
        !Number.isSafeInteger(item.offset) || (item.offset as number) < 0 || (item.offset as number) >= 1000 ||
        typeof item.hasMore !== "boolean") return { ...EMPTY_STEAMSPY_PROGRESS };
    return { page: item.page as number, offset: item.offset as number, hasMore: item.hasMore };
  } catch {
    return { ...EMPTY_STEAMSPY_PROGRESS };
  }
}
const STEAM_DISCOVERY_STORAGE = "steam-catalog-discovery-progress-v1";
const EMPTY_STEAM_DISCOVERY = EMPTY_STEAM_GROWTH;

const BASE = "/ludology/game-classification";
const PAGE_SIZE = 25;
const ADMIN_KEY_STORAGE = "tm_steam_catalog_admin_token";

const FACET_LABELS: Record<Facet, string> = {
  get genre() { return t("gameCatalogAdmin.gatunek"); },
  get subgenre() { return t("gameCatalogAdmin.podgatunki"); },
  get mechanic() { return t("gameCatalogAdmin.elementy_rozgrywki"); },
  mode: "Tryb",
  get structure() { return t("gameCatalogAdmin.struktura"); },
  get world() { return t("gameCatalogAdmin.swiat"); },
  get visual() { return t("gameCatalogAdmin.oprawa"); },
  get detail() { return t("gameCatalogAdmin.pozostale_tagi"); },
};

const STATUS_LABELS: Record<Game["status"], string> = {
  unclassified: "Nieopisane",
  get review() { return t("gameCatalogAdmin.do_sprawdzenia"); },
  get ready() { return t("gameCatalogAdmin.gotowe"); },
};

const PERSPECTIVES = [
  { value: "gameplay", get label() { return t("gameCatalogAdmin.rozgrywka"); } },
  { value: "mode", get label() { return t("gameCatalogAdmin.tryb"); } },
  { value: "structure", get label() { return t("gameCatalogAdmin.struktura"); } },
  { value: "world", get label() { return t("gameCatalogAdmin.swiat"); } },
  { value: "visual", get label() { return t("gameCatalogAdmin.oprawa"); } },
] as const;

const PERSPECTIVE_COPY: Record<
  Perspective,
  { code: string; title: string; question: string; description: string; details: string[] }
> = {
  gameplay: {
    code: "01",
    get title() { return t("gameCatalogAdmin.rozgrywka"); },
    get question() { return t("gameCatalogAdmin.co_robie"); },
    get description() { return t("gameCatalogAdmin.perspektywa_opisujaca_podstawowy_charakt"); },
    get details() {
      return [t("gameCatalogAdmin.gatunek_glowny_najwazniejsza_rama"), t("gameCatalogAdmin.podgatunki_dodatkowe_ramy_realnie"), t("gameCatalogAdmin.glowne_elementy_czynnosci_i_systemy"), t("gameCatalogAdmin.poboczne_elementy_obecne_i_istotne")];
    },
  },
  mode: {
    code: "02",
    get title() { return t("gameCatalogAdmin.tryb"); },
    get question() { return t("gameCatalogAdmin.z_kim_i_przeciw_komu"); },
    get description() { return t("gameCatalogAdmin.oddziela_relacje_miedzy_graczami_i"); },
    get details() { return ["Singleplayer", "Co-op", "PvE", "PvP", "PvPvE", t("gameCatalogAdmin.mmo_i_warianty_lokalne_online")]; },
  },
  structure: {
    code: "03",
    get title() { return t("gameCatalogAdmin.struktura"); },
    get question() { return t("gameCatalogAdmin.jak_zorganizowana_jest_gra"); },
    get description() { return t("gameCatalogAdmin.opisuje_sposob_organizacji_przestrzeni_i"); },
    details: ["Open world", "Linear", "Mission-based", "Hub-based", "Run-based", "Match-based", "Persistent world"],
  },
  world: {
    code: "04",
    get title() { return t("gameCatalogAdmin.swiat"); },
    get question() { return t("gameCatalogAdmin.gdzie_i_w_jakiej_konwencji_2"); },
    get description() { return t("gameCatalogAdmin.opisuje_setting_oraz_konwencje_swiata"); },
    get details() { return ["Fantasy", "Dark fantasy", "Science fiction", "Cyberpunk", "Steampunk", t("gameCatalogAdmin.historyczne"), t("gameCatalogAdmin.wspolczesne")]; },
  },
  visual: {
    code: "05",
    get title() { return t("gameCatalogAdmin.oprawa"); },
    get question() { return t("gameCatalogAdmin.jak_gra_wyglada"); },
    get description() { return t("gameCatalogAdmin.opisuje_sposob_wizualnego_przedstawienia"); },
    details: ["Realistic", "Stylized", "Anime / manga", "Cartoon", "Pixel art", "Cel-shaded" /* i18n-ignore: English art-style term */, "Low-poly"],
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
      <ProjectCard code={t("gameCatalogAdmin.szukaj")} title={t("gameCatalogAdmin.szukaj_gry")} description={t("gameCatalogAdmin.znajdz_konkretna_gre_w_katalogu")} href={`${BASE}/search`} icon={Search} accent="amber" />
      <ProjectCard code={t("gameCatalogAdmin.katalog")} title={t("gameCatalogAdmin.wszystkie_gry")} description={t("gameCatalogAdmin.pelna_lista_wszystkich_skatalogowanych_r")} href={`${BASE}/games`} icon={List} accent="amber" />
      <ProjectCard code="01" title={t("gameCatalogAdmin.rozgrywka")} description={t("gameCatalogAdmin.co_robie_gatunek_podgatunki_i")} href={`${BASE}/gameplay`} icon={Gamepad2} accent="amber" />
      <ProjectCard code="02" title={t("gameCatalogAdmin.tryb")} description={t("gameCatalogAdmin.z_kim_i_przeciw_komu")} href={`${BASE}/mode`} icon={Users} accent="amber" />
      <ProjectCard code="03" title={t("gameCatalogAdmin.struktura")} description={t("gameCatalogAdmin.jak_zorganizowana_jest_gra")} href={`${BASE}/structure`} icon={Network} accent="amber" />
      <ProjectCard code="04" title={t("gameCatalogAdmin.swiat")} description={t("gameCatalogAdmin.gdzie_i_w_jakiej_konwencji")} href={`${BASE}/world`} icon={Globe2} accent="amber" />
      <ProjectCard code="05" title={t("gameCatalogAdmin.oprawa")} description={t("gameCatalogAdmin.jak_gra_wyglada_i_w")} href={`${BASE}/visual`} icon={Palette} accent="amber" />
      <ProjectCard code={t("gameCatalogAdmin.metoda")} title={t("gameCatalogAdmin.metodologia")} description={t("gameCatalogAdmin.jak_zbierane_porzadkowane_i_sprawdzane")} href={`${BASE}/methodology`} icon={FlaskConical} accent="amber" />
      <ProjectCard code={t("gameCatalogAdmin.dlaczego")} title={t("gameCatalogAdmin.dlaczego_powstal_projekt")} description={t("gameCatalogAdmin.problemy_obecnych_klasyfikacji_i_cel")} href={`${BASE}/why`} icon={Lightbulb} accent="amber" />
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
  const [discovery, setDiscovery] = useState<SteamDiscoveryProgress>(() =>
    readSteamGrowthProgress(window.localStorage.getItem(STEAM_DISCOVERY_STORAGE)));
  const [steamSpy, setSteamSpy] = useState<SteamSpyProgress>(() =>
    readSteamSpyProgress(window.localStorage.getItem(STEAMSPY_STORAGE)));
  const autoStopRef = useRef(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const [growthMessage, setGrowthMessage] = useState<string | null>(null);
  const [bulkPaste, setBulkPaste] = useState("");
  const [serverImportJob, setServerImportJob] = useState<ServerImportJob | null>(null);
  const [serverImportLimit, setServerImportLimit] = useState("1000");
  const [serverImportSource, setServerImportSource] = useState<"steam" | "steamspy">("steamspy");
  const [serverImportMessage, setServerImportMessage] = useState<string | null>(null);
  const [serverJobBusy, setServerJobBusy] = useState(false);
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
  useEffect(() => {
    window.localStorage.setItem(STEAMSPY_STORAGE, JSON.stringify(steamSpy));
  }, [steamSpy]);
  useEffect(() => () => { autoStopRef.current = true; }, []);

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
      if (!window.confirm(t("gameCatalogAdmin.masz_niezapisane_zmiany_opuscic_edytor"))) {
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
      setError(t("gameCatalogAdmin.wklej_od_1_do_200"));
      return;
    }
    const ids = tokens.map((token) => {
      const match = token.match(/^(?:https?:\/\/store\.steampowered\.com\/app\/)?([1-9]\d*)(?:\/[^\s]*)?$/i);
      const value = match ? Number(match[1]) : NaN;
      return Number.isSafeInteger(value) && value <= 2_147_483_647 ? value : null;
    });
    if (ids.some((item) => item === null)) {
      setError(t("gameCatalogAdmin.lista_zawiera_niepoprawny_appid_lub"));
      return;
    }
    const pending = new Set(discovery.candidates.map((item) => item.appId));
    for (const id of ids as number[]) pending.add(id);
    if (pending.size > 200) {
      setError(t("gameCatalogAdmin.kolejka_miesci_maksymalnie_200_gier"));
      return;
    }
    setDiscovery((current) => {
      const combined = new Map(current.candidates.map((item) => [item.appId, item]));
      for (const id of ids as number[]) {
        if (!combined.has(id)) combined.set(id, { appId: id, name: `Steam AppID ${id}` });
      }
      return { ...current, candidates: [...combined.values()] };
    });
    setGrowthMessage(t("gameCatalogAdmin.dodano_do_kolejki_size_appid", { size: new Set(ids).size }));
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
        // Never advance the cursor past candidates that cannot fit in the
        // persisted queue. Existing AppIDs may reduce actual candidates.
        method: "POST", body: JSON.stringify({
          cursor: discovery.cursor, pageSize: Math.min(50, 200 - discovery.candidates.length),
        }),
      });
      setDiscovery((current) => {
        const combined = new Map(current.candidates.map((item) => [item.appId, item]));
        for (const item of page.candidates) combined.set(item.appId, item);
        return {
          ...current, cursor: page.nextCursor, hasMore: page.hasMore,
          candidates: [...combined.values()],
          stats: { ...current.stats, scanned: current.stats.scanned + page.scanned },
        };
      });
      setGrowthMessage(t("gameCatalogAdmin.sprawdzono_scanned_gier_steam_pominieto", { scanned: page.scanned, alreadyInCatalog: page.alreadyInCatalog }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function discoverFeaturedGames() {
    if (busy || discovery.candidates.length >= 200) return;
    setBusy(true);
    setError(null);
    setGrowthMessage(null);
    try {
      const page = await api<SteamFeaturedResponse>("/api/steam-catalog/discover-featured", {
        method: "POST", body: JSON.stringify({}),
      });
      setDiscovery((current) => {
        const combined = new Map(current.candidates.map((item) => [item.appId, item]));
        for (const item of page.candidates) {
          if (combined.size >= 200) break;
          if (!combined.has(item.appId)) combined.set(item.appId, item);
        }
        return {
          ...current, candidates: [...combined.values()],
          stats: { ...current.stats, scanned: current.stats.scanned + page.scanned },
        };
      });
      setGrowthMessage(t("gameCatalogAdmin.pobrano_scanned_propozycji_ze_steam", { scanned: page.scanned, alreadyInCatalog: page.alreadyInCatalog }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function discoverSteamSpyGames() {
    if (busy || !steamSpy.hasMore || discovery.candidates.length >= 200) return;
    setBusy(true);
    setError(null);
    setGrowthMessage(null);
    try {
      const query = {
        page: steamSpy.page,
        offset: steamSpy.offset,
        pageSize: Math.min(100, 200 - discovery.candidates.length),
      };
      const response = await api<SteamSpyDiscoveryResponse>("/api/steam-catalog/discover-steamspy", {
        method: "POST", body: JSON.stringify(query),
      });
      const next = mergeSteamSpyDiscoveryPage(discovery, steamSpy, response, query.pageSize);
      // Write queue first: a refresh between writes may repeat discovery,
      // but cannot skip AppIDs that were not recorded locally.
      window.localStorage.setItem(STEAM_DISCOVERY_STORAGE, JSON.stringify(next.queue));
      setDiscovery(next.queue);
      window.localStorage.setItem(STEAMSPY_STORAGE, JSON.stringify(next.source));
      setSteamSpy(next.source);
      setGrowthMessage(t("gameCatalogAdmin.steamspy_sprawdzono_scanned_appid_juz", { scanned: response.scanned, alreadyInCatalog: response.alreadyInCatalog, v2: next.queue.candidates.length - discovery.candidates.length }));
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
        stats: {
          ...current.stats, inserted: current.stats.inserted + batch.inserted,
          existing: current.stats.existing + batch.existing,
          ignored: current.stats.ignored + batch.ignored,
          failed: current.stats.failed + batch.failed,
          batches: current.stats.batches + 1,
        },
      }));
      setGrowthMessage(t("gameCatalogAdmin.dodano_inserted_juz_istnialy_existing", { inserted: batch.inserted, existing: batch.existing, ignored: batch.ignored }) +
        (batch.aborted ? t("gameCatalogAdmin.steam_przerwal_import_pozostale_gry") : ""));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function runAutomaticGrowth(queueOnly = false) {
    if (autoRunning || busy || (queueOnly && !discovery.candidates.length)) return;
    autoStopRef.current = false;
    setAutoRunning(true);
    setBusy(true);
    setError(null);
    setGrowthMessage(t("gameCatalogAdmin.trwa_weryfikacja_i_dodawanie_kolejnych"));
    try {
      const result = await runSteamGrowthSession({
        initial: discovery,
        // Queue-only mode works without STEAM_WEB_API_KEY. Using the exact
        // pending count prevents the runner from calling /discover afterwards.
        maxVerified: queueOnly ? Math.min(100, discovery.candidates.length) : 100,
        maxPages: 20,
        shouldStop: () => autoStopRef.current,
        discover: (cursor) => api<SteamDiscoveryPage>("/api/steam-catalog/discover", {
          method: "POST", body: JSON.stringify({ cursor, pageSize: 50 }),
        }),
        importBatch: (appIds) => api<SteamBatchImportResponse>("/api/steam-catalog/import-batch", {
          method: "POST", body: JSON.stringify({ appIds }),
        }),
        checkpoint: (progress) => {
          // Save synchronously after every response; a later refresh or error
          // can restart from the latest confirmed server-side outcome.
          window.localStorage.setItem(STEAM_DISCOVERY_STORAGE, JSON.stringify(progress));
          setDiscovery(progress);
        },
      });
      const messages = {
        limit: t("gameCatalogAdmin.zakonczono_limit_tej_serii_mozna"),
        end_of_list: t("gameCatalogAdmin.dotarto_do_konca_dostepnych_propozycji"),
        paused: t("gameCatalogAdmin.proces_zatrzymany_postep_zapisany"),
        upstream_stopped: t("gameCatalogAdmin.steam_przerwal_import_lub_ograniczyl"),
      };
      const summary = queueOnly && result.reason === "limit"
        ? t("gameCatalogAdmin.przetworzono_biezaca_czesc_kolejki_mozna")
        : messages[result.reason];
      setGrowthMessage(t("gameCatalogAdmin.summary_zweryfikowano_verified_appid_w", { summary: summary, verified: result.verified, v2: result.progress.stats.inserted - discovery.stats.inserted }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      setGrowthMessage(t("gameCatalogAdmin.postep_wczesniejszych_zakonczonych_parti"));
    } finally {
      autoStopRef.current = true;
      setAutoRunning(false);
      setBusy(false);
    }
  }

  async function refreshServerImportJob() {
    if (!adminKey || serverJobBusy) return;
    setServerJobBusy(true);
    try {
      const payload = await api<{ job: ServerImportJob | null }>("/api/steam-catalog/import-job", {
        headers: { "x-steam-catalog-admin-token": adminKey },
      });
      setServerImportJob(payload.job);
      setServerImportMessage(payload.job ? t("gameCatalogAdmin.odczytano_aktualny_stan_zadania_z") : t("gameCatalogAdmin.brak_zadania_serwerowego"));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setServerJobBusy(false);
    }
  }

  async function startServerImportJob() {
    const limit = Number(serverImportLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 20000) {
      setError(t("gameCatalogAdmin.podaj_limit_od_1_do"));
      return;
    }
    setServerJobBusy(true);
    setError(null);
    try {
      const payload = await api<{ job: ServerImportJob }>("/api/steam-catalog/import-job", {
        method: "POST", body: JSON.stringify({ maxGames: limit, source: serverImportSource }),
      });
      setServerImportJob(payload.job);
      setServerImportMessage(t("gameCatalogAdmin.zadanie_v0_uruchomione_mozesz_zamknac", { v0: serverImportSource === "steamspy" ? t("gameCatalogAdmin.steamspy_bez_klucza") : "Steam Web API" }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setServerJobBusy(false);
    }
  }

  async function changeServerImportJob(operation: "pause" | "resume") {
    if (!serverImportJob || serverJobBusy) return;
    setServerJobBusy(true);
    setError(null);
    try {
      const payload = await api<{ job: ServerImportJob }>(
        `/api/steam-catalog/import-job/${serverImportJob.id}/${operation}`, { method: "POST" });
      setServerImportJob(payload.job);
      setServerImportMessage(operation === "pause"
        ? t("gameCatalogAdmin.wstrzymanie_zlecone_biezacy_krok_zostani")
        : t("gameCatalogAdmin.zadanie_wznowione_na_serwerze"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setServerJobBusy(false);
    }
  }

  async function runAutomaticSteamSpyGrowth() {
    if (busy || autoRunning || (!steamSpy.hasMore && !discovery.candidates.length)) return;
    autoStopRef.current = false;
    setAutoRunning(true);
    setBusy(true);
    setError(null);
    setGrowthMessage(t("gameCatalogAdmin.steamspy_trwa_odkrywanie_i_weryfikowanie"));
    try {
      const result = await runSteamSpyGrowthSession({
        initial: discovery,
        source: steamSpy,
        maxVerified: 100,
        maxPages: 20,
        shouldStop: () => autoStopRef.current,
        discover: (query) => api<SteamSpyDiscoveryResponse>("/api/steam-catalog/discover-steamspy", {
          method: "POST", body: JSON.stringify(query),
        }),
        importBatch: (appIds) => api<SteamBatchImportResponse>("/api/steam-catalog/import-batch", {
          method: "POST", body: JSON.stringify({ appIds }),
        }),
        checkpoint: (state) => {
          window.localStorage.setItem(STEAM_DISCOVERY_STORAGE, JSON.stringify(state.queue));
          setDiscovery(state.queue);
          window.localStorage.setItem(STEAMSPY_STORAGE, JSON.stringify(state.source));
          setSteamSpy(state.source);
        },
      });
      const endings = {
        limit: t("gameCatalogAdmin.zakonczono_serie_mozesz_uruchomic_kolejn"),
        end_of_list: t("gameCatalogAdmin.wyczerpano_dostepne_strony_steamspy"),
        paused: t("gameCatalogAdmin.zatrzymano_po_ostatniej_zakonczonej_part"),
        upstream_stopped: t("gameCatalogAdmin.steam_przerwal_weryfikacje_pozostale_app"),
      };
      setGrowthMessage(t("gameCatalogAdmin.v0_zweryfikowano_verified_appid_nowe", { v0: endings[result.reason], verified: result.verified, v2: result.queue.stats.inserted - discovery.stats.inserted, pages: result.pages }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      setGrowthMessage(t("gameCatalogAdmin.zachowano_ukonczone_partie_i_kursor"));
    } finally {
      autoStopRef.current = true;
      setAutoRunning(false);
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
    if (hasUnsavedChanges && !window.confirm(t("gameCatalogAdmin.pominac_te_gre_i_utracic"))) return;
    navigate(`${BASE}/games/${nextPendingId}`);
  }

  async function save(openNext = false) {
    if (!selected) return;
    if (status === "ready" && !readiness.complete) {
      setError(t("gameCatalogAdmin.brakuje_wymaganych_elementow_v0_zapisz", { v0: readiness.missing.join(", ") }));
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
    if (!selected || busy || !window.confirm(t("gameCatalogAdmin.wczytac_nowsza_klasyfikacje_twoje_niezap"))) return;
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
          )) : <span className="text-sm text-muted-foreground">{t("gameCatalogAdmin.brak_pasujacych_wartosci_sprobuj_innej")}</span>}
        </div>
        {facetTerms.length > 80 && <p className="text-xs text-muted-foreground">{t("gameCatalogAdmin.wyswietlono_80_z")}{" "}{facetTerms.length}{" "}{t("gameCatalogAdmin.pojec_wpisz_fragment_nazwy_aby")}</p>}
      </div>
    );
  }

  function renderPerspectiveEditor() {
    if (perspective === "gameplay") {
      return (
        <div className="space-y-6">
          <ToolSection title={t("gameCatalogAdmin.gatunek")} description={t("gameCatalogAdmin.jedna_glowna_rama_opisujaca_gre")}>{renderFacet("genre")}</ToolSection>
          <ToolSection title={t("gameCatalogAdmin.podgatunki")} description={t("gameCatalogAdmin.dodatkowe_ramy_ktore_realnie_wspoltworza")}>{renderFacet("subgenre")}</ToolSection>
          <ToolSection title={t("gameCatalogAdmin.glowne_elementy_rozgrywki")} description={t("gameCatalogAdmin.to_co_gracz_robi_regularnie")}>
            <div className="flex flex-wrap gap-2">{(termsByFacet.get("mechanic") ?? []).slice(0, 80).map((term) => <Chip key={`main-${term.id}`} active={assignmentFor(term.id)?.role === "main"} onClick={() => setMechanic(term, "main")}>{term.label}</Chip>)}</div>
          </ToolSection>
          <ToolSection title={t("gameCatalogAdmin.poboczne_elementy_rozgrywki")} description={t("gameCatalogAdmin.istotne_ale_nie_centralne_dla")}>
            <div className="flex flex-wrap gap-2">{(termsByFacet.get("mechanic") ?? []).slice(0, 80).map((term) => <Chip key={`secondary-${term.id}`} active={assignmentFor(term.id)?.role === "secondary"} onClick={() => setMechanic(term, "secondary")}>{term.label}</Chip>)}</div>
          </ToolSection>
        </div>
      );
    }
    const facet: Exclude<Facet, "genre" | "subgenre" | "mechanic" | "detail"> = perspective;
    return <ToolSection title={FACET_LABELS[facet]} description={t("gameCatalogAdmin.wybierz_wszystkie_wartosci_ktore_faktycz")}>{renderFacet(facet)}</ToolSection>;
  }

  const mainMechanics = draft.filter((item) => item.facet === "mechanic" && item.role === "main");
  const secondaryMechanics = draft.filter((item) => item.facet === "mechanic" && item.role === "secondary");
  const previewRows = [
    [t("gameCatalogAdmin.rozgrywka"), [...draft.filter((x) => x.facet === "genre"), ...draft.filter((x) => x.facet === "subgenre")]],
    [t("gameCatalogAdmin.tryb"), draft.filter((x) => x.facet === "mode")],
    [t("gameCatalogAdmin.struktura"), draft.filter((x) => x.facet === "structure")],
    [t("gameCatalogAdmin.swiat"), draft.filter((x) => x.facet === "world")],
    [t("gameCatalogAdmin.oprawa"), draft.filter((x) => x.facet === "visual")],
  ] as const;

  const backToProject = screen === "home" ? "/ludology" : BASE;
  const backLabel = screen === "home" ? t("gameCatalogAdmin.ludologia") : t("gameCatalogAdmin.kategoryzacja_gier");

  return (
    <ModuleShell wide={screen === "game" || screen === "games"}>
      <ModuleHeader
        code="LUDO 01"
        title={screen === "home" ? t("gameCatalogAdmin.kategoryzacja_gier") : screen === "game" && selected ? selected.name : t("gameCatalogAdmin.kategoryzacja_gier")}
        description={screen === "home" ? t("gameCatalogAdmin.nowe_spojrzenie_na_opis_gier") : t("gameCatalogAdmin.projekt_klasyfikacji_gier_i_jego")}
        accent="amber"
        backHref={backToProject}
        backLabel={backLabel}
        status={screen === "home" ? t("gameCatalogAdmin.projekt") : undefined}
      />

      <div className="mb-4">
        <ToolDisclosure title={t("gameCatalogAdmin.uprawnienia_do_edycji")} description={adminKey ? t("gameCatalogAdmin.klucz_tej_sesji_zostal_wprowadzony") : t("gameCatalogAdmin.import_i_edycja_wymagaja_klucza")}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <ToolInput
              type="password"
              value={adminKey}
              onChange={(event) => updateAdminKey(event.target.value)}
              autoComplete="off"
              aria-label={t("gameCatalogAdmin.klucz_administratora_katalogu")}
              placeholder={t("gameCatalogAdmin.klucz_administratora_katalogu")}
            />
            <ToolButton type="button" onClick={() => updateAdminKey("")} disabled={!adminKey}>{t("gameCatalogAdmin.wyczysc_klucz")}</ToolButton>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t("gameCatalogAdmin.klucz_jest_przechowywany_wylacznie_w")}</p>
        </ToolDisclosure>
      </div>
      {error && <div className="mb-4"><ToolNotice tone="danger">{error}</ToolNotice></div>}
      {classificationConflict && selected && screen === "game" && (
        <div role="alert" className="mb-4 space-y-3 rounded-xl border border-amber-400/60 bg-background/60 p-4">
          <p className="text-sm font-semibold text-amber-200">{t("gameCatalogAdmin.konflikt_edycji_zapisano_nowsza_wersje")}</p>
          <p className="text-sm text-muted-foreground">{t("gameCatalogAdmin.twoje_niezapisane_zmiany_pozostaly_w")}</p>
          <ToolButton type="button" disabled={busy} onClick={refreshConflictedGame}><RefreshCw className="h-4 w-4" />{" "}{t("gameCatalogAdmin.wczytaj_aktualna_wersje")}</ToolButton>
        </div>
      )}

      {screen === "home" && <ProjectHome />}

      {screen === "search" && (
        <div className="space-y-5">
          <SectionHeader eyebrow={t("gameCatalogAdmin.wyszukiwanie_2")} title={t("gameCatalogAdmin.szukaj_gry")} description={t("gameCatalogAdmin.przeszukaj_katalog_jesli_gry_jeszcze")} accent="amber" />
          <ToolPanel title={t("gameCatalogAdmin.wyszukiwanie_katalogu")}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background/60 px-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input value={query} onChange={(event) => { setQuery(event.target.value); resetListPosition(); }} placeholder={t("gameCatalogAdmin.nazwa_studio_appid")} className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" autoFocus />
              </div>
            </div>
            <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
              {query.trim() && visibleListGames.length ? visibleListGames.map((game) => (
                <Link key={game.id} href={`${BASE}/games/${game.id}`} className="flex items-center gap-4 bg-card/40 px-4 py-3 transition hover:bg-muted/60">
                  {game.headerImageUrl ? <img src={game.headerImageUrl} alt="" className="h-12 w-24 rounded-md object-cover" /> : <div className="h-12 w-24 rounded-md bg-muted" />}
                  <div className="min-w-0 flex-1"><div className="truncate font-semibold">{game.name}</div><div className="mt-0.5 truncate text-xs text-muted-foreground">{game.developer || t("gameCatalogAdmin.steam_appid_steamappid", { steamAppId: game.steamAppId })}</div></div>
                  <span className="text-xs text-muted-foreground">{STATUS_LABELS[game.status]}</span>
                </Link>
              )) : <div className="p-6 text-sm text-muted-foreground">{listLoading ? t("gameCatalogAdmin.wyszukiwanie") : query.trim() ? t("gameCatalogAdmin.brak_wynikow_w_katalogu") : t("gameCatalogAdmin.wpisz_nazwe_gry_lub_appid")}</div>}
            </div>
          </ToolPanel>
          {query.trim() && <div className="flex flex-wrap items-center gap-3 text-sm">
            <span>{pagination.total}{" "}{t("gameCatalogAdmin.wynikow_strona")}{" "}{pagination.page} z {pagination.totalPages}</span>
            <ToolButton type="button" disabled={listLoading || page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>{t("gameCatalogAdmin.poprzednia")}</ToolButton>
            <ToolButton type="button" disabled={listLoading || page >= pagination.totalPages} onClick={advanceListPage}>{t("gameCatalogAdmin.nastepna")}</ToolButton>
          </div>}
          <ToolPanel title={t("gameCatalogAdmin.trwaly_import_serwerowy_tysiace_gier")}
            description={t("gameCatalogAdmin.trwaly_import_do_20_000")}>
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="steam-server-import-source" className="text-sm">{t("gameCatalogAdmin.zrodlo_kandydatow")}</label>
              <ToolSelect id="steam-server-import-source" value={serverImportSource}
                onChange={(event) => setServerImportSource(event.target.value as "steam" | "steamspy")}
                disabled={serverJobBusy || serverImportJob?.status === "running" || serverImportJob?.status === "paused"}>
                <option value="steamspy">{t("gameCatalogAdmin.steamspy_bez_klucza_api")}</option>
                <option value="steam">{t("gameCatalogAdmin.steam_web_api_wymaga_klucza")}</option>
              </ToolSelect>
              <label htmlFor="steam-server-import-limit" className="text-sm">{t("gameCatalogAdmin.maks_sprawdzonych_appid")}</label>
              <ToolInput id="steam-server-import-limit" type="number" min={1} max={20000}
                value={serverImportLimit} onChange={(event) => setServerImportLimit(event.target.value)} />
              <ToolButton type="button" onClick={startServerImportJob}
                disabled={!adminKey || serverJobBusy || serverImportJob?.status === "running" || serverImportJob?.status === "paused"}>{t("gameCatalogAdmin.uruchom_zadanie_serwerowe")}</ToolButton>
              <ToolButton type="button" variant="ghost" onClick={refreshServerImportJob}
                disabled={!adminKey || serverJobBusy}>
                <RefreshCw className="h-4 w-4" />{" "}{t("gameCatalogAdmin.odswiez_stan_zadania")}</ToolButton>
              {serverImportJob?.status === "running" && (
                <ToolButton type="button" onClick={() => changeServerImportJob("pause")}
                  disabled={serverJobBusy || serverImportJob.pauseRequested}>{t("gameCatalogAdmin.wstrzymaj_zadanie_serwerowe")}</ToolButton>
              )}
              {serverImportJob?.status === "paused" && (
                <ToolButton type="button" onClick={() => changeServerImportJob("resume")}
                  disabled={serverJobBusy}>{t("gameCatalogAdmin.wznow_zadanie_serwerowe")}</ToolButton>
              )}
            </div>
            {serverImportJob && (
              <div className="mt-3 space-y-2 text-sm" aria-label={t("gameCatalogAdmin.statystyki_zadania_serwerowego")}>
                <p>{t("gameCatalogAdmin.stan")}{" "}<strong data-testid="steam-server-job-status">{serverImportJob.status}</strong>
                  {" · "}{t("gameCatalogAdmin.zweryfikowano")}{" "}{serverImportJob.processed}/{serverImportJob.maxGames}
                  {" · "}{t("gameCatalogAdmin.zrodlo")}{" "}{serverImportJob.source === "steamspy" ? t("gameCatalogAdmin.steamspy") : t("gameCatalogAdmin.steam")}
                  {" · "}{serverImportJob.source === "steamspy" ? t("gameCatalogAdmin.strona_sourcepage", { sourcePage: serverImportJob.sourcePage }) : t("gameCatalogAdmin.kursor_appid_cursor", { cursor: serverImportJob.cursor })}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                  <span>{t("gameCatalogAdmin.dodano_gier")}{" "}<strong data-testid="steam-server-inserted">{serverImportJob.inserted}</strong></span>
                  <span>{t("gameCatalogAdmin.istnialy")}{" "}{serverImportJob.existing}</span>
                  <span>{t("gameCatalogAdmin.odrzucono")}{" "}{serverImportJob.ignored}</span>
                  <span>{t("gameCatalogAdmin.bledy")}{" "}{serverImportJob.failed}</span>
                  <span>{t("gameCatalogAdmin.oczekujace")}{" "}{serverImportJob.pending}</span>
                  <span>{t("gameCatalogAdmin.odkryte")}{" "}{serverImportJob.scanned}</span>
                  {serverImportJob.retryCount > 0 && (
                    <span data-testid="steam-server-retry-count">{t("gameCatalogAdmin.proby_ponowienia")}{" "}{serverImportJob.retryCount}/5</span>
                  )}
                </div>
                {serverImportJob.lastError && (
                  <p role="alert" className="text-amber-300">{serverImportJob.status === "running"
                    ? t("gameCatalogAdmin.ponowienie_zaplanowane") : t("gameCatalogAdmin.powod_zatrzymania")}{serverImportJob.lastError}
                    {serverImportJob.status === "running" && serverImportJob.retryCount > 0 && serverImportJob.nextRunAt &&
                      t("gameCatalogAdmin.najwczesniej_v0", { v0: new Date(serverImportJob.nextRunAt).toLocaleString("pl-PL") })}
                  </p>
                )}
              </div>
            )}
            {serverImportMessage && <p role="status" className="mt-2 text-sm">{serverImportMessage}</p>}
          </ToolPanel>
          <ToolPanel title={t("gameCatalogAdmin.rozbuduj_katalog_ze_steam")} description={t("gameCatalogAdmin.dostepne_zrodla_nowosci_steam_i")}>
            <div className="flex flex-wrap items-center gap-2">
              <ToolButton type="button" variant="primary" disabled={busy || discovery.candidates.length >= 200} onClick={discoverFeaturedGames}>
                <Search className="h-4 w-4" />{" "}{t("gameCatalogAdmin.pobierz_nowosci_i_popularne_bez")}</ToolButton>
              <ToolButton type="button" disabled={busy || !steamSpy.hasMore || discovery.candidates.length >= 200} onClick={discoverSteamSpyGames}>
                <Search className="h-4 w-4" />{" "}{t("gameCatalogAdmin.pobierz_nastepna_strone_steamspy_bez")}</ToolButton>
              <ToolButton type="button" variant="primary" disabled={busy || (!steamSpy.hasMore && !discovery.candidates.length)} onClick={runAutomaticSteamSpyGrowth}>{t("gameCatalogAdmin.steamspy_automatyczna_seria_do_100")}</ToolButton>
              <ToolButton type="button" disabled={busy || !discovery.hasMore || discovery.candidates.length >= 200} onClick={discoverSteamGames}>
                <Search className="h-4 w-4" />{" "}{t("gameCatalogAdmin.pobierz_propozycje_ze_steam")}</ToolButton>
              <ToolButton type="button" disabled={busy || !discovery.candidates.length} onClick={importDiscoveredGames}>
                <Plus className="h-4 w-4" />{" "}{t("gameCatalogAdmin.dodaj_10_gier_z_kolejki")}</ToolButton>
              <ToolButton type="button" disabled={busy || !discovery.candidates.length} onClick={() => void runAutomaticGrowth(true)}>{t("gameCatalogAdmin.przetworz_kolejke_do_100_appid")}</ToolButton>
              <ToolButton type="button" disabled={busy} onClick={() => void runAutomaticGrowth(false)}>{t("gameCatalogAdmin.uruchom_serie_do_100_appid")}</ToolButton>
              {autoRunning && (
                <ToolButton type="button" variant="ghost" onClick={() => { autoStopRef.current = true; }}>{t("gameCatalogAdmin.zatrzymaj_po_biezacej_partii")}</ToolButton>
              )}
              <ToolButton type="button" variant="ghost" disabled={busy} onClick={() => {
                setDiscovery(readSteamGrowthProgress(null));
                setSteamSpy({ ...EMPTY_STEAMSPY_PROGRESS });
                setGrowthMessage(null);
              }}>{t("gameCatalogAdmin.od_poczatku")}</ToolButton>
            </div>
            <div className="mt-4">
              <label htmlFor="steam-bulk-appids" className="mb-2 block text-sm font-medium">{t("gameCatalogAdmin.masz_liste_appid_wklej_do")}</label>
              <textarea id="steam-bulk-appids" value={bulkPaste} onChange={(event) => setBulkPaste(event.target.value)}
                placeholder={t("gameCatalogAdmin.570_730_https_store_steampowered")}
                className="min-h-20 w-full rounded-lg border border-border bg-background/60 p-3 text-sm outline-none focus:border-primary" />
              <ToolButton type="button" disabled={busy || !bulkPaste.trim()} onClick={queuePastedSteamGames}>{t("gameCatalogAdmin.dodaj_appid_do_kolejki")}</ToolButton>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">{t("gameCatalogAdmin.oczekujace_gry")}{" "}<strong data-testid="steam-candidate-count">{discovery.candidates.length}</strong>{" "}{t("gameCatalogAdmin.ostatni_steam_appid")}{" "}{discovery.cursor}
              {!discovery.hasMore ? t("gameCatalogAdmin.koniec_listy_steam") : ""}
              {t("gameCatalogAdmin.steamspy_strona")}{steamSpy.page}{t("gameCatalogAdmin.pozycja")}{steamSpy.offset}
              {!steamSpy.hasMore ? t("gameCatalogAdmin.koniec_listy_steamspy") : ""}
              {discovery.candidates.length >= 200 ? t("gameCatalogAdmin.zaimportuj_oczekujace_gry_przed_pobranie") : ""}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground" aria-label={t("gameCatalogAdmin.statystyki_importu_steam")}>
              <span>{t("gameCatalogAdmin.dodane")}{" "}<strong data-testid="steam-imported-total">{discovery.stats.inserted}</strong></span>
              <span>{t("gameCatalogAdmin.istniejace")}{" "}{discovery.stats.existing}</span>
              <span>{t("gameCatalogAdmin.odrzucone")}{" "}{discovery.stats.ignored}</span>
              <span>{t("gameCatalogAdmin.bledy")}{" "}{discovery.stats.failed}</span>
              <span>{t("gameCatalogAdmin.przeskanowane")}{" "}{discovery.stats.scanned}</span>
              <span>{t("gameCatalogAdmin.partie")}{" "}{discovery.stats.batches}</span>
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
          <ToolPanel title={t("gameCatalogAdmin.dodaj_ze_steam")} description={t("gameCatalogAdmin.importuj_gre_ktorej_nie_ma")}>
            <div className="flex flex-col gap-2 sm:flex-row">
              <ToolInput value={importValue} onChange={(event) => setImportValue(event.target.value)} onKeyDown={(event) => event.key === "Enter" && importGame()} placeholder={t("gameCatalogAdmin.steam_url_lub_appid")} />
              <ToolButton type="button" variant="primary" onClick={importGame} disabled={busy}><Plus className="h-4 w-4" />{" "}{t("gameCatalogAdmin.importuj")}</ToolButton>
            </div>
          </ToolPanel>
        </div>
      )}

      {screen === "games" && (
        <div className="space-y-5">
          <SectionHeader eyebrow={t("gameCatalogAdmin.katalog_2")} title={t("gameCatalogAdmin.wszystkie_gry")} description={t("gameCatalogAdmin.total_pasujacych_z_all_skatalogowanych", { total: pagination.total, all: counts.all })} accent="amber" />
          <ToolPanel title={t("gameCatalogAdmin.filtry_katalogu")} description={t("gameCatalogAdmin.szukaj_po_nazwie_studiu_lub")}>
            <ToolInput value={query} onChange={(event) => { setQuery(event.target.value); resetListPosition(); }} placeholder={t("gameCatalogAdmin.szukaj_w_katalogu")} />
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip active={statusFilter === "all"} onClick={() => { setStatusFilter("all"); resetListPosition(); }}>{t("gameCatalogAdmin.wszystkie")}{counts.all})</Chip>
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
                <span>{t("gameCatalogAdmin.gra")}</span><span>{t("gameCatalogAdmin.status")}</span><span>{t("gameCatalogAdmin.steam_appid")}</span>
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
            ? <ToolEmptyState title={t("gameCatalogAdmin.wczytywanie_katalogu")} description={t("gameCatalogAdmin.trwa_pobieranie_danych")} />
            : counts.all
              ? <ToolEmptyState title={t("gameCatalogAdmin.brak_wynikow")} description={t("gameCatalogAdmin.zmien_fraze_wyszukiwania_lub_status")} />
              : <ToolEmptyState title={t("gameCatalogAdmin.brak_gier")} description={t("gameCatalogAdmin.zaimportuj_pierwsza_gre_w_sekcji")} />}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{t("gameCatalogAdmin.strona")}{" "}{pagination.page} z {pagination.totalPages} · {pagination.total}{" "}{t("gameCatalogAdmin.wynikow")}</span>
            <ToolButton type="button" disabled={listLoading || page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>{t("gameCatalogAdmin.poprzednia")}</ToolButton>
            <ToolButton type="button" disabled={listLoading || page >= pagination.totalPages} onClick={advanceListPage}>{t("gameCatalogAdmin.nastepna")}</ToolButton>
          </div>
        </div>
      )}

      {(["gameplay", "mode", "structure", "world", "visual"] as Screen[]).includes(screen) && (() => {
        const item = PERSPECTIVE_COPY[screen as Perspective];
        return (
          <div className="space-y-5">
            <SectionHeader eyebrow={t("gameCatalogAdmin.perspektywa_code", { code: item.code })} title={item.title} description={item.question} accent="amber" />
            <ToolPanel title={item.description}>
              <div className="grid gap-3 md:grid-cols-2">{item.details.map((detail) => <div key={detail} className="rounded-xl border border-border bg-background/40 p-4 text-sm leading-6 text-muted-foreground">{detail}</div>)}</div>
            </ToolPanel>
          </div>
        );
      })()}

      {screen === "methodology" && (
        <div className="space-y-5">
          <SectionHeader eyebrow={t("gameCatalogAdmin.metodologia")} title={t("gameCatalogAdmin.jak_powstaje_klasyfikacja")} description={t("gameCatalogAdmin.rozdzielenie_faktow_zrodlowych_od_interp")} accent="amber" />
          <div className="grid gap-4 md:grid-cols-2">
            <ToolPanel title={t("gameCatalogAdmin.1_dane_zrodlowe")}><p className="text-sm leading-6 text-muted-foreground">{t("gameCatalogAdmin.automatycznie_pobierane_sa_dane_faktogra")}</p></ToolPanel>
            <ToolPanel title={t("gameCatalogAdmin.2_piec_perspektyw")}><p className="text-sm leading-6 text-muted-foreground">{t("gameCatalogAdmin.gra_jest_opisywana_na_niezaleznych")}</p></ToolPanel>
            <ToolPanel title={t("gameCatalogAdmin.3_centralnosc")}><p className="text-sm leading-6 text-muted-foreground">{t("gameCatalogAdmin.sama_obecnosc_elementu_nie_oznacza")}</p></ToolPanel>
            <ToolPanel title={t("gameCatalogAdmin.4_kontrola_jakosci")}><p className="text-sm leading-6 text-muted-foreground">{t("gameCatalogAdmin.niepewne_rekordy_moga_trafiac_do")}</p></ToolPanel>
          </div>
        </div>
      )}

      {screen === "why" && (
        <div className="space-y-5">
          <SectionHeader eyebrow={t("gameCatalogAdmin.zalozenia")} title={t("gameCatalogAdmin.dlaczego_powstal_ten_projekt")} description={t("gameCatalogAdmin.proba_uporzadkowania_problemow_obecnych_")} accent="amber" />
          <ToolPanel title={t("gameCatalogAdmin.problem")}>
            <div className="space-y-4 text-sm leading-7 text-muted-foreground">
              <p>{t("gameCatalogAdmin.popularne_systemy_kategorii_i_tagow")}</p>
              <p>{t("gameCatalogAdmin.tag_mowi_zwykle_ze_jakis")}</p>
              <p>{t("gameCatalogAdmin.projekt_jest_proba_spojrzenia_na")}</p>
            </div>
          </ToolPanel>
        </div>
      )}

      {screen === "game" && !selected && (
        gameLoading
          ? <ToolEmptyState title={t("gameCatalogAdmin.wczytywanie_gry")} description={t("gameCatalogAdmin.trwa_pobieranie_rekordu")} />
          : <ToolEmptyState title={t("gameCatalogAdmin.nie_znaleziono_gry")} description={t("gameCatalogAdmin.rekord_nie_istnieje_w_katalogu")} />
      )}

      {screen === "game" && selected && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card/50 px-4 py-3 text-sm text-muted-foreground">{t("gameCatalogAdmin.do_opracowania")}{" "}<strong className="text-foreground">{queue?.pendingCount ?? "…"}</strong>{" "}{t("gameCatalogAdmin.gier")}{nextPendingId === null && <span className="ml-2">{t("gameCatalogAdmin.brak_kolejnej_gry_w_kolejce")}</span>}
          </div>
          <ToolToolbar>
            <Link href={`${BASE}/games`} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm font-semibold hover:bg-muted"><ArrowLeft className="h-4 w-4" />{" "}{t("gameCatalogAdmin.wszystkie_gry")}</Link>
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{selected.name}</div><div className="mt-0.5 truncate text-xs text-muted-foreground">{[selected.developer, selected.releaseDate].filter(Boolean).join(" · ") || t("gameCatalogAdmin.steam_appid_steamappid", { steamAppId: selected.steamAppId })}</div></div>
            <a href={selected.steamUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted">{t("gameCatalogAdmin.steam")}{" "}<ExternalLink className="h-3.5 w-3.5" /></a>
            <ToolSelect aria-label={t("gameCatalogAdmin.status_klasyfikacji")} value={status} onChange={(event) => setStatus(event.target.value as Game["status"])} className="w-auto min-w-36">{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</ToolSelect>
            {hasUnsavedChanges && <span role="status" className="text-xs font-semibold text-amber-300">{t("gameCatalogAdmin.niezapisane_zmiany")}</span>}
            <ToolButton type="button" variant="ghost" onClick={() => { setDraft(selected.assignments); setStatus(selected.status); }} disabled={busy || !hasUnsavedChanges}>{t("gameCatalogAdmin.przywroc")}</ToolButton>
            <ToolButton type="button" variant="ghost" onClick={goToNextPending} disabled={busy || nextPendingId === null}>{t("gameCatalogAdmin.nastepna_do_opracowania")}</ToolButton>
            <ToolButton type="button" variant="primary" onClick={() => save()} disabled={busy || classificationConflict || !hasUnsavedChanges}><Save className="h-4 w-4" />{" "}{t("gameCatalogAdmin.zapisz")}</ToolButton>
            <ToolButton type="button" variant="primary" onClick={() => save(true)} disabled={busy || classificationConflict || !hasUnsavedChanges || nextPendingId === null}><Save className="h-4 w-4" />{" "}{t("gameCatalogAdmin.zapisz_i_dalej")}</ToolButton>
          </ToolToolbar>

          <ToolPanel title={t("gameCatalogAdmin.kontrola_kompletnosci")} description={t("gameCatalogAdmin.wymagania_do_uzyskania_statusu_gotowe")}>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {readiness.checks.map((check) => (
                <div key={check.key} className={`rounded-lg border px-3 py-2 text-sm ${check.complete ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-200" : "border-border bg-background/50 text-muted-foreground"}`}>
                  <span aria-hidden="true">{check.complete ? "✓" : "○"}</span> {check.label}
                </div>
              ))}
            </div>
            {status === "ready" && !readiness.complete && (
              <p role="alert" className="mt-3 text-sm text-amber-300">{t("gameCatalogAdmin.status_gotowe_wymaga_uzupelnienia_brakuj")}</p>
            )}
          </ToolPanel>
          <ToolPanel title={t("gameCatalogAdmin.piec_perspektyw")} description={t("gameCatalogAdmin.pracuj_nad_jedna_perspektywa_naraz")}>
            <ToolInput value={termQuery} onChange={(event) => setTermQuery(event.target.value)} placeholder={t("gameCatalogAdmin.szukaj_pojec_w_slowniku")} aria-label={t("gameCatalogAdmin.szukaj_pojec_w_slowniku_2")} />
            <p className="mt-2 mb-4 text-xs text-muted-foreground">{t("gameCatalogAdmin.wyszukiwanie_obejmuje_nazwy_i_identyfika")}</p>
            <ToolSegmented value={perspective} options={PERSPECTIVES} onChange={(value) => setPerspective(value)} />
            <div className="mt-6">{renderPerspectiveEditor()}</div>
          </ToolPanel>
          <ToolDisclosure title={t("gameCatalogAdmin.pozostale_tagi")} description={t("gameCatalogAdmin.szczegoly_uzywane_glownie_do_filtrowania")}>{renderFacet("detail")}</ToolDisclosure>
          <ToolDisclosure title={t("gameCatalogAdmin.podglad_rekordu")} description={t("gameCatalogAdmin.to_co_pozniej_zobaczy_uzytkownik")}>
            <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div>{selected.headerImageUrl && <img src={selected.headerImageUrl} alt="" className="w-full rounded-xl object-cover" />}<h3 className="mt-3 text-lg font-bold">{selected.name}</h3><p className="mt-1 text-xs text-muted-foreground">{t("gameCatalogAdmin.steam_appid")}{" "}{selected.steamAppId}</p></div>
              <div className="grid gap-4 sm:grid-cols-2">{previewRows.map(([label, items]) => <div key={label}><div className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">{label}</div><div className="mt-1.5 text-sm">{items.length ? items.map((item) => item.label).join(" · ") : "—"}</div></div>)}<div><div className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">{t("gameCatalogAdmin.glowne_elementy")}</div><div className="mt-1.5 text-sm">{mainMechanics.length ? mainMechanics.map((item) => item.label).join(" · ") : "—"}</div></div><div><div className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">{t("gameCatalogAdmin.poboczne_elementy")}</div><div className="mt-1.5 text-sm">{secondaryMechanics.length ? secondaryMechanics.map((item) => item.label).join(" · ") : "—"}</div></div></div>
            </div>
          </ToolDisclosure>
          <ToolDisclosure title={t("gameCatalogAdmin.slownik")} description={t("gameCatalogAdmin.dodawaj_nowe_wartosci_dopiero_gdy")}>
            <div className="grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)_auto_auto]"><ToolSelect value={newFacet} onChange={(event) => setNewFacet(event.target.value as Facet)}>{Object.entries(FACET_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</ToolSelect><ToolInput value={newLabel} onChange={(event) => setNewLabel(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addTerm()} placeholder={t("gameCatalogAdmin.nowa_wartosc")} /><ToolButton type="button" onClick={addTerm} disabled={busy}><Plus className="h-4 w-4" />{" "}{t("gameCatalogAdmin.dodaj")}</ToolButton><ToolButton type="button" variant="ghost" disabled={busy || hasUnsavedChanges} onClick={() => loadTaxonomy().catch((cause) => setError(String(cause)))}><RefreshCw className="h-4 w-4" />{" "}{t("gameCatalogAdmin.odswiez")}</ToolButton></div>
          </ToolDisclosure>
        </div>
      )}
    </ModuleShell>
  );
}
