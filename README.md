# Core Clash — Delayed Replay PvP Pack 02

Paczka nakłada się bezpośrednio na **Core Clash Online PvP Pack 01 (v90)**. Zawiera też zabezpieczenie instalatora dla preview v91 i ponownej instalacji v92.

## Najważniejsze zmiany

### 1. Płynne, wierne oglądanie ruchu przeciwnika

Aktywny gracz nadal gra lokalnie bez sztucznego laga. Jego rzeczywisty przebieg ruchu jest zapisywany w klatkach stanu gry z częstotliwością 30 Hz, grupowany w małe paczki i wysyłany do API. Drugi gracz gromadzi około **2 sekundy bufora** i odtwarza ten rzeczywisty przebieg płynnie.

Interpolacja dotyczy ruchu wizualnego pomiędzy zarejestrowanymi stanami. HP, statusy, utworzenie/usunięcie obiektów, wynik i stan końcowy pochodzą z faktycznie zarejestrowanych klatek — klient obserwujący nie liczy własnej alternatywnej fizyki.

### 2. Perspektywa gracza 2

Gracz 2 ma planszę obróconą o 180°, więc jego baza jest zawsze na dole. Razem z widokiem transformowany jest input myszy/dotyku. Napisy na canvasie są kontr-obracane. HUD pokazuje lokalnego gracza po lewej stronie z jego HP, a wynik/komunikat `WYGRYWASZ` / `PRZEGRYWASZ` jest liczony względem aktualnego klienta.

### 3. Pełny flow po zakończeniu meczu

Po meczu obaj gracze dostają trzy akcje:

- **Zagraj ponownie** — głos za rewanżem z tą samą talią.
- **Zmień talię** — głos za kolejną rundą z ponownym draftem.
- **Wyjdź z serwera** — prawidłowe opuszczenie sesji.

Nowa runda rusza dopiero, gdy obaj gracze wybiorą dalszą akcję. Jeśli choć jedna osoba wybierze zmianę talii, obaj wracają do draftu. Dzięki temu serwer nie kasuje replayu, zanim drugi gracz zobaczy końcówkę ruchu.

Przy każdej kolejnej rundzie gracze **zamieniają strony**. Talia należy do gracza, nie do strony, więc przy rewanżu z tą samą talią przechodzi razem z nim. Klient nadal renderuje siebie na dole.

### 4. Lepszy lifecycle serwera

- Ręczny publiczny serwer pozostaje użyteczny, gdy jeden gracz po meczu wyjdzie: pozostały gracz wraca do stanu oczekiwania na nowego przeciwnika.
- Quick Match jest sesją nietrwałą: wyjście gracza zamyka ten pokój.
- Quick Match usuwa martwe oczekujące sesje po 8 sekundach bez heartbeatów.
- `pagehide` próbuje natychmiast wysłać `leave` przez `sendBeacon`.
- Jedna przeglądarka może hostować **maksymalnie jeden aktywny serwer** naraz. Identyfikator jest przechowywany lokalnie w przeglądarce. To jest zabezpieczenie UX/anty-spam, nie system kont ani mechanizm bezpieczeństwa.

## Instalacja

Rozpakuj ZIP i w PowerShellu uruchom:

```powershell
.\install.ps1 "C:\Users\kubap\Documents\GitHub\aplikacja-turnieje-live"
```

Potem:

```powershell
.\verify.ps1 "C:\Users\kubap\Documents\GitHub\aplikacja-turnieje-live"
```

Installer tworzy backup w:

```text
artifacts/tournament-manager/.core-clash-delayed-replay-pvp-pack-02-backup-*
```

## Restart po instalacji

Zmienia się frontend i router Express, więc zrestartuj oba procesy.

API — w terminalu z poprawnym `DATABASE_URL`:

```powershell
cd "C:\Users\kubap\Documents\GitHub\aplikacja-turnieje-live"
$env:PORT=8080
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start
```

Frontend:

```powershell
cd "C:\Users\kubap\Documents\GitHub\aplikacja-turnieje-live\artifacts\tournament-manager"
$env:PORT=5173
$env:API_PROXY_TARGET="http://127.0.0.1:8080"
pnpm dev
```

## Test ręczny

Najpierw testuj ręczny serwer w dwóch oknach. Wykonaj mocny ruch z wieloma kolizjami. Osoba wykonująca turę powinna widzieć wszystko natychmiast; przeciwnik powinien rozpocząć oglądanie około 2 sekundy później, ale dostać płynny i zgodny przebieg. Gracz 2 powinien widzieć własną stronę na dole.

Po końcu meczu sprawdź wszystkie kombinacje: rewanż + rewanż, zmiana talii + rewanż, zmiana talii + zmiana talii, wyjście jednego gracza. Następnie sprawdź Quick Match i próbę utworzenia drugiego publicznego serwera w tej samej przeglądarce.

## Rollback

```powershell
.\rollback.ps1 "C:\Users\kubap\Documents\GitHub\aplikacja-turnieje-live"
```
