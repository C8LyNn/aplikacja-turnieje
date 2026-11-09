/** Pack22: non-authoritative, in-memory comparison of two SE safety assessments.
 * No network, persistence, authorization decisions or mutation actions.
 */
export interface SeAssessmentBlocker {
  code: string;
  category: string;
  title: string;
  detail: string;
  recommendation: string;
  resolution: string;
}

export interface SeAssessmentDiagnostic {
  version: 1;
  kind: "se_correction_diagnostic";
  advisoryOnly: true;
  executionEnabled: false;
  writePerformed: false;
  status: "candidate" | "blocked";
  assessmentId: string;
  validity: "snapshot_only";
  matchId: number;
  expectedMatchRevision: number;
  issueCount: number;
  blockers: readonly SeAssessmentBlocker[];
}

export interface SeAssessmentSnapshot {
  tournamentId: number;
  matchId: number;
  proposedScore1: number;
  proposedScore2: number;
  stageVersionVector: string;
  expectedCompletionActionId: number;
  diagnostic: SeAssessmentDiagnostic;
}

export type SeAssessmentComparison =
  | { kind: "no_baseline"; advisoryOnly: true; executionEnabled: false; writePerformed: false }
  | { kind: "different_scope"; advisoryOnly: true; executionEnabled: false; writePerformed: false; message: string }
  | { kind: "inconsistent"; advisoryOnly: true; executionEnabled: false; writePerformed: false; message: string }
  | {
      kind: "identical" | "changed";
      advisoryOnly: true;
      executionEnabled: false;
      writePerformed: false;
      previousId: string;
      currentId: string;
      previousStatus: "candidate" | "blocked";
      currentStatus: "candidate" | "blocked";
      revisionChanged: boolean;
      stageVectorChanged: boolean;
      completionActionChanged: boolean;
      added: readonly SeAssessmentBlocker[];
      resolved: readonly SeAssessmentBlocker[];
      continuing: readonly SeAssessmentBlocker[];
      note: string;
    };

const FLAGS = { advisoryOnly: true, executionEnabled: false, writePerformed: false } as const;
const ID_PATTERN = /^[a-f0-9]{64}$/;
const safeId = (x: number) => Number.isSafeInteger(x) && x > 0;
const safeScore = (x: number) => Number.isSafeInteger(x) && x >= 0;

/** Fail closed on malformed/corrupted responses. The ID is NOT a cryptographic proof of freshness. */
export function captureSeAssessment(input: SeAssessmentSnapshot): SeAssessmentSnapshot | null {
  const d = input.diagnostic;
  if (!safeId(input.tournamentId) || !safeId(input.matchId) ||
      !safeScore(input.proposedScore1) || !safeScore(input.proposedScore2) ||
      !safeId(input.expectedCompletionActionId) ||
      typeof input.stageVersionVector !== "string" || input.stageVersionVector.length === 0 ||
      input.stageVersionVector.length > 512 ||
      !d || d.version !== 1 || d.kind !== "se_correction_diagnostic" ||
      d.advisoryOnly !== true || d.executionEnabled !== false || d.writePerformed !== false ||
      d.validity !== "snapshot_only" || !ID_PATTERN.test(d.assessmentId) ||
      (d.status !== "candidate" && d.status !== "blocked") ||
      d.matchId !== input.matchId || !safeId(d.expectedMatchRevision) ||
      !Array.isArray(d.blockers) || !Number.isSafeInteger(d.issueCount) ||
      d.issueCount !== d.blockers.length || d.blockers.length > 128) return null;
  const usedCodes = new Set<string>();
  for (const blocker of d.blockers) {
    if (!blocker || typeof blocker.code !== "string" || blocker.code.length === 0 || blocker.code.length > 160 ||
        usedCodes.has(blocker.code) ||
        typeof blocker.category !== "string" || typeof blocker.title !== "string" ||
        typeof blocker.detail !== "string" || typeof blocker.recommendation !== "string" ||
        typeof blocker.resolution !== "string") return null;
    usedCodes.add(blocker.code);
  }
  if ((d.status === "candidate" && d.blockers.length > 0) ||
      (d.status === "blocked" && d.blockers.length === 0)) return null;
  return {
    ...input,
    diagnostic: { ...d, blockers: d.blockers.map((blocker) => ({ ...blocker })) },
  };
}

/** Compare only the same tournament, match and proposed score. A changed stage/revision is evidence, NOT approval. */
export function compareSeAssessments(previous: SeAssessmentSnapshot | null,
  current: SeAssessmentSnapshot): SeAssessmentComparison {
  const next = captureSeAssessment(current);
  const old = previous == null ? null : captureSeAssessment(previous);
  if (!next || (previous !== null && !old)) return {
    ...FLAGS, kind: "inconsistent", message: "Dane porównania są niespójne. Odśwież podgląd od początku.",
  };
  if (!old) return { ...FLAGS, kind: "no_baseline" };
  if (old.tournamentId !== next.tournamentId || old.matchId !== next.matchId ||
      old.proposedScore1 !== next.proposedScore1 || old.proposedScore2 !== next.proposedScore2)
    return {
      ...FLAGS, kind: "different_scope",
      message: "Zmienił się mecz lub proponowany wynik. Porównanie różnych korekt zostało wyłączone.",
    };
  const older = new Map(old.diagnostic.blockers.map((b) => [b.code, b]));
  const newer = new Map(next.diagnostic.blockers.map((b) => [b.code, b]));
  const added = next.diagnostic.blockers.filter((b) => !older.has(b.code));
  const resolved = old.diagnostic.blockers.filter((b) => !newer.has(b.code));
  const continuing = next.diagnostic.blockers.filter((b) => older.has(b.code));
  const revisionChanged = old.diagnostic.expectedMatchRevision !== next.diagnostic.expectedMatchRevision;
  const stageVectorChanged = old.stageVersionVector !== next.stageVersionVector;
  const completionActionChanged = old.expectedCompletionActionId !== next.expectedCompletionActionId;
  // Same correlation ID with contradictory evidence must never be labelled unchanged.
  if (old.diagnostic.assessmentId === next.diagnostic.assessmentId &&
      (revisionChanged || stageVectorChanged || completionActionChanged ||
       old.diagnostic.status !== next.diagnostic.status || added.length > 0 || resolved.length > 0))
    return {
      ...FLAGS, kind: "inconsistent",
      message: "Ten sam identyfikator występuje przy różnych danych. Zrezygnuj z porównania i odśwież analizę.",
    };
  const kind = old.diagnostic.assessmentId === next.diagnostic.assessmentId &&
    old.diagnostic.status === next.diagnostic.status && added.length === 0 && resolved.length === 0
    ? "identical" as const : "changed" as const;
  return {
    ...FLAGS, kind, previousId: old.diagnostic.assessmentId, currentId: next.diagnostic.assessmentId,
    previousStatus: old.diagnostic.status, currentStatus: next.diagnostic.status,
    revisionChanged, stageVectorChanged, completionActionChanged,
    added, resolved, continuing,
    note: "To porównanie dwóch odczytów, a nie dowód usunięcia problemów ani zgoda na wykonanie korekty. Sprawdź aktualność danych.",
  };
}
