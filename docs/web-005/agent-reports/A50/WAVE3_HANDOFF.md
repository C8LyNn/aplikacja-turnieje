# WEB-005 — A50 / WAVE3_HANDOFF

**ROLE:** A50 — Backend/API, C01 first genuine integration failure.  
**TASK:** Development First WAVE 3: continue Draft PR #105; classify first API integration failure **only with observed evidence**.  
**STATUS:** `BLOCKED` (API root cause); `DONE` (read-only three-run triage + safe DB-free repeat).  
**BASE SHA:** `fa3261b2c9510e110ac9eba21726812d3401a525` (immutable C01 PR #60).  
**START HEAD SHA:** `30314baba473054ebe1475d030df7afb81a0474b` (Draft PR #105).  
**HEAD SHA:** this report's GitHub commit on `fix/web005-c01-api-first-failure-evidence`; use PR #105 exact head after publishing.  
**CHANGED PATHS:** only this `docs/web-005/agent-reports/A50/WAVE3_HANDOFF.md`. **NO CODE CHANGES in WAVE 3**.  
**PR/LINK:** [Draft PR #105](https://github.com/C8LyNn/aplikacja-turnieje/pull/105); [original CI](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/38736073793); separate PG16 [PR #89](https://github.com/C8LyNn/aplikacja-turnieje/pull/89) not touched.

## Verified C01 root-cause evidence

Source exact C01: original CI job `116425579970`, API integration `exit 1; signal none`, **0 visible `not ok`** and no retrievable full TAP artifact; retrieved job log 423,864 characters / 6,437 lines, error banner at line 5,177 following visibly incomplete prior TAP output. The last visible TAP result is **`ok 12 - accepts BO5 2:3`**; this is a passing test, NOT proof that test #13 is failing.

Two **different-SHA supporting observations** also show the same incomplete diagnostic symptom, **not proof of the same software defect**:
- Later C02 CI job `117669533771`: integration exit 1; no visible `not ok`; 420,884 log chars / 6,342 lines; failure banner line 5,083.
- Later A90 CI job `117669487576`: integration exit 1; no visible `not ok`; 422,537 log chars / 6,390 lines; banner line 5,130.

**CLASSIFICATION:** `APPLICATION_UNKNOWN / FIXTURE_UNKNOWN / ENVIRONMENT_UNKNOWN`. A PostgreSQL ERROR in a negative fixture or a passing TAP subtest is not an identified failed assertion. No sourced minimal application code fix can yet be justified. Do NOT claim `C01_API_ROOT_CAUSE_CONFIRMED`.

## TEST COMMANDS + RESULTS (new WAVE 3 run)

**Command:** `node --check failure-evidence.mjs && node --check failure-evidence.test.mjs && node --test --test-reporter=tap failure-evidence.test.mjs`, in disposable `/mnt/data/c01_api_recovery_qa`.  
**Node:** `v22.16.0` (not pinned owner v22.23.3).  
**Result:** **16/16 PASS, 0 FAIL, 0 SKIP, 0 CANCELLED, 0 TODO; process exit 0**, stdout TAP 2,674 B, SHA256 `1140ae4db8ee3b4743f1e7ede12d1a969eec7c6ca969290dcf3fb1b2ea958a51`; stderr 0 bytes.  
**Exact tested published blobs:** helper `e8a6310305d78fe0c3dad857b9760a80388b6c09`, test `3ea61402b55cad03fa284bfbf39313c23dca4bb7` (both independently checked with `git hash-object`). No new changes to source files.

**NOT EXECUTED:** original API integration, PostgreSQL, Docker, migrations, destructive SQL, production CI or build, deployment, merge. No root-cause classification test was possible with the available authentic logs.

## CONFLICTS / boundaries

PR #105 paths `qa/pack17/*` and this A50 report do not overlap active A40 PR #101 or A140 PR #116. No edits on their branches. The Variant B source-only PR #89 remains an independently blocked PG16 line; do not infer signed G4 approval.

## NEXT OWNER

- **A00 + A20 + operator:** provide already captured *authentic full* C01 private TAP or separately authorize fresh isolated PG16 G0–G4 with demonstrated destructive-fixture safety. No execution permission granted here.
- **A50:** only after an actual first failed TAP/case+assertion (source SHA, exit, environment) is verified, classify application vs fixture vs environment and prepare minimal separate Draft PR.
- **A60:** independent exact-SHA review of PR #105 diagnostics; no PG PASS.
- **A10/A40:** record current diagnostic SHA; C02 remains HOLD.

**GATES:** `WAVE3_HANDOFF / C01_API_ROOT_CAUSE_BLOCKED_MISSING_FIRST_FAILING_TAP / DBFREE_16_16_PASS / PG16_EXECUTION_HOLD / C01_INTEGRATION_HOLD / C02_HOLD / RELEASE_NO_GO`.
