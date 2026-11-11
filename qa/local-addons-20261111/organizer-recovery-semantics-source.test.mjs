import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../../artifacts/tournament-manager/src/components/organizer-recovery-notice.tsx', import.meta.url), 'utf8');
test('L15-01: notice has a semantic heading', () => assert.match(source, /<h2\s+id=\{headingId\}[^>]*>Zabezpiecz dostęp organizatora<\/h2>/));
test('L15-02: section is named by its heading, not a parallel hard-coded string', () => assert.match(source, /<section\s+aria-labelledby=\{headingId\}/));
test('L15-03: section description references its explanatory warning text', () => { assert.match(source, /aria-describedby=\{descriptionId\}/); assert.match(source, /<p\s+id=\{descriptionId\}[^>]*className="text-sm"/); });
test('L15-04: IDs are unique per instance', () => { assert.match(source, /import \{ useId \} from "react"/); assert.match(source, /const headingId = useId\(\);/); assert.match(source, /const descriptionId = useId\(\);/); });
test('L15-05: link continues to the existing security tab without changing permissions', () => { assert.match(source, /tournamentHref\(tournamentId, experimental, "\?tab=security"\)/); assert.match(source, /Ustaw hasło organizatora/); });
