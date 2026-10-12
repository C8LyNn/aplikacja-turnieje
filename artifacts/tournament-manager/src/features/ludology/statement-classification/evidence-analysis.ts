import type {
  CodingRecord,
  PositionAssessment,
  ResearchExcerpt,
  ResearchProjectData,
  ResearchSource,
} from "./model";

export type EvidenceDirectionCounts = {
  positive: number;
  negative: number;
  mixed: number;
  na: number;
  units: number;
  codings: number;
  contradiction: boolean;
};

export function evidenceUnitKey(
  coding: CodingRecord,
  excerpts: readonly ResearchExcerpt[],
): string {
  const excerpt = excerpts.find((item) => item.id === coding.excerptId);
  return excerpt?.argumentId
    ? `argument:${excerpt.argumentId}`
    : `excerpt:${coding.excerptId}`;
}

export function countEvidenceDirections(
  codings: readonly CodingRecord[],
  excerpts: readonly ResearchExcerpt[],
): EvidenceDirectionCounts {
  const countUnits = (predicate: (coding: CodingRecord) => boolean) =>
    new Set(codings.filter(predicate).map((coding) => evidenceUnitKey(coding, excerpts))).size;

  const positive = countUnits((coding) => coding.direction !== null && coding.direction > 0);
  const negative = countUnits((coding) => coding.direction !== null && coding.direction < 0);
  const mixed = countUnits((coding) => coding.direction === 0);
  const na = countUnits((coding) => coding.direction === null);
  const units = new Set(codings.map((coding) => evidenceUnitKey(coding, excerpts))).size;

  return {
    positive,
    negative,
    mixed,
    na,
    units,
    codings: codings.length,
    contradiction: positive > 0 && negative > 0,
  };
}

export type EvidenceYearBucket = EvidenceDirectionCounts & {
  year: string;
};

export function groupEvidenceByYear(
  codings: readonly CodingRecord[],
  excerpts: readonly ResearchExcerpt[],
  sources: readonly ResearchSource[],
): { years: EvidenceYearBucket[]; undatedCodings: number } {
  const buckets = new Map<string, CodingRecord[]>();
  let undatedCodings = 0;

  for (const coding of codings) {
    const excerpt = excerpts.find((item) => item.id === coding.excerptId);
    const source = sources.find((item) => item.id === excerpt?.sourceId);
    const year = source?.publishedAt?.slice(0, 4);
    if (!year) {
      undatedCodings += 1;
      continue;
    }
    buckets.set(year, [...(buckets.get(year) ?? []), coding]);
  }

  return {
    years: [...buckets.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([year, yearCodings]) => ({
        year,
        ...countEvidenceDirections(yearCodings, excerpts),
      })),
    undatedCodings,
  };
}

export function personEvidence(
  data: ResearchProjectData,
  personId: string,
  codebookId: string,
) {
  const sources = data.sources.filter((source) => source.personId === personId);
  const sourceIds = new Set(sources.map((source) => source.id));
  const excerpts = data.excerpts.filter((excerpt) => sourceIds.has(excerpt.sourceId));
  const excerptIds = new Set(excerpts.map((excerpt) => excerpt.id));
  const codings = data.codings.filter(
    (coding) => excerptIds.has(coding.excerptId) && coding.codebookId === codebookId,
  );
  const argumentsCount = data.arguments.filter((argument) => sourceIds.has(argument.sourceId)).length;

  return {
    sources,
    excerpts,
    codings,
    argumentsCount,
  };
}


export function evidenceSignature(codings: readonly CodingRecord[]): string {
  return [...codings]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((coding) => [
      coding.id,
      coding.direction === null ? "na" : coding.direction,
      coding.explicitness,
      coding.evidenceLevel,
      coding.confidence,
    ].join(":"))
    .join("|");
}


export function assessmentEvidenceCodings(
  data: ResearchProjectData,
  assessment: PositionAssessment,
): CodingRecord[] {
  const personSourceIds = new Set(
    data.sources
      .filter((source) => source.personId === assessment.personId)
      .map((source) => source.id),
  );
  const personExcerptIds = new Set(
    data.excerpts
      .filter((excerpt) => personSourceIds.has(excerpt.sourceId))
      .map((excerpt) => excerpt.id),
  );
  return data.codings.filter((coding) =>
    personExcerptIds.has(coding.excerptId) &&
    coding.propositionId === assessment.propositionId &&
    coding.codebookId === assessment.codebookId
  );
}

export function isAssessmentStale(
  data: ResearchProjectData,
  assessment: PositionAssessment,
): boolean {
  return assessment.evidenceSignature !== evidenceSignature(
    assessmentEvidenceCodings(data, assessment),
  );
}
