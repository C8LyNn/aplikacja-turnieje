import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const s=readFileSync(new URL('../../artifacts/tournament-manager/src/components/module-back-link.tsx',import.meta.url),'utf8');
test('L19 powrót zachowuje href i domyślną nazwę',()=>{assert.match(s,/href=\{href\}/);assert.match(s,/label = "Wszystkie projekty"/)});
test('L19 link ma dotykowy obszar min. 44px',()=>{assert.match(s,/min-h-11/);assert.match(s,/min-w-11/)});
test('L19 strzałka jest dekoracyjna',()=>{assert.match(s,/<ArrowLeft[^>]*aria-hidden="true"/)});
test('L19 fokus widoczny na ciemnym tle',()=>{assert.match(s,/focus-visible:ring-2/);assert.match(s,/focus-visible:ring-offset-2/);assert.match(s,/focus-visible:ring-offset-background/)});
