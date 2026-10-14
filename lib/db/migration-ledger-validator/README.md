# WEB-005 / T021 — offline migration-ledger validator

**Safety:** code-only, read-only manifest/fixture validation. No `pg` import, database URLs, SQL execution, migration runner, Replit, DDL, schema reset or ledger writes. The manifest is **PROPOSED**, not authorized. Even on success `ready_for_sql` is always `false` and the highest possible decision is `REVIEW_ONLY`.

Scope: original release migrations 0027–0031 and editor migrations 0030–0038, mapped to canonical 0027–0040. `manifest.proposal.json` preserves source commit, blob SHA, source UTF-8 SHA-256, hard SQL dependencies vs canonical ordering, and postconditions. The `editor` SQL is **not** inserted into `lib/db/migrations`: the validator uses a JSON-only, non-executable `source-snapshots.editor.json` fetched at the pinned editor commit, while release/shared SQL is read from its original files.

## Offline tests

Run from this directory:

```sh
node --test validate.test.mjs
```

### CLI (requires full source tree + separately supplied manifest pin)

```sh
node validate.mjs \
  --manifest manifest.proposal.json \
  --history synthetic-history.json \
  --repo-root ../../../ \
  --editor-snapshots source-snapshots.editor.json \
  --expected-manifest-sha256 <externally-reviewed-full-64-char-digest>
```

The digest is deliberately **not** trusted merely because it is in the same manifest. An independent approval process must pin it and supply it to the CLI. `--history` is a JSON export or synthetic fixture matching `schema_version:1`, `database_attestation:"SYNTHETIC_OR_READ_ONLY_UNVERIFIED"`, `legacy_entries:[]`, and `records:[]`. This validator deliberately cannot attest a live database or authorize historical adoption. The real connection-safe PG16 preflight remains A50/A60's responsibility.

`REVIEW_ONLY`: manifest structure, pinned digest, source byte checksums and the supplied synthetic/unverified history agree. Still not SQL authorization.

`STOP` (exit code 2): mismatch, missing source, malformed dependency graph, ambiguous legacy 0030/0031, gaps, invalid history, missing attestation or absent approval digest. All output is JSON and contains no connection strings.

**No automatic adoption:** entries with `action:"adopted"` are rejected until a future 00-approved, separately tested component supports independently attested adoption. A file number or matching table is never enough.

## R31 transaction wrapper — separate design gate

The original `0031_atomic_correction_receipts.sql` contains top-level `BEGIN;` and `COMMIT;`. The file hash must be checked *before* any approved runner is allowed to transform it. In R1 this validator only **detects and checks** the exact wrapper structure; it does not rewrite SQL. A future runner would need a reviewed, versioned transform with an independently pinned transformed SHA-256, exactly one runner-owned transaction, advisory lock, preflight, SQL, postcondition verification and ledger insert before its final COMMIT. Any unexpected SQL transaction-control statements mean STOP.

`source-snapshots.editor.json` is a source-reference bundle, not a runnable migration. Do not use `drizzle push`, `push-force` or historical `0001` reset to reconcile environments.