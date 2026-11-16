/**
 * SWARM-006 UX v4 — Experimental-only panels for the dashboard, players, stages and
 * match running. They render inside `.experimental-tournament-shell` and reuse the
 * Arena tokens, so every skin, background and colour system applies unchanged.
 */
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, CircleAlert, Info, PlayCircle, PencilRuler, Users } from "lucide-react";
import type { Match, Player, Tournament, TournamentStage } from "@workspace/api-client-react";
import { STAGE_FORMAT_LABELS } from "@/lib/tournament-stages-ui";
import { tournamentHref } from "@/features/experimental-tournaments/experimental-tournament-routing";
import { matchFlow, pickResumeTournament, rosterHealth, stageRail, type HealthTone } from "@/features/experimental-tournaments/experimental-v4-model";

const STAGE_STATUS_LABEL: Record<TournamentStage["status"], string> = {
  planned: "Zaplanowany",
  active: "Trwa",
  completed: "Zakończony",
};

/* ── Dashboard ──────────────────────────────────────────────────────────── */

export function ExperimentalResumeCard({ tournaments }: { tournaments: ReadonlyArray<Tournament> | null | undefined }) {
  const target = pickResumeTournament(tournaments);
  if (!target) return null;
  const { tournament, reason, progress } = target;
  const href = reason === "active"
    ? tournamentHref(tournament.id, true, "/host")
    : tournamentHref(tournament.id, true, "?tab=players");
  const Icon = reason === "active" ? PlayCircle : PencilRuler;
  return (
    <section className="experimental-v4-resume" data-reason={reason} aria-labelledby="experimental-v4-resume-title">
      <span className="experimental-v4-resume-icon" aria-hidden="true"><Icon className="h-6 w-6" /></span>
      <div className="experimental-v4-resume-body">
        <p className="experimental-v4-kicker">{reason === "active" ? "Wróć do prowadzenia" : "Dokończ przygotowanie"}</p>
        <h2 id="experimental-v4-resume-title" className="experimental-v4-resume-title">{tournament.name}</h2>
        {reason === "active" && progress !== null ? (
          <div className="experimental-v4-progress" role="progressbar" aria-label="Postęp turnieju" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <span style={{ width: `${progress}%` }} />
          </div>
        ) : null}
        <p className="experimental-v4-muted">
          {reason === "active"
            ? tournament.currentRound
              ? `Runda ${tournament.currentRound}${tournament.totalRounds ? ` z ${tournament.totalRounds}` : ""}`
              : "Turniej trwa"
            : "Szkic — dodaj uczestników i uruchom turniej"}
        </p>
      </div>
      <Link href={href} className="experimental-v4-cta">
        {reason === "active" ? "Prowadź mecze" : "Dodaj uczestników"}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}

/* ── Players ────────────────────────────────────────────────────────────── */

const TONE_ICON: Record<HealthTone, typeof Info> = { success: CheckCircle2, info: Info, warning: CircleAlert, danger: CircleAlert };

export function ExperimentalRosterHealth({ players, maxPlayers }: { players: ReadonlyArray<Player> | null | undefined; maxPlayers?: number | null }) {
  const health = rosterHealth(players, maxPlayers);
  const fill = health.max ? Math.min(100, Math.round((health.count / health.max) * 100)) : null;
  return (
    <section className="experimental-v4-roster" data-ready={health.ready ? "true" : "false"} aria-label="Stan listy uczestników">
      <div className="experimental-v4-roster-count">
        <Users className="h-5 w-5" aria-hidden="true" />
        <span className="experimental-v4-roster-value">{health.count}{health.max ? <small>/{health.max}</small> : null}</span>
        <span className="experimental-v4-muted">
          {health.freeSlots === null ? "uczestników" : health.freeSlots === 0 ? "komplet miejsc" : `wolne miejsca: ${health.freeSlots}`}
        </span>
      </div>
      {fill !== null ? (
        <div className="experimental-v4-progress" role="progressbar" aria-label="Zapełnienie miejsc" aria-valuemin={0} aria-valuemax={100} aria-valuenow={fill}>
          <span style={{ width: `${fill}%` }} />
        </div>
      ) : null}
      <ul className="experimental-v4-chips" role="list">
        {health.ready && !health.issues.some((i) => i.tone === "warning") ? (
          <li className="experimental-v4-chip" data-tone="success"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />Lista gotowa do startu</li>
        ) : null}
        {health.issues.map((issue) => {
          const Icon = TONE_ICON[issue.tone];
          return (
            <li key={issue.key} className="experimental-v4-chip" data-tone={issue.tone}>
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />{issue.label}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ── Stages ─────────────────────────────────────────────────────────────── */

export function ExperimentalStageRail({
  stages,
  matches,
  activeStageId,
}: {
  stages: ReadonlyArray<TournamentStage> | null | undefined;
  matches: ReadonlyArray<Match> | null | undefined;
  activeStageId?: number | null;
}) {
  const items = stageRail(stages, matches, activeStageId);
  if (items.length < 2) return null;
  return (
    <nav className="experimental-v4-rail" aria-label="Przebieg etapów">
      <ol role="list">
        {items.map((item, index) => (
          <li key={item.id} className="experimental-v4-rail-step" data-status={item.status} aria-current={item.isCurrent ? "step" : undefined}>
            <span className="experimental-v4-rail-dot" aria-hidden="true">{item.status === "completed" ? "✓" : index + 1}</span>
            <span className="experimental-v4-rail-text">
              <strong>{item.name}</strong>
              <span className="experimental-v4-muted">
                {STAGE_FORMAT_LABELS[item.format] ?? item.format} · {STAGE_STATUS_LABEL[item.status] ?? item.status}
                {item.roundLabel ? ` · ${item.roundLabel}` : ""}
                {item.total > 0 ? ` · ${item.done}/${item.total} meczów` : ""}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ── Match running ──────────────────────────────────────────────────────── */

export function ExperimentalMatchFlow({
  matches,
  focusedMatchId,
  onSelect,
  disabled,
}: {
  matches: ReadonlyArray<Match> | null | undefined;
  focusedMatchId: number | null | undefined;
  onSelect: (matchId: number) => void;
  disabled?: boolean;
}) {
  const flow = matchFlow(matches, focusedMatchId);
  if (flow.round === null || flow.roundTotal === 0) return null;
  const pct = Math.round((flow.roundDone / flow.roundTotal) * 100);
  return (
    <section className="experimental-v4-flow" aria-label="Postęp rundy i kolejne mecze">
      <div className="experimental-v4-flow-round">
        <p className="experimental-v4-kicker">Runda {flow.round}</p>
        <p className="experimental-v4-flow-count"><strong>{flow.roundDone}</strong>/{flow.roundTotal} rozegranych</p>
        <div className="experimental-v4-progress" role="progressbar" aria-label={`Postęp rundy ${flow.round}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="experimental-v4-flow-next">
        <p className="experimental-v4-kicker">Następne do rozegrania</p>
        {flow.upNext.length === 0 ? (
          <p className="experimental-v4-muted">Brak kolejnych gotowych meczów.</p>
        ) : (
          <ol role="list">
            {flow.upNext.map((m) => (
              <li key={m.id}>
                <button type="button" className="experimental-v4-flow-match" disabled={disabled} onClick={() => onSelect(m.id)}
                  aria-label={`Wybierz mecz ${m.player1Name ?? "?"} kontra ${m.player2Name ?? "?"}, runda ${m.round}`}>
                  <span className="experimental-v4-flow-tag">R{m.round}·{m.matchNumber}</span>
                  <span className="experimental-v4-flow-names">{m.player1Name ?? "—"} <em>vs</em> {m.player2Name ?? "—"}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
