import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src=readFileSync(new URL('../../artifacts/tournament-manager/src/components/tournament-operations-overview.tsx',import.meta.url),'utf8');

test('missing payload still hides optional advisory panel on older servers',()=>{
  assert.match(src,/if \(!operations \|\| operations.version !== 1 \|\| operations.advisory !== true\) return null;/);
});
test('React Query cached snapshot with failed refetch is treated as stale',()=>{
  assert.match(src,/const stale = query\.isError/);
  assert.match(src,/\{stale && \(/);
  assert.match(src,/role="alert"/);
  assert.match(src,/ostatniego udanego odczytu/);
});
test('manual retry has single pending disabled button, no mutation',()=>{
  assert.match(src,/onClick=\{\(\) => \{ void query\.refetch\(\); \}\}/);
  assert.match(src,/disabled=\{query\.isFetching\}/);
  assert.match(src,/Ponów odczyt/);
  assert.doesNotMatch(src,/\.mutateAsync\(/);
});
test('an outdated recommendation does not retain a clickable navigation action',()=>{
  assert.match(src,/\{stale \? \(/);
  assert.match(src,/Przejście z nieaktualnej rekomendacji jest wstrzymane/);
  assert.match(src,/\) : \(\s*<Link href=\{target\}/);
});
test('stale label takes precedence over server blocker-count status',()=>{
  assert.match(src,/stale \? "Dane nieaktualne" : blockerCount/);
});
