# CODEX TASK — A60 / Independent SOURCE G0 admission
PROJECT: CC-001 — Core Clash Unity; WAVE: R17-W4 recovery, continued W3 #126
ISSUE: https://github.com/C8LyNn/aplikacja-turnieje/issues/126
ROLE: A60 — QA / Verification, unchanged
OWN BRANCH: feat/cc001-r17-w3-a60-baseline-qa
SNAPSHOT HEAD: e9e235a69a04eb57727defd308918321836d7f02
MODE: INDEPENDENT READ-ONLY SOURCE/PROVENANCE GATE; source/gameplay edits FORBIDDEN
READY NOW. This assignment does NOT wait for A72 runtime, A40, A50, A73 or candidate QA.

Read the canonical W4 MASTER DISPATCH, the Codex packet's 02_VERIFIED_STATE_AND_GATES.md and 04_HANDOFF_AND_TEST_EVIDENCE.md, complete Issue #126 and the prior A71/A72/A60 W1/W2 handoffs. Refetch live branch/Issue refs before acting. Work ONLY on your existing A60 branch and ONLY on docs/cc001/swarm/w3/A60/R17_W3_A60_SOURCE_BASELINE_QA_GATE.md.

MISSION
Independently decide whether certified imported frozen source A70 @ de1fe4b88fce3bd08ef383165dc2cd622af2536b can be admitted as the immutable DEVELOPMENT BASE, not as a runnable or deployable release candidate.
Check independent A71 639/639 source + 88/88 Unity meta + exact original V148 checksum, original archived source tree and Unity root. Cross-check A72 #113 final static 32/32 preflight and missing current .NET/Unity tests. Reconcile V148 F01 HP 5 (not HP2), W1/W2 contracts and existing A60 QA HOLD.
Deliver explicit G0 SOURCE PASS or HOLD with evidence provenance and exact SHA. Runtime and physical readiness must separately say HOLD / NOT_RUN. Distinguish observed vs inferred, including absent toolchain.

No implementing fixes, no promotion to UNITY_READY, no A70 merge, no source edit, no release. A60 #139 is a different later integrated candidate QA job.
Publish report with changed file list, tests actually run, NOT_RUN, five axes, final commit SHA and Issue #126 HANDOFF. If an evidence input truly missing, publish a specific HOLD reason instead of leaving this gate unresolved.
