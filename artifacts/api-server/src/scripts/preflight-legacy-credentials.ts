import { configureLocalLegacyCredentialsDatabase } from "./legacy-credentials-script-config";

configureLocalLegacyCredentialsDatabase();

const [{ db, pool, tournamentsTable }, { classifyLegacyCredentials }] =
  await Promise.all([
    import("@workspace/db"),
    import("../application/auth/legacy-organizer-credentials"),
  ]);

try {
  const tournaments = await db
    .select({
      id: tournamentsTable.id,
      name: tournamentsTable.name,
      hostCode: tournamentsTable.hostCode,
      organizerPasswordHash: tournamentsTable.organizerPasswordHash,
    })
    .from(tournamentsTable);
  const report = tournaments.map((tournament) => {
    const classification = classifyLegacyCredentials(tournament);
    return {
      id: tournament.id,
      name: tournament.name,
      classification,
      action:
        classification === "no_credentials"
          ? "administrative_recovery_required"
          : classification === "host_code_only"
            ? "user_upgrade_available"
            : classification === "both_credentials"
              ? "remove_legacy_host_code_after_review"
              : "none",
    };
  });
  process.stdout.write(`${JSON.stringify({ readOnly: true, tournaments: report }, null, 2)}\n`);
} finally {
  await pool.end();
}
