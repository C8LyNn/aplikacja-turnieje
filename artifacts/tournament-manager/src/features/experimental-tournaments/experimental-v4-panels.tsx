/**
 * SWARM-006 UX v4 — Experimental-only panels for the dashboard, players, stages and
 * match running. They render inside `.experimental-tournament-shell` and reuse the
 * Arena tokens, so every skin, background and colour system applies unchanged.
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, CircleAlert, Info, PlayCircle, PencilRuler, Search, Users, X } from "lucide-react";
import {
  getGetTournamentStageBasketsQueryKey,
  useGetTournamentStageBaskets,
  type Match,
  type Player,
  type Tournament,
  type TournamentStage,
} from "@workspace/api-client-react";
import { STAGE_FORMAT_LABELS } from "@/lib/tournament-stages-ui";
import { tournamentHref } from "@/features/experimental-tournaments/experimental-tournament-routing";
import {
  matchFlow,
  pickResumeTournament,
  rosterHealth,
  searchMatches,
  stageMap,
  stageRail,
  tournamentAction,
  type HealthTone,
} from "@/features/experimental-tournaments/experimental-v4-model";

const STAGE_STATUS_LABEL: Record<TournamentStage["status"], string> = {
  planned: "Zaplanowany",
  active: "Trwa",
  completed: "Zakończony",
};

const MATCH_STATUS_LABEL: Record<Match["status"], string> = {
  pending: "Oczekuje",
  in_progress: "Trwa",
  postponed: "Przełożony",
  completed: "Zakończony",
  cancelled: "Anulowany",
};

/* ── Dashboard ──────────────────────────────────────────────────────────── */

export function ExperimentalResumeCard({ tournaments }: { tournaments: ReadonlyArray<Tournament> | null | undefined }) {
  const target = pickResumeTournament(tournaments);
  if (!target) return null;
  const { tournament, reason, progress } = target;
  const action = tournamentAction(tournament as Tournament);
  const href = reason === "active"
    ? tournamentHref(tournament.id, true, "/host")
    : tournamentHref(tournament.id, true, "?tab=players");
  const Icon = reason === "active" ? PlayCircle : PencilRuler;
  const detail = action?.hint ?? (reason === "active"
    ? tournament.currentRound
      ? `Runda ${tournament.currentRound}${tournament.totalRounds ? ` z ${tournament.totalRounds}` : ""}`
      : "Turniej trwa"
    : "Szkic — dodaj uczestników i uruchom turniej");
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
        <p className="experimental-v4-muted">{detail}</p>
      </div>
      <Link href={action?.href ?? href} className="experimental-v4-cta">
        {action?.label ?? (reason === "active" ? "Prowadź mecze" : "Dodaj uczestników")}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}

/* ── Players ────────────────────────────────────────────────────────────── */

const TONE_ICON: Record<HealthTone, typeof Info> = { success: CheckCircle2, info: Info, warning: CircleAlert, danger: CircleAlert };

export function ExperimentalRosterHealth({ players, maxPlayers, requiredCount, teamsNotReady }: { players: ReadonlyArray<Player> | null | undefined; maxPlayers?: number | null; requiredCount?: number | null; teamsNotReady?: number | null }) {
  const health = rosterHealth(players, maxPlayers, requiredCount, teamsNotReady);
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

/** Compact rail (kept for narrow contexts); the stages tab uses the full map below. */
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

/**
 * Stage map: every stage with its entry baskets, qualification rule and where its
 * qualifiers go. Basket data is read with the same query (and cache key) as the
 * baskets tab; when it is unavailable the map falls back to the stage plan.
 */
export function ExperimentalStageMap({
  tournamentId,
  stages,
  matches,
  activeStageId,
}: {
  tournamentId: number;
  stages: ReadonlyArray<TournamentStage> | null | undefined;
  matches: ReadonlyArray<Match> | null | undefined;
  activeStageId?: number | null;
}) {
  const enabled = (stages?.length ?? 0) >= 2;
  const basketsQuery = useGetTournamentStageBaskets(tournamentId, {
    query: { enabled: enabled && !!tournamentId, retry: false, queryKey: getGetTournamentStageBasketsQueryKey(tournamentId) },
  });
  const nodes = stageMap(stages, matches, basketsQuery.data ?? null, activeStageId);
  if (!enabled || nodes.length < 2) return null;
  return (
    <nav className="experimental-v4-map" aria-label="Mapa etapów i awansów">
      <ol role="list">
        {nodes.map((node, index) => {
          const pct = node.total > 0 ? Math.round((node.done / node.total) * 100) : null;
          return (
            <li key={node.id} className="experimental-v4-map-stage" data-status={node.status} aria-current={node.isCurrent ? "step" : undefined}>
              <header className="experimental-v4-map-head">
                <span className="experimental-v4-rail-dot" aria-hidden="true">{node.status === "completed" ? "✓" : index + 1}</span>
                <span className="experimental-v4-rail-text">
                  <strong>{node.name}</strong>
                  <span className="experimental-v4-muted">
                    {STAGE_FORMAT_LABELS[node.format] ?? node.format}{node.homeAndAway ? " · mecz i rewanż" : ""} · {STAGE_STATUS_LABEL[node.status] ?? node.status}
                    {node.roundLabel ? ` · ${node.roundLabel}` : ""}
                  </span>
                </span>
              </header>
              {pct !== null ? (
                <div className="experimental-v4-map-progress">
                  <div className="experimental-v4-progress" role="progressbar" aria-label={`Rozegrane mecze: ${node.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  <span className="experimental-v4-muted">{node.done}/{node.total} meczów</span>
                </div>
              ) : null}
              <dl className="experimental-v4-map-facts">
                <div><dt>Uczestnicy</dt><dd>{node.participants || "—"}{node.groups ? ` · ${node.groups} gr.` : ""}</dd></div>
                {node.inputs.map((input) => (
                  <div key={input.label}>
                    <dt>{input.label}</dt>
                    <dd>
                      {input.direct > 0 ? `${input.direct} przypisanych` : ""}
                      {input.direct > 0 && input.incoming > 0 ? " + " : ""}
                      {input.incoming > 0 ? `${input.incoming} z awansu` : ""}
                      {input.direct === 0 && input.incoming === 0 ? "pusty" : ""}
                    </dd>
                  </div>
                ))}
                <div><dt>Kwalifikacja</dt><dd>{node.qualification}</dd></div>
              </dl>
              {node.outgoing.length > 0 || node.eliminated !== null ? (
                <ul className="experimental-v4-map-links" role="list" aria-label={`Co dalej po etapie ${node.name}`}>
                  {node.outgoing.map((link) => (
                    <li key={`${link.label}-${link.targetStageId}`} data-kind="advance">
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{link.count !== null ? `${link.count} → ` : "→ "}<strong>{link.targetName}</strong></span>
                      <span className="experimental-v4-muted">{link.label}</span>
                    </li>
                  ))}
                  {node.eliminated !== null && node.eliminated > 0 ? (
                    <li data-kind="out"><X className="h-3.5 w-3.5" aria-hidden="true" /><span>{node.eliminated} kończy turniej na tym etapie</span></li>
                  ) : null}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ── Match running: round progress, up next and search ──────────────────── */

export function ExperimentalMatchFlow({
  matches,
  allMatches,
  stageNames,
  focusedMatchId,
  onSelect,
  disabled,
}: {
  /** Matches of the stage being run (drives round progress and "up next"). */
  matches: ReadonlyArray<Match> | null | undefined;
  /** Every match of the tournament, for search. Defaults to `matches`. */
  allMatches?: ReadonlyArray<Match> | null;
  stageNames?: ReadonlyMap<number, string>;
  focusedMatchId: number | null | undefined;
  onSelect: (matchId: number) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const searchId = useId();
  const pool = allMatches ?? matches;
  const results = useMemo(() => searchMatches(pool, query), [pool, query]);
  const flow = matchFlow(matches, focusedMatchId);
  const searching = query.trim().length > 0;

  // "/" focuses the search unless the user is typing somewhere else.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!pool?.length) return null;

  const select = (id: number) => {
    onSelect(id);
    const panel = typeof document !== "undefined" ? document.querySelector<HTMLElement>(".experimental-host-primary") : null;
    panel?.scrollIntoView?.({ block: "start", behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  const hasRound = flow.round !== null && flow.roundTotal > 0;
  const pct = hasRound ? Math.round((flow.roundDone / flow.roundTotal) * 100) : 0;
  const shown = results.slice(0, 30);

  return (
    <section className="experimental-v4-flow" data-searching={searching ? "true" : "false"} aria-label="Postęp rundy, kolejne mecze i wyszukiwarka">
      {hasRound ? (
        <div className="experimental-v4-flow-round">
          <p className="experimental-v4-kicker">Runda {flow.round}</p>
          <p className="experimental-v4-flow-count"><strong>{flow.roundDone}</strong>/{flow.roundTotal} rozegranych</p>
          <div className="experimental-v4-progress" role="progressbar" aria-label={`Postęp rundy ${flow.round}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>
      ) : null}
      <div className="experimental-v4-flow-next">
        <div className="experimental-v4-search">
          <Search className="h-4 w-4" aria-hidden="true" />
          <label htmlFor={searchId} className="sr-only">Znajdź mecz</label>
          <input
            ref={inputRef}
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setQuery("");
              if (event.key === "Enter" && shown[0] && !disabled) { select(shown[0].id); setQuery(""); }
            }}
            placeholder="Znajdź mecz: nick, r2, #ID"
            title="Skrót klawiszowy: /"
            autoComplete="off"
            aria-describedby={`${searchId}-hint`}
          />
          {searching ? (
            <button type="button" className="experimental-v4-search-clear" onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label="Wyczyść wyszukiwanie">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <p id={`${searchId}-hint`} className="sr-only">Wpisz nick zawodnika, rundę (np. r2) albo numer meczu (np. #41). Enter wybiera pierwszy wynik, Escape czyści.</p>
        {searching ? (
          <>
            <p className="experimental-v4-kicker" role="status" aria-live="polite">
              {results.length === 0 ? "Brak meczów dla tego wyszukiwania" : `Znaleziono: ${results.length}${results.length > shown.length ? ` (pokazano ${shown.length})` : ""}`}
            </p>
            {shown.length > 0 ? (
              <ol role="list" className="experimental-v4-flow-results">
                {shown.map((m) => (
                  <li key={m.id}>
                    <MatchButton match={m} stageName={stageNames?.get(m.stageId)} focused={m.id === focusedMatchId} disabled={disabled} onSelect={select} showStatus />
                  </li>
                ))}
              </ol>
            ) : null}
          </>
        ) : (
          <>
            <p className="experimental-v4-kicker">Następne do rozegrania</p>
            {flow.upNext.length === 0 ? (
              <p className="experimental-v4-muted">Brak kolejnych gotowych meczów.</p>
            ) : (
              <ol role="list">
                {flow.upNext.map((m) => (
                  <li key={m.id}><MatchButton match={m} disabled={disabled} onSelect={select} /></li>
                ))}
              </ol>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function MatchButton({ match: m, stageName, focused, disabled, onSelect, showStatus }: {
  match: Match;
  stageName?: string;
  focused?: boolean;
  disabled?: boolean;
  onSelect: (id: number) => void;
  showStatus?: boolean;
}) {
  const score = m.status === "completed" && m.score1 != null && m.score2 != null ? ` ${m.score1}:${m.score2}` : "";
  return (
    <button
      type="button"
      className="experimental-v4-flow-match"
      data-status={m.status}
      aria-current={focused ? "true" : undefined}
      disabled={disabled}
      onClick={() => onSelect(m.id)}
      aria-label={`Wybierz mecz #${m.id}: ${m.player1Name ?? "?"} kontra ${m.player2Name ?? "?"}, runda ${m.round}${stageName ? `, ${stageName}` : ""}${showStatus ? `, ${MATCH_STATUS_LABEL[m.status] ?? m.status}${score}` : ""}`}
    >
      <span className="experimental-v4-flow-tag">R{m.round}·#{m.id}</span>
      <span className="experimental-v4-flow-names">{m.player1Name ?? "—"} <em>vs</em> {m.player2Name ?? "—"}</span>
      {showStatus ? (
        <span className="experimental-v4-flow-state" data-status={m.status}>
          {MATCH_STATUS_LABEL[m.status] ?? m.status}{score}
          {stageName ? <small>{stageName}</small> : null}
        </span>
      ) : null}
    </button>
  );
}
