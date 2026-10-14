import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  updatedAt: string;
  assignments: Assignment[];
};

const BASE = "/ludology/game-classification";

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

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error ?? `HTTP ${response.status}`);
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
  const [games, setGames] = useState<Game[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [draft, setDraft] = useState<Assignment[]>([]);
  const [status, setStatus] = useState<Game["status"]>("unclassified");
  const [importValue, setImportValue] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newFacet, setNewFacet] = useState<Facet>("mechanic");
  const [newLabel, setNewLabel] = useState("");
  const [perspective, setPerspective] = useState<Perspective>("gameplay");

  const selected = gameId ? games.find((game) => game.id === gameId) ?? null : null;

  // Kept only in component memory: never put a privileged token into a URL,
  // localStorage, sessionStorage, logs, or a frontend build-time variable.
  const adminWriteHeaders = () =>
    adminToken ? { "x-steam-catalog-admin-token": adminToken } : undefined;

  const termsByFacet = useMemo(() => {
    const map = new Map<Facet, Term[]>();
    for (const term of terms.filter((term) => term.active)) {
      const current = map.get(term.facet) ?? [];
      current.push(term);
      map.set(term.facet, current);
    }
    return map;
  }, [terms]);

  const filteredGames = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return games;
    return games.filter((game) =>
      [game.name, game.developer, game.publisher, String(game.steamAppId)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [games, query]);

  async function reload() {
    const [gamesBody, taxonomyBody] = await Promise.all([
      api<{ games: Game[] }>("/api/steam-catalog/games"),
      api<{ terms: Term[] }>("/api/steam-catalog/taxonomy"),
    ]);
    setGames(gamesBody.games);
    setTerms(taxonomyBody.terms);
  }

  useEffect(() => {
    reload().catch((cause) => setError(String(cause)));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setDraft(selected.assignments);
    setStatus(selected.status);
    setPerspective("gameplay");
  }, [selected?.id, selected?.updatedAt]);

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

  async function importGame() {
    if (!importValue.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const body = await api<{ game: Game }>("/api/steam-catalog/import", {
        method: "POST",
        headers: adminWriteHeaders(),
        body: JSON.stringify({ url: importValue.trim() }),
      });
      navigate(`${BASE}/games/${body.game.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/steam-catalog/games/${selected.id}/classification`, {
        method: "PUT",
        headers: adminWriteHeaders(),
        body: JSON.stringify({
          status,
          assignments: draft.map((item, index) => ({ termId: item.termId, role: item.role, position: index })),
        }),
      });
      await reload();
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
        headers: adminWriteHeaders(),
        body: JSON.stringify({ facet: newFacet, label: newLabel.trim() }),
      });
      setNewLabel("");
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  function renderFacet(facet: Exclude<Facet, "mechanic">) {
    const facetTerms = termsByFacet.get(facet) ?? [];
    return (
      <div className="flex flex-wrap gap-2">
        {facetTerms.length ? facetTerms.map((term) => (
          <Chip key={term.id} active={Boolean(assignmentFor(term.id))} onClick={() => toggleSimple(term)}>{term.label}</Chip>
        )) : <span className="text-sm text-muted-foreground">Brak wartości w słowniku.</span>}
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
            <div className="flex flex-wrap gap-2">{(termsByFacet.get("mechanic") ?? []).map((term) => <Chip key={`main-${term.id}`} active={assignmentFor(term.id)?.role === "main"} onClick={() => setMechanic(term, "main")}>{term.label}</Chip>)}</div>
          </ToolSection>
          <ToolSection title="Poboczne elementy rozgrywki" description="Istotne, ale nie centralne dla większości doświadczenia.">
            <div className="flex flex-wrap gap-2">{(termsByFacet.get("mechanic") ?? []).map((term) => <Chip key={`secondary-${term.id}`} active={assignmentFor(term.id)?.role === "secondary"} onClick={() => setMechanic(term, "secondary")}>{term.label}</Chip>)}</div>
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

      {error && <div className="mb-4"><ToolNotice tone="danger">{error}</ToolNotice></div>}

      {(screen === "search" || screen === "game") && (
        <div className="mb-4">
          <ToolPanel
            title="Dostęp do edycji katalogu"
            description="Import i zmiany klasyfikacji wymagają oddzielnego klucza redaktora. Token organizatora turnieju nie daje tych uprawnień. Klucz nie jest zapisywany w przeglądarce i znika po odświeżeniu strony."
          >
            <input
              type="password"
              aria-label="Klucz redaktora katalogu"
              autoComplete="off"
              spellCheck={false}
              value={adminToken}
              onChange={(event) => setAdminToken(event.target.value)}
              placeholder="Klucz redaktora (tylko przy edycji)"
              className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm"
            />
          </ToolPanel>
        </div>
      )

      {screen === "home" && <ProjectHome />}

      {screen === "search" && (
        <div className="space-y-5">
          <SectionHeader eyebrow="Wyszukiwanie" title="Szukaj gry" description="Przeszukaj katalog. Jeśli gry jeszcze nie ma, możesz ją zaimportować ze Steam." accent="amber" />
          <ToolPanel title="Wyszukiwanie katalogu">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background/60 px-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nazwa, studio, AppID..." className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" autoFocus />
              </div>
            </div>
            <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
              {query.trim() && filteredGames.length ? filteredGames.slice(0, 30).map((game) => (
                <Link key={game.id} href={`${BASE}/games/${game.id}`} className="flex items-center gap-4 bg-card/40 px-4 py-3 transition hover:bg-muted/60">
                  {game.headerImageUrl ? <img src={game.headerImageUrl} alt="" className="h-12 w-24 rounded-md object-cover" /> : <div className="h-12 w-24 rounded-md bg-muted" />}
                  <div className="min-w-0 flex-1"><div className="truncate font-semibold">{game.name}</div><div className="mt-0.5 truncate text-xs text-muted-foreground">{game.developer || `Steam AppID ${game.steamAppId}`}</div></div>
                  <span className="text-xs text-muted-foreground">{STATUS_LABELS[game.status]}</span>
                </Link>
              )) : <div className="p-6 text-sm text-muted-foreground">{query.trim() ? "Brak wyników w katalogu." : "Wpisz nazwę gry lub AppID."}</div>}
            </div>
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
          <SectionHeader eyebrow="Katalog" title="Wszystkie gry" description={`${games.length} skatalogowanych rekordów.`} accent="amber" />
          {games.length ? (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card/50">
              <div className="grid min-w-[620px] grid-cols-[minmax(0,1fr)_150px_140px] gap-3 border-b border-border bg-background/40 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                <span>Gra</span><span>Status</span><span>Steam AppID</span>
              </div>
              <div className="divide-y divide-border">
                {[...games].sort((a, b) => a.name.localeCompare(b.name, "pl")).map((game) => (
                  <Link key={game.id} href={`${BASE}/games/${game.id}`} className="grid min-w-[620px] grid-cols-[minmax(0,1fr)_150px_140px] gap-3 px-4 py-3 text-sm transition hover:bg-muted/50">
                    <span className="truncate font-semibold">{game.name}</span><span className="text-muted-foreground">{STATUS_LABELS[game.status]}</span><span className="font-mono text-xs text-muted-foreground">{game.steamAppId}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : <ToolEmptyState title="Brak gier" description="Zaimportuj pierwszą grę w sekcji Szukaj gry." />}
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

      {screen === "game" && !selected && <ToolEmptyState title="Nie znaleziono gry" description="Rekord nie istnieje albo nie został jeszcze wczytany." />}

      {screen === "game" && selected && (
        <div className="space-y-4">
          <ToolToolbar>
            <Link href={`${BASE}/games`} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm font-semibold hover:bg-muted"><ArrowLeft className="h-4 w-4" /> Wszystkie gry</Link>
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{selected.name}</div><div className="mt-0.5 truncate text-xs text-muted-foreground">{[selected.developer, selected.releaseDate].filter(Boolean).join(" · ") || `Steam AppID ${selected.steamAppId}`}</div></div>
            <a href={selected.steamUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted">Steam <ExternalLink className="h-3.5 w-3.5" /></a>
            <ToolSelect value={status} onChange={(event) => setStatus(event.target.value as Game["status"])} className="w-auto min-w-36">{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</ToolSelect>
            <ToolButton type="button" variant="primary" onClick={save} disabled={busy}><Save className="h-4 w-4" /> Zapisz</ToolButton>
          </ToolToolbar>

          <ToolPanel title="Pięć perspektyw" description="Pracuj nad jedną perspektywą naraz."><ToolSegmented value={perspective} options={PERSPECTIVES} onChange={(value) => setPerspective(value)} /><div className="mt-6">{renderPerspectiveEditor()}</div></ToolPanel>
          <ToolDisclosure title="Pozostałe tagi" description="Szczegóły używane głównie do filtrowania.">{renderFacet("detail")}</ToolDisclosure>
          <ToolDisclosure title="Podgląd rekordu" description="To, co później zobaczy użytkownik katalogu.">
            <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div>{selected.headerImageUrl && <img src={selected.headerImageUrl} alt="" className="w-full rounded-xl object-cover" />}<h3 className="mt-3 text-lg font-bold">{selected.name}</h3><p className="mt-1 text-xs text-muted-foreground">Steam AppID {selected.steamAppId}</p></div>
              <div className="grid gap-4 sm:grid-cols-2">{previewRows.map(([label, items]) => <div key={label}><div className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">{label}</div><div className="mt-1.5 text-sm">{items.length ? items.map((item) => item.label).join(" · ") : "—"}</div></div>)}<div><div className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Główne elementy</div><div className="mt-1.5 text-sm">{mainMechanics.length ? mainMechanics.map((item) => item.label).join(" · ") : "—"}</div></div><div><div className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Poboczne elementy</div><div className="mt-1.5 text-sm">{secondaryMechanics.length ? secondaryMechanics.map((item) => item.label).join(" · ") : "—"}</div></div></div>
            </div>
          </ToolDisclosure>
          <ToolDisclosure title="Słownik" description="Dodawaj nowe wartości dopiero, gdy brakuje ich w systemie.">
            <div className="grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)_auto_auto]"><ToolSelect value={newFacet} onChange={(event) => setNewFacet(event.target.value as Facet)}>{Object.entries(FACET_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</ToolSelect><ToolInput value={newLabel} onChange={(event) => setNewLabel(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addTerm()} placeholder="Nowa wartość" /><ToolButton type="button" onClick={addTerm} disabled={busy}><Plus className="h-4 w-4" /> Dodaj</ToolButton><ToolButton type="button" variant="ghost" onClick={reload}><RefreshCw className="h-4 w-4" /> Odśwież</ToolButton></div>
          </ToolDisclosure>
        </div>
      )}
    </ModuleShell>
  );
}
