import {
  BookOpen,
  BriefcaseBusiness,
  Dices,
  Gamepad2,
  Orbit,
  Radio,
  Shapes,
  Sparkles,
  Trophy,
} from "lucide-react";
import { ProjectCard } from "@/components/portfolio-ui";
import { Link } from "wouter";

const MODULES = [
  {
    code: "TURN",
    title: "Turnieje",
    description: "Organizacja i obsługa turniejów.",
    href: "/tournaments",
    icon: Trophy,
    accent: "primary" as const,
  },
  {
    code: "GAME",
    title: "Minigry",
    description: "Grywalne prototypy i eksperymenty.",
    href: "/minigames",
    icon: Gamepad2,
    accent: "emerald" as const,
  },
  {
    code: "DRAW",
    title: "Losowania",
    description: "Narzędzia i prototypy losowań.",
    href: "/randomizers",
    icon: Dices,
    accent: "blue" as const,
  },
  {
    code: "OBS",
    title: "OBS / Stream",
    description: "Overlaye i narzędzia transmisyjne.",
    href: "/stream",
    icon: Radio,
    accent: "fuchsia" as const,
  },
  {
    code: "LUDO",
    title: "Ludologia",
    description: "Klasyfikacja gier i wypowiedzi.",
    href: "/ludology",
    icon: Shapes,
    accent: "amber" as const,
  },
  {
    code: "RES",
    title: "Projekty badawcze",
    description: "Bazy i narzędzia badawcze.",
    href: "/research",
    icon: BookOpen,
    accent: "cyan" as const,
  },
  {
    code: "META",
    title: "Meta Lab",
    description: "Analiza mety i kompozycji drużyn.",
    href: "/meta-lab",
    icon: Sparkles,
    accent: "rose" as const,
  },
] as const;

export default function Landing() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground dark sm:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-7">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-primary">PROJECTS</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Projekty</h1>
          <p className="mt-2 text-sm text-muted-foreground">Wybierz obszar.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* PORTFOLIO_TILE_V9_4_2: primary portfolio entry */}
          <a
            href={`${(import.meta.env?.BASE_URL ?? "/")}portfolio/`}
            aria-label="Portfolio Jakuba Powierskiego — Game & Systems Design"
            className="group relative flex min-h-[205px] overflow-hidden rounded-2xl border border-sky-300/30 bg-[linear-gradient(145deg,rgba(7,28,52,.98),rgba(9,18,35,.98)_48%,rgba(18,24,46,.98))] p-5 transition duration-300 hover:-translate-y-1 hover:border-sky-200/60 hover:shadow-[0_20px_65px_rgba(14,165,233,.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          >
            <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl transition duration-500 group-hover:bg-sky-300/20" />
            <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-sky-200/90 to-transparent" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-1/2 bg-gradient-to-r from-sky-300 via-blue-400 to-transparent shadow-[0_0_14px_rgba(56,189,248,.5)]" />

            <div className="relative flex w-full flex-col">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl border border-sky-200/20 bg-sky-300/10 text-sky-200 shadow-[inset_0_0_20px_rgba(56,189,248,.08)]">
                  <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="rounded-full border border-sky-200/20 bg-sky-300/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-sky-100/85">
                  SHOWCASE
                </span>
              </div>

              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-300">
                JAKUB POWIERSKI
              </div>
              <h2 className="mt-1 text-3xl font-black tracking-[-0.035em] text-white">
                PORTFOLIO
              </h2>
              <p className="mt-1 text-sm font-semibold text-sky-100/80">
                Game Design · Systems Design
              </p>
              <p className="mt-2 max-w-[34ch] text-sm leading-5 text-muted-foreground">
                Najważniejsze projekty, case studies, dokumentacja i decyzje projektowe.
              </p>

              <span className="mt-auto pt-4 text-sm font-bold text-sky-200 transition group-hover:translate-x-1">
                Otwórz portfolio →
              </span>
            </div>
          </a>

          {MODULES.map((module) => (
            <ProjectCard key={module.href} {...module} />
          ))}


          {/* SF_TILE_V9_4: sci-fi visual polish */}
          <Link
            href="/sf"
            aria-label="SF — projekty science fiction"
            className="group relative flex min-h-[205px] overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#07111f] p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/55 hover:shadow-[0_20px_65px_rgba(34,211,238,.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(34,211,238,.18),transparent_28%),radial-gradient(circle_at_18%_82%,rgba(168,85,247,.16),transparent_34%),linear-gradient(145deg,rgba(8,47,73,.2),transparent_44%,rgba(88,28,135,.12))]" />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.12] transition duration-500 group-hover:opacity-[0.2]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(103,232,249,.28) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,.28) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
                maskImage: "linear-gradient(to bottom, black, transparent 82%)",
              }}
            />
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-cyan-300/15 shadow-[0_0_50px_rgba(34,211,238,.12)] transition duration-700 group-hover:scale-110 group-hover:rotate-12">
              <div className="absolute inset-5 rounded-full border border-fuchsia-400/15" />
              <div className="absolute inset-12 rounded-full bg-cyan-300/10 blur-xl group-hover:bg-cyan-300/20" />
            </div>
            <div className="pointer-events-none absolute left-0 top-0 h-[2px] w-1/2 bg-gradient-to-r from-cyan-300 via-sky-400 to-transparent shadow-[0_0_14px_rgba(34,211,238,.75)]" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-[2px] w-1/3 bg-gradient-to-l from-fuchsia-400 via-violet-400 to-transparent shadow-[0_0_14px_rgba(217,70,239,.45)]" />
            <div className="relative flex w-full flex-col">
              <div className="mb-5 flex items-start justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/5 text-cyan-300 shadow-[inset_0_0_20px_rgba(34,211,238,.08),0_0_22px_rgba(34,211,238,.06)]">
                  <Orbit className="h-5 w-5 transition duration-700 group-hover:rotate-180" aria-hidden="true" />
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200/75">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,.9)]" />
                  Signal online
                </div>
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-400">SCI-FI</div>
              <div className="mt-1 flex items-end gap-3">
                <span className="text-3xl font-black tracking-[0.18em] text-white drop-shadow-[0_0_14px_rgba(103,232,249,.25)]">SF</span>
                <span className="pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-fuchsia-300/70">Sector / Experimental</span>
              </div>
              <p className="mt-2 max-w-[34ch] text-sm leading-5 text-slate-300/75">
                Projekty, prototypy i eksperymenty o bardziej futurystycznym charakterze.
              </p>
              <span className="mt-auto pt-5 text-sm font-bold text-cyan-300 transition group-hover:translate-x-1">
                Wejdź do sektora →
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
