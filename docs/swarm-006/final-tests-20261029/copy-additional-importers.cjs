const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const src='C:/Users/kubap/Documents/GitHub/aplikacja-turnieje-live';
const dst='C:/Users/kubap/Desktop/SWARM006-Final-Tests-20261029';
const queued=[],pending=[],copied=new Set(),records=[];
function visit(a,b){
 const st=fs.lstatSync(a);
 if(st.isSymbolicLink()){
  const target=path.resolve(path.dirname(a),fs.readlinkSync(a)),rel=path.relative(src,target);
  if(rel.startsWith('..')||path.isAbsolute(rel))throw Error('External importer link');
  const mapped=path.join(dst,rel);pending.push({b,target:mapped});
  const pmrel=path.relative(path.join(src,'node_modules/.pnpm'),target);
  if(!pmrel.startsWith('..')&&!path.isAbsolute(pmrel)&&!fs.existsSync(path.join(mapped,'package.json')))queued.push(pmrel.split(path.sep)[0]);
  return;
 }
 if(st.isDirectory()){fs.mkdirSync(b,{recursive:true});for(const n of fs.readdirSync(a))if(n!=='.bin')visit(path.join(a,n),path.join(b,n));return;}
 if(!st.isFile())throw Error('Unsupported entry');
 fs.copyFileSync(a,b);records.push({path:path.relative(dst,b).replaceAll('\\','/'),sha256:crypto.createHash('sha256').update(fs.readFileSync(b)).digest('hex')});
}
for(const importer of ['artifacts/animated-effects','artifacts/mockup-sandbox','scripts'])visit(path.join(src,importer,'node_modules'),path.join(dst,importer,'node_modules'));
while(queued.length){const n=queued.shift();if(copied.has(n))continue;copied.add(n);visit(path.join(src,'node_modules/.pnpm',n),path.join(dst,'node_modules/.pnpm',n));}
for(const {b,target}of pending){if(fs.existsSync(b)){if(!fs.lstatSync(b).isSymbolicLink()||path.resolve(fs.readlinkSync(b))!==target)throw Error('Existing link mismatch: '+b);}else fs.symlinkSync(target,b,'junction');}
fs.writeFileSync(__dirname+'/additional-importers.json',JSON.stringify({source:src,method:'copy existing importer links and missing installed packages only',copied_packages:[...copied],links:pending.length,records},null,2));
console.log(JSON.stringify({copied_packages:[...copied],links:pending.length,files:records.length}));
