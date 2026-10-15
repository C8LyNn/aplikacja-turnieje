import { Link, useLocation } from "wouter";
import { ArrowLeft, Trophy } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import type { Role } from "@/lib/auth";
import { isExperimentalTournamentPath, tournamentRoleHomeHref } from "@/features/experimental-tournaments/experimental-tournament-routing";

const ROLE_HOME: Record<Role, { href: string; label: string }> = {
  organizer: { href: "/dashboard", label: "Wróć do dashboardu" },
  support: { href: "/support", label: "Wróć do turniejów" },
  fan: { href: "/fan", label: "Wróć do turniejów" },

};

const navigationFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

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

  return (
    <Link
      href={getRoleHomePath(role, fallbackHref, experimental)}
      className={`inline-flex items-center gap-2 rounded-sm font-bold tracking-tight text-primary ${navigationFocus} ${className}`}
      aria-label="Strona główna aktualnej roli"
    >
      <Trophy className="w-6 h-6" aria-hidden="true" />
      <span>TM_SYS</span>
    </Link>
  );
}

export function RoleHomeLink({
  fallbackHref = "/",
  fallbackLabel = "Wróć do strony głównej",
  className = "",
}: {
  fallbackHref?: string;
  fallbackLabel?: string;
  className?: string;
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
      className={`inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground ${navigationFocus} ${className}`}
    >
      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
      <span>{destination.label}</span>
    </Link>
  );
}

export function RoleSelectionLink({ className = "" }: { className?: string }) {
  const [location] = useLocation();
  const experimental = isExperimentalTournamentPath(location);

  return (
    <Link
      href={experimental ? "/experimental/tournaments" : "/tournaments"}
      className={`inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground ${navigationFocus} ${className}`}
    >
      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
      <span>Zmień rolę turniejową</span>
    </Link>
  );
}
