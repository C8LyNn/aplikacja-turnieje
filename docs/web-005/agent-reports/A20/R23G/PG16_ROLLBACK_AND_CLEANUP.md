# WEB-005 A20 R23G — PG16_ROLLBACK_AND_CLEANUP.md

Task WEB-005-T020-A20-R23G-DOCKER-PG16-ISOLATION | 2026-10-17 | DOCS ONLY | C01 fa3261b2c9510e110ac9eba21726812d3401a525 | approval A00+A20+operator for each mutating gate | PG16_EXECUTION_HOLD.

R23G DOES NOT CREATE OR DESTROY ANY RESOURCE: rollback now NONE. Future operator records new container/volume/network immutable IDs, creation timestamps, labels and PG cluster system identifier before test; baseline snapshot only new empty test PGDATA, no production data. On failure STOP tests, preserve first raw stderr/stdout locally outside synced Drive, redact logs for Drive; if IDs differ DO NOT CLEANUP. S1 helper may DROP tm_test schema and S2 fixture FORCE-DROP three own DBs; if before hook fails cleanup may be incomplete. Operator separately approves any residual deletion by exact runtime-generated DB names and verified creation records. G5 after A60 receipt and triple consent removes only owned volume/network/container, never host Windows PG service, port 5432, other Docker projects, system prune, wildcard rm. Verify 55439 released, native service preserved. Cloud hash must be verified by actual remote Drive readback, otherwise CLOUD_SYNC_UNVERIFIED.

**Verdict:** DESIGN_READY_FOR_A00_REVIEW / PG16_EXECUTION_HOLD / CLOUD_SYNC_UNVERIFIED.
