# WEB-005_A90_R14_HANDOFF

**AGENT / ROLE:** A90 — Backup V3 Integrity & Restore  
**TASK / WAVE:** `WEB-005-T060-A90-R7` / R14.1 · 2026-10-14 Europe/Warsaw  
**MODE / AUTH:** SOURCE-ONLY / BACKUP QA SUPPORT; **NO CODE, SQL, MERGE, DEPLOY or SWARM-006**.  
**Main deliverable:** [WEB-005_A90_R14_B2_POLICY_GATE.md](./WEB-005_A90_R14_B2_POLICY_GATE.md) — verified source/CI, B1/B3A QA, B2 owner decisions D1–D6, A50 synthetic fixture and A60 matrix.  
**This final:** `WEB-005_A90_R14_HANDOFF.md`.  
**REPORT BRANCH:** `docs/web-005/a90-r14-b2-policy-gate` from release baseline `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`.

## Exact source PRs and evidence

| Item | PR / SHA | State |
|---|---|---|
| B1 preclone P08 | [#41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) `e847cb705296a48ab5c68ece96776cd0e0bbb417` | OPEN DRAFT, not merged. 4 changed files: B1 validator, `backup-v3.ts`, route execution integration test, R9 doc. `PATCH_PROPOSED`, no verified A50 PG16/A60 exact-SHA acceptance |
| B3A MVCC P15 | [#48](https://github.com/C8LyNn/aplikacja-turnieje/pull/48) `2a8a4c72cb4a3a37402a346fd0acc83b03b39be3` | OPEN DRAFT, not merged. 2 changed files: `backup-v3.ts`, route execution integration test. `PATCH_PROPOSED`, no verified A50 PG16/A60 exact-SHA acceptance |
| Pack19 blocker | [#35](https://github.com/C8LyNn/aplikacja-turnieje/pull/35) `7cb283aa82273a1e22daf9051a82311eef53760c` | Separate obsolete matcher correction; unmerged; not an A90 lane |
| A70 historical Undo dependency | [#51](https://github.com/C8LyNn/aplikacja-turnieje/pull/51) `2fd8b5107a6f39e28c58be10d0d3ef0ee8216c1a` (last known) | Separate A70 owner; no A90 changes |

**BASE** for #41/#48 is release `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`; neither contains the other's edits. Their conflicts include `backup-v3.ts` **and the shared integration test file**.

**Real CI job evidence:** #41 head run `38585495598`, job `115926270437` FAIL; #48 head run `38596228642`, job `115963545435` FAIL. Full GitHub job logs explicitly show Pack19 regex `readOnly:true` expected but source uses `accessMode:"read only"`; **Static and database release gates skipped**. No subsequent native Backup tests executed within those workflows, and no A50 physically isolated PG16 PASS or A60 exact-head signed acceptance was found in checked reports/reviews. Zero review events on #41/#48; an off-repo QA report cannot be ruled out.

**A90 real tests in R14:** `NOT_EXECUTED`. Performed GitHub source, PR, commit diff, jobs and logs read operations only. **No TypeScript/typecheck, npm/pnpm, HTTP integration or PG16 command, no runtime exit code and no TAP totals.** Test cases in source and future fixtures are not proof.

## Findings and owner gate

- **B1 SOURCE_CONFIRMED:** preclone QP→QPE→OP and route receipt validation; 12 authored corruption cases. **NEXT A50:** verified safe PG16 on exact SHA, valid legacy approved+route import, all 12 `400 INVALID_BACKUP_V3` + zero clone root/child rows, separately induced *late* transactional failure with full rollback. A60 independent review.
- **B3A SOURCE_CONFIRMED:** one `REPEATABLE READ`, `accessMode:"read only"` export transaction, same `tx` routing helper; two authored deterministic writer/barrier cases. **NEXT A50:** establish old E/fresh E2 consistency on real 2-connection PG16, plus history-specific supplemental test; A60 independent review.
- **B2 SOURCE_CONFIRMED:** V3 omits DB match CAS `matches.revision`, distinct history revision; current validator checks individual history referents but not latest-vs-completed match tuple; nested Undo ID remap uses `?? originalId` fallback; original action IDs not serialized for equal-timestamp ordering.
- **Critical schema precision:** current generated V3 requires `resultHistory` and `actionLog` *arrays*, which may be **empty**; a log `undoPayload` is **nullable**. Absent `actionLog` *property* is a separate invalid-shape/older-producer compatibility question, not an "optional" V3 field.
- **POLICY_OPEN / A00+HQ:** D1 modern strict profile/legacy identification; D2 missing and mismatched latest history; D3 CAS revision portability; D4 active completion Undo & ordering; D5 unmapped nested IDs; D6 preclone typed 400 / late rollback + old V2/V3 positive acceptance. No silent strict rejection of old legal backups or future B2 patch in R14.
- **Future bounded B2 proposal:** after written D1–D6 and **separate A00 CODE GO**, test-first pure profile-gated validation before clone, positive legacy paths retained, no DDL. If version fields/schema changes are required, request re-scoping; do not invent a fourth R14 code lane.

## Dependency/stop matrix

**A20:** physical PG16/schema 0028/CAS and result-history triggers; **A70:** global LIFO, completion action/Undo semantics; **A50:** physically isolated test execution with `TEST_DATABASE_URL`, `TEST_DATABASE_SCHEMA=tm_test_*`, `TEST_DATABASE_RESET=DROP_TM_TEST_SCHEMA`, owner-approved dedicated PostgreSQL16 only; **A60:** exact-SHA independent SOURCE verdict and matching real runtime logs; **A00/HQ:** owner policy signed and backlogged; **A10:** internal P08/P15 dependency tracking, final-only.

**R14 files changed by A90:** exactly **two docs-only additions** on `docs/web-005/a90-r14-b2-policy-gate`; **zero application code files**. No merge or source PR for this documentation handoff.

**END STATE:** R14 A90 SOURCE-ONLY **DELIVERED**. B1 and B3A remain `PATCH_PROPOSED` / real PG16 `NOT_EVIDENCED` / independent QA `PENDING`. B2 remains `POLICY_OPEN`; owner signoff and A50/A60 actual evidence are the unblockers. **WEB-005 RELEASE_NO_GO. SWARM006_FINAL_HANDOFF_DEFERRED.**
