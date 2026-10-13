import {
  BookOpen,
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
    <div className="min-h-screen bg-background px-4 py-8 text-foreground dark sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-7">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-primary">PROJECTS</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Projekty</h1>
          <p className="mt-2 text-sm text-muted-foreground">Wybierz obszar.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((module) => (
            <ProjectCard key={module.href} {...module} />
          ))}

          <Link
            href="/sf"
            aria-label="SF"
            className="group relative flex min-h-[205px] items-center justify-center overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-border/80 hover:shadow-lg hover:shadow-black/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 via-transparent to-transparent" />
            <span className="relative text-3xl font-black tracking-[0.22em] text-foreground">SF</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
