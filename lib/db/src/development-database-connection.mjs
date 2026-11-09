export const DEVELOPMENT_DATABASE_NAME = "tournament_replicate_development";

export function isTournamentDevelopmentDatabase(env) {
  return env.NODE_ENV === "development" &&
    env.REPLIT_DEPLOYMENT !== "1" &&
    env.TOURNAMENT_DEV_DATABASE_NAME === DEVELOPMENT_DATABASE_NAME;
}

export function resolveDatabaseConnectionString(env) {
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  if (!env.TOURNAMENT_DEV_DATABASE_NAME || env.NODE_ENV === "test") return env.DATABASE_URL;
  if (!isTournamentDevelopmentDatabase(env)) {
    throw new Error("Development database selection is forbidden outside the approved development runtime.");
  }
  const url = new URL(env.DATABASE_URL);
  if (!["postgres:", "postgresql:"].includes(url.protocol) || url.pathname !== "/heliumdb") {
    throw new Error("Development database selection requires the verified managed development connection.");
  }
  url.pathname = "/" + DEVELOPMENT_DATABASE_NAME;
  return url.toString();
}
