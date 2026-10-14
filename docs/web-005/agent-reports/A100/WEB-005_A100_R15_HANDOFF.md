# WEB-005_A100_R15_HANDOFF

**AGENT / ROLE:** A100 — Session Security & Private Access.
**TASK:** `WEB-005-T080-A100-S2B-R15`.
**MODE:** SOURCE-ONLY FIRST / 3 NEGATIVE TEST CONTRACTS / CODE HOLD until A60 source FAIL or A50 runtime reproduction **and** explicit separate written `R15-S2B-CODE-GO` from A00. No such GO verified.
**SOURCE OF AUTHORITY:** `docs/web-005/WEB-005_WAVE_R15_AGENT_PROMPTS.md`, §§0–2 and A100, blob `e6950cbff7e521ed9b3ff774e7787e8d598a966d`.
**DATE:** 2026-10-14 Europe/Warsaw.
**SOURCE BASE/RELEASE:** `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` (live HEAD verified).
**TARGET:** [PR #53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53), exact HEAD `6a8f0c3e5775eb056df75ebdd7b33df7cbc78979`, OPEN DRAFT, unmerged, base as above; five changed PR files verified.
**R15 IMPLEMENTATION:** `NO_NEW_PR`, application files changed `0`, executable test files changed `0`. Only R15 A100 documentation authored on central documentation branch.
**R15 TECHNICAL DELIVERABLE:** [WEB-005_A100_R15_S2B_TEST_AND_PATCH_OR_HOLD.md](./WEB-005_A100_R15_S2B_TEST_AND_PATCH_OR_HOLD.md), source-contract commit `d0c2b3b40bdaef4a88861ae442274c2daa976c46`.
**THIS REPORT:** `docs/web-005/agent-reports/A100/WEB-005_A100_R15_HANDOFF.md` (final GitHub commit SHA re-read after publication).
**STATUS:** `SOURCE_QA_REPORTED | SOURCE_CONFIRMED_KEY_GAP | TEST_CONTRACTS_AUTHORED_3 | TESTS_NOT_EXECUTED | A60_ACCEPTANCE_NOT_VERIFIED | A00_CODE_GO_ABSENT | RELEASE_NO_GO`.

## 1. Exact reviewed files, findings, scope

| File @ SHA | R15 evidence |
|---|---|
| PR53 `artifacts/tournament-manager/src/lib/tournament-query-invalidation.ts` blob `1d4365963192646dd918675a65f4496913f2873f` | `isTournamentAuthQuery` and 401/403 parser support only `/api/tournaments/:id`-prefixed query key; eviction cancels/removes matching keys. Source gap for noncanonical keys. |
| PR53 `artifacts/tournament-manager/src/context/auth-context.tsx` blob `8916545544d55fc8d7fbd146d0328e36543bebb7` | All six org/support/viewer credential set/remove paths call only current URL-prefix eviction. Provider now requires `useQueryClient`. |
| Release `artifacts/tournament-manager/src/lib/deadlock-bans-picks.ts` blob `480cbf83e705e3ece91d9ae13635314b80fa47ac` | Real query keys are `["tournaments", tid, "player-bans"]`, `["matches", mid, "game-picks"]`. Both are used by protected tournament views, neither matched by PR53. |
| Release `artifacts/api-server/src/routes/tournaments.ts` | GET player bans and match game picks both call `checkViewerReadAuth`; match read resolves `matchesTable.tournamentId` before authorization. Match ID is not a tournament ID. |
| PR53 `artifacts/tournament-manager/src/hooks/use-tournament-auth.test.tsx` blob `2b1f7433b478de5dbb60459a9460055079d8b9b1` | Existing test renders `AuthProvider` without `QueryClientProvider`; source-level fixture compatibility concern. No observed runtime test FAIL yet. |
| PR53 `artifacts/tournament-manager/src/lib/tournament-auth-query-cache.test.tsx` blob `ec4b98ae6d7d6860176f65d4c7945557f983ddbb` | Nine authored R13 S2A tests, none independently executed according to retrieved evidence. No S2B tuple-key tests exist on PR53. |

**Meaning:** Noncanonical-key blind spots are `SOURCE_CONFIRMED`; whether private content was exposed to a real unauthenticated UI is only `STATIC_INFERRED`. Do not claim that React Query stale data equals confirmed production information leakage. Existing A30 peer R13 comment flags additional module-global header clearing and enabled-observer coverage risks, not resolved by these three test specifications.

## 2. Three test-first contracts published (not executable source commits)

1. **N1 bans:** A7 private cached player bans must be evicted after organizer logout, credential replacement or revoked 401/403, with pending GET A unable to refill and unrelated public B8 cached bans preserved.
2. **N2 picks:** M_A=701 owned by tournament A7; M_B=801 owned by B8. After A logout, evict **only provably A-owned** `["matches", 701, "game-picks"]` and cancel late A GET. B8 picks untouched. No numeric matchId→tournamentId inference; if ownership metadata unavailable, `OWNERSHIP_UNPROVEN` and HOLD, not global cache purge.
3. **N3 provider fixture:** execute unchanged `use-tournament-auth.test.tsx` with PR53 and record exit; independently verify the same two negative support-session cases using correct QueryClientProvider-wrapped AuthProvider and isolated client. Existing mismatch is source-confirmed, expected test failure NOT_EXECUTED.

Additional accept criteria: **active `enabled:true`** observer, abortable/unabortable late responses, revoke on 401/403, public B unaffected; existing valid credentials and public-read behavior remain intact. No test file was added in R15 because A00 has not authorized a code lane.

## 3. Runtime evidence / A50 exact commands

**Actual A100 runtime:** `NOT_EXECUTED`. No full pinned Node22/pnpm10 frontend workspace/deps verified for this A100 thread; no runtime exit codes, no false PASS. Prior GitHub Actions run [38606179795](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38606179795) **FAILED at Pack19 source matcher** before target RTL. The Pack19 matcher fix exists in PR35; do not count prior CI as S2B or S2A test evidence.

**A50 executable plan (frontend only; no PostgreSQL required):**

```bash
git rev-parse HEAD  # must equal 6a8f0c3e5775eb056df75ebdd7b33df7cbc78979
node --version       # record actual Node22 output
pnpm --version       # record actual pnpm10 output
cd artifacts/tournament-manager
export TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json"
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/lib/tournament-auth-query-cache.test.tsx
pnpm exec node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-tournament-auth.test.tsx
pnpm typecheck
```

N1/N2 custom tuple-key tests require an A50-approved **temporary synthetic fixture** from the published contract. Attach exact fixture source, seed ownership proof, command, `exit=0/nonzero`, count, logs, observable cache snapshots and observer renders. No real secrets/users, production DB, manual paid CI, or composite branch.

**A60 status:** PR53 GitHub submitted reviews empty at latest recheck and no signed A60 verdict directly available at PR53 exact SHA; status `NOT_VERIFIED_BY_A100`, not a categorical statement about A60's work elsewhere.

## 4. Dependencies, STOP and coordinator decision

Other A100 backend patches rechecked independently and frozen:
- PR44 / S1A @ `2f0187b7242681c394c09058b5ef647667206bd6` — post-lock organizer auth for bans/picks.
- PR46 / S1B-D @ `7f60849e389a7ed35fdd39dd5493c4c4c267d860` — protected tournament DELETE.
- PR49 / S1B-P @ `99298b81501c3e7764d653604923522a19b9f05c` — password/visibility post-lock.
All OPEN DRAFT / same release base / no composition. PR53 frontend is separate. Session TTL/token hashing/organizer rotation **POLICY_OPEN / HQ owner**, unchanged.

**Unambiguous blocker:** Written A60 source FAIL or real A50 exact-SHA negative test evidence is not verified; written `R15-S2B-CODE-GO` with exclusive affected file/hunk ownership from A00 absent. No permissible implementation PR. Additional ownership proof is mandatory for match-key eviction.

**NEXT ACTION (A00):** Receive report URL and test contracts; send to A50 to run exact pinned RTL/legacy hook tests and temporary N1/N2 fixture, send actual exit evidence to A60 for independent source/security acceptance. Obtain A30 security peer on module-global header issue. If a concrete fail is confirmed, issue separate `R15-S2B-CODE-GO` specifying exact files/hunks, or record `SOURCE_RECONCILED/NO_NEW_PR` if tests disprove material defect. Test-wrapper file requires separate 1-file GO; Host ownership requires its owner reservation. Release integration not a WEB-005 action.

**STOP COMPLIED:** No new code, PR, merge, rebase/cherry-pick, paid workflow rerun, deployment/staging/live, PostgreSQL reset, secrets, global match-cache purge or SWARM-006 activation.

**FINAL:** `NO_NEW_PR / SOURCE_QA_REPORTED / THREE_TEST_CONTRACTS_PUBLISHED / RUNTIME_NOT_EXECUTED / A50_A60_EVIDENCE_PENDING / A00_CODE_GO_ABSENT / RELEASE_NO_GO`.
