// #326-C · Laboratorium: a separate place for experiments on demo data. It is not the Modern ("Experimental")
// tournament view and it never touches a real tournament: nothing here sends a request or writes anything.
// Promising variants can later move into tournament features as interchangeable presenters (by status).
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { FlaskConical, LogOut, RotateCcw, SkipForward, StepForward } from "lucide-react";
import { ModuleHeader, ModuleShell } from "@/components/portfolio-ui";
import { DRAW_PRESENTERS, DrawPresenter, type PresenterId, type PresenterStatus } from "@/components/draw-presenters";

export const STATUS_INFO: Record<PresenterStatus, { label: string; description: string; className: string }> = {
  PROTOTYPE: { label: "PROTOTYPE", description: "Pomysł do obejrzenia; bez gwarancji i bez połączenia z turniejem.", className: "border-amber-500/50 text-amber-400" },
  TESTED: { label: "TESTED", description: "Przetestowany automatycznie; tylko w Laboratorium.", className: "border-sky-500/50 text-sky-400" },
  STABLE_CANDIDATE: { label: "STABLE_CANDIDATE", description: "Przetestowany i dostępny w turniejach jako „nowy” — do oceny przed uznaniem za stabilny.", className: "border-violet-500/50 text-violet-300" },
  STABLE: { label: "STABLE", description: "Stabilna część aplikacji.", className: "border-emerald-500/50 text-emerald-400" },
};

export interface LabExperiment {
  id: string;
  title: string;
  status: PresenterStatus;
  description: string;
  /** In-page module, or a link to a standalone experiment. */
  href?: string;
  note?: string;
}

export const LAB_EXPERIMENTS: LabExperiment[] = [
  { id: "losowania", title: "Prezentacje losowań", status: "STABLE_CANDIDATE", description: "Porównanie prezenterów na tym samym zapisanym wyniku demonstracyjnym." },
  { id: "kolo-v19", title: "Koło v19 (HTML)", status: "PROTOTYPE", href: "/randomizers/prototypes/wheel", description: "Samodzielny prototyp; losuje lokalnie w przeglądarce.", note: "Nie zapisuje wyniku i nie łączy się z turniejem." },
  { id: "marble-v24", title: "Marble / Pinball v24 (HTML)", status: "PROTOTYPE", href: "/randomizers/prototypes/pinball", description: "Fizyka kulek; wynik wynika z symulacji.", note: "Nie da się go jeszcze wiernie podpiąć pod zapisany wynik — zostaje prototypem." },
  { id: "talia-v8", title: "Talia kart v8 (HTML)", status: "PROTOTYPE", href: "/randomizers/prototypes/cards", description: "Fizyczna manipulacja talią.", note: "Losuje lokalnie; bez zapisu." },
  { id: "draw-lab", title: "Draw Lab — losowanie kart", status: "PROTOTYPE", href: "/randomizers/cards", description: "Rozbudowany silnik kart.", note: "Niezależny od turniejów." },
  { id: "alerty", title: "Alerty na wizji (nakładka OBS)", status: "TESTED", description: "Koniec meczu, awans, nowy etap, zwycięzca — z prawdziwych zmian wyników.", note: "Działa na danych publicznych turnieju: Więcej → Transmisja (domyślnie wyłączone)." },
  { id: "kamerka", title: "Kamerka z czatem", status: "PROTOTYPE", href: "/stream", description: "Układ kamerki i czatu do OBS.", note: "Przykładowe wiadomości; prawdziwy czat tylko przez nieprzetestowany eksport StreamElements." },
];

/** Demo participants and their stored results: fixed, so every presenter and every replay shows the same. */
export const DEMO_DRAWS: { subject: string; result: string }[] = [
  { subject: "Ala", result: "Seed 3" }, { subject: "Bartek", result: "Seed 7" }, { subject: "Celina", result: "Seed 1" },
  { subject: "Darek", result: "Seed 5" }, { subject: "Ewa", result: "Seed 8" }, { subject: "Filip", result: "Seed 2" },
  { subject: "Gosia", result: "Seed 6" }, { subject: "Henryk", result: "Seed 4" },
];

const presenterIds = new Set(DRAW_PRESENTERS.map((p) => p.id));
const pickPresenter = (value: string | null, fallback: PresenterId): PresenterId => (value && presenterIds.has(value as PresenterId) ? (value as PresenterId) : fallback);

function StatusBadge({ status }: { status: PresenterStatus }) {
  const info = STATUS_INFO[status];
  return <span className={`rounded-full border px-2 py-0.5 text-[0.7rem] font-bold tracking-wide ${info.className}`} title={info.description}>{info.label}</span>;
}

/** Same demo draw for two presenters side by side; "next" only steps through the stored list — nothing is drawn. */
function DrawComparison({ a, b, onChange }: { a: PresenterId; b: PresenterId; onChange: (side: "a" | "b", id: PresenterId) => void }) {
  const [revealed, setRevealed] = useState(0);
  const [running, setRunning] = useState(false);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const durationMs = 3200;
  const current = revealed > 0 ? DEMO_DRAWS[revealed - 1] : null;
  const pool = useMemo(() => DEMO_DRAWS.slice(Math.max(0, revealed - (running ? 1 : 0))).map((d) => d.result)
    .concat(!running && current ? [current.result] : []), [revealed, running, current]);
  const finish = () => { if (timer) clearTimeout(timer); setTimer(null); setRunning(false); };
  useEffect(() => () => { if (timer) clearTimeout(timer); }, [timer]);
  const next = () => {
    if (running || revealed >= DEMO_DRAWS.length) return;
    setRevealed((n) => n + 1);
    setRunning(true);
    setTimer(setTimeout(() => { setRunning(false); setTimer(null); }, durationMs + 100));
  };
  const restart = () => { finish(); setRevealed(0); };
  const frame = { pool: [...new Set(pool)], target: current?.result ?? null, subject: current?.subject ?? null, running, durationMs, drawKey: revealed };
  return (
    <section aria-labelledby="lab-draws" className="space-y-4" data-testid="lab-draw-comparison">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="lab-draws" className="text-lg font-semibold">Prezentacje losowań — porównanie</h2>
        <p className="text-sm text-muted-foreground" data-testid="lab-stored-result">
          Zapisany wynik demonstracyjny: {current ? <strong>{current.subject} → {current.result}</strong> : "—"} ({revealed} z {DEMO_DRAWS.length})
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 font-medium text-primary-foreground disabled:opacity-50" onClick={next} disabled={running || revealed >= DEMO_DRAWS.length}>
          <StepForward className="h-4 w-4" aria-hidden />Ujawnij kolejny
        </button>
        <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-md border px-4 disabled:opacity-50" onClick={finish} disabled={!running}>
          <SkipForward className="h-4 w-4" aria-hidden />Pokaż wynik od razu
        </button>
        <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-md border px-4" onClick={restart}>
          <RotateCcw className="h-4 w-4" aria-hidden />Od początku (ten sam wynik)
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {(["a", "b"] as const).map((side) => {
          const id = side === "a" ? a : b;
          const info = DRAW_PRESENTERS.find((p) => p.id === id)!;
          return (
            <div key={side} className="space-y-3 rounded-xl border p-4" data-testid={`lab-pane-${side}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Wariant {side === "a" ? "A" : "B"}</span>
                  <select className="min-h-11 rounded-md border bg-background px-2" value={id} disabled={running}
                    onChange={(event) => onChange(side, event.target.value as PresenterId)} aria-label={`Wariant ${side === "a" ? "A" : "B"}`}>
                    {DRAW_PRESENTERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </label>
                <StatusBadge status={info.status} />
              </div>
              <p className="text-xs text-muted-foreground">{info.description}</p>
              <DrawPresenter id={id} frame={frame} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function LaboratoryPage() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);
  const selected = LAB_EXPERIMENTS.find((e) => e.id === params.get("eksperyment")) ?? LAB_EXPERIMENTS[0];
  const a = pickPresenter(params.get("a"), "kolo");
  const b = pickPresenter(params.get("b"), "karty");
  const go = (patch: Record<string, string>) => {
    const next = new URLSearchParams(search);
    for (const [key, value] of Object.entries(patch)) next.set(key, value);
    navigate(`/laboratorium?${next.toString()}`, { replace: true });
  };
  return (
    <ModuleShell wide>
      <ModuleHeader code="LAB" title="Laboratorium" accent="blue" status="Dane demonstracyjne"
        description="Eksperymenty, prototypy i warianty prezentacji — osobno od turniejów. Nic tutaj nie zmienia prawdziwych danych ani wyników." />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed p-3 text-sm" role="note" data-testid="lab-safety">
        <span className="flex items-center gap-2"><FlaskConical className="h-4 w-4 text-primary" aria-hidden />
          Laboratorium działa na danych demonstracyjnych i nie wysyła zapisów. Widok Nowoczesny turnieju to nie Laboratorium — to pełny interfejs turnieju.
        </span>
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 font-medium"><LogOut className="h-4 w-4" aria-hidden />Wyjdź z Laboratorium</Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <nav aria-label="Katalog eksperymentów">
          <ul className="space-y-2" data-testid="lab-catalog">
            {LAB_EXPERIMENTS.map((experiment) => (
              <li key={experiment.id}>
                <button type="button" className="w-full rounded-lg border p-3 text-left data-[selected]:border-primary data-[selected]:bg-primary/5"
                  data-selected={experiment.id === selected.id || undefined} aria-current={experiment.id === selected.id ? "true" : undefined}
                  onClick={() => go({ eksperyment: experiment.id })} data-experiment={experiment.id}>
                  <span className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">{experiment.title}</span><StatusBadge status={experiment.status} /></span>
                  <span className="mt-1 block text-xs text-muted-foreground">{experiment.description}</span>
                </button>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 text-xs text-muted-foreground" aria-label="Znaczenie oznaczeń">
            {(Object.keys(STATUS_INFO) as PresenterStatus[]).map((status) => (
              <div key={status}><dt className="inline"><StatusBadge status={status} /></dt> <dd className="inline">{STATUS_INFO[status].description}</dd></div>
            ))}
          </dl>
        </nav>
        <section className="min-w-0 space-y-4" data-testid="lab-detail" aria-label="Wybrany eksperyment">
          {selected.id === "losowania" ? (
            <DrawComparison a={a} b={b} onChange={(side, id) => go({ [side]: id })} />
          ) : (
            <section className="space-y-3 rounded-xl border p-5" aria-labelledby="lab-experiment-title">
              <div className="flex flex-wrap items-center gap-2"><h2 id="lab-experiment-title" className="text-lg font-semibold">{selected.title}</h2><StatusBadge status={selected.status} /></div>
              <p>{selected.description}</p>
              {selected.note && <p className="text-sm text-muted-foreground">{selected.note}</p>}
              {selected.href && <Link href={selected.href} className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 font-medium text-primary-foreground">Otwórz eksperyment</Link>}
            </section>
          )}
        </section>
      </div>
    </ModuleShell>
  );
}
