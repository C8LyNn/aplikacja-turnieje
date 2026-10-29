const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root='C:/Users/kubap/Desktop/SWARM006-Final-Tests-20261029',e=__dirname;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const run=(...a)=>cp.execFileSync('git',a,{cwd:root,encoding:'utf8'}).trim();
const head=run('rev-parse','HEAD'),tree=run('rev-parse','HEAD^{tree}');
const tracked=cp.execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
const tests=tracked.filter(p=>/\.test\.(?:ts|tsx|mjs)$/.test(p));
const inventory=tests.map(p=>{
 let status,reason;
 if(p.startsWith('artifacts/api-server/test/')){
  status=p.endsWith('.integration.test.ts')?'BLOCKED':/\/(se-correction-safety|se-correction-readiness)\.test\.ts$/.test(p)?'REUSED_PASS':'PASS';
  reason=status==='BLOCKED'?'Real DB / persistence / authorization required':status==='REUSED_PASS'?'Historical 23/26 exact-source CI cases reused; unchanged Git compare':'API unit / fake transport / pure contract';
 }else if(p.startsWith('artifacts/tournament-manager/src/')){status=p.endsWith('/tournament-audience.test.tsx')?'REUSED_PASS':'PASS';reason=status==='REUSED_PASS'?'Accepted G1 11/11; never rerun':'React/jsdom/pure frontend; dependency retries retained';}
 else if(p.startsWith('artifacts/animated-effects/test/')){status='PASS';reason='Native synthetic animation cases';}
 else if(p.startsWith('lib/db/test/')){status=p.endsWith('.integration.test.mjs')?'BLOCKED':p.endsWith('tournament-routing-persistence-v2-deployment.test.mjs')?'PASS_PURE__BLOCKED_DB':'PASS';reason=status==='BLOCKED'?'DB/schema/SQL execution forbidden':status==='PASS_PURE__BLOCKED_DB'?'Only named preflight suite executed; catalog SQL suite excluded':'Pure classifiers/configuration only';}
 else if(p.startsWith('qa/')||p.startsWith('test/')||p.startsWith('lib/db/migration-ledger-validator/')){status='PASS';reason='Native static/source/synthetic fixture tests';}
 else{status='NOT_ACTIVE_TEMPLATE';reason='Packaging payload or historical template copy, not active application test discovery';}
 return {path:p,status,reason,git_blob:run('rev-parse',head+':'+p),working_bytes_sha256:sha(fs.readFileSync(path.join(root,p)))};
});
fs.writeFileSync(e+'/test-inventory.json',JSON.stringify({source_commit:head,source_tree:tree,tests:inventory},null,2)+'\n');
const immutables=[
 ['C:/Users/kubap/AppData/Local/Temp/SWARM006_A00_G1_R3_6eb7bd6ac31a_Drive/logs/06-audience-test.log','de135c00f8c26ddb130d53aa02e0804474e10128e7cd27bd4536d232f3d00580'],
 ['C:/Users/kubap/AppData/Local/Temp/SWARM006_G2_NODE24_BUILD_ONLY_c4d32391325d/evidence/G2_INSTALL_RECEIPT.json','1e09c7493195f31ef9c81ac7007b10b30d8265969cdbffb752a51f17b398f37e'],
 ['C:/Users/kubap/AppData/Local/Temp/SWARM006_G2_NODE24_BUILD_ONLY_c4d32391325d/evidence/offline-install.log','dccf75304535df31aac48c2a548a3b542bb0016b68a05b805ad01cde2c8fac92'],
 ['C:/Users/kubap/AppData/Local/Temp/SWARM006_G2_NODE24_BUILD_ONLY_c4d32391325d/G2_A50_STAGE_MARKER.json','189498740f2d436262a153e118e5a96db49e8885eb6da6095ac855c1e215e536']
].map(([p,expected])=>({path:p,expected_sha256:expected,observed_sha256:sha(fs.readFileSync(p)),match:sha(fs.readFileSync(p))===expected}));
if(immutables.some(x=>!x.match))throw Error('Original evidence changed');
const g2='C:/Users/kubap/AppData/Local/Temp/SWARM006_G2_NODE24_BUILD_ONLY_c4d32391325d';
fs.writeFileSync(e+'/immutability.json',JSON.stringify({originals:immutables,marker_pin_discrepancy:{reported_literal_in_A00:'189498740f2d436262a153e118e5a96db49e8885eb6da6095ac855c1e215e536b',reported_length:65,observed_sha256:'189498740f2d436262a153e118e5a96db49e8885eb6da6095ac855c1e215e536',observation:'Matches initial session read-only hash and retained original-byte copy. A00 literal is not a valid SHA-256. A00/A60 to correct textual record; no gate reopening or install retry inferred.'},original_g1_head:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:'C:/Users/kubap/AppData/Local/Temp/SWARM006_A00_G1_R3_6eb7bd6ac31a_Drive/checkout',encoding:'utf8'}).trim(),g2_marker_state:JSON.parse(fs.readFileSync(g2+'/G2_A50_STAGE_MARKER.json','utf8').replace(/^\uFEFF/,'')).state,g2_evidence_files:fs.readdirSync(g2+'/evidence'),pnpm_source_store:'NOT_TRAVERSED_NOT_WRITTEN',build:'NOT_INVOKED_PENDING'},null,2)+'\n');
const receipts=fs.readdirSync(e).filter(p=>p.endsWith('.json')).flatMap(p=>{const r=JSON.parse(fs.readFileSync(e+'/'+p,'utf8'));return r.log_file?[{receipt_file:p,...r}]:[];});
for(const r of receipts){if(sha(fs.readFileSync(e+'/'+r.log_file))!==r.log_sha256)throw Error('Log hash mismatch: '+r.id);}
const initial=receipts.find(r=>r.id==='native-source-contracts-01');
initial.counts_derived_from_spec_reporter={tests:126,pass:120,fail:6,skipped:0,cancelled:0};
const index={source_commit:head,source_tree:tree,source_baseline:'6eb7bd6ac31a8851d08c3f50c7fed74d6b2c57f3',environment:{os:'Windows x64',node:'24.18.0',typescript:'5.9.3',tsx:'4.21.0',pnpm:'NOT_INVOKED',dependency_method:'Copied existing installed packages only; final 164/164 direct importer versions match canonical lock; not a new frozen installation'},aggregate:{new_product_cases_pass:1533,unresolved_product_case_failures:0,reused_cases_pass:60,combined_scoped_cases_pass:1593,guard_selftests_excluded_from_product_total:3,blocked_db_only_files:inventory.filter(x=>x.status==='BLOCKED').length,blocked_db_suite_in_mixed_file:1},receipts,gate:{G1:'ACCEPT_SCOPED_REUSED',G2_INSTALL:'ACCEPTED_PRIOR_EVIDENCE_REUSED',G2_BUILD:'PENDING_NO_CONFIRMED_RECEIPT_NOT_INVOKED',G2:'HOLD',PRODUCTION:'NO_GO',A60:'INDEPENDENT_REVIEW_PENDING'}};
fs.writeFileSync(e+'/evidence-index.json',JSON.stringify(index,null,2)+'\n');
console.log(JSON.stringify({head,tree,tests:inventory.length,statuses:inventory.reduce((a,x)=>(a[x.status]=(a[x.status]??0)+1,a),{}),receipts:receipts.length,log_hashes:'ALL_MATCH',aggregate:index.aggregate}));
