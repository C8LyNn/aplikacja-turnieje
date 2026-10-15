# WEB-005 — A20 R23A · Canonical Migration Graph PROPOSAL (not adopted)

**Task:** `WEB-005-T020-A20-R23A-MIGRATION-LEDGER` · **Agent:** A20 · **Mode:** DOCS / MIGRATION ARCHITECTURE · **Date:** 2026-10-15 (Europe/Warsaw).  
**Status:** `PROPOSED_CANONICAL_SOURCE_GRAPH / SOURCE_BYTES_VERIFIED / POSTGRES_APPLIED_HISTORY_UNKNOWN / READY_FOR_A00_DECISION / SQL_STOP`.

## 1. Immutable source origin and verification

- [P05 PR #38](https://github.com/C8LyNn/aplikacja-turnieje/pull/38) OPEN/DRAFT/UNMERGED, exact HEAD `2d36864f4d2f1c838073f387fd3c8efb3378c43b`, base `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.
- Manifest path `lib/db/migration-ledger-validator/manifest.proposal.json` at PR38 HEAD, Git blob `28f493263a2cbfb919db1f99b220058175b46ba0`, `status=PROPOSAL_ONLY_NOT_APPROVED` — not a production or physical-history adoption manifest. Editor source reference `lib/db/migration-ledger-validator/source-snapshots.editor.json`, blob `d73453363928c31bd452c1fa30ac726613708e17`, non-executable.
- Release/shared original source ref: `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`; independent branch compare **IDENTICAL / 0 ahead, 0 behind**.
- Editor original ref: `codex/game-catalog-editor-reliability@28da3ef94f3b30f90c1b3b70a88ab7f61462d99c`; independent branch compare **IDENTICAL / 0 ahead, 0 behind**.
- R23A independently fetched **all 14 immutable original migration files** from the referenced commit and original filename. Verified **14/14 Git blob SHA-1** against manifest and **14/14 SHA-256 of UTF-8 content** against `original_utf8_sha256`, using a local in-process pure-JS SHA-256 implementation checked against test vector `sha256('abc')=ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`. These checks validate **source bytes**, NOT any installed PostgreSQL database.

## 2. 14-source proposed canonical mapping (full checksums)

Columns are proposed canonical ordinal, **original filename's number and logical ID**, original source lineage, verified Git blob SHA-1, verified raw-source SHA-256. Prefix `0032–0040` is **NOT adopted or allocated to any new work**.

| Proposed canonical | Original identity | Lineage | Git blob SHA-1 | Original UTF-8 SHA-256 |
|---|---|---|---|---|
| `0027` | `0027_preserve_started_stage_memberships` | `shared` | `90b9fd1c7297097d32ddbb546f9828c47fda02dc` | `e6c5e8c2ab4b5c4d746c24f47d475d38418226d32a2e3c2a10ce1b6587ff78ff` |
| `0028` | `0028_match_revision` | `shared` | `45eb2ea26e8bbeb290be4e8ded21b544440ce7ec` | `961daf8f39ee5b940a10246ccbde191f106aaeef1c89026c89233ca915dc136c` |
| `0029` | `0029_steam_game_catalog_v1` | `shared` | `e6c6ff4c4bc81181391a3b6cedafba3ab96c6c41` | `03b3b3a6762af8a723f6ceb185056fe87febba3c52da09a36e2c0f29b255c746` |
| `0030` | `0030_controlled_correction_operations` | `release` | `50aa71ae0199806de3aaf3c57700d2739f2c42bc` | `04b6d10b6f3861585884406a93661948c491836dd1e4a7dde54aabe3a17c06ca` |
| `0031` | `0031_atomic_correction_receipts` | `release` | `d44601f4b6477dc9366fc7a65475a0eede1c34c1` | `a048b907778af4c417b0faaca70def32540bd8c36caa2e0a6696bc40d5d0214a` |
| `0032` | `0030_steam_catalog_abstract_world` | `editor` | `a6d4ce679136b016dc6eed0e490e3e54060ada22` | `1d5ba3e810ce80077e6991d64132042ea0265b1aa1073248dbb389f68a916fdb` |
| `0033` | `0031_steam_catalog_pagination_indexes` | `editor` | `b813547b834febe8e7398d1b2cfe204b84dd1ed5` | `cd36853fa3809868c10fddf8fa763048ff8c56766fcd33c18549af61c136fd77` |
| `0034` | `0032_steam_catalog_classification_revision` | `editor` | `694c4e7d30694551c38a944e44e7dd0efe35f030` | `7a40cea1b9ffaf30d4bd7d5c381aa6eeed711947e97ac49b82d67d682882b211` |
| `0035` | `0033_steam_catalog_trigram_search` | `editor` | `37d550193d7c5280e16195d5f733c59bbabb591b` | `9a6ccbb7adaa71e1fa4171e3c1a4cf3f123c8c96511c33c0bc63a766941ca4f5` |
| `0036` | `0034_steam_catalog_exact_status_counters` | `editor` | `b8958e51a3651b259f851d34c34075f3a4b0de36` | `1c568e03b02c8f8f8ecefc3e3ed35b725bd1aefea88391f334fe036fb4d49f3f` |
| `0037` | `0035_steam_catalog_import_jobs` | `editor` | `fadfe2786d2a119ef663106e541f9e225e2e0000` | `b91e57eaefca7a364e8df11c7854426d0ca1d77410d979b9a40924c647a471d3` |
| `0038` | `0036_steam_catalog_import_job_sources` | `editor` | `382b0e418454df934f3fadcd442180e3b2333727` | `7f9971c9371b891b6484a61294a8204a1f56a7937728496a2f8d4a17808ba2ca` |
| `0039` | `0037_steam_catalog_import_retry_backoff` | `editor` | `5a044dc12b645f68cb8a7fa99f3b455fe7db999e` | `a224635d1501b9f309c049ce471bdbc36263078ed3a0a1328059b2f6041442dd` |
| `0040` | `0038_steam_catalog_global_source_throttle` | `editor` | `332f983a8ea541a1a3579d476dd6e21bcd61c9dc` | `f86c78546c37396d84aa5effc202a6ffab52dae0f592c17229f8ae49c0670b38` |

Each row's original source path is `lib/db/migrations/<original_filename>` **under the corresponding pinned source commit** (not a path claiming that editorial sources are already present under release). The editor snapshots in P05 are reference-only copies and must never be run as if they were an approved application runner.

## 3. Directed dependency graph (logical IDs are authoritative, not filename ordinals)

Proposed topological sequence in manifest: `0026 basket_authority_trigger_bypass` (existing external release predecessor) → `0027 preserve_started_stage_memberships` → `0028 match_revision` → `0029 steam_game_catalog_v1`. Release correction branch continues `0028 match_revision` → `0030 controlled_correction_operations` → `0031 atomic_correction_receipts`. Editor catalog branch continues from `0029 steam_game_catalog_v1` → `0032 steam_catalog_abstract_world` → `0033 steam_catalog_pagination_indexes` → `0034 steam_catalog_classification_revision` → `0035 steam_catalog_trigram_search` → `0036 steam_catalog_exact_status_counters` → `0037 steam_catalog_import_jobs` → `0038 steam_catalog_import_job_sources` → `0039 steam_catalog_import_retry_backoff` → `0040 steam_catalog_global_source_throttle`.

**Important:** SQL `hard_sql_dependencies` and migration-runner `canonical_order_dependencies` are **separate edge types**. The linearized proposed canonical **number** puts editor `0032` after release `0031`, yet the manifest lists the editor `0032` hard/order predecessor as `steam_game_catalog_v1` (0029), **not** the release correction receipt (0031). Owner must ratify an exact **total execution order**, consistent with the true installed DB, before any sequential runner exists. A source DAG is not an applied ledger.

Per-migration edges as transcribed directly from proposal:

- `0027 preserve_started_stage_memberships`: order-after **basket_authority_trigger_bypass**; hard SQL dependencies **basket_authority_trigger_bypass**; original filename `0027_preserve_started_stage_memberships.sql`; `sql_has_embedded_begin_commit=false`.
- `0028 match_revision`: order-after **preserve_started_stage_memberships**; hard SQL dependencies **none**; original filename `0028_match_revision.sql`; `sql_has_embedded_begin_commit=false`.
- `0029 steam_game_catalog_v1`: order-after **match_revision**; hard SQL dependencies **none**; original filename `0029_steam_game_catalog_v1.sql`; `sql_has_embedded_begin_commit=false`.
- `0030 controlled_correction_operations`: order-after **match_revision**; hard SQL dependencies **match_revision**; original filename `0030_controlled_correction_operations.sql`; `sql_has_embedded_begin_commit=false`.
- `0031 atomic_correction_receipts`: order-after **controlled_correction_operations**; hard SQL dependencies **controlled_correction_operations**; original filename `0031_atomic_correction_receipts.sql`; `sql_has_embedded_begin_commit=true`.
- `0032 steam_catalog_abstract_world`: order-after **steam_game_catalog_v1**; hard SQL dependencies **steam_game_catalog_v1**; original filename `0030_steam_catalog_abstract_world.sql`; `sql_has_embedded_begin_commit=false`.
- `0033 steam_catalog_pagination_indexes`: order-after **steam_catalog_abstract_world**; hard SQL dependencies **steam_game_catalog_v1**; original filename `0031_steam_catalog_pagination_indexes.sql`; `sql_has_embedded_begin_commit=false`.
- `0034 steam_catalog_classification_revision`: order-after **steam_catalog_pagination_indexes**; hard SQL dependencies **steam_game_catalog_v1**; original filename `0032_steam_catalog_classification_revision.sql`; `sql_has_embedded_begin_commit=false`.
- `0035 steam_catalog_trigram_search`: order-after **steam_catalog_classification_revision**; hard SQL dependencies **steam_game_catalog_v1**; original filename `0033_steam_catalog_trigram_search.sql`; `sql_has_embedded_begin_commit=false`.
- `0036 steam_catalog_exact_status_counters`: order-after **steam_catalog_trigram_search**; hard SQL dependencies **steam_game_catalog_v1**; original filename `0034_steam_catalog_exact_status_counters.sql`; `sql_has_embedded_begin_commit=false`.
- `0037 steam_catalog_import_jobs`: order-after **steam_catalog_exact_status_counters**; hard SQL dependencies **steam_game_catalog_v1**; original filename `0035_steam_catalog_import_jobs.sql`; `sql_has_embedded_begin_commit=false`.
- `0038 steam_catalog_import_job_sources`: order-after **steam_catalog_import_jobs**; hard SQL dependencies **steam_catalog_import_jobs**; original filename `0036_steam_catalog_import_job_sources.sql`; `sql_has_embedded_begin_commit=false`.
- `0039 steam_catalog_import_retry_backoff`: order-after **steam_catalog_import_job_sources**; hard SQL dependencies **steam_catalog_import_jobs**; original filename `0037_steam_catalog_import_retry_backoff.sql`; `sql_has_embedded_begin_commit=false`.
- `0040 steam_catalog_global_source_throttle`: order-after **steam_catalog_import_retry_backoff**; hard SQL dependencies **none**; original filename `0038_steam_catalog_global_source_throttle.sql`; `sql_has_embedded_begin_commit=false`.

- Manifest external dependency: `basket_authority_trigger_bypass`, actual release file `lib/db/migrations/0026_basket_authority_trigger_bypass.sql`, Git blob `92e0c8e8e37684f7c7b1b397e1839cb5f496c7ab`; an explicit source predecessor does not prove application.
- `0031_atomic_correction_receipts.sql` includes literal embedded `BEGIN; COMMIT;` (source SHA-256 above). Other migration 0024 uses runner-specific embedded block-strip marker. Future runner must pin a documented execution transform and transaction/rollback contract; never silently strip/execute mixed wrappers or use `IF NOT EXISTS` as history proof.

## 4. Explicit original-number conflicts and forbidden assumptions

| Original ordinal | Release original | Editor original | Consequence |
|---|---|---|---|
| `0030` | `controlled_correction_operations` SHA1 `50aa71ae0199806de3aaf3c57700d2739f2c42bc` | `steam_catalog_abstract_world` SHA1 `a6d4ce679136b016dc6eed0e490e3e54060ada22` | **Different SQL**; proposal moves editor logical identity to canonical `0032`, not source byte rewrite |
| `0031` | `atomic_correction_receipts` SHA1 `d44601f4b6477dc9366fc7a65475a0eede1c34c1` | `steam_catalog_pagination_indexes` SHA1 `b813547b834febe8e7398d1b2cfe204b84dd1ed5` | **Different SQL**; proposal moves editor logical identity to canonical `0033`; release includes transaction wrapper |

**Secondary ordinal aliasing:** editor original `0032–0038` maps to **proposed** `0034–0040`, so even original-number “0032” in editor has a different identity from proposed canonical “0032”. A new Basket CAS migration may **NOT** be named `0032`, `0041` or any other guessed number. Do not mutate already published historical SQL or copy editor `0030` over release `0030`.

## 5. Source identity != PostgreSQL execution evidence

A raw-source fingerprint has fields `logical_id, canonical_proposal, original_filename, source_lineage, immutable_source_commit, Git_blob_SHA1, UTF8_SHA256, dependency_edges`; it can prove **which bytes were reviewed**.

A true `APPLIED` receipt instead requires a separately A00-authorized physical PostgreSQL inspection of a dedicated target, recording `cluster/system identifier (protected as needed), host/port/DB/PG-major, target_schema, migration runner SHA+transform, ordered migration key, applied-at/app-commit, executed-input content checksum, verified postconditions, receipt transaction identity and approval reference`. No existing `app_schema_migrations` ordinal/table existence by itself proves exact SQL executed. Release ORM `lib/db/src/schema/tournaments.ts` declares only `migration_key, applied_at, app_commit, target_schema, deployment_environment`, **not source checksum**; a legacy row must be correlated with independent immutable source+runner evidence.

Actual current target DB state: **UNKNOWN**. **PostgreSQL connected? NO. SQL executed? NO.** Specifically, no affirmative claim that release 0027–0031 or editor 0030–0038 are already physically applied, nor that editor patches can be replayed harmlessly. Historical present/orphan/partial/mixed-ledger profiles remain `REVIEW_ONLY` or `STOP`, not auto-adoptable.

## 6. Exact decision A00 can now make

A00 may approve this **SOURCE_CANONICAL_GRAPH_PROPOSAL** as basis for implementing a **read-only, checksum-bound historical reconciliation plan**, and explicitly select:
1. release correction 0030/0031 and editor catalog original 0030/0031 as **distinct source identities** (never collapse by ordinal);
2. ratify the **total canonical order + branch crossing**, not only partial dependencies;
3. choose source of truth for actual applied history/receipt checks, target DB owner/environment and strict unknown/mismatch/orphan policy;
4. after real physical ledger evidence, approve or reject the **proposed** canonical numbers 0027–0040;
5. only **after** graph/adoption + concurrent allocation check, separately assign a unique identifier to T055.

A00 **cannot** legitimately approve live SQL or migration deployment based on this report alone.

**R23A final for this artifact:** `SOURCE_GRAPH_SHA1_14_OF_14_VERIFIED / SOURCE_GRAPH_SHA256_14_OF_14_VERIFIED / PROPOSAL_ONLY_NOT_APPROVED / PHYSICAL_HISTORY_UNKNOWN / SQL_STOP`.
