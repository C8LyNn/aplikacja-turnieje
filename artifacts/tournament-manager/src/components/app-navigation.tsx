import { t } from "@/i18n";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Trophy } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import type { Role } from "@/lib/auth";
import { isExperimentalTournamentPath, tournamentRoleHomeHref } from "@/features/experimental-tournaments/experimental-tournament-routing";

const ROLE_HOME: Record<Role, { href: string; label: string }> = {
  organizer: { href: "/dashboard", get label() { return t("appNavigation.wroc_do_dashboardu"); } },
  support: { href: "/support", get label() { return t("appNavigation.wroc_do_turniejow"); } },
  fan: { href: "/fan", get label() { return t("appNavigation.wroc_do_turniejow"); } },

};

const navigationFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const navigationTouch = "min-h-11 min-w-11 px-2 py-2";

export function getRoleHomePath(
  role: Role | null,
  fallbackHref = "/",
  experimental = false,
): string {
  return role
    ? experimental
      ? tournamentRoleHomeHref(role, true)
      : ROLE_HOME[role].href
    : fallbackHref;
}

export function AppLogoLink({
  fallbackHref = "/",
  className = "",
}: {
  fallbackHref?: string;
  className?: string;
}) {
  const { role } = useAuth();
  const [location] = useLocation();
  const experimental = isExperimentalTournamentPath(location);
  const homeHref = getRoleHomePath(role, fallbackHref, experimental);

  return (
    <Link
      href={homeHref}
      aria-current={location === homeHref ? "page" : undefined}
      className={`inline-flex items-center gap-2 rounded-sm font-bold tracking-tight text-primary ${navigationTouch} ${navigationFocus} ${className}`}
      aria-label={t("appNavigation.strona_glowna_aktualnej_roli")}
    >
      <Trophy className="w-6 h-6" aria-hidden="true" />
      <span>{t("appNavigation.tm_sys")}</span>
    </Link>
  );
}

export function RoleHomeLink({
  fallbackHref = "/",
  fallbackLabel = t("appNavigation.wroc_do_strony_glownej"),
  className = "",
  labelClassName = "",
}: {
  fallbackHref?: string;
  fallbackLabel?: string;
  className?: string;
  /** QW-01: lets a tight header keep only the arrow visible (the label stays the accessible name). */
  labelClassName?: string;
}) {
  const { role } = useAuth();
  const [location] = useLocation();
  const experimental = isExperimentalTournamentPath(location);
  const destination = role
    ? {
        ...ROLE_HOME[role],
        href: getRoleHomePath(role, fallbackHref, experimental),
      }
    : { href: fallbackHref, label: fallbackLabel };

  return (
    <Link
      href={destination.href}
      className={`inline-flex min-w-0 items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground ${navigationTouch} ${navigationFocus} ${className}`}
    >
      <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span className={labelClassName || undefined}>{destination.label}</span>
    </Link>
  );
}

export function RoleSelectionLink({ className = "" }: { className?: string }) {
  const [location] = useLocation();
  const experimental = isExperimentalTournamentPath(location);
  const selectionHref = experimental ? "/experimental/tournaments" : "/tournaments/stable";

  return (
    <Link
      href={selectionHref}
      aria-current={location === selectionHref ? "page" : undefined}
      aria-label={t("appNavigation.zmien_role_turniejowa")}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground ${navigationTouch} ${navigationFocus} ${className}`}
    >
      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
      <span className="sm:hidden" aria-hidden="true">{t("appNavigation.zmien_role")}</span>
      <span className="hidden sm:inline" aria-hidden="true">{t("appNavigation.zmien_role_turniejowa")}</span>
    </Link>
  );
}
