export interface SchemaRequirementObject {
  readonly table: string;
  readonly columns?: readonly string[];
  readonly constraints?: readonly string[];
  readonly indexes?: readonly string[];
}
export interface SchemaRequirement {
  readonly migration: string;
  readonly key: string;
  readonly feature: string;
  readonly objects: readonly SchemaRequirementObject[];
}
export interface SchemaMigrationStatus {
  migration: string;
  key: string;
  feature: string;
  status: "applied" | "absent" | "partial";
  missing: string[];
}
export interface SchemaRequirementsReport {
  schema: string;
  compatible: boolean;
  missingPrerequisites: string[];
  migrations: SchemaMigrationStatus[];
}
export declare const SCHEMA_REQUIREMENTS: readonly SchemaRequirement[];
export declare const BASELINE_PREREQUISITES: readonly string[];
export declare function inspectSchemaRequirements(
  client: { query: (sql: string, values?: unknown[]) => Promise<{ rows: any[] }> },
  schema?: string | null,
): Promise<SchemaRequirementsReport>;
export declare function describeSchemaGaps(report: SchemaRequirementsReport): string;
