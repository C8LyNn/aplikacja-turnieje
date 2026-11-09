export const DEVELOPMENT_DATABASE_NAME: "tournament_replicate_development";
export function isTournamentDevelopmentDatabase(env: NodeJS.ProcessEnv): boolean;
export function resolveDatabaseConnectionString(env: NodeJS.ProcessEnv): string;
