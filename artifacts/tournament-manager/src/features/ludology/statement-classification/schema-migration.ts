import type { ResearchProjectData } from "./model";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireArray(record: Record<string, unknown>, key: string): unknown[] {
  const value = record[key];
  if (!Array.isArray(value)) {
    throw new Error(`Nieprawidłowe pole „${key}”.`);
  }
  return value;
}

export function migrateResearchProject(value: unknown): ResearchProjectData {
  if (!isRecord(value)) {
    throw new Error("Plik nie zawiera obiektu projektu.");
  }

  if (
    value.schemaVersion !== 2 &&
    value.schemaVersion !== 3 &&
    value.schemaVersion !== 4 &&
    value.schemaVersion !== 5 &&
    value.schemaVersion !== 6
  ) {
    throw new Error("Nieobsługiwana wersja schematu. Obsługiwane są schemaVersion=2, schemaVersion=3, schemaVersion=4, schemaVersion=5 i schemaVersion=6.");
  }

  const people = requireArray(value, "people");
  const sources = requireArray(value, "sources");
  const argumentsList = requireArray(value, "arguments");
  const excerpts = requireArray(value, "excerpts");
  const codebooks = requireArray(value, "codebooks");
  const propositions = requireArray(value, "propositions");
  const coders = requireArray(value, "coders");
  const codings = requireArray(value, "codings");
  const assessments =
    value.schemaVersion === 3 || value.schemaVersion === 4 || value.schemaVersion === 5 || value.schemaVersion === 6
      ? requireArray(value, "assessments").map((assessment) => {
          if (!isRecord(assessment)) return assessment;
          return {
            ...assessment,
            direction: assessment.direction === undefined ? null : assessment.direction,
          };
        })
      : [];

  const dimensionModels =
    value.schemaVersion === 4 || value.schemaVersion === 5 || value.schemaVersion === 6 ? requireArray(value, "dimensionModels") : [];
  const dimensions =
    value.schemaVersion === 4 || value.schemaVersion === 5 || value.schemaVersion === 6 ? requireArray(value, "dimensions") : [];
  const dimensionLinks =
    value.schemaVersion === 4 || value.schemaVersion === 5 || value.schemaVersion === 6 ? requireArray(value, "dimensionLinks") : [];
  const samplingPlans =
    value.schemaVersion === 5 || value.schemaVersion === 6 ? requireArray(value, "samplingPlans") : [];
  const discussions =
    value.schemaVersion === 6 ? requireArray(value, "discussions") : [];
  const discussionLinks =
    value.schemaVersion === 6 ? requireArray(value, "discussionLinks") : [];

  return {
    schemaVersion: 6,
    people: people as ResearchProjectData["people"],
    sources: sources as ResearchProjectData["sources"],
    arguments: argumentsList as ResearchProjectData["arguments"],
    excerpts: excerpts as ResearchProjectData["excerpts"],
    codebooks: codebooks as ResearchProjectData["codebooks"],
    propositions: propositions as ResearchProjectData["propositions"],
    coders: coders as ResearchProjectData["coders"],
    codings: codings as ResearchProjectData["codings"],
    assessments: assessments as ResearchProjectData["assessments"],
    dimensionModels: dimensionModels as ResearchProjectData["dimensionModels"],
    dimensions: dimensions as ResearchProjectData["dimensions"],
    dimensionLinks: dimensionLinks as ResearchProjectData["dimensionLinks"],
    samplingPlans: samplingPlans as ResearchProjectData["samplingPlans"],
    discussions: discussions as ResearchProjectData["discussions"],
    discussionLinks: discussionLinks as ResearchProjectData["discussionLinks"],
  };
}
