# CC-001 / R17-W5 — A40 lifecycle/RETURN grave-cap correctness delta

**PROJECT:** CC-001 — Core Clash Unity  
**AGENT:** A40 — Gameplay Implementation; identity fixed by original thread assignment  
**ISSUE:** [#92](https://github.com/C8LyNn/aplikacja-turnieje/issues/92)  
**MODE:** R17-W5 — independent scoped continuation only; no automatic integration  
**GATE:** PARTIAL / HOLD pending .NET 9 + Unity executable validation and HQ/A60/A70 integration checks  
**FROZEN R16 BASE:** `de1fe4b88fce3bd08ef383165dc2cd622af2536b`  
**W4 DISPATCH:** `661660d3a3dc8a4fa2c9afea489050247f64c38c`  
**A40 W5 START BRANCH HEAD:** `3351036c9513e8849e82291108347699335205da`  
**W5 SOURCE/TEST HEAD BEFORE THIS REPORT:** `46980bff1e6074853fb18567c142a92088e3fb93`  
**OWN BRANCH:** `feat/cc001-r17-w4-a40-lifecycle-return`  
**REPORT COMMIT/FINAL HEAD:** see associated Issue #92 read-back; report Git commit cannot self-reference its SHA.

## 1. Exact authority and boundaries

Latest HQ [Issue #92 scope grant](https://github.com/C8LyNn/aplikacja-turnieje/issues/92#issuecomment-6254802189) assigns `GameSimulation.cs` exclusively to A40 for Phoenix `TryCommand`, source-justified `Kill` grave/cap semantics and A50 F02 replay. The W5 universal prompt allows completion of these previously authorized narrow modifications only. No authority to alter catalog, original V148, protocol 149, physics/ElementalEffects/ElementalTests (A50-owned), frozen source or candidate assembly (A70-owned).

A70 Stage1 candidate SHA `ab624c2789b6efda015e742e8bd9bcbb86766735` excludes both A40 and A50 W4 gameplay patches. This report does **not** claim integration of the new changes.

## 2. Newly verified V148 source-truth discrepancy / scoped repair

The byte-verified protected V148 HTML (1,465,149 bytes, SHA-256 `bbc48f8475544d9ef833b5ba76605544f1514418fac42b6bc5c5c5ef9ca4623e`) defines:
- `REVIVE_EXCLUDED_TYPES = {normal, phoenix, revenant, cascade, mirage, genesis, shard, broodling}`;
- `registerGraveyardDeath(ball)` returns immediately for that exclusion set;
- a per-owner grave history capped to 18 entries.

Existing R16 `GameSimulation.Kill` already rejects generated, revived, hidden and unique balls; that indirectly covers all protected exclusions **except `normal` and `cascade`**. These two non-unique visible types could enter the 18-slot bounded history and incorrectly evict eligible allies, altering Soul Anchor/other legal grave-target selection. `genesis` is already unique in imported R16 catalog, so no new Genesis guard is needed.

**Exact W5 fix:** add only `b.type!="normal"&&b.type!="cascade"` inside existing `GameSimulation.Kill` grave eligibility gate. Keep the cap, grave record format, DEATH emit order and `Abilities.OnDeath` invocation byte-identical. No global lifecycle ordering rewrite or type balancing. This directly addresses a source-proven grave-cap edge within the HQ-authorized `Kill` domain.

## 3. Test-first chronology / changed files

**W5 commit 1 — tests first:** `05dd14681c51b50f04c0573f0cb86591d03048e8`.

`unity/cc001-r16/CoreClash-V149-Unity/Tests/AbilityTests.cs`:
- correct the older authored Soul Anchor fixture to use `booster` (legal grave candidate) rather than V148-excluded `normal`, at all four test scenarios;
- add two W5 negative controls:
  1. normal/cascade/genesis never become ordinary grave candidates; legal Booster is selected by Soul Anchor instead;
  2. excluded deaths must not evict the oldest legal grave record from a full 18-entry history.

These test assertions are deliberately authored **before** source fix. They are not described as observed RED because no managed runner is available.

**W5 commit 2 — source after tests:** `46980bff1e6074853fb18567c142a92088e3fb93`.

`unity/cc001-r16/CoreClash-V149-Unity/Assets/CoreClash/Core/GameSimulation.cs`:
- only `Kill` changed with a comment and two excluded type comparisons;
- Phoenix ready hand and Earth-only replay corrections remain from A40 W4 R2 and were not altered in W5.

**W5 report:** `docs/cc001/swarm/w4/A40/R17_W5_A40_GRAVE_CAP_ELIGIBILITY_DELTA.md` (this file).

**Current A40 authored test count:** 22 registrations (20 W4 + 2 W5). None are compiled/executed in this environment. All catalog/deck/ability support data remain unchanged.

## 4. Actual static/available execution results

**Verified live GitHub from original A40 W5 START HEAD:**
- two commits ahead at source/test checkpoint; exactly two modified paths `GameSimulation.cs` (+7 changed lines) and `AbilityTests.cs` (+34 changed lines);
- readback source blob `25f5a18de4df3942626f0245c9b1be77eee73106`;
- readback test blob `62fd2ea17d0972bc67d4a356632c442250d69f07`;
- static source-presence checks 12/12 TRUE for exclusion, old guards, cap, event ordering, Phoenix replay, Earth-only F02 path, registered cases and allowed test fixtures;
- lightweight lexical structural-balance check of `GameSimulation.cs`, `AbilityTests.cs`, `LifecycleEffects.cs` = 3/3 balanced. **Not C# compilation.**

**Actual standalone protected-source oracle (Python 3, in current tool container):**
```
COMMAND=python - <<'PY'
from pathlib import Path
import hashlib, re
p=Path('/mnt/data/cc001_stage_audit/CC001_T011_A30_candidate_copy1.html')
s=p.read_text()
print(hashlib.sha256(p.read_bytes()).hexdigest())
print(re.search(r'const REVIVE_EXCLUDED_TYPES=new Set\\(\\[([^\\]]+)\\]\\);',s).group(1))
PY
```
The performed equivalent scanner checked exact SHA, excluded `normal`, `cascade`, `genesis`, `list.length>18`, and use of exclusion gate: **5/5 TRUE, exit code 0** (STATIC_V148_SOURCE_ORACLE_PASS). Protected file **read only**.

**Runner probe:**
```
dotnet --info
EXIT_CODE=127
bash: dotnet: command not found
```

Managed .NET 9 compile; 22 new tests; old managed suite; codec; Unity 6000.4.0f1 compile/build/physics; snapshot reconnect; devices and GitHub Actions actual candidate run: **NOT_RUN**. No false runtime PASS/RED→GREEN claim.

## 5. Dependencies / next authorized actions

1. **A72:** Execute real managed/codec G1 in disposable checkout using a **specific combined candidate SHA**. Preserve exact test logs, exit codes, runner version and Evidence bytes.
2. **A70:** Determine if/when HQ authorizes selective inclusion of A40 SHA and A50 SHA on a new isolated **development candidate**; Stage1 SHA must not be retroactively claimed as updated. Compare Git blobs before and after integration.
3. **A50:** Confirm G09B/C/D/E on combined candidate; W5 new Kill patch leaves F02 TryCommand unchanged.
4. **A60:** Independently check A40 lifecycle and the V148 eligible grave cases after G1/G2; no UNITY_READY promotion beforehand.
5. **HQ/A10 if required:** Dirge nearest V148-approved but unported DATA_ONLY death-effect body remains a separate scope issue, not fixed here.

## 6. Mandatory status and handoff

**DESIGNED:** YES — A10 contract/V148 source oracle used.  
**IMPLEMENTED:** PARTIAL overall; scoped W5 grave cap source delta committed.  
**TESTED:** SOURCE STATIC ONLY (12/12 GitHub checks, 5/5 V148 reference checks, 3/3 structure checks); **managed, codec and Unity NOT_RUN**.  
**INTEGRATED:** NO for A40 branch; A70 Stage1 excludes these commits.  
**RELEASED:** NO.  
**GATE:** HOLD — G0 baseline PASS historical; G1/G2/G3/G4 not independently passed.

No main merge, no deployment, no force push, no protected V148/R16 modification, no new issue and no edit to foreign-agent paths.

**HANDOFF:** A00/HQ, A70 development integration, A72 runner, A50 F02 combined oracle, A60 independent QA.
