import { useListTournaments } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Calendar, Users, Trophy, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

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
              <Link key={tournament.id} href={`/tournaments/${tournament.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full flex flex-col group">
                  <CardHeader className="pb-3 border-b border-border/50 bg-card/50">
                    <div className="flex justify-between items-start gap-4">
                      <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
                        {tournament.name}
                      </CardTitle>
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
                      <span>Runda {tournament.currentRound}</span>
                    )}
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
