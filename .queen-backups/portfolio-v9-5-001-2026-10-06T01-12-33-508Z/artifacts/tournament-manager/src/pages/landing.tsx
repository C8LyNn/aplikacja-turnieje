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
          {/* PORTFOLIO_TILE_V9_4_3: same visual system as standard cards */}
          <a
            href={`${(import.meta.env?.BASE_URL ?? "/")}portfolio/`}
            aria-label="Portfolio"
            className="group relative min-h-[205px] overflow-hidden rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-lg hover:shadow-black/10"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent" />
            <div className="absolute left-5 top-0 h-1.5 w-16 rounded-b-lg bg-primary/55 transition-all group-hover:w-20" />
            <div className="relative flex h-full flex-col">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-background/65 text-primary">
                  <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">
                PORTFOLIO
              </div>
              <h2 className="mt-1 text-lg font-bold leading-tight">Portfolio</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">
                Game Design i Systems Design.
              </p>
              <div className="mt-auto pt-5 text-xs font-bold text-primary opacity-75 transition group-hover:opacity-100">
                Otwórz →
              </div>
            </div>
          </a>

          {MODULES.map((module) => (
            <ProjectCard key={module.href} {...module} />
          ))}


          {/* SF_TILE_V9_4_3: minimal dark dystopian identity */}
          <Link
            href="/sf"
            aria-label="SF"
            className="group relative flex min-h-[205px] items-center justify-center overflow-hidden rounded-2xl border border-slate-700/70 bg-[#05070a] transition duration-300 hover:-translate-y-0.5 hover:border-red-400/35 hover:shadow-[0_18px_55px_rgba(0,0,0,.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/60"
          >
            {/* sterile system glow */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(148,163,184,.09),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(239,68,68,.08),transparent_22%),linear-gradient(160deg,#07090c_0%,#040506_58%,#090b0f_100%)]" />

            {/* controlled grid / infrastructure */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07] transition duration-500 group-hover:opacity-[0.12]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(226,232,240,.22) 1px, transparent 1px), linear-gradient(90deg, rgba(226,232,240,.22) 1px, transparent 1px)",
                backgroundSize: "30px 30px",
              }}
            />

            {/* hibernation / monitoring iris */}
            <div className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full border border-slate-400/10 transition duration-700 group-hover:rotate-12">
              <div className="absolute inset-5 rounded-full border border-slate-400/10" />
              <div className="absolute inset-10 rounded-full border border-dashed border-red-300/10 transition duration-1000 group-hover:-rotate-45" />
              <div className="absolute inset-[68px] rounded-full bg-red-300/[0.035] shadow-[0_0_30px_rgba(248,113,113,.06)]" />
            </div>

            {/* surveillance / system signal */}
            <div className="pointer-events-none absolute left-0 top-0 h-[2px] w-1/3 bg-gradient-to-r from-red-400/55 via-red-300/15 to-transparent" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-px w-2/5 bg-gradient-to-l from-slate-300/20 to-transparent" />
            <span className="pointer-events-none absolute right-5 top-5 h-1.5 w-1.5 animate-pulse rounded-full bg-red-400/70 shadow-[0_0_9px_rgba(248,113,113,.6)]" />

            {/* visual-only scan marks */}
            <div className="pointer-events-none absolute bottom-6 left-6 flex gap-1 opacity-20">
              <span className="h-4 w-px bg-slate-200" />
              <span className="h-7 w-px bg-slate-200" />
              <span className="h-5 w-px bg-red-300" />
              <span className="h-9 w-px bg-slate-200" />
              <span className="h-6 w-px bg-slate-200" />
              <span className="h-3 w-px bg-slate-200" />
            </div>

            <span className="relative font-mono text-5xl font-black tracking-[0.28em] text-slate-100 transition duration-300 group-hover:text-white group-hover:drop-shadow-[0_0_16px_rgba(248,113,113,.12)]">
              SF
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
