/** WEB-005 C01 — DB-free, pure TAP failure triage.
 * Never emit complete raw integration stdout/stderr into shared CI logs.
 * Best-effort redaction cannot replace independent secret review.
 */
export function redactEvidence(value) {
  return String(value)
    .replace(/\u001b\[[0-9;]*[A-Za-z]/g, '')
    .replace(/\b[a-z][a-z0-9+.-]*:\/\/[^\s'"<>]+/gi, '[URL REDACTED]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]+/gi, 'Bearer [REDACTED]')
    .replace(/\b([A-Za-z_]*(?:PASSWORD|PASSWD|SECRET|TOKEN|API_KEY|ACCESS_KEY)[A-Za-z_]*)\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi, '$1=[REDACTED]')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .slice(0, 400);
}

/** Emit the first available failing TAP test, or an explicit unknown result.
 * Walk each stream once; summaries come from the last observed counters.
 * A nonzero child exit is never reclassified as success by this function.
 */
export function firstFailureEvidence(stdout, stderr) {
  const out = String(stdout ?? '');
  const err = String(stderr ?? '');
  const counters = Object.fromEntries(['tests','pass','fail','cancelled','skipped','todo'].map(k => [k,null]));
  let firstOut = null, firstErr = null, diagnosticOut = null, diagnosticErr = null;
  const tap = /^\s*not ok\s+\d+\s+-\s+\S/;
  const counter = /^# (tests|pass|fail|cancelled|skipped|todo) ([0-9]+)\s*$/;
  const diagnostic = /^\s*(?:failureType|error|code):\s+\S|^\s*(?:Error|TypeError|SyntaxError|ReferenceError):\s+\S/;
  for (const [idx, stream] of [out, err].entries()) {
    for (const rawLine of stream.split('\n')) {
      const line = rawLine.replace(/\u001b\[[0-9;]*[A-Za-z]/g, '').replace(/\r/g,'');
      if (idx === 0 && !firstOut && tap.test(line)) firstOut = redactEvidence(line.trim());
      if (idx === 1 && !firstErr && tap.test(line)) firstErr = redactEvidence(line.trim());
      if (idx === 0 && !diagnosticOut && diagnostic.test(line)) diagnosticOut = redactEvidence(line.trim());
      if (idx === 1 && !diagnosticErr && diagnostic.test(line)) diagnosticErr = redactEvidence(line.trim());
      const match = counter.exec(line);
      if (match && idx === 0) counters[match[1]] = Number(match[2]);
      else if (match && counters[match[1]] === null) counters[match[1]] = Number(match[2]);
    }
  }
  return {
    firstFailingTap: firstOut ?? firstErr,
    firstDiagnostic: diagnosticOut ?? diagnosticErr,
    summary: counters,
    stdoutChars: out.length,
    stderrChars: err.length,
    stderrKind: /ERR_PNPM|ELIFECYCLE|ERR_TEST_FAILURE|Error:/i.test(err)
      ? 'ERROR_MARKERS_PRESENT' : (err.trim() ? 'NONEMPTY' : 'EMPTY'),
  };
}
