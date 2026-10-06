import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useSfSignal, type SfSignal } from "./use-sf-signal";
import { useSfCardSignal, type SfCardSignal } from "./use-sf-card-signal";
import "./sf-glitch.css";
import "./sf-card-glitch.css";

function stateOf(s: SfSignal) {
  return s.glitching && !s.reducedMotion ? "glitch" : "idle";
}

export function SfGlitchText({ text, className = "", testId, decorative = true }: { text: string; className?: string; testId?: string; decorative?: boolean }) {
  return (
    <span className={`sf-fx ${className}`}>
      <span data-testid={testId} aria-hidden={decorative || undefined}>{text}</span>
      <span className="sf-fx__ghost sf-fx__ghost--c" aria-hidden="true">{text}</span>
      <span className="sf-fx__ghost sf-fx__ghost--m" aria-hidden="true">{text}</span>
    </span>
  );
}

/** Landing tile: same icon/title/description/footer layout as ProjectCard, stable box. */
export function SfCard({ signal }: { signal?: SfCardSignal }) {
  const own = useSfCardSignal();
  const s = signal ?? own;
  return (
    <Link
      href="/sf"
      aria-label="SF"
      data-testid="card-sf"
      data-state={stateOf(s)}
      data-cycle={s.cycle}
      data-frame={s.frame}
      data-seed={s.seed}
      data-phase={s.settling ? "settling" : "frames"}
      style={s.vars as React.CSSProperties}
      className="sf-card group relative min-h-[205px] overflow-hidden rounded-2xl border border-border bg-card p-5 hover:border-cyan-500/45"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent" />
      <div className="absolute left-5 top-0 h-1.5 w-16 rounded-b-lg bg-cyan-500/55" />
      <div className="sf-card__scanline sf-card__scanline--cyan" aria-hidden="true" />
      <div className="sf-card__scanline sf-card__scanline--fuchsia" aria-hidden="true" />
      <div className="sf-card__wash" aria-hidden="true" />
      <div className="sf-card__slice" aria-hidden="true" />
      <div className="relative flex h-full flex-col items-start text-left">
        <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl border border-border bg-background/65 font-mono text-lg font-bold text-cyan-400">
          <span className="sf-card__glyph inline-block" data-testid="text-sf-glyph" aria-hidden="true">{s.glyph}</span>
        </div>
        <h2 className="mt-1 text-lg font-bold leading-tight" data-testid="text-sf-title">
          <SfGlitchText text="SF" className="sf-card__title" decorative={false} />
        </h2>
        <p className="mt-2 break-all font-mono text-sm leading-5 text-muted-foreground">
          <SfGlitchText text={s.signal} className="sf-card__signal" testId="text-sf-signal" />
        </p>
        <div className="mt-auto pt-5 font-mono text-xs font-bold text-cyan-400 opacity-75 group-hover:opacity-100">
          <span className="sf-fx sf-card__footer">
            <span data-testid="text-sf-footer" aria-hidden="true">{s.footer}</span>
            <span className="sf-fx__ghost sf-fx__ghost--m" aria-hidden="true">{s.footer}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

/** /sf page panel. */
export function SfPanel() {
  const s = useSfSignal();
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background px-4 py-8 text-foreground dark">
      <div className="w-full max-w-xl">
        <Link
          href="/"
          data-testid="link-back-projects"
          className="mb-4 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <ArrowLeft className="h-4 w-4" /> Wszystkie projekty
        </Link>
        <section
          data-testid="panel-sf"
          data-state={stateOf(s)}
          data-cycle={s.cycle}
          style={s.vars as React.CSSProperties}
          className="sf-root relative flex min-h-[360px] flex-col items-center justify-center gap-6 overflow-hidden rounded-2xl border border-border bg-card p-8 text-center"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent" />
          <div className="sf-scan" aria-hidden="true" />
          <div className="sf-slice-shift relative flex flex-col items-center gap-6">
            <div className="grid h-16 w-16 place-items-center rounded-2xl border border-border bg-background/65 font-mono text-3xl font-bold text-cyan-400">
              <SfGlitchText text={s.glyph} testId="text-sf-glyph" />
            </div>
            <h1 className="text-7xl font-black tracking-[0.2em] sm:text-8xl" data-testid="text-sf-title">
              <SfGlitchText text="SF" decorative={false} />
            </h1>
            <p className="break-all font-mono text-sm text-muted-foreground">
              <SfGlitchText text={s.signal} testId="text-sf-signal" />
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
