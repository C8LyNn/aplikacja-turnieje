'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const RC1='10f64e4d213f17a352ed8fa83bc75884a39549f0';
const QA='3f972cdbaea6289a7e33ce608f5d3256cfdab0a3';
const QA_REF='integration/cc001-r17-w11-qa-freeze-20261030';
const MANIFEST_BLOB='b7bed4fa2eea89146f089ee70cbb7258e2230dab';
const MANIFEST=path.join(__dirname,'w11-qa-freeze-manifest.json');
const UNITY='unity/cc001-r16/CoreClash-V149-Unity/';
const isSha=x=>typeof x==='string'&&/^[0-9a-f]{40}$/.test(x);
const validPath=x=>typeof x==='string'&&x.length>0&&!x.startsWith('/')&&!x.includes('\\')&&!/[\n\r\0*?\[\]{}]/.test(x)&&x.split('/').every(y=>y&&y!=='.'&&y!=='..');
const blobHash=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
function readManifest(bytes,expectedBlob=MANIFEST_BLOB){
 const b=Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes);
 if(blobHash(b)!==expectedBlob)throw Error('MANIFEST_BLOB_MISMATCH');
 const m=JSON.parse(b.toString('utf8'));
 if(m.spec!=='CC001_R17_W11_A71_QA_FREEZE_EXACT_SOURCE_V1'||m.baseline!==RC1||m.qaSha!==QA||m.qaRef!==QA_REF||
 m.baselineTree!=='304f7f2811900c0b2b7771ec567170365f709c50'||
 m.qaTree!=='7fb8a89143f77aa22488d92af32efa35cd323332'||
 m.projectSubtreePath!==UNITY.slice(0,-1)||m.qaProjectTree!=='226ff427fadd0408a8e09cc1e7fcbe71f30c6c36'||
 m.immutableOriginalUnityMeta!==88||!Array.isArray(m.expectedDelta)||m.expectedDelta.length!==22)throw Error('MANIFEST_SCHEMA_OR_PIN_MISMATCH');
 const seen=new Set();
 for(const e of m.expectedDelta){if(!validPath(e.path)||!isSha(e.sha)||e.mode!=='100644'||!['added','modified'].includes(e.kind)||seen.has(e.path))throw Error('INVALID_PIN_ENTRY');seen.add(e.path);}
 return m;
}
function parseLsTree(raw){return raw.toString('utf8').split('\0').filter(Boolean).map(s=>{
 const m=/^(100644|100755) blob ([0-9a-f]{40})\t(.+)$/.exec(s);
 if(!m||!validPath(m[3]))throw Error('UNSUPPORTED_GIT_ENTRY');
 return {mode:m[1],sha:m[2],path:m[3]};
});}
function index(items){const map=new Map(),fold=new Set();for(const x of items){if(!validPath(x.path)||!isSha(x.sha)||!/^100(644|755)$/.test(x.mode)||map.has(x.path)||fold.has(x.path.toLowerCase()))throw Error('INVALID_OR_COLLIDING_TREE');map.set(x.path,x);fold.add(x.path.toLowerCase());}return map;}
function checkTrees(baseEntries,qaEntries,manifest){
 const base=index(baseEntries),head=index(qaEntries),pinned=new Map(manifest.expectedDelta.map(x=>[x.path,x])),errors=[],changed=[];
 if(base.size!==1750||head.size!==1758)errors.push('TREE_FILE_COUNT_DRIFT');
 for(const [p,old] of base){const cur=head.get(p);if(!cur)errors.push('DELETED_BASELINE '+p);else if(cur.sha!==old.sha||cur.mode!==old.mode){changed.push(p);const want=pinned.get(p);if(!want||want.kind!=='modified'||want.sha!==cur.sha||want.mode!==cur.mode)errors.push('UNAPPROVED_EDIT '+p);}}
 for(const [p,cur] of head)if(!base.has(p)){changed.push(p);const want=pinned.get(p);if(!want||want.kind!=='added'||want.sha!==cur.sha||want.mode!==cur.mode)errors.push('UNAPPROVED_ADDITION '+p);}
 if(changed.length!==22)errors.push('WRONG_DELTA_COUNT');
 for(const p of pinned.keys())if(!changed.includes(p))errors.push('EXPECTED_CHANGE_MISSING '+p);
 const originals=[...base.keys()].filter(p=>p.startsWith('unity/cc001-r16/')&&p.endsWith('.meta'));
 if(originals.length!==88)errors.push('ORIGINAL_META_COUNT');
 for(const p of originals)if(base.get(p).sha!==head.get(p)?.sha)errors.push('MUTATED_META '+p);
 const newMetas=changed.filter(p=>p.endsWith('.meta')&&!base.has(p));
 if(newMetas.length!==2)errors.push('NEW_META_COUNT');
 for(const p of newMetas)if(!p.startsWith(UNITY+'Assets/')||!p.endsWith('.cs.meta')||!head.has(p.slice(0,-5))||base.has(p.slice(0,-5)))errors.push('UNPAIRED_NEW_META '+p);
 return {ok:errors.length===0,errors,changes:changed.length,baselineFiles:base.size,qaFiles:head.size,immutableMeta:originals.length,newMeta:newMetas.length};
}
function requireFrozenRef(resolve){
 const vals=[];
 for(const prefix of ['refs/remotes/origin/','refs/heads/']){
  const sha=resolve(prefix+QA_REF+'^{commit}');
  if(sha!==null&&sha!==undefined)vals.push(sha);
 }
 if(!vals.length||vals.some(x=>x!==QA))throw Error('QA_FREEZE_REF_UNAVAILABLE_OR_MOVED');
 return QA;
}
function uniqueUnityGuids(metaPaths,getContent){const seen=new Map();for(const p of metaPaths){const text=getContent(p);const found=[...text.matchAll(/^guid:[ \t]*([a-fA-F0-9]{32})[ \t]*\r?$/gm)];if(found.length!==1)throw Error('INVALID_UNITY_GUID '+p);const guid=found[0][1].toLowerCase();if(seen.has(guid))throw Error('DUPLICATE_UNITY_GUID '+p);seen.set(guid,p);}return seen.size;}
function parseArgs(args){let root=process.cwd(),ref=QA;for(let i=0;i<args.length;i++){
 if(args[i]==='--root'&&args[i+1])root=args[++i];
 else if(args[i]==='--ref'&&args[i+1])ref=args[++i];
 else throw Error('INVALID_ARGUMENT');
 }if(ref!==QA)throw Error('QA_SHA_MISMATCH_DO_NOT_USE_MOVING_PR207');return {root,ref};}
function run(argv){
 const opts=parseArgs(argv),read=fs.readFileSync(MANIFEST),manifest=readManifest(read);
 const git=(args,utf8=false)=>execFileSync('git',args,{cwd:opts.root,encoding:utf8?'utf8':null,maxBuffer:32*1024*1024});
 const resolve=s=>{try{return git(['rev-parse','--verify',s],true).trim();}catch{return null;}};
 const root=git(['rev-parse','--show-toplevel'],true).trim();
 if(!root)throw Error('NO_GIT_REPO');
 requireFrozenRef(resolve);
 if(resolve(RC1+'^{commit}')!==RC1||resolve(QA+'^{commit}')!==QA)throw Error('MISSING_BASE_OR_QA_COMMIT');
 git(['merge-base','--is-ancestor',RC1,QA]);
 if(resolve(RC1+'^{tree}')!==manifest.baselineTree||resolve(QA+'^{tree}')!==manifest.qaTree||resolve(QA+':'+manifest.projectSubtreePath)!==manifest.qaProjectTree)throw Error('FROZEN_TREE_MISMATCH');
 const base=parseLsTree(git(['ls-tree','-rz','--full-tree',RC1]));
 const head=parseLsTree(git(['ls-tree','-rz','--full-tree',QA]));
 const out=checkTrees(base,head,manifest);
 if(!out.ok)throw Error('SOURCE_TREE_HOLD '+out.errors.join('; '));
 const get=p=>git(['show',QA+':'+p]).toString('utf8');
 const metas=head.filter(e=>e.path.startsWith('unity/cc001-r16/')&&e.path.endsWith('.meta')).map(e=>e.path);
 if(uniqueUnityGuids(metas,get)!==90)throw Error('GUID_TOTAL_HOLD');
 for(const c of manifest.expectedDelta.filter(e=>e.path.endsWith('.cs'))){if(/CC001_PHOENIX_DIAGNOSTIC|PhoenixDiagnostic/.test(get(c.path)))throw Error('DIAGNOSTIC_DEFINE '+c.path);}
 return {verdict:'PASS_EXACT_SOURCE_ONLY',nativeWindows:'NOT_ATTESTED',g3:'NOT_ATTESTED',qaRef:QA_REF,qaSha:QA,qaTree:manifest.qaTree,changedFiles:out.changes,originalMeta:out.immutableMeta,newMeta:out.newMeta,totalUniqueGuids:90};
}
if(require.main===module){try{console.log(JSON.stringify(run(process.argv.slice(2)),null,2));}catch(e){console.error('A71_W12_SOURCE_HOLD: '+e.message);process.exitCode=2;}}
module.exports={RC1,QA,QA_REF,MANIFEST_BLOB,blobHash,readManifest,parseLsTree,checkTrees,requireFrozenRef,uniqueUnityGuids,parseArgs,run};
