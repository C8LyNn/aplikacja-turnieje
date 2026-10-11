import { useEffect, useState } from "react";
import type {
  CodingRecord,
  ResearchArgument,
  ResearchExcerpt,
  ResearchPerson,
  ResearchProjectData,
  ResearchSource,
} from "./model";
import { PILOT_CODEBOOK, PILOT_PROPOSITIONS } from "./pilot-codebook";
import { createResearchId, loadResearchProject, saveResearchProject } from "./storage";

function withPilotDefaults(data: ResearchProjectData): ResearchProjectData {
  return {
    ...data,
    codebooks: data.codebooks.length ? data.codebooks : [PILOT_CODEBOOK],
    propositions: data.propositions.length ? data.propositions : PILOT_PROPOSITIONS,
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
  };
}
