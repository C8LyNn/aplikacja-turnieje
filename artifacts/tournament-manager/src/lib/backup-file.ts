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
      error: "Nie można odczytać pliku. Plik jest uszkodzony lub nie jest prawidłowym JSON-em.",
    };
  }

  if (!isRecord(value)) {
    return { ok: false, error: "Plik nie wygląda jak backup Tournament Manager." };
  }

  if (value["version"] === "1" || value["version"] === 1 || value["schemaVersion"] === 1) {
    return {
      ok: false,
      error: "Nieobsługiwany format legacy backupu v1. Wymagany jest backup series_v1 v2 albo v3.",
    };
  }

  if (value["schemaVersion"] !== 2 && value["schemaVersion"] !== 3) {
    return {
      ok: false,
      error: `Nieobsługiwana wersja backupu (${String(value["schemaVersion"] ?? "brak")}). Wymagany jest format v2 albo v3.`,
    };
  }

  if (Number(value["schemaVersion"]) === 3) {
    return {
      ok: false,
      error: "Import Backup V3 jest wyłączony do czasu zatwierdzenia zabezpieczeń i testów odtwarzania na odrębnej bazie. Eksport pozostaje dostępny.",
    };
  }

  if (
    value["resultModelVersion"] !== "series_v1" ||
    value["rankingPolicy"] !== "match_record_v1"
  ) {
    return {
      ok: false,
      error: "Backup nie używa wymaganego modelu series_v1/match_record_v1.",
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
    return { ok: false, error: `Plik nie wygląda jak kompletny backup Tournament Manager v${value["schemaVersion"]}.` };
  }

  return { ok: true, backup: value as unknown as TournamentBackupFile };
}
