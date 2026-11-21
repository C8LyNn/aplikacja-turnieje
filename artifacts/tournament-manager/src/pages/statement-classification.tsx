import { t } from "@/i18n";
import {
  BookOpen,
  FileText,
  FlaskConical,
  Map,
  Network,
  Users,
} from "lucide-react";
import { useLocation } from "wouter";
import {
  ModuleHeader,
  ModuleShell,
  ProjectCard,
} from "@/components/portfolio-ui";
import {
  ToolEmptyState,
  ToolNotice,
  ToolPanel,
  ToolSection,
} from "@/components/tool-ui";

const BASE = "/ludology/statement-classification";

type Section = "hub" | "overview" | "people" | "sources" | "coding" | "map" | "methodology";

function getSection(pathname: string): Section {
  const tail = pathname.slice(BASE.length).replace(/^\/+|\/+$/g, "");
  if (tail === "overview" || tail === "people" || tail === "sources" || tail === "coding" || tail === "map" || tail === "methodology") {
    return tail;
  }
  return "hub";
}

const cards = [
  {
    code: "START",
    get title() { return t("statementClassification.zalozenia"); },
    get description() { return t("statementClassification.co_projekt_bada_i_jak"); },
    href: `${BASE}/overview`,
    icon: Network,
  },
  {
    code: "PEOPLE",
    get title() { return t("statementClassification.osoby"); },
    get description() { return t("statementClassification.profile_publicznych_tworcow_i_influencer"); },
    href: `${BASE}/people`,
    icon: Users,
  },
  {
    code: "SRC",
    get title() { return t("statementClassification.zrodla"); },
    get description() { return t("statementClassification.materialy_zrodlowe_fragmenty_i_kontekst"); },
    href: `${BASE}/sources`,
    icon: FileText,
  },
  {
    code: "CODE",
    get title() { return t("statementClassification.kodowanie"); },
    get description() { return t("statementClassification.przypisywanie_fragmentow_do_tez_kodow"); },
    href: `${BASE}/coding`,
    icon: FlaskConical,
  },
  {
    code: "MAP",
    get title() { return t("statementClassification.mapa_stanowisk"); },
    get description() { return t("statementClassification.wizualizacja_wynikow_powstajaca_dopiero_"); },
    href: `${BASE}/map`,
    icon: Map,
  },
  {
    code: "METHOD",
    get title() { return t("statementClassification.metodologia"); },
    get description() { return t("statementClassification.codebook_reguly_interpretacji_audytowaln"); },
    href: `${BASE}/methodology`,
    icon: BookOpen,
  },
] as const;

function PageHeader({ section, title, description }: { section: string; title: string; description: string }) {
  return (
    <ModuleHeader
      code={`LUDO 02 / ${section}`}
      title={title}
      description={description}
      accent="amber"
      backHref={BASE}
      backLabel={t("statementClassification.kategoryzacja_wypowiedzi_i_pogladow")}
    />
  );
}

function Overview() {
  return (
    <>
      <PageHeader
        section="START"
        title={t("statementClassification.zalozenia_projektu")}
        description={t("statementClassification.analiza_publicznych_wypowiedzi_ma_prowad")}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <ToolPanel title={t("statementClassification.lancuch_badawczy")}>
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            {[t("statementClassification.osoba"), t("statementClassification.zrodlo"), t("statementClassification.fragment"), t("statementClassification.kodowanie")].map((item, index) => (
              <div key={item} className="flex items-center gap-2">
                {index > 0 && <span className="text-muted-foreground">→</span>}
                <span className="rounded-lg border border-border bg-background/60 px-3 py-2">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-sm text-muted-foreground">{t("statementClassification.tezy_propozycje_sa_osobnymi_obiektami")}</div>
        </ToolPanel>
        <ToolPanel title={t("statementClassification.najwazniejsza_zasada")}>
          <ToolNotice>{t("statementClassification.brak_danych_nie_oznacza_neutralnego")}</ToolNotice>
        </ToolPanel>
      </div>
    </>
  );
}

function People() {
  return (
    <>
      <PageHeader section="PEOPLE" title={t("statementClassification.osoby")} description={t("statementClassification.lista_analizowanych_osob_bedzie_tylko")} />
      <ToolPanel>
        <ToolEmptyState
          title={t("statementClassification.brak_osob_w_zbiorze")}
          description={t("statementClassification.na_tym_etapie_przygotowana_jest")}
        />
      </ToolPanel>
    </>
  );
}

function Sources() {
  return (
    <>
      <PageHeader section="SRC" title={t("statementClassification.zrodla")} description={t("statementClassification.kazdy_wniosek_ma_dac_sie")} />
      <ToolPanel>
        <ToolEmptyState
          title={t("statementClassification.brak_zrodel")}
          description={t("statementClassification.docelowo_rekord_zrodla_bedzie_przechowyw")}
        />
      </ToolPanel>
    </>
  );
}

function Coding() {
  return (
    <>
      <PageHeader section="CODE" title={t("statementClassification.kodowanie")} description={t("statementClassification.tutaj_fragmenty_zrodlowe_beda_zamieniane")} />
      <ToolPanel title={t("statementClassification.minimalny_rekord_kodowania")}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            [t("statementClassification.fragment"), t("statementClassification.dokladny_material_dowodowy")],
            ["Teza", t("statementClassification.do_czego_odnosi_sie_wypowiedz")],
            [t("statementClassification.kod"), t("statementClassification.znormalizowane_znaczenie_fragmentu")],
            [t("statementClassification.sila_dowodu"), t("statementClassification.bezposrednie_posrednie_wnioskowane")],
            [t("statementClassification.pewnosc"), t("statementClassification.jak_pewna_jest_interpretacja")],
            ["Notatka", t("statementClassification.kontekst_wyjatki_i_sprzecznosci")],
          ].map(([title, text]) => (
            <div key={title} className="rounded-xl border border-border bg-background/40 p-4">
              <div className="text-sm font-bold">{title}</div>
              <div className="mt-1 text-xs leading-5 text-muted-foreground">{text}</div>
            </div>
          ))}
        </div>
      </ToolPanel>
    </>
  );
}

function MapPage() {
  return (
    <>
      <PageHeader section="MAP" title={t("statementClassification.mapa_stanowisk")} description={t("statementClassification.mapa_bedzie_wizualizacja_wynikow_kodowan")} />
      <ToolPanel>
        <ToolEmptyState
          title={t("statementClassification.mapa_jest_jeszcze_pusta")}
          description={t("statementClassification.nie_ustalamy_jeszcze_osi_x")}
        />
      </ToolPanel>
    </>
  );
}

function Methodology() {
  return (
    <>
      <PageHeader section="METHOD" title={t("statementClassification.metodologia")} description={t("statementClassification.podstawa_ma_byc_analiza_tresci")} />
      <ToolPanel>
        <div className="space-y-5">
          <ToolSection title={t("statementClassification.codebook")} description={t("statementClassification.wersjonowane_definicje_kodow_reguly_przy")} >
            <ToolNotice>{t("statementClassification.zmiana_definicji_kodu_powinna_byc")}</ToolNotice>
          </ToolSection>
          <ToolSection title={t("statementClassification.niezalezne_kodowanie")} description={t("statementClassification.docelowo_ten_sam_material_moze")}>
            <div className="text-sm text-muted-foreground">{t("statementClassification.pozwoli_to_mierzyc_zgodnosc_miedzy")}</div>
          </ToolSection>
          <ToolSection title={t("statementClassification.ai")} description={t("statementClassification.automatyzacja_moze_pomagac_w_wyszukiwani")}>
            <ToolNotice>{t("statementClassification.ai_pozostaje_narzedziem_pomocniczym_nie")}</ToolNotice>
          </ToolSection>
        </div>
      </ToolPanel>
    </>
  );
}

export default function StatementClassificationPage() {
  const [location] = useLocation();
  const section = getSection(location);

  if (section !== "hub") {
    return (
      <ModuleShell>
        {section === "overview" && <Overview />}
        {section === "people" && <People />}
        {section === "sources" && <Sources />}
        {section === "coding" && <Coding />}
        {section === "map" && <MapPage />}
        {section === "methodology" && <Methodology />}
      </ModuleShell>
    );
  }

  return (
    <ModuleShell>
      <ModuleHeader
        code="LUDO 02"
        title={t("statementClassification.kategoryzacja_wypowiedzi_i_pogladow")}
        description={t("statementClassification.zrodlowa_analiza_publicznych_stanowisk_t")}
        accent="amber"
        backHref="/ludology"
        backLabel={t("statementClassification.ludologia")}
        status="fundament"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <ProjectCard key={card.href} {...card} accent="amber" actionLabel={t("statementClassification.otworz")} />
        ))}
      </div>
    </ModuleShell>
  );
}
