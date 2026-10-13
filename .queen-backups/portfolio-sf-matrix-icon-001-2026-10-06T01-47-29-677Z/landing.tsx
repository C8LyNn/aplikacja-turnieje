import {
  Binary,
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
import { useEffect, useState } from "react";

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


const MATRIX_GLYPHS =
  "0123456789ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ";

function randomMatrixText(length: number) {
  return Array.from({ length }, () =>
    MATRIX_GLYPHS[Math.floor(Math.random() * MATRIX_GLYPHS.length)]
  ).join("");
}

function SfMatrixCard() {
  const [description, setDescription] = useState(() => randomMatrixText(18));
  const [action, setAction] = useState(() => randomMatrixText(8));
  const [glitching, setGlitching] = useState(false);
  const [glitchFrame, setGlitchFrame] = useState(0);
  const [glitchSeed, setGlitchSeed] = useState(() => Math.floor(Math.random() * 997));

  useEffect(() => {
    let frameTimer: number | undefined;
    let settleTimer: number | undefined;

    const runGlitch = () => {
      if (frameTimer !== undefined) window.clearInterval(frameTimer);
      if (settleTimer !== undefined) window.clearTimeout(settleTimer);

      setGlitching(true);
      setGlitchSeed(Math.floor(Math.random() * 997));
      setGlitchFrame(0);

      let frame = 0;
      frameTimer = window.setInterval(() => {
        frame += 1;
        setGlitchFrame(frame);
        setDescription(randomMatrixText(18));
        setAction(randomMatrixText(8));

        if (frame >= 9) {
          if (frameTimer !== undefined) {
            window.clearInterval(frameTimer);
            frameTimer = undefined;
          }

          settleTimer = window.setTimeout(() => {
            setDescription(randomMatrixText(18));
            setAction(randomMatrixText(8));
            setGlitchFrame(0);
            setGlitching(false);
          }, 110);
        }
      }, 65);
    };

    const cycle = window.setInterval(runGlitch, 10_000);

    return () => {
      window.clearInterval(cycle);
      if (frameTimer !== undefined) window.clearInterval(frameTimer);
      if (settleTimer !== undefined) window.clearTimeout(settleTimer);
    };
  }, []);

  const jitterX = glitching ? ((glitchSeed + glitchFrame * 7) % 5) - 2 : 0;
  const jitterY = glitching ? ((glitchSeed + glitchFrame * 11) % 3) - 1 : 0;
  const skew = glitching ? (((glitchSeed + glitchFrame * 13) % 7) - 3) * 0.35 : 0;
  const ghostOffset = glitching ? 1 + ((glitchSeed + glitchFrame) % 2) : 0;

  return (
    <Link
      href="/sf"
      aria-label="SF"
      className="group relative min-h-[205px] overflow-hidden rounded-2xl border border-cyan-400/30 bg-card/95 p-5 shadow-[0_10px_30px_rgba(0,0,0,.16)] transition hover:-translate-y-0.5 hover:border-cyan-300/60 hover:shadow-[0_16px_40px_rgba(7,18,30,.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/18 via-cyan-500/[0.035] to-transparent" />
      <div className="absolute left-5 top-0 h-1.5 w-16 rounded-b-lg bg-cyan-400/65 transition-all group-hover:w-20" />

      {glitching && (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 h-px bg-cyan-200/70 mix-blend-screen"
            style={{ top: (18 + ((glitchSeed + glitchFrame * 17) % 68)) + "%" }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 h-[2px] bg-fuchsia-400/35 mix-blend-screen"
            style={{ top: (25 + ((glitchSeed + glitchFrame * 23) % 58)) + "%" }}
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(34,211,238,.035),transparent)]"
            style={{
              transform: "translateX(" + (((glitchSeed + glitchFrame * 29) % 11) - 5) + "px)",
            }}
          />
        </>
      )}

      <div
        className="relative flex h-full flex-col items-center text-center"
        style={{
          transform: glitching
            ? "translate(" + jitterX + "px, " + jitterY + "px) skewX(" + skew + "deg)"
            : undefined,
          filter: glitching
            ? "contrast(" + (1.04 + ((glitchSeed + glitchFrame) % 4) * 0.03) + ") brightness(" + (1.01 + ((glitchSeed + glitchFrame) % 3) * 0.03) + ")"
            : undefined,
        }}
      >
        <div className="mb-5 flex items-start justify-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-background/65 text-cyan-300">
            <Binary className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <div className="relative">
          {glitching && (
            <>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 text-lg font-bold leading-tight text-cyan-300/55"
                style={{ transform: "translateX(" + (-ghostOffset) + "px)" }}
              >
                SF
              </span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 text-lg font-bold leading-tight text-fuchsia-300/45"
                style={{ transform: "translateX(" + ghostOffset + "px)" }}
              >
                SF
              </span>
            </>
          )}
          <h2 className="relative mt-1 text-lg font-bold leading-tight text-foreground">SF</h2>
        </div>

        <div className="relative mt-2 max-w-full overflow-hidden">
          {glitching && (
            <>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 whitespace-nowrap font-mono text-sm leading-5 tracking-[0.11em] text-cyan-300/50"
                style={{
                  transform: "translateX(" + (-ghostOffset) + "px)",
                  clipPath: "inset(" + ((glitchSeed + glitchFrame * 9) % 55) + "% 0 " + ((glitchSeed + glitchFrame * 5) % 35) + "% 0)",
                }}
              >
                {description}
              </span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 whitespace-nowrap font-mono text-sm leading-5 tracking-[0.11em] text-fuchsia-300/40"
                style={{
                  transform: "translateX(" + ghostOffset + "px)",
                  clipPath: "inset(" + ((glitchSeed + glitchFrame * 5) % 35) + "% 0 " + ((glitchSeed + glitchFrame * 11) % 45) + "% 0)",
                }}
              >
                {description}
              </span>
            </>
          )}
          <p className="relative whitespace-nowrap font-mono text-sm leading-5 tracking-[0.11em] text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="relative mt-auto max-w-full overflow-hidden pt-5">
          {glitching && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-0 right-0 whitespace-nowrap font-mono text-xs font-bold tracking-[0.14em] text-fuchsia-300/45"
              style={{ transform: "translateX(" + ghostOffset + "px)" }}
            >
              {action}
            </span>
          )}
          <div className="relative whitespace-nowrap font-mono text-xs font-bold tracking-[0.14em] text-cyan-300 opacity-80 transition group-hover:opacity-100">
            {action}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Landing() {
  return (
    <div className="flex min-h-screen items-center bg-background px-4 py-6 text-foreground dark sm:py-8">
      <div className="mx-auto w-full max-w-6xl">
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* PORTFOLIO_TILE_V9_5_001 */}
          <a
            href={`${(import.meta.env?.BASE_URL ?? "/")}portfolio/`}
            aria-label="Portfolio"
            className="group relative min-h-[205px] overflow-hidden rounded-2xl border border-border/90 bg-card/95 p-5 shadow-[0_10px_30px_rgba(0,0,0,.16)] transition hover:-translate-y-0.5 hover:border-violet-400/60 hover:shadow-[0_16px_38px_rgba(0,0,0,.22)]"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/28 via-violet-500/6 to-transparent" />
            <div className="absolute left-5 top-0 h-1.5 w-16 rounded-b-lg bg-violet-500/70 transition-all group-hover:w-20" />
            <div className="relative flex h-full flex-col items-center text-center">
              <div className="mb-5 flex items-start justify-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-background/65 text-violet-300">
                  <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
              <h2 className="mt-1 text-lg font-bold leading-tight">Portfolio</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">Game Design i Systems Design.</p>
              <div className="mt-auto pt-5 text-xs font-bold text-violet-300 opacity-75 transition group-hover:opacity-100">Otwórz →</div>
            </div>
          </a>

          {MODULES.map((module) => (
            <ProjectCard key={module.href} {...module} centerContent />
          ))}


                    {/* SF_TILE_MATRIX_V1 */}
          <SfMatrixCard />
        </div>
      </div>
    </div>
  );
}
