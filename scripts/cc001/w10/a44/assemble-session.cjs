'use strict';
// A44 W10: Offline real-operator session evidence; never grants QA or release PASS.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const SHA = /^[a-f0-9]{64}$/;
const SCENARIOS = new Set(['CONNECT', 'MOVING_SYNC', 'LOCAL_TURN', 'P2_AIM', 'P2_PERSPECTIVE', 'POWER_BAR', 'MATCH_END']);
const STATUSES = new Set(['OBSERVED_OK', 'ISSUE', 'NOT_RUN']);
const CLASSES = Object.freeze({
  SYNC_TELEPORT: 'A31', NETWORK_LAG: 'A31', PHYSICS: 'A31',
  TURN_IDENTITY: 'A20', AIM_ARROW: 'A20', CAMERA_P2: 'A20',
  PRESENTATION: 'A33', PERFORMANCE: 'A34', POWER_METER: 'A10',
  OTHER: 'A60'
});
const LEVELS = new Set(['LOW', 'MEDIUM', 'HIGH']);
function assert(ok, code) { if (!ok) throw new Error(code); }
function recordJson(file) {
  const raw = fs.readFileSync(file);
  assert(raw.length > 0 && raw.length <= 1024 * 1024, 'INVALID_JSON_SIZE');
  return JSON.parse(raw.toString('utf8'));
}
function clean(text, max = 1200) {
  assert(typeof text === 'string' && text.length <= max, 'BAD_TEXT_LENGTH');
  return text
    .replace(/https?:\/\/[^\s"'<>]+/gi, '[URL_REDACTED]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL_REDACTED]')
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP_REDACTED]')
    .replace(/\b((?:token|password|secret|authorization|api_key|join_code)\s*[:=]\s*)([^\s,;]+)/gi, '$1[REDACTED]');
}
function iso(t) { return typeof t === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(t) && !Number.isNaN(Date.parse(t)); }
function verifyPack(dir, data) {
  assert(data?.schemaVersion === 1 && data.project === 'CC-001' && data.agent === 'A44', 'WRONG_PACK_IDENTITY');
  assert(data.evidenceStatus === 'CAPTURED_UNVERIFIED_BY_A60', 'UNEXPECTED_PACK_STATUS');
  assert(data.pc1?.seatClaim === 'P1' && data.pc2?.seatClaim === 'P2', 'INVALID_SEAT_CLAIMS');
  for (const [seat, name] of [['pc1','PC1_Player.redacted.log'], ['pc2','PC2_Player.redacted.log']]) {
    const desc = data[seat].log;
    assert(desc?.file === name && SHA.test(desc.sanitizedSha256) && SHA.test(desc.originalSha256), 'BAD_LOG_DESCRIPTOR');
    const file = path.join(dir, name);
    const st = fs.lstatSync(file);
    assert(st.isFile() && !st.isSymbolicLink() && st.size === desc.sanitizedBytes && st.size > 0, 'LOG_FILE_INVALID');
    assert(sha(fs.readFileSync(file)) === desc.sanitizedSha256, 'SANITIZED_LOG_TAMPERED');
  }
}
function validateObservation(raw, sessionId) {
  assert(raw?.schemaVersion === 1 && raw.sessionId === sessionId, 'SESSION_ID_MISMATCH');
  assert(iso(raw.startedAtUtc) && iso(raw.endedAtUtc) && Date.parse(raw.endedAtUtc) >= Date.parse(raw.startedAtUtc), 'INVALID_SESSION_TIME');
  assert(raw.topology === 'PRIVATE_LAN' && raw.environment === 'LOCAL_WINDOWS_TWO_PC', 'UNAPPROVED_TOPOLOGY');
  for (const p of ['pc1', 'pc2']) {
    assert(raw[p]?.deviceClass === 'WINDOWS_DESKTOP', 'DEVICE_IDENTITY_REQUIRED');
    assert(/^\d{3,5}x\d{3,5}$/.test(raw[p].screenResolution||''), 'INVALID_SCREEN');
    assert(['HOST','CLIENT'].includes(raw[p].role) && raw[p].role === (p === 'pc1'?'HOST':'CLIENT'), 'INVALID_DEVICE_ROLE');
  }
  assert(Array.isArray(raw.scenarios) && raw.scenarios.length > 0 && raw.scenarios.length <= SCENARIOS.size, 'SCENARIOS_REQUIRED');
  const ids = new Set();
  const scenarios = raw.scenarios.map(s => {
    assert(SCENARIOS.has(s.id) && !ids.has(s.id), 'UNKNOWN_OR_DUPLICATE_SCENARIO'); ids.add(s.id);
    assert(STATUSES.has(s.status), 'INVALID_SCENARIO_STATUS');
    assert(s.status !== 'ISSUE' || (typeof s.note === 'string' && s.note.trim().length > 0), 'ISSUE_MISSING_OBSERVATION');
    return { id:s.id, status:s.status, note:clean(s.note || ''),
      observedAtUtc: iso(s.observedAtUtc) ? s.observedAtUtc : null };
  });
  assert(Array.isArray(raw.issues) && raw.issues.length <= 30, 'INVALID_ISSUES');
  const issues = raw.issues.map((i,index) => {
    assert(Object.hasOwn(CLASSES,i.category), 'UNKNOWN_ISSUE_CLASS');
    assert(LEVELS.has(i.priority) && LEVELS.has(i.risk) && ['SMALL','MEDIUM','LARGE'].includes(i.scope), 'INVALID_TRIAGE');
    assert(['PC1','PC2','BOTH'].includes(i.device), 'ISSUE_DEVICE_INVALID');
    assert(typeof i.expected === 'string' && i.expected.trim() && typeof i.actual === 'string' && i.actual.trim(), 'ISSUE_NEEDS_EXPECTED_ACTUAL');
    return { issueId: sessionId + '-I' + String(index+1).padStart(2,'0'),
      category:i.category, routeTo:CLASSES[i.category], device:i.device,
      priority:i.priority, risk:i.risk, scope:i.scope,
      expected:clean(i.expected), actual:clean(i.actual), reproduce:clean(i.reproduce||'') };
  });
  return { scenarios, issues,
    pc1:{deviceClass:raw.pc1.deviceClass,role:raw.pc1.role,screenResolution:raw.pc1.screenResolution},
    pc2:{deviceClass:raw.pc2.deviceClass,role:raw.pc2.role,screenResolution:raw.pc2.screenResolution},
    startedAtUtc:raw.startedAtUtc, endedAtUtc:raw.endedAtUtc, topology:raw.topology };
}
function create({ packDir, observations, out }) {
  assert(packDir && observations && out, 'REQUIRED_ARGUMENTS_MISSING');
  const dir = fs.realpathSync(packDir);
  const manifest = recordJson(path.join(dir,'evidence-manifest.json'));
  verifyPack(dir, manifest);
  const raw = recordJson(observations);
  const validated = validateObservation(raw,manifest.sessionId);
  const h = manifest.pc1.exe, c = manifest.pc2.exe;
  const bothExecutableHashes = /^[a-f0-9]{64}$/.test(h?.sha256||'') && /^[a-f0-9]{64}$/.test(c?.sha256||'');
  const result = {
    schemaVersion:1, project:'CC-001', wave:'R17-W10', agent:'A44',
    sessionId:manifest.sessionId, baselineCommitReference:manifest.baselineCommitReference,
    buildIdentity:{ pc1ExeSha256:h?.sha256||null, pc2ExeSha256:c?.sha256||null,
      pairExeByteIdentity:bothExecutableHashes ? (h.sha256===c.sha256?'MATCHED':'MISMATCHED'):'UNVERIFIED',
      a72CertifiedBuildBinding:'REQUIRES_A72_MANIFEST' },
    devices:{pc1:validated.pc1,pc2:validated.pc2},
    startedAtUtc:validated.startedAtUtc, endedAtUtc:validated.endedAtUtc,
    topology:validated.topology,
    evidence:{pc1LogSha256:manifest.pc1.log.sanitizedSha256,pc2LogSha256:manifest.pc2.log.sanitizedSha256,
      originalPc1Sha256:manifest.pc1.log.originalSha256,originalPc2Sha256:manifest.pc2.log.originalSha256},
    scenarios:validated.scenarios, issues:validated.issues,
    qaDisposition:'PENDING_INDEPENDENT_A60_PHYSICAL_QA',
    defectFixClaims:'NONE', operatorPrivacyReviewRequired:true,
    warnings:['Operator-entered scenario statuses are subjective; cannot prove physics/snapshot parity.',
      'Snapshot revision/turn parity requires separate verified A31/A42 traces.',
      'No automatic pass, integration, build verification or release authority.']
  };
  const destination = path.resolve(out);
  assert(!fs.existsSync(destination),'OUTPUT_EXISTS');
  assert(fs.existsSync(path.dirname(destination)), 'OUTPUT_DIRECTORY_MISSING');
  fs.writeFileSync(destination, JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
  return result;
}
function cli(argv) {
  const map={'--pack':'packDir','--observations':'observations','--out':'out'};
  const options={};
  for(let i=0;i<argv.length;i+=2){
    assert(map[argv[i]] && argv[i+1] && !argv[i+1].startsWith('--'),'INVALID_FLAG');
    assert(!(map[argv[i]] in options),'DUPLICATE_FLAG');options[map[argv[i]]]=argv[i+1];
  }
  return options;
}
module.exports={create,cli,verifyPack,validateObservation,clean};
if(require.main===module) {
  try {const result=create(cli(process.argv.slice(2)));
    process.stdout.write('A44_W10_RECORDED_UNVERIFIED '+result.sessionId+' issues='+result.issues.length+'\n');
  }catch(e){process.stderr.write('A44_W10_REJECT '+e.message+'\n');process.exitCode=2;}
}