---
name: Organizer authorization contract
description: Compatibility and trust-boundary decisions for organizer credential rechecks.
---

Organizer credential rejection deliberately preserves the existing HTTP 403
authorization error, including its historical support-specific code.

**Why:** The owner required the security hotfix to leave public API contracts
unchanged. A support-specific error label must not be mistaken for proof that
the guard applies only to support.

**How to apply:** Change that public error contract only through an explicit
compatibility decision, not incidentally while improving authorization.

An omitted actor remains reserved for trusted internal engine calls. HTTP
mutations must retain the verified actor context through the locked operation.

**Why:** Internal engine callers and authenticated HTTP callers have different
trust boundaries; preserving internal call compatibility is not permission for
an HTTP request to bypass credential revalidation.

**How to apply:** Review actor propagation when adding HTTP mutation routes,
including routes that write auxiliary records rather than match results.
