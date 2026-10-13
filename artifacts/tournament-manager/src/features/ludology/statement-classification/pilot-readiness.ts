import type { ResearchProjectData } from "./model";

/** Descriptive workload diagnostic for the R1 pilot; NOT research quality approval. */
export function pilotReadiness(data: ResearchProjectData, codebookId: string) {
  const propositions = data.propositions.filter(p => p.codebookId === codebookId);
  const sourceIds = new Set(data.sources.map(s => s.id));
  const verified = data.excerpts.filter(e => sourceIds.has(e.sourceId) && e.verificationStatus === "verified");
  const coderIds = new Set(data.coders.filter(c => c.type === "human").map(c => c.id));
  const units = new Map<string, Set<string>>();
  for (const record of data.codings) {
    if (record.codebookId !== codebookId || !coderIds.has(record.coderId) ||
        !verified.some(e => e.id === record.excerptId) ||
        !propositions.some(p => p.id === record.propositionId)) continue;
    const key = JSON.stringify([record.excerptId, record.propositionId]);
    const coders = units.get(key) ?? new Set<string>();
    coders.add(record.coderId);
    units.set(key, coders);
  }
  const pairedUnits = [...units.values()].filter(coders => coders.size >= 2).length;
  return {
    targets: { people: 4, sources: 12, verifiedExcerpts: 24, pairedUnits: 120 },
    observed: {
      people: data.people.length,
      sources: data.sources.length,
      verifiedExcerpts: verified.length,
      pairedUnits,
    },
    warnings: [
      ...(propositions.length !== 5 ? ["Pilot R1 requires five propositions."] : []),
      ...(coderIds.size < 3 ? ["Pilot requires human coders A/B and independent reviewer C."] : []),
      ...(pairedUnits < verified.length * propositions.length ? ["Some verified excerpt/proposition units lack two distinct human coders."] : []),
    ],
  };
}
