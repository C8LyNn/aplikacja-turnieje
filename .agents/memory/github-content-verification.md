---
name: GitHub content verification
description: Verification and provenance when the GitHub connector works but authenticated Git or archive downloads do not.
---

If authenticated Git is unavailable but the connected GitHub JSON API works,
independently verify pinned commit content. Do not treat a content-equivalent
synthetic snapshot as the original upstream commit or its history.

**Why:** In this environment authenticated fetch failed and the archive endpoint
returned 403 while JSON blob access worked. The recursive-tree response's
top-level SHA echoed the requested commit rather than its actual tree SHA.
Concurrent blob downloads also triggered 429 responses.

**How to apply:** Obtain the authoritative root tree through the commit
endpoint, verify downloaded blobs using Git's blob hashing, and verify the
reconstructed root tree. Record content-versus-history provenance in release
documentation. Respect rate limiting: stop the burst and retry with paced
requests. These are observed connector behaviors, not assumptions about every
future connector response.

When text passes through the execution boundary, an initial UTF-8 BOM may
be omitted even though it is part of the upstream blob. Do not mistake that
encoding change for a source-code difference or silently accept a hash mismatch.

**Why:** Two upstream TypeScript blobs matched their advertised Git hashes
only when the original BOM bytes were included; the substantive text matched.

**How to apply:** Verify Git hashes against raw bytes before converting to text.
If inspection needs decoded text, retain encoding information and check the
final imported file against the upstream blob hash.

Attribute a fix to an integration only after comparing the pinned upstream content, not a conversation summary.

**Why:** A previous summary described multistage/refetch-error safeguards as missing, but verified upstream blobs already contained them. The local differences were mostly equivalent expressions and wording.

**How to apply:** Report semantic differences separately from existing behavior; a modified file or passing regression does not establish that the upstream baseline lacked the fix.
