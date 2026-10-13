export type EvidenceLevel = "direct" | "argumentative" | "inferred";
export type CodingConfidence = "low" | "medium" | "high";
export type DirectionScore = -2 | -1 | 0 | 1 | 2;
export type ExplicitnessScore = 0 | 1 | 2 | 3;
export type CodebookStatus = "draft" | "pilot" | "active" | "retired";
export type DimensionModelStatus = "draft" | "pilot" | "active" | "retired";
export type DimensionLinkOrientation = "positive" | "negative";
export type DimensionLinkRelevance = "core" | "supporting" | "exploratory";
export type SamplingPlanStatus = "draft" | "active" | "retired";
export type DiscussionStatus = "draft" | "active" | "closed" | "archived";
export type DiscussionArgumentRole = "primary" | "response" | "follow_up" | "background";
export type ArgumentRelationType =
  | "responds_to"
  | "supports"
  | "challenges"
  | "clarifies"
  | "extends";
export type PositionAssessmentStatus =
  | "insufficient_evidence"
  | "stable"
  | "context_dependent"
  | "contradictory"
  | "position_change";

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

/** Append-only adjudication audit event. Original coder observations are never edited. */
export type CodingAdjudication = {
  id: string;
  codebookId: string;
  excerptId: string;
  propositionId: string;
  codingAId: string;
  codingBId: string;
  codingASnapshot: string;
  codingBSnapshot: string;
  excerptSnapshot: string;
  reviewerId: string;
  decision: "resolved" | "deferred";
  /** null means N/A, not neutral 0. Deferred events always contain null. */
  direction: DirectionScore | null;
  rationale: string;
  createdAt: string;
};

export type PositionAssessment = {
  id: string;
  personId: string;
  propositionId: string;
  codebookId: string;
  reviewerId?: string;
  status: PositionAssessmentStatus;
  direction: DirectionScore | null;
  confidence: CodingConfidence;
  synthesis?: string;
  evidenceSignature?: string;
  updatedAt: string;
};

export type DimensionModel = {
  id: string;
  name: string;
  version: string;
  codebookId: string;
  status: DimensionModelStatus;
  description?: string;
  createdAt?: string;
};

export type ResearchDimension = {
  id: string;
  dimensionModelId: string;
  code: string;
  label: string;
  negativePoleLabel: string;
  positivePoleLabel: string;
  description?: string;
  notes?: string;
  order?: number;
};

export type DimensionPropositionLink = {
  id: string;
  dimensionModelId: string;
  dimensionId: string;
  propositionId: string;
  orientation: DimensionLinkOrientation;
  relevance: DimensionLinkRelevance;
  rationale?: string;
};

export type SamplingPlan = {
  id: string;
  name: string;
  version: string;
  status: SamplingPlanStatus;
  minimumSourcesPerPerson: number;
  minimumSourceTypesPerPerson: number;
  minimumPurposesPerPerson: number;
  minimumPreparednessModesPerPerson: number;
  minimumScopesPerPerson: number;
  minimumDatedSourceShare: number | null;
  maximumSingleSourceTypeShare: number | null;
  minimumTemporalSpanYears: number | null;
  notes?: string;
  createdAt?: string;
};

export type ResearchDiscussion = {
  id: string;
  title: string;
  question?: string;
  description?: string;
  status: DiscussionStatus;
  tags?: string[];
  createdAt?: string;
};

export type DiscussionArgumentLink = {
  id: string;
  discussionId: string;
  argumentId: string;
  role: DiscussionArgumentRole;
  note?: string;
  order?: number;
};

export type ArgumentRelation = {
  id: string;
  discussionId: string;
  fromArgumentId: string;
  toArgumentId: string;
  relation: ArgumentRelationType;
  note?: string;
};

export type ResearchProjectData = {
  schemaVersion: 8;
  people: ResearchPerson[];
  sources: ResearchSource[];
  arguments: ResearchArgument[];
  excerpts: ResearchExcerpt[];
  codebooks: Codebook[];
  propositions: Proposition[];
  coders: Coder[];
  codings: CodingRecord[];
  adjudications: CodingAdjudication[];
  assessments: PositionAssessment[];
  dimensionModels: DimensionModel[];
  dimensions: ResearchDimension[];
  dimensionLinks: DimensionPropositionLink[];
  samplingPlans: SamplingPlan[];
  discussions: ResearchDiscussion[];
  discussionLinks: DiscussionArgumentLink[];
  argumentRelations: ArgumentRelation[];
};

export const EMPTY_RESEARCH_PROJECT: ResearchProjectData = {
  schemaVersion: 8,
  people: [],
  sources: [],
  arguments: [],
  excerpts: [],
  codebooks: [],
  propositions: [],
  coders: [],
  codings: [],
  adjudications: [],
  assessments: [],
  dimensionModels: [],
  dimensions: [],
  dimensionLinks: [],
  samplingPlans: [],
  discussions: [],
  discussionLinks: [],
  argumentRelations: [],
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
