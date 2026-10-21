# WEB-005 A50 R23H-R5 — canonical negative-case namespace (SOURCE ONLY)

Fixed baseline C01: `fa3261b2c9510e110ac9eba21726812d3401a525`.
Variant B source commit: record from Draft PR head only; *NOT executed*.

## Collisions corrected

| Canonical ID | Previously overloaded ID | Defined adversarial test | Expected source/launcher STOP | Status |
|---|---|---|---|---|
| `A50-R4-N15-CATALOG-CREATE-COLLISION` | A50 N15 / A24 N15 | Existing catalog name before CREATE | `DATABASE_NAME_COLLISION_BEFORE_CREATE`; NO DROP | DESIGNED / NOT_EXECUTED |
| `A50-R4-N16-AFTER-FAILED-CREATE` | A50 N16 | Lost/failed CREATE after name allocation | no `CreatedDatabaseReceipt`, zero DROP | DESIGNED / NOT_EXECUTED |
| `A31-R4-N15-FORCE-BLOCKED-SESSIONS` | A31 N15 | FORCE cannot terminate active blocker / prepared transaction | preserve error, `CLEANUP_HOLD`, no retry | DESIGNED / NOT_EXECUTED |
| `A31-R4-N16-INHERITED-PROD-DSN` | A31 N16 | Env contains production DATABASE_URL | `STOP_INHERITED_ENV` before any process launch | DESIGNED / NOT_EXECUTED |
| `A24-R4-N16-DRIZZLE-FOREIGN-DSN` | A24 N16 | Child Drizzle DSN points to foreign target | `STOP_UNEXPECTED_CHILD_TARGET` / independent child source audit | DESIGNED / NOT_EXECUTED |

## Other required synthetic-only negative test designs

| ID | Adversarial condition | Expected outcome |
|---|---|---|
| A50-R5-S2-001 | Reused owner/OID after CREATE | no DROP, CLEANUP_HOLD |
| A50-R5-S2-002 | CREATE succeeded, identity SELECT failed | no receipt, no DROP; possible orphan manual G5 |
| A50-R5-S2-003 | DROP owner or OID changed after receipt | no DROP, CLEANUP_HOLD |
| A50-R5-S2-004 | No WEB005_RUN_ID or cluster fingerprint | refuse mutation |
| A50-R5-S2-005 | Drizzle push count/config/target changed | reject G4 admission, preserve traces |
| A50-R5-S1-001 | Existing schema with no marker or different run | refuse CASCADE |
| A50-R5-S1-002 | Auxiliary rollback/marker_drift schema preexists | refuse CREATE and DROP |
| A50-R5-S1-003 | Marker write fails after CREATE | CLEANUP_HOLD, no blind DROP |
| A50-R5-S1-004 | Same-run schema owned by another role | refuse CASCADE |
| A50-R5-S1-005 | Setup fails after a committed migration | preserve incomplete schema, no automatic retry |
| A50-R5-LAUNCH-001 | Any inherited PG*/TEST_DATABASE_URL/NODE_OPTIONS | stop before fork |
| A50-R5-LAUNCH-002 | Missing trust roots or one issuer signature | stop before fork |
| A50-R5-LAUNCH-003 | Duplicate/expired approvals, plan/source drift | stop before fork |
| A50-R5-LAUNCH-004 | Non-atomic replay ledger or stale physical certificate | stop before fork |
| A50-R5-LAUNCH-005 | Wrong Docker physical namespace/host port | stop before fork |
| A50-R5-LAUNCH-006 | Unexpected writable host bind/root user | stop before fork |
| A50-R5-EVIDENCE-001 | Secret/token/URL in verbose child stderr | quarantine, never upload raw |
| A50-R5-EVIDENCE-002 | A SQL ERROR is expected negative assertion with TAP PASS | do not invent first failing test |

**No row represents a passing test.** Safety after state-check-before-DROP still relies on authenticated exclusive cluster writers and A31/A60 review; in-memory receipts and schema comments alone are not cryptographic authorizations.


## R5-R2 / A22 SQLR5 source-of-truth IDs

The original A50/A24/A31 legacy IDs remain above for provenance. For **all new evidence and review reports** use the unique `SQLR5-*` identifiers below. **NO CASE EXECUTED**.

| Canonical ID | Injection / question | Required result | Current result |
|---|---|---|---|
| SQLR5-S2-01 | Foreign/same-role scratch DB exists before CREATE | NAME_COLLISION; no CREATE, no DROP | DESIGNED / NOT_EXECUTED |
| SQLR5-S2-02 | CREATE rejected | CREATE_AMBIGUOUS/HOLD (conservative) | SOURCE-GUARDED / NOT_EXECUTED |
| SQLR5-S2-03 | Lost CREATE acknowledgment after server commit | CREATE_AMBIGUOUS, zero FORCE DROP | SOURCE-GUARDED / NOT_EXECUTED |
| SQLR5-S2-04 | CREATE succeeded, catalog SELECT fails | CREATE_AMBIGUOUS, orphan G5 HOLD | SOURCE-GUARDED / NOT_EXECUTED |
| SQLR5-S2-05 | OID or owner/role OID mismatches receipt | PRE_DROP hold | SOURCE-GUARDED / NOT_EXECUTED |
| SQLR5-S2-06 | Same-role replacement/OID reuse/foreign writer | STOP by external exclusive-writer observer | EXTERNAL_P0_PENDING |
| SQLR5-S2-07 | FORCE blocked/ambiguous SQL reply | DROP_ATTEMPTED, CLEANUP_HOLD, no retry | SOURCE-GUARDED / NOT_EXECUTED |
| SQLR5-S2-08 | dev confirmed, prod ambiguous, fresh not attempted | independent 3-slot ledger; zero further destructive operations | SOURCE-GUARDED / NOT_EXECUTED |
| SQLR5-S1-01 | Existing schema even with copied COMMENT | HOLD; no CASCADE | SOURCE-GUARDED / NOT_EXECUTED |
| SQLR5-S1-02 | Changed S1 OID / owner OID | no CASCADE; durable receipt match | SOURCE-GUARDED / NOT_EXECUTED |
| SQLR5-S1-03 | COMMENT or observer failure after CREATE | CREATE_AMBIGUOUS, hold orphan | SOURCE-GUARDED / NOT_EXECUTED |
| SQLR5-S1-04 | Cross-schema dependency CASCADE hazard | source partial SQL scanner + independent exhaustive owner closure | P0_PENDING |
| SQLR5-CTX-01 | Same localhost and role, wrong system identifier | signed G2 physical-attestor mismatch STOP | P0_PENDING |
| SQLR5-CTX-02 | Inherited PG* / DATABASE_URL / NODE_OPTIONS | STOP before fork; test-children receive allowlisted DSN | SOURCE_GUARD_PARTIAL / NOT_EXECUTED |
| SQLR5-DRZ-01 | First or second FORCE push emits public DDL | transcript quarantine + signed independent SQL witness | SERVER_WITNESS_PENDING |
| SQLR5-DRZ-02 | Installed Drizzle CLI/config/lock changed | compare SHA256 against signed context; stop before child | SOURCE-GUARDED / NOT_EXECUTED |
| SQLR5-MIG-01 | 0030 header expects 0029 but correction fixture omits it | Source dependency map, A22 signed scope decision | REVIEW_PENDING |

**Evidence policy:** text/source gates are not TAP/runtime PASS; a journal written by the same fixture user is not independently tamper-proof. Trust roots are deliberately unprovisioned; all G0–G5 remain HOLD.
