import { useMemo, type CSSProperties } from "react";
import {
  bracketView, doubleView, matchCard, pickOverlayMatch, pickStage, scheduleText, tablesView, toPublicMatch, toPublicStage,
  toPublicTournament, upcomingQueue, type MatchCard, type OverlayConfig, type PublicMatch, type PublicStage,
  type PublicTournament, type StructureView,
} from "@/lib/broadcast-overlay";
import { fetchPublic, usePolled, type OverlayProblem } from "./overlay-data";

type Raw = Record<string, unknown>;

const PROBLEM_TEXT: Record<OverlayProblem, string> = {
  private: "Nakładki działają tylko dla turniejów publicznych.",
  missing: "Nie znaleziono turnieju.",
  offline: "Brak połączenia z SWARM-006 — ponawiam…",
  invalid: "Nie udało się odczytać danych turnieju.",
};

/** V5.9 · the whole overlay page: one view, chosen by the address; nothing to click. */
export function OverlayApp({ config }: { config: OverlayConfig }) {
  const rootStyle = { "--ov-text-scale": String(config.textScale) } as CSSProperties;
  return (
    <main className="ov" data-preset={config.preset} data-bg={config.background} data-motion={config.motion} data-pos={config.position}
      data-layout={config.layout} data-size={config.scoreSize} data-kind={config.kind} style={rootStyle}>
      {config.tournamentId == null
        ? <OverlayMessage text="W adresie nakładki brakuje turnieju (t=…). Skopiuj adres z sekcji „Transmisja”." />
        : config.kind === "struktura" ? <StructureOverlay config={config} tournamentId={config.tournamentId} />
        : <MatchOverlay config={config} tournamentId={config.tournamentId} />}
    </main>
  );
}

function OverlayMessage({ text, subtle = false }: { text: string; subtle?: boolean }) {
  return <div className={`ov-message${subtle ? " ov-message--subtle" : ""}`} role="status">{text}</div>;
}

function StaleMark() {
  return <div className="ov-stale" role="status" title="Pokazujemy ostatni zapisany stan">Brak połączenia — ostatni zapisany stan</div>;
}

async function loadLive(tournamentId: number, signal: AbortSignal) {
  const [tournament, matches] = await Promise.all([
    fetchPublic<Raw>(`/api/tournaments/${tournamentId}`, signal),
    fetchPublic<Raw[]>(`/api/tournaments/${tournamentId}/matches`, signal),
  ]);
  return { tournament: toPublicTournament(tournament), matches: (matches ?? []).map(toPublicMatch) };
}

async function loadStages(tournamentId: number, signal: AbortSignal) {
  return ((await fetchPublic<Raw[]>(`/api/tournaments/${tournamentId}/stages`, signal)) ?? []).map(toPublicStage);
}

// ─── score bar and upcoming card ───────────────────────────────────────────

function MatchOverlay({ config, tournamentId }: { config: OverlayConfig; tournamentId: number }) {
  const live = usePolled(`live:${tournamentId}`, (signal) => loadLive(tournamentId, signal), 5_000);
  const stages = usePolled(`stages:${tournamentId}`, (signal) => loadStages(tournamentId, signal), 60_000);
  if (!live.data) return <OverlayMessage text={PROBLEM_TEXT[live.problem ?? "offline"]} subtle={!live.problem} />;
  const { tournament, matches } = live.data;
  const picked = pickOverlayMatch(config, tournament, matches);
  if (!picked.match) return <OverlayMessage text={picked.reason} />;
  const stage = stages.data?.find((s) => s.id === picked.match.stageId) ?? null;
  const stageMatches = matches.filter((m) => m.stageId === picked.match.stageId);
  const card = matchCard(picked.match, stage, stageMatches, tournament.participantType === "teams");
  return (
    <>
      {config.kind === "zapowiedz"
        ? <UpcomingCard card={card} tournament={tournament} stage={stage} config={config} queue={config.showQueue ? upcomingQueue(picked.match, matches) : []} />
        : <ScoreBar card={card} tournament={tournament} config={config} />}
      {live.stale && <StaleMark />}
    </>
  );
}

function ScoreBar({ card, tournament, config }: { card: MatchCard; tournament: PublicTournament; config: OverlayConfig }) {
  const full = config.layout === "pelny";
  return (
    <section className="ov-scorebar" aria-label={`Wynik meczu: ${card.side1} ${card.score1}:${card.score2} ${card.side2}`} data-live={card.live || undefined}>
      {config.showTitle && <div className="ov-title">{tournament.name}</div>}
      <div className="ov-row">
        <div className="ov-side ov-side--1" data-winner={card.winner === 1 || undefined}><span className="ov-name">{card.side1}</span></div>
        <div className="ov-score">
          <span className="ov-num" key={`a${card.score1}`}>{card.score1}</span>
          <span className="ov-sep">:</span>
          <span className="ov-num" key={`b${card.score2}`}>{card.score2}</span>
          {card.scoreUnit && <span className="ov-unit">{card.scoreUnit}</span>}
        </div>
        <div className="ov-side ov-side--2" data-winner={card.winner === 2 || undefined}><span className="ov-name">{card.side2}</span></div>
      </div>
      {card.sets.length > 0 && (
        <ol className="ov-sets" aria-label="Wyniki setów">
          {card.sets.map((set, index) => (
            <li key={index} data-winner={set.winner || undefined}><span className="ov-set-no">S{index + 1}</span> {set.score1}:{set.score2}</li>
          ))}
        </ol>
      )}
      {full && (
        <div className="ov-meta">
          <span className="ov-status" data-live={card.live || undefined}>{card.resultNote ?? card.status}</span>
          <span className="ov-context">{card.context}</span>
          <span className="ov-format">{card.format}</span>
        </div>
      )}
    </section>
  );
}

function UpcomingCard({ card, tournament, stage, config, queue }: { card: MatchCard; tournament: PublicTournament; stage: PublicStage | null; config: OverlayConfig; queue: PublicMatch[] }) {
  const when = scheduleText(card.scheduledAt, stage?.scheduleTimeZone ?? null);
  const heading = card.live ? "Teraz gramy" : card.status === "Zakończony" ? "Wynik meczu" : "Następny mecz";
  return (
    <section className="ov-upcoming" aria-label={`${heading}: ${card.side1} kontra ${card.side2}`}>
      {config.showTitle && <div className="ov-title">{tournament.name}</div>}
      <div className="ov-upcoming-heading">{heading}</div>
      <div className="ov-versus">
        <span className="ov-name">{card.side1}</span>
        <span className="ov-vs">{card.status === "Zakończony" ? `${card.score1}:${card.score2}` : "vs"}</span>
        <span className="ov-name">{card.side2}</span>
      </div>
      <div className="ov-meta">
        <span className="ov-context">{card.context}</span>
        {when && <span className="ov-when">{when}</span>}
        <span className="ov-format">{card.format}</span>
      </div>
      {queue.length > 0 && (
        <ol className="ov-queue" aria-label="Kolejne mecze">
          <li className="ov-queue-title">Kolejne mecze</li>
          {queue.map((m) => <li key={m.id}><span>{m.player1Name}</span> <span className="ov-vs-small">vs</span> <span>{m.player2Name}</span></li>)}
        </ol>
      )}
    </section>
  );
}

// ─── structure: bracket, double elimination, tables ────────────────────────

function StructureOverlay({ config, tournamentId }: { config: OverlayConfig; tournamentId: number }) {
  const tournamentState = usePolled(`t:${tournamentId}`, (signal) => fetchPublic<Raw>(`/api/tournaments/${tournamentId}`, signal).then(toPublicTournament), 30_000);
  const stages = usePolled(`stages:${tournamentId}`, (signal) => loadStages(tournamentId, signal), 30_000);
  const stage = useMemo(() => (stages.data ? pickStage(stages.data, config.stage, tournamentState.data?.activeStageId ?? null) : null), [stages.data, config.stage, tournamentState.data?.activeStageId]);
  const teams = tournamentState.data?.participantType === "teams";
  const view = usePolled<StructureView | null>(
    `structure:${tournamentId}:${stage?.id ?? 0}:${stage?.format ?? ""}:${stage?.status ?? ""}:${config.round ?? 0}:${config.group ?? ""}`,
    async (signal) => {
      if (!stage) return null;
      if (stage.status === "planned") return { kind: "empty", title: stage.name, message: "Etap jeszcze się nie rozpoczął." };
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
    if (stages.data && !stage) return <OverlayMessage text="Turniej nie ma jeszcze etapów." />;
    return <OverlayMessage text={PROBLEM_TEXT[view.problem ?? stages.problem ?? "offline"]} subtle={!view.problem && !stages.problem} />;
  }
  const v = view.data;
  return (
    <>
      <section className="ov-board" aria-label={v.title} data-view={v.kind}>
        <header className="ov-board-header">
          {config.showTitle && tournamentState.data && <span className="ov-title">{tournamentState.data.name}</span>}
          <span className="ov-board-title">{v.title}{"fragment" in v && v.fragment ? ` · ${v.fragment}` : ""}</span>
        </header>
        {v.kind === "empty" && <p className="ov-board-empty">{v.message}</p>}
        {v.kind === "bracket" && (
          <div className="ov-bracket" style={{ "--ov-rounds": v.rounds.length } as CSSProperties}>
            {v.rounds.map((round) => (
              <div className="ov-bracket-round" key={round.round}>
                <h3>{round.name}</h3>
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
              <div className="ov-double-section" key={section.id} data-section={section.id}>
                <h3>{section.label}</h3>
                <ol>
                  {section.matches.map((m, index) => (
                    <li key={`${m.name}-${index}`} className="ov-mini" data-live={m.live || undefined}>
                      <span className="ov-mini-label">{m.name}</span>
                      <span className="ov-mini-side" data-winner={m.winner === 1 || undefined}>{m.side1}</span><span className="ov-mini-score">{m.score1}</span>
                      <span className="ov-mini-side" data-winner={m.winner === 2 || undefined}>{m.side2}</span><span className="ov-mini-score">{m.score2}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
        {v.kind === "tables" && (
          <div className="ov-tables" data-count={v.tables.length}>
            {v.tables.map((table) => (
              <table className="ov-table" key={table.label}>
                {v.tables.length > 1 || (table.label && table.label !== v.title) ? <caption>{table.label}</caption> : null}
                <thead>
                  <tr><th scope="col">#</th><th scope="col">Uczestnik</th><th scope="col">M</th><th scope="col">W</th>{v.showDraws && <th scope="col">R</th>}<th scope="col">P</th><th scope="col">+/−</th>{v.showPoints && <th scope="col">Pkt</th>}</tr>
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
      {(view.stale || stages.stale) && <StaleMark />}
    </>
  );
}
