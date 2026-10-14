# WEB-005_A20_R18_HANDOFF — Migration Ledger P05 / Isolated PG16 Gate

**TASK:** `WEB-005-T021-A20-R18` · **AGENT:** A20 — PostgreSQL Migration Reconciliation · **PARENT:** A00 / WEB-005 Implementation Lead · **WAVE:** R18.1, 2026-10-14 Europe/Warsaw · **MODE:** SOURCE ONLY / TEST SAFETY.

**FINAL:** `SOURCE_CONFIRMED / OFFLINE_RUNTIME_VERIFIED / P05_A60_SOURCE_ACCEPTED_OFFLINE_ONLY / PG16_NOT_EXECUTED / REVIEW_ONLY / SQL_STOP / RELEASE_NO_GO / SWARM006_HOLD`.

## 1. R18 instruction and exact PR SOURCE_HEAD

Central instructions: `docs/web-005/WEB-005_WAVE_R18_AGENT_PROMPTS.md`, Git blob `fd08cedcbd2db3222e4a444403180414d1666f6c`; read sections §0–§2 and AGENT A20. This report covers only A20; code lanes PR42/53/54 belong to other agents.

**P05 / PR38** https://github.com/C8LyNn/aplikacja-turnieje/pull/38
- Current verified HEAD `2d36864f4d2f1c838073f387fd3c8efb3378c43b`; previous R17 HEAD same (NO_CHANGE, no R18 code patch).
- Base `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` — release branch compare identical; PR38 OPEN DRAFT, NOT merged.
- GitHub file inventory 7 files, exclusively `lib/db/migration-ledger-validator/`, R18 7/7 Git blob matches:
  1. `README.md` — `d68102bf577b6e78216032efb0cd996097cf34d8`
  2. `manifest.proposal.json` — `28f493263a2cbfb919db1f99b220058175b46ba0`
  3. `source-snapshots.editor.json` — `d73453363928c31bd452c1fa30ac726613708e17`
  4. `synthetic-fixtures.json` — `55ba08be665b12158205473fabe16901d7926667`
  5. `synthetic-history.json` — `f7898bdec530e91ec5215f464e1461512c4233be`
  6. `validate.mjs` — `430e8be535489b0bb000ffbf5d8c6f8ee1fb5a8e`
  7. `validate.test.mjs` — `96c3d6b5d3f7ff9c10c154de0dc7c04374f61917`
- The 6 available local files also matched `git hash-object`; the seventh was checked via GitHub blob SHA.
- `manifest.proposal.json`: `PROPOSAL_ONLY_NOT_APPROVED`; canonical source chain 0027–0040; SHA256 of local manifest bytes `261efafcb8bebbc9c98631a99c9410e4e6e2751480bd7d6ba7e9c773661dc51b` is an observed digest, **not** owner-approved manifest pin. Four original release/editor collision SQL files fetched and checked R17; 14/14 source Git blobs and 9/9 editor snapshots verified prior R15 unchanged source chain, **not historical DB execution**.
- Original **0030** release `controlled_correction_operations` vs editor `steam_catalog_abstract_world`; original **0031** release `atomic_correction_receipts` vs editor `steam_catalog_pagination_indexes`. Proposed canonical editor numbering 0032/0033. Release 0031 contains `BEGIN/COMMIT`. No SQL runner or adopted authoritative receipt exists.

## 2. Actually executed R18 offline tests and logs

**Runtime available:** Node v22.16.0, Git v2.47.3. Actual local code subset: `/mnt/data/t021_work/lib/db/migration-ledger-validator/`; `pnpm`, `docker`, `psql`, `pwsh`, full app checkout, and A50 certified PG16 target **NOT AVAILABLE** in this execution environment.

Executed NOW in R18:

~~~bash
cd /mnt/data/t021_work/lib/db/migration-ledger-validator
node --test validate.test.mjs > /mnt/data/WEB-005_A20_R18_OFFLINE_TESTS.tap 2>&1
# exit 0, 37 tests PASS, 0 failures, 0 skipped, 4 suites

node /mnt/data/WEB-005_A20_R13_NEGATIVE_HARNESS.mjs > /mnt/data/WEB-005_A20_R18_NEGATIVE_TESTS.log 2>&1
# exit 0, 22/22 PASS; supplementary A20-authored synthetic harness, not shipped in PR38

node validate.mjs --manifest manifest.proposal.json --history synthetic-history.json > /mnt/data/WEB-005_A20_R18_CLI_STOP.json 2>/mnt/data/WEB-005_A20_R18_CLI_STDERR.log
# exit 2, expected STOP, ready_for_sql:false
# manifestPin.errors[0].code=MANIFEST_PIN_MISMATCH;
# sourceResult.errors[0].code=SOURCES_MISSING
~~~

**Interpretation:** PR38's Node validator suite and separately A20-authored negative harness are OFFLINE `RUNTIME_VERIFIED` only. They do not prove actual PG16, QP/QPE/OP parity, global roster LIFO, live migration history, real execution safety or application-release acceptance. CLI synthetic `history.decision=REVIEW_ONLY` does not override final `report.decision=STOP` if manifest pin/source inputs are missing. All code paths return `ready_for_sql:false`. No live DB connection/test was attempted.

Original PR38 GitHub Actions run `38569859562` remains **FAILURE at preceding Pack19 snapshot matcher** expecting `readOnly:true` vs code `accessMode:"read only"`, subsequent release gates skipped. Existing separate draft PR35 addresses matcher source. This CI history is neither full P05 PASS nor P05-specific functional FAIL. No paid/manual CI rerun.

## 3. Independent A60 and A50 R17 checks

[A60 R17 report](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_INDEPENDENT_QA.md), Git blob `ceb3591d61aed746e36bb86aa8a4c5cf16e5f30d`, and [A60 R17 matrix](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A60/WEB-005_A60_R17_PACKAGE_MATRIX.json), Git blob `cc6f24f582d216e99d8870d0e3519ff497fd8ad3`: P05 **SOURCE_ACCEPTED_OFFLINE_ONLY** on unchanged exact PR38 HEAD. No native PG16/application signoff; GitHub PR38 formal review list empty (not a contradiction with published A60 independent documentation).

[A50 R17 receipt](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A50/WEB-005_A50_R17_RECEIPT.md), blob `da3b9892a2675748263091c6193306c61995ce27`: no full trusted per-PR checkout, pnpm or physically approved PG16 test executor, **0 native application tests**. A20 did not claim ownership of A50 tasks or copy A20 offline results into A50's native app-test count. No current R18 independent A60 QA asserted.

## 4. PR41/PR42 dependencies (live R18 readback)

- **P08 PR41**, `f03cf3d09988a04ba9c2856e205d21f994ff67f1`, OPEN DRAFT: R17 A60 `SOURCE_ACCEPTED_CONDITIONAL` on QP/QPE/approved output `sourceBasketPosition` parity; full PostgreSQL B1 preclone/restore tests pending. Test file `artifacts/api-server/test/stage-basket-route-execution.integration.test.ts`. A20 **does not own PR41 implementation**; source acceptance is conditional, Backup B2 policy stays owner/A90.
- **P09 PR42**, `021bed269f9ea8ac8ce53caeea44263c098aa2dd`, OPEN DRAFT **NEW HEAD newer than A60 R17 reviewed `25b09f1a48a85ae882b817118f5d8c23bffbe383`**. Source `artifacts/api-server/src/application/players/tournament-roster.ts` blob `b47bc6e1452173fbc65b236909efe01aebf76116` now contains a `latestUndoable` recheck in `undoTournamentRosterAction`; `test/revert-match.integration.test.ts` blob `3479ab5fe888416858346f82691d4c57f369df25` contains authored queued X/Y and `pg_blocking_pids` tests for `delete_player`, `restore_player`. Do NOT carry the old R17 block or an acceptance verdict automatically. **NEEDS_NEW_A60_EXACT_SHA_SOURCE_VERDICT + PG16 RUNTIME**, not A20 code GO.
- Both PRs share release base but are independent; do not combine with PR48/PR51 or integrate in WEB-005. PR42 new HEAD does NOT imply successful runtime. Test definitions are NOT run.

## 5. Published R18 PG16 authorization gate and exact A50 tests

**[WEB-005_A20_R18_PG16_GATE.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/a0395016f1b034c9b3711e19d558ee93eba5b53e/docs/web-005/agent-reports/A20/WEB-005_A20_R18_PG16_GATE.md)** — committed `a0395016f1b034c9b3711e19d558ee93eba5b53e` on central control-docs branch (own A20 docs only).

Contains precise owner-signed identity requirements, dedicated physical PG16 and one-way stage permissions (read-only catalog preflight before separate test-schema reset), nonprivileged observer, `TEST_DATABASE_URL` no `DATABASE_URL` fallback, strict `tm_test_*`, exact existing catalog SELECT-only source and future copyable PowerShell/psql commands, plus source SHA/fixture gate for PR41 and PR42 and negative outcomes. The R15 catalog SQL file remains unchanged and **has not been executed**. The release `resetTestSchema()` executes `DROP SCHEMA ... CASCADE` and builds only 0001–0028, so it is NEVER a safe preflight or proof of F2 0029–0031; opt-in catalog/deployment tests capable of dropping `public` are explicitly excluded.

**Owner certificate NOT supplied**: host/container identity, database name, role, immutable image digest, physical isolation, schema ownership and written authorized scope are all missing. A50 cannot execute PG16 tests until A00/owner provisions dedicated target and grants explicit separate permission for later fixture reset. The blocker is **ENVIRONMENT_BLOCKED / NOT_EXECUTED**, NOT test failure.

**Owner decision requested:** provide trusted A50 full repo per-SHA checkout + Node22/pnpm10, and independent disposable PG16 with out-of-band signed `CATALOG_READ_ONLY` permission/identity evidence. Only after successful read-only catalog and separate explicit schema reset GO may A50 execute target integration tests. An owner/HQ final handoff with runtime-test debt remains A00's special explicit approval; A20 does not choose it or contact SWARM-006.

## 6. R18 files, GO/STOP and A00 next action

**Changes committed by A20 only in own docs:**
- `docs/web-005/agent-reports/A20/WEB-005_A20_R18_PG16_GATE.md` commit `a0395016f1b034c9b3711e19d558ee93eba5b53e`.
- `docs/web-005/agent-reports/A20/WEB-005_A20_R18_HANDOFF.md` (this document).
**Unchanged:** PR38 HEAD and all 7 validator files; migration SQL/source schemas, runner, release/main, unrelated PRs.

| Gate | Evidence | Decision |
|---|---|---|
| PR38 HEAD/7 Git blobs | Exact HEAD verified, 7/7 Git blobs | SOURCE_CONFIRMED |
| Offline Node tests | R18 37/37 (exit 0) + 22/22 A20 supplemental (exit 0) | RUNTIME_VERIFIED_OFFLINE |
| CLI negative unapproved manifest | exit 2, `STOP`, `ready_for_sql:false` | PASS (fail-closed) |
| A60 independent exact PR38 SHA | Published R17 scoped QA | SOURCE_ACCEPTED_OFFLINE_ONLY |
| PR42 new HEAD A60 | R17 verdict on **old** SHA | QA_PENDING_NEW_HEAD |
| PostgreSQL16 actual catalog/API tests | No owner-approved physical target | NOT_EXECUTED / ENVIRONMENT_BLOCKED |
| Original 0030/0031 adopted ledger, canonical runtime runner | No approved manifest/PG provenance | STOP |
| Production DDL/SQL, schema reset, merge/deploy | Not authorized | HARD STOP |
| WEB-005 final handoff / SWARM-006 | Formal HQ/A00 decision not issued | HOLD / RELEASE_NO_GO |

**NEXT:** A00 requests a **named, certified, disposable physical PostgreSQL16 host plus trusted A50 full checkout**, with a signed read-only catalog scope first. A60 independently reviews new PR42 exact HEAD and inspects future actual A50 test receipts. Keep P05 internal `REVIEW_ONLY` until explicit owner policy on historical ledger and separate migration runner. R18 A20 did not activate SWARM-006 and did not merge.

**FINAL:** `WEB-005-T021-A20-R18 — PUBLISHED_DOCS / SOURCE_CONFIRMED / OFFLINE_59_PASS / PG16_NOT_EXECUTED / A60_P05_OFFLINE_ONLY / PR42_NEW_HEAD_QA_PENDING / REVIEW_ONLY / SQL_STOP / RELEASE_NO_GO`.
