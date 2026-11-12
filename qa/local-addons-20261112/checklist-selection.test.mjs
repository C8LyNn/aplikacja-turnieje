import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeChecklistSelection } from '../../artifacts/tournament-manager/src/lib/checklist-selection.ts';
const ids=['players','organizer_access','backup_export_v3'];
test('L32 never carries historical code and V2-export checks into new safety conditions', () => {
  assert.deepEqual([...normalizeChecklistSelection(JSON.stringify(['code','backup_export','players']),ids)],['players']);
});
test('L32 retains newly confirmed items in the documented order', () => {
  assert.deepEqual([...normalizeChecklistSelection(JSON.stringify(['backup_export_v3','organizer_access']),ids)],['organizer_access','backup_export_v3']);
});
test('L32 ignores unknown IDs and unexpected data types', () => {
  assert.deepEqual([...normalizeChecklistSelection(JSON.stringify([null,7,{},'unknown','players']),ids)],['players']);
});
test('L32 returns empty for malformed JSON', () => {
  assert.equal(normalizeChecklistSelection('{',ids).size,0);
});
test('L32 returns empty for a nonarray payload', () => {
  assert.equal(normalizeChecklistSelection('{"players":true}',ids).size,0);
});
test('L32 returns empty for null raw storage', () => {
  assert.equal(normalizeChecklistSelection(null,ids).size,0);
});
test('L32 deduplicates and preserves only allowed entries', () => {
  assert.deepEqual([...normalizeChecklistSelection('["players","players","backup_export_v3"]',ids)],['players','backup_export_v3']);
});
