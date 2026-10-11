import {
  countEvidenceDirections,
  evidenceUnitKey,
  isAssessmentStale,
} from "./evidence-analysis";
import {
  evaluateSamplingPlan,
  personSamplingProfile,
  type SamplingGap,
} from "./sampling-analysis";
import type {
  ResearchProjectData,
  SamplingPlan,
} from "./model";

export type CorpusHealthFlagSeverity = "blocker" | "warning" | "info";

export type CorpusHealthFlag = {
  code:
    | "no_sources"
    | "no_verified_excerpts"
    | "low_verification"
    | "low_argument_assignment"
    | "low_codebook_coverage"
    | "stale_assessments"
    | "contradictions"
    | "metadata_gaps"
    | "sampling_gap";
  severity: CorpusHealthFlagSeverity;
  message: string;
};

export type PersonCorpusHealth = {
  personId: string;
  sourceCount: number;
  argumentCount: number;
  excerptCount: number;
  verifiedExcerptCount: number;
  verificationShare: number | null;
  argumentAssignedExcerptCount: number;
  argumentAssignmentShare: number | null;
  independentEvidenceUnitCount: number;
  codingCount: number;
  propositionCoverageCount: number;
  propositionCount: number;
  propositionCoverageShare: number | null;
  assessmentCount: number;
  staleAssessmentCount: number;
  contradictionCount: number;
  metadataCompleteness: number | null;
  samplingGaps: SamplingGap[];
  flags: CorpusHealthFlag[];
};

function sourceMetadataCompleteness(
  data: ResearchProjectData,
  personId: string,
): number | null {
  const sources = data.sources.filter((source) => source.personId === personId);
  if (sources.length === 0) return null;

  const filled = sources.reduce(
    (sum, source) =>
      sum +
      Number(Boolean(source.publishedAt)) +
      Number(Boolean(source.purpose)) +
      Number(Boolean(source.preparedness)) +
      Number(Boolean(source.scope)) +
      Number(Boolean(source.language)),
    0,
  );
  return filled / (sources.length * 5);
}

export function buildPersonCorpusHealth(
  data: ResearchProjectData,
  personId: string,
  codebookId: string,
  samplingPlan?: SamplingPlan | null,
): PersonCorpusHealth {
  const propositions = data.propositions.filter(
    (proposition) => proposition.codebookId === codebookId,
  );
  const propositionIds = new Set(propositions.map((proposition) => proposition.id));
  const sourceIds = new Set(
    data.sources
      .filter((source) => source.personId === personId)
      .map((source) => source.id),
  );
  const excerpts = data.excerpts.filter((excerpt) => sourceIds.has(excerpt.sourceId));
  const excerptIds = new Set(excerpts.map((excerpt) => excerpt.id));
  const codings = data.codings.filter(
    (coding) =>
      coding.codebookId === codebookId &&
      propositionIds.has(coding.propositionId) &&
      excerptIds.has(coding.excerptId),
  );
  const assessments = data.assessments.filter(
    (assessment) =>
      assessment.personId === personId &&
      assessment.codebookId === codebookId &&
      propositionIds.has(assessment.propositionId),
  );
  const argumentCount = data.arguments.filter((argument) =>
    sourceIds.has(argument.sourceId),
  ).length;
  const verifiedExcerptCount = excerpts.filter(
    (excerpt) => excerpt.verificationStatus === "verified",
  ).length;
  const argumentAssignedExcerptCount = excerpts.filter(
    (excerpt) => Boolean(excerpt.argumentId),
  ).length;
  const independentEvidenceUnitCount = new Set(
    codings.map((coding) => evidenceUnitKey(coding, excerpts)),
  ).size;
  const propositionCoverageCount = new Set(
    codings.map((coding) => coding.propositionId),
  ).size;
  const staleAssessmentCount = assessments.filter((assessment) =>
    isAssessmentStale(data, assessment),
  ).length;

  let contradictionCount = 0;
  for (const proposition of propositions) {
    const propositionCodings = codings.filter(
      (coding) => coding.propositionId === proposition.id,
    );
    if (propositionCodings.length === 0) continue;
    if (countEvidenceDirections(propositionCodings, excerpts).contradiction) {
      contradictionCount += 1;
    }
  }

  const verificationShare =
    excerpts.length > 0 ? verifiedExcerptCount / excerpts.length : null;
  const argumentAssignmentShare =
    excerpts.length > 0 ? argumentAssignedExcerptCount / excerpts.length : null;
  const propositionCoverageShare =
    propositions.length > 0 ? propositionCoverageCount / propositions.length : null;
  const metadataCompleteness = sourceMetadataCompleteness(data, personId);
  const samplingGaps = samplingPlan
    ? evaluateSamplingPlan(data, samplingPlan, personId).gaps
    : [];

  const flags: CorpusHealthFlag[] = [];
  if (sourceIds.size === 0) {
    flags.push({
      code: "no_sources",
      severity: "blocker",
      message: "Brak materiałów źródłowych dla tej osoby.",
    });
  }
  if (excerpts.length > 0 && verifiedExcerptCount === 0) {
    flags.push({
      code: "no_verified_excerpts",
      severity: "blocker",
      message: "Żaden fragment nie został jeszcze zweryfikowany.",
    });
  } else if (verificationShare !== null && verificationShare < 0.5) {
    flags.push({
      code: "low_verification",
      severity: "warning",
      message: "Mniej niż połowa fragmentów ma status zweryfikowany.",
    });
  }
  if (argumentAssignmentShare !== null && argumentAssignmentShare < 0.5) {
    flags.push({
      code: "low_argument_assignment",
      severity: "warning",
      message: "Większość fragmentów nie jest przypisana do jednostki argumentacyjnej.",
    });
  }
  if (propositionCoverageShare !== null && propositionCoverageShare < 0.5) {
    flags.push({
      code: "low_codebook_coverage",
      severity: "warning",
      message: "Dowody pokrywają mniej niż połowę mikrostanowisk bieżącego codebooka.",
    });
  }
  if (staleAssessmentCount > 0) {
    flags.push({
      code: "stale_assessments",
      severity: "blocker",
      message: `${staleAssessmentCount} rekonstrukcji jest nieaktualnych względem bieżących dowodów.`,
    });
  }
  if (contradictionCount > 0) {
    flags.push({
      code: "contradictions",
      severity: "info",
      message: `${contradictionCount} mikrostanowisk ma dowody w przeciwnych kierunkach i wymaga interpretacji.`,
    });
  }
  if (metadataCompleteness !== null && metadataCompleteness < 0.6) {
    flags.push({
      code: "metadata_gaps",
      severity: "warning",
      message: "Metadane źródeł są uzupełnione w mniej niż 60%.",
    });
  }
  if (samplingGaps.length > 0) {
    flags.push({
      code: "sampling_gap",
      severity: "warning",
      message: `Plan próbkowania ma ${samplingGaps.length} niespełnionych celów dla tej osoby.`,
    });
  }

  return {
    personId,
    sourceCount: sourceIds.size,
    argumentCount,
    excerptCount: excerpts.length,
    verifiedExcerptCount,
    verificationShare,
    argumentAssignedExcerptCount,
    argumentAssignmentShare,
    independentEvidenceUnitCount,
    codingCount: codings.length,
    propositionCoverageCount,
    propositionCount: propositions.length,
    propositionCoverageShare,
    assessmentCount: assessments.length,
    staleAssessmentCount,
    contradictionCount,
    metadataCompleteness,
    samplingGaps,
    flags,
  };
}

export function buildCorpusHealthMatrix(
  data: ResearchProjectData,
  codebookId: string,
  samplingPlan?: SamplingPlan | null,
): PersonCorpusHealth[] {
  return data.people.map((person) =>
    buildPersonCorpusHealth(data, person.id, codebookId, samplingPlan),
  );
}

export function activeSamplingPlan(data: ResearchProjectData): SamplingPlan | null {
  return (
    data.samplingPlans.find((plan) => plan.status === "active") ??
    data.samplingPlans.find((plan) => plan.status === "draft") ??
    null
  );
}

export function corpusHealthTotals(rows: PersonCorpusHealth[]) {
  return {
    people: rows.length,
    blockerFlags: rows.reduce(
      (sum, row) => sum + row.flags.filter((flag) => flag.severity === "blocker").length,
      0,
    ),
    warningFlags: rows.reduce(
      (sum, row) => sum + row.flags.filter((flag) => flag.severity === "warning").length,
      0,
    ),
    infoFlags: rows.reduce(
      (sum, row) => sum + row.flags.filter((flag) => flag.severity === "info").length,
      0,
    ),
    staleAssessments: rows.reduce((sum, row) => sum + row.staleAssessmentCount, 0),
    contradictions: rows.reduce((sum, row) => sum + row.contradictionCount, 0),
    samplingGaps: rows.reduce((sum, row) => sum + row.samplingGaps.length, 0),
  };
}
