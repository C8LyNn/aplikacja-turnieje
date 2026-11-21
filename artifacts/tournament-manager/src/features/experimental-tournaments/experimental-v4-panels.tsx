import { t } from "@/i18n";
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
  get planned() { return t("experimentalV4Panels.zaplanowany"); },
  get active() { return t("experimentalV4Panels.trwa"); },
  get completed() { return t("experimentalV4Panels.zakonczony"); },
};

const MATCH_STATUS_LABEL: Record<Match["status"], string> = {
  get pending() { return t("experimentalV4Panels.oczekuje"); },
  get in_progress() { return t("experimentalV4Panels.trwa"); },
  get postponed() { return t("experimentalV4Panels.przelozony"); },
  get completed() { return t("experimentalV4Panels.zakonczony"); },
  get cancelled() { return t("experimentalV4Panels.anulowany"); },
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
      ? t("experimentalV4Panels.runda_currentround_v1", { currentRound: tournament.currentRound, v1: tournament.totalRounds ? ` ${t("i18n.word.of")} ${tournament.totalRounds}` : "" })
      : t("experimentalV4Panels.turniej_trwa")
    : t("experimentalV4Panels.szkic_dodaj_uczestnikow_i_uruchom"));
  return (
    <section className="experimental-v4-resume" data-reason={reason} aria-labelledby="experimental-v4-resume-title">
      <span className="experimental-v4-resume-icon" aria-hidden="true"><Icon className="h-6 w-6" /></span>
      <div className="experimental-v4-resume-body">
        <p className="experimental-v4-kicker">{reason === "active" ? t("experimentalV4Panels.wroc_do_prowadzenia") : t("experimentalV4Panels.dokoncz_przygotowanie")}</p>
        <h2 id="experimental-v4-resume-title" className="experimental-v4-resume-title">{tournament.name}</h2>
        {reason === "active" && progress !== null ? (
          <div className="experimental-v4-progress" role="progressbar" aria-label={t("experimentalV4Panels.postep_turnieju")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <span style={{ width: `${progress}%` }} />
          </div>
        ) : null}
        <p className="experimental-v4-muted">{detail}</p>
      </div>
      <Link href={action?.href ?? href} className="experimental-v4-cta">
        {action?.label ?? (reason === "active" ? t("experimentalV4Panels.prowadz_mecze") : t("experimentalV4Panels.dodaj_uczestnikow"))}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}

/* ── Players ────────────────────────────────────────────────────────────── */

const TONE_ICON: Record<HealthTone, typeof Info> = { success: CheckCircle2, info: Info, warning: CircleAlert, danger: CircleAlert };

export function ExperimentalRosterHealth({ players, maxPlayers, requiredCount, teamsNotReady, nextHref }: { players: ReadonlyArray<Player> | null | undefined; maxPlayers?: number | null; requiredCount?: number | null; teamsNotReady?: number | null; nextHref?: string }) {
  const health = rosterHealth(players, maxPlayers, requiredCount, teamsNotReady);
  const fill = health.max ? Math.min(100, Math.round((health.count / health.max) * 100)) : null;
  return (
    <section className="experimental-v4-roster" data-ready={health.ready ? "true" : "false"} aria-label={t("experimentalV4Panels.stan_listy_uczestnikow")}>
      <div className="experimental-v4-roster-count">
        <Users className="h-5 w-5" aria-hidden="true" />
        <span className="experimental-v4-roster-value">{health.count}{health.max ? <small>/{health.max}</small> : null}</span>
        <span className="experimental-v4-muted">
          {health.freeSlots === null ? t("experimentalV4Panels.uczestnikow") : health.freeSlots === 0 ? t("experimentalV4Panels.komplet_miejsc") : t("experimentalV4Panels.wolne_miejsca_freeslots", { freeSlots: health.freeSlots })}
        </span>
      </div>
      {fill !== null ? (
        <div className="experimental-v4-progress" role="progressbar" aria-label={t("experimentalV4Panels.zapelnienie_miejsc")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={fill}>
          <span style={{ width: `${fill}%` }} />
        </div>
      ) : null}
      <ul className="experimental-v4-chips" role="list">
        {health.ready && !health.issues.some((i) => i.tone === "warning") ? (
          <li className="experimental-v4-chip" data-tone="success"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />{t("experimentalV4Panels.lista_gotowa_do_startu")}</li>
        ) : null}
        {nextHref && health.ready && !health.issues.some((i) => i.tone === "warning") ? (
          <li>
            <Link href={nextHref} className="experimental-v4-chip" data-tone="action" data-testid="roster-next-step">
              <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />{t("experimentalV4Panels.dalej_rozpocznij_turniej")}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </li>
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
    <nav className="experimental-v4-rail" aria-label={t("experimentalV4Panels.przebieg_etapow")}>
      <ol role="list">
        {items.map((item, index) => (
          <li key={item.id} className="experimental-v4-rail-step" data-status={item.status} aria-current={item.isCurrent ? "step" : undefined}>
            <span className="experimental-v4-rail-dot" aria-hidden="true">{item.status === "completed" ? "✓" : index + 1}</span>
            <span className="experimental-v4-rail-text">
              <strong>{item.name}</strong>
              <span className="experimental-v4-muted">
                {STAGE_FORMAT_LABELS[item.format] ?? item.format} · {STAGE_STATUS_LABEL[item.status] ?? item.status}
                {item.roundLabel ? ` · ${item.roundLabel}` : ""}
                {item.total > 0 ? t("experimentalV4Panels.done_total_meczow", { done: item.done, total: item.total }) : ""}
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
  selectedStageId,
  onSelectStage,
}: {
  tournamentId: number;
  stages: ReadonlyArray<TournamentStage> | null | undefined;
  matches: ReadonlyArray<Match> | null | undefined;
  activeStageId?: number | null;
  /** V5.8: when given, the map is the stage picker (one list of stages instead of a map plus a picker). */
  selectedStageId?: number;
  onSelectStage?: (stageId: number) => void;
}) {
  const enabled = (stages?.length ?? 0) >= 2;
  const basketsQuery = useGetTournamentStageBaskets(tournamentId, {
    query: { enabled: enabled && !!tournamentId, retry: false, queryKey: getGetTournamentStageBasketsQueryKey(tournamentId) },
  });
  const nodes = stageMap(stages, matches, basketsQuery.data ?? null, activeStageId);
  if (!enabled || nodes.length < 2) return null;
  const structure = structureLine(nodes);
  return (
    <nav className="experimental-v4-map" aria-label={t("experimentalV4Panels.mapa_etapow_i_awansow")} data-selectable={onSelectStage ? "true" : undefined}>
      {structure && <p className="experimental-v4-map-structure" data-testid="stage-structure-line">{structure}</p>}
      <ol role="list">
        {nodes.map((node, index) => {
          const pct = node.total > 0 ? Math.round((node.done / node.total) * 100) : null;
          const head = (
            <>
              <span className="experimental-v4-rail-dot" aria-hidden="true">{node.status === "completed" ? "✓" : index + 1}</span>
              <span className="experimental-v4-rail-text">
                <strong>{node.name}</strong>
                <span className="experimental-v4-muted">
                  {[STAGE_FORMAT_LABELS[node.format] ?? node.format, node.homeAndAway ? t("experimentalV4Panels.mecz_i_rewanz") : null, STAGE_STATUS_LABEL[node.status] ?? node.status, node.roundLabel || null]
                    .filter((part, position, all) => part && part !== node.name && all.indexOf(part) === position).join(" · ")}
                </span>
              </span>
            </>
          );
          return (
            <li key={node.id} className="experimental-v4-map-stage" data-status={node.status} data-selected={onSelectStage && node.id === selectedStageId ? "true" : undefined} aria-current={node.isCurrent ? "step" : undefined}>
              {onSelectStage ? (
                <button type="button" className="experimental-v4-map-head experimental-v4-map-pick" aria-pressed={node.id === selectedStageId} onClick={() => onSelectStage(node.id)}>
                  {head}
                </button>
              ) : (
                <header className="experimental-v4-map-head">{head}</header>
              )}
              {pct !== null ? (
                <div className="experimental-v4-map-progress">
                  <div className="experimental-v4-progress" role="progressbar" aria-label={t("experimentalV4Panels.rozegrane_mecze_name", { name: node.name })} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  <span className="experimental-v4-muted">{node.done}/{node.total} {t("experimentalV4Panels.meczow")}</span>
                </div>
              ) : null}
              <dl className="experimental-v4-map-facts">
                <div><dt>{t("experimentalV4Panels.uczestnicy")}</dt><dd>{node.participants || "—"}{node.groups ? t("experimentalV4Panels.groups_gr", { groups: node.groups }) : ""}{node.inputs.length === 1 && node.inputs[0]!.incoming > 0 ? t("experimentalV4Panels.z_awansu") : ""}</dd></div>
                {/* V5.6: a single pool repeats the participants line — the basket rows appear only when the organiser set several. */}
                {node.inputs.length > 1 && node.inputs.map((input) => (
                  <div key={input.label}>
                    <dt>{input.label}</dt>
                    <dd>
                      {input.direct > 0 ? `${input.direct} przypisanych` : ""}
                      {input.direct > 0 && input.incoming > 0 ? " + " : ""}
                      {input.incoming > 0 ? t("experimentalV4Panels.incoming_z_awansu", { incoming: input.incoming }) : ""}
                      {input.direct === 0 && input.incoming === 0 ? t("experimentalV4Panels.pusty") : ""}
                    </dd>
                  </div>
                ))}
                <div><dt>{t("experimentalV4Panels.kwalifikacja")}</dt><dd>{node.qualification}</dd></div>
              </dl>
              {node.outgoing.length > 0 || node.eliminated !== null ? (
                <ul className="experimental-v4-map-links" role="list" aria-label={t("experimentalV4Panels.co_dalej_po_etapie_name", { name: node.name })}>
                  {node.outgoing.map((link) => (
                    <li key={`${link.label}-${link.targetStageId}`} data-kind="advance">
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{link.count !== null ? `${link.count} → ` : "→ "}<strong>{link.targetName}</strong></span>
                      <span className="experimental-v4-muted">{link.label}</span>
                    </li>
                  ))}
                  {node.eliminated !== null && node.eliminated > 0 ? (
                    <li data-kind="out"><X className="h-3.5 w-3.5" aria-hidden="true" /><span>{node.eliminated} {t("experimentalV4Panels.odpada_na_tym_etapie")}</span></li>
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

/**
 * V5.8 · the whole structure in one line, from the same nodes as the map:
 * "16 uczestników → Faza grupowa: 4 grupy po 4 → awansuje 8 → Play-off".
 */
function structureLine(nodes: ReturnType<typeof stageMap>): string | null {
  if (nodes.length < 2) return null;
  const parts: string[] = [];
  const first = nodes[0]!;
  if (first.participants) parts.push(t("experimentalV4Panels.participants_uczestnikow", { participants: first.participants }));
  nodes.forEach((node, index) => {
    const size = node.groups && node.participants ? Math.ceil(node.participants / node.groups) : null;
    parts.push(node.groups ? `${node.name}: ${node.groups} ${node.groups === 1 ? t("experimentalV4Panels.grupa") : node.groups < 5 ? t("experimentalV4Panels.grupy") : t("experimentalV4Panels.grup")}${size ? ` ${t("i18n.word.groupOf")} ${size}` : ""}` : node.name);
    const next = nodes[index + 1];
    const link = next ? node.outgoing.find((candidate) => candidate.targetStageId === next.id) : undefined;
    if (next) parts.push(link?.count != null ? t("experimentalV4Panels.awansuje_count", { count: link.count }) : t("experimentalV4Panels.awans"));
  });
  return parts.join(" → ");
}

/* ── Match running: round progress, up next and search ──────────────────── */

export function ExperimentalMatchFlow({
  matches,
  allMatches,
  stageNames,
  focusedMatchId,
  onSelect,
  disabled,
  compact = false,
}: {
  /** V5.8: search only — the host shows progress and the next matches elsewhere (command center and queue). */
  compact?: boolean;
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
    <section className="experimental-v4-flow" data-searching={searching ? "true" : "false"} data-compact={compact ? "true" : undefined} aria-label={compact ? t("experimentalV4Panels.wyszukiwarka_meczow") : t("experimentalV4Panels.postep_rundy_kolejne_mecze_i")}>
      {hasRound && !compact ? (
        <div className="experimental-v4-flow-round">
          <p className="experimental-v4-kicker">{t("experimentalV4Panels.runda")}{" "}{flow.round}</p>
          <p className="experimental-v4-flow-count"><strong>{flow.roundDone}</strong>/{flow.roundTotal} {t("experimentalV4Panels.rozegranych")}</p>
          <div className="experimental-v4-progress" role="progressbar" aria-label={t("experimentalV4Panels.postep_rundy_round", { round: flow.round })} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>
      ) : null}
      <div className="experimental-v4-flow-next">
        <div className="experimental-v4-search">
          <Search className="h-4 w-4" aria-hidden="true" />
          <label htmlFor={searchId} className="sr-only">{t("experimentalV4Panels.znajdz_mecz")}</label>
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
            placeholder={t("experimentalV4Panels.znajdz_mecz_nick_r2_id")}
            title={t("experimentalV4Panels.skrot_klawiszowy")}
            autoComplete="off"
            aria-describedby={`${searchId}-hint`}
          />
          {searching ? (
            <button type="button" className="experimental-v4-search-clear" onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label={t("experimentalV4Panels.wyczysc_wyszukiwanie")}>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <p id={`${searchId}-hint`} className="sr-only">{t("experimentalV4Panels.wpisz_nick_zawodnika_runde_np")}</p>
        {searching ? (
          <>
            <p className="experimental-v4-kicker" role="status" aria-live="polite">
              {results.length === 0 ? t("experimentalV4Panels.brak_meczow_dla_tego_wyszukiwania") : t("experimentalV4Panels.znaleziono_length_v1", { length: results.length, v1: results.length > shown.length ? t("experimentalV4Panels.pokazano_length", { length: shown.length }) : "" })}
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
        ) : compact ? null : (
          <>
            <p className="experimental-v4-kicker">{t("experimentalV4Panels.nastepne_do_rozegrania")}</p>
            {flow.upNext.length === 0 ? (
              <p className="experimental-v4-muted">{t("experimentalV4Panels.brak_kolejnych_gotowych_meczow")}</p>
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
      aria-label={t("experimentalV4Panels.wybierz_mecz_id_v1_kontra", { id: m.id, v1: m.player1Name ?? "?", v2: m.player2Name ?? "?", round: m.round, v4: stageName ? `, ${stageName}` : "", v5: showStatus ? `, ${MATCH_STATUS_LABEL[m.status] ?? m.status}${score}` : "" })}
    >
      <span className="experimental-v4-flow-tag">R{m.round}·#{m.id}</span>
      <span className="experimental-v4-flow-names">{m.player1Name ?? "—"} <em>{t("experimentalV4Panels.vs")}</em> {m.player2Name ?? "—"}</span>
      {showStatus ? (
        <span className="experimental-v4-flow-state" data-status={m.status}>
          {MATCH_STATUS_LABEL[m.status] ?? m.status}{score}
          {stageName ? <small>{stageName}</small> : null}
        </span>
      ) : null}
    </button>
  );
}
