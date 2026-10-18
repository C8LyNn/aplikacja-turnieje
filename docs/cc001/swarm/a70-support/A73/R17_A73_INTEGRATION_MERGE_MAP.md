# CC-001 / R17 — A73 Git integration and dependent branch map

**Date:** 2026-10-18 (GitHub read snapshot; refs may move after observation)  
**Owner:** A73 — Git Integration  
**Wave:** A70-SUPPORT, Issue #114  
**Authority:** docs/cc001/swarm/R17_A70_SUPPORT_WAVE_20261018.md  
**Mode:** READ-ONLY ANALYSIS; this document is the only A73 repository change  
**Verdict:** **PLANNING READY / SOURCE-AND-RUNTIME QA GATED / NO MERGE**

## 1. Immutable coordinates and evidence distinctions

| Item | Verified value / interpretation |
| --- | --- |
| Repository | C8LyNn/aplikacja-turnieje |
| Canonical R16 ZIP SHA-256 | b3dc332beb15edea034234c70e7ba1f4c1034d4e618646ae7d703e80f1fcc6a4 (from canonical dispatch and checked-in manifest, NOT rehashed by A73) |
| R16 ZIP archive | 17,690,458 bytes, 639 entries, 88 Unity .meta (manifest metadata, not A73 byte-level recheck) |
| A70 source-import commit | 9a3b12a17d15aa10a260f494c7c407597fe9cce5 |
| Frozen A70 HANDOFF/BASE HEAD | de1fe4b88fce3bd08ef383165dc2cd622af2536b |
| A70 branch | feat/cc001-r17-a70-source-import |
| A70 manifest blob SHA-1 | 99cf0b5666f9cd6648943e9b54342e6546c5d3b1 |
| Imported tree path | unity/cc001-r16/ |
| Reported canonical imported subtree Git SHA-1 | 1dd04ea8bd44d1b54777ed1ca5e5c47a3057d0e6 (A70 evidence; independent 639-byte verification belongs to A71) |
| Unity editable project | unity/cc001-r16/CoreClash-V149-Unity/ |
| Legacy common ancestor of A70 and W1/HQ | d1caeb49faaf9a4f2a892e205190705859b367b4 |
| Current HQ HEAD observed | f35145085127bdbb878e8ffdcf38705be8348e45 |
| Current A73 branch at pre-write | 7bb38587edb75169b4f69575da2f499c6e51fda1, direct descendant of frozen A70 HEAD by one coordination-document commit |

**Identity warning:** SHA-256 of ZIP/member bytes, Git blob SHA-1, Git tree SHA-1 and Git commit SHA-1 are different objects. The source commit remains 9a3b12a... even after subsequent A70 handoff/coordination commits. Do not claim A73 independently proved all 639 file contents; A71 owns that audit.

Read sources: A70 HANDOFF at de1fe4b..., A70 source manifest, R17 Master Dispatch, R17-W2 dispatch, Issue #90/#92/#96/#97/#114, PR #98, W1 A10/A20/A41/A50/A51/A60 reports and available W2 A10/A41/A60 outputs. Metadata and compare results obtained with authenticated GitHub read actions.

## 2. Exact ref ledger (observed; revalidate before any future operation)

All full commit hashes below were fetched from GitHub refs; "A70 relation" is GitHub compare commits from frozen de1fe4b... to branch HEAD, not a local test.

| Role/ref suffix (full prefix feat/cc001-) | Exact HEAD SHA | A70 relation (ahead/behind) | Category / action |
| --- | --- | --- | --- |
| r17-a70-source-import | de1fe4b88fce3bd08ef383165dc2cd622af2536b | identical | Frozen imported-source anchor; keep unchanged |
| unity-swarm-20261018 [HQ] | f35145085127bdbb878e8ffdcf38705be8348e45 | diverged (3/5) | HQ documentation; reconcile non-destructively |
| r17-a10-lifecycle-return-contract | bc6820b1f32b4b48d26c9359567433ff26ca7ef1 | diverged (1/5) | W1 design-only; open PR #98 |
| r17-a20-mobile-ux | aaf89e6c095fe3be408f0d31ace8ecd2a25ad0ea | diverged (1/5) | W1 UX source review; no runtime edits |
| r17-a31-network-crossplay [A41 support] | a914d4c5102c726f4dc7686c9316126dd9e4258e | diverged (1/5) | W1 A41 authority report; A31 runtime remains separate |
| r17-a40-lifecycle-return-impl | d1caeb49faaf9a4f2a892e205190705859b367b4 | behind (0/5) | HOLD; no imported source, no delivered R17 code |
| r17-a50-partial-acceptance [includes A51] | 2f4fb224ad19f03ab05a03d642ab4dbfeaaa080c | diverged (4/5) | W1 A50/A51 shared branch; integrate once |
| r17-a60-independent-qa | 28d4e60c37e2a6bbf0a85ec854440fdb29053f38 | diverged (1/5) | W1 independent audit; HOLD |
| r17-a00-integration | d1caeb49faaf9a4f2a892e205190705859b367b4 | behind (0/5) | HQ candidate not assembled |
| r17-w2-a10-semantics | 9ae525297fc9b257d61da772efb196157b145c0b | diverged (4/5) | W2 design; one original document beyond HQ |
| r17-w2-a20-landscape-contract | f35145085127bdbb878e8ffdcf38705be8348e45 | diverged (3/5) | W2 branch exists but ZERO owned commits at snapshot |
| r17-w2-a41-reconnect-design | e98bc9e7708fdf2cfb814fe0efdcf27dbbbc7f5f | diverged (4/5) | W2 network/security design, not code |
| r17-w2-a50-parity-oracles | f35145085127bdbb878e8ffdcf38705be8348e45 | diverged (3/5) | W2 branch exists but ZERO owned commits at snapshot |
| r17-w2-a51-snapshot-fixtures | f35145085127bdbb878e8ffdcf38705be8348e45 | diverged (3/5) | W2 branch exists but ZERO owned commits at snapshot |
| r17-w2-a60-wave1-qa | ae3199b4fe840833ed1221e41b46bf01d0da180f | diverged (4/5) | W2 independent W1 reconciliation; HOLD gates |
| r17-a70-parallel-support-20261018 | 7bb38587edb75169b4f69575da2f499c6e51fda1 | ahead (1/0) | Coordination dispatch, descendant of A70 HEAD |
| r17-a71-source-integrity | 7bb38587edb75169b4f69575da2f499c6e51fda1 | ahead (1/0) | Separate A71 audit path; do not consume new output |
| r17-a72-build-readiness | 7bb38587edb75169b4f69575da2f499c6e51fda1 | ahead (1/0) | Separate A72 QA path; do not consume new output |
| r17-a73-merge-map (pre-write) | 7bb38587edb75169b4f69575da2f499c6e51fda1 | ahead (1/0) | Exclusive owner of this report |
| r17-a74-repo-hygiene | 7bb38587edb75169b4f69575da2f499c6e51fda1 | ahead (1/0) | Separate A74 storage audit |

**Compare semantics:** For example, GitHub compare A70 -> HQ returned status=diverged, ahead_by=3, behind_by=5 and merge_base=d1caeb49faaf9a4f2a892e205190705859b367b4. For A70 -> A50/A51 it returned ahead_by=4, behind_by=5, same merge-base. W2 A10/A41/A60 are directly one commit ahead of the HQ HEAD when separately compared HQ -> W2. The W2 A20/A50/A51 branch refs equal HQ HEAD; branch creation itself is not evidence of completed work.

**PR #98 detail:** open, merged=false, draft=false; head bc6820b1f32b4b48d26c9359567433ff26ca7ef1, one added documentation file, original PR base feat/cc001-unity-swarm-20261018; PR-reported base SHA 9aa10a9eb0fe2ca04172eedafc57e87f5615492d2 predates observed HQ HEAD f351450...; do not confuse the PR's stored mergeability metadata with a post-import integration test. No PR retargeting performed.

## 3. Path-level integration / conflict matrix

**Comparison method:** For each branch, compare frozen A70 HEAD against that head and inspect returned file paths. For the import side, compare old common ancestor -> A70; GitHub REST compare returned only its first 300 changed-file entries for the much larger import, so DO NOT treat that list as exhaustive. A70 manifest records 639 files. The conflict verdict here is scoped to observed path families and independently read report paths; it is not a completed Git merge test.

| Source / branch | Exact observed changed-path scope or owned path | Versus A70 source | Versus HQ / W1 / W2 | Integration warning |
| --- | --- | --- | --- | --- |
| A70 import | unity/cc001-r16/**; docs/cc001/swarm/R17_A70_SOURCE_MANIFEST.json; docs/cc001/swarm/R17_A70_SOURCE_IMPORT_HANDOFF_20261018.md; source-import helper/workflow history | Owns canonical bytes | No identical paths seen in current W1/W2/HQ report sets | Preserve manifest, 9a3b commit and .meta; avoid staging transfer chunks anew |
| HQ branch | docs/cc001/swarm/R17_SWARM_DISPATCH_20261018.md; R17_THREAD_START_PROMPTS.md; R17_W2_PARALLEL_PREIMPORT_DISPATCH_20261018.md | Path-disjoint as observed | W2 branches already inherit all 3 HQ docs | Merge HQ history ONCE; avoid duplicate cherry-picks |
| A10 W1 | docs/cc001/swarm/R17_A10_LIFECYCLE_RETURN_SEMANTIC_CONTRACT_20261018.md | Independent design doc | Unique path vs HQ and other W1 | Gate A40 code on HQ acceptance; PR #98 stays open until HQ action |
| A20 W1 | docs/cc001/swarm/R17_A20_MOBILE_UX_READINESS_001.md | Independent review | Unique | Physical QA remains absent |
| A41 W1 | docs/cc001/swarm/agent-reports/A41/R17_NETWORK_AUTHORITY_CROSSPLAY_SUPPORT_20261018.md | Independent network doc | Unique | A31 code/crossplay not delivered by this A41 report |
| A50 + A51 W1 | docs/cc001/swarm/agent-reports/A50/R17_A50_PARTIAL_ACCEPTANCE_REVIEW_001.md; docs/cc001/swarm/a51/R17_A51_PARTIAL_FIXTURE_SUPPORT_001.md; docs/cc001/swarm/a51/R17_A51_PARTIAL_FIXTURE_MATRIX_001.json; scripts/cc001/r17-a51-static-preflight.cjs | Independent docs + static script | Unique paths; SAME BRANCH/ANCESTRY | Merge A50 HEAD ONCE; do not independently cherry-pick A51 commits and then replay A50 branch |
| A60 W1 | docs/cc001/swarm/R17_A60_INDEPENDENT_QA_GATE_001.md | Independent QA doc | Unique | Gate status still HOLD |
| W2 A10 | docs/cc001/swarm/w2/A10/R17_W2_A10_MITOSIS_FURNACE_DECISIONS.md | Independent document | One additional file over HQ docs | Merge committed leaf once, not inherited HQ docs again |
| W2 A41 | docs/cc001/swarm/w2/A41/R17_W2_A41_RECONNECT_AUTH_DECISION.md | Independent document | One additional file over HQ docs | No implemented network change |
| W2 A60 | docs/cc001/swarm/w2/A60/R17_W2_A60_WAVE1_INDEPENDENT_REVIEW.md | Independent document | One additional file over HQ docs | No post-import runtime sign-off |
| W2 A20/A50/A51 | ZERO own changed files relative to HQ at snapshot | No competing source edits | Pending work | Recheck HEAD/Issue before inclusion; do not mark delivered |
| A71–A74 support | docs/cc001/swarm/a70-support/A71/, A72/, A73/, A74/ respectively | Must be report-only (A72 optional scripts/cc001/a72/) | Path isolated by dispatch | Audit outputs can be consumed independently; do not wait for cross-agent reports |

**Observed direct path collisions:** NONE between the specified W1/W2/HQ changed files and canonical Unity source prefix; NONE between listed report leaf files. This is a *potential path-conflict assessment*, not an executed merge, compile or proof against future concurrent changes. Shared semantic concepts still need HQ review (A10/A40 lifecycle, A50/A51 acceptance, A41/A31 authority and A20 UX).

**Additional historical caution:** A70's earlier transfer chunks are reachable in source-import Git history although no longer in its final branch tree (A70 HANDOFF). Do not attempt source-import by cherry-picking only a staging/transfer commit, squashing away source provenance, rewriting history or force pushing. A74 separately owns storage/history assessment.

## 4. Proposed ONE safe integration sequence — FUTURE HQ ONLY

**No commands in this section were executed by A73.** Each mutating step requires a separate HQ authorization and an isolated integration candidate branch. It is a plan, not a request to modify protected refs in this wave.

1. **Freeze and recheck:** retrieve A70 source HEAD, HQ HEAD, relevant W1/W2 heads and PR #98 at integration time; compare against the exact ledger. Obtain A71 independent source integrity verdict, A72 reproducibility preflight and A60 independent gate (Issue #96). A70 branch-only source hash PASS does **not** constitute post-import Unity compilation, managed test rerun or physical-device test.
2. **Propose an HQ-owned disposable integration candidate derived from immutable de1fe4b...**, not a reset of the existing HQ branch. Reconcile the exact HQ f351450... documentation branch by a normal non-force merge into that candidate after non-mutating tree/merge-base preview. This preserves the real R16 source-import commit as an ancestor and all W2 dispatch documents as part of HQ history. Never overwrite the canonical imported files or amend the source-import commit.
3. **Integrate accepted W1 design/static evidence once:** A10 PR #98 semantic document after HQ semantic acceptance, then A20 W1, A41 W1, A50/A51 W1 via ONE inclusion of A50 head 2f4fb..., and A60 W1 gate report. With separate feature branches, keep the original commits in ancestry (normal merges); alternatively document any independently authorized cherry-pick policy and explicitly prevent duplicate A51 changes. These are document-level inclusions; they do not establish runtime integration.
4. **Integrate actually completed W2 report leaves** A10, A41, A60 once their heads/readbacks are verified. Do not include empty W2 A20/A50/A51 refs as successful deliveries. If those refs acquire new commits, rerun all ancestry and path comparisons. Include independently accepted A71/A72/A73/A74 support reports only as HQ documentation; their work remains parallel.
5. **Open separate R17 implementation branches only after gates**, based on the verified integrated imported source candidate or a later HQ-authorized code baseline. A40 can implement the FIVE approved lifecycle/RETURN abilities only when A10 semantic contract is accepted and source safety/independent QA gates allow coding. A50 must start with failing F01/F02 parity fixtures; A31 network/security and A20 responsive mobile changes need separate commits, review and evidence. No code change should ever rewrite the original R16 commit or manifest.
6. **Retest and promote via A60 + 00/HQ:** run managed/codec/Unity/native regression as environment permits; record Windows/WebGL/Android and real-device/network provenance honestly. Recompare modified paths against baseline; preserve protocol 149, protected V148, and website/public build isolation. A60 independently rules on promotion; HQ decides if a candidate is eligible for a later authorized release. This wave authorizes neither production merge nor deployment.

**HOLD gate:** If A71 flags byte/provenance integrity failure, A72 identifies unresolvable build preflight issues, A60 flags unsafe status inflation, PR #98 semantics are disputed, or future overlaps touch canonical source unexpectedly, stop candidate integration, retain branch refs and request a scoped HQ decision. Do not force push or solve by deleting history.

## 5. Exact reproducible Git inspection commands for HQ (NOT executed by A73)

Read-only local checkout/fetch prerequisite: standard Git CLI with permission to fetch this private repo. Execute these on a disposable clone, not an active V148 / deployed web working copy.

    git fetch --no-tags origin feat/cc001-r17-a70-source-import feat/cc001-unity-swarm-20261018
    git rev-parse origin/feat/cc001-r17-a70-source-import
    git rev-parse origin/feat/cc001-unity-swarm-20261018
    git cat-file -t de1fe4b88fce3bd08ef383165dc2cd622af2536b
    git cat-file -t 9a3b12a17d15aa10a260f494c7c407597fe9cce5
    git merge-base de1fe4b88fce3bd08ef383165dc2cd622af2536b f35145085127bdbb878e8ffdcf38705be8348e45
    git merge-base --is-ancestor 9a3b12a17d15aa10a260f494c7c407597fe9cce5 de1fe4b88fce3bd08ef383165dc2cd622af2536b
    git log --format="%H %P %s" --ancestry-path d1caeb49faaf9a4f2a892e205190705859b367b4..de1fe4b88fce3bd08ef383165dc2cd622af2536b
    git diff --name-status d1caeb49faaf9a4f2a892e205190705859b367b4 de1fe4b88fce3bd08ef383165dc2cd622af2536b
    git diff --name-status d1caeb49faaf9a4f2a892e205190705859b367b4 f35145085127bdbb878e8ffdcf38705be8348e45
    git ls-tree de1fe4b88fce3bd08ef383165dc2cd622af2536b unity/cc001-r16
    git merge-tree --write-tree de1fe4b88fce3bd08ef383165dc2cd622af2536b f35145085127bdbb878e8ffdcf38705be8348e45

The last command performs a **merge-tree preview with no branch/ref update**; it may create unreachable Git objects locally, and a nonzero exit must be investigated rather than ignored. Compare source files via a Git diff immediately after any future candidate assembly:

    git diff --exit-code de1fe4b88fce3bd08ef383165dc2cd622af2536b CANDIDATE_SHA -- unity/cc001-r16
    git diff --exit-code de1fe4b88fce3bd08ef383165dc2cd622af2536b CANDIDATE_SHA -- docs/cc001/swarm/R17_A70_SOURCE_MANIFEST.json
    git merge-base --is-ancestor 9a3b12a17d15aa10a260f494c7c407597fe9cce5 CANDIDATE_SHA

For **initial documentation-only** candidate assembly, all three invariants should hold. **After intentionally authorized R17 code changes**, the first diff is expected to become nonempty; review each changed source path against an approved feature scope and keep the original import commit/manifest unchanged. Always recompute merge bases at integration time; do not rely indefinitely on these frozen HEADs.

**Future mutating commands such as git merge --no-ff, branch creation, cherry-pick, PR retarget, rebase and push are explicitly NOT executed or authorized by this A73 report.** No command above was executed in a shell for this task; relationship evidence comes from GitHub API responses.

## 6. What can start, what remains gated

| Follow-up | Source import available? | Contract / QA status | Decision |
| --- | --- | --- | --- |
| HQ read-only integration planning | YES on A70 branch | This path map and branch reviews available | READY for HQ consideration |
| Documentation-only W1/W2 acceptance | Does not need editable source to draft | Review issue/PR and source semantics | Independently reviewable; no gameplay promotion |
| A40 lifecycle/RETURN C# implementation | YES as frozen imported branch, not HQ code base | A10 PR #98 still open; A71/A72/A60 gates pending | **HOLD until HQ source + A10 acceptance and explicit implementation authorization** |
| A50 F01/F02 parity repairs | Source present | 19 PARTIAL reviewed, ZERO promotions; future failing fixtures required | HOLD for test-first runtime work |
| A31 physical crossplay/reconnect | Source present | A41 W1/W2 design only; no real-device WAN certification | HOLD for runtime/device claims |
| A20 landscape UX implementation | Source present | Design/review only, physical Android/tablet unverified | HOLD for physical device certification |
| A60 R17 final candidate sign-off | Source only; not assembled candidate | W1 and W2 audits preserve HOLD | HOLD until independent managed/native/device evidence |
| Merge to main / published website/WebGL | Not in scope | Separate owner authorization absent | **PROHIBITED** |

## 7. Actual A73 checks, limitations and HANDOFF

**ACTUALLY PERFORMED (authenticated GitHub connector, read-only):**
- Read canonical A70 support dispatch and Issue #114.
- Fetched live ref HEADs of 20 named branches; compared frozen A70 HEAD with 11 representative heads using GitHub compare-commits (captured merge_base, ahead/behind, file paths); compared HQ with W2 A10/A41/A60 and HQ with PR #98; confirmed HQ=W2 A20 head, and A50 W1/A51 shared ancestry.
- Fetched PR #98 metadata (OPEN, not merged; one changed file), Issues #90/#92/#96/#97, A70 HANDOFF, manifest metadata and W1/W2 report contents.
- Confirmed assigned A73 path did not yet exist on own branch (GitHub contents API returned 404).
- Confirmed support coordination branch is one commit after A70 frozen source HEAD, changing only the common dispatch file.
- No detected source file edits made by this role.

**NOT PERFORMED:** no local Git CLI checkout/diff/merge-tree; no real Git merge or rebase; no independent 639-file byte-hash comparison; no Unity Editor/.NET/Node/native execution by A73; no CI rerun; no physical Windows/Android/WebGL networking/device QA. GitHub compare responses can truncate very large per-file lists at 300; keep scope limitations explicit. Branch HEADs can move at any moment.

**DESIGNED:** YES — exact branch ancestry ledger, path matrix, safe integration sequence and QA decision gates.  
**IMPLEMENTED:** YES — this isolated documentation deliverable only; **NO** gameplay/build/merge code.  
**TESTED:** YES — GitHub live-ref/compare/readback evidence only; **NO** runtime or local Git execution.  
**INTEGRATED:** NO — neither HQ nor main merged; this report lives solely on A73-owned branch.  
**RELEASED:** NO — no public web build or Unity deployment.

**BLOCKERS:** pending independent A71 source integrity, A72 managed/build preflight, A60 final source/runtime gates, A10 contract acceptance; W2 A20/A50/A51 empty at snapshot; HEAD movement risk.  
**HANDOFF:** 00/HQ (Issue #97) + A70 (Issue #90) + A60 (Issue #96). A73 recommends separate HQ-owned candidate assembly only after explicitly passing these gates. Original A70 source import is complete in its branch and must not be repeated.
