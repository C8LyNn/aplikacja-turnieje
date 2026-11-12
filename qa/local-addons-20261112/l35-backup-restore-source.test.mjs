import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync('artifacts/tournament-manager/src/components/backup-restore-dialog.tsx', 'utf8');
test('L35: UI does not claim V3 restore is available', () => {
  assert.match(source, /Przywróć backup V2<\/h2>/);
  assert.match(source, /Import backupu V3 jest wyłączony/);
  assert.doesNotMatch(source, /Przywróć backup V2\/V3/);
});
test('L35: synchronous ref prevents repeated restore submits', () => {
  assert.match(source, /const restoreInFlight = useRef\(false\)/);
  assert.match(source, /if \(!backup \|\| restoreInFlight\.current \|\| importTournament\.isPending\) return;/);
  assert.match(source, /restoreInFlight\.current = true;[\s\S]*?importTournament\.mutate\(/);
});
test('L35: success and failure both unlock restoration', () => {
  assert.match(source, /onSuccess: \(result\) => \{\s*restoreInFlight\.current = false;/);
  assert.match(source, /onError: \(requestError: any\) => \{\s*restoreInFlight\.current = false;/);
});
test('L35: restoration errors are announced', () => {
  assert.match(source, /\{error && <p role="alert"/);
});
test('L35: close button has accessible label', () => {
  assert.match(source, /<Button type="button" variant="ghost" size="icon" aria-label="Zamknij okno przywracania"/);
});
test('L35: user cannot cancel while import is pending', () => {
  assert.match(source, /<Button variant="outline" onClick=\{resetAndClose\} disabled=\{importTournament\.isPending\}>Anuluj<\/Button>/);
});
