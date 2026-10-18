# WEB-005 / A140 — DEVELOPMENT_FIRST_HANDOFF

**Date:** 2026-10-18  
**Mode:** DEVELOPMENT_FIRST / SOURCE_ONLY / DRAFT / NO_DEPLOY  
**Responsible:** A140 Replit & Live Synchronization  
**Recipients:** A10, A40, A60; preserve the A20/A22 and A30 decisions from Issues #72/#75.

## Priority and pinned evidence

- Issue #72: Replit/GitHub drift reported as **140 distinct paths** between *historic* Replit checkpoint `cb55335ea8e789d5e0f7912955da7d679d7dbb5f` and GitHub release `1db3734b8988940acc6be8b992420a58fc39624a`. That count is historic and does **not** establish current Live contents.
- Issue #75: A40 C02 must not overwrite the Replit-specific tree blindly. Issue #70/PR #78 cover HTTP static routing; this A140 tool deliberately does **not** duplicate HTTP route tests or change application routes.
- PR #79 has only a 17-path sparse A30 source preservation manifest (not a complete 140-path inventory). It explicitly does not attest published-checkpoint blob hashes.
- Replit read-only Agent query on 2026-10-18 reports workspace HEAD `5e68f0f4b7d73cb5ff6aad0065dbe54c5f691776` on `feat/double-elimination-full-integration`, clean tracked/untracked Git status, and historic checkpoint not available locally as a Git commit. Agent-reported local state is **not** independent attestation of served Live bits.
- Replit connector deployment lookup returned `status=failed` at `https://aplikacja-turnieje.replit.app`; this is the latest publish status, not a complete external HTTP availability check.
- GitHub compare release versus reported workspace SHA responded 404; do not infer common Git history or assume the workspace SHA is reachable from GitHub.

## Implemented source-only change

`A140 source-preservation preflight` takes **explicitly supplied raw `git ls-tree -rz` binary inventory exports**, comparing their file object SHA-1 OIDs and Git modes. It does not invoke Git, write to a repository, read file contents, make HTTP requests, access a database, sync branches, or deploy.

Paths are classified into protection gates (game, PG16 SQL, auth/security, Replit routing, lockfile, unknown/manual review). It emits deterministic JSON containing individual drift rows, available three-way status, caller-asserted full commit SHAs, count summaries and `HOLD_NO_AUTOMATIC_COPY` preservation decisions.

**Critical constraints:** all input exports remain `OPERATOR_EXPORTED_UNVERIFIED`; printed SHA labels do not certify their associated tree bytes. Without a separately obtained published-tree export, the published build remains unavailable. Even with all three inventories, this preflight *never declares a release GO*. Case-by-case A00/A40/A60 authorization remains necessary.

### Files

1. `scripts/qa/a140-source-preservation.mjs` — read-only tree comparator and CLI, always returns `HOLD` / process exit `2` for a completed comparison; malformed input exits `64`.
2. `scripts/qa/a140-source-preservation.test.mjs` — Node 22+ offline fixture tests.
3. `docs/web-005/agent-reports/A140/WEB-005_A140_DEVELOPMENT_FIRST_HANDOFF.md` — this document.

### Safe verification

- `node --check scripts/qa/a140-source-preservation.mjs` — **PASS**, observed locally.
- `node --test scripts/qa/a140-source-preservation.test.mjs` — **8/8 PASS**, observed locally on authored bytes, synthetic fixture only.
- Standalone CLI fixture: `HOLD` JSON and exit 2 — verified locally. Not a failure of offline tests; exit 2 intentionally denies sync authorization.
- Actual full GitHub/Replit two- or three-tree comparison — **NOT_EXECUTED** (raw full inventories not supplied).
- Native repository-wide CI, Replit app/runtime HTTP, real browser, PostgreSQL, migrations, live deploy and production rollback — **NOT_EXECUTED**.

## Repro and handoff contract

From each **approved source checkout**, an operator may generate an inventory with `git ls-tree -rz COMMIT > inventory.lsz` after verifying the checkout's commit and custody. Use binary streams (NUL terminated), not copied terminal text. Supply two or three inventories to:

```
node scripts/qa/a140-source-preservation.mjs \
  --release-tree /approved/release.lsz \
  --release-commit 1db3734b8988940acc6be8b992420a58fc39624a \
  --workspace-tree /approved/replit-workspace.lsz \
  --workspace-commit 5e68f0f4b7d73cb5ff6aad0065dbe54c5f691776
```

Use `--published-tree` and `--published-commit` **only if** the actual deployed build/source provenance is independently available; do not supply the historic `cb55335...` label for an unrelated tree. Redirection of output is operator-controlled. No file content or secrets are included in object inventories, but path names should still be handled as internal provenance data.

## Required reviews, limits and gates

- **A10:** register source-only Draft PR; no inclusion in protected release until reviewed.
- **A40:** apply the drift manifest to future C02 preservation/collision DAG; do not auto-copy or infer safe merge from Git OIDs alone.
- **A60:** independently test actual PR HEAD bytes and negative cases; confirm all changed paths are limited to this tooling/test/report.
- **A30/A20/A22:** retain ownership of Steam authentication and migration collisions. This helper **does not** resolve D01–D04.
- **A00/HQ:** separate signature needed for any source integration/deployment. Missing published artifacts and migration ledger remain blockers.

**Final disposition:** `SOURCE_TOOL_READY_FOR_REVIEW / REAL_SOURCE_PARITY_UNVERIFIED / NO_SYNC / NO_DEPLOY / PG16_HOLD / RELEASE_NO_GO`.
