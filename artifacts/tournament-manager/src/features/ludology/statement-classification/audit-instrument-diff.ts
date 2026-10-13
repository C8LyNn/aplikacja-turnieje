import type { AuditInstrumentSnapshots } from "./audit-instrument-snapshot";

export type InstrumentChange = {
  instrument: "codebook" | "proposition" | "sampling_plan";
  entityId: string;
  field: string;
  kind: "added" | "removed" | "modified";
  before: string | null;
  after: string | null;
};

type SnapshotContents = {
  book: Record<string, unknown>;
  propositions: Map<string, Record<string, unknown>>;
  plan: Record<string, unknown> | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readJSON(raw: string, context: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Nie można odczytać definicji: ${context}.`);
  }
}

/**
 * Instrument snapshots are canonical JSON, with proposition objects serialized
 * as JSON strings inside the outer codebook object (legacy v3.5 format).
 * Untrusted imported files are parsed and checked without evaluating any code.
 */
function readSnapshot(input: AuditInstrumentSnapshots): SnapshotContents {
  const object = readJSON(input.codebook, "codebook");
  if (!isRecord(object) || !isRecord(object.book) ||
      typeof object.book.id !== "string" || !object.book.id ||
      !Array.isArray(object.propositions)) {
    throw new Error("Niepoprawna struktura migawki codebooka.");
  }
  const propositions = new Map<string, Record<string, unknown>>();
  for (const raw of object.propositions) {
    if (typeof raw !== "string") throw new Error("Niepoprawna migawka mikrostanowiska.");
    const item = readJSON(raw, "mikrostanowisko");
    if (!isRecord(item) || typeof item.id !== "string" || !item.id ||
        item.codebookId !== object.book.id || propositions.has(item.id)) {
      throw new Error("Niepoprawny identyfikator lub powielone mikrostanowisko.");
    }
    propositions.set(item.id, item);
  }

  let plan: Record<string, unknown> | null = null;
  if (input.samplingPlan !== null) {
    const parsed = readJSON(input.samplingPlan, "plan próbkowania");
    if (!isRecord(parsed) || typeof parsed.id !== "string" || !parsed.id) {
      throw new Error("Niepoprawna migawka planu próbkowania.");
    }
    plan = parsed;
  }
  return { book: object.book, propositions, plan };
}

/** Validate entire embedded snapshot so the audit importer rejects corrupt nested JSON. */
export function validateInstrumentSnapshot(
  input: AuditInstrumentSnapshots,
  expected: { codebookId: string; codebookVersion: string; planId: string | null; planVersion: string | null },
): void {
  const parsed = readSnapshot(input);
  if (parsed.book.id !== expected.codebookId || parsed.book.version !== expected.codebookVersion ||
      (parsed.plan?.id ?? null) !== expected.planId ||
      (parsed.plan?.version ?? null) !== expected.planVersion) {
    throw new Error("Migawka definicji jest niezgodna z identyfikatorami lub wersjami raportu.");
  }
}

function renderValue(value: unknown): string | null {
  return value === undefined ? null : JSON.stringify(value);
}
function addChanges(
  target: InstrumentChange[],
  instrument: InstrumentChange["instrument"],
  entityId: string,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): void {
  const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])].sort();
  for (const field of keys) {
    const previous = renderValue(before?.[field]);
    const current = renderValue(after?.[field]);
    if (previous === current) continue;
    target.push({
      instrument, entityId, field,
      kind: previous === null ? "added" : current === null ? "removed" : "modified",
      before: previous, after: current,
    });
  }
}

/**
 * A read-only diagnosis; it does not authorize numerical comparisons.
 * Missing legacy snapshots are signalled separately, never guessed.
 */
export function diffAuditInstruments(
  before: AuditInstrumentSnapshots,
  after: AuditInstrumentSnapshots,
): InstrumentChange[] {
  const left = readSnapshot(before);
  const right = readSnapshot(after);
  const changes: InstrumentChange[] = [];
  addChanges(changes, "codebook", String(right.book.id ?? left.book.id), left.book, right.book);
  const ids = [...new Set([...left.propositions.keys(), ...right.propositions.keys()])].sort();
  for (const id of ids) {
    addChanges(changes, "proposition", id, left.propositions.get(id) ?? null, right.propositions.get(id) ?? null);
  }
  if (left.plan !== null || right.plan !== null) {
    addChanges(changes, "sampling_plan", String(right.plan?.id ?? left.plan?.id), left.plan, right.plan);
  }
  return changes;
}
