import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const repo = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const path = resolve(repo, 'artifacts/tournament-manager/src/lib/tournament-roster-cache.ts');
function moduleExports() {
 const {outputText,diagnostics}=ts.transpileModule(readFileSync(path,'utf8'),{fileName:path,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});
 assert.equal(diagnostics?.length ?? 0,0);
 const mk=(name)=>(...args)=>[name,...args];
 const api=Object.fromEntries(['getGetTournamentStageQueryKey','getGetTournamentStageReadinessQueryKey','getGetTournamentStatsQueryKey','getListPlayersQueryKey','getListTournamentStagesQueryKey'].map(n=>[n,mk(n)]));
 const exports={};vm.runInNewContext(outputText,{exports,require:n=>{assert.equal(n,'@workspace/api-client-react');return api;}},{filename:path});return exports;
}
const ids=keys=>Array.from(keys,k=>Array.from(k));
test('L56 no stages retains exactly three general query keys',()=>{
 const m=moduleExports();const keys=ids(m.tournamentRosterQueryKeys(9,[]));
 assert.deepEqual(keys.map(k=>k[0]),['getListPlayersQueryKey','getGetTournamentStatsQueryKey','getListTournamentStagesQueryKey']);
});
test('L56 duplicate stages invalidate detail/readiness only once per distinct stage',()=>{
 const m=moduleExports();const keys=ids(m.tournamentRosterQueryKeys(9,[3,3,2,3,2]));
 assert.deepEqual(keys.slice(3),[
 ['getGetTournamentStageQueryKey',9,3],['getGetTournamentStageReadinessQueryKey',9,3],
 ['getGetTournamentStageQueryKey',9,2],['getGetTournamentStageReadinessQueryKey',9,2]]);
 assert.equal(keys.length,7);
});
test('L56 does not mutate a caller-owned list',()=>{
 const m=moduleExports();const input=Object.freeze([6,6,7]);m.tournamentRosterQueryKeys(3,input);
 assert.deepEqual(input,[6,6,7]);
});
test('L56 invalidation makes seven unique calls with the original tournament ID',async()=>{
 const m=moduleExports(),called=[];
 await m.invalidateTournamentRosterQueries({invalidateQueries:async ({queryKey})=>{called.push(Array.from(queryKey));}},21,[4,5,4]);
 assert.deepEqual(called,ids(m.tournamentRosterQueryKeys(21,[4,5])));
});
test('L56 awaits asynchronous invalidations',async()=>{
 const m=moduleExports();const releases=[];let done=false;
 const pending=m.invalidateTournamentRosterQueries({invalidateQueries:()=>new Promise(resolve=>{releases.push(resolve);})},1,[]).then(()=>{done=true;});
 assert.equal(releases.length,3);await Promise.resolve();assert.equal(done,false);
 releases[0]();await Promise.resolve();assert.equal(done,false);
 releases[1]();await Promise.resolve();assert.equal(done,false);
 releases[2]();await pending;assert.equal(done,true);
});
test('L56 preserves rejection from failed invalidation',async()=>{
 const m=moduleExports();await assert.rejects(
   m.invalidateTournamentRosterQueries({invalidateQueries:async()=>{throw new Error('query failed');}},1,[1,1]),
   /query failed/);
});
