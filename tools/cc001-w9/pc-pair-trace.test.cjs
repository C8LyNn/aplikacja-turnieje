'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {parseLog,summarize} = require('./pc-pair-trace.cjs');
const trace = (e) => 'CC_W9_TRACE '+JSON.stringify(e);

test('legacy RC1 markers report missing continuous snapshot and turn evidence, not PASS',()=>{
  const h='CC_NET_HOST_READY port=7777\nCC_NET_PEER_CONNECTED id=77\nCC_NET_INTENT_ACCEPT owner=1 seq=1 action=2';
  const c='CC_NET_STATE_APPLIED revision=1 owner=1';
  const r=summarize(h,c);
  assert.equal(r.verdict,'INSUFFICIENT_EVIDENCE');
  assert.equal(r.p2_intent_host_accepted_count,1);
  assert.deepEqual(r.missing_observations.includes('continuous_snapshot_trace'),true);
  assert.equal(JSON.stringify(r).includes('id=77'),false);
});

test('monotonic per-client revisions and aligned ball snapshots',()=>{
  const h=[trace({type:'snapshot_sent',revision:5}),trace({type:'snapshot_sent',revision:7}),trace({type:'ball_state',revision:7,actionSerial:3,ballId:8,layer:'simulation',x:2,y:3})].join('\n');
  const c=[trace({type:'snapshot_applied',revision:5,monotonicMs:100}),trace({type:'snapshot_applied',revision:7,monotonicMs:350}),trace({type:'ball_state',revision:7,actionSerial:3,ballId:8,layer:'simulation',x:2.1,y:3}),trace({type:'turn_state',revision:7,turn:0,localOwner:1,phase:'aiming',banner:'opponent_turn'})].join('\n');
  const r=summarize(h,c,{driftThreshold:.2});
  assert.equal(r.coverage.matched_snapshot_revisions,2);
  assert.equal(r.client.sample_intervals_ms[0],250);
  assert.equal(r.paired_ball_samples,1);
  assert.equal(r.worst_ball_distance.distance,0.1);
  assert.equal(r.above_threshold_samples,0);
});

test('flag client revision regression but do not assume lost transport data',()=>{
  const c=[trace({type:'snapshot_applied',revision:4}),trace({type:'snapshot_applied',revision:2})].join('\n');
  const r=summarize('',c);
  assert.equal(r.verdict,'OBSERVED_CONTRADICTION');
  assert.equal(r.anomalies[0].code,'CLIENT_REVISION_NONMONOTONIC');
  assert.equal(r.coverage.client_applied_without_matching_host_sample,2);
});

test('P2 is not your turn during P1 aiming',()=>{
  const c=trace({type:'turn_state',revision:6,turn:0,localOwner:1,phase:'aiming',banner:'your_turn'});
  const r=summarize('',c);
  assert.equal(r.turn_mismatches[0].code,'TURN_BANNER_MISMATCH');
  assert.equal(r.turn_mismatches[0].expected,'opponent_turn');
});

test('moving phase cannot show actionable your-turn banner',()=>{
  const r=summarize(trace({type:'turn_state',revision:6,turn:0,localOwner:0,phase:'moving',banner:'your_turn'}),'');
  assert.equal(r.turn_mismatches[0].expected,'inactive');
});

test('authoritative simulation drift only matches same revision/action/ball',()=>{
  const h=trace({type:'ball_state',revision:6,actionSerial:2,ballId:1,layer:'simulation',x:0,y:0});
  const c=[trace({type:'ball_state',revision:7,actionSerial:2,ballId:1,layer:'simulation',x:100,y:100}),trace({type:'ball_state',revision:6,actionSerial:2,ballId:1,layer:'simulation',x:1,y:0})].join('\n');
  const r=summarize(h,c,{driftThreshold:0.5});
  assert.equal(r.paired_ball_samples,1);
  assert.equal(r.above_threshold_samples,1);
  assert.equal(r.worst_ball_distance.distance,1);
});

test('invalid JSON and malformed non-finite fields handled safely',()=>{
  const p=parseLog('CC_W9_TRACE {bad\n'+trace({type:'ball_state',revision:1,actionSerial:1,ballId:1,layer:'simulation',x:'NaN',y:0}),'client');
  assert.equal(p.malformed,2);assert.equal(p.events.length,0);
});

test('reject invalid threshold and do not leak error messages',()=>{
  assert.throws(()=>summarize('','',{driftThreshold:-1}),/Invalid drift/);
  const r=summarize('CC_NET_SNAPSHOT_ERROR internal token=secret','','');
  assert.equal(r.host.legacy.snapshot_error,1);
  assert.equal(JSON.stringify(r).includes('secret'),false);
});


test('authoritative turn can be compared only at equal revision AND action serial',()=>{
  const h=trace({type:'turn_state',revision:4,actionSerial:2,turn:0,localOwner:0,phase:'aiming',banner:'your_turn'});
  const c=[trace({type:'turn_state',revision:4,actionSerial:3,turn:1,localOwner:1,phase:'aiming',banner:'your_turn'}),
    trace({type:'turn_state',revision:4,actionSerial:2,turn:1,localOwner:1,phase:'aiming',banner:'your_turn'})].join('\n');
  const r=summarize(h,c);
  assert.equal(r.coverage.aligned_authoritative_turn_samples,1);
  assert.equal(r.paired_authoritative_turn_contradictions,1);
  assert.equal(r.anomalies.some(x=>x.code==='PAIRED_AUTHORITATIVE_TURN_MISMATCH'),true);
});

test('different revisions are not a turn desynchronization finding',()=>{
  const h=trace({type:'turn_state',revision:4,actionSerial:2,turn:0,localOwner:0,phase:'aiming',banner:'your_turn'});
  const c=trace({type:'turn_state',revision:5,actionSerial:2,turn:1,localOwner:1,phase:'aiming',banner:'your_turn'});
  const r=summarize(h,c);
  assert.equal(r.coverage.aligned_authoritative_turn_samples,0);
  assert.equal(r.paired_authoritative_turn_contradictions,0);
});

test('render poses at same revision are not authoritative pose parity',()=>{
  const h=trace({type:'ball_state',revision:10,actionSerial:4,ballId:1,layer:'render',x:0,y:0});
  const c=trace({type:'ball_state',revision:10,actionSerial:4,ballId:1,layer:'render',x:300,y:300});
  const r=summarize(h,c,{driftThreshold:.2});
  assert.equal(r.paired_ball_samples,0);
  assert.equal(r.above_threshold_samples,0);
  assert.equal(r.ignored_unaligned_render_pose_samples,2);
  assert.equal(r.missing_observations.includes('revision_aligned_simulation_ball_samples'),true);
});

test('client actionSerial regression is a separate contradiction',()=>{
  const c=[trace({type:'snapshot_applied',revision:1,actionSerial:5}),trace({type:'snapshot_applied',revision:2,actionSerial:3})].join('\n');
  const r=summarize('',c);
  assert.equal(r.anomalies.some(x=>x.code==='CLIENT_ACTION_SERIAL_REGRESSION'),true);
});

test('one initial snapshot line is insufficient to demonstrate continuity',()=>{
  const h=trace({type:'snapshot_sent',revision:1});
  const c=trace({type:'snapshot_applied',revision:1});
  const r=summarize(h,c);
  assert.equal(r.missing_observations.includes('continuous_snapshot_trace'),true);
});

test('invalid snapshot schema and negative monotonic time are rejected',()=>{
  const p=parseLog([trace({type:'snapshot_sent'}),trace({type:'snapshot_applied',revision:2,monotonicMs:-1}),
    trace({type:'intent_accepted',owner:9,sequence:1})].join('\n'),'host');
  assert.equal(p.malformed,3);
  assert.equal(p.events.length,0);
});

test('duplicate P2 accepts are trace flags, not an exactly-once inference',()=>{
  const h=[trace({type:'intent_accepted',owner:1,sequence:7}),trace({type:'intent_accepted',owner:1,sequence:7})].join('\n');
  const r=summarize(h,'');
  assert.equal(r.p2_accept_trace_duplicate_sequences,1);
  assert.equal(r.anomalies.some(x=>x.code==='DUPLICATE_P2_ACCEPT_TRACE_SEQUENCE'),true);
  assert.equal(JSON.stringify(r).includes('id='),false);
});

const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const native=(type,rev,serial,tms,turn)=>`CC_NET_TRACE_${type} rev=${rev} serial=${serial} tms=${tms} turn=${turn}`;

test('W10 native A31 TX/RX markers support aligned authoritative turn/action comparison',()=>{
  const h=[native('TX',10,4,100,0),native('TX',11,5,300,1),'CC_NET_INTENT_ACCEPT owner=1 seq=3 action=5'].join('\n');
  const c=[native('RX',10,4,30,0),native('RX',11,5,260,1)].join('\n');
  const r=summarize(h,c);
  assert.equal(r.coverage.structured_or_native_source_host,'A31_NATIVE');
  assert.equal(r.coverage.structured_or_native_source_client,'A31_NATIVE');
  assert.equal(r.coverage.comparable_authoritative_snapshots,2);
  assert.equal(r.coverage.authoritative_content_mismatches,0);
  assert.equal(r.coverage.p2_accepted_action_seen_in_aligned_client_snapshot,true);
  assert.deepEqual(r.client.sample_intervals_ms,[230]);
  assert.equal(r.verdict,'INSUFFICIENT_EVIDENCE'); // still no banner/ball samples: no G3 PASS
});

test('W10 detects same-revision authoritative turn mismatch',()=>{
  const r=summarize([native('TX',10,4,100,0),native('TX',11,5,200,1)].join('\n'),
    [native('RX',10,4,1,1),native('RX',11,5,2,1)].join('\n'));
  assert.equal(r.anomalies.some(x=>x.code==='SNAPSHOT_AUTHORITY_MISMATCH'),true);
  assert.deepEqual(r.snapshot_authority_mismatches[0],{
    revision:10,actionSerialHost:4,actionSerialClient:4,turnHost:0,turnClient:1});
});

test('W10 detects same-revision actionSerial mismatch',()=>{
  const r=summarize(native('TX',12,6,10,1),native('RX',12,5,90,1));
  assert.equal(r.coverage.authoritative_content_mismatches,1);
});

test('W10 future structured trace overrides duplicate A31 native trace without false rollback',()=>{
  const h=[native('TX',1,1,20,0),native('TX',2,2,40,1),
    trace({type:'snapshot_sent',revision:1,actionSerial:1,turn:0}),
    trace({type:'snapshot_sent',revision:2,actionSerial:2,turn:1})].join('\n');
  const c=[native('RX',1,1,90,0),native('RX',2,2,200,1),
    trace({type:'snapshot_applied',revision:1,actionSerial:1,turn:0}),
    trace({type:'snapshot_applied',revision:2,actionSerial:2,turn:1})].join('\n');
  const r=summarize(h,c);
  assert.equal(r.client.snapshot_applied,2);
  assert.equal(r.coverage.structured_or_native_source_client,'CC_W9_TRACE');
  assert.equal(r.anomalies.some(x=>x.code==='CLIENT_REVISION_NONMONOTONIC'),false);
});

test('W10 P2 accepted action not observed on matched client snapshot is UNKNOWN not invented failure',()=>{
  const h=['CC_NET_INTENT_ACCEPT owner=1 seq=3 action=8',native('TX',1,7,1,0),native('TX',2,8,2,1)].join('\n');
  const c=[native('RX',1,7,100,0),native('RX',3,8,200,1)].join('\n');
  const r=summarize(h,c);
  assert.equal(r.coverage.p2_accepted_action_seen_in_aligned_client_snapshot,false);
  assert.equal(r.missing_observations.includes('p2_accepted_action_not_observed_on_client'),true);
  assert.equal(r.anomalies.some(x=>x.code==='SNAPSHOT_AUTHORITY_MISMATCH'),false);
});

test('W10 duplicate P2 accepted sequence/action detected without leaking connection ID',()=>{
  const h=['CC_NET_INTENT_ACCEPT owner=1 seq=5 action=11 sender=123',
    'CC_NET_INTENT_ACCEPT owner=1 seq=5 action=11 sender=123'].join('\n');
  const r=summarize(h,'');
  assert.equal(r.anomalies.some(x=>x.code==='P2_ACCEPT_SEQUENCE_OR_ACTION_NONMONOTONIC'),true);
  assert.equal(JSON.stringify(r).includes('123'),false);
});

test('W10 rejects malformed A31 native samples and preserves data-quality missingness',()=>{
  const r=summarize(native('TX',2,2,10,4),native('RX',2,-2,50,0));
  assert.equal(r.host.malformed,1);
  assert.equal(r.client.malformed,1);
  assert.equal(r.missing_observations.includes('malformed_telemetry_records'),true);
});

test('W10 detects backward local monotonic timestamp without inferring one-way latency',()=>{
  const r=summarize([native('TX',1,0,30,0),native('TX',2,0,40,0)].join('\n'),
    [native('RX',1,0,100,0),native('RX',2,0,50,0)].join('\n'));
  assert.equal(r.anomalies.some(x=>x.code==='CLIENT_LOCAL_TIME_NONMONOTONIC'),true);
  assert.deepEqual(r.client.sample_intervals_ms,[]);
});

test('W10 CLI input SHA and immutable report; never overwrite logs or prior report',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cc001-a43-w10-'));
  try{
    const host=path.join(dir,'pc1.log'),client=path.join(dir,'pc2.log'),out=path.join(dir,'result.json');
    fs.writeFileSync(host,'CC_NET_HOST_READY port=7777\n');fs.writeFileSync(client,'CC_NET_STATE_APPLIED revision=1 owner=1\n');
    const cmd=path.join(__dirname,'pc-pair-trace.cjs');
    const a=spawnSync(process.execPath,[cmd,'--host',host,'--client',client,'--out',out],{encoding:'utf8'});
    assert.equal(a.status,2);
    const report=JSON.parse(fs.readFileSync(out,'utf8'));
    assert.equal(report.input_fingerprints.host_sha256,crypto.createHash('sha256').update(fs.readFileSync(host)).digest('hex'));
    const b=spawnSync(process.execPath,[cmd,'--host',host,'--client',client,'--out',out],{encoding:'utf8'});
    assert.equal(b.status,3);
    const c=spawnSync(process.execPath,[cmd,'--host',host,'--client',client,'--out',host],{encoding:'utf8'});
    assert.equal(c.status,3);
    assert.equal(fs.readFileSync(host,'utf8'),'CC_NET_HOST_READY port=7777\n');
    const d=spawnSync(process.execPath,[cmd,'--host',host,'--client',host],{encoding:'utf8'});
    assert.equal(d.status,3);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('W10 no actual gameplay or QA PASS verdict even when all known events appear',()=>{
  const host=[native('TX',1,1,10,0),native('TX',2,2,20,1),
    'CC_NET_INTENT_ACCEPT owner=1 seq=1 action=2',
    trace({type:'ball_state',revision:2,actionSerial:2,ballId:1,layer:'simulation',x:0,y:0}),
    trace({type:'turn_state',revision:2,turn:1,localOwner:0,phase:'aiming',banner:'opponent_turn'})].join('\n');
  const client=[native('RX',1,1,101,0),native('RX',2,2,201,1),
    trace({type:'ball_state',revision:2,actionSerial:2,ballId:1,layer:'simulation',x:0,y:0}),
    trace({type:'turn_state',revision:2,turn:1,localOwner:1,phase:'aiming',banner:'your_turn'})].join('\n');
  const r=summarize(host,client);
  assert.equal(r.verdict,'OBSERVATIONS_AVAILABLE_NOT_QA_PASS');
  assert.equal(r.coverage.p2_accepted_action_seen_in_aligned_client_snapshot,true);
});