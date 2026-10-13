import {
  countEvidenceDirections,
  isAssessmentStale,
} from "./evidence-analysis";
import type {
  DirectionScore,
  PositionAssessment,
  Proposition,
  ResearchProjectData,
} from "./model";

export type ComparisonEvidence = {
  units: number;
  codings: number;
  sources: number;
  contradiction: boolean;
};

export type ComparisonCell = {
  personId: string;
  assessment: PositionAssessment | null;
  stale: boolean;
  evidence: ComparisonEvidence;
};

export type ComparisonRelation =
  | "same_direction"
  | "opposed_direction"
  | "different_strength"
  | "mixed_or_neutral"
  | "insufficient";

export type ComparisonRow = {
  proposition: Proposition;
  cells: ComparisonCell[];
  relation: ComparisonRelation;
};

function propositionEvidence(
  data: ResearchProjectData,
  personId: string,
  propositionId: string,
  codebookId: string,
): ComparisonEvidence {
  const personSourceIds = new Set(
    data.sources
      .filter((source) => source.personId === personId)
      .map((source) => source.id),
  );
  const personExcerpts = data.excerpts.filter((excerpt) =>
    personSourceIds.has(excerpt.sourceId),
  );
  const excerptIds = new Set(personExcerpts.map((excerpt) => excerpt.id));
  const codings = data.codings.filter(
    (coding) =>
      coding.codebookId === codebookId &&
      coding.propositionId === propositionId &&
      excerptIds.has(coding.excerptId),
  );
  const sourceIds = new Set(
    codings
      .map((coding) => personExcerpts.find((excerpt) => excerpt.id === coding.excerptId)?.sourceId)
      .filter((sourceId): sourceId is string => Boolean(sourceId)),
  );
  const counts = countEvidenceDirections(codings, data.excerpts);

  return {
    units: counts.units,
    codings: counts.codings,
    sources: sourceIds.size,
    contradiction: counts.contradiction,
  };
}

function freshDirection(cell: ComparisonCell): DirectionScore | null | undefined {
  if (!cell.assessment || cell.stale) return undefined;
  if (cell.assessment.status === "insufficient_evidence") return undefined;
  return cell.assessment.direction;
}

export function compareDirections(cells: readonly ComparisonCell[]): ComparisonRelation {
  if (cells.length < 2) return "insufficient";
  const directions = cells.map(freshDirection);
  if (directions.some((direction) => direction === undefined)) return "insufficient";

  const concrete = directions as Array<DirectionScore | null>;
  if (concrete.some((direction) => direction === null || direction === 0)) {
    return "mixed_or_neutral";
  }

  const signs = concrete.map((direction) => Math.sign(direction as number));
  const strengths = concrete.map((direction) => Math.abs(direction as number));

  if (new Set(signs).size > 1) return "opposed_direction";
  if (new Set(strengths).size > 1) return "different_strength";
  return "same_direction";
}

export function buildComparisonRows(
  data: ResearchProjectData,
  codebookId: string,
  personIds: readonly string[],
): ComparisonRow[] {
  const propositions = data.propositions
    .filter((proposition) => proposition.codebookId === codebookId)
    .sort((a, b) => a.code.localeCompare(b.code));

  return propositions.map((proposition) => {
    const cells = personIds.map((personId) => {
      const assessment =
        data.assessments.find(
          (candidate) =>
            candidate.personId === personId &&
            candidate.propositionId === proposition.id &&
            candidate.codebookId === codebookId,
        ) ?? null;

      return {
        personId,
        assessment,
        stale: assessment ? isAssessmentStale(data, assessment) : false,
        evidence: propositionEvidence(
          data,
          personId,
          proposition.id,
          codebookId,
        ),
      } satisfies ComparisonCell;
    });

    return {
      proposition,
      cells,
      relation: compareDirections(cells),
    };
  });
}

export function comparisonSummary(rows: readonly ComparisonRow[]) {
  return {
    propositions: rows.length,
    comparable: rows.filter((row) => row.relation !== "insufficient").length,
    sameDirection: rows.filter((row) => row.relation === "same_direction").length,
    opposedDirection: rows.filter((row) => row.relation === "opposed_direction").length,
    differentStrength: rows.filter((row) => row.relation === "different_strength").length,
    mixedOrNeutral: rows.filter((row) => row.relation === "mixed_or_neutral").length,
    insufficient: rows.filter((row) => row.relation === "insufficient").length,
  };
}
