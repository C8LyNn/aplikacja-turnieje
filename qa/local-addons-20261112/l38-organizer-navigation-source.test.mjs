import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const s=readFileSync(resolve(root,'artifacts/tournament-manager/src/components/tournament-organizer-navigation.tsx'),'utf8');
test('L38: more-button exposes active sub-area without claiming to be a page',()=>{
  assert.match(s,/const moreActiveItem = more\.find\(/);
  assert.match(s,/aktywny obszar: \$\{moreActiveItem\.label\}/);
  assert.doesNotMatch(s,/aria-current=\{moreActive \? "page"/);
});
test('L38: actual current submenu link receives aria-current',()=>{
  assert.match(s,/<Link href=\{item\.href\} aria-current=\{item\.area === active \? "page" : undefined\}/);
});
test('L38: primary navigation keeps aria-current per item',()=>{
  assert.match(s,/aria-current=\{item\.area === active \? "page" : undefined\}/);
});
test('L38: keyboard and touch targets for expanded menu are retained',()=>{
  assert.match(s,/min-h-11 shrink-0/);
  assert.match(s,/focus-visible:ring-primary/);
  assert.match(s,/className="flex min-h-11 items-center"/);
});
test('L38: organizer permissions still gate all sensitive navigation',()=>{
  for(const c of ['canManageOrganizerSettings','canManageSharing','canManageBackup','canUndo'])assert.match(s,new RegExp(c));
  assert.match(s,/tournamentModeHref\(item\.href, isExperimental\)/);
});
