'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {analyze,FREEZE}=require('./frame-evidence.cjs');
const header=(extra={})=>({kind:'header',role:'client',schema:'CC001_A43_W13_FRAMES_001',origin:'runtime',sourceSha:FREEZE,...extra});
const row=(frame,ms,extra={})=>({kind:'frame',frame,ms,ballId:1,revision:1,actionSerial:1,phase:'Moving',event:'NONE',x:frame,y:0,authX:frame,authY:0,speed:10,...extra});
const text=(a,h={})=>[header(h),...a].map(JSON.stringify).join('\n');
const normal=()=>[row(1,0),row(2,16),row(3,32)];
test('freeze matched but G3 never asserted',()=>{let r=analyze(text(normal()));assert.equal(r.status,'OBSERVATIONS_ONLY');assert.equal(r.independentG3Attested,false);assert.equal(r.frameTiming.p95Ms,16)});
test('moving #207 is wrong W11 source',()=>{let r=analyze(text(normal(),{sourceSha:'87b718432f4ce3906c907a7f4a1e2b4fb2a95f9c'}));assert.equal(r.status,'WRONG_SOURCE_DECLARATION')});
test('header must be P2, not host',()=>assert.throws(()=>analyze(text(normal(),{role:'host'})),/header/));
test('video cannot be used for Unity frame time',()=>{let r=analyze(text(normal(),{origin:'video'}));assert.equal(r.frameTiming,null);assert.equal(r.status,'INSUFFICIENT')});
test('missing frames cannot produce continuous frame timing',()=>{let r=analyze(text([row(1,0),row(3,16),row(4,32)]));assert.equal(r.frameTiming,null);assert.ok(r.missing.includes('MISSING_FRAME_IDS'))});
test('less than three frames insufficient',()=>assert.equal(analyze(text([row(1,0)])).status,'INSUFFICIENT'));
test('portal snap discrepancy flagged',()=>{let r=analyze(text([row(1,0),row(2,16,{event:'PORTAL',x:50,authX:0}),row(3,32)]));assert.equal(r.signals[0].code,'PORTAL_SNAP_MISMATCH')});
test('portal correct snap is observation',()=>{let r=analyze(text([row(1,0),row(2,16,{event:'PORTAL',x:50,authX:50}),row(3,32)]));assert.equal(r.totals.portals,1);assert.equal(r.signals.length,0)});
test('teleport and swap excluded from frozen SHA',()=>{let r=analyze(text([row(1,0),row(2,16,{event:'TELEPORT'}),row(3,32,{event:'SWAP'})]));assert.equal(r.totals.unsupportedLaterEvents,2);assert.equal(r.status,'INSUFFICIENT')});
test('W14 any reversed revision is rejected as invalid capture chronology',()=>assert.throws(()=>analyze(text([row(1,0,{revision:3}),row(2,16,{revision:2}),row(3,32)])),/global revision regression/));
test('hold over threshold is investigative only',()=>{let a=[0,90,190,280].map((ms,i)=>row(i+1,ms,{x:0,authX:i*3}));let r=analyze(text(a));assert.equal(r.totals.holdCandidates,1);assert.equal(r.independentG3Attested,false)});
test('no hold if true velocity is zero',()=>{let a=[0,90,190,280].map((ms,i)=>row(i+1,ms,{x:0,speed:0}));assert.equal(analyze(text(a)).totals.holdCandidates,0)});
test('duplicate ball within frame rejected',()=>assert.throws(()=>analyze(text([row(1,0),row(1,0)])),/duplicate/));
test('frame timestamps must be increasing',()=>assert.throws(()=>analyze(text([row(1,10),row(2,10)])),/clock/));
test('malformed numeric fields rejected',()=>assert.throws(()=>analyze(text([row(1,0,{x:'NaN'})])),/invalid frame/));
test('absent moving observations insufficient',()=>{let r=analyze(text(normal().map(x=>({...x,phase:'Aiming'}))));assert.equal(r.status,'INSUFFICIENT')});

// W14: capture-integrity regression; these checks validate the analyzer, not a PC1/PC2 run.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),spawnSync=require('node:child_process').spawnSync;
test('W14 reject inconsistent authoritative revision within same video frame',()=>{
  assert.throws(()=>analyze(text([row(1,0),row(1,0,{ballId:2,revision:2}),row(2,16),row(3,32)])),/inconsistent snapshot metadata/);
});
test('W14 reject contradictory actionSerial within one frame',()=>{
  assert.throws(()=>analyze(text([row(1,0),row(1,0,{ballId:2,actionSerial:2}),row(2,16),row(3,32)])),/inconsistent snapshot metadata/);
});
test('W14 reject mixed Aiming and Moving phase in same frame',()=>{
  assert.throws(()=>analyze(text([row(1,0),row(1,0,{ballId:2,phase:'Aiming'}),row(2,16),row(3,32)])),/inconsistent snapshot metadata/);
});
test('W14 reject global revision rollback even if the prior ball disappears',()=>{
  assert.throws(()=>analyze(text([row(1,0,{ballId:1,revision:8}),row(2,16,{ballId:2,revision:7}),row(3,32,{ballId:2,revision:9})])),/global revision regression/);
});
test('W14 reject global action rollback even if ball IDs change',()=>{
  assert.throws(()=>analyze(text([row(1,0,{ballId:1,actionSerial:3}),row(2,16,{ballId:2,actionSerial:2}),row(3,32)])),/global action serial regression/);
});
test('W14 allow multi-ball same-frame metadata if coherent',()=>{
  const r=analyze(text([row(1,0),row(1,0,{ballId:2,x:4}),row(2,16),row(2,16,{ballId:2,x:5}),row(3,32)]));
  assert.equal(r.status,'OBSERVATIONS_ONLY');assert.equal(r.totals.observations,5);
});
test('W14 revision gap suppresses misleading continuous pose hold',()=>{
  const rows=[row(1,0,{revision:1,x:0}),row(2,90,{revision:2,x:0}),row(3,190,{revision:7,x:0}),row(4,280,{revision:7,x:0})];
  const r=analyze(text(rows));assert.equal(r.status,'INSUFFICIENT');
  assert.equal(r.totals.holdCandidates,0);assert.equal(r.totals.suppressedHoldSegments,1);
  assert.ok(r.missing.includes('INTERVENING_SNAPSHOT_REVISIONS_UNOBSERVED'));
});
test('W14 source mismatch still dominates incomplete evidence',()=>{
  const r=analyze(text([row(1,0,{revision:2}),row(2,20,{revision:5})],{sourceSha:'87b718432f4ce3906c907a7f4a1e2b4fb2a95f9c'}));
  assert.equal(r.status,'WRONG_SOURCE_DECLARATION');
});
test('W14 CLI refuses ignored third positional argument',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-w14-'));try{
    const input=path.join(dir,'trace.ndjson');fs.writeFileSync(input,text(normal()));
    const r=spawnSync(process.execPath,[path.join(__dirname,'frame-evidence.cjs'),input,path.join(dir,'out.json'),'IGNORED'],{encoding:'utf8'});
    assert.equal(r.status,3);assert.match(r.stderr,/usage/);assert.equal(fs.existsSync(path.join(dir,'out.json')),false);
  }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('W14 CLI rejects symlink original input file',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-w14-'));try{
    const input=path.join(dir,'trace.ndjson'),link=path.join(dir,'alias.ndjson');fs.writeFileSync(input,text(normal()));
    try{fs.symlinkSync(input,link)}catch(e){if(['EPERM','EACCES'].includes(e.code))return t.skip('symlink unavailable');throw e}
    const r=spawnSync(process.execPath,[path.join(__dirname,'frame-evidence.cjs'),link],{encoding:'utf8'});
    assert.equal(r.status,3);assert.match(r.stderr,/symlink/);
  }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('W14 CLI rejects invalid UTF8 bytes before parsing JSON',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-w14-'));try{
    const input=path.join(dir,'bad.ndjson');fs.writeFileSync(input,Buffer.concat([Buffer.from(text(normal())),Buffer.from([0xff])]));
    const r=spawnSync(process.execPath,[path.join(__dirname,'frame-evidence.cjs'),input],{encoding:'utf8'});
    assert.equal(r.status,3);assert.match(r.stderr,/encoded data|valid|UTF/i);
  }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
