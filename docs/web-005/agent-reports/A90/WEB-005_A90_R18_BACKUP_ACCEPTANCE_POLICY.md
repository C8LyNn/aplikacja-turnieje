# WEB-005 — A90 R18 / Backup acceptance and B2 owner policy

**TASK:** \`WEB-005-T060-A90-R18\` · **AGENT:** A90 — Backup V3 Integrity & Restore · **WAVE:** R18 · **DATE:** 2026-10-14 (Europe/Warsaw)  
**AUTHORIZATION:** SOURCE-ONLY / independent-source-review reconciliation / owner-decision documentation. **NO R18 CODE GO for A90.**  
**SOURCE BASE:** \`release/tournament-ops-20261013-01\` at \`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`.  
**GITHUB CUSTODY:** docs-only branch \`docs/web-005/a90-r18-b1-qa-b2-policy\`; no new PR, no merge, no SWARM-006.

## 1. Directly verified evidence, exact SHA, disposition

| Object | Exact readback | Status / accepted scope |
|---|---|---|
| **P08 B1 [PR #41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41)** | **OLD R17 start:** \`e847cb705296a48ab5c68ece96776cd0e0bbb417\` → **R17 end / R18 current HEAD:** \`f03cf3d09988a04ba9c2856e205d21f994ff67f1\`. Base \`1fdc401...\`. | OPEN DRAFT, unmerged; **R18 no change**. Independent A60 R17 verdict \`SOURCE_ACCEPTED_CONDITIONAL\` **only for B1 QP/QPE/OP position parity**. Not full QA/runtime accepted. |
| **P15 B3A [PR #48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48)** | \`2a8a4c72cb4a3a37402a346fd0acc83b03b39be3\`; base \`1fdc401...\`. | Separate OPEN DRAFT. Earlier conditional source MVCC acceptance; real PG16 isolation proof unavailable. Not modified by A90 in R18. |
| **P01 CI [PR #35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35)** | \`7cb283aa82273a1e22daf9051a82311eef53760c\` at control R18 snapshot. | Separate Pack19 matcher correction. No merge/composite or duplicate work by A90. |

**Exact source provenance:** PR41 B1 position validator blob \`a8482fa7137f1d71817c8b4ec43da7d6292f8183\` in \`artifacts/api-server/src/application/backups/backup-v3-flow-integrity.ts\`. R17 test additions in \`artifacts/api-server/test/stage-basket-route-execution.integration.test.ts\`. R17 old→new patch: **5 commits; 2 touched paths**, validator +41 lines and integration test +154 lines, no \`backup-v3.ts\` amendment in that delta. See [A90 R17 source result](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a90-r17-position-recovery/docs/web-005/agent-reports/A90/WEB-005_A90_R17_PR41_POSITION_RESULT.md) and [R16 factual recovery note](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a90-r17-position-recovery/docs/web-005/agent-reports/A90/WEB-005_A90_R16_RECOVERY_RECORD.md).

**Independent QA citation:** [A60 R17 independent report](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_INDEPENDENT_QA.md) and [A60 21-packet matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_PACKAGE_MATRIX.json). A60 explicitly inspected \`f03cf3d...\` and marked **\`SOURCE_ACCEPTED_CONDITIONAL\`**, not \`RUNTIME_VERIFIED\`, not full \`QA_ACCEPTED\`. This is an independent *report*, even though the PR's GitHub review-submission list was empty when queried; do not equate an empty GitHub review list with no independent off-PR report.

**Observed CI:** [PR41 exact-head run 38623319193](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38623319193) → job \`116056098551\` **FAIL at old Pack19 snapshot consistency tests**; downstream \`Static and database release gates\` was **SKIPPED**. Known mismatch: source contract expects \`readOnly:true\`, Drizzle uses \`accessMode:"read only"\`. Therefore this run is **neither** B1 application feature FAIL **nor** B1 runtime PASS. Do not manually rerun paid CI or amend PR35.

**Actual A90 R18 runtime:** **NOT_EXECUTED** — no local pinned checkout, \`pnpm\`/TypeScript execution, PostgreSQL16, HTTP import, native test TAP, exit code, or production backup operations. [A50 R17 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R17_RECEIPT.md) records **0 native application executions** and owner test environment blocker; no newer direct exact-head PG16 receipt was established during this A90 review.

## 2. B1 independent acceptance oracle — source-confirmed behavior

Generated V3 contract facts on the exact PR41 HEAD:
- **QPE**: \`{basketId, playerBackupId, placementRank, basketPosition}\`. \`placementRank\` is global; \`basketPosition\` is **1-based inside that output basket**. Current proposal generator calculates \`basketPosition: i - cursor + 1\`.
- **Approved output (OP)**: \`{basketId, playerBackupId, finalRank}\` — **no serialized basket position field**. Existing B1 validator maps a QPE tuple \`(basket,player,placementRank)\` to OP \`(basket,player,finalRank)\` including multiset cardinality.
- **Route entry**: \`{sourceBasketId,playerBackupId,sourceFinalRank,sourceBasketPosition:number|null}\`. Current route writer legitimately stores **\`sourceBasketPosition:null\`**; this is not \`undefined\` and does not prove an invalid receipt.
- **New B1 validator** requires contiguous ascending per-basket QPE positions 1..N after sorting by global placement rank, and checks every **non-null route sourceBasketPosition** equals QPE position for its exact basket/player/final rank. Explicit \`null\` preserves legacy/current export compatibility; omitted required field \`undefined\` is invalid. OP↔QPE and OP↔route player/rank parity already binds the records, without inventing an OP position or retroactive changes to B2.

### B1 test matrix for A50 (single exact PR41 SHA, approved PG16 only)

| Gate | Synthetic fixture (no user backups) | Required evidence |
|---|---|---|
| **B1-P1** | Export actual Phase3 approved QP/QPE/OP + executed route where receipt position is \`null\` | \`validateBackupV3\` succeeds; successful HTTP import → reload; original 2 arrivals, proposal/OP restored; route retry idempotent |
| **B1-P2** | Same validator-valid fixture; replace route \`null\` with correct numeric QPE per-basket position for each exact source basket/player/rank | Validator + HTTP import succeed; query restored \`stage_basket_route_entries.source_basket_position\` and compare exact values to backup |
| **B1-P3** | Historical *legal* V3 without optional Phase2/3 QP/route collections; separate approved-but-unexecuted route (underfill only if already legal) | Import remains accepted: no new executed-route quota rejection for an unexecuted route; no false-positive for missing optional newer collections |
| **B1-N1..N7** | Swapped QPE basket positions; positive unique but gapped QPE position; omitted QPE position; swapped receipt positions; wrong receipt position for same player; zero receipt position; omitted receipt property instead of \`null\` | Per mutation: typed \`BackupV3ValidationError\` before first clone INSERT; HTTP \`400 INVALID_BACKUP_V3\`; unchanged cloned tournament root count. Confirm no leaked dependents through FK/census as needed |
| **B1-N8..N19** | Preserve **12 previously authored corruption variants**: missing/mismatched OP, wrong basket/foreign player/rank, orphan/pending/stale QP, incomplete/extra/duplicate/misdirected route receipt | For all cases: typed preclone rejection, \`400 INVALID_BACKUP_V3\`, no committed root/dependent rows. **Those 12 variants share one table-driven Node test body, not 12 TAP test cases** |
| **B1-RB1** | Valid V3 clone except \`players[0].seed=2147483648\` (positive JavaScript integer but PostgreSQL \`INTEGER\` overflow). Source importer inserts tournament/stages before player | Preclone validator must accept; HTTP must fail after entering clone transaction; verify unchanged pre/post 13 allowlisted clone-related table counts and no partial commit. **This is a test definition, not an executed rollback proof** |
| **B1-L1** | Existing legal old V3 with \`resultHistory:[]\`, \`actionLog:[]\`, nullable action Undo payload and old Phase2/3 optional state | Preserve established shape and legacy support. Never silently introduce B2 "latest history" policy through B1; test omitted mandatory V3 properties separately from valid empty arrays |

**Coverage note:** New R17 position tests include 7 corrupted mutations and an explicit-number round trip; old 12 malformed variants remain. Their HTTP preclone counters explicitly check the **root tournament name count**; the 13-table census belongs to the **late-failure** fixture. To certify "zero child changes" for every preclone rejection, A50 should independently collect scoped child-table deltas/FK integrity evidence; do not claim this is already asserted for every negative. Also verify any new test-only SQL error yields a genuine late DB failure, not a misclassified preclone \`INVALID_BACKUP_V3\`.

**A60 next gate:** independent R17 SOURCE verdict remains valid only at unchanged \`f03cf3d...\`; A50 supplies exact-head runtime before A60 upgrades to full acceptance. No A90 self-approval. A50 also checks that no legitimate older producer violates the newly enforced position ordering; if real evidence exists, mark scoped \`SOURCE_BLOCKED/POLICY_OPEN\` rather than silently reject historical exports.

## 3. Executable A50 protocol — no execution/authorization by this document

### 3.1 Physical and security preflight

Before **any** integration command:
1. A00/owner provides a trusted executor with a **complete independent Git checkout** at exact PR41 SHA \`f03cf3d...\`, Node22 and pnpm10, pinned \`pnpm-lock.yaml\` and frozen dependencies. GitHub connector metadata alone does not grant local command execution.
2. **Separately** A20 and owner verify a physically dedicated **disposable** PostgreSQL16 cluster/database, host/DB/role identity, segregation from shared/staging/production data and backups, and **explicit written consent** to the reset of the exact test schema. Never print connection URLs, credentials, host secrets or real backup content.
3. Test harness source \`artifacts/api-server/test/test-database.ts\` checks \`NODE_TEST_CONTEXT\`, requires only \`TEST_DATABASE_URL\` (no \`DATABASE_URL\` fallback), a test-looking database name and \`TEST_DATABASE_SCHEMA\` matching \`^tm_test_[a-z0-9_]+$\`, plus \`TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA\`. It really executes \`DROP SCHEMA IF EXISTS "<schema>" CASCADE\`, \`CREATE SCHEMA\` and test migrations; **string guards do not establish physical isolation or consent**. Do not invoke the test until all three gates are documented.
4. Do not run a script with \`TEST_DATABASE_URL\` unset: no attempt to substitute \`DATABASE_URL\`. If any of steps 1–3 is missing, report \`ENV_BLOCKED / NOT_EXECUTED\`, not a fake pass or another PLAN-only test.

### 3.2 Exact commands after written execution + reset GO

Run in **the repo root on the trusted executor**; inject \`TEST_DATABASE_URL\` privately from the authorized secret facility before the integration command. The following is a runbook, **not commands executed by A90**:

~~~sh
git fetch origin fix/web-005/t060-b1-backup-v3-integrity-r9
git switch --detach f03cf3d09988a04ba9c2856e205d21f994ff67f1
git rev-parse HEAD
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-server run typecheck

# After A20 physical PG16 approval + owner consent to destroy ONLY
# the dedicated tm_test_a90_r18 test schema:
# TEST_DATABASE_URL must already exist in this trusted process environment.
TEST_DATABASE_SCHEMA=tm_test_a90_r18 \
TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA \
pnpm --filter @workspace/api-server exec node --import tsx --test \
  --test-concurrency=1 ./test/stage-basket-route-execution.integration.test.ts
~~~

**Why these commands:** \`artifacts/api-server/package.json\` defines \`typecheck\` as **both** \`tsc -p tsconfig.json --noEmit\` and \`tsc -p tsconfig.test.json --noEmit\`. Thus it catches test type errors. Running the full focused file validates the existing B1 12-scenario body, additional position body and original Phase3 regressions. The Node process and all test cases must be isolated to that designated DB/schema; do not parallelize destructive suites targeting one schema.

**A50 receipt format (mandatory for \`RUNTIME_VERIFIED\`):** exact \`git rev-parse HEAD\`, redacted host/PG16/role/schema isolation attestation and written reset authorization URL, Node/pnpm versions, frozen install status, typecheck exit, integration command exit, TAP pass/fail/skip totals, successful legal \`null\`/numeric position restore evidence, each corruption HTTP 400 + no-clone counts, and late SQL error with clone census. **A60**, not A90, independently determines final pass/fail on same exact SHA. Any nonzero exit or mismatch is a real \`FAIL\` with logs and reproduction, not waived by a passing source review.

**B3A is separate:** [PR48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48) requires its own isolated exact-SHA test of the two writer-barrier MVCC snapshot scenarios (\`REPEATABLE READ\`, \`accessMode:"read only"\` and same routing-plan transaction). No PR41↔PR48 composite checkout inside WEB-005.

## 4. Backup B2 — owner-signable policy decision required; NO R18 code

**Decision ticket:** \`POLICY-BACKUP/B2-PORTABLE-HISTORY-R18\`  
**Question:** how should a V3 restore retain state history and Undo provenance without rejecting legitimate older snapshots? **No options selected or signed by A90.** A00 requests explicit HQ/owner outcome, coordinated with A20 migrations/CAS, A70 Undo/LIFO and A60 independent QA. Reference [earlier comprehensive B2 form](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A90/WEB-005_A90_R15_BACKUP_B2_SIGNABLE_POLICY.md).

### Verified distinctions the decision must preserve

- Current generated V3 \`matches[*]\` does **not** include database \`matches.revision\` CAS/state version; \`resultHistory[*].revision\` is the **separate result history sequence**. Never require equality without contract/schema proof. A20 must confirm actual 0028 version trigger/migration behavior before selecting restoration policy.
- Current V3 validator checks individual result-history entries, references, uniqueness and positive revisions, but does **not** universally require each completed match to have history nor parity with the latest result-history tuple. \`revertMatch.historyMatchesCurrentResult\` compares current completion tuple and timestamp, so restored Undo success is an unproven runtime property for legacy sparse records.
- Generated V3 \`resultHistory\` and \`actionLog\` are **required arrays**, each can be \`[]\`; \`actionLog[*].undoPayload\` is **nullable**. Truly absent JSON property is not the same as empty array, and older V2 import has a separate contract.
- Recursive \`remapUndoPayload\` uses \`mapping.get(oldId) ?? oldId\` on recognized nested player/match integer IDs; a retained original ID may be orphaned or coincidentally collide after clone (**source mechanism confirmed; cross-clone bad result only STATIC_INFERRED**, not reproduced).
- Portable action logs lack the original database action ID and deterministic tie-break if \`createdAt\` timestamps tie. A70 decides global active completion/Undo LIFO, not A90.

### D1–D6: alternatives for explicit HQ selection

| ID | Policy choice required from owner/HQ | Until signature |
|---|---|---|
| **D1 strict/legacy discriminator** | A: explicit modern-only capability/format marker with old V3+V2 compatibility; B: all V3 strict only after exhaustive historical producer/data audit and rollout; C: diagnostics only. Define malformed old-producer missing JSON fields separately. | Preserve existing lawful import behavior |
| **D2 latest result-history tuple** | A: strict completed match must have latest-history tuple parity; B: reject mismatch only when existing history exists, while missing history degrades direct Revert; C: diagnostics only. Define walkover/BYE/no-contest/revert/date precision. | No new blanket reject of \`resultHistory:[]\` |
| **D3 match state/CAS revision** | A: new optional portable state revision; B: deliberate DB default/rebase with controlled CAS semantics; C: no preservation, restrict unsafe revert until regeneration. Require A20 migration proof. | Do not equate match-state and resultHistory revisions |
| **D4 action log and active Undo** | A: strict typed \`match_result_submitted\` payload + original action order token; B: legacy empty/null/unknown accepted but unsafe Undo disabled; C: execution-time A70 guard, no new preclone checks. Choose tied timestamps and \`actionLog:[]\` behavior. | No self-invented LIFO/active action invariant |
| **D5 nested ID remap** | A: strict preclone reject for recognized missing/foreign nested match/player IDs; B: accept legacy only with documented safe degradation/disabled Undo; C: preserve old fallback acknowledging remaining risk. | No silent remap correctness claim |
| **D6 reject/rollback/UX** | A: strict-profile \`400 INVALID_BACKUP_V3\` before clone + full late-tx rollback + positive V2/legacy V3 tests; B: owner-approved restricted restore with visible warning and disabled affected Undo, without partial success. Define customer-facing messaging and recovery. | No new acceptance policy |

**Owner signature (blank; do not infer approval):**

- HQ/owner identity and date/version: \`________________\`
- D1–D6 selected combinations and written rationale: \`________________\`
- Legacy V2 and legacy V3 acceptance table URL: \`________________\`
- A20 0028/CAS + result-history physical evidence: \`________________\`
- A70 completion action and LIFO provenance signoff: \`________________\`
- A60 source test contract reviewed: \`________________\`
- A00 coordination acknowledgment and GitHub DECISIONS permalink: \`________________\`
- **Authorization of future B2 code:** \`NOT_GRANTED_BY_R18\`.

**After signature, not now:** request a new bounded A00 GO for one test-first pure validator / minimal preclone integration / legacy-positive and strict-negative fixtures. If new serialized fields, migration or broad Undo redesign is necessary, split scope with API compatibility review. No B2 code in R18.

## 5. Formal closeout readiness and decision handoff

| Owner | Required next step | Current category |
|---|---|---|
| **A00/HQ** | Sign D1–D6; certify physical A50 executor or expressly decide \`HANDOFF_WITH_RUNTIME_TEST_DEBT\` separately. A waiver would transfer runtime QA debt to future SWARM-006 **and retain RELEASE NO-GO**, not magically run tests. | \`POLICY_OPEN / WAIVER_NOT_OBTAINED\` in checked evidence |
| **A20** | Verify isolated PG16 instance and reset scope; migration 0028/CAS and legacy triggers; no production SQL. | \`PG16_NOT_AUTHORIZED\` |
| **A50** | Execute exact-head PR41 typecheck/API integration+rollback only with approved separate database; source B1 cannot be promoted otherwise. | \`NATIVE_APP_NOT_EXECUTED\` |
| **A60** | Preserve R17 conditional source verdict on unchanged SHA; review actual A50 proof and independently classify runtime/QA. | \`SOURCE_ACCEPTED_CONDITIONAL / FULL_QA_PENDING\` |
| **A70** | Validate completion Undo action/LIFO semantics as B2 dependency, without A90 editing PR42. | \`DEPENDENCY_OPEN\` |
| **A10/A00** | Track PR41/PR48 overlapping \`backup-v3.ts\` + integration test and final-only manifest. | \`NOT_INTEGRATED\` |

**Mandatory stop:** no new PR/source patch in A90 R18; no composite checkout, merge, cherry-pick, migration, shared/production DB mutation, paid CI manual run, staging/live or early SWARM-006 dispatch. Formal WEB-005 handoff depends on full source closure or signed owner dispositions **and** the distinct explicit runtime-debt handoff waiver if tests remain unavailable. No owner signature/waiver was verified in this A90 scope.

**R18 A90 FINAL:** \`SOURCE_ONLY_DELIVERED / PR41_NO_CHANGE_SOURCE_RECONCILED / A60_SOURCE_ACCEPTED_CONDITIONAL / APP_RUNTIME_NOT_EXECUTED / B2_POLICY_OPEN / RELEASE_NO_GO / SWARM006_HOLD\`.
