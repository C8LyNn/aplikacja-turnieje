import { useEffect, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { canShareLink, shareLink, type LinkShareResult, type ShareTarget } from "@/lib/link-share";

/**
 * QW-06b · "Udostępnij" through the system share sheet. Renders nothing when the browser cannot share, so the
 * existing "Kopiuj link" next to it stays the only (and complete) way there. Use inside a wrapping flex row.
 */
export function ShareLinkButton({ target, label = "Udostępnij", showLabel = false }: {
  target: ShareTarget;
  label?: string;
  showLabel?: boolean;
}) {
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<LinkShareResult | null>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  // Checked after mount: the server render and old browsers simply show the copy button.
  useEffect(() => { setSupported(canShareLink(target)); }, [target.url, target.title, target.text]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { setState(null); }, [target.url]);
  if (!supported) return null;

  async function handleShare() {
    if (busy.current) return;
    busy.current = true;
    const outcome = await shareLink(target);
    busy.current = false;
    if (mounted.current) setState(outcome);
  }

  const message = state === "shared" ? "Link udostępniony."
    : state === "failed" || state === "unavailable" ? "Nie udało się otworzyć udostępniania. Użyj przycisku „Kopiuj link”."
    : "";
  return <>
    <button
      type="button"
      onClick={() => { void handleShare(); }}
      aria-label={showLabel ? undefined : label}
      title={label}
      data-testid="share-link-button"
      className={showLabel
        ? "inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        : "shrink-0 rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"}
    >
      <Share2 aria-hidden="true" className="h-4 w-4" />
      {showLabel && <span>{label}</span>}
    </button>
    <span role="status" aria-live="polite" aria-atomic="true"
      className={state === "failed" || state === "unavailable" ? "basis-full text-xs text-destructive" : "sr-only"}>
      {message}
    </span>
  </>;
}
