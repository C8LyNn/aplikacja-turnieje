// No runtime override: enabling V3 restore requires separately reviewed
// authorization, issuer validation and real isolated database acceptance tests.
export const BACKUP_V3_IMPORT_DISABLED = {
  code: "BACKUP_V3_IMPORT_DISABLED",
  error: "Import Backup V3 jest wyłączony do czasu zatwierdzenia zabezpieczeń i testów odtwarzania na odrębnej bazie. Eksport pozostaje dostępny.",
} as const;

export function isBackupV3Import(input: Record<string, unknown>): boolean {
  return input.schemaVersion === 3 || input.schemaVersion === "3" ||
    input.version === 3 || input.version === "3";
}

export const BACKUP_V2_CONTAINS_V3_FIELDS = {
  code: "BACKUP_V2_CONTAINS_V3_FIELDS",
  error: "Backup oznaczony jako V2 zawiera pola V3. Import przerwano, aby nie pominąć danych.",
} as const;

const v3OnlyRootFields = [
  "stages", "groups", "stageParticipants", "marvelRounds", "marvelGroups",
  "marvelGroupEntries", "stageBaskets", "stageBasketRoutes", "deadlockBans",
  "gamePicks", "routingPlan", "routingExecutions", "qualificationProposals",
  "routeExecutions",
] as const;
const v3OnlyTournamentFields = ["basketFlowAuthorityVersion", "activeStageBackupId", "gameConfig"] as const;
const v3OnlyMatchFields = ["stageBackupId", "stageGroupBackupId", "routingMatchKey"] as const;

function containsOwnField(value: unknown, fields: readonly string[]): boolean {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    fields.some((field) => Object.prototype.hasOwnProperty.call(value, field));
}

function arrayContainsOwnField(value: unknown, fields: readonly string[]): boolean {
  return Array.isArray(value) && value.some((item) => containsOwnField(item, fields));
}

// Inspect only the defined V2 paths: actionLog[].undoPayload permits arbitrary
// keys and must not be recursively inspected for V3-looking names.
export function hasV3OnlyFieldsInV2(input: Record<string, unknown>): boolean {
  if (input.schemaVersion !== 2) return false;
  return containsOwnField(input, v3OnlyRootFields) ||
    containsOwnField(input.tournament, v3OnlyTournamentFields) ||
    arrayContainsOwnField(input.matches, v3OnlyMatchFields) ||
    arrayContainsOwnField(input.resultHistory, ["stageBackupId"]) ||
    arrayContainsOwnField(input.actionLog, ["stageBackupId"]);
}
