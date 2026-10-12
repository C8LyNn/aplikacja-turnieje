import type { PoolClient } from "pg";

export interface CatalogDatabasePreflightConfig {
  readonly connectionString?: string;
  readonly expectedHost?: string;
  readonly expectedDatabase: string;
  readonly schema: string;
  readonly environment: "staging" | "production";
}
export interface CatalogDatabasePreflightCheck {
  name: string;
  passed: boolean;
  reason?: string;
}
export declare function loadCatalogPreflightConfig(
  env?: NodeJS.ProcessEnv,
): CatalogDatabasePreflightConfig & { connectionString: string; expectedHost: string };
export declare function inspectCatalogPreflight(
  client: Pick<PoolClient, "query">,
  config: CatalogDatabasePreflightConfig,
): Promise<{
  passed: boolean;
  environment: string;
  schema: string;
  database: string | null;
  counts: { games: string | null; counted: string | null } | null;
  checks: CatalogDatabasePreflightCheck[];
}>;
export declare function runCatalogPreflight(
  env?: NodeJS.ProcessEnv,
): ReturnType<typeof inspectCatalogPreflight>;
