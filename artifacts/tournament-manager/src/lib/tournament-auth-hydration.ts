import {
  setActiveOrganizerToken,
  setActiveSupportToken,
} from "@workspace/api-client-react";

interface SupportSession {
  token: string;
  nick: string;
}

export function synchronizeTournamentAuthHeaders(
  tournamentId: number,
  getOrganizerToken: (id: number) => string | null,
  getSupportSession: (id: number) => SupportSession | null,
): void {
  const organizerToken = getOrganizerToken(tournamentId);
  const supportSession = getSupportSession(tournamentId);

  if (organizerToken) {
    setActiveOrganizerToken(organizerToken);
    setActiveSupportToken(null);
  } else if (supportSession) {
    setActiveSupportToken(supportSession.token);
    setActiveOrganizerToken(null);
  } else {
    setActiveOrganizerToken(null);
    setActiveSupportToken(null);
  }
}

export function clearTournamentAuthHeaders(): void {
  setActiveOrganizerToken(null);
  setActiveSupportToken(null);
}
