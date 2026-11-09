---
name: Publish diff coverage
description: A zero-statement Publish preview does not certify the desired forward SQL migrations.
---

Do not interpret an empty Publish diff as proof that the desired release
schema exists. Verify the intended objects independently, including CHECK,
functions, triggers, indexes and initialization.

**Why:** Publish initially reported no pending SQL because the prepared app
used a separate dev target. Preparing the actual managed dev produced a
nonempty diff without changing the no-op ORM push configuration. That diff
omitted functions, triggers, extension installation and seed rows while
including GIN indexes that depended on the omitted extension.

**How to apply:** Confirm which development database and schema scope Publish
compares. A no-op ORM push does not disable the native database-to-database
Publish diff. Stop when the final supported plan omits required objects;
do not compensate with production DDL scripts, build hooks or startup migrations.
