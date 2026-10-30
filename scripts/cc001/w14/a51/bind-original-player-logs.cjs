#!/usr/bin/env node
'use strict';
/**
 * CC-001 R17-W14 A51: bind an existing W12 A51 metadata verdict to the
 * exact bytes of two operator-supplied Player.log files. Uses the existing
 * W12/W13 validator, never parses gameplay or claims a common session,
 * authentic Windows binary, wire-state parity, G3, or G4.
 */
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const {assess, FREEZE_SHA} = require('../../w12/a51/freeze-trace-gate.cjs');
const MAX_FILE_BYTES = 128 * 1024 * 1024;

function args(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (!['--analysis','--source-sha','--pc1','--pc2','--out'].includes(key) ||
        Object.prototype.hasOwnProperty.call(opts,key)) throw Error('INVALID_ARGUMENTS');
    const val = argv[++i];
    if (!val || val.startsWith('--')) throw Error('INVALID_ARGUMENTS');
    opts[key] = val;
  }
  if (!opts['--analysis'] || !opts['--source-sha'] || !opts['--pc1'] || !opts['--pc2'])
    throw Error('MISSING_ORIGINAL_FILES');
  return opts;
}

// File identity, bounded streaming and before/after fstat reduce stale/mixed
// input; TOCTOU/host compromise are not solved by this offline verifier.
function hashLog(file) {
  if (!fs.lstatSync(file).isFile()) throw Error('INVALID_LOG_FILE');
  const fd = fs.openSync(file,'r');
  try {
    const before = fs.fstatSync(fd,{bigint:true});
    if (!before.isFile() || before.size === 0n ||
        before.size > BigInt(MAX_FILE_BYTES)) throw Error('INVALID_LOG_SIZE');
    const hash = crypto.createHash('sha256');
    const buf = Buffer.allocUnsafe(65536);
    let actual = 0;
    while (true) {
      const n = fs.readSync(fd,buf,0,buf.length,null);
      if (n === 0) break;
      actual += n;
      if (actual > MAX_FILE_BYTES) throw Error('INVALID_LOG_SIZE');
      hash.update(buf.subarray(0,n));
    }
    const after = fs.fstatSync(fd,{bigint:true});
    if (before.size !== after.size || BigInt(actual) !== before.size ||
        before.dev !== after.dev || before.ino !== after.ino ||
        before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs)
      throw Error('LOG_CHANGED_DURING_HASH');
    return {sha256:hash.digest('hex'),bytes:actual};
  } finally { fs.closeSync(fd); }
}
function verify(report, selectedSha, pc1, pc2) {
  const prior = assess(report,selectedSha);
  const reasons = [...prior.reasons];
  const add = code => { if (!reasons.includes(code)) reasons.push(code); };
  const identity1 = fs.realpathSync(pc1);
  const identity2 = fs.realpathSync(pc2);
  if (path.normalize(identity1) === path.normalize(identity2))
    add('SAME_ORIGINAL_LOG_PATH');
  const a = hashLog(pc1), b = hashLog(pc2);
  if (a.sha256 === b.sha256) add('IDENTICAL_ORIGINAL_LOG_BYTES');
  for (const [key, actual] of [['pc1',a],['pc2',b]]) {
    const claimed = prior.sourceLogs[key];
    if (!claimed || claimed.sha256 !== actual.sha256 || claimed.bytes !== actual.bytes)
      add(key.toUpperCase()+'_ORIGINAL_LOG_FINGERPRINT_MISMATCH');
  }
  const hard = reasons.some(code => code === 'SAME_ORIGINAL_LOG_PATH' ||
    code === 'IDENTICAL_ORIGINAL_LOG_BYTES' || code.endsWith('_ORIGINAL_LOG_FINGERPRINT_MISMATCH'));
  const status = hard ? 'FAIL_LOG_BYTE_PROVENANCE' :
    prior.status === 'FAIL_PROFILE_OR_TRACE' ? 'FAIL_PROFILE_OR_TRACE' :
    prior.status === 'HOLD_INCOMPLETE_TRACE' ? 'HOLD_INCOMPLETE_TRACE' :
    'LOG_FINGERPRINT_MATCHED_METADATA_ONLY';
  return {
    schema:'CC001_R17_W14_A51_ORIGINAL_LOG_BIND_V1',status,reasons,
    selectedSourceSha:prior.selectedSourceSha,requiredSourceSha:FREEZE_SHA,
    originalLogFingerprints:{pc1:a,pc2:b},
    guarantees:{originalLogBytes:'HASH_AND_SIZE_MATCH_REPORTED_FINGERPRINTS_ONLY',
      reportCountersDerivedFromLogs:'NOT_REVERIFIED_BY_THIS_GATE',
      sameRun:'NOT_ATTESTED',sameWindowsPlayer:'NOT_ATTESTED',
      stateParity:'NOT_PROVEN',visualSmoothness:'NOT_PROVEN',G3:'HOLD',G4:'HOLD',release:'STOP'}
  };
}
function main(argv) {
  try {
    const options = args(argv);
    const report=JSON.parse(fs.readFileSync(options['--analysis'],'utf8'));
    const result=verify(report,options['--source-sha'],options['--pc1'],options['--pc2']);
    const payload=JSON.stringify(result,null,2)+'\n';
    if (options['--out']) fs.writeFileSync(options['--out'],payload,{flag:'wx'});
    else process.stdout.write(payload);
    return result.status === 'LOG_FINGERPRINT_MATCHED_METADATA_ONLY' ? 0 :
      result.status.startsWith('FAIL_') ? 1 : 2;
  } catch (_) {
    // Never leak original path, raw log, IP, join token, or filesystem exception.
    process.stderr.write('A51_W14_ORIGINAL_LOG_INPUT_ERROR\n');
    return 2;
  }
}
module.exports={FREEZE_SHA,args,hashLog,verify,main,MAX_FILE_BYTES};
if (require.main === module) process.exitCode=main(process.argv.slice(2));
