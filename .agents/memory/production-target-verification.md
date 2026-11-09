---
name: Production target verification
description: Evidence required before internal writes to the production Steam catalog
---

Do not treat matching empty catalog responses and empty database tables as proof that an internal writable connection targets the database used by the deployed API.

**Why:** The user explicitly required aborting a controlled production import unless database identity and safe write access could be confirmed. The production read replica is not itself a writable connection.

**How to apply:** For internal production catalog writes, establish connection provenance independently before any mutation. Never use the public import route as an identity probe, and never substitute a session signing secret or database connection string for an administrator token.

Separate the production SQL tool's read-only execution channel from database
privileges available through a terminal credential. The former does not
prove that the latter lacks DDL privileges.

**Why:** A read-only terminal check matched the platform production target
by Neon project, branch and database identity and found administrative ACLs,
despite the production SQL tool enforcing read-only transactions.

**How to apply:** Compare identities and inspect privileges using an enforced
read-only session; do not test permissions with DDL. Privileged credentials
do not override the restriction on Agent-managed production schema changes.
