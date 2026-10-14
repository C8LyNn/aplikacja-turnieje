# WEB-005_A90_R18_HANDOFF

**TASK:** \`WEB-005-T060-A90-R18\` · **ROLE:** A90 — Backup V3 Integrity & Restore · **WAVE:** R18 / 2026-10-14 (Europe/Warsaw)  
**MODE:** SOURCE ONLY — A90 has **NO code GO in R18**.  
**MAIN DELIVERABLE:** [WEB-005_A90_R18_BACKUP_ACCEPTANCE_POLICY.md](./WEB-005_A90_R18_BACKUP_ACCEPTANCE_POLICY.md) — source acceptance, exact test contract, owner-signable B2 D1–D6 decision packet.  
**PUBLICATION BRANCH:** \`docs/web-005/a90-r18-b1-qa-b2-policy\`, based on central control \`chore/web-005/t000-wave1-control\`.  
**RELEASE BASE:** \`release/tournament-ops-20261013-01\` @ \`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`.

## 1. HEAD and acceptance reconciliation

| Candidate | R17 old/current SHA, R18 verified | Verdict |
|---|---|---|
| **P08 [PR41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41)** | R17 OLD \`e847cb705296a48ab5c68ece96776cd0e0bbb417\` → R17 NEW = R18 unchanged \`f03cf3d09988a04ba9c2856e205d21f994ff67f1\`, OPEN DRAFT, unmerged | Independent [A60 R17](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_INDEPENDENT_QA.md) exact-SHA **\`SOURCE_ACCEPTED_CONDITIONAL\`** only; PG16 native runtime **NOT_EXECUTED**, no full QA |
| **P15 [PR48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48)** | \`2a8a4c72cb4a3a37402a346fd0acc83b03b39be3\`, separate OPEN DRAFT, unmerged | MVCC separate source-conditional; true PG16 read-only snapshot still unverified |
| **P01 [PR35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35)** | \`7cb283aa82273a1e22daf9051a82311eef53760c\` (R18 control snapshot) | Separate historic Pack19 regex fix, not merged into isolated PR41 |

**P08 R18 application delta:** **NO CHANGE**, original R17 patch +41 validator lines and +154 focused-test lines persists; source validator blob \`a8482fa7137f1d71817c8b4ec43da7d6292f8183\`. No B2 source/DDL or PR48 merging. [A90 R17 result](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a90-r17-position-recovery/docs/web-005/agent-reports/A90/WEB-005_A90_R17_PR41_POSITION_RESULT.md) is the historical patch description; [R16 recovery](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a90-r17-position-recovery/docs/web-005/agent-reports/A90/WEB-005_A90_R16_RECOVERY_RECORD.md) remains truthful \`R16_ARTIFACTS_UNAVAILABLE\`.

**CI:** [PR41 exact HEAD workflow 38623319193](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38623319193), job \`116056098551\`, **FAIL Pack19**, downstream **Static and database release gates SKIPPED**. This does not count as an application Backup PASS or FAIL. No paid rerun initiated.

## 2. B1 physical test oracle supplied to A50

- **Legal:** current-exporter \`sourceBasketPosition:null\` is valid; explicit matching integer position is valid and must survive import/readback; approved QPE→OP→route positive/idempotence and older legal V3 absent optional arrays stay allowed.
- **Illegal:** 7 authored position mutations (swapped, gap, missing QPE; swapped, mismatched, zero or omitted receipt position), plus 12 prior qualification/route corrupt variants → typed preclone \`BackupV3ValidationError\`, HTTP \`400 INVALID_BACKUP_V3\`, no new cloned root/dependent rows.
- **Late failure:** authored \`players.seed=2147483648\` PostgreSQL INT4 overflow after clone root/stages; HTTP failure and rollback, unchanged before/after 13 clone-related table counts; separate from preclone 400. These are source test definitions **not executed evidence**.
- **Required typecheck & integration commands after A00/A20 owner-approved runner, pinned exact HEAD and dedicated PostgreSQL16:**
  - \`pnpm --filter @workspace/api-server run typecheck\` (repo script covers production and test tsconfig).
  - \`pnpm --filter @workspace/api-server exec node --import tsx --test --test-concurrency=1 ./test/stage-basket-route-execution.integration.test.ts\`.
  - \`TEST_DATABASE_URL\` explicit **test-only secret**, \`TEST_DATABASE_SCHEMA=tm_test_a90_r18\`, \`TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA\` after **written consent** to actual destructive \`DROP SCHEMA ... CASCADE\`; no \`DATABASE_URL\` fallback. Full instructions + safety in main document.
- **A90 actual R18 commands/exits:** \`NOT_EXECUTED\`. GitHub source/PR/QA/CI reads and documentation publication only, **0 TypeScript/HTTP/PG16 native commands and no TAP/exit receipt**. A50 [R17 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R17_RECEIPT.md) also reports native application executions 0.

## 3. B2 product policy remains unsigned in checked sources

**Owner/HQ signable ticket:** \`POLICY-BACKUP/B2-PORTABLE-HISTORY-R18\`, alternatives **D1–D6 remain unselected** in the main report:
- D1 explicit modern strict profile vs old V3/V2 acceptance.
- D2 completed match/latest result-history tuple and missing-history treatment.
- D3 portable match-state CAS revision versus separate resultHistory revision.
- D4 typed completion action, Undo provenance and total ordering across equal timestamps.
- D5 recognized nested player/match old-ID remapping and fail-closed/degraded Undo.
- D6 typed \`400 INVALID_BACKUP_V3\` preclone and late transaction rollback vs restricted warning UX.

**SOURCE_CONFIRMED constraints:** generated \`resultHistory\` and \`actionLog\` are required but can be \`[]\`; \`undoPayload\` may be \`null\`; generated V3 omits DB \`matches.revision\`; importer nested Undo ID remapping can retain old unknown ID; original action IDs are not serialized. A20 validates migrations/CAS and A70 verifies LIFO. **No B2 CODE GO** until HQ signs choices and A00 separately authorizes scope. No claim that legacy restored Undo is universally safe.

## 4. Next owner/actions and closure conditions

1. **A00/HQ:** sign D1–D6 with GitHub DECISIONS URL, legacy matrix and A20/A70 technical acknowledgments. Independently choose physical A50 executor or expressly authorize **\`HANDOFF_WITH_RUNTIME_TEST_DEBT\`** — **not** a release waiver; SWARM-006 must still run composite tests before release. In available A90 evidence, consent is **not documented**.
2. **A20 + owner:** provide physically isolated disposable PG16 and exact approved schema reset scope; never test against shared/prod or trust URL string alone.
3. **A50:** execute real PR41 exact-head typecheck and focused API integration. Capture SHA, environment redacted, command/exit, TAP, positive/null, 7+12 negatives, zero clones, late rollback. Test PR48 independently on its own SHA for MVCC.
4. **A60:** retain SOURCE_ACCEPTED_CONDITIONAL on unchanged PR41 SHA; assess real A50 evidence and independently issue full QA result, or detailed failure. No A90 self-signoff.
5. **A10/A00:** record PR41/PR48 collision on \`backup-v3.ts\` and \`stage-basket-route-execution.integration.test.ts\` in final-only manifest; **no interim SWARM-006**.

**R18 A90 files changed:** **two docs-only files** on docs branch; **zero application code files**. No merge/cherry-pick/rebase, SQL/DDL, production backup import, paid CI, staging/live, or SWARM-006.

**FINAL:** \`A90_R18_SOURCE_ONLY_DELIVERED / PR41_NO_CHANGE_SOURCE_RECONCILED / A60_SOURCE_ACCEPTED_CONDITIONAL / RUNTIME_NOT_EXECUTED / B2_POLICY_OPEN / WEB005_RELEASE_NO_GO / SWARM006_HOLD\`.
