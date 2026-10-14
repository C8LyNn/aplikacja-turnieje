# WEB-005_A90_R12_HANDOFF

**AGENT:** A90 — Backup V3 Integrity & Restore  
**TASK / WAVE:** \`WEB-005-T060-A90-R5\` / R12.1 — 2026-10-14 Europe/Warsaw  
**MODE:** SOURCE-ONLY / QA SUPPORT — no source code, DB, SQL, DDL or migration authorization.  
**A00 deliverable:** [WEB-005_A90_R12_B2_POLICY_AND_B1_B3A_QA.md](./WEB-005_A90_R12_B2_POLICY_AND_B1_B3A_QA.md).  
**Docs-only branch:** \`docs/web-005/a90-r12-b2-policy-b1-b3a-qa\` (started from release baseline; no PR created for docs).  
**Base:** \`release/tournament-ops-20261013-01\` @ \`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`.

## Exact PRs / SHA / source status
| Pack | PR / exact HEAD | State / QA |
|---|---|---|
| B1 P08 | [#41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) \`e847cb705296a48ab5c68ece96776cd0e0bbb417\` | OPEN DRAFT; preclone QP/QPE/OP/receipts source patch **PATCH_PROPOSED**; A50 isolated PG16, A60 independent review **PENDING** |
| B3A R11 | [#48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48) \`2a8a4c72cb4a3a37402a346fd0acc83b03b39be3\` | OPEN DRAFT; same-transaction \`REPEATABLE READ\`/\`accessMode:"read only"\` export source patch **PATCH_PROPOSED**; A50 physical PG16 race tests, A60 independent review **PENDING** |
| CI contract dependency | [#35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) \`7cb283aa82273a1e22daf9051a82311eef53760c\` | Separate Pack19 matcher patch, unmerged; not a B1/B3A fix |
| Historical Undo | [#42](https://github.com/C8LyNn/aplikacja-turnieje/pull/42) \`1ae0ccb801f4177052bff1ec7041e55b8c992c8b\` | A70/T040 dependency; not merged |
| Migration ledger | [#38](https://github.com/C8LyNn/aplikacja-turnieje/pull/38) \`2d36864f4d2f1c838073f387fd3c8efb3378c43b\` | A20 dependency; no A90 SQL authorization |

**Real changed files in R12:** two **documentation-only** files on docs branch; **zero application code files**. PR #41 / #48 heads unchanged, no merge or direct source edits.

## Findings and test status
- **SOURCE_CONFIRMED:** B1 preclone validator and restoration errors; B3A one tx handle including routing-plan in-transaction helper; V3 lacks portable \`matches.revision\`; existing backup validation does not require latest \`resultHistory\` parity to a completed match; \`actionLog\` remaps payload IDs with old-ID fallback.
- **STATIC_INFERRED:** unverified history mismatch may cause \`HISTORY_INCONSISTENT\` during revert, old action ordering ties may alter newest Undo precedence; neither outcome claimed reproduced by A90.
- **NOT_EXECUTED:** no A90 PostgreSQL16/HTTP/Node22-pnpm10 checkout tests, no API typecheck, no actual TAP, exit codes, clone row counts or snapshot hashes. No real test \`exit=0\` or fabricated PASS claim.
- GitHub Actions for B1 SHA run \`38585495598\` and B3A SHA run \`38596228642\` both failed **prior independent Pack19 source-regex gate**; remaining test gates skipped. The #35 matcher fix is isolated, not on B1/B3A branches. No claim of Backup V3 runtime failure or acceptance.
- No formal GitHub PR41/48 reviews or review threads at R12 check; **independent A60 verdict not established in reviewed evidence**.
- Existing B1 test definitions: 12 mutation fixtures plus positive §22 round-trip; B3A definitions: 2 two-connection barrier fixtures. Full acceptance matrix and additional result_history/late rollback/legacy cases in main report.

## Future B2 decision matrix (NO CODE GO)
**Option A:** small pure nonblocking history/Undo provenance *diagnostics* (missing/mismatched latest history, remap ID fallback risks, revision ordering and action timestamp ties). Maintains historical V3 import acceptance. **Does not close fail-closed B2 release gate**. Future GO required.

**Option B:** strict modern-profile preclone validator + compatible legacy fallback, only after owner/HQ chooses explicit strict provenance version/metadata, portable \`matches.revision\` policy, missing history semantics, Undo tie-break ordering, malformed legacy payload handling and A70 CAS/Undo contract. **POLICY_OPEN / HOLD**. No implicit "schemaVersion 3 means strict" shortcut and no automatic rejection of old V2/V3.

Source caution: existing positive route fixture directly inserts completed matches but does not explicitly insert \`result_history\`, so A20/A50 must inspect trigger-produced history before demanding universal completed-match history parity.

## Next owners, GO/STOP
- **A50:** physically isolated approved disposable PG16, Node22/pnpm10, checkout exact PR41 and PR48 SHA **separately**; typecheck + integration tests, record exit/TAP + B1 no-clone/late rollback, B3A two-connection old-snapshot vs fresh state. No shared DB or secrets.
- **A60:** independent exact-SHA B1 B3A source+runtime QA, legal legacy positives, typed error handling, snapshot isolation and no hidden routing-plan transaction. Author cannot self-accept.
- **A20:** migration ledger/schema/revision trigger source check and physical PG16 preflight dependency; no A90 SQL.
- **A70/T040:** confirm history equality tuple, replay/Undo \`actionLog\` payload semantics and tie-breaking; no A90 source changes.
- **A00/HQ:** decide \`POLICY-BACKUP\` before optional strict B2 GO, manage future \`backup-v3.ts\` conflict between PR41 & PR48, retain P08/R11 candidates in A10 INTERNAL_BUFFER, no SWARM-006 transfer.

**FINAL R12 STATUS:** SOURCE-ONLY DELIVERED. B1 = PATCH_PROPOSED / PG16 NOT_EXECUTED / QA PENDING. B3A = PATCH_PROPOSED / PG16 NOT_EXECUTED / QA PENDING. B2 strict = POLICY_OPEN / NO CODE GO. **MERGE / DEPLOY / SWARM-006 = STOP. WEB-005 RELEASE NO-GO.**
