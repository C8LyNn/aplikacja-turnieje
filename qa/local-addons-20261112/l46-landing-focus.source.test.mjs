import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src=readFileSync(new URL('../../artifacts/tournament-manager/src/pages/landing.tsx',import.meta.url),'utf8');
test('navigation cards are discoverable with keyboard focus, not hover alone',()=>{
 assert.match(src,/focus-visible:ring-2/);
 assert.match(src,/focus-visible:ring-primary/);
 assert.match(src,/group-focus-visible:opacity-100/);
});
test('reduced-motion users are not forced to see moving or animated tiles',()=>{
 assert.match(src,/motion-reduce:transform-none/);
 assert.match(src,/motion-reduce:transition-none/);
});
test('standalone portfolio keeps document navigation; other modules preserve SPA Link',()=>{
 assert.match(src,/const TileLink = href === "\/portfolio\/" \? "a" : Link/);
 assert.match(src,/href: "\/portfolio\/"/);
 assert.match(src,/href: "\/tournaments"/);
});
test('icons are decorative; accessible text remains in headings and descriptions',()=>{
 assert.match(src,/<Icon aria-hidden="true" className="h-5 w-5" \/>/);
 assert.match(src,/<h2[^>]*>\{title\}<\/h2>/);
});
