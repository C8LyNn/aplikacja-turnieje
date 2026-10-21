# CC-001 R17-W7 / A72 — WINDOWS CHECKOUT CRLF/LF RECOVERY (P0)

**Identity:** A72 — Build & CI, existing Issue #113.  
**HQ authority:** https://github.com/C8LyNn/aplikacja-turnieje/issues/113#issuecomment-6316095188  
**Status:** PATCHED_SOURCE / STATIC_EVIDENCE_PASS / WAIT_WINDOWS_RERUN / RELEASE_STOP

## 1. Original Windows fault — evidence and root-cause scope

HQ's first real Windows 11 execution of the OLD A72 operator kit:
- Bootstrap script SHA-256 and native Windows PowerShell parser **PASS**.
- Exact A20 diagnostic source SHA `e30e471f25005954f3e234d82afdbe15193a7a4a`.
- `git status --porcelain=v1 --untracked-files=all` OS exit **0**, **50 tracked M paths**, stderr EMPTY; checkout failed with `STOP: Checkout is not clean` **before symbol configuration and Unity Editor**.
- Git warns CRLF will be replaced by LF. Committed `unity/cc001-r16/CoreClash-V149-Unity/.gitattributes` Git blob `a66444895919b0d1a68ba102eb43f14b420e86ea`: `*.cs/*.json/*.md/*.cjs text eol=lf`.
- Concrete committed example `Evidence/R16/FullMatch/r6-native-runner.json` Git blob `6db0f7ef0cb4f7d7a1edb3808589daedba0ce074` contains **92 CRLF out of 92 line breaks**; A20 W7 `CoreClashApp.cs` itself contains mixed EOL. This substantiates EOL normalization root cause for at least a real source sample.
- **Important limit:** A72 did not receive raw bytes of all 50 Windows working files in this conversation; **each must be checked by the NEW actual operator harness before claiming ALL_50_EOL_ONLY**. HQ's warning/status is not a substitute for per-file byte proof. Old failed checkout/logs must remain preserved.

## 2. Exact repair — safe raw Git byte comparison

In the existing A72-owned `scripts/cc001/w7/a72/CC001_W7_PHOENIX_DIAGNOSTIC_WINDOWS.ps1` new `AuditWorktree` replaces unconditional all-clean assertion **WITHOUT skipping the cleanliness control**.

For each phase (`BEFORE`, `AFTER` temporary diagnostic symbol only):

1. Execute `git -C <disposable checkout> -c core.quotePath=false status --porcelain=v1 -z --untracked-files=all`, OS exit0 required; preserve original raw zero-delimited stdout in numbered logs. Strict UTF-8 decode; check valid records, unique safe paths; forbid untracked, staged, added, deleted, renamed, unmerged/conflicted, unknown statuses. BEFORE permits **only exact ` M` tracked modifications**. AFTER additionally permits precisely ` M <ProjectSettings/ProjectSettings.asset>` and `?? <Assets/csc.rsp>` when they match recorded post-write SHA256. No broad ignoring.
2. For each historical tracked M, require approved text extension, `git check-attr eol` reports `lf`, and `git ls-files --eol -- <path>` reports `i/crlf` or `i/mixed`, `w/lf`, `attr/text eol=lf`. Retain sample per-file EOL ledger including `CoreClashApp.cs` and 1+ JSON.
3. Determine exact `HEAD:<path>` Git blob SHA with `git rev-parse`; read raw blob using `git cat-file blob <SHA>` into binary redirected file, then `[IO.File]::ReadAllBytes`. Read working file the same way. Reject binary NUL, identical-bytes M status, no CRLF in committed bytes, missing/outside-checkout file.
4. Compute **only** `expected = committed HEAD bytes with every [0D 0A] replaced by [0A]`; any lone CR or other data stays unchanged. Byte-for-byte compare `expected` to **unaltered working bytes**. Exact equality → `NORMALIZED_EOL_ONLY`, otherwise **`WAIT_OTHER_DIFF`** and STOP with path. Does **not** compare after generic trim, case-fold, tab/space normalization, decoding, index/HEAD modification or Git checkout restoration.
5. Audit JSON with exact 50-or-other count, every path, Git blob, rawHEAD SHA256, expected normalized SHA256, work SHA256, byte counts, CRLF removed and `git ls-files --eol` records. Store `checkout-eol-before.json` and `checkout-eol-after.json`. Verify list AND each work SHA is unchanged across temporary symbol configuration. Include both full audit files in A60 evidence ZIP, and link their hashes in truthful `source-provenance.json`.
6. Retain immutable A20 commit/tree/C# blob verification: `e30e471f25005954f3e234d82afdbe15193a7a4a`, Unity tree `4ab2eb0eb2cfd6f2393233ef7e18d831f06ce652`, A20 app blob `a4a729e7a20bd0c6f5a89a466c1139b68cb1778c`. Old Unity version, build pipeline, player/EXE/DLL hashes and screenshot capture safeguards unchanged.

**Never:** edit A20 C#, `.gitattributes`, gameplay, R16/V148/Stage2/main; `git reset --hard`, `git clean`, `git add --renormalize`, force push, new workflow, release or deploy. Raw HEAD/check-out original input is NOT changed.

## 3. Pinned operator release R2 — replaces previous ZIP

**Exact main builder pinned Git commit:** `516041349695285766b3f46415c5cc7f2bb50466`.  
**New main builder Git blob SHA-1:** `513a06fda38999830ba601cea7c3038610215b79`.  
**New main builder SHA-256:** **`64C49626F4BD0EE29A9004B421FC2E23AF2C845B3EF6D3692C53BA1BCB9A49B3`** (computed on exact committed ASCII/UTF-8 bytes via SHA256 implementation whose standard 'abc' test-vector PASS).
**New authenticated `START_CC001_W7.ps1` Git blob:** `bebede26fb73bd859d7346c82db4e9b95fee37f2`, updated commit/hash pins. Operator CMD unchanged.

**NEW operator ZIP delivered in A72 conversation:**
`CC001_W7_A72_OPERATOR_KIT_RECOVERY_R2.zip`, **3723 bytes**, SHA256 **`D6AE660A00C236404BBA7764C60562366EFFA951B91E2784474E0E12439DEE46`**, archive ZIP CRC 4/4 PASS, exact four entries: `START_CC001_W7.ps1`, `URUCHOM_CC001_W7.cmd`, `PRZECZYTAJ_NAJPIERW.txt`, `SKRYPT_SHA256.txt`. New ZIP's bootstrap blob SHA1 independently matches exact GitHub published bootstrap `bebede...` (contents reproduced using only two authorized pin changes, then Git blob SHA1 checked). Main builder fetched securely from authenticated **private GitHub** on one-click invocation, verified by SHA256 and Windows PowerShell parser before running. **This ZIP is not a game build**, and is not currently attached to a GitHub issue.

**CRITICAL:** R2 supersedes prior `CC001_W7_A72_OPERATOR_KIT.zip` (old SHA256 `B077D29...`). User must extract R2 in **new** folder, never overwrite old failed-run artifacts. No manual Git commands required.

## 4. Actual verification and test evidence

- GitHub exact committed A20 / own A72 source blob, check ref and status results: checked independently.
- SHA256 algorithm known `SHA256('abc')` vector **PASS**. Current exact main GitHub committed file digest computed as `64C496...`.
- Local synthetic adversarial oracle model in Python: **19/19 PASS**, including mixed/CRLF legitimate changes accepted; changed literal, whitespace insertion, dropped line, LF→CRLF, NUL/binary, unexpected status, missing attr, unexpected work EOL rejected. This is a **behavioral cross-check of the byte policy**, NOT proof that the Windows PowerShell harness executed.
- Main source structural check: one `AuditWorktree`, one `Collect`, one main process block, no original unconditional `Checkout is not clean` assertion, no fake `initialGitClean=true`. `checkout-eol-before.json` and `checkout-eol-after.json` included in manifest payload. No Unity source changes.
- New ZIP generated in A72 chat local runtime: Python packaging/CRC/hash checks exited **0**; 4/4 CRC+entry round-trip PASS; bootstrap Git blob identity match PASS.
- **NOT_RUN:** A72 environment lacks Windows PowerShell 5.1 and Unity Editor 6000.4.0f1. Native PowerShell parser, actual per-file verification on user's 50 working files, Unity diagnostic compile/build, new EXE/DLL/screenshot/runtime trace remain **WAIT**. The new bootstrap performs native parser validation on the next Windows run. Never report these as PASS in advance.

## 5. Windows operator instructions, gates and handoff

Prerequisites: Windows 11, Git for Windows with authenticated access to private `C8LyNn/aplikacja-turnieje`, Unity Hub Editor **6000.4.0f1** Windows Standalone support.

1. Preserve old failed run folder/logs; extract only **R2 ZIP** in another new directory.
2. Double-click `URUCHOM_CC001_W7.cmd`. Bootstrap verifies immutable main script SHA256/parser, then tool makes fresh `Downloads\CC001_W7_DIAG_*\`, authenticates Git, validates source SHA/tree/blob and runs preconfiguration EOL byte audit of every actual tracked M.
3. The tool should show `CHECKOUT: NORMALIZED_EOL_ONLY / N tracked paths` if all are proven, or `CLEAN_EXACT` if no change. **STOP + path if any real content discrepancy, status, attribute, unexpected config delta**. Audit both before and after disposable `csc.rsp` and ProjectSettings symbol write; `CC001_PHOENIX_DIAGNOSTIC` only within disposable checkout.
4. Existing Unity `CoreClash.Editor.BuildTools.BuildWindows` builds a new diagnostic StandaloneWindows64 Player, never reuses previous EXE/DLL. Launcher requests single offline `fire_3` Phoenix lifecycle; operator manually captures TRUE GAME-WINDOW PNGs, closes Player. Tool creates `CC001_W7_A72_DIAGNOSTIC_EVIDENCE.zip` and `EVIDENCE_SHA256.txt` from actual logs, original EXE/DLL/PNG, and full EOL audit. Collect SHA, actual exit codes, Unity log.
5. Share **original ZIP+receipt** with A60 (#139), for independent verification of run/match/trace, BEFORE ready stock0, AFTER accepted=True stock0, exactly one hand entry removed and actual Phoenix SPAWN; HQ #97 informed.

**Gate:** `GO_LOCAL_R2_CHECKOUT_RETRY` conditional on the Windows PowerShell parser passing and per-file original HEAD byte proof; `ALL_50_NORMALIZED=UNVERIFIED_UNTIL_WINDOWS_RERUN`, `UNITY_DIAGNOSTIC_BUILD=NOT_RUN_NEW_R2`, `PHOENIX_REAL_UI_RUNTIME=WAIT`, full G4 HOLD and RELEASE STOP.
