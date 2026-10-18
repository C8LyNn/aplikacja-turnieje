# WEB-005 A50 R23H-R5-R2 — 0029 → 0030/0031 source dependency disposition

**Mode:** SOURCE REVIEW ONLY. Source baseline: `fa3261b2c9510e110ac9eba21726812d3401a525`. No migration SQL executed. No migration files modified.

| Migration | Exact C01 Git blob SHA-1 | Direct source contract | Current integration fixture |
|---|---|---|---|
| 0029 Steam catalogue | `e6c6ff4c4bc81181391a3b6cedafba3ab96c6c41` | Creates `steam_catalog_games`, `steam_catalog_terms`, `steam_catalog_game_terms` plus indexes, constraints and DML seed | **OMITTED** from `test-database.ts` reset (0001–0028), S2 Catalog (0001–0011), S2 Drizzle (0001–0020), special Pack17 correction test |
| 0030 Controlled correction | `50aa71ae0199806de3aaf3c57700d2739f2c42bc` | Header says to apply **after 0001–0029**; creates `public.tournament_correction_operations`, referencing `public.tournaments`, `public.matches`. Direct source DDL does **not** refer to 0029 Steam tables. | Explicit 0030 in `tournament-atomic-correction-postgresql.integration.test.ts` after `resetTestSchema()` 0001–0028 |
| 0031 Atomic correction receipts | `d44601f4b6477dc9366fc7a65475a0eede1c34c1` | Alters objects created by **0030** | Explicitly applied after 0030 in same test |

## Resolution / rule

Distinguish **operational full-history order** from **narrow test fixture scope**. The canonical deployment history specifies `0029 → 0030 → 0031`; keep that order and do not rewrite history. The existing narrowly scoped correction fixture intentionally applies 0030/0031 to a test schema initialized through 0028. From direct static DDL, 0030 does not reference Steam catalog objects created in 0029. **This is evidence of no obvious direct table/foreign-key dependency, not proof of transitive independence or safe full-history omission.**

**Decision:** preserve test source behavior under this source-only scope (no injection of 0029 into fixtures), document deviation and classify `MIGRATION_0029_PREREQUISITE_REVIEW_PENDING_A22` until SQL owner reviews full source/dependency graph. The full forward-only application of 0029–0031, interactions with STEAM objects and any deployment implications require a different approved test plan. No fabricated PASS or migration simulation.

**Authoritative gate:** A22/A20 must explicitly accept source-level narrow-fixture omission or issue a new separately scoped change; future G2/G4 SQL verification remains HOLD. No SQL, Docker or CI.
