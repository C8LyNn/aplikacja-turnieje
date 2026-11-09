# Animated Effects + OBS Chat — integracja i QA przed publikacją

Stan integracji: PR #9 scalony do `codex/replit-visual-polish-handoff`.
Weryfikacja na gałęzi integracyjnej: [GitHub Actions](https://github.com/C8LyNn/aplikacja-turnieje/actions/workflows/streaming-animated-effects-ci.yml).

## Zakres wersji testowej

- Animacje wiadomości Camera + Chat Overlay (rise, slide, pop, fade).
- Edytor Animated Effects z natywnym StreamElements Custom Widget.
- Uruchamianie przez komendę czatu, follower, subscriber, tip, cheer, raid.
- Wiele reguł z wybranymi warstwami, czasem i cooldownem.
- Presety zapisane lokalnie i import/eksport `.ae-profile.json`.
- Symulator zdarzeń uruchamiający ten sam kod HTML/CSS/JS co wyeksportowany widget.

## Bezpieczny podgląd bez backendu

GitHub Actions po pomyślnym buildzie dodaje artefakt
**`stream-animated-effects-static-preview`**.
Jest to statyczny build **samego edytora**, a nie kopia danych, backendu ani bazy.
Pobierz go z zakończonego zielonym wynikiem przebiegu workflow.

Pliki są zbudowane z bazą URL `/stream/animated-effects/`, dlatego należy je serwować
z odpowiedniej ścieżki HTTP. **Nie wystarczy podwójne kliknięcie `index.html`**,
a otwieranie produkcyjnej strony nie jest testem tego artefaktu.

Wariant z kodu źródłowego (Node 22, pnpm 10):
```bash
pnpm install --frozen-lockfile
pnpm --filter animated-effects build
pnpm --filter @workspace/tournament-manager build
```

Uruchom lokalny podgląd z katalogu repozytorium.

Linux/macOS:
```bash
PORT=4173 pnpm --filter @workspace/tournament-manager serve
```

PowerShell:
```powershell
$env:PORT = "4173"
pnpm --filter @workspace/tournament-manager serve
```

Otwórz:
`http://127.0.0.1:4173/stream/animated-effects/index.html`

Do tej trasy **nie jest potrzebne uruchamianie serwera API ani połączenie z bazą danych**.
Pozostałych ekranów Tournament Manager nie należy traktować jako izolowanego stagingu
bez zweryfikowania ich wywołań do `/api`.

## Checklist ręczna

- [ ] Edytor ładuje podgląd z włączonymi efektami; brak błędów w konsoli.
- [ ] Eksport Custom Widget zawiera HTML, CSS i JS.
- [ ] Tryb ciągły działa po załadowaniu symulatora.
- [ ] Komenda `!fire` uruchamia tylko zaznaczone warstwy.
- [ ] Druga komenda podczas cooldownu nie uruchamia animacji ponownie.
- [ ] Raid może zastąpić odtwarzaną animację, respektując własny cooldown.
- [ ] Reset symulatora czyści cooldown i aktywną scenę.
- [ ] Zmiana reguły lub warstwy aktualizuje wygenerowany kod i podgląd.
- [ ] Zapis profilu i ponowne wczytanie przywraca warstwy oraz reguły.
- [ ] Import JSON nie zmienia sceny bez świadomego kliknięcia **Wczytaj**.
- [ ] Zamknięcie i ponowne otwarcie eksportu nie zostawia działających animacji.
- [ ] Układ pozostaje używalny przy szerokościach 390, 768 i 1280 px.
- [ ] W OBS Browser Source zmierzono płynność, użycie CPU/GPU i przezroczystość.
- [ ] Prawdziwe eventy StreamElements odpowiadają przewidzianemu routingowi i payloadom.

## Ograniczenia i rollback

- Status GitHub Actions `success` oznacza przejście testów oraz kompilacji,
  **nie jest równoznaczny z testem rzeczywistej transmisji w OBS**.
- Replit, który był dostępny do diagnostyki 11.10.2026, posiadał starszy checkout
  `feat/double-elimination-full-integration`. Nie należy na nim wykonywać
  automatycznej publikacji tej gałęzi ani testów zapisujących dane bez potwierdzenia
  izolacji środowiska i bazy.
- Gałąź `main` pozostaje odrębna; nie przenosić tam automatycznie całego
  `codex/replit-visual-polish-handoff`, który zawiera również inne zmiany.
- W razie regresji przed produkcją pozostań przy aktualnym wdrożeniu — sama integracja
  Git nie publikuje zmian. Jeśli testowe wdrożenie zostanie utworzone później,
  wycofanie powinno polegać na przywróceniu poprzedniego artefaktu wdrożenia
  lub na `git revert` commita integrującego PR #9, **nie na resetowaniu historii**.
- Równoległy PR #8 ingeruje w część tych samych plików Animated Effects.
  Jego integracja wymaga osobnego uzgodnienia zmian i uruchomienia CI po rozwiązaniu konfliktów.
