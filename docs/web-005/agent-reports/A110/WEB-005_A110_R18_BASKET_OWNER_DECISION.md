# WEB-005 / A110 / R18 — Basket CAS owner decision & frontend closeout QA

**Wave** R18.1 · 2026-10-14 (Europe/Warsaw)  
**Task** `WEB-005-T055-T110-A110-R18` · **Agent** A110 — Basket Concurrency & Frontend State  
**Authorization** **SOURCE-ONLY**; no app source patch, new PR, merge/cherry-pick/rebase, SQL, deployment, or SWARM-006 intake.  
**Evidence disposition** `T055_POLICY_OPEN / P10_P17_P19_SOURCE_ACCEPTED_CONDITIONAL / RUNTIME_NOT_VERIFIED / UX044_POLICY_OPEN / RELEASE_NO_GO`.  
**Pinned release** `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`; **main** `c50cc48e6fa508592bda3f4838111e9cff5af80c`.  
**Central R18 authority** [WEB-005_WAVE_R18_AGENT_PROMPTS.md](../../WEB-005_WAVE_R18_AGENT_PROMPTS.md) blob `fd08cedcbd2db3222e4a444403180414d1666f6c`.  
**Signed independent QA baseline** [A60 R17 report](../A60/WEB-005_A60_R17_INDEPENDENT_QA.md) blob `ceb3591d61aed746e36bb86aa8a4c5cf16e5f30d`; [A60 R17 matrix](../A60/WEB-005_A60_R17_PACKAGE_MATRIX.json) blob `cc6f24f582d216e99d8870d0e3519ff497fd8ad3`. These do not certify app-runtime tests.

---

## 1. Immediate, explicit T055 owner/HQ signature request (NO PRESELECTED ANSWERS)

**To A00 → global owner/HQ:** The backend basket-config full-graph `PUT` has **no editor-supplied optimistic-concurrency precondition**. The [release GET/PUT routes](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/routes/tournaments.ts#L778-L815) parse and pass only `baskets` / `routes`; the [service transaction/locks](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/application/stages/stage-basket-configuration.ts#L308-L381) lock tournament, stages, roster and reauthorize the actor, but have **no base-token compare**. The [full replacement](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/application/stages/stage-basket-configuration.ts#L441-L532) deletes/reinserts graph rows and advances per-stage versions. The [frontend Save](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/src/components/stage-baskets-panel.tsx#L928-L943) sends the graph only. `basketFlowAuthorityVersion=1` is an explicit/legacy mode flag, **not a revision counter**.

**Finding classification:** `SOURCE_CONFIRMED_NO_CLIENT_CAS`; two-editor V0 stale full overwrite is `STATIC_INFERRED`, **not a reproduced production incident**. Locks serialize writes but do not distinguish whether the second client edited the same old V0; first-writer update can be replaced. T055 requires a **product-contract decision and later implementation**, not only a frontend confirm dialog.

| ID | Alternative A | Alternative B | Owner/HQ selection |
|---|---|---|---|
| **D1 — source-of-truth revision** | Server-issued **coherent stage-ID/version vector** from same GET snapshot; prove all basket-relevant mutation writers/stage-set/ABA coverage before choosing | New **persisted scalar** `basketConfigRevision` incremented atomically; needs A20 schema/ledger, A90 Backup V3 + restore semantics | **UNSIGNED** |
| **D2 — precondition transport** | JSON `expectedStageVersions` or `expectedRevision` (matching signed D1) | Opaque HTTP ETag and `If-Match` (server-generated, tied to exact basket graph snapshot) | **UNSIGNED** |
| **D3 — stale-conflict response** | **409 Conflict** with stable domain code `STAGE_BASKET_CONFIGURATION_STALE` | **412 Precondition Failed** with same stable domain code | **UNSIGNED** |
| **D4 — legacy/missing precondition** | **428 Precondition Required** + explicit client upgrade/error UX | Other specifically approved **fail-closed 4xx** + upgrade path; never silently accept a full-graph write lacking token | **UNSIGNED** |
| **D5 — invalidation domain** | A changed stage set/version or basket-relevant roster/participant constraint invalidates base | Basket-only revision, with **separate under-lock validation** of every relevant stage/roster mutation | **UNSIGNED** |
| **D6 — losing editor UX** | Preserve local draft, show current server vs draft diff, opt-in rebase/discard | Preserve local draft with explicit reload/manual reconcile and opt-in resubmit; **no implicit overwrite/retry** | **UNSIGNED** |

**Signed decision sheet (one selection PER row; owner only):**

```text
TASK=WEB-005-T055-UX047
D1=__ D2=__ D3=__ D4=__ D5=__ D6=__
OWNER/HQ_ID=__ SIGNED_AT=__ RATIONALE_AND_LEGACY_IMPACT=__
A20/SCHEMA=__ A90/BACKUP=__ A100/A30/PRIVACY=__
A00_NEXT_TASK_ID=__ EXCLUSIVE_FILE_OWNERS=__ NEXT_CODE_GO=__
RUNTIME_DEBT_DISPOSITION=__ (separate from T055 product signature)
```

**Never use this template as authorization itself.** A00/HQ must select/sign and explicitly grant a **later** bounded implementation lane. D1=B entails genuine migration adoption and Backup V3 evolution; **no SQL done or permitted in R18**. D1=A requires proof that each write able to change basket validity advances the vector; stage versions alone are a **candidate**, not automatically sufficient.

### Required invariants after approval — test-first, backend is final authority

1. The GET returns one **coherent** `(basket graph, token)` from the same serialized/snapshot view; **never attach a fresh separate stage-version GET token to a previously loaded graph**.
2. PUT reauthorizes organizer and compares client-supplied base token **inside the same transaction and lock before any DELETE/INSERT/UPDATE**. Distinguish malformed token, absent token, stale token, unchanged token and forbidden organizer without exposing private metadata.
3. Concurrent valid A/B editors loaded from same V0: **exactly one winning success** and one D3-specified 409/412. On stale loser: **zero DB mutations and zero winner rows lost**, atomic rollback. Return stable error code, current token/current graph only if access rules authorize it.
4. Stale/colliding UI draft **remains locally available**; explicit user diff/reload/rebase before any subsequent PUT. No automatic conflict retry, silent last-write-wins or cross-tournament draft transfer.
5. Negative tests: ABA, stage IDs/order changes, stage `version` change with unchanged status, roster changes/late registration, legacy implicit-to-explicit first save, missing token, malformed token, invalid unauthorized token, two commits racing, transaction fault rollback. Positive tests: unchanged V0 one writer, correct token advancement, repeat GET coherence, deliberate user-resolved conflict.

**Next *requested*, not authorized, code scope:** `WEB-005-T055-CAS-L1`, conditional on signed D1–D6 and separate A00 exclusive assignment: first backend response/precondition contract and dedicated PG16 concurrent transaction test; then generated API and `StageBasketsPanel` loser-draft error workflow (L2) before marking functionality implemented. Dedicated physically isolated PG16/owner reset consent required for destructive tests. A110 has **NO R18 GO** to modify backend or frontend.

### Owner waiver and final-handoff implications

- T055 is an accepted WEB-004 R2 backlog item; it is **not SOURCE_FIXED** just because another PR is conditionally accepted.
- If no signed choice is available at closeout, label **`POLICY_OPEN / OWNER_WAIVER_REQUIRED`**, keep it explicit in the A00 disposition ledger and ask owner/HQ to approve its treatment. Only owner/HQ may accept exception/deferral; an agent cannot self-close.
- R18 §3 allows requesting a separately approved **RUNTIME_DEBT_TO_SWARM006** transfer when exact-SHA runtime tests cannot run, but this **does not itself approve T055 product semantics or permit unsanctioned code**. Full integrated QA remains a STOP release gate. A00 must request distinct `FINAL_HANDOFF_GO`. **No SWARM-006 activation by A110.**

---

## 2. P10/P17/P19 — PR43/50/52 live source review and A60 R17 acceptance

Verified via live PR metadata + actual changed filenames, all **OPEN DRAFT / not merged / same unchanged release base**:

| Packet | PR | Exact HEAD SHA (R17→R18) | Changed files | A60 R17 exact-SHA verdict | Native app runtime |
|---|---|---|---|---|---|
| **P10** CSV FileReader | [#43](https://github.com/C8LyNn/aplikacja-turnieje/pull/43) | `96a6068f69027574ac76e18d4d5a2c444b5a914a` → **same** | 3 (CSV hook/test; `tournament-detail.tsx`) | **SOURCE_ACCEPTED_CONDITIONAL** | NOT VERIFIED |
| **P17** Backup Preview | [#50](https://github.com/C8LyNn/aplikacja-turnieje/pull/50) | `5457a74187edc263730c3a4b25a663bdf5531ee9` → **same** | 5 (backup hook/test; dialog/test; `tournament-detail.tsx`) | **SOURCE_ACCEPTED_CONDITIONAL** | NOT VERIFIED |
| **P19** Stale Stage Modal | [#52](https://github.com/C8LyNn/aplikacja-turnieje/pull/52) | `cce73ec47445102b216b3f8eceb4ec9de67eb1a7` → **same** | 2 (stage panel/test) | **SOURCE_ACCEPTED_CONDITIONAL** | NOT VERIFIED |

**Do not promote A60's conditional source verdict to runtime acceptance or “READY FOR RELEASE.”** R17 [A60 21-package matrix](../A60/WEB-005_A60_R17_PACKAGE_MATRIX.json) separately proves source provenance and reports **`actual_application_runtime_receipts_independently_verified=0`** across packages at that checkpoint. [A50 R17 receipt](../A50/WEB-005_A50_R17_RECEIPT.md) records `0` native application tests, Node/Git environment probes and missing authorized complete workspace+pnpm+isolated PG16. No A110 R18 test execution. R18 A50 may update its own receipts; its future result must not be guessed.

**Source-confirmed patterns and required A50 negatives/positives:**
- **PR43** `hooks/use-tournament-csv-file-reader.ts` scopes reads to `tournamentId` + generation + reader. Deferred A callback after navigating A→B, closing modal or selecting B file **must not** populate B or send `POST /tournaments/B/players/import`; valid B file/manual selection **must** work. Existing **5 RTL definitions are NOT executed** in A110. Hook-harness tests are not full-page HTTP behavior.
- **PR50** `hooks/use-scoped-backup-preview.ts` uses scoped FileReader epoch/identity; backup dialog resets newly entered organizer/viewer/support credentials on new file/context. Late A `onload/onerror` after B selection/route/close: B must remain isolated, **0 stale import POST**, no old credentials. Valid B V2/V3 with B passwords can explicitly create **new tournament C**. **10 authored RTL definitions NOT executed**. A backup import **does not overwrite an existing B**.
- **PR52** `components/tournament-stages-panel.tsx` captures opening snapshot of tournament/status/stage/version/action; confirm refetches stage list, start additionally readiness/ceremony, aborts on stale state or 503; actual POST must be **zero** after A→B same numeric stage ID, version/status shift or failed read. Valid unchanged stage **one** lawful start/complete. **7 authored RTL definitions NOT executed**; backend remains final transition CAS authority, GET→POST gap remains.

**Targeted safe frontend A50 commands — NOT_EXECUTED by A110; run in separate per-SHA checkout with Node22/pnpm10, locked dependencies, explicit A00 GO:**

```bash
# In separate clean checkout PR43
git checkout --detach 96a6068f69027574ac76e18d4d5a2c444b5a914a
git rev-parse HEAD; node -v; pnpm -v
pnpm --filter @workspace/tournament-manager run typecheck
(cd artifacts/tournament-manager && TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json" node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-tournament-csv-file-reader.test.tsx)

# In separate clean checkout PR50
git checkout --detach 5457a74187edc263730c3a4b25a663bdf5531ee9
git rev-parse HEAD
pnpm --filter @workspace/tournament-manager run typecheck
(cd artifacts/tournament-manager && TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json" node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-scoped-backup-preview.test.tsx ./src/components/backup-restore-dialog.test.tsx)

# In separate clean checkout PR52
git checkout --detach cce73ec47445102b216b3f8eceb4ec9de67eb1a7
git rev-parse HEAD
pnpm --filter @workspace/tournament-manager run typecheck
(cd artifacts/tournament-manager && TSX_TSCONFIG_PATH="$PWD/test/tsconfig.json" node --import tsx --import ./test/setup-dom.mjs --test ./src/components/tournament-stages-panel.test.tsx)
```

**Repro requirements:** record exact SHA, command+OS+Node/pnpm version, exit, TAP pass/fail/skip, synthetic non-secret fixtures; full frontend suite `pnpm --filter @workspace/tournament-manager run test` per exact HEAD and separately mounted TournamentDetail A→B/HTTP negative/positive before end-to-end claim. Above are **instructions, not executed tests**. Do not trigger paid CI manually or create an in-WEB005 composite.

**Historic automatic CI only:** [#43 run 38590842415](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38590842415), [#50 run 38600542147](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38600542147), [#52 run 38605694664](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38605694664) completed FAIL at earlier Pack19 regex mismatch `readOnly:true` vs `accessMode:"read only"`. Feature-specific RTL was **not reached** and these are not failures of the proposed frontend fixes. Draft PR35 independently owns source matcher correction.

## 3. UX044 / withdrawn findings / cross-owner file and privacy risks

**UX044 Host unsaved draft policy:** The [release Host screen](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/src/pages/tournament-host.tsx#L245-L270) computes `hasDraftScores` only from `Object.keys(scores)`, despite separate `resultReason`; its `beforeunload` and anchor-click guard does not cover every Wouter/programmatic/popstate transition. **SOURCE_CONFIRMED gap in guard coverage; actual lost user draft HYPOTHESIS.** Owner must choose **block/confirm route navigation** or **retain private per-tournament draft with scoped expiry/clear** before a code lane; A110 does not decide or implement. An owner waiver must explicitly record behavior and risk.

**WITHDRAWN** (do not re-open without new independent evidence): ordinary advanced `StageBasketsPanel` A→B transferred stale draft and alleged Backup import overwrites existing tournament B. Backup import instead creates new C. UX016 has no newly verified A110 source finding in R18.

**Future integrator file collision:** #43/#50/**#54** each edit `artifacts/tournament-manager/src/pages/tournament-detail.tsx`. This establishes a collision *risk*, not a measured merge conflict. PR52 touches separate stage panel/test. R18 #54 may change SHA under A120 code lane; recheck after author publication. Only eventually authorized SWARM-006 resolves conflict and combined route/HTTP regression after `FINAL_HANDOFF_GO`; **no A110 merge**.

**Privacy intersection:** [PR53](https://github.com/C8LyNn/aplikacja-turnieje/pull/53) R17 snapshot head `8f959733258aed0cab15298dd0684ca068045e6f` handles URL-prefix/tuple-ban plus known-owner game picks, but A60 R17 flagged **standalone unknown-owner picks**; R18 A100/A30 own exact source repair. React Query cache eviction alone does not prove PR43/50 transient local file/form state is revoked after credential downgrade. A50/A30 synthetic logout/route/private→public tests should preserve B's lawful cache, avoid blanket `matches` purge, and never use real credentials. Privacy leakage is **not runtime established**.

## 4. Acceptance/waiver and formal handoff disposition for coordinator 00

| A110 scope | Source disposition | Owner action | Next gate |
|---|---|---|---|
| **T055 / UX047 basket full PUT CAS** | `SOURCE_CONFIRMED_GAP / POLICY_OPEN / NOT_PATCHED` | Sign D1–D6 **or** explicit accepted deferral/exception; task still visible | Separate later implementation GO or owner waiver. Never call `SOURCE_FIXED` now |
| **P10 #43 / CSV UX042** | `SOURCE_ACCEPTED_CONDITIONAL` (A60 exact SHA) | No new behavior policy requested | Native A50 tests + A60 runtime mapping; integrator conflict |
| **P17 #50 / Backup UX045** | `SOURCE_ACCEPTED_CONDITIONAL` (A60 exact SHA) | No new behavior policy requested | Native A50 tests + A60 runtime mapping; privacy route regressions |
| **P19 #52 / Stage UX046** | `SOURCE_ACCEPTED_CONDITIONAL` (A60 exact SHA) | No new behavior policy requested | Native A50 tests + A60 runtime mapping; backend final checks |
| **UX044 / Host draft** | `SOURCE_CONFIRMED_GUARD_GAP / BEHAVIOR_POLICY_OPEN` | Sign BLOCK vs RETAIN, or explicit waiver | Later scoped code GO, tests; no R18 patch |
| **UX016, withdrawn complaints** | No new sourced ticket / withdrawn claims remain withdrawn | No action absent new independent evidence | Do not invent closeout PR |

**Critical closeout constraint:** R18 only prepares documents. If A00 cannot secure physical A50 native test executor, it must obtain separate owner/HQ `RUNTIME_DEBT_TO_SWARM006` approval, with **full composite runtime as mandatory STOP release gate**, plus specific T055/UX044 `POLICY_OPEN` owner disposition/waiver and final `FINAL_HANDOFF_GO`. Neither this report nor source QA constitutes those signatures. Do not infer that closing R18 automatically dispatches SWARM-006.

**Recommended immediate A00 next action:** Have HQ return the D1–D6 decision sheet (or sign a risk-accountable exception) and UX044 BLOCK/RETAIN disposition; record both in the immutable backlog with owner, reason, timestamp, follow-up owner, and release risk. A50 needs approved trusted per-SHA checkout/Node22/pnpm10 and separately PG16 preflight for any future CAS race validation. R18 source blockers PR42/#53/#54 belong exclusively to A70/A100/A120 and A60 independent QA; A110 has no patch authorization.

**A110 author status:** `R18_SOURCE_ONLY_DELIVERED / T055_UNSIGNED / P10_P17_P19_CONDITIONAL_A60 / NO_NATIVE_APP_TESTS / OWNER_WAIVER_REQUIRED_IF_DEFERRED / RELEASE_NO_GO / SWARM006_HOLD`.  
**Formal R18 handoff:** [WEB-005_A110_R18_HANDOFF.md](./WEB-005_A110_R18_HANDOFF.md).
