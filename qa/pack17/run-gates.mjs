#!/usr/bin/env node
/** Pack 17 explicit release gate. Does not install, migrate production or deploy.
 * Invoke from repo root: node qa/pack17/run-gates.mjs --static|--integration|--full
 * Database tests call the repo's existing safe-reset helper, which refuses non-test URLs.
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { URL } from 'node:url';
const mode=process.argv[2]??'--static';
const supported=new Set(['--static','--integration','--full']);
if(!supported.has(mode)){console.error('Usage: node qa/pack17/run-gates.mjs --static|--integration|--full');process.exit(2);}
if(!existsSync('pnpm-workspace.yaml')||!existsSync('artifacts/api-server/package.json')){
  console.error('BLOCKED: invoke in tournament monorepo root');process.exit(2);
}
const run=(name,cmd,args)=>{
  console.log(`\n>>> GATE ${name}`);
  const result=spawnSync(cmd,args,{stdio:'inherit',shell:process.platform==='win32',env:process.env});
  if(result.error||result.status!==0){console.error(`BLOCKED: ${name} failed`,result.error?.message??`exit ${result.status}`);process.exit(result.status||1);}
  console.log(`PASS ${name}`);
};
const pnpm=(name,...args)=>run(name,'pnpm',args);
run('source contracts','node',['--test','qa/pack17/source-contract.test.mjs']);
if(mode==='--static'){
 console.log('STATIC GATE PASS. DATABASE / FULL BUILD NOT EXECUTED. Release remains BLOCKED.');
 process.exit(0);
}
const url=process.env.TEST_DATABASE_URL;
if(process.env.TEST_DATABASE_RESET!=='DROP_TM_TEST_SCHEMA'||!url){
 console.error('BLOCKED: require TEST_DATABASE_URL and TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA');process.exit(2);
}
let parsed;
try{parsed=new URL(url);}catch{console.error('BLOCKED: invalid TEST_DATABASE_URL');process.exit(2);}
const schema=process.env.TEST_DATABASE_SCHEMA??'tm_test_access';
const databaseName=decodeURIComponent(parsed.pathname.replace(/^\//,''));
if(!['postgres:','postgresql:'].includes(parsed.protocol)||!databaseName.toLowerCase().includes('test')||
 `${parsed.hostname}/${databaseName}`.toLowerCase().includes('prod')||!/^tm_test_[a-z0-9_]+$/.test(schema)){
 console.error('BLOCKED: expected nonproduction PostgreSQL database whose name contains test, with isolated tm_test_* schema');process.exit(2);
}
// Test runner deliberately does not accept a URL on argv or print credentials.
pnpm('actual PostgreSQL atomic-correction suite','--filter','@workspace/api-server','exec','node','--import','tsx','--test','test/tournament-atomic-correction-postgresql.integration.test.ts');
if(mode==='--integration'){
 console.log('TARGETED PG INTEGRATION PASS. Full workspace/build/browser still needed. Release remains BLOCKED.');
 process.exit(0);
}
pnpm('full repository typecheck','run','typecheck');
pnpm('full API unit test suite','--filter','@workspace/api-server','run','test:unit');
pnpm('full API integration test suite','--filter','@workspace/api-server','run','test:integration');
pnpm('full frontend build','--filter','@workspace/tournament-manager','run','build');
console.log('CODE / PG GATES PASS. Manual browser QA and production release approval still required.');
