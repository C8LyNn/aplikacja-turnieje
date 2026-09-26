import { useEffect, useState } from "react";
import { RoleSelectionLink } from "@/components/app-navigation";
import { DrawLabExtracted } from "./developer/draw-lab/DrawLabExtracted";
import { ObsLab } from "./developer/obs-lab/ObsLab";

type ProjectId =
  | "draw-systems"
  | "app-experiments"
  | "obs-lab"
  | "future-lab"
  | "neoludology"
  | "meta-lab";

type ViewId = "hub" | ProjectId;

type DevProject = {
  id: ProjectId;
  code: string;
  title: string;
  description: string;
  status: string;
  nextStep: string;
  accent: string;
};

const PROJECTS: DevProject[] = [
  {
    id: "draw-systems",
    code: "DRAW",
    title: "Eksperymentalne systemy losowania",
    description:
      "Animowane i interaktywne sposoby losowania: karty, koło, marbles, drabinki i kolejne prototypy.",
    status: "Aktywne",
    nextStep:
      "Aktualny Card Draw Lab oraz kolejne mechaniki losowania.",
    accent: "from-blue-500/15 via-indigo-500/5 to-transparent",
  },
  {
    id: "app-experiments",
    code: "APP",
    title: "Eksperymenty aplikacji",
    description:
      "Pomysły związane z aplikacją turniejową, które nie pasują jeszcze do żadnego produkcyjnego modułu.",
    status: "Sandbox",
    nextStep:
      "Miejsce na prototypy UX, funkcje organizatora i nietypowe narzędzia.",
    accent: "from-emerald-500/15 via-teal-500/5 to-transparent",
  },
  {
    id: "obs-lab",
    code: "OBS",
    title: "OBS / Stream Add-ons",
    description:
      "Eksperymentalne overlaye, animacje i browser source'y działające przez link URL w OBS.",
    status: "Następne",
    nextStep:
      "Pierwszy test: niezależny od aplikacji efekt animowany dostępny jako URL.",
    accent: "from-fuchsia-500/15 via-purple-500/5 to-transparent",
  },
  {
    id: "future-lab",
    code: "???",
    title: "Wolna przestrzeń",
    description:
      "Otwarta kategoria na eksperymenty, które pojawią się później i nie mają jeszcze własnego kierunku.",
    status: "Wolne",
    nextStep:
      "Do zagospodarowania, gdy pojawi się nowy pomysł.",
    accent: "from-slate-400/10 via-slate-500/5 to-transparent",
  },
  {
    id: "neoludology",
    code: "NEO",
    title: "Neoludologia",
    description:
      "Osobny eksperymentalny projekt aplikacji do analizy gier i pracy nad koncepcjami neoludologicznymi.",
    status: "Plan",
    nextStep:
      "Najpierw określimy model danych i pierwszy konkretny workflow.",
    accent: "from-amber-500/15 via-orange-500/5 to-transparent",
  },
  {
    id: "meta-lab",
    code: "META",
    title: "Meta Lab / Teamcomp Builder",
    description:
      "Analiza mety Marvel Rivals i później innych gier: dane postaci, synergie, kompromisy i budowanie teamcompów.",
    status: "Plan",
    nextStep:
      "Pierwszy moduł: wartości cech bohaterów i sumowanie profilu całej drużyny.",
    accent: "from-rose-500/15 via-red-500/5 to-transparent",
  },
];

function readView(): ViewId {
  if (typeof window === "undefined") return "hub";

  const hash = window.location.hash.replace(/^#/, "");

  if (PROJECTS.some((project) => project.id === hash)) {
    return hash as ProjectId;
  }

  return "hub";
}

function ProjectHub() {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card/50 p-5">
        <div className="max-w-4xl">
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            DEV / NARZĘDZIA
          </div>
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Developer Projects
          </div>

          <h2 className="text-2xl font-bold">
            Eksperymentalna przestrzeń projektowa
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Prototypy mogą być związane z aplikacją turniejową, ale nie muszą.
            Każda kategoria jest odseparowanym laboratorium i może później
            rozwinąć się we własny moduł albo osobną aplikację.
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PROJECTS.map((project) => (
          <a
            key={project.id}
            href={`#${project.id}`}
            className="group relative min-h-[210px] overflow-hidden rounded-2xl border border-border bg-card text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-black/10"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${project.accent}`}
            />

            <div className="absolute left-5 top-0 h-2 w-20 rounded-b-lg bg-primary/35 transition group-hover:w-24 group-hover:bg-primary/55" />

            <div className="relative flex h-full flex-col p-5">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="grid h-11 min-w-11 place-items-center rounded-xl border border-border bg-background/70 px-2 text-xs font-black tracking-wider text-primary">
                  {project.code}
                </div>

                <span className="rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                  {project.status}
                </span>
              </div>

              <h3 className="text-lg font-bold leading-tight">
                {project.title}
              </h3>

              <p className="mt-2 text-sm leading-5 text-muted-foreground">
                {project.description}
              </p>

              <div className="mt-auto pt-5">
                <div className="border-t border-border/70 pt-3 text-xs leading-5 text-muted-foreground">
                  {project.nextStep}
                </div>

                <div className="mt-3 text-xs font-bold text-primary opacity-70 transition group-hover:opacity-100">
                  Otwórz projekt →
                </div>
              </div>
            </div>
          </a>
        ))}
        <a
          href="/dev/animated-effects/"
          className="group relative min-h-[210px] overflow-hidden rounded-2xl border border-border bg-card text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/15 via-purple-500/5 to-transparent" />
          <div className="absolute left-5 top-0 h-2 w-20 rounded-b-lg bg-primary/35 transition group-hover:w-24 group-hover:bg-primary/55" />
          <div className="relative flex h-full flex-col p-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="grid h-11 min-w-11 place-items-center rounded-xl border border-border bg-background/70 px-2 text-xs font-black tracking-wider text-primary">
                FX
              </div>
              <span className="rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                Narzędzie
              </span>
            </div>
            <h3 className="text-lg font-bold leading-tight">Animated Effects</h3>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              Efekty streamowe — edytor efektów
            </p>
            <div className="mt-auto pt-5">
              <div className="border-t border-border/70 pt-3 text-xs leading-5 text-muted-foreground">
                Podgląd, konfiguracja i eksport animowanych efektów do StreamElements.
              </div>
              <div className="mt-3 text-xs font-bold text-primary opacity-70 transition group-hover:opacity-100">
                Otwórz narzędzie →
              </div>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}

function PlaceholderSection({ project }: { project: DevProject }) {
  const isObs = project.id === "obs-lab";
  const isMeta = project.id === "meta-lab";

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-card/50 p-6">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-primary">
          {project.code} Lab
        </div>

        <h2 className="mt-2 text-2xl font-bold">{project.title}</h2>

        <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
          {project.description}
        </p>

        <div className="mt-5 rounded-xl border border-border bg-background/40 p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Pierwszy kierunek
          </div>

          <p className="mt-2 text-sm">{project.nextStep}</p>
        </div>
      </section>

      {isObs && (
        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card/40 p-4">
            <div className="text-sm font-bold">Browser Source URL</div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Gotowy adres do wklejenia bezpośrednio do OBS.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card/40 p-4">
            <div className="text-sm font-bold">Animowane efekty</div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Pierwsze eksperymenty mogą działać całkowicie niezależnie od
              systemu turniejowego.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card/40 p-4">
            <div className="text-sm font-bold">Overlaye aplikacji</div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Później można tu podłączać wyniki, drabinki, losowania i inne
              dane na żywo.
            </p>
          </div>
        </section>
      )}

      {isMeta && (
        <section className="rounded-2xl border border-border bg-card/40 p-5">
          <h3 className="font-bold">Pierwszy model Teamcomp Buildera</h3>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Każdy bohater będzie miał zestaw liczbowych cech. Sześciu bohaterów
            utworzy sumaryczny profil drużyny, dzięki czemu będzie można
            zobaczyć nie tylko „czy comp jest dobry”, ale dokładnie co zyskuje
            i co poświęca.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "HP / wytrzymałość",
              "obrażenia",
              "leczenie",
              "Brawl",
              "Dive",
              "Poke",
              "zasięg",
              "mobilność",
              "kontrola",
              "utility",
            ].map((trait) => (
              <span
                key={trait}
                className="rounded-full border border-border bg-background/50 px-3 py-1.5 text-xs text-muted-foreground"
              >
                {trait}
              </span>
            ))}
          </div>
        </section>
      )}

      {!isObs && !isMeta && (
        <section className="rounded-2xl border border-dashed border-border bg-card/20 p-10 text-center">
          <div className="text-sm font-semibold">Przestrzeń gotowa</div>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Na razie nie dodajemy tu logiki. Sekcja istnieje jako osobny
            eksperymentalny obszar i można ją rozwijać niezależnie.
          </p>
        </section>
      )}
    </div>
  );
}

export default function DeveloperPage() {
  const [view, setView] = useState<ViewId>(() => readView());

  useEffect(() => {
    const handleHashChange = () => {
      setView(readView());
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const activeProject =
    view === "hub"
      ? null
      : PROJECTS.find((project) => project.id === view) ?? null;

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            {view !== "hub" && (
              <a
                href="#"
                className="shrink-0 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold transition hover:border-primary/40 hover:bg-accent"
              >
                ← Projekty
              </a>
            )}

            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold">
                {activeProject?.title ?? "Developer Lab"}
              </h1>

              <p className="truncate text-sm text-muted-foreground">
                {activeProject
                  ? "Eksperymentalny projekt w strefie developerskiej"
                  : "Eksperymentalne projekty, narzędzia i prototypy"}
              </p>
            </div>
          </div>

          <RoleSelectionLink />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] p-4">
        {view === "hub" && <ProjectHub />}

        {view === "draw-systems" && (
          <div className="space-y-4">
            <section className="rounded-xl border border-border bg-card/40 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-primary">
                Draw Lab
              </div>

              <h2 className="mt-1 text-lg font-semibold">
                Karty — aktualny prototyp
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Fizyczne talie, animacje, mieszanie, zarządzanie taliami i
                eksperymentalny interfejs losowania.
              </p>
            </section>

            <DrawLabExtracted />
          </div>
        )}

        {view === "obs-lab" && <ObsLab />}

        {activeProject &&
          view !== "draw-systems" &&
          view !== "obs-lab" && (
            <PlaceholderSection project={activeProject} />
          )}
      </main>
    </div>
  );
}
