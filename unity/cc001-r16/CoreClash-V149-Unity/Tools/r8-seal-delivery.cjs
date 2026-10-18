'use strict';
// Verify the current R8 evidence and seal only the local, never-published delivery.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,''));
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const current=(p,expected)=>assert.equal(hash(path.join(root,p)),expected.toLowerCase(),'Stale artifact: '+p);
function files(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(d,e.name)):[path.join(d,e.name)]);}
const entry=f=>({path:path.relative(root,f).replaceAll('\\','/'),bytes:fs.statSync(f).size,sha256:hash(f)});
const tests=read('Evidence/unity-tests.json'),wire=read('Evidence/network-codec-tests.json'),support=read('Evidence/ability-support.json');
assert.equal(tests.failed,0);assert(tests.passed>=158);assert.equal(wire.exitCode,0);
assert.deepEqual(support.counts,{UNITY_READY:34,DATA_ONLY:160,PARTIAL:33});
const source=read('Evidence/r8-source-mechanics.json'),matches=read('Evidence/r8-momentum-matches.json');
assert.equal(source.pass,true);assert.equal(source.sourceUnchanged,true);assert.equal(source.tests.length,3);
const catalog=read('Assets/Resources/Data/catalog.json'),featured=read('Assets/Resources/Data/featured-decks.json');
assert.equal(catalog.balls.length,227);assert.equal(catalog.decks.length,36);assert.equal(featured.decks.length,4);
assert.equal(source.sourceSha256,catalog.sourceSha256);assert.equal(hash(catalog.sourcePath),catalog.sourceSha256);
assert.equal(matches.pass,true);assert.equal(matches.matches.length,3);
for(const m of matches.matches){assert.equal(m.guards,0);assert(m.turns<=50);for(const id of ['pinballer','slingshot','ram'])assert(m.deployed.includes(id));}
const featuredMatches=read('Evidence/unity-featured-matches.json');
assert.equal(featuredMatches.matches.length,4);
for(const m of featuredMatches.matches){assert.equal(m.motionGuards,0);assert.equal(m.selectedTypesDeployed.length,9);assert(m.result);}
const relay=read('Evidence/r8-internet-smoke.json'),lan=read('Evidence/r8-lan/lan-runtime.json'),phone=read('Evidence/r6-webgl-r8-phone-smoke.json');
for(const [name,r]of Object.entries({relay,lan})){
 assert.equal(r.pass,true,name);assert.equal(r.buildFilesUnchanged,true,name);
 for(const[p,v]of Object.entries(r.buildFiles))current(p,v.sha256);
}
assert.equal(relay.momentumStateVerified,true);assert.equal(relay.pageErrors.length,0);
assert.equal(phone.ok,true);assert.equal(phone.buildFilesUnchanged,true);assert.equal(phone.earlierEvidenceUnchanged,true);assert.equal(phone.pageErrors.length,0);
for(const[p,v]of Object.entries(phone.build)){current('Builds/WebGL/'+p,v.sha256);current('Builds/Windows/WebRoot/'+p,v.sha256);}
for(const v of phone.screens)current('Evidence/'+v.file,v.sha256);
const native=read('Evidence/r8-native/r6-native-runner.json'),runtime=read('Evidence/r8-native/r6-native-runtime.json');
const staged=read('Evidence/r8-native-html/r8-html-runner.json'),stagedRuntime=read('Evidence/r8-native-html/r8-html-native.json');
assert.equal(native.passed,true);assert.equal(runtime.passed,true);assert.equal(runtime.fullLocalMatchCompleted,true);assert.equal(runtime.motionGuards,0);
assert.equal(staged.pass,true);assert.equal(stagedRuntime.pass,true);assert.equal(staged.captures.length,2);
for(const r of [native,staged])for(const v of r.buildFiles)current(v.path,v.sha256);
for(const [dir,r]of [['r8-native',native],['r8-native-html',staged]])for(const v of r.captures)current('Evidence/'+dir+'/'+v.file,v.sha256);
const android=read('Evidence/android-package.json'),cloud=read('Evidence/r8-cloud-status.json');
assert.equal(android.pass,true);current(android.apk.path,android.apk.sha256);
assert.equal(cloud.evidenceRevision,'r8');assert.equal(cloud.internetMatchTested,true);assert.equal(cloud.serviceAccessVerified,true);
const builds={};for(const target of ['StandaloneWindows64','WebGL','Android']){
 const b=builds[target]=read('Evidence/build-'+target+'.json');assert.equal(b.result,'Succeeded');assert.equal(b.errors,0);assert.equal(b.warnings,1);
}
const baseline=read('Evidence/r7-delivery-manifest.json'),sources=['Assets','Packages','ProjectSettings'].flatMap(d=>files(path.join(root,d))).sort().map(entry);
const previous=new Map(baseline.sources.map(v=>[v.path,v]));
const allowed=new Set([
 'Assets/CoreClash/Core/AbilityResolver.cs','Assets/CoreClash/Core/GameSimulation.cs','Assets/CoreClash/Core/GameState.cs','Assets/CoreClash/Core/RealityEffects.cs',
 'Assets/CoreClash/Core/MomentumEffects.cs','Assets/CoreClash/Core/MomentumEffects.cs.meta','Assets/CoreClash/Data/AbilitySupport.cs',
 'Assets/CoreClash/Editor/BuildTools.cs','Assets/CoreClash/Physics/BallPhysics.cs','Assets/CoreClash/Presentation/BoardView.cs','Assets/CoreClash/Presentation/FeedbackTimeline.cs',
 'Assets/CoreClash/Testing/NgoSmokeDriver.cs','Assets/CoreClash/Testing/HtmlMechanicsSmokeDriver.cs','Assets/CoreClash/Testing/HtmlMechanicsSmokeDriver.cs.meta',
 'Assets/Resources/Data/presentation-copy.json','Assets/Scenes/CoreClash.unity'
]);
const changes=sources.filter(v=>previous.get(v.path)?.sha256!==v.sha256);
for(const v of changes)assert(allowed.has(v.path),'Unexpected source change: '+v.path);
for(const v of baseline.sources)assert(sources.some(s=>s.path===v.path),'Removed source: '+v.path);
for(const p of ['Assets/Resources/Data/catalog.json','Assets/Resources/Data/featured-decks.json','Assets/Resources/Data/network-settings.json'])current(p,previous.get(p).sha256);
const artifacts=['Builds/Windows','Builds/WebGL','Builds/Android'].flatMap(d=>files(path.join(root,d))).filter(f=>!/[\\/][^\\/]*(DoNotShip|DontShip)[^\\/]*[\\/]/.test(f)).concat(path.join(root,'Legacy/core_clash_v149_legacy_presentation.html')).sort().map(entry);
const result={sealedAt:new Date().toISOString(),specVersion:149,presentationRevision:'R8',scope:'Three V148-backed native momentum abilities; no catalog/deck/stat changes, no website publication. Host owns physics. Ram remains PARTIAL.',sourceTreeSha256:crypto.createHash('sha256').update(sources.map(v=>v.path+'\0'+v.sha256).join('\n')).digest('hex'),checks:{coreTests:{passed:tests.passed,failed:0},wireTests:13,sourceRuntimeProbes:3,newMechanicsFullSimulationMatches:3,realRelayAuthorityAndBumperState:true,realLanNativeAndBrowser:true,phone:{checks:phone.checks.length,captures:phone.screens.length,completeDeviceMatrix:false},nativeFullMatch:true,stagedMechanicsCaptures:2,androidPackage:true,builds},sinceR7:{baselineCommit:'330d6a8dd75d11cfec9b62d12c5305c078198ea9',changedSources:changes.map(v=>v.path),catalogFeaturedAndNetworkSettingsUnchanged:true},limitations:{physicalAndroidTested:false,physicalCrossNatTested:false,publicWebsitePublished:false,exactHtmlParity:false,ramStructureBonusImplemented:false},sources,artifacts};
fs.writeFileSync(path.join(root,'Evidence/delivery-manifest.json'),JSON.stringify(result,null,2)+'\n');
console.log('SEALED R8 '+sources.length+' sources / '+artifacts.length+' artifacts; '+tests.passed+' core checks, real Relay bumper state, LAN, phone and native renderer verified.');
