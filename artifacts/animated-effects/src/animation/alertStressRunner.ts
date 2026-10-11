import type { EffectInstance } from "../core/types";
import { triggerPlaybackDurationMs } from "./triggers";
import { AlertDiagnosticEngine, type DiagnosticAlert } from "./alertDiagnosticEngine";
import { assessFrames, makeStressEvents, summarizeStress, type StressScenario, type StressSummary } from "./alertStress";
import { parseAlertTrace, type AlertTrace } from "./alertTrace";

export interface StressUpdate {
  elapsedMs: number;
  durationMs: number;
  dispatched: number;
  planned: number;
  waitingPeak: number;
  currentQueueSize: number;
  status: "running" | "stopped" | "completed" | "hidden";
}
export interface StressCallbacks {
  onPlay(alert: DiagnosticAlert): void;
  onProgress(update: StressUpdate): void;
  onFinish(summary: StressSummary, status: StressUpdate["status"]): void;
}

/** The timer remains local to the editor, never calls StreamElements.
 * Its requestAnimationFrame instrumentation samples browser scheduling gaps;
 * it does not claim GPU-level render timings.
 */
export class AlertStressRunner {
  private timer: number | null = null;
  private frameId: number | null = null;
  private active = false;
  private scheduled: ReturnType<typeof makeStressEvents> = [];
  private trace: AlertTrace | null = null;
  private eventIndex = 0;
  private startTime = 0;
  private lastProgress = 0;
  private lastFrame: number | null = null;
  private frames: number[] = [];
  private waitingPeak = 0;
  private endOfPlayback = 0;
  private durationMs = 12000;
  private callbacks: StressCallbacks | null = null;
  private effects: EffectInstance[] = [];

  private readonly engine: AlertDiagnosticEngine;

  constructor(engine: AlertDiagnosticEngine) {
    this.engine = engine;
  }

  isRunning(): boolean { return this.active; }
  /** Copy only non-personal synthetic timing, listener and amount fields. */
  getTrace(): AlertTrace | null {
    return this.trace ? parseAlertTrace(this.trace) : null;
  }

  start(scenario: StressScenario, durationMs: number, effects: EffectInstance[], callbacks: StressCallbacks): void {
    const safeDuration = Number.isFinite(durationMs) ? Math.round(Math.max(3000, Math.min(60000, durationMs))) : 12000;
    this.startTrace({
      version: 1,
      source: scenario,
      durationMs: safeDuration,
      events: makeStressEvents(scenario, safeDuration),
    }, effects, callbacks);
  }

  /** Replay exactly the same synthetic schedule, independent of current
   * defaults. It is intentionally NOT a recorder of real viewers or chat. */
  startTrace(input: AlertTrace, effects: EffectInstance[], callbacks: StressCallbacks): void {
    const trace = parseAlertTrace(input);
    this.stop("stopped", false);
    this.engine.reset();
    this.trace = trace;
    this.durationMs = trace.durationMs;
    this.scheduled = trace.events.map((event) => ({ ...event }));
    this.eventIndex = 0;
    this.frames = [];
    this.waitingPeak = 0;
    this.endOfPlayback = 0;
    this.lastProgress = 0;
    this.lastFrame = null;
    this.effects = effects.map((effect) => ({ ...effect, trigger: effect.trigger ? { ...effect.trigger } : undefined }));
    this.callbacks = callbacks;
    this.startTime = performance.now();
    this.active = true;
    this.frameId = requestAnimationFrame((at) => this.sampleFrame(at));
    this.timer = window.setInterval(() => this.tick(), 60);
    this.tick();
  }

  stop(status: StressUpdate["status"] = "stopped", notify = true): void {
    if (!this.active) return;
    const elapsedMs = Math.min(this.durationMs, Math.max(0, performance.now() - this.startTime));
    this.active = false;
    if (this.timer !== null) window.clearInterval(this.timer);
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    this.timer = null;
    this.frameId = null;
    const snapshot = this.engine.getSnapshot();
    if (!notify || !this.callbacks) return;
    const summary = summarizeStress({
      total: this.scheduled.length,
      dispatched: this.eventIndex,
      durationMs: Math.round(elapsedMs),
      waitingPeak: this.waitingPeak,
      dropped: snapshot.counters.dropped,
      evicted: snapshot.counters.evicted,
      accepted: snapshot.counters.accepted,
      frame: assessFrames(this.frames),
    });
    this.callbacks.onFinish(summary, status);
  }

  private sampleFrame(timestamp: number): void {
    if (!this.active) return;
    if (this.lastFrame !== null && this.frames.length < 3000) this.frames.push(timestamp - this.lastFrame);
    this.lastFrame = timestamp;
    this.frameId = requestAnimationFrame((value) => this.sampleFrame(value));
  }

  private tick(): void {
    if (!this.active || !this.callbacks) return;
    if (document.visibilityState === "hidden") {
      this.stop("hidden");
      return;
    }
    const elapsed = performance.now() - this.startTime;
    const bounded = Math.min(elapsed, this.durationMs);
    while (this.eventIndex < this.scheduled.length && this.scheduled[this.eventIndex].atMs <= bounded) {
      const event = this.scheduled[this.eventIndex++];
      // The real widget evaluates cooldown at actual arrival, so do the same.
      const started = this.engine.dispatch(this.effects, event.listener, event.amount, this.startTime + event.atMs);
      for (const item of started) {
        this.callbacks.onPlay(item);
        if (this.engine.getSnapshot().current?.instanceId === item.instanceId) {
          this.endOfPlayback = elapsed + triggerPlaybackDurationMs(item.effect);
        }
      }
      this.waitingPeak = Math.max(this.waitingPeak, this.engine.getSnapshot().waiting.length);
    }
    // Automatically advance only completed queued animations.
    let completed = 0;
    while (this.engine.getSnapshot().current && elapsed >= this.endOfPlayback && completed < 8) {
      const next = this.engine.finishCurrent();
      completed++;
      if (next) {
        this.callbacks.onPlay(next);
        this.endOfPlayback = elapsed + triggerPlaybackDurationMs(next.effect);
      }
    }
    if (elapsed - this.lastProgress >= 480) {
      this.lastProgress = elapsed;
      this.callbacks.onProgress({
        elapsedMs: Math.round(bounded),
        durationMs: this.durationMs,
        dispatched: this.eventIndex,
        planned: this.scheduled.length,
        waitingPeak: this.waitingPeak,
        currentQueueSize: this.engine.getSnapshot().waiting.length,
        status: "running",
      });
    }
    // Stop accepting events at scenario end. The backlog stays inspectable in
    // the diagnostics panel; no fake claim that the queue was drained.
    if (elapsed >= this.durationMs) this.stop("completed");
  }
}
