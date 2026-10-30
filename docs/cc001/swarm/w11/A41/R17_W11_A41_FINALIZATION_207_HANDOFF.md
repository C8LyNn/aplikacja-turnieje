# CC-001 R17-W11 — A41 finalization / state parity on exact A70 candidate #207

**Role:** A41 — Backend / Multiplayer. **HQ:** [#97](https://github.com/C8LyNn/aplikacja-turnieje/issues/97).  
**Exact protected QA candidate input:** [A70 Draft PR #207](https://github.com/C8LyNn/aplikacja-turnieje/pull/207) at **`173273122c11cbf738e8b954e32506a6196fe8ec`**; our **own isolated branch**: `feat/cc001-r17-w11-a41-parity-on-207`. No change to A70 #207, protected RC1 `10f64e4d213f17a352ed8fa83bc75884a39549f0`, Stage2, R16, V148, Protocol149, main or public release.
**Purpose:** avoid a competing W11 integration implementation. Take A41's previous W11 evidence patch (Draft PR #205, based on older #189) and port the *same exact code/tests* onto A70's current official QA candidate. Original PR #205 should be **CLOSED UNMERGED / SUPERSEDED BY THIS NEW PR** once the new draft is confirmed.

## Actual code delivered — six paths only, additional on #207

- `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Networking/NetworkGameSession.cs` — pure `NetworkStateDigest`: deterministic sample revision 1 and every 16th; full SHA256 over exact UTF8 snapshot `stateJson`. **Git blob identical to proven earlier A41 #205 blob `a2d90d856219d26c6aec3c9d7cb820efbd71d5fb`**.
- `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Networking/NgoGameSession.cs` — log `CC_W11_STATE_TX` *after* host authoritative send and `CC_W11_STATE_RX` *after* client adapter admission and `app.ReceiveNetworkState(adapter.State,revision)`. Preserve the **A70 #207 revision forwarding**; no direct state mutation, raw JSON disclosure, IP, room code, remote client ID or Protocol149 schema change.
- `unity/cc001-r16/CoreClash-V149-Unity/Tests/NetworkSeatTests.cs` — carry 3 C# SHA256 fixture tests (standard `abc` vector, mutated JSON and revision schedule), **33 test declarations total**, same Git blob as #205 `8c898eed6eaab579c85bfab61b25712911eae48a`.
- `scripts/cc001/w11/a41/state-parity.cjs` — byte-exact carried over from earlier #205 Git blob `2fe1e88a993216bf26415ce02c2c567122c87262`, independently matches locally tested source.
- `scripts/cc001/w11/a41/state-parity.test.cjs` — byte-exact carried over from #205 blob `2b9a60a73a357dec5980fcc359ca661cfa8c65ca`; 14 executable Node assertions.
- This report.

**Result interpretation:** `node state-parity.cjs --host PC1-Player.log --client PC2-Player.log` compares *only matching sampled revision* digest + action serial + turn. `PASS_SCOPED` exit0 = matched sampled wire state only; `FAIL` exit1 = malformed input or evidence of divergence; `HOLD` exit2 = no common sample. In all cases, **rendered motion/physical network behavior remain independent evidence requirements**. No automatic G3 PASS.

## Actual execution (exact file bytes, not model-only)

**Run inside this environment:** `node --check` both scripts exit0; `node --test state-parity.test.cjs`: **14/14 PASS, zero failed, exit0**, Node `v22.16.0`, Git `2.47.3`. Verified `git hash-object` of both actual executed local scripts equals **GitHub exact W11 new-branch blob** `2fe1e88a...` / `2b9a60a...`. Original raw SHA256 locally:
- CLI `90d8775da1984d6307a5ea42cb890b36829fea096d158ec519cbfcba6d9718f5`
- Test `a5a81c3747f2ab0a2cfe7dda83aa284b9cb2d5550ce75ddd42eb574c796ed022`.

**NOT RUN:** .NET C# managed tests (local `dotnet: command not found`), Unity Editor / actual fresh Windows Player / two original physical PCs / real Unity Player.log digest parity / independent A60+A31 network QA. A72 has no verified Unity Windows build of exact W11 #207 SHA in evidence examined here. **G3/G4 HOLD, RELEASE STOP.** Historical RC1/W10 managed/build PASS is not evidence of #207 or these newer bytes.

## W11 integration selection / owner decisions

1. A70's #207 **already selects** A41 bounded network cadence (20/12/8/4Hz compressed-size), stale-ACK guard, A34 wired visual-only smoother with PORTAL snap, A20 local player aim and turn, A32 local deck, A10 no duplicated strength meters and A70 revision propagation plus A40 P2/Phoenix test code. **Do NOT import A30 original fixed 20Hz or A50 alternative smoothing**. This A41 patch is supplemental visibility only.
2. Preserve owner's mechanics unchanged in A41 networking source: **Mitosis = V148 exact behavior**, **Furnace = FIRE zone + periodic damage only**, **HP values = R16**. No gameplay, catalog, balance or ability modifications.
3. **A70** decides whether to import this six-path, non-overlapping addon into a **new final exact SHA**. Do not change the already-pinned #207 HEAD or old Windows source receipt without A70's authorization.
4. **A72** must build Unity Windows from whichever exact new SHA A70 finally freezes and record actual Unity exit code, compiler logs, source+binary SHA256 and full Player hashes. **A60/A31** independently run two physical PCs and verify: one P2 legal command accepted once, monotonic revision and per-revision original state digest, client smooth visuals, correct genuine TELEPORT/SWAP/PORTAL handling, local view/input/turn/deck, absence of both strength bars.
5. **Potential source-level unresolved defect, A30/A34 ownership:** official #207 `RemoteSnapshotEvents.InstantBallIds` handles only `PORTAL`; gameplay also emits `TELEPORT` and `SWAP` with two affected participants (A82 #204). This can incorrectly interpolate a short legitimate warp. A41 **does not change presentation**; route to owner; no P0 motion PASS until independently addressed/tested. No simultaneous alternate smoother.

**Statuses:** DESIGNED=YES / IMPLEMENTED=YES (A41 code+CLI+tests) / TESTED=NODE14/14 (ACTUAL) + GITHUB BLOB READBACK / C#=NOT_RUN / WINDOWS=NOT_BUILT_BY_A41 / PHYSICAL_TWO_PC=NOT_RUN / INTEGRATED=NO / RELEASED=NO.

**Exact new branch final SHA and PR:** see next GitHub W11 A41 PR and HQ handoff; no fabricated SHA before file commit.
