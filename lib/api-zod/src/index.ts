export * from "./generated/api";
export * from "./generated/types";

// Explicitly resolve four Orval model/type vs Zod value export collisions.
// Keep both the runtime Zod schemas and their TypeScript model types.
import type {
  AssessSingleEliminationCorrectionReadinessBody as AssessSingleEliminationCorrectionReadinessBodyType,
  GetSingleEliminationCorrectionSafetyParams as GetSingleEliminationCorrectionSafetyParamsType,
  PrepareControlledCorrectionIntentBody as PrepareControlledCorrectionIntentBodyType,
  PreviewTournamentResultCorrectionBody as PreviewTournamentResultCorrectionBodyType,
} from "./generated/types";

export {
  AssessSingleEliminationCorrectionReadinessBody,
  GetSingleEliminationCorrectionSafetyParams,
  PrepareControlledCorrectionIntentBody,
  PreviewTournamentResultCorrectionBody,
} from "./generated/api";

export type AssessSingleEliminationCorrectionReadinessBody = AssessSingleEliminationCorrectionReadinessBodyType;
export type GetSingleEliminationCorrectionSafetyParams = GetSingleEliminationCorrectionSafetyParamsType;
export type PrepareControlledCorrectionIntentBody = PrepareControlledCorrectionIntentBodyType;
export type PreviewTournamentResultCorrectionBody = PreviewTournamentResultCorrectionBodyType;
