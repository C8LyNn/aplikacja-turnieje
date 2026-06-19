import { useListTournaments, useDeleteTournament, getListTournamentsQueryKey, exportTournament } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Calendar, Users, Trophy, PlusCircle, Trash2, AlertTriangle, X, Download } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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

export default function Dashboard() {
  const { data: tournaments, isLoading } = useListTournaments();
  const deleteTournament = useDeleteTournament();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [exportingId, setExportingId] = useState<number | null>(null);
  const confirmTarget = tournaments?.find((t) => t.id === confirmDeleteId);

  const handleQuickExport = async (e: React.MouseEvent, t: { id: number; name: string }) => {
    e.stopPropagation();
    setExportingId(t.id);
    try {
      const backup = await exportTournament(t.id);
      const fileName = `${t.name.replace(/[^a-z0-9]/gi, "_")}_backup_${new Date().toISOString().slice(0, 10)}.json`;
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Backup zapisany", description: fileName });
    } catch {
      toast({ title: "Błąd eksportu", variant: "destructive" });
    } finally {
      setExportingId(null);
    }
  };

  const handleDelete = () => {
    if (!confirmDeleteId) return;
    deleteTournament.mutate(
      { id: confirmDeleteId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTournamentsQueryKey() });
          toast({ title: "Turniej usunięty" });
          setConfirmDeleteId(null);
        },
        onError: (e: any) => {
          toast({ title: "Błąd usuwania", description: e?.message, variant: "destructive" });
          setConfirmDeleteId(null);
        },
      },
    );
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Turnieje</h1>
            <p className="text-muted-foreground">Zarządzaj rozgrywkami, drabinkami i wynikami.</p>
          </div>
          <Link
            href="/tournaments/new"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2 shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            Utwórz turniej
          </Link>
        </div>

        {/* Delete confirmation overlay */}
        {confirmDeleteId && confirmTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-destructive/40 rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-destructive/15 rounded-full p-2 shrink-0">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Usuń turniej</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Czy na pewno chcesz trwale usunąć turniej{" "}
                    <strong className="text-foreground">„{confirmTarget.name}"</strong>?
                  </p>
                  <p className="text-destructive/80 text-xs mt-2 font-medium">
                    Tej operacji nie można cofnąć. Zostaną usunięci wszyscy gracze, mecze i historia wyników.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={deleteTournament.isPending}
                >
                  <X className="w-4 h-4 mr-1.5" /> Anuluj
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteTournament.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  {deleteTournament.isPending ? "Usuwanie…" : "Usuń na stałe"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-24 bg-muted/50" />
                <CardContent className="h-20" />
              </Card>
            ))}
          </div>
        ) : !tournaments || tournaments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border rounded-lg bg-card/50">
            <Trophy className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-xl font-semibold mb-2">Brak turniejów</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Utwórz swój pierwszy turniej, aby zarządzać graczami, drabinką i wynikami.
            </p>
            <Link
              href="/tournaments/new"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Utwórz turniej
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (
              <Card
                key={tournament.id}
                className="hover:border-primary/50 transition-colors cursor-pointer h-full flex flex-col group"
                onClick={() => navigate(`/tournaments/${tournament.id}`)}
              >
                <CardHeader className="pb-3 border-b border-border/50 bg-card/50">
                  <div className="flex justify-between items-start gap-3">
                    <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors flex-1 min-w-0">
                      {tournament.name}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        variant={
                          tournament.status === "active"
                            ? "default"
                            : tournament.status === "completed"
                              ? "secondary"
                              : "outline"
                        }
                        className={
                          tournament.status === "active"
                            ? "bg-secondary text-secondary-foreground hover:bg-secondary"
                            : tournament.status === "completed"
                              ? "bg-accent text-accent-foreground hover:bg-accent"
                              : ""
                        }
                      >
                        {STATUS_LABELS[tournament.status] ?? tournament.status.toUpperCase()}
                      </Badge>
                      {/* Quick export button */}
                      <button
                        onClick={(e) => handleQuickExport(e, tournament)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-primary/15 text-muted-foreground hover:text-primary"
                        title="Pobierz backup"
                        disabled={exportingId === tournament.id}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {/* Delete button — stops propagation so it doesn't navigate */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(tournament.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive"
                        title="Usuń turniej"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2 mt-2 min-h-10">
                    {tournament.description || "Brak opisu."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-4 flex-1">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>Maks: {tournament.maxPlayers || "∞"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Trophy className="w-4 h-4" />
                      <span>{FORMAT_LABELS[tournament.format] ?? tournament.format}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t border-border/50 bg-card/50 text-xs text-muted-foreground flex justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(tournament.createdAt), "d MMM yyyy", { locale: pl })}</span>
                  </div>
                  {tournament.currentRound && (
                    <span>Runda {tournament.currentRound}/{tournament.totalRounds ?? "?"}</span>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
