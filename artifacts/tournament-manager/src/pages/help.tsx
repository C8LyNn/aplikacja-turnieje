import { t } from "@/i18n";
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
              <HelpCircle className="w-6 h-6 text-primary" /> {t("help.instrukcja_obslugi")}</h1>
            <p className="text-sm text-muted-foreground">{t("help.krok_po_kroku_jak_przygotowac")}</p>
          </div>
        </div>

        <Section icon={<Users className="w-5 h-5" />} title={t("help.1_przygotowanie_turnieju")} defaultOpen>
          <div className="space-y-2">
            <Step n={1}>
              {t("help.kliknij")}{" "}<strong>{t("help.nowy_turniej")}</strong> {t("help.na_dashboardzie_i_uzupelnij_nazwe")}{" "}<em>{t("help.drabinka_eliminacyjna")}</em> {t("help.dla_1v1_maksymalna_liczbe_graczy")}</Step>
            <Step n={2}>
              {t("help.przejdz_do_zakladki")}{" "}<strong>{t("help.gracze")}</strong> {t("help.i_dodaj_zawodnikow_mozesz_dodawac")}<code className="block bg-muted px-3 py-2 rounded text-xs mt-1.5 text-foreground font-mono whitespace-pre">
{t("help.name_seed_rank_alpha_1")}
              </code>
              {t("help.kolumna")}{" "}<code>{t("help.name")}</code> {t("help.lub")}{" "}<code>{t("help.nick")}</code>{t("help.jest_wymagana_pozostale_opcjonalne")}</Step>
            <Step n={3}>
              <strong>{t("help.rozstawienie_seed")}</strong> {t("help.jesli_chcesz_zeby_najlepsi_gracze")}</Step>
            <Step n={4}>
              {t("help.ustaw")}{" "}<strong>{t("help.haslo_organizatora")}</strong> {t("help.podczas_tworzenia_nowego_turnieju_dostep")}</Step>
            <Step n={5}>
              {t("help.kliknij")}{" "}<strong>{t("help.wystartuj_turniej")}</strong> {t("help.aplikacja_wygeneruje_drabinke_harmonogra")}</Step>
            <Tip>{t("help.sprawdz_drabinke_w_zakladce_drabinka")}</Tip>
          </div>
        </Section>

        <Section icon={<Play className="w-5 h-5" />} title={t("help.2_prowadzenie_meczow")}>
          <div className="space-y-2">
            <Step n={1}>
              {t("help.otworz")}{" "}<strong>{t("help.panel_prowadzacego")}</strong> {t("help.z_poziomu_turnieju_zaloguj_sie")}</Step>
            <Step n={2}>
              {t("help.kliknij")}{" "}<strong>{t("help.rozpocznij")}</strong> {t("help.dla_aktywnego_meczu_mecz_zmienia")}</Step>
            <Step n={3}>
              {t("help.klikaj")}{" "}<strong>+</strong> / <strong>-</strong> {t("help.przy_kazdym_zawodniku_by_aktualizowac")}</Step>
            <Step n={4}>
              {t("help.po_osiagnieciu_pelnego_progu_serii")}{" "}<strong>{t("help.zakoncz_rozegrany_mecz")}</strong>{t("help.dla_bo3_poprawne_wyniki_to")}</Step>
            <Step n={5}>
              {t("help.jesli_zawodnik")}{" "}<strong>{t("help.nie_pojawil_sie")}</strong> {t("help.walkower_uzyj_przycisku")}{" "}<strong>{t("help.w_o")}</strong>
              {t("help.i_wybierz_zwyciezce_walkower_jest")}</Step>
            <Step n={6}>
              {t("help.mecze_mozesz")}{" "}<strong>{t("help.przelozyc")}</strong> {t("help.znikaja_z_kolejki_wroc_do")}{" "}<strong>{t("help.no_contest")}</strong> {t("help.w_formacie_ktory_pozwala_zakonczyc")}</Step>
            <Good>{t("help.wynik_mozna_cofnac_dopoki_nie")}</Good>
            <Tip>{t("help.po_zakonczeniu_wszystkich_meczow_rundy")}</Tip>
          </div>
        </Section>

        <Section icon={<Monitor className="w-5 h-5" />} title={t("help.3_widok_widzow_projektor")}>
          <div className="space-y-2">
            <Step n={1}>
              {t("help.przejdz_do")}{" "}<strong>{t("help.widok_widzow")}</strong> {t("help.link_audience_pelnoekranowy_widok_zaproj")}</Step>
            <Step n={2}>
              {t("help.widok_odswieza_sie_automatycznie_co")}</Step>
            <Step n={3}>
              {t("help.mozesz")}{" "}<strong>{t("help.wyroznic_konkretny_mecz")}</strong> {t("help.gwiazdka_w_panelu_prowadzacego_zeby")}</Step>
            <Step n={4}>
              {t("help.link_bracket_pokazuje_pelna_drabinke")}</Step>
            <Good>{t("help.widok_widzow_nie_ma_zadnych")}</Good>
          </div>
        </Section>

        <Section icon={<RotateCcw className="w-5 h-5" />} title={t("help.4_co_zrobic_przy_pomylce")}>
          <div className="space-y-2">
            <Step n={1}>
              <strong>{t("help.bledny_wynik")}</strong> {t("help.kliknij_2")}{" "}<em>{t("help.cofnij_wynik")}</em> {t("help.przy_zakonczonym_meczu_albo_uzyj")}{" "}<em>{t("help.cofnij")}</em> {t("help.w_gornym_pasku_mecz_wroci")}</Step>
            <Step n={2}>
              <strong>{t("help.cofniecie_dziala_tylko_o_1")}</strong> {t("help.jesli_popelniles_kilka_bledow_pod")}</Step>
            <Step n={3}>
              <strong>{t("help.cofnales_za_duzo")}</strong> {t("help.przejdz_do_zakladki")}{" "}<em>{t("help.log_akcji")}</em>{t("help.znajdz_wlasciwy_mecz_i_ponownie")}</Step>
            <Step n={4}>
              <strong>{t("help.cos_poszlo_bardzo_nie_tak")}</strong> {t("help.sprawdz_dostepny_backup_patrz_sekcja")}</Step>
            <Tip>
              {t("help.jesli_cofasz_wynik_i_zwyciezca")}</Tip>
          </div>
        </Section>

        <Section icon={<Download className="w-5 h-5" />} title={t("help.5_backup_i_przywracanie")}>
          <div className="space-y-2">
            <Step n={1}>
              {t("help.w_panelu_turnieju_wybierz")}{" "}<strong>{t("help.eksport_backupu")}</strong> {t("help.i_zachowaj_plik_json_eksport")}{" "}<strong>{t("help.import_v3_jest_wylaczony")}</strong>.
            </Step>
            <Step n={2}>
              {t("help.rob_backup")}{" "}<strong>{t("help.po_kazdej_rundzie")}</strong> {t("help.i_zawsze_przed_przerwa_lub")}</Step>
            <Step n={3}>
              <strong>{t("help.import_v2")}</strong> {t("help.wybierz")}{" "}<em>{t("help.import_backupu")}</em> {t("help.i_wczytaj_zgodny_plik_v2")}</Step>
            <Good>{t("help.chron_pliki_backupu_moga_zawierac")}</Good>
            <Tip>{t("help.po_imporcie_v2_sprawdz_aktualne")}</Tip>
          </div>
        </Section>

        <Section icon={<Swords className="w-5 h-5" />} title={t("help.6_szybki_start_turniej_deadlock")}>
          <div className="space-y-2">
            <p className="text-foreground/80">{t("help.sprawdzony_przepis_na_turniej_1v1")}</p>
            <div className="bg-muted/30 rounded-lg px-4 py-3 space-y-1.5 text-xs text-foreground/70">
              <div>{t("help.format")}{" "}<strong>{t("help.drabinka_eliminacyjna")}</strong></div>
              <div>{t("help.maks_graczy")}{" "}<strong>32</strong></div>
              <div>{t("help.domyslny_format_meczu")}{" "}<strong>{t("help.bo3")}</strong> {t("help.lub_bo1_dla_szybszego_turnieju")}</div>
              <div>{t("help.model_wyniku")}{" "}<strong>{t("help.series_v1")}</strong> {t("help.rezultat_oznacza_wygrane_gry_lub")}</div>
              <div>{t("help.losowanie_przez_import_csv_bez")}</div>
              <div>{t("help.backup_po_kazdej_rundzie")}</div>
            </div>
            <Step n={1}>
              {t("help.uzyj_przycisku")}{" "}<strong>{t("help.dane_testowe")}</strong> {t("help.na_dashboardzie_zeby_sprawdzic_aplikacje")}</Step>
            <Good>{t("help.przetestuj_pelny_przebieg_wyniki_cofniec")}</Good>
          </div>
        </Section>

        <Section icon={<Shield className="w-5 h-5" />} title={t("help.7_bezpieczenstwo_i_dostep_do")}>
          <div className="space-y-2">
            <Step n={1}>
              {t("help.w_nowych_turniejach_chron")}{" "}<strong>{t("help.haslo_organizatora")}</strong>{t("help.konta_lub_sesje_obslugi_przyznawaj")}</Step>
            <Step n={2}>
              {t("help.haslo_i_sesja_dostepu_to")}</Step>
            <Step n={3}>
              {t("help.widok_widzow_jest_przeznaczony_do")}</Step>
            <Tip>{t("help.nie_udostepniaj_hasel_organizatora_lub")}</Tip>
          </div>
        </Section>

        <div className="text-center pt-2 pb-6">
          <p className="text-xs text-muted-foreground">
            {t("help.tm_sys_pytania_zajrzyj_do")}</p>
        </div>
      </div>
    </Layout>
  );
}
