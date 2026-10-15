---
name: Nested static HTML under Vite
description: Serving a separately built page inside a Vite SPA at a directory URL
---

Vite's development server may serve the parent application's root HTML for a nested directory URL in `public`, even when that directory has its own `index.html`. Explicit requests for the nested `index.html` and its assets still work.

**Why:** A bundled editor under a nested directory returned the parent application's 404 page in Preview despite all its static assets returning 200.

**How to apply:** For bundled static sub-apps, explicitly map the directory URL (with and without trailing slash) to its nested `index.html` in development; ensure equivalent exact-path rewrites precede the parent SPA's wildcard rewrite for static hosting. Verify with a screenshot, not only HTTP status.