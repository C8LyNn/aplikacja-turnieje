import { useRoute, Link } from "wouter";
import {
  useGetTournament, useListMatches, useGetTournamentStandings,
  getGetTournamentQueryKey, getListMatchesQueryKey, getGetTournamentStandingsQueryKey,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Monitor } from "lucide-react";

export default function TournamentAudience() {
  const [, params] = useRoute("/tournaments/:id/audience");
  const id = params?.id ? parseInt(params.id, 10) : 0;

  const { data: tournament } = useGetTournament(id, {
    query: { enabled: !!id, queryKey: getGetTournamentQueryKey(id), refetchInterval: 5000 },
  });
  const { data: matches } = useListMatches(id, {
    query: { enabled: !!id, queryKey: getListMatchesQueryKey(id), refetchInterval: 5000 },
  });
  const { data: standings } = useGetTournamentStandings(id, {
    query: { enabled: !!id, queryKey: getGetTournamentStandingsQueryKey(id), refetchInterval: 10000 },
  });

  // Featured match takes priority over in_progress detection
  const featuredMatch = tournament?.featuredMatchId
    ? matches?.find((m) => m.id === tournament.featuredMatchId)
    : null;
  const liveMatch = featuredMatch ?? matches?.find((m) => m.status === "in_progress");
  const nextMatches = matches?.filter(
    (m) => (m.status === "pending" || m.status === "ready") && m.player1Id && m.player2Id && m.id !== liveMatch?.id
  ).slice(0, 3) || [];
  const topStandings = standings?.slice(0, 8) || [];

  return (
    <div className="min-h-screen bg-[#080d1a] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Monitor className="w-5 h-5 text-cyan-400" />
          <span className="font-bold text-cyan-400 tracking-wider text-sm uppercase">Widok dla widzów</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-bold text-lg">{tournament?.name}</span>
          {tournament && (
            <Badge variant="outline" className="border-cyan-400/40 text-cyan-400">
              Runda {tournament.currentRound}/{tournament.totalRounds}
            </Badge>
          )}
          <Button variant="ghost" size="sm" asChild className="text-white/50 hover:text-white">
            <Link href={`/tournaments/${id}`}><ArrowLeft className="w-4 h-4 mr-1" /> Wróć</Link>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        {/* LIVE match */}
        {liveMatch ? (
          <div className="w-full max-w-4xl">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 font-bold tracking-widest text-sm uppercase">Na żywo</span>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>
            <div className="bg-gradient-to-b from-[#0d1629] to-[#080d1a] border border-cyan-500/20 rounded-2xl p-8 shadow-[0_0_40px_rgba(0,200,255,0.1)]">
              <p className="text-center text-xs text-muted-foreground mb-6 uppercase tracking-wider">
                Runda {liveMatch.round} · Mecz {liveMatch.matchNumber}
                {liveMatch.bestOf && liveMatch.bestOf > 1 ? ` · Best of ${liveMatch.bestOf}` : ""}
              </p>
              <div className="flex items-center justify-between gap-8">
                <div className="flex-1 text-center">
                  <div className="text-4xl font-black mb-2 text-white">{liveMatch.player1Name || "TBD"}</div>
                  <div className="text-8xl font-black text-cyan-400 font-mono">{liveMatch.score1 ?? 0}</div>
                </div>
                <div className="text-4xl font-bold text-white/30 select-none">VS</div>
                <div className="flex-1 text-center">
                  <div className="text-4xl font-black mb-2 text-white">{liveMatch.player2Name || "TBD"}</div>
                  <div className="text-8xl font-black text-cyan-400 font-mono">{liveMatch.score2 ?? 0}</div>
                </div>
              </div>
            </div>
          </div>
        ) : tournament?.status === "completed" ? (
          <div className="text-center">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-4xl font-black text-yellow-400 mb-2">Turniej zakończony!</h2>
            {standings && standings[0] && (
              <p className="text-2xl text-white/70">Zwycięzca: <span className="text-white font-bold">{standings[0].playerName}</span></p>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full border-4 border-cyan-500/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⏸</span>
            </div>
            <h2 className="text-2xl font-bold text-white/50">Przerwa</h2>
            <p className="text-muted-foreground">Mecze wznowią się wkrótce</p>
          </div>
        )}

        {/* Bottom row: next matches + standings */}
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6">
          {/* Next matches */}
          {nextMatches.length > 0 && (
            <div className="bg-[#0d1629] border border-white/10 rounded-xl p-5">
              <h3 className="text-xs uppercase tracking-widest text-white/40 mb-4">Kolejne mecze</h3>
              <div className="space-y-3">
                {nextMatches.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[10px] border-white/20 text-white/40">R{m.round} M{m.matchNumber}</Badge>
                    <span className="text-white font-semibold flex-1 truncate">{m.player1Name}</span>
                    <span className="text-white/30 text-xs">vs</span>
                    <span className="text-white font-semibold flex-1 truncate text-right">{m.player2Name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Standings */}
          {topStandings.length > 0 && (
            <div className="bg-[#0d1629] border border-white/10 rounded-xl p-5">
              <h3 className="text-xs uppercase tracking-widest text-white/40 mb-4">Klasyfikacja</h3>
              <div className="space-y-2">
                {topStandings.map((s) => (
                  <div key={s.playerId} className="flex items-center gap-3">
                    <span className={`font-mono font-bold text-sm w-5 text-right ${
                      s.rank === 1 ? "text-yellow-400" : s.rank === 2 ? "text-gray-400" : s.rank === 3 ? "text-amber-600" : "text-white/30"}`}>
                      {s.rank}
                    </span>
                    <span className="text-white font-semibold flex-1 truncate">{s.playerName}</span>
                    <div className="flex gap-3 text-xs text-white/50">
                      <span>{s.wins}W/{s.losses}L</span>
                      <span className="font-bold text-cyan-400">{s.points}pkt</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
