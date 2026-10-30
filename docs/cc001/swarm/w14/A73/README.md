# CC-001 — A73 / R17-W14: Git relationship gate

**Scope:** A73 Git Integration. Draft-only implementation on PR #237. This is a standalone Git relationship/collision audit, complementary to the W13 A41+A83 blob-pair preview. It creates no merge, commit, branch, CI workflow, Windows build or release.

## Exact frozen QA identity
- `integration/cc001-r17-w11-qa-freeze-20261030` = `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3`.
- Never use moving development PR #207 or W13 #239 as substitute frozen source.
- Owner decisions: Mitosis exactly V148, Furnace FIRE zone with periodic DoT only, HP R16.

## Real GitHub findings at evidence capture (2026-10-30)
1. **A41 stack #241 -> #250 is not linear at current owner heads.** #241 `a4f1bcdef958dcbc5e00700010002e5c249ebde2`, #250 `d4875397d99ffd99a704865d61db212c59d8ced9`. GitHub compare **diverged: ahead=2, behind=1**, common ancestor `8583505823a42994d6be9533d234bb933e4f32c6`. #250 does **not** contain the later #241 commit. Two overlapping files: `scripts/cc001/w13/a41/analyze-host-traffic.cjs` and `.test.cjs`. A41 owner must reconcile/test the latest combined semantics in its own branch, then update exact SHA; do not stack stale child.
2. **A83 #229 vs A20 #246 are independent and touch common W11-derived paths.** A83 `cce672566b57e22402ba6793e038b076c178f3aa` and A20 `ad710ad4d3cd97fc4f92bae5527f164c4e302f62` have common merge base exact frozen W11; both changed `Assets/CoreClash/Presentation/BallSelection.cs` and `Tests/PresentationTests.cs`. Content/semantic co-review needed; an overlapping path is a **review collision**, not proof of an actual textual merge conflict. Preserve A83 local selection/launcher identity **and** A20 stale notice expiry.
3. A73 W13 own #237 A41 W12 #228 plus A83 #229 has an earlier *disjoint* 11-path, source-only unreferenced tree. It is **not** authority to ingest newer A41 #241/#250 or A20 #246. Do not reuse old snapshot to claim W14 source integration.

## Tool
- `audit-relations.cjs`: actual local Git ref/SHA lock, immutable W11 freeze check, exact descendant check, two-branch merge-base test, `--no-renames` NUL-safe path diff, overlap review and fail-closed verdict.
- `relations-pins.json`: exact verified upstream/child and independent owner SHAs; immutable evidence snapshot, must be refreshed after any owner branch change.
- `audit-relations.test.cjs`: 13 actually run Node 22.16.0 + Git 2.47.3 ephemeral-Git tests: fork, stale SHA, overlapping paths, independent disjoint path, ancestry, CLI exit1/2 and unchanged refs. Exact local tested Git blobs checked against GitHub after commit.

Use an authorized **complete local clone** with all four owner branches and frozen QA ref fetched, without changing branch refs:
```sh
node --check docs/cc001/swarm/w14/A73/audit-relations.cjs
node --check docs/cc001/swarm/w14/A73/audit-relations.test.cjs
node --test docs/cc001/swarm/w14/A73/audit-relations.test.cjs
node docs/cc001/swarm/w14/A73/audit-relations.cjs --manifest docs/cc001/swarm/w14/A73/relations-pins.json
```
Exit 0 = `SOURCE_RELATIONS_ONLY`, exit 1 = `HOLD` (collision/drift), exit 2 = tool/input error. **A passing source-only fixture is not a passing player or gameplay test.**

## Limitations / gates
The complete private repository is not available to this executor for real local `git merge-tree`, so the full-repo CLI was **NOT_RUN**. Actual GitHub compare evidence supports the two HOLD findings, but there is no C# compilation, Unity 6000.4.0f1 Windows Player build, .NET9 native test or physical PC1↔PC2 QA evidence from A73. A72 Windows kit and A60/A31 remain responsible for those. No G3/G4 PASS, merge into main, release or QA freeze movement is allowed. A70 selects any later integration only after independent acceptance.

**Five-axis status:** DESIGNED YES / IMPLEMENTED YES (A73 isolated Git gate) / TESTED 13 Git fixtures PASS + GitHub source comparisons; full real repo CLI NOT_RUN / INTEGRATED NO / RELEASED NO.
