'use strict';
const t=require('node:test'),a=require('node:assert/strict'),g=require('./guard.cjs');
const U=g.U,z='0'.repeat(40),o='1'.repeat(40);
const item=(path,sha=z,mode='100644')=>({path,sha,mode});
const net=U+'Assets/CoreClash/Networking/NetworkGameSession.cs';
const ui=U+'Assets/CoreClash/Presentation/MatchView.cs';
const baseline=[...g.protectedFiles.map(p=>item(p)),item(U+'Packages/manifest.json'),item(U+'Scenes/Test.unity.meta'),item(net),item(ui)];
const change=(p,sha=o)=>baseline.map(x=>x.path===p?{...x,sha}:x);
const verify=(head,allow=[],text='class Good {}')=>g.check(baseline,head,allow,()=>text);
t('unchanged RC1 succeeds',()=>a.equal(verify(baseline).ok,true));
t('allowed networking behavior passes',()=>a.equal(verify(change(net),[net]).ok,true));
t('allowed UI repair passes',()=>a.equal(verify(change(ui),[ui]).ok,true));
t('unapproved networking change fails',()=>a.match(verify(change(net)).errors.join(' '),/Unapproved/));
t('modified Protocol149 fails even if explicitly allowed',()=>{const p=U+'Assets/CoreClash/Networking/NgoWireProtocol.cs';a.match(verify(change(p)).errors.join(' '),/Protected/);a.throws(()=>verify(change(p),[p]),/protected/);});
t('V148 and original R16 manifest stay frozen',()=>{for(const p of g.protectedFiles.slice(0,2))a.match(verify(change(p)).errors.join(' '),/Protected/);});
t('meta edit or insertion rejected',()=>{const p=U+'Scenes/Test.unity.meta';a.match(verify(change(p)).errors.join(' '),/Protected/);a.match(verify([...baseline,item(U+'Assets/X.cs.meta')]).errors.join(' '),/Unapproved new meta/);});
t('removed original file rejected',()=>a.match(verify(baseline.filter(x=>x.path!==ui),[ui]).errors.join(' '),/Removed/));
t('new source requires exact allowlist',()=>{const p=U+'Tests/W9.cs',c=[...baseline,item(p)];a.match(verify(c).errors.join(' '),/Unapproved/);a.equal(verify(c,[p]).ok,true);});
t('diagnostic define rejected in allowed C#',()=>a.match(verify(change(ui),[ui],'#if CC001_PHOENIX_DIAGNOSTIC').errors.join(' '),/Diagnostic/));
t('csc.rsp rejected even as added file',()=>a.match(verify([...baseline,item(U+'Assets/csc.rsp')]).errors.join(' '),/Protected/));
t('mode change rejected',()=>a.match(verify(baseline.map(x=>x.path===ui?{...x,mode:'100755'}:x),[ui]).errors.join(' '),/Mode changed/));
t('casefold collision rejected',()=>a.throws(()=>verify([...baseline,item(ui.toLowerCase())]),/collision/));
t('invalid and duplicate allowlist rejected',()=>{a.throws(()=>verify(baseline,['../bad']),/Invalid/);a.throws(()=>verify(baseline,[net,net]),/Bad allowlist/);});
t('protected source must exist in RC1 baseline',()=>a.throws(()=>g.check([],[],[],()=>''),/Missing frozen/));
t('invalid symlink and malformed tree record rejected',()=>a.throws(()=>g.parseLsTree(Buffer.from('120000 blob '+z+'\tlink\0')),/Invalid/));
t('Git null tree parser accepts real style entry',()=>a.deepEqual(g.parseLsTree(Buffer.from('100644 blob '+z+'\t'+ui+'\0')),[item(ui)]));

const newAsset=U+'Assets/CoreClash/Physics/RemoteBallPoseSmoother.cs';
const newMeta=newAsset+'.meta';
const originalMeta=U+'Scenes/Test.unity.meta';
const metaGuidOld='a'.repeat(32),metaGuidNew='b'.repeat(32);
const contents=(guid=metaGuidNew)=>p=>p.endsWith('.meta')?'fileFormatVersion: 2\nguid: '+(p===originalMeta?metaGuidOld:guid)+'\n':'class Safe {}';
const paired=[...baseline,item(newAsset),item(newMeta)];
t('new C# and unique GUID meta pair with exact allowlist passes',()=>{const out=g.check(baseline,paired,[newAsset,newMeta],contents());a.equal(out.ok,true);a.deepEqual(out.changed.sort(),[newAsset,newMeta].sort());});
t('new asset without its .meta fails closed',()=>a.match(verify([...baseline,item(newAsset)],[newAsset]).errors.join(' '),/Missing new Unity \.meta/));
t('orphan new .meta without new asset fails',()=>a.match(g.check(baseline,[...baseline,item(newMeta)],[newAsset,newMeta],contents()).errors.join(' '),/Orphan new Unity meta/));
t('allowlist of new meta without asset rejected',()=>a.match(g.check(baseline,paired,[newMeta],contents()).errors.join(' '),/Unapproved new meta/));
t('duplicate Unity GUID rejected across old and new',()=>a.match(g.check(baseline,paired,[newAsset,newMeta],contents(metaGuidOld)).errors.join(' '),/Duplicate Unity GUID/));
t('malformed new GUID rejected',()=>a.match(g.check(baseline,paired,[newAsset,newMeta],contents('bad')).errors.join(' '),/Malformed or missing/));
t('editing old meta still rejected even on explicit allowlist',()=>a.throws(()=>g.check(baseline,change(originalMeta),[originalMeta],contents()),/protected/));
t('new .meta for unrelated file is protected',()=>a.throws(()=>g.check(baseline,[...baseline,item(U+'Assets/Example.png.meta')],[U+'Assets/Example.png.meta'],contents()),/protected/));


// W11 exact-author-blob provenance must be bound, not merely path-authorized.
t('W11 exact expected Git blob admits approved network patch',()=>{
 const result=g.checkPinned(baseline,change(net),{[net]:o},()=> 'class Allowed {}');
 a.equal(result.ok,true);a.equal(result.expectedBlobs,1);
});
t('W11 alternate implementation under same path and wrong SHA is denied',()=>{
 const result=g.checkPinned(baseline,change(net),{[net]:'2'.repeat(40)},()=> 'class Unapproved {}');
 a.equal(result.ok,false);a.match(result.errors.join(' '),/Unexpected blob SHA/);
});
t('W11 expected blob path missing or unchanged is denied',()=>{
 const result=g.checkPinned(baseline,baseline,{[net]:o},()=> 'class Good {}');
 a.equal(result.ok,false);a.match(result.errors.join(' '),/not changed/);
});
t('W11 empty manifest is denied',()=>a.throws(()=>g.checkPinned(baseline,change(net),{},()=> ''),/Empty expected/));
t('W11 malformed hashes rejected (uppercase/truncated)',()=>{
 for(const sha of ['a'.repeat(39),'A'.repeat(40)])a.throws(()=>g.checkPinned(baseline,change(net),{[net]:sha},()=> ''),/Invalid expected/);
});
t('W11 unexpected second changed file fails even when authorized first matches',()=>{
 const candidate=change(net).map(x=>x.path===ui?{...x,sha:o}:x);
 const out=g.checkPinned(baseline,candidate,{[net]:o},()=> 'class Code {}');
 a.equal(out.ok,false);a.match(out.errors.join(' '),/Unapproved/);
});
t('W11 paired asset + GUID metadata require two exact blob pins',()=>{
 const manifest={[newAsset]:z,[newMeta]:z};
 const good=g.checkPinned(baseline,paired,manifest,contents());
 a.equal(good.ok,true);
 const wrong=g.checkPinned(baseline,paired,{...manifest,[newMeta]:'3'.repeat(40)},contents());
 a.equal(wrong.ok,false);a.match(wrong.errors.join(' '),/Unexpected blob SHA/);
});
t('W11 protected Protocol149 cannot be admitted even with matching hash',()=>{
 const p=U+'Assets/CoreClash/Networking/NgoWireProtocol.cs';
 a.throws(()=>g.checkPinned(baseline,change(p),{[p]:o},()=> ''),/protected/);
});

 
// W11 #207 exact test-runner registration: frozen harness + precisely two new suites.
t('W11 #207 exact original runner to verified two-suite addition passes with full SHA pin',()=>{
 const p=U+'Tests/Program.cs',old='12b8fcca30731f007a01a81ac45572671c99f1dc',now='49d9860cec074e7d1612babacf01f8d63ed238b4';
 const b=baseline.map(x=>x.path===p?{...x,sha:old}:x);
 const h=b.map(x=>x.path===p?{...x,sha:now}:x);
 a.equal(g.checkPinned(b,h,{[p]:now},()=> 'safe').ok,true);
});
t('W11 #207 test runner change without an exact permit remains blocked',()=>{
 const p=U+'Tests/Program.cs',old='12b8fcca30731f007a01a81ac45572671c99f1dc',now='49d9860cec074e7d1612babacf01f8d63ed238b4';
 const b=baseline.map(x=>x.path===p?{...x,sha:old}:x);
 const h=b.map(x=>x.path===p?{...x,sha:now}:x);
 a.equal(g.checkPinned(b,h,{[net]:o},()=> 'safe').ok,false);
});
t('W11 #207 any alternative runner implementation is prohibited',()=>{
 const p=U+'Tests/Program.cs',old='12b8fcca30731f007a01a81ac45572671c99f1dc';
 const b=baseline.map(x=>x.path===p?{...x,sha:old}:x);
 const h=b.map(x=>x.path===p?{...x,sha:'f'.repeat(40)}:x);
 a.throws(()=>g.checkPinned(b,h,{[p]:'f'.repeat(40)},()=> 'safe'),/protected/);
});
t('W11 #207 changed frozen test-runner baseline is prohibited',()=>{
 const p=U+'Tests/Program.cs',now='49d9860cec074e7d1612babacf01f8d63ed238b4';
 const h=baseline.map(x=>x.path===p?{...x,sha:now}:x);
 a.throws(()=>g.checkPinned(baseline,h,{[p]:now},()=> 'safe'),/protected/);
});
t('W11 #207 exact candidate runner hash mismatch fails even when original to final known',()=>{
 const p=U+'Tests/Program.cs',old='12b8fcca30731f007a01a81ac45572671c99f1dc',now='49d9860cec074e7d1612babacf01f8d63ed238b4';
 const b=baseline.map(x=>x.path===p?{...x,sha:old}:x),h=b.map(x=>x.path===p?{...x,sha:now}:x);
 const out=g.checkPinned(b,h,{[p]:'a'.repeat(40)},()=> 'safe');
 a.equal(out.ok,false);a.match(out.errors.join(' '),/protected|Unexpected/);
});
