import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { getRoleHomePath } from "@/components/app-navigation";
import { useAuth } from "@/context/auth-context";
import {
  EXPERIMENTAL_TOURNAMENT_ROOT,
  isExperimentalTournamentPath,
  tournamentRoleHomeHref,
} from "@/features/experimental-tournaments/experimental-tournament-routing";

export function ExperimentalOrganizerGuard({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  const [location, navigate] = useLocation();

  // On Experimental routes non-organizers go to their own Experimental home, so the
  // guard never drops them into a Stable screen. Elsewhere (e.g. the shared version
  // chooser) the previous destinations are kept. Authorization itself is unchanged.
  const redirectTo =
    role === "organizer"
      ? null
      : !isExperimentalTournamentPath(location)
        ? getRoleHomePath(role, "/")
        : role === "support" || role === "fan"
          ? tournamentRoleHomeHref(role, true)
          : EXPERIMENTAL_TOURNAMENT_ROOT;

  useEffect(() => {
    if (redirectTo !== null) {
      navigate(redirectTo, { replace: true });
    }
  }, [navigate, redirectTo]);

  if (redirectTo !== null) return null;
  return <>{children}</>;
}
