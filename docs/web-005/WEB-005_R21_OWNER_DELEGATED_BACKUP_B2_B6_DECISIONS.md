# WEB-005 — R21 / Backup V3 B2–B6: decyzje A00 w ramach upoważnienia właściciela

**Data:** 2026-10-14 · Europe/Warsaw
**Project / local coordinator:** WEB-005 / A00 Implementation Lead, pod jedną globalną Queen/HQ.
**Repo / control branch:** C8LyNn/aplikacja-turnieje / chore/web-005/t000-wave1-control
**Authority:** Właściciel wcześniej bezpośrednio wybrał [Backup B1-A](./WEB-005_R21_OWNER_BACKUP_B1_COMPATIBILITY_APPROVAL.md), a w kolejnej wiadomości WEB-005/A00 napisał: **„zatwierdzam co uwazasz, to samo dla przyszlych pytan w tym temacie”** w odpowiedzi na pytanie o B2 latest history parity. A00 traktuje tę wypowiedź jako **jawne upoważnienie do wyboru pozostałych szczegółowych polityk Backup V3 B2–B6**, nie jako zgodę na edycję kodu, SQL, kosztowe CI, test DB reset, zaakceptowanie nieznanych zagrożeń innych obszarów, final handoff ani release.
**Decision provenance:** B1=A \`OWNER_EXPLICIT\`; B2–B6 poniżej \`A00_DECIDED_UNDER_OWNER_BACKUP_DELEGATION\`. Wypowiedź właściciela jest w tym wątku rozmowy; dokument nie udaje zewnętrznego permalinku do wiadomości ani podpisu kryptograficznego.
**Source scope:** [A90 R20 Backup B2 options and validated invariants](https://github.com/C8LyNn/aplikacja-turnieje/blob/docs/web-005/a90-r20-backup-b2-decisions/docs/web-005/agent-reports/A90/WEB-005_A90_R20_BACKUP_B2_DECISIONS.md), [R21 owner packet](./WEB-005_R21_OWNER_DECISION_PACKET.md), PR #41 Backup B1 and PR #48 Backup B3A. **These are product-policy choices, NOT evidence of existing implementation or passing native QA.**

## §1. Zatwierdzony zestaw B1–B6

| Cell | Chosen | Contract |
|---|---|---|
| **B1 = A** | **OWNER_EXPLICIT (earlier answer)** | New strict profile with explicit capability/version; preserve legal historic V2/V3 through safe, tested legacy path. Corrupt older backups do not get a safety bypass. |
| **B2 = B** | **DELEGATED_A00** | Reject an existing, contradictory latest result-history tuple versus completed match. A historical legal backup with absent/incomplete history may restore through the bounded legacy compatibility path, with unsafe Revert/Undo disabled until safe provenance is regenerated. New strict profile MUST contain complete history for each relevant completed match and must satisfy latest-history parity. |
| **B3 = A** | **DELEGATED_A00** | Explicitly serialize portable **match state revision** in new strict profile; keep it distinct from \`resultHistory[*].revision\`. Restore uses a validated, owner-safe match-revision/CAS mapping; never transplant stale authorization/CAS tokens across tournament identities. A20 reviews actual \`0028_match_revision.sql\`, defaults/triggers and transaction identity before any schema/source GO. Missing revision in truly legal legacy backups is handled in the legacy path via a safe initial/rebased local revision and restricted unsafe Undo/Revert if necessary. |
| **B4 = A** | **DELEGATED_A00** | New strict profile serializes typed completion-action provenance, active completion identity and a deterministic total action order for safe Global Undo LIFO (explicit stable ordinal/portable tie-break; timestamps alone insufficient). Imported action links are remapped to clone-local identifiers and checked against current completed results. Legacy empty/null action log remains acceptable only in a compatible profile, but operations lacking provable history/provenance are disabled, not guessed. |
| **B5 = A** | **DELEGATED_A00** | For recognized match/player references inside new strict-profile nested Undo payloads, reject missing/foreign/unmapped IDs **before clone mutation**; never silently fall back to original foreign IDs. For a legal historic backup with insufficient original identifiers, allow separately validated restricted restore with clear warning and affected unsafe Undo/Revert disabled; don't reject every legacy document merely because its historical payload shape differs. Unknown opaque historical keys aren't automatically interpreted as recognized foreign IDs. |
| **B6 = A** | **DELEGATED_A00** | Strict-profile invalid data => typed preclone \`400 INVALID_BACKUP_V3\` with zero clone roots/children; a genuine later PostgreSQL/transaction failure => full transaction rollback of *all* inserted clone/related rows, user-safe error without success/partial-success. Preserve legal legacy-positive imports, use clear error/warning when capabilities degraded, and never leak stack traces/credentials. Owner runtime DB reset approval required separately. |

**Overall policy status:** \`BACKUP_B1_OWNER_EXPLICIT_A / BACKUP_B2_DELEGATED_B / B3_DELEGATED_A / B4_DELEGATED_A / B5_DELEGATED_A / B6_DELEGATED_A / BACKUP_POLICY_SELECTED / SOURCE_IMPLEMENTATION_PENDING / QA_NOT_EXECUTED\`.

## §2. Cross-decision invariants: new strict profile vs legal legacy

**New strict V3 producers**
- Must emit **unambiguous** strict capability marker; no easy downgrade by merely stripping the marker. Exactly how legacy provenance is authenticated or whitelisted is a **security design requirement** for code review, not an assertion that current importer already does it.
- Match state revision and per-result history sequence are **distinct**. A completed match's latest permitted result-history record agrees with match state (winner/status/score/time fields where semantically applicable) and has explicit well-defined exceptions for BYE, walkover, no_contest, cancel and prior Revert.
- Typed completion actions have validated identity, active/undone status and deterministic total ordering; imported IDs are remapped only to clone-local entities. No impossible time/order fallback when \`createdAt\` ties.
- Strict missing required data or inconsistent current-history/action relationships fail before any clone INSERT; partially transferred/hybrid modern/legacy objects must not bypass strict checks.

**Genuinely legal historic V2/V3**
- Preserve original legal shapes, including **historically legal** \`resultHistory:[]\`, \`actionLog:[]\`, \`undoPayload:null\` and optional Phase2/3 fields, without synthesizing false completed histories or arbitrary revisions.
- Legacy compatibility is **not acceptance of corruption**: run actual schema/auth/referential validations, catch recognized foreign IDs and actual contradictory existing results.
- If history or completion identity can't be rebuilt with proof, imported tournament may be viewable/editable within verified safe limits, but **affected destructive Undo/Direct Revert actions must fail closed** with clear organizer-facing explanation. No silent false provenance.
- For records whose history **does exist and contradicts match state**, default is reject rather than import contradictory winners; documented format-specific exceptions must be independently verified and not introduced as hidden workaround.

## §3. Mandatory acceptance matrix — authored design, NOT test evidence

| Fixture ID | Profile / situation | Expected |
|---|---|---|
| B2-MOD-01 | strict exporter modern valid completed match+history+provenance+portable revision | import succeeds; readback and future authorized CAS remain coherent |
| B2-MOD-02 | strict completed match latest result-history contradicts winner, score or completed status | preclone 400 INVALID_BACKUP_V3, zero clone rows |
| B2-MOD-03 | strict finished match has missing/empty required provenance/history | preclone 400, zero clone; not silently routed to legacy |
| B2-MOD-04 | strict nested recognized match/player ID points outside declared export | preclone 400, no inherited foreign IDs in clone |
| B2-MOD-05 | strict two actions have identical createdAt but defined portable order | active top action deterministic after restore, correct Global Undo LIFO |
| B2-MOD-06 | strict match revision vs result-history revision numerically differ but refer to coherent state | valid when allowed by contract; no incorrect forced equality |
| B2-LEG-01 | legal old V3 with absent/empty history/action arrays, null Undo payload or missing optional Phase arrays | safe restore possible; affected Undo/Revert disabled where provenance missing |
| B2-LEG-02 | legal old V2 and old V3 restore against new basketConfigRevision T055 rules | safe new local revision/revalidation; don't reuse old editor ETag/token |
| B2-LEG-03 | old backup with **present contradictory history** or corrupt known IDs | fail closed, not grandfathered |
| B2-LEG-04 | old backup containing unknown historical opaque fields but no recognized ID relationship | accept/restrict per documented allowlist, do not infer foreign ID from arbitrary number |
| B2-RB-01 | late after-clone DB integer overflow / induced SQL error | full rollback of tournament+all allowlisted clones; no success response |
| B2-MIX-01 | new strict JSON with omitted marker or selectively removed new fields | no downgrade to unverified legacy import profile |
| B2-CAS-01 | two concurrent post-restore corrective operations | expected revision/action ID checks remain 409/422 behavior under separately signed MP2B policy; no stale mutation |

**Actual status:** All fixtures are required design contracts, not statements of already-authored or passing automated tests. A50 native app tests 0 as of R21; separate future SWARM-006 integration testing is user-selected EXEC-B **conditional on formal WEB-005 closeout** and strict release STOP. No package claimed full app-QA accepted.

## §4. Review ownership and dependencies, NO CODE GO

1. **A90**: compare existing PR41/P08 and PR48/P15 against these policy choices; isolate missing B2 source-contract work from pre-existing B1 position parity/B3A MVCC, propose minimal new patch scope, not a gratuitous source rewrite.
2. **A20**: verify PG16 match state revision \`0028_match_revision.sql\`, concurrency triggers, physical test-only host; any planned schema migration/T055 persisted basket revision requires separately approved DB-safe implementation and rollback.
3. **A70**: review active completion action semantics and Global Undo LIFO, and public MP2B as an **independent still-unsigned policy**; don't treat B4 as direct public Revert CAS approval.
4. **A110**: account for owner-approved T055 persisted \`basketConfigRevision\` during export/restore. Old tokens must not silently validate after restore; legacy clients need an explicit upgrade plan.
5. **A60**: independent new-SHA source QA and future actual native PG16/B2 valid-corrupt-positive/rollback test receipts; no self-certification by A90.
6. **A00/HQ**: only issue a separate narrow test-first GO for code paths/owners after conflict assessment. **This document grants no source-code edits, no migrations/production SQL/shared DB reset, no paid CI, no merge/rebase, no staging/live, and no SWARM-006 final handoff GO.**

## §5. What still requires owner input outside Backup V3

Backup B1–B6 **policy choices are completed** under direct owner choice/delegation. This does NOT resolve the separate public MP2B API+Host rollout, Steam/session security, PR53 raw orphan cache retention risk, missing nine authentic WEB-004 case IDs and 38-case per-finding dispositions. Those require explicit owner input or their own narrow documented delegation, not silent default selections. No future redundant Backup B2–B6 questions needed unless a materially new, high-consequence risk appears.

**Decision record:** \`BACKUP_POLICY_SELECTED / UNDER_OWNER_TOPIC_DELEGATION / SOURCE_AND_NATIVE_QA_PENDING / SWARM006_HOLD / RELEASE_NO_GO\`.
