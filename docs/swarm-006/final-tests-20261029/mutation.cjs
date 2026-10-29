const fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path'),crypto=require('node:crypto');
const root='C:/Users/kubap/Desktop/SWARM006-Final-Tests-20261029';
const route=root+'/artifacts/api-server/src/routes/tournament-se-correction-readiness.ts';
const original=fs.readFileSync(route);const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const changed=original.toString().replace('accessMode:"read only"','accessMode:"read write"');
if(changed===original.toString())throw Error('Mutation target absent');
let result;
try{
 fs.writeFileSync(route,changed);
 result=cp.spawnSync(process.execPath,[path.join(__dirname,'run.cjs'),'driver-contract-mutation-01','artifacts/api-server','--import','tsx','--test','test/se-readiness-transaction-contract.test.ts'],{stdio:'inherit',windowsHide:true});
 if(result.status!==1)throw Error('Mutation was not detected as expected');
}finally{
 fs.writeFileSync(route,original);
 fs.writeFileSync(path.join(__dirname,'mutation-restoration.json'),JSON.stringify({original_sha256:hash(original),restored_sha256:hash(fs.readFileSync(route)),mutation:'accessMode: read only => read write in disposable source only',expected_exit:1,actual_exit:result?.status},null,2));
}
