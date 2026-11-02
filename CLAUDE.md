# CLAUDE.md — CC-001 CORE CLASH UNITY ONLY

> **OWNER ORDER 2026-11-02 — REVIEW FIRST.**
> Your **FIRST** assignment is to **understand and critically evaluate the Core Clash game**, not to build it, edit code or implement fixes. Read [GitHub Issue #280](https://github.com/C8LyNn/aplikacja-turnieje/issues/280) and [W16 handoff](docs/cc001/swarm/w16/CLAUDE_CODE_HANDOFF.md). After an evidence-backed review, **STOP and ask owner to choose implementation priorities**. Any old instruction that says “start native Windows build first” is superseded.

## Scope
- This monorepo contains multiple projects; work **ONLY on CC-001 / Core Clash Unity**, not tournament app or SWARM-006.
- Unity game: `unity/cc001-r16/CoreClash-V149-Unity/`, engine **Unity 6000.4.0f1**.
- Relevant C# gameplay/physics/netcode/UI under `Assets/CoreClash/`; managed tests under `Tests/`; CC-001 scripts `scripts/cc001/`.
- Actual game: turn-based physics arena; fire balls from launchers; decks, special-ball abilities, bases, local multiplayer/remote PC1 host+PC2 client, Replay, turn and tiebreak rules. Verify actual code; old R16 README is historical context, not proof of newer release functionality.
- HQ [#97](https://github.com/C8LyNn/aplikacja-turnieje/issues/97), A70 integration [#137](https://github.com/C8LyNn/aplikacja-turnieje/issues/137), A72 build [#113](https://github.com/C8LyNn/aplikacja-turnieje/issues/113), A60 QA [#139](https://github.com/C8LyNn/aplikacja-turnieje/issues/139), A31 network [#94](https://github.com/C8LyNn/aplikacja-turnieje/issues/94).

## W16 PHASE 1 — READ-ONLY GAME REVIEW
1. Read source and game docs: `README.md`, `HANDOFF_R16_README.md`, `MIGRATION_STATUS.md`, `FEATURED_DECK_PORT_STATUS.md`, `NETWORKING_STATUS.md`, R16 QA/report, ability catalog/registry, tests and relevant recent agent code in #207/#266. Read sources at pinned SHAs.
2. Evaluate **gameplay loop, feel, tactics, variety/balance, card/ability coverage, UX/onboarding, player-2 perspective, network authority/synchronization, architecture and testability**. Identify genuine strengths, weaknesses, likely player friction and achievable MVP direction.
3. Compare separate source snapshots: historical R16, W11 frozen QA and latest selected DEV. **W11 QA immutable ref** `integration/cc001-r17-w11-qa-freeze-20261030` = `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`. #207/#266/other W12–W15 features are **not** contained in the frozen binary.
4. If a known-safe existing game Player or Editor scene is available, observe firsthand a local match, deck selection, physical launch/Replay, special effects and UI; multiplayer only if two genuine devices/build exist. **Do not require a new build or install tools for this evaluation.** If no runtime exists, transparently mark `PLAYTEST_NOT_RUN`.
5. Classify claims: `OBSERVED_RUNTIME / VERIFIED_SOURCE / HISTORICAL_REPORT / HYPOTHESIS`. Never claim runtime observed from code or old docs; distinguish `UNITY_READY / PARTIAL / DATA_ONLY / NOT_PORTED`.
6. Deliver an actionable Polish review in [Issue #280](https://github.com/C8LyNn/aplikacja-turnieje/issues/280) and short HQ #97 update: strengths, top issues, P0/P1/P2 recommendations with evidence, player impact, S/M/L estimate and acceptance criteria; separate genuine design-owner questions. **Then stop, wait for owner decision.**

## Protected decisions / Git safety
- **Mitosis exactly V148** (no generic wall/obstacle-triggered split).
- **Furnace only FIRE zone + periodic DoT**, no additional immediate damage packet.
- **HP R16 catalog unchanged**.
- Protect V148, R16, RC1 `10f64e4d213f17a352ed8fa83bc75884a39549f0`, Protocol149, QA freeze, `main`, releases, Unity asset GUID/meta. No force pushes, destructive git ops or unauthorized merges/deployments.
- First phase is read-only as to game source and behavior. May report findings through GitHub; do not submit unsolicited gameplay fixes.
- Repo is **public**. Never paste private credentials, original private logs, local IPs or binary artifacts into public issues.
- Work on own `claude/cc001-*` branch/worktree if necessary; no edits to other agents' branches. Communicate with user in Polish.

## Phase 2 — ONLY AFTER OWNER PRIORITIZATION
Claude may then become principal implementation engineer with Draft PRs, real tests and source integrity. Outstanding A72 #188 Windows native build / physical A60-A31 2PC QA remains important, **but is no longer the first Claude action**. Do not count Node/source checks as Unity/physical G3 PASS.

**Status:** W16 review pending; no Claude-run review, gameplay modification or QA approval implied by this document.
