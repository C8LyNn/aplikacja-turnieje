---
name: GitHub integration priorities
description: Resolve presentation-versus-functionality conflicts when integrating the GitHub handoff branch.
---

The accepted local landing, standalone Portfolio, both SF surfaces, and approved UI corrections are authoritative when integrating GitHub-only functionality. Bring in the experimental tournament interface and Core Clash prototype/multiplayer without removing working features from either side.

**Why:** The user explicitly wants the missing GitHub features to reach live while keeping the accepted local presentation, not restoring an older remote design.

**How to apply:** Compare both sides with their common ancestor. Preserve local presentation corrections, bring in non-conflicting remote functionality, and inspect overlapping changes semantically. A file present only locally is not a remote deletion unless it existed in the common ancestor. Verify protected sources before and after builds; ask the user when a functional conflict has no safe resolution. Integration alone does not authorize publishing or pushing.

The owner identified this existing Tournament Replicate product as the main production application on 2026-10-30. GitHub parity work must preserve the workspace, games, Unity/WebGL, media, catalog, data and configuration; never use a reset or bulk remote overwrite.

**Why:** The owner explicitly rejected destructive synchronization and treating a workspace SHA as proof of the published image. Code integration is not permission for database operations, secret changes or publishing.

**How to apply:** Port verified, minimal source changes. Incomplete server CAS, D03/D04 and Backup V3 importer/issuer trust paths must not be enabled without complete implementation, separate authorization and real isolated database tests.
