export type EvidenceLevel = "direct" | "argumentative" | "inferred";
export type CodingConfidence = "low" | "medium" | "high";
export type DirectionScore = -2 | -1 | 0 | 1 | 2;
export type ExplicitnessScore = 0 | 1 | 2 | 3;
export type CodebookStatus = "draft" | "pilot" | "active" | "retired";

export type ResearchPerson = {
  id: string;
  displayName: string;
  description?: string;
  notes?: string;
  createdAt?: string;
};

export type ResearchSource = {
  id: string;
  personId: string;
  title: string;
  url: string;
  sourceType: "video" | "stream" | "podcast" | "post" | "article" | "academic" | "other";
  publishedAt?: string;
  purpose?: "review" | "essay" | "debate" | "interview" | "casual" | "social_post" | "academic";
  preparedness?: "prepared" | "semi_prepared" | "spontaneous";
  scope?: "specific_game" | "genre" | "games_general" | "definition_of_game" | "other";
  language?: string;
  transcript?: string;
  transcriptType?: "official" | "manual" | "automatic" | "unknown";
  notes?: string;
};

export type ResearchArgument = {
  id: string;
  sourceId: string;
  title?: string;
  summary?: string;
  timestampStart?: number;
  timestampEnd?: number;
  topic?: string;
  notes?: string;
};

export type ResearchExcerpt = {
  id: string;
  sourceId: string;
  argumentId?: string;
  text: string;
  timestampStart?: number;
  timestampEnd?: number;
  contextBefore?: string;
  contextAfter?: string;
  topic?: string;
  speaker?: string;
  isResponseToSomeone?: boolean;
  verificationStatus?: "unverified" | "checked" | "verified";
};

export type Codebook = {
  id: string;
  name: string;
  version: string;
  status: CodebookStatus;
  description?: string;
  createdAt?: string;
};

export type Proposition = {
  id: string;
  codebookId: string;
  code: string;
  label: string;
  definition: string;
  includeRules?: string[];
  excludeRules?: string[];
  positiveExamples?: string[];
  negativeExamples?: string[];
  borderlineExamples?: string[];
  parentId?: string;
};

export type Coder = {
  id: string;
  displayName: string;
  type: "human" | "ai";
};

export type CodingRecord = {
  id: string;
  excerptId: string;
  propositionId: string;
  coderId: string;
  codebookId: string;
  direction: DirectionScore | null;
  explicitness: ExplicitnessScore;
  evidenceLevel: EvidenceLevel;
  confidence: CodingConfidence;
  rationale?: string;
  note?: string;
  createdAt?: string;
};

export type ResearchProjectData = {
  schemaVersion: 2;
  people: ResearchPerson[];
  sources: ResearchSource[];
  arguments: ResearchArgument[];
  excerpts: ResearchExcerpt[];
  codebooks: Codebook[];
  propositions: Proposition[];
  coders: Coder[];
  codings: CodingRecord[];
};

export const EMPTY_RESEARCH_PROJECT: ResearchProjectData = {
  schemaVersion: 2,
  people: [],
  sources: [],
  arguments: [],
  excerpts: [],
  codebooks: [],
  propositions: [],
  coders: [],
  codings: [],
};

export const EVIDENCE_LEVEL_LABELS: Record<EvidenceLevel, string> = {
  direct: "Bezpośrednia deklaracja",
  argumentative: "Wyraźna argumentacja",
  inferred: "Interpretacja / wnioskowanie",
};

export const EXPLICITNESS_LABELS: Record<ExplicitnessScore, string> = {
  0: "Bardzo pośrednie",
  1: "Implikowane",
  2: "Wyraźne",
  3: "Powiedziane wprost",
};
