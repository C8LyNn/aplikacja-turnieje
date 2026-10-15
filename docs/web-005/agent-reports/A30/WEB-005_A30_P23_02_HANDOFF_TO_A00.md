# WEB-005 — A30 / P23-02 Security Design handoff for coordinator A00

**Task:** `WEB-005-T030-A30-BACKUP-V3-P23-02` · **Date:** 2026-10-15 · **Mode:** SECURITY DESIGN / READ-ONLY application.  
**Full 141-line security design:** [WEB-005_A30_BACKUP_V3_P23_02_ANTI_DOWNGRADE_SECURITY_DESIGN.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/5b9f396b8f723ee300b10d1b2a80f18edc3b33e8/docs/web-005/agent-reports/A30/WEB-005_A30_BACKUP_V3_P23_02_ANTI_DOWNGRADE_SECURITY_DESIGN.md), verified immutable document commit `5b9f396b8f723ee300b10d1b2a80f18edc3b33e8`, file blob `4890a4e41374056a6383fdad523fdbc0a2fd97d9`.

## A30 formal verdict

**`SECURITY_DESIGN_READY` — DESIGN ONLY.** Source-backed risks, credible provenance/legacy architecture, minimum importer gating contract, exact future ownership files, and 22 positive/negative test vectors are documented. **`INTEGRATION_NO_GO / RELEASE_NO_GO / SWARM006_HOLD`** until new explicit A00 implementation authorization, complete integrated source QA and native HTTP/PG16 gates.

### Actual source and QA identity

- [PR #56](https://github.com/C8LyNn/aplikacja-turnieje/pull/56) at `a7f71a7e7efdabd479b358a3cee80bc6359c4321`, OPEN/DRAFT/UNMERGED, two new files only, **NOT_WIRED** into real exporter/importer/transport. Original release `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.
- [A60 independent P23-01 post-fix review](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_PR56_P23_01_POST_FIX_INDEPENDENT_QA.md): isolated exactly matching source/test bytes, **22/22 tests PASS** (Node22 transpiled-JS), no full monorepo typecheck and no Backup HTTP/PG16 PASS. Only narrow P23-01 BYE source defect closed.
- Live release import `routes/tournaments.ts` first applies `ImportTournamentBody.safeParse`, then `importBackupV3`. Generated Zod/OpenAPI lacks `strictPolicy` (unknown-key strip risk). Baseline remapper in `backup-v3.ts` and `backup-v2.ts` uses `map.get(sourceId) ?? sourceId` for recognized nested IDs; zero safe strict fallback enforcement at route. Actual V3 clone uses `db.transaction`, but physical rollback/no-clone has never been tested here.

### A00 decisions needed before a new implementation GO

1. **Trust/provenance:** recommend **signed modern strict export envelope** (e.g., Ed25519 issuer/keys + canonical payload) plus positive historical V2/V3 allowlist. Missing marker is **UNATTESTED**, NEVER trusted legacy proof. If signer/ledger cannot be deployed yet, permit only **explicit restricted, untrusted legacy compatibility** with no historical destructive Undo/Revert/CAS replay, not a cryptographic anti-downgrade claim. Absolute classification of a file deliberately rewritten to match byte-for-byte unsigned genuine old backup is impossible without trusted out-of-band provenance.
2. **Legacy capabilities:** persist and **enforce server-side** restricted state for unattested legally compatible old V2/V3; allow original safe game/tournament data, no executing unverifiable Undo/action tokens. Owner B1=A and delegated B2=B/B3–B6=A already approved; this is a *security implementation choice*, not re-opening those product decisions.
3. **Future source lane:** propose `WEB-005-T060-A90-P23-02-INGRESS-PREFLIGHT`, **pure new `backup-v3-profile-gate.ts` + test-first fixtures only**. Keep current route/PR56/SQL untouched until next separately GO-authorized transport/wiring phase with A20 and A70.
4. **Ownership and prerequisites:** A90 controls exporter/importer/policy and spec PR with exact hunks, A20 must settle `0028_match_revision.sql` and legacy restore-mode state/PG16 isolation, A70 typed completion/system BYE/action-local Undo semantics, A60 independent exact-head QA, A50 actual native HTTP/PG16 tests. A00 coordinates file overlap with PR41/48 and API generator.
5. **Security PASS gate:** preparse raw profile and Zod tag parity, 400 zero DB writes for stripped marker/hybrid or nested foreign/action-local ID, true legacy V2/V3 positive with Undo disabled where unprovable, BYE positive, forged history negative, clone-local remap only, late transaction rollback and no credential transplant, strict signed archive verifier; all on isolated exact SHA. 22 cases in detailed report.

**A30 evidence status:** source/code readback only; **A30 app tests 0 / NOT_EXECUTED**, no code changes, no PR56 comments/source edits, no SQL, no merge, no deploy. Report and handoff only on documentation control branch.

**Requested A00 outcome:** Approve or reject the recommended architecture and identify exact owner-safe test-first file lane in a **new explicit GO**; otherwise `WAIT_A00_SECURITY_ARCH_DECISION / INTEGRATION_NO_GO`. Do not equate `SECURITY_DESIGN_READY` with strict Backup V3 rollout readiness. **SWARM-006 remains HOLD.**
