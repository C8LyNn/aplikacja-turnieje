import type { EffectInstance, EffectTriggerEvent } from "../core/types";
import { matchesEffectTrigger, normalizeEffectTrigger } from "./triggers";

export type DiagnosticReason =
  | "accepted" | "cooldown" | "below-threshold" | "queue-full"
  | "lower-priority" | "started" | "completed" | "replaced";

export interface DiagnosticLine {
  sequence: number;
  action: "accepted" | "dropped" | "evicted" | "started" | "completed" | "replaced";
  reason: DiagnosticReason;
  instanceId: string;
  event: string;
  priority: number;
  waiting: number;
}
export interface DiagnosticAlert {
  instanceId: string;
  event: EffectTriggerEvent;
  priority: number;
  /** Reference to editor layer; no viewer message, username, or avatar URL retained. */
  effect: EffectInstance;
}
export interface DiagnosticSnapshot {
  current: DiagnosticAlert | null;
  waiting: DiagnosticAlert[];
  counters: { accepted: number; started: number; completed: number; dropped: number; evicted: number };
  lines: DiagnosticLine[];
}
const MAX_QUEUED = 16;
const MAX_LINES = 60;

/** Editor-only deterministic model of the generated widget's admission rules.
 * It deliberately does not connect to StreamElements, emit network requests,
 * or retain a real viewer's data. Advance playback manually.
 */
export class AlertDiagnosticEngine {
  private queue: DiagnosticAlert[] = [];
  private current: DiagnosticAlert | null = null;
  private lastById = new Map<string, number>();
  private lines: DiagnosticLine[] = [];
  private sequence = 0;
  private counters = { accepted: 0, started: 0, completed: 0, dropped: 0, evicted: 0 };

  reset(): void {
    this.queue = [];
    this.current = null;
    this.lastById.clear();
    this.lines = [];
    this.sequence = 0;
    this.counters = { accepted: 0, started: 0, completed: 0, dropped: 0, evicted: 0 };
  }

  getSnapshot(): DiagnosticSnapshot {
    return {
      current: this.current,
      waiting: [...this.queue],
      counters: { ...this.counters },
      lines: [...this.lines],
    };
  }

  /** Return newly playing layers so caller can launch a local visual sample. */
  dispatch(
    effects: EffectInstance[],
    listener: EffectTriggerEvent,
    amount: number,
    atMs: number,
  ): DiagnosticAlert[] {
    const newlyPlaying: DiagnosticAlert[] = [];
    const syntheticEvent = { amount };
    for (const effect of effects) {
      if (!effect.enabled) continue;
      const rule = normalizeEffectTrigger(effect.trigger);
      if (!rule || rule.event !== listener) continue;
      const priority = rule.priority ?? 5;
      const last = this.lastById.get(effect.instanceId);
      const elapsed = last === undefined ? Infinity : atMs - last;
      const item: DiagnosticAlert = { instanceId: effect.instanceId, event: listener, priority, effect };
      if (!matchesEffectTrigger(rule, listener, syntheticEvent, elapsed)) {
        const reason = elapsed < rule.cooldownMs ? "cooldown" : "below-threshold";
        this.counters.dropped++;
        this.log("dropped", reason, item);
        continue;
      }

      if (rule.queueMode !== "queue") {
        this.lastById.set(effect.instanceId, atMs);
        this.counters.accepted++;
        this.counters.started++;
        this.log("started", "started", item);
        newlyPlaying.push(item);
        continue;
      }

      const index = this.queue.findIndex((entry) => entry.priority < priority);
      if (this.queue.length >= MAX_QUEUED) {
        if (index < 0) {
          this.counters.dropped++;
          this.log("dropped", "queue-full", item);
          continue;
        }
        const removed = this.queue.pop();
        if (removed) {
          this.counters.evicted++;
          this.log("evicted", "lower-priority", removed);
        }
      }
      if (index < 0) this.queue.push(item);
      else this.queue.splice(index, 0, item);
      this.counters.accepted++;
      this.lastById.set(effect.instanceId, atMs);
      this.log("accepted", "accepted", item);
      if (!this.current) {
        const started = this.startNext();
        if (started) newlyPlaying.push(started);
      }
    }
    return newlyPlaying;
  }

  finishCurrent(): DiagnosticAlert | null {
    if (this.current) {
      this.counters.completed++;
      this.log("completed", "completed", this.current);
      this.current = null;
    }
    return this.startNext();
  }

  private startNext(): DiagnosticAlert | null {
    const next = this.queue.shift();
    if (!next) return null;
    this.current = next;
    this.counters.started++;
    this.log("started", "started", next);
    return next;
  }

  private log(action: DiagnosticLine["action"], reason: DiagnosticReason, item: DiagnosticAlert): void {
    this.lines.unshift({
      sequence: ++this.sequence,
      action, reason, instanceId: item.instanceId,
      event: item.event, priority: item.priority, waiting: this.queue.length,
    });
    if (this.lines.length > MAX_LINES) this.lines.length = MAX_LINES;
  }
}
