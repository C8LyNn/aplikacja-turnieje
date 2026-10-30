#!/usr/bin/env node
'use strict';
// A74: strictly read-only fail-closed admission for A44's OFFLINE PC1/PC2 evidence bundle.
// A PASS only bounds the listed leak patterns and file-integrity checks. Not G3/G4 QA.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const net = require('node:net');
const {TextDecoder} = require('node:util');
const MAX_LOG = 32 * 1024 * 1024;
const MAX_MANIFEST = 128 * 1024;
const EXPECTED = Object.freeze(['PC1_Player.redacted.log', 'PC2_Player.redacted.log']);
const HEX = /^[0-9a-f]{64}$/i;
const categories = Object.freeze([
 ['CREDENTIAL_ASSIGNMENT', /\b(?:access[_-]?token|id[_-]?token|refresh[_-]?token|session[_-]?token|auth(?:orization)?|api[_-]?key|password|passwd|secret|join[_-]?code|invite[_-]?code|bearer|token)\s*[:=]\s*(?!\[(?:REDACTED|TOKEN_REDACTED|SECRET_REDACTED)\](?=$|[\s,;]))(?:["']?)([^\s,;"']+)/i],
 ['BEARER_AUTH', /\bBearer\s+(?!\[REDACTED\](?=$|[\s,;]))(?:\[REDACTED\][^\s,;]+|[A-Za-z0-9._~+\/-]{10,})/i],
 ['GITHUB_TOKEN', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b/i],
 ['OPENAI_LIKE', /\bsk-(?:proj-)?[A-Za-z0-9_-]{25,}\b/i],
 ['EMAIL_ADDRESS', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
 ['WEB_URL', /\b(?:https?|wss?):\/\/[^\s<>]+/i],
 ['UNC_SHARE_PATH', /\\\\[A-Za-z0-9][A-Za-z0-9._-]*\\[^\s\\]+/i],
 ['WINDOWS_USER_PATH', /\b[A-Za-z]:\\(?:Users|Documents and Settings)\\(?!\[USER\](?=\\|\s|$))[^\s\\]+/i],
 ['UNIX_USER_PATH', /\/(?:home|Users)\/(?!\[USER\]\/)[^\s/]+\//i],
 ['IPV4_ADDRESS', /\b(?:\d{1,3}\.){3}\d{1,3}\b/]
]);
function sha(b) {return crypto.createHash('sha256').update(b).digest('hex');}
function hard(code) {let e=new Error(code);e.kind='HOLD';throw e;}
function secureRead(dir,name,cap) {
  if (!EXPECTED.includes(name) && name !== 'evidence-manifest.json') hard('UNEXPECTED_ENTRY_NAME');
  let st;
  try {st=fs.lstatSync(path.join(dir,name));} catch {hard('MISSING_BUNDLE_FILE');}
  if (!st.isFile() || st.isSymbolicLink() || st.size<1 || st.size>cap) hard('NONREGULAR_OR_OVERSIZE');
  let data;try {data=fs.readFileSync(path.join(dir,name),{flag:'r'});}catch{hard('UNREADABLE_INPUT');}
  if (data.length!==st.size) hard('INPUT_CHANGED_DURING_READ');
  return data;
}
function safeText(data) {
  if (data.includes(0)) hard('BINARY_LOG');
  try {return new TextDecoder('utf-8',{fatal:true}).decode(data);}catch{hard('INVALID_UTF8');}
}
function scan(text) {
  const findings=[];
  const lines=text.split(/\r?\n/);
  for(let i=0;i<lines.length;i++){
    const line=lines[i];
    const classes=categories.filter(([,re])=>re.test(line)).map(([name])=>name);
    // IPv6: only report when token is a validated IPv6 address (avoid HH:MM:SS timestamps).
    for(const candidate of line.match(/\[?[0-9A-Fa-f:]{3,}(?:%[0-9a-z]+)?\]?/g)||[]){
      const cleaned=candidate.replace(/^\[|\]$/g,'').split('%')[0];
      if(net.isIP(cleaned)===6 && !classes.includes('IPV6_ADDRESS'))classes.push('IPV6_ADDRESS');
    }
    for(const type of classes) findings.push({line:i+1,category:type});
    if(findings.length>=32)break;
  }
  return {scannedLines:lines.length,findings,limitReached:findings.length>=32};
}
function inspect(dir) {
  if(typeof dir!=='string'||!dir)hard('MISSING_BUNDLE_DIR');
  let d,st,names;
  try {d=fs.realpathSync(dir);st=fs.lstatSync(dir);names=fs.readdirSync(d);}catch{hard('UNREADABLE_BUNDLE_DIR');}
  if(!st.isDirectory()||st.isSymbolicLink())hard('INVALID_BUNDLE_DIR');
  if(names.length!==3||names.some(n=>!EXPECTED.includes(n)&&n!=='evidence-manifest.json'))hard('UNEXPECTED_BUNDLE_CONTENTS');
  const manifestBytes=secureRead(d,'evidence-manifest.json',MAX_MANIFEST);
  let m;try{m=JSON.parse(safeText(manifestBytes));}catch{hard('INVALID_MANIFEST');}
  if(m.schemaVersion!==1||m.project!=='CC-001'||m.evidenceStatus!=='CAPTURED_UNVERIFIED_BY_A60')hard('INVALID_MANIFEST_CONTRACT');
  const result={schema:'CC001-W11-A74-A44-BUNDLE-GATE-V1',status:'PASS_BOUNDED_SCAN_NOT_QA',
    sourceEvidenceStatus:'CAPTURED_UNVERIFIED_BY_A60',manifestSha256:sha(manifestBytes),
    peers:[],findings:[],warnings:['Manual privacy review and independent A60 QA still required; not G3/G4 PASS.']};
  for(const [index,key] of ['pc1','pc2'].entries()) {
    const expected=EXPECTED[index],info=m[key]?.log;
    if(!info||info.file!==expected||!HEX.test(info.sanitizedSha256||'')||!Number.isSafeInteger(info.sanitizedBytes)||info.sanitizedBytes<1)hard('MANIFEST_PATH_OR_DIGEST_INVALID');
    const bytes=secureRead(d,expected,MAX_LOG);
    if(sha(bytes).toLowerCase()!==info.sanitizedSha256.toLowerCase()||bytes.length!==info.sanitizedBytes)hard('SANITIZED_HASH_OR_SIZE_MISMATCH');
    const scanned=scan(safeText(bytes));
    result.peers.push({role:key,bytes:bytes.length,sha256:sha(bytes),lines:scanned.scannedLines});
    for(const f of scanned.findings)result.findings.push({role:key,...f});
    if(scanned.limitReached)result.warnings.push(key+': find cap reached; all original log lines must still undergo manual review.');
  }
  if(result.peers[0].sha256===result.peers[1].sha256)hard('DUPLICATE_PEER_LOG_CONTENT');
  if(result.findings.length)result.status='FAIL_SENSITIVE_PATTERN';
  return result;
}
function main(argv) {
  if(argv.length===1&&(argv[0]==='--help'||argv[0]==='-h')){
    process.stdout.write('Usage: node evidence-gate.cjs --bundle <A44-private-output-dir>\nRead-only. Exit 0 bounded pass, 2 integrity HOLD, 3 sensitive-pattern FAIL. Never share raw/redacted logs publicly.\n');return 0;
  }
  if(argv.length!==2||argv[0]!=='--bundle')hard('USAGE_EXPECTED_BUNDLE');
  const result=inspect(argv[1]);
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  return result.status==='FAIL_SENSITIVE_PATTERN'?3:0;
}
if(require.main===module){try{process.exitCode=main(process.argv.slice(2));}
catch(e){process.stderr.write('A74_GATE_HOLD '+(e.kind==='HOLD'?e.message:'INTERNAL_ERROR')+'\n');process.exitCode=2;}}
module.exports={sha,scan,inspect,main};
