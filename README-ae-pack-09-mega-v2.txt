Animated Effects Pack 09 Mega V2
===================================

Ta wersja zastępuje pierwszą paczkę Pack 09.

Naprawia:
- błąd: "Nie znaleziono importu Pack08 UI."
- częściową instalację pozostawioną przez pierwszą próbę
- potencjalną pętlę MutationObserver w panelu "Charakter efektu"

WAŻNE:
Jeżeli stary ae-pack-09-mega.mjs już zakończył się błędem,
niczego ręcznie nie cofaj. V2 wykryje częściowy stan,
przywróci stan sprzed pierwszej próby z .ae-pack-backup
i dopiero potem wykona czystą instalację.

INSTALACJA:
1. Rozpakuj cały ZIP.
2. Skopiuj WSZYSTKIE pliki do:
   C:\Users\kubap\Documents\GitHub\aplikacja-turnieje-live

3. Uruchom:
   node .\ae-pack-09-mega-v2.mjs

4. Potem:
   pnpm --filter animated-effects run typecheck

5. Jeśli PASS:
   pnpm --filter animated-effects run build

Nie uruchamiaj już starego ae-pack-09-mega.mjs.
