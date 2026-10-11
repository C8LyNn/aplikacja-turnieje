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
import { parseResearchProject, serializeResearchProject } from "@/features/ludology/statement-classification/project-transfer";
import { PILOT_CODEBOOK } from "@/features/ludology/statement-classification/pilot-codebook";
import type { ResearchSource } from "@/features/ludology/statement-classification/model";
import { isAssessmentStale } from "@/features/ludology/statement-classification/evidence-analysis";
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

function ResearchWorkspace() {
  const { data, updateSource, addArgument, updateArgument, deleteArgument, addExcerpt, updateExcerpt, deleteExcerpt } = useResearchProject();
  const [sourceId, setSourceId] = useState("");
  const selectedSource = data.sources.find((source) => source.id === sourceId);
  const [transcript, setTranscript] = useState("");
  const [argumentTitle, setArgumentTitle] = useState("");
  const [argumentSummary, setArgumentSummary] = useState("");
  const [excerptText, setExcerptText] = useState("");
  const [excerptContext, setExcerptContext] = useState("");
  const [excerptContextAfter, setExcerptContextAfter] = useState("");
  const [argumentId, setArgumentId] = useState("");
  const [timestampStart, setTimestampStart] = useState("");
  const [timestampEnd, setTimestampEnd] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<"unverified" | "checked" | "verified">("unverified");
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [editingArgumentId, setEditingArgumentId] = useState("");
  const [editArgumentTitle, setEditArgumentTitle] = useState("");
  const [editArgumentSummary, setEditArgumentSummary] = useState("");
  const [editingExcerptId, setEditingExcerptId] = useState("");
  const [editExcerptText, setEditExcerptText] = useState("");
  const [editExcerptContextBefore, setEditExcerptContextBefore] = useState("");
  const [editExcerptContextAfter, setEditExcerptContextAfter] = useState("");
  const [editExcerptTimestampStart, setEditExcerptTimestampStart] = useState("");
  const [editExcerptTimestampEnd, setEditExcerptTimestampEnd] = useState("");
  const [editExcerptArgumentId, setEditExcerptArgumentId] = useState("");

  function chooseSource(nextId: string) {
    setSourceId(nextId);
    const source = data.sources.find((item) => item.id === nextId);
    setTranscript(source?.transcript ?? "");
    setArgumentId("");
  }

  function saveTranscript() {
    if (!selectedSource) return;
    updateSource(selectedSource.id, {
      transcript,
      transcriptType: selectedSource.transcriptType ?? "manual",
    });
  }

  function useTranscriptSelection() {
    if (selectionEnd <= selectionStart) return;
    const text = transcript.slice(selectionStart, selectionEnd).trim();
    if (!text) return;
    const before = transcript.slice(Math.max(0, selectionStart - 280), selectionStart).trim();
    const after = transcript.slice(selectionEnd, Math.min(transcript.length, selectionEnd + 280)).trim();
    setExcerptText(text);
    setExcerptContext(before);
    setExcerptContextAfter(after);
  }

  function submitArgument(event: FormEvent) {
    event.preventDefault();
    if (!selectedSource || !argumentTitle.trim()) return;
    addArgument({
      sourceId: selectedSource.id,
      title: argumentTitle.trim(),
      summary: argumentSummary.trim() || undefined,
    });
    setArgumentTitle("");
    setArgumentSummary("");
  }

  function startArgumentEdit(argumentId: string) {
    const argument = data.arguments.find((item) => item.id === argumentId);
    if (!argument) return;
    setEditingArgumentId(argument.id);
    setEditArgumentTitle(argument.title ?? "");
    setEditArgumentSummary(argument.summary ?? "");
  }

  function saveArgumentEdit(argumentId: string) {
    if (!editArgumentTitle.trim()) return;
    updateArgument(argumentId, {
      title: editArgumentTitle.trim(),
      summary: editArgumentSummary.trim() || undefined,
    });
    setEditingArgumentId("");
  }

  function startExcerptEdit(excerptId: string) {
    const excerpt = data.excerpts.find((item) => item.id === excerptId);
    if (!excerpt) return;
    setEditingExcerptId(excerpt.id);
    setEditExcerptText(excerpt.text);
    setEditExcerptContextBefore(excerpt.contextBefore ?? "");
    setEditExcerptContextAfter(excerpt.contextAfter ?? "");
    setEditExcerptTimestampStart(excerpt.timestampStart === undefined ? "" : String(excerpt.timestampStart));
    setEditExcerptTimestampEnd(excerpt.timestampEnd === undefined ? "" : String(excerpt.timestampEnd));
    setEditExcerptArgumentId(excerpt.argumentId ?? "");
  }

  function saveExcerptEdit(excerptId: string) {
    if (!editExcerptText.trim()) return;
    updateExcerpt(excerptId, {
      text: editExcerptText.trim(),
      contextBefore: editExcerptContextBefore.trim() || undefined,
      contextAfter: editExcerptContextAfter.trim() || undefined,
      timestampStart: editExcerptTimestampStart === "" ? undefined : Number(editExcerptTimestampStart),
      timestampEnd: editExcerptTimestampEnd === "" ? undefined : Number(editExcerptTimestampEnd),
      argumentId: editExcerptArgumentId || undefined,
    });
    setEditingExcerptId("");
  }

  function submitExcerpt(event: FormEvent) {
    event.preventDefault();
    if (!selectedSource || !excerptText.trim()) return;
    addExcerpt({
      sourceId: selectedSource.id,
      argumentId: argumentId || undefined,
      text: excerptText.trim(),
      contextBefore: excerptContext.trim() || undefined,
      contextAfter: excerptContextAfter.trim() || undefined,
      timestampStart: timestampStart === "" ? undefined : Number(timestampStart),
      timestampEnd: timestampEnd === "" ? undefined : Number(timestampEnd),
      verificationStatus,
    });
    setExcerptText("");
    setExcerptContext("");
    setExcerptContextAfter("");
    setTimestampStart("");
    setTimestampEnd("");
    setVerificationStatus("unverified");
  }

  const sourceArguments = data.arguments.filter((argument) => argument.sourceId === sourceId);
  const sourceExcerpts = data.excerpts.filter((excerpt) => excerpt.sourceId === sourceId);

  return (
    <>
      <PageHeader
        section="WORK"
        title="Warsztat źródeł"
        description="Z materiału źródłowego wydzielaj argumenty i konkretne fragmenty bez utraty kontekstu."
      />
      {data.sources.length === 0 ? (
        <ToolPanel>
          <ToolEmptyState title="Najpierw potrzebne jest źródło" description="Dodaj osobę i materiał w sekcji Źródła." />
        </ToolPanel>
      ) : (
        <div className="space-y-4">
          <ToolPanel title="Wybierz materiał">
            <ToolSelect value={sourceId} onChange={(event) => chooseSource(event.target.value)}>
              <option value="">Wybierz źródło…</option>
              {data.sources.map((source) => {
                const person = data.people.find((item) => item.id === source.personId);
                return <option key={source.id} value={source.id}>{person?.displayName ?? "?"} — {source.title}</option>;
              })}
            </ToolSelect>
          </ToolPanel>

          {selectedSource && (
            <>
              <ToolPanel
                title="Transkrypcja / tekst źródłowy"
                description="Na razie zapis lokalny. Docelowo importer i wersjonowanie transkrypcji."
                actions={<ToolButton type="button" variant="primary" onClick={saveTranscript}>Zapisz tekst</ToolButton>}
              >
                <ToolTextarea
                  rows={14}
                  value={transcript}
                  onChange={(event) => setTranscript(event.target.value)}
                  onSelect={(event) => {
                    setSelectionStart(event.currentTarget.selectionStart);
                    setSelectionEnd(event.currentTarget.selectionEnd);
                  }}
                  placeholder="Wklej transkrypcję, artykuł albo tekst wypowiedzi…"
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <ToolButton type="button" onClick={useTranscriptSelection} disabled={selectionEnd <= selectionStart}>
                    Użyj zaznaczenia jako fragmentu
                  </ToolButton>
                  <span className="text-xs text-muted-foreground">
                    {selectionEnd > selectionStart ? `Zaznaczono ${selectionEnd - selectionStart} znaków` : "Zaznacz tekst w transkrypcji."}
                  </span>
                </div>
              </ToolPanel>

              <div className="grid gap-4 xl:grid-cols-2">
                <ToolPanel title="Dodaj argument" description="Kilka cytatów z jednego argumentu pozostaje częścią jednej jednostki argumentacyjnej.">
                  <form className="space-y-3" onSubmit={submitArgument}>
                    <ToolInput value={argumentTitle} onChange={(e) => setArgumentTitle(e.target.value)} placeholder="Krótka nazwa argumentu" />
                    <ToolTextarea rows={4} value={argumentSummary} onChange={(e) => setArgumentSummary(e.target.value)} placeholder="Streszczenie argumentacji (opcjonalnie)" />
                    <ToolButton type="submit" variant="primary">Dodaj argument</ToolButton>
                  </form>
                  {sourceArguments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {sourceArguments.map((argument) => (
                        <div key={argument.id} className="rounded-xl border border-border bg-background/40 p-3">
                          {editingArgumentId === argument.id ? (
                            <div className="space-y-3">
                              <ToolInput value={editArgumentTitle} onChange={(e) => setEditArgumentTitle(e.target.value)} />
                              <ToolTextarea rows={3} value={editArgumentSummary} onChange={(e) => setEditArgumentSummary(e.target.value)} placeholder="Streszczenie argumentu" />
                              <div className="flex flex-wrap gap-2">
                                <ToolButton type="button" variant="primary" onClick={() => saveArgumentEdit(argument.id)}>Zapisz</ToolButton>
                                <ToolButton type="button" variant="ghost" onClick={() => setEditingArgumentId("")}>Anuluj</ToolButton>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-bold">{argument.title || "Argument bez tytułu"}</div>
                                {argument.summary && <div className="mt-1 text-xs text-muted-foreground">{argument.summary}</div>}
                              </div>
                              <div className="flex shrink-0 gap-1">
                                <ToolButton type="button" variant="ghost" onClick={() => startArgumentEdit(argument.id)}>Edytuj</ToolButton>
                                <ToolButton type="button" variant="ghost" onClick={() => deleteArgument(argument.id)}>Usuń</ToolButton>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ToolPanel>

                <ToolPanel title="Dodaj fragment" description="Fragment jest materiałem dowodowym, a nie jeszcze wnioskiem o poglądzie osoby.">
                  <form className="space-y-3" onSubmit={submitExcerpt}>
                    <ToolSelect value={argumentId} onChange={(e) => setArgumentId(e.target.value)}>
                      <option value="">Bez przypisanego argumentu</option>
                      {sourceArguments.map((argument) => <option key={argument.id} value={argument.id}>{argument.title || "Argument"}</option>)}
                    </ToolSelect>
                    <ToolTextarea rows={6} value={excerptText} onChange={(e) => setExcerptText(e.target.value)} placeholder="Dokładny cytat / fragment…" />
                    <ToolTextarea rows={3} value={excerptContext} onChange={(e) => setExcerptContext(e.target.value)} placeholder="Kontekst przed fragmentem…" />
                    <ToolTextarea rows={3} value={excerptContextAfter} onChange={(e) => setExcerptContextAfter(e.target.value)} placeholder="Kontekst po fragmencie…" />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <ToolInput type="number" min="0" step="0.1" value={timestampStart} onChange={(e) => setTimestampStart(e.target.value)} placeholder="Start [s]" />
                      <ToolInput type="number" min="0" step="0.1" value={timestampEnd} onChange={(e) => setTimestampEnd(e.target.value)} placeholder="Koniec [s]" />
                    </div>
                    <ToolSelect value={verificationStatus} onChange={(e) => setVerificationStatus(e.target.value as typeof verificationStatus)}>
                      <option value="unverified">Status: nieweryfikowany</option>
                      <option value="checked">Status: sprawdzony</option>
                      <option value="verified">Status: zweryfikowany</option>
                    </ToolSelect>
                    <ToolButton type="submit" variant="primary">Utwórz fragment</ToolButton>
                  </form>
                </ToolPanel>
              </div>

              <ToolPanel title={`Fragmenty tego źródła (${sourceExcerpts.length})`}>
                {sourceExcerpts.length === 0 ? (
                  <ToolEmptyState title="Brak fragmentów" description="Wydziel pierwszy fragment, który później trafi do Coding Lab." />
                ) : (
                  <div className="space-y-3">
                    {sourceExcerpts.map((excerpt) => {
                      const argument = data.arguments.find((item) => item.id === excerpt.argumentId);
                      return (
                        <div key={excerpt.id} className="rounded-xl border border-border bg-background/40 p-4">
                          {editingExcerptId === excerpt.id ? (
                            <div className="space-y-3">
                              <ToolSelect value={editExcerptArgumentId} onChange={(e) => setEditExcerptArgumentId(e.target.value)}>
                                <option value="">Bez przypisanego argumentu</option>
                                {sourceArguments.map((item) => <option key={item.id} value={item.id}>{item.title || "Argument"}</option>)}
                              </ToolSelect>
                              <ToolTextarea rows={5} value={editExcerptText} onChange={(e) => setEditExcerptText(e.target.value)} />
                              <ToolTextarea rows={3} value={editExcerptContextBefore} onChange={(e) => setEditExcerptContextBefore(e.target.value)} placeholder="Kontekst przed" />
                              <ToolTextarea rows={3} value={editExcerptContextAfter} onChange={(e) => setEditExcerptContextAfter(e.target.value)} placeholder="Kontekst po" />
                              <div className="grid gap-3 sm:grid-cols-2">
                                <ToolInput type="number" min="0" step="0.1" value={editExcerptTimestampStart} onChange={(e) => setEditExcerptTimestampStart(e.target.value)} placeholder="Start [s]" />
                                <ToolInput type="number" min="0" step="0.1" value={editExcerptTimestampEnd} onChange={(e) => setEditExcerptTimestampEnd(e.target.value)} placeholder="Koniec [s]" />
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <ToolButton type="button" variant="primary" onClick={() => saveExcerptEdit(excerpt.id)}>Zapisz fragment</ToolButton>
                                <ToolButton type="button" variant="ghost" onClick={() => setEditingExcerptId("")}>Anuluj</ToolButton>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                  {argument?.title ?? "Bez argumentu"}
                                  {excerpt.timestampStart !== undefined ? ` · ${excerpt.timestampStart}s${excerpt.timestampEnd !== undefined ? `–${excerpt.timestampEnd}s` : ""}` : ""}
                                </div>
                                <div className="flex items-center gap-2">
                                  <ToolSelect
                                    className="w-auto py-1 text-xs"
                                    value={excerpt.verificationStatus ?? "unverified"}
                                    onChange={(e) => updateExcerpt(excerpt.id, { verificationStatus: e.target.value as "unverified" | "checked" | "verified" })}
                                  >
                                    <option value="unverified">nieweryfikowany</option>
                                    <option value="checked">sprawdzony</option>
                                    <option value="verified">zweryfikowany</option>
                                  </ToolSelect>
                                  <ToolButton type="button" variant="ghost" onClick={() => startExcerptEdit(excerpt.id)}>Edytuj</ToolButton>
                                  <ToolButton type="button" variant="ghost" onClick={() => deleteExcerpt(excerpt.id)}>Usuń</ToolButton>
                                </div>
                              </div>
                              <blockquote className="text-sm leading-6">“{excerpt.text}”</blockquote>
                              {excerpt.contextBefore && <div className="mt-2 text-xs text-muted-foreground">Przed: {excerpt.contextBefore}</div>}
                              {excerpt.contextAfter && <div className="mt-1 text-xs text-muted-foreground">Po: {excerpt.contextAfter}</div>}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ToolPanel>
            </>
          )}
        </div>
      )}
    </>
  );
}

function MapPage() {
  const { data } = useResearchProject();
  const activeCodebook = data.codebooks.find((item) => item.id === PILOT_CODEBOOK.id);
  const activePropositions = activeCodebook
    ? data.propositions.filter((proposition) => proposition.codebookId === activeCodebook.id)
    : [];
  const activeAssessments = activeCodebook
    ? data.assessments.filter((assessment) => assessment.codebookId === activeCodebook.id)
    : [];
  const freshAssessments = activeAssessments.filter((assessment) => !isAssessmentStale(data, assessment));
  const staleAssessments = activeAssessments.filter((assessment) => isAssessmentStale(data, assessment));
  const assessedPeople = new Set(freshAssessments.map((assessment) => assessment.personId));
  const peopleWithCodings = new Set(
    data.codings
      .filter((coding) => coding.codebookId === activeCodebook?.id)
      .map((coding) => {
        const excerpt = data.excerpts.find((item) => item.id === coding.excerptId);
        const source = data.sources.find((item) => item.id === excerpt?.sourceId);
        return source?.personId;
      })
      .filter((personId): personId is string => Boolean(personId)),
  );
  const insufficient = freshAssessments.filter((assessment) => assessment.status === "insufficient_evidence").length;

  return (
    <>
      <PageHeader section="MAP" title="Mapa stanowisk" description="Mapa jest warstwą modelową nad zakodowanymi dowodami i rekonstrukcjami, a nie podstawą danych." />
      <div className="space-y-4">
        <ToolPanel title="Gotowość danych do modelowania" description="Te wskaźniki nie wyznaczają automatycznie momentu publikacji; pokazują tylko, czego jeszcze brakuje przed budową modelu wymiarów.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-background/40 p-4"><div className="text-2xl font-black">{data.people.length}</div><div className="text-xs text-muted-foreground">osób w korpusie</div></div>
            <div className="rounded-xl border border-border bg-background/40 p-4"><div className="text-2xl font-black">{peopleWithCodings.size}</div><div className="text-xs text-muted-foreground">osób z kodowaniami</div></div>
            <div className="rounded-xl border border-border bg-background/40 p-4"><div className="text-2xl font-black">{assessedPeople.size}</div><div className="text-xs text-muted-foreground">osób z rekonstrukcjami</div></div>
            <div className="rounded-xl border border-border bg-background/40 p-4"><div className="text-2xl font-black">{freshAssessments.length}</div><div className="text-xs text-muted-foreground">aktualnych rekonstrukcji</div></div>
          </div>
          <div className="mt-4 space-y-2">
            {!activeCodebook && <ToolNotice tone="danger">Brak aktywnego codebooka — nie ma stabilnego punktu odniesienia dla modelu.</ToolNotice>}
            {data.people.length < 2 && <ToolNotice>Do porównywania stanowisk potrzeba co najmniej więcej niż jednej osoby. Obecny korpus jest nadal pilotażowy.</ToolNotice>}
            {activeAssessments.length === 0 && <ToolNotice>Nie ma jeszcze rekonstrukcji stanowisk. Mapa nie powinna agregować samych surowych kodowań bez warstwy przeglądu.</ToolNotice>}
            {staleAssessments.length > 0 && <ToolNotice>{staleAssessments.length} rekonstrukcji jest nieaktualnych względem bieżącego zestawu kodowań i nie powinno wejść do modelu bez ponownego przeglądu.</ToolNotice>}
            {insufficient > 0 && <ToolNotice>{insufficient} aktualnych rekonstrukcji ma status „niewystarczające dowody”. Powinny pozostać widoczne jako brak pewnego wyniku.</ToolNotice>}
          </div>
        </ToolPanel>

        <ToolPanel title="Dimension Model" description="Osie i ich powiązania z mikrostanowiskami będą wersjonowanym modelem interpretacyjnym. Dane źródłowe pozostaną od niego niezależne.">
          <ToolEmptyState
            title="Model wymiarów nie został jeszcze zdefiniowany"
            description={`Aktualny codebook ma ${activePropositions.length} mikrostanowisk. Następny etap to osobny, wersjonowany model mapujący je na potencjalne wymiary — bez przepisywania wcześniejszych danych.`}
          />
        </ToolPanel>

        <ToolNotice>
          Obecne hipotezy osi, takie jak subiektywizm ↔ obiektywizm czy pluralizm ↔ esencjalizm, pozostają kandydatami badawczymi. Nie są jeszcze wpisane do algorytmu.
        </ToolNotice>
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
        {section === "map" && <MapPage />}
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
