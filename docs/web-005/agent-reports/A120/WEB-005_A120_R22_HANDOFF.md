# WEB-005 — A120 / R22 FINAL HANDOFF TO A00

**Task:** `WEB-005-T100-A120-R22` · **Agent:** A120 — Presentation & Bracket Views · **Date:** 2026-10-15 Europe/Warsaw.  
**Authority:** central R22 prompts blob `f616bca63a441bc2a4eead64ff67586e57e2b6ca`, §§0–2 and AGENT A120.  
**Mode:** `SOURCE ONLY / NO CODE GO`.  
**Status:** `R22_SOURCE_MAPPING_COMPLETE / R23_CODE_GO_REQUIRED / A60_R21_REVIEW_ACKNOWLEDGED / RUNTIME_NOT_EXECUTED / WEB005_IN_PROGRESS / SWARM006_HOLD / RELEASE_NO_GO`.

## 1. Required deliverable — published and source-grounded

**[WEB-005_A120_R22_S2_S5_S6_HANDOFF.md](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/agent-reports/A120/WEB-005_A120_R22_S2_S5_S6_HANDOFF.md)**

This complete source/UX contract identifies precise backend/UI/OpenAPI/DB schema read and test locations, exclusive R23 ownership boundaries, and deterministic fixtures for **S2 generated `currentRound` vs earliest playable `actionableRound`**, **S5 legally decisive GF/reset runner-up**, and **S6 second-loss elimination-wave competition ranking (3,3,5)**. All source/test file paths and real R21 owner-delegated game policy are documented. **No application source was changed in R22.**

**Most important actual source gaps:**
- **S2:** stage and tournament `currentRound` fields exist; stage start and Swiss generation write them. Neither `stage-queries.ts` nor `lib/api-spec/openapi.yaml` publishes `actionableRound`; Host/Public bracket display current generated round. Following SE feeder Revert with R2 already generated, required state is `currentRound=2 / actionableRound=1`, not rolled-back generated pointer.
- **S5/S6:** `stage-lifecycle.ts` DE completion currently sorts champion first and other participants by `stageSeed`, then writes `rank=index+1` into `stageParticipants.finalRank`. It cannot infer runner-up from actual deciding GF/reset nor tie wave peers. Correct future implementation requires source-of-truth DE routing evaluation, causal lower elimination-wave logic, explicit BYE/walkover rules and transactional rank persistence. No client-side ranking re-numbering.
- **Future integration:** PR47 dedicated DE graph and PR54 RR401/403 guard modify the same `stage-progress-view.tsx`; PR43 CSV, PR50 Backup preview, PR54 RR observer modify same `tournament-detail.tsx`. File overlap does not mean a verified same-hunk conflict. Preserve features of all candidates after separately authorized final integration.

## 2. Verified frozen GitHub pins and independent QA

- Release `release/tournament-ops-20261013-01@1fdc401d87c6bffe6bf7312dfc9db681b689dcf7` — unchanged.
- [PR47](https://github.com/C8LyNn/aplikacja-turnieje/pull/47) `OPEN DRAFT` HEAD `f09a13623faca8d7ab29b09a2c5b43907c2acd0b`.
- [PR54](https://github.com/C8LyNn/aplikacja-turnieje/pull/54) `OPEN DRAFT` HEAD `bfa9d075b431185aa8bbf87bf021d64dde8ae22f`.
- PR43 `96a6068f69027574ac76e18d4d5a2c444b5a914a` / PR50 `5457a74187edc263730c3a4b25a663bdf5531ee9`, OPEN DRAFT.
- [Independent A60 R21 report](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a60-r18-independent-qa-20261014/docs/web-005/agent-reports/A60/WEB-005_A60_R21_OWNER_SIGNOFF_INDEPENDENT_QA.md), Git blob `47dc44f980734ce68dd63769ba3f25ad60dc899f`: P14/P21 `SOURCE_ACCEPTED_CONDITIONAL` **only** for existing source; overall `HANDOFF_NOT_READY`. **No claim of independent acceptance of future S2/S5/S6 code.**

**Approved policy inputs (do not reopen):** sport S2-B / S5 / S6 from [delegated sport decisions](https://github.com/C8LyNn/aplikacja-turnieje/blob/chore/web-005/t000-wave1-control/docs/web-005/WEB-005_R21_OWNER_DELEGATED_SPORT_DECISIONS.md), plus separately approved S1/S3/S4, Basket T055 D1–D6, Backup B1–B6. Owner choices remain implementation and test obligations, not evidence of completion or authorization for R22 A120 code.

## 3. Runtime truth and next A00 decision

**Actual A120 execution:** native RTL `NOT_EXECUTED`; TypeScript/typecheck `NOT_EXECUTED`; build/browser `NOT_EXECUTED`; API/PG16 `NOT_EXECUTED`. There are **no native app command exits, TAP counts or PASS**. Work consisted of GitHub source, PR/head, owner decision, A60 provenance checks and writing two documentation artifacts. A50 still lacks an approved full exact-SHA workspace and isolated PG16 per R21 evidence.

**Exact next GO required from A00:** assign **exclusive future R23 code-file lanes** for (a) SE actionableRound read projection/API contracts, (b) pure DE ranking helper + `stage-lifecycle.ts` persist, and (c) downstream Host/Bracket/StageProgressView/Audience updates coordinated with PR47/54/43/50. Require test-first exact-SHA source changes in fresh authorized PRs and independent A60 QA; if API schema/DB change is contemplated, A20 reviews it first. Cross-policy original WEB004 38-case provenance, other high-stakes owner choices and runtime-debt/final-go remain the lead/HQ gates.

**Hard STOP respected:** no app code, no PR creation, merge/rebase/cherry-pick, no SQL/DDL or database reset, no paid CI, no staging/live, no SWARM-006 call. **WEB005 remains open; RELEASE NO-GO.**

**END:** `WEB-005_A120_R22_HANDOFF_PUBLISHED / SOURCE_ONLY / NEXT_R23_GO_REQUIRED`.
