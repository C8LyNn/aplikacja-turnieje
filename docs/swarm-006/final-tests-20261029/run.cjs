const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const crypto=require('node:crypto');
const root='C:/Users/kubap/Desktop/SWARM006-Final-Tests-20261029';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const id=process.argv[2], cwd=path.resolve(root,process.argv[3]), args=process.argv.slice(4);
if(args.includes('--test')&&!args.some(x=>x.startsWith('--test-reporter')))args.splice(args.indexOf('--test')+1,0,'--test-reporter=tap');
if(!id||!args.length||id.includes('/')||id.includes('\\'))throw Error('Usage: run.cjs ID REL_CWD NODE_ARGS...');
const log=path.join(__dirname,id+'.log'), receipt=path.join(__dirname,id+'.json');
if(fs.existsSync(log)||fs.existsSync(receipt))throw Error('Evidence ID exists');
const env={...process.env};
const removed=[];
for(const k of Object.keys(env))if(/DATABASE|^PG|NEON|REPLIT|SESSION_SECRET|^DEPLOYMENT|^EXPECTED_|TOKEN|SECRET|PASSWORD|^NODE_OPTIONS$|^TSX_/.test(k.toUpperCase())){removed.push(k);delete env[k];}
env.NODE_ENV='test';env.NODE_OPTIONS='--require='+path.join(__dirname,'network-guard.cjs');
env.TSX_TSCONFIG_PATH=path.join(root,'artifacts/tournament-manager/test/tsconfig.json');
env.XDG_CACHE_HOME=path.join(__dirname,'cache');env.TSX_DISABLE_CACHE='1';
const source=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const diff=cp.execFileSync('git',['diff','--binary','HEAD'],{cwd:root});
const start=new Date().toISOString();
const r=cp.spawnSync(process.execPath,args,{cwd,env,encoding:'utf8',timeout:300000,maxBuffer:30*1024*1024,windowsHide:true});
const output=(r.stdout??'')+(r.stderr??'')+(r.error?'\nRUNNER_ERROR '+r.error+'\n':'');
fs.writeFileSync(log,output);
const counts={};for(const k of ['tests','suites','pass','fail','cancelled','skipped','todo']){const matches=[...output.matchAll(new RegExp('^(?:#|ℹ) '+k+' (\\d+)','gm'))];counts[k]=matches.length?Number(matches.at(-1)[1]):null;}
const data={id,source_commit:source,tracked_diff_sha256:sha(diff),cwd,executable:process.execPath,args,command:['node',...args].join(' '),platform:process.platform,arch:process.arch,node:process.version,started_utc:start,finished_utc:new Date().toISOString(),status:r.status,signal:r.signal,error:r.error?.message??null,counts,log_file:path.basename(log),log_sha256:sha(fs.readFileSync(log)),guard_sha256:sha(fs.readFileSync(path.join(__dirname,'network-guard.cjs'))),environment:{NODE_ENV:env.NODE_ENV,TSX_TSCONFIG_PATH:env.TSX_TSCONFIG_PATH,NODE_OPTIONS:env.NODE_OPTIONS,removed_variable_names:removed}};
fs.writeFileSync(receipt,JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify(data));console.log(output.split('\n').slice(-12).join('\n'));
process.exitCode=r.status??1;
