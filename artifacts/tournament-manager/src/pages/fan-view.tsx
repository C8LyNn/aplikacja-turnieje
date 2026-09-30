import { useListTournaments } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Trophy, Eye, Calendar, FlaskConical, Users } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { AppLogoLink, RoleSelectionLink } from "@/components/app-navigation";
import { isExperimentalTournamentPath, tournamentHref } from "@/features/experimental-tournaments/experimental-tournament-routing";

const STATUS_LABELS: Record<string, string> = {
  active: "AKTYWNY",
  completed: "ZAKOŃCZONY",
  draft: "SZKIC",
};

const FORMAT_LABELS: Record<string, string> = {
  single_elimination: "Drabinka eliminacyjna",
  swiss: "System szwajcarski",
  round_robin: "Każdy z każdym",
};

export default function FanView() {
  const [location] = useLocation();
  const isExperimental = isExperimentalTournamentPath(location);
  const { data: tournaments, isLoading } = useListTournaments();
  const visible = tournaments?.filter((t) => t.status === "active" || t.status === "completed") ?? [];

  return (
    <div className={`min-h-screen bg-background text-foreground dark flex flex-col ${isExperimental ? "experimental-tournament-entry" : ""}`}>
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AppLogoLink fallbackHref={isExperimental ? "/experimental/tournaments/fan" : "/fan"} className="text-xl" />
            {isExperimental && (
              <span className="experimental-mode-badge">
                <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
                Experimental
              </span>
            )}
          </div>
          <RoleSelectionLink />
        </div>
      </header>

      <main id={isExperimental ? "experimental-main" : undefined} className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-5 h-5 text-orange-400" />
            <h1 className="text-2xl font-bold">Widok kibica</h1>
          </div>
          <p className="text-muted-foreground text-sm">Kliknij turniej, aby oglądać wyniki i drabinkę na żywo.</p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card animate-pulse h-40" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl bg-card/50">
            <Trophy className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-xl font-semibold mb-2">Brak aktywnych turniejów</h3>
            <p className="text-muted-foreground text-sm">Poczekaj na start turnieju lub wróć później.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((t) => (
              <Link key={t.id} href={tournamentHref(t.id, isExperimental, "/audience")}>
                <div className="rounded-xl border border-border bg-card hover:border-orange-500/50 hover:bg-orange-500/5 transition-all cursor-pointer group p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-base line-clamp-2 group-hover:text-orange-400 transition-colors">{t.name}</h3>
                    <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                      t.status === "active" ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"
                    }`}>
                      {STATUS_LABELS[t.status] ?? t.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{FORMAT_LABELS[t.format] ?? t.format}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(t.createdAt), "d MMM yyyy", { locale: pl })}</span>
                    {t.maxPlayers && <span className="flex items-center gap-1"><Users className="w-3 h-3" />maks. {t.maxPlayers}</span>}
                  </div>
                  {t.status === "active" && (
                    <div className="text-xs font-medium text-orange-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                      Na żywo — kliknij, aby oglądać
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
