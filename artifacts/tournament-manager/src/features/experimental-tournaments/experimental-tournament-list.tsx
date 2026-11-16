import type { MouseEvent } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Download, Trash2 } from "lucide-react";
import { tournamentHref } from "@/features/experimental-tournaments/experimental-tournament-routing";
import { ACTION_GROUPS, tournamentAction, type TournamentAction, type TournamentActionGroup } from "@/features/experimental-tournaments/experimental-v4-model";
import type { ExperimentalTournamentStatusFilter } from "@/features/experimental-tournaments/experimental-dashboard-toolbar";

export interface ExperimentalTournamentListItem {
  id: number;
  name: string;
  description?: string | null;
  status: string;
  format: string;
  maxPlayers?: number | null;
  createdAt: string;
  /** v4: workload summary from the list API; absent on older servers. */
  activity?: { playerCount: number; readyMatchCount: number; liveMatchCount: number } | null;
  currentRound?: number | null;
  totalRounds?: number | null;
}

const GROUPS: Array<{ status: string; title: string; empty: string }> = [
  { status: "active", title: "Trwające", empty: "Brak trwających turniejów." },
  { status: "draft", title: "W przygotowaniu", empty: "Brak szkiców." },
  { status: "completed", title: "Zakończone", empty: "Brak zakończonych turniejów." },
];

const ACTION_LIFECYCLE: Record<TournamentActionGroup, string> = {
  play: "active",
  advance: "active",
  start: "draft",
  roster: "draft",
  done: "completed",
};

const STATUS_TEXT: Record<string, string> = {
  active: "Trwa",
  draft: "Szkic",
  completed: "Zakończony",
};

/** Two-letter badge from the tournament name, e.g. "Winter Clash 2026" -> "WC". Decorative only. */
export function monogram(name: string): string {
  const words = name.match(/[\p{L}\p{N}]+/gu) ?? [];
  const letters = words.filter((word) => /\p{L}/u.test(word[0] ?? "")).map((word) => word[0]!.toUpperCase());
  if (letters.length >= 2) return letters[0]! + letters[1]!;
  return (words[0] ?? "?").slice(0, 2).toUpperCase();
}

/**
 * Experimental-only presentation of the organizer's tournaments.
 * Grouped by lifecycle so live events are always first; all actions stay visible
 * and named for keyboard, touch and screen-reader users. No data access here.
 */
export function ExperimentalTournamentList({
  tournaments,
  statusFilter,
  formatLabels,
  canExport,
  exportingId,
  onExport,
  onDelete,
}: {
  tournaments: readonly ExperimentalTournamentListItem[];
  statusFilter: ExperimentalTournamentStatusFilter;
  formatLabels: Record<string, string>;
  canExport: (id: number) => boolean;
  exportingId: number | null;
  onExport: (event: MouseEvent, tournament: ExperimentalTournamentListItem) => void;
  onDelete: (id: number) => void;
}) {
  const labels: Record<string, string> = { double_elimination: "Podwójna eliminacja", ...formatLabels };
  // v4: when the API reports activity, group by the action each tournament needs;
  // otherwise keep the V3 lifecycle grouping unchanged.
  const actions = new Map<number, TournamentAction | null>(tournaments.map((item) => [item.id, tournamentAction(item)]));
  const actionMode = tournaments.some((item) => actions.get(item.id));
  type Group = { key: string; status: string; title: string; empty: string; items: ExperimentalTournamentListItem[] };
  let groups: Group[];
  if (actionMode) {
    groups = ACTION_GROUPS.map(({ group, title }) => ({
      key: group,
      status: ACTION_LIFECYCLE[group],
      title,
      empty: "",
      items: tournaments.filter((item) => actions.get(item.id)?.group === group),
    })).filter((group) => group.items.length > 0);
    const rest = tournaments.filter((item) => !actions.get(item.id));
    if (rest.length) groups.push({ key: "other", status: "other", title: "Pozostałe", empty: "", items: rest });
  } else {
    groups = GROUPS.filter((group) => statusFilter === "all" || group.status === statusFilter)
      .map((group) => ({ ...group, key: group.status, items: tournaments.filter((item) => item.status === group.status) }))
      .filter((group) => group.items.length > 0 || statusFilter !== "all");
    const known = new Set(GROUPS.map((group) => group.status));
    const other = tournaments.filter((item) => !known.has(item.status));
    if (other.length && statusFilter === "all") groups.push({ key: "other", status: "other", title: "Pozostałe", empty: "", items: other });
  }

  return (
    <div className="experimental-tlist">
      {groups.map((group) => (
        <section
          key={group.key}
          aria-labelledby={`exp-tlist-${group.key}`}
          className="experimental-tlist-group"
          data-group={group.status}
          data-action-group={actionMode ? group.key : undefined}
        >
          <h2 id={`exp-tlist-${group.key}`} className="experimental-tlist-heading">
            {group.title}
            <span className="experimental-tlist-count">{group.items.length}</span>
          </h2>
          {group.items.length === 0 ? (
            <p className="experimental-tlist-empty">{group.empty}</p>
          ) : (
            <ul className="experimental-tlist-items">
              {group.items.map((tournament) => {
                const action = actions.get(tournament.id) ?? null;
                const round =
                  tournament.status === "active" && tournament.currentRound
                    ? { current: tournament.currentRound, total: tournament.totalRounds ?? null }
                    : null;
                const progress = round?.total ? Math.min(100, Math.round((round.current / round.total) * 100)) : null;
                return (
                  <li key={tournament.id} className="experimental-tlist-row" data-status={tournament.status}>
                    <span className="experimental-tlist-mono" aria-hidden="true">
                      {monogram(tournament.name)}
                    </span>
                    <div className="experimental-tlist-main">
                      <Link href={tournamentHref(tournament.id, true)} className="experimental-tlist-link">
                        {tournament.name}
                      </Link>
                      <p className="experimental-tlist-meta">
                        <span>{labels[tournament.format] ?? tournament.format}</span>
                        {tournament.maxPlayers ? <span>{tournament.maxPlayers} miejsc</span> : null}
                        <span>
                          Utworzono {format(new Date(tournament.createdAt), "d MMM yyyy", { locale: pl })}
                        </span>
                      </p>
                      {action ? <p className="experimental-tlist-hint">{action.hint}</p> : null}
                      {tournament.description ? (
                        <p className="experimental-tlist-description">{tournament.description}</p>
                      ) : null}
                    </div>

                    <div className="experimental-tlist-state">
                      <span className="experimental-tlist-status" data-status={tournament.status}>
                        <span aria-hidden="true" className="experimental-tlist-dot" />
                        {STATUS_TEXT[tournament.status] ?? tournament.status}
                      </span>
                      {round ? (
                        <div className="experimental-tlist-round">
                          <span className="tabular-nums">
                            Runda {round.current}{round.total ? ` z ${round.total}` : ""}
                          </span>
                          {progress !== null && (
                            <span className="experimental-tlist-bar" aria-hidden="true">
                              <span style={{ width: `${progress}%` }} />
                            </span>
                          )}
                        </div>
                      ) : null}
                      {action ? (
                        <Link href={action.href} className="experimental-tlist-action" data-action-group={action.group} aria-label={`${action.label}: ${tournament.name}`}>
                          {action.label}
                        </Link>
                      ) : null}
                    </div>

                    <div className="experimental-tlist-actions">
                      {canExport(tournament.id) && (
                        <button
                          type="button"
                          className="experimental-tlist-icon"
                          aria-label={`Pobierz backup turnieju ${tournament.name}`}
                          title="Pobierz backup"
                          disabled={exportingId === tournament.id}
                          onClick={(event) => onExport(event, tournament)}
                        >
                          <Download className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="experimental-tlist-icon experimental-tlist-icon--danger"
                        aria-label={`Usuń turniej ${tournament.name}`}
                        title="Usuń turniej"
                        onClick={() => onDelete(tournament.id)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
