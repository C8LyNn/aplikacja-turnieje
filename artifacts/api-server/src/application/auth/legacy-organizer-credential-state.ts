export type LegacyCredentialClassification =
  | "no_credentials"
  | "host_code_only"
  | "organizer_password_only"
  | "both_credentials";

export function classifyLegacyCredentials(input: {
  hostCode: string | null;
  organizerPasswordHash: string | null;
}): LegacyCredentialClassification {
  if (input.hostCode && input.organizerPasswordHash) return "both_credentials";
  if (input.hostCode) return "host_code_only";
  if (input.organizerPasswordHash) return "organizer_password_only";
  return "no_credentials";
}

export type OrganizerCredentialAccessMode =
  | "organizer_login"
  | "legacy_upgrade"
  | "admin_recovery";

export interface OrganizerCredentialBootstrapState {
  exists: boolean;
  accessMode: OrganizerCredentialAccessMode | null;
  private: boolean;
}

export function buildOrganizerCredentialBootstrapState(input: {
  hostCode: string | null;
  organizerPasswordHash: string | null;
  visibility: string;
}): OrganizerCredentialBootstrapState {
  const classification = classifyLegacyCredentials(input);
  const accessMode = classification === "host_code_only"
    ? "legacy_upgrade"
    : classification === "no_credentials"
      ? "admin_recovery"
      : "organizer_login";
  return {
    exists: true,
    accessMode,
    private: input.visibility !== "public_online",
  };
}
