import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(p,'utf8');
const domain=read('artifacts/api-server/src/domain/tournament/se-correction-readiness.ts');
const router=read('artifacts/api-server/src/routes/tournament-se-correction-readiness.ts');
const index=read('artifacts/api-server/src/routes/index.ts');
const openapi=read('lib/api-spec/openapi.yaml');
const panel=read('artifacts/tournament-manager/src/components/tournament-result-correction-panel.tsx');
const ci=read('.github/workflows/tournament-correction-ci.yml');
test('transaction is explicitly read-only and snapshot isolation',()=>{
 assert.match(router,/isolationLevel:"repeatable read",readOnly:true/);
 assert.doesNotMatch(router, /(?:tx|db)\.\s*(?:insert|update|delete|execute)\s*\(/);
});
test('only organizers can access readiness',()=>assert.match(router,/requireOrganizer\(req,res,tournamentId\)/));
test('strict reconciliation requires history, audit and stage version',()=>{
 for(const value of ['historyVerified','completionActionUnambiguous','expectedStageVersionVector','expectedMatchRevision','expectedCompletionActionId'])assert.ok(router.includes(value));
});
test('query validates input shape and prevents oversized version tokens',()=>{
 assert.match(router,/INVALID_SE_READINESS_INPUT/);assert.match(router,/80000/);
});
test('response is never mutation permission',()=>{
 assert.match(domain,/executionEnabled: false/);assert.match(domain,/writePerformed: false/);assert.match(router,/"Cache-Control","no-store"/);
});
test('route mounted in Express and documented',()=>{
 assert.match(index,/router\.use\(tournamentSeCorrectionReadinessRouter\)/);
 assert.match(openapi,/\/tournaments\/\{id\}\/matches\/\{matchId\}\/se-correction-readiness:/);
});
test('organizer UI shows separate snapshot check, not SE execute',()=>{
 assert.match(panel,/Sprawdź spójny snapshot SE/);
 assert.match(panel,/Automatyczne wykonanie SE pozostaje wyłączone/);
 assert.doesNotMatch(panel,/Wykonaj korektę SE/);
});
test('CI runs Pack 19 unit and contract tests without deploy',()=>{
 assert.match(ci,/test\/se-correction-readiness\.test\.ts/);
 assert.match(ci,/qa\/pack19\/source-contract\.test\.mjs/);
 assert.doesNotMatch(ci,/kubectl|vercel deploy|railway up/i);
});
