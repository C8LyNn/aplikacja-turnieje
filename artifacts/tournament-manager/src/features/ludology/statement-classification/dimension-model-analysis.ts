import { isAssessmentStale } from "./evidence-analysis";
import type {
  DimensionPropositionLink,
  PositionAssessment,
  ResearchDimension,
  ResearchProjectData,
} from "./model";

export type DimensionCoverageCell = {
  dimensionId: string;
  totalLinks: number;
  reviewedLinks: number;
  directionalLinks: number;
  staleLinks: number;
  insufficientLinks: number;
};

export type PersonDimensionReadiness = {
  personId: string;
  dimensions: DimensionCoverageCell[];
  totalLinks: number;
  reviewedLinks: number;
  directionalLinks: number;
};

export function orientedAssessmentDirection(
  assessment: Pick<PositionAssessment, "direction">,
  link: Pick<DimensionPropositionLink, "orientation">,
): -2 | -1 | 0 | 1 | 2 | null {
  if (assessment.direction === null) return null;
  return link.orientation === "positive"
    ? assessment.direction
    : (-assessment.direction as -2 | -1 | 0 | 1 | 2);
}

export function dimensionModelDimensions(
  data: ResearchProjectData,
  dimensionModelId: string,
): ResearchDimension[] {
  return data.dimensions
    .filter((dimension) => dimension.dimensionModelId === dimensionModelId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.code.localeCompare(b.code));
}

export function dimensionModelLinks(
  data: ResearchProjectData,
  dimensionModelId: string,
): DimensionPropositionLink[] {
  return data.dimensionLinks.filter((link) => link.dimensionModelId === dimensionModelId);
}

export function personDimensionReadiness(
  data: ResearchProjectData,
  dimensionModelId: string,
  personId: string,
): PersonDimensionReadiness {
  const dimensions = dimensionModelDimensions(data, dimensionModelId);
  const links = dimensionModelLinks(data, dimensionModelId);
  const assessments = data.assessments.filter(
    (assessment) => assessment.personId === personId,
  );

  const cells = dimensions.map((dimension) => {
    const dimensionLinks = links.filter((link) => link.dimensionId === dimension.id);
    let reviewedLinks = 0;
    let directionalLinks = 0;
    let staleLinks = 0;
    let insufficientLinks = 0;

    for (const link of dimensionLinks) {
      const assessment = assessments.find(
        (candidate) =>
          candidate.propositionId === link.propositionId &&
          candidate.codebookId ===
            data.dimensionModels.find((model) => model.id === dimensionModelId)?.codebookId,
      );

      if (!assessment) continue;
      if (isAssessmentStale(data, assessment)) {
        staleLinks += 1;
        continue;
      }

      reviewedLinks += 1;
      if (assessment.status === "insufficient_evidence") {
        insufficientLinks += 1;
        continue;
      }
      if (assessment.direction !== null) directionalLinks += 1;
    }

    return {
      dimensionId: dimension.id,
      totalLinks: dimensionLinks.length,
      reviewedLinks,
      directionalLinks,
      staleLinks,
      insufficientLinks,
    };
  });

  return {
    personId,
    dimensions: cells,
    totalLinks: cells.reduce((sum, cell) => sum + cell.totalLinks, 0),
    reviewedLinks: cells.reduce((sum, cell) => sum + cell.reviewedLinks, 0),
    directionalLinks: cells.reduce((sum, cell) => sum + cell.directionalLinks, 0),
  };
}

export function modelReadinessMatrix(
  data: ResearchProjectData,
  dimensionModelId: string,
): PersonDimensionReadiness[] {
  return data.people.map((person) =>
    personDimensionReadiness(data, dimensionModelId, person.id),
  );
}


export type DimensionModelSummary = {
  modelId: string;
  dimensions: number;
  links: number;
  mappedPropositions: number;
  peopleWithDirectionalCoverage: number;
  directionalCoverage: number | null;
};

export function dimensionModelSummary(
  data: ResearchProjectData,
  dimensionModelId: string,
): DimensionModelSummary {
  const dimensions = dimensionModelDimensions(data, dimensionModelId);
  const links = dimensionModelLinks(data, dimensionModelId);
  const readiness = modelReadinessMatrix(data, dimensionModelId);
  const totalLinks = readiness.reduce((sum, row) => sum + row.totalLinks, 0);
  const directionalLinks = readiness.reduce((sum, row) => sum + row.directionalLinks, 0);

  return {
    modelId: dimensionModelId,
    dimensions: dimensions.length,
    links: links.length,
    mappedPropositions: new Set(links.map((link) => link.propositionId)).size,
    peopleWithDirectionalCoverage: readiness.filter((row) => row.directionalLinks > 0).length,
    directionalCoverage: totalLinks > 0 ? directionalLinks / totalLinks : null,
  };
}
