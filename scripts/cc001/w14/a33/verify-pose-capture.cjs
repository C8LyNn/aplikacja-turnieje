#!/usr/bin/env node
'use strict';
// W14 A33: source-contract gate ONLY, not native C#/Windows or PC1-PC2 QA.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../../../..');
const unity=path.join(root,'unity/cc001-r16/CoreClash-V149-Unity');
const helper=fs.readFileSync(path.join(unity,'Assets/CoreClash/Presentation/QaPoseEvidence.cs'),'utf8');
const ui=fs.readFileSync(path.join(unity,'Assets/CoreClash/Presentation/DetailsView.cs'),'utf8');
const tests=fs.readFileSync(path.join(unity,'Tests/A33W14PoseEvidenceTests.cs'),'utf8');
const project=fs.readFileSync(path.join(unity,'Tests/CoreClash.Tests.csproj'),'utf8');
const entry=fs.readFileSync(path.join(unity,'Tests/PresentationTests.cs'),'utf8');
const meta=fs.readFileSync(path.join(unity,'Assets/CoreClash/Presentation/QaPoseEvidence.cs.meta'),'utf8');
function verify(s=helper,u=ui){
 const errors=[],expect=(name,ok)=>{if(!ok)errors.push(name)};
 expect('CANONICAL_SORT',s.includes('.OrderBy(b=>b.id).ToArray()'));
 expect('ROWS_CAPPED',s.includes('MaxBallRows=24')&&s.includes('Math.Min(MaxBallRows,live.Length)'));
 expect('TRUNCATION_DECLARED',s.includes('TRUNCATED=')&&s.includes('live.Length-sampled'));
 expect('FILTERS_INACTIVE',s.includes('b!=null&&!b.dead&&!b.banished'));
 expect('INVARIANT_FLOAT',s.includes('ToString("R",CultureInfo.InvariantCulture)'));
 expect('SAMPLES_CANONICAL',s.includes('Append(Float(b.x))')&&s.includes('Append(Float(b.y))'));
 expect('RENDER_MOVING_ONLY',s.includes('state.phase==MatchPhase.Moving && smoother!=null'));
 expect('RENDER_SMOOTHER_ONLY',s.includes('smoother.TryGetPosition(b.id,unscaledTime,out displayX,out displayY)'));
 expect('CANONICAL_FALLBACK',s.includes('if(!interpolated){displayX=b.x;displayY=b.y;}'));
 expect('NOT_PARITY_PROOF',s.includes('RENDER_POSE_PARITY_PROOF=NO'));
 expect('USER_CLICK_ONLY',u.includes('GUIUtility.systemCopyBuffer=W12QaClipboardText(')&&u.includes('QaPoseEvidence.Capture(s,'));
 expect('MATCHES_BOARD_CLIENT_GUARD',u.includes('NetworkLink!=null&&!NetworkLink.IsAuthority&&NetworkLink.IsConnected?remoteBallSmoother:null'));
 expect('NO_GAMEPLAY_WRITE',!/Simulation\.Step\(|NetworkLink\.Submit\(|\.State\s*=|b\.x\s*=|b\.y\s*=/.test(s));
 expect('TEST_REGISTERED',entry.includes('A33W14PoseEvidenceTests();'));
 expect('PROJECT_INCLUDES',project.includes('<Compile Include="../Assets/CoreClash/Presentation/QaPoseEvidence.cs" />'));
 expect('EIGHT_MANAGED_TESTS',(tests.match(/Test\("A33 W14/g)||[]).length===8);
 expect('UNITY_META',/^fileFormatVersion: 2\nguid: [0-9a-f]{32}\n$/.test(meta));
 return errors;
}
assert.deepEqual(verify(),[],'W14 source gate failed');
const negatives=[
 ['sorting',s=>s.replace('.OrderBy(b=>b.id).ToArray()','.ToArray()')],
 ['limit',s=>s.replace('MaxBallRows=24','MaxBallRows=100000')],
 ['truncation',s=>s.replace('live.Length-sampled','0')],
 ['inactive',s=>s.replace('!b.dead&&!b.banished','true')],
 ['culture',s=>s.replace('ToString("R",CultureInfo.InvariantCulture)','ToString()')],
 ['state_position',s=>s.replace('Append(Float(b.x))','Append("0")')],
 ['aiming_interpolation',s=>s.replace('state.phase==MatchPhase.Moving && smoother!=null','smoother!=null')],
 ['no_smoother',s=>s.replace('smoother.TryGetPosition(b.id,unscaledTime,out displayX,out displayY)','false')],
 ['fallback',s=>s.replace('if(!interpolated){displayX=b.x;displayY=b.y;}','')],
 ['false_parity',s=>s.replace('RENDER_POSE_PARITY_PROOF=NO','RENDER_POSE_PARITY_PROOF=YES')]
];
for(const [name,mutate] of negatives)assert.ok(verify(mutate(helper)).length>0,'negative mutation escaped '+name);
assert.ok(verify(helper,ui.replace('NetworkLink!=null&&!NetworkLink.IsAuthority&&NetworkLink.IsConnected?remoteBallSmoother:null','remoteBallSmoother')).length>0,'host/client guard bypass escaped');
assert.ok(verify(helper,ui.replace('GUIUtility.systemCopyBuffer=W12QaClipboardText(','var ignored=W12QaClipboardText(')).length>0,'click gate bypass escaped');
console.log('CC001_W14_A33_SOURCE_CONTRACT_PASS '+(negatives.length+3)+'/'+(negatives.length+3)+' (static/mutation ONLY, C# TESTS NOT RUN)');
