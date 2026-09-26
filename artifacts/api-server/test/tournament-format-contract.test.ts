import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  CreateTournamentBody,
  TournamentBackupV2TournamentFormat,
  TournamentBackupV3StagesItemFormat,
  TournamentFormat,
  TournamentInputFormat,
  TournamentUpdateFormat,
  type Tournament,
  type TournamentBackupV2,
  type TournamentBackupV3,
  type TournamentInput,
  type TournamentUpdate,
} from "@workspace/api-zod";

const CURRENT_TOURNAMENT_FORMATS = [
  "single_elimination",
  "round_robin",
  "swiss",
  "group_stage",
  "double_elimination",
] as const satisfies readonly Tournament["format"][] &
  readonly TournamentInput["format"][] &
  readonly TournamentBackupV3["stages"][number]["format"][];

const LEGACY_MUTATION_FORMATS = [
  "single_elimination",
  "round_robin",
  "swiss",
] as const satisfies readonly NonNullable<TournamentUpdate["format"]>[] &
  readonly TournamentBackupV2["tournament"]["format"][];

const BACKUP_V3_FULL_MODEL_FIELDS = [
  "stages",
  "stageBaskets",
  "stageBasketRoutes",
  "routingPlan",
  "routingExecutions",
  "marvelRounds",
  "marvelGroups",
  "marvelGroupEntries",
] as const satisfies readonly (keyof TournamentBackupV3)[];

describe("generated tournament format contract", () => {
  test("Tournament and TournamentInput expose exactly all five current formats", () => {
    assert.deepEqual(Object.values(TournamentFormat), CURRENT_TOURNAMENT_FORMATS);
    assert.deepEqual(Object.values(TournamentInputFormat), CURRENT_TOURNAMENT_FORMATS);
  });

  test("TournamentUpdate exposes only the three legacy mutation formats", () => {
    assert.deepEqual(Object.values(TournamentUpdateFormat), LEGACY_MUTATION_FORMATS);
  });

  test("Backup V2 exposes only the three legacy tournament formats", () => {
    assert.deepEqual(
      Object.values(TournamentBackupV2TournamentFormat),
      LEGACY_MUTATION_FORMATS,
    );
  });

  test("Backup V3 retains current formats and full stage model fields", () => {
    assert.deepEqual(
      Object.values(TournamentBackupV3StagesItemFormat),
      ["swiss", "round_robin", "group_stage", "single_elimination", "double_elimination"],
    );
    assert.equal(BACKUP_V3_FULL_MODEL_FIELDS.length, 8);
  });

  for (const format of CURRENT_TOURNAMENT_FORMATS) {
    test(`CreateTournamentBody accepts ${format}`, () => {
      const parsed = CreateTournamentBody.safeParse({
        name: `Contract ${format}`,
        organizerPassword: "contract-password",
        format,
      });
      assert.equal(parsed.success, true);
    });
  }
});
