import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const loadParser = () => import('../../artifacts/tournament-manager/src/lib/projector-url-settings.ts');
const src=readFileSync(new URL('../../artifacts/tournament-manager/src/pages/tournament-projector.tsx',import.meta.url),'utf8');

test('projector uses a bounded parser rather than parseFloat/parseInt for URL zoom/padding/width',()=>{
  assert.match(src,/const zoom = parseProjectorNumber\(sp\.get\("zoom"\), 1, 0\.25, 3\)/);
  assert.match(src,/const padding = parseProjectorInteger\(sp\.get\("padding"\), 24, 0, 96\)/);
  assert.match(src,/const connectorWidth = parseProjectorNumber\(sp\.get\("connector-width"\), 1, 0\.5, 8\)/);
  assert.doesNotMatch(src,/parseFloat\(sp\.get\("zoom"\)/);
});
test('missing, blank and garbage values use defaults',async()=>{
  const {parseProjectorNumber}=await loadParser();
  for (const value of [null, '', '  ', 'oops', 'NaN', 'Infinity','1px','0xFF','1e50','1;display:none']) {
    assert.equal(parseProjectorNumber(value,1,0.25,3),1,String(value));
  }
});
test('finite values are bounded, including negatives',async()=>{
  const {parseProjectorNumber}=await loadParser();
  assert.equal(parseProjectorNumber('0.8',1,0.25,3),0.8);
  assert.equal(parseProjectorNumber('0',1,0.25,3),0.25);
  assert.equal(parseProjectorNumber('-70',1,0.25,3),0.25);
  assert.equal(parseProjectorNumber('999999999999999999999999',1,0.25,3),3);
  assert.equal(parseProjectorNumber('2.5',1,0.25,3),2.5);
  assert.equal(parseProjectorNumber('1.25',1,0.5,8),1.25);
});
test('invalid and fractional padding stays integer within [0,96]',async()=>{
  const {parseProjectorInteger}=await loadParser();
  assert.equal(parseProjectorInteger(null,24,0,96),24);
  assert.equal(parseProjectorInteger('-30',24,0,96),0);
  assert.equal(parseProjectorInteger('900',24,0,96),96);
  assert.equal(parseProjectorInteger('20.9',24,0,96),20);
  assert.equal(parseProjectorInteger('NaN',24,0,96),24);
});
test('projector remains public/read-only and keeps its existing refresh calls',()=>{
  assert.match(src,/setActiveOrganizerToken\(null\)/);
  assert.match(src,/setActiveSupportToken\(null\)/);
  assert.match(src,/setActiveViewerToken\(null\)/);
  assert.match(src,/refetchInterval: 10000/);
});
