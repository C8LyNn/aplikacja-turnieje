# Wspólne zadanie: animacje wiadomości czatu OBS / StreamElements

## Główny cel

Animować **pojedyncze wiadomości czatu** (dymki z nazwą widza i tekstem)
w Browser Source, podglądzie Camera + Chat i StreamElements Custom Widget.
Nie mylić tego z generatorem autonomicznych efektów sceny (104+ efektów).

## Dwa istniejące kierunki prac

| Źródło | Zakres | Status integracji |
| --- | --- | --- |
| PR #9 (scalony do `codex/replit-visual-polish-handoff`) | Wejście wiadomości: rise/slide/pop/fade, proste sterowanie czasem, natywny widget i moderacja | Zintegrowany |
| PR #8 (`codex/animated-effects-scene-portability-export-kit`) | Zaawansowany edytor animacji scen, trigger `chat message`, dynamiczne podpisy/awatary, kolejka, cooldowny, diagnostyka i replay | Oddzielny Draft — przenoszenie funkcji etapami |
| Ta paczka | Nowe **animacje dymków**, tryb stabilnie losowego stylu i test 4 wiadomości | PR integracyjny |

PR #8 ma inną gałąź bazową (`fix/animated-effects-obs-responsive`) i
jego kod eksportera jest rozbieżny z eksporterem już scalonym w PR #9.
**Nie należy automatycznie nadpisywać `streamElements.ts` całą wersją z PR #8.**
Przenieść logikę kolejki/zdarzeń i animacji tekstu do wspólnych, testowanych
modułów, a następnie zasilić nimi wspólny eksport bez utraty wielu reguł,
biblioteki profili czy symulatora.

## Zrealizowany etap 1 — animacje pojedynczych wiadomości

- Pozostają: `rise`, `slide`, `pop`, `fade`.
- Dodane: `bounce` (odbicie), `flip` (obrót 3D), `wipe` (odsłonięcie).
- Dodany `random`: **deterministycznie** wybiera jeden z 7 stylów dla każdej
  nowej wiadomości na podstawie `msgId` (lub tekstu/nazwy bez ID), więc
  React i StreamElements nie losują odmiennych stylów dla tego samego wpisu.
- Konfiguracja jest zapisywana w URL Browser Source, poprawnie odczytywana
  i uwzględniana w samodzielnym eksporcie SE.
- Animacja dotyczy tylko nowych wiadomości, bez powtarzania animacji
  już istniejących dymków po moderacji lub dojściu kolejnych wpisów.
- `prefers-reduced-motion` wyłącza animacje, zachowując tekst.
- Kontrolka `Testuj serię 4 wiadomości` pozwala ocenić zróżnicowanie
  ruchu zamiast uruchamiać niezależny efekt całej sceny.

## Zrealizowany etap 2 — opcje i wygląd czatu (2026-11-25)

Każda opcja trafia jednocześnie do podglądu, adresu Browser Source (OBS) i
natywnego widgetu StreamElements. Reguły wiadomości są w
`chat-message-format.ts`; eksport SE ma ich kopię w skrypcie, a
`chat-options.test.tsx` porównuje oba renderery na tych samych wiadomościach.

- **Układ:** nowy tryb „Sam czat” (bez ramki kamerki, własna szerokość i
  wysokość), wyrównanie do lewej/prawej, najnowsze na górze, układ wiadomości:
  w jednej linii / nick nad tekstem / dymki.
- **Tekst i nicki:** 10 czcionek systemowych + własna (zainstalowana na
  komputerze z OBS; nazwa jest oczyszczana przed wpisaniem do CSS), własny
  rozmiar w px, kolor i krycie tekstu, cień/obrys, kolory nicków (z Twitcha /
  stała paleta / jeden kolor), rozjaśnianie zbyt ciemnych nicków, dwukropek.
- **Wygląd:** kolor panelu, kolor/krycie/zaokrąglenie dymków, pasek w kolorze
  nicku, odznaki (MOD/VIP/SUB) i emotki (Twitch, BTTV, FFZ, 7TV z danych SE)
  z rozmiarem i powiększeniem wiadomości złożonych z samych emotek.
- **Filtry i wyróżnienia:** ukrywanie komend `!`, linków (`[link]`), wybranych
  użytkowników (boty), limit długości, wyróżnianie słów kolorem.
- **Czas i animacje:** znikanie po N sekundach z animacją wyjścia
  (przenikanie / wysunięcie / zmniejszenie).
- **Konfigurator:** 10 motywów, autozapis w przeglądarce, własne zapisane
  konfiguracje, wczytanie ustawień z wklejonego adresu OBS, tło podglądu i
  przyciski wiadomości testowych (emotki, moderator, komenda, link, /me, bot…).
- **Bezpieczeństwo:** treść widzów zawsze jako tekst; obrazki tylko z https
  znanych CDN czatu (Twitch, BTTV, FFZ, 7TV, YouTube, StreamElements).
- **Zgodność:** brakujący parametr w adresie oznacza dotychczasowy wygląd, więc
  nakładki już dodane do OBS działają dalej; wklejone wcześniej widgety SE są
  samodzielne i nie zmieniają się, dopóki nie wklei się nowego kodu.

## Zrealizowany etap 3 — animacje wiadomości (2026-11-26)

- **Efekt nowej wiadomości** (`fx`): poświata, błysk, puls, rozbłysk tła — jednorazowy, w kolorze nicku
  widza. Rysuje go warstwa `::after` wiersza (zmienna `--chat-fx`), więc nie zastępuje animacji wejścia.
- **Odsłanianie tekstu** (`reveal`): maszyna do pisania (litera po literze) albo słowo po słowie; emotka to
  jeden krok, start w połowie animacji wejścia, maks. 45 ms na krok, wiadomości dłuższe niż 200 znaków
  pojawiają się od razu. Słowa nie są łamane.
- **Wyróżnianie ról** (`roles`): nadawca (czerwony), moderator (zielony), VIP (różowy) — tło i pasek
  w kolorze odznaki, także przy ukrytych odznakach; wyróżnione słowo ma pierwszeństwo.
- Motywy: Neon (poświata), Bąbelki (puls), E-sport (błysk + role), Klasyczny ciemny (role),
  Terminal (maszyna do pisania).
- `prefers-reduced-motion` wyłącza efekt i odsłanianie (tekst od razu widoczny).
- `chat-options.test.tsx` porównuje podgląd i widget SE także dla ról, efektu i czasów odsłaniania.

## Zrealizowany etap 4 — położenie, ramka i ruch czatu (2026-11-26)

- **Położenie:** czat po lewej (`layout=left`) i nad kamerką (`above`); na kamerce dodatkowo środek górnej
  i dolnej krawędzi oraz środek lewej i prawej strony (`position=top-center` itd.).
- **Ramka czatu** (`frame`, `framew`, `framec`, `framec2`, `framespd`): jednolita, gradientowa, pulsująca,
  świecąca (z poświatą do środka), płynący gradient, wirujący neon (`@property`, OBS 28+; starsze wersje
  pokażą ramkę bez ruchu), tęczowa, biegnące kreski, narożniki HUD. Pierścień to `::before` panelu
  z maską, więc przezroczysty panel zostaje przezroczysty. Panel dostaje zaokrąglenie tylko przy ramce.
- **Ruch czatu** (`panelanim`): unoszenie wiadomości, oddychanie panelu, błysk co kilka sekund, wejście przy
  starcie.
- **Wygląd:** gradient panelu (`panelgrad`, `panelc2`, `gradangle`), 11 nowych czcionek systemowych,
  pogrubiony tekst (`bold`), nicki wielkimi literami (`nameupper`), palety kolorów nicków (`namepal`:
  klasyczna, pastelowa, neonowa, ciepła, chłodna), 8 szybkich zestawów kolorów, motyw „Tęczowa ramka”.
- CSS ramki i ruchu tworzy jedna funkcja (`getChatFrameCss`) dla podglądu i widgetu SE; test porównuje
  reguły obu renderów dla każdej ramki.

## Zrealizowany etap 5 — dodatki czatu i obrazek w alertach (2026-11-26)

- **Efekt w tle czatu** (`ambient`, `ambientn`, `ambientc`): śnieg, iskierki, serduszka, bąbelki, gwiazdy,
  konfetti; 4–40 drobinek. Drobinki losuje stały generator, więc podgląd, strona OBS i widget SE rysują
  dokładnie te same (warstwa `z-index: -1` w panelu, pod wiadomościami).
- **Nagłówek czatu** (`header`: pasek, plakietka, minimalny; `headertext`, `headerlive`, `headerc`)
  z pulsującą kropką „na żywo” oraz **przypięta wiadomość** (`pinned`). Teksty są czyszczone (bez znaków
  sterujących, 40/120 znaków) i zawsze wstawiane jako tekst. Długi czat jest przycinany pod nagłówkiem.
  Wybór stylu nagłówka po raz pierwszy wpisuje tytuł „Czat na żywo” i włącza kropkę.
- **Kształt wiadomości** (`shape`): zaokrąglone, dymek z ogonkiem, skośne, sam kontur, podkreślenie
  (kontur i podkreślenie w kolorze nicku).
- **Nowi widzowie** (`firsttime`): etykieta NOWY i turkusowe wyróżnienie przy pierwszej wiadomości widza
  na kanale (tag Twitcha `first-msg=1` z danych StreamElements). Kolejność: wyróżnione słowo, nowy widz, rola.
- **Wylatujące emotki** (`burst`): pierwsza emotka wiadomości kilka razy wylatuje w górę.
- **Animated Effects:** podpis alertu może mieć obrazek lub GIF nad tekstem (adres https bez loginu,
  wysokość 40–400 px), ten sam w edytorze i w wyeksportowanym widgecie.
- CSS i dane dodatków tworzy `chat-decor.ts` dla obu renderów; testy porównują drobinki, nagłówek,
  kształty, etykietę NOWY i emotki między podglądem a widgetem SE.

## Zrealizowany etap 6 — łatwiejsze ustawianie (2026-11-26)

- Konfigurator otwiera się w trybie **Szybkie ustawienie** (przełącznik „Szybkie ustawienie / Wszystkie
  opcje”, zapamiętywany w przeglądarce). Pięć kroków: 1) gdzie czat — kafelki z rysunkiem układu, a dla
  czatu na kamerce siatka 3 × 3 z wyborem rogu; 2) styl — gotowy wygląd **bez zmiany położenia** czatu,
  plus „Losuj wygląd”; 3) kolory; 4) dodatki jednym kliknięciem (śnieg, serduszka, iskierki, nagłówek na
  żywo, etykieta NOWY, wylatujące emotki, animowana ramka, znikanie po 30 s); 5) dodanie do OBS —
  ponumerowana instrukcja z wymiarami i przycisk kopiowania adresu.
- **Cofnij / Ponów** (do 50 kroków; przeciąganie suwaka to jeden krok).
- **Ożyw podgląd:** co 2,5 s przychodzi wiadomość testowa, więc animacje i dodatki widać bez klikania.
- Ta sama instrukcja OBS jest też w panelu Browser Source.
- Logika jest w `chat-quick-setup.ts` (czyste funkcje), testy w `chat-quick-setup.test.tsx`.

## Zrealizowany etap 7 — zdarzenia na czacie, odpowiedzi i spokojny czat (2026-11-26)

- **Zdarzenia na czacie** (`events`, `eventkinds`, `eventstyle`, `eventbits`): obserwacje, suby (z liczbą miesięcy
  i plakietką T2/T3/Prime), suby w prezencie, bitsy, raidy i napiwki ze zdarzeń StreamElements (`follower-latest`,
  `subscriber-latest`, `cheer-latest`, `raid-latest`, `tip-latest`) jako wyróżnione wiersze czatu z ikoną.
  Trzy wyglądy: baner z błyskiem, świecąca ramka, jedna linia. Gift bomb to jeden wiersz (pojedyncze suby
  z `isCommunityGift` są pomijane), cheermotki („Cheer100”) znikają z tekstu, bitsy poniżej progu nie dostają
  wiersza, powtórzone zdarzenie (to samo `_id`) pojawia się raz. Waluta napiwków pochodzi z `onWidgetLoad`.
- **Odpowiedzi** (`replies`): nad odpowiedzią krótka linia „↪ @nick: …” z tagów `reply-parent-*` (zdejmowane są
  znaki ucieczki IRC i powtórzone „@nick” z początku wiadomości).
- **Wiadomości za punkty** (`points`): fioletowe wyróżnienie dla `msg-id=highlighted-message`. Kolejność wyróżnień:
  słowo, punkty, nowy widz, rola.
- **Spokojny czat** (`flood`, 0–20 wiadomości na sekundę): przy zalewie wiadomości trafiają na ekran po kolei,
  reszta czeka w kolejce (najwyżej 30, najstarsza wypada); moderacja usuwa też wiadomości z kolejki; zdarzenia
  nie czekają. Czas życia wiadomości liczy się od pokazania.
- Konfigurator: sekcja „Zdarzenia i spokojny czat”, przyciski testowych zdarzeń (włączają zdarzenia, jeśli są
  wyłączone), „Zalew czatu (20)”, testy odpowiedzi i punktów, dodatki „Zdarzenia na czacie” i „Spokojny czat”
  w szybkim ustawieniu; „Ożyw podgląd” co trzecią wiadomość wysyła zdarzenie.
- Wspólne reguły są w `chat-events.ts` (odczyt zdarzeń, szablony, kolejka `ChatPacer`, CSS); widget SE ma ich kopię.
  Szablony zdarzeń pochodzą z katalogu tłumaczeń i są dzielone na tekst i imiona — nigdy nie są HTML.
  `chat-events.test.tsx` porównuje stronę OBS i natywny widget na tym samym strumieniu zdarzeń.

## Zrealizowany etap 8 — bajery i prostsze ustawianie (2026-11-26)

- **Pasek celu** (`goal`: obserwujący / suby / bitsy / napiwki, `goaltarget`, `goalstart`, `goaltext`): pasek pod
  nagłówkiem napełnia się ze zdarzeń StreamElements, także gdy wiersze zdarzeń są wyłączone. Gift bomb liczy każdy
  sub, powtórzone zdarzenie liczy się raz. Widget SE zaczyna od licznika sesji z `onWidgetLoad`
  (`follower-session`, `subscriber-session`, `cheer-session`, `tip-session`), jeśli StreamElements go poda.
- **Pasek hype** (`hype`, `hypemax`): napełnia się, gdy czat się rozkręca (ostatnie 20 s; wiadomość = 1,
  zdarzenie = 5); pełny pasek pulsuje.
- **Konfetti przy zdarzeniach** (`confetti`): 14 drobinek przelatuje przez nowy wiersz zdarzenia (stały układ,
  ten sam w obu renderach; wyłączone przy `prefers-reduced-motion`).
- **Dźwięki** (`sound`: bez / zdarzenia / zdarzenia i wiadomości, `soundstyle`: dzwonek, pyknięcie, automat,
  cymbałki, `soundvol`): tworzone przez Web Audio z krótkich nut — bez plików, więc widget SE zostaje samodzielny.
  Historia na ekranie przy starcie nie gra; przy zalewie wiadomości „tik” najwyżej co 150 ms.
- **Motywy sezonowe:** Zima, Święta, Halloween, Walentynki.
- **Gotowe zestawy** (krok „Na start” w szybkim ustawieniu): Gry, Rozmowy, Turniej, Podcast, Pionowy stream,
  Spokojny wieczór — układ, wygląd i dodatki jednym kliknięciem; własna lista botów, słowa i teksty zostają
  (pusta lista botów dostaje popularne boty).
- **Styl nie kasuje zachowania:** wybór stylu zmienia tylko wygląd; filtry, boty, zdarzenia, cel, hype i dźwięki
  zostają (`CHAT_BEHAVIOUR_FIELDS`).
- **Sprawdzenie ustawień:** panel pod podglądem wykrywa typowe problemy (słaby kontrast, przezroczysty czat bez cienia,
  bardzo mały tekst, pusty nagłówek, zdarzenia bez rodzajów, konfetti bez zdarzeń, zbyt szybkie znikanie, cisza przy
  głośności 0, cel osiągnięty na starcie, czat zasłaniający kamerkę, widoczne boty) i naprawia każdy jednym kliknięciem
  albo wszystkie naraz.
- **Szukaj opcji** w trybie „Wszystkie opcje”: zostają i otwierają się tylko sekcje z pasującym tekstem (bez polskich
  znaków, np. „dzwiek”); wyczyszczenie przywraca listę.
- Logika: `chat-events.ts` (cel, hype, konfetti), `chat-sound.ts`, `chat-setup-check.ts`, `chat-quick-setup.ts`
  (zestawy); testy w `chat-gadgets.test.tsx`.

## Kierunek następnych etapów

1. **Animacja tekstu wiadomości:** wejście znakami/słowami, maska reveal,
   podkreślenia i wyróżnienie nowej wiadomości (bez migotania starych).
2. **Opcjonalne dodatki wizualne:** iskry, konfetti, elektryczne obramowanie,
   niewielki glow wokół nowej wiadomości. Efekty ze 104-elementowej galerii
   są inspiracją lub przyszłym źródłem warstw, nie globalnym tłem czatu.
3. **Kolejka i priorytety z PR #8:** kolejka czatu i pierwszeństwo zdarzeń są w etapie 7;
   zostają testy rAF, awatary i dynamiczne podpisy.
4. **Wspólny panel diagnostyki:** zapis/replay anonimowej sekwencji zdarzeń
   i porównania A/B, bez ściągania prywatnych danych widzów.
5. **Ręczne OBS/StreamElements QA** i dopiero po nim publikacja.

## Granice prac

- Nie zmieniamy backendu, API turniejów ani danych turniejowych.
- Nie dokonujemy automatycznego merge `main` lub PR #8 bez
  rozwiązania nakładających się zmian.
- Nie uruchamiamy produkcyjnego wdrożenia Replit.
