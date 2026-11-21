import { t as tr, stageLabel } from "@/i18n";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  bracketView, doubleView, matchOverlayModel, pickStage, scheduleText, tablesView, toPublicMatch, toPublicStage,
  toPublicTournament, upcomingHeading, winnerModel, type MatchCard, type MatchOverlayModel, type OverlayConfig, type PublicStage,
  type StructureView, type WinnerModel,
} from "@/lib/broadcast-overlay";
import { eventText, nextAlertQueue, overlayEvents, overlaySnapshot, type AlertItem, type OverlaySnapshot } from "@/lib/broadcast-overlay-events";
import { fetchPublic, useDelayed, usePolled, type OverlayProblem } from "./overlay-data";

type Raw = Record<string, unknown>;

const loadingText = () => tr("overlayApp.wczytywanie_danych_turnieju");
/** Nothing is shown before this, so a quick first answer never flashes a loading text on air. */
const LOADING_GRACE_MS = 2500;
const PROBLEM_TEXT: Record<OverlayProblem, string> = {
  get private() { return tr("overlayApp.nakladki_dzialaja_tylko_dla_turniejow"); },
  get missing() { return tr("overlayApp.nie_znaleziono_turnieju"); },
  get offline() { return tr("overlayApp.brak_polaczenia_z_swarm_006"); },
  get invalid() { return tr("overlayApp.nie_udalo_sie_odczytac_danych"); },
};

/** V5.9 · the whole overlay page: one view, chosen by the address; nothing to click. */
export function OverlayApp({ config }: { config: OverlayConfig }) {
  const rootStyle = { "--ov-text-scale": String(config.textScale) } as CSSProperties;
  return (
    <main className="ov" data-preset={config.preset} data-bg={config.background} data-motion={config.motion} data-pos={config.position} data-alerts={config.alerts || undefined}
      data-layout={config.layout} data-size={config.scoreSize} data-kind={config.kind} style={rootStyle}>
      {config.tournamentId == null
        ? <OverlayMessage text={tr("overlayApp.w_adresie_nakladki_brakuje_turnieju")} />
        : config.kind === "struktura" ? <StructureOverlay config={config} tournamentId={config.tournamentId} />
        : <MatchOverlay config={config} tournamentId={config.tournamentId} />}
    </main>
  );
}

function OverlayMessage({ text, subtle = false }: { text: string; subtle?: boolean }) {
  return <div className={`ov-message${subtle ? " ov-message--subtle" : ""}`} role="status" data-loading={subtle || undefined}>{text}</div>;
}

/** Loading: nothing for the first moments, then a quiet text. */
function Loading() {
  const show = useDelayed(LOADING_GRACE_MS);
  return show ? <OverlayMessage text={loadingText()} subtle /> : null;
}

const clock = (at: number | null) => (at ? new Date(at).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }) : "");
function StaleMark({ lastOkAt }: { lastOkAt: number | null }) {
  return <div className="ov-stale" role="status">{tr("overlayApp.brak_polaczenia_stan_z")}{" "}{clock(lastOkAt)}</div>;
}

async function loadStages(tournamentId: number, signal: AbortSignal) {
  return ((await fetchPublic<Raw[]>(`/api/tournaments/${tournamentId}/stages`, signal)) ?? []).map(toPublicStage);
}

// ─── score bar and upcoming card ───────────────────────────────────────────

const STAGES_REFRESH_MS = 60_000;

type LiveModel = MatchOverlayModel & { winner?: WinnerModel; snapshot?: OverlaySnapshot };

function MatchOverlay({ config, tournamentId }: { config: OverlayConfig; tournamentId: number }) {
  // Stages change rarely: they are re-read once a minute inside the same poll; the model below is what gets compared.
  const stagesCache = useRef<{ at: number; stages: PublicStage[] } | null>(null);
  const live = usePolled<LiveModel>(`match:${tournamentId}:${config.match}:${config.kind}:${config.showQueue}:${config.alerts}`, async (signal) => {
    const cached = stagesCache.current;
    const stagesPromise = cached && Date.now() - cached.at < STAGES_REFRESH_MS ? Promise.resolve(cached.stages) : loadStages(tournamentId, signal);
    const [tournament, matches, stages] = await Promise.all([
      fetchPublic<Raw>(`/api/tournaments/${tournamentId}`, signal),
      fetchPublic<Raw[]>(`/api/tournaments/${tournamentId}/matches`, signal),
      stagesPromise,
    ]);
    if (stages !== cached?.stages) stagesCache.current = { at: Date.now(), stages };
    const t = toPublicTournament(tournament);
    const list = (matches ?? []).map(toPublicMatch);
    return {
      ...matchOverlayModel(config, t, list, stages),
      ...(config.kind === "zwyciezca" ? { winner: winnerModel(t, list, stages) } : {}),
      // #324-L03b: the data the alerts compare — only when alerts are on, so a plain overlay re-renders exactly as before
      ...(config.alerts ? { snapshot: overlaySnapshot(t, list, stages) } : {}),
    };
  }, 5_000);
  const alert = useOverlayAlerts(live.data?.snapshot, live.problem, config.alerts);
  if (!live.data) return live.problem ? <OverlayMessage text={PROBLEM_TEXT[live.problem]} /> : <Loading />;
  const model = live.data;
  const banner = alert && <AlertBanner item={alert} />;
  if (config.kind === "zwyciezca" && model.winner) {
    return <>{banner}<WinnerCard model={model.winner} config={config} />{live.stale && <StaleMark lastOkAt={live.lastOkAt} />}</>;
  }
  if (!model.card) return <>{banner}<OverlayMessage text={model.reason ?? ""} /></>;
  return (
    <>
      {banner}
      {config.kind === "zapowiedz"
        ? <UpcomingCard card={model.card} model={model} config={config} />
        : <ScoreBar card={model.card} title={model.title} config={config} />}
      {live.stale && <StaleMark lastOkAt={live.lastOkAt} />}
    </>
  );
}

// ─── #324-L03b · alerts and winner ─────────────────────────────────────────

/** How long one alert stays on screen. */
export const ALERT_MS = 6_000;

/**
 * Alerts from the difference between two answers. The first answer, and the first answer after any connection
 * problem, only become the baseline — a reload or a reconnect never replays an old alert. A correction or an undo
 * removes alerts that are no longer true. Timers are cleared on unmount (hours in OBS without growing memory).
 */
function useOverlayAlerts(snapshot: OverlaySnapshot | undefined, problem: OverlayProblem | null, enabled: boolean): AlertItem | null {
  const previous = useRef<OverlaySnapshot | null>(null);
  const disrupted = useRef(false);
  const ids = useRef(0);
  const [queue, setQueue] = useState<AlertItem[]>([]);
  useEffect(() => { if (problem) disrupted.current = true; }, [problem]);
  useEffect(() => {
    if (!enabled || !snapshot) return;
    if (!previous.current || disrupted.current) {
      previous.current = snapshot;
      disrupted.current = false;
      return;
    }
    const events = overlayEvents(previous.current, snapshot);
    previous.current = snapshot;
    if (events.length) setQueue((current) => nextAlertQueue(current, events, () => ++ids.current));
  }, [snapshot, enabled]);
  const current = queue[0] ?? null;
  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => setQueue((items) => (items[0]?.id === current.id ? items.slice(1) : items)), ALERT_MS);
    return () => clearTimeout(timer);
  }, [current?.id]);
  return enabled ? current : null;
}

function AlertBanner({ item }: { item: AlertItem }) {
  const { label, text } = eventText(item.event);
  return (
    <div className="ov-alert" role="status" aria-live="polite" data-kind={item.event.kind} key={item.id}>
      <span className="ov-alert-label">{label}</span>
      <span className="ov-alert-text">{text}</span>
    </div>
  );
}

function WinnerCard({ model, config }: { model: WinnerModel; config: OverlayConfig }) {
  if (!model.name) return <OverlayMessage text={model.reason ?? ""} />;
  return (
    <section className="ov-winner" aria-label={`${model.heading}: ${model.name}`} data-champion={model.champion || undefined}>
      {config.showTitle && !model.champion && <div className="ov-title">{model.title}</div>}
      <div className="ov-winner-heading">{model.heading}</div>
      <div className="ov-winner-name" data-fit={model.name.length > 30 ? "xlong" : model.name.length > 18 ? "long" : "normal"}>{model.name}</div>
      {model.detail && <div className="ov-winner-detail">{model.detail}</div>}
    </section>
  );
}

function ScoreBar({ card, title, config }: { card: MatchCard; title: string; config: OverlayConfig }) {
  const full = config.layout === "pelny";
  return (
    <section className="ov-scorebar" aria-label={tr("overlayApp.wynik_meczu_side1_v1_side2", { side1: card.side1, v1: card.hasScore ? `${card.score1}:${card.score2}` : tr("overlayApp.przed_wynikiem"), side2: card.side2 })} data-state={card.state}>
      {config.showTitle && <div className="ov-title">{title}</div>}
      <div className="ov-row">
        <div className="ov-side ov-side--1" data-winner={card.winner === 1 || undefined} data-fit={card.fit1}><span className="ov-name">{card.side1}</span></div>
        <div className="ov-score" data-empty={!card.hasScore || undefined}>
          {card.hasScore ? (
            <>
              <span className="ov-num" key={`a${card.score1}`}>{card.score1}</span>
              <span className="ov-sep">:</span>
              <span className="ov-num" key={`b${card.score2}`}>{card.score2}</span>
              {card.scoreUnit && <span className="ov-unit">{card.scoreUnit}</span>}
            </>
          ) : <span className="ov-vs-box">{tr("overlayApp.vs")}</span>}
        </div>
        <div className="ov-side ov-side--2" data-winner={card.winner === 2 || undefined} data-fit={card.fit2}><span className="ov-name">{card.side2}</span></div>
      </div>
      {card.sets.length > 0 && (
        <ol className="ov-sets" aria-label={tr("overlayApp.wyniki_setow_punkty_w_secie")}>
          {card.sets.map((set, index) => (
            <li key={index} data-winner={set.winner || undefined}><span className="ov-set-no">{tr("overlayApp.set")}{" "}{index + 1}</span> {set.score1}:{set.score2}</li>
          ))}
        </ol>
      )}
      {full && (
        <div className="ov-meta">
          <span className="ov-status" data-state={card.state}>{card.resultNote ?? card.status}</span>
          <span className="ov-context">{card.context}</span>
          <span className="ov-format">{card.format}</span>
        </div>
      )}
    </section>
  );
}

function UpcomingCard({ card, model, config }: { card: MatchCard; model: MatchOverlayModel; config: OverlayConfig }) {
  const when = scheduleText(card.scheduledAt, model.timeZone);
  const heading = upcomingHeading(card);
  const showScore = card.state === "completed" && card.hasScore;
  return (
    <section className="ov-upcoming" aria-label={tr("overlayApp.heading_side1_kontra_side2", { heading: heading, side1: card.side1, side2: card.side2 })} data-state={card.state}>
      {config.showTitle && <div className="ov-title">{model.title}</div>}
      <div className="ov-upcoming-heading">{heading}</div>
      <div className="ov-versus">
        <span className="ov-name" data-fit={card.fit1}>{card.side1}</span>
        <span className="ov-vs">{showScore ? `${card.score1}:${card.score2}` : "vs"}</span>
        <span className="ov-name" data-fit={card.fit2}>{card.side2}</span>
      </div>
      <div className="ov-meta">
        <span className="ov-context">{card.context}</span>
        {/* a postponed or cancelled match has no date we can vouch for — none is shown */}
        {when && card.state !== "cancelled" && card.state !== "postponed" && <span className="ov-when">{when}</span>}
        <span className="ov-format">{card.format}</span>
      </div>
      {model.queue.length > 0 && (
        <ol className="ov-queue" aria-label={tr("overlayApp.kolejne_mecze")}>
          <li className="ov-queue-title">{tr("overlayApp.kolejne_mecze")}</li>
          {model.queue.map((m) => <li key={m.id}><span>{m.side1}</span> <span className="ov-vs-small">{tr("overlayApp.vs_2")}</span> <span>{m.side2}</span></li>)}
        </ol>
      )}
    </section>
  );
}

// ─── structure: bracket, double elimination, tables ────────────────────────

/** Scales a board down (never up) so it always fits the source — big brackets and many groups never spill out. */
function FitToScreen({ children, deps }: { children: ReactNode; deps: unknown }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      const available = window.innerHeight * 0.92;
      const height = node.scrollHeight;
      const width = node.scrollWidth;
      const next = Math.min(1, available / Math.max(1, height), (window.innerWidth * 0.96) / Math.max(1, width));
      setScale((current) => (Math.abs(current - next) > 0.01 ? next : current));
    };
    measure();
    // Fonts arriving later or new rows change the size: measure again whenever the content does.
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(node);
    window.addEventListener("resize", measure);
    return () => { observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, [deps]);
  return <div ref={ref} className="ov-fit" style={{ transform: scale < 1 ? `scale(${scale})` : undefined }}>{children}</div>;
}

function StructureOverlay({ config, tournamentId }: { config: OverlayConfig; tournamentId: number }) {
  const tournamentState = usePolled(`t:${tournamentId}`, (signal) => fetchPublic<Raw>(`/api/tournaments/${tournamentId}`, signal).then(toPublicTournament), 30_000);
  const stages = usePolled(`stages:${tournamentId}`, (signal) => loadStages(tournamentId, signal), 30_000);
  const stage = useMemo(() => (stages.data ? pickStage(stages.data, config.stage, tournamentState.data?.activeStageId ?? null) : null), [stages.data, config.stage, tournamentState.data?.activeStageId]);
  const teams = tournamentState.data?.participantType === "teams";
  const view = usePolled<StructureView | null>(
    `structure:${tournamentId}:${stage?.id ?? 0}:${stage?.format ?? ""}:${stage?.status ?? ""}:${config.round ?? 0}:${config.group ?? ""}`,
    async (signal) => {
      if (!stage) return null;
      if (stage.status === "planned") return { kind: "empty", title: stageLabel(stage.name), message: tr("overlayApp.etap_jeszcze_sie_nie_rozpoczal") };
      if (stage.format === "single_elimination") {
        const matches = ((await fetchPublic<Raw[]>(`/api/tournaments/${tournamentId}/matches`, signal)) ?? []).map(toPublicMatch).filter((m) => m.stageId === stage.id);
        return bracketView(stage, matches, config.round, teams);
      }
      if (stage.format === "double_elimination") {
        return doubleView(stage, await fetchPublic<Raw>(`/api/tournaments/${tournamentId}/stages/${stage.id}/double-elimination`, signal), config.round);
      }
      return tablesView(stage, await fetchPublic<Raw>(`/api/tournaments/${tournamentId}/stages/${stage.id}/standings`, signal), config.group);
    },
    10_000,
  );
  const problem = tournamentState.problem ?? stages.problem;
  if (problem && problem !== "offline") return <OverlayMessage text={PROBLEM_TEXT[problem]} />;
  if (!stages.data || !view.data) {
    if (stages.data && !stage) return <OverlayMessage text={tr("overlayApp.turniej_nie_ma_jeszcze_etapow")} />;
    const failed = view.problem ?? stages.problem;
    return failed ? <OverlayMessage text={PROBLEM_TEXT[failed]} /> : <Loading />;
  }
  const v = view.data;
  return (
    <>
      <FitToScreen deps={view.data}>
        <section className="ov-board" aria-label={v.title} data-view={v.kind}>
          <header className="ov-board-header">
            {config.showTitle && tournamentState.data && <span className="ov-title">{tournamentState.data.name}</span>}
            <span className="ov-board-title">{v.title}{"fragment" in v && v.fragment ? ` · ${v.fragment}` : ""}</span>
          </header>
          {v.kind === "empty" && <p className="ov-board-empty">{v.message}</p>}
          {v.kind === "bracket" && (
            <div className="ov-bracket" style={{ "--ov-rounds": v.rounds.reduce((sum, round) => sum + round.columns, 0) } as CSSProperties}>
              {v.rounds.map((round) => (
                <div className="ov-bracket-round" key={round.round} data-columns={round.columns} style={{ gridColumn: `span ${round.columns}` }}>
                  {!(v.fragment && v.rounds.length === 1) && <h3>{round.name}</h3>}
                  <ol>
                    {round.matches.map((m) => (
                      <li key={m.matchId} className="ov-mini" data-live={m.live || undefined}>
                        <span className="ov-mini-side" data-winner={m.winner === 1 || undefined}>{m.side1}</span><span className="ov-mini-score">{m.score1}</span>
                        <span className="ov-mini-side" data-winner={m.winner === 2 || undefined}>{m.side2}</span><span className="ov-mini-score">{m.score2}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
          {v.kind === "double" && (
            <div className="ov-double">
              {v.sections.map((section) => (
                <div className="ov-double-section" key={section.id} data-section={section.id} style={{ flexGrow: section.rounds.length }}>
                  <h3>{section.label}</h3>
                  <div className="ov-double-rounds" style={{ "--ov-rounds": section.rounds.length } as CSSProperties}>
                    {section.rounds.map((round) => (
                      <ol key={round.round} aria-label={tr("overlayApp.label_runda_round", { label: section.label, round: round.round })}>
                        {round.matches.map((m, index) => (
                          <li key={`${m.name}-${index}`} className="ov-mini" data-live={m.live || undefined}>
                            <span className="ov-mini-label">{m.name}</span>
                            <span className="ov-mini-side" data-winner={m.winner === 1 || undefined}>{m.side1}</span><span className="ov-mini-score">{m.score1}</span>
                            <span className="ov-mini-side" data-winner={m.winner === 2 || undefined}>{m.side2}</span><span className="ov-mini-score">{m.score2}</span>
                          </li>
                        ))}
                      </ol>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {v.kind === "tables" && (
            <div className="ov-tables" data-count={v.tables.length}>
              {v.tables.map((table) => (
                <table className="ov-table" key={table.label}>
                  {v.tables.length > 1 || (table.label && table.label !== v.title && table.label !== v.fragment) ? <caption>{table.label}</caption> : null}
                  <thead>
                    <tr><th scope="col">#</th><th scope="col">{tr("overlayApp.uczestnik")}</th><th scope="col">M</th><th scope="col">W</th>{v.showDraws && <th scope="col">R</th>}<th scope="col">P</th><th scope="col">+/−</th>{v.showPoints && <th scope="col">{tr("overlayApp.pkt")}</th>}</tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row) => (
                      <tr key={`${row.rank}-${row.name}`} data-zone={row.zone}>
                        <td>{row.rank}</td><td className="ov-table-name">{row.name}</td><td>{row.played}</td><td>{row.wins}</td>{v.showDraws && <td>{row.draws}</td>}<td>{row.losses}</td>
                        <td>{row.diff > 0 ? `+${row.diff}` : row.diff}</td>{v.showPoints && <td className="ov-table-points">{row.points ?? 0}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
            </div>
          )}
        </section>
      </FitToScreen>
      {(view.stale || stages.stale) && <StaleMark lastOkAt={view.lastOkAt} />}
    </>
  );
}
