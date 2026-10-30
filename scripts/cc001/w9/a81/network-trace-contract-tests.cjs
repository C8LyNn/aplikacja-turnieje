#!/usr/bin/env node
'use strict';
/** Synthetic contract tests for A31's offline PC1/PC2 log analyzer.
 * No actual devices, gameplay, Unity or network tests are implied.
 * All data here is fictitious; never submit as physical-playtest evidence.
 */
const assert = require('node:assert/strict');
const analyzer = require('../a31/analyze-network-logs.cjs');
const host = (...extras) => [
  'CC_NET_HOST_READY port=7777',
  'CC_NET_PEER_CONNECTED id=17 owner=1',
  'CC_NET_INTENT_ACCEPT owner=1 seq=20 action=4',
  ...extras
].join('\n');
const client = (...extras) => [
  'CC_NET_STATE_APPLIED revision=10 owner=1',
  'P2 · host accepted intent 20',
  ...extras
].join('\n');
const tx = (rev,tms,serial=3,turn=2) => `CC_NET_TRACE_TX rev=${rev} serial=${serial} tms=${tms} turn=${turn}`;
const rx = (rev,tms,serial=3,turn=2) => `CC_NET_TRACE_RX rev=${rev} serial=${serial} tms=${tms} turn=${turn}`;
const cases = [
 ['empty logs remain blocked', () => assert.deepEqual(analyzer.analyze('', '').blockers.slice(0,2), ['MISSING_PC1_LOG','MISSING_PC2_LOG'])],
 ['no synthetic trace yields G3 PASS', () => assert.equal(analyzer.analyze(host(),client()).gate,'INSUFFICIENT_FOR_G3_PASS')],
 ['P2 binding exact basic marker', () => assert.equal(analyzer.parse(host()).peerConnected,1)],
 ['accepted P2 seq/action parsed', () => assert.deepEqual(analyzer.parse(host()).accept,[{seq:20,action:4}])],
 ['P1 action not counted as P2', () => assert.equal(analyzer.parse('CC_NET_INTENT_ACCEPT owner=0 seq=9 action=1').accept.length,0)],
 ['no snapshot marker means blocker', () => assert.ok(analyzer.analyze(host(),'client log').blockers.includes('CLIENT_FIRST_SNAPSHOT_NOT_LOGGED'))],
 ['missing remote intent means blocker', () => assert.ok(analyzer.analyze('CC_NET_PEER_CONNECTED owner=1',client()).blockers.includes('HOST_P2_ACCEPT_NOT_LOGGED'))],
 ['one snapshot marker is not revision history', () => assert.ok(analyzer.analyze(host(),client()).blockers.includes('NO_PER_SNAPSHOT_TIMING_MARKERS_IN_RC1'))],
 ['sequential RX revisions', () => assert.equal(analyzer.analyze(host(),client(rx(10,100),rx(11,150))).client.rxRevisionOrder,'MONOTONIC')],
 ['decreasing RX revision flagged', () => assert.equal(analyzer.analyze(host(),client(rx(12,100),rx(11,150))).client.rxRevisionOrder,'NON_MONOTONIC')],
 ['duplicate RX revision flagged by current strict policy', () => assert.equal(analyzer.analyze(host(),client(rx(11,100),rx(11,150))).client.rxRevisionOrder,'NON_MONOTONIC')],
 ['single RX revision insufficient', () => assert.equal(analyzer.analyze(host(),client(rx(11,100))).client.rxRevisionOrder,'INSUFFICIENT')],
 ['missing revision insufficient', () => assert.equal(analyzer.analyze(host(),client(rx(11,100),rx(undefined,150))).client.rxRevisionOrder,'INSUFFICIENT')],
 ['accepted duplicate sequence detected', () => assert.deepEqual(analyzer.analyze(host('CC_NET_INTENT_ACCEPT owner=1 seq=20 action=5'),client()).anomalies.duplicateAcceptedP2Sequences,[20])],
 ['non-increasing action serial detected', () => assert.equal(analyzer.analyze(host('CC_NET_INTENT_ACCEPT owner=1 seq=21 action=4'),client()).anomalies.nonIncreasingAcceptedActionSerial,true)],
 ['increasing action serial accepted', () => assert.equal(analyzer.analyze(host('CC_NET_INTENT_ACCEPT owner=1 seq=21 action=5'),client()).anomalies.nonIncreasingAcceptedActionSerial,false)],
 ['client local intervals not WAN latency', () => assert.deepEqual(analyzer.analyze(host(),client(rx(11,100),rx(12,140),rx(13,200))).client.rxIntervals,{count:2,minMs:40,maxMs:60,meanMs:50})],
 ['negative local timestamp gap returns unknown', () => assert.equal(analyzer.analyze(host(),client(rx(11,200),rx(12,100))).client.rxIntervals,null)],
 ['missing timestamp returns unknown', () => assert.equal(analyzer.analyze(host(),client(rx(11,200), 'CC_NET_TRACE_RX rev=12 serial=4 turn=2')).client.rxIntervals,null)],
 ['connection/snapshot error markers', () => assert.equal(analyzer.analyze(host(),client('CC_NET_SNAPSHOT_ERROR malformed packet','CC_LAN_CONNECTION_FAILED')).client.failures,2)],
 ['final state parity always remains unverified', () => assert.ok(analyzer.analyze(host(tx(10,100),tx(11,200)),client(rx(10,120),rx(11,240))).blockers.includes('NO_INDEPENDENT_FINAL_STATE_PARITY'))],
 ['host TX and client RX independently measured', () => {const r=analyzer.analyze(host(tx(10,100),tx(11,220)),client(rx(10,5100),rx(11,5240)));assert.equal(r.host.txIntervals.meanMs,120);assert.equal(r.client.rxIntervals.meanMs,140);}]
];
// W10: exact event and exact owner token are mandatory, not substring matches.
cases.push(
 ['owner=10 is not P2 connection', () => assert.equal(analyzer.parse('CC_NET_PEER_CONNECTED owner=10').peerConnected,0)],
 ['owner=10 is not P2 accepted command', () => assert.equal(analyzer.parse('CC_NET_INTENT_ACCEPT owner=10 seq=20 action=4').accept.length,0)],
 ['owner=10 is not P2 launch', () => assert.equal(analyzer.parse('CORE_CLASH_LAUNCH owner=10').clientLaunch,0)],
 ['owner=1suffix is not owner=1', () => assert.equal(analyzer.parse('CC_NET_PEER_CONNECTED owner=1suffix').peerConnected,0)],
 ['event prefix is not an accepted intent event', () => assert.equal(analyzer.parse('CC_NET_INTENT_ACCEPTED owner=1 seq=20 action=4').accept.length,0)],
 ['owner token order does not change accepted action', () => assert.deepEqual(analyzer.parse('CC_NET_INTENT_ACCEPT seq=20 action=4 owner=1').accept,[{seq:20,action:4}])]
);
let passed=0,failed=0;
for(const [name,run] of cases){try{run();passed++;console.log('PASS',name);}catch(e){failed++;console.error('FAIL',name,e.message);}}
console.log(`TOTAL=${cases.length} PASS=${passed} FAIL=${failed}`);
console.log('SCOPE=SYNTHETIC_ANALYZER_CONTRACT_ONLY G3=NOT_ATTESTED NO_GAMEPLAY_CLAIM');
process.exitCode=failed?1:0;
