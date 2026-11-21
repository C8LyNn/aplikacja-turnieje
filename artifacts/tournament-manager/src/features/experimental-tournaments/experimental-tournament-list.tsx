import { t } from "@/i18n";
import type { MouseEvent } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Download, Trash2 } from "lucide-react";
import type { TournamentActivity } from "@workspace/api-client-react";
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
  activity?: TournamentActivity | null;
  currentRound?: number | null;
  totalRounds?: number | null;
}

const GROUPS: Array<{ status: string; title: string; empty: string }> = [
  { status: "active", get title() { return t("experimentalTournamentList.trwajace"); }, get empty() { return t("experimentalTournamentList.brak_trwajacych_turniejow"); } },
  { status: "draft", get title() { return t("experimentalTournamentList.w_przygotowaniu"); }, get empty() { return t("experimentalTournamentList.brak_szkicow"); } },
  { status: "completed", get title() { return t("experimentalTournamentList.zakonczone"); }, get empty() { return t("experimentalTournamentList.brak_zakonczonych_turniejow"); } },
];

const ACTION_LIFECYCLE: Record<TournamentActionGroup, string> = {
  play: "active",
  advance: "active",
  start: "draft",
  roster: "draft",
  prepare: "draft",
  done: "completed",
};

/** V5.11: stage names for the card's format line ("Faza grupowa → Play-off"); the engine's stage formats. */
const STAGE_FORMAT_SHORT: Record<string, string> = {
  get group_stage() { return t("experimentalTournamentList.faza_grupowa"); },
  get round_robin() { return t("experimentalTournamentList.kazdy_z_kazdym"); },
  get swiss() { return t("experimentalTournamentList.system_szwajcarski"); },
  single_elimination: "Play-off",
  get double_elimination() { return t("experimentalTournamentList.podwojna_eliminacja"); },
};

export function tournamentFormatText(
  tournament: { format: string; activity?: { stageFormats?: string[] | null } | null },
  labels: Record<string, string>,
): string {
  const stages = tournament.activity?.stageFormats ?? [];
  if (stages.length > 1) return stages.map((format) => STAGE_FORMAT_SHORT[format] ?? labels[format] ?? format).join(" → ");
  if (stages.length === 1) return labels[stages[0]!] ?? STAGE_FORMAT_SHORT[stages[0]!] ?? stages[0]!;
  return labels[tournament.format] ?? tournament.format;
}

/** V5.11: progress of the current stage from its matches (rounds alone mislead for brackets). */
export function tournamentProgress(tournament: {
  status: string;
  currentRound?: number | null;
  totalRounds?: number | null;
  activity?: { stageFormats?: string[] | null; currentStage?: { name: string; format: string; matchesCompleted: number; matchesTotal: number; currentRound: number | null; plannedRounds: number | null } | null } | null;
}): { label: string; percent: number | null } | null {
  if (tournament.status !== "active") return null;
  const stage = tournament.activity?.currentStage;
  if (stage && stage.matchesTotal > 0) {
    const parts = [
      (tournament.activity?.stageFormats?.length ?? 0) > 1 ? stage.name : null,
      stage.format === "swiss" && stage.currentRound ? t("experimentalTournamentList.runda_currentround_v1", { currentRound: stage.currentRound, v1: stage.plannedRounds ? ` z ${stage.plannedRounds}` : "" }) : null,
      t("experimentalTournamentList.matchescompleted_matchestotal_meczow", { matchesCompleted: stage.matchesCompleted, matchesTotal: stage.matchesTotal }),
    ].filter(Boolean);
    return { label: parts.join(" · "), percent: Math.min(100, Math.round((stage.matchesCompleted / stage.matchesTotal) * 100)) };
  }
  if (!tournament.currentRound) return null;
  const total = tournament.totalRounds ?? null;
  return {
    label: t("experimentalTournamentList.runda_currentround_v1", { currentRound: tournament.currentRound, v1: total ? ` z ${total}` : "" }),
    percent: total ? Math.min(100, Math.round((tournament.currentRound / total) * 100)) : null,
  };
}

const STATUS_TEXT: Record<string, string> = {
  get active() { return t("experimentalTournamentList.trwa"); },
  get draft() { return t("experimentalTournamentList.szkic"); },
  get completed() { return t("experimentalTournamentList.zakonczony"); },
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
  const labels: Record<string, string> = { double_elimination: t("experimentalTournamentList.podwojna_eliminacja"), ...formatLabels };
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
    if (rest.length) groups.push({ key: "other", status: "other", title: t("experimentalTournamentList.pozostale"), empty: "", items: rest });
  } else {
    groups = GROUPS.filter((group) => statusFilter === "all" || group.status === statusFilter)
      .map((group) => ({ ...group, key: group.status, items: tournaments.filter((item) => item.status === group.status) }))
      .filter((group) => group.items.length > 0 || statusFilter !== "all");
    const known = new Set(GROUPS.map((group) => group.status));
    const other = tournaments.filter((item) => !known.has(item.status));
    if (other.length && statusFilter === "all") groups.push({ key: "other", status: "other", title: t("experimentalTournamentList.pozostale"), empty: "", items: other });
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
                const progress = tournamentProgress(tournament);
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
                        <span>{tournamentFormatText(tournament, labels)}</span>
                        {tournament.maxPlayers ? <span>{tournament.maxPlayers} {t("experimentalTournamentList.miejsc")}</span> : null}
                        <span className="experimental-tlist-created">
                          {t("experimentalTournamentList.utworzono")}{" "}{format(new Date(tournament.createdAt), "d MMM yyyy", { locale: pl })}
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
                      {progress ? (
                        <div className="experimental-tlist-round">
                          <span className="tabular-nums">{progress.label}</span>
                          {progress.percent !== null && (
                            <span className="experimental-tlist-bar" aria-hidden="true">
                              <span style={{ width: `${progress.percent}%` }} />
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
                          aria-label={t("experimentalTournamentList.pobierz_backup_turnieju_name", { name: tournament.name })}
                          title={t("experimentalTournamentList.pobierz_backup")}
                          disabled={exportingId === tournament.id}
                          onClick={(event) => onExport(event, tournament)}
                        >
                          <Download className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="experimental-tlist-icon experimental-tlist-icon--danger"
                        aria-label={t("experimentalTournamentList.usun_turniej_name", { name: tournament.name })}
                        title={t("experimentalTournamentList.usun_turniej")}
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
