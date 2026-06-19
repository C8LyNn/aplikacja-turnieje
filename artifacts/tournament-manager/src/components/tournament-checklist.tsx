import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckSquare, Square, RotateCcw, ExternalLink } from "lucide-react";
import { Link } from "wouter";

const ITEMS = [
  { id: "create", label: "Turniej utworzony z poprawną nazwą i formatem", detail: "Sprawdź: format, maksymalna liczba graczy, BO1/BO3/BO5" },
  { id: "players", label: "Gracze dodani / zaimportowani przez CSV", detail: "Min. 2 graczy. CSV: kolumna 'name' wymagana, 'seed' opcjonalnie" },
  { id: "seeding", label: "Rozstawienie sprawdzone (lub pominięte świadomie)", detail: "Seed 1 zagra z najsłabszym, seed 2 z przedostatnim — albo dodaj graczy bez seedów (losowe pary)" },
  { id: "start", label: "Turniej uruchomiony (przycisk Wystartuj)", detail: "Generuje drabinkę. Po starcie nie można już edytować listy graczy" },
  { id: "bracket", label: "Drabinka wygląda poprawnie w zakładce Drabinka", detail: "Sprawdź czy pary w R1 są prawidłowe, bye-y na właściwych miejscach" },
  { id: "code", label: "Kod prowadzącego ustawiony", detail: "Panel → przycisk Kod. Bez kodu każdy z linkiem /host ma pełny dostęp" },
  { id: "audience", label: "Widok widzów sprawdzony na projektorze", detail: "Link /audience. Odświeża co 4s. Brak przycisków edycji — bezpieczny do wyświetlenia" },
  { id: "livetest", label: "Mecz testowy: wynik wpisany i cofnięty", detail: "Wpisz dowolny wynik → Zatwierdź → Cofnij wynik. Sprawdź że działa undo" },
  { id: "postpone", label: "Przełożenie i przywrócenie meczu przetestowane", detail: "Przełóż mecz → pokaż się w sekcji Przełożone → Przywróć" },
  { id: "walkover", label: "Walkover przetestowany (W.O.)", detail: "Kliknij W.O. → wybierz zwycięzcę → sprawdź czy awansuje w drabince" },
  { id: "backup_export", label: "Backup wyeksportowany", detail: "Dashboard → najedź na kartę turnieju → ikona ↓. Sprawdź że plik JSON się pobiera" },
  { id: "backup_import", label: "Import backupu przetestowany", detail: "Szczegóły turnieju → zakładka Przegląd → Import backupu. Tworzy kopię turnieju" },
  { id: "refresh", label: "Strona odświeżona (F5) — dane zachowane", detail: "Odśwież przeglądarkę i sprawdź że turniej i mecze są nadal widoczne. Kod prowadzącego wymaga ponownego wpisania" },
];

function storageKey(tournamentId: number) {
  return `tm_checklist_${tournamentId}`;
}

function loadChecked(tournamentId: number): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(tournamentId));
    if (raw) return new Set(JSON.parse(raw));
  } catch {
  }
  return new Set();
}

function saveChecked(tournamentId: number, checked: Set<string>) {
  try {
    localStorage.setItem(storageKey(tournamentId), JSON.stringify([...checked]));
  } catch {
  }
}

interface Props {
  open: boolean;
  onClose: () => void;
  tournamentId: number;
  tournamentName?: string;
}

export function TournamentChecklist({ open, onClose, tournamentId, tournamentName }: Props) {
  const [checked, setChecked] = useState<Set<string>>(() => loadChecked(tournamentId));

  useEffect(() => {
    if (open) setChecked(loadChecked(tournamentId));
  }, [open, tournamentId]);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveChecked(tournamentId, next);
      return next;
    });
  };

  const reset = () => {
    setChecked(new Set());
    saveChecked(tournamentId, new Set());
  };

  const done = ITEMS.filter((i) => checked.has(i.id)).length;
  const total = ITEMS.length;
  const pct = Math.round((done / total) * 100);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-primary" />
            Checklista przedturniejowa
          </DialogTitle>
          <DialogDescription>
            {tournamentName ? `„${tournamentName}" · ` : ""}
            <span className={done === total ? "text-green-400 font-medium" : ""}>
              {done}/{total} ({pct}%)
            </span>
            {done === total && <span className="text-green-400 font-medium"> — Gotowy do startu! 🏆</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2">
          {ITEMS.map((item) => {
            const isChecked = checked.has(item.id);
            return (
              <button
                key={item.id}
                className={`w-full text-left rounded-lg border px-4 py-3 flex items-start gap-3 transition-colors hover:bg-muted/30 ${
                  isChecked ? "border-primary/30 bg-primary/5" : "border-border bg-card"
                }`}
                onClick={() => toggle(item.id)}
              >
                <div className="shrink-0 mt-0.5">
                  {isChecked
                    ? <CheckSquare className="w-4 h-4 text-primary" />
                    : <Square className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${isChecked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {item.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.detail}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t flex items-center justify-between gap-3 shrink-0">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={reset}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Resetuj
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/help">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Instrukcja
              </Link>
            </Button>
            <Button size="sm" onClick={onClose}>Zamknij</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
