import { AlignJustify, Rows3 } from "lucide-react";
import { useEffect, useState } from "react";

export type ExperimentalDensity = "comfortable" | "compact";

const STORAGE_KEY = "tm_exp_density_v1";

function readDensity(): ExperimentalDensity {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "compact"
      ? "compact"
      : "comfortable";
  } catch {
    return "comfortable";
  }
}

export function ExperimentalDensityControl() {
  const [density, setDensity] = useState<ExperimentalDensity>(() => readDensity());

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("experimental-density-compact", density === "compact");
    try {
      window.localStorage.setItem(STORAGE_KEY, density);
    } catch {
      // Presentation preference only; failure to persist must not block the UI.
    }

    return () => {
      root.classList.remove("experimental-density-compact");
    };
  }, [density]);

  const compact = density === "compact";

  return (
    <button
      type="button"
      aria-pressed={compact}
      onClick={() => setDensity(compact ? "comfortable" : "compact")}
      className="hidden items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 md:inline-flex"
      title={compact ? "Przełącz na wygodniejszy układ" : "Włącz bardziej kompaktowy układ"}
    >
      {compact ? (
        <Rows3 className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <AlignJustify className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {compact ? "Wygodny" : "Kompakt"}
    </button>
  );
}
