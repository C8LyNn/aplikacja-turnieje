import { ArrowUpDown, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";

export type ExperimentalPlayerStatusFilter = "all" | "active" | "eliminated" | "winner";
export type ExperimentalPlayerSort = "seed" | "name" | "status";

export function ExperimentalPlayerToolbar({ query, onQueryChange, status, onStatusChange, sort, onSortChange, total, visible }: { query: string; onQueryChange: (value: string) => void; status: ExperimentalPlayerStatusFilter; onStatusChange: (value: ExperimentalPlayerStatusFilter) => void; sort: ExperimentalPlayerSort; onSortChange: (value: ExperimentalPlayerSort) => void; total: number; visible: number; }) {
  return (
    <section aria-label="Filtrowanie listy graczy" className="experimental-player-toolbar rounded-xl border border-border/80 bg-card/50 p-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Szukaj gracza</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Szukaj po nicku, drużynie, randze lub kraju…" className="pl-9" />
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex">
          <label className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Status gracza</span>
            <select value={status} onChange={(event) => onStatusChange(event.target.value as ExperimentalPlayerStatusFilter)} className="min-h-10 rounded-lg border border-border bg-background/75 px-3 text-sm font-medium outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15">
              <option value="all">Wszyscy</option><option value="active">Aktywni</option><option value="eliminated">Wyeliminowani</option><option value="winner">Zwycięzca</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Sortowanie graczy</span>
            <select value={sort} onChange={(event) => onSortChange(event.target.value as ExperimentalPlayerSort)} className="min-h-10 rounded-lg border border-border bg-background/75 px-3 text-sm font-medium outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15">
              <option value="seed">Seed</option><option value="name">Nick A–Z</option><option value="status">Status</option>
            </select>
          </label>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground" role="status">Widoczni gracze: <strong className="text-foreground">{visible}</strong> z <strong className="text-foreground">{total}</strong></p>
    </section>
  );
}
