# WEB-005 — A20 / R23G-R2 — PG16_RESOURCE_AND_PORT_MANIFEST.md

**Task:** `WEB-005-T020-A20-R23G-R2`; **Date:** 2026-10-17 Europe/Warsaw; **Scope:** read-only design and source verification; **Approvals:** A00/HQ+A20+operator separately for G0–G5; **Execution:** `PG16_EXECUTION_NOT_AUTHORIZED`.

## R2 corrections / override (normative over historical R23G text)

**R2 authoritative additions:** PG image candidate official `postgres:16.15-trixie`, `linux/amd64` manifest `sha256:75adc2a65806c96bc0e59030230bfe3f1c1b0d6d8f8181a8913e2b8b53bdc166`; index digest `sha256:ca0bd484cb98bf4b24eb1010e73fb3fcbd6714d240fbc1a10eea5b7dbecb641d` from non-primary full-digest mirror, must check directly with registry before G0 GO. Node22/pnpm10 runner image digest = **PENDING/NOT_BUILT**. Record candidate digest separately from observed pulled manifest: no local image inspected. Manifest add explicit host 5432 PID before/after, Docker context/engine ID, dual container namespace same inode, `55432` inside only, PGDATA Docker volume ID and image/manifest mismatch STOP. No `ports:`, `network_mode:host`, `extra_hosts`, `network:bridge`, host Docker socket, existing PostgreSQL mount. G1 require tested PG bootstrap with SCRAM; G2 separately test password-protected observer. Prefix-based CREATEDB limitation remains. New images and runner build may consume much of reported 68.93 GiB; reserve after real G0 measurement, not R23G snapshot. G0-G5 no consent granted.

---

## Historical R23G baseline (retained verbatim for provenance; contradictions above supersede)

# WEB-005 / A20 / R23G — PG16_RESOURCE_AND_PORT_MANIFEST

**Task:** `WEB-005-T020-A20-R23G-DOCKER-PG16-ISOLATION`; **Date:** 2026-10-17 Europe/Warsaw; **scope:** planned resources only; **approvals:** per-phase A00/HQ + A20 + operator; **status:** `PROPOSED_NOT_CREATED`.

## Owner-observed baseline (not remeasured by A20)

Evidence: [Drive WEB005_DOCKER_FINAL_PREFLIGHT.txt](https://drive.google.com/file/d/1nNSTAcsJWTPyUTm6YGz-oGAOENLTAdW-/view) (384-byte metadata) plus [A00 authored verification](https://github.com/C8LyNn/aplikacja-turnieje/issues/76#issuecomment-6232716514). Docker Desktop 4.95.0, Engine 29.8.2 linux/amd64, WSL 2; active Docker context empty at receipt, zero containers/images/volumes. Windows host PostgreSQL service `postgresql-x64-16` **RUNNING** at `127.0.0.1:5432` + `[::1]:5432`. Host C: 68.93 GiB free. Timestamped observation is **not a G1 reservation**; each data point must be rechecked by operator immediately before any mutating phase.

| Asset / role | Proposed identity / design | Explicit invariants and owner proof |
|---|---|---|
| task `run_id` | `r23g_<utc>_<128bit_nonce>` | Generate once after GO; immutable unique per run; not an existing Docker label |
| Compose project | `web005_c01_pg16_<nonce>` | All resources labelled `com.docker.compose.project` plus explicit `web005.task`, `web005.runid`, `web005.c01_sha`; no other projects touched |
| PG image | `postgres:16@sha256:<APPROVED_DIGEST>` | Owner approves exact **linux/amd64** image digest and matching major 16; mere tag `postgres:16` is insufficient |
| PG container | `web005-c01-pg16-<nonce>` | network_mode=none, no ports/expose host, PID and volume/PGDATA attest after startup |
| DB listener | `127.0.0.1:55432` **inside** shared container network namespace | Not a Windows binding. Runtime `ss`/proc/procfs or equivalent and PG endpoint corroboration |
| Windows 5432 | Windows `postgresql-x64-16` owns `127.0.0.1:5432` and `::1:5432` | **MUST NOT STOP / RESTART / CHANGE / CONNECT / REUSE** |
| PGDATA | named volume `web005_c01_pg16_<nonce>_pgdata` | Fresh Docker volume, never host PostgreSQL data bind, file ownership and mount destination recorded; no wildcard volume deletion |
| PG bootstrap credential | G1-only Docker secret `pg_bootstrap_password` file | Nonempty ephemeral secret with restricted local ACL; never repo/env log; no exposure to test runner |
| DB runner credential | separate `web005_c01_runner_<nonce>` login role, G1-created | NOSUPERUSER, NOCREATEROLE, NOREPLICATION, NOBYPASSRLS; CREATEDB only after independent S2 consent, no rights outside disposable cluster |
| Base DB | `web005_c01_test_<nonce>` | Contains `test` and not `prod`, owned by runner only; new before tests; exact approved name |
| S1 schema | `tm_test_<nonce>` | Exact regex, fresh owner-run schema only; `DROP SCHEMA ... CASCADE` scope limited here |
| S2 databases | `tm_catalog_test_<16hex>_dev`, `..._prod`, `..._fresh` | Generated in test fixture, **actual 16hex unknown until runtime**; authorized prefix+suffix+cluster and only if run-created; `DROP DATABASE WITH (FORCE)` |
| Runner image | `WEB005_RUNNER_IMAGE=...@sha256:<APPROVED_DIGEST>` | Node22/pnpm10, frozen lock and C01 SHA embedded + independently audited source manifest |
| Runner container | `web005-c01-api-<nonce>` ephemeral profile | `network_mode: service:pg16`, no host port, no docker.sock, no prod mounts; inert default command |
| Outbound network | network_mode none | No Docker inter-container bridge/Internet at **runtime**; only shared loopback; image build occurs earlier under separate G0 permission |
| Secret storage | `<OWNER_PRIVATE_SCRATCH>\secrets\` (not Google Drive) | Private Windows ACL, never committed, never sync or screenshot, secure disposal after evidence |
| Redacted reporting | `G:\Mój dysk\ChatGPT\WEB-005\Raporty\PG16_DOCKER_ISOLATION\` | Local path is operator target; Drive write + readback + local mirror hashes must be independently checked |
| Snapshot | disposable new volume snapshot/manifest | Must be obtained after G1 and before G3; no live/user database content in snapshot |

## Port decision / fallback

**Chosen:** host ports = **NONE**. Host Windows remains bound to native PostgreSQL on 5432. Container PostgreSQL listens **55432 in isolated loopback namespace**, runner shares namespace. S2 source guard requires `127.0.0.1` / `localhost` / `::1` and **nondefault port**, so `127.0.0.1:55432` is compatible. No NAT/portproxy, TCP host publishing, DNS, TLS proxy or external Docker network.

**Exception if absolutely required:** `127.0.0.1:55432:55432` host publishing ONLY after a **new distinct triple-approved network exception**, plus Windows netstat/owner PID & firewall proof, no :: or 0.0.0.0 bindings and no impact on 5432. Until exception, STOP fallback attempts.

## Storage and exact-object cleanup constraints

Operator re-checks C: free space and Docker Desktop WSL2 virtual disk footprint at G0; reserve minimum **20 GiB remaining free after forecasted image build/data/log growth** as *proposed owner acceptance threshold* (not an observed guarantee). If insufficient, stop without opportunistic `docker system prune` or pruning others' images. Docker named volume can grow; obtain Docker Engine storage/quota strategy and operator monitoring before tests.

Resource manifest must list **actual ID/hash, created_at, owner/label and pre-run existence=false** per item. Cleanup may remove only IDs on that signed new-resource list, with exact digest/project/runid equality; NEVER use `docker compose down -v` against an ambiguous project or unnamed preexisting volume. Delete application scratch only after redacted Drive readback and independent retention approval; leave native PostgreSQL untouched. Foreign resource => `CLEANUP_HOLD`.

**STOP:** incorrect Docker context, Windows service PID/listener drift, any port 5432 conflict, missing image digest, PGDATA bind outside project volume, namespace mismatch, S2 on shared cluster, extra target DB/schema, credentials in logs, missing triple grant.

**State:** `MANIFEST_TEMPLATE_COMPLETE / RESOURCE_IDS_NOT_YET_ALLOCATED / DOCKER_UNTOUCHED / PG16_EXECUTION_HOLD`.
