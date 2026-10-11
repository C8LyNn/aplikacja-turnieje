import type { ResearchProjectData, SamplingPlan } from "./model";

export type PersonSamplingProfile = {
  personId: string;
  sourceCount: number;
  sourceTypeCount: number;
  purposeCount: number;
  preparednessModeCount: number;
  scopeCount: number;
  datedSourceCount: number;
  datedSourceShare: number | null;
  dominantSourceType: string | null;
  dominantSourceTypeShare: number | null;
  temporalSpanYears: number | null;
  firstPublishedAt: string | null;
  lastPublishedAt: string | null;
  excerptCount: number;
  largestSourceExcerptShare: number | null;
};

export type SamplingGapCode =
  | "sources"
  | "source_types"
  | "purposes"
  | "preparedness"
  | "scopes"
  | "dated_share"
  | "source_type_concentration"
  | "temporal_span";

export type SamplingGap = {
  code: SamplingGapCode;
  actual: number | null;
  target: number;
  message: string;
};

export type SamplingPlanEvaluation = {
  personId: string;
  profile: PersonSamplingProfile;
  gaps: SamplingGap[];
  meetsPlan: boolean;
};

function uniqueDefined(values: Array<string | undefined>): Set<string> {
  return new Set(values.filter((value): value is string => Boolean(value)));
}

export function personSamplingProfile(
  data: ResearchProjectData,
  personId: string,
): PersonSamplingProfile {
  const sources = data.sources.filter((source) => source.personId === personId);
  const sourceIds = new Set(sources.map((source) => source.id));
  const excerpts = data.excerpts.filter((excerpt) => sourceIds.has(excerpt.sourceId));

  const typeCounts = new Map<string, number>();
  for (const source of sources) {
    typeCounts.set(source.sourceType, (typeCounts.get(source.sourceType) ?? 0) + 1);
  }
  const dominantTypeEntry = [...typeCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  const datedSources = sources
    .filter((source) => Boolean(source.publishedAt))
    .sort((a, b) => (a.publishedAt ?? "").localeCompare(b.publishedAt ?? ""));

  const firstPublishedAt = datedSources[0]?.publishedAt ?? null;
  const lastPublishedAt = datedSources[datedSources.length - 1]?.publishedAt ?? null;

  let temporalSpanYears: number | null = null;
  if (firstPublishedAt && lastPublishedAt) {
    const first = Date.parse(firstPublishedAt);
    const last = Date.parse(lastPublishedAt);
    if (Number.isFinite(first) && Number.isFinite(last)) {
      temporalSpanYears = Math.max(0, (last - first) / (365.25 * 24 * 60 * 60 * 1000));
    }
  }

  const excerptCountsBySource = new Map<string, number>();
  for (const excerpt of excerpts) {
    excerptCountsBySource.set(
      excerpt.sourceId,
      (excerptCountsBySource.get(excerpt.sourceId) ?? 0) + 1,
    );
  }
  const largestExcerptCount = Math.max(0, ...excerptCountsBySource.values());

  return {
    personId,
    sourceCount: sources.length,
    sourceTypeCount: uniqueDefined(sources.map((source) => source.sourceType)).size,
    purposeCount: uniqueDefined(sources.map((source) => source.purpose)).size,
    preparednessModeCount: uniqueDefined(sources.map((source) => source.preparedness)).size,
    scopeCount: uniqueDefined(sources.map((source) => source.scope)).size,
    datedSourceCount: datedSources.length,
    datedSourceShare: sources.length > 0 ? datedSources.length / sources.length : null,
    dominantSourceType: dominantTypeEntry?.[0] ?? null,
    dominantSourceTypeShare:
      dominantTypeEntry && sources.length > 0 ? dominantTypeEntry[1] / sources.length : null,
    temporalSpanYears,
    firstPublishedAt,
    lastPublishedAt,
    excerptCount: excerpts.length,
    largestSourceExcerptShare:
      excerpts.length > 0 ? largestExcerptCount / excerpts.length : null,
  };
}

export function evaluateSamplingPlan(
  data: ResearchProjectData,
  plan: SamplingPlan,
  personId: string,
): SamplingPlanEvaluation {
  const profile = personSamplingProfile(data, personId);
  const gaps: SamplingGap[] = [];

  if (profile.sourceCount < plan.minimumSourcesPerPerson) {
    gaps.push({
      code: "sources",
      actual: profile.sourceCount,
      target: plan.minimumSourcesPerPerson,
      message: `Za mało niezależnych materiałów źródłowych: ${profile.sourceCount}/${plan.minimumSourcesPerPerson}.`,
    });
  }
  if (profile.sourceTypeCount < plan.minimumSourceTypesPerPerson) {
    gaps.push({
      code: "source_types",
      actual: profile.sourceTypeCount,
      target: plan.minimumSourceTypesPerPerson,
      message: `Za mało typów źródeł: ${profile.sourceTypeCount}/${plan.minimumSourceTypesPerPerson}.`,
    });
  }
  if (profile.purposeCount < plan.minimumPurposesPerPerson) {
    gaps.push({
      code: "purposes",
      actual: profile.purposeCount,
      target: plan.minimumPurposesPerPerson,
      message: `Za mało różnych celów materiału: ${profile.purposeCount}/${plan.minimumPurposesPerPerson}.`,
    });
  }
  if (profile.preparednessModeCount < plan.minimumPreparednessModesPerPerson) {
    gaps.push({
      code: "preparedness",
      actual: profile.preparednessModeCount,
      target: plan.minimumPreparednessModesPerPerson,
      message: `Za mało trybów wypowiedzi: ${profile.preparednessModeCount}/${plan.minimumPreparednessModesPerPerson}.`,
    });
  }
  if (profile.scopeCount < plan.minimumScopesPerPerson) {
    gaps.push({
      code: "scopes",
      actual: profile.scopeCount,
      target: plan.minimumScopesPerPerson,
      message: `Za mało zakresów tematycznych: ${profile.scopeCount}/${plan.minimumScopesPerPerson}.`,
    });
  }

  if (
    plan.minimumDatedSourceShare !== null &&
    (profile.datedSourceShare === null || profile.datedSourceShare < plan.minimumDatedSourceShare)
  ) {
    gaps.push({
      code: "dated_share",
      actual: profile.datedSourceShare,
      target: plan.minimumDatedSourceShare,
      message: "Za mała część materiałów ma ustaloną datę publikacji.",
    });
  }

  if (
    plan.maximumSingleSourceTypeShare !== null &&
    profile.dominantSourceTypeShare !== null &&
    profile.dominantSourceTypeShare > plan.maximumSingleSourceTypeShare
  ) {
    gaps.push({
      code: "source_type_concentration",
      actual: profile.dominantSourceTypeShare,
      target: plan.maximumSingleSourceTypeShare,
      message: `Zbyt duża koncentracja na jednym typie źródła: ${profile.dominantSourceType ?? "?"}.`,
    });
  }

  if (
    plan.minimumTemporalSpanYears !== null &&
    (profile.temporalSpanYears === null || profile.temporalSpanYears < plan.minimumTemporalSpanYears)
  ) {
    gaps.push({
      code: "temporal_span",
      actual: profile.temporalSpanYears,
      target: plan.minimumTemporalSpanYears,
      message: "Zakres czasowy korpusu jest krótszy od celu planu.",
    });
  }

  return {
    personId,
    profile,
    gaps,
    meetsPlan: gaps.length === 0,
  };
}

export function evaluateSamplingPlanForAllPeople(
  data: ResearchProjectData,
  plan: SamplingPlan,
): SamplingPlanEvaluation[] {
  return data.people.map((person) => evaluateSamplingPlan(data, plan, person.id));
}
