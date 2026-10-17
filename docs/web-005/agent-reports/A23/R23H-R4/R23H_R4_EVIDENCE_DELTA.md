# WEB-005 — A23 / R23H-R4 — EVIDENCE INDEX DELTA

**Task:** `WEB-005-T023-R23H-R4-EVIDENCE-DELTA`  
**Priority:** P1 · **Mode:** APPEND-ONLY / READ-ONLY source and publication integrity.  
**Issued:** 2026-10-18 Europe/Warsaw.  
**Recipients:** A00 / Implementation Lead, A20 / PostgreSQL Coordination V2, A30 / Security Coordination V2, A60 / Independent QA.  
**Exact audited application:** `C8LyNn/aplikacja-turnieje@fa3261b2c9510e110ac9eba21726812d3401a525` (PR #60, frozen source; no changes).

**Scope limitation:** This file is **only an additive late-evidence receipt** for A30 R3, A20 final coordination, and the newly updated A60 final QA source. It does not reconstruct A23 R3, re-evaluate SQL/Docker/runtime, amend application code, or grant any execution permission.

**Overall documentary result:** `R23H_R4_EVIDENCE_DELTA_PASS` (3/3 newly targeted raw published artifacts independently SHA-256 verified).  
**Runtime/security result:** `SECURITY_BLOCKED / A60_BLOCKED / G0_NO_GO / G1_G5_HOLD / PG16_EXECUTION_NOT_AUTHORIZED / C01_INTEGRATION_HOLD / RELEASE_NO_GO`.

## 1. Immutable A23 R3 baseline (preserved without modification)

- Original **final A23 R23H-R3 canonical index**: [GitHub permalink](https://github.com/C8LyNn/aplikacja-turnieje/blob/354ab79ef6f00a8fb8485ac6d2eaf6a9dbaf7bd0/docs/web-005/agent-reports/A23/R23H-R3/R23H_R3_CANONICAL_EVIDENCE_INDEX.md).
- Frozen R3 Git commit `354ab79ef6f00a8fb8485ac6d2eaf6a9dbaf7bd0`; Git blob SHA-1 `94f864fc663059a08dbea0d87d5c952d1f8d34f4`; 29,648 raw bytes; independently verified A23 R3 SHA-256 `bb847619d4075eebd79075d4392fd02290471716062c31caa48d5504f76e29aa`.
- Historic earlier R3 version also remains immutable at commit `1d2a07d5c70f134a8e0fabc7917c765fb087cda1`. No historical source was overwritten.
- **Additive relationship:** use `A23 R3 + A23 R4 delta` as the complete current custody view; prior R3 counts and independently verified package hashes remain unchanged. This R4 file does not assert any new independent hash check on A21/A22/A24/A50 ZIPs beyond prior R3 custody.

## 2. New source-custody delta — EXACT RAW BYTES

Method: A30 and A20 were fetched by exact supplied **Google Drive file IDs** as original `text/markdown` raw bytes, locally rehashed with SHA-256 and byte count. A60 was fetched by exact Git **commit** as base64 bytes, decoded and independently SHA-256 hashed, with GitHub UTF-8 readback and author's GitHub `.sha256` sidecar cross-checked. SHA-256 in this section is of **actual retrieved file bytes**, not Google Docs normalized text or a quoted author claim. A raw Drive file ID is a stable locator but **not** a Git-style immutable version; compare byte digest whenever re-reading it.

| Role; R3 file; exact location | Source identity | SHA-256 of raw bytes | Integrity / documentary classification |
|---|---|---|---|
| **A30 Security** [`R23H_R3_SECURITY_FINAL_VERDICT.md`](https://drive.google.com/file/d/1KisgPhL7Yh-L8GpoaskEg99qAm8rJlgF/view) | Drive ID `1KisgPhL7Yh-L8GpoaskEg99qAm8rJlgF`; MIME `text/markdown`; **20,171 B**; Drive created/modified `2026-10-17T22:07:02.741Z`. See also [Issue #84](https://github.com/C8LyNn/aplikacja-turnieje/issues/84) for author handoff. No separate Git blob is claimed for this Drive file. | `7d9a55d4f17744e838083bf187f31e3def8d6dbf88a215da2baa1c17f96ce1a2` | **VERIFIED** A23 downloaded cloud bytes and calculated SHA-256; agrees with [Issue #84 receipt](https://github.com/C8LyNn/aplikacja-turnieje/issues/84). **Verdict content:** `SECURITY_BLOCKED`, not G0 GO. |
| **A20 Coordination** [`R23H_R3_FINAL_COORDINATION_HANDOFF.md`](https://drive.google.com/file/d/1nZ9S58MqTa1Y-1h-knqRYMb8dpIRQWEZ/view) | Drive ID `1nZ9S58MqTa1Y-1h-knqRYMb8dpIRQWEZ`; MIME `text/markdown`; **23,920 B**; Drive created/modified `2026-10-17T22:31:57.498Z`. No Git blob asserted for this raw Drive file. | `fe94088c8f6a95f903e63688365a83644f77f3e21f40695b92418dfa6d5d9d3d` | **VERIFIED** A23 downloaded cloud bytes and calculated SHA-256; matches stated A20/A60 intake. Final coordinator status `BLOCKED_MISSING_EVIDENCE` for positive admission. |
| **A60 QA** [`R23H_R3_FINAL_QA_VERDICT.md` pinned current version](https://github.com/C8LyNn/aplikacja-turnieje/blob/1f529b80cdc9c0e3d8bf48812365be037e0a851f/docs/web-005/agent-reports/A60/R23H_R3_FINAL_QA_VERDICT.md) | **Git commit** `1f529b80cdc9c0e3d8bf48812365be037e0a851f`; **Git blob SHA-1** `fd8c735360fa8e8d4c78d4a82e09f4e21988fe93`; **29,883 B**; [SHA256 sidecar](https://github.com/C8LyNn/aplikacja-turnieje/blob/1f529b80cdc9c0e3d8bf48812365be037e0a851f/docs/web-005/agent-reports/A60/R23H_R3_FINAL_QA_VERDICT.md.sha256) with Git blob `44a7cb0f580a77d4ed98ee0316f01c416976b129`. | `b31b0b3afec8ab145137656dfeb8f9af79ed4d937cda05a49b5a3c54a6891a8d` | **VERIFIED** A23 recalculated raw GitHub file bytes; exact match with sidecar. **Content verdict:** `BLOCKED / G0_NO_GO`. |

**New evidence count:** `3 VERIFIED / 0 missing among the three requested R4 intake artifacts / 0 SHA-256 mismatch / 0 newly AUTHOR_REPORTED-only source-file checks`. This does **not** mean that missing runtime receipts are now present.

## 3. Supersession ledger — precise, scoped

| Prior historic record | Newer record now controlling the cited scope | Change and status |
|---|---|---|
| [A30 R23H independent security reconciliation](https://github.com/C8LyNn/aplikacja-turnieje/blob/4d97b25b07b7d667777ff0b9fb38d9c57f4d5574/docs/web-005/agent-reports/A30/WEB-005_A30_R23H_INDEPENDENT_SECURITY_RECONCILIATION.md), historical SHA-256 `87d6359cd06aa797e93c37d8d9c9b97dd33155669875e9aff3bfb4a7096a1d09` | **A30 final R3**, raw Drive SHA-256 `7d9a55d4f17744e838083bf187f31e3def8d6dbf88a215da2baa1c17f96ce1a2` | Later **security risk consolidation** of A31 `P0-31-01…07`, original A21/A22 and new A22 R3. Old A30 historical evidence remains valid in its original scope, but **not** a substitute for R3 final. Security verdict **BLOCKED** unchanged. |
| [A20 previous R3 coordination](https://github.com/C8LyNn/aplikacja-turnieje/blob/9442cfa82803aaf31bae6f2e6b9f386d09b356f7/docs/web-005/agent-reports/A20/R23H-R3/R23H_R3_FINAL_COORDINATION.md), SHA-256 `53119cee6e69303d0be29a39fef38ac485aad794731b314daaa1991f00c49cfe` | **A20 final Drive handoff**, raw SHA-256 `fe94088c8f6a95f903e63688365a83644f77f3e21f40695b92418dfa6d5d9d3d` | Newer *handoff receipt and consolidated status* incorporating A30 R3; **not** claimed byte-for-byte replacement of historical Git Markdown or revision of earlier calculations. Positive acceptance remains **BLOCKED**. |
| A60 previous R23H-R3 snapshot, Git blob `76d5310a6bb9642b7dab7dc4742e67178469a818`, earlier SHA-256 `1e8bc17fb5a4656dbcd8b005030a7f1c71202c6a016d62dcb86b794277c397a1` | **A60 updated same named report** at commit `1f529b80cdc9c0e3d8bf48812365be037e0a851f`, blob `fd8c735360fa8e8d4c78d4a82e09f4e21988fe93`, new SHA-256 `b31b0b3afec8ab145137656dfeb8f9af79ed4d937cda05a49b5a3c54a6891a8d` | Replaces **latest-current A60 report** for custody/QA citation; historical A60 earlier blob remains auditable in Git history. A60 verdict still `BLOCKED`. Do not cite former hash as the current file hash. |
| A23 R3 index `354ab79ef6f00a8fb8485ac6d2eaf6a9dbaf7bd0` | **This A23 R4 delta, appended as a different file** | Old A23 R3 remains byte-identical. Its `A30 R3 security consolidation MISSING` is **SUPERSEDED AS DOCUMENT DISCOVERY STATUS ONLY**: document is now **VERIFIED**. Physical and signed security evidence is **not** closed. |
| Historic three-S2-DB / hypothetical separated S1 `NOCREATEDB` and S2 `CREATEDB` designs | [A22 R3 final SQL source contract](https://github.com/C8LyNn/aplikacja-turnieje/blob/1e025d28253f0ce6e541f034f9eb3b99ff7151ec/docs/web-005/R23H_R3_SQL_FINAL_CONTRACT.md), [A24 R3 final readiness](https://github.com/C8LyNn/aplikacja-turnieje/blob/b829968584d76ecc777c7d4c785748ba07036740/docs/web-005/agent-reports/A24/R23H-R3/R23H_R3_G0_G5_READINESS_FINAL.md), A30 final | Only for **C01 documented SQL/role scope**: four dynamic S2 DBs (3 catalog + 1 Drizzle) **plus separately provisioned S1 base** = five run-owned logical contexts. Actual unchanged C01 uses shared `TEST_DATABASE_URL` principal, so privileges imply cluster-wide `CREATEDB` even in S1. **No physical runtime grant/operation approved.** |

## 4. Current remaining gaps — do not misclassify as checksum failures

**SOURCE INTAKE PASS** ≠ `SECURITY_ACCEPTED`; A30 and A60 expressly say **BLOCKED**.

- **P0 open — A31 P0-31-01 execution authority and P0-31-02…07:** safe signed scope for four S2 scratch DBs, twice `drizzle-kit push --force`, automatic G4 force-drop, shared `CREATEDB`, S1 CASCADE + auxiliary DDL, exact physical PostgreSQL instance/Windows host exclusion, owner/creation-failure/collision protection, inherited DSN/loader rejection, sealed launcher, immutable phase gate approvals and independent A60 acceptance.
- **P1 open — A31 P1-31-01…06:** bootstrap admin secret lifetime, runner `read_only`/tmpfs/write-path census, authenticated SCRAM vs `pg_isready`, source and effective Drizzle/migrations effects, redacted cloud log+ACL receipt, named Docker resource uniqueness/ownership.
- **PENDING runtime artifacts:** signed A00/HQ+A20+Windows operator frozen-plan receipt, OCI platform/Node/runner image attestations, G1/G2 physical↔logical SQL identity, G3 permissions, original full C01 G4 TAP/exit/first real failure, exact G5 cleanup receipt, Windows `G:\` mirror verification. No such execution was performed here and no `GO` is implied.
- **AUTHOR_REPORTED** if not independently observed in a future task: any claim of real Docker/PG state, runner image/digest built, signed consent, actual SQL effects or original full integration PASS. Pure authorship of A30 security conclusions is not independent runtime evidence.
- **MISSING IN THIS R4 SOURCE INTAKE:** `0/3` of the specifically required new A30/A20/A60 files. **MISSING FOR RUNTIME ADMISSION:** physical/runplan/approval and execution receipts above; do not collapse these into a fabricated single file count.

## 5. R4+ future evidence intake schema (append-only)

For each new evidence **file/version**, publish one uniquely identified record. A later version adds a record with a `supersedes` edge and never erases the old source. Recommended minimal YAML record:

```yaml
record_id: WEB-005-R23H-R4-<agent>-<artifact>-<version>
agent: A30
document_version: R23H-R3
file_name: R23H_R3_SECURITY_FINAL_VERDICT.md
source:
  kind: google_drive_raw  # or github_git_blob
  url: https://drive.google.com/file/d/<exact_id>/view
  drive_file_id: "<exact_id>" # null for GitHub
  git_commit_sha: null       # full 40-char only if independently known
  git_blob_sha1: null        # NOT a SHA-256
provenance:
  bytes: 20171
  sha256: "<exact_64_lowercase_hex>"
  observed_utc: "<UTC timestamp>"
  verification_method: "raw cloud download + independent SHA256"
  checked_against_author_manifest: "MATCH|NO_MANIFEST|MISMATCH"
  verifier: "A23"
relationships:
  parent_index_commit: "354ab79ef6f00a8fb8485ac6d2eaf6a9dbaf7bd0"
  supersedes: ["<previous_record_id>"]
  supersession_scope: "security_review_document_only"
classification:
  custody: VERIFIED         # VERIFIED|AUTHOR_REPORTED|PENDING|MISSING|FAIL
  source_contract: BLOCKED  # if applicable
  execution: NOT_EXECUTED   # never infer PASS from custody
  authorization: NOT_GRANTED
acceptance:
  approver: null             # exact person/action/event only when evidenced
  signed_receipt_url: null
  a60_decision: BLOCKED
open_risks: ["P0-31-02", "P0-31-04"]
```

**Intake validation gates:** (1) exact accessible source locator or immutable Git commit/blob; (2) raw length and SHA-256 computed by A23, with manifest agreement separately stated; (3) content/date/version and `supersedes` scope; (4) `VERIFIED` only for actual fetched bytes; (5) author claims separated from observed operational evidence; (6) no false declassification of P0/P1; (7) independent A60 acceptance recorded only from A60 own exact source; (8) append a new file/receipt and record file SHA256 + Git commit, never silently overwrite prior R3; (9) report file permissions/access separately from content integrity, particularly when Drive file has only owner-level permissions or non-public sharing.

## 6. Handoff and decision

**Handoff routing:** A20 + A00 via [Issue #76](https://github.com/C8LyNn/aplikacja-turnieje/issues/76); A30 via [Issue #84](https://github.com/C8LyNn/aplikacja-turnieje/issues/84); A60 via [Issue #77](https://github.com/C8LyNn/aplikacja-turnieje/issues/77). Publication/issue comment is **not** proof every separate agent conversation has read and accepted the material.

**Final result:** `PASS — R23H-R4 DOCUMENTARY EVIDENCE DELTA (3/3 source receipts)`. **Unchanged operational result:** `SECURITY_BLOCKED / A60_BLOCKED / G0_NO_GO / G1_G5_HOLD / RELEASE_NO_GO`. No Docker, PG16, application SQL, application source edits, migrations, tests, image pulls/builds, merge or deployment were run.
