import { t } from "@/i18n";
import { Database } from "lucide-react";
import {
  EmptyProjectCard,
  ModuleHeader,
  ModuleShell,
  ProjectCard,
} from "@/components/portfolio-ui";

export default function ResearchPage() {
  return (
    <ModuleShell>
      <ModuleHeader
        code="RES"
        title={t("research.projekty_badawcze")}
        description={t("research.bazy_zrodlowe_i_narzedzia_wspierajace")}
        accent="cyan"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ProjectCard
          code="RES 01"
          title={t("research.wenedowie")}
          description={t("research.projekt_badawczy_baza_danych_i")}
          href="/research/venedi"
          icon={Database}
          accent="cyan"
          status={t("research.aktywne")}
          actionLabel={t("research.otworz")}
        />
        {[1, 2, 3, 4].map((slot) => (
          <EmptyProjectCard key={slot} label={t("research.kolejny_projekt")} />
        ))}
      </div>
    </ModuleShell>
  );
}
