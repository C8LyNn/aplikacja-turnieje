# CC-001 / R17-W4 — CODEX RE-ENTRY PACK
## START HERE — prepared by A00/HQ, 2026-10-18

**PURPOSE:** Resume the already-authorized unfinished R17-W4 work using real Codex sessions and existing GitHub Issues/feature branches. This is a task handoff, not a new wave, integration approval or release approval.

**AUTHORITATIVE MASTER DISPATCH:** https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-w4-master-dispatch-20261018/docs/cc001/swarm/R17_W4_MASTER_DISPATCH_20261018.md
**DISPATCH COMMIT SHA:** 661660d3a3dc8a4fa2c9afea489050247f64c38c
**HQ INTEGRATION ISSUE:** https://github.com/C8LyNn/aplikacja-turnieje/issues/97

## Files in this packet

- 01_CODEX_GLOBAL_PROMPT.md — optional single Codex lead/coordinator prompt.
- 02_VERIFIED_STATE_AND_GATES.md — latest verified ref/issue status, authoritative project facts and blockers.
- 03_AGENT_ROUTING.md — five actionable assignments and agents waiting for gates.
- 04_HANDOFF_AND_TEST_EVIDENCE.md — common evidence/check-in format for Codex agents.
- agents/A60_SOURCE_ADMISSION.md — A60 G0 independent read-only source gate; Issue #126.
- agents/A73_MERGE_PREFLIGHT.md — A73 exact W3 ancestry/conflict map; Issue #136.
- agents/A72_MANAGED_CI.md — A72 .NET 9/CI runner; Issue #113.
- agents/A40_LIFECYCLE_IMPLEMENTATION.md — A40 narrow five-ability lifecycle/RETURN; Issue #92.
- agents/A50_FROSTGUARD_F02.md — A50 test-first Frostguard physics parity; Issue #138.
- 05_WAITING_AGENTS.md — A70/A71/A74/A20/A31/A60 post-candidate wait conditions.
- STATUS_SNAPSHOT.json — machine-readable refs and assignment map (snapshot, not a live status feed).

## How to use: five independent Codex sessions (recommended)

Open FIVE DIFFERENT Codex sessions, one for each READY role, never five agents editing one branch/worktree.

1. In session A60 paste the URL of agents/A60_SOURCE_ADMISSION.md and tell Codex to read and execute that file.
2. In session A73 paste agents/A73_MERGE_PREFLIGHT.md.
3. In session A72 paste agents/A72_MANAGED_CI.md.
4. In session A40 paste agents/A40_LIFECYCLE_IMPLEMENTATION.md.
5. In session A50 paste agents/A50_FROSTGUARD_F02.md.

First tell each session to read the W4 MASTER DISPATCH and this packet's 02_VERIFIED_STATE_AND_GATES.md + 04_HANDOFF_AND_TEST_EVIDENCE.md. Each agent MUST fetch current GitHub branch, Issue and checks again; the snapshot can go stale. If Codex cannot fetch GitHub URLs, provide a local clone and use the commands below or paste the agent file contents. Do not substitute speculation for repository reads.

A single session cannot magically make other already-existing ChatGPT threads run. The global prompt is appropriate only if your Codex environment supports coordinated independent worktrees/agents; otherwise use the five prompts above one per session.

## How to read the packet in a local Git repository

In an existing clean local clone of C8LyNn/aplikacja-turnieje:

    git fetch origin docs/cc001-r17-w4-codex-reentry-20261018
    git show FETCH_HEAD:docs/cc001/swarm/codex-reentry-20261018/00_README_START_HERE.md
    git show FETCH_HEAD:docs/cc001/swarm/codex-reentry-20261018/03_AGENT_ROUTING.md

GitHub links are also available using this exact branch path:
https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/00_README_START_HERE.md

**IMPORTANT:** The packet branch is documentation-only. It is NOT a development branch for any agent. After reading it, the Codex agent switches to the assigned existing Axx branch and pushes only changes within the exclusive file allowlist. Do not merge this documentation branch or any agent branch to main.

## When a session finishes

Each session publishes a report under its OWN authorized docs path, makes an isolated commit on its OWN assigned branch, verifies remote HEAD/readback, and comments on its ORIGINAL Issue with exact SHA/path/commands/results/NOT_RUN/5-axis statuses. HQ can use #97 to collect links. If unable to push, the agent must provide a patch and exact blocker, without saying the remote task is completed.

**NON-NEGOTIABLE:** no main merge, no deployment, no force push, no frozen R16/V148 mutation, no Protocol 149 change, no fake Unity/.NET/physical PASS, no expanding source ownership.
