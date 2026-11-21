import { t } from "@/i18n";
import { CircleCheck, PencilRuler, Radio, type LucideIcon } from "lucide-react";
import type { ExperimentalTournamentStatusFilter } from "@/features/experimental-tournaments/experimental-dashboard-toolbar";

type LifecycleStatus = Exclude<ExperimentalTournamentStatusFilter, "all">;

const TILES: Array<{ status: LifecycleStatus; label: string; icon: LucideIcon }> = [
  { status: "active", get label() { return t("experimentalDashboardStats.trwajace"); }, icon: Radio },
  { status: "draft", get label() { return t("experimentalDashboardStats.w_przygotowaniu"); }, icon: PencilRuler },
  { status: "completed", get label() { return t("experimentalDashboardStats.zakonczone"); }, icon: CircleCheck },
];

/**
 * Lifecycle summary for the Experimental dashboard. Each tile is also a filter toggle
 * (the same state as the toolbar select), so the numbers are actionable.
 */
export function ExperimentalDashboardStats({
  counts,
  status,
  onStatusChange,
}: {
  counts: Record<ExperimentalTournamentStatusFilter, number>;
  status: ExperimentalTournamentStatusFilter;
  onStatusChange: (status: ExperimentalTournamentStatusFilter) => void;
}) {
  return (
    <div className="experimental-dstats" role="group" aria-label={t("experimentalDashboardStats.filtruj_turnieje_wedlug_etapu")}>
      {TILES.map(({ status: tileStatus, label, icon: Icon }) => {
        const pressed = status === tileStatus;
        return (
          <button
            key={tileStatus}
            type="button"
            className="experimental-dstat"
            data-status={tileStatus}
            aria-pressed={pressed}
            onClick={() => onStatusChange(pressed ? "all" : tileStatus)}
          >
            <span className="experimental-dstat-icon" aria-hidden="true">
              <Icon className="h-5 w-5" />
            </span>
            <span className="experimental-dstat-value">{counts[tileStatus]}</span>
            <span className="experimental-dstat-label">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
