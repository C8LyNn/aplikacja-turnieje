'use strict';
// Default runs the current R5 fixture; prior fixture files remain available for historical builds.
if(!process.argv.includes('--historical-r1')){require('./r5-webgl-smoke.cjs');return;}
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {createWebServer}=require('./serve-web.cjs');
const {chromium}=require('C:/Users/kubap/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),evidence=path.join(root,'Evidence');
fs.mkdirSync(evidence,{recursive:true});
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const report={testedAt:new Date().toISOString(),build:{},console:[],pageErrors:[],requestsFailed:[],checks:[]};
for(const file of ['index.html','Build/WebGL.data','Build/WebGL.framework.js','Build/WebGL.loader.js','Build/WebGL.wasm']){
  const p=path.join(root,'Builds/WebGL',file);report.build[file]={sha256:sha(p),bytes:fs.statSync(p).size};
}
const server=createWebServer();
let browser;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function attach(page,label){
  page.on('console',message=>{const row={surface:label,type:message.type(),text:message.text()};report.console.push(row);if(row.text.includes('CORE_CLASH_'))console.log(label+': '+row.text);});
  page.on('pageerror',e=>report.pageErrors.push({surface:label,message:e.message}));
  page.on('requestfailed',r=>report.requestsFailed.push({surface:label,url:r.url(),error:r.failure()?.errorText}));
  page.on('dialog',d=>{report.pageErrors.push({surface:label,dialog:d.message()});void d.dismiss();});
}
async function click(page,x,y){const box=await page.locator('#unity-canvas').boundingBox();await page.mouse.click(box.x+x,box.y+y);await delay(200);}
async function drag(page,from,to){const b=await page.locator('#unity-canvas').boundingBox();await page.mouse.move(b.x+from[0],b.y+from[1]);await page.mouse.down();await delay(100);await page.mouse.move(b.x+to[0],b.y+to[1],{steps:12});await delay(120);await page.mouse.up();}
async function ready(page,label){
  const deadline=Date.now()+90000;
  while(!report.console.some(m=>m.surface===label&&m.text.includes('CORE_CLASH_READY'))){if(Date.now()>deadline)throw Error(label+': CORE_CLASH_READY not observed within 90 seconds');await delay(500);}
  // Awake emits READY while the Unity splash may still cover the canvas.
  await delay(3500);
}
async function shot(page,name){await page.screenshot({path:path.join(evidence,'webgl-'+name+'.png')});}
async function main(){
  const featured=JSON.parse(fs.readFileSync(path.join(root,'Assets/Resources/Data/featured-decks.json')));
  const expectedFeatured=[['DEATH ENGINE',['agony','requiem','bonfire','wildfire','soulburst','reclaimer','gravehide','packheart','cascade']],['STATUS REACTOR',['blightpool','plagueleech','vector','septiccore','consecrator','absolver','penitent','ward','halo']],['GRAVITY TRAP',['web','briarheart','vinehook','gravitymine','singularity','horizonrelay','gatekeeper','harpoon','vortexmedic']],['REALITY HACKERS',['mimic','doppelganger','wildcard','collector','echo','timeshift','chronomancer','paradox','traitor']]];
  assert.deepEqual(featured.decks.map(d=>[d.name,d.balls]),expectedFeatured,'Featured JSON differs from the approved latest four selections');
  report.featuredJson={sha256:sha(path.join(root,'Assets/Resources/Data/featured-decks.json')),decks:featured.decks};
  report.checks.push({name:'Latest four featured JSON names and exact nine IDs preserved',ok:true});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const wasm=await fetch(base+'/Build/WebGL.wasm',{method:'HEAD'});assert.equal(wasm.headers.get('content-type'),'application/wasm');
  report.checks.push({name:'WASM MIME',ok:true});
  const denied=await fetch(base+'/%2e%2e%2fAssets%2fResources%2fData%2fcatalog.json');assert.equal(denied.status,403);report.checks.push({name:'Traversal denied',ok:true});
  browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  report.browser=browser.version();
  const desktop=await browser.newContext({viewport:{width:1280,height:900}}),page=await desktop.newPage();attach(page,'desktop');
  await page.goto(base,{waitUntil:'domcontentloaded'});await ready(page,'desktop');
  report.checks.push({name:'Desktop CORE_CLASH_READY',ok:true});
  report.desktopCanvas=await page.locator('#unity-canvas').evaluate(c=>({width:c.width,height:c.height,cssWidth:c.clientWidth,cssHeight:c.clientHeight}));
  await shot(page,'setup-desktop');
  if(process.argv.includes('--boot-only'))return;
  await click(page,415,224);await shot(page,'builder-desktop');
  // Existing default deck is full. Remove its nine members via name search, then select
  // nine known roster entries using canvas-only coordinates and the actual search field.
  const fixtureArgument=process.argv.find(arg=>arg.startsWith('--initial-ids='));
  const selectedIds=(fixtureArgument?fixtureArgument.slice('--initial-ids='.length):'agony,requiem,bonfire,wildfire,soulburst,reclaimer,gravehide,packheart,cascade').split(',');
  assert.equal(new Set(selectedIds).size,9,'--initial-ids must list the nine IDs already selected in the build first preset');
  const catalog=JSON.parse(fs.readFileSync(path.join(root,'Assets/Resources/Data/catalog.json')));
  const selectedNames=selectedIds.map(id=>{const ball=catalog.balls.find(ball=>ball.id===id);assert.ok(ball,'Unknown fixture ball '+id);return ball.name;});
  report.builderFixture={initialIds:selectedIds,names:selectedNames};
  // The current default is DEATH ENGINE. After rebuilding with another first preset,
  // pass its nine actual built IDs with --initial-ids=id1,id2,... (never infer freshness).
  for(const name of selectedNames){await click(page,200,182);await page.keyboard.press('Control+A');await page.keyboard.type(name);await delay(100);await click(page,200,267);}
  await shot(page,'builder-cleared');
  for(const name of selectedNames){await click(page,200,182);await page.keyboard.press('Control+A');await page.keyboard.type(name);await delay(100);await click(page,200,267);}
  await shot(page,'builder-nine');
  await click(page,220,562);await shot(page,'setup-custom');
  await click(page,400,294);await delay(300);await shot(page,'match-start');
  assert.ok(report.console.some(m=>m.text.includes('CORE_CLASH_MATCH_START custom_0')),'Custom deck Start not logged');
  report.checks.push({name:'Builder selects nine and Start uses custom_0',ok:true});
  const launches=()=>report.console.filter(m=>m.text.includes('CORE_CLASH_LAUNCH')).length;
  const before=launches();await drag(page,[171,549],[171,410]);await delay(400);await shot(page,'launch-desktop');
  assert.equal(launches(),before+1,'Mouse launch did not log once');report.checks.push({name:'Mouse launch',ok:true});
  await delay(18000);await shot(page,'next-turn-desktop');
  report.checks.push({name:'Next turn screenshot',ok:null,note:'Visual inspection recorded separately in webgl-visual-review.json; no turn API is exported by the player.'});
  await desktop.close();
  const mobile=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1,userAgent:'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'});
  const phone=await mobile.newPage();attach(phone,'phone');await phone.goto(base,{waitUntil:'domcontentloaded'});await ready(phone,'phone');await shot(phone,'setup-portrait');
  await click(phone,344,24);await shot(phone,'network-panel-portrait');await click(phone,344,24);
  await click(phone,180,395);await delay(300);await shot(phone,'match-portrait');
  const cdp=await mobile.newCDPSession(phone),box=await phone.locator('#unity-canvas').boundingBox();
  // Portrait board: h=479, w=287.4, x=51.3, y=78; launcher world (270,853).
  const point=(x,y)=>({x:box.x+x,y:box.y+y,radiusX:2,radiusY:2,force:1,id:1});
  const start=point(195,532),end=point(195,385);let count=launches();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});await delay(100);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[end]});await delay(150);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await delay(400);
  assert.equal(launches(),count,'Canceled touch unexpectedly launched');report.checks.push({name:'Simulated touch cancellation emits no launch',ok:true});
  await shot(phone,'touch-cancel');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});await delay(100);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[end]});await delay(150);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(500);
  assert.equal(launches(),count+1,'Simulated touch launch did not log');report.checks.push({name:'Simulated touch launch',ok:true});
  await shot(phone,'touch-launch');
  await drag(phone,[372,640],[372,790]);await delay(300);await shot(phone,'match-portrait-bottom');
  await drag(phone,[372,760],[372,620]);await delay(200);
  await phone.setViewportSize({width:844,height:390});await delay(600);await shot(phone,'match-landscape');
  // Drag the actual IMGUI scrollbar thumb to expose the lower stock rows and actions.
  await drag(phone,[813,135],[813,243]);await delay(200);await shot(phone,'match-landscape-scrolled');
  await click(phone,650,207);await shot(phone,'setup-landscape-return');
  const startsBefore=report.console.filter(m=>m.surface==='phone'&&m.text.includes('CORE_CLASH_MATCH_START')).length;
  await click(phone,420,294);await delay(300);
  assert.equal(report.console.filter(m=>m.surface==='phone'&&m.text.includes('CORE_CLASH_MATCH_START')).length,startsBefore+1,'Landscape scrolled MATCH SETUP then START did not work');
  report.checks.push({name:'Landscape lower controls reachable through actual scrollbar; Setup and Start work',ok:true});
  report.checks.push({name:'Portrait and landscape screenshots',ok:true});await mobile.close();
}
main().catch(error=>{report.failure=error.stack;process.exitCode=1;console.error(error);}).finally(async()=>{
  if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));
  report.buildFilesUnchanged=Object.entries(report.build).every(([file,value])=>sha(path.join(root,'Builds/WebGL',file))===value.sha256);
  report.ok=!report.failure;fs.writeFileSync(path.join(evidence,'webgl-smoke.json'),JSON.stringify(report,null,2)+'\n');
});
