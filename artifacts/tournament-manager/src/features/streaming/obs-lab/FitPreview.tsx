import { useEffect, useRef, useState, type ReactNode } from "react";

/** Largest preview height: about a third of the screen on narrow layouts, most of it next to the options. */
function previewMaxHeight(): number {
  if (typeof window === "undefined") return 480;
  const share = window.innerWidth >= 1024 ? 0.66 : 0.36;
  return Math.max(170, Math.round(window.innerHeight * share));
}

export function usePreviewMaxHeight(): number {
  const [value, setValue] = useState(previewMaxHeight);
  useEffect(() => {
    const update = () => setValue(previewMaxHeight());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return value;
}

/**
 * Shows content of a fixed pixel size (the overlay as OBS will get it) scaled down to the available width and height,
 * never up, so the whole overlay stays visible next to the options.
 */
export function FitPreview({ width, height, maxHeight, children }: { width: number; height: number; maxHeight: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const update = () => setAvailable(element.clientWidth);
    update();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const scale = available > 0 ? Math.min(1, available / width, maxHeight / height) : 1;
  return (
    <div ref={ref} className="w-full" data-testid="chat-preview-fit" data-scale={scale.toFixed(3)}>
      <div className="mx-auto" style={{ width: width * scale, height: height * scale }}>
        <div style={{ width, height, transform: scale < 1 ? `scale(${scale})` : undefined, transformOrigin: "top left" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
