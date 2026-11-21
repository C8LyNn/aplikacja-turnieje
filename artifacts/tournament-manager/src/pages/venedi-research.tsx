import { t } from "@/i18n";
import { Database, Map } from "lucide-react";
import { ModuleHeader, ModuleShell, ProjectCard } from "@/components/portfolio-ui";

export default function VenediResearchPage() {
  return (
    <ModuleShell>
      <ModuleHeader
        code="RES 01"
        title={t("venediResearch.wenedowie")}
        description={t("venediResearch.materialy_i_narzedzia_projektu_badawczeg")}
        accent="cyan"
        backHref="/research"
        backLabel={t("venediResearch.projekty_badawcze")}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ProjectCard
          code="DATA"
          title={t("venediResearch.baza_danych")}
          description={t("venediResearch.istniejaca_baza_badawcza_w_google")}
          href="/research/venedi/database"
          icon={Database}
          accent="cyan"
          status={t("venediResearch.tylko_odczyt")}
          actionLabel={t("venediResearch.przegladaj")}
        />
        <ProjectCard
          code="MAP"
          title={t("venediResearch.wizualizacja_mapy")}
          description={t("venediResearch.miejsce_przygotowane_pod_pozniejsza_wizu")}
          href="/research/venedi/map"
          icon={Map}
          accent="cyan"
          status={t("venediResearch.puste")}
          actionLabel={t("venediResearch.otworz")}
        />
      </div>
    </ModuleShell>
  );
}
