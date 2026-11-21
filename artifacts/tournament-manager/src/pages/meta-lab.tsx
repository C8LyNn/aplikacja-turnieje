import { t } from "@/i18n";
import { Sparkles } from "lucide-react";
import { EmptyProjectCard, ModuleHeader, ModuleShell } from "@/components/portfolio-ui";
import { ToolEmptyState, ToolPanel } from "@/components/tool-ui";

export default function MetaLabPage() {
  return (
    <ModuleShell>
      <ModuleHeader
        code="META"
        title={t("metaLab.meta_lab_teamcomp_builder")}
        description={t("metaLab.analiza_mety_i_eksperymentalne_narzedzia")}
        accent="rose"
        status="plan"
      />

      <div className="space-y-4">
        <ToolPanel
          title={t("metaLab.teamcomp_builder")}
          description={t("metaLab.pierwsze_wlasciwe_narzedzie_meta_lab")}
          actions={<Sparkles className="h-5 w-5 text-rose-400" />}
        >
          <ToolEmptyState
            title={t("metaLab.modul_jest_przygotowany_ale_jeszcze")}
            description={t("metaLab.docelowo_tutaj_pojawi_sie_wybor")}
          />
        </ToolPanel>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <EmptyProjectCard label={t("metaLab.kolejne_narzedzie")} />
          <EmptyProjectCard label={t("metaLab.kolejne_narzedzie")} />
          <EmptyProjectCard label={t("metaLab.kolejne_narzedzie")} />
        </div>
      </div>
    </ModuleShell>
  );
}
