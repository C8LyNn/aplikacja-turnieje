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
  /** #331: cancel / restore a cancelled match / swap sides (support: "results.correct"). */
  canCorrectResults: boolean;
  /** #331: revert a saved result to enter it again (support: "results.correct"). */
  canRevertResults: boolean;
  /** #331: put a match on the viewers' screen (support: "presentation.featured"). */
  canFeatureMatch: boolean;
  /** #331: broadcast / scoreboard look (organizer, or support with "presentation.settings"). */
  canEditPresentation: boolean;
  /** #331: publish or hide the tournament (organizer, or support with "visibility.publish"). */
  canPublishVisibility: boolean;
}

/** #331: the permission keys a support person can hold (same catalog as the server). */
export const SUPPORT_PERMISSION_KEYS = [
  "matches.run",
  "results.write",
  "results.correct",
  "participants.manage",
  "stages.rounds",
  "presentation.featured",
  "presentation.settings",
  "visibility.publish",
] as const;
export type SupportPermissionKey = (typeof SUPPORT_PERMISSION_KEYS)[number];

/** What a shared-support-password session could do before #331 (the server keeps exactly this set). */
export const LEGACY_SUPPORT_PERMISSION_KEYS: readonly SupportPermissionKey[] = [
  "matches.run", "results.write", "results.correct", "participants.manage", "stages.rounds", "presentation.featured",
];

export const SUPPORT_PERMISSION_SHORT_LABELS: Record<SupportPermissionKey, string> = {
  "matches.run": "prowadzenie meczów",
  "results.write": "wpisywanie wyników",
  "results.correct": "poprawa wyników",
  "participants.manage": "uczestnicy",
  "stages.rounds": "start i kolejne rundy",
  "presentation.featured": "mecz na ekranie",
  "presentation.settings": "wygląd transmisji",
  "visibility.publish": "publikowanie turnieju",
};

export interface OrganizerCapabilityContext {
  role: Role | null;
  tournament: Pick<Tournament, "hasHostCode" | "hasOrganizerPassword">;
  hasOrganizerToken: boolean;
  hasSupportSession: boolean;
  hasVerifiedLegacyHost?: boolean;
  /** #331: the verified support session's permissions; undefined/null = the legacy shared-password set. */
  supportPermissions?: readonly string[] | null;
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
  canCorrectResults: false,
  canRevertResults: false,
  canFeatureMatch: false,
  canEditPresentation: false,
  canPublishVisibility: false,
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

  // #331: a support session (without an organizer token) gets exactly what its permissions allow.
  if (support && !organizer) {
    const granted = new Set(context.supportPermissions ?? LEGACY_SUPPORT_PERMISSION_KEYS);
    const has = (permission: SupportPermissionKey) => granted.has(permission);
    return {
      ...NO_ORGANIZER_CAPABILITIES,
      canGenerateRound: has("stages.rounds"),
      canStartTournament: has("stages.rounds"),
      canManageParticipants: has("participants.manage"),
      canWriteTournamentResults: has("results.write"),
      canUseLegacyMatchTools: has("matches.run"),
      canAccessConducting: true,
      canUndo: has("results.correct"),
      canViewOrganizerNavigation: true,
      canCorrectResults: has("results.correct"),
      canRevertResults: has("results.correct"),
      canFeatureMatch: has("presentation.featured"),
      canEditPresentation: has("presentation.settings"),
      canPublishVisibility: has("visibility.publish"),
    };
  }

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
    canCorrectResults: authenticatedHost,
    canRevertResults: tournamentWrite,
    canFeatureMatch: authenticatedHost,
    canEditPresentation: organizer,
    canPublishVisibility: organizer,
  };
}

/** #331: plain-language list of what a support person may do (for the restriction note). */
export function describeSupportPermissions(permissions: readonly string[] | null | undefined): string[] {
  const granted = new Set(permissions ?? LEGACY_SUPPORT_PERMISSION_KEYS);
  return SUPPORT_PERMISSION_KEYS.filter((key) => granted.has(key)).map((key) => SUPPORT_PERMISSION_SHORT_LABELS[key]);
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
