export interface OrganizerCredentialScreenState {
  exists: boolean;
  accessMode:
    | "organizer_login"
    | "legacy_upgrade"
    | "admin_recovery"
    | null;
  private: boolean;
}

export type OrganizerCredentialScreen =
  | "loading"
  | "organizer_login"
  | "legacy_upgrade"
  | "admin_recovery"
  | "not_found";

export function organizerCredentialScreen(
  state: OrganizerCredentialScreenState | null,
  loading: boolean,
): OrganizerCredentialScreen {
  if (loading) return "loading";
  if (state == null) return "not_found";
  if (!state.exists) return "not_found";
  return state.accessMode ?? "not_found";
}
