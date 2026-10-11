import type { ResearchProjectData } from "./model";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isArrayField(record: Record<string, unknown>, key: string): boolean {
  return Array.isArray(record[key]);
}

export function serializeResearchProject(data: ResearchProjectData): string {
  return JSON.stringify(data, null, 2);
}

export function parseResearchProject(raw: string): ResearchProjectData {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)) {
    throw new Error("Plik nie zawiera obiektu projektu.");
  }

  if (parsed.schemaVersion !== 2) {
    throw new Error("Nieobsługiwana wersja schematu. Oczekiwano schemaVersion=2.");
  }

  const arrayFields = [
    "people",
    "sources",
    "arguments",
    "excerpts",
    "codebooks",
    "propositions",
    "coders",
    "codings",
  ];

  for (const field of arrayFields) {
    if (!isArrayField(parsed, field)) {
      throw new Error(`Nieprawidłowe pole „${field}”.`);
    }
  }

  return parsed as ResearchProjectData;
}
