import {
  EMPTY_RESEARCH_PROJECT,
  type ResearchProjectData,
} from "./model";
import { migrateResearchProject } from "./schema-migration";

const STORAGE_KEY = "neoludology_research_pipeline_v5";
const LEGACY_STORAGE_KEYS = ["neoludology_research_pipeline_v4", "neoludology_research_pipeline_v3", "neoludology_research_pipeline_v2"];

export function createResearchId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function loadResearchProject(): ResearchProjectData {
  if (typeof window === "undefined") return EMPTY_RESEARCH_PROJECT;
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      LEGACY_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean);

    if (!raw) return EMPTY_RESEARCH_PROJECT;
    return migrateResearchProject(JSON.parse(raw));
  } catch {
    return EMPTY_RESEARCH_PROJECT;
  }
}

export function saveResearchProject(data: ResearchProjectData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
