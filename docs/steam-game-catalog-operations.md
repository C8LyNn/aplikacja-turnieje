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

The editor fetches `GET /api/steam-catalog/games/:id` for the complete
classification and `GET /api/steam-catalog/queue?currentId=ID` for the
next pending record. The latter avoids loading all catalog entries.

Migrations `0030` and `0031` provide abstract-world support and indexes.
Apply migrations on a test database before releasing.

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
