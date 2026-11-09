# Tournament Experimental Frontend Pack 01 — Implementation Plan

**Goal:** Add a safe Stable/Experimental tournament-creation branch and an isolated, visually consistent Experimental shell without changing backend behavior.

**Architecture:** The new frontend stays inside the existing React application and reuses the current AuthProvider, Wouter router, TanStack Query provider, UI primitives, API client and database. The stable create page remains unchanged.

## Task 1 — route/access regression coverage

- Add tests for organizer-only access to the version choice and Experimental route.
- Add assertions for Stable and Experimental target URLs.
- Structural verification checks that `/tournaments/create` appears before `/tournaments/:id`.

## Task 2 — Experimental shell

- Add organizer guard.
- Add shared Experimental tournament shell using `ModuleShell` and `ModuleHeader`.
- Add non-destructive creation screen using existing UI controls and Tool panels.

## Task 3 — integration

- Register `/tournaments/create` and `/experimental/tournaments/new`.
- Keep `/tournaments/new` mapped to the existing `CreateTournament`.
- Redirect the existing header/dashboard create entry points to `/tournaments/create`.

## Task 4 — install safety

- Preflight against the known baseline.
- Ignore unrelated untracked files.
- Back up only modified target files.
- Apply only whitelisted frontend changes.
- Provide verify and rollback scripts.
