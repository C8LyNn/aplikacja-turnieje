/** Pack 24: advisory SE triage with explicit dependencies; never grants mutation rights. */
import { captureSeAssessment, type SeAssessmentSnapshot } from "./se-diagnostic-comparison";
import { summarizeSeAssessmentHistory, type SeAssessmentHistory } from "./se-assessment-history";

export type SeResolution = "inspect_audit" | "refresh_snapshot" | "adjust_score" |
  "review_bracket" | "review_progression" | "manual_review";
export type SePriority = "critical" | "high" | "medium" | "review";
export interface SeTriageStep {
  readonly id: SeResolution;
  readonly priority: SePriority;
  readonly title: string;
  readonly instruction: string;
  readonly codes: readonly string[];
  readonly dependsOn: readonly SeResolution[];
  readonly recurringCodes: readonly string[];
  readonly persistentCodes: readonly string[];
}
export interface SeRemediationPriorityPlan {
  readonly version: 1;
  readonly kind: "se_remediation_priority";
  readonly advisoryOnly: true;
  readonly executionEnabled: false;
  readonly writePerformed: false;
  readonly status: "triage" | "no_blockers" | "inconsistent";
  readonly assessmentId: string | null;
  readonly primaryStep: SeResolution | null;
  readonly steps: readonly SeTriageStep[];
  readonly problemCount: number;
  readonly recurringCodes: readonly string[];
  readonly note: string;
}

const ACTIONS: Record<SeResolution, { priority: SePriority; title: string; instruction: string }> = {
  inspect_audit: { priority: "critical", title: "Sprawdź historię i integralność",
    instruction: "Porównaj historię wyników, aktywne wpisy audytu i uczestników; nie omijaj błędów integralności." },
  refresh_snapshot: { priority: "high", title: "Odśwież dane turnieju",
    instruction: "Pobierz nowy snapshot i ponów ocenę po zmianie rewizji meczu lub etapu." },
  adjust_score: { priority: "medium", title: "Popraw proponowany wynik",
    instruction: "Zweryfikuj rezultat BO i ponownie uruchom cały podgląd po zmianie wyniku." },
  review_bracket: { priority: "high", title: "Zweryfikuj drabinkę i mecz zależny",
    instruction: "Sprawdź obsadę właściwego slotu, numerację oraz stan meczu zależnego przed oceną awansów." },
  review_progression: { priority: "high", title: "Sprawdź skutki awansów i następnych faz",
    instruction: "Przejrzyj rozpoczęte mecze, zatwierdzone kwalifikacje i routing przed jakąkolwiek korektą." },
  manual_review: { priority: "review", title: "Przekaż przypadek do decyzji organizatora",
    instruction: "Ręczna ocena jest wymagana; wykonanie korekty SE pozostaje wyłączone." },
};
const PRIORITY_RANK: Record<SePriority, number> = { critical: 0, high: 1, medium: 2, review: 3 };
const ORDER: readonly SeResolution[] = [
  "inspect_audit", "refresh_snapshot", "adjust_score", "review_bracket", "review_progression", "manual_review",
];
const PREREQUISITES: Record<SeResolution, readonly SeResolution[]> = {
  inspect_audit: [], refresh_snapshot: [], adjust_score: [],
  review_bracket: ["inspect_audit", "refresh_snapshot", "adjust_score"],
  review_progression: ["inspect_audit", "refresh_snapshot", "adjust_score", "review_bracket"],
  manual_review: ["inspect_audit", "refresh_snapshot", "adjust_score", "review_bracket", "review_progression"],
};
const FLAGS = { version: 1, kind: "se_remediation_priority", advisoryOnly: true,
  executionEnabled: false, writePerformed: false } as const;
const NOTE = "Kolejność ma charakter doradczy; nie dowodzi usunięcia blokad ani nie uprawnia do korekty SE. " +
  "Powracająca blokada oznacza zmianę pomiędzy odczytami, nie potwierdzoną regresję backendu.";
const inconsistent = (): SeRemediationPriorityPlan => ({ ...FLAGS, status: "inconsistent",
  assessmentId: null, primaryStep: null, steps: [], problemCount: 0, recurringCodes: [],
  note: "Historia lub podgląd są niespójne. Wyczyść historię i wykonaj nową analizę. " + NOTE });

/** Only triage the most recent validated snapshot of the same intent; history never authorizes a mutation. */
export function deriveSeRemediationPriorityPlan(
  current: SeAssessmentSnapshot,
  history: SeAssessmentHistory,
): SeRemediationPriorityPlan {
  const valid = current && typeof current === "object" ? captureSeAssessment(current) : null;
  if (!valid || !history || history.issue || !Array.isArray(history.snapshots) ||
      history.snapshots.length < 1 || history.snapshots.length > 12 ||
      !Number.isSafeInteger(history.evicted) || history.evicted < 0 ||
      new Set(history.snapshots.map(item => item?.diagnostic?.assessmentId)).size !== history.snapshots.length ||
      history.snapshots.some(item => !item || typeof item !== "object" || !captureSeAssessment(item))) return inconsistent();
  const last = history.snapshots.at(-1)!;
  if (last.diagnostic.assessmentId !== valid.diagnostic.assessmentId ||
      last.tournamentId !== valid.tournamentId || last.matchId !== valid.matchId ||
      last.proposedScore1 !== valid.proposedScore1 || last.proposedScore2 !== valid.proposedScore2 ||
      last.stageVersionVector !== valid.stageVersionVector ||
      last.expectedCompletionActionId !== valid.expectedCompletionActionId ||
      JSON.stringify(last.diagnostic) !== JSON.stringify(valid.diagnostic) ||
      history.snapshots.some(item => item.tournamentId !== valid.tournamentId ||
        item.matchId !== valid.matchId || item.proposedScore1 !== valid.proposedScore1 ||
        item.proposedScore2 !== valid.proposedScore2)) return inconsistent();
  const summary = summarizeSeAssessmentHistory(history);
  if (summary.issue || summary.currentAssessmentId !== valid.diagnostic.assessmentId) return inconsistent();
  const groups = new Map<SeResolution, string[]>();
  for (const blocker of valid.diagnostic.blockers) {
    if (!Object.prototype.hasOwnProperty.call(ACTIONS, blocker.resolution)) return inconsistent();
    const key = blocker.resolution as SeResolution;
    groups.set(key, [...(groups.get(key) ?? []), blocker.code]);
  }
  const activeCodes = new Set(valid.diagnostic.blockers.map(b => b.code));
  const recurringCodes = [...new Set(summary.reappeared.map(e => e.code))].filter(code => activeCodes.has(code)).sort();
  const persistentCodes = new Set(summary.persistentCodes);
  const steps: SeTriageStep[] = ORDER.filter(key => groups.has(key)).map(id => ({
    id, ...ACTIONS[id], codes: [...new Set(groups.get(id)!)].sort(),
    dependsOn: PREREQUISITES[id].filter(parent => groups.has(parent)),
    recurringCodes: recurringCodes.filter(code => groups.get(id)!.includes(code)),
    persistentCodes: groups.get(id)!.filter(code => persistentCodes.has(code)).sort(),
  }));
  // Explicit dependency order is authoritative. Among simultaneously ready steps use risk priority.
  const sorted: SeTriageStep[] = [];
  const remaining = new Map(steps.map(s => [s.id, s]));
  while (remaining.size) {
    const available = [...remaining.values()].filter(step => step.dependsOn.every(id => !remaining.has(id)))
      .sort((a,b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
        ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
    if (!available.length) return inconsistent();
    const first = available[0];
    sorted.push(first);
    remaining.delete(first.id);
  }
  return { ...FLAGS, status: sorted.length ? "triage" : "no_blockers",
    assessmentId: valid.diagnostic.assessmentId, primaryStep: sorted[0]?.id ?? null,
    steps: sorted, problemCount: activeCodes.size, recurringCodes, note: NOTE };
}
