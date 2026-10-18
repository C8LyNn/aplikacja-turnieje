'use strict';
// Real NGO release players on one PC. No transport/authority substitute and no archived code.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),net=require('node:net'),dgram=require('node:dgram'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),evidence=path.join(root,'Evidence'),exe=path.join(root,'Builds/Windows/CoreClash.exe');
const report={startedAt:new Date().toISOString(),pass:false,scope:'One PC, real native host and sequential native NGO clients. Released P2 seat can be occupied by a new LAN client; this is not authenticated identity recovery or physical Wi-Fi QA.',checks:[],buildFiles:{}};
const artifacts=['Builds/Windows/CoreClash_Data/Managed/Assembly-CSharp.dll','Builds/Windows/CoreClash_Data/resources.assets','Builds/Windows/CoreClash_Data/level0'];
const fingerprint=()=>Object.fromEntries(artifacts.map(p=>[p,{sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex')}]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),read=p=>{try{return fs.readFileSync(p,'utf8');}catch{return '';}};
async function until(check,ms,label){const end=Date.now()+ms;while(!check()){if(Date.now()>end)throw Error(label);await sleep(100);}}
async function freePort(){const s=net.createServer();await new Promise((r,j)=>s.once('error',j).listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p;}
function launch(name,args){const log=path.join(evidence,'lan-rejoin-'+name+'.log');fs.writeFileSync(log,'');const process=cp.spawn(exe,['-batchmode','-nographics','-logFile',log,...args],{cwd:root,windowsHide:true,stdio:'ignore'});process.once('error',e=>report.launchError=e.message);return {process,log};}
async function stop(p){if(p&&!p.process.killed){p.process.kill();await sleep(500);}}
function check(name,ok){report.checks.push({name,pass:!!ok});assert.ok(ok,name);}
(async()=>{
 let host,first,replacement;const rooms=[];const socket=dgram.createSocket({type:'udp4',reuseAddr:true});
 socket.on('message',(bytes,sender)=>{const p=bytes.toString('utf8').split('\n');if(p.length===5&&p[0]==='CORECLASH_LAN'&&p[1]==='149')rooms.push({port:Number(p[3]),players:Number(p[4]),host:sender.address,at:Date.now()});});
 try{
  report.buildFiles=fingerprint();await new Promise((r,j)=>socket.once('error',j).bind(47749,'0.0.0.0',r));
  const port=await freePort();report.port=port;
  host=launch('host',['--cc-network-host','--cc-network-smoke','--cc-network-port',String(port)]);report.hostPid=host.process.pid;
  await until(()=>rooms.some(r=>r.port===port&&r.players===1),20000,'Host did not advertise an open P2 seat.');
  const address=rooms.find(r=>r.port===port).host;report.address=address;
  const args=['--cc-network-join','--cc-network-smoke','--cc-network-address',address,'--cc-network-port',String(port)];
  first=launch('first-client',args);
  await until(()=>read(host.log).includes('CC_NET_SMOKE_PASS role=host')&&read(first.log).includes('CC_NET_SMOKE_PASS role=client'),110000,'Initial real session did not complete.');
  check('Initial P2 legal command accepted, spoof and duplicate rejected',true);
  const disconnectedAt=Date.now();await stop(first);first=null;
  await until(()=>read(host.log).includes('CC_NET_SEAT_RELEASED')&&rooms.some(r=>r.port===port&&r.players===1&&r.at>disconnectedAt),25000,'Disconnected P2 did not release the advertised seat.');
  check('Host advertises one player again after P2 disconnect',true);
  replacement=launch('replacement-client',args);
  await until(()=>read(replacement.log).includes('CC_NET_SMOKE_PASS role=client'),110000,'Replacement P2 could not resume the same match.');
  const text=read(host.log),peers=[...text.matchAll(/CC_NET_PEER_CONNECTED id=(\d+) owner=1/g)].map(m=>m[1]);report.peerIds=peers;
  check('Replacement gets a fresh SDK client ID',peers.length===2&&peers[0]!==peers[1]);
  check('One authoritative host kept running without reset',host.process.exitCode===null&&(text.match(/CC_NET_HOST_READY/g)||[]).length===1);
  check('Replacement sequence one accepted as third match action',/CC_NET_INTENT_ACCEPT owner=1 seq=1 action=3/.test(text));
  check('Both connections reject owner spoof and duplicate intents',(text.match(/CC_NET_INTENT_REJECT/g)||[]).length>=4);
  check('Only two P2 intents accepted across the two connections',(text.match(/CC_NET_INTENT_ACCEPT owner=1/g)||[]).length===2);
  report.pass=true;
 }catch(e){report.error=String(e.stack||e);console.error(report.error);}
 finally{
  report.hostLines=host?read(host.log).split(/\r?\n/).filter(s=>/CC_NET_|CC_LAN_/.test(s)):[];
  report.clientLines=replacement?read(replacement.log).split(/\r?\n/).filter(s=>/CC_NET_|CC_LAN_/.test(s)):[];
  await stop(replacement);await stop(first);await stop(host);socket.close();
  report.buildFilesUnchanged=JSON.stringify(report.buildFiles)===JSON.stringify(fingerprint());if(!report.buildFilesUnchanged)report.pass=false;
  report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(evidence,'lan-rejoin.json'),JSON.stringify(report,null,2)+'\n');
 }
 console.log(JSON.stringify({pass:report.pass,checks:report.checks}));if(!report.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
