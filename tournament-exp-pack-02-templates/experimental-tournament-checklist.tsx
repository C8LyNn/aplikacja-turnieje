import { useEffect, useState } from "react";
import { CheckSquare, ExternalLink, RotateCcw, Square } from "lucide-react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { tournamentHref } from "@/features/experimental-tournaments/experimental-tournament-routing";

const ITEMS = [
  { id: "config", label: "Konfiguracja turnieju sprawdzona", detail: "Nazwa, format, maksymalna liczba graczy, domyślne BO i widoczność są poprawne." },
  { id: "players", label: "Lista uczestników gotowa", detail: "Sprawdź nicki, seedy i ewentualny import CSV przed rozpoczęciem etapu." },
  { id: "stages", label: "Etapy i przepływ uczestników sprawdzone", detail: "Zweryfikuj kolejność etapów, formaty, koszyki i qualification routing." },
  { id: "readiness", label: "Readiness nie zgłasza blokującego problemu", detail: "Decyzję o gotowości bierze istniejąca logika turniejowa — checklista jej nie zastępuje." },
  { id: "security", label: "Dostęp organizatora i wsparcia sprawdzony", detail: "Upewnij się, że właściwe osoby mają odpowiednie poświadczenia." },
  { id: "audience", label: "Widok widzów sprawdzony", detail: "Zweryfikuj LIVE, klasyfikację, drabinkę i długie nazwy na docelowym ekranie." },
  { id: "backup", label: "Backup wykonany przed wydarzeniem", detail: "Pełny eksport zmniejsza ryzyko utraty konfiguracji przy błędzie operacyjnym." },
  { id: "dryrun", label: "Próbny mecz zapisany i cofnięty", detail: "Przetestuj zapis wyniku, konflikt/revision handling oraz korektę wyniku." },
] as const;

function storageKey(tournamentId: number) { return `tm_exp_checklist_${tournamentId}_v1`; }
function readChecked(tournamentId: number): Set<string> {
  try { const raw = localStorage.getItem(storageKey(tournamentId)); return raw ? new Set(JSON.parse(raw) as string[]) : new Set(); }
  catch { return new Set(); }
}
function writeChecked(tournamentId: number, checked: Set<string>) {
  try { localStorage.setItem(storageKey(tournamentId), JSON.stringify([...checked])); } catch {}
}

export function ExperimentalTournamentChecklist({ open, onClose, tournamentId, tournamentName }: {
  open: boolean; onClose: () => void; tournamentId: number; tournamentName?: string;
}) {
  const [checked, setChecked] = useState<Set<string>>(() => readChecked(tournamentId));
  useEffect(() => { if (open) setChecked(readChecked(tournamentId)); }, [open, tournamentId]);
  const done = ITEMS.filter((item) => checked.has(item.id)).length;
  const pct = Math.round((done / ITEMS.length) * 100);

  const toggle = (id: string) => setChecked((current) => {
    const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); writeChecked(tournamentId, next); return next;
  });
  const reset = () => { const empty = new Set<string>(); setChecked(empty); writeChecked(tournamentId, empty); };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="flex max-h-[86vh] max-w-xl flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b px-5 pb-3 pt-5">
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" aria-hidden="true" />
            Checklista wydarzenia
          </DialogTitle>
          <DialogDescription className="leading-5">
            {tournamentName ? `„${tournamentName}” · ` : ""}{done}/{ITEMS.length} ({pct}%). To pomoc operacyjna, nie źródło reguł turnieju.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-2 overflow-y-auto px-5 py-3">
          {ITEMS.map((item) => {
            const active = checked.has(item.id);
            return (
              <button key={item.id} type="button" aria-pressed={active} onClick={() => toggle(item.id)}
                className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${active ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:bg-muted/30"}`}>
                {active ? <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> : <Square className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                <span className="min-w-0">
                  <span className={`block text-sm font-semibold ${active ? "text-muted-foreground line-through" : ""}`}>{item.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.detail}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t px-5 py-3">
          <Button variant="ghost" size="sm" onClick={reset}><RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />Resetuj</Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild><Link href={tournamentHref(tournamentId, true, "?tab=stages")}>Etapy</Link></Button>
            <Button variant="outline" size="sm" asChild><Link href={tournamentHref(tournamentId, true, "/audience")}><ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />Widok widzów</Link></Button>
            <Button size="sm" onClick={onClose}>Zamknij</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
