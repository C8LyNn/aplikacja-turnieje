import { useEffect, useState } from "react";
import { setActiveOrganizerToken, setActiveSupportToken, setActiveViewerToken } from "@workspace/api-client-react";
import { useAuth } from "@/context/auth-context";
import { useVerifiedSupportSession } from "@/hooks/use-tournament-auth";

/**
 * QW-05: a read-only tournament page (audience, bracket) sends the credentials this browser session already holds
 * for the tournament — organizer, verified support or viewer password, in that order — and nothing else.
 * Pages reset the shared API credentials on unmount, so a page that skipped this step (the bracket) read a private
 * tournament without them and could never load it. Queries wait for `ready` so the first request is authorised.
 */
export function useTournamentReadAuth(id: number) {
  const { getOrgToken, getSupSession, getViewerTok } = useAuth();
  const [preparedAuthId, setPreparedAuthId] = useState<number | null>(null);
  const organizerToken = getOrgToken(id);
  const storedSupportSession = getSupSession(id);
  const { supportSession, isChecking: isSupportChecking } =
    useVerifiedSupportSession(id, organizerToken ? null : storedSupportSession);

  useEffect(() => {
    const viewerToken = getViewerTok(id);
    if (organizerToken) { setActiveOrganizerToken(organizerToken); setActiveSupportToken(null); setActiveViewerToken(null); }
    else if (supportSession) { setActiveSupportToken(supportSession.token); setActiveOrganizerToken(null); setActiveViewerToken(null); }
    else if (viewerToken) { setActiveViewerToken(viewerToken); setActiveOrganizerToken(null); setActiveSupportToken(null); }
    else { setActiveOrganizerToken(null); setActiveSupportToken(null); setActiveViewerToken(null); }
    setPreparedAuthId(isSupportChecking ? null : id);
    return () => {
      setPreparedAuthId(null);
      setActiveOrganizerToken(null); setActiveSupportToken(null); setActiveViewerToken(null);
    };
  }, [id, isSupportChecking, organizerToken, supportSession?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ready: !!id && preparedAuthId === id, organizerToken, supportSession, isSupportChecking };
}
