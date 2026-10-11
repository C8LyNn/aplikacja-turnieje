import { getEditorState } from "../editor/state";
import { clampTimeMs, sceneDurationMs } from "./transportMath";

export interface PreviewTransport {
  afterRender(): void;
  replay(): void;
  seek(ms: number): void;
}

/**
 * Preview-only transport. No transport state goes into scene JSON or the
 * StreamElements output; in OBS all CSS animations use their native clock.
 */
export function installPreviewTransport(preview: HTMLElement, mount: HTMLElement): PreviewTransport {
  const host = document.createElement("section");
  host.className = "ae-preview-transport";
  host.setAttribute("aria-label", "Sterowanie odtwarzaniem podglądu");
  host.innerHTML = `
    <div class="ae-transport-buttons">
      <button type="button" class="ae-button ae-button-secondary" data-transport-play aria-label="Wstrzymaj podgląd">⏸ Pauza</button>
      <button type="button" class="ae-button ae-button-secondary" data-transport-restart title="Odtwórz od zera">↺ Od początku</button>
      <output data-transport-position aria-live="off">0.0 / 10.0 s</output>
    </div>
    <input data-transport-seek type="range" min="0" max="10000" step="50" value="0"
      aria-label="Przewiń podgląd do wybranego momentu" />
    <div class="ae-transport-description">Przeciągnij suwak, aby zobaczyć klatkę. Odtwarzanie nie zmienia sceny ani eksportu.</div>
  `;
  mount.appendChild(host);

  const playButton = host.querySelector<HTMLButtonElement>("[data-transport-play]")!;
  const seekInput = host.querySelector<HTMLInputElement>("[data-transport-seek]")!;
  const position = host.querySelector<HTMLOutputElement>("[data-transport-position]")!;
  let playing = true;
  let cursorMs = 0;
  let durationMs = 10000;
  let lastTimestamp: number | null = null;
  let seekHeld = false;

  const animations = (): Animation[] => preview.getAnimations({ subtree: true });
  const emit = (): void => {
    document.dispatchEvent(new CustomEvent("animated-effects:transport-state", {
      detail: { playing, cursorMs, durationMs },
    }));
  };
  const updateUi = (): void => {
    seekInput.max = String(durationMs);
    seekInput.value = String(clampTimeMs(cursorMs, durationMs));
    position.value = `${(cursorMs / 1000).toFixed(1)} / ${(durationMs / 1000).toFixed(1)} s`;
    playButton.textContent = playing ? "⏸ Pauza" : "▶ Odtwórz";
    playButton.setAttribute("aria-label", playing ? "Wstrzymaj podgląd" : "Odtwórz podgląd");
  };
  const align = (): void => {
    for (const animation of animations()) {
      try {
        animation.pause();
        animation.currentTime = cursorMs;
        if (playing) animation.play();
      } catch (error) {
        console.debug("Animated Effects: animation not seekable", error);
      }
    }
  };
  const setPlaying = (next: boolean): void => {
    if (playing === next) return;
    playing = next;
    if (playing && cursorMs >= durationMs) cursorMs = 0;
    lastTimestamp = null;
    align();
    updateUi();
    emit();
  };
  const seek = (ms: number): void => {
    cursorMs = clampTimeMs(ms, durationMs);
    lastTimestamp = null;
    align();
    updateUi();
    emit();
  };
  const replay = (): void => { seek(0); setPlaying(true); };

  const tick = (timestamp: number): void => {
    if (playing && !seekHeld) {
      if (lastTimestamp !== null) {
        cursorMs = Math.min(durationMs, cursorMs + Math.max(0, timestamp - lastTimestamp));
      }
      lastTimestamp = timestamp;
      if (cursorMs >= durationMs) {
        playing = false;
        align();
        emit();
      }
      updateUi();
    } else {
      lastTimestamp = null;
    }
    requestAnimationFrame(tick);
  };

  seekInput.addEventListener("pointerdown", () => {
    seekHeld = true;
    setPlaying(false);
  });
  const release = (): void => { seekHeld = false; };
  seekInput.addEventListener("pointerup", release);
  seekInput.addEventListener("pointercancel", release);
  seekInput.addEventListener("blur", release);
  seekInput.addEventListener("input", () => {
    setPlaying(false);
    seek(Number(seekInput.value));
  });
  playButton.addEventListener("click", () => setPlaying(!playing));
  host.querySelector("[data-transport-restart]")?.addEventListener("click", () => replay());
  document.addEventListener("animated-effects:replay-preview", () => replay());
  document.addEventListener("animated-effects:transport-toggle", () => setPlaying(!playing));
  document.addEventListener("animated-effects:preview-seek", (event) => {
    const requestedMs = (event as CustomEvent<{ ms: number }>).detail?.ms;
    if (typeof requestedMs !== "number" || !Number.isFinite(requestedMs)) return;
    setPlaying(false);
    seek(requestedMs);
  });

  const afterRender = (): void => {
    durationMs = sceneDurationMs(getEditorState().effects);
    cursorMs = clampTimeMs(cursorMs, durationMs);
    align();
    updateUi();
  };

  updateUi();
  requestAnimationFrame(tick);
  return { afterRender, replay, seek };
}
