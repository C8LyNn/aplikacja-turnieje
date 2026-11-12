import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveSwissRound } from '../../artifacts/tournament-manager/src/lib/swiss-round-selection.ts';
const src=readFileSync(new URL('../../artifacts/tournament-manager/src/components/swiss-rounds-view.tsx',import.meta.url),'utf8');

test('current round is preferred when old selection no longer exists',()=>{
 assert.equal(resolveSwissRound([4,5],2,5),5);
});
test('keep an explicitly selected available previous round',()=>{
 assert.equal(resolveSwissRound([1,2,3],1,3),1);
});
test('fall back to the first existing round if current is absent',()=>{
 assert.equal(resolveSwissRound([4,5],1,3),4);
});
test('empty bracket does not invent a visible round',()=>{
 assert.equal(resolveSwissRound([],1,1),null);
});
test('do not mutate the server round array',()=>{
 const rounds=[3,1,2]; assert.equal(resolveSwissRound(rounds,2,3),2); assert.deepEqual(rounds,[3,1,2]);
});
test('selector uses resolved visible round for groups, records and selected state',()=>{
 assert.match(src,/const visibleRound = resolveSwissRound/);
 assert.match(src,/const activeRound = rounds\.find\(\(r\) => r\.round === visibleRound\)/);
 assert.match(src,/round\.round >= \(visibleRound \?\? 1\)/);
 assert.match(src,/const isSel = r\.round === visibleRound/);
});
test('round buttons include accessible state and useful tap size',()=>{
 assert.match(src,/aria-label=\{`Runda \$\{r\.round\}/);
 assert.match(src,/aria-pressed=\{isSel\}/);
 assert.match(src,/role="group" aria-label="Wybór rundy"/);
 assert.match(src,/min-h-11 min-w-11/);
 assert.match(src,/overflow-x-auto/);
});
test('empty selected round has a visible empty state',()=>{
 assert.match(src,/Brak meczów dla wybranej rundy/);
});
