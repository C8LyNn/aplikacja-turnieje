---
name: Browser testing with workspace secrets
description: Keep credentialed browser tests local when the remote notebook cannot access workspace environment variables.
---

The testing browser notebook may not share the workspace execution
environment. Do not retrieve a secret into chat or expose it through a
public helper endpoint to overcome that boundary.

**Why:** A catalog test could browse the app but could not obtain its
workspace credential inside the remote notebook; a loopback relay was
also inaccessible from there.

**How to apply:** Let the existing tester continue authenticated steps
using local browser automation, reading the secret inside the process and
filling a masked field. Keep values out of logs, scripts, traces and reports.
Do not rerun already-passing public flows just to change the browser runner.
