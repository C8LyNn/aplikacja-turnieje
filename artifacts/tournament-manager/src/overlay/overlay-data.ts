/**
 * V5.9 · overlay data access. Every request is anonymous on purpose: no organizer token, no cookies — an overlay sees
 * exactly what any viewer of a public tournament sees, even when it is opened in the organizer's own browser.
 *
 * V5.9.1 · reliability for OBS: a single failed request does not put "Brak połączenia" on air (the mark appears only
 * after 15 s without a good answer), retries are capped at 20 s, and the overlay refreshes at once when OBS shows the
 * source again (page visibility and OBS's own source events).
 */
import { useEffect, useRef, useState } from "react";

export type OverlayProblem = "private" | "missing" | "offline" | "invalid";

export class OverlayFetchError extends Error {
  constructor(readonly problem: OverlayProblem, readonly status: number) {
    super(problem);
  }
}

export async function fetchPublic<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { credentials: "omit", cache: "no-store", headers: { accept: "application/json" }, signal });
  } catch (error) {
    if ((error as { name?: string })?.name === "AbortError") throw error;
    throw new OverlayFetchError("offline", 0);
  }
  if (response.status === 401 || response.status === 403) throw new OverlayFetchError("private", response.status);
  if (response.status === 404) throw new OverlayFetchError("missing", 404);
  if (!response.ok) throw new OverlayFetchError("offline", response.status);
  try {
    return (await response.json()) as T;
  } catch {
    throw new OverlayFetchError("offline", response.status);
  }
}

/** Without a good answer for this long, the shown state is marked as not current. */
export const STALE_AFTER_MS = 15_000;
export const MAX_RETRY_MS = 20_000;
export const HIDDEN_POLL_MS = 30_000;

/** The shown data is stale only when the last good answer is old — one failed request is not news for viewers. */
export function isStale(lastOkAt: number | null, now: number): boolean {
  return lastOkAt != null && now - lastOkAt >= STALE_AFTER_MS;
}

/** When to ask again: the normal interval; slower after failures (capped); slow while hidden or for a closed tournament. */
export function nextPollDelay({ intervalMs, failures, hidden, problem }: { intervalMs: number; failures: number; hidden: boolean; problem: OverlayProblem | null }): number {
  if (problem === "private" || problem === "missing" || hidden) return HIDDEN_POLL_MS;
  if (failures > 0) return Math.min(MAX_RETRY_MS, intervalMs * 2 ** failures);
  return intervalMs;
}

export interface Polled<T> {
  data: T | null;
  problem: OverlayProblem | null;
  /** True when the shown data is older than STALE_AFTER_MS because refreshing keeps failing. */
  stale: boolean;
  /** Time of the last good answer (ms since epoch). */
  lastOkAt: number | null;
}

/**
 * Polls `load` every `intervalMs`. Identical answers do not re-render (no flicker, no replayed animation). After a
 * failure the last good data stays on screen; it is marked stale only after STALE_AFTER_MS. A closed (private or
 * missing) tournament clears the data and is rechecked every 30 s, so a fixed setting recovers by itself.
 */
export function usePolled<T>(key: string, load: (signal: AbortSignal) => Promise<T>, intervalMs: number): Polled<T> {
  const [state, setState] = useState<Polled<T>>({ data: null, problem: null, stale: false, lastOkAt: null });
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    let last = "";
    let lastOkAt: number | null = null;
    let inFlight = false;
    const controller = new AbortController();
    const hidden = () => typeof document !== "undefined" && document.visibilityState === "hidden";
    const tick = async () => {
      if (inFlight || cancelled) return;
      inFlight = true;
      if (timer) clearTimeout(timer);
      let problem: OverlayProblem | null = null;
      try {
        const data = await loadRef.current(controller.signal);
        if (cancelled) return;
        failures = 0;
        lastOkAt = Date.now();
        const json = JSON.stringify(data);
        if (json !== last) {
          last = json;
          setState({ data, problem: null, stale: false, lastOkAt });
        } else {
          setState((current) => (current.problem || current.stale ? { ...current, problem: null, stale: false, lastOkAt } : current));
        }
      } catch (error) {
        if (cancelled || (error as { name?: string })?.name === "AbortError") return;
        failures += 1;
        problem = error instanceof OverlayFetchError ? error.problem : "invalid";
        const kept = problem === "offline";
        if (!kept) last = "";
        const stale = kept && isStale(lastOkAt, Date.now());
        setState((current) => ({ data: kept ? current.data : null, problem, stale: stale && current.data != null, lastOkAt }));
      } finally {
        inFlight = false;
      }
      if (cancelled) return;
      timer = setTimeout(tick, nextPollDelay({ intervalMs, failures, hidden: hidden(), problem }));
    };
    // OBS shows the source again (scene switch, refresh) or the page becomes visible: ask now, not at the next tick.
    const now = () => { if (!hidden()) void tick(); };
    const onObs = (event: Event) => { const detail = (event as CustomEvent<{ active?: boolean; visible?: boolean }>).detail; if (detail?.active || detail?.visible) void tick(); };
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", now);
    if (typeof window !== "undefined") {
      window.addEventListener("obsSourceActiveChanged", onObs);
      window.addEventListener("obsSourceVisibleChanged", onObs);
    }
    void tick();
    return () => {
      cancelled = true;
      controller.abort();
      if (timer) clearTimeout(timer);
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", now);
      if (typeof window !== "undefined") {
        window.removeEventListener("obsSourceActiveChanged", onObs);
        window.removeEventListener("obsSourceVisibleChanged", onObs);
      }
    };
  }, [key, intervalMs]);
  return state;
}

/** True once `ms` have passed since mount — the loading text is not flashed on air for a quick first answer. */
export function useDelayed(ms: number): boolean {
  const [passed, setPassed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setPassed(true), ms);
    return () => clearTimeout(timer);
  }, [ms]);
  return passed;
}
