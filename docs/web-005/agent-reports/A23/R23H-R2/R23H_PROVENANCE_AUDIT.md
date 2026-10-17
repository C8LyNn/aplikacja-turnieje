# WEB-005 — R23H / A23 — Provenance and Integrity Audit

**Task:** `WEB-005-T023-R23H-EVIDENCE-INTEGRITY`  
**Audit date:** 2026-10-17 Europe/Warsaw  
**Mode:** independent read-only source inspection.  
**Final task status:** **`BLOCKED`** (full cross-agent and Windows evidence incomplete); source documentation acceptance **11/11 PASS**.

## 1. Provenance chain and immutable pins

| Layer | Observed evidence | Status |
|---|---|---|
| C01 application SOURCE | GitHub commit [fa3261b2c9510e110ac9eba21726812d3401a525](https://github.com/C8LyNn/aplikacja-turnieje/commit/fa3261b2c9510e110ac9eba21726812d3401a525) | `VERIFIED` |
| C01 first parent | `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` | `VERIFIED` via Git tree commit endpoint |
| C01 Git tree | `c19fff1d6b8538dee731ea0daad75bfe568714c3` | `VERIFIED` via Git tree commit endpoint |
| PR #60 | [PR #60](https://github.com/C8LyNn/aplikacja-turnieje/pull/60) points to C01; OPEN, DRAFT, UNMERGED at audit | `VERIFIED_AT_READ_TIME` |
| Documentation branch head | `chore/web-005/t000-wave1-control` -> `cf60d1c047d1aed0b718ae0cf25ac6568bb6b478` | `VERIFIED_AT_READ_TIME`, branch ref itself mutable |
| Canonical R2 docs | [docs/web-005/agent-reports/A20/R23G-R2](https://github.com/C8LyNn/aplikacja-turnieje/tree/cf60d1c047d1aed0b718ae0cf25ac6568bb6b478/docs/web-005/agent-reports/A20/R23G-R2) | `VERIFIED` snapshot; **not part of C01 commit** |
| Google R2 docs | https://drive.google.com/drive/folders/1-kR3pueqklMzu4vKqQa4EdzTbUTNsTIq, 13 native documents | `VERIFIED_EXISTENCE`; logical-text checks 11/11 |
| Local operator `G:` sync | `G:\Mój dysk\ChatGPT\WEB-005\Raporty\PG16_DOCKER_ISOLATION\` | `UNVERIFIED` |

**Critical distinction:** `fa3261b2c9510e110ac9eba21726812d3401a525` is the C01 application source and test target. `cf60d1c047d1aed0b718ae0cf25ac6568bb6b478` is the **different** documentation commit used to anchor the current R2 artifact registry. These values serve distinct provenance purposes; substituting one for the other would be a false attestation.

## 2. Independent 11/11 verification procedure and result

1. Used GitHub connected read actions on `C8LyNn/aplikacja-turnieje` and pinned/observed `chore/web-005/t000-wave1-control`, then captured head `cf60d1c047d1aed0b718ae0cf25ac6568bb6b478`.
2. Read every one of 11 canonical R2 files, compared Git blob SHA1 with A20 manifest and independently calculated SHA-256 over canonical GitHub source bytes. All **11/11** matched. For source with Unicode, a raw GitHub `base64` read was decoded bytewise; `PG16_R23G_R2_FINAL_QA.md` returned SHA-256 `7090371f226a179f376d7c612dc970d4217c6eab6af4c501da97f79d88107793` as expected.
3. Queried `Google_Drive.get_document_text` for **each of eleven native R2 Docs**. Reconstructed line boundaries using paragraph `startIndex`/`endIndex` gaps, then supplied the final source line terminator. All **11/11** matched the corresponding GitHub source's logical text. Readability metadata, revision IDs and document IDs were observed; a logical readback is **not** a raw export-byte assertion.
4. Separately read the R2 SHA256 source manifest (Git blob `98988747bcce64e350ff676a1b430d750ce7e67d`) and verified raw GitHub SHA256 `8f7eac59478d604d886d2b3dccf8c74e1e0b6bc358b1a339381b6fcaa9a88afd` plus logical Google Docs text. The A20 verification addendum was read as contextual corroboration, outside the 11.
5. Cross-checked exact C01 source blobs, including S1, S2, environment DB URL source and test runner, via GitHub blob reads (below).

| C01 cited component | Path / Git blob SHA1 | A23 direct result |
|---|---|---|
| S1 schema reset helper | `artifacts/api-server/test/test-database.ts` / `31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6` | Git blob accessible; contains schema-reset guard and destructive schema lifecycle |
| S2 catalog reconciliation test | `artifacts/api-server/test/replit-schema-catalog-reconciliation.integration.test.ts` / `6c6bd054e0f6affd5d07e63ee396f5a14b423fc4` | Git blob accessible; contains scratch-db creation/cleanup behavior |
| DB URL source | `artifacts/api-server` module `lib/db/src/index.ts` / `50cbf483d87a8a741f4965acde5edf6225fedd3e` | Git blob accessible; reads `process.env.DATABASE_URL` |
| Test runner | blob `da4188446aba4696f97eb7831fee0cc5824d212f` | Git blob accessible |
| Pack17 gate | `qa/pack17/gate-contract.mjs` / `eae350a60a684d7b14af3e481baf7bd6c4a2b2fc` | Git blob accessible |

**Boundary:** direct retrieval of a source Git object is not evidence that destructive tests were run or that an isolated PostgreSQL instance exists. Nothing was executed on host or DB.

## 3. Compose topology contradiction

| Variant | Git blob | Essential network semantics | Disposition |
|---|---|---|---|
| Historical R23G Option B: `A20/R23G/PG16_DOCKER_COMPOSE.example.yaml` | `b18eb6846bc82ef0383eae656edae75b745fae8f` | Docker `networks:[lab]` and host-published `127.0.0.1:${WEB005_TEST_HOST_PORT}:5432`; NOT equivalent to no-host-port architecture | `SUPERSEDED_AS_CANONICAL / DO_NOT_EXECUTE` |
| R23G root Option A: `A20/PG16_DOCKER_COMPOSE_EXAMPLE.yaml` | `79dce94f0a233761a41387ecc8916856433ec018` | `pg16.network_mode:none`, `api-tests.network_mode:service:pg16`, both ports empty, loopback PG `55432` | `SUPERSEDED_BY_R2 / HISTORICAL` |
| **R23G-R2 canonical** | **`000bf75d8d456dcb4657dbf06c8c9f6274918c73`** | Option A + platform `linux/amd64` and fail-closed `pull_policy: never`; still non-runnable without image approvals | **`CANONICAL_DOC_ONLY`** |

A30's security audit of R23G explicitly found Option A/B inconsistency and recommended signed choice. R23G-R2 selects **the canonical documentary candidate**, but **A00/HQ has not thereby issued permission to execute**. No unrelated Compose variant may be substituted without a new signed review.

## 4. Review of reports from A21/A22/A24/A30/A50

- **A21:** no agent-specific R23G-R2 report found through supplied folders, connected Drive searches or repository report inventory. `UNVERIFIED` rather than presumed identical.
- **A22:** no matching R2 report found. `UNVERIFIED`.
- **A24:** no matching R2 readiness report found. `UNVERIFIED`.
- **A30:** verified R23G report at [commit `bd57cb2...`](https://github.com/C8LyNn/aplikacja-turnieje/blob/bd57cb2ebcb17f9ac135cfb7a983eb23fb1e3f57/docs/web-005/agent-reports/A30/WEB-005_A30_R23G_DOCKER_PG16_SECURITY_AUDIT.md), blob `9a2a6029e9723ac939b9c30741722af663bc7f5c`, Drive [document](https://docs.google.com/document/d/1g1TfiHEl8bxka09kv_N4BZ1M8xgCyb0XZmsiaetOSks/edit). It discusses Option A/B and **does not cite R23G-R2**. Revalidation of exact R2 Compose and new runner still pending; historic security findings not discarded.
- **A50:** checked current repository R23D C01 V3 evidence and R23D handoff. They do not cite `R23G-R2`; DB-free/native evidence cannot serve as R2 physical isolation attestation. `UNVERIFIED`.

**Limitation:** 'not found' is an observation within listed/readable sources, not proof the agent never wrote another private report.

## 5. Missing evidence / STOP conditions

| Evidence required | Observed state | Release-gate effect |
|---|---|---|
| Raw Google Docs export bytes verified identical to original `.md`/YAML | `NOT_VERIFIED`; exported bytes are a separate artifact class | Do not claim cloud raw-byte SHA equivalence |
| Windows `G:` authenticated local file listing/hash + Drive sync receipt | `UNVERIFIED` | No local-mirror verification claim |
| A21, A22, A24 report exact pinned Compose + provenance | `NOT_LOCATED` | Full R23H evidence chain BLOCKED |
| A30 and A50 explicit R2 pin/re-review | `MISSING_IN_INSPECTED_REPORTS` | Security/QA acceptance not inherited from R23G |
| Primary registry authenticated OCI `postgres` manifest, linux/amd64 descriptor | `PENDING` | G0 HOLD |
| Immutable Node base digest and built runner image digest | `PENDING` | G0/G4 HOLD |
| Docker Compose CLI parse and real runtime physical namespace/volume/ACL/Windows native PG evidence | `NOT_EXECUTED` | G1-G4 HOLD |
| Separate A00/HQ, A20 and operator phase approvals G0–G5, including distinct S1/S2 | `MISSING` | `PG16_EXECUTION_NOT_AUTHORIZED` |

No `G:` filesystem access, Docker/SQL/CI or changes to source, games or production occurred in this audit.

## 6. Handoff — A20 and A60

**A20 (action required):** adopt the fixed R2 Compose Git blob `000bf75d8d456dcb4657dbf06c8c9f6274918c73` and source snapshot `cf60d1c047d1aed0b718ae0cf25ac6568bb6b478` for documentary references; keep older R23G root and Option B examples strictly historical; obtain A00 signed topology decision; request A21/A22/A24 agent reports pinned to exact R2; request A30 R2 security delta; keep all G0–G5 as HOLD; acquire independent Windows G: evidence.

**A60 (independent acceptance):** accept only `SOURCE_11_OF_11_SHA_AND_LOGICAL_DOCS_VERIFIED` as supported; **do not** upgrade R23H to `R23H_EVIDENCE_VERIFIED` until all listed agents explicitly pin the same R2 SHA, cloud/export byte-contract labeling is consistent, and missing Windows/physical/runtime evidence is scoped honestly. Verify image descriptor and runtime phase gates separately from document-integrity checks. Require exact artifacts/logs not pass-by-association with A50 426/426 DB-free tests.

**Read-only handoff boundary:** this report is prepared for A20/A60, but no GitHub issue comment, PR change, Google Drive mutation, automatic message or historic document label was issued. Forward/publish only with separate authorized workflow.

**Final:** `BLOCKED` for *full R23H evidence-chain certification*, despite **11/11 verified** source+logical-text subgate. No blanket claim of runtime unfitness or document tampering is implied.
