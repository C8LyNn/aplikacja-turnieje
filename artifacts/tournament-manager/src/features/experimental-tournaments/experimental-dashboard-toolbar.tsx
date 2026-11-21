import { t } from "@/i18n";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";

export type ExperimentalTournamentStatusFilter =
  | "all"
  | "draft"
  | "active"
  | "completed";

export function ExperimentalDashboardToolbar({
  query,
  onQueryChange,
  status,
  onStatusChange,
  counts,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  status: ExperimentalTournamentStatusFilter;
  onStatusChange: (value: ExperimentalTournamentStatusFilter) => void;
  counts: {
    all: number;
    draft: number;
    active: number;
    completed: number;
  };
}) {
  return (
    <section
      aria-label={t("experimentalDashboardToolbar.filtrowanie_turniejow")}
      data-exp-status-filter={status}
      className="experimental-dashboard-toolbar rounded-xl border border-border/80 bg-card/50 p-3"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{t("experimentalDashboardToolbar.szukaj_turnieju")}</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t("experimentalDashboardToolbar.szukaj_po_nazwie_lub_opisie")}
            className="pl-9"
          />
        </label>

        <div className="flex min-w-0 items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <label className="sr-only" htmlFor="experimental-tournament-status-filter">
            {t("experimentalDashboardToolbar.status_turnieju")}</label>
          <select
            id="experimental-tournament-status-filter"
            value={status}
            onChange={(event) =>
              onStatusChange(event.target.value as ExperimentalTournamentStatusFilter)
            }
            className="min-h-10 rounded-lg border border-border bg-background/75 px-3 text-sm font-medium outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
          >
            <option value="all">{t("experimentalDashboardToolbar.wszystkie")}{counts.all})</option>
            <option value="draft">{t("experimentalDashboardToolbar.szkice")}{counts.draft})</option>
            <option value="active">{t("experimentalDashboardToolbar.aktywne")}{counts.active})</option>
            <option value="completed">{t("experimentalDashboardToolbar.zakonczone")}{counts.completed})</option>
          </select>
        </div>
      </div>
    </section>
  );
}
