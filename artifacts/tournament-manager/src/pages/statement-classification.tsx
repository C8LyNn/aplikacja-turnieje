import {
  BookOpen,
  FileText,
  FlaskConical,
  Map,
  Network,
  Users,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
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

const BASE = "/ludology/statement-classification";

type Section = "hub" | "overview" | "people" | "sources" | "fragments" | "coding" | "map" | "methodology";

function getSection(pathname: string): Section {
  const tail = pathname.slice(BASE.length).replace(/^\/+|\/+$/g, "");
  if (tail === "overview" || tail === "people" || tail === "sources" || tail === "fragments" || tail === "coding" || tail === "map" || tail === "methodology") {
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
    </>
  );
}

function People() {
  const { data, addPerson } = useResearchProject();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    addPerson({ displayName: name.trim(), description: description.trim() || undefined });
    setName("");
    setDescription("");
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
                  <div className="font-bold">{person.displayName}</div>
                  {person.description && <div className="mt-1 text-sm text-muted-foreground">{person.description}</div>}
                  <div className="mt-2 text-xs text-muted-foreground">{sources} źródeł</div>
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
  const { data, addSource } = useResearchProject();
  const [personId, setPersonId] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [sourceType, setSourceType] = useState<"video" | "stream" | "podcast" | "post" | "article" | "academic" | "other">("video");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!personId || !title.trim() || !url.trim()) return;
    addSource({ personId, title: title.trim(), url: url.trim(), sourceType });
    setTitle("");
    setUrl("");
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
              <ToolButton type="submit" variant="primary">Dodaj źródło</ToolButton>
            </form>
          )}
        </ToolPanel>
        <ToolPanel title={`Materiały źródłowe (${data.sources.length})`}>
          {data.sources.length === 0 ? <ToolEmptyState title="Brak źródeł" description="Dodaj pierwszy materiał do korpusu." /> : (
            <div className="space-y-2">{data.sources.map((source) => {
              const person = data.people.find((item) => item.id === source.personId);
              return <div key={source.id} className="rounded-xl border border-border bg-background/40 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{source.sourceType} · {person?.displayName ?? "Nieznana osoba"}</div>
                <div className="mt-1 font-bold">{source.title}</div>
                <div className="mt-1 truncate text-xs text-muted-foreground">{source.url}</div>
              </div>;
            })}</div>
          )}
        </ToolPanel>
      </div>
    </>
  );
}

function ResearchWorkspace() {
  const { data, updateSource, addArgument, addExcerpt } = useResearchProject();
  const [sourceId, setSourceId] = useState("");
  const selectedSource = data.sources.find((source) => source.id === sourceId);
  const [transcript, setTranscript] = useState("");
  const [argumentTitle, setArgumentTitle] = useState("");
  const [argumentSummary, setArgumentSummary] = useState("");
  const [excerptText, setExcerptText] = useState("");
  const [excerptContext, setExcerptContext] = useState("");
  const [argumentId, setArgumentId] = useState("");

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

  function submitExcerpt(event: FormEvent) {
    event.preventDefault();
    if (!selectedSource || !excerptText.trim()) return;
    addExcerpt({
      sourceId: selectedSource.id,
      argumentId: argumentId || undefined,
      text: excerptText.trim(),
      contextBefore: excerptContext.trim() || undefined,
      verificationStatus: "unverified",
    });
    setExcerptText("");
    setExcerptContext("");
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
                  placeholder="Wklej transkrypcję, artykuł albo tekst wypowiedzi…"
                />
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
                          <div className="text-sm font-bold">{argument.title || "Argument bez tytułu"}</div>
                          {argument.summary && <div className="mt-1 text-xs text-muted-foreground">{argument.summary}</div>}
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
                    <ToolTextarea rows={3} value={excerptContext} onChange={(e) => setExcerptContext(e.target.value)} placeholder="Kontekst przed fragmentem / objaśnienie sytuacji…" />
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
                          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {argument?.title ?? "Bez argumentu"} · {excerpt.verificationStatus ?? "unverified"}
                          </div>
                          <blockquote className="text-sm leading-6">“{excerpt.text}”</blockquote>
                          {excerpt.contextBefore && <div className="mt-2 text-xs text-muted-foreground">Kontekst: {excerpt.contextBefore}</div>}
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

function Coding() {
  const { data, addCoding } = useResearchProject();
  const [excerptId, setExcerptId] = useState("");
  const [propositionId, setPropositionId] = useState("");
  const [direction, setDirection] = useState<"" | "-2" | "-1" | "0" | "1" | "2">("");
  const [explicitness, setExplicitness] = useState<"0" | "1" | "2" | "3">("2");
  const [evidenceLevel, setEvidenceLevel] = useState<"direct" | "argumentative" | "inferred">("argumentative");
  const [confidence, setConfidence] = useState<"low" | "medium" | "high">("medium");
  const [rationale, setRationale] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const codebook = data.codebooks[0];
    const coder = data.coders[0];
    if (!excerptId || !propositionId || !codebook || !coder) return;
    addCoding({
      excerptId,
      propositionId,
      coderId: coder.id,
      codebookId: codebook.id,
      direction: direction === "" ? null : Number(direction) as -2 | -1 | 0 | 1 | 2,
      explicitness: Number(explicitness) as 0 | 1 | 2 | 3,
      evidenceLevel,
      confidence,
      rationale: rationale.trim() || undefined,
    });
    setRationale("");
  }

  const selectedExcerpt = data.excerpts.find((excerpt) => excerpt.id === excerptId);

  return (
    <>
      <PageHeader section="CODE" title="Coding Lab" description="Kodowanie jest interpretacją fragmentu według jawnego codebooka, nie etykietą osoby." />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ToolPanel title="Materiał dowodowy">
          {data.excerpts.length === 0 ? (
            <ToolEmptyState title="Brak fragmentów do kodowania" description="Utwórz fragment w Warsztacie źródeł." />
          ) : (
            <div className="space-y-3">
              <ToolSelect value={excerptId} onChange={(e) => setExcerptId(e.target.value)}>
                <option value="">Wybierz fragment…</option>
                {data.excerpts.map((excerpt) => {
                  const source = data.sources.find((item) => item.id === excerpt.sourceId);
                  return <option key={excerpt.id} value={excerpt.id}>{source?.title ?? "Źródło"} — {excerpt.text.slice(0, 70)}</option>;
                })}
              </ToolSelect>
              {selectedExcerpt && (
                <div className="rounded-xl border border-border bg-background/40 p-4">
                  <blockquote className="text-sm leading-6">“{selectedExcerpt.text}”</blockquote>
                  {selectedExcerpt.contextBefore && <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">{selectedExcerpt.contextBefore}</div>}
                </div>
              )}
            </div>
          )}
        </ToolPanel>

        <ToolPanel title="Nowe kodowanie" description="Brak danych oznacz jako N/A, nie jako neutralne 0.">
          <form className="space-y-3" onSubmit={submit}>
            <ToolSelect value={propositionId} onChange={(e) => setPropositionId(e.target.value)}>
              <option value="">Wybierz mikrostanowisko…</option>
              {data.propositions.map((proposition) => <option key={proposition.id} value={proposition.id}>{proposition.code} — {proposition.label}</option>)}
            </ToolSelect>
            <ToolSelect value={direction} onChange={(e) => setDirection(e.target.value as typeof direction)}>
              <option value="">N/A — niewystarczające / nie dotyczy</option>
              <option value="-2">−2 — zdecydowanie odrzuca</option>
              <option value="-1">−1 — raczej odrzuca</option>
              <option value="0">0 — rzeczywiście mieszane / warunkowe</option>
              <option value="1">+1 — raczej popiera</option>
              <option value="2">+2 — zdecydowanie popiera</option>
            </ToolSelect>
            <div className="grid gap-3 sm:grid-cols-2">
              <ToolSelect value={explicitness} onChange={(e) => setExplicitness(e.target.value as typeof explicitness)}>
                <option value="0">Jawność 0 — bardzo pośrednie</option>
                <option value="1">Jawność 1 — implikowane</option>
                <option value="2">Jawność 2 — wyraźne</option>
                <option value="3">Jawność 3 — wprost</option>
              </ToolSelect>
              <ToolSelect value={evidenceLevel} onChange={(e) => setEvidenceLevel(e.target.value as typeof evidenceLevel)}>
                <option value="direct">Dowód: deklaracja bezpośrednia</option>
                <option value="argumentative">Dowód: wyraźna argumentacja</option>
                <option value="inferred">Dowód: wnioskowany</option>
              </ToolSelect>
            </div>
            <ToolSelect value={confidence} onChange={(e) => setConfidence(e.target.value as typeof confidence)}>
              <option value="low">Pewność interpretacji: niska</option>
              <option value="medium">Pewność interpretacji: średnia</option>
              <option value="high">Pewność interpretacji: wysoka</option>
            </ToolSelect>
            <ToolTextarea rows={4} value={rationale} onChange={(e) => setRationale(e.target.value)} placeholder="Uzasadnienie kodowania / wyjątki / zastrzeżenia…" />
            <ToolButton type="submit" variant="primary" disabled={!excerptId || !propositionId}>Zapisz kodowanie</ToolButton>
          </form>
        </ToolPanel>
      </div>

      <ToolPanel title={`Zakodowane obserwacje (${data.codings.length})`}>
        {data.codings.length === 0 ? (
          <ToolEmptyState title="Brak kodowań" description="Pierwsze kodowanie pojawi się tutaj wraz z pełnym śladem do fragmentu źródłowego." />
        ) : (
          <div className="space-y-3">
            {[...data.codings].reverse().map((coding) => {
              const excerpt = data.excerpts.find((item) => item.id === coding.excerptId);
              const proposition = data.propositions.find((item) => item.id === coding.propositionId);
              const source = data.sources.find((item) => item.id === excerpt?.sourceId);
              return (
                <div key={coding.id} className="rounded-xl border border-border bg-background/40 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <span>{proposition?.code ?? "?"}</span><span>·</span>
                    <span>{coding.direction === null ? "N/A" : coding.direction > 0 ? `+${coding.direction}` : coding.direction}</span><span>·</span>
                    <span>{coding.evidenceLevel}</span><span>·</span><span>{coding.confidence}</span>
                  </div>
                  <div className="mt-2 text-sm font-bold">{proposition?.label ?? "Nieznana teza"}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{source?.title ?? "Źródło"} — “{excerpt?.text.slice(0, 180) ?? "Brak fragmentu"}”</div>
                  {coding.rationale && <div className="mt-2 text-sm">{coding.rationale}</div>}
                </div>
              );
            })}
          </div>
        )}
      </ToolPanel>
    </>
  );
}

function MapPage() {
  return (
    <>
      <PageHeader section="MAP" title="Mapa stanowisk" description="Mapa będzie wizualizacją wyników kodowania, a nie założoną z góry podstawą systemu." />
      <ToolPanel>
        <ToolEmptyState
          title="Mapa jest jeszcze pusta"
          description="Nie ustalamy jeszcze osi X/Y ani algorytmu pozycjonowania. Najpierw potrzebne są dane i stabilny codebook."
        />
      </ToolPanel>
    </>
  );
}

function Methodology() {
  return (
    <>
      <PageHeader section="METHOD" title="Metodologia" description="Podstawą ma być analiza treści i jakościowe kodowanie z pełną możliwością audytu." />
      <ToolPanel>
        <div className="space-y-5">
          <ToolSection title="Codebook" description="Wersjonowane definicje kodów, reguły przypisywania i przykłady graniczne." >
            <ToolNotice>Zmiana definicji kodu powinna być widoczna jako nowa wersja metodologii, a nie cicha zmiana znaczenia wcześniejszych danych.</ToolNotice>
          </ToolSection>
          <ToolSection title="Niezależne kodowanie" description="Docelowo ten sam materiał może być oceniany przez więcej niż jednego kodera.">
            <div className="text-sm text-muted-foreground">Pozwoli to mierzyć zgodność między koderami, np. współczynnikiem α Krippendorffa.</div>
          </ToolSection>
          <ToolSection title="AI" description="Automatyzacja może pomagać w wyszukiwaniu i proponowaniu kodów.">
            <ToolNotice>AI pozostaje narzędziem pomocniczym. Nie jest arbitrem ostatecznej interpretacji.</ToolNotice>
          </ToolSection>
        </div>
      </ToolPanel>
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
        {section === "coding" && <Coding />}
        {section === "map" && <MapPage />}
        {section === "methodology" && <Methodology />}
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
