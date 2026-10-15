import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const backupRoot="C:\\Users\\kubap\\Documents\\GitHub\\aplikacja-turnieje-live\\.ae-pack-backup\\pack-06-2026-09-27_12-49-23-131";
const manifestPath=path.join(backupRoot,"backup-manifest.json");
if(!fs.existsSync(manifestPath)){console.error("Brak manifestu backupu:",manifestPath);process.exit(1)}
const manifest=JSON.parse(fs.readFileSync(manifestPath,"utf8"));
const existed=new Set(manifest.existed);
for(const relative of manifest.allTouched){const target=path.join(root,relative);const backup=path.join(backupRoot,relative);if(existed.has(relative)){if(!fs.existsSync(backup)){console.error("Brak backupu:",relative);process.exit(1)}fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(backup,target)}else{fs.rmSync(target,{recursive:true,force:true})}}
console.log("Pack 06 cofnięty. Uruchom: pnpm install");
