const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root='C:/Users/kubap/Desktop/SWARM006-Final-Tests-20261029';
function files(dir,pattern){return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(dir+'/'+e.name,pattern):pattern.test(e.name)?[dir+'/'+e.name]:[]).sort();}
const group=process.argv[2], id=process.argv[3];
let cwd,args,selected,excluded;
if(group==='api'){
 cwd='artifacts/api-server';
 const all=files(cwd+'/test',/\.test\.ts$/);
 excluded=all.filter(p=>p.endsWith('.integration.test.ts')||/\/(se-correction-safety|se-correction-readiness|se-readiness-transaction-contract)\.test\.ts$/.test(p));
 selected=all.filter(p=>!excluded.includes(p));
 args=['--import','tsx','--test','--test-concurrency=1',...selected.map(p=>path.relative(cwd,p))];
}else if(group==='frontend'){
 cwd='artifacts/tournament-manager';
 const all=files(cwd+'/src',/\.test\.(ts|tsx)$/);
 excluded=all.filter(p=>p.endsWith('/tournament-audience.test.tsx'));
 selected=all.filter(p=>!excluded.includes(p));
 args=['--import','tsx','--import','./test/setup-dom.mjs','--test','--test-concurrency=1',...selected.map(p=>path.relative(cwd,p))];
}else throw Error('Unknown group');
const inventory={group,cwd,selected,excluded,reason:'Excluded DB integration and separately accepted/reused or executed evidence; see report'};
fs.writeFileSync(path.join(__dirname,id+'-selection.json'),JSON.stringify(inventory,null,2));
console.log(JSON.stringify({group,selected:selected.length,excluded:excluded.length}));
const r=cp.spawnSync(process.execPath,[path.join(__dirname,'run.cjs'),id,cwd,...args],{stdio:'inherit',windowsHide:true});
process.exitCode=r.status??1;
