import { useEffect, useState } from "react";

export const SF_GLYPHS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789";
export const SF_CYCLE_MS = 10000;
export const SF_GLITCH_MS = 1400;

export interface SfSignal {
  glyph: string;
  signal: string;
  footer: string;
  cycle: number;
  glitching: boolean;
  reducedMotion: boolean;
  /** per-cycle CSS variables for glitch variation */
  vars: Record<string, string>;
}

export function randomGlyphString(length: number, rng: () => number = Math.random): string {
  const chars = Array.from(SF_GLYPHS);
  let out = "";
  for (let i = 0; i < length; i++) out += chars[Math.floor(rng() * chars.length)];
  return out;
}

export function makeGlitchVars(rng: () => number = Math.random): Record<string, string> {
  const r = (min: number, max: number) => min + rng() * (max - min);
  return {
    "--sf-dx": `${r(2, 6).toFixed(1)}px`,
    "--sf-slice-y": `${r(10, 80).toFixed(0)}%`,
    "--sf-slice-h": `${r(6, 16).toFixed(0)}%`,
    "--sf-slice-shift": `${r(-10, 10).toFixed(1)}px`,
    "--sf-dur": "1.4s",
  };
}

function prefersReduced(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function build(cycle: number, glitching: boolean): SfSignal {
  return {
    glyph: randomGlyphString(1),
    signal: randomGlyphString(22),
    footer: randomGlyphString(14),
    cycle,
    glitching,
    reducedMotion: prefersReduced(),
    vars: makeGlitchVars(),
  };
}

/** Shared by SF card and /sf page. Regenerates every intervalMs; glitch lasts glitchMs. */
export function useSfSignal(intervalMs = SF_CYCLE_MS, glitchMs = SF_GLITCH_MS): SfSignal {
  const [state, setState] = useState<SfSignal>(() => build(0, false));

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const id = setInterval(() => {
      const reduced = prefersReduced();
      setState((s) => ({ ...build(s.cycle + 1, !reduced), reducedMotion: reduced }));
      if (timeout) clearTimeout(timeout);
      if (!reduced) timeout = setTimeout(() => setState((s) => ({ ...s, glitching: false })), glitchMs);
    }, intervalMs);
    return () => {
      clearInterval(id);
      if (timeout) clearTimeout(timeout);
    };
  }, [intervalMs, glitchMs]);

  return state;
}
