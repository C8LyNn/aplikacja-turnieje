import { t } from "@/i18n";
/**
 * V5.8 · component catalog (Experimental only): the shared pieces of the tournament screens in their states,
 * under any appearance set. A preview — switching a set here never saves it; leaving restores your own.
 * Built from the real components (no copies), so a change that breaks a state or a theme shows here first.
 */
import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CircleDot, Inbox, Loader2, PenLine, RefreshCw } from "lucide-react";
import type { LiveStageStandings } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { LiveTable } from "@/components/stage-live-tables";
import { SetScoreEditor } from "@/components/set-score-editor";
import {
  ExperimentalMetricCard,
  ExperimentalStatePanel,
  ExperimentalStatusPill,
} from "@/features/experimental-tournaments/experimental-ui";
import {
  applyExperimentalAppearance,
  DEFAULT_EXPERIMENTAL_APPEARANCE,
  EXPERIMENTAL_APPEARANCE_FAMILIES,
  EXPERIMENTAL_APPEARANCE_PRESETS,
  normalizeExperimentalAppearance,
  readExperimentalAppearance,
} from "@/features/experimental-tournaments/experimental-appearance";

const SET_RULES = { version: 1, kind: "sets", setsToWin: 2, pointsPerSet: 11, winBy: 2 } as const;

const TABLE: LiveStageStandings = {
  stageId: 1, format: "round_robin", status: "active", final: false,
  leagueRules: { version: 1, allowDraws: true, points: { win: 3, draw: 1, loss: 0 }, tieBreakers: ["head_to_head", "score_difference", "scored", "wins"] },
  get rulesSummary() { return t("uiCatalog.punktacja_zwyciestwo_3_pkt_remis"); },
  matchRules: null, get matchRulesSummary() { return t("uiCatalog.jedna_gra_remis_mozliwy"); },
  advancingPlaces: 2,
  tables: [{
    groupId: null, get label() { return t("uiCatalog.tabela"); }, matchesPlayed: 6, matchesTotal: 12,
    rows: [
      { playerId: 1, get playerName() { return t("uiCatalog.wilki_polnocy_druzyna_o_bardzo"); }, rank: 1, played: 3, wins: 2, draws: 1, losses: 0, points: 7, scoreFor: 6, scoreAgainst: 2, diff: 4, buchholz: null, decidedBy: "points", zone: "advance" },
      { playerId: 2, get playerName() { return t("uiCatalog.lwy"); }, rank: 2, played: 3, wins: 2, draws: 0, losses: 1, points: 6, scoreFor: 5, scoreAgainst: 3, diff: 2, buchholz: null, decidedBy: "points", zone: "advance" },
      { playerId: 3, get playerName() { return t("uiCatalog.orly"); }, rank: 3, played: 3, wins: 1, draws: 1, losses: 1, points: 4, scoreFor: 3, scoreAgainst: 4, diff: -1, buchholz: null, decidedBy: "points", zone: null },
      { playerId: 4, get playerName() { return t("uiCatalog.sokoly"); }, rank: 4, played: 3, wins: 0, draws: 0, losses: 3, points: 0, scoreFor: 1, scoreAgainst: 6, diff: -5, buchholz: null, decidedBy: "points", zone: null },
    ],
  }],
} as unknown as LiveStageStandings;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="experimental-catalog-section rounded-xl border p-4">
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function ExperimentalUiCatalog() {
  const { toast } = useToast();
  const [preset, setPreset] = useState<string>("");
  const [sets, setSets] = useState([{ score1: 11, score2: 7 }, { score1: 9, score2: 11 }]);
  // Leaving the catalog restores the user's own appearance (the preview is never saved).
  useEffect(() => () => applyExperimentalAppearance(readExperimentalAppearance()), []);
  const preview = (id: string) => {
    setPreset(id);
    const found = EXPERIMENTAL_APPEARANCE_PRESETS.find((entry) => entry.id === id);
    applyExperimentalAppearance(found ? normalizeExperimentalAppearance({ ...DEFAULT_EXPERIMENTAL_APPEARANCE, ...found.values }) : readExperimentalAppearance());
  };
  return (
    <Layout>
      <div className="organizer-workspace flex flex-col gap-4" data-testid="ui-catalog">
        <div className="organizer-header flex flex-col gap-2">
          <h1 className="text-2xl font-bold">{t("uiCatalog.katalog_komponentow")}</h1>
          <p className="text-sm text-muted-foreground">{t("uiCatalog.stany_wspolnych_elementow_pod_kazdym")}</p>
          <div role="group" aria-label={t("uiCatalog.podglad_zestawu")} className="flex flex-wrap gap-1.5">
            <button type="button" className="experimental-wizard-chip" aria-pressed={preset === ""} onClick={() => preview("")}>{t("uiCatalog.moj_wyglad")}</button>
            {EXPERIMENTAL_APPEARANCE_FAMILIES.flatMap((family) => EXPERIMENTAL_APPEARANCE_PRESETS.filter((entry) => entry.family === family.id)).map((entry) => (
              <button key={entry.id} type="button" className="experimental-wizard-chip" aria-pressed={preset === entry.id} onClick={() => preview(entry.id)}>{entry.label}</button>
            ))}
          </div>
        </div>

        <Section title={t("uiCatalog.przyciski")}>
          <div className="flex flex-wrap items-center gap-2">
            <Button>{t("uiCatalog.glowna_akcja")}</Button>
            <Button variant="outline">{t("uiCatalog.druga_akcja")}</Button>
            <Button variant="ghost">{t("uiCatalog.ciche_dzialanie")}</Button>
            <Button disabled>{t("uiCatalog.niedostepne")}</Button>
            <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />{t("uiCatalog.zapisywanie")}</Button>
            <Button variant="destructive">{t("uiCatalog.usun")}</Button>
            <button type="button" className="experimental-v4-btn">{t("uiCatalog.przycisk_panelu")}</button>
            <button type="button" className="experimental-v4-btn" data-variant="ghost">{t("uiCatalog.przycisk_drugorzedny")}</button>
          </div>
        </Section>

        <Section title={t("uiCatalog.stany_i_komunikaty")}>
          <div className="flex flex-wrap gap-2">
            <ExperimentalStatusPill tone="live">{t("uiCatalog.na_zywo")}</ExperimentalStatusPill>
            <ExperimentalStatusPill tone="warning">{t("uiCatalog.mecze_gotowe")}</ExperimentalStatusPill>
            <ExperimentalStatusPill tone="success">{t("uiCatalog.zakonczony")}</ExperimentalStatusPill>
            <ExperimentalStatusPill tone="danger">{t("uiCatalog.wymaga_uwagi")}</ExperimentalStatusPill>
            <ExperimentalStatusPill tone="neutral">{t("uiCatalog.planowany")}</ExperimentalStatusPill>
            <Badge>{t("uiCatalog.aktywny")}</Badge><Badge variant="secondary">{t("uiCatalog.zakonczony")}</Badge><Badge variant="outline">{t("uiCatalog.szkic")}</Badge>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <p role="status" className="organizer-notice organizer-notice--success rounded-lg border border-primary/30 p-3 text-sm text-primary">{t("uiCatalog.zapisano_18_42_wilki_lwy")}</p>
            <div role="alert" className="organizer-notice organizer-notice--error rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <p className="font-semibold">{t("uiCatalog.operacja_nie_powiodla_sie")}</p><p className="mt-1">{t("uiCatalog.sesja_wygasla_nic_nie_zostalo")}</p>
            </div>
            <section aria-label={t("uiCatalog.konflikt_zapisu_wyniku")} className="organizer-notice rounded-lg border border-orange-500/50 bg-orange-500/10 p-3 text-sm">
              <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" aria-hidden="true" />{" "}{t("uiCatalog.wynik_nie_zostal_zapisany")}</p>
              <p className="mt-1">{t("uiCatalog.mecz_zmienil_sie_w_miedzyczasie")}</p>
              <Button variant="outline" size="sm" className="mt-2"><RefreshCw className="mr-1 h-3.5 w-3.5" aria-hidden="true" />{t("uiCatalog.odswiez_dane")}</Button>
            </section>
            <p role="status" className="organizer-notice organizer-notice--pending flex items-center gap-2 text-sm text-primary"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{t("uiCatalog.ladowanie_meczow")}</p>
            <ExperimentalStatePanel title={t("uiCatalog.brak_meczow")} description={t("uiCatalog.mecze_pojawia_sie_po_rozpoczeciu")} icon={Inbox} />
            <ExperimentalStatePanel title={t("uiCatalog.nie_udalo_sie_pobrac_danych")} description={t("uiCatalog.sprawdz_polaczenie_i_sprobuj_ponownie")} icon={AlertTriangle} tone="danger" />
          </div>
        </Section>

        <Section title={t("uiCatalog.liczniki")}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <ExperimentalMetricCard label={t("uiCatalog.na_zywo")} tone="live" value={2} meta={t("uiCatalog.mecze_w_trakcie")} icon={Activity} />
            <ExperimentalMetricCard label={t("uiCatalog.czeka_na_wynik")} tone="danger" value={1} meta={t("uiCatalog.dzien_meczu_minal_brak_wyniku")} icon={PenLine} />
            <ExperimentalMetricCard label={t("uiCatalog.start_minal")} tone="warning" value={3} meta={t("uiCatalog.rozpocznij_albo_przeloz")} icon={CircleDot} />
          </div>
        </Section>

        <Section title={t("uiCatalog.formularz")}>
          <div className="grid max-w-xl gap-3">
            <label className="grid gap-1 text-sm">{t("uiCatalog.nazwa_turnieju")}<Input defaultValue="Puchar Wiosny" /></label>
            <label className="grid gap-1 text-sm">{t("uiCatalog.pole_z_bledem")}<Input aria-invalid="true" defaultValue="" placeholder={t("uiCatalog.wpisz_nazwe")} /><span role="alert" className="text-xs text-destructive">{t("uiCatalog.podaj_nazwe_turnieju")}</span></label>
            <label className="grid gap-1 text-sm">{t("uiCatalog.niedostepne")}<Input disabled defaultValue="tylko do odczytu" /></label>
            <div role="radiogroup" aria-label={t("uiCatalog.dlugosc_meczu")} className="experimental-wizard-segments flex flex-wrap gap-1.5">
              <button type="button" role="radio" aria-checked="true" className="experimental-wizard-chip">{t("uiCatalog.jedna_gra")}</button>
              <button type="button" role="radio" aria-checked="false" className="experimental-wizard-chip">{t("uiCatalog.do_2_wygranych")}</button>
              <button type="button" role="radio" aria-checked="false" className="experimental-wizard-chip">{t("uiCatalog.do_3_wygranych")}</button>
            </div>
          </div>
        </Section>

        <Section title={t("uiCatalog.edytor_setow")}>
          <SetScoreEditor rules={SET_RULES} sets={sets} player1Name={t("uiCatalog.zawodnik_z_bardzo_dluga_nazwa")} player2Name="Ada" onChange={setSets} />
        </Section>

        <Section title={t("uiCatalog.tabela_wynikow")}>
          <LiveTable table={TABLE.tables[0]!} data={TABLE} />
        </Section>

        <Section title={t("uiCatalog.dialog_i_powiadomienia")}>
          <div className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild><Button variant="outline">{t("uiCatalog.otworz_dialog")}</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("uiCatalog.cofnac_wynik_meczu")}</DialogTitle>
                  <DialogDescription>{t("uiCatalog.ranking_i_awans_zostana_przeliczone")}</DialogDescription>
                </DialogHeader>
                <DialogFooter><Button variant="outline">{t("uiCatalog.zachowaj_wynik")}</Button><Button>{t("uiCatalog.cofnij_wynik")}</Button></DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => toast({ title: t("uiCatalog.wynik_zapisany"), variant: "success" })}>{t("uiCatalog.powiadomienie_sukces")}</Button>
            <Button variant="outline" onClick={() => toast({ title: t("uiCatalog.wynik_niekompletny"), description: t("uiCatalog.brakuje_jednego_seta"), variant: "warning" })}>{t("uiCatalog.powiadomienie_uwaga")}</Button>
            <Button variant="outline" onClick={() => toast({ title: t("uiCatalog.operacja_nie_powiodla_sie"), description: t("uiCatalog.sesja_wygasla"), variant: "destructive" })}>{t("uiCatalog.powiadomienie_blad")}</Button>
          </div>
        </Section>
      </div>
    </Layout>
  );
}
