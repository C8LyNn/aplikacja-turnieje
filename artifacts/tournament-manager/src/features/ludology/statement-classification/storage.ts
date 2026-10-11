import {
  EMPTY_RESEARCH_PROJECT,
  type ResearchProjectData,
} from "./model";

const STORAGE_KEY = "neoludology_research_pipeline_v2";

export function createResearchId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function loadResearchProject(): ResearchProjectData {
  if (typeof window === "undefined") return EMPTY_RESEARCH_PROJECT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_RESEARCH_PROJECT;
    const parsed = JSON.parse(raw) as Partial<ResearchProjectData>;
    return {
      schemaVersion: 2,
      people: Array.isArray(parsed.people) ? parsed.people : [],
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      arguments: Array.isArray(parsed.arguments) ? parsed.arguments : [],
      excerpts: Array.isArray(parsed.excerpts) ? parsed.excerpts : [],
      codebooks: Array.isArray(parsed.codebooks) ? parsed.codebooks : [],
      propositions: Array.isArray(parsed.propositions) ? parsed.propositions : [],
      coders: Array.isArray(parsed.coders) ? parsed.coders : [],
      codings: Array.isArray(parsed.codings) ? parsed.codings : [],
    };
  } catch {
    return EMPTY_RESEARCH_PROJECT;
  }
}

export function saveResearchProject(data: ResearchProjectData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
