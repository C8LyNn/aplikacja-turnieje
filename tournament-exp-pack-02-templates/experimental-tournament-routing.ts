import { useLocation, useRoute } from "wouter";
import type { Role } from "@/lib/auth";

export type TournamentRouteView =
  | "detail"
  | "host"
  | "audience"
  | "bracket"
  | "projector";

export const EXPERIMENTAL_TOURNAMENT_ROOT = "/experimental/tournaments";
export const STABLE_TOURNAMENT_ROOT = "/tournaments";

const ROUTES: Record<
  TournamentRouteView,
  { stable: string; experimental: string }
> = {
  detail: {
    stable: "/tournaments/:id",
    experimental: "/experimental/tournaments/:id",
  },
  host: {
    stable: "/tournaments/:id/host",
    experimental: "/experimental/tournaments/:id/host",
  },
  audience: {
    stable: "/tournaments/:id/audience",
    experimental: "/experimental/tournaments/:id/audience",
  },
  bracket: {
    stable: "/tournaments/:id/bracket",
    experimental: "/experimental/tournaments/:id/bracket",
  },
  projector: {
    stable: "/tournaments/:id/projector",
    experimental: "/experimental/tournaments/:id/projector",
  },
};

const ROLE_HOME_STABLE: Record<Role, string> = {
  organizer: "/dashboard",
  support: "/support",
  fan: "/fan",
};

const ROLE_HOME_EXPERIMENTAL: Record<Role, string> = {
  organizer: "/experimental/tournaments/dashboard",
  support: "/experimental/tournaments/support",
  fan: "/experimental/tournaments/fan",
};

export function isExperimentalTournamentPath(pathname: string): boolean {
  const path = pathname.split("?")[0] || "/";
  return (
    path === EXPERIMENTAL_TOURNAMENT_ROOT ||
    path.startsWith(`${EXPERIMENTAL_TOURNAMENT_ROOT}/`)
  );
}

export function tournamentRoleHomeHref(
  role: Role,
  experimental: boolean,
): string {
  return experimental ? ROLE_HOME_EXPERIMENTAL[role] : ROLE_HOME_STABLE[role];
}

export function tournamentHref(
  tournamentId: number,
  experimental: boolean,
  tail = "",
): string {
  const root = experimental
    ? EXPERIMENTAL_TOURNAMENT_ROOT
    : STABLE_TOURNAMENT_ROOT;
  return `${root}/${tournamentId}${tail}`;
}

export function tournamentModeHref(
  href: string,
  experimental: boolean,
): string {
  if (!experimental) return href;
  if (href.startsWith(EXPERIMENTAL_TOURNAMENT_ROOT)) return href;
  return href.replace(
    /^\/tournaments(?=\/|$)/,
    EXPERIMENTAL_TOURNAMENT_ROOT,
  );
}

export function useExperimentalTournamentMode(): boolean {
  const [location] = useLocation();
  return isExperimentalTournamentPath(location);
}

export function useTournamentRoute(view: TournamentRouteView): {
  id: number;
  isExperimental: boolean;
} {
  const [, stableParams] = useRoute(ROUTES[view].stable);
  const [experimentalMatch, experimentalParams] = useRoute(
    ROUTES[view].experimental,
  );

  const params = experimentalMatch ? experimentalParams : stableParams;
  const rawId = params?.id;
  const parsedId = rawId ? Number.parseInt(rawId, 10) : 0;

  return {
    id: Number.isFinite(parsedId) ? parsedId : 0,
    isExperimental: experimentalMatch,
  };
}
