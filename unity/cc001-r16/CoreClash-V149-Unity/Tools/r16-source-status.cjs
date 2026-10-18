'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/kubap/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),source=path.join(root,'../Reference/V148_reference_original.html');
const bytes=fs.readFileSync(source),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(sha(bytes),'bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e');
function probe(){
 const tests=[],deck=['embertrap','frosttrap','sporetrap','venom','shatterer','chainfrost','firebrand','ward','normal'];
 function reset(){ccStartManualTest({seed:'r16-status',deckA:deck,deckB:deck,mapKey:'classic',speed:1});state.phase='aim';}
 function test(name,fn){try{reset();tests.push({name,...fn()});}catch(e){tests.push({name,pass:false,error:e.message});}}
 function contact(a,b,speed=30){a.spawnGrace=b.spawnGrace=0;b.x=a.x+a.r+b.r-.1;b.y=a.y;a.vx=speed;a.vy=b.vx=b.vy=0;a.motionState='moving';b.motionState='resting';keywordPhysicsFrame+=3;collide(a,b);}
 for(const [type,kind] of [['embertrap','emberTrap'],['frosttrap','frostTrap'],['sporetrap','sporeTrap']])test(type+' one enemy charge',()=>{
  const b=spawn('player',type,270,450,0,0);finalizeBallAction(b);const z=state.hazards.find(h=>h.kind===kind&&h.life>0);if(!z)return {pass:false,error:'No trap'};
  const e=spawn('cpu','normal',z.x,z.y,0,0);update(0);return {pass:z.charges===0&&(e.fireStacks>0||e.iceStacks>0||e.infected),radius:z.r,charge:z.charges,fire:e.fireStacks,ice:e.iceStacks,toxin:e.infected};
 });
 test('Venom weak TOUCH infection then payoff',()=>{
  const v=spawn('player','venom',200,450,0,0),e=spawn('cpu','normal',245,450,0,0);v.hp=15;contact(v,e);const infected=!!e.infected;contact(v,e);return {pass:infected&&e.hp===25&&v.hp===20,infected,hp:e.hp,venomHp:v.hp};
 });
 test('Shatterer weak TOUCH consumes two ICE',()=>{
  const sh=spawn('player','shatterer',200,450,0,0),e=spawn('cpu','normal',245,450,0,0);applyIceStatus(e,'player',sh.id);applyIceStatus(e,'player',sh.id);contact(sh,e);return {pass:e.hp===25&&e.iceStacks===0&&e.frozen<=0,hp:e.hp,ice:e.iceStacks,frozen:e.frozen};
 });
 return {pass:tests.every(t=>t.pass),tests};
}
(async()=>{let browser;const report={date:new Date().toISOString(),scope:'Actual unchanged V148 HTML runtime with temporary in-memory probe; no disk edits or frame parity claim.',sourceSha256:sha(bytes)};try{
 const html=bytes.toString('utf8'),ix=html.lastIndexOf('})();');assert(ix>0);browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();
 await page.route('https://cc-r16-source.invalid/**',r=>r.fulfill({status:200,contentType:'text/html',body:html.slice(0,ix)+'\nwindow.__CC_R16_SOURCE__='+probe.toString()+';\n'+html.slice(ix)}));
 await page.goto('https://cc-r16-source.invalid/');await page.waitForFunction(()=>!!window.__CC_R16_SOURCE__);Object.assign(report,await page.evaluate(()=>window.__CC_R16_SOURCE__()));
}catch(e){report.pass=false;report.error=e.stack||e.message;}finally{if(browser)await browser.close();report.sourceUnchanged=sha(fs.readFileSync(source))===sha(bytes);report.pass=report.pass&&report.sourceUnchanged;fs.mkdirSync(path.join(root,'Evidence/R16'),{recursive:true});fs.writeFileSync(path.join(root,'Evidence/R16/source-runtime.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(!report.pass)process.exitCode=1;}})();
