# WEB-005-T030 — Steam Catalog write authorization

Scope: SEC-001 only, `release/tournament-ops-20261013-01` baseline.
This change does not deploy, set production secrets, or authorize anyone
automatically. It is intentionally fail-closed.

## Server policy

- `GET /api/steam-catalog/games` and `GET /api/steam-catalog/taxonomy`
  remain publicly readable.
- `POST /api/steam-catalog/taxonomy`,
  `POST /api/steam-catalog/import`, and
  `PUT /api/steam-catalog/games/:id/classification`
  require `X-Steam-Catalog-Admin-Token` matching
  the server-only `STEAM_CATALOG_ADMIN_TOKEN` environment variable.
- Missing, invalid, or under-32-character server credentials disable all
  writes (HTTP 403, `STEAM_CATALOG_WRITE_FORBIDDEN`).
- Tournament organizer, support and viewer tokens do not grant global
  catalog editing rights. Tournament creation is public, so a tournament
  organizer token cannot safely serve as catalog administrator authority.
- The comparison uses SHA-256 digests and `timingSafeEqual`; no real
  credential values or digests are logged or returned.

## Operator setup — separate owner-approved deployment activity

1. Generate a unique, cryptographically random secret with at least 32
   bytes of entropy. Use an approved secrets manager. Do not commit it,
   paste it in issues/PRs, put it in frontend build variables, or print it in logs.
2. Configure `STEAM_CATALOG_ADMIN_TOKEN` **only on the API server**,
   once deployment/runtime changes are independently authorized by the owner.
3. The catalog UI provides a password-type field on import and record
   editing pages. Authorized editors enter their issued credential there.
   It remains in React component memory only and is sent only for
   catalog mutations. It is discarded on reload.
4. Rotate the server credential via the secrets manager when needed.
   Previous credentials stop working after the new configuration is live.
5. When the environment variable is absent, the catalog remains
   readable but **all editing/import operations are intentionally blocked**.
   This should be communicated before any approved release.

A single long-lived shared capability token is a minimal interim control,
not a complete identity/role management system. Future iterations should
consider individually revocable editors, audit events, expirations and
rate limiting. Do not expand T030 with SEC-002..SEC-008 without triage.

## Validation contract

Run in a local/test workspace, never against the production database:

```sh
pnpm --filter @workspace/api-server exec node --import tsx --test ./test/steam-catalog-write-auth.test.ts
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server run test:unit
```

The targeted test uses a deliberately unreachable localhost database URL
for rejected HTTP requests; no authorized mutation is performed against
the real Steam router. Successful authorized responses are tested with
an isolated middleware-only stub.

Release acceptance requires independent QA (WEB-005-T130-A60),
an owner-approved server secret, a verified administrator UX scenario,
and review of the PR against the release branch. No automatic merge
or deployment is permitted.
