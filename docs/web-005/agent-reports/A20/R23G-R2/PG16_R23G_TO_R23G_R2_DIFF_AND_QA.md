# WEB-005 / A20 — R23G → R23G-R2 Source/Compose QA and Change Log

**Task:** `WEB-005-T020-A20-R23G-R2` · **Date:** 2026-10-17 Europe/Warsaw · **Execution:** NONE (source reads + static string review only).  
**C01 exact:** PR #60 HEAD `fa3261b2c9510e110ac9eba21726812d3401a525` OPEN DRAFT/UNMERGED.  
**Owner:** A00 infrastructure preflight approval only, no G0 image pull/build; G0–G5 each await independent A00/HQ+A20+Windows operator written scope.  
**R2 verdict:** `PG16_R23G_R2_READY_FOR_INDEPENDENT_QA`, but **runtime `PG16_EXECUTION_NOT_AUTHORIZED`**.

## R23G → R23G-R2 exact correction matrix

| Delta | R23G state | R23G-R2 corrected state / residual |
|---|---|---|
| OCI PG16 pin | `postgres:16@sha256:<APPROVED_DIGEST>` placeholder | Official Docker Hub lists PostgreSQL **16.15** and **linux/amd64** manifest digest prefix `75adc2a65806`; full manifest digest reported by independent Docker Hub index mirror `sha256:75adc2a65806c96bc0e59030230bfe3f1c1b0d6d8f8181a8913e2b8b53bdc166`, multiarch index `sha256:ca0bd484cb98bf4b24eb1010e73fb3fcbd6714d240fbc1a10eea5b7dbecb641d`. **Source confidence:** official truncated + 3rd-party full; **unfulfilled**: directly authenticated OCI registry descriptor check before G0, so no image executed. |
| Node22/pnpm10 reproducible image | Runner image placeholder | Proposed **UNBUILT** `Dockerfile.node22-pnpm10.example`, Node22.23.3 and pnpm10.34.7 from A50 baseline, frozen-lock install + TypeScript references. **NODE_BASE_DIGEST=PENDING, RUNNER_IMAGE_DIGEST=PENDING**, build not executed. Build context MUST be full exact SHA and exclude secrets. |
| Compose static | `pg16: network_mode:none`, runner `service:pg16`, secret files, private PGDATA, healthcheck, 55432 | Same intended architecture, now optional `platform:linux/amd64` and `pull_policy:never` to fail closed when image absent. **Static key-level checks** passed; Docker Compose parser/daemon **NOT_EXECUTED**. `pg_isready` checks only readiness, not SCRAM authorization or physical instance identity. |
| Writable runner paths | `read_only:true` + `/tmp` tmpfs assumed adequate | Potential integration tests may write elsewhere in `/workspace`; A50 must produce a source-derived write-path census and signed exclusively disposable writable locations. If unresolved, `STOP_G4_RUNNER_FILESYSTEM_WRITES`; never silently drop `read_only`. |
| S1 | Test scheme guard and 0001–0028 source only | Directly re-read C01 helper Git blob `31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6`, `NODE_TEST_CONTEXT`, SETUP and TEARDOWN **DROP SCHEMA IF EXISTS** plus CREATE; S1 separate explicit GO. |
| S2 | Three temp DB create/drop force | Directly re-read C01 Git blob `6c6bd054e0f6affd5d07e63ee396f5a14b423fc4`, 3× CREATE DATABASE and teardown DROP DATABASE WITH FORCE. PostgreSQL CREATEDB **not prefix-scoped**; S2 separate GO only empty isolated cluster. |
| SCHEMA_COMPARE env | Old text sometimes absolutely forbids `SCHEMA_COMPARE_*` | S2 fixture intentionally injects `SCHEMA_COMPARE_DEVELOPMENT_DATABASE_URL` and `SCHEMA_COMPARE_PRODUCTION_DATABASE_URL` into a *child process* pointing to its own scratch databases (source lines 682–683). Thus forbid inherited/global foreign DB URLs but **permit fixture-generated internal child env**. Unrelated lib/db opt-in `DROP public` test stays excluded. |
| G0–G5 | Phase plan with generic PASS/FAIL | R2 adds exact proof request: OCI signed artifact, runner digest/lock, port/PID/namespace/volume cert, G2 SCRAM identity, S1 and S2 distinct, G4 first TAP genuine failure + true exit, G5 owned cleanup and remote Drive readback; all **NOT AUTHORIZED**. |
| Google Drive/sha | R23G cloud-native docs available; Windows G: mirror unknown | R2 needs manifest SHA256 calculated over UTF-8 GitHub canonical source bytes; Google Docs normalization may append an extra newline. Compare **normalized full text**, not raw cloud file bytes, and report true remote MD byte hash as **NOT VERIFIED** unless raw file fetch byte-identical. Windows `G:` mirror `LOCAL_G_DRIVE_SYNC_UNVERIFIED`. |
| Source history | Existing R23G original documents | Kept historically unchanged; R2 packet in `docs/web-005/agent-reports/A20/R23G-R2/`, with authoritative corrections *preceding* original included baseline; no PR/source/game edits. |

## Source evidence

- Docker Official Image [Docker Hub postgres tags](https://hub.docker.com/_/postgres/tags?name=16&page=1) — `postgres:16.15`, `linux/amd64` short digest 75adc2a65806. Full alternate image-specific manifest and index on [Docker Hub mirror](https://dhub.cyberranges.com/layers/library/postgres/16/images/sha256-75adc2a65806c96bc0e59030230bfe3f1c1b0d6d8f8181a8913e2b8b53bdc166). **Full digest requires independently checked registry response at G0**.
- [Docker Compose official network_mode docs](https://docs.docker.com/reference/compose-file/services/) document `none`, `service:<name>` network namespace and forbid `networks` alongside `network_mode`.
- [Compose official secrets docs](https://docs.docker.com/compose/how-tos/use-secrets) document per-service `/run/secrets` and `POSTGRES_PASSWORD_FILE` support.
- [Docker Postgres image reference](https://hub.docker.com/_/postgres) documents `PGDATA`, init env and ephemeral secret-file conventions.
- Exact C01 source (GitHub): `test-database.ts@31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6`, `replit-schema-catalog-reconciliation.integration.test.ts@6c6bd054e0f6affd5d07e63ee396f5a14b423fc4`, `run-tests.ts@da4188446aba4696f97eb7831fee0cc5824d212f`, `qa/pack17/gate-contract.mjs@eae350a60a684d7b14af3e481baf7bd6c4a2b2fc`.
- Owner infrastructure Drive [WEB005_DOCKER_FINAL_PREFLIGHT.txt](https://drive.google.com/file/d/1nNSTAcsJWTPyUTm6YGz-oGAOENLTAdW-/view), A00 documentary [Issue #76](https://github.com/C8LyNn/aplikacja-turnieje/issues/76#issuecomment-6232716514).

## Actual static QA and missing tests

**Performed:** GitHub PR60 HEAD and unchanged original C01 file blob reads, S1/S2 statement reading, documented Compose fields inspected, immutable digest cross-source triangulation, Google Drive R23G cloud reference identification. **NOT performed:** Docker Compose parser (`docker compose config`), Docker pull/build/run/up, OCI authenticated registry descriptor exchange, native PostgreSQL service contact, SQL, migrations, test runner, any source edit. Compose R2 key-level checks do not prove container runtime behavior.

**To A60 independent QA:** Check full digest against primary registry, YAML grammar/interpolation and image tag digest, Node Dockerfile order/base, healthcheck and `--auth-local` image-entrypoint bootstrap semantics, writable test paths, negative URL/foreign mount bypass, three-DB owned cleanup, robust shell TAP receipt. A00 must not interpret this QA request as consent for Docker commands.

**Remaining gates:** direct OCI digest attestation `PENDING`, immutable Node base and runner image build `PENDING`, actual Compose parser `NOT_EXECUTED`, real physical isolation certificate `MISSING`, G0–G5 approvals `MISSING`, Windows G: mirror sync `UNVERIFIED`. Status `DOCKER_PREFLIGHT_ACCEPTED / PG16_EXECUTION_HOLD / C01_INTEGRATION_HOLD / C02_HOLD / RELEASE_NO_GO / SWARM006_HOLD`.
