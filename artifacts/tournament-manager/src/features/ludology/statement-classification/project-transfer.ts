import type { ResearchProjectData } from "./model";
import { migrateResearchProject } from "./schema-migration";

export function serializeResearchProject(data: ResearchProjectData): string {
  return JSON.stringify(data, null, 2);
}

export function parseResearchProject(raw: string): ResearchProjectData {
  return migrateResearchProject(JSON.parse(raw));
}
