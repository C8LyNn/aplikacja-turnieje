# CC-001 / R17-W6 — A60 INDEPENDENT QA OF RECOVERED PHOENIX FINAL WINDOWS EVIDENCE

**Identity:** A60 — Independent QA / Verification. **Existing Issue:** [#139](https://github.com/C8LyNn/aplikacja-turnieje/issues/139).  
**Scope:** Independently audit the original five-checkpoint ZIP on Google Drive; no C#/Unity code modification, no test-suite rerun, no merge, no production approval.  
**Review:** 2026-10-21.  
**A60 branch:** `feat/cc001-r17-w4-a60-candidate-qa`; **initial A60 HEAD:** `5187e52d807c719f108af563cf927dccdbff24ed`.  
**A20 Phoenix isolated exact commit:** **`10f64e4d213f17a352ed8fa83bc75884a39549f0`** (GitHub branch HEAD verified).  
**Frozen Stage2:** **`a67a37a0e4105dd680f52ae6728e93face61f4ce`** (HEAD verified unchanged); frozen R16 `de1fe4b88fce3bd08ef383165dc2cd622af2536b`.  
**PREVIOUS A60 QAs (NOT repeated):** [Phoenix W6 source-bound managed 361/361, PHX-UI 10/10, codec 13/13, Windows build and generic native smoke](https://github.com/C8LyNn/aplikacja-turnieje/issues/139#issuecomment-6298852194) and [11 true Windows gameplay PNG VISUAL_READY→SELECT→BOARD ACCEPTED](https://github.com/C8LyNn/aplikacja-turnieje/issues/139#issuecomment-6303324391).

## 1. Exact Google Drive source and independent bytes

**Source:** [Core Clash / CC001_PHOENIX_FINAL_EVIDENCE_RECOVERED_NO_LIVE_LOG.zip](https://drive.google.com/file/d/11eKz3AZkUIaEkN51pVxakMJSMYvoXzNf/view)  
**Google Drive ID:** `11eKz3AZkUIaEkN51pVxakMJSMYvoXzNf`  
**Original MIME:** `application/zip`  
**Actual authenticated Drive connector fetch:** `download_raw_file=true,include_base64=false`, yielding a mounted, inspectable **raw local ZIP** in `/mnt/data/CC001_PHOENIX_FINAL_EVIDENCE_RECOVERED_NO_LIVE_LOG.zip`. This review is from actual bytes, NOT just Drive metadata or HQ claims.  
**Actual byte size:** **1,556,424 bytes**.  
**Independently computed SHA-256:** **`22ea8997303f942abeb80f96c8febb73e756ea818416f33fcd1a26c3b2a11d9f`** — matches user/HQ.  
**Actual CRC:** **12/12 ZIP members PASS** (`ZipFile.testzip() is None`), names unique and exactly expected:
- Five `01_READY` … `05_AFTER` PNG images;
- Five `*-new-log-lines.txt` files;
- `results.json`, `UnityPlayer-log-snapshot.txt`.
**PNG integrity:** **5/5** Pillow decode/verify PASS; all screenshots **2560×1440**. The images are **Windows desktop captures with foreground PowerShell/browser, not game-window frames**. Visual information typed into PowerShell is *operator narration*, not independently captured Unity Player pixels. This is a **capture-target FAIL** (not necessarily a gameplay FAIL).

**Local direct executable controls (A60, no game rerun):**
- `sha256sum /mnt/data/CC001_PHOENIX_FINAL_EVIDENCE_RECOVERED_NO_LIVE_LOG.zip`: produced expected whole-ZIP SHA; exit **0**.
- `python /mnt/data/cc001_phx_final_a60_audit.py > /mnt/data/cc001_phx_final_a60_audit.stdout.json`: **exit 0**; original archive hash, 12-member ZIP CRC, exact names, 5 PNG decode/dims, 5 JSON checkpoint consistency, candidate/base SHA pins, full snapshot log-event counts and stage log-delta discrepancies.
- Two **in-memory negative hash probes** (modify a copy of the outer ZIP and a copy of an original PNG): both mismatches detected, Python exit **0**.
- JSON evidence ledger stored locally at `/mnt/data/cc001_phx_final_a60_audit.json`. These local paths are ephemeral analysis outputs, not project source or a shared publication of the private ZIP.

**Independently rehashed actual ZIP members (SHA-256):**

| Entry | SHA-256 |
|---|---|
| `01_READY-new-log-lines.txt` | `9109d34d872d13f28f9dbd4b92de3ecea86bb22c4f59810edb5c3aca607ecef9` |
| `01_READY.png` | `26c8e8a3d9effc38714382b88472618547ad5cc7210536563c2428b97a6cee53` |
| `02_MOUSE-new-log-lines.txt` | `6d5d7d3cb9ce56f4f0a564a7bf0632fac2d1cebbc0c767f2dffa07f0b0315d09` |
| `02_MOUSE.png` | `76615980f3ab95f8f6ef54cf2b74dfb607bbc14a65e603230b18733a1cc7732c` |
| `03_KEYBOARD-new-log-lines.txt` | `8882c79e1acfc048dcd54fe157880a00f3ad2e9b225c7c6756a80e1d614f686b` |
| `03_KEYBOARD.png` | `5ff391e33bb09f0973014ef92fe8b080a578fa4728a4d10a283787b46e3a0b87` |
| `04_RELEASE-new-log-lines.txt` | `6d5d7d3cb9ce56f4f0a564a7bf0632fac2d1cebbc0c767f2dffa07f0b0315d09` |
| `04_RELEASE.png` | `33b0d28b3a168bb227377a750ce964ff5dc4758d67d0dbdb722c12df40bc2133` |
| `05_AFTER-new-log-lines.txt` | `6d5d7d3cb9ce56f4f0a564a7bf0632fac2d1cebbc0c767f2dffa07f0b0315d09` |
| `05_AFTER.png` | `a7dd4df3aeb59b5bb96f2cf41973112bf92721ca48a82e6c16f76257a2f84380` |
| `results.json` | `28b309ff76f9b8484c53fb345f381730607794cbb21428f1ae10759ccc07a7d8` |
| `UnityPlayer-log-snapshot.txt` | `fa374855e8b3d15f6192814a5f679488efe88367c235c03b8a4b0d7a8e145376` |

**No internal manifest listing hashes** exists in this 12-file archive; these values are **A60 independently generated digests**, not a claim of having checked a nonexistent manifest.

## 2. results.json: five actual checkpoint records and provenance limits

**Declared `schema`:** `CC001-PHOENIX-W6-FINAL-MANUAL-v2`, `testType=OPERATOR_STEPS_PLUS_PLAYER_LOG_NOT_AUTOMATIC_UNITY_QA`; source candidate and frozen Stage2 match exact GitHub refs above.  
**Collector UTC window:** 2026-10-21T08:35:46.1018702Z → 08:53:14.1308971Z; declared new Player process `true`, PID `27380`. These are recorded assertions, not independently validated Windows process state.

| Checkpoint | Recorded UTC | Operator statement | Actual local stage-delta log (A60 parsed) |
|---|---|---|---|
| `01_READY` | 08:42:30 | Phoenix ready in hand P1 turn5, Standard selected | **3** `CORE_CLASH_SELECT phoenix` and **3** `CORE_CLASH_LAUNCH owner=0 type=phoenix` lines present from earlier match sections |
| `02_MOUSE` | 08:47:27 | Clicked Phoenix via mouse, HAND READY/launcher PH2, no fire | `NO MATCHING NEW PLAYER LOG LINES`; **0** new select and **0** launch |
| `03_KEYBOARD` | 08:48:45 | Keyboard 0 selects Standard; key 1 selects Phoenix | Exactly **1** `CORE_CLASH_SELECT phoenix`; no native key code/modality in log |
| `04_RELEASE` | 08:49:44 | Fired Phoenix, new turn6, P1 PH2 on board at 4 HP | `NO MATCHING NEW PLAYER LOG LINES`; **0** new launch recorded by DELTA |
| `05_AFTER` | 08:51:40 | `operatorObservation` **empty**; separate final status says turn7 P1, PH2 on board 4HP, Phoenix `OUT OF STOCK`, stock0, no HAND READY, Standard selected | `NO MATCHING NEW PLAYER LOG LINES`; no GameState dump |

**Collector inconsistency:** `01_READY.observedAcceptedLaunchPhoenix=0` despite **three real Phoenix launch log lines in its accompanying `01_READY-new-log-lines.txt`**. Those lines are earlier overlapping match history and do not prove the READY-stage new action. The recorder's reported counts are not a reliable substitute for raw log inspection. `02_MOUSE`, `04_RELEASE`, and `05_AFTER` have *identical* 35-byte `NO MATCHING NEW PLAYER LOG LINES` payloads (expected repetition of a marker, not proof of absence of actual gameplay events).

**Full Player log independently parsed:** exactly **3 `CORE_CLASH_MATCH_START`**, **5 `CORE_CLASH_SELECT phoenix`**, **1 `CORE_CLASH_SELECT normal`**, **4 `CORE_CLASH_LAUNCH owner=0 type=phoenix`** across full snapshot. **The final match section includes**:
```text
CORE_CLASH_SELECT phoenix
...
CORE_CLASH_SELECT normal
CORE_CLASH_SELECT phoenix
CORE_CLASH_LAUNCH owner=0 type=phoenix
CORE_CLASH_LAUNCH owner=1 type=normal
```
All text decoded directly from the original `UnityPlayer-log-snapshot.txt` (2,986 bytes). Its source is consistent with Unity 6000.4.0f1, actual launch environment, the `fire_3` vs `featured_status_reactor` deck selection. The original named `UnityPlayer-live.log` is not included because of a Windows file lock; **the provided log snapshot is an actual separate file, not a claim of a continuous timestamped event stream**.

**Explaining `04_RELEASE` delta versus full snapshot:** `results.json.evidenceSummary.acceptedPhoenixLaunchLogCount=0` and `04_RELEASE-new-log-lines.txt` refer to the collector's *per-checkpoint matching delta*, whereas the full snapshot includes a **fourth accepted Phoenix launch after the final keyboard/selection events in its final match sequence**. The delta extractor may have missed an appended line because of log source/copy timing, matching filters, rotation/truncation or a stale offset; the ZIP does **not** contain collector script code (only asserted script SHA256 `dcedf48945faa4de1e03dc09fee18662caf10cf8bc1249c19e37bb8882e9a775`), so its precise defect cannot be confirmed. **Do NOT claim** the missing DELTA is a failed real launch, or that the snapshot securely proves the exact `04_RELEASE` timestamp. The full log has no per-event timestamps.

## 3. Direct source-grounded meaning of game event log

Read exact A20 GitHub source at `10f64e4d213f17a352ed8fa83bc75884a39549f0`:

- `Assets/CoreClash/Presentation/CoreClashApp.cs`: keyboard 0/keypad0 calls `SelectBall("normal")`, alpha digit stock-slot shortcuts call `SelectBall(stock[i].id)`; `SelectBall` logs `CORE_CLASH_SELECT <id>` when **`CanChoose && Catalog.Ball != null && BallSelection.CanSelect(...)`**. Therefore the original `CORE_CLASH_SELECT phoenix` proves game-level acceptance of selection but **cannot identify keyboard vs mouse**.
- Same source: `CORE_CLASH_LAUNCH owner=<owner> type=<ball>` occurs only in the **`accepted`** branch after `NetworkLink.Submit` or `session.Submit`. Therefore `CORE_CLASH_LAUNCH owner=0 type=phoenix` **proves that at least one P1 Phoenix launch command was accepted by the running Player**. Snapshot final-match sequence supports a launch after keyboard-stage selection. No internal `SPAWN` event or authoritative hand decrement appears in log.
- `BallSelection.cs`: Phoenix HAND readiness is derived from stock-first and owner/turn/ready predicates; `GameSimulation.TryCommand` consumes eligible `phoenixHand` record on accepted zero-stock Phoenix spawn, but source semantics and earlier managed PHX-UI tests do **not** prove the exact hand instance was consumed in **this** runtime session.
- The recorded `playerExeSha256` and `assemblyCSharpSha256` are **assertions in results.json** (matching previous A60 independent binary-byte audit from a different ZIP). **This recovered ZIP contains neither executable nor DLL** and has no build-time Git-tree attestation, so source→runtime binary binding stays **corroborated, not newly cryptographically verified**.

## 4. Strict A60 independent six-gate verdicts

| Required axis | Verdict | Justification |
|---|---|---|
| **`PHOENIX_MOUSE_SELECTION`** | **HOLD** | Operator reports clicked card; `02_MOUSE` delta has no fresh SELECT. Existing generic `CORE_CLASH_SELECT phoenix` cannot attribute mouse. |
| **`PHOENIX_KEYBOARD_SELECTION`** | **HOLD** | Operator explicitly reports key0→key1, and `03_KEYBOARD` delta contains a real SELECT Phoenix; full snapshot also contains SELECT normal. Evidence strongly corroborates keyboard use but lacks native keydown source tagging or recorded input-video, so fully independent *modality-specific* PASS is not justified. |
| **`PHOENIX_ACCEPTED_LAUNCH`** | **PASS** | Final full Unity log includes `CORE_CLASH_LAUNCH owner=0 type=phoenix` in active match, generated only after successful Submit. Temporal attachment to specific `04_RELEASE` checkpoint **UNVERIFIED** because that delta is empty and source log events have no timestamps. |
| **`PHOENIX_AFTER_USE_VISUAL`** | **UNVERIFIED** | `finalOperatorCardStatus` asserts turn7 `OUT OF STOCK`/stock0/no HAND READY, but all five newly captured PNGs show PowerShell/browser foreground, not game pixels. Earlier 11 true game PNGs prove READY/selection/onboard but not this exact after-use frame. |
| **`PHOENIX_HAND_EXACT_CONSUMPTION`** | **UNVERIFIED** | No before/after GameState: `phoenixHand.Count`, hand entry identity/owner, stock value, event SP AWN/RETURN; status label is not a state dump. |
| **`PHOENIX_WINDOWS_UI_ACCEPTANCE`** | **HOLD** | Earlier visual READY→SELECT→BOARD ACCEPTED and newly verified launch log PASS, but input-method provenance and exact hand consumption remain unverified. This is **not** an overall G4 or release decision. |

**No gameplay defect proved by collector shortcomings.** `FAIL_CAPTURE_TARGET` applies to five PNG screenshots; it does not mean `Phoenix` itself failed.

## 5. Minimal actionable unblocking procedure — avoid redundant testing

**A20/operator non-source actions first:**
1. Recover the actual Unity Player after-use frame by bringing game window into foreground; use an explicit game-window capture/OBS recording or true Unity frame capture, not generic desktop capture while PowerShell is focused. Record exact P1 turn, `HAND READY` before, selected Phoenix and `OUT OF STOCK` after.
2. Capture exactly one **single-run** native event trace with input attribution: mouse click on Phoenix (and keyboard 0/key1 in a separately designated step if both interfaces are acceptance scope). Native source currently records only `CORE_CLASH_SELECT phoenix`, which does not encode input method. An authentic input recording/video/operator-plus-telemetry can close modality gap without replaying 361 C# tests.
3. Capture authoritative state before/after single accepted `Spawn`: `stock(0,"phoenix")=0` before and after; **ready hand count/entry identity goes down by exactly 1**; one new P1 Phoenix unit on board; no extra stock copy. A prior 11-image visual transition and an accepted-launch log **cannot replace** this internal state observation.

**Only if existing Player lacks access to state:** A20 requests **separate narrow HQ authorization** for isolated *diagnostic-only* logging in own `Assets/CoreClash/Presentation/CoreClashApp.cs`: log actual input origin at `SelectBall` callers, plus before/after read-only `State.phoenixHand` and `Stock(0,"phoenix")` around successful `session.Submit`/command path. Do not edit A40-owned `GameSimulation.cs`, frozen Stage2, protected catalogs, V148/Protocol149 or main. If the needed event inspection requires touching another owner's file, HQ must separately authorize their ownership. Collector script code was not included, so changing its log-tail algorithm is a **proposed** fix, not evidence of a specific bug.

**Already accepted, do not repeat:** A60 361/361 managed (10/10 PHX UI), codec13/13, Unity Windows BuildPipeline, generic 50-turn native smoke, four binary hashes and the true 11-game-PNG visual gate for the prior exact A20 source SHA. Fresh WebGL/Android and G3 physical/network tests remain NOT_RUN; complete G4 HOLD; release STOP.

## 6. Five-axis status and HANDOFF

- **DESIGNED:** YES — exact independent six-axis forensic acceptance and minimal closure evidence.
- **IMPLEMENTED:** only A60 report, **no C#/Unity/CI/source change**.
- **TESTED:** independent real Google Drive ZIP hash, CRC 12/12, 5 PNG decode & foreground review, parsed all JSON/5 delta logs/full Unity snapshot, exact GitHub branch/source semantics and 2 in-memory negatives. Python audit **exit 0**. No new .NET/Unity/physical test by A60.
- **INTEGRATED:** NO; A20 fix remains isolated from frozen Stage2.
- **RELEASED:** NO — STOP.

**Overall decision:** `PHOENIX_ACCEPTED_LAUNCH = PASS` for event in snapshot; other modality/after-use/hand gates limited as in table; `PHOENIX_WINDOWS_UI_ACCEPTANCE = HOLD`; complete `G4 = HOLD`; `RELEASE = STOP`.

**HANDOFF → A20 Issue #95 / A40 Issue #92 / HQ Issue #97 / A70 #137:** close only the proven event-level acceptance. Obtain true game-window after-use evidence and one authoritative before/after hand/stock snapshot with input attribution. No main merge, release, deployment, force push or protected source modifications.
