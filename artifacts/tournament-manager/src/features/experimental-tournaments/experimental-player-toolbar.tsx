import { t } from "@/i18n";
import { ArrowUpDown, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";

export type ExperimentalPlayerStatusFilter = "all" | "active" | "eliminated" | "winner";
export type ExperimentalPlayerSort = "seed" | "name" | "status";

export function ExperimentalPlayerToolbar({ query, onQueryChange, status, onStatusChange, sort, onSortChange, total, visible, teams = false }: { /** V5.8: a team tournament says "drużyna". */ teams?: boolean; query: string; onQueryChange: (value: string) => void; status: ExperimentalPlayerStatusFilter; onStatusChange: (value: ExperimentalPlayerStatusFilter) => void; sort: ExperimentalPlayerSort; onSortChange: (value: ExperimentalPlayerSort) => void; total: number; visible: number; }) {
  return (
    <section aria-label={teams ? t("experimentalPlayerToolbar.filtrowanie_listy_druzyn") : t("experimentalPlayerToolbar.filtrowanie_listy_graczy")} data-exp-status-filter={status} data-exp-sort={sort} className="experimental-player-toolbar rounded-xl border border-border/80 bg-card/50 p-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{teams ? t("experimentalPlayerToolbar.szukaj_druzyny") : t("experimentalPlayerToolbar.szukaj_gracza")}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={t("experimentalPlayerToolbar.szukaj_po_nicku_druzynie_randze")} className="pl-9" />
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex">
          <label className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">{teams ? t("experimentalPlayerToolbar.status_druzyny") : t("experimentalPlayerToolbar.status_gracza")}</span>
            <select value={status} onChange={(event) => onStatusChange(event.target.value as ExperimentalPlayerStatusFilter)} className="min-h-10 rounded-lg border border-border bg-background/75 px-3 text-sm font-medium outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15">
              <option value="all">{t("experimentalPlayerToolbar.wszyscy")}</option><option value="active">{t("experimentalPlayerToolbar.aktywni")}</option><option value="eliminated">{t("experimentalPlayerToolbar.wyeliminowani")}</option><option value="winner">{t("experimentalPlayerToolbar.zwyciezca")}</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">{teams ? t("experimentalPlayerToolbar.sortowanie_druzyn") : t("experimentalPlayerToolbar.sortowanie_graczy")}</span>
            <select value={sort} onChange={(event) => onSortChange(event.target.value as ExperimentalPlayerSort)} className="min-h-10 rounded-lg border border-border bg-background/75 px-3 text-sm font-medium outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15">
              <option value="seed">{t("experimentalPlayerToolbar.seed")}</option><option value="name">{t("experimentalPlayerToolbar.nick_a_z")}</option><option value="status">{t("experimentalPlayerToolbar.status")}</option>
            </select>
          </label>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground" role="status">{teams ? t("experimentalPlayerToolbar.widoczne_druzyny") : t("experimentalPlayerToolbar.widoczni_gracze")}: <strong className="text-foreground">{visible}</strong>{" "}{t("i18n.word.of")}{" "}<strong className="text-foreground">{total}</strong></p>
    </section>
  );
}
