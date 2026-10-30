'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {spawnSync}=require('node:child_process');
const {analyze,EXIT}=require('./check-displacement-trace.cjs');
const SHA='3f972cdbaea6289a7e33ce608f5d3256cfdab0a3';
function frame(revision,kind,ballId,otherId=0){
  const id=revision;
  const s={device:'PC2',observation:'POST_APPLY_POST_OBSERVE',phase:'Moving',revision,actionSerial:revision,
    cursorBefore:revision-1,cursorAfter:revision,events:[{id,kind,ballId,otherId}],
    hostBalls:[{id:7,x:112,y:230},{id:8,x:201,y:220}],renderedBalls:[{id:7,x:112,y:230},{id:8,x:201,y:220}]};
  return s;
}
function fixture(){return {schema:'CC001-A82-DISPLACEMENT-TRACE-v1',sourceSha:SHA,
  evidence:{captureType:'synthetic'},samples:[frame(1,'PORTAL',7),frame(2,'TELEPORT',7),frame(3,'SWAP',7,8)]};}
function result(modifier){const x=fixture();modifier?.(x);return analyze(x,SHA);}
test('valid synthetic PORTAL+TELEPORT+both SWAP renders PASS_SCOPED only',()=>{const x=result();assert.equal(x.status,'PASS_SCOPED');assert.equal(x.physicalG3Status,'NOT_ASSESSED');assert.equal(x.metrics.snapBallChecks,4);});
test('wrong SHA FAIL',()=>assert.equal(analyze(fixture(),'a'.repeat(40)).status,'FAIL'));
test('missing trace HOLD',()=>assert.equal(analyze(null,SHA).status,'HOLD'));
test('wrong schema HOLD',()=>assert.equal(result(x=>x.schema='bad').status,'HOLD'));
test('missing TELEPORT observation HOLD',()=>assert.equal(result(x=>x.samples.splice(1,1)).status,'HOLD'));
test('unsupported capture type HOLD',()=>assert.equal(result(x=>x.evidence.captureType='pass').status,'HOLD'));
test('teleport pose mismatch FAIL',()=>assert.equal(result(x=>x.samples[1].renderedBalls[0].x+=8).status,'FAIL'));
test('short (<220) teleport is still exact-pose required',()=>assert.equal(result(x=>x.samples[1].renderedBalls[0].x+=55).status,'FAIL'));
test('SWAP otherId pose mismatch FAIL',()=>assert.equal(result(x=>x.samples[2].renderedBalls[1].y+=2).status,'FAIL'));
test('SWAP initiator pose mismatch FAIL',()=>assert.equal(result(x=>x.samples[2].renderedBalls[0].x+=9).status,'FAIL'));
test('normal non-displacement event does not demand snap',()=>{const x=fixture();x.samples[2].events[0].kind='HIT';x.samples[2].renderedBalls[0].x+=100;assert.equal(analyze(x,SHA).status,'HOLD');});
test('cursor disagreement FAIL',()=>assert.equal(result(x=>x.samples[2].cursorAfter=8).status,'FAIL'));
test('duplicated revision FAIL',()=>assert.equal(result(x=>x.samples[2].revision=2).status,'FAIL'));
test('invalid ball IDs FAIL',()=>assert.equal(result(x=>x.samples[2].renderedBalls[0].id=0).status,'FAIL'));
test('duplicate host ball FAIL',()=>assert.equal(result(x=>x.samples[0].hostBalls.push({...x.samples[0].hostBalls[0]})).status,'FAIL'));
test('nonfinite displayed coordinates FAIL',()=>assert.equal(result(x=>x.samples[0].renderedBalls[0].x=Infinity).status,'FAIL'));
test('no samples HOLD',()=>assert.equal(result(x=>x.samples=[]).status,'HOLD'));
test('stale event does not demand a snap',()=>{const x=fixture();x.samples[2].events[0].id=2;x.samples[2].cursorAfter=2;assert.equal(analyze(x,SHA).status,'HOLD');});
test('operator label never certifies physical G3',()=>{const x=fixture();x.evidence.captureType='operator';const v=analyze(x,SHA);assert.equal(v.status,'PASS_SCOPED');assert.equal(v.physicalG3Status,'NOT_ASSESSED');});
test('CLI positive run exit0',()=>{const d=fs.mkdtempSync(path.join(os.tmpdir(),'cc001a82-'));try{const f=path.join(d,'valid.json');fs.writeFileSync(f,JSON.stringify(fixture()));const r=spawnSync(process.execPath,[path.join(__dirname,'check-displacement-trace.cjs'),'--expected-sha',SHA,f],{encoding:'utf8'});assert.equal(r.status,EXIT.PASS,r.stderr);assert.equal(JSON.parse(r.stdout).physicalG3Status,'NOT_ASSESSED');}finally{fs.rmSync(d,{recursive:true,force:true});}});
test('CLI bad source exit1',()=>{const d=fs.mkdtempSync(path.join(os.tmpdir(),'cc001a82-'));try{const f=path.join(d,'bad.json');fs.writeFileSync(f,JSON.stringify(fixture()));const r=spawnSync(process.execPath,[path.join(__dirname,'check-displacement-trace.cjs'),'--expected-sha','a'.repeat(40),f],{encoding:'utf8'});assert.equal(r.status,EXIT.FAIL);}finally{fs.rmSync(d,{recursive:true,force:true});}});
test('CLI missing file exit2',()=>{const r=spawnSync(process.execPath,[path.join(__dirname,'check-displacement-trace.cjs'),'--expected-sha',SHA,'not-found.json'],{encoding:'utf8'});assert.equal(r.status,EXIT.HOLD);});
test('CLI invalid arguments exit64',()=>{const r=spawnSync(process.execPath,[path.join(__dirname,'check-displacement-trace.cjs')],{encoding:'utf8'});assert.equal(r.status,EXIT.USAGE);});
