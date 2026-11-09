# Tournament Experimental Frontend — Pack 03 Complete Experience

## Purpose

This is the **latest superseding Pack 03 build** for baseline:

`b7b8bec feat: expand experimental tournament frontend`

Use this ZIP instead of every earlier Pack 03 download.

Pack 03 keeps the Pack 02 architecture and tournament behavior intact, but gives the entire Experimental flow a clearer visual identity and stronger semantic hierarchy.

Coverage now includes:

- role selector / Experimental entry,
- organizer Dashboard,
- Create Tournament and create-version chooser,
- Tournament Overview,
- Players and player toolbar,
- Stages,
- Baskets,
- Host / live operations,
- Support entry,
- Fan entry,
- Audience,
- Bracket,
- Projector / OBS-friendly public surface,
- checklist,
- test-data and destructive dialogs,
- loading / error / empty states,
- reduced-motion and responsive visual behavior.

Semantic colors are route-scoped to Experimental:

- cyan/blue — primary navigation and operations,
- violet — informational context,
- green — success/completed,
- amber — attention/ready/pending,
- red — error/destructive/cancelled/eliminated,
- green-cyan — live/in-progress,
- slate/navy — neutral surfaces.

Color is never intended to be the only status signal; existing text labels and badges remain present.

## Install — PowerShell

Extract this ZIP directly into the repository root:

`C:\Users\kubap\Documents\GitHub\aplikacja-turnieje-live`

Then run:

```powershell
cd C:\Users\kubap\Documents\GitHub\aplikacja-turnieje-live
node .\tournament-exp-pack-03-check.mjs
node .\tournament-exp-pack-03-install.mjs
node .\tournament-exp-pack-03-visual-audit.mjs
node .\tournament-exp-pack-03-verify.mjs
```

Do **not** run `git add .`. After verification, inspect `git status --short` and stage only intended tracked product files.

## Rollback

The installer creates a timestamped `.tournament-exp-pack-03-backup-*` directory before changing tracked files.

Restore the newest Pack 03 backup:

```powershell
node .\tournament-exp-pack-03-rollback.mjs
```

Or pass a specific backup directory:

```powershell
node .\tournament-exp-pack-03-rollback.mjs ".tournament-exp-pack-03-backup-..."
```

## Safety

The installer targets frontend presentation files only. It does not modify backend/API, database schema, tournament algorithms, readiness rules, Stable create page, routing rules, or unrelated untracked files.

Line endings are normalized only in memory and every patched file is written back using its original LF/CRLF style.

## Verification

`node .\tournament-exp-pack-03-verify.mjs` runs:

1. Pack 03 visual-contract audit,
2. tournament-manager TypeScript typecheck,
3. full tournament-manager test suite,
4. production tournament-manager build.

The build may regenerate Animated Effects `public/stream/animated-effects/index.html`; verify restores it automatically when it was clean before the run.

The ZIP also contains package-level fixture tests for marker compatibility, CRLF/LF preservation, idempotence and rollback. Those tests validate the installer itself; the repository-level `verify` command is still the authority for the real application.
