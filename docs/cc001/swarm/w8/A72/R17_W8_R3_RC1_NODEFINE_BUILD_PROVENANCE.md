# CC-001 R17-W8/R3 — A72 RC1 NO-DIAGNOSTIC WINDOWS BUILD PROVENANCE

**ROLE** A72 Build & CI / issue #113. **HQ** [decision 6334918770](https://github.com/C8LyNn/aplikacja-turnieje/issues/113#issuecomment-6334918770). **STATUS:** OWN-OPERATOR-TOOLS-IMPLEMENTED / WINDOWS_BUILD_NOT_RUN / PRODUCTION_BINARY_PROVENANCE_WAIT. **SAFE:** isolated A72 files ONLY; no RC1, A20, Stage2, R16, V148, .gitattributes, ProjectSettings or main mutation.

## 1. Read previous W6 accepted evidence FIRST — precise evidence-gap matrix

A60's independent [W6 acceptance #139 comment 6298852194](https://github.com/C8LyNn/aplikacja-turnieje/issues/139#issuecomment-6298852194) is the primary source; this A72 R3 run **did not re-download the original W6 ZIP** from that other conversation, nor re-hash W6 original bytes. The linked **Core Clash private Drive folder**, which A72 listed in R3, currently has W7 diagnostic ZIP and another recovered ZIP, but not a file explicitly named `phoenix-w6-qa-20261020-204232(3).zip`. Do not claim its original bytes were retrieved by A72.

| Evidence element | W6 prior accepted real evidence | Can close RC1 source→production binary provenance? |
|---|---|---|
| Source identity | A20 W6 same `10f64e4d213f17a352ed8fa83bc75884a39549f0`; exact RC1 ref/Stage2 ancestry independently verified R2 | **YES** same Git SHA; no new gameplay source changes |
| Managed + codec | A60 separately accepted **361/361 managed**, including Phoenix UI fixtures 10/10; **13/13 codec** | **YES scoped**, don't repeat |
| Unity version + build | Actual W6 6000.4.0f1 `windows-build.log`, SHA256 `10bf8d21a095af630344da4d97581f6294d9e21bae860fc0e74927116fa7ff56`, successful Windows build marker and reported exit0 | **PARTIAL**; original full effective compiler inputs/source checkout SHA not independently verified in the W6 ZIP |
| Binary raw samples | A60 rehashed 4/4: `CoreClash.exe` 667648B SHA256 `97845574417b7fc4db70bfbaa4d3f941eab8628df2bcc9424dba328d3a6549c3`; `Assembly-CSharp.dll` 271872B SHA256 `909d71c3c2641657b887c496cbc7cdbb817070bca22250f758f334c0811b4698`; `resources.assets` SHA256 `85fb6df50e0ecf2737357ca1ca211e48e5932d80b7920715066639ac7cb4106d`; `level0` SHA256 `78e3c6f377ab72737c52c90c4f6bb056fdf274e3ad76f3d4ad440935b190b0f4` | **PARTIAL**; four sample binaries, not full original Windows Player inventory |
| W6 ZIP | `phoenix-w6-qa-20261020-204232(3).zip` 1668642B, A60 independently SHA256 `d6e5224bff848e9bf03881f1f4ea4f4ef69e68ee334aa51dfe8772378a02b658`, 19/19 CRC; manifest 18/18 matching payload | **PARTIAL**, A72 did not rehash raw ZIP this R3; source→binary proof cannot be filled by ZIP checksum alone |
| Runtime | Windows native 50 turns / 51 launches and 6 original visual screenshots, separately 11 genuine Phoenix screenshots accepted | **YES scoped W6 runtime**, not G3/G4 |
| Non-diagnostic build flags | RC1 source `ProjectSettings.asset` has `scriptingDefineSymbols: {}`; no tracked `Assets/csc.rsp`; RC1 `CoreClashApp.cs` has no W7 diagnostic block | **NO** effective compiler command line/response-file/actual DLL no-define evidence not exhaustively recorded in W6 archive |
| Whole Player manifest | W6 four independently hashed selected original files | **NO** full unflattened Player paths/size/SHA256 and source SHA provenance absent |
| Native OS process exits | Unity Editor exit0 in W6 log, codec evidence `exitCode=0`; managed exit originally user/HQ asserted | **PARTIAL**, need fully bound new process + source + binaries |

**Decision:** `RC1_PRODUCTION_BUILD_PROVENANCE_ACCEPTABLE_WITH_EXISTING_W6=NO`; `TARGETED_FRESH_NO_DEFINE_WINDOWS_BUILD_NEEDED=YES` strictly to close the provenance gap, **not** to re-test game behavior.

## 2. Exact immutable RC1 identity and guarded compilation

- RC1 `integration/cc001-r17-w8-phoenix-rc1` → **`10f64e4d213f17a352ed8fa83bc75884a39549f0`**.
- Whole commit Git tree → **`304f7f2811900c0b2b7771ec567170365f709c50`**.
- Project Git tree → **`328b6c7248c9c86f0b5910a96502915dc2234ae0`**.
- Production `CoreClashApp.cs` Git blob **`33be4b892d85bd3b68d08a1a79d5aab39d256600`**.
- Pinned `BuildTools.cs` blob **`d4866b0ee5e5ef9c92c94a900a5fc8f9121beab9`**.
- Pinned `ProjectSettings.asset` blob **`8a0952f873139d850d1a4cc3d51774038b498ac5`**, **do not change**.
- Different W7 debug-only source **`e30e471f25005954f3e234d82afdbe15193a7a4a`** must never be cloned by R3.
- Unity **6000.4.0f1**, existing `CoreClash.Editor.BuildTools.BuildWindows` executes `StandaloneWindows64`; no extra flags.

**Raw Git EOL** guard reused and tightened from A72's real accepted Windows W7 R3: zero-delimited porcelain status, Git `check-attr`, `ls-files --eol`, binary `git cat-file blob`, exact SHA of HEAD/worktree. For tracked ` M` under confirmed eol=lf with historical CRLF, permit ONLY (A) work bytes IDENTICAL to `HEAD` or (B) exact CRLF→LF normalization. Forbid staged/add/rename/delete/untracked (outside .gitignore), unsafe/binary changes. BEFORE, PRECOMPILE and POSTBUILD tracked-source SHA256 snapshots recorded; fail closed on any source mutation, even if caused by Unity setup.

**No diagnostic:** initial empty Standalone `scriptingDefineSymbols: {}`; no original `Assets/csc.rsp` or other preexisting compiler response files; no diagnostic string in RC1 `CoreClashApp.cs` or ProjectSettings; no external compiler override variables; after actual build re-check ProjectSettings, reject diagnostic marker in generated `Library/Temp` compiler response files, Unity Editor log, ASCII and UTF16LE in **actual NEW Assembly-CSharp.dll**. These combined controls are **strong negative evidence**, not a formal proof of every hidden editor/compiler flag outside observed inputs. Any mismatch or unrecorded override → **STOP**, not an automatic PASS.

## 3. Actual A72 new artifacts and operator kit

All changes **only** A72 isolated branch `feat/cc001-r17-w4-a72-managed-ci` under authorized `scripts/cc001/w8/a72/**` and `docs/cc001/swarm/w8/A72/**`:

1. [Main operator build/forensic script](https://github.com/C8LyNn/aplikacja-turnieje/blob/f58b254fbd75ac4ad626743b0620c331687dcdc8/scripts/cc001/w8/a72/CC001_RC1_NO_DEFINE_WINDOWS_PROVENANCE.ps1), exact blob SHA1 **`d704a92ee11db784b573bdc776faaced56b5bfee`**, exact UTF8/ASCII SHA256 **`282D8BE8B79FD022C98DD7BD050B2AFC1843D31F0339706BB1DC6F31E54C8EE8`**, immutable implementation commit **`f58b254fbd75ac4ad626743b0620c331687dcdc8`**.
2. `START_RC1_NODEFINE.ps1`: authenticated private GitHub clone of A72 branch, `git show <immutable builder commit>:<builder path>` with SHA-256 and native Windows PS5 Parser.ParseFile **before execution**. Bootstrap Git blob SHA1 **`1afd79cc5a0d99937a589c15c4cfcb82fcd15fb0`**.
3. `URUCHOM_RC1_NODEFINE.cmd`: one-click launcher, Git blob SHA1 **`eb9629dcd22a2fef38a07de02700625c6363671e`**.

**A72 local operator delivery ZIP:** `CC001_R17_W8_A72_RC1_NODEFINE_OPERATOR_KIT.zip`, **4110B**, outer SHA256 **`AF7C0FD51AB44370A6E5DBA5897B35715C0F75BF8FD9DED880CA2A8A3B6B3C7B`**, 4/4 CRC PASS; includes CMD, bootstrap, Polish `PRZECZYTAJ_NAJPIERW.txt`, SHA text. Bootstrap and CMD bytes independently reproduced locally and Git blob SHA1 matched *exact* GitHub readback. This ZIP was generated in A72 chat at `/mnt/data/CC001_R17_W8_A72_RC1_NODEFINE_OPERATOR_KIT.zip`; **not uploaded to GitHub Issue or Drive**; main builder fetched after Git authentication and pinned SHA.

**Default ONE run:** double-click `URUCHOM_RC1_NODEFINE.cmd`, Windows 11, Git for Windows with private `C8LyNn/aplikacja-turnieje` access, Unity Hub Editor 6000.4.0f1 with Windows support; **no admin**, no complex commands. Program creates fresh `%USERPROFILE%\Downloads\CC001_RC1_NODEFINE_<timestamp>_<guid>\`, never overwrites existing or user worktrees. Does only one clean no-define Unity build. No W7 Phoenix diagnostic and no managed/codec/repeat UI smoke, no CI action registration, merge or deploy.

**Actual build run must create** original **full** `WindowsPlayer/**` in forensic evidence, `manifest.json` with full relative `{path,bytes,sha256}` inventory, source tracked-file `{path,bytes,sha256}` inventory, pre/post checkout audit JSON with strict EOL path proofs, SHA Unity.exe + Unity batch exit metadata/log, original build JSON, compiler response file SHA, actual DLL and EXE SHA. Outer real `CC001_R17_W8_A72_RC1_NODEFINE_BUILD_EVIDENCE.zip` + `EVIDENCE_SHA256.txt`; retain all original working artifacts and logs locally. Submit unchanged evidence ZIP and receipt to A60 #139 for independent review.

## 4. Executed checks vs NOT_RUN

**Actually executed in A72 session:**
- GitHub HQ and A60 original W6 source evidence read; Core Clash private Drive folder listing; RC1 ref+source project Git tree and blob pins from R2, no protected mutations.
- Main W8 script static invariants **12/12 PASS**, SHA-256 implementation known `SHA256('abc')` reference **PASS**, immutable main builder digest calculated on committed GitHub bytes, lexical PS structure static balanced (not native parser).
- Local independent Python adversarial model for exact EOL/forbidden Git statuses **26/26 PASS**, plus actual disposable local Git index fixture with historical CRLF stored under `eol=lf`: ` M historical.json`, `i/crlf w/crlf attr/text eol=lf`, HEAD bytes identical to worktree → correctly admissible. **Not a Windows PowerShell execution**.
- Operator ZIP local actual creation, 4/4 CRC and entry byte round-trip PASS, exact outer SHA256; bootstrap/CMD Git hash-object matches live committed blob sha (local test process exit0).

**NOT_RUN:** Windows 11 native PowerShell Parser.ParseFile of NEW script, authenticated Git private clone from operator Windows host, Unity 6000.4.0f1 compiled native no-define RC1 build, actual binary/Editor log attestation, source-byte EOL classification on operator's new checkout, A60 independent evidence rehash and G4. All stay WAIT until real Win11 operator output. No rerun 361+13 tests.

**Caveats:** W6 proves earlier source-matched binary behavior; W8 R3 new package is build/provenance-only. A successful local script/manifest remains **A72 operator evidence**, not independent A60 PASS. The build can fail closed if Unity legitimately rewrites tracked project settings; report exact changed paths instead of relaxing checks.

## 5. GO/WAIT

`R3_EVIDENCE_RECONCILIATION=PASS_GAP_IDENTIFIED`  
`TARGETED_NEW_RC1_NODEFINE_KIT=IMPLEMENTED_AND_STATICALLY_CHECKED`  
`GO_OPERATOR_ONE_LOCAL_WINDOWS_BUILD=CONDITIONAL` to HQ after download  
`RC1_PRODUCTION_BUILD_PROVENANCE=WAIT_WINDOWS_REAL_BINARY_CHAIN_A60_RAW_QA`  
`A72_7_STAGE_RC1=NOT_ATTESTED` (manual recipe only; no workflow registration)  
`PHYSICAL_MOUSE=HOLD;G3=WAIT;G4=HOLD;MAIN_MERGE=STOP;RELEASE=STOP;DEPLOY=STOP`.
