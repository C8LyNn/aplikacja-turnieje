#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const h=require('node:crypto');
const mod=require('./pc-pair-trace.cjs');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-a51-w9-'));
let pass=0;
function run(name,callback){callback();pass++;console.log('PASS '+name);}
function file(name,content){const p=path.join(tmp,name);fs.writeFileSync(p,content);return p;}
const hash=t=>h.createHash('sha256').update(t).digest('hex');
const ev=(peer,sequence,kind,extra={})=>({schema:mod.SCHEMA,peer,sequence,kind,...extra});
function jsonl(name,events){return file(name,events.map(x=>JSON.stringify(x)).join('\n')+'\n');}
try{
 const pc1=file('pc1.log','CC_NET_HOST_READY port=7777\nCC_NET_PEER_CONNECTED id=182 owner=1\nCC_NET_INTENT_ACCEPT owner=1 seq=3 action=4\n');
 const pc2=file('pc2.log','CC_NET_BRIDGE_SPAWNED server=False\nCC_NET_STATE_APPLIED revision=1 owner=1\n');
 run('legacy logs: recognize first snapshot but parity not proven',()=>{
   const report=mod.analyze({pc1:mod.readLog(pc1,'PC1'),pc2:mod.readLog(pc2,'PC2')});
   assert.equal(report.observations.hostP2AcceptedIntentCount,1);
   assert.equal(report.observations.firstClientAppliedRevision,1);
   assert.equal(report.observations.pairedStateHashesCompared,0);
   assert.equal(report.qualification.snapshotParity,'NOT_PROVEN');
   assert.equal(report.qualification.G3,'NOT_CERTIFIED_BY_ANALYZER');
   assert.ok(report.warnings.some(x=>x.includes('only FIRST')));
   assert.ok(!JSON.stringify(report).includes('182 owner=1'));
 });
 const sample=[
  ev('PC1',1,'SNAPSHOT_SENT',{revision:12,stateHash:hash('A')}),
  ev('PC1',2,'SNAPSHOT_SENT',{revision:13,stateHash:hash('B')}),
  ev('PC2',1,'SNAPSHOT_APPLIED',{revision:12,stateHash:hash('A')}),
  ev('PC2',2,'SNAPSHOT_APPLIED',{revision:13,stateHash:hash('B')}),
  ev('PC2',3,'FRAME_PRESENTED',{balls:[{id:5,x:100,y:100}]}),
  ev('PC2',4,'FRAME_PRESENTED',{balls:[{id:5,x:105,y:104}]}),
  ev('PC2',5,'LOCAL_TURN_DISPLAYED',{localOwner:1,turnOwner:1,isAiming:true,label:'YOUR SHOT',cameraBottomOwner:1}),
 ];
 run('clean stream: 2 hash matches, no findings',()=>{
   const report=mod.analyze({structured:mod.readJsonl(jsonl('ok.jsonl',sample))});
   assert.equal(report.observations.pairedStateHashesCompared,2);
   assert.equal(report.findings.length,0);
   assert.equal(report.observations.frameDelta.samples,1);
 });
 run('tampered snapshot hash is hard mismatch',()=>{
   const changed=sample.map(x=>({...x}));changed[3].stateHash=hash('tampered');
   const report=mod.analyze({structured:mod.readJsonl(jsonl('wrong.jsonl',changed))});
   assert.equal(report.findings.filter(x=>x.code==='AUTHORITATIVE_STATE_MISMATCH').length,1);
 });
 run('out-of-order applied revisions fail monotonicity',()=>{
   const data=[ev('PC2',1,'SNAPSHOT_APPLIED',{revision:9}),ev('PC2',2,'SNAPSHOT_APPLIED',{revision:8})];
   const report=mod.analyze({structured:mod.readJsonl(jsonl('stale.jsonl',data))});
   assert.ok(report.findings.some(x=>x.code==='APPLIED_REVISION_NON_MONOTONIC'));
 });
 run('duplicate event sequence is detected',()=>{
   const data=[ev('PC2',4,'SNAPSHOT_APPLIED',{revision:3}),ev('PC2',4,'SNAPSHOT_APPLIED',{revision:4})];
   const report=mod.analyze({structured:mod.readJsonl(jsonl('duplicate.jsonl',data))});
   assert.ok(report.findings.some(x=>x.code==='EVENT_SEQUENCE_NON_MONOTONIC'));
 });
 run('false YOUR SHOT on P2 is an error',()=>{
   const data=[ev('PC2',1,'LOCAL_TURN_DISPLAYED',{localOwner:1,turnOwner:0,isAiming:true,label:'TURN 1 / 50 PLAYER 1 / YOUR SHOT',cameraBottomOwner:0})];
   const report=mod.analyze({structured:mod.readJsonl(jsonl('false-turn.jsonl',data))});
   assert.ok(report.findings.some(x=>x.code==='FALSE_LOCAL_TURN_LABEL'));
   assert.ok(report.findings.some(x=>x.code==='VIEW_NOT_LOCAL_BOTTOM'));
 });
 run('large frame discontinuity is OBSERVATION not an automatic FAIL',()=>{
   const data=[ev('PC2',1,'FRAME_PRESENTED',{balls:[{id:1,x:0,y:0}]}),ev('PC2',2,'FRAME_PRESENTED',{balls:[{id:1,x:100,y:0}]})];
   const report=mod.analyze({structured:mod.readJsonl(jsonl('jump.jsonl',data))});
   const finding=report.findings.find(x=>x.code==='FRAME_POSITION_JUMP');
   assert.equal(finding.severity,'OBSERVATION');assert.equal(finding.distance,100);
 });
 run('spawning new ball does not create fake jump',()=>{
   const data=[ev('PC2',1,'FRAME_PRESENTED',{balls:[{id:1,x:0,y:0}]}),ev('PC2',2,'FRAME_PRESENTED',{balls:[{id:1,x:1,y:0},{id:2,x:50,y:60}]})];
   const report=mod.analyze({structured:mod.readJsonl(jsonl('spawn.jsonl',data))});
   assert.equal(report.observations.frameDelta.samples,1);
 });
 run('invalid JSONL rejects and exits without success',()=>{
   const p=file('broken.jsonl','{bad\n');assert.throws(()=>mod.readJsonl(p),/Invalid JSONL/);
 });
 run('NaN JSON token (invalid JSON) rejected',()=>{assert.throws(()=>mod.readJsonl(file('nan.jsonl','{"x":NaN}\n')));});
 run('duplicate ball ids rejected before analysis',()=>{
   const p=jsonl('dupball.jsonl',[ev('PC2',1,'FRAME_PRESENTED',{balls:[{id:1,x:0,y:0},{id:1,x:2,y:3}]})]);
   assert.throws(()=>mod.readJsonl(p),/Invalid ball/);
 });
 run('corrupt event schema rejected',()=>{
   const p=jsonl('corrupt.jsonl',[{...ev('PC2',1,'SNAPSHOT_APPLIED',{revision:2}),schema:'wrong'}]);assert.throws(()=>mod.readJsonl(p),/Wrong schema/);
 });
 run('input hash listed for provenance, no raw log lines published',()=>{
   const report=mod.analyze({pc1:mod.readLog(pc1,'PC1')});
   assert.equal(report.inputs.pc1.sha256,hash(fs.readFileSync(pc1)));
   assert.ok(!JSON.stringify(report).includes('CC_NET_PEER_CONNECTED id=182'));
 });
 run('CLI emits json report successfully',()=>{
   const r=cp.spawnSync(process.execPath,[path.join(__dirname,'pc-pair-trace.cjs'),'--pc1',pc1,'--pc2',pc2],{encoding:'utf8'});
   assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).qualification.G3,'NOT_CERTIFIED_BY_ANALYZER');
 });
 run('CLI malformed trace exits 2',()=>{
   const r=cp.spawnSync(process.execPath,[path.join(__dirname,'pc-pair-trace.cjs'),'--events',path.join(tmp,'broken.jsonl')],{encoding:'utf8'});
   assert.equal(r.status,2);assert.match(r.stderr,/A51_TRACE_INPUT_ERROR/);
 });
 run('CLI refuses overwriting existing report',()=>{
   const existing=file('out.json','KEEP');const r=cp.spawnSync(process.execPath,[path.join(__dirname,'pc-pair-trace.cjs'),'--pc1',pc1,'--out',existing],{encoding:'utf8'});
   assert.equal(r.status,2);assert.equal(fs.readFileSync(existing,'utf8'),'KEEP');
 });
 run('W10 duplicate host revision cannot overwrite earlier conflicting hash',()=>{
   const data=[ev('PC1',1,'SNAPSHOT_SENT',{revision:40,stateHash:hash('A')}),ev('PC1',2,'SNAPSHOT_SENT',{revision:40,stateHash:hash('B')}),ev('PC2',1,'SNAPSHOT_APPLIED',{revision:40,stateHash:hash('B')})];
   const report=mod.analyze({structured:mod.readJsonl(jsonl('duplicate-host.jsonl',data))});
   assert.equal(report.observations.duplicateSnapshotRevisions,1);
   assert.equal(report.qualification.snapshotParity,'INVALID_DUPLICATE_REVISION');
   assert.ok(report.findings.some(x=>x.code==='AUTHORITATIVE_STATE_MISMATCH'));
   assert.ok(report.findings.some(x=>x.code==='SENT_REVISION_NON_MONOTONIC'));
 });
 run('W10 duplicate client revision cannot masquerade as two valid applies',()=>{
   const data=[ev('PC1',1,'SNAPSHOT_SENT',{revision:4,stateHash:hash('ok')}),ev('PC2',1,'SNAPSHOT_APPLIED',{revision:4,stateHash:hash('ok')}),ev('PC2',2,'SNAPSHOT_APPLIED',{revision:4,stateHash:hash('ok')})];
   const report=mod.analyze({structured:mod.readJsonl(jsonl('duplicate-client.jsonl',data))});
   assert.equal(report.observations.duplicateSnapshotRevisions,1);
   assert.equal(report.qualification.snapshotParity,'INVALID_DUPLICATE_REVISION');
 });
 run('W10 same revision different runIds cannot be claimed as parity',()=>{
   const data=[ev('PC1',1,'SNAPSHOT_SENT',{revision:1,runId:'RUN-0001',stateHash:hash('ok')}),ev('PC2',1,'SNAPSHOT_APPLIED',{revision:1,runId:'RUN-0002',stateHash:hash('ok')})];
   const report=mod.analyze({structured:mod.readJsonl(jsonl('cross-run.jsonl',data))});
   assert.equal(report.observations.pairedStateHashesCompared,0);
   assert.equal(report.qualification.snapshotParity,'INVALID_RUN_COLLISION');
   assert.ok(report.findings.some(x=>x.code==='CROSS_RUN_REVISION_COLLISION'));
 });
 run('W10 exact same runId is eligible for scoped payload comparison',()=>{
   const data=[ev('PC1',1,'SNAPSHOT_SENT',{revision:3,runId:'RUN-0003',stateHash:hash('yes')}),ev('PC2',1,'SNAPSHOT_APPLIED',{revision:3,runId:'RUN-0003',stateHash:hash('yes')})];
   const report=mod.analyze({structured:mod.readJsonl(jsonl('same-run.jsonl',data))});
   assert.equal(report.observations.pairedStateHashesCompared,1);
   assert.equal(report.qualification.snapshotParity,'COMPARED_PAIRWISE');
   assert.equal(report.qualification.snapshotParityScope,'SAME_RUN_ID');
   assert.equal(report.qualification.G3,'NOT_CERTIFIED_BY_ANALYZER');
 });
 run('W10 omitted runId is flagged ambiguous rather than fabricated proof',()=>{
   const data=[ev('PC1',1,'SNAPSHOT_SENT',{revision:3,stateHash:hash('yes')}),ev('PC2',1,'SNAPSHOT_APPLIED',{revision:3,stateHash:hash('yes')})];
   const report=mod.analyze({structured:mod.readJsonl(jsonl('missing-run.jsonl',data))});
   assert.equal(report.qualification.snapshotParityScope,'RUN_ID_MISSING');
   assert.equal(report.observations.unboundRunPairs,1);
   assert.ok(report.warnings.some(x=>x.includes('cross-session identity')));
 });
 run('W10 invalid runId fails input validation',()=>{
   const bad=jsonl('bad-run.jsonl',[ev('PC1',1,'SNAPSHOT_SENT',{revision:1,runId:'!',stateHash:hash('A')})]);
   assert.throws(()=>mod.readJsonl(bad),/Invalid runId/);
 });
 run('W10 missing matched revision is NOT mislabeled confirmed loss',()=>{
   const data=[ev('PC1',1,'SNAPSHOT_SENT',{revision:3,stateHash:hash('A')}),ev('PC1',2,'SNAPSHOT_SENT',{revision:4,stateHash:hash('B')}),ev('PC2',1,'SNAPSHOT_APPLIED',{revision:3,stateHash:hash('A')})];
   const report=mod.analyze({structured:mod.readJsonl(jsonl('missing-pair.jsonl',data))});
   assert.equal(report.observations.unpairedHostRevisions,1);
   assert.ok(report.warnings.some(x=>x.includes('NOT equivalent to packet loss')));
 });
 run('W10 PC2 claiming localOwner 0 is flagged regardless of honest label',()=>{
   const data=[ev('PC2',1,'LOCAL_TURN_DISPLAYED',{localOwner:0,turnOwner:0,isAiming:true,label:'YOUR SHOT'})];
   const report=mod.analyze({structured:mod.readJsonl(jsonl('wrong-peer-seat.jsonl',data))});
   assert.ok(report.findings.some(x=>x.code==='LOCAL_OWNER_PEER_MISMATCH'));
 });
 run('W10 cross-run contradiction produces identical deterministic reports',()=>{
   const data=[ev('PC1',1,'SNAPSHOT_SENT',{revision:3,runId:'RUN-0100',stateHash:hash('A')}),ev('PC2',1,'SNAPSHOT_APPLIED',{revision:3,runId:'RUN-0200',stateHash:hash('B')})];
   const parsed=mod.readJsonl(jsonl('deterministic-contradiction.jsonl',data));
   assert.deepEqual(mod.analyze({structured:parsed}),mod.analyze({structured:parsed}));
 });
 run('same evidence generates byte-identical reports',()=>{
   const inp=mod.readJsonl(jsonl('deterministic.jsonl',sample));
   assert.equal(JSON.stringify(mod.analyze({structured:inp})),JSON.stringify(mod.analyze({structured:inp})));
 });
 console.log(`RESULT: ${pass}/${pass} passed, 0 failed`);
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
