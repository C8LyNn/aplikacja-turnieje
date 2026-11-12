import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const source = readFileSync('artifacts/tournament-manager/src/pages/support-entry.tsx','utf8');
test('L30 query exposes error, fetch progress and real retry', () => {
  assert.match(source, /data:\s*tournaments,\s*isError,\s*isFetching,\s*refetch/);
  assert.match(source, /onClick=\{\(\)\s*=>\s*\{\s*void refetch\(\)/);
  assert.match(source, /disabled=\{isFetching\}/);
});
test('L30 initial fetch failure renders error, not empty-state', () => {
  assert.match(source, /!hasLoadedList\s*&&\s*isError\s*\?/);
  assert.ok(source.indexOf('!hasLoadedList && isError ?') < source.indexOf('active.length === 0 ?'));
  assert.match(source, /role="alert"/);
});
test('L30 loading remains distinct until actual data is received', () => {
  assert.match(source, /hasLoadedList\s*=\s*tournaments\s*!==\s*undefined/);
  assert.match(source, /!hasLoadedList\s*\?/);
  assert.match(source, /role="status"/);
});
test('L30 stale data warning does not remove the cached list', () => {
  assert.match(source, /isError\s*&&\s*hasLoadedList/);
  assert.match(source, /ostatnio pobrane dane/i);
  assert.match(source, /active\.map\(/);
});
