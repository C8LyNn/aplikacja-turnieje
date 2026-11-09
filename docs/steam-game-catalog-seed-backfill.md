# Game Catalog — candidate backfill (106 Steam AppIDs)

This package provides 106 **candidate AppIDs**, not 106 imported or
individually verified records. The CSV's titleHint is only a label. The
safe batch endpoint verifies each actual product with the Steam Store
appdetails API and requires type=game. Missing, unavailable, DLC and
other non-game entries must never be counted as imported games.

The separate GitHub PR #15/#16/#17 discovery features are not a
prerequisite. This script uses existing catalog HTTP routes and makes
no changes to a database unless explicitly run in -Apply mode.

## Windows PowerShell

Run from the repository root. Retrieve the catalog administrator token
from your deployment secrets, and enter it locally. Never paste it into
ChatGPT, a GitHub issue or source control.

    $env:STEAM_CATALOG_ADMIN_TOKEN = Read-Host 'Catalog admin token'
    .\scripts\import-game-catalog-seed.ps1 -Limit 5
    .\scripts\import-game-catalog-seed.ps1 -Limit 5 -Apply
    .\scripts\import-game-catalog-seed.ps1 -Limit 106 -Apply

The first command is a dry run. Import five first; inspect the before/after
counts returned by the deployed public catalog endpoint. Only then continue
the full candidate set. Default pacing is a two-second pause between newly
processed candidates. Import always stops on its first unconfirmed error;
repeat the command later to resume. A local checkpoint file in the user's
home directory stores completed AppIDs, **never credentials**. A candidate
that fails before confirmation is retried on the next run.

The default base URL is https://C8LyNn.replit.app. If you choose a
different deployment, pass -BaseUrl and use a **different -StatePath**.
A checkpoint is tied to one deployment and input candidate set, and
should not be shared across independent databases.

## Backward compatibility and limits

The preferred POST /api/steam-catalog/import-batch route is idempotent
and prevents overwriting existing records. For older deployments lacking
that endpoint, the script fails closed by default. The opt-in -AllowLegacy
switch permits fallback to POST /api/steam-catalog/import, but first
checks that no matching Steam AppID currently exists and confirms
the official Steam Store product type is 'game'.

Unlike the safe batch route, legacy /import can update an existing game's
Steam metadata if another process inserts the same AppID between the
script's check and its POST. Use -AllowLegacy only while no concurrent
catalog imports are running. Prefer a deployment with /import-batch
and proper unique-AppID database constraints.

The server must have STEAM_CATALOG_ADMIN_TOKEN configured and all
required DB migrations. You should **not** supply that secret in
a command-line argument, shared log, file attachment or repository.

The public GET /api/steam-catalog/games response's counts.all field
is the authoritative indication of production catalog growth.
A CSV length, discovery queue count or local importer statistic is not
proof of a database change. Earlier tentative five-game imports also
need independent count verification.

## Source verification

The list was curated from known Steam AppIDs; data is not invented
as catalog records. Each game's live metadata should come from the
Steam Store. Example official product links:

- https://store.steampowered.com/app/730/
- https://store.steampowered.com/app/570/
- https://store.steampowered.com/app/413150/
- https://store.steampowered.com/app/1086940/

After actual import, classify records using the existing five-perspective
catalog editor. This seed does not auto-classify mechanics or genres.
