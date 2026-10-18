// Real release-player LAN invitation test. No replacement WebSocket or HTTP server is used.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),net=require('node:net'),dgram=require('node:dgram'),crypto=require('node:crypto');
const {chromium}=require(process.env.CC_PLAYWRIGHT_PATH||'C:/Users/kubap/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9);
const root=path.resolve(__dirname,'..'),evidence=path.resolve(root,output||'Evidence');fs.mkdirSync(evidence,{recursive:true});
const exe=path.join(root,'Builds/Windows/CoreClash.exe'),report={startedAt:new Date().toISOString(),scope:'One PC: real native UDP broadcast, native NGO peers, native WebRoot HTTP, real WebGL invitation join. Physical second-device Wi-Fi is not exercised.',pass:false,buildFiles:{},buildFilesUnchanged:false,cases:[]};
const provenancePaths=['Builds/Windows/CoreClash_Data/Managed/Assembly-CSharp.dll','Builds/Windows/CoreClash_Data/resources.assets','Builds/Windows/CoreClash_Data/level0','Builds/Windows/WebRoot/Build/WebGL.data','Builds/Windows/WebRoot/Build/WebGL.wasm'];
function buildFingerprint(){return Object.fromEntries(provenancePaths.map(relative=>{const bytes=fs.readFileSync(path.join(root,relative));return [relative,{sha256:crypto.createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length}];}));}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const read=file=>{try{return fs.readFileSync(file,'utf8');}catch{return '';}};
async function freePort(){const s=net.createServer();await new Promise((res,rej)=>s.once('error',rej).listen(0,'127.0.0.1',res));const p=s.address().port;await new Promise(r=>s.close(r));return p;}
async function until(check,ms,reason){const deadline=Date.now()+ms;while(Date.now()<deadline){if(check())return;await sleep(100);}throw Error(reason);}
function launch(name,args){const log=path.join(evidence,`lan-${name}.log`);fs.writeFileSync(log,'');const process=cp.spawn(exe,['-batchmode','-nographics','-logFile',log,...args],{cwd:root,windowsHide:true,stdio:'ignore'});process.once('error',e=>{report.launchError=e.message;});return {process,log};}
function lines(file){return read(file).split(/\r?\n/).filter(x=>/CC_NET_|CC_LAN_/.test(x));}
async function stop(instance){if(instance&&!instance.process.killed){instance.process.kill();await sleep(500);}}
function invitations(){const socket=dgram.createSocket({type:'udp4',reuseAddr:true});const rooms=[];socket.on('message',(msg,sender)=>{const p=msg.toString('utf8').split('\n');if(p.length!==5||p[0]!=='CORECLASH_LAN'||p[1]!=='149')return;const port=Number(p[3]),players=Number(p[4]);if(!Number.isInteger(port)||port<1||port>65535||!Number.isInteger(players)||players<1||players>2)return;rooms.push({name:Buffer.from(p[2],'base64').toString('utf8'),port,players,host:sender.address,fieldCount:p.length,receivedAt:new Date().toISOString()});});return {socket,rooms,ready:new Promise((res,rej)=>{socket.once('error',rej);socket.bind(47749,'0.0.0.0',res);})};}
(async()=>{
 if(!fs.existsSync(exe)||!fs.existsSync(path.join(root,'Builds/Windows/WebRoot/index.html')))throw Error('Build the release Windows/WebGL players and copy WebGL into Windows/WebRoot first.');
 report.buildFiles=buildFingerprint();
 const discovery=invitations();await discovery.ready;let host,client,browser;
 try {
  // The second native player connects to the actual UDP sender IP and advertised gameplay port.
  const port=await freePort(),nativeCase={name:'native host + UDP-discovered native P2',port,pass:false};report.cases.push(nativeCase);
  host=launch('native-host',['--cc-network-host','--cc-network-smoke','--cc-network-port',String(port)]);
  await until(()=>discovery.rooms.some(r=>r.port===port&&r.players===1),20000,'No native LAN broadcast received.');
  nativeCase.invitation=discovery.rooms.find(r=>r.port===port&&r.players===1);
  client=launch('native-client',['--cc-network-join','--cc-network-smoke','--cc-network-address',nativeCase.invitation.host,'--cc-network-port',String(nativeCase.invitation.port)]);
  await until(()=>read(host.log).includes('CC_NET_SMOKE_PASS role=host')&&read(client.log).includes('CC_NET_SMOKE_PASS role=client'),110000,'Native discovered session did not finish authoritative smoke.');
  nativeCase.hostLines=lines(host.log);nativeCase.clientLines=lines(client.log);nativeCase.pass=true;
  await stop(client);client=null;await stop(host);host=null;
  const browserPort=await freePort(),webCase={name:'native host + WebRoot invitation + WebGL P2',port:browserPort,pass:false,pageErrors:[],browserLines:[]};report.cases.push(webCase);
  host=launch('webgl-host',['--cc-network-host','--cc-network-smoke','--cc-network-port',String(browserPort)]);
  await until(()=>/CC_LAN_JOIN_URL http:\/\//.test(read(host.log)),20000,'Native host did not expose its packaged WebRoot invitation.');
  webCase.url=read(host.log).match(/CC_LAN_JOIN_URL (http:\/\/[^\s]+)/)[1];
  if(new URL(webCase.url).searchParams.has('ccNetwork'))throw Error('Invitation unexpectedly depends on developer network query.');
  const response=await fetch(webCase.url);webCase.nativeHttp={status:response.status,coop:response.headers.get('cross-origin-opener-policy'),coep:response.headers.get('cross-origin-embedder-policy')};if(response.status!==200)throw Error('Native WebRoot did not serve index.html.');
  browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1280,height:900}});
  page.on('console',msg=>{const text=msg.text();if(/CC_NET_|CC_LAN_/.test(text)){webCase.browserLines.push(text);console.log(text);}});page.on('pageerror',error=>webCase.pageErrors.push(error.message));
  // ccSmoke only drives a legal action and forged/duplicate rejection checks. joinHost/joinPort start the real public invitation flow.
  await page.goto(webCase.url+'&ccSmoke=1');
  await until(()=>webCase.browserLines.some(s=>s.includes('CC_NET_SMOKE_PASS role=client'))&&read(host.log).includes('CC_NET_SMOKE_PASS role=host'),110000,'WebGL invitation did not finish authoritative smoke.');
  await page.screenshot({path:path.join(evidence,'lan-webgl-invitation.png')});
  webCase.hostLines=lines(host.log);webCase.pass=webCase.pageErrors.length===0&&webCase.browserLines.some(s=>s.includes('CC_LAN_INVITATION_JOIN'))&&webCase.hostLines.filter(s=>s.includes('CC_NET_INTENT_REJECT')).length>=2;
  if(!webCase.pass)throw Error('Browser join/rejection evidence was incomplete.');
  report.pass=report.cases.every(c=>c.pass);
 }catch(error){report.error=String(error.stack||error);console.error(report.error);}
 finally {
  if(browser)await browser.close();await stop(client);await stop(host);discovery.socket.close();
  try {report.buildFilesUnchanged=JSON.stringify(report.buildFiles)===JSON.stringify(buildFingerprint());if(!report.buildFilesUnchanged){report.pass=false;report.error=report.error||'Player build files changed during LAN runtime verification.';}}
  catch(error){report.pass=false;report.error=report.error||String(error.stack||error);}
  report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(evidence,'lan-runtime.json'),JSON.stringify(report,null,2));
 }
 console.log(JSON.stringify({pass:report.pass,cases:report.cases.map(c=>({name:c.name,pass:c.pass})),report:path.join(evidence,'lan-runtime.json')}));if(!report.pass)process.exitCode=1;
})().catch(error=>{report.pass=false;report.error=String(error.stack||error);report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(evidence,'lan-runtime.json'),JSON.stringify(report,null,2));console.error(report.error);process.exitCode=1;});
