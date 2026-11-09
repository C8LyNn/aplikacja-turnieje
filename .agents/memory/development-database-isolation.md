---
name: Development database isolation
description: Development work must use new synthetic data and separate credentials, never a production clone.
---

Tournament Replicate development must be fully isolated from production:
create a fresh database and use synthetic data, not a production copy.
Development administration must have its own credential and must not
borrow the production administrator credential or the session signing secret.

**Why:** The user explicitly authorized persistent development provisioning
but prohibited copying production data, modifying production, pushing or publishing.

**How to apply:** Independently verify the development connection and the
empty destination before DDL. Keep production configuration unchanged,
scope development settings separately, and treat development readiness as
distinct from authorization to release.

Preserve production account/access data, configuration and unrelated data.
Permission to discard test tournaments does not authorize a schema reset or
loss of their embedded access credentials and configuration.

**Why:** The user repeatedly restricted any permitted data loss to test
tournaments, while requiring account and configuration preservation.
