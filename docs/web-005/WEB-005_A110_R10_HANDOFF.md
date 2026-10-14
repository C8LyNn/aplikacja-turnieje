# WEB-005 — A110 — R10 HANDOFF

**Project:** WEB-005  
**Agent:** A110 — Basket Concurrency & Frontend State  
**Task:** `WEB-005-T110-A110-UX042-R3`  
**Wave:** R10 / 2026-10-14 (Europe/Warsaw)  
**Authorization:** GO SOURCE-CODE ONLY, lane L3 — T110/UX-042 only  
**Local coordinator:** A00; independent QA A60; execution support A50  
**Final outcome:** `PATCH_PROPOSED / SOURCE_IMPLEMENTED / RUNTIME_NOT_EXECUTED / QA_PENDING / RELEASE_NO_GO`

## 1. Exact git inventory

| Object | Ref / SHA / status |
|---|---|
| Repository | `C8LyNn/aplikacja-turnieje` |
| Base | `release/tournament-ops-20261013-01` @ `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` |
| Implementation branch | `fix/web-005/t110-ux042-file-reader-r10` |
| Implementation HEAD | `96a6068f69027574ac76e18d4d5a2c444b5a914a` |
| Draft PR | [#43](https://github.com/C8LyNn/aplikacja-turnieje/pull/43) — OPEN DRAFT, NOT MERGED |
| Compared | GitHub compare `release...fix/web-005/t110-ux042-file-reader-r10`: `ahead=3`, `behind=0`, 3 changed files |
| Mergeability | GitHub PR43 `mergeable=true` at verification; **not permission to merge** |
| Documentation requirements | R10.1 `docs/web-005/WEB-005_WAVE_R10_AGENT_PROMPTS.md`, A110 only |

### Patch commits (on branch, chronological)

1. `0ee3053c9cc2fa5272ec14a460b13901a4ea3a82` — added RTL test contract first.
2. `5ec4bb1dfbb0a8695c3e096ec0162fc3afe515db` — added guarded CSV FileReader hook.
3. `96a6068f69027574ac76e18d4d5a2c444b5a914a` — integrated into TournamentDetail.

### Actual changed files

- `artifacts/tournament-manager/src/hooks/use-tournament-csv-file-reader.test.tsx` — **added**, 161 lines, deferred FileReader mock and five RTL test cases.
- `artifacts/tournament-manager/src/hooks/use-tournament-csv-file-reader.ts` — **added**, 61 lines, identity + generation + active-instance guard, read cancellation.
- `artifacts/tournament-manager/src/pages/tournament-detail.tsx` — **modified**, +30/-9 lines, scoped hook integration, state reset, file read failure UI.

**No changes:** basket configuration, `T055`, Host, Backup V3, stage modal, backend, `routes/tournaments.ts`, `revert-match.ts`, OpenAPI, generated types, DB schema, SQL, lockfiles, release/main.

## 2. Finding and fix provenance

**UX-042:** `SOURCE_CONFIRMED` at base SHA: CSV `reader.onload` unconditionally called `setCsvText`, `setCsvResult(null)`, and `setCsvConfirmReplace(false)`, even after a selection/scope change. The `FileReader` callback was not bound to a tournament ID or epoch; the component maintains its CSV state independent of URL. Same-component route A→B effect is `HYPOTHESIS`, **not proven runtime**.

**Now `PATCH_PROPOSED`:**
1. `useTournamentCsvFileReader(id, ...)` tracks the exact owner ID, monotonically increasing generation and active FileReader instance.
2. A completion/error callback is acted upon only if all three still match. Abort is paired with callback invalidation, since a callback might execute after cancellation.
3. On `id` change, all CSV import local state is reset: open panel, text, mode, replace confirmation, result and new read-error field.
4. Selecting another file, typing manually, closing the panel or unmounting invalidates and aborts the previous read. A late A failure cannot show an error in B.
5. Existing CSV parsing, API endpoint, mutation semantics, routing and permissions are untouched.

**The new protected FileReader callback does not itself mutate any tournament DB.** The integration is designed to prevent A content from entering B's form, but no browser/API replay has yet established a runtime zero-write result.

## 3. Test-first acceptance fixtures (added code, not executed)

| ID | Layer | Input | Expected |
|---|---|---|---|
| `FE-CSV-01` | React RTL same-component rerender | A CSV loaded and replace confirmation armed, rerender ID B | B text empty and confirmation idle; no A CSV carried to B |
| `FE-CSV-02` | React RTL + controllable FileReader | A read pending, ID changes A→B, deliver stale `onload` and `onerror` | Stale read aborted; B text/error/preview unchanged |
| `FE-CSV-03` | React RTL + controlled reader interleaving | A pending, B old/new selection, older callbacks, manual input | Only latest B selection or typed B input survives |
| `FE-CSV-04` | React RTL | Close CSV while reader pending; late callbacks; then unmount | No stale state resurrection or error |
| `FE-CSV-ERR-05` | React RTL | Current file fails, then another current file loads successfully | Current error visible then cleared on successful new selection |

**Note:** Test harness `Harness` binds `useTournamentCsvFileReader` to a deliberately reused React component; it does **not** mount the entire `TournamentDetail` page, issue real CSV imports or execute Wouter route navigation. A50/A60 should additionally perform real page/route integration/browser checks to establish end-to-end parity. No full browser claim is made.

## 4. Execution evidence and limitations

| Check | Result | Evidence |
|---|---|---|
| Source inspection on exact base SHA | `SOURCE_CONFIRMED` | GitHub fetch files; original unguarded `onload` lines 518–529 |
| GitHub scoped diff | `STATIC_VERIFIED` | 3 expected files only, 3 commits; no T055/other scope |
| Hook guard mechanical review | `STATIC_VERIFIED` | ID, epoch and reader identity checked on callbacks; ID cleanup+abort |
| RTL five test cases | `NOT_EXECUTED` | Test code committed, no installed workspace dependencies |
| Frontend typecheck | `NOT_EXECUTED` | Not run against checkout |
| Full frontend test suite | `NOT_EXECUTED` | Not run against checkout |
| Real Wouter/Browser A→B test | `NOT_EXECUTED` | Full-page navigation fixture not yet executed |
| PostgreSQL or API mutation regression | `NOT_EXECUTED` | No authorized isolated database; UX042 patch is frontend-only |
| Independent A60 acceptance | `PENDING` | No independent verdict collected |
| Runtime PASS / exit code | **None** / `NOT_APPLICABLE` | No test command executed |

**Local environment limitation:** Node.js and git tools exist in the scratch container, but there is no mounted application checkout, installed pnpm workspace or dependencies; unauthenticated `git ls-remote` from the container failed because `github.com` could not be resolved. We did **not** invoke paid GitHub Actions, Replit, production or a shared database. Static review is **not** a frontend test PASS.

## 5. Exact handoff to A50/A60

Verify the commit SHA before all commands. On an **approved isolated checkout** of PR43 HEAD:

```bash
git checkout --detach 96a6068f69027574ac76e18d4d5a2c444b5a914a
git rev-parse HEAD
node --version
pnpm --version

pnpm --filter @workspace/tournament-manager run typecheck
pnpm --filter @workspace/tournament-manager exec node \
  --import tsx --import ./test/setup-dom.mjs \
  --test ./src/hooks/use-tournament-csv-file-reader.test.tsx
pnpm --filter @workspace/tournament-manager run test
```

Record exact commands, Node/pnpm versions, exit codes, TAP counts, HEAD and environment. **Stop and flag FAIL** if any test or typecheck fails. Browser follow-up must rerender **the real TournamentDetail route** from A to B without unmount, defer an A FileReader event, and verify no A CSV/confirmation or error in B; test A close and B newer file/manual input. Negative assertion: no `POST /api/tournaments/B/players/import` uses A CSV without explicit new B action.

### Independent QA questions for A60

- Does R10 test truly cover callback-after-abort, or only unmount?
- Does initial/changed `id` reset correctly avoid carrying A confirmation to B?
- Is there an unprotected second CSV event path (without expanding scope to Backup)?
- Are `reader.onerror` and current scoped error handling correct?
- Is any changed line outside UX042? Compare only 3 files with base.
- Are browser-specific effects still `NOT_EXECUTED`, rather than incorrectly reported as fixed and tested?

**A50:** rerun targeted RTL, typecheck and full frontend test in isolation; deliver exit code log.  
**A60:** independently review PR43 exact HEAD; do not self-certify author-defined test cases.  
**A00:** register PR43 as **new internal candidate P10+ only if coordinator approves classification**; do not hand it to SWARM-006.

## 6. Remaining backlog and policy open

| Finding | Disposition in R10 | Follow-up |
|---|---|---|
| T055 / UX-047 baskets concurrent PUT | `POLICY_OPEN / NO CODE` | Owner/HQ must sign 409 vs 412 and token shape; dedicated independent later PR |
| T110 / UX-044 Host Back/Forward draft | `NOT_IMPLEMENTED` | Later separately authorized frontend patch |
| T110 / UX-045 Backup preview and NEW credentials | `NOT_IMPLEMENTED` | Import creates a **new** tournament, does not overwrite existing B; A100 privacy review |
| T110 / UX-046 stale stage modal | `NOT_IMPLEMENTED` | A80 lifecycle/status contract and future isolated UI patch |
| StageBasketsPanel A→B ordinary navigation draft transfer | `WITHDRAWN / NOT_PROVEN` | Do not reopen without new evidence |
| Backup overwrites an existing B | `WITHDRAWN` | Do not describe import semantics as destructive overwrite |

**File/ownership conflicts:** PR43 touches only frontend `tournament-detail.tsx` and new CSV hook/tests. R10 routes/backend locks belong to A100/A80, A70 review only; this patch does not edit their files. Any later broader T110 scope requires a newly free code slot and explicit A00 GO.

## 7. GO / STOP / next action

**GO delivered:** isolated source patch, test-first definitions, draft [PR43](https://github.com/C8LyNn/aplikacja-turnieje/pull/43), scoped static diff and this handoff.  
**STOP:** no fourth patch scope, no Basket CAS or Host/Backup/Stage changes, no merge, cherry-pick, DB migration, staging/live or SWARM-006.  
**Source result:** `PATCH_PROPOSED`, independent runtime and QA `PENDING`.  
**Release result:** `NO-GO`.

**One next step:** A50 executes targeted RTL/typecheck on PR43 SHA `96a6068f69027574ac76e18d4d5a2c444b5a914a` in an approved isolated checkout; A60 independently reviews resulting evidence.

---

**End-of-wave §3 record:** A110 / T110 UX042 R3 / R10; BASE `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`; HEAD `96a6068f69027574ac76e18d4d5a2c444b5a914a`; PR #43 OPEN DRAFT; three scoped frontend files; source-only author verification; tests NOT_EXECUTED, no exit code; independent QA pending; POLICY-BASKET OPEN; merge/deploy NOT AUTHORIZED; SWARM-006 HOLD.
