import { t } from "@/i18n";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckSquare, Square, RotateCcw, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { normalizeChecklistSelection } from "@/lib/checklist-selection";

const ITEMS = [
  { id: "create", get label() { return t("tournamentChecklist.turniej_utworzony_z_poprawna_nazwa"); }, get detail() { return t("tournamentChecklist.sprawdz_format_maksymalna_liczba_graczy"); } },
  { id: "players", get label() { return t("tournamentChecklist.gracze_dodani_zaimportowani_przez_csv"); }, get detail() { return t("tournamentChecklist.min_2_graczy_csv_kolumna"); } },
  { id: "seeding", get label() { return t("tournamentChecklist.rozstawienie_sprawdzone_lub_pominiete_sw"); }, get detail() { return t("tournamentChecklist.seed_1_zagra_z_najslabszym"); } },
  { id: "start", get label() { return t("tournamentChecklist.turniej_uruchomiony_przycisk_wystartuj"); }, get detail() { return t("tournamentChecklist.generuje_drabinke_harmonogram_round_robi"); } },
  { id: "bracket", get label() { return t("tournamentChecklist.pary_i_rundy_wygladaja_poprawnie"); }, get detail() { return t("tournamentChecklist.sprawdz_drabinke_lub_harmonogram_rozstaw"); } },
  { id: "organizer_access", get label() { return t("tournamentChecklist.dostep_organizatora_zabezpieczony"); }, get detail() { return t("tournamentChecklist.w_panelu_bezpieczenstwa_ustaw_haslo"); } },
  { id: "audience", get label() { return t("tournamentChecklist.widok_widzow_sprawdzony_na_projektorze"); }, get detail() { return t("tournamentChecklist.link_audience_odswieza_co_4s"); } },
  { id: "livetest", get label() { return t("tournamentChecklist.mecz_testowy_pelny_wynik_serii"); }, get detail() { return t("tournamentChecklist.dla_bo3_wpisz_2_0"); } },
  { id: "postpone", get label() { return t("tournamentChecklist.przelozenie_i_przywrocenie_meczu_przetes"); }, get detail() { return t("tournamentChecklist.przeloz_mecz_pokaz_sie_w"); } },
  { id: "walkover", get label() { return t("tournamentChecklist.walkower_przetestowany_w_o"); }, get detail() { return t("tournamentChecklist.wybierz_zwyciezce_i_sprawdz_awans"); } },
  { id: "backup_export_v3", get label() { return t("tournamentChecklist.eksport_backupu_v3_sprawdzony"); }, get detail() { return t("tournamentChecklist.wyeksportuj_backup_i_zweryfikuj_w"); } },
  { id: "backup_import", get label() { return t("tournamentChecklist.import_v2_przetestowany_na_danych"); }, get detail() { return t("tournamentChecklist.import_v3_jest_wylaczony_jesli"); } },
  { id: "refresh", get label() { return t("tournamentChecklist.strona_odswiezona_f5_dane_zachowane"); }, get detail() { return t("tournamentChecklist.odswiez_przegladarke_i_sprawdz_czy"); } },
];

const VALID_ITEM_IDS = ITEMS.map(({ id }) => id);

function storageKey(tournamentId: number) {
  return `tm_checklist_${tournamentId}`;
}

function loadChecked(tournamentId: number): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(tournamentId));
    return normalizeChecklistSelection(raw, VALID_ITEM_IDS);
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
            {t("tournamentChecklist.checklista_przedturniejowa")}</DialogTitle>
          <DialogDescription>
            {tournamentName ? `„${tournamentName}" · ` : ""}
            <span className={done === total ? "text-green-400 font-medium" : ""}>
              {done}/{total} ({pct}%)
            </span>
            {done === total && <span className="text-green-400 font-medium"> {t("tournamentChecklist.lista_sprawdzona_gotowosc_etapu_sprawdz")}</span>}
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
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> {t("tournamentChecklist.resetuj")}</Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/help">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> {t("tournamentChecklist.instrukcja")}</Link>
            </Button>
            <Button size="sm" onClick={onClose}>{t("tournamentChecklist.zamknij")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
