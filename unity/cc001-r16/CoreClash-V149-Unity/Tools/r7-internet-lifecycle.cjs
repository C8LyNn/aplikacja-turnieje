'use strict';
// Real backend responses, isolated browser identities, ordinary player controls.
// The cancellation case holds a genuine successful join response; it never invents service data.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/kubap/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {createWebServer}=require('./serve-web.cjs');
const {createBuildManifest,verifyHostedBuild}=require('./web-release.cjs');
const root=path.resolve(__dirname,'..'),evidence=path.join(root,'Evidence');
const paths=['Builds/Windows/CoreClash_Data/Managed/Assembly-CSharp.dll','Builds/Windows/CoreClash_Data/resources.assets','Builds/Windows/CoreClash_Data/level0','Builds/WebGL/Build/WebGL.data','Builds/WebGL/Build/WebGL.wasm','Builds/WebGL/index.html'];
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const fingerprint=()=>Object.fromEntries(paths.map(p=>[p,{sha256:hash(p)}]));
const report={startedAt:new Date().toISOString(),pass:false,checks:[],console:[],responses:[],pageErrors:[],scope:'Actual Unity Cloud and Relay with Windows host and isolated WebGL participants on one PC. One test delays a real successful backend response. No physical-device/cross-NAT claim.'};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,ms,label){const end=Date.now()+ms;while(!await fn()){if(Date.now()>end)throw Error(label);await sleep(150);}}
function check(name,pass){report.checks.push({name,pass:!!pass});assert.ok(pass,name);console.log('PASS '+name);}
function count(id,token){return report.console.filter(r=>r.id===id&&r.text.includes(token)).length;}
function observe(page,id){
 page.on('console',m=>{if(/CORE_CLASH_|CC_LAN_|CC_NET_/.test(m.text()))report.console.push({id,text:m.text()});});
 page.on('pageerror',e=>report.pageErrors.push({id,message:e.message}));
 page.on('response',async r=>{const u=new URL(r.url());if(u.hostname.endsWith('services.api.unity.com')){
  const item={id,service:u.hostname,method:r.request().method(),status:r.status(),join:u.pathname.endsWith('/joinbycode'),leave:r.request().method()==='DELETE'};report.responses.push(item);
  // Only the public Lobby error description; never record headers, player data or access/session tokens.
  if(item.join&&item.status>=400){try{const error=await r.json();item.error={code:error.code,title:error.title,detail:error.detail};}catch{}}
 }});
}
async function click(page,x,y){await page.mouse.click(x,y,{delay:90});await sleep(200);}
async function join(page,code){await click(page,600,420);await page.keyboard.press('Control+A');await page.keyboard.type(code);await click(page,600,479);}
async function shot(page,name){await page.screenshot({path:path.join(evidence,'r7-internet-'+name+'.png')});}
let browser,server,host,releaseHeld,base,code;
const hostLog=path.join(evidence,'r7-internet-lifecycle-host.log');
const hostRead=()=>{try{return fs.readFileSync(hostLog,'utf8');}catch{return '';}};
async function player(id,invitation){const context=await browser.newContext({viewport:{width:1280,height:900}});const page=await context.newPage();observe(page,id);await page.goto(base+(invitation?'/?joinCode='+invitation:'/'));return {context,page};}
async function disconnect(page,id){
 await click(page,1190,32);await click(page,600,396);
 await until(()=>report.responses.some(r=>r.id===id&&r.leave&&r.status<300),20000,'Cloud membership was not left through Disconnect');
 await until(()=>hostRead().includes('CC_NET_SEAT_RELEASED'),15000,'Host did not release P2');
}
(async()=>{
 try{
  report.buildFiles=fingerprint();fs.writeFileSync(hostLog,'');
  host=cp.spawn(path.join(root,'Builds/Windows/CoreClash.exe'),['-batchmode','-nographics','-logFile',hostLog,'--cc-network-host','--cc-network-internet','--cc-network-smoke'],{cwd:root,windowsHide:true,stdio:'ignore'});
  host.once('error',e=>report.launchError=e.message);
  await until(()=>/CC_NET_INTERNET_SMOKE_CODE [A-Z0-9]{6}/.test(hostRead())||hostRead().includes('CC_NET_INTERNET_ERROR'),60000,'Cloud host did not become ready');
  code=hostRead().match(/CC_NET_INTERNET_SMOKE_CODE ([A-Z0-9]{6})/)?.[1];assert.ok(code,'Cloud code issued');
  server=createWebServer();const staticHandler=server.listeners('request')[0],prefix='/core-clash/';server.removeAllListeners('request');
  server.on('request',(req,res)=>{if(!req.url.startsWith(prefix)){res.writeHead(404).end();return;}req.url=req.url.slice(prefix.length-1);staticHandler(req,res);});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port+'/core-clash';
  report.staticHosting=await verifyHostedBuild({url:base+'/',manifest:createBuildManifest(path.join(root,'Builds/WebGL')),allowLocalHttp:true});
  check('Exact WebGL files and headers work under a hosting subdirectory',report.staticHosting.pass);
  browser=await chromium.launch({channel:'msedge',headless:true});
  const first=await player('first',code);
  await until(()=>count('first','CC_NET_STATE_APPLIED')>0,60000,'First real participant did not receive state');
  check('Ordinary invitation joins the real Internet host',true);
  const full=await player('full',code);
  await until(()=>count('full','CC_LAN_CONNECTION_RECOVERED')>0,60000,'Full-room join did not return to setup');
  check('Backend rejects a third participant and restores Join Game',report.responses.some(r=>r.id==='full'&&r.join&&r.status>=400)&&count('full','CC_NET_RELAY_STARTED')===0);
  await shot(full.page,'full-room');
  report.fullRoomMessage=report.console.find(r=>r.id==='full'&&r.text.includes('CC_LAN_CONNECTION_FAILED'))?.text;
  check('Full room gives explicit two-player guidance',report.fullRoomMessage?.includes('This game already has two players'));
  await disconnect(first.page,'first');check('Disconnect leaves Cloud membership and releases host seat',true);
  await join(full.page,code);await until(()=>count('full','CC_NET_STATE_APPLIED')>0,40000,'Same player could not retry after room became free');
  check('Rejected third participant can retry the same code after P2 leaves',true);
  await disconnect(full.page,'full');await first.context.close();await full.context.close();
  const invalid=await player('invalid','000000');
  await until(()=>count('invalid','CC_LAN_CONNECTION_RECOVERED')>0,60000,'Invalid service code did not recover');
  check('Invalid backend code gives copy-code guidance',report.console.some(r=>r.id==='invalid'&&r.text.includes('CC_LAN_CONNECTION_FAILED That game code is invalid')));
  await shot(invalid.page,'invalid-code');await invalid.context.close();
  // Reuse a character proven valid by the backend instead of guessing its restricted alphabet.
  const missingCode=code[0].repeat(6);assert.notEqual(missingCode,code,'Negative code must differ from the live room');
  const missing=await player('missing',missingCode);
  await until(()=>count('missing','CC_LAN_CONNECTION_RECOVERED')>0,60000,'Missing code did not recover');
  check('Missing-code response gives expiry guidance and restores Join Game',report.console.some(r=>r.id==='missing'&&r.text.includes('CC_LAN_CONNECTION_FAILED That game code has expired')));
  await shot(missing.page,'missing-code');await missing.context.close();

  const heldContext=await browser.newContext({viewport:{width:1280,height:900}}),held=await heldContext.newPage();observe(held,'cancel');
  let intercepted=false,responseReleased=false;
  const hold=new Promise(r=>releaseHeld=r);
  await held.route('https://lobby.services.api.unity.com/**',async route=>{
   const u=new URL(route.request().url());
   if(!intercepted&&route.request().method()==='POST'&&u.pathname.endsWith('/joinbycode')){
    intercepted=true;const response=await route.fetch();report.heldJoinStatus=response.status();report.heldResponseReceived=true;
    await hold;responseReleased=true;await route.fulfill({response});
   }else await route.continue();
  });
  await held.goto(base+'/?joinCode='+code);
  await until(()=>report.heldResponseReceived,60000,'Genuine join response not intercepted');check('Cancellation holds an actual successful Cloud membership response',report.heldJoinStatus===200);
  await click(held,600,338);await until(()=>count('cancel','CC_LAN_JOIN_CANCELED')>0,5000,'Pending Internet join could not be canceled');
  releaseHeld();await until(()=>report.responses.some(r=>r.id==='cancel'&&r.leave&&r.status<300),30000,'Late canceled membership was not released');
  await sleep(1500);check('Canceled late result leaves membership without starting Relay',responseReleased&&count('cancel','CC_NET_RELAY_STARTED')===0&&count('cancel','CC_NET_STATE_APPLIED')===0);
  await shot(held,'canceled');await join(held,code);await until(()=>count('cancel','CC_NET_STATE_APPLIED')>0,40000,'Same manager could not join after canceled Cloud cleanup');
  check('Same player joins normally after canceled response cleanup',true);
  await shot(held,'joined-after-cancel');
  const recovered=count('cancel','CC_LAN_CONNECTION_RECOVERED');host.kill();host=null;
  await until(()=>count('cancel','CC_LAN_CONNECTION_RECOVERED')>recovered,45000,'Relay host loss did not recover');check('Loss of Internet host restores Join Game',true);
  await shot(held,'host-lost');await click(held,928,99);await click(held,300,814);
  await until(()=>count('cancel','CORE_CLASH_MATCH_START')>=2,6000,'Local match did not start after Relay loss');
  await held.mouse.move(369,805);await held.mouse.down();await held.mouse.move(400,590,{steps:10});await held.mouse.up();
  await until(()=>count('cancel','CORE_CLASH_LAUNCH owner=0')>0,5000,'Local mouse launch blocked after Relay loss');check('Local play and mouse launch work after Internet host loss',true);
  await shot(held,'local-after-loss');check('No browser page exceptions',report.pageErrors.length===0);report.pass=true;
 }catch(e){report.error=String(e.stack||e);console.error(report.error);process.exitCode=1;}
 finally{
  releaseHeld?.();if(browser)await browser.close();if(host&&!host.killed)host.kill();if(server?.listening)await new Promise(r=>server.close(r));
  report.buildFilesUnchanged=JSON.stringify(report.buildFiles)===JSON.stringify(fingerprint());report.pass=report.pass&&report.buildFilesUnchanged;report.finishedAt=new Date().toISOString();
  report.hostMarkers=hostRead().split(/\r?\n/).filter(s=>/CC_NET_|CC_LAN_/.test(s)).map(s=>s.replace(/CC_NET_INTERNET_SMOKE_CODE [A-Z0-9]{6}/,'CC_NET_INTERNET_SMOKE_CODE [issued]'));
  fs.writeFileSync(path.join(evidence,'r7-internet-lifecycle.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,checks:report.checks,error:report.error,fullRoomMessage:report.fullRoomMessage,heldJoinStatus:report.heldJoinStatus}));
 }
})();
