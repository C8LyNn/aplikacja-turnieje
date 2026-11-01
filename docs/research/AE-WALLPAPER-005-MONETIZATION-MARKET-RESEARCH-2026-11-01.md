# AE-WALLPAPER-005 — Animated Effects: analiza komercjalizacji CAŁEGO produktu

Data: **2026-11-01** · Status: **RESEARCH / BUSINESS DECISION INPUT**  
Projekt: **C8LyNn/aplikacja-turnieje → artifacts/animated-effects**  
Połączone: [issue #274](https://github.com/C8LyNn/aplikacja-turnieje/issues/274), [Draft PR #273](https://github.com/C8LyNn/aplikacja-turnieje/pull/273), [source recovery #152](https://github.com/C8LyNn/aplikacja-turnieje/issues/152).

> Wniosek: **Tak, można próbować zarabiać.** Istnieją płatne paczki animowanych overlayów i płatne narzędzia dla streamerów. Nie ma jednak w dostępnych danych dowodu popytu na ten konkretny projekt, jego płatnej konwersji ani rentowności. Najpierw test rynku, potem inwestycja w pełne SaaS. Nie wyciągać prognoz sprzedaży z samych liczb streamerów.

## 1. Zakres produktu i obecne możliwości

Badany moduł to **całe Animated Effects**, a nie tylko przyszłe planety:
- edytor efektów i warstw, kolory/intensywność, biblioteka modułów i wariantów;
- timeline, keyframes/motion, podgląd, undo/redo, zapisywane pliki scen \`.aescene.json\`;
- StreamElements widget HTML/CSS/JS, symulowane triggery follow/sub/raid/message, alert queue, diagnostyka;
- PNG/GIF / batch-GIF w kodzie przez \`html-to-image\` i \`gifenc\`;
- przyszły (NOT IMPLEMENTED w audytowanym źródle): zaawansowany 3D Three.js + WebGL2, offline Windows wallpaper, WebM/MP4, Android native wallpaper.

**Dowód repo:** \`artifacts/animated-effects/src/editor/preview.ts\`, \`src/editor/exportPanel.ts\`, \`src/media/mediaExport.ts\`, \`src/animation/previewTransport.ts\`, \`src/scenes/scenes.ts\` na \`codex/animated-effects-scene-portability-export-kit\`. Dostępna gałąź nie jest potwierdzoną kopią aktualnego R1 z Replit (zobacz #152). Czytanie kodu ≠ test OBS/release.

**Obecna słabość rynkowa:** ZIP StreamElements w badanym kodzie zawiera \`widget.html\`, \`widget.css\`, \`widget.js\`; README wymaga ich ręcznego wklejenia do trzech zakładek w Custom Widget. Konkurenci oferują szybkie instalatory lub one-click setup. Tę barierę trzeba zmniejszyć przed płatnym launch.

## 2. Rynek: dowody i przeciwwagi (dane zweryfikowane 2026-11-01)

| Podmiot / sygnał | Obserwacja ze źródła | Wniosek |
|---|---|---|
| StreamElements | darmowe alerty, nakładki i edytor; Custom Widgets z kodem HTML/CSS/JS | **Konkurent darmowy** — nie można opierać całej płatnej wartości na podstawowym widget editor |
| OWN3D Pro | Widget Pass **7 €/m**, Stream Pass **14 €/m** | Sygnał realnego modelu subskrypcyjnego, ale bez dowodu liczby jego płacących użytkowników |
| Nerd or Die | pakiety overlay **$10**, komplet/source **$20–$30**; wybrane stream packs **$30** | Potwierdzona kategoria płatnych produktów jednorazowych |
| Etsy | katalog 5 000+ wyników „custom stream overlays”; wiele ofert z cenami kilku–kilkudziesięciu dolarów, custom także drożej | Mocna konkurencja i presja cenowa; **wielkość katalogu i oceny nie są liczbą transakcji** |
| Streamlabs Ultra | oficjalny FAQ: **$27/m**, **$189/rok**; osobna strona przedstawia inne promocje/roczne oferty | Potwierdza istnienie płatnych narzędzi, lecz pakiet obejmuje dużo więcej niż efekty |
| Wallpaper Engine | cena **$4.99**, własny edytor i darmowy Workshop | **Słaby pomysł**: płatny abonament wyłącznie na tapety; bardzo mocna oferta substytucyjna |
| Lively Wallpaper | darmowy i open source, obsługuje web/video/shadery | Warto dostarczać eksport do Lively, **nie sprzedawać** pod pozorem opłaty za Lively |
| TwitchTracker | w VIII 2026 szacunkowo **6 734 353 aktywnych kanałów** na Twitchu w miesiącu | Potencjalny szeroki rynek, ale **nie SAM / TAM płacących**, brak współczynnika zainteresowania i skłonności do płacenia |

Zastrzeżenia: różne zakresy produktowe, waluty i promocje; brak danych o płacących użytkownikach Animated Effects, ARPU, LTV, kosztach pozyskania lub rynku docelowym. To jest analiza konkurencji i plan walidacji, **nie inwestorska prognoza rynku**.

### Pierwotne źródła
1. StreamElements free: https://streamelements.com/
2. StreamElements Custom Widget: https://docs.streamelements.com/overlays/custom-widget
3. OWN3D pricing: https://hi.own3d.pro/en/pricing/
4. Nerd or Die pack example: https://nerdordie.com/product/stealth/
5. Nerd or Die $30 pack example: https://nerdordie.com/product/amused-stream-pack/
6. Etsy category: https://www.etsy.com/market/custom_stream_overlays
7. Streamlabs Ultra Polish FAQ: https://streamlabs.com/pl-pl/faq
8. Steam Wallpaper Engine: https://store.steampowered.com/app/431960/Wallpaper_Engine/?l=polish
9. Lively: https://www.livelywallpaper.io/
10. TwitchTracker: https://twitchtracker.com/statistics

## 3. Segmenty i za co faktycznie zapłacą

| Segment | Problem | Produkt, który ma szansę się sprzedać | Główne ryzyko |
|---|---|---|---|
| Mały/średni streamer Twitch, YouTube, Kick | chce wyglądać profesjonalnie, nie zna After Effects | „stream pack” i szybkie ustawianie wariantów w kilka kliknięć | konkurencja darmowa i tanie paczki |
| VTuber i streamer niszowy | chce dopasować estetykę do avatara | animowane alerts, tła, frame, chat, bramki wejścia; własne barwy | konieczność wyjątkowego stylu, support hostów |
| Montażysta / twórca short-form | potrzebuje alpha/transparent video i grafiki 9:16 | pętle, particle overlays, transition packs, eksport MP4/WebM z QA | konkurencja Canva/CapCut/stock marketplaces; ograniczenia exportu |
| Grafik / mikroagencja | powtarzalne projekty dla klientów, workflow | zapis edytowalnych scen, batch export, wiele formatów, jasna licencja komercyjna | oczekiwania SLA i dostępu zespołowego |
| Miłośnik tapet | ciekawa personalizowana scena na pulpit | tematyczne sceny / web wallpaper, one-time packs | Wallpaper Engine + Workshop i Lively gratis; niska skłonność do abonamentu |
| Klient indywidualny B2B | branding eventów i transmisji | spersonalizowane animacje/wdrożenie | ręczna praca, trudność skalowania |

Najbardziej obiecujący **pierwszy niszowy przypadek**: streamer chce własny, spójny **zestaw alertów + starting soon + BRB + overlay**, dopasowany do barw kanału, bez wiedzy technicznej. Nie konkurować liczbą funkcji z darmowym SE, tylko **czasem do gotowego efektu i jakością szablonów**.

## 4. Modele przychodu — ocena

| Model | Proponowana cena testowa (nie obowiązujący cennik) | Argument ZA | Ryzyko / termin |
|---|---|---|---|
| Freemium podstawy + płatne presety | **$9–$29 za zestaw** | zgodny z aktualnym rynkiem i łatwy w testowaniu; jednorazowy zakup | zacząć jako pierwszy |
| Custom pack / usługa | **$79–$249 za zlecenie** | można sprzedać przed rozbudową SaaS; weryfikuje realne potrzeby | koszt ludzkiego czasu; limitować zakres |
| Pro miesięczny | **$7–$10/mies.** lub roczna zniżka | powtarzalny przychód, jeśli są aktywni twórcy | wysoki churn, niska powtarzalność tworzenia; wprowadzić dopiero po retencji |
| Pakiety eksportowe / kredyty | **$5–$15** za jednorazowy pakiet eksportów lub pro features | dla użytkownika tworzącego okazjonalnie | ryzyko tarcia i obchodzenia paywalla przez nagrywanie ekranu |
| Licencja Studio/agency | indywidualnie, np. **$49–$149/rok** (test) | wyższa wartość za batch export, team seats, prawa wykorzystania | nie sprzedawać funkcji, których nie ma |
| Marketplace twórców | prowizja, np. 15–25% (hipoteza) | efekt sieciowy/UGC | trust & safety, licencje, moderacja, zwroty — **nie w MVP** |

**Wariant rekomendowany:** darmowy, sprawny edytor + kilka darmowych eksportów/szablonów, płatne **wyjątkowe paczki efektów / kolekcje tematyczne** oraz usługi custom; później abonament, ale tylko gdy wskaźniki retencji go uzasadnią.

Użytkownik powinien zachować eksportowane pliki i prawo ich używania zgodnie z licencją po zakończeniu abonamentu; lock-in nie powinien być obietnicą wartości.

### Sugerowany podział darmowe / płatne

**Free:** edytowanie, zapis/wczytywanie własnych scen, 2D starter pack, podstawowy test SE, użycie niekomercyjne/komercyjne do własnego streamu (jasna licencja), brak agresywnych znaków wodnych utrudniających podgląd.  
**Płatne:** tematyczne premium kolekcje (30 wyjątkowych efektów, nie drobne recolory), pakiety gotowych scen/alertów, dłuższy eksport/wysokie rozdzielczości po wdrożeniu video, warianty brandingu, zaawansowane preset 3D po prawdziwym release; ewentualne prawa agencyjne lub batch presets.  
**Nie wyświetlać płatnej funkcji jako dostępnej** zanim renderer/eksport i support są przetestowane na obsługiwanym systemie.

## 5. Rachunek opłacalności — jawne scenariusze, NIE prognoza

Założenie porównawcze: sprzedajemy paczkę za **$19**, korzystając z Lemon Squeezy jako Merchant of Record, stawka standardowa **5% + $0.50** za transakcję (dodatkowe opłaty możliwe). W **uproszczonym scenariuszu ceny bazowej przed ewentualnymi podatkami od sprzedaży**:

\`przychód = liczba_sprzedaży × $19\`  
\`po_podstawowej_opłacie = liczba_sprzedaży × ($19 - $19 × 5% - $0.50) = liczba_sprzedaży × $17.55\`

| Liczba paczek w miesiącu | Sprzedaż brutto przed podatkami od sprzedaży | Po nominalnej opłacie transakcyjnej | Co pominięto |
|---:|---:|---:|---|
| 10 | $190 | **$175.50** | VAT/sales tax, zwroty, support, marketing, własna praca, hosting |
| 50 | $950 | **$877.50** | jw. |
| 100 | $1,900 | **$1,755.00** | jw. |
| 200 | $3,800 | **$3,510.00** | jw. |
| 500 | $9,500 | **$8,775.00** | jw.; 500 sprzedaży/mies. wymaga realnego kanału marketingowego |

**To nie jest kwota "na rękę".** Jeśli $19 jest ceną końcową z VAT/sales tax, kwota podlegająca rozliczeniu jest niższa; opłaty dodatkowe, zwroty, podatki sprzedawcy, reklamy i koszty wytworzenia jeszcze bardziej ją pomniejszą. **Brak danych, aby oszacować prawdopodobieństwo dowolnego wiersza**.

### Wrażliwość na konwersję i pozyskanie

Hipotetyczna oferta: **3,000 kwalifikowanych odwiedzin landing page/mies.**, **2% zakupów** daje **60 sprzedaży**.
- Przychód bazowy: \`60 × $19 = $1,140\`.
- Po standardowej opłacie LS: \`60 × $17.55 = $1,053\`.
- Przy **płatnym CAC = $10 za klienta**: \`60 × $10 = $600\` kosztów reklamy, zostaje tylko **$453** przed VAT/income tax, zwrotami, supportem i kosztami developmentu.
- Jeśli rzeczywista konwersja wyniesie 0.5% zamiast 2% przy tej samej liczbie odwiedzin, będzie **15 sprzedaży**, czyli tylko **$263.25** po standardowej opłacie przed kosztami.

**Abonament**: 100 klientów × $9/m = $900 MRR bazowego; po 5% + $0.50 od każdego płatnego cyklu ~**$805**, przed resztą kosztów i churn. Wartość nie może opierać się na jednorazowym pobraniu jednego pakietu; potrzebny powód, by płacić co miesiąc.

**Ograniczenie porównań MoR:** Lemon Squeezy pobiera VAT/sales tax jako merchant of record, lecz podatek dochodowy po stronie polskiego sprzedawcy i legalność formy działalności to osobny temat. Sprawdzić tabelę opłat dla kraju, metody płatności i wypłat.

Źródła płatności:
- Lemon Squeezy: https://www.lemonsqueezy.com/pricing
- Lemon Squeezy dodatkowe opłaty: https://docs.lemonsqueezy.com/help/getting-started/fees
- Gumroad: https://gumroad.com/pricing (10% + $0.50 dla direct, 30% marketplace; help opisuje również processing)
- Stripe PL: https://stripe.com/en-pl/pricing (przykładowo 1.5% + 1 zł za standardowe karty EOG; Stripe nie zastępuje automatycznie Merchant of Record)
- Ko-fi shop: https://help.ko-fi.com/hc/en-us/articles/360002506494-Does-Ko-fi-take-a-fee (5% plus przetwarzanie płatności)

## 6. Co ma największą wartość: funkcje i priorytety

| Priorytet | Funkcja / usprawnienie | Dlaczego ważne komercyjnie | Gate |
|---|---|---|---|
| P0 | 5–10 atrakcyjnych, *spójnych* kompletów streamowych zamiast 100 drobnych animacji | nabywca kupuje efekt finalny, nie katalog parametrów | kilka testowanych z realnymi streamerami |
| P0 | Prosty „export/install to OBS/SE” z prawdziwą instrukcją, bez fałszywego one-click | skraca frustrację i obniża zwroty; dziś ręczne wklejanie 3 plików | E2E w SE i OBS |
| P0 | podgląd dokładnie zgodny z runtime (alerty, sceny, loop, captions) | spójny efekt po zakupie = zaufanie | target visual regression PASS |
| P0 | licencja treści, legalny checkout, pobieranie paczki bez konta (jeśli możliwe) | najniższe tarcie przy pierwszej transakcji | compliance i test checkout |
| P1 | landing z osadzonymi działającymi demonstracjami 15–30 sek. | darmowy ruch z YouTube/TikTok i dowód jakości | mierzone wejście → demo → checkout |
| P1 | pakiety: gaming, cyberpunk, VTuber, minimalistyczne, fantasy, sci-fi | test rzeczywistych nisz i cen | 2–3 płatne pakiety przed rozbudową |
| P2 | Three.js WebGL2 / planet pack / zaawansowane 3D | silne wizualne wyróżnienie, ale duży koszt | dopiero po osobnym technicznym POC i dowodzie popytu |
| P2 | video/alpha 9:16, offline HTML, Wallpaper | powiększa zastosowania poza streaming | po prawdziwym wsparciu eksportu i QA |
| P3 | SaaS billing / subskrypcje / marketplace / B2B | skalowanie przy dowiedzionym popycie i retencji | NIE budować przed walidacją |

Uwaga: nie skupiać całego marketingu na "efektach 3D". Dla kupującego wartość to *kanał wygląda lepiej i działa w 5 minut*. Kosmiczne planety mogą być mocnym demo premium, ale nie zastąpią sprawnego podstawowego eksportu.

## 7. Test rynku: mały eksperyment zamiast wielkiej przebudowy

### Sprint 1 — jakość produktu i oferta (do wykonania, nie wykonano)
- Wybrać **3 wartościowe pakiety**, każdy w postaci kompletnego, charakterystycznego wyglądu: np. Neon Gaming, Minimal Streamer, Cosmic/Vtuber.
- Każdy z nich: realny podgląd, spójny kolor, alerts + starting/BRB + overlay, przetestowana paczka instalacyjna.
- Zrobić ofertę free demo, płatnego pakietu $9 / $19 / $29 i usług custom $99; można uruchomić **jednorazowy preorder** tylko przy jasnym oznaczeniu, co istnieje, co jest na zamówienie, jakie są warunki realizacji i zwrotów.
- Żadnej deklaracji, że 3D/MP4 działa, dopóki nie ma wdrożenia.

### Sprint 2 — pierwsi użytkownicy
- 10–15 rozmów z aktywnymi streamerami (Twitch/YouTube/Kick) z pokazaniem faktycznego demo; zbierać osobno feedback bezpłatny i gotowość do zakupu.
- Opublikować 5–10 krótkich klipów pokazujących tworzenie gotowej sceny, a nie sam edytor.
- Działająca strona oferty z wydarzeniami: \`landing_view\`, \`demo_start\`, \`scene_created\`, \`export_started\`, \`export_completed\`, \`checkout_start\`, \`purchase_completed\`, \`refund\`.
- Bezpieczny lejek z rozróżnieniem ruchu organicznego, poleceń i płatnych reklam.

### Sprint 3 — decyzja
Proponowane **progi eksperymentalne**, nie normy rynkowe:
- Do 30 dnia: co najmniej **10 prawdziwych płatnych zakupów** z grupy niebędącej znajomymi oraz **30 ukończonych eksportów bez wsparcia autora**, żeby wykazać podstawowe działanie i zainteresowanie.
- Do 60–90 dnia: co najmniej **20–30 płatnych klientów łącznie**, refund rate <5% i powtarzalna ścieżka pozyskania; sprawdzać faktyczny koszt supportu i marżę po reklamach.
- **Sygnał NO-GO**: użytkownicy lubią demo, ale nie kupują, wymagają manualnej instalacji albo koszt pozyskania przekracza marżę po opłatach.
- **Sygnał rozbudowy**: pierwsza seria płatnych klientów kupuje drugi zestaw lub prosi o eksport do kolejnej platformy; potem badać subskrypcję.

Nie traktować progów jako magicznej granicy sukcesu — analizować źródła ruchu, jakość kupujących i liczbę ofert. Zakupy znajomych nie są tym samym co potwierdzony niezależny popyt.

## 8. Koszty i ryzyka po stronie dostawcy

1. **Marketing i dystrybucja**: prawdopodobnie większe wyzwanie niż dodanie kolejnego shader effect. SEO, YouTube/TikTok, partnerstwa z mikrostreamerami, afiliacja tylko po obliczeniu CAC.
2. **Support techniczny**: OBS, StreamElements, wersje CEF/Chromium, różne rozdzielczości, przeklejanie kodu; niepełny eksport zwiększa liczbę zgłoszeń i refundów.
3. **Hosting/render**: lokalny eksport przez JS/Three/WebGL/Browser może mieć małe koszty marginalne. Renderowanie MP4 na serwerze zwiększa koszty, storage, abuse, retencję danych i privacy; nie uruchamiać bez pomiarów.
4. **Licencje**: kupione modele/stock/assets i muzyka nie zawsze wolno odsprzedawać jako edytowalne zasoby w paczce. Weryfikacja licencji per asset. Nie sugerować praw do brandingu StreamElements/OBS/Twitch.
5. **Podatki i prawo**: VAT na treści cyfrowe w UE, przepisy konsumenckie (prawo odstąpienia dla digital goods wymaga precyzyjnego checkout consent), polityka prywatności/regulamin, chargebacks.
6. **Polska**: wg aktualnej strony Biznes.gov.pl od 2026 limit przychodów działalności nierejestrowej wynosi **10 813,50 zł / kwartał** (z dodatkowymi warunkami, w tym brak działalności w ostatnich 60 mies.). To nie jest automatyczne pozwolenie na każdy model SaaS lub sprzedaż globalną; przed realną sprzedażą zweryfikować stan prawny i indywidualną sytuację ze specjalistą.
7. **Merchant of Record**: Lemon Squeezy/Gumroad deklarują obsługę podatków od transakcji jako sprzedawcy formalni; to **nie zastępuje rozliczenia dochodu i innych obowiązków polskiego twórcy**.
8. **Wallpaper**: podstawowe tapety są darmowe w Lively/Workshop i tanie w Wallpaper Engine; traktować to jako **kanał dystrybucji i funkcję bonusową**, nie główny silnik przychodów na początku.

Prawo / podatki:
- https://biznes.gov.pl/pl/firma/zakladanie-firmy/chce-wiedziec-jak-zalozyc-wlasna-firme/dzialalnosc-nierejestrowa-oraz-inne-sytuacje-w-ktorych-nie-trzeba-rejestrowac-firmy
- https://europa.eu/youreurope/business/finance-and-tax/vat/one-stop-shop/index_pl.htm
- https://europa.eu/youreurope/citizens/consumers/shopping/returns/index_en.htm

## 9. Decyzje, które ma podjąć koordynator / owner

| ID | Decyzja | Propozycja | Przed wdrożeniem wymagane |
|---|---|---|---|
| M0 | Czy wolno rozpocząć eksperyment komercyjny przed zamknięciem source sync #152? | można pracować nad ofertą i research, **nie wdrażać code/checkout do kanonicznej produkcji** | owner GO i source authority |
| M1 | Pierwszy segment | Twitch/YouTube streamer — gotowy 3-scenowy pack | 10+ wywiadów / odzew na demo |
| M2 | Pierwsza płatna oferta | pakiet $19 one-time, test wariantów $9/$29 | licencje, QA, dostawa |
| M3 | Abonament | HOLD do danych o retencji / repeat purchases | cohort 30/60/90 days |
| M4 | Payment provider | porównać Lemon Squeezy vs Gumroad vs Stripe PL | podatki i checkout UX |
| M5 | Pixel 3D / wideo / Wallpaper | mocny roadmap i demka, ale **nie blokuje pierwszego produktu** | ROI i POC techniczne |
| M6 | Global czy Polska? | EN-first dla rynku streamers + PL translation | landing localization, VAT |
| M7 | Definicja sukcesu | płatne zakupy i aktywacje, nie wejścia na stronę | instrumentacja i analiza kanałów |

**Rekomendowane GO:** sprawdzić rynek 3 premium paczek + jedno zamówienie custom, bez kosztownej infrastruktury i rozbudowanego systemu abonamentów.  
**Rekomendowane HOLD:** zaawansowany Marketplace, aplikacja Android, globalny hosting video i system revenue share do chwili, gdy pojawią się płatne transakcje i dowody retencji.

## 10. Weryfikacja / status

- Źródła cen i zasad: publiczne strony oficjalne, weryfikowane **2026-11-01**, promocje/cenniki mogą się zmienić.
- Status Animated Effects: analiza kodu repo, brak testów uruchomieniowych w tym researchu.
- Obecni płacący klienci / rzeczywisty przychód / koszt pozyskania / retencja: **UNKNOWN**.
- Wszelkie kwoty ofert i scenariusze to **hipotezy do sprawdzenia**, nie cennik wdrożony ani prognoza.
- GitHub branch: docs-only; **no merge, no production, no checkout, no new users affected**.
