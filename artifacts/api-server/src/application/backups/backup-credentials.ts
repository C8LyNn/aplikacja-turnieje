import type { tournamentsTable } from "@workspace/db";

export type BackupRestoreCredentials = Pick<
  typeof tournamentsTable.$inferInsert,
  | "hostCode"
  | "organizerPasswordHash"
  | "supportPasswordHash"
  | "supportPasswordVersion"
  | "viewerPasswordHash"
  | "viewerPasswordVersion"
>;
