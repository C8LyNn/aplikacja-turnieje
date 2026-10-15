import fs from "node:fs";
import path from "node:path";
const explicit=process.argv[2]?path.resolve(process.argv[2]):null; const cwd=process.cwd();
function findRepoRoot(){const starts=[explicit,cwd].filter(Boolean),c=[];for(const s of starts)c.push(s,path.resolve(s,".."),path.resolve(s,"..",".."),path.resolve(s,"..","..",".."));return [...new Set(c)].find(x=>fs.existsSync(path.join(x,"artifacts","tournament-manager","src","App.tsx"))&&fs.existsSync(path.join(x,"artifacts","api-server","src","app.ts")));}
const repo=findRepoRoot(); if(!repo)throw new Error("Nie znaleziono root repo.");
const tm=path.join(repo,"artifacts","tournament-manager"),api=path.join(repo,"artifacts","api-server");
const backups=fs.readdirSync(tm,{withFileTypes:true}).filter(x=>x.isDirectory()&&x.name.startsWith(".core-clash-delayed-replay-pvp-pack-02-backup-")).map(x=>path.join(tm,x.name)).sort().reverse();
if(!backups.length)throw new Error("Brak backupu Delayed Replay PvP Pack 02."); const backup=backups[0];
const copies=[
 ["core-clash-index.html",path.join(tm,"public","prototypes","minigames","core-clash","index.html")],
 ["api-routes-index.ts",path.join(api,"src","routes","index.ts")],
 ["api-app.ts",path.join(api,"src","app.ts")],
 ["core-clash-multiplayer.ts",path.join(api,"src","routes","core-clash-multiplayer.ts")],
 ["core-clash-multiplayer.test.ts",path.join(api,"test","core-clash-multiplayer.test.ts")],
];
for(const [name,dest] of copies){const src=path.join(backup,name);if(fs.existsSync(src)){fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(src,dest);console.log(`RESTORE ${name}`);}}
console.log(`OK: przywrócono ${backup}`);
