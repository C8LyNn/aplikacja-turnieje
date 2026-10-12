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
    | "invalid_timestamp_range"
    | "orphan_assessment_person"
    | "orphan_assessment_proposition"
    | "orphan_assessment_codebook"
    | "orphan_assessment_reviewer"
    | "assessment_codebook_mismatch"
    | "duplicate_assessment"
    | "orphan_dimension_model_codebook"
    | "orphan_dimension_model"
    | "orphan_dimension_link_model"
    | "orphan_dimension_link_dimension"
    | "orphan_dimension_link_proposition"
    | "dimension_link_model_mismatch"
    | "dimension_link_codebook_mismatch"
    | "duplicate_dimension_link"
    | "invalid_sampling_plan"
    | "orphan_discussion_link_discussion"
    | "orphan_discussion_link_argument"
    | "duplicate_discussion_link"
    | "orphan_argument_relation_discussion"
    | "orphan_argument_relation_from"
    | "orphan_argument_relation_to"
    | "argument_relation_self"
    | "argument_relation_endpoint_not_linked"
    | "duplicate_argument_relation";
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
    ...duplicateIdIssues("assessments", data.assessments),
    ...duplicateIdIssues("dimensionModels", data.dimensionModels),
    ...duplicateIdIssues("dimensions", data.dimensions),
    ...duplicateIdIssues("dimensionLinks", data.dimensionLinks),
    ...duplicateIdIssues("samplingPlans", data.samplingPlans),
    ...duplicateIdIssues("discussions", data.discussions),
    ...duplicateIdIssues("discussionLinks", data.discussionLinks),
    ...duplicateIdIssues("argumentRelations", data.argumentRelations),
  ];

  const people = new Set(data.people.map((item) => item.id));
  const sources = new Map(data.sources.map((item) => [item.id, item] as const));
  const argumentsById = new Map(data.arguments.map((item) => [item.id, item] as const));
  const excerpts = new Map(data.excerpts.map((item) => [item.id, item] as const));
  const codebooks = new Set(data.codebooks.map((item) => item.id));
  const propositions = new Map(data.propositions.map((item) => [item.id, item] as const));
  const coders = new Set(data.coders.map((item) => item.id));
  const dimensionModels = new Map(data.dimensionModels.map((item) => [item.id, item] as const));
  const dimensions = new Map(data.dimensions.map((item) => [item.id, item] as const));

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

  for (const model of data.dimensionModels) {
    if (!codebooks.has(model.codebookId)) {
      issues.push({
        code: "orphan_dimension_model_codebook",
        entityId: model.id,
        message: "Model wymiarów wskazuje nieistniejącą wersję codebooka.",
      });
    }
  }

  for (const dimension of data.dimensions) {
    if (!dimensionModels.has(dimension.dimensionModelId)) {
      issues.push({
        code: "orphan_dimension_model",
        entityId: dimension.id,
        message: "Wymiar wskazuje nieistniejący model wymiarów.",
      });
    }
  }

  const dimensionLinkKeys = new Set<string>();
  for (const link of data.dimensionLinks) {
    const model = dimensionModels.get(link.dimensionModelId);
    const dimension = dimensions.get(link.dimensionId);
    const proposition = propositions.get(link.propositionId);

    if (!model) {
      issues.push({
        code: "orphan_dimension_link_model",
        entityId: link.id,
        message: "Powiązanie mikrostanowiska wskazuje nieistniejący model wymiarów.",
      });
    }

    if (!dimension) {
      issues.push({
        code: "orphan_dimension_link_dimension",
        entityId: link.id,
        message: "Powiązanie mikrostanowiska wskazuje nieistniejący wymiar.",
      });
    }

    if (!proposition) {
      issues.push({
        code: "orphan_dimension_link_proposition",
        entityId: link.id,
        message: "Powiązanie wymiaru wskazuje nieistniejące mikrostanowisko.",
      });
    }

    if (dimension && dimension.dimensionModelId !== link.dimensionModelId) {
      issues.push({
        code: "dimension_link_model_mismatch",
        entityId: link.id,
        message: "Powiązanie i wymiar należą do różnych modeli wymiarów.",
      });
    }

    if (model && proposition && model.codebookId !== proposition.codebookId) {
      issues.push({
        code: "dimension_link_codebook_mismatch",
        entityId: link.id,
        message: "Model wymiarów i mikrostanowisko należą do różnych wersji codebooka.",
      });
    }

    const duplicateKey = [
      link.dimensionModelId,
      link.dimensionId,
      link.propositionId,
    ].join("::");

    if (dimensionLinkKeys.has(duplicateKey)) {
      issues.push({
        code: "duplicate_dimension_link",
        entityId: link.id,
        message: "To samo mikrostanowisko jest podwójnie przypisane do tego samego wymiaru.",
      });
    }
    dimensionLinkKeys.add(duplicateKey);
  }

  for (const plan of data.samplingPlans) {
    const nonNegativeFields: Array<[string, number]> = [
      ["minimumSourcesPerPerson", plan.minimumSourcesPerPerson],
      ["minimumSourceTypesPerPerson", plan.minimumSourceTypesPerPerson],
      ["minimumPurposesPerPerson", plan.minimumPurposesPerPerson],
      ["minimumPreparednessModesPerPerson", plan.minimumPreparednessModesPerPerson],
      ["minimumScopesPerPerson", plan.minimumScopesPerPerson],
    ];
    const hasNegative = nonNegativeFields.some(([, value]) => !Number.isFinite(value) || value < 0);
    const invalidShare =
      (plan.minimumDatedSourceShare !== null &&
        (!Number.isFinite(plan.minimumDatedSourceShare) ||
          plan.minimumDatedSourceShare < 0 ||
          plan.minimumDatedSourceShare > 1)) ||
      (plan.maximumSingleSourceTypeShare !== null &&
        (!Number.isFinite(plan.maximumSingleSourceTypeShare) ||
          plan.maximumSingleSourceTypeShare < 0 ||
          plan.maximumSingleSourceTypeShare > 1));
    const invalidSpan =
      plan.minimumTemporalSpanYears !== null &&
      (!Number.isFinite(plan.minimumTemporalSpanYears) || plan.minimumTemporalSpanYears < 0);

    if (hasNegative || invalidShare || invalidSpan) {
      issues.push({
        code: "invalid_sampling_plan",
        entityId: plan.id,
        message: "Plan próbkowania zawiera nieprawidłowy próg lub wartość spoza dozwolonego zakresu.",
      });
    }
  }

  const discussions = new Set(data.discussions.map((discussion) => discussion.id));
  const discussionLinkKeys = new Set<string>();
  for (const link of data.discussionLinks) {
    if (!discussions.has(link.discussionId)) {
      issues.push({
        code: "orphan_discussion_link_discussion",
        entityId: link.id,
        message: "Powiązanie debaty wskazuje nieistniejącą debatę.",
      });
    }
    if (!argumentsById.has(link.argumentId)) {
      issues.push({
        code: "orphan_discussion_link_argument",
        entityId: link.id,
        message: "Powiązanie debaty wskazuje nieistniejący argument.",
      });
    }

    const duplicateKey = [link.discussionId, link.argumentId].join("::");
    if (discussionLinkKeys.has(duplicateKey)) {
      issues.push({
        code: "duplicate_discussion_link",
        entityId: link.id,
        message: "Ten sam argument jest podwójnie przypisany do tej samej debaty.",
      });
    }
    discussionLinkKeys.add(duplicateKey);
  }

  const discussionLinksByDiscussion = new Map<string, Set<string>>();
  for (const link of data.discussionLinks) {
    const current = discussionLinksByDiscussion.get(link.discussionId) ?? new Set<string>();
    current.add(link.argumentId);
    discussionLinksByDiscussion.set(link.discussionId, current);
  }

  const argumentRelationKeys = new Set<string>();
  for (const relation of data.argumentRelations) {
    if (!discussions.has(relation.discussionId)) {
      issues.push({
        code: "orphan_argument_relation_discussion",
        entityId: relation.id,
        message: "Relacja argumentów wskazuje nieistniejącą debatę.",
      });
    }
    if (!argumentsById.has(relation.fromArgumentId)) {
      issues.push({
        code: "orphan_argument_relation_from",
        entityId: relation.id,
        message: "Relacja argumentów ma nieistniejący argument źródłowy.",
      });
    }
    if (!argumentsById.has(relation.toArgumentId)) {
      issues.push({
        code: "orphan_argument_relation_to",
        entityId: relation.id,
        message: "Relacja argumentów ma nieistniejący argument docelowy.",
      });
    }
    if (relation.fromArgumentId === relation.toArgumentId) {
      issues.push({
        code: "argument_relation_self",
        entityId: relation.id,
        message: "Argument nie może tworzyć relacji sam ze sobą.",
      });
    }

    const linked = discussionLinksByDiscussion.get(relation.discussionId);
    if (
      linked &&
      (!linked.has(relation.fromArgumentId) || !linked.has(relation.toArgumentId))
    ) {
      issues.push({
        code: "argument_relation_endpoint_not_linked",
        entityId: relation.id,
        message: "Oba końce relacji muszą być przypisane do tej samej debaty.",
      });
    }

    const duplicateKey = [
      relation.discussionId,
      relation.fromArgumentId,
      relation.toArgumentId,
      relation.relation,
    ].join("::");
    if (argumentRelationKeys.has(duplicateKey)) {
      issues.push({
        code: "duplicate_argument_relation",
        entityId: relation.id,
        message: "Ta sama relacja między argumentami została zduplikowana.",
      });
    }
    argumentRelationKeys.add(duplicateKey);
  }

  const assessmentKeys = new Set<string>();
  for (const assessment of data.assessments) {
    if (!people.has(assessment.personId)) {
      issues.push({
        code: "orphan_assessment_person",
        entityId: assessment.id,
        message: "Rekonstrukcja stanowiska wskazuje nieistniejącą osobę.",
      });
    }

    const proposition = propositions.get(assessment.propositionId);
    if (!proposition) {
      issues.push({
        code: "orphan_assessment_proposition",
        entityId: assessment.id,
        message: "Rekonstrukcja stanowiska wskazuje nieistniejące mikrostanowisko.",
      });
    }

    if (!codebooks.has(assessment.codebookId)) {
      issues.push({
        code: "orphan_assessment_codebook",
        entityId: assessment.id,
        message: "Rekonstrukcja stanowiska wskazuje nieistniejący codebook.",
      });
    }

    if (assessment.reviewerId && !coders.has(assessment.reviewerId)) {
      issues.push({
        code: "orphan_assessment_reviewer",
        entityId: assessment.id,
        message: "Rekonstrukcja stanowiska wskazuje nieistniejącego recenzenta.",
      });
    }

    if (proposition && proposition.codebookId !== assessment.codebookId) {
      issues.push({
        code: "assessment_codebook_mismatch",
        entityId: assessment.id,
        message: "Rekonstrukcja stanowiska i mikrostanowisko należą do różnych wersji codebooka.",
      });
    }

    const duplicateKey = [
      assessment.personId,
      assessment.propositionId,
      assessment.codebookId,
    ].join("::");

    if (assessmentKeys.has(duplicateKey)) {
      issues.push({
        code: "duplicate_assessment",
        entityId: assessment.id,
        message: "Istnieje więcej niż jedna rekonstrukcja tego samego mikrostanowiska dla tej osoby i wersji codebooka.",
      });
    }
    assessmentKeys.add(duplicateKey);
  }

  return issues;
}
