'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {analyze,lineFields}=require('./analyze-host-traffic.cjs');
function row(rev,opts={}){
  const m={revision:rev,action:2,turn:1,phase:'Moving',balls:8,
    packedBytes:1000,chunks:2,periodMs:50,
    submitBytesTotal:rev*1000,submitChunksTotal:rev*2,
    submitSnapshotsTotal:rev,hostMs:rev*1000/16,...opts};
  return '[Unity] CC_W10_NET_HOST '+Object.entries(m).map(([k,v])=>k+'='+v).join(' ');
}
const pair=(a=row(16),b=row(32))=>a+'\n'+b+'\n';
test('two valid samples are diagnostics, never runtime or G3 PASS',()=>{
  const r=analyze(pair());
  assert.equal(r.status,'OBSERVED_ONLY');
  assert.equal(r.runtimeGate,'NOT_ASSESSED');
  assert.equal(r.compressedRpcBytesObserved,16000);
  assert.equal(r.averageSubmittedBytesPerSec,16000);
  assert.equal(r.overNominalBudgetWindows,0);
});
test('above nominal budget is surfaced without implying transport failure',()=>{
  const r=analyze(pair(row(16),row(32,{
    submitBytesTotal:316000,submitChunksTotal:380
  })));
  assert.equal(r.status,'OBSERVED_ONLY');
  assert.equal(r.overNominalBudgetWindows,1);
  assert.equal(r.peakWindowSubmittedBytesPerSec,300000);
});
test('single sample is HOLD and never provides a throughput rate',()=>{
  assert.equal(analyze(row(16)).status,'HOLD_INSUFFICIENT_SAMPLES');
});
test('no markers returns HOLD',()=>{
  assert.equal(analyze('ordinary Unity boot text').status,'HOLD_NO_HOST_MARKERS');
});
test('W11 frozen original host log without W13 cumulative fields is HOLD',()=>{
  assert.equal(analyze('CC_W10_NET_HOST revision=16 action=2 turn=1 phase=Moving balls=8 packedBytes=1000 chunks=2 periodMs=50').status,'HOLD_W13_LEDGER_MISSING');
});
test('mixed old and new host log formats also HOLD',()=>{
  assert.equal(analyze(row(16)+'\nCC_W10_NET_HOST revision=32 action=2 turn=1 phase=Moving balls=8 packedBytes=1000 chunks=2 periodMs=50').status,'HOLD_W13_LEDGER_MISSING');
});
test('a log containing more than one host launch is not one session',()=>{
  assert.equal(analyze('CC_NET_HOST_READY port=7777\n'+pair()+'CC_NET_HOST_READY port=7777\n').status,'HOLD_MULTIPLE_SESSIONS');
});
test('out-of-order revisions are rejected',()=>{
  assert.throws(()=>analyze(pair(row(32),row(16))),/NON_MONOTONIC/);
});
test('rewound local host clock is rejected',()=>{
  assert.throws(()=>analyze(pair(row(16),row(32,{hostMs:999}))),/NON_MONOTONIC/);
});
test('counter rewind is rejected',()=>{
  assert.throws(()=>analyze(pair(row(16),row(32,{submitBytesTotal:15000}))),/NON_MONOTONIC/);
});
test('counter cannot claim more payload bytes than 900 bytes per submitted chunk',()=>{
  assert.throws(()=>analyze(pair(row(16),row(32,{
    submitBytesTotal:116000,submitChunksTotal:33
  }))),/NON_MONOTONIC/);
});
test('invalid per-snapshot payload geometry is rejected',()=>{
  assert.throws(()=>analyze(pair(row(16,{packedBytes:901,chunks:1}),row(32))),/INVALID_SNAPSHOT_ROW/);
});
test('negative and nonfinite counters are rejected',()=>{
  assert.throws(()=>lineFields(row(16,{submitBytesTotal:-1})),/INVALID_submitBytesTotal/);
  assert.throws(()=>lineFields(row(16,{hostMs:'NaN'})),/INVALID_hostMs/);
});
test('duplicate numeric keys cannot be used to spoof the ledger',()=>{
  assert.throws(()=>lineFields(row(16)+' submitBytesTotal=99999'),/DUPLICATE_KEY/);
});
test('unsafe integers cannot turn into rounded counters',()=>{
  assert.throws(()=>lineFields(row(16,{submitBytesTotal:'9007199254740992'})),/UNSAFE_submitBytesTotal/);
});
test('suffix lookalike cannot masquerade as a host marker',()=>{
  const fake=pair().replaceAll('CC_W10_NET_HOST','CC_W10_NET_HOST_SUFFIX');
  assert.equal(analyze(fake).status,'HOLD_NO_HOST_MARKERS');
});
test('embedded host marker substring is ignored',()=>{
  const fake=pair().replaceAll('CC_W10_NET_HOST','prefixCC_W10_NET_HOST');
  assert.equal(analyze(fake).status,'HOLD_NO_HOST_MARKERS');
});
test('direct parser refuses lookalike marker but accepts normal Unity line',()=>{
  assert.throws(()=>lineFields(row(16).replace('CC_W10_NET_HOST','CC_W10_NET_HOST_FAKE')),/INVALID_HOST_MARKER/);
  assert.equal(lineFields(row(16)).revision,16);
});
test('client-only log does not impersonate a host',()=>{
  assert.equal(analyze(pair().replaceAll('CC_W10_NET_HOST','CC_W10_NET_CLIENT')).status,'HOLD_NO_HOST_MARKERS');
});
test('real CLI returns scoped diagnostics only and no raw log lines',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-w13-a41-'));
  try{
    const file=path.join(dir,'host.log');fs.writeFileSync(file,pair());
    const r=spawnSync(process.execPath,[require.resolve('./analyze-host-traffic.cjs'),'--host',file],{encoding:'utf8'});
    assert.equal(r.status,0);
    assert.equal(JSON.parse(r.stdout).status,'OBSERVED_ONLY');
    assert.equal(JSON.parse(r.stdout).runtimeGate,'NOT_ASSESSED');
    assert.ok(!r.stdout.includes('CC_W10_NET_HOST'));
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('real CLI missing W13 ledger returns HOLD exit 2',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-w13-a41-'));
  try{
    const file=path.join(dir,'host.log');fs.writeFileSync(file,'CC_W10_NET_HOST revision=1 action=0');
    const r=spawnSync(process.execPath,[require.resolve('./analyze-host-traffic.cjs'),'--host',file],{encoding:'utf8'});
    assert.equal(r.status,2);assert.equal(JSON.parse(r.stdout).status,'HOLD_W13_LEDGER_MISSING');
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('real CLI corrupted W13 counters exits 1',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-w13-a41-'));
  try{
    const file=path.join(dir,'host.log');fs.writeFileSync(file,pair(row(16),row(32,{hostMs:0})));
    const r=spawnSync(process.execPath,[require.resolve('./analyze-host-traffic.cjs'),'--host',file],{encoding:'utf8'});
    assert.equal(r.status,1);assert.match(r.stderr,/NON_MONOTONIC/);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('impossible 800000-byte delta from one submitted snapshot is rejected',()=>{
  assert.throws(()=>analyze(pair(row(16),row(17,{
    submitBytesTotal:816000,submitChunksTotal:932,hostMs:2000
  }))),/NON_MONOTONIC/);
});
test('a single snapshot cannot submit 300 chunks despite plausible aggregate bytes',()=>{
  assert.throws(()=>analyze(pair(row(16),row(17,{
    submitBytesTotal:216000,submitChunksTotal:332,hostMs:2000
  }))),/NON_MONOTONIC/);
});
test('initial sampled cumulative totals must respect per-snapshot codec capacity',()=>{
  assert.throws(()=>lineFields(row(16,{
    submitBytesTotal:1000000,submitChunksTotal:1200,submitSnapshotsTotal:2
  })),/INVALID_LEDGER_ROW/);
});
test('aggregate per-window chunk geometry cannot claim excess chunk overhead',()=>{
  assert.throws(()=>analyze(pair(row(16),row(32,{
    submitBytesTotal:32000,submitChunksTotal:72
  }))),/NON_MONOTONIC/);
});
