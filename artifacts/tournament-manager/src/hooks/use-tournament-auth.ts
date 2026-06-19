import { useEffect } from "react";
import { setActiveOrganizerToken, setActiveSupportToken } from "@workspace/api-client-react";
import { useAuth } from "@/context/auth-context";

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

  useEffect(() => {
    const tok = getOrgToken(tournamentId);
    const sess = getSupSession(tournamentId);
    if (tok) {
      setActiveOrganizerToken(tok);
      setActiveSupportToken(null);
    } else if (sess) {
      setActiveSupportToken(sess.token);
      setActiveOrganizerToken(null);
    } else {
      setActiveOrganizerToken(null);
      setActiveSupportToken(null);
    }
    return () => {
      setActiveOrganizerToken(null);
      setActiveSupportToken(null);
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
  };
}
