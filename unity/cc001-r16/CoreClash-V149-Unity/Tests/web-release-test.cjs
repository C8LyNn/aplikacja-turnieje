'use strict';
const http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {verifyHostedBuild}=require('../Tools/web-release.cjs');
const bytes={'index.html':Buffer.from('<!doctype html><title>Core Clash</title>'),'Build/test.wasm':Buffer.from([0,97,115,109,1,0,0,0]),'Build/test.data':Buffer.from('data'),'Build/test.loader.js':Buffer.from('void 0;')};
const types={'index.html':'text/html','Build/test.wasm':'application/wasm','Build/test.data':'application/octet-stream','Build/test.loader.js':'application/javascript'};
const manifest={files:Object.entries(bytes).map(([name,data])=>({path:name,bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')}))};
const report={testedAt:new Date().toISOString(),passed:0,failed:0,tests:[]};
let mode='good';const server=http.createServer((req,res)=>{
 const relative=new URL(req.url,'http://localhost').pathname.replace(/^\/games\/core\//,'')||'index.html';
 if(!req.url.startsWith('/games/core/')){res.writeHead(404).end();return;}
 if(mode==='root-missing'&&req.url==='/games/core/'){res.writeHead(404).end();return;}
 const file=relative==='index.html'?'index.html':relative;
 if(mode==='missing'&&file.endsWith('.data')){res.writeHead(404).end();return;}
 if(mode==='redirect'&&file.endsWith('.wasm')){res.writeHead(302,{Location:'/login'}).end();return;}
 const body=mode==='fallback'&&file.endsWith('.wasm')?bytes['index.html']:mode==='stale'&&file.endsWith('.wasm')?Buffer.from([0,97,115,109,2,0,0,0]):bytes[file];
 if(!body){res.writeHead(404).end();return;}
 const type=mode==='bad-mime'&&file.endsWith('.wasm')?'application/octet-stream':mode==='fallback'?'text/html':types[file];
 res.writeHead(200,{'Content-Type':type,'Cache-Control':mode==='cache'?'public, max-age=31536000, immutable':'no-cache','Content-Length':body.length});res.end(body);
});
async function test(name,fn){try{await fn();report.tests.push({name,pass:true});report.passed++;console.log('PASS '+name);}catch(e){report.tests.push({name,pass:false,error:e.message});report.failed++;console.log('FAIL '+name+': '+e.message);}}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/games/core/';
 try{
  await test('Exact current bytes and MIME types pass under a website subdirectory',async()=>{mode='good';const r=await verifyHostedBuild({url,manifest,allowLocalHttp:true});assert.equal(r.pass,true);assert.equal(r.files.length,4);});
  for(const [scenario,reason]of [['fallback','HTML fallback'],['stale','stale bytes'],['missing','missing data'],['bad-mime','wrong wasm MIME'],['redirect','asset redirect']])await test('Deployment verifier rejects '+reason,async()=>{mode=scenario;const r=await verifyHostedBuild({url,manifest,allowLocalHttp:true});assert.equal(r.pass,false);assert(r.files.some(f=>f.path==='Build/test.wasm'&&f.errors.length>0)||scenario==='missing'&&r.files.some(f=>f.path==='Build/test.data'&&f.errors.length>0));});
  await test('Long immutable cache is a visible deployment warning',async()=>{mode='cache';const r=await verifyHostedBuild({url,manifest,allowLocalHttp:true});assert(r.warnings.length>0);});
  await test('The shared folder URL must load, even when direct index.html works',async()=>{mode='root-missing';const r=await verifyHostedBuild({url,manifest,allowLocalHttp:true});assert.equal(r.pass,false);assert(r.files.some(f=>f.path==='index.html'&&f.errors.length>0));});
  await test('HTTP is blocked without explicit loopback test mode',async()=>{await assert.rejects(()=>verifyHostedBuild({url,manifest}),/HTTPS/);});
  await test('Loopback exception never accepts a public HTTP website',async()=>{await assert.rejects(()=>verifyHostedBuild({url:'http://example.com/game/',manifest,allowLocalHttp:true}),/HTTPS/);});
  await test('Base URL rejects credentials, query and fragment',async()=>{for(const bad of ['https://user:pass@example.com/','https://example.com/?joinCode=ABCDEF','https://example.com/#game'])await assert.rejects(()=>verifyHostedBuild({url:bad,manifest}),/base URL/);});
 }finally{await new Promise(r=>server.close(r));fs.writeFileSync(path.resolve(__dirname,'../Evidence/r7-web-deploy-tests.json'),JSON.stringify(report,null,2)+'\n');process.exitCode=report.failed?1:0;console.log(JSON.stringify({passed:report.passed,failed:report.failed}));}
})();
