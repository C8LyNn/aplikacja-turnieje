'use strict';
// Inspect only the APK built by this checkout. Does not install or execute it.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),android=process.env.CC_ANDROID_PLAYER||'C:/Program Files/Unity/Hub/Editor/6000.4.0f1/Editor/Data/PlaybackEngines/AndroidPlayer';
const apk=path.join(root,'Builds/Android/CoreClash.apk'),report={testedAt:new Date().toISOString(),pass:false,deviceRuntimeTested:false,scope:'Static inspection and signature verification of the current source-built APK; no installation or physical-device runtime/network claim.',checks:[]};
function run(file,args){const r=cp.spawnSync(file,args,{encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024});if(r.status!==0)throw Error(r.error?.message||r.stderr||r.stdout||'tool failed');return r.stdout;}
function check(name,pass){report.checks.push({name,pass});assert.ok(pass,name);}
try{
 report.apk={path:'Builds/Android/CoreClash.apk',bytes:fs.statSync(apk).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(apk)).digest('hex')};
 const aapt=path.join(android,'SDK/build-tools/36.0.0/aapt.exe');
 const badging=run(aapt,['dump','badging',apk]),entries=run(aapt,['list',apk]).split(/\r?\n/);
 report.manifest=badging.split(/\r?\n/).filter(s=>/^(package:|sdkVersion:|targetSdkVersion:|uses-permission:|native-code:)/.test(s));
 check('Correct Core Clash package and V149 version',/package: name='com.coreclash.classdemo'.*versionName='149.0.0'/.test(badging));
 check('API26 minimum',/sdkVersion:'26'/.test(badging));
 check('Internet permission included',/uses-permission: name='android.permission.INTERNET'/.test(badging));
 check('ARM64-only native build',/native-code: 'arm64-v8a'\s*$/.test(badging.trim()));
 check('IL2CPP runtime and metadata packaged',entries.includes('lib/arm64-v8a/libil2cpp.so')&&entries.includes('assets/bin/Data/Managed/Metadata/global-metadata.dat'));
 check('Debug DoNotShip folders not inside APK',!entries.some(s=>/DoNotShip|DontShip/.test(s)));
 report.signature=run(path.join(android,'OpenJDK/bin/java.exe'),['-jar',path.join(android,'SDK/build-tools/36.0.0/lib/apksigner.jar'),'verify','--verbose',apk]).trim();
 check('APK cryptographic signature verifies',report.signature.startsWith('Verifies'));
 report.pass=true;
}catch(e){report.error=String(e.stack||e);console.error(report.error);process.exitCode=1;}
fs.mkdirSync(path.join(root,'Evidence/R16'),{recursive:true});
fs.writeFileSync(path.join(root,'Evidence/R16/android-package.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,apk:report.apk,checks:report.checks,deviceRuntimeTested:false}));
