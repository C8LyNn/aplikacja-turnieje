import {
  BookOpen,
  FileText,
  FlaskConical,
  Map,
  Network,
  Users,
} from "lucide-react";
import { useLocation } from "wouter";
import {
  ModuleHeader,
  ModuleShell,
  ProjectCard,
} from "@/components/portfolio-ui";
import {
  ToolEmptyState,
  ToolNotice,
  ToolPanel,
  ToolSection,
} from "@/components/tool-ui";

const BASE = "/ludology/statement-classification";

type Section = "hub" | "overview" | "people" | "sources" | "coding" | "map" | "methodology";

function getSection(pathname: string): Section {
  const tail = pathname.slice(BASE.length).replace(/^\/+|\/+$/g, "");
  if (tail === "overview" || tail === "people" || tail === "sources" || tail === "coding" || tail === "map" || tail === "methodology") {
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
            {['Osoba', 'Źródło', 'Fragment', 'Kodowanie'].map((item, index) => (
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
  return (
    <>
      <PageHeader section="PEOPLE" title="Osoby" description="Lista analizowanych osób będzie tylko indeksem prowadzącym do ich źródeł i zakodowanych fragmentów." />
      <ToolPanel>
        <ToolEmptyState
          title="Brak osób w zbiorze"
          description="Na tym etapie przygotowana jest struktura. Profile zostaną dodane dopiero razem ze źródłami."
        />
      </ToolPanel>
    </>
  );
}

function Sources() {
  return (
    <>
      <PageHeader section="SRC" title="Źródła" description="Każdy wniosek ma dać się prześledzić do konkretnego materiału i fragmentu wypowiedzi." />
      <ToolPanel>
        <ToolEmptyState
          title="Brak źródeł"
          description="Docelowo rekord źródła będzie przechowywał autora, adres, typ materiału, datę oraz fragmenty z kontekstem i timestampami."
        />
      </ToolPanel>
    </>
  );
}

function Coding() {
  return (
    <>
      <PageHeader section="CODE" title="Kodowanie" description="Tutaj fragmenty źródłowe będą zamieniane na audytowalne mikrostanowiska i przypisywane do tez." />
      <ToolPanel title="Minimalny rekord kodowania">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Fragment", "Dokładny materiał dowodowy"],
            ["Teza", "Do czego odnosi się wypowiedź"],
            ["Kod", "Znormalizowane znaczenie fragmentu"],
            ["Siła dowodu", "Bezpośrednie / pośrednie / wnioskowane"],
            ["Pewność", "Jak pewna jest interpretacja"],
            ["Notatka", "Kontekst, wyjątki i sprzeczności"],
          ].map(([title, text]) => (
            <div key={title} className="rounded-xl border border-border bg-background/40 p-4">
              <div className="text-sm font-bold">{title}</div>
              <div className="mt-1 text-xs leading-5 text-muted-foreground">{text}</div>
            </div>
          ))}
        </div>
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
