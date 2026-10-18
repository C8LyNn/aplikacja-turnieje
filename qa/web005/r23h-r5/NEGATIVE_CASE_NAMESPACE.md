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
