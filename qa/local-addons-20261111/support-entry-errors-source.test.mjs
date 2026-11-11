import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const s=readFileSync(new URL('../../artifacts/tournament-manager/src/pages/support-entry.tsx',import.meta.url),'utf8');
test('L21 nick jest powiązany z etykietą',()=>{assert.match(s,/<Label htmlFor="support-entry-nick"/);assert.match(s,/<Input\s+id="support-entry-nick"/s)});
test('L21 hasło jest powiązane z etykietą i typem autouzupełniania',()=>{assert.match(s,/<Label htmlFor="support-entry-password"/);assert.match(s,/<Input\s+id="support-entry-password"\s+type="password"/s);assert.match(s,/autoComplete="current-password"/)});
test('L21 błąd logowania jest alertem i opisem pola',()=>{assert.match(s,/<p id="support-entry-login-error" role="alert"/);assert.equal((s.match(/aria-describedby=\{error \? "support-entry-login-error" : undefined\}/g)||[]).length,2)});
test('L21 wyścig podwójnego wysłania blokuje ref bez wpływu na API',()=>{assert.match(s,/const submitLock = useRef\(false\)/);assert.match(s,/if \(!selectedId \|\| submitLock\.current/);assert.match(s,/submitLock\.current = true/);assert.match(s,/submitLock\.current = false/);assert.match(s,/apiSupportLogin\(selectedId, password, nick\)/)});
test('L21 edycja po błędzie umożliwia ponowną próbę bez starego alertu',()=>{assert.equal((s.match(/setError\(null\);\s*\}\}/g)||[]).length>=2,true)});
