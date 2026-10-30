'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const QA='3f972cdbaea6289a7e33ce608f5d3256cfdab0a3';
const PROJECT='unity/cc001-r16/CoreClash-V149-Unity/';
const riskDirs=['Assets','Packages','ProjectSettings','Tests','BuildTools'].map(p=>PROJECT+p);
const valid=p=>typeof p==='string'&&p.length>0&&!p.startsWith('/')&&!p.includes('\\')&&!/[\0\r\n*?\[\]{}]/.test(p)&&p.split('/').every(s=>s&&s!=='.'&&s!=='..');
const gitBlob=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
function verifyFrozenCheckout(root,entries,opts={}){
 if(!Array.isArray(entries)||!entries.length)throw Error('MISSING_FROZEN_TREE_ENTRIES');
 const expected=opts.expectedSha||QA;
 if(!/^[0-9a-f]{40}$/.test(expected))throw Error('INVALID_EXPECTED_HEAD');
 const cwd=path.resolve(root),git=args=>execFileSync('git',args,{cwd,encoding:null,maxBuffer:64*1024*1024});
 const top=path.resolve(git(['rev-parse','--show-toplevel']).toString('utf8').trim());
 if(top!==cwd)throw Error('ROOT_NOT_GIT_TOP_LEVEL');
 const head=git(['rev-parse','--verify','HEAD^{commit}']).toString('utf8').trim();
 if(head!==expected)throw Error('WORKTREE_HEAD_NOT_FROZEN');
 const dirty=git(['status','--porcelain=v1','-z','--untracked-files=all','--ignore-submodules=none']);
 if(dirty.length)throw Error('WORKTREE_DIRTY_OR_UNTRACKED');
 const ignored=git(['ls-files','--others','--ignored','--exclude-standard','-z','--',...riskDirs]);
 if(ignored.length)throw Error('IGNORED_UNITY_SOURCE_PRESENT');
 const flags=git(['ls-files','-v','-z']).toString('utf8').split('\0').filter(Boolean);
 if(flags.some(x=>/^(?:S|[a-z]) /.test(x)))throw Error('INDEX_SKIP_OR_ASSUME_UNCHANGED');
 let byteCount=0;
 const seen=new Set();
 for(const entry of entries){
  const p=entry.path;
  if(!valid(p)||!/^[0-9a-f]{40}$/.test(entry.sha)||!['100644','100755'].includes(entry.mode)||seen.has(p))throw Error('INVALID_FROZEN_ENTRY');
  seen.add(p);
  const full=path.join(top,p);
  const real=fs.realpathSync(full);
  if(!real.startsWith(top+path.sep))throw Error('PATH_ESCAPES_CHECKOUT: '+p);
  const stat=fs.lstatSync(full);
  if(!stat.isFile()||stat.isSymbolicLink())throw Error('NONREGULAR_CHECKOUT_FILE: '+p);
  if(process.platform!=='win32'&&((stat.mode&0o111)!==0)!==(entry.mode==='100755'))throw Error('CHECKOUT_MODE_MISMATCH: '+p);
  const data=fs.readFileSync(full);
  if(gitBlob(data)!==entry.sha)throw Error('CHECKOUT_BYTES_NOT_FROZEN: '+p);
  byteCount+=data.length;
 }
 return {verdict:'PASS_CLEAN_FROZEN_WORKTREE_ONLY',sourceSha:expected,checkedFiles:entries.length,hashedBytes:byteCount,nativeWindows:'NOT_ATTESTED',pc1pc2:'NOT_ATTESTED'};
}
module.exports={QA,PROJECT,gitBlob,verifyFrozenCheckout};
