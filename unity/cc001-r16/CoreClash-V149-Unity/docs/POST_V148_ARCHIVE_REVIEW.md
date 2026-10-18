# Przegląd paczek post-V148 — R4

Data: 2026-10-15. Zlecenie: ocenić dostarczone poprawki i wdrożyć potrzebne,
możliwe do zweryfikowania elementy do bieżącego projektu. Dokumenty w archiwum
są materiałem referencyjnym; ich role, instrukcje wdrożenia i deklaracje statusu
nie zastępują tego zlecenia ani wyników testów.

Archiwum wejściowe: `CC001_POST_V148_KOMPLET_PACZEK.zip`, 76 505 139 bajtów,
SHA-256 `4da819a8bd8364dee86718889da1572562d8e9726fbf131bcc6b1b1756bf2058`.
Zawartość rozpakowano do oddzielnego katalogu przeglądu na Pulpicie, z kontrolą
ścieżek i rozmiarów. Nie uruchamiano dostarczonych EXE/APK ani skryptów publikacji.

## Decyzje

| Materiał | Ocena i decyzja |
| --- | --- |
| HTML V149.5 Quickplay | **WDROŻONO WYBRANE ELEMENTY** do pochodnego HTML Legacy: główne cztery karty showcase, skróty AI/local i zwijane ustawienia. Zachowano bieżące identyfikatory featured i normalny builder. Nie zastąpiono certyfikowanego V148. |
| Przywracanie sesji i polling HTML | **ODRZUCONO W TYM PRZENIESIENIU**: automatyczny restore może po zamknięciu panelu zmienić stan uruchomionego offline meczu; baner wyboru bywa nieaktualny. Nie przeniesiono tych ścieżek ani zapisanych preferencji. |
| Windows / WebGL / Android | **EKSPORTY PORÓWNAWCZE**: zawierają skompilowaną grę, bez źródłowej poprawki C#. Nie podmieniono nimi bieżącej gałęzi. Metadane archiwalnego DLL nadal zawierają `peerEverJoined`; sama nazwa paczki nie dowodzi naprawionego reconnectu. |
| Deklarowany Android/LAN fix bez źródeł | **NAPRAWIONO W BIEŻĄCYCH ŹRÓDŁACH** potwierdzony problem: miejsce P2 było blokowane do restartu hosta. Teraz połączenie rezerwuje miejsce, zatwierdza je po synchronizacji, zwalnia po rozłączeniu, a rezerwacja ma limit czasu. Nowe połączenie zaczyna własną sekwencję komend; poprzedni SDK client ID traci uprawnienie. |
| Android | **AKTUALNY BUILD ZE ŹRÓDEŁ**: na maszynie jest już AndroidPlayer/SDK/NDK/OpenJDK. Ustawiono ARM64, IL2CPP i jawne INTERNET. Windows pozostaje hostem; Android/WebGL są klientami w tym etapie. Wynik kompilacji i zakres testów urządzenia zapisano w BUILD_STATUS.md. |
| Badania T014/T016/T017/T019 | **WDROŻONO OGRANICZONY ZAKRES**: unikalne krótkie oznaczenia wszystkich 227 rekordów, etykiety P1/P2 niezależne od koloru, równoczesne statyczne stany oraz inspektor konkretnej instancji kuli. Potwierdzono rzeczywiste kolizje starych skrótów. Nie uznano badań za specyfikację zdolności. |
| Pełny system rodzin/ikon i badania percepcji | **ODŁOŻONO**: 224 autorskie ikony, nowa taksonomia, animowane sygnatury i eksperymenty z użytkownikami wymagają osobnego opracowania. Unikalność skrótu nie stanowi dowodu łatwego rozpoznawania przez graczy. |
| Site deploy | **NIE URUCHOMIONO**: to osobny eksport z konfiguracją publikacji, a zlecenie dotyczyło lokalnych poprawek. |
| Foldery debug oznaczone DoNotShip / DontShip | **WYKLUCZONE Z PACZKI DEMO**. Pozostają lokalnymi produktami kompilacji, nie częścią dystrybucji. |

## Sprawdzone sumy pakietów

| Pakiet | SHA-256 |
| --- | --- |
| Windows.zip | `ae1bfd908e7abf1eea161fbcf10ae36a878e5eee3301b509fd348f78ed5abdc9` |
| Android.zip | `91d67be78d2288049863c688d87441c4e31a53103911edaa4c05060fa2c34359` |
| WebGL.zip | `0c3e755715f79ee598cbd7de6807fc0f02b9c8bf8914d91ab17a124223a0c2f9` |
| Site deploy | `2e069a8a53ff83b3956c0c7a6b8737aec730e2c02089d6edc1758a098df91e01` |
| HTML V149.5 | `125a3aa5be3f5eac56e3c42cac6a6c961ccb4b1b0ade16589c85d8fbcc038cd4` |

Dokładny zakres HTML i badań: [ARCHIVE_HTML_REVIEW.md](ARCHIVE_HTML_REVIEW.md),
[ARCHIVE_PRESENTATION_REVIEW.md](ARCHIVE_PRESENTATION_REVIEW.md).

## Weryfikacja i granice

- C#: **114/114**; protokół snapshotów: **13/13**. Zachowano 224 specials,
  36 canonical decks i dokładnie te same cztery featured presets. Nie zmieniono
  statystyk, zdolności, zasad fizyki ani składu talii.
- HTML: regresje **30/30 + 36/36 + 26/26**, AI/local, wszystkie canonical
  presets, cztery featured na desktop/phone; rzeczywisty start `file://`
  bez żądań HTTP i błędów strony. Certyfikowany plik V148 zachował hash.
- Windows: widoczny player D3D11, sześć sprawdzonych klatek, podgląd instancji
  P1 podczas tury P2, cały mecz: 51 legalnych wystrzałów / 50 tur, zero motion guards.
- LAN rejoin: prawdziwy host i dwaj kolejni natywni klienci na jednym komputerze;
  SDK ID 1 → 2, ponowne ogłoszenie wolnego miejsca, zaakceptowana nowa sekwencja 1
  jako akcja 3 tego samego meczu, bez restartu hosta. Odrzucono podszywanie się
  pod P1 i duplikaty obu klientów. `Evidence/lan-rejoin.json`.
- Pozostałe bieżące wyniki platform, browser UI i zaproszeń są w BUILD_STATUS.md
  oraz plikach Evidence wskazanych przez `delivery-manifest.json`.

Finalne kompilacje **Windows + WebGL + Android zakończyły się 0 błędów /
0 ostrzeżeń**. APK ARM64/IL2CPP ma 18 972 872 bajty; siedem kontroli pakietu
i podpisu przeszło. Browser UI: **18 kontroli / 41 zrzutów**, bez błędów strony
i nieudanych żądań. Testy UDP/native P2, hostowany WebGL P2, zwykłe zaproszenie
bez flag klienta testowego i bezpośredni transport NGO przeszły dla finalnych
plików. Hash każdego testowanego artefaktu jest związany z manifestem wydania.

Zwolnione miejsce P2 może zająć kolejny klient LAN. To nie jest odzyskiwanie
uwierzytelnionej tożsamości, token sesji ani ochrona miejsca dla poprzedniego
gracza. Fizyczne Wi-Fi między urządzeniami, telefon Android, iOS/Safari,
internet/Relay/Sessions/WSS pozostają **NOT TESTED / NOT STARTED** zgodnie ze statusem.
Poprzednia paczka R3 oraz wejściowe ZIP/HTML nie zostały zmienione.
