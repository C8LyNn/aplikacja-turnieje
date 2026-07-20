import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import type { Express } from "express";
import { eq } from "drizzle-orm";
import request from "supertest";
import {
  dropTestSchema,
  getSafeTestDatabaseConfig,
  resetTestSchema,
  type TestDatabaseConfig,
  type TestPool,
} from "./test-database";

interface DatabaseModule {
  db: typeof import("@workspace/db").db;
  pool: typeof import("@workspace/db").pool;
  tournamentsTable: typeof import("@workspace/db").tournamentsTable;
  tournamentStagesTable: typeof import("@workspace/db").tournamentStagesTable;
  stageGroupsTable: typeof import("@workspace/db").stageGroupsTable;
  stageParticipantsTable: typeof import("@workspace/db").stageParticipantsTable;
  playersTable: typeof import("@workspace/db").playersTable;
  matchesTable: typeof import("@workspace/db").matchesTable;
}

const SESSION_SECRET = `stages-api-backup-${randomUUID()}`;
let app: Express;
let database: DatabaseModule;
let config: TestDatabaseConfig;
let schemaInitialized = false;
let completeMatch: typeof import("../src/application/matches/complete-match").completeMatch;
let signOrganizerToken: typeof import("../src/auth").signOrganizerToken;
let signViewerToken: typeof import("../src/auth").signViewerToken;

const groupPlan = {
  initialParticipantCount: 6,
  stages: [
    {
      key: "groups",
      position: 1,
      name: "Grupy",
      format: "group_stage",
      participantCount: 6,
      bestOf: 1,
      groupCount: 2,
      participantsPerGroup: 3,
      qualifiersPerGroup: 2,
      seedingMethod: "snake",
    },
    {
      key: "playoff",
      position: 2,
      name: "Play-off",
      format: "single_elimination",
      participantCount: 4,
      bestOf: 3,
    },
  ],
} as const;

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = SESSION_SECRET;
  database = (await import("@workspace/db")) as DatabaseModule;
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  schemaInitialized = true;
  ({ completeMatch } =
    await import("../src/application/matches/complete-match"));
  ({ signOrganizerToken, signViewerToken } = await import("../src/auth"));
  app = (await import("../src/app")).default;
});

after(async () => {
  if (schemaInitialized)
    await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  await database.pool.end();
});

async function createGroupTournament(
  visibility: "public_online" | "private_online" = "public_online",
) {
  const response = await request(app)
    .post("/api/tournaments")
    .send({
      name: `API stages ${randomUUID()}`,
      format: "round_robin",
      visibility,
      organizerPassword: "organizer-test-password",
      stagePlan: groupPlan,
    });
  assert.equal(response.status, 201, response.text);
  const tournamentId = response.body.id as number;
  const players = await database.db
    .insert(database.playersTable)
    .values(
      Array.from({ length: 6 }, (_, index) => ({
        tournamentId,
        name: `P${index + 1}-${randomUUID()}`,
        seed: index + 1,
      })),
    )
    .returning();
  const stages = await database.db
    .select()
    .from(database.tournamentStagesTable)
    .where(eq(database.tournamentStagesTable.tournamentId, tournamentId));
  stages.sort((left, right) => left.position - right.position);
  return {
    tournamentId,
    playerIds: players.map((player) => player.id),
    groupStageId: stages[0].id,
    playoffStageId: stages[1].id,
    organizer: { "x-organizer-token": signOrganizerToken(tournamentId) },
  };
}

async function completeGroupMatches(stageId: number): Promise<void> {
  const matches = await database.db
    .select()
    .from(database.matchesTable)
    .where(eq(database.matchesTable.stageId, stageId));
  for (const match of matches) {
    await completeMatch({
      matchId: match.id,
      resultType: "played",
      score1: 1,
      score2: 0,
    });
  }
}

describe("public tournament stages API", () => {
  test("creates legacy and authoritative 1-3 stage plans", async () => {
    const legacy = await request(app)
      .post("/api/tournaments")
      .send({
        name: `Legacy ${randomUUID()}`,
        format: "single_elimination",
        defaultBestOf: 3,
      });
    assert.equal(legacy.status, 201, legacy.text);
    assert.equal(
      (await request(app).get(`/api/tournaments/${legacy.body.id}/stages`)).body
        .length,
      1,
    );

    const two = await request(app)
      .post("/api/tournaments")
      .send({
        name: `Two ${randomUUID()}`,
        format: "swiss",
        stagePlan: {
          initialParticipantCount: 4,
          stages: [
            {
              key: "swiss",
              position: 1,
              name: "Swiss",
              format: "swiss",
              participantCount: 4,
              bestOf: 1,
              rounds: 2,
              advancingCount: 2,
            },
            {
              key: "playoff",
              position: 2,
              name: "Play-off",
              format: "single_elimination",
              participantCount: 2,
              bestOf: 3,
            },
          ],
        },
      });
    assert.equal(two.status, 201, two.text);
    assert.equal(
      (await request(app).get(`/api/tournaments/${two.body.id}/stages`)).body
        .length,
      2,
    );

    const three = await request(app)
      .post("/api/tournaments")
      .send({
        name: `Three ${randomUUID()}`,
        format: "swiss",
        stagePlan: {
          initialParticipantCount: 8,
          stages: [
            {
              key: "swiss",
              position: 1,
              name: "Swiss",
              format: "swiss",
              participantCount: 8,
              bestOf: 1,
              rounds: 3,
              advancingCount: 6,
            },
            {
              key: "groups",
              position: 2,
              name: "Grupy",
              format: "group_stage",
              participantCount: 6,
              bestOf: 3,
              groupCount: 2,
              participantsPerGroup: 3,
              qualifiersPerGroup: 2,
              seedingMethod: "snake",
            },
            {
              key: "playoff",
              position: 3,
              name: "Play-off",
              format: "single_elimination",
              participantCount: 4,
              bestOf: 5,
            },
          ],
        },
      });
    assert.equal(three.status, 201, three.text);
    const stages = await request(app).get(
      `/api/tournaments/${three.body.id}/stages`,
    );
    assert.deepEqual(
      stages.body.map((stage: { format: string }) => stage.format),
      ["swiss", "group_stage", "single_elimination"],
    );

    const invalid = await request(app)
      .post("/api/tournaments")
      .send({
        name: `Invalid ${randomUUID()}`,
        format: "single_elimination",
        stagePlan: {
          initialParticipantCount: 4,
          stages: [
            {
              key: "elimination",
              position: 1,
              name: "Too early",
              format: "single_elimination",
              participantCount: 4,
              bestOf: 3,
            },
            {
              key: "round-robin",
              position: 2,
              name: "Later",
              format: "round_robin",
              participantCount: 2,
              bestOf: 3,
            },
          ],
        },
      });
    assert.equal(invalid.status, 422, invalid.text);
    assert.equal(invalid.body.code, "INVALID_STAGE_PLAN");

    const groupDraft = await request(app)
      .post("/api/tournaments")
      .send({
        name: `Group registration ${randomUUID()}`,
        format: "round_robin",
        stagePlan: groupPlan,
      });
    assert.equal(groupDraft.status, 201, groupDraft.text);
    const added = await request(app)
      .post(`/api/tournaments/${groupDraft.body.id}/players`)
      .send({ name: "First player", seed: 1 });
    assert.equal(added.status, 201, added.text);
    const configuredStages = await request(app).get(
      `/api/tournaments/${groupDraft.body.id}/stages`,
    );
    assert.equal(configuredStages.body[0].format, "group_stage");
    assert.equal(configuredStages.body[0].participantCount, 6);
  });

  test("applies central read policy and organizer-only lifecycle authorization", async () => {
    const fixture = await createGroupTournament("private_online");
    assert.equal(
      (
        await request(app).get(
          `/api/tournaments/${fixture.tournamentId}/stages`,
        )
      ).status,
      403,
    );
    const viewer = { "x-viewer-token": signViewerToken(fixture.tournamentId) };
    assert.equal(
      (
        await request(app)
          .get(`/api/tournaments/${fixture.tournamentId}/stages`)
          .set(viewer)
      ).status,
      200,
    );
    assert.equal(
      (
        await request(app)
          .post(
            `/api/tournaments/${fixture.tournamentId}/stages/${fixture.groupStageId}/start`,
          )
          .set(viewer)
      ).status,
      403,
    );
    const started = await request(app)
      .post(
        `/api/tournaments/${fixture.tournamentId}/stages/${fixture.groupStageId}/start`,
      )
      .set(fixture.organizer);
    assert.equal(started.status, 200, started.text);
    const detail = await request(app)
      .get(
        `/api/tournaments/${fixture.tournamentId}/stages/${fixture.groupStageId}`,
      )
      .set(viewer);
    assert.equal(detail.status, 200, detail.text);
    assert.equal(detail.body.groups.length, 2);
    assert.equal(
      detail.body.participants.every(
        (participant: { groupId: number | null }) =>
          participant.groupId != null,
      ),
      true,
    );
    await completeGroupMatches(fixture.groupStageId);
    const preview = await request(app)
      .get(
        `/api/tournaments/${fixture.tournamentId}/stages/${fixture.groupStageId}/qualification-preview`,
      )
      .set(viewer);
    assert.equal(preview.status, 200, preview.text);
    assert.equal(preview.body.qualifiers.length, 4);
    assert.equal(
      (
        await request(app)
          .post(
            `/api/tournaments/${fixture.tournamentId}/stages/${fixture.groupStageId}/complete`,
          )
          .set(viewer)
      ).status,
      403,
    );
    const completed = await request(app)
      .post(
        `/api/tournaments/${fixture.tournamentId}/stages/${fixture.groupStageId}/complete`,
      )
      .set(fixture.organizer);
    assert.equal(completed.status, 200, completed.text);
    assert.equal(completed.body.qualifiers.length, 4);
    const frozen = await request(app)
      .get(
        `/api/tournaments/${fixture.tournamentId}/stages/${fixture.groupStageId}`,
      )
      .set(viewer);
    assert.equal(frozen.body.ranking.length, 6);
    assert.equal(frozen.body.qualifiers.length, 4);
    const playoff = await request(app)
      .post(
        `/api/tournaments/${fixture.tournamentId}/stages/${fixture.playoffStageId}/start`,
      )
      .set(fixture.organizer);
    assert.equal(playoff.status, 200, playoff.text);
    assert.equal(playoff.body.status, "active");
  });
});

describe("Backup v3", () => {
  test("round-trips a draft group plan with registration still in progress", async () => {
    const created = await request(app)
      .post("/api/tournaments")
      .send({
        name: `Draft group backup ${randomUUID()}`,
        format: "round_robin",
        stagePlan: groupPlan,
      });
    assert.equal(created.status, 201, created.text);
    await request(app)
      .post(`/api/tournaments/${created.body.id}/players`)
      .send({ name: "Registered", seed: 1 })
      .expect(201);
    const exported = await request(app)
      .get(`/api/tournaments/${created.body.id}/export`)
      .set({ "x-organizer-token": signOrganizerToken(created.body.id) });
    assert.equal(exported.status, 200, exported.text);
    const imported = await request(app)
      .post("/api/tournaments/import")
      .send(exported.body);
    assert.equal(imported.status, 201, imported.text);
    const stages = await database.db
      .select()
      .from(database.tournamentStagesTable)
      .where(
        eq(
          database.tournamentStagesTable.tournamentId,
          imported.body.tournament.id,
        ),
      );
    assert.equal(
      stages.find((stage) => stage.position === 1)?.format,
      "group_stage",
    );
    assert.equal(
      stages.find((stage) => stage.position === 1)?.participantCount,
      6,
    );
    const memberships = await database.db
      .select()
      .from(database.stageParticipantsTable)
      .where(
        eq(
          database.stageParticipantsTable.tournamentId,
          imported.body.tournament.id,
        ),
      );
    assert.equal(memberships.length, 1);
  });

  test("round-trips configurable seeding, placement and its audit", async () => {
    const created = await request(app)
      .post("/api/tournaments")
      .send({
        name: `Configurable backup ${randomUUID()}`,
        format: "round_robin",
        stagePlan: {
          ...groupPlan,
          stages: [
            {
              ...groupPlan.stages[0],
              entrySeedingMethod: "random",
              placementMethod: "random",
              resultSeedingMethod: "global_ranking",
              randomSeed: "backup-random-draw",
              randomRevealOrder: "sequential",
            },
            {
              ...groupPlan.stages[1],
              placementMethod: "random",
              randomSeed: "backup-random-bracket",
            },
          ],
        },
      });
    assert.equal(created.status, 201, created.text);
    const tournamentId = created.body.id as number;
    await database.db.insert(database.playersTable).values(
      Array.from({ length: 6 }, (_, index) => ({
        tournamentId,
        name: `Backup seeded ${index + 1}`,
        seed: index + 1,
      })),
    );
    const stages = await database.db
      .select()
      .from(database.tournamentStagesTable)
      .where(eq(database.tournamentStagesTable.tournamentId, tournamentId));
    stages.sort((left, right) => left.position - right.position);
    const organizerHeaders = { "x-organizer-token": signOrganizerToken(tournamentId) };
    const ceremonyUrl = `/api/tournaments/${tournamentId}/stages/${stages[0].id}/seeding-ceremony`;
    await request(app)
      .post(`${ceremonyUrl}/prepare`)
      .set(organizerHeaders)
      .expect(200);
    await request(app)
      .post(`${ceremonyUrl}/reveal-all`)
      .set(organizerHeaders)
      .expect(200);

    const exported = await request(app)
      .get(`/api/tournaments/${tournamentId}/export`)
      .set(organizerHeaders);
    assert.equal(exported.status, 200, exported.text);
    const exportedGroup = exported.body.stages.find(
      (stage: { format: string }) => stage.format === "group_stage",
    );
    assert.equal(exportedGroup.entrySeedingPolicy, "random");
    assert.equal(exportedGroup.seedingPolicy, "random_groups");
    assert.equal(exportedGroup.resultSeedingPolicy, "global_ranking");
    assert.equal(exportedGroup.randomSeed, "backup-random-draw");
    assert.equal(exportedGroup.randomRevealOrder, "sequential");
    assert.equal(exportedGroup.seedingAudit.randomSeed, "backup-random-draw");
    assert.equal(
      exportedGroup.seedingAudit.placementRandomSeed,
      "backup-random-draw:placement",
    );
    assert.equal(exportedGroup.seedingAudit.status, "completed");

    const imported = await request(app)
      .post("/api/tournaments/import")
      .send(exported.body);
    assert.equal(imported.status, 201, imported.text);
    const importedStages = await database.db
      .select()
      .from(database.tournamentStagesTable)
      .where(
        eq(
          database.tournamentStagesTable.tournamentId,
          imported.body.tournament.id,
        ),
      );
    const importedGroup = importedStages.find(
      (stage) => stage.format === "group_stage",
    )!;
    assert.equal(importedGroup.entrySeedingPolicy, "random");
    assert.equal(importedGroup.seedingPolicy, "random_groups");
    assert.equal(importedGroup.resultSeedingPolicy, "global_ranking");
    assert.equal(importedGroup.randomSeed, "backup-random-draw");
    assert.equal(importedGroup.randomRevealOrder, "sequential");
    assert.deepEqual(importedGroup.seedingAudit, exportedGroup.seedingAudit);

    const importedHeaders = {
      "x-organizer-token": signOrganizerToken(imported.body.tournament.id),
    };
    const importedCeremonyUrl = `/api/tournaments/${imported.body.tournament.id}/stages/${importedGroup.id}/seeding-ceremony`;
    const staleImported = await request(app)
      .get(importedCeremonyUrl)
      .set(importedHeaders)
      .expect(200);
    assert.equal(staleImported.body.ceremony, null);
    const preparedAgain = await request(app)
      .post(`${importedCeremonyUrl}/prepare`)
      .set(importedHeaders)
      .expect(200);
    assert.equal(preparedAgain.body.ceremony.stageId, importedGroup.id);
    assert.equal(preparedAgain.body.ceremony.status, "prepared");
    assert.notEqual(
      preparedAgain.body.ceremony.participantSignature,
      exportedGroup.seedingAudit.participantSignature,
    );
  });

  test("imports a pre-Patch-04 Backup v3 with safe seeding defaults", async () => {
    const created = await request(app)
      .post("/api/tournaments")
      .send({
        name: `Legacy v3 backup ${randomUUID()}`,
        format: "round_robin",
        stagePlan: groupPlan,
      });
    assert.equal(created.status, 201, created.text);
    const exported = await request(app)
      .get(`/api/tournaments/${created.body.id}/export`)
      .set({ "x-organizer-token": signOrganizerToken(created.body.id) });
    assert.equal(exported.status, 200, exported.text);
    const legacy = structuredClone(exported.body);
    for (const stage of legacy.stages) {
      delete stage.entrySeedingPolicy;
      delete stage.resultSeedingPolicy;
      delete stage.randomSeed;
      delete stage.randomRevealOrder;
      delete stage.seedingAudit;
      if (stage.format === "single_elimination") stage.seedingPolicy = "cross_group";
    }

    const imported = await request(app)
      .post("/api/tournaments/import")
      .send(legacy);
    assert.equal(imported.status, 201, imported.text);
    const importedStages = await database.db
      .select()
      .from(database.tournamentStagesTable)
      .where(
        eq(
          database.tournamentStagesTable.tournamentId,
          imported.body.tournament.id,
        ),
      );
    const importedGroup = importedStages.find(
      (stage) => stage.format === "group_stage",
    )!;
    const importedPlayoff = importedStages.find(
      (stage) => stage.format === "single_elimination",
    )!;
    assert.equal(importedGroup.entrySeedingPolicy, "preserve");
    assert.equal(importedGroup.seedingPolicy, "snake_groups");
    assert.equal(importedGroup.resultSeedingPolicy, "rank_bands");
    assert.equal(importedGroup.randomRevealOrder, "instant");
    assert.equal(importedPlayoff.seedingPolicy, "standard_bracket");
    assert.equal(importedPlayoff.resultSeedingPolicy, "standings_order");
  });

  test("round-trips a group stage and cross-seeded play-off with all stage relations", async () => {
    const fixture = await createGroupTournament();
    await request(app)
      .post(
        `/api/tournaments/${fixture.tournamentId}/stages/${fixture.groupStageId}/start`,
      )
      .set(fixture.organizer)
      .expect(200);
    await completeGroupMatches(fixture.groupStageId);
    await request(app)
      .post(
        `/api/tournaments/${fixture.tournamentId}/stages/${fixture.groupStageId}/complete`,
      )
      .set(fixture.organizer)
      .expect(200);
    await request(app)
      .post(
        `/api/tournaments/${fixture.tournamentId}/stages/${fixture.playoffStageId}/start`,
      )
      .set(fixture.organizer)
      .expect(200);

    const exported = await request(app)
      .get(`/api/tournaments/${fixture.tournamentId}/export`)
      .set(fixture.organizer);
    assert.equal(exported.status, 200, exported.text);
    assert.equal(exported.body.schemaVersion, 3);
    assert.equal(exported.body.stages.length, 2);
    assert.equal(exported.body.groups.length, 2);
    assert.equal(
      exported.body.matches.every(
        (match: { stageBackupId?: number }) => match.stageBackupId != null,
      ),
      true,
    );

    const imported = await request(app)
      .post("/api/tournaments/import")
      .send(exported.body);
    assert.equal(imported.status, 201, imported.text);
    const importedStages = await database.db
      .select()
      .from(database.tournamentStagesTable)
      .where(
        eq(
          database.tournamentStagesTable.tournamentId,
          imported.body.tournament.id,
        ),
      );
    assert.equal(importedStages.length, 2);
    const importedStageIds = importedStages.map((stage) => stage.id);
    const importedGroups = await database.db
      .select()
      .from(database.stageGroupsTable)
      .where(
        eq(
          database.stageGroupsTable.stageId,
          importedStages.find((stage) => stage.format === "group_stage")!.id,
        ),
      );
    assert.equal(importedGroups.length, 2);
    const importedMatches = await database.db
      .select()
      .from(database.matchesTable)
      .where(
        eq(database.matchesTable.tournamentId, imported.body.tournament.id),
      );
    assert.equal(
      importedMatches.every((match) =>
        importedStageIds.includes(match.stageId),
      ),
      true,
    );
    assert.equal(
      importedMatches
        .filter((match) => match.stageGroupId != null)
        .every((match) =>
          importedGroups.some((group) => group.id === match.stageGroupId),
        ),
      true,
    );
  });

  test("keeps Backup v2 import as a compatible single-stage tournament", async () => {
    const imported = await request(app)
      .post("/api/tournaments/import")
      .send({
        schemaVersion: 2,
        resultModelVersion: "series_v1",
        rankingPolicy: "match_record_v1",
        exportedAt: new Date().toISOString(),
        tournament: {
          name: `Backup v2 ${randomUUID()}`,
          description: null,
          format: "round_robin",
          status: "draft",
          maxPlayers: 4,
          currentRound: null,
          totalRounds: null,
          swissRounds: null,
          defaultBestOf: 3,
          visibility: "public_online",
          winnerBackupId: null,
          featuredMatchBackupId: null,
        },
        players: [],
        matches: [],
        resultHistory: [],
        actionLog: [],
      });
    assert.equal(imported.status, 201, imported.text);
    const stages = await database.db
      .select()
      .from(database.tournamentStagesTable)
      .where(
        eq(
          database.tournamentStagesTable.tournamentId,
          imported.body.tournament.id,
        ),
      );
    assert.equal(stages.length, 1);
    assert.equal(stages[0].name, "Etap 1");
  });

  test("rejects an inconsistent v3 group relation without partial writes", async () => {
    const fixture = await createGroupTournament();
    await request(app)
      .post(
        `/api/tournaments/${fixture.tournamentId}/stages/${fixture.groupStageId}/start`,
      )
      .set(fixture.organizer)
      .expect(200);
    const exported = await request(app)
      .get(`/api/tournaments/${fixture.tournamentId}/export`)
      .set(fixture.organizer);
    const before = await database.db.select().from(database.tournamentsTable);
    const corrupt = structuredClone(exported.body);
    const playoffStage = corrupt.stages.find(
      (stage: { format: string }) => stage.format === "single_elimination",
    );
    corrupt.matches.push({
      backupId: 999999,
      stageBackupId: playoffStage.backupId,
      stageGroupBackupId: corrupt.groups[0].backupId,
      round: 1,
      matchNumber: 99,
      player1BackupId: null,
      player2BackupId: null,
      winnerBackupId: null,
      score1: null,
      score2: null,
      resultType: null,
      resultReason: null,
      bestOf: 3,
      status: "pending",
      note: null,
      nextMatchBackupId: null,
      sortOrder: null,
      scheduledAt: null,
      completedAt: null,
    });
    const response = await request(app)
      .post("/api/tournaments/import")
      .send(corrupt);
    assert.equal(response.status, 400, response.text);
    assert.equal(response.body.code, "INVALID_BACKUP_V3");
    assert.equal(
      (await database.db.select().from(database.tournamentsTable)).length,
      before.length,
    );
  });
});
