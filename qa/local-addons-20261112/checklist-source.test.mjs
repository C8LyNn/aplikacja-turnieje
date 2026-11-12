import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const file=readFileSync('artifacts/tournament-manager/src/components/tournament-checklist.tsx','utf8');
test('L32 new security and V3 export require fresh acknowledgement IDs', () => {
  assert.match(file, /id:\s*"organizer_access"/);
  assert.match(file, /id:\s*"backup_export_v3"/);
  assert.doesNotMatch(file, /id:\s*"code"/);
  assert.doesNotMatch(file, /id:\s*"backup_export"/);
});
test('L32 text distinguishes V3 export and disabled V3 import', () => {
  assert.match(file, /schemaVersion 3/);
  assert.match(file, /Import V3 jest wyłączony/);
  assert.match(file, /Import V2/);
});
test('L32 storage decodes only active checklist IDs', () => {
  assert.match(file, /normalizeChecklistSelection\(raw, VALID_ITEM_IDS\)/);
});
