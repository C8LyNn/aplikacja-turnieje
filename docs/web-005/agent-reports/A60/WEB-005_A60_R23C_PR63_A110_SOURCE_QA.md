# WEB-005 — R23C / A60 — PR63 Basket CAS Independent Source QA

**Task:** WEB-005-T130-A60-R23C-INTEGRATION-QA · **Verdict: BLOCKED FOR ENABLEMENT** because of a source-confirmed P2 auth-revocation privacy-state defect. The current isolated feature is DISABLED/UNMOUNTED. **RELEASE_NO_GO / SWARM006_HOLD**.

[PR63](https://github.com/C8LyNn/aplikacja-turnieje/pull/63) OPEN/DRAFT/unmerged, verified exact HEAD **3ddcfea2ba47f4314fced3022d00922f8cedb0e3**, base release **1fdc401d87c6bffe6bf7312dfc9db681b689dcf7**. Six NEW frontend files only:
- artifacts/tournament-manager/src/lib/stage-basket-cas-client.ts Git blob **4fca09e22ef58fc38a2ca34a8386a6fadad06ae8** and stage-basket-cas-client.test.ts blob **1d1473901d68db148a100079c96f3ca2c5e80adb** (10 authored tests).
- artifacts/tournament-manager/src/lib/stage-basket-cas-draft.ts Git blob **1bfb8deeb06fc8f501176e8757810f7f8936202e** and stage-basket-cas-draft.test.ts blob **c81b3d76dc6d68d284c4aadd6ac6d14ac7f07612** (13 authored tests).
- artifacts/tournament-manager/src/components/basket-cas-conflict-review.tsx and basket-cas-conflict-review.test.tsx blob **4920d1bb4ac5d67a76241391c07cb373d3343eab** (5 authored tests).
**28 authored tests, 0 independently executed native tests.** Existing organizer screen StageBasketsPanel unchanged and does NOT import CAS new files.

## Source-positive properties

Feature gates require both featureEnabled===true and serverCasVerified===true; default false. Client accepts only strong server ETag header and sends verbatim If-Match on manual PUT. Missing/weak/invalid ETag fails closed; 412/428 never auto retry, client snapshots use a WeakSet bound to client and tournament/auth epoch. The draft session preserves local edits through 412 and in-flight updates, requires separate explicit remote comparison and manually confirmed reconciliation, clears on tenant/auth epoch switch, and does not persist drafts into shared localStorage. UI is unmounted and never initiates HTTP PUT. These match the intent of owner D2–D6 only within future feature-gated frontend; no backend D1/D5 or ETag HTTP proof.

## New independently discovered P2 — permission-revoked GET retains organizer draft

[Draft source lines 184–195](https://github.com/C8LyNn/aplikacja-turnieje/blob/3ddcfea2ba47f4314fced3022d00922f8cedb0e3/artifacts/tournament-manager/src/lib/stage-basket-cas-draft.ts#L184-L195): refreshRemote() awaits client.load(scope) **without a 401/403 catch**, so an HTTP 401 or 403 error exits with existing local draft and base ETag retained. [Client source load()](https://github.com/C8LyNn/aplikacja-turnieje/blob/3ddcfea2ba47f4314fced3022d00922f8cedb0e3/artifacts/tournament-manager/src/lib/stage-basket-cas-client.ts#L182-L203) throws BasketCasError HTTP_FAILURE carrying the response status, but the session only calls clear(scope) in the catch of **save()** [draft lines 253–260](https://github.com/C8LyNn/aplikacja-turnieje/blob/3ddcfea2ba47f4314fced3022d00922f8cedb0e3/artifacts/tournament-manager/src/lib/stage-basket-cas-draft.ts#L253-L260). The existing authored CAS-DRAFT-10 confirms **PUT 403** clears but no test covers **refreshRemote GET 401/403**. This contradicts the PR's stated permission-revocation data-clearing guarantee if the new UI is activated; it is a **latent privacy/privilege lifecycle gap, not a current production exploit** because the component is disabled and unmounted.

**A110 corrective action:** add fail-first separate 401 and 403 GET tests after an initialized, edited session; assert draft, canonical ETag and remote state are cleared on either revocation (including during refresh race), while preserving ordinary non-auth network error draft retention. Then implement a bounded catch/clear in refreshRemote and rerun independent QA on NEW HEAD. Current activation must remain DISABLED until fixed, backend CAS D1–D5 is independently verified and owner explicitly approves cutover. Consider whether a failed remote GET after separate account revocation must be handled via the outer auth epoch switch as defense in depth.

## Actual tests and gates

- PR author tests: 10 client + 13 draft + 5 UI = **28 AUTHORED**. **NOT_EXECUTED** on exact source in a full frontend checkout; no TAP and no numeric exit.
- Current [GitHub Actions 38737278121](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38737278121) overall FAILURE at **inherited Pack19** from release base, BEFORE any standalone CAS suite. Cannot label CAS tests FAIL or PASS.
- A50 R23C Windows runner PREPARED, **0 native A50 app executions**. No browser/UI integration, HTTP server 412/428 D1–D5, PostgreSQL/lock-stage/roster tests or frontline React tests executed/verified. No A60 synthetic tests were executed for this PR; diagnosis is source-trace based.

**Defects:** P0 0; P1 0 demonstrated active; **P2-63-01** confirmed latent 401/403 GET revocation state retention. Dependencies: server D1 persistent revision, D2 ETag/If-Match, D3 412, D4 428, D5 in-transaction drift lock validation, D6 manual preservation. PR55 contains fail-first server tests but is not the server implementation.

**Verdict: BLOCKED for CAS readiness/enablement**, notwithstanding source-positive disconnected client modules. **RELEASE_NO_GO / SWARM006_HOLD**, no merge, deploy, server activation, SQL or code changes by A60.
