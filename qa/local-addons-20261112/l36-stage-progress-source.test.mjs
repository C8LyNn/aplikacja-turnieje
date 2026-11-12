import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const s=readFileSync(resolve(root,'artifacts/tournament-manager/src/components/stage-progress-view.tsx'),'utf8');
test('L36: transport failure on first stages read is not an empty bracket',()=>{
  assert.match(s,/if \(stagesQuery\.isError && stages\.length === 0\)/);
  assert.match(s,/Nie udało się pobrać listy etapów/);
  assert.match(s,/Nie oznacza to, że turniej nie ma drabinki/);
  assert.ok(s.indexOf('if (stagesQuery.isError && stages.length === 0)')<s.indexOf('if (!stages.length)'));
});
test('L36: error state has accessible manual retry with busy guard',()=>{
  assert.match(s,/role="alert" className="rounded-lg border border-destructive/);
  assert.match(s,/void stagesQuery\.refetch\(\)/);
  assert.match(s,/disabled=\{stagesQuery\.isFetching\}/);
  assert.match(s,/Ponów odczyt etapów/);
});
test('L36: failed background refetch retains visibly marked previous stages',()=>{
  assert.match(s,/stagesQuery\.isError && \(/);
  assert.match(s,/Widoczne dane mogą być nieaktualne/);
  assert.match(s,/<StageNavigation/);
});
test('L36: stage detail read failure keeps a warning and retry',()=>{
  assert.match(s,/detailQuery\.error && \(/);
  assert.match(s,/Pokazujemy ostatnio pobrane dane/);
  assert.match(s,/void detailQuery\.refetch\(\)/);
});
test('L36: 401 and 403 still suppress cached detail',()=>{
  assert.match(s,/const denied = \[401, 403\]/);
  assert.match(s,/const detail = denied \? undefined : detailQuery\.data/);
  assert.match(s,/!denied && \(/);
});
test('L36: brackets and formats stay connected to prior rendering functions',()=>{
  for(const c of ['BracketView','SwissRoundsView','RoundRobinView','StageGroupTables','MarvelEliminationStage'])assert.match(s,new RegExp('<'+c));
});
