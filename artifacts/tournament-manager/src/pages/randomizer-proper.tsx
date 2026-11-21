import { t } from "@/i18n";
import { ModuleHeader, ModuleShell } from "@/components/portfolio-ui";
import { ToolPanel } from "@/components/tool-ui";
import { DrawLabExtracted } from "@/features/randomizers/draw-lab/DrawLabExtracted";

export default function RandomizerProperPage() {
  return (
    <ModuleShell wide>
      <ModuleHeader
        code="DRAW 01"
        title={t("randomizerProper.losowanie_kart")}
        description={t("randomizerProper.zintegrowane_wlasciwe_losowanie")}
        accent="primary"
        backHref="/randomizers"
        backLabel={t("randomizerProper.losowania")}
        status={t("randomizerProper.aktywne")}
      />
      <ToolPanel title={t("randomizerProper.losowanie")} description={t("randomizerProper.sam_silnik_pozostaje_bez_zmian")} flush>
        <DrawLabExtracted />
      </ToolPanel>
    </ModuleShell>
  );
}
