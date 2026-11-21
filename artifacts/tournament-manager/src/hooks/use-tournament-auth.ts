import { t } from "@/i18n";
import { useEffect, useRef, useState } from "react";
import {
  setActiveOrganizerToken,
  setActiveSupportToken,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/auth-context";
import { apiVerifyOrganizerToken, apiVerifySupportSession } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

/**
 * Drops a stored organizer token that the server rejects (401/403) and tells the organizer to log in
 * again. Network errors and other statuses keep the token: only an explicit refusal clears it.
 */
export function useOrganizerTokenCheck(tournamentId: number, orgToken: string | null | undefined) {
  const { removeOrgToken } = useAuth();
  useEffect(() => {
    if (!orgToken || !(tournamentId > 0)) return;
    let cancelled = false;
    void apiVerifyOrganizerToken(tournamentId, orgToken).catch((error: unknown) => {
      const status = (error as { status?: number }).status;
      if (cancelled || (status !== 401 && status !== 403)) return;
      removeOrgToken(tournamentId);
      setActiveOrganizerToken(null);
      toast({
        title: t("useTournamentAuth.sesja_organizatora_wygasla"),
        description: t("useTournamentAuth.haslo_organizatora_moglo_sie_zmienic"),
        variant: "destructive",
      });
    });
    return () => { cancelled = true; };
  }, [orgToken, removeOrgToken, tournamentId]);
}

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
    permissions?: string[] | null;
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
      .then((session) => {
        if (generation.current !== currentGeneration) return;
        // #331: keep the permissions the server read for this session (older servers send none → legacy set).
        const permissions = Array.isArray(session?.permissions) ? session.permissions : null;
        setVerification({ tournamentId, token, verified: true, checking: false, permissions });
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
    supportPermissions: appliesToCurrentSession && verification.verified ? verification.permissions ?? null : null,
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
  const { supportSession: supSession, isChecking: isSupportChecking, supportPermissions } =
    useVerifiedSupportSession(tournamentId, orgToken ? null : storedSupportSession);
  useOrganizerTokenCheck(tournamentId, orgToken);

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
    supportPermissions,
    isAuthenticated: !!(orgToken || supSession),
    isReady: !isSupportChecking,
  };
}
