# WEB-005_A90_R15_HANDOFF

**AGENT / TASK:** A90 — Backup V3 Integrity & Restore / \`WEB-005-T060-A90-R8\`.  
**WAVE:** R15.1, 2026-10-14 Europe/Warsaw.  
**MODE:** SOURCE-ONLY. **GO:** QA contracts/owner decision report. **STOP:** backup code, DB DDL/migrations, source PR edits, cross-PR merge, deploy, SWARM-006.  
**Direct deliverable:** [WEB-005_A90_R15_BACKUP_B2_SIGNABLE_POLICY.md](./WEB-005_A90_R15_BACKUP_B2_SIGNABLE_POLICY.md) — full owner D1–D6 signature form + B1/B3A runnable approved-PG16 test plan.  
**Report location:** \`docs/web-005/agent-reports/A90/\` on \`chore/web-005/t000-wave1-control\`.  
**SOURCE_BASE:** \`release/tournament-ops-20261013-01\` @ \`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`.

## Exact verified PR HEADs and evidence

| Packet | PR/HEAD | Source and QA |
|---|---|---|
| P08 / B1 preclone | [#41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) \`e847cb705296a48ab5c68ece96776cd0e0bbb417\` | OPEN DRAFT, unmerged, 4 changed files: \`backup-v3-flow-integrity.ts\`, \`backup-v3.ts\`, \`stage-basket-route-execution.integration.test.ts\`, R9 report; \`PATCH_PROPOSED\`. |
| P15 / B3A MVCC export | [#48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48) \`2a8a4c72cb4a3a37402a346fd0acc83b03b39be3\` | OPEN DRAFT, unmerged, 2 changed files: \`backup-v3.ts\`, \`stage-basket-route-execution.integration.test.ts\`; \`PATCH_PROPOSED\`. |
| Pack19 blocker | [#35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) \`7cb283aa82273a1e22daf9051a82311eef53760c\` | Separate unmatched-regex fix; OPEN DRAFT, not integrated in #41/48. |

**PR41 existing CI:** [run 38585495598](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38585495598), FAIL early Pack19 old \`readOnly:true\` matcher; **PR48 existing CI:** [run 38596228642](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38596228642), same. Both skip native downstream database release gates. This is neither B1 nor B3A feature-specific PG16 PASS/FAIL.

**A50 test evidence:** physical PG16 and real exit/TAP on exact #41/#48 SHA **NOT_VERIFIED in accessible R15 central GitHub report paths**; no A90 runtime run. **A60:** zero submitted GitHub PR reviews on #41/#48; independent signed exact-head verdict **NOT EVIDENCED** in checked URLs. This does not mean private/off-branch testing never occurred. No \`SOURCE_ACCEPTED\` or \`RUNTIME_VERIFIED\` claimed.

## Findings / required next action

- **B1 source:** approved qualification QP→QPE→OP and routed receipt integrity; 12 existing corrupted variants in **one** Node test loop must yield \`400 INVALID_BACKUP_V3\` and no cloned roots. A50/A60 additionally need dependent child-table counts, legal V3/legacy positive and separately induced **late transactional rollback** (not provided by the 12 preclone cases).
- **B3A source:** exporter on one \`REPEATABLE READ\`/\`accessMode:"read only"\` transaction including compiled routing helper; two authored second-writer barriers require E consistent old, E2 consistent new values. Future explicit resultHistory writer test is a proposal only.
- **B2 policy:** \`resultHistory\` and \`actionLog\` are required **arrays that may be empty** in generated V3, while action \`undoPayload\` is nullable. Missing JSON \`actionLog\` property differs from \`actionLog:[]\`. The current V3 omits DB \`matches.revision\`; history revision is a distinct counter; remap Undo recognized nested numeric IDs can fall back to original ID; original log action ID is not portable. Strict rejection of older legal snapshots is **POLICY_OPEN**, not an A90 choice.
- **Owner/HQ D1–D6:** select and sign modern strict marker/legacy support, latest-history parity and missing history, match CAS revision restoration, typed completion/Undo provenance/order, nested ID remap/restriction, and typed 400-before-clone vs late rollback/user messaging. **Owner signatures currently blank** in main deliverable.
- **Future smallest B2 patch after separate explicit GO:** pure profile-gated validator + preclone call site + typed test-first positives/negatives, **no DDL**; any new serialized contract needs a separate reviewed scope.
- **A20:** migration 0028/revision and trigger verification + physically isolated disposable PG16. **A50:** separate exact-SHA test execution with \`TEST_DATABASE_URL\`, safe \`tm_test_*\` schema + explicit \`DROP_TM_TEST_SCHEMA\` owner approval; real exit/TAP/state hashes. **A60:** independent exact SHA source/runtime signoff. **A70:** completion action, LIFO and Revert CAS. **A00:** sign policy and control future GO. **A10:** internal buffer only.
- **PR41↔PR48 conflict:** both change \`backup-v3.ts\` **and** the focused test file. SWARM-006 alone may integrate after final formal WEB-005 closeout. No A90 merge.

**R15 A90 actual test commands/exit:** \`NOT_EXECUTED\`; performed GitHub file/PR/review/CI readback plus publication only, no Node22/pnpm10/PG16/test/typecheck execution or PASS. **A90 R15 application code changed:** none. **R15 authored files:** \`WEB-005_A90_R15_BACKUP_B2_SIGNABLE_POLICY.md\` and this \`WEB-005_A90_R15_HANDOFF.md\` only.

**FINAL STATUS:** A90 R15 SOURCE-ONLY **DELIVERED**; B1/B3A \`PATCH_PROPOSED\` / A50 physical PG16 evidence \`NOT_VERIFIED\` / A60 independent \`PENDING\`; B2 \`POLICY_OPEN\`. **RELEASE_NO_GO; SWARM-006 HOLD.**
