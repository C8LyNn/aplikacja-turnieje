import { countEvidenceDirections, isAssessmentStale } from "./evidence-analysis";
import type { ResearchProjectData } from "./model";

export type ResearchQueue = {
  unverifiedExcerptIds: string[];
  verifiedUncodedExcerptIds: string[];
  contradictionCandidates: Array<{ personId: string; propositionId: string }>;
  unreviewedPositions: Array<{ personId: string; propositionId: string }>;
  staleAssessmentIds: string[];
};

export function buildResearchQueue(
  data: ResearchProjectData,
  codebookId: string,
): ResearchQueue {
  const propositions = data.propositions.filter((item) => item.codebookId === codebookId);
  const propositionIds = new Set(propositions.map((item) => item.id));
  const currentCodings = data.codings.filter(
    (coding) => coding.codebookId === codebookId && propositionIds.has(coding.propositionId),
  );

  const unverifiedExcerptIds = data.excerpts
    .filter((excerpt) => excerpt.verificationStatus !== "verified")
    .map((excerpt) => excerpt.id);

  const codedExcerptIds = new Set(currentCodings.map((coding) => coding.excerptId));
  const verifiedUncodedExcerptIds = data.excerpts
    .filter((excerpt) => excerpt.verificationStatus === "verified" && !codedExcerptIds.has(excerpt.id))
    .map((excerpt) => excerpt.id);

  const contradictionCandidates: Array<{ personId: string; propositionId: string }> = [];
  const unreviewedPositions: Array<{ personId: string; propositionId: string }> = [];

  for (const person of data.people) {
    const sourceIds = new Set(
      data.sources.filter((source) => source.personId === person.id).map((source) => source.id),
    );
    const excerptIds = new Set(
      data.excerpts.filter((excerpt) => sourceIds.has(excerpt.sourceId)).map((excerpt) => excerpt.id),
    );

    for (const proposition of propositions) {
      const codings = currentCodings.filter(
        (coding) =>
          coding.propositionId === proposition.id &&
          excerptIds.has(coding.excerptId),
      );
      if (codings.length === 0) continue;

      const counts = countEvidenceDirections(codings, data.excerpts);
      if (counts.contradiction) {
        contradictionCandidates.push({
          personId: person.id,
          propositionId: proposition.id,
        });
      }

      const hasAssessment = data.assessments.some(
        (assessment) =>
          assessment.personId === person.id &&
          assessment.propositionId === proposition.id &&
          assessment.codebookId === codebookId,
      );
      if (!hasAssessment) {
        unreviewedPositions.push({
          personId: person.id,
          propositionId: proposition.id,
        });
      }
    }
  }

  const staleAssessmentIds = data.assessments
    .filter(
      (assessment) =>
        assessment.codebookId === codebookId &&
        isAssessmentStale(data, assessment),
    )
    .map((assessment) => assessment.id);

  return {
    unverifiedExcerptIds,
    verifiedUncodedExcerptIds,
    contradictionCandidates,
    unreviewedPositions,
    staleAssessmentIds,
  };
}
