const LOCAL_DATABASE_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

export function configureLocalLegacyCredentialsDatabase(
  env: NodeJS.ProcessEnv = process.env,
): void {
  const raw = env.LEGACY_CREDENTIALS_DATABASE_URL;
  if (!raw) {
    throw new Error("LEGACY_CREDENTIALS_DATABASE_URL is required.");
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("LEGACY_CREDENTIALS_DATABASE_URL must be a valid PostgreSQL URL.");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("LEGACY_CREDENTIALS_DATABASE_URL must use PostgreSQL.");
  }
  if (!LOCAL_DATABASE_HOSTS.has(url.hostname)) {
    throw new Error("Legacy credential tools accept local PostgreSQL connections only.");
  }
  env.DATABASE_URL = raw;
}

export function readIntegerArgument(name: string, argv = process.argv.slice(2)): number {
  const prefix = `--${name}=`;
  const raw = argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`--${name}=<positive integer> is required.`);
  }
  return parsed;
}
