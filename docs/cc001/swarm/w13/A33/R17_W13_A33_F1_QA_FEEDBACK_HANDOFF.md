# CC-001 R17-W13 / A33 — F1 QA Capture Feedback + Sequence

**HQ:** https://github.com/C8LyNn/aplikacja-turnieje/issues/97
**Owner:** A33 / Presentation & UI
**Existing draft PR:** #235 (W12 source, extended for W13; **no competing second PR**)
**Source ancestor:** selected immutable-by-policy W11 QA-freeze ref `integration/cc001-r17-w11-qa-freeze-20261030` → `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`
**RC1:** `10f64e4d213f17a352ed8fa83bc75884a39549f0` protected
**Branch:** `feat/cc001-r17-w12-a33-f1-copy-qa-evidence`; target `review/cc001-r17-w12-a33-f1-freeze-base` at same exact W11 freeze SHA.

## Implemented W13 delta

Reuses the W12 operator-click F1 clipboard feature already authored in the same isolated PR. Rather than creating a duplicate copy control, adds:

1. **Observable click acknowledgement:** button remains `COPY QA` until clicked, then says `COPIED` for 2.5 seconds of Unity *unscaled* time; it reverts to `COPY QA` automatically. No changing normal HUD, no extra modal, no timer thread, and no changes to network/physics.
2. **Local capture sequence:** `CAPTURE_SEQ` starts at 1 and increments once for each accepted UI click, with safe wrap back to 1 after `int.MaxValue`; this sequence is local to that process and must **not** be interpreted as a host/client packet sequence, clock correlation or parity evidence.
3. **Preserved evidence integrity:** copied text still contains UTC in round-trip format, phase-independent turn/revision/frame/action serial and existing W9 read-only counters. It explicitly declares `SOURCE_SHA=UNVERIFIED`, `CLOCK_SYNC=UNVERIFIED`, `G3_STATUS=NOT_ATTESTED`. Free-text `networkNotice` (possibly sensitive transport info) is not copied.
4. **Inherited W12 guard upgraded:** the existing `scripts/cc001/w12/a33/check-f1-clipboard.cjs` now verifies feedback lifecycle, on-click clipboard only, single increment, counter before capture, timeout after copy, privacy and protected-state non-mutation. Tests use exact C# source, not a hand-written approximate fixture.

## Current exact code blobs

- `unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Presentation/DetailsView.cs` — `3440ed1a6a4a4de7fbf04c7c70c24383a01d7479`.
- `scripts/cc001/w12/a33/check-f1-clipboard.cjs` — `32ff905036ea11de62c4ffbe073195a141703608`.
- Historical original W12-only hashes are superseded in the W12 handoff by this W13 amendment.
- W11 freeze's original `DetailsView.cs` stays `ee6683ec3ae4ae10ce194a7c8bd9691d5a90754e`. All new source is **dev-only** in the isolated PR; it is **NOT** present in the Windows Player source currently selected for W11 QA.

## Tests actually run

**Actual source/provenance:** authenticated GitHub readback of the two current code blobs. The exact committed JavaScript validator, executed under a V8 isolate with read-only mocked Node modules, consumed the exact fetched `DetailsView.cs` bytes:
- Positive exact source contract **PASS_SCOPED**.
- **18/18 deliberate negative source mutations detected** (button removed, ungated copy, duplicate copy write, false source/clock/G3 PASS, networkNotice leak, missing UTC/sequence, feedback timing and lifecycle problems, disabled F1 scroll, unauthorized network call).
- Aggregate **19/19 V8 source/mutation assertions PASS** after fixing two test mutation targets in the author's test script.

**NOT RUN:** native `node` CLI against a full repo checkout, managed .NET9/C# compilation, Unity editor or PlayMode, Windows x64 Player, clipboard click in actual Windows UI, or A60/A31 two-physical-PC tests. Environment checked separately: Linux with Node22 installed, but no `dotnet`, Unity editor, or Windows runtime. No G3/G4/gameplay PASS.

Future real commands on a full checkout:
```bash
node scripts/cc001/w12/a33/check-f1-clipboard.cjs --self-test
node scripts/cc001/w12/a33/check-f1-clipboard.cjs
```
Both commands read the full repository `DetailsView.cs`; do not expect them to pass on the frozen W11 source without this W13 feature.

## Ownership / integration

- **A70:** remains sole integration selector. Do **not** add #235 or #212 to the locked W11 SHA. Select the W12/W13 copy UI and the separately authored #212 inspector ownership cue only after W11 physical G3 gate; inspect overlap in `DetailsView.cs` and pick a single cohesive implementation.
- **A72:** builds only official frozen W11 `3f972cd... ` until formal new candidate authorization, using exact-source Node/PowerShell checks. A72 #188 is a build-*kit*, not evidence that Windows Player exists.
- **A60/A31:** two-PC physical QA remains blocked on original Windows Player ZIP/full SHA256 and actual logs. These copied F1 fields cannot prove full-state parity; freeze lacks later `CC_W11_STATE_TX/RX` producers. Do not infer a network PASS.
- **Owner constraints:** Mitosis exact V148, Furnace FIRE area and periodic ticks only, HP R16. No ability, catalog, R16, V148, Protocol149, RC1, Physics, NGO, main or release changes.

**Result:** W13 A33 IMPLEMENTED / V8 SOURCE+MUTATIONS 19/19 PASS / NATIVE NODE NOT RUN / .NET9 NOT RUN / WINDOWS UNITY NOT BUILT / PHYSICAL QA NOT RUN / INTEGRATED NO / RELEASED NO / W11 G3-G4 HOLD.
