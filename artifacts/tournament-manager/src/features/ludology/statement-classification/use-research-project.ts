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
    addSource(input: Omit<ResearchSource, "id">) {
      update((current) => ({
        ...current,
        sources: [...current.sources, { ...input, id: createResearchId("source") }],
      }));
    },
    addArgument(input: Omit<ResearchArgument, "id">) {
      update((current) => ({
        ...current,
        arguments: [...current.arguments, { ...input, id: createResearchId("argument") }],
      }));
    },
    addExcerpt(input: Omit<ResearchExcerpt, "id">) {
      update((current) => ({
        ...current,
        excerpts: [...current.excerpts, { ...input, id: createResearchId("excerpt") }],
      }));
    },
    addCoding(input: Omit<CodingRecord, "id" | "createdAt">) {
      update((current) => ({
        ...current,
        codings: [...current.codings, { ...input, id: createResearchId("coding"), createdAt: new Date().toISOString() }],
      }));
    },
  };
}
