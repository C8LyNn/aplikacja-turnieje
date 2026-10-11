# Steam Game Catalog — access, deployment and QA

The Steam catalog lives under `/ludology/game-classification`. It is distinct
from the tournament game-selection catalog and from organizer authentication
for individual tournaments.

## Read vs. write access

- Public GET endpoints: `/api/steam-catalog/games`,
  `/api/steam-catalog/games/:id`, `/api/steam-catalog/queue`,
  `/api/steam-catalog/taxonomy`.
- Protected writes: `POST /api/steam-catalog/import`,
  `POST /api/steam-catalog/taxonomy`,
  `PUT /api/steam-catalog/games/:id/classification`.
- Editing requires the header `x-steam-catalog-admin-token` with the server's
  `STEAM_CATALOG_ADMIN_TOKEN` value.
- The server **fails closed** without a token at least 32 characters long:
  writes return 503 `STEAM_CATALOG_ADMIN_NOT_CONFIGURED`.
  Missing / incorrect credentials return 403 `STEAM_CATALOG_ADMIN_REQUIRED`.
- Do not use tournament organizer credentials: they are scoped to one
  tournament and do not authenticate a global catalog editor.

## Configuring the server

Generate a random token *locally*. For example, in a terminal with Node.js:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Put its value into the deployment's **secret environment variables** under
`STEAM_CATALOG_ADMIN_TOKEN`, and restart/redeploy the API. Do not commit
the secret, paste it into code, or place it in a public `.env` file.

In the catalog UI, expand **Uprawnienia do edycji** and paste the token.
The UI stores it in **sessionStorage** (browser tab session), and includes it
only on POST and PUT requests. Clear it using **Wyczyść klucz** or close the
tab. Anyone with the token can modify the catalog; do not share it.

## Existing pagination contract

`GET /api/steam-catalog/games?page=1&pageSize=25&query=RPG&status=review`

The response contains `games` (page of summary records, **without
assignments**), `pagination` (`page`, `pageSize`, `total`,
`totalPages`) and global `counts` per status. The search accepts a maximum
of 120 characters, page size at most 100. AppID searches are exact.

### Sequential paging without OFFSET

Every game-list response now also returns `pagination.nextCursor`, an opaque,
versioned Base64URL keyset marker (or `null` on the final page). To read the next
page, supply it in `cursor` together with the next numerical `page`, the
same `pageSize`, `query`, and `status`:

```text
GET /api/steam-catalog/games?page=1&pageSize=25&status=review
GET /api/steam-catalog/games?page=2&pageSize=25&status=review&cursor=<nextCursor from page 1>
```

The cursor is tied to the exact query and records the last `(name, id)`.
It is **not** an access credential. A corrupted or mismatched token returns
`400 INVALID_CATALOG_CURSOR`; after page counts shrink beyond the cursor's
page, the API returns `409 CATALOG_CURSOR_STALE`. The browser discards the
stack of cursors when filters or screens change and can recover by reopening
the first page.

Direct `page=N` requests *without* a cursor still work for legacy consumers,
but use an `OFFSET` scan and can be slower at deep pages. This is a stable
sequence of individually queried pages, **not a transactional snapshot**:
concurrent insertions, deletions or renaming games may shift visible pages.

The PostgreSQL 20,003-row CI test compared page 400: `66.78 ms` without the
cursor and `8.46 ms` with it in one ephemeral runner. The exact result varies;
use a representative production-like dataset and multiple measurement runs
before making performance guarantees. The same integration test checks 12
parallel cursor reads for consistent results.

The editor fetches `GET /api/steam-catalog/games/:id` for the complete
classification and `GET /api/steam-catalog/queue?currentId=ID` for the
next pending record. The latter avoids loading all catalog entries.

Migrations `0030` and `0031` provide abstract-world support and indexes.
Migration `0032_steam_catalog_classification_revision.sql` adds a durable
`classification_revision` optimistic concurrency token. **Apply 0029-0034
in order before deploying the updated API**; older databases without
0032 will fail when retrieving catalog games, while 0033 adds optional search indexes.

### Concurrent classification editing

A complete game detail response includes `classificationRevision`, initially
`1`. Every `PUT /api/steam-catalog/games/:id/classification` must include
`expectedRevision` taken from the latest detail response, along with
`status` and `assignments`.

- Missing/malformed expected revision returns `428 CLASSIFICATION_REVISION_REQUIRED`.
- A newer classification version returns `409 CLASSIFICATION_CONFLICT`;
  neither status nor assignments are touched in the losing request.
- Success increments the revision atomically and returns
  `{ ok: true, classificationRevision: number }`.
- A second editor who sees a conflict keeps their draft in the browser.
  They must confirm **Wczytaj aktualną wersję** to discard that local
  draft and fetch the latest server version before saving again.
- A Steam metadata re-import does *not* increment the classification revision.
  Editing tokens track manual classification changes rather than source refreshes.

The 20k-record integration workload reports `CATALOG_20K_HTTP_TIMINGS_MS`
in GitHub Actions logs. These response times depend on the ephemeral runner,
database warm-up and test workload; they are diagnostic observations, **not**
a production performance service-level objective.
Apply migrations on a test database before releasing.

## Search and counters at larger scale

Apply `0033_steam_catalog_trigram_search.sql` **after 0032 and before this
API version**. This migration tries to enable PostgreSQL `pg_trgm` and
creates GIN trigram indexes on `name`, `developer`, and `publisher`.
The extension is optional: if the deployment role cannot install it, migration
continues and existing `ILIKE '%query%'` matching remains correct, with the
older (slower) search plan. A database administrator can install `pg_trgm`
separately; replay migration 0033 afterwards to build missing indexes.

With migration `0034_steam_catalog_exact_status_counters.sql`, status badges,
unsearched pagination totals and the pending queue count are **exact counters**
stored in `steam_catalog_status_counts`, rather than full-table aggregates.
PostgreSQL statement-level triggers apply status deltas transactionally to
`INSERT`, `UPDATE`, and `DELETE`, including bulk imports. Counter updates
participate in the writer's transaction and roll back with failed writes.
The migration acquires a write-blocking table lock while taking the initial
count snapshot and installing triggers; plan this brief lock for a quiet
deployment window. It is safe to replay the migration: existing counter
values are preserved and trigger definitions are replaced rather than duplicated.

**Apply migrations 0029–0034 in order before deploying the new API.**
Deploying the API before 0034 will fail for list/queue reads because the
counters table does not yet exist. Direct manual SQL modifications to the
counter table are unsupported; to check or repair drift, reconcile against
`SELECT status, count(*) FROM steam_catalog_games GROUP BY status` while writes
are paused. A dedicated verification test confirms insert/delete/status
changes, rollback safety, idempotent migration replay and counts after a
100k-row bulk load.

Text search still requires a separate count of matching rows (and global
status badges remain global). Existing page-number, filter, and cursor
contracts do not change.
PostgreSQL will not always select GIN for very short or common search strings,
and indexes add overhead and storage for inserts/re-imports.

The integration suite seeds 100,003 test games, measures substring searches,
status counts, deep cursors and parallel HTTP readers, and prints
`CATALOG_100K_HTTP_TIMINGS_MS`. Measurements use one ephemeral runner and
are not a latency SLA. To inspect index usage in a target environment, compare
`EXPLAIN (ANALYZE, BUFFERS)` with realistic search queries after
`ANALYZE steam_catalog_games`.

## Search execution and post-import index maintenance

The list endpoint still uses the Drizzle SQL builder and bound values, but
**search-only reads** execute that compiled SQL through the PostgreSQL driver
to avoid unstable execution plans encountered with this workload. Normal
unfiltered pages retain their original ORM execution path. The API still
returns exactly the same public field names and cursor/pagination metadata.

When a search has at most 2,000 matches, the API uses a PostgreSQL
`MATERIALIZED` CTE to collect a bounded projection of matching games before
sorting the requested page. This prevents certain publisher/developer queries
from scanning nearly the entire name-ordered index. Broader matches use the
regular query, avoiding materializing many thousands of records. Filters and
cursor comparison remain parameterized, and integration tests compare cursor
pages against offset pages for filtered searches.

The 100k-record test explicitly distinguishes **fresh bulk-import** search
performance from the post-maintenance steady state. In one GitHub Actions run,
the same search took 580.36 ms immediately after inserting 80k rows and
16.13 ms after `VACUUM (ANALYZE) steam_catalog_games`. Subsequently, three
searches by publisher were approximately 10–11 ms each. The result is
consistent with the cost of GIN index pending-list maintenance, but it is
not a general production latency guarantee.

Keep PostgreSQL autovacuum healthy and plan `VACUUM (ANALYZE)` after large
administrative bulk imports when operationally appropriate. **Do not run
`VACUUM` after each small Steam re-import**; it is a separate operational
maintenance command with its own resource cost. No API route performs it.

The `x-catalog-perf-probe: 1` request header produces a `Server-Timing`
breakdown **only when `NODE_ENV=test`**. It does not expose query timings
in the deployed service. The CI suite logs repeat timings for SQL stages and
end-to-end HTTP without enforcing flaky timing cutoffs.

## Verification before merging

From the repository root, with dependencies installed and a test database
configured if running integration suites:

```bash
pnpm --filter @workspace/tournament-manager run test
pnpm --filter @workspace/api-server run test:unit
pnpm run typecheck
pnpm --filter @workspace/tournament-manager run build
```

Manual acceptance cases:

1. Public search/list/detail work without a token; pages contain at most
   25 entries by default.
2. Search by name, publisher, studio and exact Steam AppID; status counts
   describe the **whole** catalog, not the visible page.
3. Empty, out-of-range and invalid page queries are handled safely; changing
   a filter resets the page.
4. Import, dictionary changes and classification saves fail without the
   server-admin token, succeed only with a valid token.
5. Existing classification survives a re-import of the same Steam AppID.
6. Editing a record, using **Zapisz i dalej**, then reopening it preserves
   assignments; **Do sprawdzenia** remains a valid incomplete draft.
7. Only complete classifications can be marked **Gotowe**.
8. Verify the app's published URL separately after review; this branch is
   not deployed automatically.

**Release gate:** do not merge/publish solely on isolated helper tests.
Confirm frontend tests, backend tests, typecheck, build and representative
database/API integration in the target environment.
