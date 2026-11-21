// #324-L01-B · interchangeable presentations of an already stored draw. A presenter receives the stored result
// (`target`) and the results still in the pool; it only animates towards that result and never chooses anything.
// Timing comes from the caller; with reduced motion (or the fast presenter) the result appears at once.
import { t } from "@/i18n";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

export type PresenterId = "kolo" | "szybko" | "karty" | "automat" | "skan" | "kule";
export type PresenterStatus = "PROTOTYPE" | "TESTED" | "STABLE_CANDIDATE" | "STABLE";

export const DRAW_PRESENTERS: { id: PresenterId; label: string; status: PresenterStatus; description: string }[] = [
  { id: "kolo", get label() { return t("drawPresenters.kolo"); }, status: "STABLE", get description() { return t("drawPresenters.kolo_z_pozostalymi_wynikami_zatrzymuje"); } },
  { id: "szybko", get label() { return t("drawPresenters.szybkie_odsloniecie"); }, status: "STABLE", get description() { return t("drawPresenters.bez_animacji_wynik_od_razu"); } },
  { id: "karty", get label() { return t("drawPresenters.karty"); }, status: "STABLE_CANDIDATE", get description() { return t("drawPresenters.zakryte_karty_odwraca_sie_ta"); } },
  { id: "automat", label: "Automat", status: "STABLE_CANDIDATE", get description() { return t("drawPresenters.beben_przewija_wyniki_i_staje"); } },
  { id: "skan", label: "Skan", status: "STABLE_CANDIDATE", get description() { return t("drawPresenters.podswietlenie_przebiega_liste_i_zwalnia"); } },
  { id: "kule", get label() { return t("drawPresenters.kule"); }, status: "TESTED", get description() { return t("drawPresenters.kule_w_bebnie_wypada_ta"); } },
];

/** Presenters offered in real tournaments: stable ones and candidates; the rest stays in the Laboratory. */
export const TOURNAMENT_PRESENTERS = DRAW_PRESENTERS.filter((p) => p.status === "STABLE" || p.status === "STABLE_CANDIDATE");

const PRESENTER_KEY = "seeding-ceremony-presenter-v1";
export function loadPresenter(fallback: PresenterId = "kolo"): PresenterId {
  try {
    const value = localStorage.getItem(PRESENTER_KEY);
    return TOURNAMENT_PRESENTERS.some((p) => p.id === value) ? (value as PresenterId) : fallback;
  } catch {
    return fallback;
  }
}
export function savePresenter(id: PresenterId): void {
  try { localStorage.setItem(PRESENTER_KEY, id); } catch { /* the choice is only a browser preference */ }
}

export interface PresenterFrame {
  /** Results still in the pool, the target included (seed numbers or placement labels). */
  pool: string[];
  /** The stored result being shown; null before the first reveal. */
  target: string | null;
  /** Who receives it (shown next to the result). */
  subject: string | null;
  running: boolean;
  durationMs: number;
  /** Changes with every reveal, so an animation restarts even for a repeated label. */
  drawKey: number;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    const update = () => setReduced(query.matches);
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

/** The pool shown by a presenter: at most `limit` entries, always including the target. */
export function presenterPool(pool: readonly string[], target: string | null, limit: number): string[] {
  if (pool.length <= limit) return [...pool];
  const head = pool.slice(0, limit);
  if (target == null || head.includes(target)) return head;
  return [...pool.slice(0, limit - 1), target];
}

export function DrawPresenter({ id, frame }: { id: PresenterId; frame: PresenterFrame }) {
  const reduced = usePrefersReducedMotion();
  const effective = reduced || id === "szybko" ? { ...frame, running: false, durationMs: 0 } : frame;
  return (
    <div className="draw-presenter" data-presenter={id} data-running={effective.running || undefined} data-testid="draw-presenter">
      {id === "kolo" && <WheelPresenter frame={effective} />}
      {id === "szybko" && <FastPresenter frame={effective} />}
      {id === "karty" && <CardsPresenter frame={effective} />}
      {id === "automat" && <SlotPresenter frame={effective} />}
      {id === "skan" && <ScanPresenter frame={effective} />}
      {id === "kule" && <BallsPresenter frame={effective} />}
      {/* The same stored result in words for every presenter (screen readers, and a check that renderers agree). */}
      <p className="sr-only" aria-live="polite" data-testid="draw-presenter-result">
        {!effective.running && effective.target ? `${effective.subject ? `${effective.subject}: ` : ""}${effective.target}` : ""}
      </p>
    </div>
  );
}

// ── Koło ──────────────────────────────────────────────────────────────────────

export function Wheel({ options, rotation, spinning, animDuration }: { options: string[]; rotation: number; spinning: boolean; animDuration: number }) {
  const visible = options.slice(0, 32);
  const count = visible.length;
  const fontSize = count <= 12 ? 11 : count <= 20 ? 10 : count <= 26 ? 9 : 8;
  const maxChars = count <= 16 ? 12 : count <= 24 ? 9 : 7;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[360px]" aria-label={t("drawPresenters.kolo_losowania_pozostalo_length_wynikow", { length: options.length })}>
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1 border-x-[12px] border-t-[22px] border-x-transparent border-t-primary" />
      <svg viewBox="0 0 320 320" className="h-full w-full drop-shadow-sm" role="img" aria-label={t("drawPresenters.animowane_kolo_dostepnych_wynikow")}>
        <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "160px 160px", transition: spinning ? `transform ${animDuration.toFixed(2)}s cubic-bezier(.12,.7,.08,1)` : "none" }}>
          <circle cx="160" cy="160" r="148" className="fill-muted stroke-border" strokeWidth="2" />
          {visible.map((option, index) => {
            const angle = (360 / Math.max(count, 1)) * index;
            const radians = ((angle - 90) * Math.PI) / 180;
            const x = 160 + Math.cos(radians) * 112;
            const y = 160 + Math.sin(radians) * 112;
            const labelRotation = angle <= 180 ? angle - 90 : angle + 90;
            const label = option.length > maxChars ? `${option.slice(0, maxChars - 1)}…` : option;
            return (
              <g key={`${option}-${index}`}>
                <line x1="160" y1="160" x2={160 + Math.cos(radians) * 148} y2={160 + Math.sin(radians) * 148} className="stroke-border" strokeWidth="1" />
                <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-foreground font-semibold" style={{ fontSize: `${fontSize}px` }} transform={`rotate(${labelRotation}, ${x}, ${y})`}>{label}</text>
              </g>
            );
          })}
          <circle cx="160" cy="160" r="42" className="fill-background stroke-primary" strokeWidth="3" />
          <text x="160" y="155" textAnchor="middle" className="fill-foreground text-[14px] font-bold">{options.length}</text>
          <text x="160" y="174" textAnchor="middle" className="fill-muted-foreground text-[10px]">{t("drawPresenters.pozostalo")}</text>
        </g>
      </svg>
    </div>
  );
}

/** The wheel driven only by the frame: the angle is a function of the draw and the target, so a replay lands the same. */
function WheelPresenter({ frame }: { frame: PresenterFrame }) {
  const options = presenterPool(frame.pool, frame.target, 32);
  const index = frame.target == null ? 0 : Math.max(0, options.indexOf(frame.target));
  const rotation = frame.drawKey * 4 * 360 + (360 - (360 / Math.max(1, options.length)) * index);
  return <Wheel options={options} rotation={rotation} spinning={frame.running} animDuration={frame.durationMs / 1000} />;
}

// ── Szybkie odsłonięcie ─────────────────────────────────────────────────────────

function ResultCard({ frame }: { frame: PresenterFrame }) {
  return (
    <div className="mx-auto max-w-sm rounded-xl border bg-card p-6 text-center shadow-sm" data-testid="draw-presenter-card">
      <p className="text-sm text-muted-foreground">{frame.subject ?? t("drawPresenters.wynik_losowania")}</p>
      <p className="mt-1 text-3xl font-black">{frame.target ?? "—"}</p>
    </div>
  );
}
function FastPresenter({ frame }: { frame: PresenterFrame }) {
  return <ResultCard frame={frame} />;
}

// ── Karty ─────────────────────────────────────────────────────────────────────

function CardsPresenter({ frame }: { frame: PresenterFrame }) {
  const cards = presenterPool(frame.pool, frame.target, 16);
  const flipAt = Math.round(frame.durationMs * 0.75);
  const style = { "--flip-delay": `${flipAt}ms` } as CSSProperties;
  return (
    <div className="draw-cards mx-auto grid max-w-md grid-cols-4 gap-2" style={style} key={frame.drawKey} aria-label={t("drawPresenters.talia_length_zakrytych_kart", { length: cards.length })}>
      {cards.map((label, index) => {
        const chosen = label === frame.target;
        return (
          <div key={`${label}-${index}`} className="draw-card" data-chosen={chosen || undefined} data-revealed={chosen && !frame.running ? true : undefined}>
            <div className="draw-card-inner">
              <span className="draw-card-back" aria-hidden="true">?</span>
              <span className="draw-card-front">{label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Automat ───────────────────────────────────────────────────────────────────

function SlotPresenter({ frame }: { frame: PresenterFrame }) {
  const items = presenterPool(frame.pool, frame.target, 24);
  const reel = useMemo(() => {
    const target = frame.target ?? items[0] ?? "—";
    // three passes of the pool, then the stored result in the window
    return [...items, ...items, ...items, target];
  }, [items.join("|"), frame.target]);
  const [settled, setSettled] = useState(!frame.running);
  useEffect(() => {
    if (!frame.running) { setSettled(true); return; }
    setSettled(false);
    const raf = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(raf);
  }, [frame.drawKey, frame.running]);
  const rowRem = 3;
  const offset = settled ? (reel.length - 1) * rowRem : 0;
  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-xl border bg-card shadow-inner" style={{ height: `${rowRem}rem` }} aria-label={t("drawPresenters.beben_automatu")}>
      <ol key={frame.drawKey} style={{ transform: `translateY(-${offset}rem)`, transition: frame.running && settled ? `transform ${frame.durationMs}ms cubic-bezier(.1,.75,.12,1)` : "none" }}>
        {reel.map((label, index) => (
          <li key={index} className="flex items-center justify-center text-2xl font-black" style={{ height: `${rowRem}rem` }}
            data-final={index === reel.length - 1 || undefined}>{label}</li>
        ))}
      </ol>
    </div>
  );
}

// ── Skan ──────────────────────────────────────────────────────────────────────

/** Highlight steps: a few rounds through the list, slowing down, ending on the target. Deterministic for a draw. */
export function scanSchedule(length: number, targetIndex: number, durationMs: number): number[] {
  if (length <= 0 || durationMs <= 0) return [];
  const steps = length * 2 + Math.max(0, targetIndex) + 1;
  const weights = Array.from({ length: steps }, (_, i) => 1 + (i / steps) ** 3 * 8);
  const total = weights.reduce((a, b) => a + b, 0);
  let at = 0;
  return weights.map((w) => (at += (w / total) * durationMs));
}

function ScanPresenter({ frame }: { frame: PresenterFrame }) {
  const items = presenterPool(frame.pool, frame.target, 24);
  const targetIndex = frame.target == null ? -1 : items.indexOf(frame.target);
  const [active, setActive] = useState(frame.running ? 0 : targetIndex);
  useEffect(() => {
    if (!frame.running) { setActive(targetIndex); return; }
    const times = scanSchedule(items.length, targetIndex, frame.durationMs);
    const timers = times.map((at, step) => setTimeout(() => setActive(step % Math.max(1, items.length)), at));
    return () => timers.forEach(clearTimeout);
  }, [frame.drawKey, frame.running, targetIndex, items.length, frame.durationMs]);
  return (
    <ol className="mx-auto grid max-w-md grid-cols-2 gap-1.5 sm:grid-cols-3" aria-label={t("drawPresenters.lista_wynikow")}>
      {items.map((label, index) => (
        <li key={`${label}-${index}`} className="rounded-md border px-2 py-2 text-center text-sm font-semibold transition-colors"
          data-active={index === active || undefined} data-chosen={!frame.running && index === targetIndex ? true : undefined}>{label}</li>
      ))}
    </ol>
  );
}

// ── Kule ──────────────────────────────────────────────────────────────────────

/** A ball has room for a few characters: the number(s) of the result ("Seed 3" → "3"), otherwise its start. */
export function ballText(label: string): string {
  const numbers = label.match(/\d+/g);
  return numbers ? numbers.join("·") : label.slice(0, 3);
}

function BallsPresenter({ frame }: { frame: PresenterFrame }) {
  const balls = presenterPool(frame.pool, frame.target, 20);
  return (
    <div className="mx-auto max-w-md space-y-3" key={frame.drawKey}>
      <div className="draw-drum relative mx-auto flex aspect-square w-48 flex-wrap content-center justify-center gap-1 rounded-full border-4 bg-muted/40 p-4" data-running={frame.running || undefined}>
        {balls.filter((label) => frame.running || label !== frame.target).map((label, index) => (
          <span key={`${label}-${index}`} className="draw-ball" style={{ "--i": index } as CSSProperties} title={label} aria-label={label}>{ballText(label)}</span>
        ))}
      </div>
      {!frame.running && frame.target && <div className="draw-ball draw-ball--out mx-auto" data-testid="draw-ball-out">{frame.target}</div>}
    </div>
  );
}
