# SWARM-006 / WAVE 1 — SOURCE INTAKE, DISPATCH, GATES & ROLLBACK

**Owner:** A00 — Integration Lead  
**Date:** 2026-10-22  
**Mode:** isolated non-production, source-only; NO RELEASE/PG16 GO  
**Source authority:** [SWARM-005 A00 R5](https://github.com/C8LyNn/aplikacja-turnieje/issues/76#issuecomment-6338420242), [A10 immutable 60-PR manifest](https://github.com/C8LyNn/aplikacja-turnieje/issues/76#issuecomment-6338341265), [A40 dependency map](https://github.com/C8LyNn/aplikacja-turnieje/issues/75#issuecomment-6312609423).

## Pinned baseline

- Repository: `C8LyNn/aplikacja-turnieje`.
- GitHub default branch `main`: `c50cc48e6fa508592bda3f4838111e9cff5af80c`.
- Selected integration source branch `release/tournament-ops-20261013-01`: `1db3734b8988940acc6be8b992420a58fc39624a`.
- Isolated branch `integration/swarm-006/wave1-source-intake-20261022` started at exactly that release SHA.
- Remote deployment/live version is **NOT ATTESTED**. Release branch is a technical source baseline, not proof of live parity.
- Compared main to release: release ahead 52 commits at snapshot; latest release commit alters Core Clash Unity WebGL assets, minigames UI and routes. These assets MUST NOT be overwritten by SWARM-006.
- Compared release to C03 #134 head `80bb4ca7a9a359fbe76dbab1478a1af16ded0174`: **diverged** (C03 ahead 3, release ahead 1; merge base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`). No wholesale C03 merge; review patches/path lineage first. Original C03 API integration CI is RED (exit 1; failed TAP assertion UNKNOWN).

## Exact handoff scope

A10 snapshot **60 WEB-005 PRs** = **13 INCLUDE / 31 CONDITIONAL_DISABLED / 16 SUPERSEDED**; source candidate does not equal merged feature. INCLUDE IDs:
`38,78,79,81,116,128,129,132,134,135,142,143,144`.
- Conditional CAS client #63/#130, server #146 and contract #55 remain OFF; CAS activation gate is always DENY.
- Backup issuer #145 is source-only: `importAuthorized=false`. Never enable importer/root/issuer trust.
- PG16 fixture #89 is HOLD. No D03 attestation, no D04 numeric T055 allocation, no unapproved SQL/migrations.
- Exclude redundant C01/C02 ancestors and #35/#36/#40/#56/#58/#64/#66/#100; #105 alternative diagnostics; do not replay separately. Review semantic overlaps (#104, #120/#142) before any integration.
- #129 is **one-file test-only** candidate, not its ancestry. #132 contains standalone Undo tests, not proof of actual DB behavior. #142 is unwired. #143 is synthetic diagnostics only; real Windows TEMP/private replay is blocked.

## W1-P01 selected and committed source tranche

One isolated commit parented directly at the release SHA: `886d1127c4231974f2cf7a679546d23c5417f172`.
`PR #38` — 7 *added* files within `lib/db/migration-ledger-validator/`, proposal/synthetic metadata and read-only native validator; **no executable SQL migration**.
`PR #78` — 1 *added* file `scripts/qa/r23d-static-route-probe.mjs`, selftest with localhost fixture; host replay must be explicitly targeted.
All 8 Git blob identities were fetched from each immutable PR HEAD before composition. Parent release did not contain either source path. SHA compare of release to staged commit confirmed **ahead 1, behind 0, 8 additions, no modifications/deletions**.
**QA status:** NOT_RUN against the composed branch. Source selection and Git comparison are not execution proof; no application test version or release GO yet.

## Dispatcher — role-scoped assignments

**A10 — PACKAGE INTAKE & VALIDATION / G0, P0.** Recheck all eight Git blobs against #38 head `2d36864f4d2f1c838073f387fd3c8efb3378c43b` and #78 head `11e8d5d0bea679515a807f002724926113bdafc1`. Revalidate 13 INCLUDE exact HEADs against A10 manifest before next tranche. Report drift and missing dependencies. Read-only, no PR merges.

**A20 — GIT MERGE & CONFLICT RESOLUTION / G0–G1, P0.** Produce per-path `release vs C03` collision/semantic-delta matrix; explicitly account for release-only Core Clash assets and C03 ancestry. Plan selective non-destructive port of C03 and later #143; do not cherry-pick or rewrite any branch without A00 tranche decision. Validate non-overlap of #129 one test, #142 sibling #120.

**A30 — FULLSTACK INTEGRATION / G1, P0.** Assess existing app's API/routes/types and standalone C03 contract, determine minimal dependency-complete plan; preserve all existing frontend, OBS, games, Steam, and live routes. Audit #142 static route policy as UNWIRED; propose nonprod host wiring and negative-asset 404/MIME tests, **do not wire/activate** pending owner tranche. Do not enable CAS/backup imports.

**A40 — DATABASE & MIGRATION INTEGRATION / G0–G1, P0.** Review `PR #38` validator proposal/fail-closed semantics for source-only non-executable scope. Track D03 applied history UNATTESTED, D04 T055 NOT_ALLOCATED, #89 PG16 fixture HOLD. **No PG/SQL/Docker execution, no DDL, no migration allocation.** Recommend needed operator approvals.

**A50 — BUILD & CI/CD AUTOMATION / G1, P0.** In an already provisioned full dependency-complete isolated checkout, run only free/local DB-free checks after verifying checkout SHA, Node and pnpm versions. Suggested commands: `node --test lib/db/migration-ledger-validator/validate.test.mjs`; `node scripts/qa/r23d-static-route-probe.mjs --self-test`; `git diff --check <release-sha> HEAD`. Only if safe and dependencies available, `pnpm run typecheck` and `pnpm run build` with no DB/liveness side effects; check scripts first. No paid/remote CI dispatch, real API/PG execution, migrations or deployment. Report EXIT, counts, exact SHA, logs, NOT_RUN.

**A60 — INDEPENDENT QA & REGRESSION / G1–G2, P0.** Independently inspect W1-P01 exact 8-path diff and run offline tests on actual composed SHA in isolated environment; verify CAS OFF, no backup import authority, no SQL changes, no games or live-route changes. A prior single-PR synthetic PASS is not integrated PASS. C03 original API CI red remains red until separately reproduced and fixed with approved environment. Report binary PASS/HOLD per gate.

**A70 — RELEASE & LIVE DEPLOYMENT / G0 plan only, P0.** Prepare nonproduction rollback and preservation ledger. Inventory main/release/test branch refs and original live asset checksum as **NOT_ATTESTED** until independent evidence. No deploy, protected merge, live asset copying, environment/secret reads or user-facing rollout. Release gate remains NO_GO.

**A00 — HQ:** Keep canonical map, authorize only bounded source tranches and gate transitions, publish exact SHA dispatch/acceptance; do not infer agent action from this text alone.

## Ordered integration plan / dependencies

1. **P01 (staged):** Offline #38 / #78. Run exact SHA independent G0/G1 source and native tests.
2. **P02 (review only):** Preserving docs #79, #81, #116, #128, #135, #144; scrutinize collisions; #144 is architecture-only, not CAS implementation.
3. **P03 (HOLD until per-delta review):** Coherent C01→C02→C03 #134 lineage, selectively transplant without replaying ancestors or release-only changes. C03 API integration original CI RED; compile/test on *composed* tree after isolated owners sign.
4. **P04 (HOLD until downstream gate):** #143 three add-only synthetic diagnostic files, #129 optional isolated single test file, #132 test artifacts; block real private replay.
5. **P05 (HOLD):** #142 route policy delta and #120 sibling tests need #103 base reconciled first; actual host wiring and SPA/asset R1 still separate. Swiss/Undo *implementation* comes from CONDITIONAL_DISABLED lineages and requires a NEW explicit scope/QA decision.
6. **CAS, Backup issuer, PG16:** Always disabled/unapproved; no activation by compositional presence.

## QA / risk gates

- **G0 SOURCES:** pinned release SHA, 60-PR map, exact blob identity, path overlaps, unrelated asset preservation, rollback/ref, CAS/issuer/PG restrictions. Candidate complete only after A10/A20 receipts.
- **G1 ISOLATED_NATIVE:** Node offline validator regression + synthetic HTTP selftest + Git diff check on composed SHA; optional typecheck/build only in correctly provisioned dependency-complete checkout; exact output retained. No calls to any live host.
- **G2 INTEGRATED_APPLICATION:** source QA alone insufficient. Full app/typecheck, API integration, frontend SPA/MIME/404, real DB/schemas and relevant feature regressions require separate authorized environment and receipts. Original C03 CI fail is a known blocker.
- **G3 SECURITY/DB:** separate signoffs for private TEMP ACL/retention, PG16 fixture and SQL migration gates, CAS full writer/ETag/HTTP graph, issuer trust. Presently NO_GO.
- **G4 RELEASE:** main/protected merge or deployment needs explicit later authorization and independent A60 GO. Presently NO_GO.

## Rollback / no-copy policy

Source baseline pin: `1db3734b8988940acc6be8b992420a58fc39624a`. Staging branch is append-only and can be abandoned with *zero changes to main/release*. If a staged commit requires reversal, make a new revert commit on this isolated branch after review, **never force-push**. Do not delete original source branches or existing artifacts. Capture final Git SHA and blob-level 8-file evidence before any additional tranche. Production rollback cannot be asserted before live deployment provenance/backup is verified; **NO production rollback executed**.

**Gate now:** `SWARM006_W1_P01_STAGED / G0_PARTIAL_SOURCE_VERIFIED / G1_NOT_RUN / TEST_BUILD_NOT_PROVEN / CAS_OFF / BACKUP_IMPORT_OFF / PG16_NO_GO / RELEASE_NO_GO`.
