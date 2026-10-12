import { buildAdjudicationQueue, summarizeAdjudicationQueue } from "./adjudication-queue";
import { computeCoderAgreementPairs } from "./coder-agreement";
import { buildCorpusHealthMatrix, corpusHealthTotals } from "./corpus-health";
import { checkResearchProjectIntegrity } from "./integrity";
import type { ResearchProjectData } from "./model";

export type ResearchAuditContext = {
  codebookId: string;
  samplingPlanId: string | null;
  generatedAt: string;
};

export type ResearchAuditReport = {
  formatVersion: 1;
  generatedAt: string;
  projectSchemaVersion: number;
  codebook: { id: string; name: string; version: string; status: string };
  samplingPlan: { id: string; name: string; version: string; status: string } | null;
  scope: "research_project_local_snapshot";
  counts: {
    people: number;
    sources: number;
    arguments: number;
    excerpts: number;
    verifiedExcerpts: number;
    coders: number;
    codingRecords: number;
    codedUnits: number;
    assessments: number;
    adjudicationEvents: number;
    integrityIssues: number;
  };
  health: Omit<ReturnType<typeof corpusHealthTotals>, "samplingGaps"> & { samplingGaps: number | null };
  review: ReturnType<typeof summarizeAdjudicationQueue>;
  agreementPairs: Array<{
    coderAId: string;
    coderBId: string;
    overlap: number;
    disagreements: number;
    missingVsScored: number;
    bothNotApplicable: number;
    duplicateUnitsExcluded: number;
    exactDirectionAgreement: number | null;
    ratedOverlap: number;
    ratedExactAgreement: number | null;
    linearWeightedKappa: number | null;
  }>;
  people: Array<{
    id: string;
    name: string;
    sourceCount: number;
    verifiedExcerptCount: number;
    excerptCount: number;
    codedUnits: number;
    codebookCoverage: string;
    assessmentCount: number;
    staleAssessmentCount: number;
    contradictionCount: number;
    samplingGapCount: number;
    flags: Array<{ code: string; severity: string; message: string }>;
  }>;
  integrityIssues: ReturnType<typeof checkResearchProjectIntegrity>;
  notes: string[];
};

/**
 * Audits a snapshot without changing its assessments or approving publication.
 * All calculations reuse the same functions as the interactive research panels.
 */
export function buildResearchAuditReport(
  data: ResearchProjectData,
  context: ResearchAuditContext,
): ResearchAuditReport {
  const codebook = data.codebooks.find((entry) => entry.id === context.codebookId);
  if (!codebook) throw new Error("Nie znaleziono wybranej wersji codebooka.");
  if (!Number.isFinite(Date.parse(context.generatedAt))) {
    throw new Error("Raport wymaga jawnej, poprawnej daty wygenerowania.");
  }
  const plan = context.samplingPlanId
    ? data.samplingPlans.find((entry) => entry.id === context.samplingPlanId)
    : null;
  if (context.samplingPlanId && !plan) throw new Error("Nie znaleziono wybranego planu próbkowania.");

  const healthRows = buildCorpusHealthMatrix(data, codebook.id, plan);
  const integrityIssues = checkResearchProjectIntegrity(data);
  const reviewItems = buildAdjudicationQueue(data, codebook.id);
  const relevantCodings = data.codings.filter((entry) => entry.codebookId === codebook.id);
  const relevantAssessments = data.assessments.filter((entry) => entry.codebookId === codebook.id);
  const verified = data.excerpts.filter((entry) => entry.verificationStatus === "verified");
  const auditCodings = new Set(
    relevantCodings.map((entry) => JSON.stringify([entry.excerptId, entry.propositionId])),
  );
  const sourceIds = new Set(data.sources.map((entry) => entry.id));
  const verificationCount = verified.filter((entry) => sourceIds.has(entry.sourceId)).length;
  const pairs = computeCoderAgreementPairs(data.codings, data.coders, codebook.id)
    .filter((pair) => pair.overlap > 0 || pair.duplicateUnitsExcluded > 0)
    .map((pair) => ({
      coderAId: pair.coderAId,
      coderBId: pair.coderBId,
      overlap: pair.overlap,
      disagreements: pair.disagreements.length,
      missingVsScored: pair.missingVsScored,
      bothNotApplicable: pair.bothNotApplicable,
      duplicateUnitsExcluded: pair.duplicateUnitsExcluded,
      exactDirectionAgreement: pair.exactDirectionAgreement,
      ratedOverlap: pair.ratedOverlap,
      ratedExactAgreement: pair.ratedExactAgreement,
      linearWeightedKappa: pair.linearWeightedKappa,
    }));

  return {
    formatVersion: 1,
    generatedAt: context.generatedAt,
    projectSchemaVersion: data.schemaVersion,
    codebook: { id: codebook.id, name: codebook.name, version: codebook.version, status: codebook.status },
    samplingPlan: plan ? { id: plan.id, name: plan.name, version: plan.version, status: plan.status } : null,
    scope: "research_project_local_snapshot",
    counts: {
      people: data.people.length,
      sources: data.sources.length,
      arguments: data.arguments.length,
      excerpts: data.excerpts.length,
      verifiedExcerpts: verificationCount,
      coders: data.coders.length,
      codingRecords: relevantCodings.length,
      codedUnits: auditCodings.size,
      assessments: relevantAssessments.length,
      adjudicationEvents: data.adjudications.filter((entry) => entry.codebookId === codebook.id).length,
      integrityIssues: integrityIssues.length,
    },
    health: { ...corpusHealthTotals(healthRows), samplingGaps: plan ? corpusHealthTotals(healthRows).samplingGaps : null },
    review: summarizeAdjudicationQueue(reviewItems),
    agreementPairs: pairs,
    people: healthRows.map((row) => ({
      id: row.personId,
      name: data.people.find((item) => item.id === row.personId)?.displayName ?? row.personId,
      sourceCount: row.sourceCount,
      verifiedExcerptCount: row.verifiedExcerptCount,
      excerptCount: row.excerptCount,
      codedUnits: row.independentEvidenceUnitCount,
      codebookCoverage: `${row.propositionCoverageCount}/${row.propositionCount}`,
      assessmentCount: row.assessmentCount,
      staleAssessmentCount: row.staleAssessmentCount,
      contradictionCount: row.contradictionCount,
      samplingGapCount: row.samplingGaps.length,
      flags: row.flags.map((flag) => ({ ...flag })),
    })),
    integrityIssues,
    notes: [
      "Raport stanowi diagnostykę konkretnego zrzutu lokalnych danych. Nie jest recenzją naukową ani zgodą na publikację.",
      "Wskaźniki zgodności odnoszą się do par koderów na tych samych jednostkach fragment × mikrostanowisko; jednostki nie muszą być statystycznie niezależne.",
      "Wartość N/A oznacza brak wystarczającej oceny stanowiska i nie jest tożsama z neutralnością (0).",
      "Adjudykacja nie zmienia zgodności pierwotnych koderów ani automatycznie nie aktualizuje syntez stanowisk.",
      "Flagi Corpus Health są diagnostycznymi sygnałami; brak flag nie dowodzi poprawności badania.",
      "Dane raportu mogą zawierać nazwiska, identyfikatory, treści flag i informacje o materiale źródłowym. Przejrzyj plik przed publicznym udostępnieniem.",
      "Raport nie zastępuje pełnego eksportu projektu JSON z materiałem źródłowym i historią ocen.",
    ],
  };
}

function escapeCell(value: unknown): string {
  return String(value ?? "—").replace(/\|/g, "\\|").replace(/[\r\n]+/g, " ").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function percent(value: number | null): string {
  return value === null ? "N/D" : `${(value * 100).toFixed(1)}%`;
}

/** Markdown for a human reviewer; no invented composite quality score. */
export function renderResearchAuditMarkdown(report: ResearchAuditReport): string {
  const out: string[] = [
    "# Neoludologia — raport audytowy korpusu",
    "",
    `- Wygenerowano: ${escapeCell(report.generatedAt)}`,
    `- Schemat projektu: v${report.projectSchemaVersion}; format raportu: v${report.formatVersion}`,
    `- Codebook: ${escapeCell(report.codebook.name)} (${escapeCell(report.codebook.version)}; ${escapeCell(report.codebook.id)})`,
    `- Plan próbkowania: ${report.samplingPlan
      ? `${escapeCell(report.samplingPlan.name)} (${escapeCell(report.samplingPlan.version)}; ${escapeCell(report.samplingPlan.id)})`
      : "nie wybrano (nie interpretuj zera luk jako spełnienia planu)"}`,
    "",
    "## Stan materiału (bez wyniku syntetycznego)",
    "",
    "| Miara | Wartość |",
    "| --- | ---: |",
    `| Osoby | ${report.counts.people} |`,
    `| Źródła | ${report.counts.sources} |`,
    `| Fragmenty zweryfikowane / wszystkie | ${report.counts.verifiedExcerpts} / ${report.counts.excerpts} |`,
    `| Argumenty | ${report.counts.arguments} |`,
    `| Koderzy | ${report.counts.coders} |`,
    `| Zapisy kodowań w wybranym codebooku | ${report.counts.codingRecords} |`,
    `| Jednostki fragment × mikrostanowisko w codebooku | ${report.counts.codedUnits} |`,
    `| Rekonstrukcje stanowisk | ${report.counts.assessments} |`,
    `| Zdarzenia adjudykacji | ${report.counts.adjudicationEvents} |`,
    `| Naruszenia integralności (globalne) | ${report.counts.integrityIssues} |`,
    "",
    "## Ryzyka Corpus Health",
    "",
    `- Flagi blocker: ${report.health.blockerFlags}; warning: ${report.health.warningFlags}; info: ${report.health.infoFlags}.`,
    `- Nieaktualne rekonstrukcje: ${report.health.staleAssessments}; wykryte sprzeczności: ${report.health.contradictions}.`,
    `- Luki planu próbkowania: ${report.health.samplingGaps ?? "nie oceniano"}.`,
    "",
    "## Spory między koderami (liczba par)",
    "",
    "| Status | Liczba |",
    "| --- | ---: |",
    ...(["pending", "deferred", "needs_review", "blocked", "resolved"] as const)
      .map((status) => `| ${status} | ${report.review[status]} |`),
    "",
    "## Zgodność pierwotnych ocen",
    "",
    "| Koder A | Koder B | Wspólne jednostki | Spory | N/A vs ocena | N/A/N/A | Powielone jednostki | Zgodność surowa | Wspólne oceny liczbowe | Zgodność liczbowa | Kappa ważona |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...report.agreementPairs.map((pair) =>
      `| ${escapeCell(pair.coderAId)} | ${escapeCell(pair.coderBId)} | ${pair.overlap} | ${pair.disagreements} | ${pair.missingVsScored} | ${pair.bothNotApplicable} | ${pair.duplicateUnitsExcluded} | ${percent(pair.exactDirectionAgreement)} | ${pair.ratedOverlap} | ${percent(pair.ratedExactAgreement)} | ${pair.linearWeightedKappa === null ? "N/D" : pair.linearWeightedKappa.toFixed(3)} |`
    ),
    "",
    "## Osoby i pokrycie",
    "",
    "| Osoba | Źródła | Zweryfikowane fragmenty | Jednostki dowodowe | Pokrycie codebooka | Rekonstrukcje | Stale | Sprzeczności | Luki próbkowania |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...report.people.map((person) =>
      `| ${escapeCell(person.name)} | ${person.sourceCount} | ${person.verifiedExcerptCount}/${person.excerptCount} | ${person.codedUnits} | ${person.codebookCoverage} | ${person.assessmentCount} | ${person.staleAssessmentCount} | ${person.contradictionCount} | ${report.samplingPlan ? person.samplingGapCount : "nie oceniano"} |`
    ),
    "",
    "## Flagi dla osób",
    "",
    ...report.people.flatMap((person) =>
      person.flags.map((flag) =>
        `- **${escapeCell(person.name)}** [${flag.severity}/${flag.code}]: ${escapeCell(flag.message)}`
      )
    ),
    "",
    "## Integralność danych całego projektu",
    "",
    ...(report.integrityIssues.length
      ? report.integrityIssues.map((issue) =>
        `- [${escapeCell(issue.code)}] ${escapeCell(issue.entityId ?? "—")}: ${escapeCell(issue.message)}`
      )
      : ["Brak wykrytych naruszeń integralności według aktualnych reguł kontroli."]),
    "",
    "## Ograniczenia",
    "",
    ...report.notes.map((note) => `- ${escapeCell(note)}`),
    "",
  ];
  return out.join("\n");
}

export function serializeResearchAuditReport(report: ResearchAuditReport): string {
  return JSON.stringify(report, null, 2);
}
