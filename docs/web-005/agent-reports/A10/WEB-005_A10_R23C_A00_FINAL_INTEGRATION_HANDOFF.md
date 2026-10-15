# WEB-005 — A10 → A00 / R23C Composite Registry and Final Integration Governance Handoff

**Task:** WEB-005-T018-A10-R23C-COMPOSITE-REGISTRY · 2026-10-15 Europe/Warsaw · Docs-only / append-only.

**Decision proposal:** `R23C_REGISTRY_READY / FINAL_INTEGRATION_PENDING`. This is not FINAL_HANDOFF_GO. `RELEASE_NO_GO / SWARM006_HOLD`.

## Durable published reports and documentation commits

- [Composite registry Markdown](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23C_COMPOSITE_REGISTRY.md) — docs commit `c5fd82858269e6042c38e31413601bcca640af54`.
- [Composite/source registry JSON](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23C_COMPOSITE_REGISTRY.json) — docs commit `90c205ef22f50d37457901cc6665a938f5774472`.
- [C01 exact SHA manifest](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23C_COMPOSITE_C01_MANIFEST.json) — docs commit `68a408f5a25413fa981e9b06b86bcd99e16203e5`.
- [Conflict DAG](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23C_CONFLICT_DAG.json) — docs commit `935e027e7a5345ced37def094895c16dbd857253`.
- [Test debt / security transfer gates](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23C_TEST_DEBT_AND_TRANSFER_GATES.md) — docs commit `927c24230c4c86a98bb87775c043a8dfa596f6e2`.
- [Future integration batches](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A10/WEB-005_A10_R23C_FUTURE_INTEGRATION_BATCHES.md) — docs commit `7dbbe83476a82e5eea9c161c624da21502ea97cc`.

## Freeze of actual integration and sources

**C01:** [PR60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60), SHA `fa3261b2c9510e110ac9eba21726812d3401a525`; tree `c19fff1d6b8538dee731ea0daad75bfe568714c3`; one release parent `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`. **A60 verified 14/14 exact source and composite file blobs**, 0 manual resolution. Source inclusion: P01,#35; P02,#36; P07,#40; P23,#56; P24,#57; P25,#58. **19 old source packages remain outside**, as do all five new R23C packets.

**P26–P30 (R23C new source, not in C01):** P26/PR61 A80 `8c26778c94cd6c96987f3986b651066024f10d4a` stacked on PR57; P27/PR63 A110 `3ddcfea2ba47f4314fced3022d00922f8cedb0e3` with source-confirmed privacy P2; P28/PR64 A70 `7837e412626e88761c70f1a2ceeb822d7ed101e1`; P29/PR66 A90 `7490c974b7c84404559fd590bd09817a71c2134f` stacked on C01; P30/PR67 A30 `880824f18b8913602955578dfd76eeac7976e32a` contract-only. All new PRs OPEN DRAFT. Source 25 original SHA remain unchanged. 14 C01 + 16 new source files recomputed SHA256, with exact blob SHA1.

**Actual automatic workflow at C01:** [run 38736073793](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38736073793), 23 SE + 220 domain + 72 source + 12 Pack17 source + 24 helpers + 8 CI-ephemeral PG16 atomic correction PASS; workspace typecheck PASS; **API integration EXIT 1** (root cause unknown), job CI FAILURE, later frontend/build NOT_EXECUTED. Targeted Swiss/Backup suite independent TAP unverified. A50 locally ran ZERO app suites (only prepared executor). **No inference of composite release QA.**

## A00 actionable next decision sequence

1. **Immediate B1-QA-01:** assign A50/A60 on authorized full exact-C01 checkout to isolate first actual API integration error/stack/PG trace and independently confirm cause; do not blame a feature without evidence.
2. **Privacy P2 hard stop:** return P27/PR63 to A110 for fail-first GET 401/403 draft + ETag clear and new exact-SHA A60 review; feature remains disabled/unmounted until both backend CAS and privacy conditions are met.
3. **Environment/readiness:** A50 runner exists but needs trusted Windows PowerShell7/full repo/Node22/pnpm10/frozen install and explicit A00 test GO. Only authorized safe DB-free source/unit tests at first; separate physically certified PG16 for any reset.
4. **Migration architecture:** A20 D01–D04 A00/HQ signatures remain absent; original release/editor SQL ordinals 0030/0031 collide; T055 numeric ID is NULL; no SQL until distinct owner decisions.
5. **Next source batches:** follow staged B02–B07 plan; organize tournament routes+Undo conflicts first where feasible, Backup V3/ingress security only after real issuer+full validators+action-local remap, Basket CAS server and DB separately, then tournament detail/stage progress UI reconciliation. Keep all 15 original conflicts **UNRESOLVED** until actual joint composite + independent QA.
6. **WEB-004:** 38 historical slots remain unverified by original signed artifact; 29 secondary IDs, nine authentic originals missing, zero case-by-case owner signoffs. Retain STOP or collect real artifact and signed dispositions; no invented PASS.
7. **Transfer split:** WEB-005 owns mandatory source fixes and nontransferable security; EXEC-B can only receive owner-explicit approved residual broad native/PG/browser/release testing after source and security gates; HQ owns D01–D04, 38-case dispositions and FINAL_HANDOFF_GO.

## Final handoff requirements

Document independently reviewed final source SHA, resolved hot-path conflicts and feature code; ensure security/tenant/issuer/rollback/CAS/Undo controls operational or formally rejected by owner; sign policy/migration decisions and WEB004 dispositions; publish dependency DAG/rollback/evidence, explicit executable EXEC-B residual test scope and protected go/no-go. A00/HQ only may publish signed FINAL_HANDOFF_GO. A10 cannot.

**Result:** `R23C_REGISTRY_READY / FINAL_INTEGRATION_PENDING / C01_QA_BLOCKED / 15_CONFLICTS_OPEN / FINAL_HANDOFF_GO=false / RELEASE_NO_GO / SWARM006_HOLD`.

**Operations not performed by A10:** no app code change, no merge/rebase, SQL/DDL/reset, CI rerun, production/staging deploy or SWARM-006.
