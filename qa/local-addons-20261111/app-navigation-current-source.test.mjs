import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const s=readFileSync(new URL('../../artifacts/tournament-manager/src/components/app-navigation.tsx',import.meta.url),'utf8');
test('L20 logo używa tej samej ścieżki jako href i aria-current',()=>{assert.match(s,/const homeHref = getRoleHomePath\(role, fallbackHref, experimental\)/);assert.match(s,/href=\{homeHref\}/);assert.match(s,/aria-current=\{location === homeHref \? "page" : undefined\}/)});
test('L20 wybór roli oznacza bieżącą stronę tylko w jej docelowej ścieżce',()=>{assert.match(s,/const selectionHref = experimental\s*\? "\/experimental\/tournaments"\s*:\s*"\/tournaments\/stable"/);assert.match(s,/href=\{selectionHref\}/);assert.match(s,/aria-current=\{location === selectionHref \? "page" : undefined\}/)});
test('L20 elementy nawigacyjne mają wygodny obszar dotykowy',()=>{assert.match(s,/const navigationTouch =/);assert.match(s,/min-h-11/);assert.match(s,/min-w-11/)});
test('L20 strzałki pozostają dekoracyjne',()=>{assert.equal((s.match(/<ArrowLeft[^>]*aria-hidden="true"/g)||[]).length,2)});
test('L20 docelowe role nie zmieniają się',()=>{assert.match(s,/organizer: \{ href: "\/dashboard"/);assert.match(s,/support: \{ href: "\/support"/);assert.match(s,/fan: \{ href: "\/fan"/)});
