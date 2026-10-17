# WEB-005 — A50 R23H · Node 22 / pnpm 10 runner — PROJEKT NIEURUCHAMIANY

Task `WEB-005-T131-R23H-RUNNER`; C01 exact SHA `fa3261b2c9510e110ac9eba21726812d3401a525`.

W tym pakiecie są dokładnie cztery wymagane dokumenty specyfikacyjne, rejestr źródeł i manifest integralności. Pakiet NIE zawiera działającego launchera ani automatycznego wyzwalacza Docker/SQL. Wszystkie G0–G5, S1, S2 i G4 pozostają HOLD. Projekt runnera jest przygotowany, lecz implementacja i Linux runtime są niezweryfikowane.

Kolejność czytania: `R23H_NODE_RUNNER_SPEC.md` → `R23H_RUNNER_WRITE_PATH_AUDIT.md` → `R23H_FAIL_CLOSED_LAUNCHER_DESIGN.md` → `R23H_DIAGNOSTIC_EVIDENCE_CONTRACT.md`.

Źródła: A20-R2 Dockerfile Git blob 61094e79376e0cee730c6ffdfb540ed60d4f94fa; A20-R2 Compose Git blob 000bf75d8d456dcb4657dbf06c8c9f6274918c73; A20 Google Drive R2 folder https://drive.google.com/drive/folders/1-kR3pueqklMzu4vKqQa4EdzTbUTNsTIq ; bezpieczeństwo A30 https://docs.google.com/document/d/1g1TfiHEl8bxka09kv_N4BZ1M8xgCyb0XZmsiaetOSks/edit ; exact C01 run-tests.ts da4188446aba4696f97eb7831fee0cc5824d212f and S1/S2 blobs in spec.

Pending A00/A20/operator: approve one immutable Option A plan, authenticated Node/runner OCI digests, positive context manifest, write-path closure, G0–G4 distinct GO, actual physical certificate and G5 policy. A24/A60 to independent review. No games, source checkout, production, SQL, Docker or CI changed by authoring these texts.
