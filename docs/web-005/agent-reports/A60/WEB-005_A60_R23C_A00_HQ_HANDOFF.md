# WEB-005 R23C — A60 FINAL INDEPENDENT QA HANDOFF TO A00 / HQ

**Task:** WEB-005-T130-A60-R23C-INTEGRATION-QA · Date 2026-10-15 · **Final overall BLOCKED**. Scope-only composite origin check **R23C_SOURCE_INTEGRATION_PASS_WITH_CONDITIONS**; **RELEASE_NO_GO / SWARM006_HOLD**.

## Exact composite and hard gate

[PR60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) exact HEAD **fa3261b2c9510e110ac9eba21726812d3401a525**, parent release 1fdc401d87c6bffe6bf7312dfc9db681b689dcf7. Independent direct two-way GitHub blob inspection **14/14** matches author manifest and every source PR35/36/40/56/57/58. Git tree c19fff1d6b8538dee731ea0daad75bfe568714c3 confirmed. No unexpected file, conflict edit, omitted hunk, lockfile/schema/migration change.

**Actual CI exact composite** [run 38736073793](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38736073793): real Pack19–26 292/292 PASS and SE safety 23/23 PASS; Pack17 source 12/12, fail-closed 24/24, ephemeral PG16 atomic correction 8/8 PASS, workspace typecheck PASS. **API integration EXIT 1**, overall workflow FAILED; root cause not isolated. Later frontend/build NOT_EXECUTED. Pack17 PG16 atomic != Backup/Basket physical PG16 or HTTP PASS; individual Swiss/Backup targeted tests NOT_VERIFIED. A50 authored executor only, **0 locally executed native app tests**.

## Individual new PR exact-SHA source verdicts (all remain outside B1)

| PR | Agent | Verified HEAD | Independent scoped verdict |
|---|---|---|---|
| [#61](https://github.com/C8LyNn/aplikacja-turnieje/pull/61) | A80 | 8c26778c94cd6c96987f3986b651066024f10d4a | PASS WITH CONDITIONS: two-stage Swiss caller HTTP/PG16 test authored only; physical reset STOP |
| [#63](https://github.com/C8LyNn/aplikacja-turnieje/pull/63) | A110 | 3ddcfea2ba47f4314fced3022d00922f8cedb0e3 | **BLOCKED FOR ENABLEMENT:** P2 401/403 GET revocation fails to clear privileged draft |
| [#64](https://github.com/C8LyNn/aplikacja-turnieje/pull/64) | A70 | 7837e412626e88761c70f1a2ceeb822d7ed101e1 | PASS WITH CONDITIONS: strict action-local source validator; native and A90 integration not executed |
| [#66](https://github.com/C8LyNn/aplikacja-turnieje/pull/66) | A90 | 7490c974b7c84404559fd590bd09817a71c2134f | PASS WITH CONDITIONS: pure raw-to-validated adapter, NOT_WIRED, real trusted validator callbacks not attached; CI API integration exit 1 |
| [#67](https://github.com/C8LyNn/aplikacja-turnieje/pull/67) | A30 | 880824f18b8913602955578dfd76eeac7976e32a | PASS WITH CONDITIONS for security fail-first test CONTRACT only, future ingress implementation remains BLOCKED |

P2-A110-01 detail: [draft refreshRemote GET](https://github.com/C8LyNn/aplikacja-turnieje/blob/3ddcfea2ba47f4314fced3022d00922f8cedb0e3/artifacts/tournament-manager/src/lib/stage-basket-cas-draft.ts#L184-L195) throws on 401/403 from client.load without clearing local draft; only save catch [lines 253–260](https://github.com/C8LyNn/aplikacja-turnieje/blob/3ddcfea2ba47f4314fced3022d00922f8cedb0e3/artifacts/tournament-manager/src/lib/stage-basket-cas-draft.ts#L253-L260) clears it. Inactive and unmounted currently: **latent bug, not observed production exploit**. Add fail-first GET 401/403 regression and clear before activation.

## A00 action order

1. **A50/A00 triage actual API integration exit 1** at pinned B1 SHA, collect first independent failing TAP/stack/SQL without assuming a culprit. Do not override FAILED workflow using source PASS.
2. **A110 fix P2 GET revoked-auth state clearing** with direct tests and new SHA; repeat A60 review.
3. **A50 authorized native test host:** exact SHA pins, fresh clean checkout, Node22/pnpm10, frozen lock; run source/Swiss/Backup/feature unit tests and API/TypeScript tests with exact per-command receipts. No manual PG16 reset without written owner+A20 host/schema GO.
4. Integrate A70 module with A90 callback and real full V2/V3 schema validators only under separate A00/A30 approval, with new composite source manifest; enforce authenticated modern issuer/anti-downgrade, raw-before-Zod, action-local references, rollback, restricted old provenance.
5. A80 PG16/HTTP two-stage test (only disposable host); A30 fail-first HTTP/PG16 expected RED contracts (do not present skips as PASS); A110 server CAS D1–D5 migration/reservation/stage/roster tests before client cutover. Preserve WEB004 38-case owner governance and independent gates.

**All current new PR unit test files are AUTHORED, not certified by independent per-PR native receipts.** No browser/UI, full Backup HTTP or live CAS release QA was executed. No manual paid CI rerun, SQL/DDL, merge, deployment or SWARM006 by A60.

[Composite detailed QA](./WEB-005_A60_R23C_COMPOSITE_B1_INDEPENDENT_QA.md) · [Machine evidence matrix](./WEB-005_A60_R23C_INTEGRATION_QA_MATRIX.json) · five separate per-PR A60 reports in this same agent folder.

**Final:** INTEGRATION_BLOCKED / R23C_SOURCE_INTEGRATION_PASS_WITH_CONDITIONS_SOURCE_ONLY / RELEASE_NO_GO / SWARM006_HOLD.
