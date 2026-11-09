# Isolated organizer stale-authorization hotfix

## Provenance and boundary

- Base: `671c9746bb8c9c6349108a0b288741cf1e96b7de`.
- Base tree: `71c3369869507e85ca273c3b53cfaf0e14ca15ea`.
- Branch: `hotfix/swarm006-organizer-stale-auth-20261030`.
- Worktree: `/tmp/swarm006-organizer-stale-auth-20261030`.
- This is a review candidate, not a release. No merge, push, deployment, production
  write, secret change, schema change or migration was performed.

## Implementation

The organizer actor captures only the existing HMAC credential fingerprint after
successful token verification. The mutation guard compares that snapshot with
the fingerprint of the current tournament row after `FOR UPDATE`. A missing or
changed fingerprint throws the existing authorization error before mutation.
No bearer token, password hash, or signing secret is added to the actor.

Token signing/verification and support-session revalidation remain unchanged.
The existing HTTP 403 error contract is preserved, including its historical
`SUPPORT_SESSION_EXPIRED` code (also already used by locked organizer checks).
Successful tournament DELETE remains organizer-only and returns HTTP 204.

Actor propagation was inspected for Undo (result, roster and inline lifecycle
branches), Cancel/Restore, scoring, roster, stage/qualification and atomic
correction services. Their existing guard calls now enforce organizer versions.
The audit also found direct writes in tournament DELETE, hero bans, hero picks,
and correction-intent approval; these now use the same transactional lock and
verified actor. Read-only POST preview/readiness endpoints are unchanged.
Existing security-setting endpoints retain their token recheck under lock.

Trusted internal engine calls without an actor retain their previous semantics.
HTTP mutation routes must forward the verified actor; an organizer actor without
its fingerprint fails closed. Existing direct-service integration fixtures were
updated to carry the credential fingerprint rather than an incomplete actor.

## Executed checks

Working directory: `artifacts/api-server` in the isolated worktree.
Commands used an ephemeral, test-only signing secret in the child process,
never a production credential.

```sh
NODE_ENV=test SESSION_SECRET=swarm006-isolated-unit-fixture \
  node --import tsx --test \
  test/organizer-stale-auth.test.ts \
  test/auth-config.test.ts \
  test/undo-lifo-concurrency.test.ts
```

**PASS: 44 tests, 0 failures, exit 0.** Eight new tests execute the actual policy
and DELETE handler with controlled database ports: version capture without
credentials, queued rotation rejection, unchanged-version success, missing
version rejection, support recheck, tournament scoping and both DELETE outcomes.
These are not PostgreSQL lock/isolation tests.

```sh
/home/runner/workspace/node_modules/.bin/tsc \
  -p tsconfig.test.json --noEmit --incremental false
```

**PASS: application and test compilation, exit 0.**
Dependencies and unchanged shared-library declarations were reused through
read-only links; no dependency install or application build was performed.

`git diff --check`: **PASS**.

## PostgreSQL integration: NOT_RUN

No `TEST_DATABASE_URL` is configured as a development secret or environment
variable. No database connection, test-schema reset or integration test was run.
Do not interpret compilation or the mocked unit interleaving as PostgreSQL PASS.

The new named test in `security-integrity.integration.test.ts` covers eleven
isolated fixtures: roster, settings, DELETE, Cancel, Restore, score, bans, picks,
result Undo, lifecycle Undo and roster Undo.

It holds a real row lock, waits for a request blocked specifically by the lock
holder's backend PID, changes the fixture's credential hash before committing,
expects HTTP 403, and compares business data/results/action log before and after.
The same operation with a new valid token is the positive control.
Assertion snapshots exclude credentials and session tokens.

Only after an independent nonproduction database is verified, use the existing
guarded test configuration (`TEST_DATABASE_SCHEMA=tm_test_*` and
`TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`) and run:

```sh
node --import tsx --test --test-concurrency=1 \
  --test-name-pattern='revalidates in-flight organizer mutations after credential rotation' \
  test/security-integrity.integration.test.ts
```

Coverage gap: actual PostgreSQL behavior, correction-intent approval concurrency,
and broader stage/security integration regressions have not been executed here.
No browser suite or full frontend/backend suite was rerun.

The final commit SHA, exact changed paths and final MAIN/deployment observations
are recorded separately in the private completion receipt.
