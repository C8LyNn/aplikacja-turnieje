import type { ResearchAuditReport } from "./research-audit-report";

type AuditCountKey = keyof ResearchAuditReport["counts"];
type AuditHealthKey = keyof ResearchAuditReport["health"];
type AuditReviewKey = keyof ResearchAuditReport["review"];

export type AuditMetricDelta = {
  group: "corpus" | "health" | "review";
  key: string;
  label: string;
  before: number | null;
  after: number | null;
  delta: number | null;
};
export type AuditPersonChange = {
  personId: string;
  previousName: string | null;
  currentName: string | null;
  kind: "added" | "removed" | "changed" | "unchanged";
  sourcesBefore: number | null;
  sourcesAfter: number | null;
  verifiedBefore: number | null;
  verifiedAfter: number | null;
  flagsAdded: string[];
  flagsRemoved: string[];
};
export type AuditComparison = {
  compatible: boolean;
  blockingReasons: string[];
  notes: string[];
  before: { generatedAt: string; codebookId: string; codebookVersion: string; planId: string | null };
  after: { generatedAt: string; codebookId: string; codebookVersion: string; planId: string | null };
  metrics: AuditMetricDelta[];
  people: AuditPersonChange[];
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function textField(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
function validCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
function requireCounts(record: unknown, keys: readonly string[], label: string, nullable: readonly string[] = []) {
  if (!isObject(record) || !keys.every(key => nullable.includes(key)
    ? record[key] === null || validCount(record[key])
    : validCount(record[key]))) {
    throw new Error(`Nieprawidłowe liczniki raportu: ${label}.`);
  }
}
function verifyDistinctIds(items: unknown[], label: string) {
  const ids = items.map((item) => isObject(item) ? item.id : undefined);
  if (ids.some((id) => !textField(id)) || new Set(ids).size !== ids.length) {
    throw new Error(`Nieprawidłowe lub powielone identyfikatory w ${label}.`);
  }
}
const CORPUS_METRICS: readonly [AuditCountKey, string][] = [
  ["people", "Osoby"], ["sources", "Źródła"], ["arguments", "Argumenty"],
  ["excerpts", "Fragmenty"], ["verifiedExcerpts", "Fragmenty zweryfikowane"],
  ["coders", "Koderzy"], ["codingRecords", "Zapisy kodowania"],
  ["codedUnits", "Pary fragment × mikrostanowisko"],
  ["assessments", "Rekonstrukcje stanowisk"],
  ["adjudicationEvents", "Zdarzenia adjudykacji"],
  ["integrityIssues", "Naruszenia integralności całego projektu"],
];
const HEALTH_METRICS: readonly [AuditHealthKey, string][] = [
  ["blockerFlags", "Flagi blocker"], ["warningFlags", "Flagi warning"],
  ["infoFlags", "Flagi info"], ["staleAssessments", "Nieaktualne rekonstrukcje"],
  ["contradictions", "Potencjalne sprzeczności"],
  ["samplingGaps", "Luki planu próbkowania"],
];
const REVIEW_METRICS: readonly [AuditReviewKey, string][] = [
  ["pending", "Spory oczekujące"], ["deferred", "Spory odroczone"],
  ["needs_review", "Spory do ponownej oceny"],
  ["blocked", "Spory zablokowane"], ["resolved", "Spory rozstrzygnięte"],
  ["total", "Wszystkie spory (pary koderów)"],
];

/** Read-only import of the v1 summary report, not the full research project JSON. */
export function parseResearchAuditSnapshot(raw: string): ResearchAuditReport {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("Plik nie jest poprawnym dokumentem JSON.");
  }
  if (!isObject(value) || value.formatVersion !== 1 ||
      value.scope !== "research_project_local_snapshot" ||
      !textField(value.generatedAt) || !Number.isFinite(Date.parse(value.generatedAt)) ||
      !validCount(value.projectSchemaVersion)) {
    throw new Error("Nieobsługiwany format raportu audytowego (wymagany formatVersion=1).");
  }
  const codebook = value.codebook;
  if (!isObject(codebook) || !textField(codebook.id) ||
      !textField(codebook.version) || !textField(codebook.name) ||
      !textField(codebook.status)) {
    throw new Error("Raport nie zawiera poprawnej tożsamości codebooka.");
  }
  const plan = value.samplingPlan;
  if (plan !== null && (!isObject(plan) || !textField(plan.id) ||
      !textField(plan.version) || !textField(plan.name) || !textField(plan.status))) {
    throw new Error("Raport zawiera nieprawidłową definicję planu próbkowania.");
  }
  requireCounts(value.counts, CORPUS_METRICS.map(([key]) => key), "korpus");
  requireCounts(value.health, ["people", ...HEALTH_METRICS.map(([key]) => key)],
    "Corpus Health", ["samplingGaps"]);
  requireCounts(value.review, REVIEW_METRICS.map(([key]) => key), "adjudykacja");
  if (!Array.isArray(value.people) || !Array.isArray(value.integrityIssues) ||
      !Array.isArray(value.agreementPairs) || !Array.isArray(value.notes)) {
    throw new Error("Raport ma niepełną strukturę audytu.");
  }
  verifyDistinctIds(value.people, "people");
  for (const person of value.people) {
    if (!isObject(person) || !textField(person.name) ||
        !validCount(person.sourceCount) || !validCount(person.verifiedExcerptCount) ||
        !validCount(person.excerptCount) || !validCount(person.codedUnits) ||
        !validCount(person.assessmentCount) || !validCount(person.staleAssessmentCount) ||
        !validCount(person.contradictionCount) || !validCount(person.samplingGapCount) ||
        !textField(person.codebookCoverage) || !Array.isArray(person.flags) ||
        !person.flags.every((flag: unknown) =>
          isObject(flag) && textField(flag.code) &&
          textField(flag.severity) && typeof flag.message === "string")) {
      throw new Error("Raport zawiera nieprawidłowe rekordy osób.");
    }
  }
  if (value.people.length !== (value.counts as Record<string, number>).people) {
    throw new Error("Niespójna liczba osób w raporcie.");
  }
  return value as unknown as ResearchAuditReport;
}

function flagKey(flag: { severity: string; code: string }): string {
  return JSON.stringify([flag.severity, flag.code]);
}
function readableFlag(key: string): string {
  const [severity, code] = JSON.parse(key) as [string, string];
  return `${severity}: ${code}`;
}

/**
 * Comparison is gated by the actual identities of versioned research instruments.
 * Differences from incompatible methodology are never represented as numerical deltas.
 */
export function compareResearchAudits(before: ResearchAuditReport, after: ResearchAuditReport): AuditComparison {
  const blockingReasons: string[] = [];
  if (before.formatVersion !== after.formatVersion || before.scope !== after.scope) {
    blockingReasons.push("Inny format lub zakres raportu.");
  }
  if (before.codebook.id !== after.codebook.id ||
      before.codebook.version !== after.codebook.version) {
    blockingReasons.push("Zmieniła się wersja lub tożsamość codebooka.");
  }
  if ((before.samplingPlan?.id ?? null) !== (after.samplingPlan?.id ?? null) ||
      (before.samplingPlan?.version ?? null) !== (after.samplingPlan?.version ?? null)) {
    blockingReasons.push("Zmieniono plan próbkowania albo sposób jego stosowania.");
  }
  if (Date.parse(before.generatedAt) > Date.parse(after.generatedAt)) {
    blockingReasons.push("Raport bazowy jest późniejszy od bieżącego zrzutu.");
  }
  const compatible = blockingReasons.length === 0;
  const notes = [
    "Różnica liczebności nie przesądza o poprawie ani pogorszeniu jakości badań.",
    "Rozbieżności są liczone dla par koderów, nie dla niezależnych fragmentów.",
    "Zbieżność identyfikatorów codebooka i planu nie dowodzi niezmienności ich treści; narzędzia mogą być edytowane poza systemem.",
    "Raporty podlegają ręcznemu importowi i nie posiadają podpisu kryptograficznego ani niezależnej gwarancji autentyczności.",
  ];
  if (before.projectSchemaVersion !== after.projectSchemaVersion) {
    notes.push("Zmieniła się wersja schematu danych projektu. Przejrzyj zakres migracji przed interpretacją różnic.");
  }
  const metrics: AuditMetricDelta[] = [];
  function push(group: AuditMetricDelta["group"], key: string, label: string, a: number | null, b: number | null) {
    metrics.push({group, key, label, before: a, after: b, delta: a === null || b === null ? null : b - a});
  }

  const people: AuditPersonChange[] = [];
  if (compatible) {
    for (const [key, label] of CORPUS_METRICS) push("corpus", key, label, before.counts[key], after.counts[key]);
    for (const [key, label] of HEALTH_METRICS) push("health", key, label, before.health[key], after.health[key]);
    for (const [key, label] of REVIEW_METRICS) push("review", key, label, before.review[key], after.review[key]);
    const previous = new Map(before.people.map((person) => [person.id, person]));
    const current = new Map(after.people.map((person) => [person.id, person]));
    const ids = [...new Set([...previous.keys(), ...current.keys()])].sort((a, b) => a.localeCompare(b));
    for (const id of ids) {
      const a = previous.get(id);
      const b = current.get(id);
      const oldFlags = new Set(a?.flags.map(flagKey) ?? []);
      const newFlags = new Set(b?.flags.map(flagKey) ?? []);
      const flagsAdded = [...newFlags].filter((key) => !oldFlags.has(key)).map(readableFlag);
      const flagsRemoved = [...oldFlags].filter((key) => !newFlags.has(key)).map(readableFlag);
      const changed = !!a && !!b && (a.name !== b.name ||
        a.sourceCount !== b.sourceCount ||
        a.verifiedExcerptCount !== b.verifiedExcerptCount ||
        a.excerptCount !== b.excerptCount ||
        a.codedUnits !== b.codedUnits ||
        a.codebookCoverage !== b.codebookCoverage ||
        a.assessmentCount !== b.assessmentCount ||
        a.staleAssessmentCount !== b.staleAssessmentCount ||
        a.contradictionCount !== b.contradictionCount ||
        a.samplingGapCount !== b.samplingGapCount ||
        flagsAdded.length > 0 || flagsRemoved.length > 0);
      people.push({
        personId: id, previousName: a?.name ?? null, currentName: b?.name ?? null,
        kind: !a ? "added" : !b ? "removed" : changed ? "changed" : "unchanged",
        sourcesBefore: a?.sourceCount ?? null, sourcesAfter: b?.sourceCount ?? null,
        verifiedBefore: a?.verifiedExcerptCount ?? null, verifiedAfter: b?.verifiedExcerptCount ?? null,
        flagsAdded, flagsRemoved,
      });
    }
  }

  return {
    compatible, blockingReasons, notes,
    before: { generatedAt: before.generatedAt, codebookId: before.codebook.id,
      codebookVersion: before.codebook.version, planId: before.samplingPlan?.id ?? null },
    after: { generatedAt: after.generatedAt, codebookId: after.codebook.id,
      codebookVersion: after.codebook.version, planId: after.samplingPlan?.id ?? null },
    metrics, people,
  };
}

function escapeMd(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\|/g, "\\|")
    .replace(/[\r\n]+/g, " ").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderAuditComparisonMarkdown(comparison: AuditComparison): string {
  const output = [
    "# Neoludologia — porównanie audytów",
    "",
    `- Poprzedni raport: ${comparison.before.generatedAt}`,
    `- Bieżący raport: ${comparison.after.generatedAt}`,
    `- Codebook: ${escapeMd(comparison.after.codebookId)} (${escapeMd(comparison.after.codebookVersion)})`,
    `- Plan: ${escapeMd(comparison.after.planId ?? "nie wybrano")}`,
    "",
  ];
  if (!comparison.compatible) {
    output.push("## Nieporównywalne metodologicznie", "",
      ...comparison.blockingReasons.map(reason => `- ${escapeMd(reason)}`), "",
      "Nie wyliczono różnic liczbowych ani zmian między osobami.", "");
  } else {
    output.push("## Zmiany liczebności", "",
      "| Obszar | Miara | Poprzednio | Teraz | Zmiana |",
      "| --- | --- | ---: | ---: | ---: |");
    for (const metric of comparison.metrics) {
      output.push(`| ${metric.group} | ${escapeMd(metric.label)} | ${metric.before ?? "N/D"} | ${metric.after ?? "N/D"} | ${metric.delta === null ? "nie oceniano" : metric.delta > 0 ? "+" + metric.delta : metric.delta} |`);
    }
    output.push("", "## Zmiany według osoby", "",
      "| ID | Osoba | Status | Źródła: wcześniej → teraz | Weryfikowane: wcześniej → teraz | Nowe flagi | Usunięte flagi |",
      "| --- | --- | --- | --- | --- | --- | --- |");
    for (const person of comparison.people) {
      output.push(`| ${escapeMd(person.personId)} | ${escapeMd(person.currentName ?? person.previousName ?? "—")} | ${person.kind} | ${person.sourcesBefore ?? "—"} → ${person.sourcesAfter ?? "—"} | ${person.verifiedBefore ?? "—"} → ${person.verifiedAfter ?? "—"} | ${person.flagsAdded.map(escapeMd).join("; ") || "—"} | ${person.flagsRemoved.map(escapeMd).join("; ") || "—"} |`);
    }
    output.push("");
  }
  output.push("## Ograniczenia", "", ...comparison.notes.map(note => `- ${escapeMd(note)}`), "");
  return output.join("\n");
}
