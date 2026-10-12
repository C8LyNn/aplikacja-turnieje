import { useEffect, useState } from "react";
import type {
  Coder,
  CodingRecord,
  DimensionModel,
  DimensionPropositionLink,
  DiscussionArgumentLink,
  PositionAssessment,
  ResearchDimension,
  ResearchDiscussion,
  ResearchArgument,
  ResearchExcerpt,
  ResearchPerson,
  ResearchProjectData,
  ResearchSource,
  SamplingPlan,
} from "./model";
import { PILOT_CODEBOOK, PILOT_PROPOSITIONS } from "./pilot-codebook";
import {
  canEditDimensionModelStructure,
  canTransitionDimensionModelStatus,
} from "./dimension-model-lifecycle";
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
        const argumentIds = new Set(current.arguments.filter((argument) => sourceIds.has(argument.sourceId)).map((argument) => argument.id));
        const excerptIds = new Set(current.excerpts.filter((excerpt) => sourceIds.has(excerpt.sourceId)).map((excerpt) => excerpt.id));
        return {
          ...current,
          people: current.people.filter((person) => person.id !== personId),
          sources: current.sources.filter((source) => !sourceIds.has(source.id)),
          arguments: current.arguments.filter((argument) => !sourceIds.has(argument.sourceId)),
          excerpts: current.excerpts.filter((excerpt) => !sourceIds.has(excerpt.sourceId)),
          codings: current.codings.filter((coding) => !excerptIds.has(coding.excerptId)),
          assessments: current.assessments.filter((assessment) => assessment.personId !== personId),
          discussionLinks: current.discussionLinks.filter((link) => !argumentIds.has(link.argumentId)),
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
        const argumentIds = new Set(current.arguments.filter((argument) => argument.sourceId === sourceId).map((argument) => argument.id));
        const excerptIds = new Set(current.excerpts.filter((excerpt) => excerpt.sourceId === sourceId).map((excerpt) => excerpt.id));
        return {
          ...current,
          sources: current.sources.filter((source) => source.id !== sourceId),
          arguments: current.arguments.filter((argument) => argument.sourceId !== sourceId),
          excerpts: current.excerpts.filter((excerpt) => excerpt.sourceId !== sourceId),
          codings: current.codings.filter((coding) => !excerptIds.has(coding.excerptId)),
          discussionLinks: current.discussionLinks.filter((link) => !argumentIds.has(link.argumentId)),
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
        discussionLinks: current.discussionLinks.filter((link) => link.argumentId !== argumentId),
      }));
    },
    addDiscussion(input: Omit<ResearchDiscussion, "id" | "createdAt">) {
      const id = createResearchId("discussion");
      update((current) => ({
        ...current,
        discussions: [
          ...current.discussions,
          { ...input, id, createdAt: new Date().toISOString() },
        ],
      }));
      return id;
    },
    updateDiscussion(discussionId: string, patch: Partial<Omit<ResearchDiscussion, "id" | "createdAt">>) {
      update((current) => ({
        ...current,
        discussions: current.discussions.map((discussion) =>
          discussion.id === discussionId ? { ...discussion, ...patch } : discussion,
        ),
      }));
    },
    deleteDiscussion(discussionId: string) {
      update((current) => ({
        ...current,
        discussions: current.discussions.filter((discussion) => discussion.id !== discussionId),
        discussionLinks: current.discussionLinks.filter((link) => link.discussionId !== discussionId),
      }));
    },
    upsertDiscussionLink(
      key: Pick<DiscussionArgumentLink, "discussionId" | "argumentId">,
      value: Omit<DiscussionArgumentLink, "id" | "discussionId" | "argumentId">,
    ) {
      update((current) => {
        const discussion = current.discussions.find((candidate) => candidate.id === key.discussionId);
        const argument = current.arguments.find((candidate) => candidate.id === key.argumentId);
        if (!discussion || !argument) return current;

        const existing = current.discussionLinks.find((link) =>
          link.discussionId === key.discussionId && link.argumentId === key.argumentId
        );
        const next: DiscussionArgumentLink = {
          id: existing?.id ?? createResearchId("discussion_link"),
          ...key,
          ...value,
        };
        return {
          ...current,
          discussionLinks: existing
            ? current.discussionLinks.map((link) => link.id === existing.id ? next : link)
            : [...current.discussionLinks, next],
        };
      });
    },
    deleteDiscussionLink(discussionLinkId: string) {
      update((current) => ({
        ...current,
        discussionLinks: current.discussionLinks.filter((link) => link.id !== discussionLinkId),
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
        dimensionModels: current.dimensionModels.map((model) => {
          if (model.id !== dimensionModelId) return model;
          if (patch.status && !canTransitionDimensionModelStatus(model.status, patch.status)) return model;
          if (!canEditDimensionModelStructure(model.status) && (patch.name !== undefined || patch.version !== undefined || patch.description !== undefined)) {
            return model;
          }
          return { ...model, ...patch };
        }),
      }));
    },
    deleteDimensionModel(dimensionModelId: string) {
      update((current) => {
        const model = current.dimensionModels.find((candidate) => candidate.id === dimensionModelId);
        if (!model || !canEditDimensionModelStructure(model.status)) return current;
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
      update((current) => {
        const model = current.dimensionModels.find((candidate) => candidate.id === input.dimensionModelId);
        if (!model || !canEditDimensionModelStructure(model.status)) return current;
        return {
          ...current,
          dimensions: [...current.dimensions, { ...input, id }],
        };
      });
      return id;
    },
    updateDimension(dimensionId: string, patch: Partial<Omit<ResearchDimension, "id" | "dimensionModelId">>) {
      update((current) => {
        const dimension = current.dimensions.find((candidate) => candidate.id === dimensionId);
        const model = current.dimensionModels.find((candidate) => candidate.id === dimension?.dimensionModelId);
        if (!dimension || !model || !canEditDimensionModelStructure(model.status)) return current;
        return {
          ...current,
          dimensions: current.dimensions.map((candidate) =>
            candidate.id === dimensionId ? { ...candidate, ...patch } : candidate,
          ),
        };
      });
    },
    deleteDimension(dimensionId: string) {
      update((current) => {
        const dimension = current.dimensions.find((candidate) => candidate.id === dimensionId);
        const model = current.dimensionModels.find((candidate) => candidate.id === dimension?.dimensionModelId);
        if (!dimension || !model || !canEditDimensionModelStructure(model.status)) return current;
        return {
          ...current,
          dimensions: current.dimensions.filter((candidate) => candidate.id !== dimensionId),
          dimensionLinks: current.dimensionLinks.filter((link) => link.dimensionId !== dimensionId),
        };
      });
    },
    upsertDimensionLink(
      key: Pick<DimensionPropositionLink, "dimensionModelId" | "dimensionId" | "propositionId">,
      value: Omit<DimensionPropositionLink, "id" | "dimensionModelId" | "dimensionId" | "propositionId">,
    ) {
      update((current) => {
        const model = current.dimensionModels.find((candidate) => candidate.id === key.dimensionModelId);
        const dimension = current.dimensions.find((candidate) => candidate.id === key.dimensionId);
        const proposition = current.propositions.find((candidate) => candidate.id === key.propositionId);
        if (
          !model ||
          !dimension ||
          !proposition ||
          !canEditDimensionModelStructure(model.status) ||
          dimension.dimensionModelId !== model.id ||
          proposition.codebookId !== model.codebookId
        ) return current;

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
      update((current) => {
        const link = current.dimensionLinks.find((candidate) => candidate.id === dimensionLinkId);
        const model = current.dimensionModels.find((candidate) => candidate.id === link?.dimensionModelId);
        if (!link || !model || !canEditDimensionModelStructure(model.status)) return current;
        return {
          ...current,
          dimensionLinks: current.dimensionLinks.filter((candidate) => candidate.id !== dimensionLinkId),
        };
      });
    },
    addSamplingPlan(input: Omit<SamplingPlan, "id" | "createdAt">) {
      const id = createResearchId("sampling_plan");
      update((current) => ({
        ...current,
        samplingPlans: [
          ...current.samplingPlans,
          { ...input, id, createdAt: new Date().toISOString() },
        ],
      }));
      return id;
    },
    updateSamplingPlan(samplingPlanId: string, patch: Partial<Omit<SamplingPlan, "id" | "createdAt">>) {
      update((current) => ({
        ...current,
        samplingPlans: current.samplingPlans.map((plan) =>
          plan.id === samplingPlanId ? { ...plan, ...patch } : plan,
        ),
      }));
    },
    deleteSamplingPlan(samplingPlanId: string) {
      update((current) => ({
        ...current,
        samplingPlans: current.samplingPlans.filter((plan) => plan.id !== samplingPlanId),
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
