import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  deriveResultCorrectionPreflight,
  type CorrectionPreviewInput,
} from "../src/application/operations/tournament-result-correction-preflight";

function fixture(): CorrectionPreviewInput {
  return {
    tournament: {status: "active", winnerId: null},
    match: { id: 101, stageId: 4, round: 1, matchNumber: 1, status: "completed", revision: 3,
      resultType: "played", resultReason: null, player1Id: 11, player2Id: 12,
      winnerId: 11, score1: 2, score2: 0, bestOf: 3, completedAt: new Date("2026-09-01T12:00:00Z") },
    stages: [{id: 4, position: 1, name: "Grupa", format: "round_robin", status: "active", currentRound: 1, totalRounds: 1}],
    stageMatches: [], nextStageMatches: [], approvedQualification: false, materializedRoute: false,
    latestHistoryMatches: true, activeCompletionActions: 1, expectedRevision: 3,
    proposedScore1: 1, proposedScore2: 2,
  };
}
function result(mutator?: (input: CorrectionPreviewInput) => void) {
  const input = fixture(); mutator?.(input); return deriveResultCorrectionPreflight(input);
}
function codes(p: ReturnType<typeof result>): string[] {return p.issues.map(i => i.code);}

describe("Pack 08 — conservative result correction preflight", () => {
  test("read-only output; never authorization", () => {
    const p = result();
    assert.equal(p.version, 1); assert.equal(p.mutationPerformed, false);
    assert.equal(p.previewIsAuthorization, false); assert.equal(p.requiresTransactionalRecheck, true);
    assert.equal(p.state, "requires_review");
  });
  test("input objects remain unchanged", () => {
    const original = fixture(); const copy = structuredClone(original);
    deriveResultCorrectionPreflight(original); assert.deepEqual(original, copy);
  });
  test("detects a different winner", () => {
    const p = result(); assert.equal(p.proposedResult.winnerId, 12);
    assert.equal(p.proposedResult.winnerChanges, true);
    assert.ok(p.effects.some(e => e.code === "WINNER_CHANGE"));
  });
  test("detects same winner, still requires review", () => {
    const p = result(i => { i.proposedScore1 = 2; i.proposedScore2 = 1; });
    assert.equal(p.proposedResult.winnerChanges, false); assert.equal(p.state, "requires_review");
  });
  test("invalid score BO3 is blocked", () => {
    const p = result(i => {i.proposedScore1 = 1; i.proposedScore2 = 0; });
    assert.equal(p.state, "blocked"); assert.ok(codes(p).includes("INVALID_PROPOSED_RESULT"));
  });
  test("both winners and fractional score blocked", () => {
    assert.ok(codes(result(i => {i.proposedScore1=2; i.proposedScore2=2;})).includes("INVALID_PROPOSED_RESULT"));
    assert.ok(codes(result(i => {i.proposedScore1=2; i.proposedScore2=0.5;})).includes("INVALID_PROPOSED_RESULT"));
  });
  test("stale match revision is blocked", () => {
    assert.ok(codes(result(i => {i.expectedRevision=2;})).includes("STALE_MATCH_REVISION"));
  });
  test("missing history or completion action blocks", () => {
    assert.ok(codes(result(i => {i.latestHistoryMatches=false;})).includes("HISTORY_NOT_VERIFIED"));
    assert.ok(codes(result(i => {i.activeCompletionActions=2;})).includes("COMPLETION_ACTION_NOT_UNAMBIGUOUS"));
  });
  test("pending and BYE matches cannot be corrected here", () => {
    assert.ok(codes(result(i => {i.match.status="pending";})).includes("MATCH_NOT_COMPLETED"));
    assert.ok(codes(result(i => {i.match.resultType="bye";})).includes("SYSTEM_BYE_REVERT_BLOCKED"));
  });
  test("later started stage blocks", () => {
    const p = result(i => {i.stages=[...i.stages, {id:5,position:2,name:"Final",format:"single_elimination",status:"active",currentRound:1,totalRounds:3}];});
    assert.ok(codes(p).includes("STAGE_ALREADY_ADVANCED"));
  });
  test("approved qualification and executed route block", () => {
    assert.ok(codes(result(i => {i.approvedQualification=true;})).includes("STAGE_QUALIFICATION_ALREADY_COMMITTED"));
    assert.ok(codes(result(i => {i.materializedRoute=true;})).includes("STAGE_QUALIFICATION_ALREADY_COMMITTED"));
  });
  test("later Swiss pairing blocks even if still pending", () => {
    const p = result(i => {i.stages=[{...i.stages[0],format:"swiss",currentRound:2}];
      i.stageMatches=[{...i.match,id:102,round:2,status:"pending",resultType:null,score1:null,score2:null,winnerId:null,completedAt:null}];});
    assert.ok(codes(p).includes("DOWNSTREAM_SWISS_PAIRINGS")); assert.deepEqual(p.downstreamMatchIds,[102]);
  });
  test("single elimination pristine downstream slot is detected", () => {
    const p = result(i => {
      i.stages=[{...i.stages[0],format:"single_elimination",totalRounds:3}];
      i.stageMatches=[{...i.match,id:201,round:2,matchNumber:1,status:"pending",resultType:null,
        score1:null,score2:null,winnerId:null,completedAt:null,player1Id:11,player2Id:22}];
    });
    assert.equal(p.state,"requires_review"); assert.deepEqual(p.downstreamMatchIds,[201]);
    assert.ok(p.effects.some(e=>e.code==="DOWNSTREAM_SLOT"));
  });
  test("single elimination started downstream blocks", () => {
    const p = result(i => {
      i.stages=[{...i.stages[0],format:"single_elimination",totalRounds:3}];
      i.stageMatches=[{...i.match,id:201,round:2,matchNumber:1,status:"in_progress",resultType:null,
        score1:null,score2:null,winnerId:null,completedAt:null,player1Id:11,player2Id:22}];
    });
    assert.ok(codes(p).includes("DOWNSTREAM_MATCH_ALREADY_USED"));
  });
  test("missing next-round match blocks", () => {
    const p = result(i => {i.stages=[{...i.stages[0],format:"single_elimination",totalRounds:3}];});
    assert.ok(codes(p).includes("DOWNSTREAM_MATCH_MISSING"));
  });
  test("completed stage with generated next-stage matches blocks", () => {
    const p = result(i => {i.stages=[{...i.stages[0],status:"completed"},{...i.stages[0],id:5,position:2,status:"planned"}];i.nextStageMatches=[{id:300}];});
    assert.ok(codes(p).includes("STAGE_ALREADY_ADVANCED"));
  });
  test("DE remains manual review; not falsely approved", () => {
    const p = result(i => {i.stages=[{...i.stages[0],format:"double_elimination"}];});
    assert.equal(p.state,"requires_review"); assert.ok(codes(p).includes("DE_RUNTIME_REQUIRES_REVALIDATION"));
  });
  test("completed tournament warns about possible reopening", () => {
    const p = result(i => {i.tournament={status:"completed",winnerId:11};});
    assert.ok(p.effects.some(e=>e.code==="TOURNAMENT_REOPEN"));
  });
  test("never mutates data or authorizes even without issues", () => {
    const p = result(i => {i.proposedScore1=2;i.proposedScore2=0;});
    assert.equal(p.state,"requires_review"); assert.equal(p.mutationPerformed,false);
  });
});
