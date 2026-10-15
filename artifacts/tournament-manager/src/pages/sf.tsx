import { useEffect, useState } from "react";
import { Link } from "wouter";

const MATRIX_GLYPHS =
  "0123456789ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ";

function randomMatrixText(length: number) {
  return Array.from({ length }, () =>
    MATRIX_GLYPHS[Math.floor(Math.random() * MATRIX_GLYPHS.length)]
  ).join("");
}

export default function SfPage() {
  const [signal, setSignal] = useState(() => randomMatrixText(24));
  const [iconGlyph, setIconGlyph] = useState(() => randomMatrixText(1));
  const [glitching, setGlitching] = useState(false);
  const [frame, setFrame] = useState(0);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 997));

  useEffect(() => {
    let frameTimer: number | undefined;
    let settleTimer: number | undefined;

    const runGlitch = () => {
      setGlitching(true);
      setSeed(Math.floor(Math.random() * 997));

      let nextFrame = 0;
      frameTimer = window.setInterval(() => {
        nextFrame += 1;
        setFrame(nextFrame);
        setSignal(randomMatrixText(24));
        setIconGlyph(randomMatrixText(1));

        if (nextFrame >= 18) {
          if (frameTimer !== undefined) {
            window.clearInterval(frameTimer);
            frameTimer = undefined;
          }

          settleTimer = window.setTimeout(() => {
            setSignal(randomMatrixText(24));
            setIconGlyph(randomMatrixText(1));
            setFrame(0);
            setGlitching(false);
          }, 220);
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

  const ghost = 1 + ((seed + frame) % 2);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground dark">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(34,211,238,.07),transparent_26%),radial-gradient(circle_at_74%_32%,rgba(244,63,94,.035),transparent_22%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="rounded-lg border border-border/80 bg-card/55 px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-cyan-300/40 hover:text-foreground"
          >
            ← Projekty
          </Link>

          <div className="font-mono text-[10px] tracking-[0.18em] text-cyan-300/45">
            {signal.slice(0, 8)}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <section className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-border/90 bg-card/90 px-6 py-12 shadow-[0_26px_90px_rgba(0,0,0,.28)] sm:px-10 sm:py-16">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/12 via-transparent to-fuchsia-500/[0.025]" />
            <div className="absolute left-8 top-0 h-1.5 w-24 rounded-b-lg bg-cyan-400/65" />

            {glitching && (
              <>
                <div
                  className="pointer-events-none absolute inset-x-0 h-px bg-cyan-200/65 mix-blend-screen"
                  style={{ top: (16 + ((seed + frame * 17) % 68)) + "%" }}
                />
                <div
                  className="pointer-events-none absolute inset-x-0 h-[2px] bg-fuchsia-400/30 mix-blend-screen"
                  style={{ top: (22 + ((seed + frame * 23) % 60)) + "%" }}
                />
                <div
                  className="pointer-events-none absolute left-0 right-0 h-[8px] bg-cyan-100/[0.035] mix-blend-screen"
                  style={{
                    top: (10 + ((seed + frame * 31) % 78)) + "%",
                    transform: "translateX(" + (((seed + frame * 19) % 9) - 4) + "px)",
                  }}
                />
              </>
            )}

            <div className="relative flex flex-col items-center text-center">
              <div className="mb-7 grid h-14 w-14 place-items-center rounded-2xl border border-border bg-background/70 shadow-inner">
                <span
                  aria-hidden="true"
                  className="font-mono text-2xl font-black text-cyan-200"
                  style={{
                    transform: glitching
                      ? "translateX(" + (((seed + frame * 3) % 3) - 1) + "px)"
                      : undefined,
                    textShadow: glitching
                      ? "-1px 0 rgba(34,211,238,.7), 1px 0 rgba(232,121,249,.45)"
                      : "0 0 12px rgba(103,232,249,.2)",
                  }}
                >
                  {iconGlyph}
                </span>
              </div>

              <div className="relative">
                {glitching && (
                  <>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 text-5xl font-black tracking-[0.32em] text-cyan-300/55 sm:text-6xl"
                      style={{ transform: "translateX(" + (-ghost) + "px)" }}
                    >
                      SF
                    </span>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 text-5xl font-black tracking-[0.32em] text-fuchsia-300/40 sm:text-6xl"
                      style={{ transform: "translateX(" + ghost + "px)" }}
                    >
                      SF
                    </span>
                  </>
                )}

                <h1 className="relative text-5xl font-black tracking-[0.32em] sm:text-6xl">
                  SF
                </h1>
              </div>

              <div className="relative mt-7 max-w-full overflow-hidden">
                {glitching && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 whitespace-nowrap font-mono text-sm tracking-[0.16em] text-fuchsia-300/35"
                    style={{ transform: "translateX(" + ghost + "px)" }}
                  >
                    {signal}
                  </span>
                )}

                <div className="relative whitespace-nowrap font-mono text-sm tracking-[0.16em] text-cyan-200/65">
                  {signal}
                </div>
              </div>

              <div className="mt-8 h-px w-28 bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />

              <p className="mt-6 max-w-xl text-sm leading-6 text-muted-foreground">
                Interfejs projektu SF.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
