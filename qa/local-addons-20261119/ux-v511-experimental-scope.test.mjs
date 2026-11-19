// V5.11 · the new Experimental stylesheet never reaches Stable: every selector starts with an Experimental root.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../artifacts/tournament-manager/src');
const src = (file) => readFileSync(path.join(root, file), 'utf8');
const ROOTS = /^(?::is\((?:\.experimental-tournament-(?:shell|create|public|entry)(?:,\s*)?)+\)|\.experimental-tournament-(?:shell|create|public|entry))(?=[\s.:[>]|$)/;

function selectors(css) {
  const out = [];
  const body = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const re = /([^{}]+)\{/g;
  let match;
  while ((match = re.exec(body))) {
    const sel = match[1].trim();
    if (!sel || sel.startsWith('@') || /^(from|to|\d+%)$/.test(sel)) continue;
    let depth = 0, cur = '';
    for (const ch of sel) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
    }
    out.push(cur.trim());
  }
  return out.filter(Boolean);
}

test('experimental-v511.css is imported after the design system', () => {
  const index = src('index.css');
  const ds = index.indexOf('experimental-design-system.css');
  const v511 = index.indexOf('experimental-v511.css');
  assert.ok(ds > 0 && v511 > ds, 'the V5.11 sheet must load after the design system');
});

test('every V5.11 selector is scoped to an Experimental root', () => {
  const list = selectors(src('experimental-v511.css'));
  assert.ok(list.length >= 5, `only ${list.length} selectors`);
  for (const sel of list) assert.match(sel, ROOTS, `unscoped selector: ${sel}`);
});
