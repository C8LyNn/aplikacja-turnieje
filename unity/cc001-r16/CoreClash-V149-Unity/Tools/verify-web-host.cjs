'use strict';
const fs=require('node:fs'),path=require('node:path');
const {createBuildManifest,verifyHostedBuild}=require('./web-release.cjs');
const root=path.resolve(__dirname,'..'),args=process.argv.slice(2),value=name=>{const i=args.indexOf(name);return i<0?null:args[i+1];};
const manifestPath=path.resolve(value('--manifest')||path.join(root,'Evidence/r7-web-release-manifest.json'));
(async()=>{
 if(args.includes('--write-manifest')){const manifest=createBuildManifest(path.join(root,'Builds/WebGL'));fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');console.log('WebGL manifest: '+manifest.files.length+' files, '+manifest.files.reduce((n,f)=>n+f.bytes,0)+' bytes');return;}
 const url=value('--url');if(!url)throw Error('Usage: node Tools/verify-web-host.cjs --url https://YOUR-WEBSITE/GAME/ [--manifest manifest.json]');
 const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 const report=await verifyHostedBuild({url,manifest,allowLocalHttp:args.includes('--allow-local-http')});
 const output=path.resolve(value('--report')||path.join(root,'Evidence/r7-web-host.json'));fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({pass:report.pass,url:report.url,files:report.files.length,errors:report.errors,warnings:report.warnings,report:output},null,2));process.exitCode=report.pass?0:1;
})().catch(e=>{console.error(e.message);process.exitCode=1;});
