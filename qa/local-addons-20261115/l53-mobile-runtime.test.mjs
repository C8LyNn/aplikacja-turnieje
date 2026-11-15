import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const file=new URL('../../artifacts/tournament-manager/src/hooks/use-mobile.tsx',import.meta.url);
const source=readFileSync(file,'utf8');
const compiled=ts.transpileModule(source,{ reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});
const diagnostics=compiled.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error)??[];
function run(windowMock){
  let value, effect, updates=[];
  const fakeReact={useState:init=>{value=init;return [value,v=>{value=typeof v==='function'?v(value):v;updates.push(value)}]},useEffect:fn=>{effect=fn}};
  const context={exports:{},window:windowMock,require:id=>{if(id==='react')return fakeReact;throw Error(id)}};
  vm.runInNewContext(compiled.outputText,context,{timeout:1500});
  const initial=context.exports.useIsMobile();
  const cleanup=effect?.();
  return {initial,get value(){return value},updates,cleanup};
}

test('L53: source transpiles without errors',()=>assert.equal(diagnostics.length,0));
test('L53: media-query matches wins over possibly stale window.innerWidth',()=>{
  const callbacks=[];
  const mql={matches:true,addEventListener:(_type,fn)=>callbacks.push(fn),removeEventListener:(_type,fn)=>{const i=callbacks.indexOf(fn);if(i>=0)callbacks.splice(i,1)}};
  const r=run({innerWidth:1400,matchMedia:()=>mql});
  assert.equal(r.value,true);
  assert.equal(callbacks.length,1);
  mql.matches=false;
  callbacks[0]({matches:false});
  assert.equal(r.value,false);
  r.cleanup();
  assert.equal(callbacks.length,0);
});
test('L53: legacy MediaQueryList listener is supported',()=>{
  let listener=null,removed=null;
  const mql={matches:true,addListener:fn=>{listener=fn},removeListener:fn=>{removed=fn}};
  const r=run({innerWidth:1200,matchMedia:()=>mql});
  assert.equal(r.value,true);
  assert.equal(typeof listener,'function');
  listener({matches:false});
  assert.equal(r.value,false);
  r.cleanup();
  assert.equal(removed,listener);
});
test('L53: without matchMedia resize fallback handles both sides of breakpoint',()=>{
  let listener=null;let removed=null;
  const w={innerWidth:600,addEventListener:(_type,fn)=>{listener=fn},removeEventListener:(_type,fn)=>{removed=fn}};
  const r=run(w);
  assert.equal(r.value,true);
  w.innerWidth=900;listener();assert.equal(r.value,false);
  w.innerWidth=767;listener();assert.equal(r.value,true);
  r.cleanup();assert.equal(removed,listener);
});
test('L53: media-query listener stays consistent at 767/768 boundary',()=>{
  let fn;const mql={matches:false,addEventListener:(_t,callback)=>{fn=callback},removeEventListener:()=>{}};
  const r=run({matchMedia:()=>mql,innerWidth:768});
  assert.equal(r.value,false);
  fn({matches:true});assert.equal(r.value,true);
});
