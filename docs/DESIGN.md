# Tournament Experimental Frontend Pack 01 — Design Summary

Pack 01 is frontend-only.

The stable frontend remains available at `/tournaments/new`.

New flow:

`Nowy/Utwórz turniej`
→ `/tournaments/create`
→ Stable (`/tournaments/new`) or Experimental (`/experimental/tournaments/new`)

Experimental reuses the existing application providers, tokens and UI language. It does not introduce a second backend, database, API client, auth store, router, query client or theme.

Pack 01 keeps the Experimental creation page non-destructive so an incomplete duplicate of the stable creation contract cannot write malformed or partial data to the shared database.

The route `/tournaments/create` must be registered before `/tournaments/:id`.
