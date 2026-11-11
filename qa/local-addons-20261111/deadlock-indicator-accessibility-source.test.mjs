import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../artifacts/tournament-manager/src/components/deadlock-side-indicator.tsx', import.meta.url), 'utf8');
const compact = source.split('if (!showLabel) {')[1]?.split('\n  return (\n    <span')[0] ?? '';
const labeled = source.split('\n  return (\n    <span').at(-1) ?? '';

test('L18 compact side indicator provides an explicit accessible image name', () => {
  assert.match(compact, /role="img"/);
  assert.match(compact, /aria-label=\{label\}/);
});

test('L18 compact nested asset remains decorative rather than announced twice', () => {
  assert.match(compact, /<img[^>]*alt=""[^>]*aria-hidden="true"/s);
});

test('L18 labeled indicator decorative image does not duplicate visible label', () => {
  assert.match(labeled, /<img[^>]*alt=""[^>]*aria-hidden="true"/s);
  assert.match(labeled, /\{label\}/);
});

test('L18 failed image is scoped to that side rather than blocking a different side asset', () => {
  assert.match(source, /const \[failedSide, setFailedSide\] = useState<DeadlockSide \| null>\(null\)/);
  assert.match(source, /const imgFailed = failedSide === side/);
  assert.match(source, /onError=\{\(\) => setFailedSide\(side\)\}/);
});

test('L18 compact fallback remains colored even when no image loads', () => {
  assert.match(compact, /background: imgFailed \? color : undefined/);
});

test('L18 names and static assets remain the previously agreed Deadlock names', () => {
  assert.match(source, /archmother: "Archmother"/);
  assert.match(source, /hidden_king: "Hidden King"/);
  assert.match(source, /game-assets\/deadlock\/sides\/archmother\.png/);
  assert.match(source, /game-assets\/deadlock\/sides\/hidden-king\.png/);
});
