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
const path = resolve(repo, 'artifacts/tournament-manager/src/components/deadlock-stage-bans-editor.tsx');
function fixture() {
 const {outputText,diagnostics}=ts.transpileModule(readFileSync(path,'utf8'),{fileName:path,compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});
 assert.equal(diagnostics?.length ?? 0,0);
 const make=(name)=>function Component(){return name;};
 const Button=make('Button'),Badge=make('Badge'),DeadlockHeroIcon=make('DeadlockHeroIcon');
 const HEROES=[{id:'abrams',displayName:'Abrams'},{id:'seven',displayName:'Seven'},{id:'wraith',displayName:'Wraith'}];
 const jsxs=(type,props,key)=>({type,props,key});
 const exports={};
 const mods={
  'react/jsx-runtime':{jsx:jsxs,jsxs},
  '@workspace/game-catalog':{DEADLOCK_HEROES:HEROES,sortHeroesByName:heroes=>[...heroes].sort((a,b)=>a.displayName.localeCompare(b.displayName)),getDeadlockEffectiveStageBans:()=>['abrams','wraith']},
  '@/components/deadlock-game-config':{DeadlockHeroIcon},
  '@/components/ui/badge':{Badge},
  '@/components/ui/button':{Button},
  '@/lib/utils':{cn:(...args)=>args.filter(Boolean).join(' ')},
 };
 vm.runInNewContext(outputText,{exports,require:name=>{assert.ok(name in mods,`missing ${name}`);return mods[name];}},{filename:path});
 const tree=(root, predicate, out=[])=>{
   if(Array.isArray(root)){for(const child of root)tree(child,predicate,out);return out;}
   if(!root || typeof root!=='object')return out;
   if(predicate(root))out.push(root);
   if(root.props && 'children' in root.props)tree(root.props.children,predicate,out);
   return out;
 };
 const buttons=root=>tree(root,n=>n.type===Button);
 const ptexts=root=>tree(root,n=>n.type==='p').map(n=> n.props.children);
 return {exports,HEROES,buttons,ptexts,tree,Badge};
}
test('L57 inherited button describes WHY it cannot be removed',()=>{
 const f=fixture();const ui=f.exports.DeadlockStageBansEditor({inherited:['abrams'],additional:['wraith'],onChange:()=>{}});
 const b=f.buttons(ui).find(node=>node.key==='abrams');
 assert.equal(b.props.disabled,true);assert.equal(b.props['aria-pressed'],true);
 assert.match(b.props['aria-label'],/Abrams.*odziedziczony.*nie można usunąć/);
 assert.match(b.props.title,/odziedziczony/);
});
test('L57 selected non-inherited hero communicates removal action',()=>{
 const f=fixture();const ui=f.exports.DeadlockStageBansEditor({inherited:[],additional:['wraith'],onChange:()=>{}});
 const b=f.buttons(ui).find(node=>node.key==='wraith');
 assert.equal(b.props['aria-pressed'],true);assert.equal(b.props.disabled,false);
 assert.match(b.props['aria-label'],/Usuń ban postaci Wraith/);
});
test('L57 available hero communicates the add action',()=>{
 const f=fixture();const ui=f.exports.DeadlockStageBansEditor({inherited:['abrams'],additional:[],onChange:()=>{}});
 const b=f.buttons(ui).find(node=>node.key==='seven');
 assert.equal(b.props['aria-pressed'],false);
 assert.match(b.props['aria-label'],/Dodaj ban postaci Seven/);
});
test('L57 live status reports both counts, without changing presentation rules',()=>{
 const f=fixture();const ui=f.exports.DeadlockStageBansEditor({inherited:['abrams'],additional:['wraith'],onChange:()=>{}});
 const region=f.tree(ui,n=>n.type==='p'&&n.props['aria-live']==='polite');assert.equal(region.length,1);
 assert.equal(region[0].props['aria-atomic'],'true');
 assert.match(JSON.stringify(region[0].props.children),/Odziedziczone/);
 assert.match(JSON.stringify(region[0].props.children),/1/);
});
test('L57 clicking an available hero adds only to current-stage list',()=>{
 const f=fixture();const calls=[];const ui=f.exports.DeadlockStageBansEditor({inherited:['abrams'],additional:['wraith'],onChange:ids=>calls.push([...ids])});
 f.buttons(ui).find(n=>n.key==='seven').props.onClick();assert.deepEqual(calls,[['wraith','seven']]);
});
test('L57 clicking selected hero removes it, inherited remains protected',()=>{
 const f=fixture();const calls=[];const ui=f.exports.DeadlockStageBansEditor({inherited:['abrams'],additional:['wraith'],onChange:ids=>calls.push([...ids])});
 f.buttons(ui).find(n=>n.key==='wraith').props.onClick();
 f.buttons(ui).find(n=>n.key==='abrams').props.onClick();assert.deepEqual(calls,[[]]);
});
test('L57 globally disabled editor never invokes callback',()=>{
 const f=fixture();let count=0;const ui=f.exports.DeadlockStageBansEditor({inherited:[],additional:[],disabled:true,onChange:()=>count++});
 for(const b of f.buttons(ui)){assert.equal(b.props.disabled,true);b.props.onClick();}
 assert.equal(count,0);
});
test('L57 summary retains the existing list without any mutation',()=>{
 const f=fixture();const summary=f.exports.DeadlockStageBansSummary({gameConfig:{gameId:'deadlock',config:{}},orderedStageKeys:['1'],stageKey:'1'});
 assert.equal(f.tree(summary,n=>n.type===f.Badge).length,2);
 assert.equal(f.exports.DeadlockStageBansSummary({gameConfig:{gameId:'marvel',config:{}},orderedStageKeys:['1'],stageKey:'1'}),null);
});
