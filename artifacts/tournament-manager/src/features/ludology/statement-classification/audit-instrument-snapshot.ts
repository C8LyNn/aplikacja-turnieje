import type { ResearchProjectData } from "./model";

/**
 * Canonical, exact instrument-definition snapshots, NOT cryptographic signatures.
 * Includes all codebook and proposition fields so changing wording or a threshold
 * without changing a version cannot silently pass the historical audit gate.
 */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export type AuditInstrumentSnapshots = {
  codebook: string;
  samplingPlan: string | null;
};

/** Pure snapshot; does not mutate or reorder the stored project. */
export function snapshotAuditInstruments(
  data: ResearchProjectData,
  codebookId: string,
  samplingPlanId: string | null,
): AuditInstrumentSnapshots {
  const book = data.codebooks.find((item) => item.id === codebookId);
  if (!book) throw new Error("Nie istnieje wskazany codebook.");
  const propositions = data.propositions
    .filter((item) => item.codebookId === codebookId)
    .map((item) => ({ id: item.id, encoded: canonical(item) }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : a.encoded < b.encoded ? -1 : a.encoded > b.encoded ? 1 : 0))
    .map((item) => item.encoded);
  const plan = samplingPlanId
    ? data.samplingPlans.find((item) => item.id === samplingPlanId)
    : null;
  if (samplingPlanId && !plan) throw new Error("Nie istnieje wskazany plan próbkowania.");

  return {
    codebook: canonical({ book, propositions }),
    samplingPlan: plan ? canonical(plan) : null,
  };
}
