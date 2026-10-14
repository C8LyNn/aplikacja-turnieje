# WEB-005 — A10 R15 HANDOFF (to A00)

**AGENT:** A10 — Internal Packet Registry  
**TASK:** `WEB-005-T018-A10-R10`  
**WAVE:** R15.1 / 2026-10-14 Europe/Warsaw  
**MODE / GO:** Documentation-only publication to A10-owned path in `chore/web-005/t000-wave1-control`.  
**STOP:** no production code, PR merge, rebase/cherry-pick, integration branch, app/DB mutation, unauthorized paid CI, deployment, Replit, SWARM-006.

## Published, directly readable artifacts

- **QA receipt index (21-row dashboard):** [WEB-005_A10_R15_QA_RECEIPT_INDEX.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R15_QA_RECEIPT_INDEX.md)
- **Machine-readable manifest:** [WEB-005_A10_R15_PACKAGE_MANIFEST.json](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R15_PACKAGE_MANIFEST.json)
- **This formal handoff:** [WEB-005_A10_R15_HANDOFF.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R15_HANDOFF.md)

These files are committed to the central documentation branch, not to `main` or release. No message has been autonomously sent to another ChatGPT thread: A00 should consume these exact URLs as the internal R15 handoff.

## GitHub baseline & evidence

- Repo: `C8LyNn/aplikacja-turnieje`.
- Release reference `release/tournament-ops-20261013-01`, **HEAD/base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`**; compare against this pin returned `identical`.
- **P01–P21 = PR #34–54 (21 distinct PRs)**. Each HEAD matched the R14 manifest and GitHub R15 readback; all PRs `OPEN DRAFT / UNMERGED`, based directly on pinned release.
- **No newly approved S2B PR** was detected; `P22+` UNASSIGNED, not hypothetical.
- 91 changed-file checksum records (SHA-256 and Git blob SHA-1) and 82 distinct paths were inherited from R14 on **unchanged exact HEADs**; 14 of 210 candidate pairs share a path. **No R15 redownload of all 91 bytes** is claimed.
- The JSON is a **receipt index**, not a new comprehensive independent source code review and not a final integrator payload.

## QA gates and test receipts

| Criterion | R15 status |
|---|---|
| `SOURCE_READY` | 21/21 |
| `SOURCE_ACCEPTED` | 18/21 including conditional/limited source verdicts from latest available A60 R13 local matrix; P08/P09/P21 not fully source accepted |
| `QA_ACCEPTED_FULL` | 0/21 |
| `RUNTIME_VERIFIED_FULL` | 0/21 |
| `a50_test_report_url` | `null` for 21/21: exact public A50 report, command/environment/exit receipt not verified |
| `a50_exact_sha_command_exit` | `null` for 21/21, rather than inventing tests or exit codes |
| `a60_source_verdict_url` | `null` for 21/21: local signed independent A60 R13 matrix was read and reconciled on exact heads; **its direct public GitHub URL not verified** |
| `a60_exact_sha` | 21 packet pins inherited from the independently authored A60 R13 exact-SHA matrix |
| `owner_policy_id` | `null` per packet absent directly verified signed ID; 4 previously recorded explicit `POLICY_OPEN` flags retained (not an exhaustive domain count) |
| A10 real app tests | `NOT_EXECUTED`; metadata and published-file integrity validation only |
| Integration/release SHA | `null`; release `NO-GO` |

**A50 test evidence required:** exact SHA, command, Node/pnpm versions, isolated environment (dedicated PG16, `TEST_DATABASE_URL`, `tm_test_*` reset scope and owner GO for destructive DB tests), exit, full log and case count. Independent A60 must countersign correct scope. Direct URLs are not substituted by local filenames.

**Automatic CI caveat:** #52 run [38605694664](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38605694664), #53 [38606179795](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38606179795), #54 [38606249912](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38606249912) all failed at baseline Pack19; downstream target-feature tests skipped. PR #35 already addresses source matcher; no duplicate fix or manually triggered rerun from A10.

## Highest-priority blockers and conflict owners

1. **A100 P20/#53 — private cache:** prefix-only cache eviction does not cover `["tournaments",id,"player-bans"]` and `["matches",matchId,"game-picks"]`. `AuthProvider` test missing `QueryClientProvider` is a source-confirmed potential fixture issue. **A50 must reproduce / A60 judge on exact SHA; A100 may only modify after separate A00 `R15-S2B-CODE-GO`.** Do not infer runtime FAIL.
2. **A40/A60 P07/#40 — Pack17:** 24/24 real scoped Node unit tests do not close known 2/17 adversarial TAP-acceptance anomalies (A40 R13 T017-QA-01 source-mirror characterization). Real `--full` remains pending.
3. **A70/A100 backend overlap:** #39/#42/#44/#46/#51 share `routes/tournaments.ts`; authorization and Undo LIFO/rollback require semantic composition and real isolated PG16 verification by later authorized integrator.
4. **A90 backup overlap:** #41/#48 share `backup-v3.ts` and related PG tests; history/portability/legacy B2 decisions require owner/HQ before claims of complete compatibility.
5. **A110/A120 frontend overlap:** #43/#50/#54 share `tournament-detail.tsx`; #47 stage presentation and #53 auth cache privacy require user-flow regression, not author-authored RTL definitions alone.
6. **POLICY_OPEN:** Steam missing-secret 403/503, T055 Basket CAS, Swiss/SE/DE rules, Backup B2 history/legacy, Direct Revert strict CAS/Host completion identity, auth TTL/hash/rotation. A10 does not select policy.

## Internal DAG / eventual rollback (NOT EXECUTED)

The handoff recommendation to A00 is a future-only **read-only dependency DAG**, not permission to integrate:
- CI contract P01/#35 before claiming composite Pack19 closure; P02/#36 and P07/#40 separately verify Pack20–26/Pack17 under real scope.
- Require independent API/PG16, HTTP/security and React receipts before integrating matched clusters; resolve shared-file hunks under explicit future SWARM-006 ownership.
- Pin immutable source HEADs and per-file digests; maintain a per-packet rollback map (exclude unmerged source candidate or revert the authorized isolated integration commit only after validating dependencies), and test restoration on the future target SHA. No production rollback/revert was executed here.
- Before final owner-approved handoff include A60 exact-SHA verdict URLs, A50 immutable logs, owner policy IDs, accepted backlog dispositions, custody archive receipts and **a single** final manifest SHA. No interim dispatch.

## SWARM-007 metadata / custody

Require artifact ID, agent/owner, version, immutable source SHA, per-file SHA-256, test command/exit, independent QA verdict URL, provenance, retention and signed Drive receipt; **`drive_folder_uri=null` / `archive_receipt=null`**, no transfer or synchronization assumed.

## Required next action for A00

1. Record the three above **direct GitHub URLs** as accepted A10 internal deliverables.
2. Obtain A50 exact-SHA executable/blocked report URL and A60 independent signed exact-SHA verdict URL; revise null fields **only** upon verified readback.
3. Triage the privacy cache gap, Pack17 adversarial checks, target CI/test blockage, and outstanding owner/HQ policy choices; authorize a narrow fix only through an explicit new GO.
4. Keep `WEB005_FINAL_CLOSEOUT=false`, `SWARM006_FINAL_HANDOFF_DEFERRED`, `RELEASE_NO_GO` until all backlog items are disposed under policy.

**Final agent status:** `A10_R15_PUBLISHED / 21_PINNED / RECEIPTS_INCOMPLETE / SWARM006_HOLD / RELEASE_NO_GO`.  
**GitHub write scope:** A10-owned documentation files only; no other agent report or central prompts overwritten.
