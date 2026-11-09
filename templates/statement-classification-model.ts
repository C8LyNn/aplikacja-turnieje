export type EvidenceLevel = "A" | "B" | "C";
export type DirectionScore = -2 | -1 | 0 | 1 | 2;
export type ExplicitnessScore = 0 | 1 | 2 | 3;

export type StatementPerson = {
  id: string;
  name: string;
  createdAt: string;
};

export type StatementSource = {
  id: string;
  personId: string;
  title: string;
  url: string;
  publishedAt: string | null;
  sourceType: string;
  notes: string;
  createdAt: string;
};

export type StatementFragment = {
  id: string;
  sourceId: string;
  text: string;
  summary: string;
  timestamp: string;
  topic: string;
  context: string;
  createdAt: string;
};

export type StatementCoding = {
  id: string;
  fragmentId: string;
  microPosition: string;
  dimension: string;
  direction: DirectionScore | null;
  explicitness: ExplicitnessScore;
  evidenceLevel: EvidenceLevel;
  confidence: number;
  rationale: string;
  createdAt: string;
};

export type StatementProjectData = {
  version: 1;
  people: StatementPerson[];
  sources: StatementSource[];
  fragments: StatementFragment[];
  codings: StatementCoding[];
};

const STORAGE_KEY = "statement_classification_v1";

export const EMPTY_STATEMENT_PROJECT: StatementProjectData = {
  version: 1,
  people: [],
  sources: [],
  fragments: [],
  codings: [],
};

export function createStatementId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function loadStatementProject(): StatementProjectData {
  if (typeof window === "undefined") return EMPTY_STATEMENT_PROJECT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATEMENT_PROJECT;
    const parsed = JSON.parse(raw) as Partial<StatementProjectData>;
    return {
      version: 1,
      people: Array.isArray(parsed.people) ? parsed.people : [],
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      fragments: Array.isArray(parsed.fragments) ? parsed.fragments : [],
      codings: Array.isArray(parsed.codings) ? parsed.codings : [],
    };
  } catch {
    return EMPTY_STATEMENT_PROJECT;
  }
}

export function saveStatementProject(data: StatementProjectData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
