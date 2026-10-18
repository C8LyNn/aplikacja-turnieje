# Podłączenie Core Clash do Unity Cloud

Internet i LAN używają tego samego kodu rozgrywki. LAN nie wymaga konta Unity Cloud. Sesje internetowe potrzebują prawdziwego identyfikatora projektu oraz dostępu do Authentication i Multiplayer / Relay.

1. Otwórz https://cloud.unity.com/ i zaloguj się samodzielnie.
2. Wybierz **Home → Projects → Create project**. Nazwa: **Core Clash V149**. Ustaw pole dotyczące dzieci (COPPA) zgodnie z rzeczywistym przeznaczeniem gry; nie wybieramy tej deklaracji automatycznie.
3. Po utworzeniu otwórz **Settings → Project Details** i skopiuj **Project ID**. To publiczny identyfikator; nie przesyłaj haseł, tokenów ani kluczy.
4. Otwórz lokalny projekt w Unity 6000.4.0f1. W menu **Core Clash → Internet multiplayer setup** znajdziesz skróty do Dashboard i ustawień Services.
5. W **Edit → Project Settings → Services** wybierz **Use an existing Unity project ID**, swoją organizację, projekt i **Link project ID**.
6. W Dashboard sprawdź dostęp do Authentication i Multiplayer / Relay. Jeżeli Unity poprosi o warunki konta, konfigurację organizacji lub plan usług, wykonaj te czynności samodzielnie i sprawdź warunki przed zatwierdzeniem.
7. Zbuduj ponownie wszystkie platformy. Muszą zawierać ten sam Project ID oraz tę samą wersję protokołu i danych gry.
8. Test: Windows tworzy grę przez **Internet**, podaje kod / link, druga osoba dołącza z WebGL lub Androida. Sprawdź strzały obu graczy, zmianę tur, odłączenie i ponowne utworzenie sesji. Powtórz poza wspólną siecią Wi-Fi.

Gdy WebGL zostanie umieszczone na Twojej stronie HTTPS, wpisz jego rzeczywisty adres do `Assets/Resources/Data/network-settings.json`, w polu `browserGameUrl`, i przebuduj grę. Wtedy Windows może generować internetowy link z `joinCode`. Bez tego adresu host udostępnia kod pokoju. Lokalny link LAN nie jest internetowym adresem gry.

`Tools/cloud-status.ps1` sprawdza wyłącznie lokalny publiczny identyfikator. Nie potwierdza dostępu do usług ani działającego meczu internetowego. Nie dopisujemy przykładowego identyfikatora do projektu.

Dokumentacja Unity: https://docs.unity.com/en-us/services/getting-started oraz https://docs.unity.com/en-us/cloud/projects/create-project.
