/** WEB-005 C01 / source-only TAP triage. Pure, no process or DB access.
 * Never publish entire raw stdout/stderr from integration tests. This helper
 * extracts a minimal redacted indicator; raw data stays in the private runner.
 */
export function redactEvidence(value) {
  return String(value)
    .replace(/\u001b\[[0-9;]*[A-Za-z]/g,"")
    .replace(/(?:postgres(?:ql)?:\/\/)[^\s'"<>]+/gi,"postgresql://[REDACTED]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]+/gi,"Bearer [REDACTED]")
    .replace(/\b([A-Za-z_]*(?:PASSWORD|PASSWD|SECRET|TOKEN|API_KEY|ACCESS_KEY)[A-Za-z_]*)\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,"$1=[REDACTED]")
    .replace(/[\u0000-\u001f\u007f]/g," ")
    .slice(0,400);
}

export function firstFailureEvidence(stdout, stderr) {
  const raw = String(stdout ?? "");
  const lines = raw.replace(/\r/g,"").split("\n").map(s=>s.replace(/\u001b\[[0-9;]*[A-Za-z]/g,""));
  const first = lines.find(line=>/^\s*not ok\s+\d+\s+-\s+\S/.test(line));
  const summary = {};
  for (const key of ["tests","pass","fail","cancelled","skipped","todo"]) {
    const match = [...lines.join("\n").matchAll(new RegExp("^# "+key+" ([0-9]+)\\s*$","gm"))].at(-1);
    summary[key] = match ? Number(match[1]) : null;
  }
  const d = lines.find(x=>/^\s*(?:failureType|error|code):\s+\S/.test(x));
  const stderrLines=String(stderr??"").replace(/\r/g,"").split("\n");
  const stderrKind = stderrLines.some(s=>/ERR_PNPM|ELIFECYCLE|ERR_TEST_FAILURE|Error:/i.test(s)) ? "ERROR_MARKERS_PRESENT" : (String(stderr??"").trim() ? "NONEMPTY" : "EMPTY");
  return {
    firstFailingTap: first ? redactEvidence(first.trim()) : null,
    firstDiagnostic: d ? redactEvidence(d.trim()) : null,
    summary,
    stdoutChars:raw.length,
    stderrChars:String(stderr??"").length,
    stderrKind,
  };
}
