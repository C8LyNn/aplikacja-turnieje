import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
const read = p => readFileSync(path.join(process.cwd(),p),"utf8");
const withoutComments = source => source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g, '');
const server=read("artifacts/api-server/src/routes/tournament-se-correction-readiness.ts");
const ui=read("artifacts/tournament-manager/src/components/tournament-result-correction-panel.tsx");
const spec=read("lib/api-spec/openapi.yaml");
const ci=read(".github/workflows/tournament-correction-ci.yml");
const engine=read("artifacts/api-server/src/domain/tournament/se-correction-impact-graph.ts");
test("Pack25 output is generated from consistent existing SE readiness transaction",()=>{
  assert.match(server,/deriveSeCorrectionImpactGraph\(\{/);
  assert.match(server,/matchId:match\.id,stage,stages,stageMatches:matches,actionPlan/);
  assert.match(withoutComments(server),/\},\s*\{(?=[^{}]*\bisolationLevel\s*:\s*["']repeatable read["'])(?=[^{}]*\baccessMode\s*:\s*["']read only["'])(?![^{}]*\baccessMode\s*:[^{}]*\baccessMode\s*:)(?![^{}]*\bisolationLevel\s*:[^{}]*\bisolationLevel\s*:)[^{}]*\}\s*\)/);
});
test("no extra write route; reuses organizer access and read-only endpoint",()=>{
  assert.match(server,/requireOrganizer\(req,res,tournamentId\)/);
  assert.match(server,/se-correction-readiness/);
  assert.doesNotMatch(engine,/\b(?:insert|update|delete)\s*\(/);
  assert.doesNotMatch(server,/\b(?:tx|db)\s*\.\s*(?:insert|update|delete|execute)\s*\(/);
  assert.doesNotMatch(engine,/\b(?:fetch|db|localStorage|sessionStorage)\s*\./);
});
test("server returns graph and risk report with prior diagnostic and action plan",()=>{
  const required=["actionPlan","diagnostic","impactGraph","impactRiskReport"];
  // Dependency-free bounded lexer: comments and literals cannot impersonate source code.
  // Not a full TS AST: the assertion targets the named readiness transaction's
  // final unconditional return and deliberately fails closed on unexpected shapes.
  const executableCode=source=>source.replace(
    /\/\*[\s\S]*?\*\/|\/\/[^\r\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\x60(?:\\.|[^\x60\\])*\x60/g,
    token=>token.replace(/[^\r\n]/g," "),
  );
  const responseFields = source => {
    const code=executableCode(source);
    const transactions=[...code.matchAll(/\bconst\s+outcome\s*=\s*await\s+db\.transaction\s*\(\s*async\s+tx\s*=>\s*\{/g)];
    assert.equal(transactions.length,1,"expected one named SE readiness transaction");
    const start=transactions[0].index+transactions[0][0].length-1;
    let depth=1, end=-1;
    for(let i=start+1;i<code.length;i++){
      if(code[i]==="{")depth++;
      else if(code[i]==="}"&&--depth===0){end=i;break;}
    }
    assert.ok(end>start,"SE readiness transaction callback was not closed");
    assert.match(code.slice(end+1),/^\s*,\s*\{[^{}]*\}\s*\)\s*;/,"expected transaction options after callback");
    const body=code.slice(start+1,end);
    const matches=[...body.matchAll(/\bconst\s+impactRiskReport\s*=\s*deriveSeCorrectionImpactRiskReport\s*\(\s*impactGraph\s*\)\s*;\s*return\s*\{\s*\.\.\.result\s*,([^{}]*)\}\s*;\s*$/g)];
    assert.equal(matches.length,1,"expected final executable four-field readiness return in transaction callback");
    return matches[0][1].split(",").map(field=>field.trim()).filter(Boolean);
  };
  const assertComplete = source => {
    const fields=responseFields(source);
    assert.equal(fields.length,required.length,"expected exactly four shorthand response fields");
    assert.equal(new Set(fields).size,required.length,"duplicate shorthand response field");
    for(const field of required) assert.ok(fields.includes(field), "missing shorthand response field: "+field);
  };
  assertComplete(server);
  const reorder=server.replace(/return\s*\{\s*\.\.\.result\s*,\s*actionPlan\s*,\s*diagnostic\s*,\s*impactGraph\s*,\s*impactRiskReport\s*\}/,
    "return { ...result, diagnostic, impactRiskReport, actionPlan, impactGraph }");
  assert.notEqual(reorder,server);
  assertComplete(reorder);

  // R23B fail-first: a raw regex must NOT accept a fake return inside comments.
  const realReturn=/return\s*\{\s*\.\.\.result\s*,\s*actionPlan\s*,\s*diagnostic\s*,\s*impactGraph\s*,\s*impactRiskReport\s*\}\s*;/;
  const fake='return { ...result, actionPlan, diagnostic, impactGraph, impactRiskReport };';
  for (const [kind, fakeSource] of [
    ['line', 'return result;\n// '+fake],
    ['block', 'return result;\n/* '+fake+' */'],
    ['multiline', 'return result;\n/*\n'+fake+'\n*/'],
  ]) {
    const unsafe=server.replace(realReturn, fakeSource);
    assert.notEqual(unsafe,server,'unable to construct '+kind+' response spoof');
    assert.throws(()=>assertComplete(unsafe),assert.AssertionError,kind+' comment must not be executable return');
  }
  // Executability and ownership: unrelated returns and conditional branches cannot pass.
  for (const [kind, fakeSource] of [
    ["conditional", "if (allowed) "+fake+"\nreturn result;"],
    ["wrong branch", "if (allowed) { "+fake+" } else { return result; }"],
    ["string literal", "return result;\nconst decoy = '"+fake+"';"],
    ["template literal", "return result;\nconst decoy = "+String.fromCharCode(96)+fake+String.fromCharCode(96)+";"],
    ["duplicated graph", "return { ...result, actionPlan, diagnostic, impactGraph, impactGraph, impactRiskReport };"],
    ["extra field", "return { ...result, actionPlan, diagnostic, impactGraph, impactRiskReport, extraField };"],
  ]) {
    const invalid=server.replace(realReturn,fakeSource);
    assert.notEqual(invalid,server,"unable to construct "+kind+" response mutation");
    assert.throws(()=>assertComplete(invalid),assert.AssertionError,kind+" must not pass Pack25 response contract");
  }
  const wrongFunction=server.replace(realReturn,"return result;")+"\nconst unrelated=()=>{ "+fake+" };";
  assert.throws(()=>assertComplete(wrongFunction),assert.AssertionError,"return in unrelated function must not count");
  const commentedPlusReal=server.replace(realReturn,"// "+fake+"\n"+fake);
  assertComplete(commentedPlusReal);
  assert.match(server,/deriveSeCorrectionImpactRiskReport\(impactGraph\)/);
  for (const replacement of [
    ", actionPlan, diagnostic, impactRiskReport }",
    ", actionPlan, diagnostic, impactGraph }",
    ", actionPlan, diagnostic, /* impactGraph */ impactRiskReport }",
    ", actionPlan, diagnostic, impactGraph: undefined, impactRiskReport }",
  ]) {
    const invalid=server.replace(/,\s*actionPlan,\s*diagnostic,\s*impactGraph,\s*impactRiskReport\s*\}/,replacement);
    assert.notEqual(invalid,server);
    assert.throws(()=>assertComplete(invalid),assert.AssertionError);
  }
});
test("panel includes graph type and field",()=>{
  assert.match(ui,/type SeImpactGraph = \{/);
  assert.match(ui,/impactGraph: SeImpactGraph/);
});
test("panel only renders the same chosen match and requires advisory flags",()=>{
  assert.match(ui,/seReadiness\.impactGraph\.matchId === chosen\?\.id/);
  assert.match(ui,/seReadiness\.impactGraph\.executionEnabled === false/);
  assert.match(ui,/seReadiness\.impactGraph\.writePerformed === false/);
});
test("panel distinguishes actual slot from possible future path",()=>{
  assert.match(ui,/directSuccessorCount/);assert.match(ui,/potentialLaterMatchCount/);
  assert.match(ui,/item\.relationship/); // relation exists in UI type
  assert.match(ui,/alreadyStarted/);
});
test("panel visibly warns when graph is incomplete",()=>{
  assert.match(ui,/status === "incomplete"/);
  assert.match(ui,/Niekompletny graf/);
});
test("panel displays later stages as separate assessment",()=>{
  assert.match(ui,/laterStages\.map/);
  assert.match(ui,/osobnej oceny routingu/);
});
test("OpenAPI contains advisory-only schema and explicit no-write flags",()=>{
  assert.match(spec,/impactGraph:\s*\n\s*type: object/);
  assert.match(spec,/se_correction_impact_graph/);
  assert.match(spec,/status: \{ type: string, enum: \[outlined, review_required, incomplete\] \}/);
  assert.match(spec,/writePerformed: \{ type: boolean, const: false \}/);
});
test("CI executes domain tests and static contract",()=>{
  assert.match(ci,/test\/se-correction-impact-graph\.test\.ts/);
  assert.match(ci,/qa\/pack25\/source-contract\.test\.mjs/);
});
test("CI includes both push and PR path filters",()=>{
  assert.equal((ci.match(/qa\/pack25\/\*\*/g)||[]).length,2);
});
test("existing safety history and triage remain intact",()=>{
  assert.match(ui,/seAssessmentHistorySummary/);
  assert.match(ui,/seRemediationPriority/);
});
