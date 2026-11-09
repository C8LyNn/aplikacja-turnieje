import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const V92_HTML_SHA = "d34f020855597b662631d860c26b19f510deb72427036224a8a3d93068212596";
const V92_ROUTE_SHA = "6913e310301eae7e5a83c18c4bf9a42e89f2041504d646e433c7f97eeca3cf0b";
const explicit = process.argv[2] ? path.resolve(process.argv[2]) : null;
const cwd = process.cwd();
function findRepoRoot(){
  const starts=[explicit,cwd].filter(Boolean), candidates=[];
  for(const start of starts)candidates.push(start,path.resolve(start,".."),path.resolve(start,"..",".."),path.resolve(start,"..","..",".."));
  return [...new Set(candidates)].find(candidate=>fs.existsSync(path.join(candidate,"artifacts","tournament-manager","src","App.tsx"))&&fs.existsSync(path.join(candidate,"artifacts","api-server","src","app.ts")));
}
const repo=findRepoRoot(); if(!repo)throw new Error("Nie znaleziono root repo.");
const tm=path.join(repo,"artifacts","tournament-manager");
const api=path.join(repo,"artifacts","api-server");
const htmlPath=path.join(tm,"public","prototypes","minigames","core-clash","index.html");
const routePath=path.join(api,"src","routes","core-clash-multiplayer.ts");
const testPath=path.join(api,"test","core-clash-multiplayer.test.ts");
const appPath=path.join(api,"src","app.ts");
const sha=file=>crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const html=fs.readFileSync(htmlPath,"utf8"), route=fs.readFileSync(routePath,"utf8"), app=fs.readFileSync(appPath,"utf8");
const checks=[
 ["HTML v92 hash",sha(htmlPath)===V92_HTML_SHA],
 ["router v92 hash",sha(routePath)===V92_ROUTE_SHA],
 ["2 s delayed replay",html.includes("ONLINE_REPLAY_BUFFER_MS=2000")],
 ["30 Hz capture",html.includes("ONLINE_REPLAY_FRAME_MS=1000/30")],
 ["replay interpolation",html.includes("interpolateOnlineReplayVisuals")],
 ["guest perspective flip",html.includes("isOnlinePerspectiveFlipped")&&html.includes("ctx.rotate(Math.PI)")],
 ["flipped pointer input",html.includes("x=W-x")&&html.includes("y=H-y")],
 ["local player HUD swap",html.includes("flippedHud")&&html.includes("applyOnlineHudNames")],
 ["localized online result",html.includes("winner===onlineLocalOwner")&&html.includes("gameResult")],
 ["post-match actions",html.includes("onlineRematchBtn")&&html.includes("onlineChangeDeckBtn")&&html.includes("onlineExitMatchBtn")],
 ["server rematch/deck endpoints",route.includes("/rematch")&&route.includes("/change-deck")],
 ["side swap",route.includes("swapRoomSides")],
 ["single hosted room limit",route.includes("BROWSER_ROOM_LIMIT")&&route.includes("ownerBrowserId")],
 ["public room survives one player leaving",route.includes("resetPublicRoomAfterLeave")],
 ["quick-match ghost cleanup",route.includes("MATCHMAKING_STALE_MS = 8_000")],
 ["API tests",fs.existsSync(testPath)],
 ["4 MB JSON",app.includes('app.use(express.json({ limit: "4mb" }));')],
];
let failed=false;
for(const [label,ok] of checks){console.log(`${ok?"PASS":"FAIL"} ${label}`);if(!ok)failed=true;}
if(failed)process.exit(1);
console.log("CORE CLASH DELAYED REPLAY PVP PACK 02 VERIFIED");
