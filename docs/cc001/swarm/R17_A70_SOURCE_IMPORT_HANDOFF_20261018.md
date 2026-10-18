# CC-001 — R17 A70 EXACT R16 UNITY SOURCE IMPORT — HANDOFF

**Date:** 2026-10-18  
**Project:** CC-001 / Core Clash  
**Agent:** A70 — Integration / Release  
**Issue:** #90  
**Branch:** `feat/cc001-r17-a70-source-import`  
**Status:** **SOURCE IMPORT IMPLEMENTED AND INTEGRITY TESTED — READY FOR HQ/A60 REVIEW**  
**Primary source-import commit:** `9a3b12a17d15aa10a260f494c7c407597fe9cce5`  
**No merge / public deployment / gameplay modification performed.**

## Canonical upstream

- Google Drive file: `CoreClash-V149-R16-Source-Candidate.zip`
- Drive ID: `1IhtpEBrC-AJyzLTd8elE6lWionI0_bkZ`
- Canonical archive SHA-256: `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4`
- Archive size: **17,690,458 bytes**
- ZIP entries: **639 files**
- Verified ZIP integrity: **PASS**, no bad entries.
- Source comparison: R16 intake audit, R16 report/QA, HANDOFF_R16_README.md, and R16 Drive SHA256SUMS.

## Exact imported source tree

**Git root:** `unity/cc001-r16/`  
**Unity project root:** `unity/cc001-r16/CoreClash-V149-Unity/`  
**Source manifest:** `docs/cc001/swarm/R17_A70_SOURCE_MANIFEST.json`

- Imported files: **639/639**
- Unity `.meta`: **88/88 preserved**
- Generated Library/Temp/obj/Logs/Builds: **none found / none added**
- `Assets/CoreClash`: present
- `Assets/Resources/Data`: present
- `Tests`: present
- `Packages/manifest.json`, `Packages/packages-lock.json`: present
- `ProjectSettings/ProjectVersion.txt`: present — Unity **6000.4.0f1**
- `Reference/V148_reference_original.html` imported only under the new isolated `unity/cc001-r16/` prefix; existing protected V148 files elsewhere untouched.
- Zip root readmes/manifests and R16 Evidence retained unchanged.

## Independent byte-exact Git verification

Source files were committed using `git hash-object -w --no-filters` and explicit `git update-index --cacheinfo` to avoid newline normalization of pre-existing R16 source. No formatting or source-byte repairs were applied.

Rebuilt locally from all 639 canonical archive files, the raw Git tree SHA was:

`1dd04ea8bd44d1b54777ed1ca5e5c47a3057d0e6`

GitHub tree SHA at `unity/cc001-r16`:

`1dd04ea8bd44d1b54777ed1ca5e5c47a3057d0e6`

**Exact 639-file source tree: MATCH.**

The imported manifest includes the original SHA-256 and byte size for every file.

## Actual executed checks

| Check | Executed | Result |
|---|---|---|
| Raw downloaded ZIP SHA256 / expected bytes | A70 local | PASS |
| ZIP `testzip`, entries and safe paths | A70 local | PASS — 639/639 |
| Local source extraction | A70 local | PASS |
| `node Tools/verify-data.cjs` | A70 local | PASS — 227 records, 224 specials, 12 archetypes, 36 canonical + 4 provisional decks |
| Reconstruct exact R16 ZIP in GitHub Actions | R17 workflow | PASS |
| Verify canonical archive SHA in GitHub Actions | R17 workflow | PASS |
| Validate Unity project data in GitHub Actions | R17 workflow | PASS |
| Stage exact raw source Git objects / commit / push | R17 workflow | PASS |
| Independent 639-file Git tree compare | A70 local vs GitHub | PASS |
| Top-level changed-subtree audit | GitHub R17 import commit | PASS — only `docs`, new `unity` |
| New independent Unity Editor compilation in R17 | Not run | NOT TESTED |
| Physical Android/tablet or separate-network crossplay | Not run | NOT TESTED |

**Successful GitHub Actions run:** https://github.com/C8LyNn/aplikacja-turnieje/actions/runs/39125498352

Historical R16 QA reported 269/269 managed tests, 13/13 codec, 5/5 HTML and Windows/WebGL/Android build successes; these were **not rerun** by A70 in R17.

## Import-only corrective execution

Initial workflow run failed at `git diff --cached --check` because immutable R16 evidence/HTML contains historical trailing whitespace. Core source extraction and `verify-data.cjs` had already passed. To avoid editing certified bytes, A70 corrected **only the staging workflow** to write unfiltered Git blobs for all source files and perform whitespace checks only on the new manifest. The subsequent workflow passed.

- Staging commit: `0122b021f8dc5cb0166e74f6c75e7e250ef61f71`
- Workflow correction: `d2b544b1dda678f2248af2d4b447361daa6326a3`
- Retry trigger: `93586384d2257d1732d1ab0cf33abcff9e64bab0`
- **Successful source-import commit:** `9a3b12a17d15aa10a260f494c7c407597fe9cce5`

Temporary transfer chunks were removed from the final branch tree after success. They remain reachable through staging Git history; this is documented packaging history and does not affect the imported 639-file source tree.

## Status vocabulary

- **DESIGNED:** import path and integrity gate defined.
- **IMPLEMENTED:** 639 canonical source files imported, no gameplay edits.
- **TESTED:** archive/hash/structure/data checks PASS; Unity compilation in R17 NOT TESTED.
- **INTEGRATED:** YES, on **A70 source-import branch only**; not merged to HQ/main.
- **RELEASED:** NO. No web/public deployment.
- **UNITY_READY claim:** no new promotions by A70.

## Dependencies / restrictions

R17 coding branches that require the editable complete Unity source should base/rebase on the verified A70 import commit or its descendant, under HQ merge coordination. The Unity project is at `unity/cc001-r16/CoreClash-V149-Unity`.

Preserve the R16 source manifest and exact imported commit. Existing V148 reference remains immutable. A60 must independently review reproducibility and code work; A70 does not certify physical devices or network crossplay.

## Handoff to HQ

**PROJECT:** CC-001  
**TASK:** R17 — V149 Unity swarm continuation  
**SUBTASK:** Issue #90 — A70 source import  
**AGENT:** 70 — Integration / Release  
**STATUS:** **COMPLETE — SOURCE IMPORT GATE PASS / READY FOR HQ AND A60 REVIEW**  
**BASE:** V149 Unity R16, ZIP SHA `b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4`  
**BRANCH:** `feat/cc001-r17-a70-source-import`  
**SOURCE COMMIT:** `9a3b12a17d15aa10a260f494c7c407597fe9cce5`  
**IMPORTED FILES:** 639  
**EXACT GIT SOURCE TREE SHA:** `1dd04ea8bd44d1b54777ed1ca5e5c47a3057d0e6`  
**TESTS:** ZIP integrity PASS; Node verify-data PASS locally and in GitHub Actions; exact Git tree PASS  
**LIMITATIONS:** R17 Unity compile/physical-device/network tests not executed by A70; historical R16 QA not recertified.  
**NO GAMEPLAY CHANGES:** YES  
**V148 PROTECTED:** YES  
**PUBLIC DEPLOY:** NO  
**NEXT STEP:** HQ confirms intake; A60 reviews; dependent Unity agents rebase on verified source-import baseline and run their assigned tests. Do not merge to production/public website under this task.
