import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const source=readFileSync(new URL('../../artifacts/tournament-manager/src/lib/match-operation-feedback.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
const errors=compiled.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error)??[];
const context={exports:{},require:id=>{
  if(id!=='./tournament-stages-ui')throw new Error(id);
  // Mirror the relevant behavior of getApiErrorMessage, including JS inherited properties.
  return {getApiErrorMessage:error=>{
    const messages={STAGE_INCOMPLETE:'Nie wszystkie wymagane mecze etapu zostały zakończone.'};
    const code=error?.data?.code;
    return (code&&messages[code])||error?.data?.error||error?.message||'Nie udało się wykonać operacji.';
  }};
}};
vm.runInNewContext(compiled.outputText,context,{timeout:1500});
const call=e=>context.exports.matchOperationError(e);

test('L54: TS source compiles syntactically',()=>assert.equal(errors.length,0));
test('L54: known finalized match code retains specific message and conflict state',()=>{
  const r=call({status:409,data:{code:'MATCH_ALREADY_FINALIZED'}});
  assert.match(r.message,/już zapisany wynik/);
  assert.equal(r.conflict,true);
  assert.equal(r.code,'MATCH_ALREADY_FINALIZED');
});
test('L54: inherited constructor code is never treated as a message',()=>{
  const r=call({status:409,data:{code:'constructor'}});
  assert.equal(typeof r.message,'string');
  assert.match(r.message,/Stan meczu nie pozwala/);
});
test('L54: inherited toString code is never treated as a message',()=>{
  const r=call({status:503,data:{code:'toString'}});
  assert.equal(typeof r.message,'string');
  assert.match(r.message,/Nie udało się potwierdzić zapisu/);
});
test('L54: non-string data.error does not flow into operator-visible feedback',()=>{
  const r=call({status:503,data:{error:{debug:true}}});
  assert.equal(typeof r.message,'string');
  assert.match(r.message,/Nie udało się potwierdzić zapisu/);
});
test('L54: normal explanatory server message remains available',()=>{
  const r=call({status:400,data:{code:'OTHER_CODE',error:'Uzupełnij wynik na serwerze.'}});
  assert.equal(r.message,'Uzupełnij wynik na serwerze.');
});
test('L54: unknown 409 conflicts retain actionable generic hint',()=>{
  const r=call({status:409,data:{code:'NEW_CONFLICT'}});
  assert.match(r.message,/Stan meczu nie pozwala/);
  assert.equal(r.conflict,true);
});
test('L54: absence of an error remains a string and is not considered conflict',()=>{
  const r=call(null);
  assert.equal(typeof r.message,'string');
  assert.equal(r.conflict,false);
});
test('L54: numeric diagnostic code is discarded rather than propagated',()=>{
  const r=call({status:400,data:{code:123,error:'Nieprawidłowy wynik.'}});
  assert.equal(r.code,undefined);
  assert.equal(r.message,'Nieprawidłowy wynik.');
});
