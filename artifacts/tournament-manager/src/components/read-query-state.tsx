import type { ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Presentation only: retry reads, retain cached content and mounted drafts. */
export function ReadQueryState({ query, loadingMessage, errorMessage, children }: {
  query: { data: unknown; error: unknown; isFetching: boolean; refetch: () => unknown };
  loadingMessage: string;
  errorMessage: string;
  children?: ReactNode;
}) {
  const hasData = query.data !== undefined;
  return <>
    {query.error ? <div role="alert" className="read-query-state read-query-state--error w-full rounded-lg border border-destructive/40 bg-card p-4 text-foreground space-y-3">
      <p className="flex items-center gap-2"><AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0 text-destructive" />{errorMessage}</p>
      {hasData && <p className="text-sm text-muted-foreground">Pokazujemy ostatnio pobrane dane. Nie udało się potwierdzić ich aktualności.</p>}
      <Button type="button" variant="outline" disabled={query.isFetching} onClick={() => { void query.refetch(); }}>Spróbuj ponownie</Button>
    </div> : !hasData ? <p role="status" className="read-query-state read-query-state--loading flex items-center gap-2 p-4 text-sm text-muted-foreground">
      <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />{loadingMessage}
    </p> : query.isFetching ? <p aria-hidden="true" className="read-query-state read-query-state--refreshing text-xs text-muted-foreground">Odświeżanie danych…</p> : null}
    {hasData && children}
  </>;
}
