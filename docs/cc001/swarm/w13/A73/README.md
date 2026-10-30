# CC-001 — A73 / W13 Pairwise Git Integration Preview

**Role:** A73 Git Integration. **Purpose:** prepare two independent W12/W13 development branches for a later A70 integration decision without modifying any game source, QA-freeze branch, `main`, or protected RC1. This is NOT a Windows build or G3 approval.

## Pinned real owners and source inputs

**Frozen QA identity (read-only):**
`integration/cc001-r17-w11-qa-freeze-20261030` at `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`.

- **A41 draft [#228](https://github.com/C8LyNn/aplikacja-turnieje/pull/228)** at `72e57524ec4fe32e7a5e50141cc8204afb89c49f`: 3 changed paths, including NetworkGameSession.cs, NetworkSeatTests.cs and owner docs.
- **A83 draft [#229](https://github.com/C8LyNn/aplikacja-turnieje/pull/229)** at `69d20ca863aa7f195a9b0a506032025a477ba68b`: 3 changed paths, including BallSelection.cs, MatchView.cs and PresentationTests.cs.
- Both independently fetched GitHub `compare_commits` show `ahead=3 / behind=0` relative to QA-freeze, merge-base exact freeze. GitHub supplied **6/6 exact changed file blob SHA-1 IDs** pinned in `a41-a83-source-pins.json`. Changed-path sets have **0 overlaps**. This does *not* prove cross-feature correctness or runtime build compatibility.

## Real executable work

`verify-pair.cjs` checks **both** live refs against their exact pinned heads, immutable freeze ancestry, full changed-file name/status/regular-blob-mode/40-hex Git blob list, mandatory modified managed C# regression tests, and protected R16/V148/Protocol149/core/physics/catalog paths. No added Unity Assets C# may omit a paired added .meta file. Cross-agent same-file overlap is fail-closed, not automatically cherry-picked.

On matching and disjoint sources it invokes **Git `merge-tree --write-tree`** to construct an **unreferenced temporary Git tree object**. It then checks every changed author blob is present byte-for-byte in that preview tree. No branch refs, index, working tree or candidate commit are changed. A successful verdict is **`PASS_PAIRWISE_SOURCE_ONLY`**. It does NOT compile managed code, prove source semantics, change A70 integration refs or mark owner alternatives as selected.

In a complete, **disposable Git clone** with the frozen ref and both candidate author refs fetched:

```sh
node docs/cc001/swarm/w13/A73/verify-pair.test.cjs
node docs/cc001/swarm/w13/A73/verify-pair.cjs \
  --manifest docs/cc001/swarm/w13/A73/a41-a83-source-pins.json
```

Exit `0` = pairwise source-only PASS; `1` = explicit HOLD; `2` = incomplete Git checkout, invalid pin or missing source object, HOLD. Other W13 candidate pairs require a new reviewed exact SHA/allowlist manifest.

## Tests and gates

**Actually executed** on local Linux Node **v22.16.0**, Git **v2.47.3**: both source syntax checks exit0; real disposable multi-branch Git fixture **15/15 PASS exit0**, including positive two-branch `git merge-tree` with 4 original author blobs preserved; CLI success; ref drift; tampered blob; undeclared path; missing regression; overlapping author path; protected core change; off-freeze ancestry; executable mode; missing .meta; traversal; freeze drift; corrupt NUL diff; and preserved branch refs.

**NOT_RUN:** this CLI on actual `C8LyNn/aplikacja-turnieje` full Git checkout (runtime DNS `git ls-remote` returned exit128: GitHub host unavailable). No real A41+A83 pairwise Git merge-tree has been executed on the true repository objects; only GitHub remote ancestry/path/blob precheck was performed. Managed .NET9, Unity 6000.4.0f1, Windows Player and independent PC1–PC2 remain outside A73 scope.

**Statuses:** A41 #228 **ALT_HOLD**, A83 #229 **DEV_ONLY/HOLD**, A70 selection **NOT_GRANTED**. Freeze SHA immutable; W11 build/QA G3/G4 **HOLD** until A72 native Windows artifact and A60/A31 physical evidence. Final W13 integration after W11 QA only. V148 Mitosis, Furnace FIRE periodic damage and R16 HP unchanged.

## GitHub actual two-owner source tree union — source-only execution

Beyond the synthetic Git test, A73 independently read the **complete untruncated GitHub recursive trees** for the frozen W11 source, A41 #228 and A83 #229, confirming that **all non-author-changed files were byte-identical to freeze**. Then called GitHub's Git Data API `create_tree` with the EXACT frozen full base tree and all six pinned author Git blob SHA-1s (all regular `100644`), producing the **unreferenced Git tree object `8f2571b1c7860d81ee3df035c06327d9e0e313ef`**.

Independent full recursive readback of that resulting tree established **6/6 chosen changed leaf blobs match authors and 1753/1753 unchanged frozen source blobs are preserved**, original source-tree file count 1758 → preview 1759 (one new A41 documentation file), **0 other changes, 0 missing sources**. The exact original inputs and outcomes are stored in `github-tree-union-evidence.json`.

This is a **real GitHub Git tree content-union preview** using actual candidate blob objects, *not* a `git merge-tree` invocation on real A41/A83 commits and *not* a Git merge commit. It does not check C# compile, physics, network semantics or PC1–PC2; no ref was moved and no integration was performed. A70 must still decide selection after W11 native QA closure.
