/** Pack 23: bounded, volatile diagnostic history. NEVER grants SE correction permission. */
import {
  captureSeAssessment,
  type SeAssessmentSnapshot,
  type SeAssessmentBlocker,
} from "./se-diagnostic-comparison";

/** Intentionally small: all data lives only in the mounted component, not localStorage or a database. */
export const SE_HISTORY_LIMIT = 12;
export type SeHistoryIssue = "invalid_snapshot" | "conflicting_assessment_id" | null;
export interface SeAssessmentHistory {
  readonly snapshots: readonly SeAssessmentSnapshot[];
  readonly evicted: number;
  readonly issue: SeHistoryIssue;
}
export type SeBlockerEventType = "introduced" | "resolved" | "reappeared";
export interface SeBlockerEvent {
  readonly type: SeBlockerEventType;
  readonly code: string;
  readonly title: string;
  /** Index in the currently retained history (0 is the oldest retained assessment). */
  readonly at: number;
  readonly assessmentId: string;
}
export interface SeAssessmentHistorySummary {
  readonly advisoryOnly: true;
  readonly executionEnabled: false;
  readonly writePerformed: false;
  readonly count: number;
  readonly evicted: number;
  readonly issue: SeHistoryIssue;
  readonly currentAssessmentId: string | null;
  readonly currentStatus: "candidate" | "blocked" | null;
  readonly events: readonly SeBlockerEvent[];
  /** Blockers seen, absent in a later assessment, and subsequently seen again. */
  readonly reappeared: readonly SeBlockerEvent[];
  /** Codes present in every retained assessment, including the most recent. */
  readonly persistentCodes: readonly string[];
  readonly revisionChanges: number;
  readonly stageVectorChanges: number;
  readonly completionActionChanges: number;
  readonly advisoryNote: string;
}

export function emptySeAssessmentHistory(): SeAssessmentHistory {
  return { snapshots: [], evicted: 0, issue: null };
}

function sameIntent(a: SeAssessmentSnapshot, b: SeAssessmentSnapshot): boolean {
  return a.tournamentId === b.tournamentId && a.matchId === b.matchId &&
    a.proposedScore1 === b.proposedScore1 && a.proposedScore2 === b.proposedScore2;
}

function sameSnapshot(a: SeAssessmentSnapshot, b: SeAssessmentSnapshot): boolean {
  return a.stageVersionVector === b.stageVersionVector &&
    a.expectedCompletionActionId === b.expectedCompletionActionId &&
    JSON.stringify(a.diagnostic) === JSON.stringify(b.diagnostic);
}

/**
 * Fail closed for corrupt input and duplicate assessment IDs with different evidence.
 * A different correction intentionally starts a separate timeline. Repeated identical reads
 * are collapsed; a retention eviction is reported, never hidden.
 */
export function appendSeAssessmentHistory(
  history: SeAssessmentHistory,
  incoming: SeAssessmentSnapshot,
): SeAssessmentHistory {
  const valid = captureSeAssessment(incoming);
  if (!valid) return { snapshots: [], evicted: 0, issue: "invalid_snapshot" };
  const latest = history.snapshots.at(-1);
  if (latest && !sameIntent(latest, valid)) {
    return { snapshots: [valid], evicted: 0, issue: null };
  }
  if (history.issue || history.snapshots.some((s) => !captureSeAssessment(s))) {
    return { snapshots: [valid], evicted: 0, issue: null };
  }
  const sameId = history.snapshots.find((s) => s.diagnostic.assessmentId === valid.diagnostic.assessmentId);
  if (sameId) {
    if (!sameSnapshot(sameId, valid)) {
      return { snapshots: [], evicted: 0, issue: "conflicting_assessment_id" };
    }
    // A repeated historical ID after other IDs is ambiguous, not a new event.
    return history;
  }
  const all = [...history.snapshots, valid];
  const extra = Math.max(0, all.length - SE_HISTORY_LIMIT);
  return { snapshots: all.slice(extra), evicted: history.evicted + extra, issue: null };
}

function blockerMap(snapshot: SeAssessmentSnapshot): Map<string, SeAssessmentBlocker> {
  return new Map(snapshot.diagnostic.blockers.map((b) => [b.code, b]));
}

export function summarizeSeAssessmentHistory(history: SeAssessmentHistory): SeAssessmentHistorySummary {
  const snapshots = history.snapshots;
  const flags = { advisoryOnly: true, executionEnabled: false, writePerformed: false } as const;
  const events: SeBlockerEvent[] = [];
  const seen = new Set<string>();
  let revisionChanges = 0;
  let stageVectorChanges = 0;
  let completionActionChanges = 0;
  const current = snapshots.at(-1);
  // Oldest retained state is a baseline, not a newly introduced issue.
  const baseline = snapshots[0];
  if (baseline) for (const b of baseline.diagnostic.blockers) seen.add(b.code);
  for (let i = 1; i < snapshots.length; i++) {
    const older = snapshots[i - 1];
    const newer = snapshots[i];
    // Do not infer a trend or attribution if snapshots describe different corrections.
    if (!sameIntent(older, newer) || !captureSeAssessment(newer)) continue;
    if (older.diagnostic.expectedMatchRevision !== newer.diagnostic.expectedMatchRevision) revisionChanges++;
    if (older.stageVersionVector !== newer.stageVersionVector) stageVectorChanges++;
    if (older.expectedCompletionActionId !== newer.expectedCompletionActionId) completionActionChanges++;
    const from = blockerMap(older);
    const to = blockerMap(newer);
    for (const b of newer.diagnostic.blockers) {
      if (!from.has(b.code)) {
        events.push({ type: seen.has(b.code) ? "reappeared" : "introduced",
          code: b.code, title: b.title, at: i, assessmentId: newer.diagnostic.assessmentId });
      }
      seen.add(b.code);
    }
    for (const b of older.diagnostic.blockers) if (!to.has(b.code)) {
      events.push({ type: "resolved", code: b.code, title: b.title, at: i,
        assessmentId: newer.diagnostic.assessmentId });
    }
  }
  const persistentCodes = baseline && current
    ? baseline.diagnostic.blockers.filter((b) => snapshots.every((s) =>
        s.diagnostic.blockers.some((c) => c.code === b.code))).map((b) => b.code)
    : [];
  return {
    ...flags, count: snapshots.length, evicted: history.evicted, issue: history.issue,
    currentAssessmentId: current?.diagnostic.assessmentId ?? null,
    currentStatus: current?.diagnostic.status ?? null,
    events, reappeared: events.filter((e) => e.type === "reappeared"),
    persistentCodes, revisionChanges, stageVectorChanges, completionActionChanges,
    advisoryNote: "Historia dotyczy tylko tej sesji widoku i ostatnich 12 unikalnych analiz. " +
      "Wykryta ponownie blokada oznacza różnicę między odczytami, nie potwierdzoną regresję backendu. " +
      "Żaden wpis historii nie uprawnia do wykonania korekty.",
  };
}
