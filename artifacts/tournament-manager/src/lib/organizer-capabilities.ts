import type { Tournament } from "@workspace/api-client-react";
import type { Role } from "@/lib/auth";

export interface OrganizerCapabilities {
  canManageLifecycle: boolean;
  canGenerateRound: boolean;
  canStartTournament: boolean;
  canManageParticipants: boolean;
  canWriteTournamentResults: boolean;
  canUseLegacyMatchTools: boolean;
  canAccessConducting: boolean;
  canUndo: boolean;
  canManageOrganizerSettings: boolean;
  canManageSharing: boolean;
  canManageBackup: boolean;
  canViewOrganizerNavigation: boolean;
}

export interface OrganizerCapabilityContext {
  role: Role | null;
  tournament: Pick<Tournament, "hasHostCode" | "hasOrganizerPassword">;
  hasOrganizerToken: boolean;
  hasSupportSession: boolean;
  hasVerifiedLegacyHost?: boolean;
}

export const NO_ORGANIZER_CAPABILITIES: OrganizerCapabilities = {
  canManageLifecycle: false,
  canGenerateRound: false,
  canStartTournament: false,
  canManageParticipants: false,
  canWriteTournamentResults: false,
  canUseLegacyMatchTools: false,
  canAccessConducting: false,
  canUndo: false,
  canManageOrganizerSettings: false,
  canManageSharing: false,
  canManageBackup: false,
  canViewOrganizerNavigation: false,
};

/**
 * Mirrors the current endpoint boundaries:
 * - stage lifecycle, security, sharing and backup require an organizer token;
 * - tournament-write operations require an organizer token or a real support session;
 * - legacy host-code and unprotected tournaments retain only operations backed
 *   by checkHostAuth.
 */
export function deriveOrganizerCapabilities(
  context: OrganizerCapabilityContext,
): OrganizerCapabilities {
  const organizer = context.hasOrganizerToken;
  const support = context.hasSupportSession;
  const legacyOrganizer =
    context.role === "organizer" &&
    !context.tournament.hasOrganizerPassword &&
    (context.hasVerifiedLegacyHost === true || !context.tournament.hasHostCode);
  const authenticatedHost = organizer || support || legacyOrganizer;
  const tournamentWrite = organizer || support;

  if (!authenticatedHost) return NO_ORGANIZER_CAPABILITIES;

  return {
    canManageLifecycle: organizer,
    canGenerateRound: tournamentWrite,
    canStartTournament: authenticatedHost,
    canManageParticipants: authenticatedHost,
    canWriteTournamentResults: tournamentWrite,
    canUseLegacyMatchTools: authenticatedHost,
    canAccessConducting: authenticatedHost,
    canUndo: tournamentWrite,
    canManageOrganizerSettings: organizer,
    canManageSharing: organizer,
    canManageBackup: organizer,
    canViewOrganizerNavigation: true,
  };
}

export function managementRoleForCapabilities(
  capabilities: OrganizerCapabilities,
  hasOrganizerToken: boolean,
  hasSupportSession: boolean,
  fallbackRole: Role | null,
): "organizer" | "support" | null {
  if (!capabilities.canViewOrganizerNavigation) return null;
  if (hasOrganizerToken) return "organizer";
  if (hasSupportSession) return "support";
  return fallbackRole === "organizer" ? "organizer" : null;
}
