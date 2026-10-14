# WEB-005_A90_R13_HANDOFF

**AGENT:** A90 — Backup V3 Integrity & Restore  
**TASK / WAVE:** \`WEB-005-T060-A90-R6\` / R13.1, 2026-10-14 (Europe/Warsaw)  
**MODE:** SOURCE ONLY / QA SUPPORT; no code or SQL GO.  
**DELIVERABLE:** [WEB-005_A90_R13_B2_OWNER_POLICY_AND_QA.md](./WEB-005_A90_R13_B2_OWNER_POLICY_AND_QA.md) (owner policy choices, source review, full B1/B3A QA and proposed B2 one-patch test-first matrix).  
**THIS HANDOFF:** \`WEB-005_A90_R13_HANDOFF.md\`.  
**DOCS BRANCH:** \`docs/web-005/a90-r13-b2-owner-policy-qa\`, branched from release \`1fdc401d87c6bffe6bf7312dfc9db681b689dcf7\`.

## Exact PR heads / QA

| Item | Exact SHA / branch | Status |
|---|---|---|
| [PR #41 B1](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) | \`e847cb705296a48ab5c68ece96776cd0e0bbb417\` / separate B1 branch / release base \`1fdc401...\` | OPEN DRAFT, not merged. 4 paths: B1 validator (+168), \`backup-v3.ts\` (+18/-5), integration test (+75), R9 report (+63). PATCH_PROPOSED; PG16/A60 acceptance NOT EVIDENCED. |
| [PR #48 B3A](https://github.com/C8LyNn/aplikacja-turnieje/pull/48) | \`2a8a4c72cb4a3a37402a346fd0acc83b03b39be3\` / separate B3A branch / same release base | OPEN DRAFT, not merged. 2 paths: \`backup-v3.ts\` (+39/-34), integration test (+101). PATCH_PROPOSED; PG16/A60 acceptance NOT EVIDENCED. |
| [PR #35 Pack19](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) | \`7cb283aa82273a1e22daf9051a82311eef53760c\` | Separate matcher correction; unmerged. No A90 duplication. |
| [PR #51 T040 history](https://github.com/C8LyNn/aplikacja-turnieje/pull/51) | \`2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a\` | Separate A70 malformed Undo patch; independent dependency. |

**CI:** PR41 run \`38585495598\` / job \`115926270437\` and PR48 run \`38596228642\` / job \`115963545435\` both failed at historical Pack19 matcher; subsequent steps skipped. These do not test B1/B3A feature success/failure. **No exact SHA GitHub reviews** on #41/#48 when checked; no accessible signed A50/A60 physical PG16 result was established. Do not infer private/off-repo QA was absent; demand evidence before marking \`SOURCE_ACCEPTED\` or \`RUNTIME_VERIFIED\`.

## Verified scope and remaining blockers
- **B1 SOURCE_CONFIRMED:** preclone QP→QPE→OP and route receipt checks; authored 12 invalid-fixture cases. **A50 must prove** 400/no clone for all, legacy approved-route positive, and separately full late-tx rollback.
- **B3A SOURCE_CONFIRMED:** one \`REPEATABLE READ\`/\`accessMode:"read only"\` exporter transaction includes routing-plan helper through same \`tx\`. Two authored second-writer barriers. **A50 must prove** precommit-only snapshot vs later new snapshot, real PG driver isolation, positive legacy behavior. Additional \`result_history\` race is a coverage suggestion, not an implemented test.
- **B2 SOURCE_CONFIRMED:** V3 does not serialize DB \`matches.revision\`; history revision is distinct; validator doesn't universally enforce latest history tuple parity; \`action_log\` nested \`undoPayload\` fallback may retain unmapped IDs; no portable original action ID for timestamp tie-breaking. Undo runtime breakage is **STATIC_INFERRED**, not reproduced.
- **OWNER/HQ POLICY_OPEN:** (D1) modern strict marker / old V2/V3 fallback, (D2) latest history/missing history rejection, (D3) state-vs-history revision portability, (D4) active completion action, typed Undo payload & deterministic action ordering, (D5) unmapped ID fail-closed vs legacy degradation, (D6) before-clone 400 / late rollback contract.
- **B2 NEXT PATCH:** future *one small test-first branch* only if A00/HQ approves D1–D6 and issues new explicit GO; legacy positives must remain. **No B2 source edits in R13.**
- **DEPENDENCIES:** A20 ledger/schema/trigger proof, A70 T040/global Undo semantics, A50 isolated PG16 and exact-head tests, A60 independent review, A00 ownership of PR41↔PR48 shared \`backup-v3.ts\` collision and final sequencing.
- **R13 A90 real tests:** \`NOT_EXECUTED\`. GitHub metadata/source/CI inspected, **no Node/pnpm/PG16/typecheck or HTTP test command**, no exit code / TAP or made-up PASS.
- **FILES CHANGED R13:** two docs-only additions on independent branch; **zero application code changes**. No PR on docs branch required by A90's source-only scope.

**END STATUS:** A90 R13 source-only handoff **DELIVERED**. B1/B3A **PATCH_PROPOSED**, A50 runtime proof & A60 sign-off **PENDING**. B2 strict policy **OPEN**; no newly accepted V3 behavior. **MERGE / SQL / DEPLOY / SWARM-006 = STOP; WEB-005 RELEASE NO-GO.**
