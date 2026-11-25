import type { CaptionIntro, CaptionOutro } from "../core/types";

export const CAPTION_INTROS: readonly CaptionIntro[] = ["slide", "fade", "pop", "zoom", "bounce", "drop", "blur"];
export const CAPTION_OUTROS: readonly CaptionOutro[] = ["fade", "slide", "pop", "zoom", "drop", "blur"];

/** Separate entrance and exit animations use individual transform properties so they
 * never overwrite the caption's independently positioned CSS transform.
 * The same rules are written into the editor page and the exported widget. */
export const CAPTION_ANIMATIONS_CSS = `
@keyframes ae-caption-in-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes ae-caption-in-slide {
  from { opacity: 0; translate: 0 18px; }
  to { opacity: 1; translate: 0 0; }
}
@keyframes ae-caption-in-pop {
  from { opacity: 0; scale: .78; }
  to { opacity: 1; scale: 1; }
}
@keyframes ae-caption-in-zoom {
  from { opacity: 0; scale: 1.8; }
  to { opacity: 1; scale: 1; }
}
@keyframes ae-caption-in-bounce {
  0% { opacity: 0; translate: 0 48px; }
  60% { opacity: 1; translate: 0 -10px; }
  82% { translate: 0 4px; }
  100% { opacity: 1; translate: 0 0; }
}
@keyframes ae-caption-in-drop {
  from { opacity: 0; translate: 0 -64px; }
  to { opacity: 1; translate: 0 0; }
}
@keyframes ae-caption-in-blur {
  from { opacity: 0; filter: blur(14px); }
  to { opacity: 1; filter: blur(0); }
}
@keyframes ae-caption-out-fade {
  from { opacity: 1; }
  to { opacity: 0; }
}
@keyframes ae-caption-out-slide {
  from { opacity: 1; translate: 0 0; }
  to { opacity: 0; translate: 0 -18px; }
}
@keyframes ae-caption-out-pop {
  from { opacity: 1; scale: 1; }
  to { opacity: 0; scale: .78; }
}
@keyframes ae-caption-out-zoom {
  from { opacity: 1; scale: 1; }
  to { opacity: 0; scale: 1.5; }
}
@keyframes ae-caption-out-drop {
  from { opacity: 1; translate: 0 0; }
  to { opacity: 0; translate: 0 64px; }
}
@keyframes ae-caption-out-blur {
  from { opacity: 1; filter: blur(0); }
  to { opacity: 0; filter: blur(14px); }
}
@keyframes ae-letter-wave {
  0%, 100% { translate: 0 0; }
  45% { translate: 0 -0.35em; }
}
@keyframes ae-letter-type {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes ae-letter-pop {
  0% { opacity: 0; scale: .2; }
  70% { opacity: 1; scale: 1.25; }
  100% { opacity: 1; scale: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .ae-alert-caption, .ae-alert-letter { animation: none !important; }
}
`.trim();

/** Longer titles are shown without per-letter animation (bounded DOM size). */
export const CAPTION_LETTER_LIMIT = 120;

function captionLifetime(playbackMs: number): number {
  return Number.isFinite(playbackMs) ? Math.max(300, Math.min(180000, Math.round(playbackMs))) : 4000;
}

/** The host lifetime includes its own timeline delay and is clamped by the editor. */
export function captionAnimationShorthand(
  intro: CaptionIntro,
  outro: CaptionOutro,
  playbackMs: number,
): string {
  const lifetime = captionLifetime(playbackMs);
  const enterMs = Math.min(420, Math.max(120, Math.round(lifetime * .22)));
  const exitMs = Math.min(420, Math.max(120, Math.round(lifetime * .22)));
  return `ae-caption-in-${intro} ${enterMs}ms ease-out 0ms both, ae-caption-out-${outro} ${exitMs}ms ease-in ${Math.max(0, lifetime - exitMs)}ms forwards`;
}

/** Delay between two letters: the whole title is revealed within the first ~45% of the alert. */
export function captionLetterStepMs(count: number, playbackMs: number): number {
  if (count <= 1) return 0;
  return Math.max(12, Math.min(60, Math.floor(captionLifetime(playbackMs) * 0.45 / count)));
}

/** Animation of one letter of the title; identical in the editor and in the exported widget. */
export function captionLetterAnimation(style: "wave" | "typewriter" | "pop", index: number, stepMs: number): string {
  const delay = index * stepMs;
  if (style === "typewriter") return `ae-letter-type 1ms linear ${delay}ms both`;
  if (style === "pop") return `ae-letter-pop 360ms cubic-bezier(.2,.7,.3,1.4) ${delay}ms both`;
  return `ae-letter-wave 640ms ease-in-out ${delay + 200}ms both`;
}
