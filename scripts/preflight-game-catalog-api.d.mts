export interface CatalogApiProbeConfig {
  readonly baseUrl: string;
  readonly expectedHost: string;
}
export interface CatalogApiProbeCheck {
  name: string;
  passed: boolean;
  reason?: string;
}
export interface CatalogApiStatusCounts {
  all: number;
  unclassified: number;
  review: number;
  ready: number;
}
export declare function loadCatalogApiProbeConfig(
  env?: NodeJS.ProcessEnv,
): CatalogApiProbeConfig;
export declare function inspectCatalogApi(
  config: CatalogApiProbeConfig,
  fetchImpl?: typeof fetch,
): Promise<{
  passed: boolean;
  counts: CatalogApiStatusCounts | null;
  checks: CatalogApiProbeCheck[];
}>;
