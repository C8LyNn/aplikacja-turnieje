# CC-001 — W16 / PRZEKAZANIE PROGRAMOWANIA DO CLAUDE CODE

**Data:** 2026-11-02. **Zadanie GitHub:** [#280](https://github.com/C8LyNn/aplikacja-turnieje/issues/280). **HQ:** [#97](https://github.com/C8LyNn/aplikacja-turnieje/issues/97).
**Status:** INSTRUCTIONS READY; Claude has **not** been launched by this document; no native build or QA result is implied.

## 1. Czego dotyczy projekt

**Gra:** Core Clash — fizyczna, turowa gra o wystrzeliwaniu kulek, mechanikach specjalnych, talii i zdobywaniu przewagi nad bazą przeciwnika. Unity 6 URP, rozgrywka lokalna i multiplayer PC1(host)/PC2(klient). Główne zaobserwowane problemy wcześniejszego testu: opóźnione/skaczące kulki P2, błędny komunikat tury, perspektywa P2, celowanie i zbędne paski siły. Kod poprawiono w gałęziach rozwojowych; **nie ma jeszcze potwierdzonego natywnego G3 PASS na dwóch fizycznych komputerach.**

Repozytorium `https://github.com/C8LyNn/aplikacja-turnieje` zawiera również **INNY projekt — aplikację turniejową**. Nie dotykaj jej. Pracuj wyłącznie w:
- `unity/cc001-r16/CoreClash-V149-Unity/` — gra i testy;
- `scripts/cc001/` i `docs/cc001/` — narzędzia/raporty tego projektu.

Architektura: `Assets/CoreClash/Core` — gameplay/stan, `Physics` — kolizje, `Networking` — replikacja/komendy, `Presentation` — UI/kamera/renderer, `Tests` — managed .NET9. Czytaj kod źródłowy przed zmianą. Historyczne README R16 nie certyfikuje W11–W15.

## 2. Stan źródeł i role (traktuj dokładne SHA jako klucz)

| Element | Dokładna podstawa | Uprawnienia |
|---|---|---|
| **QA freeze W11** | `integration/cc001-r17-w11-qa-freeze-20261030` = `3f972cdbaea6289a7e33ce608f5d3256cfdab0a3` | READ/BUILD only; NIE commituj |
| **Bazowy A72 build kit** | [Draft PR #188](https://github.com/C8LyNn/aplikacja-turnieje/pull/188) = `aa6e047cd7661961978fedcc91ff14dfc29a02f4` przy przygotowaniu handoff | Własne gałęzie Claude; A72 wybiera poprawki |
| **Claude onboarding** | `feat/cc001-r17-w16-claude-handoff-20261102` utworzona Z #188 | Dokumentacja i punkt startowy; brak merge |
| **Rozwój po-frozen** | [#207](https://github.com/C8LyNn/aplikacja-turnieje/pull/207), [#266](https://github.com/C8LyNn/aplikacja-turnieje/pull/266), późniejsze W15 | Oddzielne DEV; ich SHA może się zmieniać. NIE używać jako W11 build |
| **Oryginały** | RC1 `10f64e4d213f17a352ed8fa83bc75884a39549f0`, V148, R16, Protocol149 | CHRONIONE |

**Decyzje twórcy:** Mitosis = oryginalna semantyka V148 (nie rozdzielać na ścianie); Furnace = wyłącznie strefa FIRE + okresowe obrażenia, bez oddzielnego natychmiastowego pakietu obrażeń; HP = wartości R16. Nie zmieniaj balansu ani chronionego katalogu.

**Integracja/recenzja:** A70 [#137](https://github.com/C8LyNn/aplikacja-turnieje/issues/137); budowanie: A72 [#113](https://github.com/C8LyNn/aplikacja-turnieje/issues/113); niezależny QA: A60 [#139](https://github.com/C8LyNn/aplikacja-turnieje/issues/139) + A31 [#94](https://github.com/C8LyNn/aplikacja-turnieje/issues/94). Claude nie zastępuje roli release owner i nie może sam sobie zatwierdzić G3.

## 3. Pierwsze zadanie Claude — P0 / Windows native build, a nie kolejny audyt

### Bezpieczny start na PC1 (Windows PowerShell, użytkownik wykonuje raz, Claude dalej steruje w swoim repo)

```powershell
git clone --branch feat/cc001-r17-w16-claude-handoff-20261102 https://github.com/C8LyNn/aplikacja-turnieje.git
cd aplikacja-turnieje
git switch -c claude/cc001-w16-pc1-build
git status --short
git rev-parse HEAD
claude
```

Jeśli repo już sklonowano: `git fetch origin`, utwórz **osobny worktree/branch** z handoff, nie resetuj zmian roboczych. Nie uruchamiaj Claude na `main` lub na frozen QA. Claude Code może czytać repo w całości, ale uprawnienia do modyfikacji ogranicz do CC-001.

### Środowisko do rzeczywistego uruchomienia
- Windows 11; Unity **6000.4.0f1** z Windows Standalone Build Support i aktywną licencją;
- .NET SDK **9**, Node.js **22**, Git + uprawniony dostęp do repo;
- sprawdź, czy Unity Editor nie jest już używany przez inny proces / rój; nie wykonuj dwóch konkurencyjnych buildów z tego samego projektu.

**Claude:** najpierw odczytaj `scripts/cc001/w10/a72/README_W11.md` i `README_W11_PR207.md`; sprawdź istniejące skrypty i ich parametry `--check`/ `--self-test`; potem uruchom je zgodnie z dokumentacją; następnie:

```cmd
scripts\cc001\w10\a72\URUCHOM_W11_PR207.cmd
```

**Uwaga:** nazwa pliku zawiera `PR207` historycznie, ale aktualny kit ma wymagać **frozen SHA `3f972...`**, nie aktualnego HEAD #207. Skontroluj pin przed uruchomieniem. Nie omijaj fail-closed walidacji branch/SHA.

### Defekty, które już naprawiano i których nie należy implementować drugi raz
- Zagnieżdżone ścieżki Windows Playera, w tym `CoreClash_Data/Managed/Assembly-CSharp.dll`, wymagają manifestu względem **jednego katalogu głównego Playera**.
- Test .NET9 musi **wytworzyć świeży** raport; historyczny `Evidence/unity-tests.json`/R16 nie jest nowym PASS.
- Unity może legalnie wygenerować dwa śledzone JSON-y `Evidence/R16/Unity/build-StandaloneWindows64.json` i `Evidence/R16/Unity/unity-smoke.json`; #262 wprowadzono do kanonicznego #188, nie pozwalaj na arbitralne zmiany innych ścieżek.
- Pakiet Windows musi zawierać **niepuste EXE i DLL** oraz cały katalog Playera i komplet SHA256.

**Pierwsza czynność:** spróbuj rzeczywistego builda. Jeśli środowisko blokuje, zwróć dokładnie brakujący prerekwizyt i realny `stderr/exit`; nie pisz zastępczych narzędzi bez uzasadnionego błędu. Jeśli istnieje błąd w kit: jedno minimalne naprawienie + realny test RED→GREEN + Draft PR do A72, bez naruszania frozen source.

## 4. Odbiór A60/A31 (osobny fizyczny G3, nie zadanie do automatycznego uznania przez Claude)
- Przekaż **prywatnie** oryginalne Player/ZIP i testy, pełny manifest `ścieżka, rozmiar, SHA256`, EXE i Assembly-CSharp.dll, Unity/.NET exit+logi, `testedAt`, manifest ZIP+SHA.
- Na PC1 i PC2 niezależnie sprawdź SHA **wszystkich plików**; połącz się przez prywatny LAN.
- Przetestuj legalny ruch P2 dokładnie jeden raz po stronie hosta, sekwencję tur, własność talii, celowanie, akcję i `actionSerial`, zgodność stanów i rewizji, płynny zwykły ruch, **PORTAL**.
- Frozen W11 nie zawiera późniejszego telemetrycznego `CC_W11_STATE_TX/RX` ani po-frozen specyficznego snapa `TELEPORT/SWAP`; ich nieobecność oznacz `NOT_IN_SOURCE / HOLD_UNINSTRUMENTED`, nie sztuczne PASS/FAIL.
- G3/G4 pozostają HOLD dopóki A60 nie dostarczy fizycznych dowodów i A70 nie zamknie bramki.

## 5. Kiedy Claude zaczyna programować dalsze mechaniki?

**Po P0 native** A70 wskazuje konkretne odrębne DEV SHA i problem. Kandydat: walidacja Phoenix w nowszym [PR #266](https://github.com/C8LyNn/aplikacja-turnieje/pull/266) oraz testy dwóch graczy; to *nie* część frozen W11. Pozostałe W12–W15 PR-y mają wiele nakładających się implementacji; wybierz jedną wraz z A70. Stosuj małe PR-y, ownership per plik i testy odtwarzające błąd. Bez implementowania niezatwierdzonych zmian projektowych.

**Raport do HQ i #280** po każdej paczce: rola, dokładny SHA, bazowy SHA, PR, zmienione pliki, komendy i realne exit/logi, `DESIGNED / IMPLEMENTED / TESTED / QA_ACCEPTED / READY_FOR_INTEGRATOR / INTEGRATED / RELEASED`, co realnie blokuje kolejną czynność. Nie publikuj prywatnych artefaktów do publicznego repozytorium.
