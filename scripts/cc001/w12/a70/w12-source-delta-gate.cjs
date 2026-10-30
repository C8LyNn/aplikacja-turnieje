#!/usr/bin/env node
'use strict';
// A70 W12: offline Git source separation gate. Source verification is NEVER a G3 verdict.
const cp=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const RC1='10f64e4d213f17a352ed8fa83bc75884a39549f0';
const W11='3f972cdbaea6289a7e33ce608f5d3256cfdab0a3';
const FROZEN='refs/heads/integration/cc001-r17-w11-qa-freeze-20261030';
const SHA=/^[0-9a-f]{40}$/;
function git(repo,args){const p=cp.spawnSync('git',['-C',repo,...args],{encoding:'utf8',maxBuffer:8*1024*1024});if(p.status!==0)throw Error('GIT_'+args[0]+'_FAILED: '+(p.stderr||'exit='+p.status).trim());return p.stdout.trimEnd();}
function rows(raw){if(!raw)return [];return raw.split('\n').filter(Boolean).map(line=>{const parts=line.split('\t');if(parts.length!==2)throw Error('INVALID_GIT_DIFF_FORMAT');return{status:parts[0],path:parts[1]};});}
function safePath(p){return !!p&&!p.startsWith('/')&&!p.includes('\\')&&!p.split('/').some(s=>s==='..'||!s)&&!/[\r\n\0]/.test(p);}
function protectedPath(p){return /(^|\/)(?:ProjectSettings|Packages|Reference|Evidence\/R16)(\/|$)/.test(p)||/\/Assets\/(?:CoreClash\/(?:Core|Physics|Data)|Resources\/Data)\//.test(p)||/(?:NgoWireProtocol\.cs|GameSimulation\.cs|CollisionResolver\.cs|catalog\.json|featured-decks\.json)$/.test(p)||/\.meta$/.test(p);}
function evaluate({freeze,rc1,dev,freezeDelta,devDelta}){
 const issues=[];
 if(freeze!==W11)issues.push('FREEZE_REF_DRIFT');
 if(rc1!==RC1)issues.push('RC1_REF_DRIFT');
 if(!SHA.test(dev||''))issues.push('INVALID_DEV_SHA');
 if(!Array.isArray(freezeDelta)||freezeDelta.length!==22)issues.push('FREEZE_DIFF_NOT_22_PATHS');
 if(Array.isArray(freezeDelta))for(const f of freezeDelta){if(!safePath(f.path)||!['A','M'].includes(f.status))issues.push('BAD_FREEZE_DIFF');if(protectedPath(f.path)&&f.status!=='A')issues.push('PROTECTED_CHANGE_IN_FREEZE');if(f.path.endsWith('.meta')&&f.status==='A'&&!f.path.endsWith('.cs.meta'))issues.push('UNEXPECTED_NEW_META');}
 if(!Array.isArray(devDelta))issues.push('NO_DEV_DIFF');
 else for(const f of devDelta){if(!safePath(f.path)||!['A','M','D'].includes(f.status))issues.push('BAD_DEV_DIFF');}
 const ok=issues.length===0;
 return{schema:'CC001_R17_W12_A70_SOURCE_SEPARATION_V1',freezeSha:W11,rc1Sha:RC1,devSha:dev,freezePathCount:freezeDelta?.length??null,devChanges:devDelta||[],sourceLock:ok?'PASS_SOURCE_ONLY':'HOLD',w11NativeBuild:'NOT_ATTESTED',twoPcG3:'NOT_ATTESTED',devPromotion:'HOLD_UNTIL_W11_CLOSED',issues:[...new Set(issues)]};
}
function inspect(repo,dev){
 if(!fs.statSync(repo).isDirectory())throw Error('NOT_DIRECTORY');
 if(!SHA.test(dev))throw Error('INVALID_DEV_SHA');
 const freeze=git(repo,['rev-parse','--verify',FROZEN]);
 const rc1=git(repo,['rev-parse','--verify','refs/heads/integration/cc001-r17-w8-phoenix-rc1']);
 if(![freeze,rc1].every(s=>SHA.test(s)))throw Error('REF_NOT_SHA');
 // Only ancestry is checked: this is NOT a compilation or approval of dev code.
 const ancestor=(a,b)=>cp.spawnSync('git',['-C',repo,'merge-base','--is-ancestor',a,b],{encoding:'utf8'}).status===0;
 const exists=git(repo,['cat-file','-t',dev])==='commit';
 if(!exists||!ancestor(RC1,W11)||!ancestor(W11,dev))throw Error('UNRELATED_OR_MISSING_DEV_COMMIT');
 const freezeDelta=rows(git(repo,['diff','--no-renames','--name-status',RC1,W11]));
 const devDelta=rows(git(repo,['diff','--no-renames','--name-status',W11,dev]));
 return evaluate({freeze,rc1,dev,freezeDelta,devDelta});
}
function main(argv){const args=Object.fromEntries(argv.map(s=>s.replace(/^--/,'').split(/=(.*)/s).slice(0,2)));
 if(!args.repo||!args.dev){process.stderr.write('Usage: node w12-source-delta-gate.cjs --repo=PATH --dev=EXACT40SHA\n');return 64;}
 try{const result=inspect(path.resolve(args.repo),args.dev);process.stdout.write(JSON.stringify(result,null,2)+'\n');return result.sourceLock==='PASS_SOURCE_ONLY'?0:2;}
 catch(e){process.stdout.write(JSON.stringify({schema:'CC001_R17_W12_A70_SOURCE_SEPARATION_V1',sourceLock:'HOLD',w11NativeBuild:'NOT_ATTESTED',twoPcG3:'NOT_ATTESTED',devPromotion:'HOLD_UNTIL_W11_CLOSED',error:e.message})+'\n');return 2;}}
if(require.main===module)process.exitCode=main(process.argv.slice(2));
module.exports={RC1,W11,FROZEN,safePath,protectedPath,evaluate,inspect,main};
