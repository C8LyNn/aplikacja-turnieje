# WEB-005 / DECISIONS

**Owner:** 00 — Implementation Lead; **R3 date:** 2026-10-14. Read with `BACKLOG.md`. All refs verified against private GitHub repository. No production access.

| ID | Decision | State | Basis / condition |
|---|---|---|---|
| D001 | Replit FROZEN, production config/DB/secrets untouched | ENFORCED | User instruction; no Replit tool calls |
| D002 | PR #32 release merge and deploy | STOP | 856 files, incomplete gates, unresolved migration/auth |
| D003 | T010 Pack19 minimal contract fix / PR #35 | QA_REVIEW GO | Verified CI Pack19 8/8 and unchanged read-only/snapshot intent; independent A60 to accept |
| D004 | T020 ledger, manifest, preflight and recovery analysis | GO | Source-only; no SQL changes or database execution by 00 |
| D005 | T020 proposed canonical manifest 0027–0040 | **CONCEPTUAL GO FOR FIXTURE DESIGN ONLY / IMPLEMENTATION STOP** | 0030–0031 release; 0032–0040 editor. Require raw checksums, ledger/canonical history, SQL BEGIN/COMMIT normalization, PostgreSQL16 clean and historical upgrade runs, independent A60, final 00 approval. |
| D006 | T030 code hardening of catalog 3 writes | QA_REVIEW GO | Fail-closed role separation, no production secret |
| D007 | T130-A60 independent QA | GO | Reviews, not implements, tested code |
| D008 | T040–T060 wave2 and later waves | HOLD | Wave1 unresolved; PR #7 and #27 stacked |
| D009 | CI release certification | STOP | Pack19 green **in PR35 only**; Pack20 real FAIL; rest skipped; T030 PR34 CI fails earlier Pack19 |
| D010 | Any merge/release/deployment/prod token provisioning | OWNER/HQ APPROVAL REQUIRED | Never implied by PR or code review |
| D011 | WEB-004 complete consolidated handoff | BLOCKED/B001 | Missing; provisional backlog |
| D012 | Pinned release baseline | CONFIRMED | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` unchanged |
| D013 | Central registers only on `chore/web-005/t000-wave1-control` | ENFORCED | Do not touch release/main |
| **D014** | Assign T015-A40 to Pack20–26 source-contract repair | **GO CONDITIONAL** | Branch now `f6e94aae9239d578e23d5a8fb23a2446ea669a41`, PR #36 OPEN DRAFT; exclusive contracts Pack20/21/25/26; no Pack19 overlap; test suites not executed; A60 acceptance required |
| **D015** | Assign T131-A50 to isolated PostgreSQL16 + test-execution preflight | **GO PREFLIGHT** | Environment support, not implementation nor independent QA; no use of production DB |
| **D016** | Keep T010-A10 confined to Pack19 closeout | **ENFORCED** | Free implementation slot to A40, A60 independent acceptance |
| **D017** | Select PR #34 as preferred Steam Catalog security implementation | **DECIDED FOR QA ONLY** | Reference middleware matches editor; 403/503 distinction; deeper PostgreSQL HTTP/no-write fixture. Runtime tests not executed, merge STOP |
| **D018** | Classify PR #33 as superseded alternative | **HOLD / OPEN** | Do not close or merge yet; decision documented |
| **D019** | Integration ordering | **PLAN ONLY** | release baseline -> reviewed PR35 -> reviewed T015 -> QA-approved PR34 -> full isolated gates; T020 SQL separate |
| **D020** | Dedicated integration branch | **BLOCKED** | Creation attempt blocked by tool safeguards. Do not bypass, no branch created, no code integration authorized |
| **D021** | Maximum concurrent implementation lanes | **3** | T015/A40, T020/A20, T030/A30; T010 closeout only; T131 support; T130 QA |
| **D022** | Wave1 release gate | **NO-GO** | CI red and missing runtime auth/integration/DB upgrades |

## Confirmed CI evidence

- [GitHub Actions 38550541899](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38550541899) at T010 `7cb283aa...`: safety 23/23, Pack19 readiness 26/26, Pack19 source 8/8, Pack20 domain 15/15 PASS; Pack20 source 6/7 FAIL; downstream SKIPPED.
- [GitHub Actions 38550962951](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38550962951) at T030 `030d0f5f...`: Pack19 FAIL because T010 change absent; unrelated to auth test correctness.
- [PR #36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) HEAD `f6e94aae9239d578e23d5a8fb23a2446ea669a41`: new source-contract repair commit `[skip ci]`, 4 files, **Node/Pack17 NOT_EXECUTED**.
- [PR #33](https://github.com/C8LyNn/aplikacja-turnieje/pull/33), [PR #34](https://github.com/C8LyNn/aplikacja-turnieje/pull/34), [PR #35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) remain OPEN draft.
- Source R2 migration JSON `WEB-005_T020_A10_R2_TARGET_MANIFEST_PROPOSAL.json`: 14 canonical entries 0027–0040, raw SHA-256, logical ID and postconditions; `runtime_rendered_sha256=null` and historic ledger attestation absent; **not migration test PASS**.

## No unauthorized operations

No modifications to main/release, no merges/cherry-picks/deployments or production SQL. No paid workflow was intentionally dispatched by 00. Source/CI evidence is not a claim about deployed Replit runtime.


## R3 live-update decision

**D023 — T015 R1 handoff:** [PR #36](https://github.com/C8LyNn/aplikacja-turnieje/pull/36) created after coordinator registered task; accept for independent A60 review (GO QA), **STOP** integration/merge while tests remain NOT_EXECUTED. Latest HEAD `f6e94aae9239d578e23d5a8fb23a2446ea669a41`. No workflow dispatch without cost authorization.


## R4 decisions — reuse completed specialists without exceeding Wave1 limits

| ID | Decision | Status / qualification |
|---|---|---|
| D024 | Allocate T016-A10 to Agent 10 after T010 handoff | GO SOURCE-ONLY: map integration order, CI and Pack17 gates; no code merge or branch operations; A60 acceptance still required for PR35 |
| D025 | Allocate T132-A50 to Agent 50 after T131 preflight | GO SOURCE-ONLY: concrete test harness/fixture plan; runtime DB operations require proved isolation and authorization |
| D026 | Do not prematurely recycle Agent 40 | HOLD NEW T017 until independent QA/rework of PR36 completed; then Pack17 internal gate audit only, no Pack20–26 ownership collision |
| D027 | PR34 HEAD advanced to `fae2eea2f22df3f1b02ad035a7db00bc411ea73f` | Requires renewed independent QA at exact head; prior evidence may not cover new commits |
| D028 | Active implementation/analysis cap | THREE: T015/A40, T020/A20, T030/A30. T016/T132 preliminary read-only; T010 closeout, T130 independent QA. No Wave2 implementation |
| D029 | User dispatch through existing worker threads | PENDING: no automatic delegation to other conversations; repo registration is not execution |

No merge, deploy, Replit, production data/schema/secrets changes or paid CI dispatch were performed in this R4 assignment update.


## Incoming WEB-004 follow-up — capacity policy

| ID | Decision | State / trigger |
|---|---|---|
| D030 | Treat upcoming WEB-004 follow-up as **unverified intake**, not authorized implementations | ACTIVE; no report received yet |
| D031 | Reserve flexible capacity for new P0/P1 findings in future allocation | ACTIVE; first close or pause lower-priority lane, then schedule within max 3 implementation + 1 independent QA |
| D032 | Link all new WEB-004 finding IDs to existing WEB-005 task ownership before creating agents/PRs | REQUIRED when report arrives; record duplicates and any already-patched-but-not-tested |
| D033 | New Wave2 task count, specialist roles and sequencing | DEFER until report contents, severity, dependencies and regression scope verified |
| D034 | Source-of-truth intake output | Coordinator must update BACKLOG.md and DECISIONS.md and produce WEB-005-00-WEB004-NEXT-INTAKE-R1 after actual handoff |
| D035 | Existing security/release restrictions persist despite new discoveries | NO REPLIT, NO PROD, NO AUTO-MERGE/DEPLOY, no unauthorized paid CI or test DB access |


## Next security assignment to Agent 30

| ID | Decision | Status |
|---|---|---|
| D036 | Allocate **T031-A30 — proxy-addr / trust proxy hardening** after T030 security PR #34 implementation handoff | **GO SOURCE-ONLY**. WEB-004 A80 SEC-013 / GHSA-jqcg-44mw-7w3h. No automatic T031 code changes or new branch until 00 reviews T030 QA and implementation capacity. |
| D037 | Preserve PR #34 ownership and QA independence | **ENFORCED**. A60 must evaluate current HEAD `fae2eea2f22df3f1b02ad035a7db00bc411ea73f` (revalidate drift), PR34 is still OPEN DRAFT; T031 must use a separate branch and must not weaken 403/503 auth guarantees. |
| D038 | Lockfile conflict coordination | **REQUIRED**. A30 and A10 T016 must agree on `pnpm-lock.yaml` ownership before implementation, and A50/A60 must provide isolated tests. |


## WAVE R7 — end-R6 reconciliation decisions (2026-10-14)

| ID | Decision | Gate |
|---|---|---|
| D039 | Record new T031/PR37 and T021/PR38 as source-ready candidate patches, not release-certified | ACCEPT IN BACKLOG / INDEPENDENT QA REQUIRED at exact HEAD |
| D040 | A10 prepares SWARM-006 handoff delta P04/P05 for PR37/38 | GO PACKAGE-DESIGN ONLY, P04/P05 CONDITIONAL and never represented as QA-accepted without A60 |
| D041 | A40 may implement strictly bounded T017 fail-closed test gate corrections | GO CODE-ONLY lane 1; no merging to PR36; isolated branch & no paid CI |
| D042 | A70 may implement narrow T040 MP1 cancel/restore protections test-first | GO CODE-ONLY lane 2; future MP2/MP3/MP4 and DB/migrations need separate decisions |
| D043 | Hold implementation slot 3 for new validated P0 findings from incoming consolidated WEB-004 report | ACTIVE CAPACITY RESERVATION; no invented findings |
| D044 | A20/A30 transition PR38/PR37 into QA/fix-only until defect evidence, not broad new patch authoring | ACTIVE; no overlapping files or DB DDL |
| D045 | SWARM-006 owns integrated candidate + release; SWARM-007 owns protocols, Google Drive folder architecture, records | REQUIRED OWNERSHIP BOUNDARY; WEB-005 is patch producer, not deployment owner |
| D046 | Release gate stays NO-GO; no automatic merge/CI/production changes | BLOCKED pending full independently verified integrated test evidence and HQ decision |


## WEB-004 HANDOFF R2 — WAVE NEXT INTAKE (2026-10-14)

| ID | Coordinator decision | Status/gate |
|---|---|---|
| D047 | Receive [WEB-005_WAVE_NEXT_IMPLEMENTATION_PLAN_R1.md](./WEB-005_WAVE_NEXT_IMPLEMENTATION_PLAN_R1.md) as canonical R2-to-implementation mapping | ACCEPTED FOR PLANNING; WEB-004 A60 cross-report QA COUNTERSIGN PENDING |
| D048 | Deduplicate OPS-01/02/03 under T040 and recognize NEW PR #39 MP1 at 3e0a2dd64d03df5a85b7875af7dc012c796d01b3 | EXISTING; PR39 OPEN DRAFT / native PostgreSQL NOT_EXECUTED; MP2 direct Revert CAS/global LIFO separate GO |
| D049 | Preserve existing T017/T020/T021/T030/T031/T130/T133 work | EXISTING; no second implementation for CI, Steam, proxy, migration ledger |
| D050 | Register T050/T051 sport+lifecycle, T060 Backup V3, T080 privacy/auth, T055 basket CAS, T110 frontend async, T100 presentation | NEW / SOURCE-ONLY DESIGN; proposed owners A80/A90/A100/A110/A120; no code implementation permission |
| D051 | Reserve next implementation slot for P0 T060-B1 after independent contract/PG16 readiness | HOLD UNTIL EXPLICIT GO; maximum 3 parallel implementations and one independent QA lane |
| D052 | Distinguish SOURCE-CONFIRMED, STATIC-INFERRED, HYPOTHESIS, POLICY OPEN, WITHDRAWN, MAIN-ONLY | REQUIRED; prior A60 final 38 counters provisional and no runtime PASS asserted |
| D053 | Request owner/HQ policy decisions: SWISS/RR/DE, terminal Swiss, SE currentRound, Cancel CAS, Basket CAS, Steam 403/503, Backup portable revisions, private cache | POLICY OPEN; behavioral changes blocked without signed outcome |
| D054 | Packet manifest P01–P06 conditional, including PR39; future packet IDs only after independent patches exist | SWARM-006 integration ownership; WEB-005 does not merge or deploy |
| D055 | SWARM-007 stores/report-architecture after establishing conventions; WEB-005 supplies identifiers and provenance | No fabricated Drive folders or automatic conversation transfer |
| D056 | Product release remains NO-GO | Composite SHA, complete native CI/PG16/HTTP/browser tests, A60 exact-SHA signoff and HQ authorization required |

No merge/cherry-pick, production access, SQL DDL or paid CI dispatched as part of this coordinator intake.


## R8 dispatch addendum

| ID | Decision | State |
|---|---|---|
| D057 | Record T017 PR #40 source candidate SHA f9ad033683d93e442c7915a840e7b3f8bfdbb933 | QA_PENDING; native Pack17 \`--full\` and independent signoff missing |
| D058 | Advance T040 MP1 PR #39 pinned HEAD to 16053ee132756ca05b6f2cd1f0cabae823905387 | QA_PENDING; MP2/MP3 not authorized to code |
| D059 | Prepare P01–P07 manifests through A10 for SWARM-006 | GO READ-ONLY; P07=PR40, P06=PR39, neither integrated |
| D060 | Dispatch proposed A80/A90/A100/A110/A120 for R2-derived NEW queues | GO SOURCE-ONLY; no speculative app runtime PASS, no automatic implementation slots |
| D061 | Preserve 3-lane cap and independent A60 certification | NO new implementation without coordinator explicit assignment and policy resolution |


## R9 — WEB-005 batch handoff policy (owner direction, 2026-10-14)

| ID | Decision | State / effect |
|---|---|---|
| D062 | Owner prefers batching **multiple coherent, verified WEB-005 fix packages** before activating SWARM-006 for a new WEB-005 integration wave | **ACTIVE.** Do not initiate SWARM-006 intake/integration merely because P01–P05 or P01–P07 source manifests exist. |
| D063 | A10 continues maintaining rolling packet manifests P01+ as individual PRs mature, but marks the cross-swarm send `BATCH_BUFFERED_NOT_DISPATCHED` | Source reports, SHA pinning and per-package QA continue; no automatic handoff or integration authorization. |
| D064 | Trigger a WEB-005→SWARM-006 integration wave only on the owner's/coordinator's explicit authorization of a **meaningful, compatible, independently reviewed batch** with clear dependencies, tests and rollback | No arbitrary mandatory count; prefer a coherent release milestone to an endless wait or a small unrelated PR set. Critical security or integrity fixes may warrant an explicit exception approved by owner/HQ. |
| D065 | Batch readiness != release readiness | Each individual packet may be SOURCE_READY/QA_ACCEPTED while full integrated CI/PG16/browser/staging remain SWARM-006 future gates; never claim deployment readiness early. |

**Operational consequence:** WEB-005/A10 maintains queue and packaging but does not send/activate SWARM-006 for this application until the owner requests a consolidated wave. SWARM-007 may continue designing report/folder architecture independently; do not claim files have already moved. No change to three implementation lane cap or existing approval restrictions.


## R10 — Owner directive: complete WEB-005 before SWARM-006 handoff (2026-10-14)

| ID | Decision | Status |
|---|---|---|
| **D066** | WEB-005 will **finish its approved entire repair backlog** before one final cross-swarm handoff to SWARM-006, rather than sending individual PRs or intermediate batches | **ACTIVE / supersedes the interim batch-dispatch proposal in D062–D064**. A10 maintains internal P01+ manifests; **no SWARM-006 dispatch until WEB-005 formal closeout**. |
| **D067** | WEB-004 has concluded additional audit reports are **not needed now** | **ACTIVE**. Work exclusively from the received `WEB-004_TO_WEB-005_HANDOFF_R2_2026-10-14.md`, its indexed specialist evidence, the existing WEB-005 backlog and the valid QA countersign if supplied. No speculative additional WEB-004 campaign. |
| **D068** | Define WEB-005 `FINISHED` by task closure and evidence, not arbitrary time/PR count | All approved P0/P1/P2 tasks either implemented and independently scoped-QA accepted or explicitly dispositioned `POLICY_OPEN`/`BLOCKED`/`WONT_FIX` by authorized owner; decisions and risks documented. Source review or draft PR alone does not mean completed. |
| **D069** | A10 packages **one final handoff** only after local A60 quality reconciliation, 00 scope reconciliation and owner/HQ approval | SWARM-006 receives exact source/base HEAD SHAs, per-PR status, dependency graph, test evidence, unresolved limitations and rollback. SWARM-006 owns integration/composite SHA/full integrated QA and deployment proposal. |
| **D070** | Existing P01–P07, QA evidence and documentation continue internally; SWARM-007 may independently develop Google Drive protocols/storage architecture | Internal preparation is allowed; **no implied cross-thread automatic transfer, merge, production access or release authorization**. |
| **D071** | Any emergency exception to final-only handoff (e.g. exceptional integrity/security hazard) requires explicit new owner/HQ decision | No implicit interim dispatch; no release bypass. |

**Dispatch state:** `WEB005_IN_PROGRESS / SWARM006_FINAL_HANDOFF_DEFERRED`. Existing approvals remain bounded by task and implementation concurrency caps. A60 is independent; QA deficits, test environment absence, pending product policies and 38-case WEB-004 audit matrix must be explicitly tracked. Release stays NO-GO until SWARM-006 integrated gates and HQ authorization.

## R9 — Source-design wave complete / next implementation lanes (2026-10-14)

| ID | Decision | Gate |
|---|---|---|
| D072 | Register [WEB-005_NEXT_REMEDIATION_WAVE_R9.md](./WEB-005_NEXT_REMEDIATION_WAVE_R9.md) after source-only A80/A90/A100/A110/A120 reports | Accepted as coordinator PLAN, not execution evidence |
| D073 | Source patch PR #40 latest HEAD 9a8287271299a59fc9291b8d253299a8d109a35d; PR #39 HEAD 16053ee132756ca05b6f2cd1f0cabae823905387 | Existing PR QA only; no reimplementation of T017 or MP1 |
| D074 | Propose next three narrow code-only lanes: A90/T060-B1, A70/T040-MP2A, A100/T080-S1 | Agent-specific 00 GO required; avoid contested policies and overlapping files; max 3 lanes |
| D075 | Carry source-only A80/T050+T051, A110/T055+T110, A120/T100 until file availability and policy decisions | NO unapproved code or invented runtime outcomes |
| D076 | Keep A10 P01–P07 internal and continuously refreshed; no SWARM-006 activation before final WEB-005 closeout | Owner final-only directive remains binding |

No deployment, merge, migrations, paid CI or remote Drive transfer occurred in this planning update.


## R9 prompt distribution standard (2026-10-14)

| ID | Decision | Scope |
|---|---|---|
| D077 | Publish one master prompt document **[WEB-005_WAVE_R9_AGENT_PROMPTS.md](./WEB-005_WAVE_R9_AGENT_PROMPTS.md)** for all 13 R9 roles, with exact stable agent sections | Agents receive the same short retrieval prompt and execute only their own Axx section |
| D078 | R9 code execution scopes are narrow: A90/T060-B1, A70/T040-MP2A and A100/T080-S1; all other agents QA/docs/test-first source-only | Three-lane cap, per-file conflict holds, separate QA A60, no cross-swarm integration |
| D079 | Wave prompts are immutable during the wave; later waves get separately versioned central docs | No agent may edit/promote its scope unilaterally; 00 reconciles completed reports and prepares R10 |


## R10 — central wave dispatch / R9 reconciliation (2026-10-14)

| ID | Decision | Gate |
|---|---|---|
| D080 | Confirm R9 yielded P08 PR #41 Backup V3 B1 HEAD e847cb705296a48ab5c68ece96776cd0e0bbb417 and P09 PR #42 Global Undo MP2A HEAD 1ae0ccb801f4177052bff1ec7041e55b8c992c8b | SOURCE PATCH CREATED / QA & real PG16 NOT_EXECUTED / DRAFT, do not reimplement |
| D081 | A100 R9 T080-S1 remained docs-only HOLD because routes/tournaments.ts file ownership conflicted with A70 | SOURCE DESIGN READY; no phantom PR or implementation claim |
| D082 | Publish one [WEB-005_WAVE_R10_AGENT_PROMPTS.md](./WEB-005_WAVE_R10_AGENT_PROMPTS.md) for all A00–A120 | Central §0–§2 + only matching AGENT Axx section, exact SHA preflight, separate agent reports |
| D083 | R10 code-only lanes are **A100/T080-S1A**, **A80/T050-RR**, **A110/T110-UX042** | GO narrow source patches only, isolated branches, no policy change, 3-lane cap; A100 owns routes/tournaments.ts and A80 revert-match.ts after A70 R9 work freeze; conflict → HOLD |
| D084 | R10 remaining agents maintain QA, tests, manifest P01–P09+ and policy/test-first plans | A50 physical PG16 preflight, A60 independent exact-SHA verdict; no runtime PASS from synthetic harness |
| D085 | No SWARM-006 handoff until WEB-005 formally closes full approved backlog; WEB-004 no further audits now | FINAL-ONLY OWNER POLICY remains, SWARM-007 independent folder/communication architecture, RELEASE NO-GO |

No integration, migrations, deployment, paid CI or production access is authorized by this wave planning documentation.


## R11 — R10 closeout and centralized instructions (2026-10-14)

| ID | Decision | Status |
|---|---|---|
| **D086** | Record R10 new P10=PR #43 UX042 (96a6068f69027574ac76e18d4d5a2c444b5a914a), P11=PR #44 S1A (2f0187b7242681c394c09058b5ef647667206bd6), P12=PR #45 RR reopen (a7a87bc019731191dbfa44bee6939e3fa25e27f4) | **SOURCE PATCH PROPOSED / OPEN DRAFT**; PG16/React actual tests and independent review not automatically proven; no merge |
| **D087** | Publish [WEB-005_WAVE_R11_AGENT_PROMPTS.md](./WEB-005_WAVE_R11_AGENT_PROMPTS.md) as the only central R11 instruction set for 13 agents | **READY FOR R11**, shared §0–§2 + only assigned Axx; agents keep separate reports |
| **D088** | R11 implementation source-only lanes: A90/T060-B3A consistent Backup V3 export snapshot; A100/T080-S1B-D guarded DELETE tournament; A120/T100 PR-A DE/labels/final overlay | **GO NARROW CODE-ONLY** subject to owner/file conflicts, max three lanes, no policy changes, separate isolated draft PRs |
| **D089** | Urgent non-code priority: A50 safe disposable physical PostgreSQL16/API/React execution and A60 independent QA on PR #41–45 | **P0**; cannot claim app runtime PASS from authored fixtures or harness; no shared/prod DB |
| **D090** | Keep MP2B direct Revert CAS, terminal Swiss, Swiss/DE sport rules, T055 Basket CAS, portable Backup revisions pending explicit product policy | **SOURCE-ONLY / POLICY OPEN**, no automatic implementation |
| **D091** | WEB-004 Bug Hunting 002 report R2 remains sole audit input; no new WEB-004 reports requested | **ACTIVE** |
| **D092** | SWARM-006 receives a single handoff only after formal WEB-005 whole-backlog closeout and owner/HQ authorization | **ACTIVE**; all P01–P12+ are INTERNAL BUFFER, SWARM-007 information architecture independent |

**NO-GO:** no integrated SHA, PG16/HTTP/frontend full runtime suite absent, all draft PRs unmerged, no production authorization. Documentation commits are not merge or deploy.


## R12 — R11 closeout and central agent instructions (2026-10-14)

| ID | Decision | State |
|---|---|---|
| **D093** | R11 produced PR #46 (T080 DELETE) `7f60849e389a7ed35fdd39dd5493c4c4c267d860`, #47 (T100 presentation) `f09a13623faca8d7ab29b09a2c5b43907c2acd0b` and #48 (T060 B3A MVCC) `2a8a4c72cb4a3a37402a346fd0acc83b03b39be3` | OPEN DRAFT / PATCH_PROPOSED / no new confirmed native app tests; no merge |
| **D094** | Publish [WEB-005_WAVE_R12_AGENT_PROMPTS.md](./WEB-005_WAVE_R12_AGENT_PROMPTS.md) for all 13 agents A00–A120 | READY R12, shared §0–§2 then only own Axx section, individually report |
| **D095** | R12 bounded source-only code lanes: **A70 malformed Undo payload**, **A100 post-lock password/visibility auth**, **A110 UX045 Backup preview async+credential hygiene** | GO only narrow code-only under file ownership & policy gates, max 3 parallel; no new product semantics |
| **D096** | Preserve P01 PR35 Pack19 contract fix as sole existing fix; recent PR46–48 Actions fail old base Pack19 regex `readOnly:true` vs actual `accessMode:"read only"` | Root cause established from GitHub job logs; do not interpret upstream CI fail as target PG/React patch failure or duplicate P01; full integrated CI remains future SWARM-006 gate |
| **D097** | A50 safe physical isolated PG16/Node/React execution and A60 independent exact-SHA review remain P0; all P01–P15+ tracked as INTERNAL_BUFFER | Runtime tests absent or unconfirmed for new patches; no PASS claims, no unsafe DB/paid CI |
| **D098** | Continue source-only policy queue: terminal Swiss/SE/Swiss/DE, T055 Basket CAS, T060-B2 portability/history, MP2B strict public Revert/Host, Steam and session policies | POLICY_OPEN; no silent implementation |
| **D099** | WEB-004 provides no new reports and SWARM-006 remains HOLD until formal closeout of all approved WEB-005 backlog | Owner final-only directive binding; SWARM-007 operates infrastructure separately |

**Release:** NO-GO. No merge/cherry-pick, staging/live, production migration, Replit or SWARM-006 dispatch authorized by documentation updates.


## R13 — R12 closeout and central QA-first execution (2026-10-14)

| Decision | Rule / status |
|---|---|
| **D100** | R12 yielded three **OPEN DRAFT** source patches: PR49 `99298b81501c3e7764d653604923522a19b9f05c` A100 password/visibility post-lock auth, PR50 `5457a74187edc263730c3a4b25a663bdf5531ee9` A110 backup-preview epoch/cache, PR51 `2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a` A70 malformed history Undo. Actual native PG/RTL execution and independent exact SHA QA not yet established; source tests authored, not PASS. |
| **D101** | Publish one [WEB-005_WAVE_R13_AGENT_PROMPTS.md](./WEB-005_WAVE_R13_AGENT_PROMPTS.md) for A00 through A120, §§0–2 shared, per-agent Axx sections, QA-first prioritization. |
| **D102** | Allocate at most **three conditional, narrow source-code-only R13 lanes**: A100/T080-S2A private auth-context cache invalidation; A110/T110-UX046 stale stage-lifecycle modal; A120/T100-PR-B external RR standings freshness. If source is already correct, `SOURCE_RECONCILED/NO_PR`, never speculative patch; file ownership and no cross-PR merge. |
| **D103** | A50 isolated real frontend/PG16 test evidence and A60 independent source/runtime reviews of all P01–P18+ remain **P0 gating**, with priority PR41–51. Do not equate a created test to an executed test. |
| **D104** | Old release Pack19 `readOnly:true` matcher vs actual `accessMode:"read only"` is already corrected by separate PR35; do not duplicate; standalone CI failures do not establish feature-specific negative result. Full integrated regression remains future SWARM-006 gate, not WEB-005 self-merge. |
| **D105** | Owner/HQ policy signatures still needed for terminal Swiss, Basket CAS, Backup B2 portability/history, direct public Revert CAS/Host rollout, sport rules and selected session/Steam behavior. NO unapproved product semantics. |
| **D106** | WEB-005 finishes approved backlog before **one final handoff** to SWARM-006; no WEB-004 new report cycle, SWARM-007 information/file architecture independent. RELEASE NO-GO. |

No merge, production SQL, paid rerun, deployment or SWARM-006 dispatch is authorized.


## R14 — R13 closure and independent QA stabilization (2026-10-14)

| ID | Decision | Status / constraint |
|---|---|---|
| **D107** | Register R13 new open draft patches: PR #52 A110 UX046 modal @ `cce73ec47445102b216b3f8eceb4ec9de67eb1a7`, PR #53 A100 S2A cache @ `6a8f0c3e5775eb056df75ebdd7b33df7cbc78979`, PR #54 A120 T100 PR-B RR @ `dbba0eb82920b4f324866b1b983e1211459f52ec` | **PATCH_PROPOSED, NOT MERGED**. Author reports state actual targeted RTL NOT_EXECUTED, independent A60 exact SHA QA not established by current readback. |
| **D108** | 21 open draft PR #34–54 now constitute the WEB-005 internal candidate backlog | **Not 21 independently accepted patches and not an integrated build**. PR32 release→main separate, PR33 competing Steam source HOLD. |
| **D109** | Adopt one [WEB-005_WAVE_R14_AGENT_PROMPTS.md](./WEB-005_WAVE_R14_AGENT_PROMPTS.md) for A00 plus A10–A120 | 13 unique agent sections, shared §0–§2 and per-agent reports. |
| **D110** | R14 is **quality-gate first: zero preauthorized new source-code implementation lanes** | A50 must produce actual safe executable evidence or precise blocker, A60 must independently review exact SHA, A10 update manifest. Fix-specific code GO only after exact sourced FAIL, A00 decision and conflict ownership. |
| **D111** | Existing PR35 Pack19 matcher fix is the sole acknowledged correction. CI on R13 PR52/53/54 fails at old baseline Pack19 matcher step, before target RTL suites | Do not duplicate PR35 nor claim the R13 feature tests ran; preserve full integrated release gates for later SWARM-006. |
| **D112** | Escalate owner/HQ policies for Terminal Swiss, SE/Swiss/DE, Basket CAS, Backup B2 portability, Direct Revert CAS/Host rollout, Steam/session behavior | **POLICY_OPEN** until signed; no implementation by assumption. |
| **D113** | Existing owner final-only policy persists: WEB-005 must formally finish accepted WEB-004 HANDOFF R2 remediation before one SWARM-006 transfer | SWARM-006 remains HOLD; no new WEB-004 reports; SWARM-007 maintains independent exchange/Drive architecture. |

**NO-GO:** No R14 document authorizes merge, cherry-pick, an integration branch, manual paid CI, destructive SQL, live deployment, or cross-swarm dispatch.
