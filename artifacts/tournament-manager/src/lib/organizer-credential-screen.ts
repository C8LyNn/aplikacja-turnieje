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
  if (state?.exists !== true) return "not_found";
  switch (state.accessMode) {
    case "organizer_login":
    case "legacy_upgrade":
    case "admin_recovery":
      return state.accessMode;
    default:
      // Unknown/unsupported backend mode must never select an unintended login flow.
      return "not_found";
  }
}
