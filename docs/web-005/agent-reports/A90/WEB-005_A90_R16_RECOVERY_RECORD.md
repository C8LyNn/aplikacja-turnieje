# WEB-005 A90 — R16 recovery record (not a reconstructed original report)

**Agent / original assignment:** A90 — Backup V3 Integrity & Restore; `WEB-005-T060-A90-B1-POSITION-R16`.  
**Original instructions:** [WEB-005_WAVE_R16_AGENT_PROMPTS.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_WAVE_R16_AGENT_PROMPTS.md), §AGENT A90, original blob `688e9c149dcf542587125d5f05a4a9683f3ac156`.  
**Recovery date:** 2026-10-14 Europe/Warsaw. **Status:** `R16_ARTIFACTS_UNAVAILABLE / SOURCE_ONLY_NOT_PUBLISHED`.

## Verified R16 baseline and what was *not* recovered

- A90's prior recorded R15 [handoff](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A90/WEB-005_A90_R15_HANDOFF.md) is verifiably published. It is **not** evidence of a new R16 implementation.
- At R17 intake PR [#41](https://github.com/C8LyNn/aplikacja-turnieje/pull/41) remained OPEN DRAFT, exact HEAD `e847cb705296a48ab5c68ece96776cd0e0bbb417` against release `1fdc401d87c6bffe6bf7312dfc9db681b689dcf7`; the old B1 validator had no complete basket-position parity.
- The R16 A90 expected `WEB-005_A90_R16_PR41_POSITION_PARITY_PATCH.md` and `WEB-005_A90_R16_HANDOFF.md` were not found under the central agent-reports path; no matching A90-R16 branch or verifiable original R16 patch SHA was found.
- Prior conversation context did not surface an original R16 patch, test result, commit or full report suitable for faithful republication. Consequently **do not invent an R16 SHA, assert that R16 work was not done in any environment, or mark R16 as PATCH_COMPLETE**.
- No original R16 application tests or PostgreSQL16 execution logs were recovered. `TESTS_NOT_EVIDENCED`, **not** `PASS`.

## R17 conditional recovery (separate from historical R16)

With the bounded R17 GO on the **same existing PR41 branch**, A90 created new test-first and implementation commits after verifying R16 publication was absent. **These are R17 commits, not retrospective R16 commits**. Record actual new HEAD and diff in [R17 position result](./WEB-005_A90_R17_PR41_POSITION_RESULT.md) and [R17 handoff](./WEB-005_A90_R17_HANDOFF.md).

**Evidence label for A00:** `R16_THREAD_CLAIMED_COMPLETE / R16_SOURCE_ARTIFACT_NOT_VERIFIED / R17_CONDITIONAL_RECOVERY_DELIVERED`. Do not replace the historical R16 report with this recovery record.
