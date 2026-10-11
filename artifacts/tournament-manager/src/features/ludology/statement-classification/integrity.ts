import type { ResearchProjectData } from "./model";

export type ResearchIntegrityIssue = {
  code:
    | "duplicate_id"
    | "orphan_source_person"
    | "orphan_argument_source"
    | "orphan_excerpt_source"
    | "orphan_excerpt_argument"
    | "argument_source_mismatch"
    | "orphan_proposition_codebook"
    | "orphan_coding_excerpt"
    | "orphan_coding_proposition"
    | "orphan_coding_coder"
    | "orphan_coding_codebook"
    | "coding_codebook_mismatch"
    | "duplicate_coding"
    | "invalid_timestamp_range";
  message: string;
  entityId?: string;
};

function duplicateIdIssues(
  label: string,
  entries: readonly { id: string }[],
): ResearchIntegrityIssue[] {
  const seen = new Set<string>();
  const issues: ResearchIntegrityIssue[] = [];
  for (const entry of entries) {
    if (seen.has(entry.id)) {
      issues.push({
        code: "duplicate_id",
        entityId: entry.id,
        message: `Duplikat ID w kolekcji ${label}: ${entry.id}`,
      });
    }
    seen.add(entry.id);
  }
  return issues;
}

export function checkResearchProjectIntegrity(
  data: ResearchProjectData,
): ResearchIntegrityIssue[] {
  const issues: ResearchIntegrityIssue[] = [
    ...duplicateIdIssues("people", data.people),
    ...duplicateIdIssues("sources", data.sources),
    ...duplicateIdIssues("arguments", data.arguments),
    ...duplicateIdIssues("excerpts", data.excerpts),
    ...duplicateIdIssues("codebooks", data.codebooks),
    ...duplicateIdIssues("propositions", data.propositions),
    ...duplicateIdIssues("coders", data.coders),
    ...duplicateIdIssues("codings", data.codings),
  ];

  const people = new Set(data.people.map((item) => item.id));
  const sources = new Map(data.sources.map((item) => [item.id, item] as const));
  const argumentsById = new Map(data.arguments.map((item) => [item.id, item] as const));
  const excerpts = new Map(data.excerpts.map((item) => [item.id, item] as const));
  const codebooks = new Set(data.codebooks.map((item) => item.id));
  const propositions = new Map(data.propositions.map((item) => [item.id, item] as const));
  const coders = new Set(data.coders.map((item) => item.id));

  for (const source of data.sources) {
    if (!people.has(source.personId)) {
      issues.push({
        code: "orphan_source_person",
        entityId: source.id,
        message: `Źródło „${source.title}” wskazuje nieistniejącą osobę.`,
      });
    }
  }

  for (const argument of data.arguments) {
    if (!sources.has(argument.sourceId)) {
      issues.push({
        code: "orphan_argument_source",
        entityId: argument.id,
        message: "Argument wskazuje nieistniejące źródło.",
      });
    }
  }

  for (const excerpt of data.excerpts) {
    if (!sources.has(excerpt.sourceId)) {
      issues.push({
        code: "orphan_excerpt_source",
        entityId: excerpt.id,
        message: "Fragment wskazuje nieistniejące źródło.",
      });
    }
    if (excerpt.argumentId) {
      const argument = argumentsById.get(excerpt.argumentId);
      if (!argument) {
        issues.push({
          code: "orphan_excerpt_argument",
          entityId: excerpt.id,
          message: "Fragment wskazuje nieistniejący argument.",
        });
      } else if (argument.sourceId !== excerpt.sourceId) {
        issues.push({
          code: "argument_source_mismatch",
          entityId: excerpt.id,
          message: "Fragment i przypisany argument należą do różnych źródeł.",
        });
      }
    }
    if (
      excerpt.timestampStart !== undefined &&
      excerpt.timestampEnd !== undefined &&
      excerpt.timestampEnd < excerpt.timestampStart
    ) {
      issues.push({
        code: "invalid_timestamp_range",
        entityId: excerpt.id,
        message: "Koniec fragmentu jest wcześniejszy niż jego początek.",
      });
    }
  }

  for (const proposition of data.propositions) {
    if (!codebooks.has(proposition.codebookId)) {
      issues.push({
        code: "orphan_proposition_codebook",
        entityId: proposition.id,
        message: `Mikrostanowisko ${proposition.code} wskazuje nieistniejący codebook.`,
      });
    }
  }

  const codingKeys = new Set<string>();
  for (const coding of data.codings) {
    if (!excerpts.has(coding.excerptId)) {
      issues.push({
        code: "orphan_coding_excerpt",
        entityId: coding.id,
        message: "Kodowanie wskazuje nieistniejący fragment.",
      });
    }

    const proposition = propositions.get(coding.propositionId);
    if (!proposition) {
      issues.push({
        code: "orphan_coding_proposition",
        entityId: coding.id,
        message: "Kodowanie wskazuje nieistniejące mikrostanowisko.",
      });
    }

    if (!coders.has(coding.coderId)) {
      issues.push({
        code: "orphan_coding_coder",
        entityId: coding.id,
        message: "Kodowanie wskazuje nieistniejącego kodera.",
      });
    }

    if (!codebooks.has(coding.codebookId)) {
      issues.push({
        code: "orphan_coding_codebook",
        entityId: coding.id,
        message: "Kodowanie wskazuje nieistniejący codebook.",
      });
    }

    if (proposition && proposition.codebookId !== coding.codebookId) {
      issues.push({
        code: "coding_codebook_mismatch",
        entityId: coding.id,
        message: "Kodowanie i mikrostanowisko należą do różnych wersji codebooka.",
      });
    }

    const duplicateKey = [
      coding.coderId,
      coding.excerptId,
      coding.propositionId,
      coding.codebookId,
    ].join("::");
    if (codingKeys.has(duplicateKey)) {
      issues.push({
        code: "duplicate_coding",
        entityId: coding.id,
        message: "Ten sam koder ma zduplikowane kodowanie tej samej pary fragment–mikrostanowisko.",
      });
    }
    codingKeys.add(duplicateKey);
  }

  return issues;
}
