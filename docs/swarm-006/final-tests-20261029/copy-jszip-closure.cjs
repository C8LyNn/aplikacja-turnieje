const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const src='C:/Users/kubap/Documents/GitHub/aplikacja-turnieje-live';
const dst='C:/Users/kubap/Desktop/SWARM006-Final-Tests-20261029';
const pm=path.join(src,'node_modules/.pnpm'),queue=['jszip@3.10.2'],done=new Set(),links=[],records=[];
function copy(a,b){
 const st=fs.lstatSync(a);
 if(st.isSymbolicLink()){
  const target=path.resolve(path.dirname(a),fs.readlinkSync(a));
  const rel=path.relative(pm,target);if(rel.startsWith('..')||path.isAbsolute(rel))throw Error('External closure link');
  queue.push(rel.split(path.sep)[0]);links.push({b,target:path.join(dst,'node_modules/.pnpm',rel)});return;
 }
 if(st.isDirectory()){fs.mkdirSync(b,{recursive:true});for(const n of fs.readdirSync(a))copy(path.join(a,n),path.join(b,n));return;}
 if(!st.isFile())throw Error('Unsupported closure entry');
 fs.copyFileSync(a,b);
 records.push({path:path.relative(dst,b).replaceAll('\\','/'),sha256:crypto.createHash('sha256').update(fs.readFileSync(b)).digest('hex')});
}
while(queue.length){const n=queue.shift();if(done.has(n))continue;done.add(n);copy(path.join(pm,n),path.join(dst,'node_modules/.pnpm',n));}
for(const {b,target} of links){if(fs.existsSync(b)){if(!fs.lstatSync(b).isSymbolicLink()||path.resolve(fs.readlinkSync(b))!==target)throw Error('Link collision');}else fs.symlinkSync(target,b,'junction');}
const importer=path.join(dst,'artifacts/animated-effects/node_modules');fs.mkdirSync(importer,{recursive:true});
fs.symlinkSync(path.join(dst,'node_modules/.pnpm/jszip@3.10.2/node_modules/jszip'),path.join(importer,'jszip'),'junction');
fs.writeFileSync(path.join(__dirname,'jszip-closure.json'),JSON.stringify({source:src,method:'copy already installed exact jszip version and dependency closure; no install or source-store access',packages:[...done],files:records.length,links:links.length,records},null,2));
console.log(JSON.stringify({packages:[...done],files:records.length,links:links.length}));
