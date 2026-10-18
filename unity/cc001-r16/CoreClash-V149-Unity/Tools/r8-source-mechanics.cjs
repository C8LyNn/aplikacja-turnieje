'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/kubap/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),source='C:/Users/kubap/Downloads/core_clash_v148_final_candidate_r2 (1).html',expected='bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e';
const hash=()=>crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');assert.equal(hash(),expected);
function probe(){
 const tests=[];const deck=['pinballer','slingshot','ram','web','gatekeeper','agony','bonfire','ward','anchor'];
 function reset(){ccStartManualTest({seed:'r8-source',deckA:deck,deckB:deck,mapKey:'classic',speed:1});state.phase='aim';}
 function test(name,fn){try{reset();const outcome=fn();tests.push({name,...outcome});}catch(e){tests.push({name,pass:false,error:e.message});}}
 test('Pinballer creates the runtime five-HP edge bumper',()=>{const p=spawn('player','pinballer',100,450,0,0);finalizeBallAction(p);const g=state.structures.find(s=>!s.dead&&s.kind==='bumper');return {pass:!!g&&g.r===20&&g.bounce===1.42&&g.hitsRemaining===5,bumper:g?{x:g.x,y:g.y,r:g.r,bounce:g.bounce,hitsRemaining:g.hitsRemaining}:null,limit:MAX_LIVE_STRUCTURES};});
 test('Slingshot gathers and launches nearby allies',()=>{const p=spawn('player','slingshot',270,450,0,0);p.lastMoveAngle=-Math.PI/2;const ally=spawn('player','normal',170,450,0,0),enemy=spawn('cpu','normal',270,550,0,0);finalizeBallAction(p);return {pass:ally.vy<-320&&enemy.vy===0,power:Math.hypot(ally.vx,ally.vy),enemyPower:Math.hypot(enemy.vx,enemy.vy)};});
 test('Ram strong enemy collision adds damage and recoil',()=>{
  function impact(jam){reset();const a=spawn('player','ram',200,450,0,0),b=spawn('cpu','normal',200+aRadius()+21.25-.1,450,0,0);function aRadius(){return a.r;}a.spawnGrace=b.spawnGrace=0;a.vx=200;a.vy=b.vx=b.vy=0;a.motionState='moving';b.motionState='resting';a.jammed=jam;keywordPhysicsFrame+=3;collide(a,b);return {ramHp:a.hp,targetHp:b.hp,targetVx:b.vx};}
  const blocked=impact(1),active=impact(0);return {pass:active.targetHp<blocked.targetHp&&active.ramHp<=blocked.ramHp&&active.targetVx>blocked.targetVx,active,blocked};
 });
 return {pass:tests.every(t=>t.pass),tests};
}
(async()=>{let browser;const report={testedAt:new Date().toISOString(),scope:'Actual certified V148 runtime with in-memory probe hooks; source file never edited.',sourceSha256:expected};try{const html=fs.readFileSync(source,'utf8'),ix=html.lastIndexOf('})();');assert(ix>0);browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();await page.route('https://cc-r8-source.invalid/**',route=>route.fulfill({status:200,contentType:'text/html',body:html.slice(0,ix)+'\nwindow.__CC_R8_SOURCE__='+probe.toString()+';\n'+html.slice(ix)}));await page.goto('https://cc-r8-source.invalid/');await page.waitForFunction(()=>!!window.__CC_R8_SOURCE__);Object.assign(report,await page.evaluate(()=>window.__CC_R8_SOURCE__()));}catch(e){report.pass=false;report.error=e.stack||e.message;}finally{if(browser)await browser.close();report.sourceUnchanged=hash()===expected;report.pass=report.pass&&report.sourceUnchanged;fs.writeFileSync(path.join(root,'Evidence/r8-source-mechanics.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.pass)process.exitCode=1;}})();
