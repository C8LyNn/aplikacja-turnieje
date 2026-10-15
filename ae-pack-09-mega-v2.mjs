import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root=process.cwd();const here=path.dirname(fileURLToPath(import.meta.url));
function fail(m){console.error("\nERROR:",m);process.exit(1)}
function read(r){const f=path.join(root,r);if(!fs.existsSync(f))fail("Brak pliku: "+r);return fs.readFileSync(f,"utf8")}
function write(r,c){const f=path.join(root,r);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,c,"utf8")}
if(!fs.existsSync(path.join(root,"pnpm-workspace.yaml")))fail("Uruchom z katalogu głównego aplikacja-turnieje-live.");
const sourceFiles={
  "artifacts/animated-effects/src/effects/modules/pack09Mega.ts":"pack09Mega.ts",
  "artifacts/animated-effects/src/effects/modules/pack09Variants.ts":"pack09Variants.ts",
  "artifacts/animated-effects/src/pack09/customization.ts":"pack09Customization.ts",
};
for(const src of Object.values(sourceFiles))if(!fs.existsSync(path.join(here,src)))fail("Brak pliku paczki: "+src);
const required=["artifacts/animated-effects/src/core/types.ts","artifacts/animated-effects/src/effects/registry.ts","artifacts/animated-effects/src/effects/variants.ts","artifacts/animated-effects/src/main.ts","artifacts/animated-effects/src/style.css","artifacts/animated-effects/src/media/mediaExport.ts"];for(const r of required)read(r);

function restoreFailedPack09Attempt(){
  const registryPath=path.join(root,"artifacts/animated-effects/src/effects/registry.ts");
  const typesPath=path.join(root,"artifacts/animated-effects/src/core/types.ts");
  const packFile=path.join(root,"artifacts/animated-effects/src/effects/modules/pack09Mega.ts");
  const styleFile=path.join(root,"artifacts/animated-effects/src/style.css");

  const style=fs.existsSync(styleFile)?fs.readFileSync(styleFile,"utf8"):"";
  if(style.includes("AE_PACK_09_MEGA_START"))return false;

  const registry=fs.existsSync(registryPath)?fs.readFileSync(registryPath,"utf8"):"";
  const types=fs.existsSync(typesPath)?fs.readFileSync(typesPath,"utf8"):"";

  const partial=
    fs.existsSync(packFile)||
    registry.includes("pack09MegaEffectModules")||
    types.includes("EffectCustomControl");

  if(!partial)return false;

  const backupParent=path.join(root,".ae-pack-backup");

  if(!fs.existsSync(backupParent)){
    fail("Wykryto częściową instalację Pack 09, ale nie znaleziono .ae-pack-backup.");
  }

  const candidates=
    fs.readdirSync(
      backupParent,
      {withFileTypes:true},
    )
    .filter(
      entry=>
        entry.isDirectory()&&
        entry.name.startsWith("pack-09-mega-"),
    )
    .map(entry=>entry.name)
    .sort();

  if(candidates.length===0){
    fail("Wykryto częściową instalację Pack 09, ale nie znaleziono backupu pack-09-mega-*.");
  }

  const recoveryRoot=
    path.join(
      backupParent,
      candidates[0],
    );

  const manifestPath=
    path.join(
      recoveryRoot,
      "backup-manifest.json",
    );

  if(!fs.existsSync(manifestPath)){
    fail("Brak backup-manifest.json w: "+recoveryRoot);
  }

  const manifest=
    JSON.parse(
      fs.readFileSync(
        manifestPath,
        "utf8",
      ),
    );

  const existed=
    new Set(
      manifest.existed??[],
    );

  for(const relative of manifest.touched??[]){
    const target=
      path.join(
        root,
        relative,
      );

    const backup=
      path.join(
        recoveryRoot,
        relative,
      );

    if(existed.has(relative)){
      if(!fs.existsSync(backup)){
        fail("Brak pliku w backupie: "+relative);
      }

      fs.mkdirSync(
        path.dirname(target),
        {recursive:true},
      );

      fs.copyFileSync(
        backup,
        target,
      );
    }else{
      fs.rmSync(
        target,
        {
          recursive:true,
          force:true,
        },
      );
    }
  }

  console.log("");
  console.log("Wykryto niepełną poprzednią instalację Pack 09.");
  console.log("Przywrócono stan sprzed pierwszej próby.");
  console.log("Recovery:",path.relative(root,recoveryRoot));
  console.log("");

  return true;
}

restoreFailedPack09Attempt();
const stylePath="artifacts/animated-effects/src/style.css";if(read(stylePath).includes("AE_PACK_09_MEGA_START")){console.log("Pack 09 Mega jest już zainstalowany.");process.exit(0)}
const stamp=new Date().toISOString().replace(/[:.]/g,"-").replace("T","_").replace("Z","");const backupRoot=path.join(root,".ae-pack-backup",`pack-09-mega-${stamp}`);const touched=[...Object.keys(sourceFiles),...required,"artifacts/animated-effects/AE_PACK_09.json"];const existed=[];for(const r of touched){const s=path.join(root,r);if(!fs.existsSync(s))continue;existed.push(r);const t=path.join(backupRoot,r);fs.mkdirSync(path.dirname(t),{recursive:true});fs.copyFileSync(s,t)}fs.mkdirSync(backupRoot,{recursive:true});fs.writeFileSync(path.join(backupRoot,"backup-manifest.json"),JSON.stringify({touched,existed},null,2));
for(const [target,src] of Object.entries(sourceFiles)){fs.mkdirSync(path.dirname(path.join(root,target)),{recursive:true});fs.copyFileSync(path.join(here,src),path.join(root,target))}
let types=read("artifacts/animated-effects/src/core/types.ts");if(!types.includes("export interface EffectCustomControl")){const a="export interface EffectCapabilities {";const i=types.indexOf(a);if(i<0)fail("Nie znaleziono EffectCapabilities.");types=types.slice(0,i)+`export interface EffectCustomControl {\n  key: string; label: string; description?: string;\n  min: number; max: number; step?: number; defaultValue: number; suffix?: string;\n}\n\n`+types.slice(i)}if(!types.includes("custom?: Record<string, number>"))types=types.replace(/speed:\s*number;\s*intensity:\s*number;/,"speed: number; intensity: number;\n  custom?: Record<string, number>;");if(!types.includes("customControls?: EffectCustomControl[]"))types=types.replace(/performanceCost:\s*1\s*\|\s*2\s*\|\s*3\s*\|\s*4\s*\|\s*5;\s*requiresJavaScript:\s*boolean;/,"performanceCost: 1 | 2 | 3 | 4 | 5; requiresJavaScript: boolean;\n  customControls?: EffectCustomControl[];");write("artifacts/animated-effects/src/core/types.ts",types);
let registry=read("artifacts/animated-effects/src/effects/registry.ts");if(!registry.includes("pack09MegaEffectModules")){const p=/import\s*\{\s*pack08EffectModules\s*,?\s*\}\s*from\s*["']\.\/modules\/pack08Expansion["']\s*;?/m;const m=registry.match(p);if(!m)fail("Nie znaleziono importu Pack08 w registry.ts.");registry=registry.replace(p,m[0]+`\nimport {\n  pack09MegaEffectModules,\n} from "./modules/pack09Mega";`);const lp=/const\s+registeredEffectModules\s*:\s*EffectModule\[\]\s*=\s*\[([\s\S]*?)\];/m;const lm=registry.match(lp);if(!lm)fail("Nie znaleziono registeredEffectModules.");registry=registry.replace(lp,(full,inner)=>`const registeredEffectModules:\n  EffectModule[] = [\n    ${inner.trim().replace(/,\s*$/,"")},\n    ...pack09MegaEffectModules,\n  ];`)}write("artifacts/animated-effects/src/effects/registry.ts",registry);
let variants=read("artifacts/animated-effects/src/effects/variants.ts");if(!variants.includes("pack09VariantCatalog")){const p=/import\s*\{\s*pack08VariantCatalog\s*,?\s*\}\s*from\s*["']\.\/modules\/pack08Variants["']\s*;?/m;const m=variants.match(p);if(!m)fail("Nie znaleziono importu Pack08 variants.");variants=variants.replace(p,m[0]+`\nimport {\n  pack09VariantCatalog,\n} from "./modules/pack09Variants";`);const rp=/return\s+([^;]*effectVariantCatalog\[effectId\][^;]*)\s*;/m;const rm=variants.match(rp);if(!rm)fail("Nie znaleziono return getEffectVariants.");variants=variants.replace(rp,`return pack09VariantCatalog[effectId] ?? ${rm[1].trim()};`)}write("artifacts/animated-effects/src/effects/variants.ts",variants);
let main=read("artifacts/animated-effects/src/main.ts");
if(!main.includes('from "./pack09/customization"')){
  const p=/import\s*\{\s*installPack08UiQa\s*,?\s*\}\s*from\s*["']\.\/pack08\/uiQa["']\s*;?/m;
  const m=main.match(p);
  const add=`import {
  installPack09Customization,
} from "./pack09/customization";`;

  if(m){
    main=main.replace(
      p,
      m[0]+"\n"+add,
    );
  }else if(main.includes('import "./style.css";')){
    main=main.replace(
      'import "./style.css";',
      'import "./style.css";\n\n'+add,
    );
  }else{
    fail("Nie znaleziono bezpiecznego miejsca na import Pack09 w main.ts.");
  }
}

if(!main.includes("installPack09Customization();")){
  if(main.includes("installPack08UiQa();")){
    main=main.replace(
      "installPack08UiQa();",
      "installPack08UiQa();\ninstallPack09Customization();",
    );
  }else{
    main+="\ninstallPack09Customization();\n";
  }
}

write("artifacts/animated-effects/src/main.ts",main);
const css="/* === AE_PACK_09_MEGA_START === */\n.ae-pack09-character-panel{margin-bottom:10px;padding:13px;border:1px solid rgba(72,211,255,.24);border-radius:13px;background:linear-gradient(145deg,rgba(66,208,255,.075),rgba(124,92,255,.055))}.ae-pack09-character-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:11px}.ae-pack09-character-heading>div{display:grid;gap:3px;min-width:0}.ae-pack09-character-heading strong{color:#75e2ff;font-size:11px}.ae-pack09-character-heading span{color:#8293ab;font-size:9px}.ae-pack09-custom-badge{padding:4px 7px;border:1px solid rgba(116,220,255,.25);border-radius:999px;color:#99ebff!important;background:rgba(81,205,255,.08)}.ae-pack09-character-presets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-bottom:12px}.ae-pack09-character-presets button{min-height:34px;padding:0 9px;border:1px solid rgba(255,255,255,.09);border-radius:8px;background:rgba(255,255,255,.025);color:#c2cee0;font-size:9px;font-weight:700;cursor:pointer}.ae-pack09-character-presets button:hover{border-color:rgba(99,216,255,.34);color:#fff;background:rgba(83,204,255,.07)}.ae-pack09-character-fields{display:grid;gap:13px}.ae-pack09-character-field{display:grid;gap:8px}.ae-pack09-character-label{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.ae-pack09-character-label>span{display:grid;gap:3px;min-width:0}.ae-pack09-character-label strong{color:#edf5ff;font-size:10px}.ae-pack09-character-label small{color:#75869f;font-size:8px;line-height:1.35}.ae-pack09-character-label output{min-width:54px;padding:4px 7px;border:1px solid rgba(255,255,255,.07);border-radius:7px;background:rgba(0,0,0,.14);color:#8ce7ff;font-size:9px;text-align:right}.ae-pack09-character-field input[type=range]{width:100%;accent-color:#54d3ff}.ae-pack09-character-help{margin:12px 0 0;color:#718299;font-size:8.5px;line-height:1.5}\n.ae-inspector-content{padding-bottom:30px!important}.inspector-title,.inspector-color-panel,.inspector-variant-panel,.inspector-group,.ae-pack06-inspector,.ae-pack09-character-panel{box-shadow:0 1px 0 rgba(255,255,255,.018),inset 0 1px 0 rgba(255,255,255,.012)!important}.inspector-group-toggle:hover{background:rgba(255,255,255,.018)}#inspector input[type=range]{height:24px;cursor:ew-resize}.ae-effect-library{padding-right:8px!important}.ae-effect-card{gap:6px;min-height:68px}.ae-effect-card-main{min-width:0}.ae-effect-card-main strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ae-effect-card.is-previewing{border-color:rgba(81,210,255,.72)!important;box-shadow:inset 3px 0 0 #4dd9ff,0 0 0 1px rgba(77,217,255,.08)!important}.ae-app-header{min-height:62px}.ae-header-actions{gap:7px!important}.ae-header-actions>button,.ae-header-actions>details>summary{min-height:38px;border-radius:9px!important}.ae-effect-library,.ae-layer-list,.ae-inspector-content,.ae-media-export{overscroll-behavior:contain!important;scrollbar-width:thin;scrollbar-color:rgba(126,145,178,.58) rgba(255,255,255,.02)}.ae-media-dialog{border-color:rgba(124,155,205,.22)!important;box-shadow:0 24px 80px rgba(0,0,0,.52)!important}.ae-media-grid input:focus,.ae-media-grid select:focus,.ae-media-section input:focus,.ae-media-section select:focus{outline:none;border-color:rgba(83,211,255,.55);box-shadow:0 0 0 3px rgba(83,211,255,.08)}.ae-batch-export{position:relative}.ae-batch-export::before{content:\"QA\";position:absolute;right:12px;top:12px;padding:3px 7px;border:1px solid rgba(89,214,255,.2);border-radius:999px;color:#79ddff;font-size:8px;font-weight:800;background:rgba(69,197,255,.06)}\n@media(max-width:1260px){.ae-editor-grid{grid-template-columns:minmax(270px,300px) minmax(390px,1fr) minmax(300px,330px)!important}.ae-pack09-character-label{align-items:center}}@media(max-width:1080px){.ae-editor-grid{grid-template-columns:minmax(250px,280px) minmax(360px,1fr) minmax(280px,310px)!important}.ae-header-status{display:none!important}.ae-app-brand span{display:none}}\n/* === AE_PACK_09_MEGA_END === */";write(stylePath,read(stylePath).trimEnd()+"\n\n"+css+"\n");
let media=read("artifacts/animated-effects/src/media/mediaExport.ts");for(const [bad,good] of [["Nie udaĹ‚o siÄ™","Nie udało się"],["SzerokoĹ›Ä‡","Szerokość"],["WysokoĹ›Ä‡","Wysokość"],["TĹ‚o","Tło"],["efektĂłw","efektów"],["Ă—","×"],["Â·","·"]])media=media.split(bad).join(good);media=media.replace('max="1280" value="640" data-batch-width','max="1920" value="640" data-batch-width').replace('max="720" value="360" data-batch-height','max="1080" value="360" data-batch-height').replace('max="20" value="12" data-batch-fps','max="30" value="12" data-batch-fps').replace('Math.min(1280,','Math.min(1920,').replace('Math.min(720,','Math.min(1080,').replace('Math.min(20,','Math.min(30,');write("artifacts/animated-effects/src/media/mediaExport.ts",media);
const manifest={pack:"Animated Effects Pack 09 Mega",installedAt:new Date().toISOString(),backup:path.relative(root,backupRoot),improved:19,newEffects:12,features:["effect-specific Character controls","persistent custom settings","12 new effects","19 effect rebuilds","UI polish","batch GIF up to 1920x1080 / 30 FPS"]};write("artifacts/animated-effects/AE_PACK_09.json",JSON.stringify(manifest,null,2)+"\n");
const rollbackPath=path.join(root,"ae-pack-09-mega-rollback.mjs");fs.writeFileSync(rollbackPath,`import fs from "node:fs";import path from "node:path";const root=process.cwd(),backupRoot=${JSON.stringify(backupRoot)},manifest=JSON.parse(fs.readFileSync(path.join(backupRoot,"backup-manifest.json"),"utf8")),existed=new Set(manifest.existed);for(const r of manifest.touched){const target=path.join(root,r),backup=path.join(backupRoot,r);if(existed.has(r)){fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(backup,target)}else fs.rmSync(target,{recursive:true,force:true})}console.log("Pack 09 Mega cofnięty.");`);
console.log("\n========================================================");console.log(" Animated Effects Pack 09 MEGA V2 INSTALLED");console.log("========================================================");console.log("19 istniejących efektów przebudowanych.");console.log("12 nowych efektów.");console.log("Dodano efekt-specyficzne suwaki Charakter efektu.");console.log("Batch GIF: do 1920x1080 / 30 FPS.");console.log("Backup:",path.relative(root,backupRoot));console.log("Rollback: .\\ae-pack-09-mega-rollback.mjs");console.log("\nTeraz uruchom:\n  pnpm --filter animated-effects run typecheck\n  pnpm --filter animated-effects run build\n");
