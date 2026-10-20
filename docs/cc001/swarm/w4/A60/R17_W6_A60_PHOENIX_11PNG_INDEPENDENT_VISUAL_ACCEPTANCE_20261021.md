# CC-001 — R17-W6 / A60 Phoenix 11-PNG independent Windows Player visual acceptance

**PROJECT:** CC-001 — Core Clash Unity  
**ROLE:** A60 — Independent QA; existing **Issue #139**.  
**DATE:** 2026-10-21.  
**SCOPE:** archive integrity + original visual observation, **no new C#/Unity source edits or runtime test execution**.  
**OWN QA branch:** `feat/cc001-r17-w4-a60-candidate-qa`; review-start SHA `8cd5893e14ee08003c26040bac0ebc2e4f19e2e1`.  
**A20 source / reported GUI candidate:** `10f64e4d213f17a352ed8fa83bc75884a39549f0` (verified current remote HEAD).  
**Protected earlier Stage2:** `a67a37a0e4105dd680f52ae6728e93face61f4ce` (verified unchanged remote HEAD).  
**Supersedes *availability* HOLD only** from prior [A60 no-archive report](https://github.com/C8LyNn/aplikacja-turnieje/blob/8cd5893e14ee08003c26040bac0ebc2e4f19e2e1/docs/cc001/swarm/w4/A60/R17_W6_A60_PHOENIX_WINDOWS_GUI_EVIDENCE_GATE_20261021.md). The older report remains a truthful historical checkpoint.  
**Earlier local Windows G1/G2 acceptance** [A60 #139](https://github.com/C8LyNn/aplikacja-turnieje/issues/139#issuecomment-6298852194) remains valid and was NOT repeated: 361/361 managed C# including PHX-UI 10/10, codec13/13, real Windows build, 50-turn generic smoke and six **different** old PNGs.

## 1. Actual custody, cryptographic and format audit — VERIFIED, not HQ assertions

**User uploaded RAW file into THIS A60 thread:**  
`/mnt/data/CC001_PHOENIX_W6_WINDOWS_UI_SCREENSHOTS_EVIDENCE_20261020(3).zip`

- **Actual file size:** **2,100,640 bytes**.
- **Independently recomputed outer SHA-256:** **`0550af88ff5b41878405396659f67b19ee369160651a2deb9b394d3e39fdc443`**, exact HQ expected value.
- ZIP `ZipFile.testzip() is None`; **13/13 entries CRC PASS**, unique and safe ZIP paths (README_PL.md, manifest.json, 11 PNGs), no unexpected paths, no traversal.
- `manifest.json`: **11 unique PNG descriptions**, every referenced file exists; no unlisted PNG; **11/11 actual file size, SHA-256, PNG decode and image dimensions MATCH**. **11 unique SHA digests**. Actual screenshot dimensions range approximately 1189–1275 wide and 903–927 high; these are captured desktop images rather than standalone Unity native render dumps.
- Screenshot filename timestamps strictly increase from `202025` through `202753` on 2026-10-20; this proves filename order, **NOT a continuous video or trusted wall-clock chain**.
- Parsed original `README_PL.md` and `manifest.json`, created three local visual contact sheets and **personally inspected all 11 original PNGs**. Actual displayed Windows game pixels support the bounded sequence in section 2.
- Negative-only **in-memory** checks: 1 altered PNG byte causes SHA mismatch; wrong size or filename is rejected; three checks PASS. Original archive bytes were not changed.
- **Actual command:** `python /mnt/data/a60_phoenix_11png_verify.py > /mnt/data/a60_phoenix_11png_check.json` — **exit 0**; separate three negative assertions via inline Python — **exit 0**. These are offline evidence-inspection steps, **not** rerunning Unity Player.

**Individually independently verified original PNG SHA-256:**

| Order | Original PNG basename | Actual SHA-256 |
|---:|---|---|
| 01 | `image(20261020-202025).png` | `d9d3af76bf22d02b1cfbd4d217363b64bc29164b3314724a328db8b4c42ff018` |
| 02 | `image(20261020-202104).png` | `8d9a16a40d4180225f145db57ce7e301e0262924a698595059212490ffb72cd6` |
| 03 | `image(20261020-202135).png` | `e10e96ff6f8b1966a6f6d55ab641a3f588c643757a023b6743cdd81ea6735370` |
| 04 | `image(20261020-202617).png` | `22f03900beeb6cf7ed2c3f0c11c55202079bbb1f29656d5e677513e27446dc27` |
| 05 | `image(20261020-202629).png` | `4698c3003267cf6fbf33e132a6fd51e09d24afc1b226c2fc6d092d7331e4e719` |
| 06 | `image(20261020-202634).png` | `ea8b9f3c01e672ab18412193c70b918dafeb35ff26f4eec88e9a47c27705cd9a` |
| 07 | `image(20261020-202655).png` | `1d9c08fc04d3832eef0630fe5307098d8e3d3061c93873a56062f135a3e032fe` |
| 08 | `image(20261020-202717).png` | `511a287dbd8a1178c549d2ab6e60f7c6f3b6df3d02553ac0cbfe9224d1bb9a45` |
| 09 | `image(20261020-202734).png` | `bfd81cf282d988d2a29c7fcf156a680ab0f74bb61044cf6ace66d5c85f832b92` |
| 10 | `image(20261020-202743).png` | `0ab01be665d543a375afd6b90730b10e024780b25264204e0b8cf05892caf582` |
| 11 | `image(20261020-202753).png` | `c726147dda90268a629fc763657a42f243e2dc0e96aa9e08f8a9b2d620a6d3fe` |

## 2. Chronological, personally verified original GUI image observations

| Image/turn | **Actually visible** | What it does **not** establish |
|---|---|---|
| 01 / Turn 2 Player 2 | Real Windows game frame with active board, other deck, Standard selected. | No Phoenix-specific action. |
| 02 / **Turn 3 Player 1** | Fire deck Phoenix with depleted-stock visual / **OUT OF STOCK**. Standard is active, not Phoenix. | No direct underlying stock integer read. |
| 03 / **Turn 5 Player 1** | Same type card shows **HAND READY/H**; Standard still active at top. | Cannot establish exact death event, owner-turn counter or hand count. |
| 04 / **Turn 13 Player 1** | Phoenix card highlighted and marked hand-ready; top selection visibly **Phoenix**; launcher-side Phoenix PH2 visual. | No source of selection input (mouse vs keyboard), no event log or confirmed launch from this still. |
| 05–06 / **Turn 14 Player 2** | After preceding Phoenix selection, battlefield includes an orange P1 Phoenix PH2; details UI explicitly shows **Phoenix / P1 / 10 of 20 HP / Shield 0**. | Strong visual consistency with preceding deployment, **not** authenticated Spawn event/hand decrement/stock. |
| 07 / Turn 16 Player 2 | Match progressed on populated board; P2 has 19 HP. | Does not prove how the prior Phoenix died or returned. |
| 08 / **Turn 17 Player 1** | Phoenix shown **HAND READY** and selected/highlighted again. | No internal hand history or modality. |
| 09 / **Turn 19 Player 1** | Standard selected at top while Phoenix card continues to show **HAND READY**. | Does not independently validate hand count. |
| 10 / Turn 19 | Phoenix details dialog displayed. | Informational popup, not an input/spawn success log. |
| 11 / **Turn 19 Player 1** | Phoenix again highlighted/selected; visible aim drag with **RELEASE TO LAUNCH**. | This screenshot captures the **pre-release** state. No proof of successful second launch. |

**Three independent, limited visual findings:**
1. `PHOENIX_VISUAL_OUT_OF_STOCK_TO_HAND_READY = PASS`.
2. `PHOENIX_VISUAL_HAND_READY_SELECT = PASS`.
3. `PHOENIX_VISUAL_NEXT_TURN_PH2_ON_BOARD = PASS` (observed result of likely preceding selection/deployment, **not causal hand-consumption attestation**).

**Overall bounded verdict:** **`PHOENIX_NATIVE_VISUAL_READY_SELECT_BOARD = ACCEPTED` — independently verified original Windows GUI screenshots.** Previous `WAIT_RAW_EVIDENCE` superseded. No new full G4 authorization.

## 3. Limits of still-image provenance and remaining behavioral gate

- Screenshot artifact `manifest.candidateGitSha` identifies **`10f64e4d213f17a352ed8fa83bc75884a39549f0`**; earlier separate A60 raw Phoenix W6 archive independently verified 361 managed, 13 codec, Windows build, four binary SHA and six *generic* smoke images on that **reported** source branch. **None of the new 11 PNGs includes an embedded authenticated Unity Git tree/SHA or DLL hash.** Thus screenshots to executable/source binding remains **reported/consistent, not cryptographically re-attested**.
- File names show chronology, not unbroken frame sequence or trusted input events. The Turn13 selected Phoenix and Turn14 PH2 board entity are compelling real GUI evidence of display and likely spawn, but exact **`GameSimulation.TryCommand(Spawn)` success**, `phoenixHand.Count` decrement exactly once, **stock staying 0**, ready-hand timing, or no duplicate RETURN must be confirmed with **authoritative state/event trace** if end-to-end mechanics are to be certified.
- **Mouse vs keyboard** is unknowable from PNG pixels alone. Source `CoreClashApp.SelectBall` has `Debug.Log("CORE_CLASH_SELECT "+id)` after accepted selection; it does not itself encode the input origin. To verify both modalities, collect two explicit operator/native event traces (mouse click and the deck's Phoenix key, usually key1 for the cited fire deck) or an input recorder. A player assertion alone is weaker than event/telemetry.
- The final Turn19 screenshot shows `RELEASE TO LAUNCH`, but **NOT the release nor second on-board spawn**.
- **P2 UX/content discrepancy personally confirmed:** the Phoenix details dialog says `Its special power is unavailable in this class demo.` despite actual hand-ready availability. Source `CoreClashApp.AbilityText` maps DATA_ONLY status to that text. Treat as misleading ability copy/status metadata, not demonstrated lifecycle simulation failure. **No unsolicited status/catalog UI edit authorized.**
- **G2 mobile/WebGL/Android:** no fresh Stage2+Phoenix target build supplied. **G3** touch/physical networking/crossplay WAIT; full **G4 HOLD**, release STOP; frozen older Stage2/R16/V148/Protocol149 untouched.
- Existing A72 exact two-path CI policy admission correction was separately reported under #113; do not rerun the existing 361 cases or assume a fresh 7-stage suite has executed.

## 4. Smallest useful next action / closure definition

**Visual UI gate CLOSED/ACCEPTED now:** no more screenshot-only demands needed for depleted → ready → selected → PH2-on-board story.

**End-to-end Phoenix RETURN-hand UI gate remains HOLD:** obtain **one** original native Windows Player event+GameState trace with:
- `stock(phoenix)=0` and one valid ready hand **before** input;
- actual input method (mouse or keyboard), selected Phoenix event, and successful `Spawn` / launch;
- subsequent `stock(phoenix)=0`, `phoenixHand.Count` decreased by exactly 1, the PH2 entity newly present on board, next card state EMPTY or appropriate next ready item;
- demonstrate no second duplicate RETURN, and request a second modality pass only if both mouse+keyboard equivalence must be certified.

A source-owned diagnostic fixture or logging extension requires independent HQ authorisation; do not touch A20 UI or A40 gameplay automatically. For now, operator playback log/snapshot collection on the already-built Windows Player is preferable.

## 5. Five axes and handoff

**DESIGNED:** YES (visual-gate evidence and exact remaining behavior criterion).  
**IMPLEMENTED:** A60 report only; gameplay/test source **NO**.  
**TESTED:** **actual A60 Python archive and original 11-PNG SHA/CRC/dimension/visual inspection PASS (offline command exit 0)**; 3 in-memory tamper/negative checks exit 0; **new Unity/.NET execution NOT_RUN by A60**. Historical Phoenix 361/361, codec13 and Windows build/smoke previously accepted; no duplication.  
**INTEGRATED:** NO — A20 code on isolated feature branch; original Stage2 remains frozen.  
**RELEASED:** NO — STOP.

**A60 final status:** `PHOENIX_NATIVE_VISUAL_READY_SELECT_BOARD = ACCEPTED` / `PHOENIX_REAL_INPUT_AND_HAND_CONSUMPTION = HOLD` / `G4 = HOLD` / `RELEASE = STOP`.

**HANDOFF:** existing #139 → HQ #97, A20 #95 for input/Player capture, A40 #92 for GameState/Spawn event contract, A70 #137 conditional integration (no authorisation for merge). No source changes, main merge, force-push, public build, or fake physical/device PASS.
