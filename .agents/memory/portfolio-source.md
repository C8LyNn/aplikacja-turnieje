---
name: Standalone Portfolio source
description: Preserve the user's separately authored static Portfolio when adding or synchronizing its landing link.
---

Portfolio is the user's existing standalone HTML site, not a new React module. Import its original document and assets rather than creating a substitute from a description.

**Why:** The user identifies the approved local Portfolio content as the intended destination of the first landing tile.

**How to apply:** Use full-document navigation to `/portfolio/`. If the original source is unavailable, obtain it from the user before claiming the link works or recommending publication. Apply the nested-static-HTML routing guidance when integrating the supplied files.

Selective recovery must preserve the current landing and both SF surfaces. Recover only the requested static subtree, not the entire remote branch.

**Why:** The user explicitly requires missing Portfolio files to be restored without replacing working landing or SF changes; a whole-branch pull or reset could overwrite them.

**How to apply:** Compare protected files before and after restoration, and verify every imported file, including binary assets, against the source Git blob hash.

Git CLI authorization and the GitHub API connection can have independent credentials.

**Why:** Git reported an invalid credential while the separately authorized GitHub API connection could read the exact same private repository.

**How to apply:** After a Git authentication failure, inspect the available connections before requesting renewed access. An already authorized API connection can restore a narrowly selected subtree through immutable blob reads without changing Git credentials or pulling unrelated files.

The GitHub connection can allow immutable blob reads while rejecting repository archive endpoints; parallel blob requests can also be rate-limited.

**Why:** In this workspace, archive retrieval returned 403 and concurrent blob retrieval returned 429, while sequential reads of the same authorized repository succeeded.

**How to apply:** Do not treat an archive rejection or throttling as proof that the connection needs renewed authorization. Use verified immutable blobs, sequential requests, and backoff that respects `Retry-After`.
