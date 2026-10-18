'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),net=require('node:net'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/kubap/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {createWebServer}=require('./serve-web.cjs');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'Evidence/R16/Network');fs.mkdirSync(dir,{recursive:true});
const log=path.join(dir,'host.log'),report={date:new Date().toISOString(),pass:false,scope:'Real native NGO/UTP WebSocket host plus WebGL client on one PC over loopback; P1 FIRE trap/P2 TOXIN trap snapshots, spoof and duplicate intent rejection. No cross-NAT or physical-device claim.',pageErrors:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const read=()=>fs.existsSync(log)?fs.readFileSync(log,'utf8'):'';
async function until(fn,label){let end=Date.now()+60000;while(!await fn()){if(Date.now()>end)throw Error(label);await sleep(150);}}
(async()=>{let host,browser,server;try{
 const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
 server=createWebServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const httpPort=server.address().port;
 fs.writeFileSync(log,'');host=cp.spawn(path.join(root,'Builds/Windows/CoreClash.exe'),['-batchmode','-nographics','-logFile',log,'--cc-network-host','--cc-network-smoke','--cc-network-status','--cc-network-port',String(port)],{cwd:root,windowsHide:true,stdio:'ignore'});
 host.on('error',e=>report.launchError=e.message);await until(()=>read().includes('CC_NET_HOST_READY'),'Host readiness');
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();const logs=[];
 page.on('console',m=>logs.push(m.text()));page.on('pageerror',e=>report.pageErrors.push(e.message));
 await page.goto('http://127.0.0.1:'+httpPort+'/?ccNetwork=join&ccAddress=127.0.0.1&ccPort='+port+'&ccSmoke=1&ccStatus=1');
 await until(()=>read().includes('CC_NET_SMOKE_PASS role=host')&&logs.some(l=>l.includes('CC_NET_SMOKE_PASS role=client')),'Authority, snapshot and command checks');
 report.hostTrapState=read().includes('CC_NET_STATUS_STATE role=host');report.clientTrapState=logs.some(l=>l.includes('CC_NET_STATUS_STATE role=client'));
 report.hostRejected=read().includes('rejected=2');report.clientLogs=logs.filter(l=>l.includes('CC_NET_'));report.pass=report.hostTrapState&&report.clientTrapState&&report.hostRejected&&report.pageErrors.length===0;
 await page.screenshot({path:path.join(dir,'webgl-client.png')});
 report.buildHashes=Object.fromEntries(['Builds/Windows/CoreClash_Data/Managed/Assembly-CSharp.dll','Builds/WebGL/Build/WebGL.wasm'].map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex')]));
}catch(e){report.error=e.stack||e.message;}finally{if(browser)await browser.close();if(host&&!host.killed)host.kill();if(server)await new Promise(r=>server.close(r));fs.writeFileSync(path.join(dir,'network.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(!report.pass)process.exitCode=1;}})();
