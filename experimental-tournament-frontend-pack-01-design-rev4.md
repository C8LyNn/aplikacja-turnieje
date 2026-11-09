# Experimental Tournament Frontend — Pack 01 Design (rev. 4 — pre-install hardening)

## Status

This is the pre-install hardening revision of the same Pack 01.
It supersedes earlier Pack 01 design drafts.

Pack 01 remains frontend-only.

---

# 1. Primary objective

Introduce an isolated Experimental tournament frontend while:

- keeping the stable tournament frontend operational,
- keeping the backend unchanged,
- using the same existing API client and database,
- using the same application providers and design language,
- making installation and rollback safe on the user's current repository.

---

# 2. Data architecture

Stable frontend
→ existing `@workspace/api-client-react`
→ existing backend
→ existing database

Experimental frontend
→ same `@workspace/api-client-react`
→ same backend
→ same database

Pack 01 must not add or alter:

- API endpoints,
- backend handlers,
- database schema,
- migrations,
- generated API contracts,
- business rules,
- bracket logic,
- stage logic,
- result logic,
- seed logic.

---

# 3. Existing providers must be reused

Current `App.tsx` already wraps the whole application in:

- `QueryClientProvider`
- `TooltipProvider`
- `AuthProvider`
- the global `Toaster`
- the main Wouter router.

Experimental must use those existing providers.

Pack 01 must not add:

- another `QueryClient`,
- another `QueryClientProvider`,
- another `AuthProvider`,
- another toaster/notification root,
- another router root.

This prevents separate caches, duplicated auth state, duplicate notifications and inconsistent navigation.

---

# 4. Routing

Stable route remains:

`/tournaments/new`

New routes:

`/tournaments/create`

`/experimental/tournaments/new`

Flow:

New tournament action
→ `/tournaments/create`

Stable choice
→ `/tournaments/new`

Experimental choice
→ `/experimental/tournaments/new`

---

# 5. Critical route ordering

Current application has:

`/tournaments/:id`

Therefore:

`/tournaments/create`

must be registered before:

`/tournaments/:id`

inside the Wouter `Switch`.

Otherwise `create` can be interpreted as a tournament ID.

Pack 01 must include a regression test proving that the version-choice page renders at `/tournaments/create`.

---

# 6. Navigation must stay SPA-native

All Pack 01 navigation should use:

- Wouter `Link`
- or `useLocation`

Do not use:

- `window.location.href`
- hard browser reloads
- manually constructed absolute production URLs.

The application already configures Wouter using `import.meta.env.BASE_URL`.
Using the existing navigation layer preserves that behavior.

---

# 7. Organizer-only route protection

Both new pages are organizer-only:

- `/tournaments/create`
- `/experimental/tournaments/new`

Expected direct-navigation behavior:

- organizer → render page,
- fan → `/fan`,
- support → `/support`,
- anonymous → `/`.

The guard should use the current role model only:

- organizer
- support
- fan

Do not reproduce the stale `developer` role references found in old stable create code/tests.

The stable guard is not refactored in Pack 01.

---

# 8. Prefer current navigation helpers where safe

The codebase already has:

`getRoleHomePath(role, fallbackHref)`

in `app-navigation.tsx`.

The new Experimental guard may use existing navigation helpers rather than inventing a second role-to-home mapping.

Do not change stable navigation semantics as part of Pack 01.

---

# 9. Choice page identity

`/tournaments/create` is not itself an Experimental page.

Therefore its header should represent the tournament module, for example:

- code: `TURN`
- title: `Utwórz turniej`

It should not have an Experimental status on the page-level header.

Only the Experimental choice card carries:

- status: `experimental`.

The stable choice card carries:

- status: `stabilna`.

This avoids making the stable path look experimental.

---

# 10. Experimental page identity

`/experimental/tournaments/new` uses:

- code: `TURN EXP`
- title: `Nowy turniej`
- accent: `primary`
- status: `experimental`

It clearly links back to:

`/tournaments/create`

---

# 11. Shared UI strategy

Page shell:

- `ModuleShell`
- `ModuleHeader`
- `ModuleBackLink`
- `ProjectCard`

Workspace structure:

- `ToolWorkspace`
- `ToolToolbar`
- `ToolPanel`
- `ToolSection`
- `ToolNotice`
- `ToolEmptyState`

Actual form controls:

- `Button`
- `Input`
- `Select`
- `Textarea`
- `Switch`
- `Label`
- `Badge`

This avoids mixing normal controls and Tool controls that currently have slightly different geometry.

---

# 12. No global design-system edits

Pack 01 must not modify just for Experimental:

- `src/index.css`
- `src/components/tool-ui.css`
- global Button
- global Input
- global Select
- `ModuleHeader`
- `ProjectCard`
- `ToolPanel`

Experimental composes the existing system rather than changing it.

If a global design-system defect is found, it should be handled separately.

---

# 13. No new global CSS

Pack 01 should not add a global stylesheet.

Prefer:

- existing shared components,
- existing Tailwind tokens/utilities.

If a truly Experimental-only styling helper is unavoidable, keep it colocated under:

`src/features/experimental-tournaments/`

and do not import it globally unless necessary.

The preferred Pack 01 implementation requires no new CSS file.

---

# 14. No nested page shells

Stable pages continue using legacy `Layout`.

Experimental pages use the newer:

- `ModuleShell`
- `ModuleHeader`

Do not nest `Layout` and `ModuleShell` in either direction.

This avoids duplicated containers, page padding and navigation chrome.

---

# 15. Current create-entry points to change

Static review confirms current creation links in:

- `src/components/layout.tsx`
- `src/pages/dashboard.tsx` main action
- `src/pages/dashboard.tsx` empty state

Those navigation targets change:

`/tournaments/new`
→ `/tournaments/create`

The stable router mapping remains:

`/tournaments/new`
→ existing `CreateTournament`

---

# 16. Stable implementation protection

Do not edit internals of:

- `src/pages/create-tournament.tsx`
- stable tournament detail
- stable host
- stable bracket
- stable audience/projector
- stage editors
- result-processing UI.

Pack 01 is allowed to modify existing files only where necessary for:

- route registration,
- navigation destinations.

---

# 17. Pack 01 must remain non-destructive

The current stable creation flow contains important behavior around:

- validation,
- organizer ownership,
- organizer-token persistence,
- game-specific configuration,
- stage plans,
- payload construction,
- post-create navigation.

Pack 01 must not implement a partial real create mutation merely to make Experimental appear complete.

Until the complete contract is intentionally migrated/reused:

**the Experimental creation page is a safe frontend shell and does not submit incomplete tournament data to the production backend.**

Do not fake success.

---

# 18. Future mutation invariant

When Experimental eventually creates a real tournament, it must reuse the existing:

- API client,
- organizer ownership model,
- organizer token store,
- auth context.

Do not introduce:

- Experimental-only auth,
- Experimental-only token keys,
- a second API client,
- a second mutation cache.

---

# 19. No unnecessary API calls on version choice

`/tournaments/create` should be a pure frontend navigation page.

It should not:

- fetch tournament lists,
- initialize mutation hooks,
- touch database-backed endpoints.

This makes the branching page nearly failure-proof.

---

# 20. Experimental creation shell structure

Header:
- TURN EXP
- Nowy turniej
- experimental status
- back to version choice

Main panel:
- tournament name
- description
- safe initial setup/format area

Side/context panel on desktop:
- current Experimental state,
- concise summary,
- clear note that future real changes use the same tournament data/backend.

Mobile:
- side/context panel stacks below main content.

Actions:
- Back
- one main forward action

Any action that does not yet perform real creation must be described accurately.

---

# 21. Form/UI consistency

Use one form-control family.

Validation:

- local error near field,
- preserve typed input,
- destructive color only for errors/destructive actions.

Layout:

- short fields stay readable rather than stretching excessively,
- no horizontal scroll at common mobile widths,
- one-column mobile,
- adaptive tablet,
- normal `ModuleShell` width for Pack 01.

---

# 22. Accessibility

Required:

- semantic `Link` / `Button`,
- keyboard-accessible choice cards,
- visible `focus-visible`,
- labels connected to fields,
- disabled state visible,
- existing contrast tokens.

---

# 23. Test strategy

The existing frontend runner automatically discovers:

- `*.test.ts`
- `*.test.tsx`

No test-runner change is required.

Add tests for:

- organizer can open `/tournaments/create`,
- fan cannot,
- support cannot,
- anonymous cannot,
- Stable choice points to `/tournaments/new`,
- Experimental choice points to `/experimental/tournaments/new`,
- Experimental direct route is organizer-only,
- Experimental marker is visible,
- stable `/tournaments/new` still renders the stable create component,
- `/tournaments/create` is not swallowed by `/tournaments/:id`,
- dashboard creation links now target the choice route,
- top-layout `Nowy turniej` targets the choice route.

Existing stable create tests must remain unchanged and passing.

---

# 24. Avoid brittle tests

Do not test arbitrary Tailwind class strings unless behavior depends on them.

Prefer tests for:

- rendered text,
- semantic roles,
- href targets,
- route behavior,
- visibility,
- access control.

Visual consistency is covered by component reuse plus manual QA.

---

# 25. Installer baseline

Pack 01 is built against current known branch state:

`codex/replit-visual-polish-handoff`

Known reference commit at design time:

`b0c1042`

The installer should not require the whole repository to be clean because the user's repository already contains unrelated untracked local files.

Instead it checks only the files it intends to modify.

---

# 26. Installer target-file safety

Before installation:

1. verify repository structure,
2. verify all target files exist,
3. verify Pack 01-created files do not already exist unexpectedly,
4. verify intended target files do not have local tracked modifications,
5. verify expected source markers or hashes for each edited file.

Unrelated untracked files must not block installation.

Unexpected changes to target files must block installation.

---

# 27. Installer should support check-only mode

Add:

`node install.mjs --check`

This performs all preflight checks but writes nothing.

Expected use:

1. unpack Pack 01 into repo root,
2. run `node install.mjs --check`,
3. review result,
4. run `node install.mjs`.

This reduces installation risk.

---

# 28. Installer must be idempotent

If Pack 01 is already installed, rerunning the installer must not:

- duplicate imports,
- duplicate routes,
- duplicate links,
- duplicate files.

It should report:

`Pack 01 appears to be already installed`

and stop cleanly.

A partially installed state should be treated as an error requiring rollback or inspection.

---

# 29. Dedicated backup directory

Use a Pack-specific backup location, e.g.:

`.tournament-exp-pack-01-backup/`

Do not reuse Animated Effects backup folders.

Backup contains only files Pack 01 changes.

Rollback reads only this Pack-specific backup.

---

# 30. Rollback safety

`rollback.mjs` must:

- verify a valid Pack 01 backup exists,
- restore only the files Pack 01 modified,
- remove only files created by Pack 01,
- not touch unrelated untracked files,
- be safe to run only against a recognized Pack 01 installation.

Rollback should refuse ambiguous states instead of deleting broadly.

---

# 31. Allowed-path whitelist

After applying changes, installer can verify the Git diff path list.

Expected changed/added frontend paths should be whitelisted.

If a backend/API/schema/migration path appears in the Pack-generated diff, installation validation fails.

This provides a machine-checkable guarantee that Pack 01 stayed frontend-only.

---

# 32. No broad search-and-replace

Do not globally replace:

`/tournaments/new`

throughout the repository.

Only exact intended frontend navigation occurrences are changed.

This protects:

- tests that intentionally reference the stable route,
- documentation,
- stable router mapping,
- ownership tests,
- future compatibility.

---

# 33. Verification commands

Recommended checks after installation:

`pnpm --filter tournament-manager run typecheck`

`pnpm --filter tournament-manager run test`

`pnpm --filter tournament-manager run build`

Important repository-specific caveat:

the build command stages Animated Effects and can regenerate:

`artifacts/tournament-manager/public/stream/animated-effects/index.html`

Therefore Pack 01 verification must not confuse that generated build artifact with a Pack 01 source change.

If automated verification snapshots/restores generated artifacts, it must restore only files it explicitly snapshotted.

---

# 34. Prefer a separate verification helper

The ZIP may include:

`verify.mjs`

Responsibilities:

- run/check frontend typecheck,
- run frontend tests,
- optionally run build,
- report source diff paths,
- flag any unexpected backend changes.

It must not silently commit or push anything.

---

# 35. Installation transparency

ZIP should include:

- `README.md`
- `MANIFEST.md`
- `install.mjs`
- `rollback.mjs`
- optionally `verify.mjs`
- new-file templates.

`MANIFEST.md` lists:

- every created file,
- every modified file,
- every expected route change,
- explicit statement: no backend/database changes.

---

# 36. Suggested Pack 01 file layout

New:

- `src/pages/tournament-create-choice.tsx`
- `src/pages/experimental/tournaments/create-tournament-experimental.tsx`
- `src/features/experimental-tournaments/experimental-organizer-guard.tsx`
- `src/features/experimental-tournaments/experimental-tournament-shell.tsx`
- focused `*.test.tsx` files.

Minimal existing edits:

- `src/App.tsx`
- `src/components/layout.tsx`
- `src/pages/dashboard.tsx`

No backend files.

No global CSS changes.

No dependency changes.

---

# 37. Pre-existing code issues recorded but not fixed

## A. Stale developer role

Current `Role` is:

`organizer | support | fan`

Old stable create guard/test material still references `developer`.

Do not propagate this into new code.

## B. Two control families

Normal UI and Tool convenience controls have slightly different geometry.

Experimental standardizes locally without refactoring the rest of the application.

## C. Two page-shell generations

Stable Tournament UI uses `Layout`.
Newer modules use `ModuleShell`.

Pack 01 leaves Stable untouched and uses `ModuleShell` for Experimental.

---

# 38. Final pre-install acceptance criteria

Pack 01 is ready to install only when:

1. exact edited paths are known,
2. exact new paths are known,
3. `/tournaments/create` route ordering is safe,
4. organizer-only route behavior is specified,
5. stable `/tournaments/new` behavior remains untouched,
6. Experimental is non-destructive in Pack 01,
7. no duplicate providers are introduced,
8. no new dependency is introduced,
9. no global CSS/design-system edit is required,
10. installer has `--check`,
11. installer is idempotent,
12. rollback is path-scoped,
13. target-file preflight ignores unrelated untracked files,
14. test cases are specified,
15. frontend-only path whitelist is specified,
16. build-generated Animated Effects artifacts are accounted for.

---

# 39. Non-goals

Pack 01 does not replace:

- stable dashboard,
- tournament detail,
- host,
- bracket,
- audience/projector,
- stage lifecycle,
- complete real Experimental creation mutation.

Its purpose is to install the safe branching point, isolated Experimental frontend foundation, shared UI standard and regression protections.
