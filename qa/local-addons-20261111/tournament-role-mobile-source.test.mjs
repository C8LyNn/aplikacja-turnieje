import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const s=readFileSync(new URL('../../artifacts/tournament-manager/src/pages/tournaments-home.tsx',import.meta.url),'utf8');
test('L22 mniejsze paddingi i odstępy na małych ekranach, desktop zachowany',()=>{assert.match(s,/px-4 py-8 sm:py-12/);assert.match(s,/gap-3 sm:gap-4 md:grid-cols-3/)});
test('L22 karty ról kompaktowe tylko mobilnie',()=>{assert.match(s,/min-h-\[148px\] sm:min-h-56/);assert.match(s,/p-4 sm:p-6/);assert.match(s,/mb-3 sm:mb-6/)});
test('L22 nagłówek i podpis roli dostosowują rozmiar',()=>{assert.match(s,/text-3xl sm:text-4xl/);assert.match(s,/text-lg sm:text-xl/)});
test('L22 przycisk powrotu ma obszar dotykowy i dekoracyjną strzałkę',()=>{assert.match(s,/min-h-11/);assert.match(s,/<ArrowLeft[^>]*aria-hidden="true"/)});
test('L22 wybór roli zachowuje istniejące przejścia',()=>{assert.match(s,/tournamentRoleHomeHref\(item\.id, true\)/);assert.match(s,/setRole\(item\.id\)/);assert.match(s,/navigate\(/)});
