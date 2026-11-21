import { t } from "@/i18n";
import type { TournamentBackup } from "@workspace/api-client-react";

export type TournamentBackupFile = TournamentBackup;

export type ParsedBackupFile =
  | { ok: true; backup: TournamentBackupFile }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function parseTournamentBackupFile(contents: string): ParsedBackupFile {
  let value: unknown;
  try {
    value = JSON.parse(contents);
  } catch {
    return {
      ok: false,
      error: t("backupFile.nie_mozna_odczytac_pliku_plik"),
    };
  }

  if (!isRecord(value)) {
    return { ok: false, error: t("backupFile.plik_nie_wyglada_jak_backup") };
  }

  if (value["version"] === "1" || value["version"] === 1 || value["schemaVersion"] === 1) {
    return {
      ok: false,
      error: t("backupFile.nieobslugiwany_format_legacy_backupu_v1"),
    };
  }

  if (value["schemaVersion"] !== 2 && value["schemaVersion"] !== 3) {
    return {
      ok: false,
      error: t("backupFile.nieobslugiwana_wersja_backupu_v0_wymagan", { v0: String(value["schemaVersion"] ?? t("backupFile.brak")) }),
    };
  }

  if (Number(value["schemaVersion"]) === 3) {
    return {
      ok: false,
      error: t("backupFile.import_backup_v3_jest_wylaczony"),
    };
  }

  if (
    value["resultModelVersion"] !== "series_v1" ||
    value["rankingPolicy"] !== "match_record_v1"
  ) {
    return {
      ok: false,
      error: t("backupFile.backup_nie_uzywa_wymaganego_modelu"),
    };
  }

  if (
    !isRecord(value["tournament"]) ||
    !Array.isArray(value["players"]) ||
    !Array.isArray(value["matches"]) ||
    !Array.isArray(value["resultHistory"]) ||
    !Array.isArray(value["actionLog"]) ||
    (value["schemaVersion"] === 3 &&
      (!Array.isArray(value["stages"]) ||
        !Array.isArray(value["groups"]) ||
        !Array.isArray(value["stageParticipants"])))
  ) {
    return { ok: false, error: t("backupFile.plik_nie_wyglada_jak_kompletny", { v0: value["schemaVersion"] }) };
  }

  return { ok: true, backup: value as unknown as TournamentBackupFile };
}
