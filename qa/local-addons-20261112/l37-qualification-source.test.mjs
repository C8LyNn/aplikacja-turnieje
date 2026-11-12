import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const s=readFileSync(resolve(root,'artifacts/tournament-manager/src/components/tournament-qualification-routing-panel.tsx'),'utf8');
test('L37: first GET error is not confused with absent routing',()=>{
  assert.match(s,/if \(query\.isError && !data\)/);
  assert.match(s,/nie oznacza braku tras/);
  assert.match(s,/role="alert"/);
});
test('L37: waiting GET reports progress instead of disappearing',()=>{
  assert.match(s,/query\.isPending && !data/);
  assert.match(s,/Ładowanie kwalifikacji i routingu/);
});
test('L37: stale prior data are visibly qualified and retain the panel',()=>{
  assert.match(s,/query\.isError && \(/);
  assert.match(s,/ostatnio dostępne dane, które mogą być nieaktualne/);
  assert.match(s,/data\.flowAuthority !== "basket_v1"/);
});
test('L37: manual retry disables during pending fetch',()=>{
  assert.equal((s.match(/void query\.refetch\(\)/g)||[]).length,2);
  assert.equal((s.match(/disabled=\{query\.isFetching\}/g)||[]).length,2);
});
test('L37: keeps read-only and original endpoint and navigation',()=>{
  assert.match(s,/method: "GET", signal/);
  assert.match(s,/qualification-routing-preview/);
  assert.match(s,/tournamentModeHref\(`\/tournaments\/\$\{tournamentId\}\?tab=baskets`, experimental\)/);
  assert.doesNotMatch(s,/method: "POST"|\.mutate\(/);
});
