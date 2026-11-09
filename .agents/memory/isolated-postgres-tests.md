---
name: Isolated PostgreSQL tests
description: Avoid process-lifetime, socket and role assumptions when testing against disposable local PostgreSQL.
---

Run disposable PostgreSQL as an explicitly tracked background process.
Give it a loopback-only host, an explicit port and a socket directory
inside its private temporary directory. Initialize a known test role;
do not infer the database role from the Linux user or reuse an unknown cluster.

**Why:** Foreground shell lifetimes stopped a server started with pg_ctl.
The Nix build's default socket directory was absent, and a previous
temporary cluster did not have the guessed runner/postgres roles.

**How to apply:** Create a fresh cluster with an explicit initialization
role, use a database whose name identifies it as a test, respect the
existing schema-reset guards, and stop background processes after verification.
