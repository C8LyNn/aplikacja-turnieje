import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src=readFileSync(new URL('../../artifacts/tournament-manager/src/pages/tournament-bracket.tsx',import.meta.url),'utf8');
test('zoom control group is discoverable to assistive technology',()=>{
 assert.match(src,/role="group" aria-label="Powiększenie drabinki"/);
 assert.match(src,/aria-label="Oddal drabinkę"/);
 assert.match(src,/aria-label="Przybliż drabinkę"/);
 assert.match(src,/aria-label="Dopasuj drabinkę do ekranu"/);
 assert.match(src,/aktualne powiększenie/);
});
test('UB->LB toggle exposes current state instead of relying on coloured dots',()=>{
 assert.match(src,/aria-pressed=\{showDropLines\}/);
 assert.match(src,/aria-label="Pokaż linie przejść Upper do Lower"/);
 assert.match(src,/setShowDropLines\(v => !v\)/);
});
test('zoom and fullscreen icons are decorative with independently named buttons',()=>{
 for(const icon of ['ZoomIn','ZoomOut','Minimize2','Maximize2'])
   assert.match(src,new RegExp(`<${icon} aria-hidden="true"`));
 assert.match(src,/aria-label="Włącz tryb pełnoekranowy"/);
});
test('small screen toolbar wraps, 44px targets and visible keyboard focus',()=>{
 assert.match(src,/flex flex-wrap justify-between items-start gap-2/);
 assert.match(src,/min-w-11 min-h-11/);
 assert.match(src,/focus-visible:outline-2/);
 assert.match(src,/inline-flex min-h-11 items-center/);
});
test('zoom range and existing computation are preserved',()=>{
 assert.match(src,/const ZOOM_MIN = 0\.2/);
 assert.match(src,/const ZOOM_MAX = 2\.0/);
 assert.match(src,/setZoom\(\(z\) => clampZoom\(z - ZOOM_STEP\)\)/);
 assert.match(src,/setZoom\(\(z\) => clampZoom\(z \+ ZOOM_STEP\)\)/);
 assert.match(src,/onClick=\{fitZoom\}/);
});
