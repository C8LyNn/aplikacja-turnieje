# CC-001 R17-W4 — Role/Issue/Branch reference (NOT a prompt)

**Paste ONE SAME full universal prompt into every EXISTING CC-001 thread:**
https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/cc001-r17-w4-codex-reentry-20261018/docs/cc001/swarm/codex-reentry-20261018/UNIVERSAL_PROMPT_ALL_THREADS.md

The agent must identify itself solely from earlier direct assignment within THAT existing thread BEFORE opening shared documents. Role table is a lookup, NEVER a way to choose or change role. A60 is not A10.

| Pre-existing thread role | Current W4 Issue | Assigned branch / source | Gate |
|---|---|---|---|
| A60 — QA | #126 | feat/cc001-r17-w3-a60-baseline-qa | READY source G0 |
| A73 — Git | #136 | feat/cc001-r17-w4-a73-merge-preview | READY |
| A72 — CI | #113 | feat/cc001-r17-w4-a72-managed-ci | READY |
| A40 — Gameplay | #92 | feat/cc001-r17-w4-a40-lifecycle-return | READY |
| A50 — Simulation | #138 | feat/cc001-r17-w4-a50-f02-physics | READY |
| A70 — Integration | #137 | integration/cc001-r17-w4-disposable-candidate-20261018 | WAIT G0 + A73 |
| A71 — Integrity | #140 | feat/cc001-r17-w4-a71-candidate-integrity | WAIT candidate |
| A74 — Hygiene | #141 | feat/cc001-r17-w4-a74-candidate-hygiene | WAIT candidate |
| A20 — UX | #95 | prior W3 compact layout + gated physical QA | WAIT G2 |
| A31 — Network | #94 | prior A31 network docs + gated physical QA | WAIT G2 |
| A60 (future candidate phase) | #139 | feat/cc001-r17-w4-a60-candidate-qa | WAIT candidate G1/G2 |
| A10/A41/A51/others | none newly assigned | no branch change | NO_TASK |

Do not confuse A60 G0 Issue #126 with future A60 candidate QA Issue #139.
A10 authored game semantics but is not the owner of A60. Prior contract authors are context only.

Identity control:
`IDENTITY_CHECK | CC-001 | A<agent based on this thread's earlier user assignment> | ISSUE #<row above> | READY/WAIT/NO_TASK`.

When the conversation lacks a readable prior agent assignment, write `IDENTITY_CONFLICT — NIE WYKONUJĘ ZMIAN`, do not guess and do not write any files. For an entirely blank new session, one identical prompt cannot create different identities without extra context.

Source and task authority:
https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-w4-master-dispatch-20261018/docs/cc001/swarm/R17_W4_MASTER_DISPATCH_20261018.md

No main merge, deployment, force push, frozen R16/V148 mutations, protocol149 change, cross-agent paths or fake runtime test claims.
