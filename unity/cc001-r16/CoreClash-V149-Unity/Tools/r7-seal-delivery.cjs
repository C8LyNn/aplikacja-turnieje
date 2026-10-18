'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,''));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const tests=read('Evidence/unity-tests.json'),codec=read('Evidence/network-codec-tests.json'),life=read('Evidence/r7-internet-lifecycle.json'),relay=read('Evidence/r7-internet-smoke.json'),lan=read('Evidence/r7-lan/lan-runtime.json'),phone=read('Evidence/r6-webgl-r7-phone-smoke.json'),native=read('Evidence/r7-native/r6-native-runner.json'),runtime=read('Evidence/r7-native/r6-native-runtime.json'),android=read('Evidence/android-package.json'),deploy=read('Evidence/r7-web-deploy-tests.json'),local=read('Evidence/r7-web-host-local.json'),archive=read('Evidence/r7-web-archive.json'),cloud=read('Evidence/r7-cloud-status.json'),baseline=read('Evidence/r6-delivery-manifest.json');
assert.equal(tests.failed,0);assert(tests.passed>=140);assert.equal(codec.exitCode,0);
for(const [name,report]of Object.entries({life,relay,lan})){
 assert.equal(report.pass,true,name);assert.equal(report.buildFilesUnchanged,true,name);
 for(const[p,v]of Object.entries(report.buildFiles))assert.equal(hash(path.join(root,p)),v.sha256.toLowerCase(),name+' stale '+p);
}
assert.equal(life.checks.length,14);assert.equal(life.heldJoinStatus,200);assert.equal(life.pageErrors.length,0);
assert.equal(phone.ok,true);assert.equal(phone.buildFilesUnchanged,true);assert.equal(phone.pageErrors.length,0);assert.equal(phone.earlierEvidenceUnchanged,true);
for(const[p,v]of Object.entries(phone.build)){
 assert.equal(hash(path.join(root,'Builds/WebGL',p)),v.sha256,'Stale phone artifact '+p);
 assert.equal(hash(path.join(root,'Builds/Windows/WebRoot',p)),v.sha256,'Stale WebRoot '+p);
}
for(const v of phone.screens)assert.equal(hash(path.join(root,'Evidence',v.file)),v.sha256,'Stale phone capture');
assert.equal(native.passed,true);assert.equal(runtime.passed,true);assert.equal(runtime.fullLocalMatchCompleted,true);assert.equal(runtime.motionGuards,0);
for(const v of native.buildFiles)assert.equal(hash(path.join(root,v.path)),v.sha256.toLowerCase(),'Stale Windows test');
for(const v of native.captures)assert.equal(hash(path.join(root,'Evidence/r7-native',v.file)),v.sha256.toLowerCase(),'Stale Windows capture');
assert.equal(android.pass,true);assert.equal(hash(path.join(root,android.apk.path)),android.apk.sha256);
assert.equal(deploy.failed,0);assert(deploy.passed>=11);assert.equal(local.pass,true);assert.equal(archive.pass,true);assert.equal(hash(archive.archive),archive.sha256);
for(const v of local.files)assert.equal(hash(path.join(root,'Builds/WebGL',v.path)),v.sha256,'Stale deployment probe');
assert.equal(cloud.evidenceRevision,'r7');assert.equal(cloud.internetMatchTested,true);assert.equal(cloud.serviceAccessVerified,true);
const builds={};for(const target of ['StandaloneWindows64','WebGL','Android']){const b=builds[target]=read('Evidence/build-'+target+'.json');assert.equal(b.result,'Succeeded');assert.equal(b.errors,0);assert.equal(b.warnings,1);}
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const entry=f=>({path:path.relative(root,f).replaceAll('\\','/'),bytes:fs.statSync(f).size,sha256:hash(f)});
const sources=['Assets','Packages','ProjectSettings'].flatMap(d=>files(path.join(root,d))).sort().map(entry);
const previous=new Map(baseline.sources.map(v=>[v.path,v]));
const allowed=new Set(['Assets/CoreClash/Networking/NgoInternetSession.cs','Assets/CoreClash/Networking/OnlineServiceError.cs','Assets/CoreClash/Networking/OnlineServiceError.cs.meta']);
const changes=sources.filter(v=>previous.get(v.path)?.sha256!==v.sha256);
for(const v of changes)assert(allowed.has(v.path),'Unexpected gameplay/config/source change: '+v.path);
for(const v of baseline.sources)assert(sources.some(s=>s.path===v.path),'Baseline source removed: '+v.path);
const artifacts=['Builds/Windows','Builds/WebGL','Builds/Android'].flatMap(d=>files(path.join(root,d))).filter(f=>!/[\\/][^\\/]*(DoNotShip|DontShip)[^\\/]*[\\/]/.test(f)).concat(path.join(root,'Legacy/core_clash_v149_legacy_presentation.html')).sort().map(entry);
const result={sealedAt:new Date().toISOString(),specVersion:149,presentationRevision:'R7',scope:'R6 gameplay/UI preserved; actionable Cloud join failures, real Internet lifecycle checks and prepared WebGL hosting archive. Physical devices, cross-NAT and public hosting are not tested.',sourceTreeSha256:crypto.createHash('sha256').update(sources.map(v=>v.path+'\0'+v.sha256).join('\n')).digest('hex'),checks:{coreTests:{passed:tests.passed,failed:0},wireTests:13,internetLifecycle:life.checks.length,realRelayAuthority:true,realLanNativeAndBrowser:true,phone:{checks:phone.checks.length,captures:phone.screens.length,completeDeviceMatrix:false},nativeFullMatch:true,androidPackage:true,deploymentTests:deploy.passed,localHostingProbe:true,webArchiveVerified:true,builds},unchangedSinceR6:{baselineCommit:'ab73148',permittedChanges:changes.map(v=>v.path),gameplayPhysicsDataInputAndPresentation:true},limitations:{physicalAndroidTested:false,physicalCrossNatTested:false,publicWebsitePublished:false},sources,artifacts,webReleaseArchive:{path:archive.archive,sha256:archive.sha256,bytes:archive.bytes}};
fs.writeFileSync(path.join(root,'Evidence/delivery-manifest.json'),JSON.stringify(result,null,2)+'\n');console.log('SEALED R7 '+sources.length+' sources / '+artifacts.length+' artifacts; '+tests.passed+' core, '+life.checks.length+' Cloud lifecycle, '+deploy.passed+' deployment tests.');
