import { useEffect, useRef, useState } from "react";
import { setActiveOrganizerToken, setActiveSupportToken } from "@workspace/api-client-react";
import { useAuth } from "@/context/auth-context";
import { apiVerifySupportSession } from "@/lib/auth";

type SupportSession = { token: string; nick: string };

export function useVerifiedSupportSession(
  tournamentId: number,
  storedSession: SupportSession | null,
) {
  const { removeSupSession } = useAuth();
  const generation = useRef(0);
  const [verification, setVerification] = useState<{
    tournamentId: number;
    token: string;
    verified: boolean;
    checking: boolean;
  } | null>(null);
  const token = storedSession?.token ?? "";

  useEffect(() => {
    const currentGeneration = ++generation.current;
    if (!token) {
      setVerification(null);
      return () => { generation.current += 1; };
    }
    setVerification({ tournamentId, token, verified: false, checking: true });
    void apiVerifySupportSession(tournamentId, token)
      .then(() => {
        if (generation.current !== currentGeneration) return;
        setVerification({ tournamentId, token, verified: true, checking: false });
      })
      .catch((error: unknown) => {
        if (generation.current !== currentGeneration) return;
        const status = (error as { status?: number }).status;
        if (status === 401 || status === 403) removeSupSession(tournamentId);
        setVerification({ tournamentId, token, verified: false, checking: false });
      });
    return () => { generation.current += 1; };
  }, [removeSupSession, token, tournamentId]);

  const appliesToCurrentSession =
    verification?.tournamentId === tournamentId && verification.token === token;
  return {
    supportSession:
      appliesToCurrentSession && verification.verified ? storedSession : null,
    isChecking: !!token && (!appliesToCurrentSession || verification.checking),
  };
}

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
  const storedSupportSession = getSupSession(tournamentId);
  const { supportSession: supSession, isChecking: isSupportChecking } =
    useVerifiedSupportSession(tournamentId, orgToken ? null : storedSupportSession);

  useEffect(() => {
    if (orgToken) {
      setActiveOrganizerToken(orgToken);
      setActiveSupportToken(null);
    } else if (supSession) {
      setActiveSupportToken(supSession.token);
      setActiveOrganizerToken(null);
    } else {
      setActiveOrganizerToken(null);
      setActiveSupportToken(null);
    }
    return () => {
      setActiveOrganizerToken(null);
      setActiveSupportToken(null);
    };
  }, [orgToken, supSession?.token, tournamentId]);

  return {
    orgToken,
    supSession,
    isAuthenticated: !!(orgToken || supSession),
    isReady: !isSupportChecking,
  };
}
