/** Separate entrance and exit animations use individual transform properties so they
 * never overwrite the caption's independently positioned CSS transform. */
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
`.trim();

/** The host lifetime includes its own timeline delay and is clamped by the editor. */
export function captionAnimationShorthand(
  intro: "fade" | "slide" | "pop",
  outro: "fade" | "slide" | "pop",
  playbackMs: number,
): string {
  const lifetime = Number.isFinite(playbackMs) ? Math.max(300, Math.min(180000, Math.round(playbackMs))) : 4000;
  const enterMs = Math.min(420, Math.max(120, Math.round(lifetime * .22)));
  const exitMs = Math.min(420, Math.max(120, Math.round(lifetime * .22)));
  return `ae-caption-in-${intro} ${enterMs}ms ease-out 0ms both, ae-caption-out-${outro} ${exitMs}ms ease-in ${Math.max(0, lifetime - exitMs)}ms forwards`;
}
