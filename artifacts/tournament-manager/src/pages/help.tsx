import { Layout } from "@/components/layout";
import {
  BookOpen, Play, RotateCcw, Download, Upload, Clock, AlertTriangle,
  CheckCircle2, Monitor, Shield, Users, Swords, HelpCircle,
} from "lucide-react";
import { useId, useState } from "react";

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ icon, title, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const sectionId = useId();
  const buttonId = `${sectionId}-button`;
  const panelId = `${sectionId}-panel`;
  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      <h2 className="text-base font-semibold">
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="text-primary shrink-0" aria-hidden="true">{icon}</span>
          <span className="flex-1">{title}</span>
          <span className="text-muted-foreground text-sm" aria-hidden="true">{open ? "▲" : "▼"}</span>
        </button>
      </h2>
      {open && (
        <div id={panelId} role="region" aria-labelledby={buttonId} className="px-5 pb-5 pt-1 border-t text-sm text-muted-foreground space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {n}
      </div>
      <div className="text-foreground/80">{children}</div>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 items-start bg-yellow-500/8 border border-yellow-500/20 rounded-lg px-3 py-2.5">
      <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
      <span className="text-yellow-300/80 text-xs">{children}</span>
    </div>
  );
}

function Good({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 items-start bg-green-500/8 border border-green-500/20 rounded-lg px-3 py-2.5">
      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
      <span className="text-green-300/80 text-xs">{children}</span>
    </div>
  );
}

export default function HelpPage() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-primary" /> Instrukcja obsługi
            </h1>
            <p className="text-sm text-muted-foreground">Krok po kroku — jak przygotować i poprowadzić turniej.</p>
          </div>
        </div>

        <Section icon={<Users className="w-5 h-5" />} title="1. Przygotowanie turnieju" defaultOpen>
          <div className="space-y-2">
            <Step n={1}>
              Kliknij <strong>Nowy turniej</strong> na dashboardzie i uzupełnij:
              nazwę, opis (opcjonalnie), format (polecamy <em>Drabinka eliminacyjna</em> dla 1v1),
              maksymalną liczbę graczy (np. 32) i domyślny format meczów (BO1 / BO3 / BO5 / BO7).
            </Step>
            <Step n={2}>
              Przejdź do zakładki <strong>Gracze</strong> i dodaj zawodników.
              Możesz dodawać ręcznie lub wczytać plik CSV. Format CSV:
              <code className="block bg-muted px-3 py-2 rounded text-xs mt-1.5 text-foreground font-mono whitespace-pre">
{`name,seed,rank
Alpha,1,Immortal
Bravo,2,Divine
Charlie,,Ancient`}
              </code>
              Kolumna <code>name</code> (lub <code>nick</code>) jest wymagana. Pozostałe opcjonalne.
            </Step>
            <Step n={3}>
              <strong>Rozstawienie (seed):</strong> jeśli chcesz, żeby najlepsi gracze nie grali ze sobą
              w pierwszej rundzie, przypisz im numerki seed (1 = najlepszy).
              Aplikacja automatycznie ułoży drabinkę wg standardu:
              seed 1 vs ostatni, seed 2 vs przedostatni, itd.
              Jeśli nie zależy Ci na rozstawieniu — nie wypełniaj pola seed.
            </Step>
            <Step n={4}>
              Ustaw <strong>hasło organizatora</strong> podczas tworzenia nowego turnieju.
              Dostęp dla obsługi i widzów konfiguruj osobno; sam link do turnieju nie jest hasłem.
            </Step>
            <Step n={5}>
              Kliknij <strong>Wystartuj turniej</strong> — aplikacja wygeneruje drabinkę,
              harmonogram Round Robin albo pierwszą rundę Swiss i zablokuje listę graczy.
            </Step>
            <Tip>Sprawdź drabinkę w zakładce Drabinka zanim zaczniesz grę — po wystartowaniu nie można już edytować listy graczy.</Tip>
          </div>
        </Section>

        <Section icon={<Play className="w-5 h-5" />} title="2. Prowadzenie meczów">
          <div className="space-y-2">
            <Step n={1}>
              Otwórz <strong>Panel prowadzącego</strong> z poziomu turnieju.
              Zaloguj się hasłem organizatora lub uprawnioną sesją obsługi.
              W starszych turniejach może być dostępny dotychczasowy kod prowadzącego.
            </Step>
            <Step n={2}>
              Kliknij <strong>Rozpocznij</strong> dla aktywnego meczu.
              Mecz zmienia status na LIVE i pojawia się na widoku widzów.
            </Step>
            <Step n={3}>
              Klikaj <strong>+</strong> / <strong>-</strong> przy każdym zawodniku, by aktualizować wynik.
              Format BO1/BO3/BO5/BO7 możesz zmienić przyciskami w nagłówku meczu przed jego rozpoczęciem.
            </Step>
            <Step n={4}>
              Po osiągnięciu pełnego progu serii kliknij <strong>Zakończ rozegrany mecz</strong>.
              Dla BO3 poprawne wyniki to 2:0 albo 2:1. W eliminacjach zwycięzca automatycznie awansuje.
            </Step>
            <Step n={5}>
              Jeśli zawodnik <strong>nie pojawił się</strong> (walkower): użyj przycisku <strong>W.O.</strong>
              i wybierz zwycięzcę. Walkower jest osobnym rozstrzygnięciem i nie zapisuje sztucznego score 1:0.
            </Step>
            <Step n={6}>
              Mecze możesz <strong>przełożyć</strong> (znikają z kolejki, wróć do nich później)
              albo oznaczyć jako <strong>no contest</strong> w formacie, który pozwala zakończyć mecz bez zwycięzcy.
            </Step>
            <Good>Wynik można cofnąć, dopóki nie rozpoczęto zależnego meczu lub kolejnej rundy. Systemowego bye nie cofa się ręcznie.</Good>
            <Tip>Po zakończeniu wszystkich meczów rundy aplikacja automatycznie zaproponuje przejście do następnej rundy (dla Swiss). Dla drabinki eliminacyjnej kolejne mecze wypełniają się automatycznie.</Tip>
          </div>
        </Section>

        <Section icon={<Monitor className="w-5 h-5" />} title="3. Widok widzów (projektor)">
          <div className="space-y-2">
            <Step n={1}>
              Przejdź do <strong>Widok widzów</strong> (link /audience) — pełnoekranowy widok
              zaprojektowany do wyświetlania na projektorze lub dodatkowym monitorze.
            </Step>
            <Step n={2}>
              Widok odświeża się automatycznie co 4 sekundy.
              Pokazuje: bieżący mecz LIVE, klasyfikację lub bilans, ostatnie wyniki i nadchodzące mecze.
            </Step>
            <Step n={3}>
              Możesz <strong>wyróżnić konkretny mecz</strong> (gwiazdka ★ w panelu prowadzącego),
              żeby zawsze był widoczny na górze ekranu widzów.
            </Step>
            <Step n={4}>
              Link /bracket pokazuje pełną drabinkę — przydatny jako drugi widok.
              Kliknij ikonę ⛶ aby wejść w tryb pełnoekranowy.
            </Step>
            <Good>Widok widzów nie ma żadnych przycisków edycji — można go bezpiecznie wyświetlić publiczności.</Good>
          </div>
        </Section>

        <Section icon={<RotateCcw className="w-5 h-5" />} title="4. Co zrobić przy pomyłce">
          <div className="space-y-2">
            <Step n={1}>
              <strong>Błędny wynik:</strong> kliknij <em>Cofnij wynik</em> przy zakończonym meczu
              albo użyj <em>Cofnij</em> w górnym pasku. Mecz wróci do stanu oczekującego, a jego historia pozostanie w audycie.
            </Step>
            <Step n={2}>
              <strong>Cofnięcie działa tylko o 1 akcję w tył.</strong> Jeśli popełniłeś kilka błędów pod rząd,
              cofaj je kolejno — każde cofnięcie odsłania poprzednią akcję.
            </Step>
            <Step n={3}>
              <strong>Cofnąłeś za dużo?</strong> Przejdź do zakładki <em>Log akcji</em>,
              znajdź właściwy mecz i ponownie zatwierdź wynik.
            </Step>
            <Step n={4}>
              <strong>Coś poszło bardzo nie tak?</strong> Sprawdź dostępny backup (patrz sekcja niżej).
              Import zgodnego pliku V2 tworzy nowy turniej; import eksportu V3 jest obecnie wyłączony.
            </Step>
            <Tip>
              Jeśli cofasz wynik i zwycięzca już grał kolejny mecz —
              musisz najpierw cofnąć wynik tego kolejnego meczu, dopiero potem poprzedniego.
            </Tip>
          </div>
        </Section>

        <Section icon={<Download className="w-5 h-5" />} title="5. Backup i przywracanie">
          <div className="space-y-2">
            <Step n={1}>
              W panelu turnieju wybierz <strong>Eksport backupu</strong> i zachowaj plik JSON.
              Eksport V3 jest dostępny, ale <strong>import V3 jest wyłączony</strong>.
            </Step>
            <Step n={2}>
              Rób backup <strong>po każdej rundzie</strong> i zawsze przed przerwą lub zakończeniem turnieju.
            </Step>
            <Step n={3}>
              <strong>Import V2:</strong> wybierz <em>Import backupu</em> i wczytaj zgodny plik V2.
              Serwer weryfikuje plik przed utworzeniem nowego turnieju. Eksportu V3 nie można tam wczytać.
            </Step>
            <Good>Chroń pliki backupu: mogą zawierać dane zawodników, mecze i historię turnieju.</Good>
            <Tip>Po imporcie V2 sprawdź aktualne uprawnienia i ustaw nowe dane dostępu. Nie traktuj backupu jako kopii aktywnych sesji.</Tip>
          </div>
        </Section>

        <Section icon={<Swords className="w-5 h-5" />} title="6. Szybki start — turniej Deadlock 1v1">
          <div className="space-y-2">
            <p className="text-foreground/80">Sprawdzony przepis na turniej 1v1:</p>
            <div className="bg-muted/30 rounded-lg px-4 py-3 space-y-1.5 text-xs text-foreground/70">
              <div>✅ Format: <strong>Drabinka eliminacyjna</strong></div>
              <div>✅ Maks. graczy: <strong>32</strong></div>
              <div>✅ Domyślny format meczu: <strong>BO3</strong> (lub BO1 dla szybszego turnieju)</div>
              <div>✅ Model wyniku: <strong>series_v1</strong> — rezultat oznacza wygrane gry lub mapy, a mecz wyłania zwycięzcę.</div>
              <div>✅ Losowanie przez import CSV bez seedów = losowe pary R1</div>
              <div>✅ Backup po każdej rundzie</div>
            </div>
            <Step n={1}>
              Użyj przycisku <strong>Dane testowe</strong> na dashboardzie, żeby sprawdzić aplikację
              przed prawdziwym turniejem — tworzy gotowy turniej z przykładowymi graczami.
            </Step>
            <Good>Przetestuj pełny przebieg (wyniki, cofnięcie, backup, import) na danych testowych zanim zaczną grać prawdziwi zawodnicy.</Good>
          </div>
        </Section>

        <Section icon={<Shield className="w-5 h-5" />} title="7. Bezpieczeństwo i dostęp do turnieju">
          <div className="space-y-2">
            <Step n={1}>
              W nowych turniejach chroń <strong>hasło organizatora</strong>.
              Konta lub sesje obsługi przyznawaj tylko zaufanym osobom.
            </Step>
            <Step n={2}>
              Hasło i sesja dostępu to różne rzeczy. Na współdzielonym urządzeniu
              wyloguj się po zakończeniu pracy i nie pozostawiaj otwartego panelu organizatora.
            </Step>
            <Step n={3}>
              Widok widzów jest przeznaczony do odczytu. Jeśli ustawiono hasło widza,
              odbiorca musi się uwierzytelnić. Nie zakładaj, że każdy widok jest publiczny.
            </Step>
            <Tip>Nie udostępniaj haseł organizatora lub obsługi. Adres panelu nie powinien zastępować weryfikacji uprawnień.</Tip>
          </div>
        </Section>

        <div className="text-center pt-2 pb-6">
          <p className="text-xs text-muted-foreground">
            TM_SYS · Pytania? Zajrzyj do panelu prowadzącego lub sprawdź zakładkę Asystent w szczegółach turnieju.
          </p>
        </div>
      </div>
    </Layout>
  );
}
