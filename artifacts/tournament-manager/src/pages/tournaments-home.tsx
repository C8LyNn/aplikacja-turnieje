import { t } from "@/i18n";
import { useLocation } from "wouter";
import { ArrowLeft, Eye, FlaskConical, UserCog, Users } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import type { Role } from "@/lib/auth";
import { isExperimentalTournamentPath, tournamentRoleHomeHref } from "@/features/experimental-tournaments/experimental-tournament-routing";

import { LanguageSwitcher } from "@/i18n/react";
const TOURNAMENT_ROLES: {
  id: Role;
  label: string;
  desc: string;
  icon: React.ReactNode;
  href: string;
  cardHover: string;
  iconHover: string;
}[] = [
  {
    id: "organizer",
    get label() { return t("tournamentsHome.organizator"); },
    get desc() { return t("tournamentsHome.tworzenie_turniejow_i_pelne_zarzadzanie"); },
    icon: <UserCog className="h-11 w-11" />,
    href: "/dashboard",
    cardHover: "hover:border-primary/60 hover:bg-primary/10",
    iconHover: "group-hover:text-primary",
  },
  {
    id: "support",
    get label() { return t("tournamentsHome.pomoc"); },
    get desc() { return t("tournamentsHome.obsluga_meczow_i_wprowadzanie_wynikow"); },
    icon: <Users className="h-11 w-11" />,
    href: "/support",
    cardHover: "hover:border-green-500/60 hover:bg-green-500/10",
    iconHover: "group-hover:text-green-400",
  },
  {
    id: "fan",
    get label() { return t("tournamentsHome.widz"); },
    get desc() { return t("tournamentsHome.publiczny_dostep_do_turniejow_drabinek"); },
    icon: <Eye className="h-11 w-11" />,
    href: "/fan",
    cardHover: "hover:border-orange-500/60 hover:bg-orange-500/10",
    iconHover: "group-hover:text-orange-400",
  },
];

export default function TournamentsHome() {
  const { role, setRole } = useAuth();
  const [location, navigate] = useLocation();
  const isExperimental = isExperimentalTournamentPath(location);

  function selectRole(item: (typeof TOURNAMENT_ROLES)[number]) {
    setRole(item.id);
    navigate(
      isExperimental
        ? tournamentRoleHomeHref(item.id, true)
        : item.href,
    );
  }

  return (
    <div className={`min-h-screen bg-background px-4 py-8 sm:py-12 text-foreground dark ${isExperimental ? "experimental-tournament-entry experimental-role-home" : ""}`}>
      <div className={`mx-auto max-w-4xl ${isExperimental ? "experimental-entry-inner" : ""}`}>
        <div className="mb-2 flex justify-end"><LanguageSwitcher /></div>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-8 inline-flex min-h-11 items-center gap-2 -ml-2 px-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("tournamentsHome.wszystkie_kategorie")}</button>

        <div className={`mb-10 text-center ${isExperimental ? "experimental-entry-hero p-6 sm:p-8" : ""}`}>
          {isExperimental && (
            <div className="mb-3 flex justify-center">
              <span className="experimental-mode-badge">
                <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
                {t("tournamentsHome.experimental")}</span>
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary">
            {isExperimental ? t("tournamentsHome.turnieje_nowy_interfejs") : t("tournamentsHome.turnieje")}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {isExperimental
              ? t("tournamentsHome.kim_jestes_organizator_tworzy_i")
              : t("tournamentsHome.wybierz_sposob_wejscia_do_modulu")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
          {TOURNAMENT_ROLES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectRole(item)}
              data-exp-role={isExperimental ? item.id : undefined}
              className={`group relative min-h-[148px] sm:min-h-56 rounded-xl border border-border bg-card p-4 sm:p-6 text-left transition-all duration-200 ${item.cardHover} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isExperimental ? "experimental-entry-card" : ""}`}
            >
              <div className={`mb-3 sm:mb-6 text-muted-foreground transition-colors ${item.iconHover}`}>
                {item.icon}
              </div>
              <h2 className="mb-2 text-lg sm:text-xl font-semibold">{item.label}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              {role === item.id && (
                <span className="absolute right-3 top-3 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                  {t("tournamentsHome.ostatnio_uzywane")}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
