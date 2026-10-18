# Test na prawdziwym telefonie lub tablecie

R7 zawiera gotowy APK Android ARM64/IL2CPP. Podczas tej rundy `adb devices -l` nie wykryło podłączonego urządzenia. Nie wykonano instalacji ani testu sprzętowego. Emulacja dotyku w przeglądarce nie potwierdza działania na Androidzie/iOS.

Najkrótszy test bez instalowania APK:

1. Na Windows wybierz oba decki, MULTIPLAYER → CREATE GAME → SAME WI-FI / LAN → CREATE GAME.
2. Skopiuj COPY LAN JOIN LINK i otwórz na telefonie/tablecie w tej samej sieci. Zachowaj cały katalog Windows wraz z WebRoot. Uruchomiony host udostępnia stronę lokalnie; gościnne Wi-Fi izolujące urządzenia może blokować tę drogę.
3. Sprawdź pion i poziom, przewijanie dziewięciu kul, BALL DETAILS oraz celowanie. Drugi palec, obrócenie ekranu i przełączenie aplikacji powinny anulować przerwane celowanie bez oddania strzału.
4. Wykonaj po jednym legalnym strzale P1 i P2. Porównaj tury, kule i HP baz na obu urządzeniach. Klient ma widzieć wynik hosta, a nie prowadzić własną fizykę.
5. Rozłącz P2 i dołącz ponownie. Zamknij hosta: telefon ma wrócić do możliwości połączenia lub gry lokalnej.

Android natywny: przenieś `Builds/Android/CoreClash.apk` na urządzenie ARM64 z Androidem 8/API26 lub nowszym i zainstaluj jako własny build testowy. Podpis jest testowy; publikacja w sklepie nie jest przygotowana. Nie zmieniaj globalnych zabezpieczeń telefonu dla innych aplikacji. Testuj te same kroki i kontroluj wstrzymanie/wznowienie aplikacji.

Internet po publikacji HTTPS: Windows tworzy INTERNET; telefon używa kodu/linku. Powtórz strzały i powrót po utracie hosta najpierw w jednej sieci, potem z telefonem na danych komórkowych. Nie zamykaj Windows podczas zwykłego meczu — migracja hosta nie jest zaimplementowana.

Zanotuj model urządzenia, system/przeglądarkę, orientację, płynność i wynik każdego kroku. Obecna lista granic: Android na sprzęcie, Safari/iPhone/iPad, rzeczywisty tablet, inne NAT oraz duże opóźnienia/utrata pakietów — NOT TESTED.
