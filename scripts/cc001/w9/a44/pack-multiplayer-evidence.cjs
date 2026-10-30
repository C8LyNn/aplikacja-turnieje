'use strict';
// A44: OFFLINE-only Windows PC1/PC2 evidence collection. No Unity/build/network mutation.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const MAX_LOG_BYTES = 32 * 1024 * 1024;
const BASELINE_RC1 = '10f64e4d213f17a352ed8fa83bc75884a39549f0';
const SHA64 = /^[a-f0-9]{64}$/;

function sha(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }
function redact(text) {
  return text
    .replace(/https?:\/\/[^\s"'<>]+/gi, '[URL_REDACTED]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL_REDACTED]')
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP_REDACTED]')
    .replace(/\b(?:[a-f0-9]{1,4}:){2,7}[a-f0-9]{1,4}\b/gi, '[IPV6_REDACTED]')
    .replace(/([A-Z]:\\Users\\)[^\\\r\n]+/gi, '$1[USER]')
    .replace(/(\/home\/|\/Users\/)[^\/\r\n]+/g, '$1[USER]')
    .replace(/\b(authorization\s*:\s*bearer\s+)([^\s,;]+)/gi, 'Authorization: [REDACTED]')
    .replace(/\b((?:access_?token|session_?token|refresh_?token|token|bearer|auth(?:orization)?|password|secret|api_?key|join_?code)\s*[:=]\s*)([^\s,;]+)/gi, '$1[REDACTED]');
}
function readLog(filename) {
  const stats = fs.statSync(filename);
  if (!stats.isFile() || stats.size === 0 || stats.size > MAX_LOG_BYTES) {
    throw new Error('LOG_SIZE_INVALID: expected 1..' + MAX_LOG_BYTES + ' bytes');
  }
  const raw = fs.readFileSync(filename);
  if (raw.includes(0)) throw new Error('NON_TEXT_LOG');
  const cleaned = Buffer.from(redact(raw.toString('utf8')), 'utf8');
  return { originalSha256: sha(raw), originalBytes: raw.length,
    sanitizedSha256: sha(cleaned), sanitizedBytes: cleaned.length, cleaned };
}
function readBinary(filename, expected) {
  if (!filename) return { status: 'NOT_PROVIDED' };
  const st = fs.statSync(filename);
  if (!st.isFile() || !st.size) throw new Error('INVALID_EXE_FILE');
  const digest = sha(fs.readFileSync(filename));
  if (expected && digest !== expected) throw new Error('BUILD_SHA_MISMATCH');
  return { status: expected ? 'MATCHES_OPERATOR_EXPECTATION' : 'HASHED_NOT_CERTIFIED',
    sha256: digest, bytes: st.size };
}
function capture(options) {
  const { host, client, out, session, hostExe, clientExe, expectedExeSha } = options;
  if (!host || !client || !out || !session) throw new Error('MISSING_REQUIRED_ARGUMENT');
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/.test(session)) throw new Error('INVALID_SESSION_ID');
  if (expectedExeSha && !SHA64.test(expectedExeSha)) throw new Error('INVALID_EXPECTED_SHA');
  if (expectedExeSha && (!hostExe || !clientExe)) throw new Error('BOTH_EXE_FILES_REQUIRED');
  if (fs.realpathSync(host) === fs.realpathSync(client)) throw new Error('DUPLICATE_LOG_SOURCE');
  const dest = path.resolve(out);
  if (fs.existsSync(dest)) throw new Error('OUTPUT_ALREADY_EXISTS');
  const pc1 = readLog(host), pc2 = readLog(client);
  const hBinary = readBinary(hostExe, expectedExeSha);
  const cBinary = readBinary(clientExe, expectedExeSha);
  const parent = path.dirname(dest);
  if (!fs.existsSync(parent)) throw new Error('OUTPUT_PARENT_MISSING');
  const manifest = {
    schemaVersion: 1, project: 'CC-001', task: 'R17-W9', agent: 'A44',
    baselineCommitReference: BASELINE_RC1, baselineIsClaimNotProof: true,
    sessionId: session, capturedAtUtc: new Date().toISOString(),
    environment: 'PRIVATE_LAN_OFFLINE_COLLECTION', releaseChannel: 'INTERNAL_TEST',
    evidenceStatus: 'CAPTURED_UNVERIFIED_BY_A60',
    pc1: { roleClaim: 'HOST', seatClaim: 'P1', deviceClass: 'WINDOWS_DESKTOP',
      log: { file: 'PC1_Player.redacted.log', originalSha256: pc1.originalSha256,
        originalBytes: pc1.originalBytes, sanitizedSha256: pc1.sanitizedSha256,
        sanitizedBytes: pc1.sanitizedBytes }, exe: hBinary },
    pc2: { roleClaim: 'CLIENT', seatClaim: 'P2', deviceClass: 'WINDOWS_DESKTOP',
      log: { file: 'PC2_Player.redacted.log', originalSha256: pc2.originalSha256,
        originalBytes: pc2.originalBytes, sanitizedSha256: pc2.sanitizedSha256,
        sanitizedBytes: pc2.sanitizedBytes }, exe: cBinary },
    caveats: ['Role/seat labels are operator claims, not game-authoritative identity.',
      'Original logs remain on source PCs; SHA values are not proof of certified build.',
      'Redaction is best-effort: manually inspect outputs before sharing.',
      'A31 analyzer produces diagnostic signals, not G3 PASS; A60 verifies independently.']
  };
  const temp = fs.mkdtempSync(path.join(parent, '.cc001-a44-'));
  try {
    fs.writeFileSync(path.join(temp, 'PC1_Player.redacted.log'), pc1.cleaned, { flag: 'wx' });
    fs.writeFileSync(path.join(temp, 'PC2_Player.redacted.log'), pc2.cleaned, { flag: 'wx' });
    fs.writeFileSync(path.join(temp, 'evidence-manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
    fs.renameSync(temp, dest);
  } catch (error) { fs.rmSync(temp, { recursive: true, force: true }); throw error; }
  return manifest;
}
function parseArgs(argv) {
  const parsed = {};
  const aliases = { '--host': 'host', '--client': 'client', '--out': 'out',
    '--session': 'session', '--host-exe': 'hostExe', '--client-exe': 'clientExe',
    '--expected-exe-sha': 'expectedExeSha' };
  for (let i = 0; i < argv.length; i += 2) {
    if (!aliases[argv[i]] || i + 1 >= argv.length || argv[i + 1].startsWith('--')) {
      throw new Error('INVALID_ARGUMENT: ' + argv[i]);
    }
    if (Object.prototype.hasOwnProperty.call(parsed, aliases[argv[i]])) throw new Error('DUPLICATE_ARGUMENT');
    parsed[aliases[argv[i]]] = argv[i + 1];
  }
  return parsed;
}
module.exports = { capture, redact, readLog, parseArgs, sha };
if (require.main === module) {
  try {
    const result = capture(parseArgs(process.argv.slice(2)));
    process.stdout.write('A44_CAPTURED_UNVERIFIED ' + result.sessionId + '\n');
    process.stdout.write('A31 INPUT: --host <out>/PC1_Player.redacted.log --client <out>/PC2_Player.redacted.log\n');
  } catch (error) {
    process.stderr.write('A44_CAPTURE_FAILED ' + error.message + '\n');
    process.exitCode = 2;
  }
}
