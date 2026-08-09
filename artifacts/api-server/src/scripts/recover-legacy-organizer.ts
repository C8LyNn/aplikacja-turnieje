import {
  configureLocalLegacyCredentialsDatabase,
  readIntegerArgument,
} from "./legacy-credentials-script-config";

configureLocalLegacyCredentialsDatabase();

const tournamentId = readIntegerArgument("tournament-id");
const confirmed = process.argv.includes(
  "--confirm=ASSIGN_INITIAL_ORGANIZER_PASSWORD",
);
const organizerPassword = process.env.LEGACY_ORGANIZER_PASSWORD ?? "";
if (organizerPassword.length < 8) {
  throw new Error("LEGACY_ORGANIZER_PASSWORD must contain at least 8 characters.");
}

const [{ pool }, { recoverLegacyOrganizerCredentials }] = await Promise.all([
  import("@workspace/db"),
  import("../application/auth/legacy-organizer-credentials"),
]);

try {
  const result = await recoverLegacyOrganizerCredentials({
    tournamentId,
    organizerPassword,
    dryRun: !confirmed,
  });
  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      tournamentId: result.tournamentId,
      dryRun: !confirmed,
      applied: result.applied,
    })}\n`,
  );
} finally {
  await pool.end();
}
