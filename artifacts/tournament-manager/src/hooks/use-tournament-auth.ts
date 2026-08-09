import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  clearTournamentAuthHeaders,
  synchronizeTournamentAuthHeaders,
} from "@/lib/tournament-auth-hydration";

/**
 * Syncs per-tournament auth tokens from sessionStorage into the global
 * API-client module-level variables so every customFetch call carries the
 * correct X-Organizer-Token / X-Support-Token header automatically.
 *
 * Must be called on every page that issues write requests to protected routes.
 * Clears the module-level variables on unmount so stale tokens never leak
 * across pages.
 */
export function useSyncTournamentAuth(tournamentId: number) {
  const { getOrgToken, getSupSession } = useAuth();

  const orgToken = getOrgToken(tournamentId);
  const supSession = getSupSession(tournamentId);
  const [hydratedTournamentId, setHydratedTournamentId] = useState<
    number | null
  >(null);

  useEffect(() => {
    synchronizeTournamentAuthHeaders(
      tournamentId,
      getOrgToken,
      getSupSession,
    );
    setHydratedTournamentId(tournamentId);
    return () => {
      clearTournamentAuthHeaders();
    };
  }, [tournamentId]); // eslint-disable-line react-hooks/exhaustive-deps
  // Deps intentionally limited to [tournamentId]:
  // - On mount/id change: restores tokens from sessionStorage
  // - Login modals call setActiveOrganizerToken/setActiveSupportToken synchronously (no effect re-run needed)
  // - If deps included orgToken/supSession, cleanup would clear the token that the modal just set

  return {
    orgToken,
    supSession,
    isAuthenticated: !!(orgToken || supSession),
    isHydrated:
      tournamentId > 0 && hydratedTournamentId === tournamentId,
  };
}
