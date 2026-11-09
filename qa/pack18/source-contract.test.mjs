import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(file,'utf8');
const domain=read('artifacts/api-server/src/domain/tournament/se-correction-safety.ts');
const router=read('artifacts/api-server/src/routes/tournament-se-correction-preflight.ts');
const index=read('artifacts/api-server/src/routes/index.ts');
const openapi=read('lib/api-spec/openapi.yaml');
const panel=read('artifacts/tournament-manager/src/components/tournament-result-correction-panel.tsx');
const workflow=read('.github/workflows/tournament-correction-ci.yml');
test('SE analysis does not mutate any persisted table',()=>{
 assert.match(domain,/advisoryOnly:\s*true/);
 assert.doesNotMatch(router,/\b(?:db|tx)\s*\.\s*(?:insert|update|delete|execute)\s*\(|withTournamentMutationLock/);
});
test('Only organizers may call the safety API',()=>{assert.match(router,/requireOrganizer\(req,res,tournamentId\)/)});
test('Endpoint is mounted in real API and documented in OpenAPI',()=>{
 assert.match(index,/tournamentSeCorrectionPreflightRouter/);assert.match(index,/router\.use\(tournamentSeCorrectionPreflightRouter\)/);
 assert.match(openapi,/\/tournaments\/\{id\}\/matches\/\{matchId\}\/se-correction-preflight:/);
});
test('Endpoint never sets executionEnabled to true',()=>{
 assert.match(router,/executionEnabled:false/);assert.match(router,/"Cache-Control","no-store"/);
});
test('SE guard rejects advanced bracket and qualified players',()=>{
 for(const key of ['ROUND_ALREADY_ADVANCED','NEXT_MATCH_NOT_PRISTINE','STAGE_ADVANCED','QUALIFICATION_ALREADY_COMMITTED','ROUTING_ALREADY_COMMITTED'])assert.ok(domain.includes(key));
});
test('UI presents safety as advisory and does not expose SE execute button',()=>{
 assert.match(panel,/Oceń gotowość SE/);assert.match(panel,/Automatyczne wykonanie SE pozostaje wyłączone/);
});
test('CI uses disposable postgres and full integration gate',()=>{
 assert.match(workflow,/image: postgres:16/);assert.match(workflow,/tournament_test/);
 assert.match(workflow,/node qa\/pack17\/run-gates\.mjs --full/);
 assert.doesNotMatch(workflow,/kubectl|firebase|railway up|vercel deploy/i);
});
test('CI exposes isolated PostgreSQL on the same non-default port required by destructive schema tests',()=>{
 const mapped=workflow.match(/^\s*-\s*["']?(\d+):5432["']?\s*$/m);
 const database=workflow.match(/^\s*TEST_DATABASE_URL:\s*(\S+)\s*$/m);
 assert.ok(mapped,'PostgreSQL host-to-container port mapping is required');
 assert.ok(database,'TEST_DATABASE_URL is required');
 const url=new URL(database[1]);
 assert.ok(['postgres:','postgresql:'].includes(url.protocol),'test database must use PostgreSQL');
 assert.ok(['localhost','127.0.0.1'].includes(url.hostname),'test database must use loopback');
 assert.doesNotMatch(`${url.hostname}${url.pathname}`,/prod/i,'test database must not be production');
 assert.notEqual(mapped[1],'5432','schema tests must not target the default PostgreSQL port');
 assert.equal(url.port,mapped[1],'test URL must use the mapped host port');
 assert.match(url.pathname,/test/i,'database name must identify a test database');
 assert.match(workflow,/^\s*TEST_DATABASE_SCHEMA:\s*tm_test_[a-z0-9_]+\s*$/m);
 assert.match(workflow,/^\s*TEST_DATABASE_RESET:\s*DROP_TM_TEST_SCHEMA\s*$/m);
});
