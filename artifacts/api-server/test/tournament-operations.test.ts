import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { deriveTournamentOperations, type OperationsInput } from "../src/application/operations/tournament-operations";

function fixture(overrides: Partial<OperationsInput> = {}): OperationsInput {
  return {
    tournament: { id: 13, status: "active", format: "swiss", currentRound: 1, totalRounds: 3, activeStageId: 1 },
    players: [{id: 1, seed: 1}, {id: 2, seed: 2}],
    stages: [{ id: 1, name: "Swiss", position: 1, status: "active", format: "swiss", currentRound: 1, totalRounds: 3 }],
    matches: [{ id: 11, stageId: 1, round: 1, status: "pending" }],
    ...overrides,
  };
}
const choose = (input: OperationsInput) => deriveTournamentOperations(input);

describe("Tournament Operations Engine — read-only organizer guidance", () => {
  test("draft requires at least two participants", () => {
    const s = choose(fixture({ tournament: {...fixture().tournament, status: "draft"}, players: [],
      stages: [{...fixture().stages[0], status: "planned"}], matches: [] }));
    assert.equal(s.recommendedAction.code, "ADD_PARTICIPANTS");
    assert.equal(s.progress.percent, null);
    assert.equal(s.blockers[0].code, "NOT_ENOUGH_PARTICIPANTS");
  });
  test("draft never claims ready when authoritative readiness is missing", () => {
    const s = choose(fixture({tournament: {...fixture().tournament, status: "draft"},
      stages: [{...fixture().stages[0], status: "planned"}],matches:[]}));
    assert.equal(s.recommendedAction.code, "REVIEW_STAGE_READINESS");
    assert.equal(s.recommendedAction.availability, "review");
  });
  test("draft blocked by stage readiness", () => {
    const s = choose(fixture({tournament: {...fixture().tournament, status: "draft"},
      stages: [{...fixture().stages[0],status: "planned"}],matches:[],
      plannedStageReadiness:{ready:false,reasonCode:"SEEDS_MISSING",message:"Brak rozstawienia"}}));
    assert.equal(s.recommendedAction.availability,"blocked");
    assert.equal(s.blockers[0].code,"SEEDS_MISSING");
  });
  test("draft ready prompts confirmation, never auto-starts", () => {
    const s = choose(fixture({tournament: {...fixture().tournament, status:"draft"},
      stages:[{...fixture().stages[0],status:"planned"}],matches:[],
      plannedStageReadiness:{ready:true,reasonCode:"READY",message:"OK"}}));
    assert.equal(s.recommendedAction.code,"START_STAGE");
    assert.equal(s.recommendedAction.requiresConfirmation,true);
    assert.equal(s.advisory,true);
  });
  test("active stage counts only its own matches", () => {
    const s = choose(fixture({matches:[{id:8,stageId:2,round:1,status:"completed"},
      {id:11,stageId:1,round:1,status:"pending"}]}));
    assert.deepEqual([s.progress.total,s.progress.completed,s.progress.pending], [1,0,1]);
    assert.equal(s.recommendedAction.code,"RECORD_MATCH_RESULTS");
  });
  test("all completed Swiss round proposes next round, not stage completion", () => {
    const s = choose(fixture({matches:[{id:11,stageId:1,round:1,status:"completed"}]}));
    assert.equal(s.recommendedAction.code,"GENERATE_SWISS_ROUND");
    assert.equal(s.recommendedAction.requiresConfirmation,true);
  });
  test("incomplete earlier Swiss round blocks progression", () => {
    const f = fixture();
    const s = choose(fixture({tournament:{...f.tournament,currentRound:2},
      stages:[{...f.stages[0],currentRound:2}],
      matches:[{id:11,stageId:1,round:1,status:"postponed"}, {id:12,stageId:1,round:2,status:"completed"}]}));
    assert.equal(s.recommendedAction.availability,"blocked");
    assert.ok(s.blockers.some(b=>b.code==="EARLIER_ROUND_INCOMPLETE"));
  });
  test("cancelled matches block unsafe completion", () => {
    const s = choose(fixture({matches:[{id:11,stageId:1,round:1,status:"cancelled"}]}));
    assert.equal(s.recommendedAction.code,"REVIEW_CANCELLED_MATCHES");
    assert.equal(s.recommendedAction.availability,"blocked");
  });
  test("postponed matches need review", () => {
    const s = choose(fixture({matches:[{id:11,stageId:1,round:1,status:"postponed"}]}));
    assert.equal(s.recommendedAction.code,"REVIEW_POSTPONED_MATCHES");
  });
  test("missing match materialization never implies stage completion", () => {
    const s = choose(fixture({matches:[]}));
    assert.equal(s.recommendedAction.code,"REVIEW_STAGE_MATCHES");
  });
  test("complete non-Swiss stage requires confirmation", () => {
    const f=fixture();const s = choose(fixture({stages:[{...f.stages[0],format:"round_robin"}],
      matches:[{id:11,stageId:1,round:1,status:"completed"}]}));
    assert.equal(s.recommendedAction.code,"COMPLETE_STAGE");
    assert.equal(s.recommendedAction.requiresConfirmation,true);
  });
  test("transition waits for authoritative readiness", () => {
    const f=fixture();const s=choose(fixture({stages:[{...f.stages[0],status:"completed"},
      {...f.stages[0],id:2,name:"Playoffs",position:2,status:"planned"}],matches:[],
      plannedStageReadiness:{ready:false,reasonCode:"ROUTING_NOT_READY",message:"Przygotuj koszyki"}}));
    assert.equal(s.recommendedAction.code,"REVIEW_STAGE_READINESS");
    assert.equal(s.recommendedAction.availability,"blocked");
  });
  test("ready next stage is a confirmation, not an automatic transition",()=>{
    const f=fixture();const s=choose(fixture({stages:[{...f.stages[0],status:"completed"},
      {...f.stages[0],id:2,name:"Playoffs",position:2,status:"planned"}],matches:[],
      plannedStageReadiness:{ready:true,reasonCode:"READY",message:"OK"}}));
    assert.equal(s.recommendedAction.code,"START_STAGE");
    assert.equal(s.recommendedAction.requiresConfirmation,true);
  });
  test("completed tournament never exposes mutations", () => {
    const s=choose(fixture({tournament:{...fixture().tournament,status:"completed"}}));
    assert.equal(s.recommendedAction.code,"VIEW_RESULTS");
    assert.equal(s.recommendedAction.requiresConfirmation,false);
  });
  test("invalid double-active state is blocked", () => {
    const f=fixture();const s=choose(fixture({stages:[f.stages[0],{...f.stages[0],id:2,position:2}]}));
    assert.equal(s.recommendedAction.code,"REVIEW_TOURNAMENT_STATE");
    assert.equal(s.recommendedAction.availability,"blocked");
  });
});
