import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../../artifacts/tournament-manager/src/components/tournament-presentation-panel.tsx', import.meta.url), 'utf8');
test('L16-01: switch receives a stable per-instance ID and accessible description', () => { assert.match(source, /id=\{switchId\}/); assert.match(source, /aria-describedby=\{descriptionId\}/); });
test('L16-02: label and descriptive paragraph point to generated IDs', () => { assert.match(source, /<Label\s+htmlFor=\{switchId\}/); assert.match(source, /<p\s+id=\{descriptionId\}/); });
test('L16-03: IDs are instance-unique', () => { assert.match(source, /import \{ useId \} from "react"/); assert.match(source, /const switchId = useId\(\);/); assert.match(source, /const descriptionId = useId\(\);/); });
test('L16-04: copy explains local-browser scope without promising missing font', () => { assert.match(source, /w tej przeglądarce/); assert.doesNotMatch(source, /Valve Pulp Bold/); });
test('L16-05: theme hook, toggle callback and non-Deadlock fallback are retained', () => { assert.match(source, /useDeadlockTheme\(tournamentId\)/); assert.match(source, /onCheckedChange=\{setDeadlockTheme\}/); assert.match(source, /Ustawienia motywu wizualnego są dostępne dla turniejów Deadlock/); });
