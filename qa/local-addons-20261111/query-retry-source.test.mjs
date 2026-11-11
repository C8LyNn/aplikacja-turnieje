import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('artifacts/tournament-manager/src/components/read-query-state.tsx', 'utf8');
test('L11-SRC-01: retry button is explicitly marked non-submitting', () => {
  assert.match(source, /<Button type="button"/);
});
test('L11-SRC-02: retry is blocked during an outstanding request', () => {
  assert.match(source, /disabled=\{query\.isFetching\}/);
});
test('L11-SRC-03: error state visibly differentiates a retry in progress', () => {
  assert.match(source, /query\.isFetching\s*\?\s*"Ponawianie…"\s*:\s*"Spróbuj ponownie"/);
});
test('L11-SRC-04: retry in progress includes an aria-hidden progress icon', () => {
  assert.match(source, /query\.isFetching\s*&&\s*<Loader2[^>]*animate-spin[^>]*aria-hidden="true"/);
});
test('L11-SRC-05: stale cached data and retry are not removed', () => {
  assert.match(source, /hasData\s*&&\s*<p\s+className="text-sm text-muted-foreground"/);
  assert.match(source, /\{hasData && children\}/);
  assert.match(source, /role="alert"/);
  assert.match(source, /query\.refetch\(\)/);
});
