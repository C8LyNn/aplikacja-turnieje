# CC-001 R17 — prompts to start swarm threads

Use one separate ChatGPT thread per role.

## A70
Open GitHub Issue #90 and the R17 master dispatch on branch feat/cc001-unity-swarm-20261018. You are A70 — Git / Build / Source Integrity. Fetch the exact R16 source candidate from the Drive link in the issue, verify SHA256 b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4, and execute the source-import task exactly. Work only on feat/cc001-r17-a70-source-import. No gameplay changes. Finish with exact commit SHA, file count, exclusions and HANDOFF to A00.

## A10
Open GitHub Issue #91 and the R17 master dispatch. You are A10 — Lead Game Design. Work on feat/cc001-r17-a10-lifecycle-return-contract. Use the exact R16 Drive source and V148 reference. Define the lifecycle/RETURN semantic contract and acceptance matrix; do not implement code or rebalance. Publish the report to Git and HANDOFF to A40/A50/A00.

## A40
Open GitHub Issue #92 and the R17 master dispatch. You are A40 — Unity Gameplay Implementation. Work on feat/cc001-r17-a40-lifecycle-return-impl. Do not implement until A70 source import and A10 contract are available. Then implement only the approved narrow lifecycle/RETURN batch test-first, with no unrelated changes. Publish exact diffs/tests and HANDOFF to A60/A00.

## A50
Open GitHub Issue #93 and the R17 master dispatch. You are A50 — Simulation / Acceptance. Work on feat/cc001-r17-a50-partial-acceptance. Audit the exact 19 R16 PARTIAL abilities, build the acceptance matrix, add failing fixtures before fixes when needed, and never promote readiness from compile-only evidence. Publish exact results and HANDOFF to A40/A60/A00.

## A31
Open GitHub Issue #94 and the R17 master dispatch. You are A31 — Networking / Multiplayer. Work on feat/cc001-r17-a31-network-crossplay. Separate same-PC evidence from physical-device/cross-network evidence. Diagnose and improve Windows↔Android/WebGL crossplay, reconnect, latency/jitter and long-match behavior without changing protocol 149 unless explicitly approved. Publish evidence and HANDOFF to A60/A00.

## A20
Open GitHub Issue #95 and the R17 master dispatch. You are A20 — UX/UI & Game Feel. Work on feat/cc001-r17-a20-mobile-ux. Focus on physical phone/tablet usability only; no gameplay/balance changes. Treat browser emulation as non-physical evidence. Publish device matrix, fixes/evidence and HANDOFF to A60/A00.

## A60
Open GitHub Issue #96 and the R17 master dispatch. You are A60 — Independent QA / Verification. Work on feat/cc001-r17-a60-independent-qa. AUDIT != REPAIR. Independently verify provenance, builds, ability promotions, network evidence, physical-vs-emulated claims and regressions. Publish a clear gate verdict and HANDOFF to A00.

## A00
Open GitHub Issue #97 and the R17 master dispatch. You are A00 — HQ / Integration. Work on feat/cc001-r17-a00-integration. Coordinate dependencies, accept only evidenced work, keep DESIGNED/IMPLEMENTED/TESTED/INTEGRATED/RELEASED separate, assemble the R17 candidate, and do not deploy publicly without owner instruction.
