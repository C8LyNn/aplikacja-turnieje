import { CircleCheck, PencilRuler, Radio, type LucideIcon } from "lucide-react";
import type { ExperimentalTournamentStatusFilter } from "@/features/experimental-tournaments/experimental-dashboard-toolbar";

type LifecycleStatus = Exclude<ExperimentalTournamentStatusFilter, "all">;

const TILES: Array<{ status: LifecycleStatus; label: string; icon: LucideIcon }> = [
  { status: "active", label: "Trwające", icon: Radio },
  { status: "draft", label: "W przygotowaniu", icon: PencilRuler },
  { status: "completed", label: "Zakończone", icon: CircleCheck },
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
    <div className="experimental-dstats" role="group" aria-label="Filtruj turnieje według etapu">
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
