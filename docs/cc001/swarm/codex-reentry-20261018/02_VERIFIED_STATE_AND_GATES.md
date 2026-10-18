# CC-001 — Verified W4 state and dependency gates
**Snapshot date:** 2026-10-18; VERIFIED via connected GitHub issue/branch/comment reads. LIVE DATA MAY CHANGE AFTER THIS SNAPSHOT.
**SOURCE OF TRUTH FOR AUTHORITY:** W4 MASTER DISPATCH, commit 661660d3a3dc8a4fa2c9afea489050247f64c38c.
**HQ latest checkpoint:** https://github.com/C8LyNn/aplikacja-turnieje/issues/97#issuecomment-6251388254

## Frozen project baseline
Repository C8LyNn/aplikacja-turnieje.
Immutable imported R16 baseline: feat/cc001-r17-a70-source-import at de1fe4b88fce3bd08ef383165dc2cd622af2536b.
Unity root: unity/cc001-r16/CoreClash-V149-Unity/.
R16 archive SHA256: b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4.
Original R16 Git subtree SHA1: 1dd04ea8bd44d1b54777ed1ca5e5c47a3057d0e6.
Protected V148 original HTML SHA256: bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e.
A71 previous source integrity: 639/639 imported files and 88/88 .meta PASS (THIS IS NOT COMPILE PASS).
Editor Unity 6000.4.0f1. Managed .NET 9. Protocol 149 frozen.
Historical R16 registry: 42 UNITY_READY / 51 PARTIAL / 134 DATA_ONLY; no automatic promotion.
A72 previous preflight static 32/32 PASS, but new R17 managed 269 historical tests + codec13, Unity compile/build, devices and physical crossplay NOT RUN as of this snapshot.

## READY NOW (five workstreams)
- A60 — existing #126: feat/cc001-r17-w3-a60-baseline-qa @ e9e235a69a04eb57727defd308918321836d7f02. G0 independent source-only PASS/HOLD absent.
- A73 — #136: feat/cc001-r17-w4-a73-merge-preview @ 661660d3a3dc8a4fa2c9afea489050247f64c38c. Post-W3 W4 map absent.
- A72 — existing #113: feat/cc001-r17-w4-a72-managed-ci @ 661660d3a3dc8a4fa2c9afea489050247f64c38c. New CI implementation not yet pushed.
- A40 — existing #92: feat/cc001-r17-w4-a40-lifecycle-return @ 661660d3a3dc8a4fa2c9afea489050247f64c38c. New gameplay implementation not yet pushed.
- A50 — #138: feat/cc001-r17-w4-a50-f02-physics @ 661660d3a3dc8a4fa2c9afea489050247f64c38c. New production fix not yet pushed.

## WAIT (correct gating, not neglected tasks)
- A70 #137 candidate integration/cc001-r17-w4-disposable-candidate-20261018 @ 74a3438b03cdd8891315734c98fc1e8dafc6ba45: only A70 coordination memo added, NOT integrated source; requires A60 G0 PASS AND A73 W4 exact delta/conflict map.
- A71 #140 candidate integrity branch at dispatch SHA 661660d3a3dc8a4fa2c9afea489050247f64c38c: wait integrated candidate HEAD.
- A74 #141 branch @ 9b174410e14b8766e3a25ca42d9d898ab4ef4501: one wait-checkpoint document only, actual hygiene audit awaits candidate.
- A60 #139 separate post-integration QA branch at dispatch SHA: wait candidate and G1/G2 runtime evidence. NOT duplicate of #126 G0.
- A20 #95 physical compact UX: wait suitable G2 build/hardware.
- A31 #94 physical network reliability: wait G2 build + separate devices/network.

## W3 completed artifacts are NOT yet integrated
- A10 #121 — Mitosis protected-V148 controlled browser oracle @ 05eb15293dad4d61271e7c200ce661f1080f5288: 8/8 isolated source probes, NOT Unity; crucial wall-first weak=no split, strong=kinetic route split.
- A20 #122 — compact layout source @ 1f87595a9d73de30179e5158a5848eae3b965885: not .NET/Unity compiled.
- A41 #123 — LAN seat tests @ 8eb0b2517c049c95fc2257d73f0139d7bc17fd2c: 17 new tests authored, not executed.
- A50 #124 — intentional RED Frostguard F02 test expectations @ 4e4b42f6b2f38c1d5836d3f1a83300fc0988cec5: test-only, NO production parity fix; do not report as green.
- A51 #125 — snapshot admission tests @ 92c9a61ecd3f5326fd2f9b0e736031d9b1641ab5: 23 new C# registrations not compiled.
- A73 #127 — prior integration planning @ 7d57f92aea3660aa1b2183e937e357b409e8c19d: predecessor snapshot, not W4 actual-delta review.

## Critical semantic invariants
- F01 structures in executable V148 really initialize HP 5 (NOT HP 2); collision gate details separate, unapproved scope.
- F02 Frostguard V148 plain anchor: no fake Earth anchor stacks, expected force 0.30 and mass 2x, preserve legitimate previous Earth stacks; requires coordinated ElementalEffects + CollisionResolver scoped to A50 W4.
- A10 W1 approved narrow lifecycle/RETURN: Phoenix, Revenant, Soul Anchor, Dirge, Den Mother only; RETURN is distinct from SPAWN; Dirge repeats DEATH effect body not a new DEATH event; host-authoritative RNG/state.
- No unapproved reconnect policy, protocol changes, balance changes, automatic status promotions, or public game/site touches.

## Gates
G0 = A60 independent immutable R16/source admission for DEVELOPMENT ONLY.
G1 = real .NET9 managed/codec build and tests for exact candidate SHA.
G2 = genuine Unity Editor 6000.4.0f1 compile plus supported Windows/WebGL/Android build evidence.
G3 = actual appropriate physical-device/network evidence.
G4 = A60 independent exact-candidate acceptance with limitations.
Each gate independently PASS/HOLD/NOT_RUN; a pass in one layer does not substitute for another.
