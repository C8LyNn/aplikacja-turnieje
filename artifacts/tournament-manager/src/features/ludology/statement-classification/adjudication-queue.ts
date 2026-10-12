import { adjudicationIssue, canonicalCodingPair, latestCodingAdjudication } from "./adjudication-protocol";
import type { CodingRecord, DirectionScore, ResearchProjectData } from "./model";

export type AdjudicationQueueStatus = "pending" | "blocked" | "deferred" | "resolved" | "needs_review";
export type AdjudicationPriority = "high" | "medium" | "low";

export type AdjudicationQueueItem = {
  key: string;
  codebookId: string;
  excerptId: string;
  propositionId: string;
  personId: string | null;
  sourceId: string | null;
  codingAId: string | null;
  codingBId: string | null;
  coderAId: string;
  coderBId: string;
  directionA: DirectionScore | null;
  directionB: DirectionScore | null;
  status: AdjudicationQueueStatus;
  priority: AdjudicationPriority;
  reason: string;
  adjudicationId: string | null;
  adjudicationDirection: DirectionScore | null;
  adjudicationRationale: string | null;
  adjudicationDate: string | null;
};

export type AdjudicationQueueSummary = {
  total: number;
  pending: number;
  blocked: number;
  deferred: number;
  resolved: number;
  needs_review: number;
};

/** Pair-wise disagreements, not independent excerpts; 3 coders may yield 3 pairs. */
export function buildAdjudicationQueue(data: ResearchProjectData, codebookId: string): AdjudicationQueueItem[] {
  const units = new Map<string, Map<string, CodingRecord[]>>();
  for (const record of data.codings) {
    if (record.codebookId !== codebookId) continue;
    const unitKey = JSON.stringify([record.excerptId, record.propositionId]);
    const coders = units.get(unitKey) ?? new Map<string, CodingRecord[]>();
    const records = coders.get(record.coderId) ?? [];
    records.push(record);
    coders.set(record.coderId, records);
    units.set(unitKey, coders);
  }

  const excerpts = new Map(data.excerpts.map((excerpt) => [excerpt.id, excerpt]));
  const sources = new Map(data.sources.map((source) => [source.id, source]));
  const result: AdjudicationQueueItem[] = [];

  for (const [unitKey, coders] of units) {
    const [excerptId, propositionId] = JSON.parse(unitKey) as [string, string];
    const entries = [...coders.entries()].sort(([a], [b]) => a.localeCompare(b));
    const excerpt = excerpts.get(excerptId);
    const source = excerpt ? sources.get(excerpt.sourceId) : undefined;

    for (let a = 0; a < entries.length; a += 1) {
      for (let b = a + 1; b < entries.length; b += 1) {
        const left = entries[a];
        const right = entries[b];
        if (!left || !right) continue;
        const [coderAId, recordsA] = left;
        const [coderBId, recordsB] = right;
        const recordA = recordsA.length === 1 ? recordsA[0] : undefined;
        const recordB = recordsB.length === 1 ? recordsB[0] : undefined;
        // Duplicate coder assignments cannot produce a reliable comparison.
        const duplicated = !recordA || !recordB;
        const directionA = recordA?.direction ?? null;
        const directionB = recordB?.direction ?? null;
        if (!duplicated && directionA === directionB) continue;

        const latest = recordA && recordB
          ? latestCodingAdjudication(data, recordA.id, recordB.id)
          : undefined;
        const staleReason = latest ? adjudicationIssue(data, latest) : null;
        let status: AdjudicationQueueStatus = "pending";
        let reason = "Brak decyzji recenzenta.";
        if (duplicated) {
          status = "blocked";
          reason = "Duplikaty kodowań tego samego kodera — najpierw napraw integralność.";
        } else if (!excerpt || !source || excerpt.verificationStatus !== "verified") {
          status = "blocked";
          reason = "Niezweryfikowany fragment lub brak źródła.";
        } else if (staleReason) {
          status = "needs_review";
          reason = staleReason;
        } else if (latest?.decision === "resolved") {
          status = "resolved";
          reason = "Zapisano rozstrzygnięcie.";
        } else if (latest?.decision === "deferred") {
          status = "deferred";
          reason = "Decyzję odroczono.";
        }
        const priority: AdjudicationPriority =
          directionA !== null && directionB !== null && directionA * directionB < 0
            ? "high"
            : directionA === null || directionB === null
              ? "medium"
              : "low";

        result.push({
          key: canonicalCodingPair(recordA?.id ?? coderAId, recordB?.id ?? coderBId),
          codebookId, excerptId, propositionId,
          personId: source?.personId ?? null, sourceId: source?.id ?? null,
          codingAId: recordA?.id ?? null, codingBId: recordB?.id ?? null,
          coderAId, coderBId, directionA, directionB,
          status, priority, reason,
          adjudicationId: latest?.id ?? null,
          adjudicationDirection: latest?.direction ?? null,
          adjudicationRationale: latest?.rationale ?? null,
          adjudicationDate: latest?.createdAt ?? null,
        });
      }
    }
  }

  const statusRank: Record<AdjudicationQueueStatus, number> = {
    needs_review: 0, pending: 1, deferred: 2, blocked: 3, resolved: 4,
  };
  const priorityRank: Record<AdjudicationPriority, number> = { high: 0, medium: 1, low: 2 };
  return result.sort((a, b) =>
    statusRank[a.status] - statusRank[b.status] ||
    priorityRank[a.priority] - priorityRank[b.priority] ||
    a.key.localeCompare(b.key)
  );
}

export function summarizeAdjudicationQueue(items: readonly AdjudicationQueueItem[]): AdjudicationQueueSummary {
  const result: AdjudicationQueueSummary = {
    total: items.length, pending: 0, blocked: 0, deferred: 0, resolved: 0, needs_review: 0,
  };
  for (const item of items) result[item.status] += 1;
  return result;
}

function csvCell(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? "" : String(value);
  // Prevent spreadsheet formula injection, including whitespace-prefixed formulas.
  const safe = /^\s*[=+\-@\t\r]/u.test(raw) ? "'" + raw : raw;
  return '"' + safe.replace(/"/g, '""') + '"';
}

export function exportAdjudicationQueueCsv(
  data: ResearchProjectData,
  entries: readonly AdjudicationQueueItem[],
): string {
  const headers = [
    "pair_key", "status", "priority", "codebook_id", "excerpt_id",
    "proposition_id", "proposition_code", "person_id", "source_id", "source_title",
    "source_url", "coder_a_id", "direction_a", "coder_b_id", "direction_b",
    "adjudication_id", "adjudicated_direction", "adjudication_date",
    "adjudication_rationale", "reason",
  ];
  const rows = entries.map((entry) => {
    const proposition = data.propositions.find((item) => item.id === entry.propositionId);
    const source = data.sources.find((item) => item.id === entry.sourceId);
    return [
      entry.key, entry.status, entry.priority, entry.codebookId, entry.excerptId,
      entry.propositionId, proposition?.code, entry.personId, entry.sourceId,
      source?.title, source?.url, entry.coderAId, entry.directionA === null ? "N/A" : String(entry.directionA),
      entry.coderBId, entry.directionB === null ? "N/A" : String(entry.directionB),
      entry.adjudicationId, entry.adjudicationId ? (entry.adjudicationDirection === null ? "N/A" : String(entry.adjudicationDirection)) : "",
      entry.adjudicationDate, entry.adjudicationRationale, entry.reason,
    ].map(csvCell).join(",");
  });
  // One versioned codebook; no composite quality or ideological score.
  return "\uFEFF" + [headers.map(csvCell).join(","), ...rows].join("\r\n") + "\r\n";
}
