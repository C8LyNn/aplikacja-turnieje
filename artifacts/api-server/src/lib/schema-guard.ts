import {
  describeSchemaGaps,
  inspectSchemaRequirements,
  type SchemaRequirementsReport,
} from "@workspace/db/schema-requirements";

export class SchemaIncompatibleError extends Error {
  constructor(readonly report: SchemaRequirementsReport) {
    super(
      `Database schema "${report.schema}" is not compatible with this API build: ${describeSchemaGaps(report)}. ` +
        "Apply the pending migrations first (pnpm --filter @workspace/db migrate:v5:preflight, then migrate:v5); see INTEGRATION.md.",
    );
    this.name = "SchemaIncompatibleError";
  }
}

type Queryable = Parameters<typeof inspectSchemaRequirements>[0];

/**
 * V5.1: the API must not start on a schema that lacks columns or tables it reads,
 * otherwise requests would fail one by one at runtime (or worse, half-way through a
 * multi-step write). Read-only; never migrates anything itself.
 */
export async function assertSchemaCompatible(client: Queryable): Promise<SchemaRequirementsReport> {
  const report = await inspectSchemaRequirements(client);
  if (!report.compatible) throw new SchemaIncompatibleError(report);
  return report;
}
