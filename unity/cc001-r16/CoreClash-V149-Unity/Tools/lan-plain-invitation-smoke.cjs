// Normal public invitation flow: no browser automation, role, or ccSmoke query flags.
const fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path'),net=require('node:net'),crypto=require('node:crypto');
const {chromium}=require(process.env.CC_PLAYWRIGHT_PATH||'C:/Users/kubap/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),evidence=path.join(root,'Evidence');fs.mkdirSync(evidence,{recursive:true});
const log=path.join(evidence,'lan-plain-invitation-host.log'),report={startedAt:new Date().toISOString(),scope:'One PC: real native WebRoot HTTP and plain WebGL invitation, no client smoke flags. No physical second-device Wi-Fi test.',pass:false,buildFiles:{},buildFilesUnchanged:false,browser:[],pageErrors:[]};
const paths=['Builds/Windows/CoreClash_Data/Managed/Assembly-CSharp.dll','Builds/Windows/CoreClash_Data/resources.assets','Builds/Windows/CoreClash_Data/level0','Builds/Windows/WebRoot/Build/WebGL.data','Builds/Windows/WebRoot/Build/WebGL.wasm'];
function fingerprint(){return Object.fromEntries(paths.map(relative=>{const bytes=fs.readFileSync(path.join(root,relative));return [relative,{sha256:crypto.createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length}];}));}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function freePort(){const server=net.createServer();await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));const port=server.address().port;await new Promise(resolve=>server.close(resolve));return port;}
async function until(check,ms,reason){const deadline=Date.now()+ms;while(Date.now()<deadline){if(check())return;await sleep(100);}throw Error(reason);}
(async()=>{
 let host,browser;
 try {
  report.buildFiles=fingerprint();report.gameplayPort=await freePort();fs.writeFileSync(log,'');
  host=cp.spawn(path.join(root,'Builds/Windows/CoreClash.exe'),['-batchmode','-nographics','-logFile',log,'--cc-network-host','--cc-network-smoke','--cc-network-port',String(report.gameplayPort)],{cwd:root,windowsHide:true,stdio:'ignore'});
  host.once('error',error=>{report.launchError=error.message;});
  await until(()=>/CC_LAN_JOIN_URL (http:\/\/[^\s]+)/.test(fs.readFileSync(log,'utf8')),20000,'No native browser invitation URL.');
  report.url=fs.readFileSync(log,'utf8').match(/CC_LAN_JOIN_URL (http:\/\/[^\s]+)/)[1];
  const keys=[...new URL(report.url).searchParams.keys()];if(keys.length!==2||!keys.includes('joinHost')||!keys.includes('joinPort'))throw Error('Public invitation contains unexpected query flags.');
  browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1280,height:900}});
  page.on('console',message=>{if(/CC_LAN_|CC_NET_/.test(message.text()))report.browser.push(message.text());});page.on('pageerror',error=>report.pageErrors.push(error.message));
  const response=await page.goto(report.url);report.httpStatus=response.status();if(report.httpStatus!==200)throw Error('Native WebRoot did not serve a successful response.');
  await until(()=>report.browser.some(line=>line.includes('CC_NET_STATE_APPLIED')),30000,'Plain invitation did not receive authoritative state.');
  report.host=fs.readFileSync(log,'utf8').split(/\r?\n/).filter(line=>/CC_LAN_|CC_NET_/.test(line));
  report.pass=report.browser.some(line=>line.includes('CC_LAN_INVITATION_JOIN'))&&!report.browser.some(line=>line.includes('CC_NET_AUTOSTART')||line.includes('CC_NET_SMOKE_'))&&report.pageErrors.length===0;
  await page.screenshot({path:path.join(evidence,'lan-plain-invitation.png')});
 } catch(error){report.error=String(error.stack||error);report.pass=false;}
 finally {
  if(browser)await browser.close();if(host&&!host.killed){host.kill();await sleep(500);}
  try {report.buildFilesUnchanged=JSON.stringify(report.buildFiles)===JSON.stringify(fingerprint());if(!report.buildFilesUnchanged){report.pass=false;report.error=report.error||'Build files changed during plain invitation verification.';}}
  catch(error){report.pass=false;report.error=report.error||String(error.stack||error);}
  report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(evidence,'lan-plain-invitation.json'),JSON.stringify(report,null,2));
 }
 console.log(JSON.stringify(report,null,2));if(!report.pass)process.exitCode=1;
})().catch(error=>{report.pass=false;report.error=String(error.stack||error);report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(evidence,'lan-plain-invitation.json'),JSON.stringify(report,null,2));console.error(report.error);process.exitCode=1;});
