'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/kubap/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),catalog=JSON.parse(fs.readFileSync(path.join(root,'Assets/Resources/Data/catalog.json')));
const hash=()=>crypto.createHash('sha256').update(fs.readFileSync(catalog.sourcePath)).digest('hex');assert.equal(hash(),catalog.sourceSha256);
function probe(){
 const tests=[],deck=['mine','timebomb','bomb','ice','echo','mimic','agony','ward','anchor'];
 function reset(){ccStartManualTest({seed:'r9-explosives',deckA:deck,deckB:deck,mapKey:'classic',speed:1});state.phase='aim';}
 function test(name,fn){try{reset();tests.push({name,...fn()});}catch(e){tests.push({name,pass:false,error:e.message});}}
 function contact(armed,owner){const m=spawn('player','mine',200,450,0,0);if(armed)finalizeBallAction(m);const b=spawn(owner,'normal',240,450,0,0);m.spawnGrace=b.spawnGrace=0;b.vx=-30;b.motionState='moving';m.motionState='resting';keywordPhysicsFrame+=3;collide(m,b);return {dead:m.dead,armed:m.mineArmed,targetHp:b.hp};}
 test('Unarmed Mine does not detonate on enemy contact',()=>{const v=contact(false,'cpu');return {pass:!v.dead&&v.targetHp===30,...v};});
 test('Armed Mine detonates on weak enemy TOUCH',()=>{const v=contact(true,'cpu');return {pass:v.dead&&v.targetHp<30,...v};});
 test('Armed Mine ignores friendly contact',()=>{const v=contact(true,'player');return {pass:!v.dead&&v.armed,...v};});
 test('Frost disarms the Mine ring before physical contact',()=>{const m=spawn('player','mine',200,450,0,0);finalizeBallAction(m);spawn('cpu','ice',250,450,0,0);update(0);return {pass:!m.mineArmed&&!m.dead&&m.iceStacks>0,armed:m.mineArmed,ice:m.iceStacks};});
 test('Time Bomb waits for two own turn starts',()=>{const b=spawn('player','timebomb',270,450,0,0),target=spawn('cpu','normal',350,450,0,0);finalizeBallAction(b);applyTurnStartEffects('cpu');const enemyTurn=b.timeBombCounter;applyTurnStartEffects('player');const first={counter:b.timeBombCounter,dead:b.dead};applyTurnStartEffects('cpu');applyTurnStartEffects('player');return {pass:enemyTurn===0&&first.counter===1&&!first.dead&&b.dead&&target.hp<30,enemyTurn,first,finalDead:b.dead,targetHp:target.hp};});
 test('Bomb STOP and premature DEATH both damage nearby teams',()=>{
  function run(death){reset();const b=spawn('player','bomb',270,450,0,0),ally=spawn('player','normal',330,450,0,0),enemy=spawn('cpu','normal',210,450,0,0);if(death)killBall(b);else finalizeBallAction(b);return {dead:b.dead,allyHp:ally.hp,enemyHp:enemy.hp};}
  const stop=run(false),death=run(true);return {pass:stop.dead&&death.dead&&stop.allyHp<30&&stop.enemyHp<30&&death.allyHp<30&&death.enemyHp<30,stop,death};
 });
 return {pass:tests.every(t=>t.pass),tests};
}
(async()=>{let browser;const report={testedAt:new Date().toISOString(),scope:'Actual unchanged V148 runtime, temporary in-memory probe hooks; no source edits or native-parity claim.',sourceSha256:catalog.sourceSha256};try{const html=fs.readFileSync(catalog.sourcePath,'utf8'),ix=html.lastIndexOf('})();');assert(ix>0);browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();await page.route('https://cc-r9-source.invalid/**',r=>r.fulfill({status:200,contentType:'text/html',body:html.slice(0,ix)+'\nwindow.__CC_R9_SOURCE__='+probe.toString()+';\n'+html.slice(ix)}));await page.goto('https://cc-r9-source.invalid/');await page.waitForFunction(()=>!!window.__CC_R9_SOURCE__);Object.assign(report,await page.evaluate(()=>window.__CC_R9_SOURCE__()));}catch(e){report.pass=false;report.error=e.stack||e.message;}finally{if(browser)await browser.close();report.sourceUnchanged=hash()===catalog.sourceSha256;report.pass=report.pass&&report.sourceUnchanged;fs.writeFileSync(path.join(root,'Evidence/r9-source-explosives.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.pass)process.exitCode=1;}})();
