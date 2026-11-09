import {
  BookOpen,
  BriefcaseBusiness,
  Dices,
  Gamepad2,
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
    <div className="min-h-screen bg-background px-4 py-6 text-foreground dark sm:py-8">
      <div className="mx-auto w-full max-w-6xl">
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* PORTFOLIO_TILE_V9_5_001 */}
          <a
            href={`${(import.meta.env?.BASE_URL ?? "/")}portfolio/`}
            aria-label="Portfolio"
            className="group relative min-h-[205px] overflow-hidden rounded-2xl border border-border/90 bg-card/95 p-5 shadow-[0_10px_30px_rgba(0,0,0,.16)] transition hover:-translate-y-0.5 hover:border-violet-400/60 hover:shadow-[0_16px_38px_rgba(0,0,0,.22)]"
          >
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full border border-cyan-200/14 transition duration-700 group-hover:rotate-12">
              <div className="absolute inset-5 rounded-full border border-cyan-100/10" />
              <div className="absolute inset-10 rounded-full border border-dashed border-rose-300/12 transition duration-1000 group-hover:-rotate-45" />
              <div className="absolute inset-[68px] rounded-full bg-cyan-100/[0.045] shadow-[0_0_32px_rgba(103,232,249,.10)]" />
            </div>
            <div className="pointer-events-none absolute left-0 top-0 h-[2px] w-1/3 bg-gradient-to-r from-rose-400/65 via-cyan-300/30 to-transparent" />
            <span className="pointer-events-none absolute right-5 top-5 h-1.5 w-1.5 animate-pulse rounded-full bg-rose-300/80 shadow-[0_0_9px_rgba(253,164,175,.65)]" />
            <span className="relative font-mono text-5xl font-black tracking-[0.28em] text-slate-100 transition duration-300 group-hover:text-white group-hover:drop-shadow-[0_0_18px_rgba(103,232,249,.18)]">SF</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
