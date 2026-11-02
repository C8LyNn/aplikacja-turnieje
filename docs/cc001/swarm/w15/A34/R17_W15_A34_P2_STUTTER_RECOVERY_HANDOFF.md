# CC-001 — R17-W15 / A34 P2 Performance — native Node evidence and visual-frame telemetry repair

**HQ:** [#97](https://github.com/C8LyNn/aplikacja-turnieje/issues/97)  
**Owner:** A34 Performance / Technical Systems  
**Existing isolated draft PR:** [#233](https://github.com/C8LyNn/aplikacja-turnieje/pull/233) (no new competing implementation)  
**W11 locked QA ref:** `integration/cc001-r17-w11-qa-freeze-20261030` → **`3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`**. Never update this ref or conflate it with #207/#266/W15.

## Real W15 C# implementation — instrument correctness

Changed existing A34-owned `RemoteVisualPacingTelemetry.cs` in PR #233:

1. **Do not erase long frame stalls.** Previous `SampleFrame` rejected `deltaSeconds>1`. A genuine P2 hitch of 2.5 seconds therefore vanished from frame samples, FPS and P95, potentially producing falsely reassuring evidence. It now rejects only non-finite/negative or zero frame deltas, retaining long measured frame times.
2. **Rebaseline and count an accepted snapshot on local clock rewind.** Prior `AcceptSnapshot` called `Reset();return` on negative receiver interval, losing a snapshot already admitted by the caller. W15 resets the gap baseline but retains and counts the newly accepted sample with its action serial and blend duration. This changes instrumentation only, not GameState/transport/physics.
3. **Three authored C# regression cases:** 2.5-second freeze appears as `frameP95ms=2500`; 1.25-second freeze appears as `frameP95ms=1250`; clock rewind retains the fresh sample and the following 250ms interval. The preexisting invalid-clock fixture was corrected: finite 5-second frame time is now a legitimate sample, whereas NaN is not.

**Managed regression status:** 18 A34 telemetry + 31 A34 smoother = **49 C# test definitions** authored and wired into the existing `net9.0` test runner. **These C# tests were NOT EXECUTED**: no dotnet, C# compiler, Unity Editor, licensed Win64 Build Support, or two PCs in A34's Linux environment.

## Actual native execution — A34-owned P2 Player.log marker parser

**New, additive tool path** `scripts/cc001/w15/a34/analyze-p2-visual.cjs`. Does **not** duplicate A41 host-traffic tools or A51/A81/A80 cross-device parity/attestation. It reads only `CC_W12_VISUAL_P2` five-second markers from one **original** PC2 `Player.log` to summarize frame P95, accepted RX gap P95 and longer-than-300ms observations. Bounded 64 MiB input, refuses symlinked input/overwriting reports, hashes the input file bytes, validates row-level count/percentile consistency, never emits private raw log lines, and **NEVER claims native game PASS**.

Usage after A72/A60 supply a real **W12/W15-built** P2 Player.log (do not run it as proof for frozen W11 Player, which predates these A34 markers):

```bash
node scripts/cc001/w15/a34/analyze-p2-visual.cjs --log "PC2/Player.log" --out "a34-p2-visual-evidence.json"
node --test scripts/cc001/w15/a34/analyze-p2-visual.test.cjs
```

**Exit codes:** 0 = `P2_VISUAL_METADATA_ONLY`, **not G3**; 1 = invalid/contradictory marker; 2 = no markers/unsafe input/insufficient evidence; 3 = invalid invocation/output overwrite. Output explicitly states `g3: NOT_ATTESTED`, `binaryShaVerified: false`, `noPacketLossInference: true`.

**REAL command execution on Linux Node v22.16.0:** Both `node --check` exit0; `node --test` **20/20 PASS, 0 FAIL, exit0**, including 19 native subprocess/fixture assertions and one 140,000-marker stress scenario. Input files are test fixtures, **not original physical PC1/PC2 logs**. Full original TAP digest SHA256: `d6e30670521195314c9d90203b1e000b6081f113aaf901def0359c2b4f648478`. The two locally run Node scripts have **byte-identical Git blob SHA1** to GitHub: parser `7b10e7c4f61ff0bdd0ac55d24106e83245ddf6c0`, test `c2edb9ab51fc5452b854c4524bb61e55a936ca57`. SHA256 parser `cdca7b9ae4ca3f9f405cd7fcd912bd794b7b28a64815d9a74275b33ef7956b6c`; test `ae27beb4cd8c23e63a075da5eab0770a4f7f515689068c3e38a4705f665880bb`.

## Native build and freeze routing

- **A72:** canonical [builder PR #188](https://github.com/C8LyNn/aplikacja-turnieje/pull/188) already selected generated Unity-report fix #262 into its own feature branch; this is NOT a Windows build or W11 freeze merge. On authorized PC1 Windows 11 with licensed Unity6000.4.0f1 Windows64 Build Support, .NET SDK9 and Node22, run the exact A72 kit `scripts/cc001/w10/a72/URUCHOM_W11_PR207.cmd` from **A72 #188 source**. Despite legacy name, verify the script internally targets frozen SHA **3f972...**, not old #207. Preserve original `CC001_W11_A72_WINDOWS_EVIDENCE.zip`, raw logs, full nested Player SHA256 inventory and source checkout receipt. Any missing native execution is **HOLD**, not PASS.
- **A60/A31:** verify the same exact frozen W11 Player binary on two independent PC1/PC2 machines, host authoritative revision, turns/aim/PORTAL, teleport/settle, visual smoothness, hashes and raw captures. The frozen W11 Player does **not** contain A34's newer W12–W15 markers, so missing marker there is not a failure. No source-sha mixing.
- **A70:** after formal W11 native closure, optionally integrate W15 PR233 and execute a **fresh** .NET9 + Unity Windows Player and PC1/PC2 QA. No direct merge to RC1/main/release.

**Owner gameplay invariants:** Mitosis exactly V148; Furnace FIRE zone plus periodic tick damage only; HP exactly R16. No protected source modifications by A34.

**Status:** W15 P2 instrumentation code IMPLEMENTED; native Node20/20 PASS on synthetic fixtures; 49 managed C# tests AUTHORED/NOT_RUN; Windows Unity NOT_BUILT by A34; physical PC1↔PC2 NOT_RUN; frozen W11 G3/G4 HOLD; W15 draft integration HOLD; main/release STOP.

**Machine-readable manifest:** `docs/cc001/swarm/w15/A34/R17_W15_A34_MANIFEST.json`.
