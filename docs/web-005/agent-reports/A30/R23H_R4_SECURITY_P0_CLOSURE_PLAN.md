# WEB-005 — A30 / R23H-R4 — SECURITY P0 CLOSURE PLAN

**Task:** WEB-005-T030-R23H-R4-P0-CLOSURE  
**Date:** 2026-10-18 (Europe/Warsaw)  
**Role:** A30 / Security Coordination V2; subordinate specialist A31  
**Audited C01 code baseline:** fa3261b2c9510e110ac9eba21726812d3401a525 (PR #60, draft/unmerged in A60 R3).  
**Mode:** SECURITY DESIGN, READ-ONLY ANALYSIS, documentation-only publication. NO Docker/SQL/OCI pull/build/tests/migrations/merge/deployment/phase GO.  
**Baseline verdict:** SECURITY_BLOCKED / G0_NO_GO / G1–G5_HOLD / C01_INTEGRATION_HOLD / C02_HOLD / RELEASE_NO_GO / SWARM006_HOLD.  
**Independent acceptance owner:** A60; decision and operational approvals belong only to A00/HQ, A20 and named Windows operator in their scoped capacities.

## 0. Purpose, non-goals and accounting

This R4 plan maps each of the seven A31 P0 findings to a concrete implementable safeguard, named implementer, tamper-resistant proof, PASS/FAIL and phase dependency. It is NOT a repeat of the A31 R2/A30 R3/A60 R3 audits and does not assert that safeguards have been installed or proven. A30 coordinates and can recommend closure only after independent A60 review. No phase is authorized by this document.

**Defect classification:**
- P0-31-01 documentary omission of the fourth S2 DB is **SOURCE_CONTRACT_CORRECTED** by A22 R3, but P0-31-01 **execution/admission risk OPEN** until implementation and consent are proven.
- P0-31-02 through P0-31-07 are **OPEN**.
- A60 R3 consolidated **7 OPEN P0 / 7 OPEN P1 / 3 OPEN P2**, including one additional custody P1 and one Windows G: mirror P2; historical duplicate IDs are aliases, not additive vulnerabilities.
- Distinguish SOURCE_DESIGNED, SOURCE_IMPLEMENTED, STATIC_VERIFIED, AUTHORIZED, RUNTIME_VERIFIED, QA_ACCEPTED and CLOSED. A source-only PASS never implies runtime PASS.
- G0 itself has independently scoped source/OCI verification, image pull and build sub-actions. Pre-build output image digest is inherently unavailable until an authorized build; G0b must attest its resulting immutable digest before G1.

## 1. P0 closure matrix — implementation mechanism and independent acceptance

### P0-31-01 — Four dynamic S2 DBs and two forced Drizzle pushes
- **Implementer/approver:** A20 canonical runplan and DB permissions; A22 exact SQL effect mapping; A50 runner inventory; A24 readiness; A23 evidence custody. A31 specialist review, A60 independent acceptance. A00/HQ+operator sign runtime consents.
- **Mechanism:** freeze exactly five logical contexts: one operator-provisioned S1 BASE DB with fresh tm_test_<nonce> and auxiliary schema names, three fixture-generated tm_catalog_test_<16hex>_{dev,prod,fresh}, one tm_drizzle_schema_test_<32hex>. Define distinct phase scopes G3_S1_SCHEMA, G3_S2_CATALOG_GO, G3_S2_DRIZZLE_FORCE_GO and G4_TEST_ONCE; sign fixture-internal DROP DATABASE WITH (FORCE) as a G4 effect. Exact source calls Drizzle Kit push --config ./drizzle.config.ts --force --verbose twice. Pin C01 config, empty push schema, pnpm-lock resolution (drizzle-kit 0.31.10) and installed binary identity. Require attributed SQL effects for migration DDL, guarded index cleanup and each push; no runtime NOOP inference from static filter intent.
- **Evidence:** immutable five-context source/statement inventory; hashed fixture/config/lock/binary receipt; signed distinct authorization objects; generated DB create/owner/OID ledger; two child-process argv/cwd/exit and sanitized SQL effect envelopes; independent A22+A31 review and A60 findings.
- **PASS:** every executable write/auto-drop and both force pushes bound to correct disposable owned targets and exact signed scopes; full G4 receipt confirms effects and no unapproved objects modified. **FAIL:** omitted S2b, inferred safe force/no-op, fewer test files without approved partial-scope labeling, unsigned teardown, wrong target or unexpected SQL. **Phases:** pre-G0 source contract can be accepted; remaining operational P0 requires G2/G3 and G4.
- **Current:** documentary 4-DB omission corrected; OPERATIONAL OPEN.

### P0-31-02 — Physical target identity / Windows native PG separation
- **Implementer:** A20 PG architecture + A24 host/PG identity evidence; A21 topology; A23 custody; A31 independent technical review; A60 acceptance.
- **Mechanism:** future G1 creates a brand-new dedicated volume/PGDATA in one disposable Linux PG16 container, on a signed Docker context. G2 binds actual container ID, image digest, PGDATA mount/volume, namespace inode/PID and PostgreSQL system_identifier to the authenticated SQL endpoint and DB OIDs. Native Windows postgresql-x64-16 PID/service/listeners 127.0.0.1:5432 and ::1:5432 must remain unchanged relative to operator baseline; no test attempt connects to Windows. Invalidate certificate upon container restart, context/namespace/image/volume/port drift and immediately before any destructive G4 step.
- **Evidence:** signed G1 pre/post Windows host observer, exact no-host HostConfig and namespace/volume provenance, G2 PG system identifier plus SCRAM authenticated catalog probe in certified disposable instance and negative foreign-target canaries, cert expiry/renewal chain.
- **PASS:** physical and logical identity join on same signed run ID and no native Windows touch. **FAIL:** missing PG system ID, relying on pg_isready/localhost/test name, host port or mount, unexplained Windows change, stale certificate. **Phases:** cannot CLOSE pre-G0; G1+G2 runtime proof and G4 recheck required.
- **Current:** OPEN.

### P0-31-03 — S1 CASCADE resets and auxiliary migration schemas
- **Implementer:** A22 SQL scope + A20 DB authority + A24 preflight; A31 checks SQL edge cases; A60 independent acceptance.
- **Mechanism:** use fresh operator-provisioned base test DB (proposed web005_c01_test_<nonce>), unique tm_test_<nonce> and explicitly enumerated helper schemas (including rollback/marker-drift test cases), never reusable C01 default tm_test_access. Verify schema absent, DB owner/exclusivity and empty/allowed dependencies BEFORE any DROP SCHEMA ... CASCADE; freeze migrations 0001–0028 plus specialized 0030/0031 and transaction boundaries. Fail closed if foreign schema/dependency or source drift. Sign S1 setup, destructive teardown, migration scope separately from S2. No presumed transaction rollback of pre-transaction CASCADE.
- **Evidence:** static exact-schema SQL ledger, G2 authenticated DB/owner OIDs and preexistence receipts, phase-specific G3_S1_SCHEMA consent, G4 pre/post schema/object diff with true exits and unexpected-cascade STOP.
- **PASS:** only explicitly run-owned fresh schemas and related scoped objects touched. **FAIL:** existing foreign schema, wildcard/reset default, unexpected dependent object, missing auxiliary schema inventory, missing consent. **Phases:** static scope can be accepted pre-G0; operative P0 stays OPEN until G2/G3/G4 proof.
- **Current:** OPEN.

### P0-31-04 — Cluster-wide CREATEDB, force-drop and collision/failure path
- **Implementer:** A20 effective grants/ownership and DB isolation; A22 SQL semantics; A31 specialist lead; A24 actual owner/OID checks; A50 failure-safe execution controls; A60 acceptance.
- **Mechanism:** exact unchanged C01 uses ONE effective TEST_DATABASE_URL principal for S1, S2-CATALOG and S2-DRIZZLE: do not falsely assert split S1 NOCREATEDB and S2 CREATEDB users. The principal requires LOGIN+CREATEDB (cluster-wide), but NO SUPERUSER/CREATEROLE/BYPASSRLS/REPLICATION or privileged membership; allow this only inside a genuinely new, uniquely owned, empty disposable PG16 cluster. New DB names are not authorization: capture CREATE success, OID, owner, cluster system ID for all four S2 databases. Enforce **PRE-DROP ownership/creation guard**: a failed or unconfirmed CREATE must not be followed by FORCE DROP. Check required SQL rights and inability to drop foreign, maintenance or base DBs. Revoke/dispose role according to independently signed lifecycle; revocation of CREATEDB alone does not revoke DB ownership.
- **Implementation-choice gate:** current C01 fixture may issue an after() DROP after CREATE failed. Monitoring or post-hoc logging alone CANNOT prevent that SQL. The engineering owner must select and prove either (A) a reviewed fixture/source change that checks positive CREATE+OID+owner before any DROP (new C01 SHA, new full source/QA review), OR (B) an independently enforced SQL admission/proxy boundary that rejects unowned DROP even if fixture code attempts it (implemented and separately approved). Empty disposable cluster is mandatory in either design; it alone mitigates blast radius but is not proof of an enforced pre-DROP guard. No choice has been implemented/authorized by this plan.
- **Evidence:** A31 structured positive/negative specification for CREATE success/failure/name collision/preexisting foreign DB/role membership/force termination, signed role/ownership and base+4 event ledger; static implementation diff + later scoped G2 effective grants and G4 negative attack-path receipts, plus exact G5 remaining owned-resource list.
- **PASS:** demonstrable deny-before-SQL for failed/unowned CREATE and foreign target, four positive legitimate paths, no widened privileges or unknown orphan deletions; all operations in attested cluster. **FAIL:** DROP based only on prefix/UUID, shared PG instance, accidental admin access, cleanup after failed CREATE or unsupported role separation claim. **Phases:** model can be signed pre-G0; complete closure requires G2 and G4.
- **Current:** OPEN / P0 critical.

### P0-31-05 — Inherited DSNs / unbuilt fail-closed launcher
- **Implementer:** A50 executable launcher and child/process contract; A31 security model; A20 attested DB target; A24 readiness; A60 independent acceptance.
- **Mechanism:** sealed G4 launcher denies untrusted parent DATABASE_URL, TEST_DATABASE_URL, all relevant PG*/libpq overrides, SCHEMA_COMPARE_* and untrusted dotenv/service or loader inputs. Construct allowlisted child env afresh, from authenticated signer/runplan, exact C01 source/lock and G2 physical certificate, then inject TEST_DATABASE_URL internally pointing exclusively at namespace-local 127.0.0.1:55432. Source-reviewed S1-derived DATABASE_URL and S2a child-generated SCHEMA_COMPARE_* and S2b child-generated DATABASE_URL may exist only for their attested scratch targets. Reject executable argv/entrypoint/config drift and any unauthorized second attempt, skip, retry or host bind.
- **Evidence:** code+tests for signer verification, no target contact on deny, exact source/env variable inventory, canary negative matrix, immutable launcher/source/image digests and G4 actual before-SQL preflight receipt; synthetic secrets not printed; independent A31/A60 review.
- **PASS:** a forged/missing consent, foreign env/DSN, dotenv or physical-cert drift yields STOP before ANY connection or mutation, and a signed disposable target follows exact allowed fixture behavior. **FAIL:** inherited connection variable usable, fixture child can escape target, bool/URL acts as approval, logger leaks secret, partial tests labeled full. **Phases:** launcher source/design independently reviewable pre-G0; live admission/security requires G4 after G1/G2.
- **Current:** OPEN.

### P0-31-06 — Docker Option A canonical, OCI provenance and runtime isolation
- **Implementer:** A21 canonical topology; A20 signed current plan; A23 image/source provenance; A24 Compose/runtime proof; A60 acceptance; A00 source authority.
- **Mechanism:** freeze one R23H Option A compose YAML with SHA256 3766de4d47c83e4bc9cb77774f627b5af9b94423c56e6ad3fdf83ad3bb9e5e70 as A31/A60 source reference, *subject to rehash at approval*. pg16 network_mode:none, runner network_mode:service:pg16, no ports, no bridge, no privileged/host bind/docker.sock, listener and PGPORT 55432 and distinct secrets. Explicitly mark old R23G host-published Option B DEPRECATED/DO_NOT_RUN. Freeze exact platform-specific OCI descriptor/arch, Node base digest, C01 tree/lock; runner output digest verified after independently approved build, before G1. No mutable tag fallback. Any Compose override must be signed as part of full effective configuration; otherwise deny.
- **Evidence:** signed runplan SHA and immutable Compose receipt, source-lint/normalization and unsafe-key rejection matrix, OCI registry descriptor/index/platform attestations, reproducible image build provenance, G1 actual HostConfig/network/volume/port inspect and G2 endpoint identity, Windows no-touch proof.
- **PASS:** exact frozen Option A effective config and genuinely isolated instance verified; no old topology accepted. **FAIL:** port publish, host network/bridge, untrusted image/tag, unreviewed override, reused volume, missing runner digest (when due). **Phases:** canonical selection/old-option retirement and static checks can be completed pre-G0; OCI identity at separately scoped G0, runtime isolation G1/G2.
- **Current:** source topology selected; operational P0 OPEN.

### P0-31-07 — Enforcement of write authorization and phase boundaries
- **Implementer:** A00/HQ owns policies and decision; A20 + named Windows operator independently sign execution scopes; A50 implements verifier/launcher; A24 gate preflight; A23 signs provenance; A60 independently validates; A30 coordinates.
- **Mechanism:** deny by default. Separately authenticated, unexpired consents must bind operator identity, phase and action code, full normalized Compose/runplan digest, exact C01 SHA, image/base/runner identity when available, Docker host/context fingerprint, namespace+PGDATA cert when created, effective test principal, immutable source inventory, resource/run nonce and exact cleanup ID scopes. For G3 split G3_S1_SCHEMA, G3_S2_CATALOG_GO and G3_S2_DRIZZLE_FORCE_GO; G4_TEST_ONCE covers fixture auto teardown and true one-run budget; G5 requires new exact-ID separate approval. A URL or boolean/JSON string is not proof of signer authority. Enforce in pre-SQL launcher plus independent operator guard, prevent entrypoint/profile/environment override; default profile inert. No owner self-approval, no retroactive scope widening.
- **Evidence:** signed consent specimens, trust-anchor/expiry verifier source and negative cases (wrong actor/plan/source/image/context/phase/resource/time, withheld signature and forced retry); separately authorized G0/G1/G2/G4 denial/allow receipts; A60 source and true execution-signature QA.
- **PASS:** every attempted unauthorized command rejected *before side effect*, authorizations nontransferable across phases, no bypass via Docker entrypoint, shell/Compose override, generated data or CI wrapper; independent A60 acceptance. **FAIL:** paper checklist only, self-signed boolean, blanket GO, unbounded delete, missing negative proof. **Phases:** policy and static verifier can be reviewed pre-G0; comprehensive P0 remains OPEN until phase-specific enforcement evidence.
- **Current:** OPEN.

## 2. A31 specialist dispatch — R4 independent technical contract

**Recipient:** A31 — PG16 Security Review & SQL Isolation; **owner A30**, recipients A20/A22/A24/A50/A60. **Status at publication: DISPATCH, response pending.** Exact source C01 sha above; do not run SQL, Docker or tests.

A31 SHALL deliver an independent read-only design review addressing:
1. **CREATEDB:** verify one effective C01 test principal and exact permissions/role memberships; identify allowed/unallowed database ownership/CREATE/CONNECT and session termination rights, default template/public schema rights; show minimal grants without pretending per-prefix CREATEDB; model grant lifecycle and why revoking CREATEDB does not eliminate existing owned databases.
2. **FORCE DROP & failure:** line-specific CREATE, teardown and finally/after flows for all 4 scratch DBs; determine whether fixture tries DROP after CREATE failure; evaluate owner/OID guard feasibility and choice A source change vs B external SQL admission, including required new SHA/review and no safe claims before implementation.
3. **Collision matrix:** existing same-name foreign DB, CREATE duplicate error, partial CREATE, OID reuse, interrupted teardown, long sessions, FORCE unable to terminate, stale PG identity, forbidden base/maintenance DB; define atomic and cross-process safeguards and STOP/CLEANUP_HOLD branches.
4. **DSN inheritance:** exact env of launcher, S1, S2a child SCHEMA_COMPARE_*, S2b child DATABASE_URL, libpq PG* service/passfile, dotenv/tsx/Drizzle loader, shell env/working directory; explain deny-before-connection controls and permitted fixture-only exceptions.
5. **Acceptance artifacts:** risk-by-risk PASS/FAIL negative-test matrix, static vs G0/G1/G2/G4 proof mapping, source hash references, implementation blockers and residual risk; A31 must NOT approve phases and must return explicit BLOCKED where evidence is missing.

**A31 output requested:** R23H_R4_A31_PRIVILEGE_AND_DESTRUCTIVE_PATH_REVIEW.md, immutable link + SHA256 + line-specific code/SQL references + a zero-execution declaration; submit to A30 for consolidation and A60 independent review. If not published, status remains PENDING rather than fabricated delivery.

## 3. A50 fail-closed launcher — mandatory engineering acceptance contract

### A50 implementation checklist (proposed; NOT implemented)
- **Input trust:** only operator-provided authenticated, phase-scoped approval object. Verify expiry, signer roles, canonical bytes/signature and immutable plan digest; no 'APPROVED=true' environment bypass. G0 input digest before build; G0b produced runner digest after build. Reject unexpected container/image/source/lock/config/Compose override.
- **Environment:** start from empty allowlist, never merge process.env wholesale. Neutralize DATABASE_URL, TEST_DATABASE_URL, PGHOST/PORT/DATABASE/USER/PASSWORD, PGSERVICE/FILE, PGPASSFILE, PGOPTIONS, PGCONNECT_TIMEOUT, SCHEMA_COMPARE_* and dotenv/loader overrides; only verified file-based disposable secret; no admin secret in runner. Source-authorized child values are strictly bound to owned target DB.
- **Physical target:** require signed, unexpired G2 PG system_identifier + namespace/container/image/volume/port identity and matching latest G1 operator attestation; revalidate immediately before SQL and after any restart/drift; deny if Windows target conceivable or no matching identity.
- **SQL authorization:** pre-check G3_S1_SCHEMA, G3_S2_CATALOG_GO, G3_S2_DRIZZLE_FORCE_GO, and G4_TEST_ONCE; preserve full 36 discovered integration entrypoint inventory and both Drizzle force calls; no test-name filter/skips/bypass/rerun unless separately signed. Guard CREATE vs DROP causal ownership with chosen independently approved prevention mechanism, not merely end-of-run logs.
- **Write boundary:** run as nonroot with read_only:true and narrow tmpfs/private scratch, no PGDATA/admin secret/Docker socket/host mounts or writable workspace. A50 must inventory actual package/Drizzle/tsx/pnpm child write paths, UID/capacity/cache relocation; any unexpected write -> STOP, no blanket read_only:false or host bind.
- **Observability:** source/runplan/env fingerprints (redacted), before/after host/DB resource ID ledger, real parent/child exit codes, first failing TAP assertion, two Drizzle argv/cwd/exit/effects receipts, all 4 DB CREATE/owner/OID/teardown events. Raw logs local restricted scratch; redacted Drive report + remote SHA and ACL review; never print DSNs/passwords.
- **Failure semantics:** reject BEFORE connecting for all untrusted inputs; bounded timeout and no automatic retries; preserve evidence and stop on unexpected SQL, foreign DB, impossible cleanup provenance; operator-owned G5 separate approval.
- **Negative acceptance test catalogue (future authorized runtime only):** tampered signer, expired phase GO, wrong C01 SHA, wrong image, changed Compose port/netns, foreign DATABASE_URL, inherited PGHOST/PGSERVICE, SCHEMA_COMPARE poison, untrusted dotenv, stale PG system_identifier, preexisting tm_test schema, S2 duplicate name, S2 CREATE denied then teardown, DB owner mismatch, unapproved Drizzle --force effect, filesystem EACCES/out-of-scope write, missing TAP/truncated logs, post-restart cert drift and cleanup orphan.
- **Outputs:** A50 shall publish source candidate/diff and exact SHA, signed admission spec, write-path census, safe denial-test receipts when separately authorized, then hand to A31/A24/A60; design-only docs alone do NOT close P0-31-05/07.

## 4. Evidence layers / what can be checked in each phase

| Timing | Permissible verification under separately applicable authority | Findings meaningfully addressed | Not enough to claim |
|---|---|---|---|
| **Pre-G0 / READ-ONLY** | Freeze BASE+4 statement inventory and hashes; independent A31 privilege/failure-path model; hash/compare signed Option A and quarantine B; offline inspect launcher implementation + negative-test design, approval-verifier policy, owner manifest | P0-31-01 source gap documentary CLOSED; static portions 03/04/05/06/07 | No entire P0 operational CLOSED; no G0 authorization |
| **G0 / explicit sub-approvals** | Verify trusted OCI PG/Node manifests and platform; frozen clean C01+lock and dependency provenance; narrowly permitted image pull/build; G0b attests actual runner digest; Compose parser normalization when separately authorized | Supply-chain half of P0-31-06, input provenance for 05/07 | No PG/Windows physical identity, effective roles or SQL safety |
| **G1** | Operator creates certified fresh empty owned volume/container only, records HostConfig/ports/network/mounts, Windows-native baseline unchanged | Physical half 02/06, resource uniqueness 04/07 | PG logical cluster identity/role grants still unverified |
| **G2** | Approved SELECT-only authenticated PG observations plus operator out-of-band PGDATA system_identifier, namespace/OID/ACL linkage; SCRAM positive/negative auth | 02, 03 initial S1 owner check, 04 effective CREATEDB/owner/cluster, 05 cert preconditions | No source-SQL execution safety or FORCE teardown proof |
| **G3 separate SIGNED SCOPES** | Approvals only: S1, S2-CATALOG, S2-DRIZZLE-FORCE with actual identity and mutually bound signature scope | P0-31-01/03/04/07 consent coverage | Approval alone is not executed effect PASS |
| **G4 — one full suite** | After full gate chain, sealed launcher preflight; 36 source-discovered integration entrypoints unmodified; four S2 DBs, 2 forced pushes, explicit internal teardown, negative guard receipts, real DDL and TAP/exit | Operational proof 01/03/04/05/07; G2/Windows identity recheck of 02/06 | Partial/filtered suite or no-op assumption cannot be full PASS |
| **G5 separate approval** | Exact-ID residual cleanup (not G4 internal fixture DROP), before/after resource ledger, private logs + sanitized cloud readback | Orphan/cleanup residual of 03/04/07 | Generic prune or name-based deletion prohibited |

**Closure phases:** No full P0 should be marked CLOSED before G0 merely from this design. The documentary subfinding P0-31-01 source inventory is CLOSED; P0-31-06 canonical Option A selection is SOURCE_VERIFIED but not runtime isolation; P0-31-07 policy may become STATIC_VERIFIED after implementation review, never whole threat closed. P0-31-02 needs G1/G2 with G4 renewal; 03/04 need G2, signed G3 and exercised G4/cleanup; 05 requires G4 negative/positive; 06 needs G0 provenance and G1/G2 physical; 07 requires actual action-level denial enforcement, not paper consent.

## 5. P1/P2 follow-up register — A60 R3 counts

**P1 OPEN 7**, source cohort six A31 plus one A60 late custody gap:
- P1-31-01 PG bootstrap admin secret persists mounted; A20/A21 with A30 residual decision before G4.
- P1-31-02 runner nonroot/read-only tmpfs, transitive cache/write census; A50/A24 before G4.
- P1-31-03 pg_isready cannot prove SCRAM/PG identity; A20/A24 G1/G2.
- P1-31-04 migrations 0029–0031, trigger/dynamic SQL and two forced pushes, static ledger vs runtime effect; A22/A31/A60.
- P1-31-05 raw TAP/Drive redaction and permissions; A23/A60 G4/G5.
- P1-31-06 Docker context/volume freshness not guaranteed by nonce alone; A24 G1.
- P1-R3-CUSTODY: latest A23 frozen custody index predates newly delivered A30 R3 report; A23 append-only addendum and independent A60 verification.

**P2 OPEN 3** per A60 R3: P2-31-01 Docker operator/daemon privileges and socket/host binds; P2-31-02 resource/seccomp/caps compatibility; P2-R3-GDRIVE-MIRROR Windows G: mirror sync not attested (cloud raw byte hash != local sync). P2 never waives P0/P1 stop rules.

## 6. A60 independent acceptance requirements and rejection rules

A60 should inspect **each exact source hash and per-risk claimed closure** against an A23 custody manifest, not merely accept a summary. Minimum independent bundle:
1. Source chain: exact C01 SHA, test-file inventory, A21 normalized Option A YAML SHA, A22 R3 SQL SHA, A31 R4 specialist review and signed A50 launcher candidate SHA (if produced).
2. Authority chain: A00/HQ, A20 and Windows operator authentic signers for each action/phase with digest/expiry and negative signature tests; no inheritance between G3 S1, S2a, S2b, G4 auto-teardown and G5.
3. Data-plane chain: G1/G2 same Docker context+namespace+container+volume+system_identifier+SCRAM principal+role/DB OID fingerprints; native Windows PostgreSQL unchanged.
4. SQL chain: BASE+4 run-owned ledger, actual successful CREATE before any authorized DROP, ownership proof, two Drizzle child actions and attributed SQL effects, S1 auxiliary/CASCADE/migrations; treat failed CREATE then DROP attempt as STOP/CLEANUP_HOLD.
5. Runtime chain: expected and negative rejection receipts, full 36-entrypoint discovery, unfiltered true exit, stdout/stderr and first root-cause failure, redaction and verified cloud hashes; API_SUITE_PASS distinct from DIAGNOSTIC_EVIDENCE_PASS.
6. Privacy/rollback chain: bootstrap secret not in runner, write-path audit, private raw data, cloud sanitized readback, G5 exact object IDs and signatures, Windows native no-touch.

**PASS per risk:** documented safeguard is implemented in exact attested source/image and independently observed under approved relevant gate with positive AND relevant negative evidence; no unmet dependency, unapproved write or missing authorization; A60 explicitly records accepted source+runtime receipts.  
**FAIL/BLOCKED:** missing object OID, image/cluster identity, signature, malformed or foreign DSN accepted, unknown force SQL, executable bypass, broad cleanup, mutated native Windows PG, or unavailable evidence; never conflate NOT_EXECUTED with PASS.  
**QA outputs requested:** A60 risk closure table with status OPEN / STATIC_VERIFIED / RUNTIME_VERIFIED / CLOSED and exact receipt references; no authorizing G0–G5; A00 owns approvals.

## 7. Ownership/handoff and recommended implementation order

**Order (subject to A00 decision):**
1. **Documentation+source contract (READ-ONLY):** A20+A22 freeze R3 BASE+4 and permissions, A21 freeze Option A and retire B, A31 review destructive/role/env model, A23 immutable manifest, A24 signable phase/check/STOP protocols, A60 pre-G0 source acceptance review.
2. **Engineering source candidates only after separately assigned work:** A50 sealed launcher, effective permission/DSN/env/write-boundary controls and CREATE-before-DROP enforcement choice; A20 adjusts runplan/roles. Any C01 fixture change requires a new commit SHA, source-scope reconciliation, full A31/A60 re-review, never silently reuse fa3261....
3. **Independent scoped G0 consideration by A00/HQ:** after source review and actual necessary signatures. G0 verification/pull/build separate activities. No automatic advance G1/G2.
4. **Future operator-driven G1/G2/G3/G4/G5** only with their own approvals, newly produced evidence and A60 gate review; preserve native PG Windows.
5. **A30** compiles closure recommendations; **A60** accepts evidence; **A00/HQ** explicitly decides GO/HOLD per stage.

**Dispatch targets:** A00, A20, A22, A24, A50, A60 and A31; A23 receives evidence-control cc. GitHub issues provide shared coordination; they do not prove independent ChatGPT thread receipt.

## 8. Immutable source references

- A60 R23H-R3 final QA: https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/R23H_R3_FINAL_QA_VERDICT.md (Git blob fd8c735360fa8e8d4c78d4a82e09f4e21988fe93).
- A30 R23H-R3 final security: https://drive.google.com/file/d/1KisgPhL7Yh-L8GpoaskEg99qAm8rJlgF/view (raw 20,171 bytes, SHA256 7d9a55d4f17744e838083bf187f31e3def8d6dbf88a215da2baa1c17f96ce1a2).
- A31 R23H-R2 independent audit: https://github.com/C8LyNn/aplikacja-turnieje/blob/43eb42e1461bb881ad8631af245187b779b8cbf4/docs/web-005/agent-reports/A31/R23H_R2_SECURITY_REVIEW_31.md.
- A22 R23H-R3 final SQL: https://github.com/C8LyNn/aplikacja-turnieje/blob/1e025d28253f0ce6e541f034f9eb3b99ff7151ec/docs/web-005/R23H_R3_SQL_FINAL_CONTRACT.md.
- A21 R23H canonical Docker: https://drive.google.com/file/d/10wQkrmUaw0zxUYNvTYpRYXdLBlU1MiCq/view.
- A24 R23H-R3 readiness: https://github.com/C8LyNn/aplikacja-turnieje/blob/b829968584d76ecc777c7d4c785748ba07036740/docs/web-005/agent-reports/A24/R23H-R3/R23H_R3_G0_G5_READINESS_FINAL.md.
- A50 R23H-R2 runner recovery: https://drive.google.com/file/d/1Jcpgs3vxCJ1hpqJ_pBvSChrorRiA0AS4/view.
- A23 custody index: https://github.com/C8LyNn/aplikacja-turnieje/blob/354ab79ef6f00a8fb8485ac6d2eaf6a9dbaf7bd0/docs/web-005/agent-reports/A23/R23H-R3/R23H_R3_CANONICAL_EVIDENCE_INDEX.md.

## 9. A30 final disposition

**Deliverable:** R23H_R4_SECURITY_P0_CLOSURE_PLAN.md / DOCUMENTATION READY; seven P0 remain OPEN.  
**Decision:** SECURITY_BLOCKED; G0_NO_GO; G1–G5 HOLD; no security GO granted.  
**Closure recommendation:** implement source controls and obtain independent A31/A60 signed evidence in future explicitly authorized work before changing any P0 status.  
**Execution declaration:** no Docker, SQL, test, migration, image pull/build, permission grant, merge or deployment performed. Documentation-only GitHub publication/dispatch does not alter application/game/runtime code.
