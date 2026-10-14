# WEB-005_A90_R19_HANDOFF

**TASK:** \`WEB-005-T060-A90-R19\` · **ROLE:** A90 / Backup V3 Integrity & Restore · **DATE:** 2026-10-14 (Europe/Warsaw)  
**MODE:** SOURCE ONLY, **PR41 CODE FROZEN**. No merge, no SQL, no staging/live, no SWARM-006.  
**MAIN DELIVERABLE:** [WEB-005_A90_R19_BACKUP_OWNER_GATE.md](./WEB-005_A90_R19_BACKUP_OWNER_GATE.md) — detailed A50 physical PG16 fixture/commands and owner/HQ signable Backup B2 alternatives D1–D6.  
**PUBLICATION:** only agent A90 documentation on \`docs/web-005/a90-r19-backup-owner-gate\` (isolated from concurrent control-branch writers).  
**RELEASE:** \`release/tournament-ops-20261013-01\` at \`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`.

## Exact SHA / source acceptance
| Packet | R18 old SHA → R19 current HEAD SHA | Reviewed paths / outcome |
|---|---|---|
| [P08 / PR41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) | \`f03cf3d09988a04ba9c2856e205d21f994ff67f1\` → \`f03cf3d09988a04ba9c2856e205d21f994ff67f1\` | OPEN DRAFT, base \`1fdc401...\`, **NO R19 CODE CHANGE**. Existing four paths: \`backup-v3-flow-integrity.ts\` (+209), \`backup-v3.ts\` (+18/-5), \`stage-basket-route-execution.integration.test.ts\` (+229), R9 report (+63). |
| [P15 / PR48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48) | \`2a8a4c72cb4a3a37402a346fd0acc83b03b39be3\` → same | Separate OPEN DRAFT, no code change. Conflicting \`backup-v3.ts\` and focused test paths with PR41. |
| [P01 / PR35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) | \`7cb283aa82273a1e22daf9051a82311eef53760c\` → same | Separate Pack19 source-regex fix, unmerged. |

**Independent A60 R18 QA:** [exact R18 report](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_INDEPENDENT_QA.md), blob \`656a8850a6358e5b4b2517220a5fc55f99dc014f\`: \`SOURCE_ACCEPTED_CONDITIONAL\` for P08 B1 QPE per-basket position order, OP↔QPE player/rank, exact non-null source position and legal explicit \`null\`. Same source validator blob \`a8482fa7137f1d71817c8b4ec43da7d6292f8183\`. This **does not** imply PG16, HTTP, rollback or full QA success. Zero GitHub formal review submissions alone is not evidence to disregard A60's separately published independent report.

**Actual R19 A90 tests:** \`NOT_EXECUTED\`. Operations were GitHub live PR/commit/code/type/QA/CI/DECISIONS reads plus publication. **No local Node/pnpm/typecheck/API/PostgreSQL16/HTTP command or exit/TAP evidence**. [A50 R18 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R18_RECEIPT.md), blob \`a54e410eddf12ff9b909cb8a73cfd91d1d91acad\`: Node/Git preflight exit0, no full checkout (exit128), no pnpm or isolated PG16; **0 native tests**.

**CI status on P08 SHA:** [run 38623319193](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38623319193), job \`116056098551\` FAIL before app tests at obsolete Pack19 \`readOnly:true\` matcher, static/DB gate skipped. Not a B1 feature PASS or FAIL. No manually triggered expensive CI.

## B1 exact QA for A50, only after owner/A20 PG16 written reset GO

- \`B1-P1\`: valid current exporter-approved QP/QPE/OP and executed route → 2xx import, complete clone+participant/receipt, route idempotence; \`B1-P2\`: legal old/optional-absent V3 and explicit legacy \`sourceBasketPosition:null\` remain 2xx; \`B1-P3\`: exact numeric position matching QPE survives import/DB readback.
- \`B1-N01..N07\`: swap/gap/omit QPE and swap/mismatch/zero/omit receipt source position; \`B1-N08..N19\`: 12 prior qualification/route corrupted variants. Per variant typed \`BackupV3ValidationError\` and HTTP \`400 INVALID_BACKUP_V3\` before clone, root+child zero-write. Existing source tests have **7 and 12 scenarios inside two Node test bodies**; no claim of 19 TAP cases or child census for every preclone mutation.
- \`B1-RB1\`: synthetic \`seed=2147483648\` after root/stages insert triggers PostgreSQL INTEGER overflow, not preclone error; HTTP fail and full rollback proven by before/after 13-table census/orphan check. Test authored, not run.
- **Executable commands once authorized**, on clean exact SHA and trusted dedicated runner (full script in main report): \`pnpm install --frozen-lockfile\`; \`pnpm --filter @workspace/api-server run typecheck\`; \`pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/stage-basket-route-execution.integration.test.ts\`. Node22/pnpm10, confidential test-only \`TEST_DATABASE_URL\` (never production fallback), \`TEST_DATABASE_SCHEMA=tm_test_a90_r19\`, \`TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA\` **only with verified isolated disposable PG16 + separate explicit authorization for actual DROP SCHEMA CASCADE**.
- **Required receipt:** exact \`git rev-parse HEAD\`, Node/pnpm/PG version, redacted isolated test DB identity/role + written reset GO, real commands/exits/TAP, preclone 400/no clone, valid legacy-null/numeric restore, full rollback. Then A60 independent runtime verdict. Until then \`RUNTIME_NOT_EXECUTED\`.

## Backup B2 / named owner signature blocker

**Ticket:** \`POLICY-BACKUP-B2-PORTABLE-HISTORY-R19\`, currently **\`POLICY_OPEN / UNSIGNED\`** in examined [DECISIONS.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/DECISIONS.md) and [A60 R18 final gate](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_FINAL_HANDOFF_READINESS.md).

**A00/HQ next:** sign **D1** strict format marker versus legacy V2/V3; **D2** latest \`result_history\` vs completed match and missing history; **D3** portability of DB \`matches.revision\` CAS vs distinct \`resultHistory.revision\`; **D4** active completion action/Undo/LIFO tie-break; **D5** nested old-player/match ID fallback \`?? oldId\` reject/degrade/accept; **D6** \`400 INVALID_BACKUP_V3\` preclone vs late rollback + restricted legacy user messaging. No options preselected; request A20 0028 trigger proof and A70 Undo/Host contract, then named owner/HQ permalink/date. **No B2 source patch until separate explicit future A00 GO.**

## Final A00 handoff / dependencies

- **A50/A20** own physical runner and safe DB; **A60** owns independent executable-result acceptance; **A00/HQ** owns B2 policy and later any \`HANDOFF_WITH_RUNTIME_TEST_DEBT\` exception. A90 does not self-sign.
- PR41 and PR48 overlap \`backup-v3.ts\` and integration test; future conflict resolution belongs to SWARM-006 **only after** final source/policy/38-case closeout and express final HQ transfer GO, not in R19.
- [A60 R18 final readiness](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R18_FINAL_HANDOFF_READINESS.md) = \`HANDOFF_NOT_READY\`. Remaining PR54 source / PR53 privacy and 38 WEB004 owner disposition matters are **other agents' lanes**, not claimed resolved here. A runtime-debt waiver, if later signed, would not authorize release.
- **R19 A90 file changes:** two new documentation files on independent docs branch, **zero application code changes**. Merge/cherry-pick/rebase/DDL/deploy/SWARM-006 = **STOP**.

**FINAL:** \`A90_R19_SOURCE_ONLY_DELIVERED / P08_SOURCE_ACCEPTED_CONDITIONAL / P08_NATIVE_RUNTIME_NOT_EXECUTED / B2_POLICY_OPEN / HANDOFF_NOT_READY / RELEASE_NO_GO / SWARM006_HOLD\`.
