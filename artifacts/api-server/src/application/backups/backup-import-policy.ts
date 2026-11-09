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
