'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,'Evidence',name+'.json')));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const tests=read('unity-tests'),network=read('network-runtime'),lan=read('lan-runtime'),invitation=read('lan-plain-invitation'),web=read('r5-webgl-smoke'),native=read('r5-native-runner'),runtime=read('r5-native-runtime'),codec=read('network-codec-tests'),rejoin=read('lan-rejoin'),android=read('android-package'),recovery=read('r5-lan-recovery');
const legacy=read('legacy-verification');assert.equal(legacy.ok,true);assert.equal(legacy.sourceUnchangedAfterVerification,true);assert.equal(legacy.canonicalGameplayChanges,0);assert.equal(legacy.canonicalDeckChanges,0);assert.equal(hash(path.join(root,'Legacy/core_clash_v149_legacy_presentation.html')),legacy.outputSha256);
assert.equal(tests.failed,0);assert(tests.passed>=120);assert.equal(network.pass,true);assert.equal(lan.pass,true);assert.equal(lan.buildFilesUnchanged,true);assert.equal(web.ok,true);assert.equal(web.buildFilesUnchanged,true);assert.equal(codec.exitCode,0);
assert.equal(recovery.pass,true);assert.equal(recovery.buildFilesUnchanged,true);assert.equal(recovery.pageErrors.length,0);
assert.equal(rejoin.pass,true);assert.equal(rejoin.buildFilesUnchanged,true);assert.equal(android.pass,true);assert.equal(hash(path.join(root,android.apk.path)),android.apk.sha256);
assert.equal(native.passed,true);assert.equal(runtime.passed,true);assert.equal(runtime.developmentBuild,false);assert.equal(runtime.defaultDeveloperOverlay,false);assert.equal(runtime.fullLocalMatchCompleted,true);assert.equal(runtime.motionGuards,0);
assert(native.buildFiles.length>=4);assert(native.captures.length>=6);assert(Object.keys(lan.buildFiles).length>=5);assert(Object.keys(web.build).length>=5);
assert.equal(invitation.pass,true);assert.equal(invitation.buildFilesUnchanged,true);assert.equal(invitation.pageErrors.length,0);assert.equal(new URL(invitation.url).searchParams.size,2);
const builds={};for(const target of ['StandaloneWindows64','WebGL','Android']){builds[target]=read('build-'+target);assert.equal(builds[target].result,'Succeeded');assert.equal(builds[target].errors,0);assert.equal(builds[target].warnings,0);}
for(const [name,value]of Object.entries(web.build))assert.equal(hash(path.join(root,'Builds/WebGL',name)),value.sha256,'Browser evidence is stale: '+name);
for(const value of native.buildFiles)assert.equal(hash(path.join(root,value.path)),value.sha256.toLowerCase(),'Native render evidence is stale: '+value.path);
for(const value of native.captures)assert.equal(hash(path.join(root,'Evidence',value.file)),value.sha256.toLowerCase(),'Native capture changed: '+value.file);
for(const [name,value]of Object.entries(lan.buildFiles))assert.equal(hash(path.join(root,name)),value.sha256,'LAN evidence is stale: '+name);
for(const [name,value]of Object.entries(invitation.buildFiles))assert.equal(hash(path.join(root,name)),value.sha256,'Plain invitation evidence is stale: '+name);
for(const [name,value]of Object.entries(rejoin.buildFiles))assert.equal(hash(path.join(root,name)),value.sha256,'Rejoin evidence is stale: '+name);
for(const [name,value]of Object.entries(recovery.buildFiles))assert.equal(hash(path.join(root,name)),value.sha256,'Recovery evidence is stale: '+name);
for(const name of Object.keys(web.build))assert.equal(hash(path.join(root,'Builds/Windows/WebRoot',name)),web.build[name].sha256,'Packaged browser invitation is stale: '+name);
const catalog=JSON.parse(fs.readFileSync(path.join(root,'Assets/Resources/Data/catalog.json')));
assert.equal(hash(catalog.sourcePath),catalog.sourceSha256,'Certified source changed');
function files(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(directory,e.name)):[path.join(directory,e.name)]);}
function entry(file){return {path:path.relative(root,file).replaceAll('\\','/'),bytes:fs.statSync(file).size,sha256:hash(file)};}
const sourceFiles=[...files(path.join(root,'Assets')),...files(path.join(root,'Packages')),...files(path.join(root,'ProjectSettings'))].sort();
const sources=sourceFiles.map(entry);const sourceDigest=crypto.createHash('sha256').update(sources.map(f=>f.path+'\0'+f.sha256).join('\n')).digest('hex');
const artifacts=[...files(path.join(root,'Builds/Windows')),...files(path.join(root,'Builds/WebGL')),...files(path.join(root,'Builds/Android')),path.join(root,'Legacy/core_clash_v149_legacy_presentation.html')].filter(p=>!/[\\/][^\\/]*(DoNotShip|DontShip)[^\\/]*[\\/]/.test(p)).sort().map(entry);
const result={sealedAt:new Date().toISOString(),specVersion:149,presentationRevision:'R5',scope:'Native class-demo vertical slice with mobile setup layout and LAN recovery; not full roster ability parity',sourceReference:{path:catalog.sourcePath,sha256:catalog.sourceSha256,unchanged:true},sourceTreeSha256:sourceDigest,checks:{coreTests:{passed:tests.passed,failed:tests.failed},codecExitCode:codec.exitCode,realNativeHostWebglClient:network.pass,realUdpNativeAndBrowserInvitation:lan.pass,plainBrowserInvitation:invitation.pass,realNativeSeatReplacement:rejoin.pass,publicJoinRecovery:recovery.pass,androidApkVerified:android.pass,androidDeviceTested:false,nativeRenderedFullMatch:native.passed,browserGui:web.ok,builds},sources,artifacts};
fs.writeFileSync(path.join(root,'Evidence/delivery-manifest.json'),JSON.stringify(result,null,2)+'\n');
console.log('SEALED: '+artifacts.length+' build/legacy files; '+sources.length+' source/config files; core '+tests.passed+'/0; final browser/network pass; certified source unchanged.');
