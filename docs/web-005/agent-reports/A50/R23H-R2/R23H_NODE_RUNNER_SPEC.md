# WEB-005 / A50 / R23H — NODE RUNNER SPEC

**Task:** `WEB-005-T131-R23H-RUNNER`  
**Mode:** DESIGN / SOURCE PREPARATION ONLY — NO EXECUTION  
**C01 exact commit:** `fa3261b2c9510e110ac9eba21726812d3401a525` (PR #60, unchanged).  
**Disposition:** Design ready for A20/A24/A60 review; no G0–G4 approval, no runnable image.

## 1. Audited A20-R2 source

- Canonical A20 Dockerfile: `docs/web-005/agent-reports/A20/R23G-R2/Dockerfile.node22-pnpm10.example` on `chore/web-005/t000-wave1-control`; **Git blob SHA-1** `61094e79376e0cee730c6ffdfb540ed60d4f94fa`; A20 declared **SHA-256** `9e9104274c37b7c0d7c0d3c693225b6dae70bb149637222634a833c64e5fd513`. These are different digest algorithms, not a mismatch. A20 also published a Google Doc copy: <https://docs.google.com/document/d/1WfhWBlHx5ECZB7j6piUrztOQzm1kfArfymrh0wUTuog/edit>. Google-native export bytes may differ from Git UTF-8 source.
- A20-R2 Compose source: `docs/web-005/agent-reports/A20/R23G-R2/PG16_DOCKER_COMPOSE_EXAMPLE.yaml`, Git blob `000bf75d8d456dcb4657dbf06c8c9f6274918c73`; A20 SHA-256 `7618513028d738fd78cb1c17a9d3bf3f9d3cf61ef8df5e46470bbaba05f9a397`.
- `Dockerfile`: `ARG NODE_BASE_PINNED`, `FROM ${NODE_BASE_PINNED}`, `node --version` exactly v22.23.3, `corepack enable && corepack prepare pnpm@10.34.7 --activate`, `COPY . /workspace/`, `pnpm install --frozen-lockfile`, `pnpm exec tsc -b lib/db lib/api-zod lib/stage-basket-flow`, `USER node`, inert `CMD ["node","--version"]`.
- `Compose`: PG `network_mode: none`, Node `network_mode: service:pg16`, both `ports: []`, internal PG `127.0.0.1:55432`, `read_only: true`, `/tmp` tmpfs only, nonroot Node intended, `pull_policy: never`. No host PostgreSQL 5432 access is allowed. Inert Compose commands do not constitute runtime attestation.

### Source-review verdicts

| Requirement | Static assessment / required revision |
|---|---|
| Exact C01 reference | `EXACT_C01_SHA` as ARG/LABEL is **not proof** of copied source. Outside-image Git HEAD/tree/lock manifest AND an in-image hash receipt must be matched. |
| Exact Node version | `RUN node --version` fails on version drift; base image **digest still PENDING**. Architecture and base provenance not proved by version text. |
| pnpm pin | `corepack prepare pnpm@10.34.7` has online acquisition/trust dependency and mutable Corepack behavior. G0 must pin Corepack version/source and pnpm tarball `dist.integrity` SHA-512 and record resulting binary integrity. Prefer pre-staged, hashed pnpm tarball in constrained context if independently approved. |
| Build | Frozen lock is positive; root `preinstall` also invokes `rm -f package-lock.json yarn.lock` in the **disposable build context**. Verify no unexpected context drift. BuildTypes creates artifacts in image layer intentionally, no runtime compilation unless specifically audited. |
| Build context | **P0 before G0:** `COPY .` can ingest host secrets without an A00-reviewed `.dockerignore`/positive file manifest. Require allowlisted generated tar context composed only of exact committed files with symlinks and submodules audited; no `.env`, `.git`, token, host PGDATA, outputs, local caches. A `.dockerignore` alone is not cryptographic proof. |
| Nonroot runtime | `USER node` is positive; immutable `/workspace` is root-owned and must remain read-only at runtime. Require `id -u` / effective UID and permissions attested at a **future approved** G1/G4. |
| Runtime entrypoint | Dockerfile inert `CMD` is positive, but Compose can override entrypoint/command. Signed G4 command hash + effective Compose config must be attested; label is insufficient. |
| `read_only` | **NOT_YET_CERTIFIED**: cache/home/runtime log and fixture write census must close. No silent `read_only:false` fallback. |
| Image provenance | Both `NODE_BASE_IMAGE_DIGEST` and built `RUNNER_IMAGE_DIGEST` **PENDING**; no claim of reproducibility, build success or execution. |

## 2. Proposed immutable Node base and verification

**Candidate for A00/A20 approval:** `docker.io/library/node:22.23.3-bookworm-slim@sha256:<REGISTRY_VERIFIED_LINUX_AMD64_MANIFEST_DIGEST>` with **`platform: linux/amd64`**. This exact versioned Debian (glibc) tag is listed by Docker Official Image Node and avoids Alpine/musl deviations. Tag by itself is not immutable. **No digest is invented or authorized in this design.**

Official references: <https://hub.docker.com/_/node> ; <https://github.com/nodejs/docker-node/tree/main/22/bookworm-slim>. Proposed G0 (after distinct triple consent) must: (1) authenticate registry and fetch OCI manifest index/architecture child descriptor; (2) confirm `linux/amd64` child digest, sha256 digest over exact served descriptor, trusted registry and image config; (3) inspect Node 22.23.3 / OS release/architecture and recorded Corepack package; (4) pin *that exact child manifest* and capture index digest separately; (5) verify pnpm package tarball integrity and lockfile and compare all used build inputs; (6) produce final runner image digest plus build attestation/SBOM/owner-approved execution plan. No `latest`, no floating `node:22`, no digest prefix, no unverified third-party mirror.

**Required lock SHA-256 (A50 prior real Windows C01 receipt):** `8c30be5af6c9a868bf5b24ff3b2ced9ca0b976e66c3366a8e78d9df8229c39ef`. Compare actual file bytes both outside and inside future image; no lock rewrite. Exact root `pnpm-workspace.yaml` and all dependency lock inputs in source/tree inventory. Build and tests are separate approvals: G0 image preparation is not G4 execution.

## 3. Linux / C01 compatibility contract

- Node 22.23.3, pnpm 10.34.7, `tsx`, and `tsc` prereferences match earlier Windows DB-free A50 version numbers, **not** proof Linux binary/test compatibility.
- Source `artifacts/api-server/package.json` defines `test:integration` as `node --import tsx ./test/run-tests.ts integration`. C01 `run-tests.ts` (Git blob `da4188446aba4696f97eb7831fee0cc5824d212f`) uses `spawn(process.execPath, ['--import','tsx','--test','--test-concurrency=1',...discoveredTests], {stdio:'inherit'})`. Nested process inherits stdout/stderr, environment and signal domain; wrapper must capture outer process and child-process termination and retain whole stream.
- Test discovery (Git blob `dd427fdafa92c089e2edad704079d81945c4b1c1`) traverses `artifacts/api-server/test` recursively for `*.integration.test.ts`. G0 must freeze the **entire** discovered file list and SHA, including S2, before any G4; list count UNKNOWN until exact checkout enumeration. No test-name skip or filter.
- S1 (`test-database.ts`, blob `31a24e5d65ddbdf4f07b4e2ce7fa086674e2ecf6`) drops/recreates exact `tm_test_*` schema and applies migrations. S2 (`replit-schema-catalog-reconciliation.integration.test.ts`, blob `6c6bd054e0f6affd5d07e63ee396f5a14b423fc4`) creates three `tm_catalog_test_<16hex>_{dev,prod,fresh}` DBs and drops them `WITH (FORCE)`. These are destructive G4 fixture effects; separate S1 and S2 signed grants are essential.
- The S2 source spawns `lib/db/scripts/compare-replit-schema-catalogs.mjs` with its **own** child-specific `SCHEMA_COMPARE_*` URLs for newly created ephemeral DBs. Forbid such variables in launcher parent but permit *the test's verified child-generated scratch values*. Reject any inherited foreign endpoints.
- Other Linux risks: case-sensitive filenames/imports unlike Windows; `/bin/sh` root preinstall script; TS `tsx` import semantics; native addon/ABI and optional dependencies; locale, timezone, symlink path normalization; Unix permissions; Node test runner stdout on process signals; JS coverage/cache writes; `jsdom`/OS packages. Determine empirically **only after signed G0/G4**; no Windows PASS is a Linux PASS claim.

## 4. Phase and STOP ownership

All G0/G1/G2/G3-S1/G3-S2/G4/G5 are independent gates requiring A00/HQ, A20 and operator attestations to the same immutable plan SHA; expiration and exact resource IDs required. A24 checks PG16 readiness, A60 independently checks provenance and results. A50 cannot issue approvals. G2 observer catalog/physical certificate must match G1's new cluster, PGDATA volume identity, Docker context, namespace/PID, exact port/role/DB/schema. If source/image/lock/role/endpoint/approval/certs drift: **STOP without Docker/SQL/test and preserve evidence**. G5 cleanup is separate authorization; no `docker system prune`, host PostgreSQL restart, generic `down -v`, or guessed DROP.

**Decision:** Dockerfile is a **suitable conceptual starting point but NOT approved build input** until Node digest/provenance, build context, Corepack trust, write path audit, source attestation and G0 triple approval resolve. `R23H_RUNNER_DESIGN_READY` means documentation complete, never executable permission.
