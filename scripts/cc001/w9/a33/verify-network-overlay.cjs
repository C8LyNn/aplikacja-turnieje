// CC-001 R17-W9 A33 — static, source-integrity and presentation-contract checks.
// Run: node scripts/cc001/w9/a33/verify-network-overlay.cjs
// This is NOT Unity compilation or physical two-PC multiplayer QA.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../../');
const unity=path.join(root,'unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash');
const ui=fs.readFileSync(path.join(unity,'Presentation/DetailsView.cs'),'utf8');
const ngo=fs.readFileSync(path.join(unity,'Networking/NgoGameSession.cs'),'utf8');
const checks=[
 ['local seat explicitly separate from active seat',/LOCAL SEAT:.*ACTIVE SEAT:/.test(ui)],
 ['host and client roles explicit',/authority\?"HOST":"CLIENT"/.test(ui)],
 ['moving or finished turn blocks aim hint',/!aiming\?"NO AIM INPUT/.test(ui)],
 ['unready connection explicit',/WAITING FOR PEER \/ SNAPSHOT/.test(ui)],
 ['active-local turn says YOUR TURN',/localOwner==activeOwner\?"YOUR TURN \/ AIMING":"OPPONENT TURN"/.test(ui)],
 ['host uses authoritative revision',/AUTHORITY STATE REVISION/.test(ui)],
 ['client uses received and applied revision',/RECEIVED SNAPSHOTS/.test(ui)&&/APPLIED REVISION/.test(ui)],
 ['read-only counters available in NGO', ['ReceivedSnapshots','LastAppliedRevision','AcceptedLocalIntents','RejectedLocalIntents','AcceptedRemoteIntents','RejectedRemoteIntents'].every(k=>new RegExp('\\b'+k+'\\b').test(ngo))],
 ['Unity IMGUI scroll view completed',/w9DeveloperScroll=Draw\.ScrollView/.test(ui)&&/GUI\.EndScrollView\(\)/.test(ui)],
 ['no inferred latency or parity success',!/LATENCY_MS|NETWORK_PASS|SYNC_PASS|FPS_MEASURED/.test(ui)],
 ['no network write calls in diagnostic partial',!/NetworkLink\.Submit\(|\.TryCommand\(|Simulation\.Step\(/.test(ui)]
];
let errors=0;
for(const [name,ok] of checks){console.log((ok?'PASS':'FAIL')+' '+name);if(!ok)errors++;}
console.log('CC001_W9_A33_STATIC '+(checks.length-errors)+'/'+checks.length);
assert.equal(errors,0,'static presentation diagnostics failed');
