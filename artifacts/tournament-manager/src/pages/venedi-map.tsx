import { t } from "@/i18n";
import { ModuleHeader, ModuleShell } from "@/components/portfolio-ui";
import { ToolEmptyState, ToolPanel } from "@/components/tool-ui";

export default function VenediMapPage() {
  return (
    <ModuleShell>
      <ModuleHeader
        code="RES 01 / MAP"
        title={t("venediMap.wenedowie_wizualizacja_mapy")}
        description={t("venediMap.przestrzen_pod_przyszla_wizualizacje_geo")}
        accent="cyan"
        backHref="/research/venedi"
        backLabel={t("venediMap.wenedowie")}
        status={t("venediMap.puste")}
      />

      <ToolPanel>
        <ToolEmptyState
          title={t("venediMap.mapa_nie_zostala_jeszcze_zbudowana")}
          description={t("venediMap.na_razie_ta_czesc_projektu")}
        />
      </ToolPanel>
    </ModuleShell>
  );
}
