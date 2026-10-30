'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {test}=require('node:test');
const unityFile=path.resolve(__dirname,'../../../../unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Networking/NgoGameSession.cs');
const s=fs.readFileSync(unityFile,'utf8');
const times=(re)=>(s.match(re)||[]).length;
test('exact one snapshot TX telemetry marker',()=>{
  assert.equal(times(/CC_NET_TRACE_TX rev=/g),1);
  assert.match(s,/packet\.revision/);
});
test('exact one admitted snapshot RX telemetry marker',()=>{
  assert.equal(times(/CC_NET_TRACE_RX rev=/g),1);
  assert.ok(s.indexOf('if(!assembler.Add(')<s.indexOf('CC_NET_TRACE_RX rev='));
  assert.ok(s.indexOf('adapter.Apply(packet,')<s.indexOf('CC_NET_TRACE_RX rev='));
});
test('F1 developer opt-in gates both traces',()=>{
  assert.equal(times(/if\(app!=null&&app\.DeveloperOverlay\)/g),2);
  assert.ok(s.indexOf('if(app!=null&&app.DeveloperOverlay)',s.indexOf('void LateUpdate()'))<
    s.indexOf('CC_NET_TRACE_TX rev='));
});
test('traces use local monotonic time and authoritative revision/action',()=>{
  assert.equal(times(/Time\.realtimeSinceStartupAsDouble/g),2);
  assert.match(s,/CC_NET_TRACE_RX rev="\+revision\+" serial="\+adapter\.State\.actionSerial/);
  assert.match(s,/CC_NET_TRACE_TX rev="\+packet\.revision\+" serial="\+app\.Simulation\.State\.actionSerial/);
});
test('existing A41 adaptive compressed-payload cadence remains',()=>{
  assert.match(s,/NetworkSnapshotRate\.Interval\(app\.Simulation\.State\.phase,packed\.Length\)/);
  assert.match(s,/NgoWireProtocol\.Split\(packed\)/);
  assert.match(s,/NetworkIntentReceipt\.MatchesPending\(pendingIntent,pendingSequence,sequence\)/);
});
test('wire protocol/authority and admission remain',()=>{
  assert.match(s,/NetworkConfig\.ProtocolVersion=149/);
  assert.match(s,/seat\.Owns\(sender\)/);
  assert.match(s,/authority\.Submit\(1,command,out reason\)/);
  assert.match(s,/adapter\.Apply\(packet,JsonUtility\.FromJson<GameState>,out var reason\)/);
});
test('new markers never enter network transport payload',()=>{
  assert.ok(s.indexOf('CC_NET_TRACE_TX rev=')>s.indexOf('bridge.SnapshotChunkRpc('));
  assert.ok(s.indexOf('CC_NET_TRACE_RX rev=')>s.indexOf('app.ReceiveNetworkState(adapter.State)'));
});
