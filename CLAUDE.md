# CLAUDE.md — CC-001 Core Clash Unity ONLY

> **Read first:** [W16 Claude Code handoff](docs/cc001/swarm/w16/CLAUDE_CODE_HANDOFF.md) and [task #280](https://github.com/C8LyNn/aplikacja-turnieje/issues/280). **HQ:** [#97](https://github.com/C8LyNn/aplikacja-turnieje/issues/97).
>
> This branch provides instructions to Claude; it does not change the game, approve a build, or start deployment.

## Repository scope and context
- This is a **mixed-purpose monorepo**. Your assignment is only **CC-001 / Core Clash Unity**, not the tournament application / SWARM-006.
- Unity project: `unity/cc001-r16/CoreClash-V149-Unity/`. Engine: **Unity 6000.4.0f1**.
- C# gameplay, netcode, physics, UI: under Unity project's `Assets/CoreClash/`; managed tests: `Tests/`; exact Windows build tooling: `scripts/cc001/w10/a72/`.
- The historical Unity project's README describes R16 and earlier: do **not** treat old build/QA PASS as proof for R17.
- Use GitHub issues/PRs as operational truth; start from #280 and follow dependencies in #97, A70 #137, A72 #113 and A60 #139.

## Immutability / owner design rules
- **W11 QA SOURCE** (build/read-only; NEVER modify): branch `integration/cc001-r17-w11-qa-freeze-20261030`, exact SHA `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`.
- A72 canonical **build kit** is **separate source**, Draft [#188](https://github.com/C8LyNn/aplikacja-turnieje/pull/188). Handoff branch begins at kit HEAD `aa6e047cd7661961978fedcc91ff14dfc29a02f4`. It builds the frozen QA tree in isolation.
- W11 frozen SHA lacks later development `CC_W11_STATE_TX/RX` telemetry and TELEPORT/SWAP render fixes; never claim those are tested on the freeze. #207/#266/#W12–W15 are distinct DEV source.
- **Mitosis:** retain actual V148 behavior; no generic wall/structure/obstacle split. **Furnace:** FIRE zone + periodic damage only; no extra direct instant damage. **HP:** preserve all R16 catalog values.
- Protect original V148/R16/RC1, Protocol149, catalog, `main`, QA freeze, source and asset .meta identity. Do not alter protected paths without a separate authorized decision.
- No force-push, destructive cleaning/reset, unauthorized PR merge, deployment, release or remote network exposure. Do not post raw private logs, tokens, IPs or private artifacts to this **public** repository.

## Execution rules for Claude
1. Keep your own `claude/cc001-*` branch/worktree. Do not directly push to other agents' branches.
2. Check exact `git rev-parse HEAD`, source ref, diff and file ownership before any edit. If the active branch is wrong, STOP rather than silently switch source.
3. Start with **P0 real Windows build** from #280, using canonical A72 scripts, not creating a competing builder. Ask user only for actual host/license/install/permissions blockers.
4. On an authorized Windows host with Unity 6000.4.0f1 Windows support + license, .NET SDK 9, Node22, perform verified kit self-tests and `scripts/cc001/w10/a72/URUCHOM_W11_PR207.cmd` (legacy name, frozen source).
5. Debug **observed** failures, write minimal regression tests, and submit a Draft PR scoped to builder scripts if needed. No speculative refactors/ability changes.
6. Record exact tested source + commit SHA, commands, exit codes, fresh .NET9/Unity logs, file SHA256 manifest and limitations. Node/static/source tests != C# tests != native Player != independent PC1/PC2 QA.
7. Coordinate handoff through GitHub: A70 selects, A72 owns build process, A60/A31 independently QA actual same Player on two physical PCs. **Never self-certify G3/G4 or release**.

## Definition of Done / reporting
Report: `DESIGNED / IMPLEMENTED / TESTED / QA_ACCEPTED / READY_FOR_INTEGRATOR / INTEGRATED / RELEASED`, each independently; link issue, Draft PR, own branch, commit SHA, exact files, actual command+exit, known failures, next owner. If no Windows executable exists, report `BLOCKED_OPERATOR` rather than PASS.

Communicate with user in Polish. Continue only within the explicit assigned scope.