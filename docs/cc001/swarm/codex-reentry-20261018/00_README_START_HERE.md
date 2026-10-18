# CC-001 — CODEX RE-ENTRY / START HERE (2026-10-18)

## ONE IDENTICAL PROMPT FOR ALL EXISTING AGENT THREADS

**CANONICAL PROMPT:** https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/UNIVERSAL_PROMPT_ALL_THREADS.md

Paste the **entire content of that one file, unchanged** into each existing CC-001 thread. The universal prompt does not assign everybody a shared identity. Instead it requires each existing thread to recover its OWN prior user-assigned role from that thread's history BEFORE reading any cross-role documentation, and uses a fixed role→Issue→branch table. For example: existing QA thread 60 must remain A60 and work Issue #126; game design thread 10 remains A10 and has NO new independent READY W4 assignment.

**FIRST RESPONSE CONTROL:** A60 expected: `IDENTITY_CHECK | CC-001 | A60 | ISSUE #126 | READY`. If A60 responds as A10, says #139, or gives a different branch: STOP before writing; do not allow code commits.

## Key limitation

An entirely NEW Codex session with no earlier identity assignment CANNOT infer its own role from an identical undifferentiated prompt. That is a fundamental missing-input limitation. Such a session must report `IDENTITY_CONFLICT` and make NO modifications. For fresh blank Codex sessions only, the previously created `ROLE_LOCK_Axx.md` files remain optional explicit identification aids; they are NOT the primary one-prompt workflow for existing already-labeled threads.

## Shared work instructions

Master dispatch:
https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-w4-master-dispatch-20261018/docs/cc001/swarm/R17_W4_MASTER_DISPATCH_20261018.md

Existing wave R17-W4 RECOVERY; NOT a new W5. READY: A60 G0 #126, A73 #136, A72 #113, A40 #92, A50 #138. WAIT: A70 #137, A71 #140, A74 #141, A20 #95, A31 #94, later A60 candidate #139. A10/A41/A51 have no new independent W4 assignment.

Supporting docs:
- `02_VERIFIED_STATE_AND_GATES.md` — previous snapshot only; agents must refetch live GitHub state.
- `03_AGENT_ROUTING.md` — reference; do not derive role from its ordering.
- `04_HANDOFF_AND_TEST_EVIDENCE.md` — exact SHA, changed paths, executed tests/NOT_RUN, five status axes.
- `05_WAITING_AGENTS.md` — actual prerequisite gates.
- `STATUS_SNAPSHOT.json` — last known role/issue/head snapshot; current GitHub takes precedence.
- `agents/Axx_*.md` — technical specialist details; consult only AFTER thread identity is fixed.

No main merge, no public release/deploy, no force-push/destructive operations, no V148/frozen R16 changes, no protocol 149 changes, no unauthorized path modifications. Published prompts do not automatically start other conversations.

## Suggested use

1. Copy **only** `UNIVERSAL_PROMPT_ALL_THREADS.md`.
2. Paste that exact same text into every EXISTING CC-001 agent thread.
3. Verify each first reply's `IDENTITY_CHECK` against the thread's established role.
4. Allow READY roles to work on isolated branches; others only acknowledge WAIT/NO_TASK.
5. Review their GitHub Issue HANDOFF and exact SHA via HQ Issue #97.
