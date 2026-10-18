'use strict';
// Real Unity Services, a native authoritative NGO host and an unchanged WebGL client.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/kubap/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {createWebServer}=require('./serve-web.cjs');
const tag=process.argv.find(a=>a.startsWith('--tag='))?.slice(6)||'r6';
const momentum=process.argv.includes('--momentum');
const explosives=process.argv.includes('--explosives');
if(!/^[a-z0-9-]+$/.test(tag))throw Error('Invalid evidence tag');
const root=path.resolve(__dirname,'..'),evidence=path.join(root,'Evidence'),log=path.join(evidence,tag+'-internet-host.log');
const paths=['Builds/Windows/CoreClash_Data/Managed/Assembly-CSharp.dll','Builds/Windows/CoreClash_Data/resources.assets','Builds/Windows/CoreClash_Data/level0','Builds/WebGL/Build/WebGL.data','Builds/WebGL/Build/WebGL.wasm'];
const fingerprint=()=>Object.fromEntries(paths.map(p=>[p,{sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex')}]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),read=()=>{try{return fs.readFileSync(log,'utf8');}catch{return '';}};
async function until(fn,ms,label){const end=Date.now()+ms;while(!await fn()){if(Date.now()>end)throw Error(label);await sleep(150);}}
const report={startedAt:new Date().toISOString(),pass:false,scope:'Actual Unity Cloud Authentication + MPS Sessions + Relay WSS, Windows native host and WebGL client on one computer. Does not prove connectivity on separate physical devices/networks.',projectId:'f87462cd-20c0-432c-9108-8f07f77ad27b',browser:[],pageErrors:[],physicalCrossDeviceTested:false,buildFiles:{}};
let host,browser,server;
(async()=>{
 try{
  report.buildFiles=fingerprint();fs.writeFileSync(log,'');
  host=cp.spawn(path.join(root,'Builds/Windows/CoreClash.exe'),['-batchmode','-nographics','-logFile',log,'--cc-network-host','--cc-network-internet','--cc-network-smoke',...(momentum?['--cc-network-momentum']:[]),...(explosives?['--cc-network-explosives']:[])],{cwd:root,windowsHide:true,stdio:'ignore'});
  host.once('error',e=>report.launchError=e.message);
  await until(()=>/CC_NET_INTERNET_SMOKE_CODE [A-Z0-9]{6}/.test(read())||read().includes('CC_NET_INTERNET_ERROR'),60000,'No Relay session code or service failure arrived.');
  const match=read().match(/CC_NET_INTERNET_SMOKE_CODE ([A-Z0-9]{6})/);
  if(!match)throw Error('Cloud session creation failed; inspect the recorded safe service markers and Unity Cloud configuration.');
  report.sessionCodeIssued=true;report.protocol='wss';
  server=createWebServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
  browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1280,height:900}});
  page.on('console',m=>{if(/CC_NET_|CC_LAN_/.test(m.text())){report.browser.push(m.text());console.log(m.text());}});page.on('pageerror',e=>report.pageErrors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/?joinCode='+match[1]+'&ccSmoke=1'+(momentum?'&ccMomentum=1':'')+(explosives?'&ccExplosives=1':''));
  await until(()=>report.browser.some(s=>s.includes('CC_NET_SMOKE_PASS role=client'))&&read().includes('CC_NET_SMOKE_PASS role=host'),100000,'Real Relay peers did not finish authoritative intent/state validation.');
  await page.screenshot({path:path.join(evidence,tag+'-internet-webgl-client.png')});
  report.hostAcceptedRemote=read().includes('CC_NET_INTENT_ACCEPT owner=1');report.rejectedSpoofAndDuplicate=read().split('\n').filter(s=>s.includes('CC_NET_INTENT_REJECT')).length>=2;
  report.pass=report.pageErrors.length===0&&report.hostAcceptedRemote&&report.rejectedSpoofAndDuplicate;
  report.momentum=momentum;report.momentumStateVerified=momentum&&read().includes('CC_NET_MOMENTUM_STATE role=host')&&report.browser.some(s=>s.includes('CC_NET_MOMENTUM_STATE role=client'));
  if(momentum)report.pass=report.pass&&report.momentumStateVerified;
  report.explosives=explosives;report.explosiveStateVerified=explosives&&read().includes('CC_NET_EXPLOSIVE_STATE role=host')&&report.browser.some(s=>s.includes('CC_NET_EXPLOSIVE_STATE role=client'));
  if(explosives)report.pass=report.pass&&report.explosiveStateVerified;
 }catch(e){report.error=String(e.stack||e);process.exitCode=1;}
 finally{
  report.hostMarkers=read().split(/\r?\n/).filter(s=>/CC_NET_|CC_LAN_/.test(s)).map(s=>s.replace(/CC_NET_INTERNET_SMOKE_CODE [A-Z0-9]{6}/,'CC_NET_INTERNET_SMOKE_CODE [issued]'));
  if(browser)await browser.close();if(host&&!host.killed)host.kill();if(server?.listening)await new Promise(r=>server.close(r));
  report.buildFilesUnchanged=JSON.stringify(report.buildFiles)===JSON.stringify(fingerprint());report.pass=report.pass&&report.buildFilesUnchanged;report.finishedAt=new Date().toISOString();
  fs.writeFileSync(path.join(evidence,tag+'-internet-smoke.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,sessionCodeIssued:report.sessionCodeIssued,hostMarkers:report.hostMarkers,error:report.error,pageErrors:report.pageErrors}));
 }
})();
