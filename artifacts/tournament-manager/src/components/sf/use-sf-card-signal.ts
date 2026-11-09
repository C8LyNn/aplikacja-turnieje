import { useEffect, useState } from "react";
import { randomGlyphString, type SfSignal } from "./use-sf-signal";

export const SF_CARD_CYCLE_MS = 10000;
export const SF_CARD_FRAME_COUNT = 18;
export const SF_CARD_FRAME_MS = 65;
export const SF_CARD_FADE_MS = 220;
export const SF_CARD_GLITCH_MS =
  SF_CARD_FRAME_COUNT * SF_CARD_FRAME_MS + SF_CARD_FADE_MS;

export interface SfCardSignal extends SfSignal {
  seed: number;
  frame: number;
  settling: boolean;
}

/** Geometry depends only on this cycle's seed and frame, not on text randomness. */
export function makeCardGlitchVars(seed: number, frame: number): Record<string, string> {
  const mod = (multiplier: number, divisor: number) =>
    (seed + frame * multiplier) % divisor;
  return {
    "--sf-card-ghost-x": `${1 + mod(1, 2)}px`,
    "--sf-card-scan-a": `${18 + mod(17, 68)}%`,
    "--sf-card-scan-b": `${25 + mod(23, 58)}%`,
    "--sf-card-wash-x": `${mod(29, 11) - 5}px`,
    "--sf-card-slice-y": `${12 + mod(31, 76)}%`,
    "--sf-card-slice-shift": `${mod(19, 9) - 4}px`,
    "--sf-card-icon-x": `${mod(3, 3) - 1}px`,
    "--sf-card-icon-skew": `${(mod(5, 5) - 2) * 1.2}deg`,
    "--sf-card-desc-c-top": `${mod(9, 55)}%`,
    "--sf-card-desc-c-bottom": `${mod(5, 35)}%`,
    "--sf-card-desc-m-top": `${mod(5, 35)}%`,
    "--sf-card-desc-m-bottom": `${mod(11, 45)}%`,
  };
}

function buildCardSignal(
  cycle: number,
  seed: number,
  frame: number,
  glitching: boolean,
): SfCardSignal {
  return {
    glyph: randomGlyphString(1),
    signal: randomGlyphString(18),
    footer: randomGlyphString(8),
    cycle,
    seed,
    frame,
    glitching,
    settling: false,
    reducedMotion:
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    vars: makeCardGlitchVars(seed, frame),
  };
}

/** Landing-only lifecycle; the existing /sf panel keeps its own signal algorithm. */
export function useSfCardSignal(): SfCardSignal {
  const [state, setState] = useState(() => buildCardSignal(0, 0, 0, false));

  useEffect(() => {
    let cycle = 0;
    let frames: ReturnType<typeof setInterval> | undefined;
    let fade: ReturnType<typeof setTimeout> | undefined;
    const timer = setInterval(() => {
      if (frames !== undefined) clearInterval(frames);
      if (fade !== undefined) clearTimeout(fade);
      cycle += 1;
      const seed = Math.floor(Math.random() * 0x100000000);
      let frame = 0;
      // Frame zero begins exactly on the ten-second boundary.
      setState(buildCardSignal(cycle, seed, frame, true));
      frames = setInterval(() => {
        frame += 1;
        if (frame < SF_CARD_FRAME_COUNT) {
          setState(buildCardSignal(cycle, seed, frame, true));
          return;
        }
        clearInterval(frames);
        frames = undefined;
        setState((previous) => ({ ...previous, settling: true }));
        fade = setTimeout(() => {
          setState(buildCardSignal(cycle, seed, frame, false));
          fade = undefined;
        }, SF_CARD_FADE_MS);
      }, SF_CARD_FRAME_MS);
    }, SF_CARD_CYCLE_MS);
    return () => {
      clearInterval(timer);
      if (frames !== undefined) clearInterval(frames);
      if (fade !== undefined) clearTimeout(fade);
    };
  }, []);

  return state;
}
