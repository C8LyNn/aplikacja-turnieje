# WEB-005 A20 R23G — PG16_RESOURCE_AND_PORT_MANIFEST.md

Task WEB-005-T020-A20-R23G-DOCKER-PG16-ISOLATION | 2026-10-17 | DOCS ONLY | C01 fa3261b2c9510e110ac9eba21726812d3401a525 | approval A00+A20+operator for each mutating gate | PG16_EXECUTION_HOLD.

ALL RESOURCES PROPOSED/UNALLOCATED: exact C01 fa3261b2c9510e110ac9eba21726812d3401a525; Docker context desktop-linux to verify; image postgres:16@sha256:OPERATOR_PINNED_DIGEST; container web005-r23g-pg16-NONCE (full ID/created timestamp/labels); named volume web005-r23g-pgdata-NONCE (real Docker mount & new ownership marker); internal bridge web005-r23g-internal-NONCE (network ID/routes); host loopback 127.0.0.1:55439 PROPOSED NOT CHECKED; internal 5432; test DB web005_c01_test_NONCE; S1 schema tm_test_NONCE matching ^tm_test_[a-z0-9_]+$; S2 three tm_catalog_test_<16hex>_{dev,prod,fresh} generated runtime DBs. Windows postgresql-x64-16 existing loopback port 5432 never touched. Report destination G:\Mój dysk\ChatGPT\WEB-005\Raporty\PG16_DOCKER_ISOLATION; no claims of Drive sync. Every future object must be proven by immutable IDs and labelled task+nonce, never removed by wildcard.

**Verdict:** DESIGN_READY_FOR_A00_REVIEW / PG16_EXECUTION_HOLD / CLOUD_SYNC_UNVERIFIED.
