import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src=readFileSync(new URL('../../artifacts/tournament-manager/src/components/round-robin-view.tsx',import.meta.url),'utf8');

test('classification scrolls rather than squeezing on mobile',()=> {
  assert.match(src,/overflow-x-auto bg-card\/40" role="region"/);
  assert.match(src,/aria-label="Przewijana tabela klasyfikacji" tabIndex=\{0\}/);
  assert.match(src,/min-w-\[380px\]/);
});
test('accessible table description is non-visual',()=>{
  assert.match(src,/<caption className="sr-only">Klasyfikacja graczy — każdy z każdym<\/caption>/);
});
test('column headers have explicit scope and abbreviated headings have full semantic names',()=>{
  assert.match(src,/<th scope="col" className="py-2 px-2 text-left">Gracz<\/th>/);
  for (const label of ['Rozegrane mecze','Wygrane mecze','Przegrane mecze','Wygrane i przegrane gry','Bilans gier']){
    assert.ok(src.includes(`scope="col" aria-label="${label}"`),label);
  }
});
test('live matches are labeled in Polish, without color-only indication',()=>{
  assert.match(src,/>W TOKU<\/span>/);
  assert.doesNotMatch(src,/>LIVE<\/span>/);
});
test('completed match checkmark is decorative and spoken result is available',()=>{
  assert.match(src,/<span aria-hidden="true">✓<\/span><span className="sr-only">Mecz zakończony<\/span>/);
  assert.match(src,/bez rozstrzygnięcia/);
});
