# CC-001 R17-W11 — A34 final event snap patch on official A70 candidate

**HQ:** #97. **Role:** A34 Performance / Technical Systems. **A70 build/QA source:** official #207, original pinned `173273122c11cbf738e8b954e32506a6196fe8ec`, then A70 independently advanced head to `d1ec2a6079df5b696869e7ac8cd09b890fa65314` while A34 work was in progress.

**IMPORTANT: A70 already integrated the earlier A34 4Hz fix (.20→.25s) and two corresponding 4/8Hz managed regression definitions. DO NOT APPLY PR #191 AGAIN.** This incremental A34 PR builds on exact A70 `d1ec2a...`, preserves 250ms interpolation and makes **only the independent missing displacement-event correction**.

## Actual A34 source correction

`RemoteSnapshotEvents.InstantBallIds()` now classifies new `TELEPORT` and `SWAP` events in addition to `PORTAL`. Existing runtime emits one-ball Warp `TELEPORT` in `AbilityResolver.OnWall`, and two-ball position swap `SWAP` with both `ballId` and `otherId` in `RealityEffects.RealityStop`. A short-range displacement under the 220-unit generic snap threshold otherwise visualizes a nonexistent transit path on PC2. Fresh event ids only; normal STOP/START loops, collision motion and DAMAGE events are unchanged. No host simulation/transport changes.

## Four new C# managed cases (authored; NOT EXECUTED)

1. Newly accepted TELEPORT immediately snaps short warp, consumed event does not re-fire.
2. SWAP snaps both actual participants simultaneously.
3. Old/invalid/irrelevant displacement IDs do not cause false snaps.
4. Non-displacement DAMAGE still permits ordinary bounded interpolation.

Maintains selected A70 revision guard, one A34 smoother, adaptive A41 cadence, A20/A30/A32/A10 UI and protected RC1/R16/V148/Protocol149.

## Evidence / gates

GitHub readback and source/numerical policy checks passed on prior pinned `173273...` variant **28/28** (not C# execution); *new d1ec-resolved source must be separately rechecked* before any pass on the updated integration ancestry. A34 managed suite has 19 definitions at `d1ec2a...`, and +4 in this addon = 23.

**NOT_RUN:** .NET9 compilation/test execution, fresh Unity6000.4.0f1 Windows native Player, 2 physically independent PCs, gameplay and packet-state equivalence, A60/A31 independent G3/G4. No native PASS. No main or release merge. A70 integrates only after review into another exact-SHA candidate and requires newly built binaries from A72, same-binary paired captures from A60/A31.

**Owner decisions preserved:** Mitosis exact V148, Furnace FIRE zone plus periodic damage only, HP values R16. No protected source writes.

**Candidate disposition:** SOURCE PATCH READY FOR A70; G3/G4 HOLD; W11 NOT FORMALLY CLOSED.
