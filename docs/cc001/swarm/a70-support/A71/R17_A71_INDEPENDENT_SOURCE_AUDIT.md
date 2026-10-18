# CC-001 / R17 — A71 Independent Source Integrity Audit

**Date:** 2026-10-18  
**Agent:** A71 — Source Integrity  
**Issue:** [#112](https://github.com/C8LyNn/aplikacja-turnieje/issues/112)  
**Scope:** post-import immutable-source verification only (not a repeat import)  
**Frozen A70 source base:** `de1fe4b88fce3bd08ef383165dc2cd622af2536b`  
**A70 source-import commit:** `9a3b12a17d15aa10a260f494c7c407597fe9cce5`  
**Read-only source path:** `unity/cc001-r16/`  
**Result:** **PASS — EXACT 639/639 SOURCE FILES / 88/88 .meta**; **UNVERIFIED — NEW UNITY EDITOR / PHYSICAL DEVICE TESTS**

## 1. Evidence and independently obtained inputs

1. Retrieved [canonical one-source dispatch](https://github.com/C8LyNn/aplikacja-turnieje/blob/feat/cc001-r17-a70-parallel-support-20261018/docs/cc001/swarm/R17_A70_SUPPORT_WAVE_20261018.md) and [Issue #112](https://github.com/C8LyNn/aplikacja-turnieje/issues/112).
2. Downloaded the actual [R16 Drive archive](https://drive.google.com/file/d/1IhtpEBrC-AJyzLTd8elE6lWionI0_bkZ/view), not a regenerated Git ZIP. Drive metadata reported **17,690,458 bytes**; independent local SHA-256 calculation on the downloaded archive was `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4`: **MATCH**.
3. Retrieved the [639-entry A70 manifest](https://github.com/C8LyNn/aplikacja-turnieje/blob/de1fe4b88fce3bd08ef383165dc2cd622af2536b/docs/cc001/swarm/R17_A70_SOURCE_MANIFEST.json) directly from frozen commit. Its Git blob SHA-1 is `99cf0b5666f9cd6648943e9b54342e6546c5d3b1`.
4. Retrieved recursive Git tree for `de1fe4b...` through GitHub's `git/trees/{sha}?recursive=1` endpoint: **not truncated**, subtree `unity/cc001-r16`, **639 blob entries**, **all mode 100644**. The verified A70 source branch HEAD was still `de1fe4b...` when read.
5. Independently parsed all 639 ZIP members using Python `zipfile.ZipFile`, called `testzip()`, measured decompressed byte lengths, computed **SHA-256 and raw Git blob SHA-1 for every member**, and constructed the recursive raw Git tree objects (Git's `blob <len>\\0<bytes>` / `tree <len>\\0<entries>` algorithm, ordering directories by Git's slash-aware byte sorting). Did **not** normalize content or write files back to Git.
6. Compared the 639 A70 manifest `(path, size, sha256)` tuples to the 639 independently observed ZIP tuples using the same deterministic UTF-8 serialization sorted by exact path: `path<TAB>size<TAB>sha256<LF>`. Independently calculated SHA-256 of both streams, rather than trusting the provided manifest count.

## 2. Exact-source check matrix

| Check | Result | Observed independent evidence |
| --- | --- | --- |
| Canonical ZIP SHA-256 | **PASS** | `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4` |
| ZIP completeness and decompression | **PASS** | `testzip() = None`; 639 files; no duplicate or unsafe paths |
| Full ZIP content size | **PASS** | 26,223,651 uncompressed bytes across 639 files |
| Manifest versus ZIP per-file SHA-256 and byte lengths | **PASS 639/639** | Both independently serialized tuple streams SHA-256 = `5e214d546d86d7128c39f2f5244808556a206d7846e6f573addc5e3fc886c2bb` |
| Raw Git tree reconstructed from the entire ZIP versus remote subtree | **PASS** | Both Git tree SHA-1 = `1dd04ea8bd44d1b54777ed1ca5e5c47a3057d0e6` |
| Git recursive tree paths versus manifest | **PASS** | Missing = 0; extra = 0; exact 639 distinct paths |
| Mode/type integrity | **PASS** | 639 blobs, each Git mode `100644`; no symlink/submodule/executable drift |
| Unity metadata | **PASS** | 88/88 `.meta` entries with byte-exact tree and manifest match |
| Case-sensitive names | **PASS** | No case-folded path collisions; exact ZIP/tree path identity |
| Generated folders | **PASS** | No `Library`, `Temp`, `obj`, `Logs`, `Builds` components (case-insensitive) |
| Internal R16 checksum list | **PASS** | `SHA256SUMS.txt`: 637/637 SHA-256 declarations checked against archive bytes; 0 mismatches, 0 missing |
| Imported R16 manifests/evidence | **PASS — PRESENCE/BYTES** | `R16_CANDIDATE_MANIFEST.json`, `SHA256SUMS.txt`, `HANDOFF_R16_README.md`, `Evidence/R16/**` are identical to ZIP via complete-tree equality |
| Unity project version | **PASS** | `ProjectSettings/ProjectVersion.txt`: `6000.4.0f1`, editor revision `8cf496087c8f` |
| Required project subtrees | **PASS** | `Assets/CoreClash/`, `Assets/Resources/Data/`, `Tests/`, `Evidence/`; `Packages/manifest.json` and `Packages/packages-lock.json` |
| Protected V148 archive reference | **PASS** | `Reference/V148_reference_original.html` SHA-256 = `bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5ef9ca4623e`; only included under isolated `unity/cc001-r16/` |
| Byte-exact source versus re-checked-out working-tree line endings | **PASS GIT OBJECTS / NOT RUN CHECKOUT** | Entire ZIP matches raw Git objects; a future checkout under different `core.autocrlf` settings must be assessed separately |
| New R17 Unity Editor compilation | **UNVERIFIED** | No Unity Editor compilation executed by A71 |
| New R17 Windows/WebGL/Android builds and physical crossplay | **UNVERIFIED** | No native builds or physical-device tests executed by A71 |

**Checksum-list nuance:** `R16_CANDIDATE_MANIFEST.json` and `SHA256SUMS.txt` are two additional archive files not individually self-listed in the 637-row historical checksum file. Both ARE among the 639 A70 manifest entries and are cryptographically covered by the full 639-entry tuple digest and the raw Git tree match. Do not confuse 637 checksum lines with a 637-file import.

## 3. Newline and Git-object evidence

The actual ZIP bytes include **198 files containing CRLF**, **438 files containing lone LF**, and **3 files with no LF**. Raw Git tree rebuilding from the unmodified bytes reproduces GitHub's SHA-1 exactly. This is strong evidence that source files were not silently line-ending-normalized before Git object creation. A normal Git checkout may nevertheless apply user-specific `core.autocrlf` / `.gitattributes` transforms, so byte-specific downstream work must verify the raw committed blobs rather than assume all working trees preserve the exact archive encoding.

Git object SHA-1 is **not** the same digest as a SHA-256 source-file checksum. Our identity finding combines (1) exact remote subtree Git SHA-1, (2) raw Git tree SHA-1 independently reconstructed from downloaded ZIP bytes, (3) separately computed archive SHA-256, and (4) independently matching 639-record SHA-256 metadata digest.

## 4. Historical R16 reports: provenance, not a new R17 test run

Read archive-contained `CoreClash-V149-Unity/docs/R16_QA_PL.md`, `docs/R16_REPORT_PL.md`, `HANDOFF_R16_README.md`, and `Evidence/R16/qa-summary.json`. They historically report **269/269 managed tests**, **13/13 network codec**, **5/5 HTML reference**, three succeeded build targets (Windows/WebGL/Android) and browser/device emulations. These files are **present and byte-preserved**; A71 did not independently rerun these historical test cases. Historical QA specifically flags physical-device and cross-NAT tests as not completed.

## 5. GitHub Actions corroboration: precise claim boundary

Observed [Actions run 39125498352](https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39125498352): `status=completed`, `conclusion=success`, event `push`, **trigger SHA** `93586384d2257d1732d1ab0cf33abcff9e64bab0`. Observed job `import-r16` ID `117669647137` with passing steps: reconstruct/verify source, `node Tools/verify-data.cjs`, commit/push. Its job log explicitly reports:

- `R16 IMPORT PASS 639 files; 0 generated exclusions; sha b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4`.
- `PASS: 227 records / 224 specials / 12 archetypes / 36 canonical + 4 provisional decks; runtime HP/size/contracts and source hash verified.`
- Creation/push of source-import commit `9a3b12a17d15aa10a260f494c7c407597fe9cce5`.

**Scope:** validates the workflow's ZIP reconstruction, data-check script and source commit, **not** Unity Editor compilation, full managed-test rerun, real devices, production release or downstream merge. The GitHub import Actions run is independent from this A71 local ZIP/tree/manifest audit, though both share the same canonical archive.

## 6. Reproduction recipe / audit contract

Freeze exact refs (`de1fe4b88fce3bd08ef383165dc2cd622af2536b` and `1dd04ea8bd44d1b54777ed1ca5e5c47a3057d0e6`). Download the canonical ZIP, verify SHA-256 and ZIP `testzip()`, then enumerate ZIP members without extracting. For every member calculate `len(raw)`, `sha256(raw)` and Git `sha1(b"blob " + ascii(len(raw)) + b"\\0" + raw)`. Construct directory tree objects from literal ZIP path components, every file mode `100644`, Git byte-ordered names (subdirectory sort key includes trailing slash), then compare its root SHA-1 with the frozen GitHub `unity/cc001-r16` tree SHA-1. Fetch the frozen manifest and independently hash the sorted `path\\tsize\\tsha256\\n` records. Compare exactly to `5e214d...`. If ZIP source, manifest, or branch HEAD differs, **invalidate PASS for the changed ref** and repeat the audit; do not automatically rewrite sources.

Commands/operations **actually performed in this A71 session**: Drive metadata + raw binary download; Python `zipfile.testzip()`, `hashlib.sha256`, raw blob/tree construction and path safety checks on downloaded bytes; GitHub read-only `fetch_file`, recursive `git/trees`, branch/commit comparison, workflow metadata and job logs; independent JS SHA-256 on manifest records (self-tested against SHA-256 of `abc`). No Unity CLI, `dotnet test`, Playwright, builds, gameplay test or physical device test was run by A71.

## 7. Disposition and handoff

- **DESIGNED:** source audit method and immutable reference SHA/manifest serialization: YES.
- **IMPLEMENTED:** independent audit and report on A71 branch: YES; no gameplay/source edits.
- **TESTED:** independent raw-source verification **PASS 639/639**, case/missing/extra/modes/ZIP/hash checks **PASS**.
- **INTEGRATED:** NO, not merged into A70/HQ/main; A70 source import itself remains branch-local.
- **RELEASED:** NO, no public build or website change.
- **BLOCKERS for source provenance:** NONE at frozen A70 SHA. **Remaining release gates:** A60 independent QA, A72 toolchain/runtime reproduction, HQ-controlled downstream integration and device/network validation.

**HANDOFF TO A70 + 00/HQ + A60:** accept `unity/cc001-r16` at frozen `de1fe4b...` as **byte-identical to the downloaded canonical R16 ZIP**, limited to this exact source commit. Preserve imported Git objects and V148 reference. Do not translate this SOURCE INTEGRITY PASS into Unity compile, gameplay, network or release certification. Any subsequent source mutation requires its own diff, hash/manifest refresh and independent QA.
