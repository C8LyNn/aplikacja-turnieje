# SWARM-006 Final Test Completion Plan

> Execute inline using superpowers:executing-plans. Independent acceptance belongs to A60.

**Goal:** Execute all available safe local test groups, fix demonstrated defects, preserve immutable prior evidence, and hand off exact-source results to A60 via draft PR and issue #150.

**Architecture:** Separate disposable checkout based on G1 `6eb7bd6ac31a8851d08c3f50c7fed74d6b2c57f3`; copy already installed dependencies without installation or access to pnpm store. Keep raw new logs, command receipts and SHA-256 manifests in a new evidence directory. Carry reusable evidence with source provenance.

**Tech:** Node 24.18.0, existing tsx/TypeScript/React/jsdom, node:test; no package acquisition.

**Spec:** User's 2026-10-29 FINAL TEST COMPLETION instruction and Issue #150 decisions 6367582998, 6369681108, 6397849194, 6398026292.

## Constraints

- Preserve G1, original evidence, G2 Install and Build roots and pnpm source store.
- No G2 Install or Build invocation, DB/SQL/migration, staging, Neon/Replit, production server, deployment, Actions, protected merge.
- Reuse accepted G1 React 11/11, declarations and frontend typecheck until a relevant source change invalidates them.
- Missing dependencies, real DB or additional authority => BLOCKED; Build without receipt => PENDING.
- Publish only via a source path with inspected workflow triggers and commit `[skip ci]`; if prevention cannot be established, retain local branch/patch and report BLOCKED.

## Review focus

- Discovery must not silently omit frontend .tsx files or include DB integration tests in safe groups.
- Typecheck failures must remain visible; no casts/waivers merely to turn results green.
- API contract tests exercise pure/injected routes only; no persistence claims.
- Raw failures, cancellations and skips remain in evidence even after repair.
- Report source commit, dirty patch hash when applicable, command, runtime, exit, counts and log hashes per run.

## Tasks

- [x] Read latest A00/A50/A60 decisions and inspect local artifacts/remote refs.
- [x] Create isolated branch from G1; native worktree unavailable for non-workspace source, shallow/promisor clone unavailable; copied local Git metadata and working files without changing source.
- [ ] Inventory installed dependencies, all test groups and reusable evidence. Inspect imports/side effects before execution.
- [ ] Execute missing API units/contracts, frontend files excluding accepted audience test, pure native/static/regression tests and API typecheck. Save every run including failure.
- [ ] For each demonstrated defect, reproduce first, apply minimal fix and add meaningful regression; rerun affected scope only.
- [ ] Review diff, verify source/evidence immutability and hashes, prepare A60 report with BLOCKED/PENDING groups.
- [ ] Create draft PR by safe API path and post one substantive issue #150 summary; no merge or gate promotion.
