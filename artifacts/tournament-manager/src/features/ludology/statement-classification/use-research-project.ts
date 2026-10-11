import { useEffect, useState } from "react";
import type {
  Coder,
  CodingRecord,
  DimensionModel,
  DimensionPropositionLink,
  PositionAssessment,
  ResearchDimension,
  ResearchArgument,
  ResearchExcerpt,
  ResearchPerson,
  ResearchProjectData,
  ResearchSource,
} from "./model";
import { PILOT_CODEBOOK, PILOT_PROPOSITIONS } from "./pilot-codebook";
import { createResearchId, loadResearchProject, saveResearchProject } from "./storage";

function withPilotDefaults(data: ResearchProjectData): ResearchProjectData {
  const codebooks = data.codebooks.some((codebook) => codebook.id === PILOT_CODEBOOK.id)
    ? data.codebooks.map((codebook) => codebook.id === PILOT_CODEBOOK.id ? PILOT_CODEBOOK : codebook)
    : [...data.codebooks, PILOT_CODEBOOK];

  const pilotById = new Map(PILOT_PROPOSITIONS.map((proposition) => [proposition.id, proposition]));
  const propositions = [
    ...data.propositions.map((proposition) => pilotById.get(proposition.id) ?? proposition),
    ...PILOT_PROPOSITIONS.filter((proposition) => !data.propositions.some((current) => current.id === proposition.id)),
  ];

  return {
    ...data,
    codebooks,
    propositions,
    coders: data.coders.length
      ? data.coders
      : [{ id: "coder-owner", displayName: "Badacz", type: "human" }],
  };
}

export function useResearchProject() {
  const [data, setData] = useState<ResearchProjectData>(() => withPilotDefaults(loadResearchProject()));

  useEffect(() => {
    saveResearchProject(data);
  }, [data]);

  const update = (recipe: (current: ResearchProjectData) => ResearchProjectData) =>
    setData((current) => recipe(current));

  return {
    data,
    replaceProject(next: ResearchProjectData) {
      setData(withPilotDefaults(next));
    },
    addCoder(input: Omit<Coder, "id">) {
      update((current) => ({
        ...current,
        coders: [...current.coders, { ...input, id: createResearchId("coder") }],
      }));
    },
    updateCoder(coderId: string, patch: Partial<Omit<Coder, "id">>) {
      update((current) => ({
        ...current,
        coders: current.coders.map((coder) => coder.id === coderId ? { ...coder, ...patch } : coder),
      }));
    },
    addPerson(input: Omit<ResearchPerson, "id" | "createdAt">) {
      update((current) => ({
        ...current,
        people: [...current.people, { ...input, id: createResearchId("person"), createdAt: new Date().toISOString() }],
      }));
    },
    updatePerson(personId: string, patch: Partial<Omit<ResearchPerson, "id" | "createdAt">>) {
      update((current) => ({
        ...current,
        people: current.people.map((person) =>
          person.id === personId ? { ...person, ...patch } : person,
        ),
      }));
    },
    deletePerson(personId: string) {
      update((current) => {
        const sourceIds = new Set(current.sources.filter((source) => source.personId === personId).map((source) => source.id));
        const excerptIds = new Set(current.excerpts.filter((excerpt) => sourceIds.has(excerpt.sourceId)).map((excerpt) => excerpt.id));
        return {
          ...current,
          people: current.people.filter((person) => person.id !== personId),
          sources: current.sources.filter((source) => !sourceIds.has(source.id)),
          arguments: current.arguments.filter((argument) => !sourceIds.has(argument.sourceId)),
          excerpts: current.excerpts.filter((excerpt) => !sourceIds.has(excerpt.sourceId)),
          codings: current.codings.filter((coding) => !excerptIds.has(coding.excerptId)),
          assessments: current.assessments.filter((assessment) => assessment.personId !== personId),
        };
      });
    },
    addSource(input: Omit<ResearchSource, "id">) {
      update((current) => ({
        ...current,
        sources: [...current.sources, { ...input, id: createResearchId("source") }],
      }));
    },
    updateSource(sourceId: string, patch: Partial<Omit<ResearchSource, "id" | "personId">>) {
      update((current) => ({
        ...current,
        sources: current.sources.map((source) =>
          source.id === sourceId ? { ...source, ...patch } : source,
        ),
      }));
    },
    deleteSource(sourceId: string) {
      update((current) => {
        const excerptIds = new Set(current.excerpts.filter((excerpt) => excerpt.sourceId === sourceId).map((excerpt) => excerpt.id));
        return {
          ...current,
          sources: current.sources.filter((source) => source.id !== sourceId),
          arguments: current.arguments.filter((argument) => argument.sourceId !== sourceId),
          excerpts: current.excerpts.filter((excerpt) => excerpt.sourceId !== sourceId),
          codings: current.codings.filter((coding) => !excerptIds.has(coding.excerptId)),
        };
      });
    },
    addArgument(input: Omit<ResearchArgument, "id">) {
      update((current) => ({
        ...current,
        arguments: [...current.arguments, { ...input, id: createResearchId("argument") }],
      }));
    },
    updateArgument(argumentId: string, patch: Partial<Omit<ResearchArgument, "id" | "sourceId">>) {
      update((current) => ({
        ...current,
        arguments: current.arguments.map((argument) =>
          argument.id === argumentId ? { ...argument, ...patch } : argument,
        ),
      }));
    },
    deleteArgument(argumentId: string) {
      update((current) => ({
        ...current,
        arguments: current.arguments.filter((argument) => argument.id !== argumentId),
        excerpts: current.excerpts.map((excerpt) =>
          excerpt.argumentId === argumentId ? { ...excerpt, argumentId: undefined } : excerpt,
        ),
      }));
    },
    addExcerpt(input: Omit<ResearchExcerpt, "id">) {
      update((current) => ({
        ...current,
        excerpts: [...current.excerpts, { ...input, id: createResearchId("excerpt") }],
      }));
    },
    updateExcerpt(excerptId: string, patch: Partial<Omit<ResearchExcerpt, "id" | "sourceId">>) {
      update((current) => ({
        ...current,
        excerpts: current.excerpts.map((excerpt) =>
          excerpt.id === excerptId ? { ...excerpt, ...patch } : excerpt,
        ),
      }));
    },
    deleteExcerpt(excerptId: string) {
      update((current) => ({
        ...current,
        excerpts: current.excerpts.filter((excerpt) => excerpt.id !== excerptId),
        codings: current.codings.filter((coding) => coding.excerptId !== excerptId),
      }));
    },
    addCoding(input: Omit<CodingRecord, "id" | "createdAt">) {
      update((current) => ({
        ...current,
        codings: [...current.codings, { ...input, id: createResearchId("coding"), createdAt: new Date().toISOString() }],
      }));
    },
    deleteCoding(codingId: string) {
      update((current) => ({
        ...current,
        codings: current.codings.filter((coding) => coding.id !== codingId),
      }));
    },
    addDimensionModel(input: Omit<DimensionModel, "id" | "createdAt">) {
      const id = createResearchId("dimension_model");
      update((current) => ({
        ...current,
        dimensionModels: [
          ...current.dimensionModels,
          { ...input, id, createdAt: new Date().toISOString() },
        ],
      }));
      return id;
    },
    updateDimensionModel(dimensionModelId: string, patch: Partial<Omit<DimensionModel, "id" | "createdAt" | "codebookId">>) {
      update((current) => ({
        ...current,
        dimensionModels: current.dimensionModels.map((model) =>
          model.id === dimensionModelId ? { ...model, ...patch } : model,
        ),
      }));
    },
    deleteDimensionModel(dimensionModelId: string) {
      update((current) => {
        const dimensionIds = new Set(
          current.dimensions
            .filter((dimension) => dimension.dimensionModelId === dimensionModelId)
            .map((dimension) => dimension.id),
        );
        return {
          ...current,
          dimensionModels: current.dimensionModels.filter((model) => model.id !== dimensionModelId),
          dimensions: current.dimensions.filter((dimension) => dimension.dimensionModelId !== dimensionModelId),
          dimensionLinks: current.dimensionLinks.filter(
            (link) => link.dimensionModelId !== dimensionModelId && !dimensionIds.has(link.dimensionId),
          ),
        };
      });
    },
    cloneDimensionModelVersion(dimensionModelId: string, version: string, name?: string) {
      const nextModelId = createResearchId("dimension_model");
      update((current) => {
        const source = current.dimensionModels.find((model) => model.id === dimensionModelId);
        if (!source) return current;

        const sourceDimensions = current.dimensions.filter(
          (dimension) => dimension.dimensionModelId === dimensionModelId,
        );
        const dimensionIdMap = new Map<string, string>();
        const clonedDimensions = sourceDimensions.map((dimension) => {
          const nextDimensionId = createResearchId("dimension");
          dimensionIdMap.set(dimension.id, nextDimensionId);
          return {
            ...dimension,
            id: nextDimensionId,
            dimensionModelId: nextModelId,
          };
        });
        const clonedLinks = current.dimensionLinks
          .filter((link) => link.dimensionModelId === dimensionModelId)
          .map((link) => ({
            ...link,
            id: createResearchId("dimension_link"),
            dimensionModelId: nextModelId,
            dimensionId: dimensionIdMap.get(link.dimensionId) ?? link.dimensionId,
          }));

        return {
          ...current,
          dimensionModels: [
            ...current.dimensionModels,
            {
              ...source,
              id: nextModelId,
              name: name?.trim() || source.name,
              version,
              status: "draft",
              createdAt: new Date().toISOString(),
            },
          ],
          dimensions: [...current.dimensions, ...clonedDimensions],
          dimensionLinks: [...current.dimensionLinks, ...clonedLinks],
        };
      });
      return nextModelId;
    },
    addDimension(input: Omit<ResearchDimension, "id">) {
      const id = createResearchId("dimension");
      update((current) => ({
        ...current,
        dimensions: [...current.dimensions, { ...input, id }],
      }));
      return id;
    },
    updateDimension(dimensionId: string, patch: Partial<Omit<ResearchDimension, "id" | "dimensionModelId">>) {
      update((current) => ({
        ...current,
        dimensions: current.dimensions.map((dimension) =>
          dimension.id === dimensionId ? { ...dimension, ...patch } : dimension,
        ),
      }));
    },
    deleteDimension(dimensionId: string) {
      update((current) => ({
        ...current,
        dimensions: current.dimensions.filter((dimension) => dimension.id !== dimensionId),
        dimensionLinks: current.dimensionLinks.filter((link) => link.dimensionId !== dimensionId),
      }));
    },
    upsertDimensionLink(
      key: Pick<DimensionPropositionLink, "dimensionModelId" | "dimensionId" | "propositionId">,
      value: Omit<DimensionPropositionLink, "id" | "dimensionModelId" | "dimensionId" | "propositionId">,
    ) {
      update((current) => {
        const existing = current.dimensionLinks.find((link) =>
          link.dimensionModelId === key.dimensionModelId &&
          link.dimensionId === key.dimensionId &&
          link.propositionId === key.propositionId
        );
        const next: DimensionPropositionLink = {
          id: existing?.id ?? createResearchId("dimension_link"),
          ...key,
          ...value,
        };
        return {
          ...current,
          dimensionLinks: existing
            ? current.dimensionLinks.map((link) => link.id === existing.id ? next : link)
            : [...current.dimensionLinks, next],
        };
      });
    },
    deleteDimensionLink(dimensionLinkId: string) {
      update((current) => ({
        ...current,
        dimensionLinks: current.dimensionLinks.filter((link) => link.id !== dimensionLinkId),
      }));
    },
    upsertAssessment(
      key: Pick<PositionAssessment, "personId" | "propositionId" | "codebookId">,
      value: Omit<PositionAssessment, "id" | "personId" | "propositionId" | "codebookId" | "updatedAt">,
    ) {
      update((current) => {
        const existing = current.assessments.find((assessment) =>
          assessment.personId === key.personId &&
          assessment.propositionId === key.propositionId &&
          assessment.codebookId === key.codebookId
        );
        const next: PositionAssessment = {
          id: existing?.id ?? createResearchId("assessment"),
          ...key,
          ...value,
          updatedAt: new Date().toISOString(),
        };
        return {
          ...current,
          assessments: existing
            ? current.assessments.map((assessment) => assessment.id === existing.id ? next : assessment)
            : [...current.assessments, next],
        };
      });
    },
  };
}
