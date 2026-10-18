# CC-001 / R17 — A72 Build and Managed QA Readiness

**Date:** 2026-10-18  
**Agent / tracker:** A72 — Build & CI / Issue #113  
**Mode:** bounded toolchain preflight; no source, CI workflow, Unity, V148, WebGL website, merge or deployment changes  
**Frozen A70 source commit:** de1fe4b88fce3bd08ef383165dc2cd622af2536b  
**Initial A70 source import commit:** 9a3b12a17d15aa10a260f494c7c407597fe9cce5  
**A70 imported tree SHA (reported; not independently certified by A72):** 1dd04ea8bd44d1b54777ed1ca5e5c47a3057d0e6  
**R16 Unity root:** unity/cc001-r16/CoreClash-V149-Unity  
**Own branch:** feat/cc001-r17-a72-build-readiness  
**Machine-readable evidence:** docs/cc001/swarm/a70-support/A72/R17_A72_READINESS.json  
**Read-only script:** scripts/cc001/a72/read-only-preflight.cjs

## 1. Disposition and result vocabulary

**READINESS: STATIC PREFLIGHT PASS / MANAGED AND UNITY RE-EXECUTION NOT VERIFIED.**

The A72 inspection fetched 11 exact file blobs from the frozen GitHub commit and performed 32 successful in-memory checks. This is a **static, scoped verification**; it is not an execution of the imported project with Node or a re-run of managed/Unity/browser tests. The source commit was not materialized as a complete disposable checkout in this environment (outbound git remote DNS failed). The original 639/639 source manifest and Unity metadata fidelity require the independent A71 review.

The checked-out project must be treated as immutable input. Fresh tests MUST execute in a **disposable Git worktree or full copy** with clean outputs; reporting old Evidence/R16 as a new run is prohibited.

## 2. Exact source interfaces inspected

Read from frozen commit de1fe4b88fce3bd08ef383165dc2cd622af2536b:

- Tools/r16-qa.cjs — serial data, managed and codec stages with per-run logs. **Critical:** even though it creates an isolated source copy, it writes new qa-results.json, latest.json and logs into the *calling project's* Evidence/R16/Managed. Do not run this script on the protected imported project.
- Tools/verify-data.cjs — read-only assertions on 227 catalog balls, 224 visible specials, 12 archetypes, 36 canonical / four provisional decks, stock integers, runtime HP/radii, ability events and V148 reference SHA256.
- Tools/network-codec-test.cjs — creates Tests/obj scratch and Evidence/network-codec-tests.json; invokes .NET 9. Its 13 codec tests cannot run without dotnet.
- Tools/r16-report.cjs — generates/replaces Evidence/R16/ability-support.json and qa-summary.json and docs/R16_QA_PL.md. **Do not execute on protected imported source.**
- Tools/r16-build-smoke.ps1 — builds Windows; requires a visible native game window, validates three distinct capture hashes and full-match smoke; -All additionally triggers WebGL and Android.
- Tools/build.ps1 — default Windows Unity executable path C:/Program Files/Unity/Hub/Editor/6000.4.0f1/Editor/Unity.exe; target enum Windows/WebGL/Android; writes Logs and build artifacts.
- Assets/CoreClash/Editor/BuildTools.cs — invokes SetupAndSmoke; mutates Unity scene, PlayerSettings and Evidence/R16/Unity, then builds Windows/WebGL/Android. Native builds MUST be in a disposable Unity project directory.
- Tests/CoreClash.Tests.csproj and Tests/Program.cs — standalone console executable targeting net9.0, intentionally compiles selected CoreClash source without NGO-specific Unity C#; writes Evidence/unity-tests.json and Evidence/ability-support.json into passed project root.
- Tests/web-release-test.cjs and Tools/web-release.cjs — loopback HTTP WebGL hosting verifier, writes Evidence/r7-web-deploy-tests.json. It validates HTTP status, MIME, bytes/hash, redirects, SPA fallback and cache warnings; it is NOT a deployed-game test.
- Assets/Resources/Data/catalog.json and featured-decks.json; Packages/manifest.json, packages-lock.json; ProjectSettings/ProjectVersion.txt; NuGet.Config.
- Historical docs/R16_QA_PL.md, Evidence/R16/qa-summary.json, Evidence/R16/Managed/latest.json and three Evidence/R16/Unity/build-*.json were read, not executed. Source records Unity 6000.4.0f1, NGO 2.13.3, Unity Services Multiplayer 2.2.4 and Transport 2.6.0.

**Important portability risk:** catalog.json declares an absolute developer-local Windows sourcePath for V148. verify-data.cjs first uses that absolute path if it happens to exist and otherwise falls back to the imported Reference/V148_reference_original.html. The new read-only A72 preflight hashes **only the canonical sibling Reference** to eliminate this machine-dependent selection. A72 did not independently hash the 1.46 MB reference in this run.

## 3. Checks actually executed in this support wave

| Check | Status / actual result | What it proves |
| --- | --- | --- |
| GitHub frozen-ref 11-file access | PASS 11/11 | Files could be fetched at the frozen SHA; Git blob SHA1 recorded in JSON |
| JavaScript source parse using V8 dynamic compilation | PASS 6/6 | Six actual CJS source contents were syntactically parsable in V8; not executed as Node modules |
| Imported JSON/contract assertions and tool risk predicates | PASS 15/15 | Catalog counts/references, HP/radius, stock/ability contracts, Unity version, direct manifest-lock agreement and runner hazards |
| Total in-memory checks | **PASS 32 / FAIL 0** | Read-only static subset ONLY |
| Local Node availability | exit 0, v22.16.0 | Suitable Node major version available |
| A72 read-only script: Node syntax check | exit 0 | Candidate script syntax valid in Node 22; SHA256 of local script: 0579eb345e157aea2c3e083a333939c8ef896cc9346479717ec317410f4d7630 |
| A72 read-only script: deliberately missing fixture | exit 1 (expected) | Fail-closed negative control: six absence-related checks passed, 23 failed; failed fixture cannot be green |
| .NET version probe | exit 127 | dotnet executable not installed |
| PowerShell version probe | exit 127 | pwsh executable not installed |
| Unity binary lookup | exit 1 | Unity editor executable not present |
| Git remote checkout attempt | exit 128 | GitHub DNS unavailable from the local shell; no full disposable source checkout |
| Original Tools/verify-data.cjs at new checkout | **NOT RUN** | Project not locally materialized; no claim of full Node verifier PASS |
| .NET managed 269 and codec 13 | **NOT RUN** | Missing .NET 9 and checkout |
| Browser source HTML 5 and hosting verifier | **NOT RUN** | Missing Windows-pinned Playwright/Edge prerequisites and checkout |
| Unity editor compile, Windows, WebGL and Android builds | **NOT RUN** | Missing Unity Editor/modules/Windows host |
| Native player smoke and real device crossplay | **NOT RUN** | Missing Windows player, graphical host, devices and network topology |

The in-memory checks do not have shell exit codes because they ran inside the connected GitHub-read isolation. Their exact result names, verdicts and per-file Git blob identities are committed in R17_A72_READINESS.json. The environment probe log SHA256 is ca8faafc584844bb0084f6dedff4dc1891e939616db67dd16a26a80bbc947c45; negative fixture JSON log SHA256 is 60e852164cc399da1cd5e899e493e986acaee23200a9ad71f186b977ae66cec5. These local log hashes identify the A72 run, not R16 runtime certification.

**Historical R16 evidence, never described as freshly executed:** 269 managed C# passes, codec 13/13, original HTML 5/5, successful Windows/WebGL/Android builds (each historical build JSON shows errors=0, warnings=1); R16 browser emulation 82 checks/94 captures; Windows↔WebGL loopback and Relay single-PC tests. Historical reports explicitly exclude independent physical Android/iOS/tablet, WAN cross-NAT and production website. GitHub Actions run 39125498352 validated A70 source transfer/data, not a fresh independent Unity compile.

## 4. Safe, staged reproducibility pipeline for A60

Run on a capable developer/QA host, never on the protected source-import working tree. In the example below, **the A72 branch is chosen only to include the new read-only script**; it descends from the frozen A70 source commit. Before each new run pin the exact tested head SHA and verify that the imported 639 files are unchanged; do not let a moving branch silently redefine the source baseline.

**Stage S0 — isolated worktree and source scope (Git + Node 22; no paid tooling):**

    git fetch origin feat/cc001-r17-a72-build-readiness
    git cat-file -t de1fe4b88fce3bd08ef383165dc2cd622af2536b
    git worktree add --detach C:/Temp/cc001-r17-a72-qa origin/feat/cc001-r17-a72-build-readiness
    cd C:/Temp/cc001-r17-a72-qa
    git diff --exit-code de1fe4b88fce3bd08ef383165dc2cd622af2536b HEAD -- unity/cc001-r16
    node scripts/cc001/a72/read-only-preflight.cjs
    cd unity/cc001-r16/CoreClash-V149-Unity
    node Tools/verify-data.cjs

Capture commands, UTC time, checked commit SHA, exit codes, Node version, stdout/stderr and SHA256 for the new logs. The preflight itself is read-only and emits JSON to stdout, without evidence writes. Its positive full-project result remains **unverified** until A60 executes it against the complete imported tree. Native verify-data checks exact reference bytes and is the next low-cost functional gate.

**Stage S1 — managed/codec (require .NET SDK 9, Node 22 and a writable disposable copy):**

    dotnet --info
    dotnet run --configuration Release --project Tests/CoreClash.Tests.csproj -- .
    node Tools/network-codec-test.cjs

Execute from the disposable project root; tests write into its Evidence and Tests/obj. Require a **fresh** Evidence/unity-tests.json with failed=0, passed=269, generated after the test launch; check process exit 0 and compare the file content/hash from this run. Codec requires a fresh Evidence/network-codec-tests.json with 13 passes, exit 0. Do not infer PASS from a pre-existing JSON. Back up/log per-run outputs externally before deleting the disposable worktree.

An alternative complete orchestration is node Tools/r16-qa.cjs --output=C:/Temp/cc001-r17-runs but only when the **entire imported root itself is disposable**; the runner still mutates its calling project's Evidence/R16/Managed. Every stage must be independently checked PASS and results.json from the latest timestamped run must be consistent with exit 0. The runner's negative control must fail if dotnet is missing; stale historical reports must never override fresh failures.

**Stage S2 — HTML/codec/browser (Windows with configured Playwright dependency + Edge):**

    node Tools/r16-source-status.cjs

The script currently uses a hard-coded C:/Users/kubap/.cache/.../playwright require path and channel msedge, and overwrites Evidence/R16/source-runtime.json in the executing project; this is a portability blocker. Install or provide the exact compatible Playwright runtime and Edge, or gate a future separate code change to make the dependency configurable. Require fresh pass=5/5, unchanged canonical V148 hash, valid browser process and exit 0. The hosting verifier test can be run independently with node Tests/web-release-test.cjs in a disposable directory; it validates fixture-serving logic, not a newly built website.

**Stage S3 — Unity import/compile (Unity Hub Editor 6000.4.0f1; functioning license, package registry, project modules, writable disposable project):**

    & 'C:/Program Files/Unity/Hub/Editor/6000.4.0f1/Editor/Unity.exe' -batchmode -nographics -quit -projectPath 'C:/Temp/cc001-r17-a72-qa/unity/cc001-r16/CoreClash-V149-Unity' -executeMethod CoreClash.Editor.BuildTools.SetupAndSmoke -logFile 'C:/Temp/cc001-r17-unity-import.log'

Expect exit 0, CORE_CLASH_UNITY_SMOKE_PASS marker and no compile errors. SetupAndSmoke saves a scene and writes evidence: run ONLY in a disposable copy. An exit code alone is insufficient if import/logs are stale.

**Stage S4 — independent native builds (Windows PowerShell, Unity 6000.4.0f1, required Unity modules):**

    pwsh -File Tools/build.ps1 -Target Windows
    pwsh -File Tools/build.ps1 -Target WebGL
    pwsh -File Tools/build.ps1 -Target Android

Windows needs Windows Build Support; WebGL needs WebGL Build Support; Android needs Android Build Support including SDK/NDK/OpenJDK, ARM64 IL2CPP toolchain and a valid license. All targets need compatible packages. Collect freshly generated Evidence/R16/Unity/build-StandaloneWindows64.json, build-WebGL.json and build-Android.json, complete logs, exit codes, output paths, byte sizes and SHA256. Warn on any warning increase; do not hide the historical ServicesCore warning.

**Stage S5 — native gameplay smoke (Windows graphical session, working D3D11/native player):**

    pwsh -File Tools/r16-build-smoke.ps1

Runs a real visible player, requires three distinct captures plus hashes, R16 native report and full-match test. It also builds Windows first. Do not label a headless hidden black screenshot as rendered QA. Collect fresh player log and exact build hashes.

**Stage S6 — physical crossplay / topology (manual separate gate):** Windows↔Android physical hardware, phone/tablet UI, separate-network WAN and NAT/Relay scenarios, reconnect/jitter/long run, non-loopback host/client. No S0–S5 outcome can certify S6; physical-device gameplay acceptance remains with A60/HQ.

## 5. CI proposal — separate authorization required

**Not implemented/enabled here.** Proposed independent non-production GitHub workflow:

1. Trigger by explicit workflow_dispatch or scoped PR only; contents:read; no releases, publication, cloud credentials or Unity CI. Require HQ acceptance for workflow authoring. Pin actions and Node 22, checkout exact approved commit.
2. Assert no changed files under unity/cc001-r16 compared to frozen A70 SHA, check provenance from source manifest; run scripts/cc001/a72/read-only-preflight.cjs and node Tools/verify-data.cjs. Store fresh JSON/log/sha digests from this single run as short-lived CI artifacts.
3. In separate opt-in managed job with .NET 9 SDK, duplicate the checkout into runner temp and execute S1; require exit 0, regenerated output timestamps, 269/0 managed and 13/0 codec. Fail if any tool is missing. Do not copy historical Evidence into success decision without checking freshness.
4. Browser/Edge and Unity module jobs remain manual or explicit higher-cost approval gates. Do not silently trigger paid Unity compilation from a documentation PR.
5. Mark PASS only for checks executed on this run. Always distinguish build-time, runtime and cross-device evidence; require A71 exact-source confirmation and A60 QA acceptance before A70 integration planning.

## 6. Blockers, risks and handoff

| ID | Severity | Evidence / action |
| --- | --- | --- |
| B1 | BLOCKING FOR MANAGED | .NET 9 unavailable locally; execute S1 on Windows/CI with pinned SDK |
| B2 | BLOCKING FOR UNITY | Unity 6000.4.0f1 + platform modules/license missing; execute S3–S5 on licensed Windows builder |
| B3 | BLOCKING FOR RUNTIME QA | Full source not locally checkable because shell git DNS failed; GitHub frozen-ref static access worked; execute S0 on A60 machine |
| B4 | IMPORTANT | r16-qa.cjs writes outside its isolated copy into caller's Evidence/R16/Managed; never launch on immutable Git source |
| B5 | IMPORTANT | Hard-coded developer-only browser require path in r16-source-status.cjs; Windows Edge/Playwright prerequisite not portable as-is |
| B6 | IMPORTANT | verify-data.cjs may use developer-local absolute sourcePath when present; preflight script enforces canonical imported V148 hash |
| B7 | IMPORTANT | Unity BuildTools.SetupAndSmoke changes scenes/settings/evidence; disposable checkout mandatory |
| B8 | OPEN | Historical R16 PASS cannot substitute for new R17 managed, native, device or topology test evidence |

**HANDOFF A70 + 00/HQ + A60:** consume the A72 branch report and machine JSON, validate A71 manifest independently, then A60 should run **S0 first** in a disposable checkout. After PASS, continue to S1 and S2 only on supported hosts, then licensed Unity stages and separate physical-device QA. Until then the correct state is **STATIC PREFLIGHT PASS; MANAGED/UNITY NOT RE-EXECUTED; RELEASE NOT AUTHORIZED**.

**DESIGNED:** staged pipeline, negative-control and CI gate proposal.  
**IMPLEMENTED:** own read-only preflight JS, machine-readable findings, and this handoff report; no imported source edits.  
**TESTED:** 32 GitHub exact-ref static/in-memory checks, Node script syntax exit 0 and missing-fixture fail-closed exit 1; runtime stages not executed.  
**INTEGRATED:** own A72 documentation branch only; no HQ/main merge.  
**RELEASED:** NO.

Final branch commit and paths must be confirmed by GitHub readback before issue #113 completion comment.
