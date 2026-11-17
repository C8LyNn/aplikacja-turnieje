import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (file) => readFileSync(`artifacts/tournament-manager/src/${file}`, 'utf8');

test('V5.2: lifecycle actions opened from the host panel return there after success', () => {
  const host = read('pages/tournament-host.tsx');
  const stages = read('components/tournament-stages-panel.tsx');
  assert.match(host, /actionHref: `\$\{nextStep\.actionHref\}&return=host`/);
  assert.match(stages, /returnToHost\.current = params\.get\("return"\) === "host";/);
  assert.match(stages, /params\.delete\("return"\);/);
  assert.equal((stages.match(/backToHostAfterSuccess\(\);/g) ?? []).length, 2, 'start and complete both return');
});

test('V5.2: a pending lifecycle save never flashes stale or blocked messages', () => {
  const stages = read('components/tournament-stages-panel.tsx');
  assert.equal((stages.match(/\{!pending && lifecycleModalStale && <p role="alert"/g) ?? []).length, 2);
  assert.match(stages, /\{pending \? <p role="status"[^>]*>Uruchamianie etapu i przygotowanie meczów…<\/p> : actionStartBlockedReason &&/);
});

test('V5.2: finished single-stage tournaments show official places in the stage table', () => {
  const stages = read('components/tournament-stages-panel.tsx');
  assert.match(stages, /officialRanks=\{selected\.status === "completed" \? officialRanks : undefined\}/);
  assert.match(stages, /const singleStageFinished = stages\.length === 1 && stages\[0\]\?\.status === "completed";/);
});

test('V5.2: team tournaments speak about teams in Experimental only', () => {
  const detail = read('pages/tournament-detail.tsx');
  assert.match(detail, /const teamEntries = isExperimental && tournament\?\.participantType === "teams";/);
  assert.match(detail, /\{teamEntries \? "Drużyny" : "Zawodnicy"\}/);
  assert.match(detail, /\{teamEntries && tournament\.status === "draft" && \(/);
});

test('V5.2: the V3 restore stays disabled; the dialog only previews the file', () => {
  const dialog = read('components/backup-restore-dialog.tsx');
  assert.match(dialog, /inspectBackupV3\(text\)/);
  assert.match(dialog, /\{!v3Preview && <Button\s+onClick=\{restore\}/);
  assert.match(dialog, /nic nie zostanie zapisane/);
  assert.doesNotMatch(read('lib/backup-v3-preview.ts'), /fetch\(|importTournament|useImportTournament/);
});

test('V5.2: no "BO" jargon in the Experimental tournament header and overview', () => {
  assert.match(read('pages/tournament-detail.tsx'), /isExperimental \? bestOfLabel\(/);
  assert.doesNotMatch(read('features/experimental-tournaments/experimental-tournament-overview.tsx'), /· BO\$\{/);
});
