import type { Response } from "express";

/**
 * V5.7 · optimistic concurrency for every operation that changes a match's state. The client sends the
 * revision it read; a different current revision means someone else changed the match meanwhile.
 */
export const REVISION_REQUIRED_MESSAGE = "Brakuje wersji meczu (expectedRevision). Odśwież mecz i spróbuj ponownie.";

export class MatchRevisionConflict extends Error {
  constructor(public readonly current: { revision: number; status: string }) {
    super("Mecz zmienił się od czasu, gdy go otwarto (np. w innym oknie albo u innej osoby). Odśwież i sprawdź aktualny stan przed ponowieniem.");
    this.name = "MatchRevisionConflict";
  }
}

export function readExpectedRevision(body: unknown): number | null {
  const value = body && typeof body === "object" ? (body as Record<string, unknown>).expectedRevision : undefined;
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1 ? value : null;
}

export function sendRevisionConflict(res: Response, error: MatchRevisionConflict): void {
  res.status(409).json({
    error: error.message,
    code: "CONCURRENT_MODIFICATION",
    current: { revision: error.current.revision, status: error.current.status },
  });
}
