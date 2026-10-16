# WEB-005 — R23D / A30 — ISSUE #72: Steam security preservation and Replit source-drift QA

**Agent:** A30 Security Write-Auth Hardening · **Date:** 2026-10-16 (Europe/Warsaw)  
**Issue:** [#72 — LIVE drift/Steam/PG preservation](https://github.com/C8LyNn/aplikacja-turnieje/issues/72) · **Dispatch:** [R23D](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R23D_EXECUTION_DISPATCH_20261016.md), Git blob `226b6a89c3fd8348eac814221de1c9715ee6ae25`.  
**Mode:** READ-ONLY source reconciliation; only this report and its machine-readable preservation manifest were authored. **No games changed, no live deploy, no SQL.**

## 1. Evidence provenance — three states NOT interchangeable

| Reference | Pinned identity | Verification |
|---|---|---|
| GitHub release | `1db3734b8988940acc6be8b992420a58fc39624a` · Git tree `00690ad5721c52d30821ed6b2ac3e329af446716` | **GitHub direct commit/tree** (parent `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`). |
| GitHub editor reference | `28da3ef94f3b30f90c1b3b70a88ab7f61462d99c` | **GitHub direct file/tree**; source of developed Steam Catalog functionality, NOT proof of live. |
| Replit CURRENT editable workspace | Agent-reported HEAD `5e68f0f4b7d73cb5ff6aad0065dbe54c5f691776`, branch `feat/double-elimination-full-integration` | **Read-only Replit app inspection** reported `git hash-object` blobs and clean workspace; GitHub did **not** resolve that SHA (404), so it is **not** a verified remote commit. Agent reports migration set only `0001–0017`, Steam module/worker **absent**. |
| Historic Replit published checkpoint (dispatch) | `cb55335ea8e789d5e0f7912955da7d679d7dbb5f` | **LOCAL-ONLY / TREE UNAVAILABLE**. Does **not** match current workspace. Git object could not be inspected; no exact blob diff available. |
| Replit deployment status | Deployment `03378589-2eed-47f9-b501-c54a5bccfa7c`, URL `https://aplikacja-turnieje.replit.app` | Native Replit **get_publish_status returned `found=true, status=failed`** on 2026-10-16. Read-only Replit Agent separately reported 404 on `/`, `/api/healthz`, `/api/steam-catalog/games`; not a deployment source tree or proof of currently served code. |

**Important:** #72 and dispatch report **140** different paths (90 local-only, 50 differing blobs) for the historic published checkpoint. Those are **dispatch-derived counts, not independently re-derived**. Neither the old `cb553...` tree nor its complete path list is exposed through the available Replit connector; **DO NOT CLAIM a full exact 140-path manifest.** [Exact *sparse* manifest](./WEB-005_A30_R23D_SOURCE_PRESERVATION_MANIFEST.partial.json) records **17 verified comparison rows**, clearly distinguishing GitHub-verified blobs, Replit-workspace agent-reported blobs, ABSENT, and published-checkpoint `NOT_AVAILABLE`. The full 140-record manifest remains **`BLOCKED_PUBLISHED_CHECKPOINT_UNAVAILABLE`**, requiring an authorized read-only export from the actual published artifact/local source owner and original audit source.

A noteworthy correction to generic “Replit-only” claims: `artifacts/tournament-manager/src/components/portfolio-ui.tsx` has Git blob **`88c7a2dab88bad2b4ea5cc1172aa3522a8bda849` both in current inspected Replit workspace and GitHub release**, though it differs from GitHub editor `7289a7a938fe98ba89bebf10929d07dfc1b0132a`. Thus “not in local cached origin/main” does **not** mean “not in GitHub release.”

## 2. A30 Steam Catalog security/source reconciliation — confirmed

| Guard/surface | GitHub release `1db373...` | GitHub editor `28da3e...` and PR #34 | QA impact |
|---|---|---|---|
| Steam Catalog router | `artifacts/api-server/src/routes/steam-game-catalog.ts` Git blob `31ca80345f0bc7c0cf8328723bce974d487f460a`, **347 lines** | Editor blob `c318c3ecd9295c6b52b88ddd15db783c0ccec87f`, **919 lines** | Editor contains extensive cursor/search/jobs/revision routes; direct overwrite would discard them. |
| Three existing write endpoints | Release `POST /steam-catalog/taxonomy`, `POST /steam-catalog/import`, `PUT /steam-catalog/games/:id/classification` **lack `requireSteamCatalogAdmin` middleware** | Editor uses `requireSteamCatalogAdmin` for these and newly added privileged discovery/job endpoints. [PR #34](https://github.com/C8LyNn/aplikacja-turnieje/pull/34) HEAD `fae2eea2f22df3f1b02ad035a7db00bc411ea73f` adds the three release guards only; OPEN/DRAFT/UNMERGED. | **P0 source security gap in GitHub release**. **Live exploit NOT_VERIFIED** because currently served Replit bytes unavailable. Do not publish same release routes without auth gate. |
| Guard implementation | No `steam-catalog-access.ts` at GitHub release | GitHub editor + PR34 exact blob `feff5ff50443f40ae8f3e51ebe4f34b524ad2638`: SHA-256/timingSafeEqual header token, configured server key length ≥32; unconfigured returns 503, bad token 403. | Fail-closed source behavior, but no environment-value proof, HTTP test/PG assurance. Owner Steam missing-key 403 vs 503 still unresolved in policy. |
| Public catalog reads | Two release GETs unguarded | Editor public reads expanded, write/discovery jobs require admin; PR34 keeps public GETs. | Preserve intentional public/privileged split; never put Steam admin bearer into public GET or logs. |
| Revision conflict / writer concurrency | Release classification PUT has **no `expectedRevision` conditional update**, writes assignments via transaction; release import uses `onConflictDoUpdate` | Editor classification PUT `expectedRevision` validated (missing⇒428, stale⇒409), conditional row UPDATE increments `classificationRevision` **before** replacing terms under one transaction. | **P0 functional race/regression** if old release overwrites editor. Requires DB migration `0032_steam_catalog_classification_revision.sql` in editor (proposed future canonical `0034`). No blind API/UI deployment. |
| `insertOnly` semantics | Release single import and editor single import both use `onConflictDoUpdate` | Editor **batch import** `POST /steam-catalog/import-batch` and background job use `onConflictDoNothing` (insert-only, existing classified rows preserved). | **Mixed semantics:** do not state “all editor import is insert-only.” Preserve job/batch insert-only and distinguish manual overwrite behavior; assign explicit API contract owner. |
| Background worker | Release lacks import-job subsystem | Editor `steam-catalog-import-jobs.ts` blob `a2cbce6876b612063e35dc472353ba40c7c4e376`: PostgreSQL lease, `SKIP LOCKED`, transactional cursor + insert, delay/backoff, sanitized job `last_error` where handled. Editor `artifacts/api-server/src/index.ts` blob `9ef87b29e93adc596d1b7f5092e3bae919cb38ff` calls `startCatalogImportWorker()` at API listen; worker suppresses itself when `NODE_ENV==="test"` but has **no explicit production feature-enable flag** at entrypoint. | **P1 startup/cutover concern:** worker may poll DB even before target migrations exist, or in multiple API replicas (DB lease reduces double commit, does not eliminate DB pressure). Require owner-approved default-off flag and schema-readiness preflight in future scoped source GO, not A30 code edit now. |
| UI administrator secret lifecycle | Release page unguarded writes | PR34 client `game-catalog-admin.tsx` blob `fb490f2aca7fa328168e0c219ab402d31be65d6f` holds admin token in React component memory only; editor page blob `2bd8b3d58e906896c4c0ceaa4009fe91e26d7ccf` uses `sessionStorage` key `tm_steam_catalog_admin_token`, avoids key on GET. | **Storage policy divergence**: editor “tab session” ≠ memory-only; do not overwrite a working editor UI with smaller PR34 page or claim keys always memory-only. Need explicit session/token persistence/security review and real browser testing. |
| Environment | `STEAM_CATALOG_ADMIN_TOKEN` expected by guard; `STEAM_WEB_API_KEY` for Steam discovery; names only | Replit workspace read-only Agent found names `DATABASE_URL`, `DEPLOYMENT_TASK`, `LEGACY_CREDENTIALS_DATABASE_URL`, `LEGACY_ORGANIZER_PASSWORD`, `LOG_LEVEL`, `NODE_ENV`, `SESSION_SECRET`, `TRUSTED_PROXY_CIDRS` (not Steam-specific). | **No secret values accessed**. The existence of env name in code ≠ configured runtime secret. No claims of currently enabled worker/admin. |

**Preflight threat gate:** Directly copying PR34 release-based `steam-game-catalog.ts` onto an editor-derived API would lose hundreds of lines and its classification revision/worker routes. Conversely, copying editor API alone to release requires migration `0032–0038` (original filenames) and a compatible UI, runtime secrets and safely gated worker. **Both blind directions are STOP.** The GitHub release's missing guards are source evidence requiring a future authorized patch/integration choice; **not an instruction to bypass user restrictions by hotfixing live.**

## 3. PostgreSQL migration preservation: A20 owns D01–D04, no execution

GitHub release tree `1db373...` contains migrations through **0031**, including:
- Release `0030_controlled_correction_operations.sql`: Git blob `50aa71ae0199806de3aaf3c57700d2739f2c42bc`.
- Release `0031_atomic_correction_receipts.sql`: Git blob `d44601f4b6477dc9366fc7a65475a0eede1c34c1`.

The GitHub editor reference contains **other, conflicting 0030/0031**:
- Editor `0030_steam_catalog_abstract_world.sql`: Git blob `a6d4ce679136b016dc6eed0e490e3e54060ada22`, proposed canonical **0032**.
- Editor `0031_steam_catalog_pagination_indexes.sql`: Git blob `b813547b834febe8e7398d1b2cfe204b84dd1ed5`, proposed canonical **0033**.
- Editor original 0032–0038: classification revision `694c4e7d30694551c38a944e44e7dd0efe35f030`, trigram `37d550193d7c5280e16195d5f733c59bbabb591b`, exact status counters `b8958e51a3651b259f851d34c34075f3a4b0de36`, import jobs `fadfe2786d2a119ef663106e541f9e225e2e0000`, job sources `382b0e418454df934f3fadcd442180e3b2333727`, retry backoff `5a044dc12b645f68cb8a7fa99f3b455fe7db999e`, throttle `332f983a8ea541a1a3579d476dd6e21bcd61c9dc`; proposed canonical **0034–0040**, **NOT ALLOCATED NOR APPLIED**.

[A20 R23B D01–D04 owner packet](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A20/WEB-005_A20_R23B_A00_DECISION_PACKET.md), Git blob `1a6475847fe9a7726b0fb8806891098c2ea3abbe`: **14** source identities and original/canonical proposal, **D01/D02/D03/D04 each PENDING_OWNER_APPROVAL**, no physical PostgreSQL receipts or trusted applied-ledger attestation. [PR #38](https://github.com/C8LyNn/aplikacja-turnieje/pull/38) HEAD `2d36864f4d2f1c838073f387fd3c8efb3378c43b`, offline read-only validator manifest blob `28f493263a2cbfb919db1f99b220058175b46ba0`, status `PROPOSAL_ONLY_NOT_APPROVED`. No SQL was run by A30.

**Dependency DAG (source policy + run-order gates, NOT executed):**

```text
A00 D01 source identity signatures
  -> D02 total-order policy (release 0027-0031, editor proposed canonical 0032-0040)
  -> D03 physical PG host identity + actual migration ledger and executed-input receipts
  -> D04 A00-exclusive serialized migration allocator/lease
  -> A20 authorized dry-run isolated PG16 & schema/readiness
  -> editor revision/worker schema compatibility test
  -> A60 exact integrated source/runtime QA
  -> ONLY separately owner-approved deployment plan
```

Hard SQL dependencies do **not** automatically authorize release-first/editor-second order; that is a **proposed policy**, not a verified applied history. Do not allocate `0041` by `MAX(prefix)`, rename original SQL, forge migration `APPLIED`, trust table existence as execution proof, or reset databases. PR #55 Basket CAS persists a separate request `WEB-005-T055-BASKET-CAS-PERSISTENCE-V1`, `REQUESTED_NOT_ALLOCATED`, not a migration allocation.

## 4. No-op preservation/preflight and rollback design — NEVER execute without separate GO

**Read-only sequence for authorized ops/QA:**
1. Acquire a **trusted export/manifest of actual live deployment artifact** and 2026-10-15 `cb55335ea…` local checkout, with Git tree/parent/blob hashes, manifest of 140 differing paths, timestamp and signer. The available Replit workspace HEAD `5e68f0f4…` is **not equivalent** and current publishing status is `failed`.
2. Mark source classes by owner, intent and content (API/catalog/auth, PG migrations, UI/portfolio, lockfile deps, tests/docs). Explicit **no-touch** all game/minigame paths, binaries, loaders, canvases and artifacts. The issue’s 140 totals are not assumed to be 140 defects.
3. Verify live runtime from a **separately authorized** safe observational session: provider deployment artifact identity, HTTP route/guard negative tests only under approved test environment, backend worker flag/status, public GET behavior, deployment env *names and presence* (no secret values), catalog schema capabilities and physical PG ledger. No customer data, live writes or secret output.
4. Compare direct source blobs per path against the manifest; prohibit `cp -R`, `git reset --hard`, release-to-Replit wholesale sync and any auto-migration. A merged/disposable **source composite is NOT a deployable live image**.
5. Run isolated exact-SHA QA only once source/file ownership is authorized: 403 denied admin write has **zero DB or Steam upstream effects**, normal public catalog GET, 428 required revision, stale version 409 zero term writes, job insert-only keeps existing classified rows, worker default OFF/readiness, routing unaffected. A20 later isolates physical PG16 for migration/no-op checks. Do not claim test PASS before A50/A60 receipts.
6. Predefine rollback per independent layer: (i) immutable previous deployment artifact + hash and operator ID (not a Git release guess), (ii) frontend route/config rollback independent of server, (iii) API route/auth feature gate rollback without dropping fields, (iv) PG additive schema **forward-only/corrective**, **never blind down migration or production DDL**, (v) worker OFF + pause existing leased jobs safely. No rollback or deploy conducted here.
7. Only A00/HQ can sign `DEPLOY_GO` after independent proof that GitHub release, imported editor changes and retained Replit extensions are reconciled and restart-safe. Issue #72 remains preventive release blocker without that evidence.

**Partial-deploy failure modes:** editor UI invokes endpoints absent in release ⇒ 404/contract mismatch; editor API reads `classification_revision` or exact status counters before SQL applies ⇒ 500; worker starts and queries absent `steam_catalog_import_jobs` ⇒ repeated errors; old release classification PUT overwrites newer revision-protected edits; admin key missing ⇒ intended fail-closed 503 for protected write, not anonymous write; wrong frontend token lifecycle ⇒ unexpected 403 or overpersistent tab secret.

## 5. QA/permissions ledger and residuals

| Requirement | Actual result |
|---|---|
| Source SHA of GitHub release/editor and PR34/PR38 | **VERIFIED** via GitHub commit/tree/file metadata |
| 17 sampled preservation paths with Git blob SHA | **VERIFIED for GitHub**, Replit workspace Git blobs **read-only Agent-reported** |
| Full exact 140-path published snapshot diff | **BLOCKED: historic published artifact/tree unavailable** |
| Replit current workspace inspection | Read-only Agent reply; present branch unrelated to Steam; GitHub `5e68...` commit URL returned **404**, so no independent remote provenance |
| Deployment status | Replit provider **failed**; current served source **UNVERIFIED** |
| Steam release unauthorized route source | **SOURCE-CONFIRMED**, not a live penetration test |
| 0032–0040 canonical/apply/ledger | **PROPOSED / D01–D04 PENDING**, physical DB `NOT_EXECUTED` |
| Native HTTP auth/worker/browser/PG16 tests by A30 | **0 / NOT_EXECUTED**, commands/exits `N/A` |
| Game code / assets changed | **0** |
| App code / configuration changed | **0** |
| Merge/deploy/SQL/reset/workspace overwrite | **0** |

**A30 #72 verdict:** `READ_ONLY_SOURCE_QA_COMPLETE_SCOPED / GITHUB_RELEASE_STEAM_AUTH_GAP_CONFIRMED / EDITOR_REVISION_INSERTONLY_WORKER_PRESERVATION_REQUIRED / HISTORIC_140_PATH_DIFF_BLOCKED / REPLIT_PUBLISHED_SOURCE_UNVERIFIED / MIGRATION_D01_D04_WAIT_OWNER / RELEASE_NO_GO / SWARM006_HOLD`.

**Handoff:** A20 signs migration provenance, A00 recovers true published artifact and coordinates reconciliation and worker/token policy, A50/A60 execute and independently attest exact authorized tests, A10 archives the manifest. No further security code by A30 without explicit scoped GO.
