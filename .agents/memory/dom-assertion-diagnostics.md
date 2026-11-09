---
name: DOM assertion diagnostics
description: Avoid misleading Node test-worker failures when an assertion briefly observes a live React DOM element.
---

Assert a boolean or text value rather than equality between a live DOM element and null inside a retrying assertion.

**Why:** Node's failed equality assertion can inspect the element's attached React object graph. A brief asynchronous render delay then causes excessive formatting work and an eventual worker failure, obscuring an otherwise successful update.

**How to apply:** For disappearance checks, assert that the lookup result is null as a boolean. Keep real query notifications asynchronous; do not alter application behavior just to hide the diagnostic failure.
