// Copy already installed package files; never invoke pnpm or touch its store.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const src = 'C:/Users/kubap/Documents/GitHub/aplikacja-turnieje';
const dst = 'C:/Users/kubap/Desktop/SWARM006-Final-Tests-20261029';
const roots = ['node_modules', 'artifacts/api-server/node_modules', 'artifacts/tournament-manager/node_modules', ...fs.readdirSync(path.join(src,'lib')).map(x=>'lib/'+x+'/node_modules')];
const linksOnly=process.argv.includes('--links-only');
let files=0,bytes=0,links=0; const digests=[], pending=[];
function copy(a,b) {
  if(path.basename(a)==='.cache') return;
  if(!linksOnly&&path.dirname(a)===path.join(src,'node_modules','.pnpm')) console.log('Copy '+path.basename(a));
  const st=fs.lstatSync(a);
  if(st.isSymbolicLink()) {
    const target=path.resolve(path.dirname(a),fs.readlinkSync(a));
    const rel=path.relative(src,target);
    if(rel.startsWith('..')||path.isAbsolute(rel)) throw Error('External dependency link rejected: '+a);
    fs.mkdirSync(path.dirname(b),{recursive:true});
    pending.push({b,target:path.join(dst,rel)}); return;
  }
  if(st.isDirectory()) { fs.mkdirSync(b,{recursive:true}); for(const n of fs.readdirSync(a)) copy(path.join(a,n),path.join(b,n)); return; }
  if(!st.isFile()) throw Error('Unsupported entry: '+a);
  fs.mkdirSync(path.dirname(b),{recursive:true});
  if(linksOnly){if(fs.statSync(b).size!==st.size)throw Error('Copied size mismatch: '+b);}
  else fs.copyFileSync(a,b);
  if(!linksOnly)digests.push({path:path.relative(dst,b).replaceAll('\\','/'),bytes:st.size,sha256:crypto.createHash('sha256').update(fs.readFileSync(b)).digest('hex')});
  files++;bytes+=st.size;
}
for(const r of roots) if(fs.existsSync(path.join(src,r))) copy(path.join(src,r),path.join(dst,r));
for(const {b,target} of pending) {
  if(!fs.existsSync(target)) throw Error('Missing copied target: '+target);
  if(fs.existsSync(b)) { if(!fs.lstatSync(b).isSymbolicLink()||path.resolve(fs.readlinkSync(b))!==target) throw Error('Destination collision: '+b); }
  else fs.symlinkSync(target,b,'junction');
  links++;
}
fs.writeFileSync(path.join(__dirname,'dependency-copy.json'),JSON.stringify({source:src,destination:dst,method:'copy installed files and relocate internal junctions; no package manager, no source pnpm store',linksOnlyFinalization:linksOnly,files,bytes,links,digests},null,2));
console.log(JSON.stringify({files,bytes,links}));
