import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyLinkText, type LinkCopyResult } from "@/lib/link-clipboard";

/** Use inside a wrapping flex row: the optional manual field occupies a full row. */
export function CopyLinkButton({ text, label = "Kopiuj link", showLabel = false }: {
  text: string;
  label?: string;
  /** QW-06b: a labelled outline button (e.g. the sign-up link) instead of the icon-only one. */
  showLabel?: boolean;
}) {
  const [result, setResult] = useState<{ text: string; state: LinkCopyResult } | null>(null);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const mounted = useRef(true);
  const busy = useRef(false);
  const currentText = useRef(text);
  const manualInput = useRef<HTMLInputElement>(null);
  currentText.current = text;
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const state = result?.text === text ? result.state : null;
  const pending = pendingText !== null;
  const needsManualCopy = state === "failed" || state === "unavailable";
  const message = pending
    ? pendingText === text ? "Kopiowanie linku…" : "Trwa kopiowanie poprzednio wybranego linku…"
    : state === "copied" ? "Link skopiowany."
    : state === "unavailable" ? "Ta przeglądarka nie udostępnia schowka. Skopiuj link ręcznie."
    : state === "failed" ? "Nie udało się skopiować linku. Skopiuj go ręcznie poniżej."
    : "";

  async function handleCopy() {
    if (busy.current) return;
    const requestedText = text;
    busy.current = true;
    setPendingText(requestedText);
    setResult(null);
    const outcome = await copyLinkText(requestedText);
    busy.current = false;
    if (!mounted.current) return;
    setPendingText(null);
    // A changed OBS setting / tournament must not inherit the previous URL's success.
    if (currentText.current !== requestedText) return;
    setResult({ text: requestedText, state: outcome });
  }

  return <>
    <button
      type="button"
      onClick={() => { void handleCopy(); }}
      disabled={pending}
      aria-label={showLabel ? undefined : label}
      title={label}
      className={showLabel
        ? "inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait disabled:opacity-60"
        : "shrink-0 rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait disabled:opacity-60"}
    >
      {state === "copied"
        ? <Check aria-hidden="true" className="h-4 w-4 text-green-400" />
        : <Copy aria-hidden="true" className="h-4 w-4" />}
      {showLabel && <span>{state === "copied" ? "Skopiowano" : label}</span>}
    </button>
    <span role="status" aria-live="polite" aria-atomic="true"
      className={needsManualCopy ? "basis-full text-xs text-destructive" : "sr-only"}>
      {message}
    </span>
    {needsManualCopy && <div className="min-w-0 basis-full space-y-2">
      <label className="block text-xs text-muted-foreground">
        Link do ręcznego skopiowania
        <input
          ref={manualInput}
          type="text"
          readOnly
          value={text}
          spellCheck={false}
          autoComplete="off"
          dir="ltr"
          onFocus={event => event.currentTarget.select()}
          onClick={event => event.currentTarget.select()}
          className="mt-1 block w-full min-w-0 rounded border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => {
          manualInput.current?.focus();
          manualInput.current?.select();
        }} className="rounded px-2 py-1 text-xs text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          Zaznacz link
        </button>
        <span className="text-xs text-muted-foreground">Użyj Ctrl+C, ⌘C lub opcji Kopiuj w menu urządzenia.</span>
      </div>
    </div>}
  </>;
}
