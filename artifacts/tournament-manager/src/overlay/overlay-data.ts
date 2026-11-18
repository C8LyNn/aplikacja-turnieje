/**
 * V5.9 · overlay data access. Every request is anonymous on purpose: no organizer token, no cookies — an overlay sees
 * exactly what any viewer of a public tournament sees, even when it is opened in the organizer's own browser.
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

export interface Polled<T> {
  data: T | null;
  problem: OverlayProblem | null;
  /** True when the shown data is older than the last failed refresh (connection lost). */
  stale: boolean;
}

/**
 * Polls `load` every `intervalMs`. Identical answers do not re-render (no flicker, no replayed animation). After a
 * failure the last good data stays on screen, marked stale, and retries slow down (up to 30 s). A hidden page polls
 * every 30 s. Private / missing tournaments are rechecked every 30 s so a fixed setting recovers by itself.
 */
export function usePolled<T>(key: string, load: (signal: AbortSignal) => Promise<T>, intervalMs: number): Polled<T> {
  const [state, setState] = useState<Polled<T>>({ data: null, problem: null, stale: false });
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    let last = "";
    const controller = new AbortController();
    const tick = async () => {
      let problem: OverlayProblem | null = null;
      try {
        const data = await loadRef.current(controller.signal);
        if (cancelled) return;
        failures = 0;
        const json = JSON.stringify(data);
        if (json !== last) {
          last = json;
          setState({ data, problem: null, stale: false });
        } else {
          setState((current) => (current.problem || current.stale ? { ...current, problem: null, stale: false } : current));
        }
      } catch (error) {
        if (cancelled || (error as { name?: string })?.name === "AbortError") return;
        failures += 1;
        problem = error instanceof OverlayFetchError ? error.problem : "invalid";
        const kept = problem === "offline";
        setState((current) => ({ data: kept ? current.data : null, problem, stale: kept && current.data != null }));
      }
      if (cancelled) return;
      const hidden = typeof document !== "undefined" && document.visibilityState === "hidden";
      const delay = problem === "private" || problem === "missing" || hidden ? 30_000
        : failures ? Math.min(30_000, intervalMs * 2 ** failures) : intervalMs;
      timer = setTimeout(tick, delay);
    };
    void tick();
    return () => { cancelled = true; controller.abort(); if (timer) clearTimeout(timer); };
  }, [key, intervalMs]);
  return state;
}
