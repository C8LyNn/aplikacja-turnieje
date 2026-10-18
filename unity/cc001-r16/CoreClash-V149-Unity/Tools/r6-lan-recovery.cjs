'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),net=require('node:net'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/kubap/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {createWebServer}=require('./serve-web.cjs');
const root=path.resolve(__dirname,'..'),evidence=path.join(root,'Evidence'),report={startedAt:new Date().toISOString(),pass:false,checks:[],console:[],pageErrors:[],buildFiles:{},scope:'Public WebGL UI and real native LAN host on one PC; failure, same-manager retry, lost host, cancel and local fallback. No physical-device claim.'};
const paths=['Builds/Windows/CoreClash_Data/Managed/Assembly-CSharp.dll','Builds/Windows/CoreClash_Data/resources.assets','Builds/Windows/CoreClash_Data/level0','Builds/WebGL/Build/WebGL.data','Builds/WebGL/Build/WebGL.wasm','Builds/WebGL/index.html'];
const fingerprint=()=>Object.fromEntries(paths.map(p=>[p,{sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex')}]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn,ms,label){const end=Date.now()+ms;while(!fn()){if(Date.now()>end)throw Error(label);await sleep(120);}}
async function port(){const s=net.createServer();await new Promise((r,j)=>s.once('error',j).listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p;}
function check(name,pass){report.checks.push({name,pass:!!pass});assert.ok(pass,name);}
let host,browser,server,blackhole;const sockets=[];
async function launchHost(){const p=await port(),log=path.join(evidence,'r6-recovery-host.log');fs.writeFileSync(log,'');host=cp.spawn(path.join(root,'Builds/Windows/CoreClash.exe'),['-batchmode','-nographics','-logFile',log,'--cc-network-host','--cc-network-smoke','--cc-network-port',String(p)],{cwd:root,windowsHide:true,stdio:'ignore'});await until(()=>fs.readFileSync(log,'utf8').includes('CC_NET_HOST_READY'),20000,'Native host not ready');return p;}
function observe(page,id){page.on('console',m=>{if(/CORE_CLASH_|CC_LAN_|CC_NET_/.test(m.text()))report.console.push({id,text:m.text()});});page.on('pageerror',e=>report.pageErrors.push(e.message));}
function count(id,token){return report.console.filter(r=>r.id===id&&r.text.includes(token)).length;}
async function click(page,x,y){await page.mouse.click(x,y,{delay:90});await sleep(180);}
async function invite(page,p){await click(page,600,464);await page.keyboard.press('Control+A');await page.keyboard.type('http://127.0.0.1:8080/?joinHost=127.0.0.1&joinPort='+p);await click(page,600,521);}
async function screenshot(page,id){await page.screenshot({path:path.join(evidence,'r6-recovery-'+id+'.png')});}
(async()=>{
 try{
  report.buildFiles=fingerprint();server=createWebServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  const hostPort=await launchHost(),deadPort=await port();browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:900}});observe(page,'recovery');await page.goto(base+'/?joinHost=127.0.0.1&joinPort='+deadPort);
  await until(()=>count('recovery','CC_LAN_CONNECTION_RECOVERED')>0,60000,'Failed invitation did not recover');await sleep(1000);await screenshot(page,'failed-invitation');check('Failed invitation restores actionable LAN Join',true);
  await invite(page,hostPort);await until(()=>count('recovery','CC_NET_STATE_APPLIED')>0,30000,'Same-manager retry did not receive host state');check('Same NetworkManager retries through the ordinary LAN invitation field',true);await screenshot(page,'retried');
  const recoveries=count('recovery','CC_LAN_CONNECTION_RECOVERED');host.kill();host=null;await until(()=>count('recovery','CC_LAN_CONNECTION_RECOVERED')>recoveries,30000,'Host loss did not recover');check('Unexpected host loss restores Join Game',true);
  await click(page,928,99);await click(page,300,814);await until(()=>count('recovery','CORE_CLASH_MATCH_START')>=3,5000,'Local game did not start after lost host');
  await page.mouse.move(369,805);await page.mouse.down();await page.mouse.move(400,590,{steps:10});await page.mouse.up();await until(()=>count('recovery','CORE_CLASH_LAUNCH owner=0')>0,4000,'Local input blocked after host loss');check('Local match and a real mouse launch work after recovery',true);await screenshot(page,'local-after-loss');
  blackhole=net.createServer(s=>{sockets.push(s);s.on('error',()=>{});});await new Promise(r=>blackhole.listen(0,'127.0.0.1',r));
  const cancel=await browser.newPage({viewport:{width:1280,height:900}});observe(cancel,'cancel');await cancel.goto(base+'/?joinHost=127.0.0.1&joinPort='+blackhole.address().port);await until(()=>count('cancel','CC_LAN_INVITATION_JOIN')>0,60000,'Pending connection did not start');await sleep(2000);await screenshot(cancel,'pending');
  await click(cancel,600,338);await until(()=>count('cancel','CC_LAN_JOIN_CANCELED')>0,4000,'Cancel button did not cancel joining');check('Visible Cancel Connecting returns to Join Game',true);await screenshot(cancel,'canceled');
  const retry=await launchHost();await invite(cancel,retry);await until(()=>count('cancel','CC_NET_STATE_APPLIED')>0,30000,'Join after cancellation failed');check('Same manager joins a real host after cancellation',true);
  check('No browser page errors',report.pageErrors.length===0);report.pass=true;
 }catch(e){report.error=String(e.stack||e);console.error(report.error);process.exitCode=1;}
 finally{
  if(browser)await browser.close();if(host&&!host.killed)host.kill();sockets.forEach(s=>s.destroy());if(blackhole)await new Promise(r=>blackhole.close(r));if(server?.listening)await new Promise(r=>server.close(r));
  report.buildFilesUnchanged=JSON.stringify(report.buildFiles)===JSON.stringify(fingerprint());report.pass=report.pass&&report.buildFilesUnchanged;report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(evidence,'r6-lan-recovery.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,checks:report.checks,error:report.error}));
 }
})();
