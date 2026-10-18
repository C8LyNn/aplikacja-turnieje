'use strict';
// Public browser UI and real native NGO host. No injected state or Unity test hooks.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),net=require('node:net'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/kubap/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {createWebServer}=require('./serve-web.cjs');
const root=path.resolve(__dirname,'..'),evidence=path.join(root,'Evidence'),baseline=process.argv.includes('--baseline');
const paths=['Builds/Windows/CoreClash_Data/Managed/Assembly-CSharp.dll','Builds/Windows/CoreClash_Data/resources.assets','Builds/Windows/CoreClash_Data/level0','Builds/WebGL/Build/WebGL.data','Builds/WebGL/Build/WebGL.wasm'];
const fingerprint=()=>Object.fromEntries(paths.map(p=>[p,{sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex')}]));
const report={startedAt:new Date().toISOString(),pass:false,baseline,scope:'One PC: real WebGL public join UI, failed endpoint, retry, native host loss, local-play recovery and canceled pending join; no physical Wi-Fi/device claim.',checks:[],console:[],pageErrors:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,ms,why){const end=Date.now()+ms;while(!fn()){if(Date.now()>end)throw Error(why);await sleep(100);}}
async function port(){const s=net.createServer();await new Promise((r,j)=>s.once('error',j).listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p;}
async function click(page,x,y){const b=await page.locator('#unity-canvas').boundingBox();await page.mouse.click(b.x+x,b.y+y,{delay:90});await sleep(180);}
async function shot(page,name){await page.screenshot({path:path.join(evidence,'r5-recovery-'+name+'.png')});}
function check(name,pass){report.checks.push({name,pass});assert.ok(pass,name);}
let browser,host,blackhole;const sockets=new Set(),server=createWebServer(path.join(root,'Builds/WebGL'));
(async()=>{
 try{
  report.buildFiles=fingerprint();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  const hostPort=await port(),hostLog=path.join(evidence,'r5-recovery-host.log');fs.writeFileSync(hostLog,'');
  host=cp.spawn(path.join(root,'Builds/Windows/CoreClash.exe'),['-batchmode','-nographics','-logFile',hostLog,'--cc-network-host','--cc-network-smoke','--cc-network-port',String(hostPort)],{cwd:root,windowsHide:true,stdio:'ignore'});
  await until(()=>fs.readFileSync(hostLog,'utf8').includes('CC_NET_HOST_READY'),20000,'Native host not ready.');
  browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:900}});
  page.on('console',m=>{report.console.push(m.text());if(/CC_LAN_|CC_NET_/.test(m.text()))console.log(m.text());});page.on('pageerror',e=>report.pageErrors.push(e.message));
  const dead=await port();await page.goto(base+'/?joinHost=127.0.0.1&joinPort='+dead);await until(()=>report.console.some(s=>s.includes('CORE_CLASH_READY')),60000,'WebGL not ready.');await sleep(4000);
  await shot(page,baseline?'before-failed-join':'pending-failed-join');
  await until(()=>report.console.some(s=>s.includes('CC_LAN_CONNECTION_RECOVERED')),30000,'Failed join did not return to an actionable Join Game screen.');
  check('Failed public invitation restores setup and visible Join Game without Escape',true);
  check('Public failure uses player copy while transport detail remains in debug log',report.console.some(s=>s.includes('CC_LAN_CONNECTION_FAILED Could not join'))&&report.console.some(s=>s.includes('CC_NET_DISCONNECT_DETAIL')));await shot(page,'failed-join-restored');
  // The Join screen has a normal invitation field and button; no new URL load or state hook.
  await click(page,360,340);await page.keyboard.type('http://127.0.0.1:8080/?joinHost=127.0.0.1&joinPort='+hostPort);await click(page,716,340);
  await until(()=>report.console.some(s=>s.includes('CC_NET_STATE_APPLIED')),30000,'Ordinary retry did not receive authoritative state.');
  check('Retry through the same player UI/NetworkManager reaches real native authority',true);await shot(page,'retry-connected');
  const recoveredBefore=report.console.filter(s=>s.includes('CC_LAN_CONNECTION_RECOVERED')).length;host.kill();host=null;
  await until(()=>report.console.filter(s=>s.includes('CC_LAN_CONNECTION_RECOVERED')).length>recoveredBefore,30000,'Host loss did not expose recovery UI.');
  check('Unexpected native host loss restores actionable Join Game',true);await shot(page,'host-lost');
  await click(page,765,55);await click(page,240,550);const starts=report.console.filter(s=>s.includes('CORE_CLASH_MATCH_START')).length;
  const b=await page.locator('#unity-canvas').boundingBox();await page.mouse.move(b.x+261,b.y+544);await page.mouse.down();await page.mouse.move(b.x+261,b.y+430,{steps:12});await page.mouse.up();
  await until(()=>report.console.some(s=>s.includes('CORE_CLASH_LAUNCH owner=0')),3000,'Local play remained blocked by the failed network link.');check('Local play and a real launch work after host loss',starts>=3);await shot(page,'local-play-restored');
  blackhole=net.createServer(s=>{sockets.add(s);s.on('close',()=>sockets.delete(s));});await new Promise(r=>blackhole.listen(0,'127.0.0.1',r));
  const cancelPage=await browser.newPage({viewport:{width:1280,height:900}});const cancelLogs=[];cancelPage.on('console',m=>cancelLogs.push(m.text()));cancelPage.on('pageerror',e=>report.pageErrors.push(e.message));
  await cancelPage.goto(base+'/?joinHost=127.0.0.1&joinPort='+blackhole.address().port);await until(()=>cancelLogs.some(s=>s.includes('CC_LAN_INVITATION_JOIN')),60000,'Pending invitation did not start.');await sleep(4000);await shot(cancelPage,'pending-cancel');
  await click(cancelPage,480,269);await until(()=>cancelLogs.some(s=>s.includes('CC_LAN_JOIN_CANCELED')),5000,'Cancel joining did not restore Join Game.');
  check('Pending join has a visible Cancel Joining action and restores setup',true);await shot(cancelPage,'canceled');
  await sleep(1200);check('Intentional cancellation does not trigger a spurious failure reopen',!cancelLogs.some(s=>s.includes('CC_LAN_CONNECTION_RECOVERED')));
  const retryPort=await port(),retryLog=path.join(evidence,'r5-recovery-retry-host.log');fs.writeFileSync(retryLog,'');
  host=cp.spawn(path.join(root,'Builds/Windows/CoreClash.exe'),['-batchmode','-nographics','-logFile',retryLog,'--cc-network-host','--cc-network-smoke','--cc-network-port',String(retryPort)],{cwd:root,windowsHide:true,stdio:'ignore'});
  await until(()=>fs.readFileSync(retryLog,'utf8').includes('CC_NET_HOST_READY'),20000,'Retry native host not ready.');
  await click(cancelPage,360,340);await cancelPage.keyboard.type('http://127.0.0.1:8080/?joinHost=127.0.0.1&joinPort='+retryPort);await click(cancelPage,716,340);
  await until(()=>cancelLogs.some(s=>s.includes('CC_NET_STATE_APPLIED')),30000,'Same canceled player could not retry a normal invitation.');
  check('Canceled player retries through normal Join UI and reaches native authority',true);await sleep(300);await shot(cancelPage,'cancel-retry-connected');
  await click(cancelPage,867,34);await shot(cancelPage,'connected-disconnect-action');await click(cancelPage,650,269);await sleep(1200);
  const startsBefore=cancelLogs.filter(s=>s.includes('CORE_CLASH_MATCH_START')).length;
  await click(cancelPage,765,55);await click(cancelPage,240,550);
  await until(()=>cancelLogs.filter(s=>s.includes('CORE_CLASH_MATCH_START')).length===startsBefore+1,3000,'Connected Disconnect did not restore local setup.');
  check('Connected public Disconnect restores local setup without a failure reopen',!cancelLogs.some(s=>s.includes('CC_LAN_CONNECTION_RECOVERED')));await shot(cancelPage,'intentional-disconnect-local');
  report.cancelConsole=cancelLogs.filter(s=>/CC_NET_|CC_LAN_/.test(s));check('No browser page errors',report.pageErrors.length===0);report.pass=true;
 }catch(e){report.error=String(e.stack||e);console.error(report.error);process.exitCode=1;}
 finally{
  if(browser)await browser.close();if(host&&!host.killed)host.kill();for(const s of sockets)s.destroy();if(blackhole)await new Promise(r=>blackhole.close(r));if(server.listening)await new Promise(r=>server.close(r));
  report.buildFilesUnchanged=JSON.stringify(report.buildFiles)===JSON.stringify(fingerprint());if(!report.buildFilesUnchanged){report.pass=false;process.exitCode=1;}
  report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(evidence,baseline?'r5-lan-recovery-before.json':'r5-lan-recovery.json'),JSON.stringify(report,null,2)+'\n');
 }
 console.log(JSON.stringify({pass:report.pass,checks:report.checks,baseline}));
})();
