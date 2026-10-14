# WEB-005 — A110 — R9 T055/T110 NEXT PATCH PLAN

**Artifact:** `WEB-005_A110_R9_T055_T110_NEXT_PATCH_PLAN.md`  
**AGENT / TASK / WAVE:** A110 — Basket Concurrency & Frontend State / `WEB-005-T055-T110-A110-R2` / R9  
**Date:** 2026-10-14 (Europe/Warsaw)  
**Mode / authority:** `SOURCE-ONLY / TEST-FIRST`, **NO CODE MODIFICATION**.  
**Status:** `DESIGN_COMPLETE / POLICY_OPEN / RUNTIME_NOT_EXECUTED / IMPLEMENTATION_STOP`.  
**Owner:** local WEB-005 A00. **QA:** A50 executor, A60 independent acceptance. **Consultation required:** A100 privacy, A80 stage lifecycle.  
**Repo:** `https://github.com/C8LyNn/aplikacja-turnieje` (private).  
**Source base (release and PR32 HEAD):** `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.  
**`main` HEAD:** `c50cc48e6fa508592bda3f4838111e9cff5af80c`.  
**R9 documentation branch HEAD at inspection:** `01bf9e8e73678cb762d2b4c7b29467eb674a9ad4` (`chore/web-005/t000-wave1-control`).  
**PR #39 HEAD (Open, Draft):** `16053ee132756ca05b6f2cd1f0cabae823905387`.  
**PR T055 / T110:** `NO PR — SOURCE-ONLY`; neither is implemented in R9.  
**Changes to application code:** `NONE`. **Merge/deploy:** `NOT AUTHORIZED`. **SWARM-006 dispatch:** `NOT AUTHORIZED`.

## 1. Decision summary for A00

R9 instruction file `docs/web-005/WEB-005_WAVE_R9_AGENT_PROMPTS.md` (blob SHA `edd4f1e5ce48bca4f10f049d52d098c098261db3`, version R9.1) reserves three code lanes for A90/T060-B1, A70/T040-MP2A and A100/T080-S1. **A110 is not a fourth implementation lane.** This is a test-first plan for **two future separate PRs**, not an authorization to implement them.

- **T055 / UX-047:** `SOURCE_CONFIRMED` omission of conditional full basket PUT. Transactions and `FOR UPDATE` serialize writes but do not detect that two editors both based their full payload on V0. The chosen compare-and-swap token and exact `409`/`412` response are `POLICY_OPEN`. Both future variants require no silent lost update.
- **T110 / UX-042/044/045/046:** source-suggested stale asynchronous UI and local draft vulnerabilities; exact A→B reachability, navigation loss and modal behavior must be tested in real same-instance React/browser fixtures. Do **not** upgrade these to runtime-confirmed incidents.
- **Explicitly withdrawn:** normal `TournamentDetail A→B` does **not** prove `StageBasketsPanel` advanced draft transfer, because the parent loading/auth boundary remounts it. Backup import creates **NEW** tournament C and must **not** be described as overwriting existing B.
- **Next action for A00:** sign `POLICY-BASKET` (wire precondition, status, legacy clients, version source) and confirm A100/A80 consultation before allocating a future code slot. A50/A60 receive the fixtures in §4 and §7.

## 2. Verified GitHub evidence and actual file inventory

| Source (all pinned to `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`) | Verified state | Evidence level |
|---|---|---|
| [`stage-basket-configuration.ts` L308–328](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/application/stages/stage-basket-configuration.ts#L308-L328) | `replaceStageBasketConfiguration` acquires tournament lock; actor is revalidated; no expected basket revision in input | `SOURCE_CONFIRMED` |
| [`stage-basket-configuration.ts` L441–532](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/application/stages/stage-basket-configuration.ts#L441-L532) | Deletes/reinserts baskets, routes, participants in one transaction, increments every projected `stage.version`, persists `basketFlowAuthorityVersion:1` | `SOURCE_CONFIRMED` |
| [`stage-basket-configuration.ts` L69–225](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/application/stages/stage-basket-configuration.ts#L69-L225) | GET composition reads tournament, stages, baskets, routes, assignments, memberships, players via multiple queries in a default transaction; no snapshot revision in response | `SOURCE_CONFIRMED` |
| [`routes/tournaments.ts` L778–813](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/api-server/src/routes/tournaments.ts#L778-L813) | GET/PUT stage-baskets, `UpdateTournamentStageBasketsBody`, no precondition check or declared stale revision handling | `SOURCE_CONFIRMED` |
| [`schema/tournaments.ts` L144–149, L260–291](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/lib/db/src/schema/tournaments.ts#L260-L291) | `basketFlowAuthorityVersion` is authority-mode 0/1, not revision; each stage has own `version` | `SOURCE_CONFIRMED` |
| [`stage-baskets-panel.tsx` L728–765, L819–842, L928–941](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/src/components/stage-baskets-panel.tsx#L928-L941) | Draft copied into advanced mode, PUT without revision, 200 closes draft, thrown error retains it; invalidate basket query only | `SOURCE_CONFIRMED` |
| [`stageBasketConfigurationInput.ts` L11–14](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/lib/api-zod/src/generated/types/stageBasketConfigurationInput.ts#L11-L14) | Generated body only has `baskets` and `routes`; must change OpenAPI source and regenerate | `SOURCE_CONFIRMED` |
| [`tournament-detail.tsx` L500–528](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/src/pages/tournament-detail.tsx#L500-L528) | CSV write uses current `id`; delayed FileReader callback calls state setters without identity/epoch guard | `SOURCE_CONFIRMED` (missing guard); behavior `HYPOTHESIS` |
| [`tournament-detail.tsx` L347–409](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/src/pages/tournament-detail.tsx#L347-L409) | Backup preview/file reader, new password inputs, import callback; navigates to newly created tournament | `SOURCE_CONFIRMED` |
| [`backup-restore-dialog.tsx` L38–103](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/src/components/backup-restore-dialog.tsx#L38-L103) | Second backup entry path; FileReader callback lacks generation guard; changing backup does not reset new password fields | `SOURCE_CONFIRMED` |
| [`tournament-host.tsx` L248–267](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/src/pages/tournament-host.tsx#L248-L267) | Unsaved guard depends only on scores; handles beforeunload + anchor click, not every SPA Back/Forward route; reason-only draft omitted | `SOURCE_CONFIRMED` (guard coverage); browser effects `HYPOTHESIS` |
| [`tournament-stages-panel.tsx` L554–559, L735–795, L1033–1112](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/artifacts/tournament-manager/src/components/tournament-stages-panel.tsx#L735-L795) | Modal action ID stored, current stage/readiness consulted; no explicit opened-version predicate; server stage status is still authoritative | `SOURCE_CONFIRMED` (coverage gap); illegal commit `NOT_PROVEN` |
| [`tournamentStage.ts` L18–54](https://github.com/C8LyNn/aplikacja-turnieje/blob/1fdc401d87c6bffe6bf7312dfc9db681b689dcf7/lib/api-zod/src/generated/types/tournamentStage.ts#L18-L54) | `version` already available in stage API model | `SOURCE_CONFIRMED` |
| [PR #39](https://github.com/C8LyNn/aplikacja-turnieje/pull/39) | Open draft on `16053ee132756ca05b6f2cd1f0cabae823905387`; edits `routes/tournaments.ts` and `lib/api-spec/openapi.yaml`; dependent file-ownership collision is real | `SOURCE_CONFIRMED` |

Sources cross-checked against the existing `WEB-005-T055-T110-A110-R1.md` (prior A110 source-only report) and coordinator's R9.1 / `WEB-005_WAVE_NEXT_IMPLEMENTATION_PLAN_R1.md` / BACKLOG / DECISIONS. Any future implementation must re-pin its SHA.

## 3. T055 — BASKET CAS CONTRACT R2

### 3.1 Hard invariants

**BC-01 — Client snapshot ownership.** A revision/precondition is captured with the *actual persisted basket graph the editor started editing* and remains frozen through draft editing, even if React Query refetches. Never infer the draft baseline from a separately refetched `/stages` response.

**BC-02 — Atomicity.** Under the same tournament lock that serializes graph replacements: reauthorize actor; check tournament/stage editability and **compare the frozen expected precondition against the current authoritative value before any delete/insert/update**. Validation errors and 409/412 conflicts yield `zero-write`.

**BC-03 — Single winner.** Two concurrent full-config PUTs based on one V0 produce one committed V1 and one controlled stale reject, regardless of lock order. Reject second request even when payload is identical if that request used stale V0 (no ABA exception).

**BC-04 — Version advancement.** Exactly one logical version advancement for a successful modifying PUT; none for rejects or rollback. A response and the next GET must be consistent. UI must never silently retry with newly fetched version.

**BC-05 — Scope.** Cross-tournament preconditions never validate. Changed stage set, stage lifecycle, basket graph or relevant roster validity cannot be silently accepted by a stale write. 401/403/404/422 and immutable conflicts retain distinct domain codes.

**BC-06 — Frontend.** A losing editor's local draft remains intact and visible, with a separate, freshly fetched canonical server snapshot for comparison and explicit user-controlled resolution. No 'overwrite anyway' stale PUT.

**BC-07 — Rollout.** Old client PUTs without the required precondition must fail closed and have an explicit operator-facing error (status remains POLICY_OPEN). Old cached frontend/new API version-skew needs a staging/browser test.

### 3.2 Choose one implementation strategy after owner decision

| Option | Mechanism | Cost/risk | Prerequisites |
|---|---|---|---|
| **V — no-DDL candidate** | Return a coherent ordered vector `[{stageId,version},...]` in the same GET basket snapshot; freeze at edit start; compare exact stage-ID set and version values under current existing `FOR UPDATE` locks | Smaller patch, avoids migration numbering; conservative conflicts if unrelated stage version changes. Must prove **every basket-changing writer bumps that vector** and GET is not torn | Review all writers/legacy default; make GET snapshot coherent (transaction snapshot/locking), explicit A00 policy |
| **C — dedicated revision** | Add monotonic `basketConfigRevision` per tournament, include it in atomic GET response, require same token in PUT and increment once after successful change | Clearer basket-specific semantics, but schema migration and historical backup/import portability; collision with A20/T021/A90/T060 | A00 policy + A20 schema/migration reconciliation + A90 backup revision policy |

**Important correction to R1:** `stage.version` is **not currently an API-level basket configuration version**, but the basket PUT already increments stage versions. That makes an exact, **server-issued version vector a viable no-DDL candidate for T055**, not a proven substitute. A caller cannot safely pair a previously received `GET /stage-baskets` graph with an independently refreshed `GET /stages` vector: the two requests may observe different database moments, allowing stale graphs to be stamped with a newer token. The server must produce graph and token coherently (e.g. repeatable-read snapshot or shared serialization lock) or choose dedicated revision.

**OpenAPI choice:** Prefer a single precondition mechanism (either JSON `expectedRevision`/`expectedStageVersions`, or `If-Match` tied to an ETag). Do not accept contradictory header/body tokens or manually edit generated types. `409` vs `412`, missing precondition status, scalar/vector representation and revision portability are explicitly **`POLICY_OPEN`**. No status code is selected by A110.

### 3.3 Transaction outline — design, NOT CODE

```text
BEGIN
  SELECT tournament WHERE id = ? FOR UPDATE
  revalidate organizer actor under lock
  SELECT ordered tournament stages ... FOR UPDATE
  assert draft/planned editability
  assert client provided mandatory precondition
  assert server-issued expected token equals current token [NO WRITES YET]
  validate exact stage IDs, graph invariants and player assignment
  persist basket/routes/participant graph; update projected stages
  increment or derive next CAS token according to signed policy
  persist compiled routing plan if applicable
  return coherent canonical config/token
COMMIT
```

Lock order must remain identical to lifecycle/roster/match operations; a recheck with stale read followed by a write outside transaction is **not** acceptable.

### 3.4 Conflict feedback contract

Example text (wording, not chosen HTTP status):

> Konfiguracja koszyków została zmieniona w innej karcie lub przez innego organizatora. Twoje niezapisane zmiany pozostają zachowane. Porównaj je z aktualną konfiguracją przed ponownym zapisem.

UI states: `editing(V0)` → `saving(V0)` → `saved(V1)` **or** `conflict(localDraft V0, serverSnapshot V1)`. Error panel displays local vs server graph (baskets/routes/assignments) separately and optionally offers **copy locally / discard / review changed fields**. A further PUT is permitted only after a user-driven new baseline selection/explicit confirmation, with newly issued current precondition; no implicit request retry, and never reinterpret 409/412 as network retry.

Invalidate on success: stage baskets, stage list, tournament details/start-readiness and basket/routing-dependent previews (using centralized invalidation helper where appropriate). On conflict, refetch latest canonical **without destroying the dirty draft**, and clear/restrict stale derived readiness previews. A 401/403 or changed authorization context is a separate A100 privacy/security boundary.

## 4. DUAL-EDITOR FIXTURE / A50+A60

**Fixture:** `BASKET-DUAL-01`, machine-readable companion `WEB-005_A110_R9_T055_T110_TEST_CONTRACTS.json`. Tournament `42/draft`; two `planned` stages IDs `501/502` at version `1`; one valid explicit basket graph V0 and one valid route. Editors A/B each GET **the same coherent V0**, then produce different but valid basket-color modifications.

| Test ID | Setup/action | Expected DB/API |
|---|---|---|
| `BASKET-DUAL-01` | Queue two PUTs V0 on distinct PG connections, allow either lock owner first | Exactly **one 200**, **one controlled stale 4xx** (`409` or `412`, policy open), final exact winner graph, losing editor draft intact |
| `BASKET-DUAL-02` | A save V0→V1, B later PUT V0 | B rejected, unchanged V1 |
| `BASKET-DUAL-03` | Barrier A holds tournament row lock, B waits; exchange winner order | Independent of order, exactly one commit |
| `BASKET-DUAL-04` | V0→V1→V2 identical to V0 (ABA), late token V0 | Reject despite content equality |
| `BASKET-DUAL-05` | Old frontend PUT omits precondition | Reject fail-closed; no DB writes |
| `BASKET-DUAL-06` | Stage starts after editor reads V0 | Immutable/stale reject; no basket write |
| `BASKET-DUAL-07` | Roster changes making draft invalid while open | Reject invalid draft, not silently accept missing-player assignments |
| `BASKET-DUAL-08` | Stage added, removed or ID mismatch | Token/stage-set check rejects |
| `BASKET-DUAL-09` | Inject DB error after first delete, before commit | Rollback ALL graph/stage/routing revisions; no partial graph |
| `BASKET-DUAL-10` | Organizer token revoked after initial auth, before transaction lock | Backend reauthorization rejects; 0 writes |
| `BASKET-DUAL-11` | V0 token from tournament A submitted to B | B rejects; 0 writes |
| `BASKET-DUAL-12` | Concurrent GET during destructive full PUT | GET graph/token coherent; never assembled across distinct transactions |

**Zero-write ledger:** compare row-level snapshots/counts for `stage_baskets`, `stage_basket_routes`, `stage_basket_participants`, `tournament_stages.version`, `tournaments.basket_flow_authority_version`, and compiled routing plan revision before/after rejected call. Count only actual intended mutations in successful call. Test `legacyDefaulted=true` first save as well as already explicit basket graph.

**Status:** `NOT_EXECUTED` — no isolated PG16 provisioned/approved in this agent's context. Previous tests in repository establish paths, **not** PASS of these new scenarios.

## 5. T110 — FRONTEND ASYNC RISK MATRIX R2

| Finding | Exact path | Evidence and likely impact | Guard / next-patch scope |
|---|---|---|---|
| `UX-042 CSV` | `TournamentDetail` `csvText`,`csvMode`,`csvConfirmReplace`; `FileReader.onload` | `SOURCE_CONFIRMED` no callback ID/epoch check; A→B mutation outcome `HYPOTHESIS` | Bind CSV state to `(tournamentId, generation, selection)`; abort pending reader *and* ignore stale callbacks; invalidate replacement confirmation on ID/mode/roster change |
| `UX-044 Host` | `TournamentHost` scores + `resultReason`, useMatchResultDrafts | `SOURCE_CONFIRMED` guard only covers scores/anchor/reload; browser history behavior `HYPOTHESIS` | Single dirty predicate for scores + changed reason + meaningful result draft; SPA Back/Forward/programmatic navigation retains or blocks; hard unload native warning |
| `UX-045 Backup` | `TournamentDetail` restore plus `BackupRestoreDialog` | New credentials/preview can be retained on file change or late callback; **import always creates NEW C**, not overwrite B | Generation-bound preview; reset NEW passwords on new backup/close/identity/visibility, prevent stale import, label 'utworzy nowy turniej' |
| `UX-046 Lifecycle modal` | `TournamentStagesPanel` `actionStageId`, readiness/preview refetch | UI may show old readiness/version; server mutation guards remain; illegal DB mutation `NOT_PROVEN` | Capture `(tournamentId,stageId,stage.version,status,action)` on open; disable/close on mismatch; recheck before submit, accept controlled server conflict |

### 5.1 CSV and FileReader contract

- Every read callback owns exact `tournamentId`, file selection generation and component lifecycle generation. `reader.abort()` alone is **not** sufficient because a previously queued callback may still execute.
- In-flight A file read resolving after B is selected must not set B's text, mode, confirmation, result or error. Manual typing or selecting file B invalidates prior generation; **latest user intent wins**.
- Destructive roster `replace` confirmation belongs to `(tournamentId, mode, current roster identity/fingerprint, CSV selection)` and is invalidated if any component changes; B must require its own confirmation even if A was already confirmed. Backend permissions remain authoritative.

### 5.2 Host dirty navigation contract

- `dirty` must reflect actual unsaved scores *or* a meaningful uncommitted reason (walkover/no-contest), not mere focus or a captured unmodified match snapshot.
- Native reload/close: `beforeunload` only while dirty; SPA popstate/programmatic Wouter path: either **explicit blocking** or **route+auth-context-scoped in-memory draft retention**; not only anchor click interception. Choice pending A00/A100 for privacy/UX.
- Browser Back/Forward needs **real browser E2E**; jsdom `popstate` tests alone are insufficient to prove native history/confirm behavior.
- After successful commit or explicit discard, remove stale guard and draft. After identity/role/401/403 change, private draft access must be redacted/cleared according to A100; never persist credentials to localStorage.
- Preserve existing result `expectedRevision`/match optimistic-concurrency checks; these are T040/T090 boundaries, not T110's replacement.

### 5.3 Backup privacy and NEW tournament semantics

- Both backup picker implementations must ignore stale FileReader completion after close/new file/tournament navigation. Choosing another backup with different `visibility` must clear or re-evaluate organizer/viewer/support *new password* fields; remove old secrets when switching contexts.
- Preview should state: **import creates a new tournament C with new credentials**, original B is unchanged. Test success uses server-issued `result.tournament.id` C. Do not claim that backup import overwrites B. No password/token data in preview logs, instrumentation or report; if A100 requires data redaction, honor that separate security contract.
- Server Backup V3 logical integrity remains owned by A90/T060. T110 validates frontend preview lifecycle only; does not modify Backup V3 schema/history.

### 5.4 Stage modal safety

- On open store source stage snapshot version + status; when polling/refetch changes stage/status or tournament identity, close or disable confirm and explain why.
- Check `(tournamentId, stageId, version, status)` immediately before dispatch. If a true race occurs after client recheck, backend must issue controlled state rejection; frontend cannot guarantee atomicity.
- A80 owns sporting/lifecycle policy. Do not set expected 409 for every stage action if backend currently returns a different authorized domain status; map exact implementation after A80 contract.

## 6. MINIMAL TWO-PR PATCH SPLIT — FUTURE ONLY

### `T055` (first future independent PR; **policy and file ownership gated**)

**Candidate backend:** `artifacts/api-server/src/application/stages/stage-basket-configuration.ts`, `artifacts/api-server/src/routes/tournaments.ts`, `lib/api-spec/openapi.yaml`; if dedicated revision chosen also `lib/db/src/schema/tournaments.ts` + reconciled new migration per A20 and Backup V3 compatibility per A90. **Generated artifacts:** `lib/api-client-react/src/generated/*`, `lib/api-zod/src/generated/*` only via codegen. **Frontend:** `stage-baskets-panel.tsx`, `stage-configuration-feedback.ts`. **Tests:** `stage-baskets.integration.test.ts`, `stage-baskets-panel.test.tsx` plus isolated concurrency fixture.

**Collision gate:** `routes/tournaments.ts` is a known A70/A100 code-lane overlap; OpenAPI and generated types overlap with PR39 integration. No same-file concurrent edits or cherry-picks. Wait for A00 owner release, do not introduce new DDL while 0030/0031 T021 and Backup V3 revision semantics remain unresolved. One small PR only.

### `T110` (second independent future PR; no backend CAS policy needed)

**Candidate frontend only:** `pages/tournament-detail.tsx`, `components/backup-restore-dialog.tsx`, `pages/tournament-host.tsx`, `components/tournament-stages-panel.tsx`; focused tests in existing `.test.tsx` or new per-screen `.test.tsx` (avoid broad refactor). No `routes/tournaments.ts`, `revert-match.ts`, `backup-v3.ts`, SQL DDL, OpenAPI or generated client edits. Keep separate from A100 revocation code and A80 lifecycle logic; only refer to their agreed interfaces.

### Sequencing

1. R9: **A110 documentation/fixtures only**. A70/A90/A100 own the three active code lanes.
2. Next permitted planning gate: A00 signs `POLICY-BASKET` status/token and clears file-ownership; A100/A80 give privacy/lifecycle feedback.
3. At a subsequently released implementation slot: T055 minimal CAS contract + deterministic test-first PR, or T110 frontend-only PR if its UX/identity guards are approved first. Never self-allocate a code lane.
4. A50 executes safe targeted tests on exact patch SHA; A60 independently verifies; A10 stores conditional P08+ metadata **internally**. SWARM-006 is not contacted until all WEB-005 accepted backlog is closed.

## 7. COMPONENT + BROWSER + HTTP/PG TEST CONTRACTS

The companion JSON fixture includes machine-readable IDs and expected results; every row below is a **future assertion**, NOT executed QA.

| ID | Layer | Setup | Expected |
|---|---|---|---|
| FE-CSV-01 | RTL/Wouter | A replace confirmed → same mounted tree B | No A CSV/confirmation under B, zero B mutation with A payload |
| FE-CSV-02 | RTL/deferred FileReader | A read pending → route B → resolve A | B text/error/result unchanged |
| FE-CSV-03 | RTL/deferred reads | A pending; B file selected and edited | Old A onload ignored, newest B intent persists |
| FE-CSV-04 | RTL | Close import A, then callback A | No preview/confirmation resurrection |
| FE-HOST-01 | Browser | Host unsaved 1:0 → Back/Forward/programmatic route | Blocking or scoped draft retention; no silent loss |
| FE-HOST-02 | Browser + RTL | Walkover/no-contest reason-only draft | Same protection despite no score |
| FE-HOST-03 | RTL | Focus vs actual mutation; success/discard | No false dirty on focus; guard cleared after save/discard |
| FE-BACKUP-01 | RTL | Backup A preview + credentials → B + late A callback | No A preview under B; credentials not re-used |
| FE-BACKUP-02 | RTL+HTTP/PG | Import A from B | New C created, B unchanged; new credential checks applied |
| FE-BACKUP-03 | RTL | private_online backup replaced by public_online backup | Fields re-evaluated; no stale viewer/support secret reuse |
| FE-STAGE-01 | RTL + browser | Complete modal S active/v5, refetch completed/v6 | Modal closes/disables, no stale action; true race controlled by backend |
| FE-STAGE-02 | RTL + browser | Start modal planned/v5, A→B same numeric ID | Action bound to correct tournament/stage and latest version |
| FE-PRIV-01 | RTL/browser (A100 review) | Logout/revoke/401/403 with pending private reads and drafts | Gated private UI cleared/redacted; callbacks ignored |

**A50 commands (guidance; run only after proper environment is established):**

```bash
# On exact branch/SHA, verify before execution:
git rev-parse HEAD
node --version
pnpm --version

# Non-destructive frontend/component suite:
pnpm --filter @workspace/tournament-manager run test
pnpm --filter @workspace/tournament-manager run typecheck

# Contract/source generation check after an authorized future patch:
pnpm --filter @workspace/api-server run typecheck

# Requires approved isolated PostgreSQL16; DO NOT EXECUTE without A50 preflight:
# TEST_DATABASE_URL=postgresql://.../dedicated_test_db
# TEST_DATABASE_SCHEMA=tm_test_a110_cas
# TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA
# pnpm --filter @workspace/api-server exec node --import tsx #   --test --test-concurrency=1 ./test/stage-baskets.integration.test.ts
```

The database helper contains `DROP SCHEMA ... CASCADE` for test schemas. Name checks are **not** a substitute for validating isolated target ownership and explicit authorization. A50 must verify credential/host/database ownership, full preflight and positive approval **before** any DB test. Do not run on prod/shared DB. Native browser tests require an approved browser runner; Node test suite alone does not prove Back/Forward behavior.

**R9 execution record (A110):** `TESTS_RUN = 0`, `RUNTIME_VERIFIED = 0`, `EXIT_CODE = NOT_APPLICABLE`, `ENVIRONMENT = GitHub source inspection / local documentation only`, `NOT_EXECUTED = all application/DB/browser/CI tests`. No misleading `PASS`.

## 8. Consultation requests (NOT countersigned)

**A100 — T080-S1 / security & privacy:** confirm when private drafts, backup previews and *new* password input state must be purged on logout, role switch, 401/403 or revocation; confirm cache key segregation `(tournamentId, auth identity)`. Revocation backend logic belongs to A100. A110 has not received formal A100 sign-off in this turn.

**A80 — T050/T051 / lifecycle:** confirm which stage status transitions and version increments invalidate a pending `Start`/`Complete` modal, and whether any endpoint already enforces expected version. No A80 policy is assumed.

**A20 — T021 / migration:** consult only if dedicated basket revision and DDL option chosen; avoid unapproved 0030/0031 adoption. **A70 — T040:** protect `routes/tournaments.ts` ownership, no edit alongside A100. **A90 — T060:** review Backup V3 behavior if a persisted basket revision is introduced. **A00:** owner/policy/slot gate; **A50/A60:** runtime fixture and independent acceptance; **A10:** future internal package metadata only.

## 9. POLICY REQUIRED and STOP gates

| Policy/permission | Current status | Required owner decision |
|---|---|---|
| `POLICY-BASKET` stale `409` vs `412` | `POLICY_OPEN` | Sign one consistent wire contract; never silent overwrite |
| Compare token: coherent stage-vector vs dedicated basket revision | `POLICY_OPEN` | Decide minimal safe source; establish all writers and consistent GET snapshot |
| Old client missing precondition and rolling upgrade behavior | `POLICY_OPEN` | Fail closed with agreed 4xx+domain code; test old tab |
| Roster invalidation interaction | `POLICY_OPEN` | Define how concurrent roster changes invalidate basket save |
| Host dirty route semantics | `POLICY_OPEN` | Block navigation vs identity/auth-scoped volatile draft restoration; coordinate A100 |
| New backup password retention on file/context switch | `CONSULTATION_OPEN` | A100 privacy contract; no new security storage |
| Stage modal stale lifecycle semantics | `CONSULTATION_OPEN` | A80 expected status/response contract |
| New code lane / concurrent ownership | `BLOCKED` | A00 schedules after current three lanes; route/OpenAPI conflicts resolved |
| Runtime acceptance | `NOT_EXECUTED` | A50 isolated runner + A60 independently accepted on exact future SHA |

**GO:** R9 source review, fixture definition, report publication as **documentation**.  
**STOP:** editing application code, PR T055/T110 implementation, migration, merge, paid CI, staging/live deploy or SWARM-006 activation.  
**Owner next action:** A00 selects/sends the `POLICY-BASKET` decision and confirms per-file ownership before scheduling T055, while A100/A80 validate T110 boundaries.

## 10. §3 end-of-wave record for A00

- **AGENT / TASK / WAVE:** A110 / `WEB-005-T055-T110-A110-R2` / `R9`.
- **BASE / HEAD / PR:** release `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`; `main` `c50cc48e6fa508592bda3f4838111e9cff5af80c`; R9 docs branch inspected `01bf9e8e73678cb762d2b4c7b29467eb674a9ad4`; PR32 open at release SHA; PR39 open/draft `16053ee132756ca05b6f2cd1f0cabae823905387`; `NO PR — SOURCE-ONLY` for T055/T110.
- **ACTUAL CHANGES:** `NO APPLICATION CODE CHANGES`. R9 report and synthetic contract JSON created as documentation only; no test files modified.
- **TEST EVIDENCE:** `RUN=0`, `PASS=NOT_CLAIMED`, `FAIL=NOT_CLAIMED`, `NOT_EXECUTED` for RTL/browser/PG/CI; commands proposed §7 but not run; no executable environment/exit code.
- **FINDING DISPOSITION:** UX-047 source-confirmed CAS gap/policy-open; UX-042 late CSV callback gap/source-risk; UX-044 Host guard gap/source-risk; UX-045 preview/password risk, NEW tournament; UX-046 modal stale-state hypothesis; withdrawn two claims explicitly excluded.
- **DEPENDENCIES / FILE CONFLICTS:** A70/A100 `routes/tournaments.ts` writer collision; PR39 OpenAPI/generated parity; A20 migration only if DDL; A90 portable backup revision; A100 privacy and A80 stage lifecycle consultation open.
- **A50 / A60 HANDOFF:** §4 and §7 + JSON; expected one 200/one policy-selected 409/412, final winner graph, zero writes from loser, dirty drafts retained, delayed A→B callback ignored, new backup C, modal stale disabled. No runtime claims.
- **NEXT ACTION:** A00 signs Basket CAS behavior and revision source / clears future patch ownership gate.
- **MERGE / DEPLOY:** `NOT AUTHORIZED`.
- **SWARM-006:** `HOLD — internal WEB-005 only`.

**Agent A110 R9 signature:** `DESIGN COMPLETE — SOURCE_CONFIRMED CAS GAP — T110 TEST CONTRACTS READY — WITHDRAWALS PRESERVED — POLICY_OPEN — NO CODE CHANGES — NO RUNTIME PASS — GO DOCUMENTATION ONLY / STOP IMPLEMENTATION`.