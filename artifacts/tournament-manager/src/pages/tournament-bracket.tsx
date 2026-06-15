import { useRoute, Link } from "wouter";
import { useGetTournament, useGetTournamentBracket, getGetTournamentQueryKey, getGetTournamentBracketQueryKey } from "@workspace/api-client-react";
import { BracketView } from "@/components/bracket-view";
import { Trophy, Maximize2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TournamentBracket() {
  const [, params] = useRoute("/tournaments/:id/bracket");
  const id = params?.id ? parseInt(params.id, 10) : 0;

  const { data: tournament } = useGetTournament(id, { query: { enabled: !!id, queryKey: getGetTournamentQueryKey(id) } });
  const { data: bracket } = useGetTournamentBracket(id, { 
    query: { 
      enabled: !!id && tournament?.status !== 'draft', 
      queryKey: getGetTournamentBracketQueryKey(id),
      refetchInterval: 10000 // Poll every 10s for live updates
    } 
  });

  if (!tournament) return <div className="min-h-screen bg-background flex items-center justify-center animate-pulse"><Trophy className="w-16 h-16 text-muted-foreground opacity-20" /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Hidden nav chrome that appears on hover for the organizer to get back */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start opacity-0 hover:opacity-100 transition-opacity z-50 bg-gradient-to-b from-background/80 to-transparent">
         <Button variant="outline" size="sm" asChild className="bg-background">
           <Link href={`/tournaments/${id}`}><ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard</Link>
         </Button>
         <Button variant="outline" size="icon" className="bg-background" onClick={() => document.documentElement.requestFullscreen().catch(e=>console.log(e))}>
           <Maximize2 className="w-4 h-4" />
         </Button>
      </div>

      <div className="flex-none p-8 flex flex-col items-center justify-center bg-card border-b border-border shadow-md z-10 relative">
        <Trophy className="w-12 h-12 text-primary mb-4 absolute top-8 opacity-10 blur-xl scale-150" />
        <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent relative z-10">
          {tournament.name}
        </h1>
        <p className="text-xl text-muted-foreground mt-2 font-mono uppercase tracking-widest relative z-10">
          {tournament.format.replace('_', ' ')}
        </p>
      </div>

      <div className="flex-1 overflow-auto bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSI+PC9yZWN0Pgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIj48L2NpcmNsZT4KPC9zdmc+')] bg-repeat">
        <div className="min-h-full min-w-max p-16 flex items-center">
          {tournament.status === 'draft' ? (
            <div className="w-full text-center text-2xl text-muted-foreground font-mono">Tournament has not started yet.</div>
          ) : bracket ? (
            <div className="scale-110 origin-left">
              <BracketView bracket={bracket} />
            </div>
          ) : (
            <div className="w-full text-center text-2xl text-muted-foreground font-mono animate-pulse">Loading Bracket...</div>
          )}
        </div>
      </div>
    </div>
  );
}
