import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = readFileSync(new URL('../../artifacts/tournament-manager/src/pages/help.tsx', import.meta.url), 'utf8');
// Directly execute transpiled page and its accordion functions with a small JSX runtime.
const compiled = ts.transpileModule(source, { reportDiagnostics: true, compilerOptions: {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
}});
const diagnostics = compiled.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error) ?? [];
function tree(forceOpen = false) {
  let nextId = 0;
  const jsx = (type, props) => ({type, props: props ?? {}});
  const fakeReact = { useId: () => `section-${++nextId}`, useState: initial => [forceOpen ? true : initial, () => {}] };
  const exports = {};
  const context = { exports, require: id => {
    if (id === 'react') return fakeReact;
    if (id === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (id === '@/components/layout') return { Layout: props => props.children };
    if (id === 'lucide-react') return new Proxy({}, { get: (_target, name) => props => jsx(String(name), props) });
    throw new Error('Unexpected runtime import: ' + id);
  }};
  vm.runInNewContext(compiled.outputText, context, {timeout: 1500});
  function expand(input) {
    if (Array.isArray(input)) return input.flatMap(expand);
    if (input === null || input === undefined || typeof input === 'boolean') return [];
    if (typeof input !== 'object') return [{type:'#text',value:String(input),props:{}}];
    if (typeof input.type === 'function') return expand(input.type(input.props));
    const props = input.props ?? {};
    return [{type:input.type,props,children:expand(props.children)}];
  }
  return expand(context.exports.default({}));
}
function all(nodes) { return nodes.flatMap(n => [n, ...all(n.children ?? [])]); }
const nodes = all(tree());
const text = all(tree(true)).filter(n => n.type === '#text').map(n=>n.value).join(' ');

test('L52: TypeScript transpilation does not report JSX or syntax errors', () => {
  assert.equal(diagnostics.length, 0, JSON.stringify(diagnostics));
});
test('L52: 7 named disclosure controls expose unique aria-controls and aria-expanded', () => {
  const buttons = nodes.filter(n=>n.type==='button' && typeof n.props['aria-expanded']==='boolean');
  assert.equal(buttons.length,7);
  assert.equal(new Set(buttons.map(b=>b.props['aria-controls'])).size,7);
  assert.ok(buttons.every(b=>b.props.id && b.props['aria-controls']));
  assert.equal(buttons.filter(b=>b.props['aria-expanded']).length,1);
});
test('L52: disclosed panel is a region linked to its own trigger', () => {
  const buttons=nodes.filter(n=>n.type==='button'&&n.props['aria-expanded']===true);
  const panel=nodes.find(n=>n.type==='div'&&n.props.id===buttons[0]?.props['aria-controls']);
  assert.ok(panel);
  assert.equal(panel.props.role,'region');
  assert.equal(panel.props['aria-labelledby'],buttons[0].props.id);
});
test('L52: disclosure trigger is a real button nested under heading, with keyboard focus', () => {
  const heads=nodes.filter(n=>n.type==='h2');
  const triggers=nodes.filter(n=>n.type==='button'&&typeof n.props['aria-expanded']==='boolean');
  assert.equal(heads.length,7);
  assert.ok(heads.every(h=>(h.children ?? []).some(n=>triggers.includes(n))));
  assert.ok(triggers.every(b=>b.props.type==='button'&&b.props.className.includes('focus-visible:')));
});
test('L52: documentation distinguishes new organizer password from legacy host code', () => {
  assert.match(text,/hasło organizatora/);
  assert.match(text,/starszych turniejach może być dostępny/);
  assert.doesNotMatch(text,/Bez kodu każdy/);
});
test('L52: documentation explicitly distinguishes V3 export and V2 import', () => {
  assert.match(text,/Eksport V3 jest dostępny/);
  assert.match(text,/import V3 jest wyłączony/);
  assert.match(text,/Import V2/);
  assert.doesNotMatch(text,/Powstanie backup JSON w formacie v2/);
});
test('L52: audience access description does not promise public access for password protected views', () => {
  assert.match(text,/hasło widza/);
  assert.doesNotMatch(text,/Udostępniaj go swobodnie/);
});
test('L52: no security instruction treats sharing /host as sufficient authorization', () => {
  assert.doesNotMatch(text,/znajomością URL \/host może edytować/);
  assert.match(text,/nie powinien zastępować weryfikacji uprawnień/);
});
