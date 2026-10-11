import {
  BookOpen,
  FileText,
  FlaskConical,
  Map,
  Network,
  Users,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ModuleHeader,
  ModuleShell,
  ProjectCard,
} from "@/components/portfolio-ui";
import {
  ToolButton,
  ToolEmptyState,
  ToolInput,
  ToolNotice,
  ToolSelect,
  ToolTextarea,
  ToolPanel,
  ToolSection,
} from "@/components/tool-ui";
import { useResearchProject } from "@/features/ludology/statement-classification/use-research-project";
import EvidenceProfile from "@/features/ludology/statement-classification/EvidenceProfile";
import MethodologyView from "@/features/ludology/statement-classification/MethodologyView";
import CodingLab from "@/features/ludology/statement-classification/CodingLab";
import ResearchWorkspace from "@/features/ludology/statement-classification/ResearchWorkspace";
import DimensionModelLab from "@/features/ludology/statement-classification/DimensionModelLab";
import { parseResearchProject, serializeResearchProject } from "@/features/ludology/statement-classification/project-transfer";
import { PILOT_CODEBOOK } from "@/features/ludology/statement-classification/pilot-codebook";
import type { ResearchSource } from "@/features/ludology/statement-classification/model";
import { checkResearchProjectIntegrity } from "@/features/ludology/statement-classification/integrity";
import { buildResearchQueue } from "@/features/ludology/statement-classification/research-queue";

const BASE = "/ludology/statement-classification";

type Section = "hub" | "overview" | "people" | "sources" | "fragments" | "coding" | "positions" | "map" | "methodology";

function getSection(pathname: string): Section {
  const tail = pathname.slice(BASE.length).replace(/^\/+|\/+$/g, "");
  if (tail === "overview" || tail === "people" || tail === "sources" || tail === "fragments" || tail === "coding" || tail === "positions" || tail === "map" || tail === "methodology") {
    return tail;
  }
  return "hub";
}

const cards = [
  {
    code: "START",
    title: "Założenia",
    description: "Co projekt bada i jak zbudowany jest łańcuch dowodowy.",
    href: `${BASE}/overview`,
    icon: Network,
  },
  {
    code: "PEOPLE",
    title: "Osoby",
    description: "Profile publicznych twórców i influencerów objętych analizą.",
    href: `${BASE}/people`,
    icon: Users,
  },
  {
    code: "SRC",
    title: "Źródła",
    description: "Materiały źródłowe, fragmenty i kontekst wypowiedzi.",
    href: `${BASE}/sources`,
    icon: FileText,
  },
  {
    code: "WORK",
    title: "Warsztat źródeł",
    description: "Transkrypcje, argumenty i fragmenty gotowe do zakodowania.",
    href: `${BASE}/fragments`,
    icon: FileText,
  },
  {
    code: "CODE",
    title: "Kodowanie",
    description: "Przypisywanie fragmentów do tez, kodów i poziomu pewności.",
    href: `${BASE}/coding`,
    icon: FlaskConical,
  },
  {
    code: "EVID",
    title: "Profil dowodów",
    description: "Macierz mikrostanowisk pokazująca pokrycie, kierunek i sprzeczności bez wymuszania osi mapy.",
    href: `${BASE}/positions`,
    icon: Network,
  },
  {
    code: "MAP",
    title: "Mapa stanowisk",
    description: "Wizualizacja wyników powstająca dopiero na podstawie zakodowanych danych.",
    href: `${BASE}/map`,
    icon: Map,
  },
  {
    code: "METHOD",
    title: "Metodologia",
    description: "Codebook, reguły interpretacji, audytowalność i walidacja.",
    href: `${BASE}/methodology`,
    icon: BookOpen,
  },
] as const;

function PageHeader({ section, title, description }: { section: string; title: string; description: string }) {
  return (
    <ModuleHeader
      code={`LUDO 02 / ${section}`}
      title={title}
      description={description}
      accent="amber"
      backHref={BASE}
      backLabel="Kategoryzacja wypowiedzi i poglądów"
    />
  );
}

function Overview() {
  const { data, replaceProject } = useResearchProject();
  const [transferMessage, setTransferMessage] = useState("");
  const integrityIssues = checkResearchProjectIntegrity(data);
  const currentCodebook = data.codebooks.find((codebook) => codebook.id === PILOT_CODEBOOK.id);
  const researchQueue = currentCodebook
    ? buildResearchQueue(data, currentCodebook.id)
    : {
        unverifiedExcerptIds: [],
        verifiedUncodedExcerptIds: [],
        contradictionCandidates: [],
        unreviewedPositions: [],
        staleAssessmentIds: [],
      };

  function exportProject() {
    if (typeof window === "undefined") return;
    const blob = new Blob([serializeResearchProject(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `neoludologia-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setTransferMessage("Utworzono kopię JSON aktualnego projektu.");
  }

  async function importProject(file: File | undefined) {
    if (!file) return;
    try {
      const parsed = parseResearchProject(await file.text());
      replaceProject(parsed);
      setTransferMessage("Wczytano kopię projektu. Pilotażowy codebook został uzgodniony z aktualną wersją.");
    } catch (error) {
      setTransferMessage(error instanceof Error ? error.message : "Nie udało się wczytać projektu.");
    }
  }

  return (
    <>
      <PageHeader
        section="START"
        title="Założenia projektu"
        description="Analiza publicznych wypowiedzi ma prowadzić od źródła do sprawdzalnego kodowania, a nie od gotowej etykiety do szukania potwierdzeń."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <ToolPanel title="Łańcuch badawczy">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            {['Osoba', 'Źródło', 'Argument', 'Fragment', 'Kodowanie'].map((item, index) => (
              <div key={item} className="flex items-center gap-2">
                {index > 0 && <span className="text-muted-foreground">→</span>}
                <span className="rounded-lg border border-border bg-background/60 px-3 py-2">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-sm text-muted-foreground">Tezy/propozycje są osobnymi obiektami i mogą być łączone z wieloma fragmentami źródłowymi.</div>
        </ToolPanel>
        <ToolPanel title="Najważniejsza zasada">
          <ToolNotice>Brak danych nie oznacza neutralnego stanowiska. System powinien umieć zapisać niepewność, sprzeczności i zmianę poglądu w czasie.</ToolNotice>
        </ToolPanel>
      </div>

      <ToolPanel
        title="Integralność zbioru"
        description="Automatyczna kontrola referencji i podstawowych niespójności technicznych. Brak błędów integralności nie oznacza poprawności metodologicznej."
      >
        {integrityIssues.length === 0 ? (
          <ToolNotice tone="success">Nie wykryto osieroconych rekordów, duplikatów kodowań ani niespójnych zakresów timestampów.</ToolNotice>
        ) : (
          <div className="space-y-2">
            <ToolNotice tone="danger">Wykryto {integrityIssues.length} problemów integralności. Przed dalszym kodowaniem warto je wyjaśnić.</ToolNotice>
            {integrityIssues.slice(0, 12).map((issue, index) => (
              <div key={`${issue.code}:${issue.entityId ?? index}`} className="rounded-xl border border-border bg-background/40 px-4 py-3">
                <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">{issue.code}</div>
                <div className="mt-1 text-sm">{issue.message}</div>
              </div>
            ))}
            {integrityIssues.length > 12 && <div className="text-xs text-muted-foreground">+ {integrityIssues.length - 12} dalszych problemów.</div>}
          </div>
        )}
      </ToolPanel>

      <ToolPanel
        title="Kolejka badawcza"
        description="Lista pracy wynikająca z aktualnego stanu korpusu. Nie interpretuje stanowisk automatycznie — wskazuje miejsca wymagające działania badacza."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <div className="text-2xl font-black">{researchQueue.unverifiedExcerptIds.length}</div>
            <div className="text-xs text-muted-foreground">fragmentów do weryfikacji</div>
          </div>
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <div className="text-2xl font-black">{researchQueue.verifiedUncodedExcerptIds.length}</div>
            <div className="text-xs text-muted-foreground">zweryfikowanych bez kodowania</div>
          </div>
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <div className="text-2xl font-black">{researchQueue.contradictionCandidates.length}</div>
            <div className="text-xs text-muted-foreground">kandydatów sprzeczności</div>
          </div>
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <div className="text-2xl font-black">{researchQueue.unreviewedPositions.length}</div>
            <div className="text-xs text-muted-foreground">pozycji bez rekonstrukcji</div>
          </div>
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <div className="text-2xl font-black">{researchQueue.staleAssessmentIds.length}</div>
            <div className="text-xs text-muted-foreground">rekonstrukcji do odświeżenia</div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`${BASE}/fragments`} className="rounded-lg border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted">
            Warsztat źródeł →
          </Link>
          <Link href={`${BASE}/coding`} className="rounded-lg border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted">
            Coding Lab →
          </Link>
          <Link href={`${BASE}/positions`} className="rounded-lg border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted">
            Profil dowodów →
          </Link>
        </div>
      </ToolPanel>

      <ToolPanel
        title="Kopia danych pilotażu"
        description="Dopóki Research Lab korzysta z localStorage, eksport JSON jest podstawowym zabezpieczeniem przed utratą materiału."
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl border border-border bg-background/40 p-3"><strong>{data.people.length}</strong><div className="text-xs text-muted-foreground">osób</div></div>
              <div className="rounded-xl border border-border bg-background/40 p-3"><strong>{data.sources.length}</strong><div className="text-xs text-muted-foreground">źródeł</div></div>
              <div className="rounded-xl border border-border bg-background/40 p-3"><strong>{data.excerpts.length}</strong><div className="text-xs text-muted-foreground">fragmentów</div></div>
              <div className="rounded-xl border border-border bg-background/40 p-3"><strong>{data.codings.length}</strong><div className="text-xs text-muted-foreground">kodowań</div></div>
            </div>
            <ToolButton type="button" variant="primary" onClick={exportProject}>Eksportuj projekt JSON</ToolButton>
          </div>
          <div className="space-y-3">
            <ToolInput
              type="file"
              accept="application/json,.json"
              onChange={(event) => void importProject(event.target.files?.[0])}
            />
            <div className="text-xs leading-5 text-muted-foreground">
              Import zastępuje bieżący lokalny zbiór. Akceptowane są pliki schemaVersion=2 lub schemaVersion=3; starsza wersja jest migrowana przy wczytaniu.
            </div>
            {transferMessage && <ToolNotice>{transferMessage}</ToolNotice>}
          </div>
        </div>
      </ToolPanel>
    </>
  );
}

function People() {
  const { data, addPerson, updatePerson, deletePerson } = useResearchProject();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingPersonId, setEditingPersonId] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    addPerson({ displayName: name.trim(), description: description.trim() || undefined });
    setName("");
    setDescription("");
  }

  function startEdit(personId: string) {
    const person = data.people.find((item) => item.id === personId);
    if (!person) return;
    setEditingPersonId(person.id);
    setEditName(person.displayName);
    setEditDescription(person.description ?? "");
  }

  function saveEdit(personId: string) {
    if (!editName.trim()) return;
    updatePerson(personId, {
      displayName: editName.trim(),
      description: editDescription.trim() || undefined,
    });
    setEditingPersonId("");
  }

  function removePerson(personId: string) {
    const person = data.people.find((item) => item.id === personId);
    if (!person) return;
    if (typeof window !== "undefined" && !window.confirm(`Usunąć „${person.displayName}” razem z jego źródłami, fragmentami i kodowaniami?`)) return;
    deletePerson(personId);
  }

  return (
    <>
      <PageHeader section="PEOPLE" title="Osoby" description="Indeks badanych osób prowadzący do ich źródeł, argumentów i zakodowanych fragmentów." />
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <ToolPanel title="Dodaj osobę" description="Profil jest kontenerem korpusu, nie gotową etykietą poglądów.">
          <form className="space-y-3" onSubmit={submit}>
            <ToolInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Nazwa / imię i nazwisko" />
            <ToolInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Krótki opis (opcjonalnie)" />
            <ToolButton type="submit" variant="primary">Dodaj do korpusu</ToolButton>
          </form>
        </ToolPanel>
        <ToolPanel title={`Osoby w korpusie (${data.people.length})`}>
          {data.people.length === 0 ? (
            <ToolEmptyState title="Brak osób w zbiorze" description="Dodaj pierwszą osobę, aby rozpocząć pilotaż." />
          ) : (
            <div className="space-y-2">
              {data.people.map((person) => {
                const sources = data.sources.filter((source) => source.personId === person.id).length;
                return <div key={person.id} className="rounded-xl border border-border bg-background/40 p-4">
                  {editingPersonId === person.id ? (
                    <div className="space-y-3">
                      <ToolInput value={editName} onChange={(e) => setEditName(e.target.value)} />
                      <ToolInput value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Opis" />
                      <div className="flex flex-wrap gap-2">
                        <ToolButton type="button" variant="primary" onClick={() => saveEdit(person.id)}>Zapisz</ToolButton>
                        <ToolButton type="button" variant="ghost" onClick={() => setEditingPersonId("")}>Anuluj</ToolButton>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-bold">{person.displayName}</div>
                          {person.description && <div className="mt-1 text-sm text-muted-foreground">{person.description}</div>}
                          <div className="mt-2 text-xs text-muted-foreground">{sources} źródeł</div>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <ToolButton type="button" variant="ghost" onClick={() => startEdit(person.id)}>Edytuj</ToolButton>
                          <ToolButton type="button" variant="ghost" onClick={() => removePerson(person.id)}>Usuń</ToolButton>
                        </div>
                      </div>
                    </>
                  )}
                </div>;
              })}
            </div>
          )}
        </ToolPanel>
      </div>
    </>
  );
}

function Sources() {
  const { data, addSource, updateSource, deleteSource } = useResearchProject();
  const [personId, setPersonId] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [sourceType, setSourceType] = useState<"video" | "stream" | "podcast" | "post" | "article" | "academic" | "other">("video");
  const [publishedAt, setPublishedAt] = useState("");
  const [purpose, setPurpose] = useState<"" | "review" | "essay" | "debate" | "interview" | "casual" | "social_post" | "academic">("");
  const [preparedness, setPreparedness] = useState<"" | "prepared" | "semi_prepared" | "spontaneous">("");
  const [scope, setScope] = useState<"" | "specific_game" | "genre" | "games_general" | "definition_of_game" | "other">("");
  const [language, setLanguage] = useState("pl");
  const [editingSourceId, setEditingSourceId] = useState("");
  const [editSourceTitle, setEditSourceTitle] = useState("");
  const [editSourceUrl, setEditSourceUrl] = useState("");
  const [editSourcePublishedAt, setEditSourcePublishedAt] = useState("");
  const [editSourcePurpose, setEditSourcePurpose] = useState<"" | NonNullable<ResearchSource["purpose"]>>("");
  const [editSourcePreparedness, setEditSourcePreparedness] = useState<"" | NonNullable<ResearchSource["preparedness"]>>("");
  const [editSourceScope, setEditSourceScope] = useState<"" | NonNullable<ResearchSource["scope"]>>("");
  const [editSourceLanguage, setEditSourceLanguage] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!personId || !title.trim() || !url.trim()) return;
    addSource({
      personId,
      title: title.trim(),
      url: url.trim(),
      sourceType,
      publishedAt: publishedAt || undefined,
      purpose: purpose || undefined,
      preparedness: preparedness || undefined,
      scope: scope || undefined,
      language: language.trim() || undefined,
    });
    setTitle("");
    setUrl("");
    setPublishedAt("");
    setPurpose("");
    setPreparedness("");
    setScope("");
  }

  function startSourceEdit(sourceId: string) {
    const source = data.sources.find((item) => item.id === sourceId);
    if (!source) return;
    setEditingSourceId(source.id);
    setEditSourceTitle(source.title);
    setEditSourceUrl(source.url);
    setEditSourcePublishedAt(source.publishedAt ?? "");
    setEditSourcePurpose(source.purpose ?? "");
    setEditSourcePreparedness(source.preparedness ?? "");
    setEditSourceScope(source.scope ?? "");
    setEditSourceLanguage(source.language ?? "");
  }

  function saveSourceEdit(sourceId: string) {
    if (!editSourceTitle.trim() || !editSourceUrl.trim()) return;
    updateSource(sourceId, {
      title: editSourceTitle.trim(),
      url: editSourceUrl.trim(),
      publishedAt: editSourcePublishedAt || undefined,
      purpose: editSourcePurpose || undefined,
      preparedness: editSourcePreparedness || undefined,
      scope: editSourceScope || undefined,
      language: editSourceLanguage.trim() || undefined,
    });
    setEditingSourceId("");
  }

  function removeSource(sourceId: string) {
    const source = data.sources.find((item) => item.id === sourceId);
    if (!source) return;
    if (typeof window !== "undefined" && !window.confirm(`Usunąć źródło „${source.title}” wraz z argumentami, fragmentami i kodowaniami?`)) return;
    deleteSource(sourceId);
  }

  return (
    <>
      <PageHeader section="SRC" title="Źródła" description="Każdy wniosek ma dać się prześledzić do konkretnego materiału i fragmentu wypowiedzi." />
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <ToolPanel title="Dodaj źródło">
          {data.people.length === 0 ? <ToolNotice>Najpierw dodaj osobę w sekcji Osoby.</ToolNotice> : (
            <form className="space-y-3" onSubmit={submit}>
              <ToolSelect value={personId} onChange={(e) => setPersonId(e.target.value)}>
                <option value="">Wybierz osobę…</option>
                {data.people.map((person) => <option key={person.id} value={person.id}>{person.displayName}</option>)}
              </ToolSelect>
              <ToolInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tytuł materiału" />
              <ToolInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL źródła" />
              <ToolSelect value={sourceType} onChange={(e) => setSourceType(e.target.value as typeof sourceType)}>
                <option value="video">Wideo</option><option value="stream">Stream</option><option value="podcast">Podcast</option>
                <option value="article">Artykuł</option><option value="post">Post</option><option value="academic">Publikacja naukowa</option><option value="other">Inne</option>
              </ToolSelect>
              <div className="grid gap-3 sm:grid-cols-2">
                <ToolInput type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
                <ToolInput value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="Język, np. pl / en" />
              </div>
              <ToolSelect value={purpose} onChange={(e) => setPurpose(e.target.value as typeof purpose)}>
                <option value="">Cel materiału — nie określono</option>
                <option value="review">Recenzja</option><option value="essay">Esej</option><option value="debate">Debata</option>
                <option value="interview">Wywiad</option><option value="casual">Luźna wypowiedź</option>
                <option value="social_post">Post społecznościowy</option><option value="academic">Materiał akademicki</option>
              </ToolSelect>
              <ToolSelect value={preparedness} onChange={(e) => setPreparedness(e.target.value as typeof preparedness)}>
                <option value="">Tryb wypowiedzi — nie określono</option>
                <option value="prepared">Przygotowana</option><option value="semi_prepared">Częściowo przygotowana</option><option value="spontaneous">Spontaniczna</option>
              </ToolSelect>
              <ToolSelect value={scope} onChange={(e) => setScope(e.target.value as typeof scope)}>
                <option value="">Zakres — nie określono</option>
                <option value="specific_game">Konkretna gra</option><option value="genre">Gatunek</option><option value="games_general">Gry ogólnie</option>
                <option value="definition_of_game">Definicja gry</option><option value="other">Inny</option>
              </ToolSelect>
              <ToolButton type="submit" variant="primary">Dodaj źródło</ToolButton>
            </form>
          )}
        </ToolPanel>
        <ToolPanel title={`Materiały źródłowe (${data.sources.length})`}>
          {data.sources.length === 0 ? <ToolEmptyState title="Brak źródeł" description="Dodaj pierwszy materiał do korpusu." /> : (
            <div className="space-y-2">{data.sources.map((source) => {
              const person = data.people.find((item) => item.id === source.personId);
              return <div key={source.id} className="rounded-xl border border-border bg-background/40 p-4">
                {editingSourceId === source.id ? (
                  <div className="space-y-3">
                    <ToolInput value={editSourceTitle} onChange={(e) => setEditSourceTitle(e.target.value)} />
                    <ToolInput value={editSourceUrl} onChange={(e) => setEditSourceUrl(e.target.value)} />
                    <ToolInput type="date" value={editSourcePublishedAt} onChange={(e) => setEditSourcePublishedAt(e.target.value)} />
                    <ToolInput value={editSourceLanguage} onChange={(e) => setEditSourceLanguage(e.target.value)} placeholder="Język" />
                    <ToolSelect value={editSourcePurpose} onChange={(e) => setEditSourcePurpose(e.target.value as typeof editSourcePurpose)}>
                      <option value="">Cel — nie określono</option>
                      <option value="review">Recenzja</option><option value="essay">Esej</option><option value="debate">Debata</option><option value="interview">Wywiad</option>
                      <option value="casual">Luźna wypowiedź</option><option value="social_post">Post społecznościowy</option><option value="academic">Materiał akademicki</option>
                    </ToolSelect>
                    <ToolSelect value={editSourcePreparedness} onChange={(e) => setEditSourcePreparedness(e.target.value as typeof editSourcePreparedness)}>
                      <option value="">Tryb — nie określono</option><option value="prepared">Przygotowana</option><option value="semi_prepared">Częściowo przygotowana</option><option value="spontaneous">Spontaniczna</option>
                    </ToolSelect>
                    <ToolSelect value={editSourceScope} onChange={(e) => setEditSourceScope(e.target.value as typeof editSourceScope)}>
                      <option value="">Zakres — nie określono</option><option value="specific_game">Konkretna gra</option><option value="genre">Gatunek</option><option value="games_general">Gry ogólnie</option><option value="definition_of_game">Definicja gry</option><option value="other">Inny</option>
                    </ToolSelect>
                    <div className="flex flex-wrap gap-2">
                      <ToolButton type="button" variant="primary" onClick={() => saveSourceEdit(source.id)}>Zapisz</ToolButton>
                      <ToolButton type="button" variant="ghost" onClick={() => setEditingSourceId("")}>Anuluj</ToolButton>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {source.sourceType} · {person?.displayName ?? "Nieznana osoba"}{source.publishedAt ? ` · ${source.publishedAt}` : ""}
                      </div>
                      <div className="mt-1 font-bold">{source.title}</div>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                        {source.purpose && <span className="rounded-md border border-border px-2 py-1">{source.purpose}</span>}
                        {source.preparedness && <span className="rounded-md border border-border px-2 py-1">{source.preparedness}</span>}
                        {source.scope && <span className="rounded-md border border-border px-2 py-1">{source.scope}</span>}
                        {source.language && <span className="rounded-md border border-border px-2 py-1">{source.language}</span>}
                      </div>
                      <a href={source.url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-muted-foreground underline-offset-2 hover:underline">{source.url}</a>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <ToolButton type="button" variant="ghost" onClick={() => startSourceEdit(source.id)}>Edytuj</ToolButton>
                      <ToolButton type="button" variant="ghost" onClick={() => removeSource(source.id)}>Usuń</ToolButton>
                    </div>
                  </div>
                )}
              </div>;
            })}</div>
          )}
        </ToolPanel>
      </div>
    </>
  );
}

export default function StatementClassificationPage() {
  const [location] = useLocation();
  const section = getSection(location);

  if (section !== "hub") {
    return (
      <ModuleShell>
        {section === "overview" && <Overview />}
        {section === "people" && <People />}
        {section === "sources" && <Sources />}
        {section === "fragments" && <ResearchWorkspace />}
        {section === "coding" && <CodingLab />}
        {section === "positions" && <EvidenceProfile />}
        {section === "map" && <DimensionModelLab />}
        {section === "methodology" && <MethodologyView />}
      </ModuleShell>
    );
  }

  return (
    <ModuleShell>
      <ModuleHeader
        code="LUDO 02"
        title="Kategoryzacja wypowiedzi i poglądów"
        description="Źródłowa analiza publicznych stanowisk twórców i influencerów."
        accent="amber"
        backHref="/ludology"
        backLabel="Ludologia"
        status="fundament"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <ProjectCard key={card.href} {...card} accent="amber" actionLabel="Otwórz →" />
        ))}
      </div>
    </ModuleShell>
  );
}
