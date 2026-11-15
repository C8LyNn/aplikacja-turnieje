import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const repo = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const path = resolve(repo, 'artifacts/tournament-manager/src/hooks/use-deadlock-theme.ts');

function hookHarness() {
  const storage = new Map();
  const listeners = new Set();
  const localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, val) => storage.set(key, String(val)),
    removeItem: key => storage.delete(key),
    clear: () => storage.clear(),
  };
  const window = {
    addEventListener(type, cb) { if(type==='storage')listeners.add(cb); },
    removeEventListener(type, cb) { if(type==='storage')listeners.delete(cb); },
  };
  const slots = [];
  let cursor = 0;
  const depsEqual = (a,b) => a?.length===b?.length && a.every((x,i)=>Object.is(x,b[i]));
  const mockReact = {
    useState(initial) {
      const index = cursor++;
      if(!slots[index])slots[index]={value:typeof initial==='function'?initial():initial};
      const set = next => { slots[index].value = typeof next==='function'?next(slots[index].value):next; };
      return [slots[index].value,set];
    },
    useEffect(effect,deps) {
      const index = cursor++;
      if (!slots[index] || !depsEqual(slots[index].deps,deps)) {
        slots[index]?.cleanup?.();
        slots[index]={deps,cleanup:effect()};
      }
    },
    useCallback(cb,deps) {
      const index = cursor++;
      if(!slots[index] || !depsEqual(slots[index].deps,deps))slots[index]={cb,deps};
      return slots[index].cb;
    },
  };
  const content=readFileSync(path,'utf8');
  const {outputText,diagnostics}=ts.transpileModule(content,{fileName:path,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});
  assert.equal(diagnostics?.length ?? 0,0);
  const exports={};
  vm.runInNewContext(outputText,{exports,require:n=>{assert.equal(n,'react');return mockReact;},localStorage,window}, {filename:path});
  return {
    storage, localStorage, listeners,
    render(id) {cursor=0;return exports.useDeadlockTheme(id);},
    emit(event) { for(const fn of [...listeners])fn({storageArea:localStorage,...event}); },
    unmount() {for(const slot of slots)slot?.cleanup?.();},
  };
}

test('L55 mount uses the stored preference for its tournament',()=>{
  const h=hookHarness();h.localStorage.setItem('tm:deadlock-theme:10','true');
  assert.equal(h.render(10)[0],true);h.unmount();
});
test('L55 another tab changing THIS tournament updates the mounted hook',()=>{
  const h=hookHarness();h.render(10);assert.equal(h.listeners.size,1);
  h.localStorage.setItem('tm:deadlock-theme:10','true');h.emit({key:'tm:deadlock-theme:10',newValue:'true'});
  assert.equal(h.render(10)[0],true);h.unmount();
});
test('L55 external removal disables theme without touching another tournament',()=>{
  const h=hookHarness();h.render(10);h.localStorage.setItem('tm:deadlock-theme:10','true');h.emit({key:'tm:deadlock-theme:10'});
  assert.equal(h.render(10)[0],true);
  h.localStorage.removeItem('tm:deadlock-theme:10');h.emit({key:'tm:deadlock-theme:10',newValue:null});
  assert.equal(h.render(10)[0],false);h.unmount();
});
test('L55 ignores storage from other tournament',()=>{
  const h=hookHarness();h.render(10);h.localStorage.setItem('tm:deadlock-theme:11','true');h.emit({key:'tm:deadlock-theme:11',newValue:'true'});
  assert.equal(h.render(10)[0],false);h.unmount();
});
test('L55 ignores non-localStorage events',()=>{
  const h=hookHarness();h.render(10);
  h.localStorage.setItem('tm:deadlock-theme:10','true');h.emit({key:'tm:deadlock-theme:10',storageArea:{}});
  assert.equal(h.render(10)[0],false);h.unmount();
});
test('L55 storage.clear event re-reads the specific tournament',()=>{
  const h=hookHarness();h.localStorage.setItem('tm:deadlock-theme:10','true');h.render(10);
  h.localStorage.clear();h.emit({key:null,newValue:null});assert.equal(h.render(10)[0],false);h.unmount();
});
test('L55 switching tournaments removes old listener and isolates updates',()=>{
  const h=hookHarness();h.render(10);h.render(11);assert.equal(h.listeners.size,1);
  h.localStorage.setItem('tm:deadlock-theme:10','true');h.emit({key:'tm:deadlock-theme:10'});
  assert.equal(h.render(11)[0],false);
  h.localStorage.setItem('tm:deadlock-theme:11','true');h.emit({key:'tm:deadlock-theme:11'});
  assert.equal(h.render(11)[0],true);h.unmount();assert.equal(h.listeners.size,0);
});
test('L55 the local setter remains synchronous and writes only its key',()=>{
  const h=hookHarness();const [,set]=h.render(10);set(true);
  assert.equal(h.localStorage.getItem('tm:deadlock-theme:10'),'true');
  assert.equal(h.render(10)[0],true);
  set(false);assert.equal(h.localStorage.getItem('tm:deadlock-theme:10'),null);
  assert.equal(h.render(10)[0],false);h.unmount();
});
test('L55 without a tournament never registers storage listener',()=>{
  const h=hookHarness();assert.equal(h.render(undefined)[0],false);assert.equal(h.listeners.size,0);h.unmount();
});
