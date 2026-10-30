'use strict';
const fs = require('node:fs');

// Exact-state parity of matching revisions only. Not a visual, latency or G3 PASS.
const pattern = /CC_W11_STATE_(TX|RX)\s+revision=(\d+)\s+sha256=([0-9a-f]{64})\s+action=(\d+)\s+turn=([01])(?:\s|$)/;
function parse(raw, side) {
  const entries = new Map();
  for (const line of raw.split(/\r?\n/)) {
    if (!line.includes('CC_W11_STATE_')) continue;
    const hit = pattern.exec(line);
    if (!hit) throw Error('MALFORMED_STATE_TRACE');
    if (hit[1] !== side) throw Error('WRONG_TRACE_ROLE');
    const revision = Number(hit[2]), action = Number(hit[4]);
    if (!Number.isSafeInteger(revision) || revision < 1 ||
        !Number.isSafeInteger(action)) throw Error('INVALID_TRACE_COUNTER');
    const value = {digest:hit[3], action, turn:Number(hit[5])};
    const prior = entries.get(revision);
    if (prior && (prior.digest !== value.digest || prior.action !== value.action || prior.turn !== value.turn)) {
      throw Error('CONFLICTING_DUPLICATE_REVISION');
    }
    entries.set(revision,value);
  }
  return entries;
}
function compare(hostText,clientText) {
  const host=parse(hostText,'TX'),client=parse(clientText,'RX');
  const common=[...host.keys()].filter(x=>client.has(x)).sort((a,b)=>a-b);
  let mismatch=0;
  for(const rev of common){
    const a=host.get(rev),b=client.get(rev);
    if(a.digest!==b.digest || a.action!==b.action || a.turn!==b.turn)mismatch++;
  }
  return {
    status:mismatch ? 'FAIL' : common.length ? 'PASS_SCOPED' : 'HOLD',
    hostSamples:host.size,clientSamples:client.size,matchedRevisions:common.length,
    mismatches:mismatch,hostOnly:host.size-common.length,clientOnly:client.size-common.length
  };
}
function main(args){
  if(args.length!==4 || args[0]!=='--host' || args[2]!=='--client'){
    process.stderr.write('Usage: node state-parity.cjs --host PC1-Player.log --client PC2-Player.log\n');
    return 2;
  }
  try{
    const result=compare(fs.readFileSync(args[1],'utf8'),fs.readFileSync(args[3],'utf8'));
    process.stdout.write(JSON.stringify(result)+'\n');
    return result.status==='PASS_SCOPED' ? 0 : result.status==='FAIL' ? 1 : 2;
  }catch(error){process.stderr.write('STATE_PARITY_ERROR '+error.message+'\n');return 1;}
}
module.exports={parse,compare,main};
if(require.main===module)process.exitCode=main(process.argv.slice(2));
