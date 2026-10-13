import type {
  CodingAdjudication,
  CodingRecord,
  ResearchExcerpt,
  DirectionScore,
  ResearchProjectData,
} from "./model";

/** Canonical snapshot detects changes to the original coding after review. */
export function snapshotCoding(coding: CodingRecord): string {
  return JSON.stringify(coding);
}

export function snapshotExcerpt(excerpt: ResearchExcerpt): string {
  return JSON.stringify(excerpt);
}

export function canonicalCodingPair(aId: string, bId: string): string {
  return JSON.stringify([aId, bId].sort());
}

export function latestCodingAdjudication(
  data: ResearchProjectData,
  codingAId: string,
  codingBId: string,
): CodingAdjudication | undefined {
  const pair = canonicalCodingPair(codingAId, codingBId);
  return [...data.adjudications]
    .reverse()
    .find((record) => canonicalCodingPair(record.codingAId, record.codingBId) === pair);
}

function sameUnit(a: CodingRecord, b: CodingRecord): boolean {
  return a.codebookId === b.codebookId &&
    a.excerptId === b.excerptId &&
    a.propositionId === b.propositionId;
}

export type AdjudicationInput = {
  codingAId: string;
  codingBId: string;
  reviewerId: string;
  decision: CodingAdjudication["decision"];
  direction: DirectionScore | null;
  rationale: string;
};

/** Adjudication is a separate judgment, never a mutation of a coder's observation. */
export function validateAdjudicationInput(
  data: ResearchProjectData,
  input: AdjudicationInput,
): string | null {
  const a = data.codings.find((item) => item.id === input.codingAId);
  const b = data.codings.find((item) => item.id === input.codingBId);
  if (!a || !b || a.id === b.id || a.coderId === b.coderId || !sameUnit(a, b)) {
    return "Wybierz dwa odrębne kodowania różnych koderów tej samej jednostki i codebooka.";
  }
  if (a.direction === b.direction) return "Ta para ocen nie zawiera rozbieżności.";
  if (
    data.codings.filter((item) =>
      item.codebookId === a.codebookId &&
      item.excerptId === a.excerptId &&
      item.propositionId === a.propositionId &&
      item.coderId === a.coderId
    ).length !== 1 ||
    data.codings.filter((item) =>
      item.codebookId === b.codebookId &&
      item.excerptId === b.excerptId &&
      item.propositionId === b.propositionId &&
      item.coderId === b.coderId
    ).length !== 1
  ) {
    return "Powielone kodowania uniemożliwiają jednoznaczne rozstrzygnięcie.";
  }
  if (data.excerpts.find((item) => item.id === a.excerptId)?.verificationStatus !== "verified") {
    return "Przed adjudykacją zweryfikuj fragment w Warsztacie źródeł.";
  }
  const reviewer = data.coders.find((item) => item.id === input.reviewerId);
  if (!reviewer || reviewer.type !== "human" || reviewer.id === a.coderId || reviewer.id === b.coderId) {
    return "Recenzent musi być trzecim, niezależnym koderem-człowiekiem.";
  }
  if (!input.rationale.trim()) return "Wymagane jest uzasadnienie decyzji lub odroczenia.";
  if (input.decision === "deferred" && input.direction !== null) {
    return "Odroczenie nie może sugerować uzgodnionej oceny.";
  }
  if (
    input.decision === "resolved" &&
    input.direction !== null &&
    ![-2, -1, 0, 1, 2].includes(input.direction)
  ) return "Ocena musi należeć do skali -2…+2 lub być N/A.";
  return null;
}

/** Detect invalid or stale historical events; do not delete them silently. */
export function adjudicationIssue(
  data: ResearchProjectData,
  record: CodingAdjudication,
): string | null {
  const a = data.codings.find((coding) => coding.id === record.codingAId);
  const b = data.codings.find((coding) => coding.id === record.codingBId);
  if (!a || !b) return "Zapis adjudykacji odnosi się do usuniętego kodowania.";
  if (!sameUnit(a, b) || a.coderId === b.coderId ||
      a.excerptId !== record.excerptId ||
      a.propositionId !== record.propositionId ||
      a.codebookId !== record.codebookId) {
    return "Odniesienia adjudykacji nie są zgodne z materiałem źródłowym.";
  }
  if (a.direction === b.direction) return "Adjudykacja nie ma obecnie dwóch sprzecznych ocen.";
  if (record.codingASnapshot !== snapshotCoding(a) || record.codingBSnapshot !== snapshotCoding(b)) {
    return "Kodowanie źródłowe zostało zmienione po adjudykacji; konieczny jest ponowny przegląd.";
  }
  const reviewer = data.coders.find((item) => item.id === record.reviewerId);
  if (!reviewer || reviewer.type !== "human" || reviewer.id === a.coderId || reviewer.id === b.coderId) {
    return "Nie ma poprawnego niezależnego recenzenta.";
  }
  const excerpt = data.excerpts.find((item) => item.id === record.excerptId);
  if (!excerpt || record.excerptSnapshot !== snapshotExcerpt(excerpt)) {
    return "Fragment dowodowy został zmieniony lub usunięty po adjudykacji.";
  }
  const nowInvalid = validateAdjudicationInput(data, record);
  if (nowInvalid) return nowInvalid;
  if (typeof record.rationale !== "string" || !record.rationale.trim()) return "Adjudykacja nie ma uzasadnienia.";
  if (record.decision === "deferred" && record.direction !== null) {
    return "Odroczenie zawiera ocenę rozstrzygającą.";
  }
  if (record.decision !== "deferred" && record.decision !== "resolved") return "Nieprawidłowy status adjudykacji.";
  return null;
}
