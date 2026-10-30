'use strict';
const {execFileSync}=require('node:child_process');
const RC1='10f64e4d213f17a352ed8fa83bc75884a39549f0';
const U='unity/cc001-r16/CoreClash-V149-Unity/';
const protectedFiles=[
 'docs/cc001/swarm/R17_A70_SOURCE_MANIFEST.json',
 'unity/cc001-r16/Reference/V148_reference_original.html',
 U+'Tests/Program.cs',U+'Assets/Resources/Data/catalog.json',
 U+'Assets/Resources/Data/network-settings.json',
 U+'Assets/CoreClash/Networking/NgoWireProtocol.cs',
 U+'Assets/CoreClash/Networking/LanDiscoveryProtocol.cs'];
const protectedFolders=['unity/cc001-r16/Reference/',U+'Packages/',U+'ProjectSettings/'];
const valid=p=>typeof p==='string'&&p.length>0&&!p.startsWith('/')&&!p.includes('\\')&&!/[\n\0*?\[\]{}]/.test(p)&&p.split('/').every(s=>s&&s!=='.'&&s!=='..');
const unityMeta=p=>p.startsWith('unity/cc001-r16/')&&p.endsWith('.meta');
const protectedPath=p=>protectedFiles.includes(p)||protectedFolders.some(d=>p.startsWith(d))||unityMeta(p)||p==='csc.rsp'||p.endsWith('/csc.rsp');
const addableMeta=(p,base)=>p.startsWith(U+'Assets/')&&p.endsWith('.cs.meta')&&!base.has(p);
function index(entries){const m=new Map();for(const e of entries){if(!valid(e.path)||!/^100(644|755)$/.test(e.mode)||!/^[0-9a-f]{40}$/.test(e.sha)||m.has(e.path))throw Error('Invalid Git entry '+e.path);m.set(e.path,e)}return m;}
function check(baseEntries,headEntries,allowedPaths,content){
 const base=index(baseEntries),head=index(headEntries),allow=new Set(allowedPaths),errors=[],changed=[];
 if(!Array.isArray(allowedPaths)||allow.size!==allowedPaths.length)throw Error('Bad allowlist');
 for(const p of allow)if(!valid(p)||(protectedPath(p)&&!addableMeta(p,base)))throw Error('Invalid or protected allowlist path: '+p);
 for(const p of protectedFiles)if(!base.has(p))throw Error('Missing frozen protected path: '+p);
 const lower=new Set();for(const p of head.keys()){const l=p.toLowerCase();if(lower.has(l))throw Error('Case-fold collision: '+p);lower.add(l);}
 for(const [p,v] of base){const q=head.get(p);if(!q)errors.push('Removed: '+p);else if(q.sha!==v.sha||q.mode!==v.mode){if(protectedPath(p))errors.push('Protected: '+p);else if(!allow.has(p))errors.push('Unapproved: '+p);else if(q.mode!==v.mode)errors.push('Mode changed: '+p);else changed.push(p);}}
 for(const [p,v] of head)if(!base.has(p)){
  if(unityMeta(p)){
   const asset=p.slice(0,-5);
   if(!addableMeta(p,base))errors.push('Protected added: '+p);
   else if(!allow.has(p)||!allow.has(asset))errors.push('Unapproved new meta/asset pair: '+p);
   else if(!head.has(asset)||base.has(asset))errors.push('Orphan new Unity meta: '+p);
   else if(v.mode!=='100644')errors.push('New meta mode: '+p);
   else changed.push(p);
  }else if(protectedPath(p))errors.push('Protected added: '+p);else if(!allow.has(p))errors.push('Unapproved added: '+p);else if(v.mode!=='100644')errors.push('New mode: '+p);else changed.push(p);
 }
 for(const p of changed)if(p.startsWith(U+'Assets/')&&p.endsWith('.cs')&&!base.has(p)&&!head.has(p+'.meta'))errors.push('Missing new Unity .meta: '+p);
 if([...head.keys()].some(p=>addableMeta(p,base))){
  if(typeof content!=='function')throw Error('Missing Unity meta content provider');
  const guids=new Map();
  for(const p of head.keys())if(unityMeta(p)){
   const raw=content(p);
   if(typeof raw!=='string')throw Error('Missing Unity .meta bytes: '+p);
   const matches=[...raw.matchAll(/^guid:[ \t]*([0-9a-fA-F]{32})[ \t]*\r?$/gm)];
   if(matches.length!==1){errors.push('Malformed or missing Unity GUID: '+p);continue;}
   const guid=matches[0][1].toLowerCase();
   if(guids.has(guid))errors.push('Duplicate Unity GUID: '+p+' and '+guids.get(guid));
   else guids.set(guid,p);
  }
 }
 for(const p of changed)if(p.endsWith('.cs')){if(typeof content!=='function')throw Error('Missing C# content provider');const text=content(p);if(typeof text!=='string')throw Error('Missing C# bytes: '+p);if(/CC001_PHOENIX_DIAGNOSTIC|PhoenixDiagnostic/.test(text))errors.push('Diagnostic define: '+p);}
 return {ok:errors.length===0,changed,errors,baselineFiles:base.size,candidateFiles:head.size};
}
// W11: exact Git object admission. A path-only allowlist is insufficient:
// every changed source/test/meta/document blob must equal a preapproved Git SHA-1.
function checkPinned(baseEntries,headEntries,expectedBlobs,content){
 if(!expectedBlobs||typeof expectedBlobs!=='object'||Array.isArray(expectedBlobs))throw Error('Missing expected blob manifest');
 const paths=Object.keys(expectedBlobs);
 if(!paths.length)throw Error('Empty expected blob manifest');
 for(const p of paths)if(!valid(p)||!/^[0-9a-f]{40}$/.test(expectedBlobs[p]))throw Error('Invalid expected Git blob: '+p);
 const out=check(baseEntries,headEntries,paths,content);
 const head=index(headEntries);
 const selected=new Set(out.changed);
 for(const p of paths){
  if(!selected.has(p))out.errors.push('Expected blob path not changed: '+p);
  else if(head.get(p)?.sha!==expectedBlobs[p])out.errors.push('Unexpected blob SHA: '+p);
 }
 if(out.changed.length!==paths.length)out.errors.push('Changed/expected path count mismatch');
 out.ok=out.errors.length===0;
 out.expectedBlobs=paths.length;
 return out;
}
function parseLsTree(data){return data.toString('utf8').split('\0').filter(Boolean).map(s=>{const m=/^(100644|100755) blob ([0-9a-f]{40})\t(.+)$/.exec(s);if(!m)throw Error('Invalid Git tree record: '+s.slice(0,60));return {mode:m[1],sha:m[2],path:m[3]};});}
function cli(argv){
 let ref='',root=process.cwd(),expected=Object.create(null);
 for(let i=0;i<argv.length;i++){
  if(argv[i]==='--ref')ref=argv[++i];
  else if(argv[i]==='--expect'){
   const item=argv[++i];
   if(typeof item!=='string')throw Error('Missing --expect path=GitBlobSHA');
   const delim=item.lastIndexOf('=');
   if(delim<1)throw Error('Malformed --expect path=GitBlobSHA');
   const path=item.slice(0,delim),blob=item.slice(delim+1);
   if(!valid(path)||!/^[0-9a-f]{40}$/.test(blob)||Object.hasOwn(expected,path))throw Error('Invalid/duplicate --expect blob: '+path);
   expected[path]=blob;
  }
  else if(argv[i]==='--root')root=argv[++i];
  else throw Error('Unknown argument (use --expect path=GitBlobSHA): '+argv[i]);
 }
 if(!/^[0-9a-f]{40}$/.test(ref))throw Error('Exact 40-hex --ref commit SHA required');
 if(!Object.keys(expected).length)throw Error('At least one --expect path=GitBlobSHA is required');
 const git=(args,utf8=false)=>execFileSync('git',args,{cwd:root,encoding:utf8?'utf8':null,maxBuffer:32*1024*1024});
 root=git(['rev-parse','--show-toplevel'],true).trim();
 if(git(['rev-parse','--verify',RC1+'^{commit}'],true).trim()!==RC1)throw Error('Frozen RC1 unavailable');
 const sha=git(['rev-parse','--verify',ref+'^{commit}'],true).trim();
 git(['merge-base','--is-ancestor',RC1,sha]);
 const base=parseLsTree(git(['ls-tree','-rz','--full-tree',RC1]));
 const head=parseLsTree(git(['ls-tree','-rz','--full-tree',sha]));
 const output=checkPinned(base,head,expected,p=>git(['show',sha+':'+p]).toString('utf8'));
 console.log(JSON.stringify({baseline:RC1,candidate:sha,gate:'A71_W9',...output},null,2));
 if(!output.ok)process.exitCode=2;
}
if(require.main===module){try{cli(process.argv.slice(2));}catch(e){console.error('A71_W9_HOLD: '+e.message);process.exitCode=2;}}
module.exports={RC1,U,protectedFiles,protectedPath,check,checkPinned,parseLsTree};
