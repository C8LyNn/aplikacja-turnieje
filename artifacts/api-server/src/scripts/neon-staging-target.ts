/**
 * Private read-only Neon staging connection policy.
 *
 * This host is an isolated QA child branch, NOT Neon main and NOT Replit
 * production. Only connection URIs supplied through an external secret store
 * may be passed here; never log or store the resulting string in source control.
 */
export const PINNED_NEON_STAGING_HOST =
  "ep-morning-block-b9f4pza2.c-7.eu-central-1.aws.neon.tech";

export function stagingReadOnlyDatabaseUrl(value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error("NEON_STAGING_DATABASE_URL is required.");
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("Staging database connection string is malformed.");
  }
  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error("Expected a PostgreSQL connection URI.");
  }
  if (parsed.hostname !== PINNED_NEON_STAGING_HOST ||
      parsed.port && parsed.port !== "5432" ||
      parsed.pathname !== "/tournament_manager" ||
      parsed.username !== "tournament_manager_owner" ||
      !parsed.password ||
      !["require", "verify-full"].includes(parsed.searchParams.get("sslmode") ?? "") ||
      parsed.searchParams.has("options")) {
    throw new Error("Connection refused: endpoint, role, SSL or database is not the pinned isolated Neon staging target.");
  }
  // PostgreSQL connection startup option: enforced on EVERY connection in
  // the pg Pool, including the health check and all in-process GET handlers.
  parsed.searchParams.set("options", "-c default_transaction_read_only=on");
  return parsed.toString();
}
