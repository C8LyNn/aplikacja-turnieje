# WEB-005 — A110 — R11 HANDOFF TO A00

**AGENT:** A110 — Basket Concurrency & Frontend State  
**TASK/WAVE:** `WEB-005-T055-T110-A110-R4` / R11 (2026-10-14 Europe/Warsaw)  
**AUTHORITY:** SOURCE-ONLY / QA SUPPORT / DOCS; **NO CODE WRITES, NO NEW PR**  
**CURRENT PROJECT:** WEB005_IN_PROGRESS; release NO-GO; SWARM-006 HOLD.

## 1. Pinned GitHub state

- `release/tournament-ops-20261013-01`: `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` (unchanged at inspection).
- `main`: `c50cc48e6fa508592bda3f4838111e9cff5af80c`; PR32 remains open/unmerged.
- P10 [PR43](https://github.com/C8LyNn/aplikacja-turnieje/pull/43): `OPEN DRAFT`, base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`, HEAD `96a6068f69027574ac76e18d4d5a2c444b5a914a`, 3 commits ahead/0 behind, **exactly 3 files**. No change to PR43 in R11.
- PR43 changed files:
  - `artifacts/tournament-manager/src/hooks/use-tournament-csv-file-reader.test.tsx`;
  - `artifacts/tournament-manager/src/hooks/use-tournament-csv-file-reader.ts`;
  - `artifacts/tournament-manager/src/pages/tournament-detail.tsx`.
- No GitHub submitted reviews or discussion comments for PR43 seen during this inspection; does not exclude an offline A60 report.

## 2. Deliverables written in documentation branch

1. [Required T055 policy + T110 UX queue](./WEB-005_A110_R11_T055_POLICY_AND_UX_QUEUE.md): independent SOURCE_CONFIRMED review, explicit withdrawals, future patch split, test-first handoff, CI incident.
2. [1-page POLICY-BASKET decision sheet](./WEB-005_A110_R11_POLICY_BASKET_OWNER_DECISION_1P.md): D1–D6 owner/HQ selection and signature required before T055 coding.
3. [20-case test matrix](./WEB-005_A110_R11_TEST_FIXTURES.json): 5 existing P10 tests, 5 new real-page/browser P10 acceptance requirements, remaining UX cases and future basket CAS PG fixtures; all marked execution=false.
4. This individual handoff.

**ACTUAL CHANGES:** docs/fixture only under `docs/web-005/`; **zero edits to application sources, existing PR43, main/release, SQL, test runner or generated clients**. R11 A110 code lane not allocated.

## 3. Test evidence (strict provenance)

- `SOURCE_CONFIRMED`: PR43 stale CSV callback guards and five test definitions exist on exact HEAD. Existing tests are a React **hook Harness**, not true TournamentDetail/HTTP mutation checks.
- `NOT_EXECUTED` by A110 R11: targeted RTL, full frontend suite, typecheck, real Wouter route/browser E2E, PostgreSQL/HTTP mutation, independent QA. **No locally executed commands, therefore no local test exit codes or PASS.**
- **External CI on exact PR43 HEAD:** [run 38590842415](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38590842415), `correction-qa` job `115944973929`, actual status `failure`, **exit 1**: Pack19 `qa/pack19/source-contract.test.mjs` regex assertion failed (`repeatable read` + `readOnly:true`), TAP 7 passed / 1 failed. `SE safety unit tests` passed; subsequent CI stages skipped. **No FE CSV tests in that run**. This unrelated gate failure cannot be used as an FE CSV failure or CI PASS. A40/A50 to triage Pack19, A110 does not own that implementation.
- `SOURCE_ACCEPTED` by A60: **NOT ESTABLISHED**. `RUNTIME_VERIFIED` for PR43: **NO**.

## 4. Finding disposition and remaining queue

- `UX-047 / T055`: missing atomic full PUT CAS is `SOURCE_CONFIRMED`; `POLICY_BASKET=D1–D6 PENDING`, **NO CODE**. Two V0 editors fixture, fail-closed missing precondition, graph/token consistency and loser draft retention defined.
- `UX-042 / T110 P10`: `PATCH_PROPOSED` PR43 `OPEN DRAFT`; after-abort hook guards and five RTL definitions present; real-route and no A→B write tests pending.
- `UX-044 Host`: `SOURCE_CONFIRMED` gap between guard and reason-only/SPA Back/Forward; user choice block vs scoped in-memory retain + A100 privacy policy required; runtime effects hypothetical.
- `UX-045 backup`: `SOURCE_CONFIRMED` absent FileReader identity/epoch checks in **two preview components**, and unreset password fields; **small future frontend preview guard** possible without product redesign, new password policy needs A100. Backup import creates **NEW C**, not overwrite B.
- `UX-046 stage modal`: `SOURCE_CONFIRMED` no open-time stage `version/status/tournamentId` snapshot; **small future modal invalidation patch** possible with A80 lifecycle review, not backend policy rewrite. Illegal backend write NOT PROVEN.
- **WITHDRAWN retained:** normal StageBasketsPanel A→B advanced-draft transfer not proven; backup overwrite of existing B is false for current import route. No reopening without new evidence.

## 5. A50/A60 exact handoff

Checkout [PR43](https://github.com/C8LyNn/aplikacja-turnieje/pull/43) by **immutable SHA**, not moving branch name:

```bash
git checkout --detach 96a6068f69027574ac76e18d4d5a2c444b5a914a
git rev-parse HEAD
node --version
pnpm --version
pnpm --filter @workspace/tournament-manager run typecheck
pnpm --filter @workspace/tournament-manager exec node --import tsx --import ./test/setup-dom.mjs --test ./src/hooks/use-tournament-csv-file-reader.test.tsx
pnpm --filter @workspace/tournament-manager run test
```

Required new real-page/route/browser fixture: same component tree from tournament A→B, A file still pending, deliver stale A `onload/onerror`, select or manually enter B CSV, and attempt B import. **Expected:** no A data/error/replace confirmation in B, **no POST to B with A CSV**, draft B remains owned by B. The existing synthetic Harness tests do not establish the request-level invariant. Log exact exit codes, framework versions, TAP counts, test skip counts, source SHA and environment.

## 6. Dependencies, authority and next step

- **A00/HQ:** sign [POLICY-BASKET D1–D6](./WEB-005_A110_R11_POLICY_BASKET_OWNER_DECISION_1P.md), release future implementation slot for T055 and decide UX backlog order. Owner choice not assumed.
- **A50:** execute real PR43 RTL/frontend+browser tests on exact SHA; independently triage unrelated Pack19 CI failure.
- **A60:** independent acceptance of actual P10 code/test evidence, with distinction `PATCH_PROPOSED` vs `SOURCE_ACCEPTED` vs `RUNTIME_VERIFIED`.
- **A100:** private draft/password cleanup and Host navigation scope; **A80:** lifecycle modal/version contract; **A20/A90:** scalar revision migration/Backup V3 only if selected by D1; **A10:** internal P10 manifest buffer only.
- **OWNERSHIP/LOCK:** `tournament-detail.tsx` A110 SOURCE-ONLY R11; PR43 frozen; A120 has code lane 3, A90 lane1, A100 lane2. **No fourth code lane.**

**NEXT ACTION:** A00 routes PR43 exact SHA to A50/A60 and circulates D1–D6 for HQ/owner signature.

**GO/STOP:** `GO docs and source-only`; `STOP source-code, basket CAS patch, PR43 edits, merge, SQL, staging/live, SWARM-006`.

**A110 signature:** `R11 SOURCE-ONLY COMPLETE / POLICY-BASKET OPEN / P10 QA PENDING / RUNTIME NOT_EXECUTED / RELEASE NO-GO`.
