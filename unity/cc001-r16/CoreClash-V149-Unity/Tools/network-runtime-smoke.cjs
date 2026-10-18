// Development smoke only: real native NGO/UTP WebSocket host + real WebGL player client.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),net=require('node:net');
const {chromium}=require('C:/Users/kubap/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {createWebServer}=require('./serve-web.cjs');
const root=path.resolve(__dirname,'..'),evidence=path.join(root,'Evidence');fs.mkdirSync(evidence,{recursive:true});
const hostLog=path.join(evidence,'network-host.log'),reportPath=path.join(evidence,'network-runtime.json');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const readHost=()=>{try{return fs.readFileSync(hostLog,'utf8');}catch{return '';}};
async function freePort(){const probe=net.createServer();await new Promise((resolve,reject)=>probe.once('error',reject).listen(0,'127.0.0.1',resolve));const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));return port;}
(async()=>{
 const executable=path.join(root,'Builds/Windows/CoreClash.exe');if(!fs.existsSync(executable))throw Error('Build Windows player first');
 const port=await freePort(),server=createWebServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const httpPort=server.address().port;let browser,host;
 const report={startedAt:new Date().toISOString(),implementation:'real NGO2.13.3 / UTP2.6.0 direct WebSocket',port,httpPort,pass:false,browserConsole:[],pageErrors:[]};
 try{
  fs.writeFileSync(hostLog,'');
  host=cp.spawn(executable,['-batchmode','-nographics','-logFile',hostLog,'--cc-network-host','--cc-network-smoke','--cc-network-port',String(port)],{cwd:root,windowsHide:true,stdio:'ignore'});
  host.once('error',e=>{report.hostLaunchError=e.message;});
  for(let i=0;i<200;i++){if(readHost().includes('CC_NET_HOST_READY'))break;if(host.exitCode!==null)throw Error('Native host exited '+host.exitCode);await sleep(100);}
  if(!readHost().includes('CC_NET_HOST_READY'))throw Error('Native host did not start NGO; rebuild the development Windows player.');
  browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1280,height:900}});
  page.on('console',msg=>{const line=msg.text();report.browserConsole.push(line);if(line.includes('CC_NET_'))console.log('WEBGL '+line);});
  page.on('pageerror',e=>report.pageErrors.push(e.message));
  await page.goto(`http://127.0.0.1:${httpPort}/?ccNetwork=join&ccAddress=127.0.0.1&ccPort=${port}&ccSmoke=1`);
  const deadline=Date.now()+100000;
  while(Date.now()<deadline){
   if(report.browserConsole.some(s=>s.includes('CC_NET_SMOKE_PASS role=client'))&&readHost().includes('CC_NET_SMOKE_PASS role=host'))break;
   if(report.browserConsole.some(s=>s.includes('CC_NET_SMOKE_FAIL'))||readHost().includes('CC_NET_SMOKE_FAIL'))break;
   await sleep(500);
  }
  report.hostNetworkLines=readHost().split(/\r?\n/).filter(s=>s.includes('CC_NET_'));
  report.clientReceivedState=report.browserConsole.some(s=>s.includes('CC_NET_STATE_APPLIED'));
  report.hostAcceptedRemote=report.hostNetworkLines.some(s=>s.includes('CC_NET_INTENT_ACCEPT owner=1'));
  report.clientPass=report.browserConsole.some(s=>s.includes('CC_NET_SMOKE_PASS role=client'));
  report.hostPass=report.hostNetworkLines.some(s=>s.includes('CC_NET_SMOKE_PASS role=host'));
  report.rejectedIntents=report.hostNetworkLines.filter(s=>s.includes('CC_NET_INTENT_REJECT')).length;
  report.pass=report.clientReceivedState&&report.hostAcceptedRemote&&report.clientPass&&report.hostPass&&report.rejectedIntents>=2&&report.pageErrors.length===0;
  await page.screenshot({path:path.join(evidence,'network-webgl-client.png')});
 }catch(e){report.error=String(e.stack||e);console.error(report.error);}
 finally{
  report.finishedAt=new Date().toISOString();fs.writeFileSync(reportPath,JSON.stringify(report,null,2));
  if(browser)await browser.close();if(host&&!host.killed)host.kill();await new Promise(r=>server.close(r));
 }
 console.log(JSON.stringify({pass:report.pass,hostAcceptedRemote:report.hostAcceptedRemote,clientReceivedState:report.clientReceivedState,pageErrors:report.pageErrors,report:reportPath}));
 if(!report.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
