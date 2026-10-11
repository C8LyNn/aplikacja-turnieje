import type { EffectTriggerEvent } from "../core/types";

export type StressScenario = "steady" | "burst" | "chat-flood";
export interface StressEvent {
  atMs: number;
  listener: EffectTriggerEvent;
  amount: number;
}
export interface FrameAssessment {
  samples: number;
  approximateFps: number | null;
  p95FrameMs: number | null;
  slowFramesPercent: number | null;
  status: "insufficient" | "ok" | "warning";
}
/** Fixed, deterministic traffic models. They NEVER contain viewer identifiers. */
const TRAFFIC: Record<StressScenario, readonly { event: EffectTriggerEvent; everyMs: number; amount: number; startMs: number }[]> = {
  steady: [
    { event: "message", everyMs: 1100, amount: 0, startMs: 600 },
    { event: "follower-latest", everyMs: 3500, amount: 0, startMs: 1700 },
    { event: "tip-latest", everyMs: 9000, amount: 50, startMs: 4500 },
  ],
  burst: [
    { event: "message", everyMs: 330, amount: 0, startMs: 1700 },
    { event: "follower-latest", everyMs: 1100, amount: 0, startMs: 2100 },
    { event: "tip-latest", everyMs: 2600, amount: 100, startMs: 3700 },
    { event: "raid-latest", everyMs: 11000, amount: 75, startMs: 5500 },
  ],
  "chat-flood": [
    { event: "message", everyMs: 80, amount: 0, startMs: 500 },
    { event: "follower-latest", everyMs: 700, amount: 0, startMs: 1400 },
    { event: "tip-latest", everyMs: 3000, amount: 250, startMs: 2800 },
    { event: "cheer-latest", everyMs: 6500, amount: 300, startMs: 3900 },
  ],
};

export function makeStressEvents(scenario: StressScenario, durationMs = 12000): StressEvent[] {
  const limit = Number.isFinite(durationMs) ? Math.max(1000, Math.min(60000, durationMs)) : 12000;
  const traffic = TRAFFIC[scenario] ?? TRAFFIC.steady;
  const events: StressEvent[] = [];
  for (const spec of traffic) {
    for (let atMs = spec.startMs; atMs < limit && events.length < 900; atMs += spec.everyMs) {
      events.push({ atMs, listener: spec.event, amount: spec.amount });
    }
  }
  const order: EffectTriggerEvent[] = ["tip-latest", "cheer-latest", "raid-latest", "subscriber-latest", "follower-latest", "message"];
  events.sort((a, b) => a.atMs - b.atMs || order.indexOf(a.listener) - order.indexOf(b.listener));
  return events.slice(0, 900);
}

/** rAF measurement only: timing gaps can be caused by scheduling or tab
 * throttling and are NOT equivalent to GPU frame-render durations. */
export function assessFrames(intervals: readonly number[]): FrameAssessment {
  const samples = intervals.filter((x) => Number.isFinite(x) && x > 0 && x <= 1000);
  if (samples.length < 20) return { samples: samples.length, approximateFps: null, p95FrameMs: null, slowFramesPercent: null, status: "insufficient" };
  const sorted = [...samples].sort((a, b) => a - b);
  const median = sorted[Math.floor((sorted.length - 1) / 2)];
  const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1];
  const slow = sorted.filter((value) => value > 33.34).length;
  return {
    samples: samples.length,
    approximateFps: Math.round(1000 / median),
    p95FrameMs: Math.round(p95 * 10) / 10,
    slowFramesPercent: Math.round((slow / samples.length) * 100),
    status: p95 > 50 || slow / samples.length > 0.15 ? "warning" : "ok",
  };
}

export interface StressSummary {
  total: number;
  dispatched: number;
  durationMs: number;
  waitingPeak: number;
  dropped: number;
  evicted: number;
  accepted: number;
  frame: FrameAssessment;
  warnings: string[];
}
/** Comparison is heuristic, not an objective benchmark across machines. */
export function summarizeStress(input: Omit<StressSummary, "warnings">): StressSummary {
  const warnings: string[] = [];
  if (input.dispatched < input.total) warnings.push("Test nie przetworzył wszystkich zaplanowanych zdarzeń.");
  if (input.waitingPeak >= 14) warnings.push("Kolejka zbliżała się do limitu 16 oczekujących alertów.");
  if (input.dropped > 0) warnings.push("Odrzucono " + input.dropped + " wyzwolenia (np. cooldown, próg lub przepełnienie).");
  if (input.evicted > 0) warnings.push("Wyparcie niższego priorytetu: " + input.evicted + ".");
  if (input.frame.status === "warning") warnings.push("Zaobserwowano nieregularny rytm requestAnimationFrame (nie jest to pomiar GPU).");
  if (input.frame.status === "insufficient") warnings.push("Zbyt mało próbek requestAnimationFrame do oceny płynności.");
  if (!warnings.length) warnings.push("Brak przekroczeń ustawionych progów w tej próbie.");
  return { ...input, warnings };
}
