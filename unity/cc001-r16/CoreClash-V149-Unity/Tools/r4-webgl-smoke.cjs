// R4 archive presentation UI QA. Uses only player UI and real mouse/touch input; no Unity state hooks.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {createWebServer}=require('./serve-web.cjs');
const {chromium}=require('C:/Users/kubap/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),evidence=path.join(root,'Evidence');
const referenceFile='C:/Users/kubap/Downloads/core_clash_v148_final_candidate_r2 (1).html';
const buildRoot=path.resolve(root,process.argv.find(a=>a.startsWith('--build='))?.slice(8)||'Builds/WebGL');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const report={testedAt:new Date().toISOString(),method:'Fresh isolated Edge; original WebGL build served on ephemeral loopback port; only player UI and real pointer events; no Unity/API state mutation.',buildRoot,build:{},console:[],pageErrors:[],requestsFailed:[],screens:[],checks:[],limits:['Canvas-rendered text is visually reviewed in saved screenshots; no accessibility DOM or runtime state API is exposed by this player.','Touch is Chromium CDP simulation, not a physical Android/iOS device.','Multiplayer scope here is lobby presentation and Advanced containment; connection/authority validation is covered separately.']};
fs.mkdirSync(evidence,{recursive:true});
const server=createWebServer(buildRoot);let browser;
const touchSessions=new WeakMap();
function check(name,ok,detail){report.checks.push({name,ok,detail});assert.equal(ok,true,name+(detail?' — '+JSON.stringify(detail):''));}
function logs(surface,token){return report.console.filter(m=>m.surface===surface&&m.text.includes(token));}
function attach(page,surface){
  page.on('console',message=>{const row={surface,type:message.type(),text:message.text()};report.console.push(row);if(/CORE_CLASH_|CC_LAN_/.test(row.text))console.log(surface+': '+row.text);});
  page.on('pageerror',e=>report.pageErrors.push({surface,message:e.message}));
  page.on('requestfailed',r=>report.requestsFailed.push({surface,url:r.url(),error:r.failure()?.errorText}));
  page.on('dialog',d=>{report.pageErrors.push({surface,dialog:d.message()});void d.dismiss();});
}
async function canvas(page){return page.locator('#unity-canvas').evaluate(c=>{const r=c.getBoundingClientRect();return{x:r.x,y:r.y,width:c.width,height:c.height,cssWidth:r.width,cssHeight:r.height};});}
async function point(page,x,y){const b=await canvas(page);return{x:b.x+x*b.cssWidth/b.width,y:b.y+y*b.cssHeight/b.height};}
async function click(page,x,y){const p=await point(page,x,y);await page.mouse.click(p.x,p.y,{delay:90});await delay(160);}
async function tap(page,x,y){const p=await point(page,x,y);let cdp=touchSessions.get(page);if(!cdp){cdp=await page.context().newCDPSession(page);touchSessions.set(page,cdp);}await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,id:7,radiusX:2,radiusY:2,force:1}]});await delay(90);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(180);}
async function scroll(page,x,y,dy){const p=await point(page,x,y);await page.mouse.move(p.x,p.y);await page.mouse.wheel(0,dy);await delay(200);}
async function screenshot(page,id,note){const file='r4-webgl-'+id+'.png';await page.screenshot({path:path.join(evidence,file)});report.screens.push({id,file,note,canvas:await canvas(page),capturedAt:new Date().toISOString()});console.log('CAPTURE '+file);}
async function until(fn,ms,label){const end=Date.now()+ms;while(!fn()){if(Date.now()>end)throw Error(label+' timed out after '+ms+'ms');await delay(150);}}
async function ready(page,surface){await until(()=>logs(surface,'CORE_CLASH_READY').length>0,90000,surface+' ready');await delay(4000);}
async function beginDrag(page,from,to){const a=await point(page,...from),b=await point(page,...to);await page.mouse.move(a.x,a.y);await page.mouse.down();await delay(80);await page.mouse.move(b.x,b.y,{steps:10});await delay(100);}
async function drag(page,from,to){await beginDrag(page,from,to);await page.mouse.up();await delay(100);}
function layout(width,height){const portrait=width<760||width<height*1.08;let board,panel;
  if(portrait){const h=Math.min((height-146)*.52,(width-32)/.6),w=h*.6;board={x:(width-w)/2,y:126,width:w,height:h};panel={x:12,y:board.y+h+12,width:width-24,height:height-board.y-h-24};}
  else{const pw=Math.min(520,Math.max(360,width*.405)),w=Math.min((height-92)*.6,width-pw-56),h=w/.6,x=(width-w-pw-24)/2;board={x,y:74+(height-92-h)/2,width:w,height:h};panel={x:x+w+24,y:74,width:pw,height:height-92};}
  return{portrait,board,panel};
}
function world(l,x,y){return[l.board.x+x*l.board.width/540,l.board.y+y*l.board.width/540];}
function tray(l,index,scrolled=false){const w=l.panel.width-46,cw=(w-16)/3,scrollMax=Math.max(0,(l.portrait?465:750)-(l.panel.height-24)),sy=scrolled?scrollMax:0;return[l.panel.x+12+(index%3)*(cw+8)+cw/2,l.panel.y+12+(l.portrait?84:240)+Math.floor(index/3)*((l.portrait?66:98)+8)+(l.portrait?66:98)/2-sy];}
function action(l,index=0){const w=l.panel.width-46,actionW=(w-20)/3,scrollMax=Math.max(0,(l.portrait?465:750)-(l.panel.height-24)),y=l.portrait?357:609;return[l.panel.x+12+index*(actionW+10)+actionW/2,l.panel.y+12+y+18-scrollMax];}
async function scrollPanel(page,l,end=true){const x=l.panel.x+l.panel.width-19.5,y=end?l.panel.y+l.panel.height-20:l.panel.y+20;for(let i=0;i<6;i++)await click(page,x,y);await delay(150);}
async function main(){
  report.reference={file:referenceFile,sha256:sha(referenceFile),bytes:fs.statSync(referenceFile).size};
  check('Certified V148 reference hash is unchanged',report.reference.sha256==='bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e');
  for(const file of ['index.html','Build/WebGL.data','Build/WebGL.framework.js','Build/WebGL.loader.js','Build/WebGL.wasm']){const p=path.join(buildRoot,file);report.build[file]={sha256:sha(p),bytes:fs.statSync(p).size,modifiedAt:fs.statSync(p).mtime.toISOString()};}
  const catalog=JSON.parse(fs.readFileSync(path.join(root,'Assets/Resources/Data/catalog.json'))),featured=JSON.parse(fs.readFileSync(path.join(root,'Assets/Resources/Data/featured-decks.json')));
  const initial=featured.decks.find(d=>d.id==='featured_death_engine'),custom=featured.decks.find(d=>d.id==='featured_gravity_trap');assert.ok(initial&&custom);
  const names=ids=>ids.map(id=>{const b=catalog.balls.find(v=>v.id===id);assert.ok(b,id);return b.name;});
  report.builderFixture={removedIds:initial.balls,removedNames:names(initial.balls),addedIds:custom.balls,addedNames:names(custom.balls)};
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
  const head=await fetch(base+'/Build/WebGL.wasm',{method:'HEAD'});check('WASM is served with application/wasm',head.headers.get('content-type')==='application/wasm');
  browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});report.browser=browser.version();
  if(!process.argv.includes('--mobile-only')){
  const desktop=await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1}),page=await desktop.newPage();attach(page,'desktop');
  await page.goto(base,{waitUntil:'domcontentloaded'});await ready(page,'desktop');report.desktopCanvas=await canvas(page);check('Desktop canvas uses the expected 960x600 player',report.desktopCanvas.width===960&&report.desktopCanvas.height===600);
  await screenshot(page,'01-showcase-desktop','Default player-facing featured showcase, before any interaction.');
  if(process.argv.includes('--boot-only'))return;
  if(process.argv.includes('--start-diagnostic')){const before=logs('desktop','CORE_CLASH_LAUNCH').length;await click(page,240,550);await delay(500);await screenshot(page,'start-diagnostic','Default Start via a human-speed 90ms press/release, with no subsequent arena input.');check('Human-speed Start does not leak a launch',logs('desktop','CORE_CLASH_LAUNCH').length===before);return;}

  if(!process.argv.includes('--skip-lobby')){
    await click(page,867,34);await screenshot(page,'02-multiplayer-create','Default Create Game view; manual addressing remains behind Advanced.');
    await click(page,632,134);await screenshot(page,'03-multiplayer-join','Join Game invitation view before Advanced; inspect that raw IP and port fields are absent.');
    await click(page,480,401);await screenshot(page,'04-multiplayer-advanced','Advanced expanded; manual host and gameplay-port fields are now visible.');
    await page.keyboard.press('Escape');await delay(180);
  }else report.skipped=['Lobby screenshots: interim run while lobby visibility is being repaired.'];

  await click(page,409,106);await screenshot(page,'05-builder-initial','P1 Edit Deck opens with the default nine DEATH ENGINE selections.');
  for(const name of report.builderFixture.removedNames){await click(page,200,170);await page.keyboard.press('Control+A');await page.keyboard.type(name);await delay(80);await click(page,120,274);}
  await screenshot(page,'06-builder-empty','All nine default balls removed by actual search/card clicks; expect 0/9 and disabled Use.');
  await click(page,450,557);await screenshot(page,'07-builder-empty-use-disabled','Attempting Use with zero selected must leave the builder open.');
  for(const name of report.builderFixture.addedNames){await click(page,200,170);await page.keyboard.press('Control+A');await page.keyboard.type(name);await delay(80);await click(page,120,274);}
  await screenshot(page,'08-builder-nine','Nine GRAVITY TRAP source balls added through actual roster UI; expect 9/9.');
  await click(page,450,557);await screenshot(page,'09-custom-deck-setup','Builder Use returns to setup with P1 custom deck.');
  await click(page,240,550);await until(()=>logs('desktop','CORE_CLASH_MATCH_START custom_0').length===1,5000,'Custom match start');check('Builder custom deck starts via the normal Start button',true);
  const dl=layout(960,600);report.desktopLayout=dl;await screenshot(page,'10-gameplay-desktop','Initial local match with portrait arena and 3x3 tray.');
  await scrollPanel(page,dl);await screenshot(page,'10b-desktop-panel-scrolled','Actual scrollbar track clicked to bottom before selecting the third row.');await click(page,...tray(dl,6,true));await until(()=>logs('desktop','CORE_CLASH_SELECT gatekeeper').length>0,3000,'Gatekeeper selection');check('Special orb card selects Gatekeeper',true);
  await screenshot(page,'11-selected-special','Gatekeeper selected through the actual third-row orb card.');
  await click(page,...action(dl,0));await until(()=>logs('desktop','CORE_CLASH_DETAILS gatekeeper developer=False').length>0,3000,'Player details');
  await screenshot(page,'12-player-details','Default details: name, HP/size, quick text, ability and payoff; no implementation metadata.');
  await page.keyboard.press('F1');await until(()=>logs('desktop','CORE_CLASH_DEVELOPER_OVERLAY True').length>0,3000,'F1 on');await screenshot(page,'13-developer-details','F1 exposes technical migration/reference metadata in a separate developer overlay.');
  await page.keyboard.press('F1');await until(()=>logs('desktop','CORE_CLASH_DEVELOPER_OVERLAY False').length>0,3000,'F1 off');await screenshot(page,'14-player-details-restored','F1 off returns to the clean player details view.');
  check('F1 enables and disables developer metadata',true);await page.keyboard.press('Escape');await delay(160);await scrollPanel(page,dl,false);
  const before=logs('desktop','CORE_CLASH_LAUNCH').length;
  await beginDrag(page,world(dl,270,853),world(dl,480,830));await screenshot(page,'15b-wall-guide','Actual held shallow-angle mouse aim: first-wall contact and reflected continuation, before release.');
  const normalAim=await point(page,...world(dl,350,600));await page.mouse.move(normalAim.x,normalAim.y,{steps:10});await delay(120);await screenshot(page,'15-aim-desktop','Same held mouse gesture moved to normal upward aim: selected orb, vector, drag marker and power cue.');await page.mouse.up();
  await until(()=>logs('desktop','CORE_CLASH_LAUNCH').length===before+1,3000,'Mouse launch');
  await drag(page,world(dl,270,853),world(dl,180,600));await delay(150);
  check('One mouse launch accepted; second shot is blocked while moving',logs('desktop','CORE_CLASH_LAUNCH').length===before+1);await screenshot(page,'16-resolving-lock','Attempted second drag during physics resolving; launch count remains one.');
  const turnDeadline=Date.now()+30000;let p2Selected=false;
  while(Date.now()<turnDeadline&&!p2Selected){await click(page,...tray(dl,0));p2Selected=logs('desktop','CORE_CLASH_SELECT blightpool').length>0;if(!p2Selected)await delay(900);}
  check('Physics settles to P2 turn and P2 first card becomes selectable',p2Selected);await screenshot(page,'17-next-turn','Next active player confirmed by selecting Blight Pool from P2 STATUS REACTOR deck.');
  const inspectLaunches=logs('desktop','CORE_CLASH_LAUNCH').length,inspectDetails=logs('desktop','CORE_CLASH_DETAILS gatekeeper developer=False').length,existingBall=await point(page,...world(dl,473,200));
  await page.mouse.click(existingBall.x,existingBall.y,{button:'right',delay:90});await until(()=>logs('desktop','CORE_CLASH_DETAILS gatekeeper developer=False').length===inspectDetails+1,3000,'Opponent-turn right-click inspection');await delay(180);
  await screenshot(page,'17b-runtime-instance-right-click','Real right-click on the settled P1 Gatekeeper during P2 turn. Inspect canonical name, P1 live HP, CURRENT STATE and absence of developer IDs.');
  check('Opponent-turn right-click inspection opens Gatekeeper details without launching',logs('desktop','CORE_CLASH_LAUNCH').length===inspectLaunches);
  report.runtimeInspection={input:'Real right mouse button on the existing settled ball, while P2 is confirmed active by ordinary selection log.',targetWorld:[473,200],launchCountBefore:inspectLaunches,launchCountAfter:logs('desktop','CORE_CLASH_LAUNCH').length,detailsLog:logs('desktop','CORE_CLASH_DETAILS gatekeeper developer=False').at(-1)?.text};
  await page.keyboard.press('Escape');await delay(160);await scrollPanel(page,dl);await click(page,...action(dl,1));await screenshot(page,'17c-inspect-board-mode','Actual INSPECT BOARD action during P2 turn; mode hint and Cancel Inspect are visible.');
  await page.mouse.click(existingBall.x,existingBall.y,{delay:90});await until(()=>logs('desktop','CORE_CLASH_DETAILS gatekeeper developer=False').length===inspectDetails+2,3000,'Inspect Board click');await delay(180);await screenshot(page,'17d-runtime-instance-inspect-button','Actual Inspect Board then ordinary click selects the same P1 runtime instance during the opponent turn.');
  check('Inspect Board plus real board click opens the instance without launching',logs('desktop','CORE_CLASH_LAUNCH').length===inspectLaunches);
  await page.keyboard.press('Escape');await delay(160);await scrollPanel(page,dl,false);
  await beginDrag(page,world(dl,270,47),world(dl,350,300));await screenshot(page,'17e-p2-aim-before-combined-release','Fresh real P2 left-button aim before back-to-back empty-space right-button down and left-button release.');
  const combinedStart=Date.now();await page.mouse.down({button:'right'});const rightDownAt=Date.now();await page.mouse.up({button:'left'});const leftUpAt=Date.now();await page.mouse.up({button:'right'});
  await until(()=>logs('desktop','CORE_CLASH_LAUNCH').length===inspectLaunches+1,3000,'Combined right-down and left-up launch');await delay(120);await screenshot(page,'17f-combined-release-launched','Back-to-back empty-space RMB-down and LMB-up: one accepted P2 launch, resolving state and cleared aim feedback.');
  check('Empty-space right-down plus left-up accepts exactly one real P2 launch',logs('desktop','CORE_CLASH_LAUNCH').length===inspectLaunches+1);
  report.combinedRelease={input:'Held real left aim, then back-to-back right-down, left-up and right-up at empty board space.',targetWorld:[350,300],launchCountBefore:inspectLaunches,launchCountAfter:logs('desktop','CORE_CLASH_LAUNCH').length,browserDispatchGapMs:leftUpAt-rightDownAt,elapsedThroughCaptureMs:Date.now()-combinedStart,limit:'Browser event ordering is real; coincidence within one Unity update frame is not observable from this player.'};
  await drag(page,world(dl,270,47),world(dl,180,300));await delay(100);check('No extra launch follows a fresh press/release while the P2 shot resolves',logs('desktop','CORE_CLASH_LAUNCH').length===inspectLaunches+1);
  await desktop.close();
  }

  const mobile=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1,userAgent:'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'}),phone=await mobile.newPage();attach(phone,'phone');
  await phone.goto(base,{waitUntil:'domcontentloaded'});await ready(phone,'phone');report.phoneCanvas=await canvas(phone);check('Portrait player canvas fills 390x844 viewport',report.phoneCanvas.width===390&&report.phoneCanvas.height===844);await screenshot(phone,'18-showcase-portrait','390x844 showcase with visible bottom Start/All Decks actions.');
  await tap(phone,283,794);await screenshot(phone,'18b-library-portrait','Phone All Decks library opened with normal footer action; both player choices and canonical deck list.');
  await tap(phone,309,183);await screenshot(phone,'18c-builder-portrait','Phone P1 Edit Deck opened from the library; search, nine-slot selection, one-column cards and Use action.');
  const phoneDetails=logs('phone','CORE_CLASH_DETAILS').length;await tap(phone,306,273);await until(()=>logs('phone','CORE_CLASH_DETAILS').length===phoneDetails+1,3000,'Phone builder details');await screenshot(phone,'18d-details-portrait','Phone builder information button opens ordinary player details with readable orb/name/stats header.');
  await scroll(phone,210,605,460);await screenshot(phone,'18e-details-scrolled-portrait','Phone Bouncer details after an ordinary wheel-scroll attempt; its short honest fallback copy fits without overflow.');
  await tap(phone,320,107);await tap(phone,318,93);await tap(phone,318,93);
  await tap(phone,106,794);await until(()=>logs('phone','CORE_CLASH_MATCH_START').length===1,3000,'Phone match');const pl=layout(390,844);report.portraitLayout=pl;await screenshot(phone,'19-gameplay-portrait','Portrait game: upper HUD, 540:900 arena, compact 3x3 tray in scrollable control panel.');
  await tap(phone,...tray(pl,0));await until(()=>logs('phone','CORE_CLASH_SELECT agony').length>0,3000,'Touch card selection');
  const cdp=await mobile.newCDPSession(phone),b=await canvas(phone),touch=(p)=>({x:b.x+p[0]*b.cssWidth/b.width,y:b.y+p[1]*b.cssHeight/b.height,radiusX:2,radiusY:2,force:1,id:1}),from=touch(world(pl,270,853)),to=touch(world(pl,350,600));
  const phoneLaunches=logs('phone','CORE_CLASH_LAUNCH').length;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});await delay(100);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[to]});await delay(150);await screenshot(phone,'20-touch-aim','Actual simulated touch held in aim state.');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await delay(250);check('Canceled touch does not launch',logs('phone','CORE_CLASH_LAUNCH').length===phoneLaunches);await screenshot(phone,'21-touch-canceled','Touch canceled: aim feedback is cleared and no launch log emitted.');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});await delay(100);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[to]});await delay(150);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await until(()=>logs('phone','CORE_CLASH_LAUNCH').length===phoneLaunches+1,3000,'Touch launch');check('New touch after cancellation launches exactly once',true);await screenshot(phone,'22-touch-launched','Real touch release launches once and shows resolving feedback.');
  await scrollPanel(phone,pl);await screenshot(phone,'23-portrait-lower-controls','Portrait lower Standard / Ball Details / Inspect Board / Match Setup controls reached through normal scrolling.');
  await phone.setViewportSize({width:844,height:390});await delay(600);const ll=layout(844,390);report.landscapeLayout=ll;await screenshot(phone,'24-gameplay-landscape','844x390 landscape reflows to portrait arena left, controls right.');
  await scrollPanel(phone,ll);await screenshot(phone,'25-landscape-lower-controls','Landscape lower controls reached through actual player scrollbar.');
  await tap(phone,...action(ll,2));await screenshot(phone,'26-showcase-landscape-return','Actual third Match Setup action returns to setup in landscape.');
  const previous=logs('phone','CORE_CLASH_MATCH_START').length;await tap(phone,210,340);await until(()=>logs('phone','CORE_CLASH_MATCH_START').length===previous+1,3000,'Landscape restart');check('Landscape lower controls and subsequent Start remain usable',true);await screenshot(phone,'27-landscape-restarted','Landscape Start begins another local match through the normal player flow.');
  await mobile.close();
  const compact=await browser.newContext({viewport:{width:667,height:375},hasTouch:true,isMobile:true,deviceScaleFactor:1,userAgent:'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'}),small=await compact.newPage();attach(small,'compact');
  await small.goto(base,{waitUntil:'domcontentloaded'});await ready(small,'compact');report.compactCanvas=await canvas(small);check('Small landscape player canvas fills 667x375 viewport',report.compactCanvas.width===667&&report.compactCanvas.height===375);await screenshot(small,'28-showcase-667x375','Fresh 667x375 Android-user-agent small landscape context at showcase.');
  await tap(small,500,325);await screenshot(small,'29-library-667x375','Small landscape All Decks library: player choices, scrolling canonical presets and Start footer must remain separated.');
  await scroll(small,335,264,540);await screenshot(small,'30-library-scrolled-667x375','Small landscape library after normal wheel scrolling; canonical selection controls remain in the list above Start.');
  await compact.close();check('No browser page errors',report.pageErrors.length===0,report.pageErrors);
}
main().catch(error=>{report.failure=error.stack;process.exitCode=1;console.error(error);}).finally(async()=>{
  if(browser)await browser.close();if(server.listening)await new Promise(resolve=>server.close(resolve));
  report.buildFilesUnchanged=Object.entries(report.build).every(([file,value])=>sha(path.join(buildRoot,file))===value.sha256);report.referenceUnchanged=!!report.reference&&sha(referenceFile)===report.reference.sha256;report.ok=!report.failure&&report.buildFilesUnchanged&&report.referenceUnchanged;
  const suffix=process.argv.includes('--start-diagnostic')?'-start-diagnostic':process.argv.includes('--mobile-only')?'-mobile-interim':process.argv.includes('--skip-lobby')?'-interim':'';
  fs.writeFileSync(path.join(evidence,'r4-webgl-smoke'+suffix+'.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({ok:report.ok,screens:report.screens.length,checks:report.checks.length,pageErrors:report.pageErrors.length,buildFilesUnchanged:report.buildFilesUnchanged}));
});
