import { eq } from "drizzle-orm";
import { db, tournamentsTable, type Tournament } from "@workspace/db";
import { hashPassword } from "../../auth";
import { classifyLegacyCredentials } from "./legacy-organizer-credential-state";
import {
  executeCredentialAttempt,
  NEW_CREDENTIAL_MIN_LENGTH,
} from "./credential-rate-limit";

export {
  classifyLegacyCredentials,
  type LegacyCredentialClassification,
} from "./legacy-organizer-credential-state";

export type LegacyUpgradeErrorCode =
  | "TOURNAMENT_NOT_FOUND"
  | "LEGACY_HOST_CODE_REQUIRED"
  | "INVALID_LEGACY_HOST_CODE"
  | "LEGACY_CREDENTIALS_ALREADY_UPGRADED"
  | "ORGANIZER_PASSWORD_TOO_SHORT"
  | "ADMIN_RECOVERY_REQUIRED"
  | "LEGACY_UPGRADE_DENIED";

const LEGACY_ERROR_MESSAGES: Record<LegacyUpgradeErrorCode, string> = {
  TOURNAMENT_NOT_FOUND: "Turniej nie istnieje.",
  LEGACY_HOST_CODE_REQUIRED: "Kod prowadzącego jest wymagany.",
  INVALID_LEGACY_HOST_CODE: "Nieprawidłowy kod prowadzącego dla tego turnieju.",
  LEGACY_CREDENTIALS_ALREADY_UPGRADED:
    "Ten turniej posiada już hasło organizatora. Zaloguj się hasłem organizatora.",
  ORGANIZER_PASSWORD_TOO_SHORT:
    `Nowe hasło organizatora musi mieć co najmniej ${NEW_CREDENTIAL_MIN_LENGTH} znaków.`,
  ADMIN_RECOVERY_REQUIRED:
    "Ten turniej nie ma poświadczeń możliwych do samodzielnego odzyskania. Wymagana jest pomoc administratora.",
  LEGACY_UPGRADE_DENIED:
    "Nie udało się zweryfikować danych aktualizacji.",
};

export class LegacyUpgradeError extends Error {
  constructor(public readonly code: LegacyUpgradeErrorCode) {
    super(LEGACY_ERROR_MESSAGES[code]);
    this.name = "LegacyUpgradeError";
  }
}

export interface UpgradeLegacyOrganizerTestHooks {
  /** Test-only fault seam. It is not exposed through HTTP or environment variables. */
  afterCredentialsUpdated?: () => void | Promise<void>;
}

export async function upgradeLegacyOrganizerCredentials(input: {
  tournamentId: number;
  hostCode: string;
  organizerPassword: string;
  testHooks?: UpgradeLegacyOrganizerTestHooks;
}) {
  if (!input.hostCode) throw new LegacyUpgradeError("LEGACY_HOST_CODE_REQUIRED");
  if (input.organizerPassword.length < NEW_CREDENTIAL_MIN_LENGTH)
    throw new LegacyUpgradeError("ORGANIZER_PASSWORD_TOO_SHORT");

  return db.transaction(async (tx) => {
    const [tournament] = await tx
      .select()
      .from(tournamentsTable)
      .where(eq(tournamentsTable.id, input.tournamentId))
      .for("update");
    if (!tournament) throw new LegacyUpgradeError("TOURNAMENT_NOT_FOUND");
    if (tournament.organizerPasswordHash)
      throw new LegacyUpgradeError("LEGACY_CREDENTIALS_ALREADY_UPGRADED");
    if (!tournament.hostCode)
      throw new LegacyUpgradeError("ADMIN_RECOVERY_REQUIRED");
    if (tournament.hostCode !== input.hostCode)
      throw new LegacyUpgradeError("INVALID_LEGACY_HOST_CODE");

    const newHash = await hashPassword(input.organizerPassword);
    const [updated] = await tx
      .update(tournamentsTable)
      .set({
        organizerPasswordHash: newHash,
        hostCode: null,
      })
      .where(eq(tournamentsTable.id, input.tournamentId))
      .returning();
    await input.testHooks?.afterCredentialsUpdated?.();
    return updated;
  });
}

export async function upgradeLegacyOrganizerCredentialsRateLimited(input: {
  tournamentId: number;
  hostCode: string;
  organizerPassword: string;
  requestSourceFingerprint: string;
  testHooks?: UpgradeLegacyOrganizerTestHooks;
}): Promise<Tournament> {
  if (!input.hostCode) throw new LegacyUpgradeError("LEGACY_HOST_CODE_REQUIRED");
  if (input.organizerPassword.length < NEW_CREDENTIAL_MIN_LENGTH) {
    throw new LegacyUpgradeError("ORGANIZER_PASSWORD_TOO_SHORT");
  }

  return executeCredentialAttempt<Tournament>({
    tournamentId: input.tournamentId,
    credentialType: "legacy_upgrade",
    sourceFingerprint: input.requestSourceFingerprint,
    verify: async (tx) => {
      const [tournament] = await tx
        .select()
        .from(tournamentsTable)
        .where(eq(tournamentsTable.id, input.tournamentId))
        .for("update");
      if (
        !tournament ||
        tournament.organizerPasswordHash !== null ||
        tournament.hostCode === null ||
        tournament.hostCode !== input.hostCode
      ) {
        return { ok: false } as const;
      }
      const organizerPasswordHash = await hashPassword(input.organizerPassword);
      const [updated] = await tx
        .update(tournamentsTable)
        .set({ organizerPasswordHash, hostCode: null })
        .where(eq(tournamentsTable.id, tournament.id))
        .returning();
      if (!updated) {
        throw new Error("Legacy organizer credential upgrade did not persist.");
      }
      await input.testHooks?.afterCredentialsUpdated?.();
      return { ok: true, value: updated } as const;
    },
  });
}

export interface RecoverLegacyOrganizerTestHooks {
  /** Test-only fault seam. It is not exposed through HTTP or environment variables. */
  afterCredentialsUpdated?: () => void | Promise<void>;
}

export async function recoverLegacyOrganizerCredentials(input: {
  tournamentId: number;
  organizerPassword: string;
  dryRun: boolean;
  testHooks?: RecoverLegacyOrganizerTestHooks;
}) {
  if (input.organizerPassword.length < NEW_CREDENTIAL_MIN_LENGTH)
    throw new LegacyUpgradeError("ORGANIZER_PASSWORD_TOO_SHORT");

  return db.transaction(async (tx) => {
    const [tournament] = await tx
      .select()
      .from(tournamentsTable)
      .where(eq(tournamentsTable.id, input.tournamentId))
      .for("update");
    if (!tournament) throw new LegacyUpgradeError("TOURNAMENT_NOT_FOUND");
    const classification = classifyLegacyCredentials(tournament);
    if (classification !== "no_credentials") {
      throw new LegacyUpgradeError(
        tournament.organizerPasswordHash
          ? "LEGACY_CREDENTIALS_ALREADY_UPGRADED"
          : "LEGACY_HOST_CODE_REQUIRED",
      );
    }
    if (input.dryRun) {
      return { tournamentId: tournament.id, applied: false as const };
    }

    const organizerPasswordHash = await hashPassword(input.organizerPassword);
    await tx
      .update(tournamentsTable)
      .set({ organizerPasswordHash })
      .where(eq(tournamentsTable.id, tournament.id));
    await input.testHooks?.afterCredentialsUpdated?.();
    return { tournamentId: tournament.id, applied: true as const };
  });
}
