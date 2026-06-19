import { useRoute, Link } from "wouter";
import {
  useGetTournament,
  useListMatches,
  useGetTournamentStandings,
  getGetTournamentQueryKey,
  getListMatchesQueryKey,
  getGetTournamentStandingsQueryKey,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Swords } from "lucide-react";

const FORMAT_LABELS: Record<string, string> = {
  single_elimination: "Drabinka eliminacyjna",
  swiss: "System szwajcarski",
  round_robin: "Każdy z każdym",
  double_elimination: "Podwójna eliminacja",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "SZKIC",
  active: "AKTYWNY",
  completed: "ZAKOŃCZONY",
};

function WinDots({ wins, needed, side }: { wins: number; needed: number; side: "left" | "right" }) {
  const dots = Array.from({ length: needed });
  return (
    <div className={`flex gap-1.5 ${side === "right" ? "flex-row-reverse" : ""}`}>
      {dots.map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            i < wins ? "bg-cyan-400 shadow-[0_0_6px_rgba(0,200,255,0.7)]" : "bg-white/15 border border-white/20"
          }`}
        />
      ))}
    </div>
  );
}

export default function TournamentAudience() {
  const [, params] = useRoute("/tournaments/:id/audience");
  const id = params?.id ? parseInt(params.id, 10) : 0;

  const { data: tournament } = useGetTournament(id, {
    query: { enabled: !!id, queryKey: getGetTournamentQueryKey(id), refetchInterval: 4000 },
  });
  const { data: matches } = useListMatches(id, {
    query: { enabled: !!id, queryKey: getListMatchesQueryKey(id), refetchInterval: 4000 },
  });
  const { data: standings } = useGetTournamentStandings(id, {
    query: { enabled: !!id, queryKey: getGetTournamentStandingsQueryKey(id), refetchInterval: 8000 },
  });

  // --- Derived data ---
  const featuredMatch = tournament?.featuredMatchId
    ? matches?.find((m) => m.id === tournament.featuredMatchId)
    : null;
  const heroMatch = featuredMatch ?? matches?.find((m) => m.status === "in_progress") ?? null;

  const isHeroLive = heroMatch?.status === "in_progress";
  const isHeroDone = heroMatch?.status === "completed";
  const isHeroFeatured = !!featuredMatch && !isHeroLive;

  const bo = heroMatch?.bestOf ?? 1;
  const winsNeeded = Math.ceil(bo / 2);
  const s1 = heroMatch?.score1 ?? 0;
  const s2 = heroMatch?.score2 ?? 0;
  const p1Won = isHeroDone && !heroMatch?.isDraw && heroMatch?.winnerId === heroMatch?.player1Id;
  const p2Won = isHeroDone && !heroMatch?.isDraw && heroMatch?.winnerId === heroMatch?.player2Id;
  const isDraw = isHeroDone && heroMatch?.isDraw;

  const nextMatches = matches
    ?.filter(
      (m) =>
        (m.status === "pending" || m.status === "ready") &&
        m.player1Id &&
        m.player2Id &&
        m.id !== heroMatch?.id,
    )
    .slice(0, 5) ?? [];

  const recentResults = matches
    ?.filter((m) => m.status === "completed")
    .slice(-5)
    .reverse() ?? [];

  const topStandings = standings?.slice(0, 8) ?? [];

  const currentRoundMatches = matches?.filter(
    (m) => m.round === tournament?.currentRound && m.status !== "bye",
  ) ?? [];

  const hasStandings = topStandings.length > 0;
  const hasNextMatches = nextMatches.length > 0;
  const hasResults = recentResults.length > 0;
  const hasRound = currentRoundMatches.length > 0 && tournament?.status === "active";

  // --- Winner glow color ---
  const heroCardBorder = isHeroLive
    ? "border-cyan-500/50 shadow-[0_0_60px_rgba(0,200,255,0.12)]"
    : isHeroDone
      ? "border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.08)]"
      : "border-white/10";

  return (
    <div
      className="min-h-screen bg-[#080d1a] text-white flex flex-col select-none overflow-x-hidden"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 0%, rgba(0,200,255,0.04) 0%, transparent 60%), radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "100% 100%, 40px 40px",
      }}
    >
      {/* ── TOP BAR ── */}
      <header className="flex-none flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/8 bg-[#080d1a]/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <Swords className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-cyan-400 font-black tracking-widest text-xs uppercase shrink-0 hidden sm:block">TM_SYS</span>
          <span className="text-white/20 hidden sm:block">·</span>
          <h1 className="font-bold text-sm sm:text-base truncate">{tournament?.name ?? "Ładowanie…"}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {tournament?.status && (
            <Badge
              className={`text-[10px] font-bold tracking-wider px-2 ${
                tournament.status === "active"
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : tournament.status === "completed"
                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    : "bg-white/10 text-white/40 border-white/10"
              }`}
            >
              {STATUS_LABELS[tournament.status] ?? tournament.status}
            </Badge>
          )}
          {tournament?.currentRound && tournament?.totalRounds && (
            <span className="text-xs text-white/40 font-mono hidden sm:block">
              R{tournament.currentRound}/{tournament.totalRounds}
            </span>
          )}
          {/* Hidden back link for organizer — visible on hover */}
          <Link
            href={`/tournaments/${id}`}
            className="opacity-0 hover:opacity-60 transition-opacity text-white/60 hover:text-white ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 pt-6 pb-8 gap-6">

        {/* ══ FEATURED / LIVE MATCH ══ */}
        {heroMatch ? (
          <section className="w-full max-w-5xl">
            {/* Status label */}
            <div className="flex items-center justify-center gap-3 mb-5">
              {isHeroLive && (
                <>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-red-400 font-black tracking-[0.2em] text-sm uppercase">Na żywo</span>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                </>
              )}
              {isHeroFeatured && !isHeroDone && (
                <>
                  <span className="text-cyan-400/60 font-bold tracking-[0.15em] text-xs uppercase">★ Wyróżniony mecz</span>
                </>
              )}
              {isHeroDone && (
                <span className="text-green-400 font-black tracking-[0.15em] text-sm uppercase">Zakończony</span>
              )}
            </div>

            {/* Hero card */}
            <div className={`bg-gradient-to-b from-[#0d1629] to-[#080f1f] border rounded-2xl overflow-hidden transition-all duration-500 ${heroCardBorder}`}>
              {/* Match meta */}
              <div className="flex items-center justify-center gap-3 py-3 border-b border-white/6">
                <span className="text-[11px] text-white/35 uppercase tracking-widest font-mono">
                  Runda {heroMatch.round} · Mecz {heroMatch.matchNumber}
                </span>
                {bo > 1 && (
                  <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/30 text-[11px] font-bold tracking-wider px-2">
                    Best of {bo}
                  </Badge>
                )}
              </div>

              {/* Players + scores */}
              <div className="flex items-stretch px-6 sm:px-10 py-8 sm:py-12 gap-4 sm:gap-8">
                {/* Player 1 */}
                <div className={`flex-1 flex flex-col items-center justify-center gap-3 transition-all ${p1Won ? "opacity-100" : isHeroDone && !isDraw ? "opacity-40" : "opacity-100"}`}>
                  <div className={`text-2xl sm:text-4xl lg:text-5xl font-black text-center leading-tight transition-all ${p1Won ? "text-cyan-300" : "text-white"}`}>
                    {heroMatch.player1Name || "TBD"}
                  </div>
                  <div className={`text-6xl sm:text-8xl lg:text-[7rem] font-black font-mono tabular-nums leading-none transition-all ${
                    p1Won ? "text-cyan-400 drop-shadow-[0_0_20px_rgba(0,200,255,0.5)]" : "text-white"
                  }`}>
                    {s1}
                  </div>
                  {bo > 1 && (
                    <WinDots wins={s1} needed={winsNeeded} side="left" />
                  )}
                  {p1Won && (
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/40 text-xs font-bold tracking-widest mt-1">
                      ZWYCIĘZCA
                    </Badge>
                  )}
                </div>

                {/* VS separator */}
                <div className="flex flex-col items-center justify-center shrink-0 gap-2">
                  {isDraw ? (
                    <span className="text-xl sm:text-2xl font-black text-yellow-400/70 tracking-widest">REMIS</span>
                  ) : (
                    <span className="text-2xl sm:text-4xl font-black text-white/15 tracking-widest">:</span>
                  )}
                </div>

                {/* Player 2 */}
                <div className={`flex-1 flex flex-col items-center justify-center gap-3 transition-all ${p2Won ? "opacity-100" : isHeroDone && !isDraw ? "opacity-40" : "opacity-100"}`}>
                  <div className={`text-2xl sm:text-4xl lg:text-5xl font-black text-center leading-tight transition-all ${p2Won ? "text-cyan-300" : "text-white"}`}>
                    {heroMatch.player2Name || "TBD"}
                  </div>
                  <div className={`text-6xl sm:text-8xl lg:text-[7rem] font-black font-mono tabular-nums leading-none transition-all ${
                    p2Won ? "text-cyan-400 drop-shadow-[0_0_20px_rgba(0,200,255,0.5)]" : "text-white"
                  }`}>
                    {s2}
                  </div>
                  {bo > 1 && (
                    <WinDots wins={s2} needed={winsNeeded} side="right" />
                  )}
                  {p2Won && (
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/40 text-xs font-bold tracking-widest mt-1">
                      ZWYCIĘZCA
                    </Badge>
                  )}
                </div>
              </div>

              {/* Draw banner */}
              {isDraw && (
                <div className="py-2 bg-yellow-500/10 border-t border-yellow-500/20 text-center text-sm text-yellow-400 font-bold tracking-widest">
                  REMIS
                </div>
              )}
            </div>
          </section>
        ) : tournament?.status === "completed" ? (
          /* ── TOURNAMENT COMPLETE STATE ── */
          <section className="w-full max-w-2xl">
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <Trophy className="w-20 h-20 text-yellow-400 drop-shadow-[0_0_30px_rgba(250,200,0,0.4)]" />
              <h2 className="text-4xl sm:text-5xl font-black text-yellow-400 tracking-tight">Turniej zakończony!</h2>
              {standings?.[0] && (
                <div className="mt-2 text-xl text-white/60">
                  Zwycięzca:{" "}
                  <span className="text-white font-black text-2xl">{standings[0].playerName}</span>
                </div>
              )}
              <Badge className="mt-2 bg-yellow-500/15 text-yellow-400 border-yellow-500/30 text-sm px-4 py-1">
                {FORMAT_LABELS[tournament.format] ?? tournament.format}
              </Badge>
            </div>
          </section>
        ) : (
          /* ── BREAK STATE ── */
          <section className="w-full max-w-lg">
            <div className="flex flex-col items-center justify-center gap-4 py-14 text-center">
              <div className="w-20 h-20 rounded-full border-2 border-white/15 flex items-center justify-center bg-white/5">
                <span className="text-4xl">⏸</span>
              </div>
              <h2 className="text-3xl font-bold text-white/50 tracking-tight">Przerwa</h2>
              <p className="text-white/30">Mecze wznowią się wkrótce</p>
              {tournament?.currentRound && tournament?.totalRounds && (
                <Badge className="bg-white/5 text-white/40 border-white/10">
                  Runda {tournament.currentRound}/{tournament.totalRounds}
                </Badge>
              )}
            </div>
          </section>
        )}

        {/* ══ BOTTOM PANELS ══ */}
        {(hasNextMatches || hasResults || hasStandings || hasRound) && (
          <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* ── KOLEJNE MECZE ── */}
            {hasNextMatches && (
              <Panel title="Kolejne mecze" className={!hasResults && !hasStandings ? "lg:col-span-3" : !hasResults || !hasStandings ? "lg:col-span-2" : ""}>
                <div className="space-y-2.5">
                  {nextMatches.map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <span className="text-[10px] text-white/25 font-mono w-10 shrink-0">R{m.round}M{m.matchNumber}</span>
                      <span className="text-sm font-semibold text-white/80 flex-1 truncate">{m.player1Name}</span>
                      <span className="text-[10px] text-white/30 shrink-0">vs</span>
                      <span className="text-sm font-semibold text-white/80 flex-1 truncate text-right">{m.player2Name}</span>
                      {m.bestOf && m.bestOf > 1 && (
                        <span className="text-[10px] text-cyan-500/50 shrink-0 font-mono">BO{m.bestOf}</span>
                      )}
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* ── OSTATNIE WYNIKI ── */}
            {hasResults && (
              <Panel title="Ostatnie wyniki">
                <div className="space-y-2.5">
                  {recentResults.map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <span className="text-[10px] text-white/25 font-mono w-10 shrink-0">R{m.round}M{m.matchNumber}</span>
                      <span className={`text-sm flex-1 truncate ${m.winnerId === m.player1Id && !m.isDraw ? "font-bold text-white" : "text-white/40"}`}>
                        {m.player1Name}
                      </span>
                      <span className="font-mono text-sm font-bold text-white/70 bg-white/6 px-2 py-0.5 rounded shrink-0 tabular-nums">
                        {m.isDraw ? "R" : `${m.score1}:${m.score2}`}
                      </span>
                      <span className={`text-sm flex-1 truncate text-right ${m.winnerId === m.player2Id && !m.isDraw ? "font-bold text-white" : "text-white/40"}`}>
                        {m.player2Name}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* ── KLASYFIKACJA ── */}
            {hasStandings && (
              <Panel title="Klasyfikacja" className={!hasNextMatches && !hasResults ? "lg:col-span-3" : ""}>
                <div className="space-y-2">
                  {topStandings.map((s) => (
                    <div key={s.playerId} className="flex items-center gap-2.5">
                      <span className={`font-mono font-black text-sm w-5 text-right shrink-0 ${
                        s.rank === 1 ? "text-yellow-400" : s.rank === 2 ? "text-slate-400" : s.rank === 3 ? "text-amber-600" : "text-white/25"
                      }`}>
                        {s.rank}
                      </span>
                      {s.rank <= 3 && (
                        <span className="text-xs shrink-0">{s.rank === 1 ? "🥇" : s.rank === 2 ? "🥈" : "🥉"}</span>
                      )}
                      <span className="text-sm font-semibold flex-1 truncate">{s.playerName}</span>
                      <div className="flex items-center gap-2 text-xs text-white/40 shrink-0">
                        <span className="font-mono">{s.wins}W {s.losses}L</span>
                        <span className="font-bold text-cyan-400">{s.points}pkt</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* ── RUNDA (round summary for active tournaments) ── */}
            {hasRound && !hasNextMatches && !hasResults && !hasStandings && (
              <Panel title={`Runda ${tournament?.currentRound} — przebieg`} className="lg:col-span-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentRoundMatches.map((m) => (
                    <div key={m.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                      m.status === "in_progress"
                        ? "border-cyan-500/30 bg-cyan-500/5"
                        : m.status === "completed"
                          ? "border-green-500/20 bg-green-500/5"
                          : m.status === "postponed"
                            ? "border-orange-500/20 bg-orange-500/5"
                            : "border-white/8 bg-white/3"
                    }`}>
                      <span className={`text-sm font-bold flex-1 truncate ${m.winnerId === m.player1Id ? "text-cyan-300" : "text-white/70"}`}>
                        {m.player1Name}
                      </span>
                      <span className="font-mono text-sm font-bold text-white/50 shrink-0 tabular-nums px-1">
                        {m.status === "completed" || m.status === "in_progress" ? `${m.score1}:${m.score2}` : "vs"}
                      </span>
                      <span className={`text-sm font-bold flex-1 truncate text-right ${m.winnerId === m.player2Id ? "text-cyan-300" : "text-white/70"}`}>
                        {m.player2Name}
                      </span>
                      <StatusDot status={m.status} />
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </div>
        )}

        {/* Format label at the very bottom */}
        {tournament?.format && (
          <p className="text-[11px] text-white/15 uppercase tracking-widest font-mono mt-2">
            {FORMAT_LABELS[tournament.format] ?? tournament.format}
          </p>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ──

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-[#0d1629]/80 border border-white/8 rounded-xl p-4 ${className}`}>
      <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mb-3">{title}</h3>
      {children}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  if (status === "in_progress") {
    return <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />;
  }
  if (status === "completed") {
    return <div className="w-2 h-2 rounded-full bg-green-500/60 shrink-0" />;
  }
  if (status === "postponed") {
    return <div className="w-2 h-2 rounded-full bg-orange-500/60 shrink-0" />;
  }
  return <div className="w-2 h-2 rounded-full bg-white/15 shrink-0" />;
}
