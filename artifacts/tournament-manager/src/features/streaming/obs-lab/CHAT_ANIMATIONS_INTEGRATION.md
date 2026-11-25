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

## Kierunek następnych etapów

1. **Animacja tekstu wiadomości:** wejście znakami/słowami, maska reveal,
   podkreślenia i wyróżnienie nowej wiadomości (bez migotania starych).
2. **Opcjonalne dodatki wizualne:** iskry, konfetti, elektryczne obramowanie,
   niewielki glow wokół nowej wiadomości. Efekty ze 104-elementowej galerii
   są inspiracją lub przyszłym źródłem warstw, nie globalnym tłem czatu.
3. **Kolejka i priorytety z PR #8:** synchronizacja z natywnym widgetem,
   testy flood/rAF, awatary i dynamiczne podpisy.
4. **Wspólny panel diagnostyki:** zapis/replay anonimowej sekwencji zdarzeń
   i porównania A/B, bez ściągania prywatnych danych widzów.
5. **Ręczne OBS/StreamElements QA** i dopiero po nim publikacja.

## Granice prac

- Nie zmieniamy backendu, API turniejów ani danych turniejowych.
- Nie dokonujemy automatycznego merge `main` lub PR #8 bez
  rozwiązania nakładających się zmian.
- Nie uruchamiamy produkcyjnego wdrożenia Replit.
