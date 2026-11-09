---
name: Nested static HTML under Vite
description: Serving a separately built page inside a Vite SPA at a directory URL
---

Vite's development server may serve the parent application's root HTML for a nested directory URL in `public`, even when that directory has its own `index.html`. Explicit requests for the nested `index.html` and its assets still work.

**Why:** A bundled editor under a nested directory returned the parent application's 404 page in Preview despite all its static assets returning 200.

**How to apply:** For bundled static sub-apps, explicitly map the directory URL (with and without trailing slash) to its nested `index.html` in development; ensure equivalent exact-path rewrites precede the parent SPA's wildcard rewrite for static hosting. Verify with a screenshot, not only HTTP status.

Do not treat passing Vite development or build-preview HTTP tests as proof of production HTTP status handling.

**Why:** This product's external static hosting applies its own SPA wildcard; it does not execute Vite middleware. A local fix can preserve all games and reject missing files while the separately configured published host still returns SPA HTML.

**How to apply:** Identify the actual serving boundary and report unverified external rewrites separately. Removing the wildcard without a supported replacement would break dynamic React deep links; a runtime adapter needs explicit approval and its own HTTP verification.