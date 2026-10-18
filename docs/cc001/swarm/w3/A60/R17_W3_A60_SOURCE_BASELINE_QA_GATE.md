# CC-001 R17-W4 recovery / A60-G0 — Independent Frozen R16 Source Admission

**Decision:** **G0 SOURCE PASS — ADMIT IMMUTABLE A70 R16 AS DEVELOPMENT BASE ONLY.**  
**Identity:** A60 — Independent QA / Source Admission (G0); **Issue [#126](https://github.com/C8LyNn/aplikacja-turnieje/issues/126)**; **NOT A10**.  
**Date:** 2026-10-18.  
**Own branch:** `feat/cc001-r17-w3-a60-baseline-qa`.  
**Own starting HEAD:** `e9e235a69a04eb57727defd308918321836d7f02` (W3 dispatch, parent is immutable A70).  
**Authoritative W4 dispatch SHA:** `661660d3a3dc8a4fa2c9afea489050247f64c38c`.  
**Frozen A70 R16 source commit:** `de1fe4b88fce3bd08ef383165dc2cd622af2536b`.  
**Source-import commit:** `9a3b12a17d15aa10a260f494c7c407597fe9cce5`.  
**Unity project:** `unity/cc001-r16/CoreClash-V149-Unity/`; editor `6000.4.0f1`, revision `8cf496087c8f`.  
**A70 raw R16 subtree Git SHA-1:** `1dd04ea8bd44d1b54777ed1ca5e5c47a3057d0e6`.  
**Canonical ZIP SHA-256:** `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4`.  
**Protected original V148 SHA-256:** `bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e`.  

## 1. Scope of this decision: SOURCE G0, not candidate/release QA

This report finishes the existing W3 A60 **#126** assignment carried into W4. It answers only: *Can the exact frozen imported R16 tree be accepted as a reliable immutable DEVELOPMENT input?* **YES**, based on independent ZIP/static verification plus A71 provenance readback.

**It does not admit any W1/W2/W3/W4 source modifications, assembled disposable candidate, gameplay parity, managed tests, Unity Editor compilation, production target builds, LAN/WAN, physical mobile or release.** Separate A60 Issue #139 is explicitly **NOT** executed. W1 A60 integration HOLD remains valid **for runtime/release scope**, while G0 now closes the narrower source-provenance prerequisite.

**Allowed changed file:** only this report under `docs/cc001/swarm/w3/A60/`. No gameplay/Unity, `.meta`, V148, manifest, ZIP, Protocol 149, deck/catalog, public website, or workflow source was modified.

## 2. Independently executed read-only checks (A60 evidence, not copied PASS)

### E01 — Exact original local R16 ZIP: PASS, exit 0

In a Python 3 process on Linux, inspected the actual 17,690,458-byte archive located in the current task runtime at `/mnt/data/CoreClash-V149-R16-Source-Candidate.zip`, not a GitHub-generated repository snapshot. Used standard-library `zipfile`, `hashlib`, `re`, `json`; all bytes read in memory. Positive check used a Python heredoc (`python - <<'PY' ... PY`; shell exit **0**):

- `hashlib.sha256(open(path,'rb').read())` → canonical `b3dc332b...fcc6a4`: **MATCH**.
- `ZipFile.testzip()` → `None`: **PASS**.
- Exactly **639** file entries; 639 unique paths; no traversal or absolute paths; total uncompressed **26,223,651 bytes**: **PASS**.
- Embedded `SHA256SUMS.txt` has exactly **637** file SHA-256 declarations; checked **637/637** against the actual ZIP entry bytes; **0 mismatch / 0 missing**: **PASS**. The historical self-checksum list does not include two archive administrative files; 637 is *not* the total imported file count.
- `Reference/V148_reference_original.html` SHA-256 → canonical `bbc48f84...4623e`: **MATCH** before any work (no reference edits).
- **88** `.meta` files; all **88 GUIDs exist and are unique** under `(?m)^guid: ([a-f0-9]{32})$`: **PASS**.
- No path component named `Library`, `Temp`, `obj`, `Logs` or `Builds` (case-insensitive): **PASS**.
- `ProjectSettings/ProjectVersion.txt` says Unity `6000.4.0f1`; package `com.unity.netcode.gameobjects` `2.13.3`; `Packages/packages-lock.json`, `Assets/CoreClash/**`, `Assets/Resources/Data/**`, `Tests/**` are present: **PASS**.

**Cryptographic Git reconstruction, genuinely recomputed by A60:** For every source entry construct unfiltered Git blob digest `SHA1("blob <byte-count>\\0" + raw)`, then recursively construct Git `tree` digests from `100644 <filename>\\0<blob SHA>` and `40000 <directory>\\0<tree SHA>` entries, with Git slash-aware byte ordering. The whole archive's recomputed source tree is precisely `1dd04ea8bd44d1b54777ed1ca5e5c47a3057d0e6` — **MATCH to the remote immutable A70 subtree**. This reproduces raw source *content identity* over all 639 paths, not merely a path count.

Also independently recomputed 639 canonical `path<TAB>size<TAB>sha256<LF>` tuple-stream digest from ZIP bytes (UTF-8 path-sorted): `5e214d546d86d7128c39f2f5244808556a206d7846e6f573addc5e3fc886c2bb` — **MATCH to independent A71 audit**.

**Harness correction / negative accounting:** the first ad hoc heredoc run exited **1** after typing an invalid, truncated **62-character expected hash** for V148 (not the 64-character authoritative digest). The calculated hash itself was the correct 64-character value. Correcting the *audit assertion constant*, without changing any archive or source byte, produced the above full successful audit with **exit 0**. This was a test-harness transcription error, not a discovered source-integrity defect; both exits are disclosed.

### E02 — Original Node data/source validator: PASS, exit 0 and negative control exit 1

Executed on Linux / Node **v22.16.0**. Extracted the original 639 ZIP entries into an OS-managed isolated `mktemp -d /tmp/cc001-a60-g0-XXXXXX` directory, **outside any frozen Git checkout**, and ran:

```sh
cd "$TMP/CoreClash-V149-Unity"
node Tools/verify-data.cjs
# Exit 0:
# PASS: 227 records / 224 specials / 12 archetypes /
# 36 canonical + 4 provisional decks; runtime HP/size/contracts and source hash verified.
```

**Negative control, same disposable directory only:** removed the final ball from the temporary copy of `Assets/Resources/Data/catalog.json` (227 → 226); reran the *unchanged original* `node Tools/verify-data.cjs`. It correctly printed `FAIL: Expected values to be strictly equal: 226 !== 227` and exited **1**. An encompassing shell assertion requiring the negative exit to be nonzero exited **0**. Temp extraction was removed by `trap`. No live or frozen source file was changed.

This is a **Node/source-data integrity validator**, **not** a gameplay test.

### E03 — Remote A70 Git tree against manifest: PASS, GitHub API read-only

Read exact frozen branch current HEAD via GitHub REST (`feat/cc001-r17-a70-source-import` → `de1fe4b...`). Read immutable `docs/cc001/swarm/R17_A70_SOURCE_MANIFEST.json` (blob `99cf0b5666f9cd6648943e9b54342e6546c5d3b1`) and source Git recursive tree SHA `1dd04ea8bd44d1b54777ed1ca5e5c47a3057d0e6` directly through connected GitHub.

Programmatic comparison of manifest and tree collections:
- manifest `imported_count=639`; file entries **639**;
- recursive tree `truncated=false`; **639** blobs;
- path missing **0**; extras **0**; size mismatches **0**;
- mode violations **0** (all blob mode `100644`); case-fold collisions **0**;
- `.meta` count **88**, generated directory entries **0**;
- A70 branch HEAD still exact frozen expected SHA.

GitHub connector/V8 comparison completed without exception (no OS process exit code; **API/static PASS**, not mislabeled as a local shell test). Combined with E01 raw reconstructed Git tree, this is independently strong content identity evidence.

### E04 — Independent A71 proof reviewed: supported, not self-credited

[Independent A71 report](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-a71-source-integrity/docs/cc001/swarm/a70-support/A71/R17_A71_INDEPENDENT_SOURCE_AUDIT.md), Issue #112, independently downloaded original Drive archive, verified ZIP integrity **639/639** and all **88/88 `.meta`**, compared per-file SHA-256 to A70 manifest, recomputed exact Git tree, cross-checked 637/637 historical checksum list, checked no generated files and no path-case collisions. A60's own E01–E03 findings agree. **A71 did not run new Unity Editor/device tests.**

A70 importer supplied GitHub Actions [run 39125498352](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39125498352): GitHub API readback **completed/success**, workflow head `93586384d2257d1732d1ab0cf33abcff9e64bab0`; this supports its import process and static data validator, **not Unity compilation**.

### E05 — A72 final static preflight reviewed: 32/32 STATIC ONLY

Read Issue [#113](https://github.com/C8LyNn/aplikacja-turnieje/issues/113) final earlier HANDOFF and commit `c49ef5855eed7eb5aef5534f5cc8334fe1585463` (A72 source-preflight branch). A72 reported **11/11 source reads + 6/6 V8 parser checks + 15/15 structural assertions = 32/32 static PASS** and Node script syntax validation; its reported missing-project negative control failed closed. **A60 did not rerun A72's 32 preflight assertions and does not claim them as A60 execution.**

A72 explicitly did **not** execute new managed .NET 9 269 tests, codec 13, Unity Editor 6000.4.0f1, Windows/WebGL/Android builds or physical clients. The later W4 A72 managed-CI branch remained at dispatch-only SHA `661660d3a3dc8a4fa2c9afea489050247f64c38c` at this inspection; no W4 CI run is certified by G0. An authored workflow or a previous static PASS cannot be substituted for executed G1/G2.

## 3. Source semantics reconciliation: F01/F02 and W1/W2

**F01 construction durability — critical W2 correction accepted as SOURCE TRUTH:** Previous A60 W1/W2 discussion repeated early A50's apparent “two-hit V148” interpretation. W2 A50 correctly inspected executable `createStructure`, at immutable V148 **lines 24843–24880**: `hitsRemaining: extra.hp ?? 5` and `maxHits: extra.hp ?? 5`. Calls passing `hits:2` do **not** set these effective fields. Engineer wall additionally forces 5. Independently inspected original ZIP source and observed both assignments at **L24879–24880**; R16 current construction tests/configuration use **5 HP**. **Do not alter R16 HP to 2.**

Separate unexecuted F01 candidate: V148 structure hit gate requires impact **>32** and cooldown **>0.28 s**; R16 native `BallPhysics.cs:79` checks fresh episode and `-vel >= 90`. A 60-normal-speed golden contact is a **DESIGNED / NOT_RUN** parity case. Not a G0 source admission blocker; **is** later parity/integration gate.

**F02 Frostguard — remains unresolved:** W2 A50 reports V148 plain STOP anchored at zero synthetic Earth stacks (force factor `0.30`, mass `2.0x`), whereas imported R16's `anchorStacks=3` yields `0.34` and `4.10x` with friction consequences. W3 A50 source branch authored intentional RED expectations and no production fix. W4 A50 Issue #138 owns future parity correction and runtime verification. G0 PASS does not override its HOLD.

**W1 source/contracts and W2:** Earlier A60 W1 Gate 001 `HOLD` was for unimported/no integrated feature work, not a permanent denial of A70's subsequently verified frozen source. A60 W2 reconciliation already distinguished design artifacts from runtime evidence and documented source import pending independent audit; E01–E03 now close precisely that pending G0 provenance condition. A10 W1 lifecycle/RETURN contracts are accepted only as a semantic input for separate A40 implementation; no five-ability runtime readiness follows from their existence. A10 W2/W3 Mitosis/Furnace contract/probe is source/browser evidence, not Unity acceptance. A20 W2/W3 UX, A41 seat, A51 snapshot and A50 W3 RED fixture have not been integrated or compiled into an accepted Unity candidate. This G0 does not review their future combined behavior.

**Registry truth:** R16 `CoreClash-V149-Unity/Evidence/R16/ability-support.json` directly inspected from original archive: `UNITY_READY=42`, `PARTIAL=51`, `DATA_ONLY=134`, no status promotion by A60. Protocol 149 unchanged.

## 4. Separate gates and explicit non-executions

| Gate | A60 disposition | Exactly what it means |
|---|---|---|
| **G0 — original frozen R16 source admission** | **PASS** | Raw ZIP, 639 files/88 meta, original V148, package/root, data and reconstructed raw Git tree match; immutable source accepted **for isolated development only** |
| G1 — candidate managed .NET 9 / codec | **HOLD / NOT_RUN BY A60** | No post-W4 269+13 C# execution asserted here; A72 32 STATIC is not G1 |
| G2 — native Unity Editor + Windows/WebGL/Android | **HOLD / NOT_RUN BY A60** | No Unity Editor 6000.4.0f1 compilation or fresh target build in this task |
| G3 — physical device / LAN/WAN, mobile UX | **HOLD / NOT_RUN BY A60** | No device, NAT, cross-platform multiplayer or physical touch evidence |
| G4 — exact integrated candidate independent QA | **HOLD / NOT_RUN BY A60** | No integration candidate under this Issue; future A60 **#139** independent gate |

**NOT_RUN:** .NET managed 269/269, network codec 13/13, Unity gameplay/physics, F01-G01/F02 native fixtures, W3 new compiled suites, W4 fixes, Windows/WebGL/Android builds, replay/snapshot integration, physical phone/tablet, LAN/WAN/cross-NAT, end-to-end candidate acceptance. Historical R16 results are archival, **not** independent R17 executions.

**Potential additional nuance:** The initial 639-file archive SHA256 and raw-tree identity were genuinely recomputed from local task-provided archive bytes. A71 separately compared canonical Google Drive bytes; A60 did **not** download the original file from Google Drive anew in this invocation. A60 did independently verify its locally provided archive against the exact canonical expected SHA256 and against remote raw Git subtree digest. No material uncertainty remains for G0 source identity.

## 5. Risk, handoff and decisions

**G0 SOURCE ADMISSION:** **PASS**. HQ may now use immutable A70 at `de1fe4b88fce3bd08ef383165dc2cd622af2536b` as a **future development and candidate-staging baseline**, subject to independent A73 W4 exact-ref conflict map and all W4 source ownership constraints. This report is *not* authorization for A70 to merge or publish; HQ must also confirm the separately required A73 check before its disposable candidate assembly.

**Blocks beyond G0:** A72 genuine G1 .NET runner/tests; A50 F02 native RED→GREEN; A40 lifecycle implementation/test; A20/A31 physical QA after G2; A71/A74 candidate provenance/hygiene; A60 #139 exact candidate re-review. F01 initial HP is 5; threshold mismatch candidate remains untested. No `UNITY_READY` count change.

**Scope/control:** exactly one permitted A60 documentation report; no mutation of imported files, `Assets`, `Reference`, `.meta`, `Tests/Program.cs`, archive manifest, Protocol 149, protected V148, main or website. No merge, rebasing, force push, deployment or issue closure.

**DESIGNED:** YES — frozen G0 admission boundary + downsteam decision criteria.  
**IMPLEMENTED:** YES, **independent QA report only**, NO gameplay, networking, CI or Unity code.  
**TESTED:** YES, archive/hash/Git object reconstruction, 637 SHA declarations, meta GUIDs, Node data PASS and negative failure, GitHub manifest/tree static readback; **NOT managed/Unity/physical**.  
**INTEGRATED:** NO — source import remains on immutable A70 branch; own report alone is not integration.  
**RELEASED:** NO.

**HANDOFF:** 00/HQ and A70 may treat **G0 SOURCE PASS** as source-admission evidence; A73 must independently finish exact branch/conflict mapping before A70 candidate assembly; A72 must supply G1, A50/A40 their scoped implementations; later independent A60 **#139** must review actual integrated candidate and real runtime logs. **Issue #126 may be reviewed/accepted by HQ without closing or claiming release.**
