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

## Persistent Steam imports without an open browser

Migration `0035_steam_catalog_import_jobs.sql` adds the
`steam_catalog_import_jobs` table for a **single resumable active job**.
Apply migrations `0029–0035` in order and verify that the deployed API
process has `STEAM_WEB_API_KEY` and `STEAM_CATALOG_ADMIN_TOKEN`. The
worker starts automatically **only with the real API server**
(`artifacts/api-server/src/index.ts`), not when constructing Express in
tests.

In the admin panel under *Szukaj gry*, use *Trwały import serwerowy*
to start a job covering 1–20,000 AppIDs (default 1,000).
*Odśwież stan zadania* reads the actual PostgreSQL progress;
*Wstrzymaj zadanie serwerowe* pauses after an in-flight step;
*Wznów zadanie serwerowe* restarts a paused job. The browser can be closed
after starting: unlike the older 100-AppID local mode, this worker runs
inside the deployed server and does not depend on the tab remaining open.
No automatic unattended job is started merely by deploying the code.

Admin-only API:
- `POST /api/steam-catalog/import-job` body `{"maxGames":1000}`
- `GET /api/steam-catalog/import-job` (latest job status)
- `POST /api/steam-catalog/import-job/:id/pause`
- `POST /api/steam-catalog/import-job/:id/resume`

Each endpoint requires `x-steam-catalog-admin-token`. PostgreSQL leases
coordinate simultaneous API replicas: only the worker holding the current
lease can commit the step. Metadata inserts and job checkpoints are
committed in **one database transaction**, and the unique Steam AppID
index prevents duplicates after process restarts. The worker checks
the Store `appdetails` product type before inserting, rejects DLC,
demos and other non-games, and never overwrites existing manual
classifications. Work is deliberately rate-controlled to approximately
one Steam request per second per active job and pauses on network or
Steam-side errors; resume manually when service recovers. A restart
recovers expired leases after at most 40 seconds.

The `maxGames` limit counts **verified candidate AppIDs**, not guaranteed
new titles. The recorded `inserted` field counts actual newly inserted
records. `scanned` counts records returned by discovery and may be
larger than `processed`. The separate normal catalog counts remain
authoritative for total unique games. For further growth after completion, start another job. If the previous
job reached its `maxGames` limit, the new job inherits its discovery cursor
**and any remaining unprocessed candidates**. Chained jobs therefore
continue the same backfill without skipping or rescanning those entries.
If the previous task genuinely reached the end of the Steam discovery
list, the next job begins a fresh scan at AppID zero to pick up future
changes; already imported games are skipped.

**Deployment limitations:** a live API server must stay running; an
on-demand deployment that scales to zero cannot process while asleep.
Migrating the table alone does not start an import. Server-side processing
has not been performed against a production Steam account, so completion
and rate-limit behavior must be observed on the actual deployment.
Do not store the Steam key or administrator token in logs, source files
or browser localStorage.

## Expanding the number of real games

The original `POST /api/steam-catalog/import` imports one Steam AppID at
a time. The catalogue now supports two additional **admin-protected** ways to
grow without generating fictitious or unverified records:

1. **Automatic Steam discovery:** `POST /api/steam-catalog/discover` with
   `{"cursor":0,"pageSize":50}`. The server calls Steam
   `IStoreService/GetAppList/v1` with game-only flags, compares the returned
   AppIDs against `steam_catalog_games`, and returns only missing candidate
   games plus `nextCursor`, `hasMore`, `scanned` and `alreadyInCatalog`.
   Pass `nextCursor` in the next request; the listing is ordered by AppID.
   Each fetch covers at most 100 IDs to avoid excessive network load. Steam's
   **deprecated** `ISteamApps/GetAppList/v2` endpoint is not used.
2. **Import verified batches:** `POST /api/steam-catalog/import-batch` with
   `{"appIds":[570,730,620]}` (1–10 IDs per call). The server skips
   existing IDs **before** calling Steam, fetches each missing product's
   `appdetails` at a controlled pace, requires `type: "game"`, and
   rejects DLC, demos, non-games, unavailable products and invalid responses.
   Valid games are inserted with a unique Steam AppID constraint and
   `unclassified` status; existing statuses, assignments and revisions
   are never overwritten. A response reports inserted/existing/ignored/
   failed counts, per-ID outcomes, and whether the batch was interrupted.
   Failed/unprocessed IDs can be retried.

**Additional discovery without a Steam Web API key:** the admin panel also offers
*Pobierz nowości i popularne (bez klucza)*. It calls the protected
`POST /api/steam-catalog/discover-featured` endpoint, which reads the public
Steam Store featured-category JSON (new releases, top sellers, coming soon,
specials) and returns deduplicated candidates not already in the database.
This source is **a small rotating snapshot**, not a complete or paginated
Steam game list. It never directly inserts a record or overwrites existing
classification. The backend still validates each queued AppID using
`appdetails` and requires `type: "game"` at import time. An invalid or
throttled featured feed returns a distinct 502 or 429 error.

Use *Przetwórz kolejkę (do 100 AppID)* to verify the already collected
candidates **without calling the keyed app-list API**. This queue-only mode
can process manual pasted AppIDs and featured games without
`STEAM_WEB_API_KEY`; it keeps all normal 10-item batch checkpoints.
Use *Uruchom serię (do 100 AppID)* only when the server has a
Steam Web API key, because it continues requesting new app-list pages after
the pending queue is exhausted. The featured snapshot may contain already
queued candidates, so fetching it repeatedly does not guarantee additional
games. The local `scanned` counter measures candidates inspected, not
newly inserted database rows.

### One-click SteamSpy discovery and verified import

On the catalogue administrator's *Szukaj gry* screen, click
**SteamSpy: automatyczna seria do 100 AppID** for a single bounded session.
The action consumes any already queued AppIDs first, then fetches successive
SteamSpy slices as needed, always checking each new candidate through the
existing official Steam Store `appdetails` batch endpoint before inserting.
Only one session executes per user click and the tab must stay open; this is
**not a server-side background import**.

Limits: at most 100 examined AppIDs, at most 20 discovery slices, at most
10 candidates per backend import batch and 200 locally queued IDs. The page
and offset of SteamSpy remain separate from the official keyed Steam cursor.
After every discovery slice and every finished import batch, the UI writes
both cursors and the queue to browser localStorage (queue first, source
second). A crash between the two writes may cause a page to be checked
again, but will not silently skip candidates. Unique Steam AppID constraints
also make retries safe after uncertain server-side writes.

The *Zatrzymaj po bieżącej partii* control stops further requests after the
current batch or discovery page. When SteamSpy returns a cooldown (429), the
session stops without discarding already imported games or the current
source cursor. Follow the server's `Retry-After` header or retry later;
do not automatically hammer the source with retries. The UI summarizes
the number examined and newly inserted during that particular session;
the catalogue global count is still authoritative only from the public
games endpoint.

### Unofficial SteamSpy paginated discovery (no Steam Web API key)

The admin-only `POST /api/steam-catalog/discover-steamspy` accepts
`{"page":0,"offset":0,"pageSize":100}` and returns up to 100
candidate AppIDs, `scanned`, `alreadyInCatalog`,
`nextPage`, `nextOffset` and `hasMore`. This uses the public
`https://steamspy.com/api.php?request=all&page=0` source,
whose records are ranked by owners and contain up to 1,000 apps per page.
The browser stores the separate SteamSpy `page/offset` cursor under
`steam-catalog-steamspy-progress-v1`. It can queue up to 200 unique
pending IDs and later use *Przetwórz kolejkę* to import them.

SteamSpy is a **third-party, unofficial, best-effort discovery service**,
not the authoritative source of game identity or classification.
Candidates are filtered against the current database on every request,
even on cache hits. Every candidate is revalidated via the official
Steam Store `appdetails` endpoint before import, exactly as for the
existing sources. We never use SteamSpy's names, genres, ratings, owner
estimates or user tags as classification evidence or overwrite manual work.

**Rate control:** SteamSpy documents **one `request=all` call per
60 seconds** and refreshes the data only once per day. The backend uses a
65-second minimum spacing between uncached fetches and a 24-hour,
up-to-three-page in-memory cache. Multiple simultaneous requests for
the *same* page share one fetch; another uncached page within the
cooldown returns 429 `STEAMSPY_COOLDOWN` and a `Retry-After` header.
Successful slices from the same cached page are immediate. After a
server restart, cache/cooldown reset; in multi-instance deployments,
add a distributed cooldown and cache before enabling this source at
high volume. **Do not automatically bypass 429 or poll quickly.**

This source cannot guarantee full historical coverage of Steam:
it excludes apps not exposed by SteamSpy and may reorder pages between
daily refreshes. Database uniqueness prevents duplicate imports, but
page boundaries should not be treated as an immutable global inventory.
Steam's official keyed AppID discovery is the preferred source for
exhaustive listing. A small game catalogue can also use featured
categories, which refresh more frequently without offering full paging.

**Queue overflow fix:** the keyed single-page discovery action now
requests no more IDs than the remaining slots in the 200-ID local
queue. It no longer truncates the tail of a returned 50-ID page while
advancing the saved AppID cursor.

**Credentials:** both endpoints require the existing
`x-steam-catalog-admin-token` header. Discovery additionally needs a
server-only `STEAM_WEB_API_KEY` environment variable containing a standard
32-character hexadecimal Steam Web API key. Never store either key in Git.
The discovery endpoint returns `503 STEAM_DISCOVERY_NOT_CONFIGURED`
when the Steam key is absent. Batch import and the original individual
AppID import do **not** require that Steam Web API key.

**Browser workflow:** open *Szukaj gry* → *Rozbuduj katalog ze Steam*.
Select *Pobierz propozycje ze Steam* or paste up to 200 AppIDs/Steam links
and choose *Dodaj AppID do kolejki*. Then select *Importuj 10 kolejnych*
repeatedly. The backlog and last discovery cursor persist in this browser's
localStorage; its maximum is 200 pending candidates. `Od początku` resets
local discovery progress **without deleting catalogue records**. If Steam
temporarily rate-limits requests, remaining candidates stay queued. The
import response is authoritative about how many games were **actually**
added; fetching a page of candidates alone does not increase the database.

**Automated, resumable session:** the *Uruchom serię (do 100 AppID)*
button verifies up to 100 candidate IDs per explicit click, fetching
additional discovery pages when needed. Each session is bounded to at most
20 Steam discovery pages and 100 verified candidates, with at most 10
`appdetails` requests in each backend batch. It runs **only while that browser
tab is open**; this is not a server-side or scheduled background worker.
*Zatrzymaj po bieżącej partii* stops after the outstanding request finishes.
Closing the tab during an API call may lose its **UI statistics for that call**,
but the unique Steam AppID database constraint makes a subsequent retry
idempotent. The browser checkpoints its cursor, pending AppIDs and counters
after every completed API response, so refreshing the page resumes from the
last confirmed result.

The panel shows cumulative counts for **inserted, already existing, ignored,
failed, scanned and completed batches**. These are local execution
statistics, not a snapshot of every game currently in the database.
They are also intentionally reset by *Od początku*. The public
`GET /api/steam-catalog/games` response provides the authoritative
global `counts.all` for a production catalog after importing. An interrupted
or throttled session never blindly retries failed AppIDs in a tight loop;
remaining candidates are preserved for a later manual restart.

**Operational limits:** do not run a rapid infinite loop over Steam
appdetails. Steam may throttle or change its API behavior; a batch ends
early on an upstream rate limit or server error. Start with a small
verified import, then iterate at a sustainable cadence. Existing records
are intentionally skipped rather than reimported; use the original single
import action when you specifically want to refresh one game's Steam
metadata while preserving its manual classification. Verify that the
deployment database uses migrations `0029–0035` before importing.

Steam reference: https://partner.steamgames.com/doc/webapi/IStoreService

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

## Parallel-load and packaging release gate

The PostgreSQL integration QA now includes a **48-editor simultaneous write**
scenario. Each request modifies a different game's review state, asserts a
revision increment, and verifies the exact status-counter deltas against the
full database. It records elapsed batch time as
`CATALOG_48_PARALLEL_EDITS`, without an environment-sensitive timing limit.

The 100,003-game workload also runs **60 simultaneous public GET requests**:
12 each for selective search, broad publisher search, status-filtered listing,
deep-page cursor pagination and the pending queue. It verifies status codes,
result invariants and stable cursor ordering and logs cohort-specific median
and 95th-percentile elapsed time as `CATALOG_100K_MIXED_LOAD`. This tests
burst behavior on a disposable CI database; it does **not** establish a
production concurrency limit, tail-latency guarantee or traffic forecast.

### Repeated concurrency scaling and in-flight coalescing

Identical overlapping **public search count and page SQL** calls are
coalesced in memory while the database read is pending. This is *not* a
persistent cache: completed and failed reads are removed immediately, and
classification writes are never coalesced. Different SQL or bound parameters
never share a result. A maximum of 64 distinct active keys and 8,192
characters per key bounds memory use; other requests simply execute normally.

The 100,003-game integration benchmark now repeats selective identical,
selective distinct, and broad identical searches at 1, 8, 24 and 48 parallel
requests, with three rounds per configuration. It records per-batch and
per-request median/p95 under `CATALOG_100K_CONCURRENCY_PROFILE`.
The three runs within one CI job are **not independent machines** and no
latency cutoff is enforced. In one benchmark on the same runner, the median
batch latency of 48 identical selective requests was approximately 106 ms,
versus 444 ms for 48 different selective searches. These workloads differ
in query parameters; the contrast is diagnostic, not an isolated causal
measurement or a production SLA.

The search-only UI does not issue `GET /api/steam-catalog/games` until the
user enters a nonblank term. The full catalog list still intentionally loads
unfiltered results on its own browsing screen. A frontend regression test
checks that clearing the search field does not trigger a whole-catalog query.

### Safe integration into the local project

The working branch `codex/game-catalog-editor-reliability` is a **shared
integration branch**, not an isolated catalog-only patch: it also carries
changes to other site features. Before copying changes into a different local
checkout, review its file diff against that checkout's actual base. Do not
blindly cherry-pick the entire branch or overwrite a local working tree.

For a **separate, disposable checkout** that tracks this already-tested
branch, use PowerShell (Git and pnpm installed):

```powershell
git clone --branch codex/game-catalog-editor-reliability --single-branch https://github.com/C8LyNn/aplikacja-turnieje.git aplikacja-turnieje-catalog-qa
cd aplikacja-turnieje-catalog-qa
pnpm install --frozen-lockfile
pnpm --filter @workspace/tournament-manager test
pnpm --filter @workspace/api-server test:unit
pnpm typecheck
pnpm --filter @workspace/tournament-manager build
```

The real PostgreSQL integration suite requires the **dedicated disposable
test database** and destructive test-schema safety configuration already
provided by `.github/workflows/game-catalog-qa.yml`; it is deliberately not
included in the commands above. Keep existing app data and local edits
outside this test checkout. Before a production deployment, back up the
database, execute migrations `0029` through `0034` in order (migration
`0034` briefly locks catalog writes during initialization), configure the
catalog-admin secret and verify actual public endpoints in the deployed
environment. Passing CI does not automatically deploy or modify `main`.

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
