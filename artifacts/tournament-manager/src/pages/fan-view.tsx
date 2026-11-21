import { t as tr } from "@/i18n";
import { useListTournaments } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Trophy, Eye, Calendar, FlaskConical, Users } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { AppLogoLink, RoleSelectionLink } from "@/components/app-navigation";
import { isExperimentalTournamentPath, tournamentHref } from "@/features/experimental-tournaments/experimental-tournament-routing";
import { STAGE_FORMAT_LABELS } from "@/lib/tournament-stages-ui";

import { LanguageSwitcher } from "@/i18n/react";
const STATUS_LABELS: Record<string, string> = {
  get active() { return tr("fanView.aktywny"); },
  get completed() { return tr("fanView.zakonczony"); },
  get draft() { return tr("fanView.szkic"); },
};

const FORMAT_LABELS: Record<string, string> = {
  get single_elimination() { return tr("fanView.drabinka_eliminacyjna"); },
  get swiss() { return tr("fanView.system_szwajcarski"); },
  get round_robin() { return tr("fanView.kazdy_z_kazdym"); },
};

export default function FanView() {
  const [location] = useLocation();
  const isExperimental = isExperimentalTournamentPath(location);
  const { data: tournaments, isError, isFetching, refetch } = useListTournaments();
  const hasLoadedList = tournaments !== undefined;
  const visible = tournaments?.filter((t) => t.status === "active" || t.status === "completed") ?? [];

  return (
    <div className={`min-h-screen bg-background text-foreground dark flex flex-col ${isExperimental ? "experimental-tournament-entry experimental-fan-entry" : ""}`} data-ui={isExperimental ? undefined : "classic"}>
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AppLogoLink fallbackHref={isExperimental ? "/experimental/tournaments/fan" : "/fan"} className="text-xl" />
            <LanguageSwitcher />
            {isExperimental && (
              <span className="experimental-mode-badge">
                <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />{tr("fanView.experimental")}</span>
            )}
          </div>
          <RoleSelectionLink />
        </div>
      </header>

      <main id={isExperimental ? "experimental-main" : undefined} className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-5 h-5 text-orange-400" />
            <h1 className="text-2xl font-bold">{tr("fanView.widok_kibica")}</h1>
          </div>
          <p className="text-muted-foreground text-sm">{tr("fanView.kliknij_turniej_aby_ogladac_wyniki")}</p>
        </div>

        {isError && hasLoadedList && (
          <div role="alert" className="mb-5 flex flex-col gap-3 rounded-lg border border-destructive/40 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">{tr("fanView.nie_udalo_sie_odswiezyc_listy")}</p>
            <Button type="button" variant="outline" disabled={isFetching} onClick={() => { void refetch(); }}>
              {isFetching ? tr("fanView.ponawianie") : tr("fanView.sprobuj_ponownie")}
            </Button>
          </div>
        )}

        {!hasLoadedList && isError ? (
          <div role="alert" className="rounded-xl border border-destructive/40 bg-card p-6 text-center space-y-3">
            <p className="font-semibold">{tr("fanView.nie_udalo_sie_pobrac_listy")}</p>
            <p className="text-sm text-muted-foreground">{tr("fanView.sprawdz_polaczenie_i_sprobuj_ponownie")}</p>
            <Button type="button" variant="outline" disabled={isFetching} onClick={() => { void refetch(); }}>
              {isFetching ? tr("fanView.ponawianie") : tr("fanView.sprobuj_ponownie")}
            </Button>
          </div>
        ) : !hasLoadedList ? (
          <div role="status" className="space-y-3" aria-label={tr("fanView.pobieranie_listy_turniejow")}>
            <p className="text-sm text-muted-foreground">{tr("fanView.pobieranie_listy_turniejow_2")}</p>
            <div aria-hidden="true" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-card animate-pulse h-40" />
              ))}
            </div>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl bg-card/50">
            <Trophy className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
            <h2 className="text-xl font-semibold mb-2">{tr("fanView.brak_turniejow_do_ogladania")}</h2>
            <p className="text-muted-foreground text-sm">{tr("fanView.obecnie_nie_ma_turniejow_aktywnych")}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((t) => (
              <Link key={t.id} href={tournamentHref(t.id, isExperimental, "/audience")}>
                <div data-exp-tournament-status={isExperimental ? t.status : undefined} className={`rounded-xl border border-border bg-card hover:border-orange-500/50 hover:bg-orange-500/5 transition-all cursor-pointer group p-5 flex flex-col gap-3 ${isExperimental ? "experimental-fan-card" : ""}`}>
                  <div className="flex justify-between items-start gap-2">
                    <h2 className="font-bold text-base line-clamp-2 group-hover:text-orange-400 transition-colors">{t.name}</h2>
                    <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                      t.status === "active" ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"
                    }`}>
                      {STATUS_LABELS[t.status] ?? t.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{(STAGE_FORMAT_LABELS as Record<string, string>)[t.format] ?? FORMAT_LABELS[t.format] ?? t.format}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(t.createdAt), "d MMM yyyy", { locale: pl })}</span>
                    {t.maxPlayers && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{tr("fanView.maks")}{" "}{t.maxPlayers}</span>}
                  </div>
                  {t.status === "active" && (
                    <div className="text-xs font-medium text-orange-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />{tr("fanView.na_zywo_kliknij_aby_ogladac")}</div>
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
