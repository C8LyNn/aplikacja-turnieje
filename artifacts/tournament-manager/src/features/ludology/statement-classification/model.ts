export type EvidenceLevel = "direct" | "indirect" | "inferred";
export type CodingConfidence = "low" | "medium" | "high";

export type ResearchPerson = {
  id: string;
  displayName: string;
  notes?: string;
};

export type ResearchSource = {
  id: string;
  personId: string;
  title: string;
  url: string;
  sourceType: "video" | "stream" | "post" | "article" | "other";
  publishedAt?: string;
};

export type ResearchExcerpt = {
  id: string;
  sourceId: string;
  text: string;
  timestampStart?: number;
  timestampEnd?: number;
  context?: string;
};

export type Proposition = {
  id: string;
  label: string;
  description: string;
  parentId?: string;
};

export type CodingRecord = {
  id: string;
  excerptId: string;
  propositionId: string;
  code: string;
  evidenceLevel: EvidenceLevel;
  confidence: CodingConfidence;
  coderId?: string;
  note?: string;
};

export const EVIDENCE_LEVEL_LABELS: Record<EvidenceLevel, string> = {
  direct: "Bezpośrednie",
  indirect: "Pośrednie",
  inferred: "Wnioskowane",
};
