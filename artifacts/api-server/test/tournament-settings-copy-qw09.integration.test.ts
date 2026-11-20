// QW-09 · "Nowy turniej z tymi ustawieniami": settings carry over, nothing from the event itself does
// (participants, matches, results, history, passwords, support people, schedule dates); organizer only.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import type { Express } from "express";
import request from "supertest";
import { dropTestSchema, getSafeTestDatabaseConfig, resetTestSchema, type TestDatabaseConfig, type TestPool } from "./test-database";

type DbModule = typeof import("@workspace/db");
let app: Express;
let database: DbModule;
let config: TestDatabaseConfig;

before(async () => {
  config = getSafeTestDatabaseConfig();
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = config.connectionString;
  process.env.SESSION_SECRET = `settings-copy-qw09-${randomUUID()}`;
  database = await import("@workspace/db");
  await resetTestSchema(database.pool as unknown as TestPool, config.schema);
  app = (await import("../src/app")).default;
});
after(async () => {
  await dropTestSchema(database.pool as unknown as TestPool, config.schema);
  await database.pool.end();
});

const PASSWORD = "qw09-organizer-pass";
type T = { id: number; org: Record<string, string> };

async function create(body: Record<string, unknown>): Promise<T> {
  const res = await request(app).post("/api/tournaments").send({ organizerPassword: PASSWORD, ...body });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return { id: res.body.id, org: { "x-organizer-token": res.body.organizerToken } };
}
async function addPlayers(t: T, n: number) {
  for (let seed = 1; seed <= n; seed++) await request(app).post(`/api/tournaments/${t.id}/players`).set(t.org).send({ name: `Gracz ${seed}`, seed }).expect(201);
}
const stagesOf = async (t: T) => (await request(app).get(`/api/tournaments/${t.id}/stages`).set(t.org).expect(200)).body as Array<Record<string, any>>;
const copy = (t: T, body: Record<string, unknown>, headers: Record<string, string> = t.org) =>
  request(app).post(`/api/tournaments/${t.id}/copy`).set(headers).send(body);

function comparable(stage: Record<string, any>) {
  const { id: _id, tournamentId: _t, status: _s, currentRound: _c, totalRounds: _tr, winnerId: _w, createdAt: _ca, startedAt: _sa, completedAt: _co, version: _v, randomSeed: _r, seedingAudit: _a, ...rest } = stage;
  return rest;
}

test("QW-09: a groups → play-off event with fields, sign-ups and support is copied as settings only", async () => {
  const source = await create({
    name: `Liga klubowa ${randomUUID().slice(0, 6)}`, description: "Co miesiąc", format: "group_stage", visibility: "public_online",
    stagePlan: {
      initialParticipantCount: 8,
      stages: [
        { key: "grupy", position: 1, name: "Grupy", format: "group_stage", participantCount: 8, bestOf: 1, groupCount: 2, participantsPerGroup: 4, qualifiersPerGroup: 2,
          placementMethod: "snake", resultSeedingMethod: "rank_bands", entrySeedingMethod: "registration_order",
          leagueRules: { version: 1, allowDraws: true, points: { win: 3, draw: 1, loss: 0 }, tieBreakers: ["head_to_head", "score_difference"] },
          scheduleTimeZone: "Europe/Warsaw", schedulePlan: { startDate: "2026-11-01", intervalDays: 7, defaultTime: "18:00" } },
        { key: "finaly", position: 2, name: "Play-off", format: "single_elimination", participantCount: 4, bestOf: 3, placementMethod: "standard", entrySeedingMethod: "preserve" },
      ],
    },
  });
  await request(app).put(`/api/tournaments/${source.id}/participant-fields`).set(source.org).send({ fields: [
    { key: "klub", label: "Klub", type: "short_text", required: false, visibility: "public", askOnSignup: true },
  ] }).expect(200);
  await request(app).put(`/api/tournaments/${source.id}/registration-settings`).set(source.org)
    .send({ enabled: true, open: true, approval: "manual", capacity: 8, note: "Zapisy do piątku" }).expect(200);
  await request(app).patch(`/api/tournaments/${source.id}`).set(source.org).send({ presentationSettings: { deadlockTheme: true } }).expect(200);
  await request(app).post(`/api/tournaments/${source.id}/support-members`).set(source.org).send({ name: "Sędzia", permissions: ["matches.run", "results.write"] }).expect(201);
  await addPlayers(source, 8);
  const [groups] = await stagesOf(source);
  await request(app).post(`/api/tournaments/${source.id}/stages/${groups.id}/start`).set(source.org).send({}).expect(200);
  const sourceMatches = (await request(app).get(`/api/tournaments/${source.id}/matches`).set(source.org).expect(200)).body as unknown[];
  assert.ok(sourceMatches.length > 0, "the source event is running");

  // the dialog summary
  const summary = await request(app).get(`/api/tournaments/${source.id}/copy`).set(source.org).expect(200);
  assert.equal(summary.headers["cache-control"], "no-store");
  assert.equal(summary.body.mode, "plan");
  assert.equal(summary.body.participantCount, 8);
  assert.equal(summary.body.resizable, false);
  assert.deepEqual(summary.body.stages, [{ name: "Grupy", format: "group_stage" }, { name: "Play-off", format: "single_elimination" }]);
  assert.equal(summary.body.participantFieldCount, 1);
  assert.equal(summary.body.signups, "closed");
  assert.ok(summary.body.notCopied.includes("hasła"));

  const res = await copy(source, { name: "Liga klubowa — grudzień", organizerPassword: "qw09-new-organizer" });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  const next: T = { id: res.body.id, org: { "x-organizer-token": res.body.organizerToken } };
  assert.notEqual(next.id, source.id);
  assert.equal(res.body.name, "Liga klubowa — grudzień");
  assert.equal(res.body.status, "draft");
  assert.equal(res.body.description, "Co miesiąc");
  assert.equal(res.body.visibility, "public_online");

  // the same plan and rules, but no schedule dates
  const [a, b] = await stagesOf(source);
  const [c, d] = await stagesOf(next);
  assert.deepEqual({ ...comparable(c), scheduleTimeZone: null, schedulePlan: null }, { ...comparable(a), scheduleTimeZone: null, schedulePlan: null, participantCount: 8 });
  assert.equal(c.schedulePlan ?? null, null, "dates are not copied");
  assert.deepEqual(comparable(d), comparable(b));
  assert.equal(c.status, "planned");

  // nothing from the event itself
  assert.deepEqual((await request(app).get(`/api/tournaments/${next.id}/players`).set(next.org).expect(200)).body, []);
  assert.deepEqual((await request(app).get(`/api/tournaments/${next.id}/matches`).set(next.org).expect(200)).body, []);
  assert.deepEqual((await request(app).get(`/api/tournaments/${next.id}/support-members`).set(next.org).expect(200)).body.members ?? [], []);
  assert.deepEqual((await request(app).get(`/api/tournaments/${next.id}/action-log`).set(next.org).expect(200)).body, [], "no match history");
  const audit = (await request(app).get(`/api/tournaments/${next.id}/audit-log`).set(next.org).expect(200)).body as Array<{ action: string }>;
  assert.equal(audit.length, 1, JSON.stringify(audit));
  assert.match(audit[0].action, new RegExp(`z ustawień turnieju .*#${source.id}`));

  // settings that do carry over
  const fields = await request(app).get(`/api/tournaments/${next.id}/participant-fields`).set(next.org).expect(200);
  assert.equal(JSON.stringify(fields.body).includes("Klub"), true);
  const signup = await request(app).get(`/api/tournaments/${next.id}/registration-settings`).set(next.org);
  const settings = signup.status === 200 ? signup.body.settings ?? signup.body : (await database.pool.query("select registration_settings from tournaments where id = $1", [next.id])).rows[0].registration_settings;
  assert.equal(settings.enabled, true);
  assert.equal(settings.open, false, "the sign-up form waits closed for the next event");
  assert.equal(settings.note, "Zapisy do piątku");
  const nextTournament = await request(app).get(`/api/tournaments/${next.id}`).set(next.org).expect(200);
  assert.equal(nextTournament.body.presentationSettings?.deadlockTheme, true);

  // separate credentials: the old organizer token does not open the copy, and the source is untouched
  const cross = await request(app).put(`/api/tournaments/${next.id}/participant-fields`).set(source.org).send({ fields: [] });
  assert.ok([401, 403].includes(cross.status), `old token refused (got ${cross.status})`);
  assert.equal((await request(app).get(`/api/tournaments/${source.id}/players`).set(source.org).expect(200)).body.length, 8);
  assert.equal((await request(app).get(`/api/tournaments/${source.id}/matches`).set(source.org).expect(200)).body.length, sourceMatches.length);
});

test("QW-09: a flexible league keeps its rules and stays open-ended; teams keep their roster limits", async () => {
  const source = await create({
    name: "Liga drużyn", format: "round_robin", defaultBestOf: 3, participantType: "teams", teamRosterMin: 2, teamRosterMax: 4,
    leagueRules: { version: 1, allowDraws: false, points: { win: 2, draw: 0, loss: 0 }, tieBreakers: ["wins"] },
    matchRules: { version: 1, kind: "sets", setsToWin: 2, pointsPerSet: 11, winBy: 2 },
  });
  const summary = await request(app).get(`/api/tournaments/${source.id}/copy`).set(source.org).expect(200);
  assert.equal(summary.body.mode, "flexible");
  assert.equal(summary.body.participantCount, null);
  assert.equal(summary.body.participantType, "teams");
  const res = await copy(source, { name: "Liga drużyn 2", organizerPassword: PASSWORD });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  const next: T = { id: res.body.id, org: { "x-organizer-token": res.body.organizerToken } };
  assert.equal(res.body.maxPlayers ?? null, null, "no participant limit, as before");
  assert.equal(res.body.participantType, "teams");
  assert.equal(res.body.teamRosterMin, 2);
  assert.equal(res.body.teamRosterMax, 4);
  const [a] = await stagesOf(source);
  const [b] = await stagesOf(next);
  assert.deepEqual(b.leagueRules, a.leagueRules);
  assert.deepEqual(b.matchRules, a.matchRules);
});

test("QW-09: a single-stage cup can change size; random draws get a fresh key; double elimination is rebuilt", async () => {
  const cup = await create({
    name: "Puchar", format: "single_elimination",
    stagePlan: { initialParticipantCount: 8, stages: [
      { key: "puchar", position: 1, name: "Puchar", format: "single_elimination", participantCount: 8, bestOf: 3, placementMethod: "random", entrySeedingMethod: "registration_order", randomSeed: "losowanie-1" },
    ] },
  });
  const res = await copy(cup, { name: "Puchar 2", organizerPassword: PASSWORD, participantCount: 12 });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  const [stage] = await stagesOf({ id: res.body.id, org: { "x-organizer-token": res.body.organizerToken } });
  assert.equal(stage.participantCount, 12);
  assert.equal(stage.bestOf, 3);
  assert.equal(stage.seedingPolicy, "random_bracket");
  const [{ random_seed: seed }] = (await database.pool.query("select random_seed from tournament_stages where tournament_id = $1", [res.body.id])).rows;
  assert.ok(seed && seed !== "losowanie-1", "a new draw, not the previous one");

  const de = await create({
    name: "Dwie szanse", format: "double_elimination",
    stagePlan: { initialParticipantCount: 8, stages: [
      { key: "de", position: 1, name: "Dwie szanse", format: "double_elimination", participantCount: 8, bestOf: 1, placementMethod: "standard", entrySeedingMethod: "registration_order" },
    ] },
  });
  const deCopy = await copy(de, { name: "Dwie szanse 2", organizerPassword: PASSWORD, participantCount: 6 });
  assert.equal(deCopy.status, 201, JSON.stringify(deCopy.body));
  const [{ n }] = (await database.pool.query("select count(*)::int as n from tournament_routing_plans where tournament_id = $1", [deCopy.body.id])).rows;
  assert.equal(n, 1, "the double-elimination routing plan is compiled for the new size");
});

test("QW-09: only the organizer copies; inputs are checked by the normal create rules", async () => {
  const source = await create({ name: "Prywatny", format: "single_elimination", maxPlayers: 4, visibility: "private_online", viewerPassword: "qw09-viewer-pass", supportPassword: "qw09-support-pass" });
  for (const headers of [{}, { "x-organizer-token": "nie-token" }] as Record<string, string>[]) {
    const res = await copy(source, { name: "X", organizerPassword: PASSWORD }, headers);
    assert.ok([401, 403].includes(res.status), `refused (got ${res.status})`);
    const summary = await request(app).get(`/api/tournaments/${source.id}/copy`).set(headers);
    assert.ok([401, 403].includes(summary.status), `summary refused (got ${summary.status})`);
  }
  const support = await request(app).post(`/api/tournaments/${source.id}/auth/support-login`).send({ password: "qw09-support-pass", nick: "Pomoc" }).expect(200);
  const bySupport = await copy(source, { name: "X", organizerPassword: PASSWORD }, { "x-support-token": support.body.sessionToken });
  assert.ok([401, 403].includes(bySupport.status), `support refused (got ${bySupport.status})`);
  const viewer = await request(app).post(`/api/tournaments/${source.id}/auth/viewer-login`).send({ password: "qw09-viewer-pass" });
  if (viewer.status === 200) {
    const token = viewer.body.token as string;
    const byViewer = await copy(source, { name: "X", organizerPassword: PASSWORD }, { "x-viewer-token": token });
    assert.ok([401, 403].includes(byViewer.status), `viewer refused (got ${byViewer.status})`);
  }

  const noViewerPassword = await copy(source, { name: "Prywatny 2", organizerPassword: PASSWORD });
  assert.equal(noViewerPassword.status, 422);
  assert.equal(noViewerPassword.body.code, "VIEWER_PASSWORD_REQUIRED");
  assert.equal((await copy(source, { name: "Prywatny 2", organizerPassword: "krótkie" })).status, 400);
  assert.equal((await copy(source, { name: "", organizerPassword: PASSWORD, viewerPassword: "qw09-viewer-pass" })).status, 400);
  assert.equal((await copy(source, { name: "X", organizerPassword: PASSWORD, hostCode: "1234" })).status, 400);
  assert.equal((await copy(source, { name: "X", organizerPassword: PASSWORD, stagePlan: {} })).status, 400, "the plan comes from the source only");
  const published = await copy(source, { name: "Publiczny 2", organizerPassword: PASSWORD, visibility: "public_online" });
  assert.equal(published.status, 201, JSON.stringify(published.body));
  assert.equal(published.body.visibility, "public_online");

  const multi = await create({
    name: "Dwa etapy", format: "swiss",
    stagePlan: { initialParticipantCount: 8, stages: [
      { key: "s", position: 1, name: "Szwajcarski", format: "swiss", participantCount: 8, bestOf: 1, rounds: 3, advancingCount: 4, entrySeedingMethod: "registration_order" },
      { key: "f", position: 2, name: "Finały", format: "single_elimination", participantCount: 4, bestOf: 1, placementMethod: "standard", entrySeedingMethod: "preserve" },
    ] },
  });
  const resized = await copy(multi, { name: "Dwa etapy 2", organizerPassword: PASSWORD, participantCount: 10 });
  assert.equal(resized.status, 422);
  assert.equal(resized.body.code, "INVALID_SETTINGS_COPY");
  const same = await copy(multi, { name: "Dwa etapy 2", organizerPassword: PASSWORD });
  assert.equal(same.status, 201, JSON.stringify(same.body));
  const stages = await stagesOf({ id: same.body.id, org: { "x-organizer-token": same.body.organizerToken } });
  assert.deepEqual(stages.map((s) => [s.format, s.participantCount, s.plannedRounds ?? null, s.advancingCount ?? null]), [["swiss", 8, 3, 4], ["single_elimination", 4, null, null]]);
});
