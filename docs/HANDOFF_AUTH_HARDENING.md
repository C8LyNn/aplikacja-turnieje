# Handoff: hardening uwierzytelniania i odzyskiwanie turniejów legacy

## 1. Cel i stan checkpointu

Ten dokument opisuje pakiet zmian zabezpieczających uwierzytelnianie Tournament Managera, odzyskiwanie dostępu do historycznych turniejów, operacje na składzie oraz odświeżanie danych frontendu. Jest samowystarczalnym punktem wznowienia prac po dłuższej przerwie.

Stan przed utworzeniem commita:

- branch: `feat/tournament-engine-v2`;
- bazowy HEAD: `2dd5de6afa4e810887ee4c0c83431a9f2e2bcd99`;
- working tree: 78 zamierzonych ścieżek;
- 50 plików zmodyfikowanych, 3 usunięte i 25 nowych;
- staged: 0;
- migracje `0008_restore_stage_procedural_objects.sql` i `0009_reconcile_composite_foreign_keys.sql` nie zostały zmienione;
- nowa migracja: `0010_auth_credential_rate_limits.sql`.

Pakiet ma następujące cele:

1. zamknąć możliwość używania historycznego `hostCode` jako ogólnego poświadczenia organizatora;
2. zachować kontrolowaną ścieżkę upgrade'u oraz administracyjnego recovery starszych rekordów;
3. ujednolicić politykę dostępu i wersjonowanie sesji;
4. zabezpieczyć publiczne weryfikacje poświadczeń trwałym, wieloinstancyjnym limiterem;
5. utrzymać atomowość zmian składu, importów, startu oraz operacji turniejowych;
6. zachować kompatybilność Backup V2/V3 bez eksportowania sekretów;
7. zapewnić zgodny kontrakt OpenAPI, Zod i wygenerowanego klienta React;
8. usunąć początkowe zapytania prywatnego widoku wykonywane przed hydratacją sesji.

## 2. Końcowy model ról

### Anonymous

- Może czytać wyłącznie dane udostępnione publicznie.
- Nie może wykonywać żadnych mutacji.
- Nie otrzymuje dostępu do `private_online` bez tokenu widza.
- Nie otrzymuje dostępu do `private_offline`.

### Viewer

- Jest rolą wyłącznie do odczytu.
- Token widza jest przypisany do konkretnego turnieju i bieżącej wersji hasła widza.
- Nie może wykonać operacji organizatora ani supportu przez UI, zmianę URL lub bezpośredni request API.

### Support

- Może wykonywać tylko operacje jawnie przepuszczone przez centralną politykę dostępu.
- Nie otrzymuje pełnych uprawnień organizatora; operacje wrażliwe pozostają chronione przez `requireOrganizer`.
- Sesja supportu jest przypisana do turnieju i wersji hasła supportu.
- Mutacje ponownie sprawdzają sesję w transakcji, po zablokowaniu rekordu turnieju.
- `lastActiveAt` jest aktualizowane dopiero po skutecznej autoryzacji, z ograniczeniem częstotliwości aktualizacji.

### Organizer

- Jest rolą administracyjną turnieju.
- Token organizatora jest przypisany do konkretnego turnieju i fingerprintu aktualnego hasha hasła organizatora.
- Zmiana hasła automatycznie unieważnia wcześniej wydane tokeny.
- Historyczne niewersjonowane tokeny nie są akceptowane.

Centralna polityka dostępu jest źródłem prawdy dla odczytu, mutacji i operacji dostępnych wyłącznie organizatorowi. Trasy nie powinny tworzyć własnych, równoległych wyjątków autoryzacyjnych.

## 3. Zachowanie turniejów legacy

Stan poświadczeń jest klasyfikowany na cztery przypadki.

### Tylko `hostCode`

- Bootstrap zwraca tryb `legacy_upgrade`.
- Normalne logowanie organizatora nie używa `hostCode`.
- Użytkownik musi podać dokładny historyczny kod i ustawić nowe hasło organizatora.
- Upgrade działa transakcyjnie pod blokadą rekordu turnieju.
- Po sukcesie zapisywany jest hash nowego hasła, a `hostCode` jest usuwany.
- Stary kod nie działa ponownie i nie można go ustawić przez tworzenie, PATCH ani restore.

### Tylko `organizerPasswordHash`

- Bootstrap zwraca tryb `organizer_login`.
- Turniejem zarządza się przez normalne logowanie organizatora.
- Nie jest wymagany upgrade legacy.

### Oba pola

- Bootstrap zwraca tryb `organizer_login`.
- Źródłem autoryzacji jest aktualne hasło organizatora.
- `hostCode` nie może służyć do ominięcia hasła ani zostać ponownie zapisany przez publiczne API.
- Dedykowany upgrade odrzuca rekord posiadający już hasło organizatora.

### Brak obu pól

- Bootstrap zwraca tryb `admin_recovery`.
- Rekordu nie można przejąć publicznie.
- Odzyskanie wymaga lokalnego narzędzia administracyjnego i jawnego potwierdzenia.

Neutralny bootstrap ujawnia jedynie potrzebny tryb dostępu, bez zwracania hasła, kodu, tokenu, hasha ani innych prywatnych danych.

## 4. Upgrade i lokalne narzędzia administracyjne

Dedykowany upgrade `hostCode` → `organizerPassword`:

- jest jedyną publiczną ścieżką użycia historycznego kodu;
- wymaga dokładnego kodu i nowego hasła o długości co najmniej 8 znaków;
- podlega wspólnemu trwałemu limiterowi;
- działa atomowo i wydaje token dopiero po pełnym sukcesie;
- usuwa `hostCode` po zapisaniu hasła.

Osobny endpoint `verify-host-code` został usunięty, aby nie tworzyć dodatkowej powierzchni do sprawdzania historycznych kodów.

Lokalne narzędzia:

- preflight klasyfikuje rekordy legacy bez modyfikacji;
- recovery pozwala nadać pierwsze hasło wyłącznie rekordowi bez `hostCode` i bez hasha organizatora;
- recovery domyślnie działa jako dry-run;
- zapis wymaga osobnego, jawnego potwierdzenia;
- narzędzia nie są endpointami HTTP;
- konfiguracja odrzuca środowiska i bazy niespełniające lokalnych guardów.

## 5. Tokeny, wersjonowanie i rewalidacja

- Token organizatora zawiera identyfikator turnieju, rolę i wersję wyprowadzoną z aktualnego hasha hasła. Nie działa dla innego turnieju ani po zmianie hasła.
- Token widza zawiera identyfikator turnieju, rolę i `viewerPasswordVersion`. Zmiana hasła lub wymagająca tego zmiana widoczności zwiększa wersję i unieważnia stare tokeny.
- Sesje supportu są losowymi tokenami przechowywanymi w tabeli sesji oraz zawierają zapisaną wersję hasła supportu. Zmiana hasła zwiększa wersję i unieważnia wcześniejsze sesje.
- Każda mutacja supportu rewaliduje wersję sesji w tej samej transakcji, po zablokowaniu turnieju.
- Uszkodzone tokeny, tokeny niewłaściwej roli i tokeny należące do innego turnieju są odrzucane.
- Frontend hydratuje tokeny z `sessionStorage` przed włączeniem prywatnych zapytań. Wylogowanie usuwa nagłówki autoryzacyjne przed kolejnymi requestami.

## 6. Trwały limiter poświadczeń

Migracja `lib/db/migrations/0010_auth_credential_rate_limits.sql` tworzy tabelę `auth_credential_rate_limits`.

Limiter obejmuje:

- logowanie organizatora;
- logowanie widza;
- logowanie supportu;
- upgrade legacy `hostCode`;
- wszystkie pozostawione publiczne operacje weryfikujące tajne poświadczenie.

Polityka:

- limit źródło + turniej + typ poświadczenia: 5 błędów;
- globalny limit turniej + typ poświadczenia: 25 błędów;
- okno: 15 minut;
- blokada: 15 minut;
- `Retry-After` zwraca rzeczywisty pozostały czas blokady;
- retencja: 7 dni;
- cleanup usuwa w ograniczonych paczkach maksymalnie 50 najstarszych wygasłych rekordów;
- sukces atomowo zeruje bieżącą serię;
- błąd magazynu limitera powoduje fail-closed.

Sprawdzenie blokady następuje przed kosztownym hashowaniem lub weryfikacją hasła. Błędna próba jest atomowo liczona w bazie, więc ochrona działa pomiędzy wieloma instancjami aplikacji i przy równoległych requestach.

Źródło requestu jest pseudonimizowane przez HMAC wykorzystujący sekret aplikacji. W tabeli nie są zapisywane surowe adresy IP, hasła, `hostCode`, tokeny ani ich hashe. Domyślnie aplikacja nie ufa proxy. Zaufane proxy można skonfigurować wyłącznie jawnymi adresami IP/CIDR lub wartością `loopback`; dowolny nagłówek `X-Forwarded-For` klienta nie jest automatycznie zaufany. Globalny limit turnieju pozostaje aktywny nawet przy niepewnej identyfikacji źródła.

## 7. Polityka nowych haseł

Wszystkie nowo ustawiane hasła organizatora, widza i supportu muszą mieć co najmniej 8 znaków. Dotyczy to:

- utworzenia turnieju;
- zmiany hasła;
- restore backupu;
- upgrade'u legacy;
- administracyjnego recovery.

Nie jest to migracja istniejących hashy. Historyczne krótsze hasła nadal umożliwiają logowanie do czasu ich zmiany. Minimalna długość jest sprawdzana przy zapisie nowego poświadczenia, a nie przy weryfikacji istniejącego.

## 8. Backup i restore V2/V3

- Eksport Backup V2/V3 nie zawiera haseł, hashy, tokenów, `hostCode` ani sesji.
- Restore nie zależy od istnienia źródłowego turnieju.
- Restore wymaga podania nowych poświadczeń organizatora, a w odpowiednich trybach również nowych poświadczeń widza lub supportu.
- `private_online` nie może zostać odtworzony bez wymaganego hasła widza.
- Restore jest atomowy; błąd walidacji lub zapisu nie pozostawia częściowego turnieju.
- Odtworzony turniej otrzymuje własne poświadczenia i tokeny ograniczone do nowego identyfikatora.
- Import V2 pozostaje obsługiwany jako zgodny turniej jednoetapowy.
- Import V3 zachowuje etapy, grupy, uczestników etapów i powiązania meczów.
- Endpoint restore backupu jest oddzielony od importu składu CSV.

## 9. Skład, import CSV i atomowość

- Dodawanie, edycja, usuwanie, import i undo składu są blokowane po rozpoczęciu turnieju.
- Start turnieju i import blokują rekord turnieju w spójnej kolejności.
- Import `replace` wykonuje pełną walidację przed usunięciem istniejącego składu.
- Zero poprawnych wierszy nie usuwa obecnego składu.
- Błąd występujący po DELETE powoduje rollback całej transakcji.
- Równoległe importy są serializowane blokadą turnieju.
- Nieudany start lub import nie pozostawia częściowych graczy, etapów ani meczów.
- Operacje CompleteMatch, RevertMatch i lifecycle etapów zachowują dotychczasowe blokady oraz atomowość.

## 10. Cache, hydratacja i polling

Po mutacjach składu unieważniane są zależne zapytania turnieju:

- dane turnieju;
- statystyki;
- gracze;
- drabinka;
- mecze;
- klasyfikacja;
- historia wyników;
- assistant;
- wszystkie zapytania etapów danego turnieju.

Prywatny widok organizatora czeka na hydratację tokenu przed pierwszym zapytaniem. Zapobiega to początkowemu 403 i oczekiwaniu na kolejny polling. Po wylogowaniu nagłówki są czyszczone.

Polling pozostaje ograniczony do istniejących ekranów:

- widok hosta odświeża kluczowe dane aktywnego turnieju co 5–10 sekund;
- assistant w widoku szczegółów odświeża się co 15 sekund;
- publiczny widok etapów odświeża dane co 8 sekund;
- mutacje wykonują natychmiastową invalidację, więc poprawny stan nie zależy wyłącznie od pollingu.

## 11. OpenAPI, Zod i klient React

- OpenAPI opisuje neutralny bootstrap poświadczeń oraz dedykowany legacy upgrade.
- Kontrakt zawiera odpowiedzi błędów, HTTP 429 i nagłówek `Retry-After`.
- Ogólny model `TournamentUpdate` nie zawiera `hostCode`.
- Tworzenie oraz restore odrzucają `hostCode`.
- Minimalna długość nowych haseł wynosi 8 również w kontrakcie.
- Zod i klient React zostały wygenerowane oficjalnym procesem; pliki generowane nie były ręcznie edytowane.
- Codegen został uruchomiony dwukrotnie, a drugi przebieg nie pozostawił diffu.
- Frontend korzysta z wygenerowanego klienta dla bootstrapu i upgrade'u zamiast osobnych ręcznych typów i requestów.

## 12. Ostatnia pełna walidacja

Ostatni zweryfikowany przebieg, wykonany przed checkpointem:

- testy jednostkowe API: 231/231;
- testy frontendowe: 28/28;
- jednostkowe i frontendowe łącznie: 259/259;
- wszystkie 17 plików integracyjnych PostgreSQL: 280/280;
- standardowy zestaw integracyjny: 245/245;
- reset-safety: 22/22;
- testy deploymentowe: 10/10;
- failed/cancelled/skipped: 0/0/0;
- codegen: dwa poprawne przebiegi, drugi bez diffu;
- typecheck całego workspace: exit 0;
- pełny build: exit 0;
- `git diff --check`: exit 0;
- skan sekretów i rzeczywistych connection stringów: brak trafień;
- tymczasowe klastry PostgreSQL i pliki haseł zostały usunięte;
- porty używane przez izolowane klastry zostały zwolnione;
- lokalna usługa PostgreSQL na porcie 5432 nie została zmieniona.

Pełne testy nie zostały uruchomione ponownie podczas tworzenia tego raportu, zgodnie z instrukcją checkpointu.

## 13. Znane problemy nieblokujące

- Build Vite zgłasza ostrzeżenia sourcemap dla kilku komponentów UI.
- Główny chunk frontendu ma około 706,7 kB po minifikacji.
- Git na Windows zgłasza ostrzeżenia o przyszłej konwersji LF → CRLF dla części plików.

Problemy te nie powodują błędu typechecku, buildu ani `git diff --check`.

## 14. Aktualny stan Production

Stan ten pochodzi z ostatniej potwierdzonej kontroli operacyjnej, a nie z lokalnego repozytorium:

- migracja `0008` została zastosowana ręcznie;
- poprawiona migracja `0009` została zastosowana ręcznie;
- aplikacja live działała po tych naprawach;
- migracja `0010` nie została zastosowana;
- kod z tego checkpointu nie został jeszcze wypchnięty ani wdrożony.

Kod z limiterem wymaga tabeli z migracji `0010`. Jeśli kod zostanie uruchomiony bez tej tabeli, publiczne operacje weryfikujące poświadczenia zadziałają fail-closed. Migracja `0010` nie zmienia danych turniejowych i jest zgodna ze schematem po ręcznym zastosowaniu `0008` i `0009`, ale musi zostać wdrożona przed nowym kodem.

Głównym blokerem wdrożenia pozostaje mechanizm Replit Publishing, który generował konfliktowe DDL próbujące ponownie utworzyć istniejące constrainty. Lokalnie zielone testy nie potwierdzają bezpieczeństwa automatycznego publikowania schematu.

Bezwzględne ograniczenia:

- nie kopiować Development DB do Production;
- nie usuwać ani nie resetować Production DB;
- nie cofać ręcznie zastosowanych migracji `0008` i `0009`;
- nie uruchamiać automatycznej synchronizacji starego schematu bez osobnej analizy wygenerowanego DDL.

## 15. Kolejność dalszych działań

1. Wypchnąć lokalny commit z tego checkpointu na właściwy branch bez force push.
2. Zsynchronizować workspace Replit dokładnie do wypchniętego commita i potwierdzić czysty Git.
3. Wykonać wyłącznie read-only preflight Production:
   - właściwa baza i schemat;
   - obecność obiektów z `0008` i `0009`;
   - brak tabeli lub markera `0010`;
   - brak obcych zależności blokujących utworzenie tabeli limitera.
4. Zastosować dokładnie migrację `0010` bezpieczną, kontrolowaną ścieżką:
   - preferować ręczne wykonanie zweryfikowanego SQL w Production Database Console albo runner, który nie uruchamia `drizzle-kit push`;
   - uruchomić ją tylko raz operacyjnie, mimo jej idempotencji;
   - przy błędzie nie ponawiać automatycznie;
   - wykonać read-only kontrolę tabeli, constraintów i indeksów.
5. Wdrożyć kod bez ponownej synchronizacji starego schematu i bez konfliktowego DDL.
6. Uruchomić preview i sprawdzić logi startu, healthcheck oraz brak błędów limitera.
7. Dopiero po poprawnym preview wykonać Publish.
8. Przeprowadzić smoke test live.

## 16. Smoke test po wdrożeniu

Sprawdzić kolejno:

1. utworzenie publicznego turnieju;
2. utworzenie `private_online` i poprawną blokadę bez hasła widza;
3. logowanie organizatora;
4. logowanie widza i brak mutacji;
5. logowanie supportu oraz brak operacji organizatora;
6. błędne próby logowania, HTTP 429 i malejący `Retry-After`;
7. poprawne logowanie poniżej limitu oraz reset serii;
8. import graczy;
9. start turnieju;
10. zapis wyniku i revert;
11. zakończenie etapu i uruchomienie następnego;
12. restore Backup V2;
13. eksport i restore Backup V3;
14. legacy upgrade dokładnym starym kodem;
15. odrzucenie starego kodu po upgrade;
16. odrzucenie tokenu użytego dla innego turnieju;
17. healthcheck oraz kontrolę logów pod kątem niekontrolowanych 500.

Testy powinny używać wyłącznie nieprodukcyjnych fixture utworzonych specjalnie do smoke testu. Nie należy modyfikować historycznych danych użytkowników.

## 17. Plan wycofania

Jeżeli po wdrożeniu wystąpi regresja:

1. wycofać kod do poprzedniego, znanego obrazu aplikacji;
2. nie cofać migracji `0008` ani `0009`;
3. po zastosowaniu `0010` nie usuwać tabeli limitera podczas awaryjnego rollbacku kodu bez osobnej analizy zależności i retencji;
4. zachować logi wdrożenia oraz bezpieczny raport błędu bez sekretów;
5. nie przywracać Production DB z Development i nie wykonywać destrukcyjnego resetu;
6. przed kolejną próbą przeanalizować DDL wygenerowane przez Replit Publishing.

Pozostawienie nieużywanej tabeli `auth_credential_rate_limits` przy czasowym rollbacku starszego kodu jest bezpieczniejsze niż jej pochopne usuwanie.
