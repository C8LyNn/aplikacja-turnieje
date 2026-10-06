import {
  BookOpen,
  Dices,
  Gamepad2,
  Radio,
  Shapes,
  Sparkles,
  Trophy,
  BriefcaseBusiness,
  type LucideIcon,
} from "lucide-react";
import { Link } from "wouter";
import { SfCard } from "@/components/sf/sf-views";

const MODULES: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  text: string;
  gradient: string;
  stripe: string;
  borderHover: string;
}[] = [
  { title: "Portfolio", description: "Portfolio i wybrane realizacje.", href: "/portfolio/", icon: BriefcaseBusiness, text: "text-cyan-400", gradient: "from-cyan-500/15 via-cyan-500/5", stripe: "bg-cyan-500/55", borderHover: "hover:border-cyan-500/45" },
  { title: "Turnieje", description: "Organizacja i obsługa turniejów.", href: "/tournaments", icon: Trophy, text: "text-primary", gradient: "from-primary/15 via-primary/5", stripe: "bg-primary/55", borderHover: "hover:border-primary/45" },
  { title: "Minigry", description: "Grywalne prototypy i eksperymenty.", href: "/minigames", icon: Gamepad2, text: "text-emerald-400", gradient: "from-emerald-500/15 via-emerald-500/5", stripe: "bg-emerald-500/55", borderHover: "hover:border-emerald-500/45" },
  { title: "Losowania", description: "Narzędzia i prototypy losowań.", href: "/randomizers", icon: Dices, text: "text-blue-400", gradient: "from-blue-500/15 via-blue-500/5", stripe: "bg-blue-500/55", borderHover: "hover:border-blue-500/45" },
  { title: "OBS / Stream", description: "Overlaye i narzędzia transmisyjne.", href: "/stream", icon: Radio, text: "text-fuchsia-400", gradient: "from-fuchsia-500/15 via-fuchsia-500/5", stripe: "bg-fuchsia-500/55", borderHover: "hover:border-fuchsia-500/45" },
  { title: "Ludologia", description: "Klasyfikacja gier i wypowiedzi.", href: "/ludology", icon: Shapes, text: "text-amber-400", gradient: "from-amber-500/15 via-amber-500/5", stripe: "bg-amber-500/55", borderHover: "hover:border-amber-500/45" },
  { title: "Projekty badawcze", description: "Bazy i narzędzia badawcze.", href: "/research", icon: BookOpen, text: "text-cyan-400", gradient: "from-cyan-500/15 via-cyan-500/5", stripe: "bg-cyan-500/55", borderHover: "hover:border-cyan-500/45" },
  { title: "Meta Lab", description: "Analiza mety i kompozycji drużyn.", href: "/meta-lab", icon: Sparkles, text: "text-rose-400", gradient: "from-rose-500/15 via-rose-500/5", stripe: "bg-rose-500/55", borderHover: "hover:border-rose-500/45" },
];

export default function Landing() {
  return (
    <div className="grid min-h-[100dvh] grid-rows-[1fr_auto_1fr] bg-background px-4 py-8 text-foreground dark sm:py-4">
        <div aria-hidden="true" />

        <div data-testid="landing-project-grid" className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map(({ title, description, href, icon: Icon, text, gradient, stripe, borderHover }) => {
            // The standalone HTML portfolio needs a full document navigation,
            // not the React router used by the other modules.
            const TileLink = href === "/portfolio/" ? "a" : Link;
            return (
            <TileLink
              key={href}
              href={href}
              className={`group relative min-h-[205px] overflow-hidden rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10 ${borderHover}`}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient} to-transparent`} />
              <div className={`absolute left-5 top-0 h-1.5 w-16 rounded-b-lg transition-all group-hover:w-20 ${stripe}`} />
              <div className="relative flex h-full flex-col items-start text-left">
                <div className={`mb-5 grid h-11 w-11 place-items-center rounded-xl border border-border bg-background/65 ${text}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-1 text-lg font-bold leading-tight">{title}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">{description}</p>
                <div className={`mt-auto pt-5 text-xs font-bold opacity-75 transition group-hover:opacity-100 ${text}`}>Otwórz →</div>
              </div>
            </TileLink>
            );
          })}
          <SfCard />
        </div>
        <div aria-hidden="true" />
    </div>
  );
}
