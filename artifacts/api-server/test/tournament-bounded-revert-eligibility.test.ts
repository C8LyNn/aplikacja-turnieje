import assert from "node:assert/strict";
import { test } from "node:test";
import { deriveBoundedRevertEligibility as eligible, type BoundedRevertEligibilityInput } from "../src/application/operations/tournament-bounded-revert-eligibility";
const base=():BoundedRevertEligibilityInput=>({
  format:"round_robin",stageStatus:"active",tournamentStatus:"active",
  previewState:"requires_review",playbookStatus:"manual_review",guardStatus:"stable_on_recheck",
  existingScore1:2,existingScore2:1,proposedScore1:1,proposedScore2:2,
  historyVerified:true,activeCompletionActionId:42,issues:[],
});
test("allows only an authorized candidate, never actual execution",()=>{
  assert.deepEqual(eligible(base()),{supported:true,reasonCode:"REVERT_ONLY_REQUIRES_EXPLICIT_APPROVAL",expectedCompletionActionId:42});
});
const negative:[string,Partial<BoundedRevertEligibilityInput>,string][]=[
  ["Swiss",{format:"swiss"},"FORMAT_NOT_EXECUTABLE"],
  ["single elimination",{format:"single_elimination"},"FORMAT_NOT_EXECUTABLE"],
  ["double elimination",{format:"double_elimination"},"FORMAT_NOT_EXECUTABLE"],
  ["group stage",{format:"group_stage"},"FORMAT_NOT_EXECUTABLE"],
  ["no format",{format:null},"FORMAT_NOT_EXECUTABLE"],
  ["completed stage",{stageStatus:"completed"},"LIFECYCLE_NOT_ACTIVE"],
  ["planned stage",{stageStatus:"planned"},"LIFECYCLE_NOT_ACTIVE"],
  ["completed tournament",{tournamentStatus:"completed"},"LIFECYCLE_NOT_ACTIVE"],
  ["stale guard",{guardStatus:"changed_during_read"},"PREVIEW_STALE"],
  ["absent guard",{guardStatus:null},"PREVIEW_STALE"],
  ["stale playbook",{playbookStatus:"stale"},"PREVIEW_STALE"],
  ["blocked preview",{previewState:"blocked"},"PREVIEW_NOT_ELIGIBLE"],
  ["blocked playbook",{playbookStatus:"blocked"},"PREVIEW_NOT_ELIGIBLE"],
  ["no change status",{playbookStatus:"no_change"},"PREVIEW_NOT_ELIGIBLE"],
  ["review issue",{issues:[{severity:"review",code:"RISK"}]},"PREVIEW_ISSUES_REQUIRE_MANUAL_REVIEW"],
  ["block issue",{issues:[{severity:"block",code:"RISK"}]},"PREVIEW_ISSUES_REQUIRE_MANUAL_REVIEW"],
  ["unverified history",{historyVerified:false},"HISTORY_NOT_VERIFIED"],
  ["missing action",{activeCompletionActionId:null},"COMPLETION_ACTION_NOT_UNAMBIGUOUS"],
  ["invalid action",{activeCompletionActionId:0},"COMPLETION_ACTION_NOT_UNAMBIGUOUS"],
  ["no correction",{proposedScore1:2,proposedScore2:1},"NO_CHANGE"],
];
for(const [label,changes,code] of negative){
  test(`denies: ${label}`,()=>{const result=eligible({...base(),...changes}); assert.equal(result.supported,false);assert.equal(result.reasonCode,code);assert.equal(result.expectedCompletionActionId,null);});
}
